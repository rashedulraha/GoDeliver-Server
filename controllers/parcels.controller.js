import { connectDB } from "../db/connect.js";
import { ObjectId } from "mongodb";

export const getParcels = async (req, res) => {
  const { parcelsCollection } = await connectDB();
  const query = {};
  const { email } = req.query;

  if (email) query.senderEmail = email;

  const result = await parcelsCollection
    .find(query, { sort: { createAt: -1 } })
    .toArray();

  res.json(result);
};

export const getParcelById = async (req, res) => {
  const { parcelsCollection } = await connectDB();

  const result = await parcelsCollection.findOne({
    _id: new ObjectId(req.params.id),
  });

  res.send(result);
};

export const createParcel = async (req, res) => {
  const { parcelsCollection } = await connectDB();

  const parcel = req.body;
  parcel.createAt = new Date();

  const result = await parcelsCollection.insertOne(parcel);
  res.json(result);
};

export const deleteParcel = async (req, res) => {
  const { parcelsCollection } = await connectDB();

  const result = await parcelsCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });

  res.send(result);
};
