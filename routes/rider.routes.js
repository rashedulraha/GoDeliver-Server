import express from "express";
import { addRider } from "../controllers/rider.controller.js";

const router = express.Router();

router.post("/", addRider);

export default router;
