import { MongoClient, ServerApiVersion } from "mongodb";

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export async function connectDB() {
  await client.connect();

  const db = client.db("goDeliverDB");

  return {
    parcelsCollection: db.collection("parcels"),
    paymentCollection: db.collection("paymentHistory"),
    userCollection: db.collection("user"),
    riderCollection: db.collection("rider"),
  };
}
