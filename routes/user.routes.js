import express from "express";
import { createUser, getUser } from "../controllers/user.controller.js";
import { verifyFBToken } from "../utils/verifyFBToken.js";

const router = express.Router();

router.post("/", createUser);
router.get("/", verifyFBToken, getUser);

export default router;
