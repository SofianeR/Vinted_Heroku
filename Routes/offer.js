const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const User = require("../Models/User");
const Offer = require("../Models/Offer");

const cloudinary = require("cloudinary").v2;

const isLogged = require("../middlewares/Logged");

router.post("/user/signup", async (req, res) => {
  try {
    if (
      !req.fields.email ||
      !req.fields.username < 4 ||
      !req.fields.password < 5
    ) {
      const emailCheck = await User.findOne({ email: req.fields.email });
      if (!emailCheck) {
        const salt = uid2(32);
        const hash = SHA256(req.fields.password + salt).toString(encBase64);
        const token = uid2(32);

        const pictureToUpload = req.files.avatar.path;
        const result = await cloudinary.uploader.upload(pictureToUpload);

        const newUser = new User({
          email: req.fields.email.toLowerCase(),
          account: {
            username: req.fields.username,
            avatar: {
              secure_url: result.secure_url,
            },
          },
          newsletter: req.fields.newsletter,
          token: token,
          hash: hash,
          salt: salt,
        });

        await newUser.save();

        res.json(newUser);
      } else {
        res.status(400).json({ message: "un compte utilise deja cet email" });
      }
    } else {
      res.status(400).json({
        message:
          "Vous devez renseigner un username de plus de 4 caracteres && un mail valide && un password de plus de 4 caracteres",
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const isUser = await User.findOne({
      email: req.fields.email.toLowerCase(),
    });

    if (isUser) {
      const hashToCheck = SHA256(req.fields.password + isUser.salt).toString(
        encBase64
      );
      if (hashToCheck === isUser.hash) {
        return res.json({
          _id: isUser._id,
          token: isUser.token,
          account: { username: isUser.account.username },
        });
      } else {
        return res.status(400).json({ message: "erreur connexion" });
      }
    } else {
      return res.status(400).json({ message: "erreur connexion" });
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

router.post("/offer/post", isLogged, async (req, res) => {
  try {
    if (req.fields.title && req.fields.price) {
      const user = req.user;

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

      const pictureToUpload = req.files.picture.path;
      const resultUpload = await cloudinary.uploader.upload(pictureToUpload, {
        folder: `/vinted-react/offers/`,
        public_id: `${req.fields.title} - ${newOffer._id} - ${user._id}`,
      });

      newOffer.product_image = { picture: resultUpload };

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

    const Offers = await Offer.find(filter)
      .sort(pagination.sort)
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate("owner", "-hash -token -salt -newsletter -email -__v");

    const count = await Offer.countDocuments(filter);

    res.json({ count: count, offers: Offers });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
