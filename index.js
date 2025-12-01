import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import Stripe from "stripe";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";

dotenv.config();

//! Load JSON without using assert/with
const __dirname = path.resolve();
const serviceAccountPath = path.join(__dirname, "go-deliver-adminsd.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

const stripe = new Stripe(process.env.STRIPE_SECRET);

const app = express();
const port = process.env.PORT || 5000;

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// ! middle ware
app.use(express.json());
app.use(cors());
dotenv.config();

//!  firebase accessToken verify
const verifyFBToken = async (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).send({ message: "unauthorize access" });
  }

  try {
    const idToken = token.split(" ")[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log("decoded in the token:", decoded);
    req.decoded_email = decoded.email;

    next();
  } catch (error) {
    return res.status(401).send("unauthorize access");
  }
};

//! generate a tracking id
function generateTrackingId() {
  const prefix = "TRK";
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();

  return `${prefix}-${date}-${random}`;
}

const uri = process.env.DB_URI;

//! Create a MongoClient with a MongoClientOptions object to set the Stable API version

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server
    await client.connect();

    // create data base and collection
    const db = client.db("goDeliverDB");
    const parcelsCollection = db.collection("parcels");
    const paymentCollection = db.collection("paymentHistory");
    const userCollection = db.collection("user");

    //! all get parcels by email
    app.get("/parcels", async (req, res) => {
      const query = {};
      const { email } = req.query;

      if (email) {
        query.senderEmail = email;
      }
      const options = { sort: { createAt: -1 } };

      const cursor = parcelsCollection.find(query, options);
      const result = await cursor.toArray();
      res.json(result);
    });

    //!  get parcel by id
    app.get("/parcel/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await parcelsCollection.findOne(query);
      res.send(result);
    });

    //! post parcel
    app.post("/parcels", async (req, res) => {
      const parcel = req.body;

      // parcel create time
      parcel.createAt = new Date();

      const result = await parcelsCollection.insertOne(parcel);
      res.json(result);
    });

    app.delete("/parcel/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await parcelsCollection.deleteOne(query);
      res.send(result);
    });

    //! payment related apis

    app.post("/create-checkout-session", async (req, res) => {
      const paymentInfo = req.body;

      console.log("payment info check", paymentInfo);

      const amount = parseInt(paymentInfo.cost) * 100;

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            // Provide the exact Price ID (for example, price_1234) of the product you want to sell
            price_data: {
              currency: "USD",
              unit_amount: amount,
              product_data: {
                name: paymentInfo.parcelName,
              },
            },
            quantity: 1,
          },
        ],
        customer_email: paymentInfo.senderEmail,
        mode: "payment",
        metadata: {
          parcelId: paymentInfo.parcelId,
          parcelName: paymentInfo.parcelName,
        },
        success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancel`,
      });

      res.send({ url: session.url });
    });

    app.patch("/payment-success", async (req, res) => {
      const sessionId = req.query.session_id;

      const session = await stripe.checkout.sessions.retrieve(sessionId);

      // console.log("session retrieve", session);

      const transactionId = session.payment_intent;
      const query = { transactionId: transactionId };

      const paymentExist = await paymentCollection.findOne(query);
      if (paymentExist) {
        return res.send({ message: "Already Exist", transactionId });
      }

      const parcelTrackingId = generateTrackingId();

      if (session.payment_status === "paid") {
        const id = session.metadata.parcelId;

        const query = { _id: new ObjectId(id) };
        const update = {
          $set: {
            paymentStatus: "paid",
            trackingId: parcelTrackingId,
          },
        };

        const result = await parcelsCollection.updateOne(query, update);
        const paymentHistory = {
          amount: session.amount_subtotal / 100,
          currency: session.currency,
          customerEmail: session.customer_email,
          parcelId: session.metadata.parcelId,
          parcelName: session.metadata.parcelName,
          transactionId: session.payment_intent,
          paymentStatus: session.payment_status,
          paidAt: new Date(),
          parcelTrackingId: parcelTrackingId,
        };

        if (session.payment_status === "paid") {
          const paymentResult = await paymentCollection.insertOne(
            paymentHistory
          );

          res.send({
            success: true,
            modifyParcel: result,
            paymentHistory: paymentHistory,
            trackingId: parcelTrackingId,
            transactionId: session.payment_intent,
          });
        }
      }

      res.send({ success: false });
    });

    //! get all payment

    app.get("/payments", verifyFBToken, async (req, res) => {
      const { email } = req.query;

      const query = {};
      if (email) {
        query.customerEmail = email;

        //! check email address
        if (email !== req.decoded_email) {
          return res.status(403).send({ message: "Forbidden access" });
        }
      }
      const cursor = await paymentCollection
        .find(query)
        .sort({ paidAt: -1 })
        .toArray();
      res.send(cursor);
    });

    //! User related apis
    app.post("/users", async (req, res) => {
      const user = req.body;
      user.role = "user";
      user.createAt = new Date();
      const email = user.email;

      const userExist = await userCollection.findOne({ email });

      if (userExist) {
        return res.send({ message: "user Exist" });
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World! Go deliver is running");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
