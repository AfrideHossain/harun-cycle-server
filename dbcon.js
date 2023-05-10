const path = require("path");
let knex = require("knex")({
  client: "sqlite3",
  connection: {
    filename: path.join(__dirname, "./stock.db"),
  },
  useNullAsDefault: true,
});
knex
  .raw("SELECT 1")
  .then(() => {
    console.log("Sqlite3 connected");
  })
  .catch((e) => {
    console.log("Sqlite3 not connected");
    console.error(e);
  });
module.exports = knex;
