const express = require("express");
const app = express();
const cors = require("cors");
const port = 3000;
const { connectMongo } = require("./mongoConnect");

connectMongo();
app.use(cors());
app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.use("/auth", require("./routes/auth/auth"));
app.use("/manage", require("./routes/manage/manage"));
app.use("/manageclient", require("./routes/manage/userMange"));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
