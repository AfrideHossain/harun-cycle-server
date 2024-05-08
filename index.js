const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { connectMongo } = require("./mongoConnect");

connectMongo();
// cors and json used here
const corsConfig = {
  origin: "*",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};
app.use(cors(corsConfig));
app.options("", cors(corsConfig));

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Stock Management System(HarunCycle) v1.3.1");
});
app.use("/auth", require("./routes/auth/auth"));
app.use("/manage", require("./routes/manage/manage"));
app.use("/manageclient", require("./routes/manage/userMange"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
