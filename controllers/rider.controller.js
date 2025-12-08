import { ObjectId } from "mongodb";
import { connectDB } from "../db/connect.js";

//!   create  rider
export const addRider = async (req, res) => {
  try {
    const { riderCollection } = await connectDB();
    const rider = req.body;
    rider.status = "pending";
    rider.createAT = new Date();

    const { fastName, lastName, email, phoneNumber } = rider;

    if (!fastName || !lastName || !email || !phoneNumber) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const result = await riderCollection.insertOne(rider);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//! get rider
export const getRiders = async (req, res) => {
  try {
    const { riderCollection } = await connectDB();

    const result = await riderCollection.find().sort({ _id: -1 }).toArray();

    res.send(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// !patch rider

export const patchRider = async (req, res) => {
  try {
    const { riderCollection } = await connectDB();
    const { id } = req.params;
    const status = req.body.status;

    const query = { _id: new ObjectId(id) };
    const updatedDoc = {
      $set: {
        status: status,
      },
    };

    const result = await riderCollection.updateOne(query, updatedDoc);
    if (status === "approve") {
      const { userCollection } = await connectDB();
      const email = req.body.email;
      const userQuery = { email };
      const updateUser = {
        $set: {
          role: "rider",
        },
      };

      const userResult = await userCollection.updateOne(userQuery, updateUser);
    }
    res.send(result);
  } catch {
    res.status(500).json({ error: error.message });
  }
};
