import { ObjectId } from "mongodb";
import { connectDB } from "../db/connect.js";

//  ! user create and post

export const createUser = async (req, res) => {
  try {
    const { userCollection } = await connectDB();

    const user = req.body;
    user.role = "user";
    user.createAt = new Date();

    const exist = await userCollection.findOne({ email: user.email });

    if (exist) return res.send({ message: "user Exist" });

    const result = await userCollection.insertOne(user);
    res.send(result);
  } catch (error) {
    res.status(401).send({ message: error.message });
  }
};

//!  user get  data base
export const getUser = async (req, res) => {
  try {
    const { userCollection } = await connectDB();
    const result = await userCollection.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(401).send({ message: error.message });
  }
};

//!  get user by email and  id
export const getUserByEmailId = async (req, res) => {
  try {
    const { userCollection } = await connectDB();
    const email = req.params.email;
    const query = { email };
    const user = await userCollection.findOne(query);
    res.send({ role: user?.role || "user" });
  } catch (error) {
    res.status(403).send({ message: "forbidden" });
  }
};

//!   user update
export const patchUser = async (req, res) => {
  try {
    const { userCollection } = await connectDB();
    const { id } = req.params;
    const roleInfo = req.body;
    const query = { _id: new ObjectId(id) };
    const updatedDoc = {
      $set: {
        role: roleInfo.role,
      },
    };

    const result = await userCollection.updateOne(query, updatedDoc);
    res.send(result);
  } catch (error) {
    res.status(401).send({ message: "update not complete" });
  }
};
