import express from "express";
import {
  getParcels,
  getParcelById,
  createParcel,
  deleteParcel,
} from "../controllers/parcels.controller.js";
import { verifyFBToken } from "../utils/verifyFBToken.js";

const router = express.Router();

router.get("/", verifyFBToken, getParcels);
router.get("/:id", verifyFBToken, getParcelById);
router.post("/", verifyFBToken, createParcel);
router.delete("/:id", verifyFBToken, deleteParcel);

export default router;
