const express = require("express");
const fetchValidUser = require("../middleware/fetchvaliduser");
const router = express.Router();
// knex db file
const knex = require("../../dbcon");

// update customer bill
router.post("/customerbill", fetchValidUser, (req, res) => {
  let date = new Date();
  const {
    customerId,
    fullName,
    phone,
    address,
    due,
    purchaseItems,
    paid,
    total,
    currentPayment,
  } = req.body;
  let customerData = {
    clientId: customerId,
    clientName: fullName,
    clientPhone: phone,
    clientAddress: address,
    clientDueAmount: due,
    lastTransactionAmount: total,
    lastTransactionDate: date.toDateString(),
    purchaseItems,
    paid,
  };
  try {
    if (customerId !== "") {
      let updateData = {
        clientDueAmount: total - currentPayment,
        lastTransactionAmount: currentPayment,
        lastTransactionDate: date.toDateString(),
      };
      let updateReq = knex("clientInfo")
        .where({ clientId: customerId })
        .update(updateData, ["clientId"]);
      updateReq
        .then((data) => {
          res.json({
            success: true,
            msg: `Client updated`,
            clientId: data[0].clientId,
          });
        })
        .catch((err) => {
          console.log(err.message);
        });
    } else {
      let insertData = {
        clientName: fullName,
        clientPhone: phone,
        clientAddress: address,
        clientDueAmount: total - currentPayment,
        lastTransactionAmount: currentPayment,
        lastTransactionDate: date.toDateString(),
        joiningDate: date.toDateString(),
      };
      let insertReq = knex("clientInfo").insert(insertData, ["clientId"]);
      insertReq
        .then((data) => {
          res.json({
            success: true,
            msg: "New customer added",
            clientId: data[0].clientId,
          });
        })
        .catch((err) => {
          res.status(500).json({ msg: "Server side error" });
        });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});

module.exports = router;
