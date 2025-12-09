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

//! const get user  to database
export const getRiders = async (req, res) => {
  try {
    const { riderCollection } = await connectDB();
    const { status, district, workStatus } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    if (district) {
      query.district = district;
    }
    if (workStatus) {
      query.workStatus = workStatus;
    }

    const result = await riderCollection
      .find(query)
      .sort({ _id: -1 })
      .toArray();

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
    const status = req.body.riderStatus;

    const query = { _id: new ObjectId(id) };
    const updatedDoc = {
      $set: {
        status: status,
        workStatus: "Available",
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
