import { connectDB } from "../db/connect.js";

export const createUser = async (req, res) => {
  const { userCollection } = await connectDB();

  const user = req.body;
  user.role = "user";
  user.createAt = new Date();

  const exist = await userCollection.findOne({ email: user.email });

  if (exist) return res.send({ message: "user Exist" });

  const result = await userCollection.insertOne(user);
  res.send(result);
};
