import express from "express";
import {
  createUser,
  getUser,
  getUserByEmailId,
  patchUser,
} from "../controllers/user.controller.js";
import { verifyFBToken } from "../utils/verifyFBToken.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", verifyFBToken, getUser);
router.get("/:email/role", getUserByEmailId);
router.patch("/:id", verifyFBToken, patchUser);

export default router;
