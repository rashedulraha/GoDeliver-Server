import { connectDB } from "../db/connect.js";

export const addRider = async (req, res) => {
  try {
    const { riderCollection } = await connectDB();

    const { fastName, lastName, email, phoneNumber } = req.body;

    if (!fastName || !lastName || !email || !phoneNumber) {
      return res.status(400).json({ error: "Required fields missing" });
    }

    const result = await riderCollection.insertOne(req.body);
    res.json({ success: true, insertedId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
