import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { MongoClient, ObjectId, ServerApiVersion } from "mongodb";
import Stripe from "stripe";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET);

const app = express();
const port = process.env.PORT || 5000;

// ! middle ware
app.use(express.json());
app.use(cors());
dotenv.config();

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // create data base and collection
    const db = client.db("goDeliverDB");
    const parcelsCollection = db.collection("parcels");
    const paymentCollection = db.collection("paymentHistory");

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

      console.log("session retrieve", session);

      if (session.payment_status === "paid") {
        const id = session.metadata.parcelId;

        const query = { _id: new ObjectId(id) };
        const update = {
          $set: {
            paymentStatus: "paid",
            trackingId: generateTrackingId(),
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
        };

        if (session.payment_status === "paid") {
          const paymentResult = await paymentCollection.insertOne(
            paymentHistory
          );

          res.send({
            success: true,
            modifyParcel: result,
            paymentHistory: paymentHistory,
          });
        }
      }

      res.send({ success: false });
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
