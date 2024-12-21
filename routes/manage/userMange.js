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
// transaction collection
let transaction_collection = client
  .db("harun_cycle_db")
  .collection("transection_collection");

// get customer info from mongo
router.get("/client/:phone", fetchValidUser, async (req, res) => {
  let phoneParam = req.params.phone;
  // console.log(phoneParam);
  try {
    let query = { clientPhone: phoneParam };
    const cursor = await clientInfo_collection.findOne(query);
    if (cursor) {
      res.json({
        success: true,
        msg: "Client found with phone number",
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

router.get("/clientbyid/:id", fetchValidUser, async (req, res) => {
  const { id } = req.params;

  // console.log("customer id from clientbyid: ", id);
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      msg: "Invalid client ID format",
    });
  }

  try {
    const query = { _id: new ObjectId(id) };
    // console.log("Query: ", query);
    const client = await clientInfo_collection.findOne(query, {
      projection: { clientName: 1, clientPhone: 1, clientAddress: 1 },
    });

    if (client) {
      return res.json({
        success: true,
        msg: "Client found",
        client,
      });
    } else {
      return res.status(404).json({
        success: false,
        msg: "Client not found",
      });
    }
  } catch (error) {
    console.error("Error fetching client by ID: ", error);
    return res.status(500).json({
      success: false,
      msg: "An error occurred",
    });
  }
});

// Update client by ID
router.put("/clientbyid/:id", fetchValidUser, async (req, res) => {
  const { id } = req.params;
  const reqBody = req.body;

  // Validate the client ID
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      msg: "Invalid client ID format",
    });
  }

  // Validate request body
  if (!reqBody || Object.keys(reqBody).length === 0) {
    return res.status(400).json({
      success: false,
      msg: "Request body is empty",
    });
  }

  // Prepare fields for update
  const upCreds = {};
  for (const key in reqBody) {
    if (reqBody[key]?.length > 0) {
      upCreds[key] = reqBody[key];
    }
  }

  // console.log(upCreds);

  try {
    // Perform the update operation
    const result = await clientInfo_collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: upCreds }
    );

    // Check if the update was successful
    if (result.modifiedCount === 0) {
      return res.status(404).json({
        success: false,
        msg: "No client found to update or no changes made",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Client updated successfully",
    });
  } catch (error) {
    console.error("Error updating client:", error);
    return res.status(500).json({
      success: false,
      msg: "Internal server error",
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

// get all customers
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

// get customer info by phone number
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

// get specific customer's history
router.get("/customerHistory/:id", fetchValidUser, async (req, res) => {
  const customerId = req.params.id;
  try {
    const allHistory = await bills_collection
      .find({ clientId: customerId })
      .toArray();
    const allDeposits = await transaction_collection
      .find({ clientId: customerId })
      .toArray();
    if (allHistory.length > 0) {
      return res.json({
        success: true,
        msg: "we have found some records",
        allHistory: allHistory,
        allDeposits: allDeposits,
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

// delete an specific customer
router.delete("/deletecustomer/:id", fetchValidUser, async (req, res) => {
  const customerId = req.params.id;
  try {
    const userDeleteReq = await clientInfo_collection.deleteOne({
      _id: new ObjectId(customerId),
    });
    // console.log(userDeleteReq);
    if (userDeleteReq.deletedCount > 0) {
      // delete all bills of the user with same customer id
      const billsDeleteReq = await bills_collection.deleteMany({
        clientId: customerId,
      });
      if (billsDeleteReq.deletedCount > 0) {
        return res.json({
          success: true,
          msg: "Successfully deleted the user",
        });
      }
    } else {
      return res.json({
        success: false,
        msg: "Sorry! failed to delete the user",
      });
    }
  } catch (error) {
    // return res.status(500).json({ status: 500, msg: "Internal server error" });
    return res.status(500).send("Internal server error");
  }
});

router.put("/deposit", fetchValidUser, async (req, res) => {
  // const customerId = req.params.id;
  const depositBody = req.body;
  try {
    const transactionDoc = {
      clientId: depositBody.customerId,
      amount: parseFloat(depositBody.deposit),
      type: "deposit",
      date: new Date(depositBody.date).toDateString(),
    };
    // console.log(transactionDoc);
    const transactionInsert = await transaction_collection.insertOne(
      transactionDoc
    );
    if (transactionInsert.insertedId) {
      const getClientDue = await clientInfo_collection.findOne(
        { _id: new ObjectId(depositBody.customerId) },
        { projection: { clientDueAmount: 1 } }
      );
      const updateClientDue = await clientInfo_collection.updateOne(
        {
          _id: new ObjectId(depositBody.customerId),
        },
        {
          $set: {
            clientDueAmount: getClientDue.clientDueAmount - depositBody.deposit,
            lastTransactionAmount: depositBody.deposit,
            lastTransactionDate: new Date(depositBody.date).toDateString(),
          },
        }
      );

      if (updateClientDue.modifiedCount > 0) {
        return res
          .status(200)
          .send({ success: true, msg: "Successfully deposit" });
      } else {
        return res.status(500).send("Internal server error");
      }
    } else {
      return res.status(500).send("Internal server error");
    }
  } catch (error) {
    // return res.status(500).json({ status: 500, msg: "Internal server error" });
    console.log(error);
    return res.status(500).send("Internal server error");
  }
});

module.exports = router;
