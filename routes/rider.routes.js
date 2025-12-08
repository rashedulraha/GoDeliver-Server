import express from "express";
import {
  addRider,
  getRiders,
  patchRider,
} from "../controllers/rider.controller.js";
import { verifyFBToken } from "../utils/verifyFBToken.js";

const router = express.Router();

router.post("/", verifyFBToken, addRider);
router.get("/", verifyFBToken, getRiders);
router.patch("/:id", verifyFBToken, patchRider);

export default router;
