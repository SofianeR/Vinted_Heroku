const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const User = require("../Models/User");
const Offer = require("../Models/Offer");

const cloudinary = require("cloudinary").v2;

const isLogged = require("../middlewares/Logged");

router.post("/offer/post", isLogged, async (req, res) => {
  try {
    if (req.fields.title && req.fields.price) {
      const user = req.user;

      const pictureToUpload = req.files.picture.path;
      console.log(pictureToUpload);
      const resultUpload = await cloudinary.uploader.upload(pictureToUpload);

      const newOffer = new Offer({
        product_name: req.fields.title,
        product_descritpion: req.fields.description,
        product_price: req.fields.price,
        product_details: [
          { MARQUE: req.fields.brand },
          { TAILLE: req.fields.size },
          { ETAT: req.fields.condition },
          { COULEUR: req.fields.color },
          { EMPLACEMENT: req.fields.city },
        ],
        owner: user,
      });

      newOffer.product_image = resultUpload;
      console.log("there");

      await newOffer.save();

      res.json(newOffer);
    } else {
      res
        .status(400)
        .json({ message: "Vous devez au mois renseigner un titre et un prix" });
    }
  } catch (error) {
    return res.status(400).json({ message: "Bad request" });
  }
});

router.get("/offers", async (req, res) => {
  try {
    const filter = {};
    const pagination = {};

    req.query.title ? (filter.product_name = req.query.title) : null;

    req.query.priceMin
      ? (filter.product_price = { $gte: req.query.priceMin })
      : null;

    if (req.query.priceMax) {
      if (filter.product_price) {
        filter.product_price.$lte = req.query.priceMax;
      } else {
        filter.product_price = { $lte: req.query.priceMax };
      }
    }

    req.query.brand
      ? (filter.product_details = { $elemMatch: { MARQUE: req.query.brand } })
      : null;

    req.query.page
      ? (pagination.page = parseInt(req.query.page))
      : (pagination.page = 1);

    req.query.sort
      ? (pagination.sort = req.query.sort.replace("price-", ""))
      : (pagination.sort = "asc");

    req.query.limit
      ? (pagination.limit = req.query.limit)
      : (pagination.limit = 25);

    pagination.skip = (pagination.page - 1) * pagination.limit;
    console.log(pagination.sort);
    const Offers = await Offer.find(filter)
      .sort({ product_price: pagination.sort })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate("owner", "-hash -token -salt -newsletter -email -__v");

    const count = await Offer.countDocuments(filter);

    res.json({ count: count, offers: Offers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    const offerToDisplay = await Offer.findById(req.params.id).populate({
      path: "owner",
      select: "-_id",
    });
    res.json(offerToDisplay);
  } catch (error) {
    res.status(400).json({ error: { message: error.message } });
  }
});

module.exports = router;
