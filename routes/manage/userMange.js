const express = require("express");
const fetchValidUser = require("../middleware/fetchvaliduser");
const router = express.Router();
const { client } = require("../../mongoConnect");
const { ObjectId } = require("mongodb");

// client collection
let clientInfo_collection = client
  .db("harun_cycle_db")
  .collection("clientInfo_collection");

// get customer info from mongo
router.get("/client/:id", fetchValidUser, async (req, res) => {
  let idParam = req.params.id;
  try {
    let query = { _id: new ObjectId(idParam) };
    const cursor = await clientInfo_collection.findOne(query);
    if (cursor) {
      res.json({
        success: true,
        msg: "Client found with id",
        client: cursor,
      });
    } else {
      res.status(404).json({
        success: false,
        msg: "Client not found",
      });
    }
  } catch (error) {
    res.status(404).json({
      success: false,
      msg: "Client not found",
    });
  }
});

// update customer bill
/* router.post("/customerbill", fetchValidUser, (req, res) => {
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
      let updateReq = knex("clientInfo").update(updateData, ["clientId"]);
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
}); */

module.exports = router;
