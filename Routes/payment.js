require("dotenv").config();

const express = require("express");
const router = express.Router();

const stripe = require("stripe")(process.env.STRIPE_KEY);

const isLogged = require("../middlewares/Logged");

router.post("/pay", async (req, res) => {
  // console.log("route pay");
  try {
    const stripeToken = req.fields.stripeToken;
    const response = await stripe.charges.create({
      amount: 2000,
      currency: "eur",
      description: "Description objet acheté",
      source: stripeToken,
    });
    res.json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
