import express from "express";
import {
  createUser,
  getUser,
  patchUser,
} from "../controllers/user.controller.js";
import { verifyFBToken } from "../utils/verifyFBToken.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", verifyFBToken, getUser);
router.patch("/:id", verifyFBToken, patchUser);

export default router;
