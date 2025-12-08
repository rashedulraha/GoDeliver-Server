import express from "express";
import {
  addRider,
  getRiders,
  patchRider,
} from "../controllers/rider.controller.js";

const router = express.Router();

router.post("/", addRider);
router.get("/", getRiders);
router.patch("/:id", patchRider);

export default router;
