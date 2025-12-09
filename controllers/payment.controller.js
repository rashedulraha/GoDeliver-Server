import { connectDB } from "../db/connect.js";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import { generateTrackingId } from "../utils/trackingId.js";

const stripe = new Stripe(process.env.STRIPE_SECRET);

export const createCheckout = async (req, res) => {
  const paymentInfo = req.body;

  const amount = parseInt(paymentInfo.cost) * 100;

  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "USD",
          unit_amount: amount,
          product_data: {
            name: paymentInfo.parcelName,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: paymentInfo.senderEmail,
    mode: "payment",
    metadata: {
      parcelId: paymentInfo.parcelId,
      parcelName: paymentInfo.parcelName,
    },
    success_url: `${process.env.SITE_DOMAIN}/dashboard/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.SITE_DOMAIN}/dashboard/payment-cancel`,
  });

  res.send({ url: session.url });
};

export const handlePaymentSuccess = async (req, res) => {
  const { paymentCollection, parcelsCollection } = await connectDB();

  const sessionId = req.query.session_id;
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const transactionId = session.payment_intent;
  const paymentExist = await paymentCollection.findOne({ transactionId });

  if (paymentExist) {
    return res.send({ message: "Already Exist", transactionId });
  }

  const trackingId = generateTrackingId();

  if (session.payment_status === "paid") {
    const id = session.metadata.parcelId;
    const createAt = new Date();

    await parcelsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          paymentStatus: "paid",
          deliveryStatus: "pending-pickup",
          trackingId: trackingId,
          createAt: createAt,
        },
      }
    );

    const paymentHistory = {
      amount: session.amount_subtotal / 100,
      currency: session.currency,
      customerEmail: session.customer_email,
      parcelId: id,
      parcelName: session.metadata.parcelName,
      transactionId,
      paymentStatus: session.payment_status,
      paidAt: new Date(),
      parcelTrackingId: trackingId,
    };

    await paymentCollection.insertOne(paymentHistory);

    res.send({
      success: true,
      paymentHistory,
      trackingId,
      transactionId,
    });
  } else {
    res.send({ success: false });
  }
};

export const getAllPayments = async (req, res) => {
  const { paymentCollection } = await connectDB();

  const { email } = req.query;

  const query = {};
  if (email) {
    if (email !== req.decoded_email) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    query.customerEmail = email;
  }

  const result = await paymentCollection
    .find(query)
    .sort({ paidAt: -1 })
    .toArray();

  res.send(result);
};
