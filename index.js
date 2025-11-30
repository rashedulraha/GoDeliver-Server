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

    app.post("create-checkout-session", async (req, res) => {
      const paymentInfo = req.body;

      const session = await stripe.checkout.session({
        line_items: [
          {
            // Provide the exact Price ID (for example, price_1234) of the product you want to sell
            price: "{{PRICE_ID}}",
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${process.env.SITE_DOMAIN}?/dashboard/payment-success`,
      });
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
