/*
 *	mysqlHelper.js
 */

var util = require('util')
	, _ = require('underscore')
	, mysql = require('mysql')
	, flowController = require('../scripts/flowController')
	;


var pool  = mysql.createPool({ host: 'localhost'
	, user: 'root'
});

var db = "med_data";


// add a record
// if there's a cb call it so they can get the id, if not just log n deal
exports.addRecord = function(table, data, cb) {
	pool.getConnection(function(err, conn) {
		var qstr = "INSERT INTO `" + db + "`.`" + table + "` SET ?";
		conn.query(qstr, data, function(err, result) {
			if (err) {
				console.log("q: " + qstr + ", err: " + err);
			} else {
				console.log("inserted record " + result.insertId + " into " + table);
			}
			conn.end();
			if ( cb ) {
				cb (err, result);
			}
		});
	});
}


exports.findRecord = function(table, data, cb) {
	pool.getConnection(function(err, conn) {
		var qstr = "SELECT * FROM `" + db + "`.`" + table + "`";
		if ( data ) {
			qstr += " WHERE ?";
		}
		conn.query(qstr, data, function(err, rows, fields) {
			conn.end();
			if (err) {
				console.log("q: " + qstr + ", err: " + err);
			} else {
				console.log("found " + rows.length + " records.");
			}
			// callback with the results
			cb(err, rows, fields);
		});
	});
}
