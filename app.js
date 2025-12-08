import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import riderRoutes from "./routes/rider.routes.js";
import parcelRoutes from "./routes/parcels.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import userRoutes from "./routes/user.routes.js";
import trackingSlides from "./routes/trackingSlides.routes.js";
import "./utils/firebase.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/parcels", parcelRoutes);
app.use("/payments", paymentRoutes);
app.use("/users", userRoutes);
app.use("/rider", riderRoutes);
app.use("/trackingSlides", trackingSlides);

app.get("/", (req, res) => {
  res.send("Hello World! Go deliver is running");
});

export default app;
