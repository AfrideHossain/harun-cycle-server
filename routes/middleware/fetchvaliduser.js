const jwt = require("jsonwebtoken");
require("dotenv").config()
const jwt_string = process.env.JWT_SECRET;

const fetchValidUser = (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ error: "Invalid credentials" });
  }
  try {
    const data = jwt.verify(token, jwt_string);
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).send({ error: "Invalid credentials" });
  }
};

module.exports = fetchValidUser;
