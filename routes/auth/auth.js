const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const md5 = require("md5");
const fetchValidUser = require("../middleware/fetchvaliduser");
// import dotenv pack
require("dotenv").config();
const jwt_string = process.env.JWT_SECRET;
const knex = require("../../dbcon");

//ROUTE 1: Log in using POST (/auth/login).
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let success = true;
  try {
    knex("admin")
      .where("email", email)
      .select("*")
      .then((result) => {
        if (result.length > 0) {
          let pass = md5(password);
          if (pass === result[0].password) {
            let user = {
              id: result[0].id,
              username: result[0].username,
              email: result[0].email,
            };
            let data = { user };
            let authToken = jwt.sign(data, jwt_string);
            res.json({ success, message: "Login approved", user, authToken });
          } else {
            success = false;
            res.json({ success, message: "Login denied" });
          }
        } else {
          success = false;
          res.json({
            success,
            message: "please try again with correct credentials",
          });
        }
      });
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});
//ROUTE 2: Log in using POST (/auth/userDecp).
router.post("/userDecp", async (req, res) => {
  const { token } = req.body;
  // let success = true;
  if (!token) {
    res.status(401).send({ error: "Invalid credentials" });
    return;
  }
  try {
    const data = jwt.verify(token, jwt_string);
    // req.user = data.user;
    // console.log(data);
    res.send(data.user);
  } catch (error) {
    res.status(401).send({ error: "Invalid credentials" });
  }
});
//ROUTE 2: Log in using POST (/auth/userDecp).
router.post("/updatepass", fetchValidUser, async (req, res) => {
  const { username, password } = req.body;
  // let success = true;
  console.log({ username, password });
  try {
    const passUpdate = knex("admin")
      .where("username", username)
      .update({ password: md5(password) }, ["uid"]);
    passUpdate.then((data) => {
      res.json({ success: true, msg: "Password updated", data });
    });
    // res.send(data.user);
  } catch (error) {
    res.status(401).send({ success: false, error: "Invalid credentials" });
  }
});

module.exports = router;
