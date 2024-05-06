const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const md5 = require("md5");
const fetchValidUser = require("../middleware/fetchvaliduser");
// import dotenv pack
require("dotenv").config();
const jwt_string = process.env.JWT_SECRET;
const { client } = require("../../mongoConnect");
const { ObjectId } = require("mongodb");

let adminCollection = client.db("harun_cycle_db").collection("admin_users");

//ROUTE 1-Mongo: Log in using POST (/auth/login).
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let success = true;
  try {
    let cursor = await adminCollection.findOne({ email: email });
    if (cursor) {
      let pass = md5(password);
      if (cursor.password === pass) {
        let user = {
          id: cursor._id,
          username: cursor.username,
          email: cursor.email,
        };
        let data = { user };
        let authToken = jwt.sign(data, jwt_string);
        res.json({ success, message: "Login approved", user, authToken });
      } else {
        success = false;
        return res.json({ success, message: "Login denied" });
      }
    } else {
      success = false;
      return res.json({
        success,
        message: "please try again with correct credentials",
      });
    }
  } catch (error) {
    return res.status(500).send("Internal server error");
  }
});
//ROUTE 2: Log in using POST (/auth/userDecp).
router.post("/userDecp", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    res.status(401).send({ error: "Invalid credentials" });
    return;
  }
  try {
    const data = jwt.verify(token, jwt_string);
    res.send(data.user);
  } catch (error) {
    res.status(401).send({ error: "Invalid credentials" });
  }
});
//ROUTE 2-mongo: password update
router.post("/updatepass", fetchValidUser, async (req, res) => {
  const id = req.user.id;
  const pass = md5(req.body.password);
  try {
    let query = { _id: new ObjectId(id) };
    let update = { $set: { password: pass } };
    let updateResult = await adminCollection.updateOne(query, update);
    res.json({
      success: true,
      msg: "Password updated",
      upResult: updateResult,
    });
  } catch (error) {
    res.status(401).send({ success: false, error: "Invalid credentials" });
  }
});

module.exports = router;
