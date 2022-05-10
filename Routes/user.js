const express = require("express");
const router = express.Router();

const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const User = require("../Models/User");

const cloudinary = require("cloudinary").v2;

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

module.exports = router;
