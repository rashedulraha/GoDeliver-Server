import express from "express";

import { trackingSlides } from "../controllers/trackingSlides.controller.js";

const router = express.Router();

router.get("/", trackingSlides);

export default router;
