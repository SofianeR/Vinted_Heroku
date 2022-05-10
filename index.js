require("dotenv").config();

const express = require("express");
const formidableMiddleware = require("express-formidable");
const cors = require("cors");

const mongoose = require("mongoose");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const app = express();
app.use(formidableMiddleware());
app.use(cors());

mongoose.connect(process.env.MONGODB_URI);

const userRoutes = require("./Routes/user");
app.use(userRoutes);

const offerRoutes = require("./Routes/offer");
app.use(offerRoutes);

const paymentRoutes = require("./Routes/payment");
app.use(paymentRoutes);

app.get("*", (req, res) => {
  res.json("Page introuvable");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server launched ! 🚀");
});
