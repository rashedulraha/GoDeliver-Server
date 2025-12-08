import express from "express";
import { createUser } from "../controllers/user.controller.js";
import { verifyFBToken } from "../utils/verifyFBToken.js";

const router = express.Router();

router.post("/", verifyFBToken, createUser);

export default router;
