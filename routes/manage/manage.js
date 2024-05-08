const express = require("express");
const fetchValidUser = require("../middleware/fetchvaliduser");
const router = express.Router();
const { client } = require("../../mongoConnect");
const { ObjectId } = require("mongodb");

/*
 ***********************
 ** COLLECTIONS START **
 ***********************
 */
// client collection
let clientInfo_collection = client
  .db("harun_cycle_db")
  .collection("clientInfo_collection");
// inventory collection
let inventory_collection = client
  .db("harun_cycle_db")
  .collection("inventory_collection");
// bills collection
let bills_collection = client
  .db("harun_cycle_db")
  .collection("bills_collection");
/*
 ***********************
 ** COLLECTIONS END **
 ***********************
 */

//  bliis insert with mongodb
const billInsert = async (
  invoiceNumber,
  clientId,
  clientName,
  date,
  due,
  total,
  purchaseItems
) => {
  let insData = {
    invoiceNumber,
    clientId,
    clientName,
    date: date.toDateString(),
    billAmount: Math.abs(due - total),
    purchaseItems,
  };
  try {
    return await bills_collection.insertOne(insData);
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
};

// update customer bill with mongodb => router 1
router.post("/customerbill", fetchValidUser, async (req, res) => {
  let date = new Date();
  let invoiceNumber = `INV-${Date.parse(date)}`;
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
    let purchaseItemIds = [];
    purchaseItems.map((pItem) => {
      let p_item_id = new ObjectId(pItem.productId);
      purchaseItemIds.push(p_item_id);
    });
    let purchased_products = await inventory_collection
      .find({
        _id: { $in: purchaseItemIds },
      })
      .toArray();

    // Check product availability before proceeding with the purchase
    for (let i = 0; i < purchaseItems.length; i++) {
      let product = purchaseItems[i];
      let purItem = purchased_products.find(
        (item) => new ObjectId(item._id).toString() === product.productId
      );
      if (!purItem || purItem.quantity < parseInt(product.quantity)) {
        return res.json({
          success: false,
          msg: `Insufficient quantity for product ${product.productId}`,
          product: purItem,
        });
      }
    }

    // Perform the purchase and update operations
    for (let i = 0; i < purchaseItems.length; i++) {
      let product = purchaseItems[i];
      let purItem = purchased_products.find(
        (item) => new ObjectId(item._id).toString() === product.productId
      );
      let newQty = purItem.quantity - parseInt(product.quantity);
      await inventory_collection.updateOne(
        { _id: new ObjectId(purItem._id) },
        { $set: { quantity: newQty } }
      );
    }

    // ====================================================
    if (customerId === "") {
      let insertData = {
        clientName: fullName,
        clientPhone: phone,
        clientAddress: address,
        clientDueAmount: Math.abs(total - currentPayment),
        lastTransactionAmount: currentPayment,
        lastTransactionDate: date.toDateString(),
        joiningDate: date.toDateString(),
      };
      clientInfo_collection.insertOne(insertData).then((data) => {
        billInsert(
          invoiceNumber,
          new ObjectId(data.insertedId).toString(),
          fullName,
          date,
          due,
          total,
          purchaseItems
        ).then((bill) => {
          return res.json({
            success: true,
            msg: `Client inserted`,
            _id: data.insertedId,
            billInfo: bill,
            date: date.toDateString(),
            invoiceNumber,
          });
        });
      });
    } else {
      clientInfo_collection
        .updateOne(
          { _id: new ObjectId(customerId) },
          {
            $set: {
              clientDueAmount: Math.abs(total - currentPayment),
              lastTransactionAmount: currentPayment,
              lastTransactionDate: date.toDateString(),
            },
          }
        )
        .then((upclient) => {
          billInsert(
            invoiceNumber,
            customerId,
            fullName,
            date,
            due,
            total,
            purchaseItems
          ).then((bill) => {
            return res.json({
              success: true,
              msg: `Client updated`,
              upclient,
              billInfo: bill,
              date: date.toDateString(),
              invoiceNumber,
              _id: customerId,
            });
          });
        });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// today's income mongodb => route 2
router.get("/incometoday/", fetchValidUser, async (req, res) => {
  let dateParam = req.query;
  try {
    let allBillToday = await bills_collection
      .find({ date: dateParam.date })
      .toArray();
    if (allBillToday.length > 0) {
      let totalIncome = 0;
      allBillToday.map((bill) => {
        totalIncome += parseFloat(bill.billAmount);
      });
      res.json({
        success: true,
        msg: "Information found",
        totalIncome,
      });
    } else {
      res.json({
        success: false,
        msg: "We don't found anything",
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// today's bills mongodb => route 3
router.get("/billstoday/", fetchValidUser, async (req, res) => {
  let dateParam = req.query;
  try {
    let allBillToday = await bills_collection
      .find({ date: dateParam.date })
      .toArray();
    if (allBillToday.length > 0) {
      res.json({
        success: true,
        msg: "Information found",
        allBills: allBillToday,
      });
    } else {
      res.json({
        success: false,
        msg: "We don't found anything",
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// add new product mongodb => route 4
router.post("/addproduct", fetchValidUser, (req, res) => {
  let date = new Date();
  const { name, brand, quantity, retail, wholesale, warranty } = req.body;
  let productData = {
    name,
    brand,
    quantity,
    retail,
    wholesale,
    warranty,
    total_cost: wholesale * quantity,
    modify_date: date.toDateString(),
  };
  try {
    inventory_collection.insertOne(productData).then((data) => {
      return res.json({
        success: true,
        msg: "Product added to the database",
        insertResp: data,
      });
    });
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// get all products mongodb => route 5
router.get("/allproducts", fetchValidUser, async (req, res) => {
  try {
    let all_products = await inventory_collection.find().toArray();
    if (all_products.length > 0) {
      let stockValue = 0;
      all_products.forEach((product) => {
        let total_price =
          parseFloat(product.wholesale) * parseInt(product.quantity);
        stockValue += total_price;
      });
      res.json({
        success: true,
        msg: "Information found",
        productsLen: all_products.length,
        allProducts: all_products,
        stockValue: stockValue,
      });
    } else {
      res.json({
        success: false,
        msg: "Nothing found",
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// search product details from inventory_collection
router.get("/searchProduct", fetchValidUser, async (req, res) => {
  // console.log("hitted with: ", req);
  const { pName } = req.query;
  console.log(pName);
  try {
    let all_products = await inventory_collection
      .find({ name: new RegExp(pName, "i") })
      .toArray();
    if (all_products.length > 0) {
      /* let stockValue = 0;
      all_products.forEach((product) => {
        let total_price =
          parseFloat(product.wholesale) * parseInt(product.quantity);
        stockValue += total_price;
      }); */
      res.json({
        success: true,
        msg: "Information found",
        productsLen: all_products.length,
        allProducts: all_products,
        // stockValue: stockValue,
      });
    } else {
      res.json({
        success: false,
        msg: "Nothing found",
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// route 6
router.get("/product/:id", fetchValidUser, async (req, res) => {
  let pid = req.params.id;
  try {
    let product_req = await inventory_collection.findOne({
      _id: new ObjectId(pid),
    });
    res.json({
      success: true,
      msg: "Information found",
      product: product_req,
    });
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// route 7
router.put("/product/:id", fetchValidUser, async (req, res) => {
  let pid = req.params.id;
  const updateBody = req.body;
  try {
    let product_req = await inventory_collection.updateOne(
      {
        _id: new ObjectId(pid),
      },
      { $set: updateBody }
    );
    if (product_req.modifiedCount > 0) {
      return res.json({
        success: true,
        msg: "Your product updated",
        productID: pid,
      });
    } else {
      return res.json({
        success: false,
        msg: "We can't updated your product",
      });
    }
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});

// route 7 -> delete a single product
router.delete("/deleteproduct/:id", fetchValidUser, async (req, res) => {
  const id = req.params.id;
  const deleteReq = await inventory_collection.deleteOne({
    _id: new ObjectId(id),
  });
  if (deleteReq.deletedCount > 0) {
    return res.json({
      success: true,
      msg: "Your product deleted",
      productID: id,
    });
  } else {
    return res.json({
      success: false,
      msg: "We can't delete your product",
    });
  }
});
module.exports = router;
