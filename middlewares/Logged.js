const User = require("../Models/User");

const isLogged = async (req, res, next) => {
  if (req.headers.authorization) {
    const BearerToken = req.headers.authorization.replace("Bearer ", "");
    const fetchUser = await User.findOne({ token: BearerToken });
    if (fetchUser) {
      req.user = fetchUser;
      return next();
    } else {
      res.status(400).json({ message: "Unauthorized" });
    }
  } else {
    res.status(400).json({ message: "Unauthorized" });
  }
};
module.exports = isLogged;
