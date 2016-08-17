var mysql = require('mysql');

var config = require('./config'),
mysqlPool = mysql.createPool(config.database),
myVar = {};

/*
after application sent
1- save record
*/

module.exports = myVar;