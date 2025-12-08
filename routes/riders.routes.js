import express from "express";
import getRiders from "../controllers/riders.controller.js";

const router = express.Router();

router.get("/", getRiders);

export default router;
