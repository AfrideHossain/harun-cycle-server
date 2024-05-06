const express = require("express");
const fetchValidUser = require("../middleware/fetchvaliduser");
const router = express.Router();
// knex db file
const knex = require("../../dbcon");

const billInsert = (invoiceNumber, clientId, clientName, date, due, total) => {
  let insData = {
    invoiceNumber,
    clientId,
    clientName,
    date: date.toDateString(),
    billAmount: Math.abs(due - total),
  };
  try {
    return knex("bills").insert(insData, ["bill_id"]);
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
};
// update customer bill => router 1
router.post("/customerbill", fetchValidUser, (req, res) => {
  let date = new Date();
  console.log(date.toDateString());
  let invoiceNumber = `INV-${Date.parse(date)}`;
  console.log(invoiceNumber);
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
    let all_products_req = knex("inventory").select("*");
    all_products_req.then((allProducts) => {
      // console.log(purchaseItems);
      purchaseItems.map((pItem) => {
        let matchedProduct = allProducts.find(
          (product) => product.id === pItem.productId
        );
        console.log(matchedProduct);
        if (matchedProduct) {
          let newQty = matchedProduct.quantity - pItem.quantity;
          let newtotalCost = newQty * matchedProduct.wholesale;
          if (matchedProduct.quantity >= pItem.quantity) {
            knex("inventory")
              .where({
                id: matchedProduct.id,
              })
              .update({
                quantity: newQty,
                total_cost: newtotalCost,
              })
              .then(() => {
                if (customerId !== "") {
                  let updateData = {
                    clientDueAmount: Math.abs(total - currentPayment),
                    lastTransactionAmount: currentPayment,
                    lastTransactionDate: date.toDateString(),
                  };
                  let updateReq = knex("clientInfo")
                    .where({ clientId: customerId })
                    .update(updateData, ["clientId"]);
                  updateReq
                    .then((data) => {
                      billInsert(
                        invoiceNumber,
                        data[0].clientId,
                        fullName,
                        date,
                        due,
                        total
                      )
                        .then((billres) => {
                          res.json({
                            success: true,
                            msg: `Client updated`,
                            clientId: data[0].clientId,
                            bill_id: billres[0].bill_id,
                            date: date.toDateString(),
                            invoiceNumber,
                          });
                        })
                        .catch((err) => {
                          res.json({ success: false, msg: err.message });
                        });
                    })
                    .catch((err) => {
                      res.json({ success: false, msg: err.message });
                    });
                } else {
                  let insertData = {
                    clientName: fullName,
                    clientPhone: phone,
                    clientAddress: address,
                    clientDueAmount: Math.abs(total - currentPayment),
                    lastTransactionAmount: currentPayment,
                    lastTransactionDate: date.toDateString(),
                    joiningDate: date.toDateString(),
                  };
                  let insertReq = knex("clientInfo").insert(insertData, [
                    "clientId",
                  ]);
                  insertReq
                    .then((data) => {
                      billInsert(
                        invoiceNumber,
                        data[0].clientId,
                        fullName,
                        date,
                        due,
                        total
                      )
                        .then((billres) => {
                          res.json({
                            success: true,
                            msg: `Client updated`,
                            clientId: data[0].clientId,
                            bill_id: billres[0].bill_id,
                            date: date.toDateString(),
                            invoiceNumber,
                          });
                        })
                        .catch((err) => {
                          console.log(err.message);
                        });
                    })
                    .catch((err) => {
                      res.status(500).json({ msg: "Server side error" });
                    });
                }
              })
              .catch((err) => {
                console.log(err.message);
              });
          } else {
            // throw new Error("Insufficient stock for a product");
            res.json({
              success: false,
              msg: "Insufficient stock for a product",
            });
            return;
          }
        }
      });
    });
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// route 2
router.get("/incometoday/", fetchValidUser, (req, res) => {
  let dateParam = req.query;
  try {
    let allBillTodayReq = knex("bills")
      .where({ date: dateParam.date })
      .select("*");
    allBillTodayReq.then((allBills) => {
      if (allBills.length > 0) {
        let totalIncome = 0;
        allBills.map((bill) => {
          totalIncome += parseInt(bill.billAmount);
        });
        res.json({
          success: true,
          msg: "Information found",
          totalIncome,
        });
      } else {
        res.json({
          success: false,
          msg: "Nothing found",
        });
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// route 3
router.get("/billstoday/", fetchValidUser, (req, res) => {
  let dateParam = req.query;
  try {
    let allBillTodayReq = knex("bills")
      .where({ date: dateParam.date })
      .select("*");
    allBillTodayReq.then((allBills) => {
      if (allBills.length > 0) {
        res.json({
          success: true,
          msg: "Information found",
          allBills,
        });
      } else {
        res.json({
          success: false,
          msg: "Nothing found",
        });
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// route 3
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
    let insertReq = knex("inventory").insert(productData, ["id"]);
    insertReq
      .then((data) => {
        res.json({
          success: true,
          msg: "Product added to the database",
          id: data[0].id,
        });
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({ msg: "Server side error" });
      });
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// route 4
router.get("/allproducts", fetchValidUser, (req, res) => {
  try {
    let all_products_req = knex("inventory").select("*");
    all_products_req.then((allProducts) => {
      if (allProducts.length > 0) {
        res.json({
          success: true,
          msg: "Information found",
          allProducts,
        });
      } else {
        res.json({
          success: false,
          msg: "Nothing found",
        });
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// route 5
router.get("/product/:id", fetchValidUser, (req, res) => {
  let pid = req.params.id;
  try {
    let product_req = knex("inventory").where({ id: pid }).select("*");
    product_req.then((product) => {
      if (product.length > 0) {
        res.json({
          success: true,
          msg: "Information found",
          product: product[0],
        });
      } else {
        res.json({
          success: false,
          msg: "Nothing found",
        });
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
// route 6
router.put("/product/:id", fetchValidUser, (req, res) => {
  let pid = req.params.id;
  const updateBody = req.body;
  try {
    let product_req = knex("inventory")
      .where({ id: pid })
      .update(updateBody, ["id"]);
    product_req.then((product) => {
      if (product.length > 0) {
        res.json({
          success: true,
          msg: "Information found",
          productID: product[0].id,
        });
      } else {
        res.json({
          success: false,
          msg: "Nothing found",
        });
      }
    });
  } catch (error) {
    res.status(500).json({ msg: "Server side error" });
  }
});
module.exports = router;
