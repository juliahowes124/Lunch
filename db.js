"use strict";

/** Database for lunchly */

const { Client } = require("pg");

const DB_URI = process.env.NODE_ENV === "test"
    ? "postgresql:///lunchlu_test"
    : "postgresql:///lunchly";

let db = new Client({
  connectionString: DB_URI,
});

db.connect();


module.exports = db;
