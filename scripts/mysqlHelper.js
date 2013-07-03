/*
 *	mysqlHelper.js
 */

var mysql = require('mysql')
	;


var connInfo = { host: 'localhost'
	, user: 'root'
};
var pool  = mysql.createPool(connInfo);
var connection = mysql.createConnection(connInfo);


var DBNAME = "med_data";
exports.tables = { provider: DBNAME + ".provider"
	, item: DBNAME + ".items"
	, region: DBNAME + ".region"
	, treatment: DBNAME + ".treatment"
	, zip: DBNAME + ".zip"
	, proc: DBNAME + ".proc"
};


// close all connections.  don't do this unless you're really, really sure
//	- there's no recovery
exports.closeConnection = function () {
	console.log("mysqlHelper - closing all connections");
	connection.end(function(err) {
		if ( err ) console.log("Error closing connection: " + err);
		pool.end(function (perr) {
			if ( perr ) console.log("Error closing pool: " + perr);
		});
	});
}


// add a record one at a time using the connection
// if there's a cb call it so they can get the id, if not just log n deal
exports.addRecordSerial = function(table, data, cb, context) {
	if ( connection ) {
		var qstr = "INSERT INTO " + table + " SET ?";
		connection.query(qstr, data, function(err, result) {
			if (err) {
				console.log("q: " + qstr + ", err: " + err);
				// what kind of error?  do we need to reconnect?
			} else {
				console.log("inserted record " + result.insertId + " into " + table);
			}
			if ( cb ) {
				cb.call(context, err, result);
			}
		});
	}
}


// add a record
// if there's a cb call it so they can get the id, if not just log n deal
exports.addRecord = function(table, data, cb, context) {
	pool.getConnection(function(err, conn) {
		var qstr = "INSERT INTO " + table + " SET ?";
		conn.query(qstr, data, function(err, result) {
			if (err) {
				console.log("q: " + qstr + ", err: " + err);
			} else {
				console.log("inserted record " + result.insertId + " into " + table);
			}
			conn.end();
			if ( cb ) {
				cb.call(context, err, result);
			}
		});
	});
}


// add multiple records at once
// if there's a cb call it so they can get the id, if not just log n deal
exports.bulkAdd = function(table, columns, data, cb, context) {
	pool.getConnection(function(err, conn) {
		var qstr = "INSERT INTO " + table + " (" + columns + ") VALUES ?";
		conn.query(qstr, data, function(err, result) {
			if (err) {
				console.log("q: " + qstr + ", err: " + err);
			} else {
				console.log("inserted record " + result.insertId + " into " + table);
			}
			conn.end();
			if ( cb ) {
				cb.call(context, err, result);
			}
		});
	});
}



exports.findRecord = function(table, data, cb, context) {
	module.exports.findRecordWithOrder(table, data, null, cb, context);
}


exports.findRecordWithOrder = function(table, data, order, cb, context) {
	pool.getConnection(function(err, conn) {
		var qstr = "SELECT * FROM " + table + "";
		if ( data ) {
			if ( typeof data === 'string' ) {
				qstr += " WHERE " + data;
				data = null;
			} else {
				qstr += " WHERE ?";
			}
		}
		if ( order ) {
			qstr += " ORDER BY " + order;
		}
		conn.query(qstr, data, function(err, rows, fields) {
			conn.end();
			if (err) {
				console.log("q: " + qstr + ", err: " + err);
			} else {
				if ( 0 == rows.length ) {
					console.log("q: " + qstr + ", data: " + JSON.stringify(data)
							+ " found 0 records");
				} else {
					console.log("found " + rows.length + " records.");
				}
			}
			// callback with the results
			cb.call(context, err, rows, fields);
		});
	});
}


// directly execute a query
//  DO NOT ABUSE OR MOCK
exports.directExec = function(qstr, cb, context) {
	pool.getConnection(function(err, conn) {
		conn.query(qstr, null, function(err, rows, fields) {
			conn.end();
			if (err) {
				console.log("q: " + qstr + ", err: " + err);
			} else {
				console.log("found " + rows.length + " records.");
			}
			// callback with the results
			cb.call(context, err, rows, fields);
		});
	});
}


// in case of connection error
function handleDisconnect(connection) {
	connection.on('error', function(err) {
		if (!err.fatal) {
			return;
		}

		if (err.code !== 'PROTOCOL_CONNECTION_LOST') {
			console.log("Bigtime error - we're screwed.");
			throw err;
		}

		console.log('Re-connecting lost connection: ' + err.stack);
		connection = mysql.createConnection(connInfo);
		handleDisconnect(connection);
		connection.connect();
	});
}
handleDisconnect(connection);
