import { connectDB } from "../db/connect.js";

export const trackingSlides = async (req, res) => {
  try {
    const { trackingSlidesCollection } = await connectDB();

    const result = await trackingSlidesCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
