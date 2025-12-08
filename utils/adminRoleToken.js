import { connectDB } from "../db/connect";

const adminRoleToken = async (req, res, next) => {
  try {
    const email = req.decoded_email;
    const query = { email };

    const { userCollection } = await connectDB();
    const user = userCollection.find(query);

    if (!user || user.role !== "admin") {
      return res.status(403).send({ message: "forbidden" });
    }

    next();
  } catch (error) {
    res.status(403).send({ message: "forbidden" });
  }
};
