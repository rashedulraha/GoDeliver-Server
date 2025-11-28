import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongodb, { MongoClient, ObjectId, ServerApiVersion } from "mongodb";

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

    // parcels api
    app.get("/parcels", async (req, res) => {});
    app.post("/parcels", async (req, res) => {
      const parcel = req.body;
      const result = await parcelsCollection.insertOne(parcel);
      res.json(result);
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
