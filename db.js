var dbURL = "localhost:27017/testdb";
var collections = ["users"];

var db = require("mongojs").connect(dbURL, collections);

exports.DB = db;