require("dotenv").config();
const cloudinary = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

const test = async () => {
  try {
    const result = await cloudinary.v2.uploader.upload(
      "https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg"
    );
    console.log(result);
  } catch (error) {
    console.log(error);
  }
};
test();
