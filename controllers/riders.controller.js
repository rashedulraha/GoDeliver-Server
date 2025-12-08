import { connectDB } from "../db/connect.js";

const getRiders = async (req, res) => {
  try {
    const { riderCollection } = await connectDB();
    const result = await riderCollection.find().toArray();
    res.send(result);
  } catch {
    res.status(500).json({ error: error.message });
  }
};

export default getRiders;
