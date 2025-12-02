import express from "express";
import {
  createCheckout,
  handlePaymentSuccess,
  getAllPayments,
} from "../controllers/payment.controller.js";
import { verifyFBToken } from "../utils/verifyFBToken.js";

const router = express.Router();

router.post("/create-checkout-session", createCheckout);
router.patch("/payment-success", handlePaymentSuccess);
router.get("/", verifyFBToken, getAllPayments);

export default router;
