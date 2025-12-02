import express from "express";
import {
  getParcels,
  getParcelById,
  createParcel,
  deleteParcel,
} from "../controllers/parcels.controller.js";

const router = express.Router();

router.get("/", getParcels);
router.get("/:id", getParcelById);
router.post("/", createParcel);
router.delete("/:id", deleteParcel);

export default router;
