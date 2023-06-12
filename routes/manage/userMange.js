const express = require("express");
const fetchValidUser = require("../middleware/fetchvaliduser");
const router = express.Router();
const { client } = require("../../mongoConnect");
const { ObjectId } = require("mongodb");

// client collection
let clientInfo_collection = client
  .db("harun_cycle_db")
  .collection("clientInfo_collection");

// bills collection
let bills_collection = client
  .db("harun_cycle_db")
  .collection("bills_collection");

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
router.get("/allcustomers", fetchValidUser, async (req, res) => {
  try {
    const allCustomers = await clientInfo_collection
      .find()
      .sort({ clientDueAmount: -1 })
      .toArray();
    if (allCustomers.length > 0) {
      return res.json({
        success: true,
        msg: "we have found some clients",
        allCustomers,
      });
    } else {
      return res.json({
        success: false,
        msg: "Sorry! we didn't found any clients",
      });
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});
router.get("/searchcustomers", fetchValidUser, async (req, res) => {
  const customerPhoneNum = req.query.phone;
  try {
    const allCustomers = await clientInfo_collection
      .find({ clientPhone: customerPhoneNum })
      .sort({ clientDueAmount: -1 })
      .toArray();
    if (allCustomers.length > 0) {
      return res.json({
        success: true,
        msg: "we have found some clients",
        allCustomers,
      });
    } else {
      return res.json({
        success: false,
        msg: "Sorry! we didn't found any clients",
      });
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});
router.get("/customerHistory/:id", fetchValidUser, async (req, res) => {
  const customerId = req.params.id;
  try {
    const allHistory = await bills_collection
      .find({ clientId: customerId })
      .toArray();
    if (allHistory.length > 0) {
      return res.json({
        success: true,
        msg: "we have found some records",
        allHistory: allHistory,
      });
    } else {
      return res.json({
        success: false,
        msg: "Sorry! we didn't found any records",
      });
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

module.exports = router;
