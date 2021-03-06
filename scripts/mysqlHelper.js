/*
 *	mysqlHelper.js
 */

var mysql = require('mysql')
	, globals = require('../config/globals')
	;


var pool  = mysql.createPool(globals.CONFIG_CONN_INFO);
var connection = mysql.createConnection(globals.CONFIG_CONN_INFO);


exports.tables = { provider: globals.DB_NAME + ".provider"
	, item: globals.DB_NAME + ".items"
	, region: globals.DB_NAME + ".region"
	, treatment: globals.DB_NAME + ".treatment"
	, zip: globals.DB_NAME + ".zip"
	, proc: globals.DB_NAME + ".proc"
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
	} else {
		cb.call(context, "No Connection");
	}
}


// add a record
// if there's a cb call it so they can get the id, if not just log n deal
exports.addRecord = function(table, data, cb, context) {
	pool.getConnection(function(err, conn) {
		if ( !conn ) {
			// houston - we have a problem
			cb.call(context, err);
		} else {
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
		}
	});
}


// add multiple records at once
// if there's a cb call it so they can get the id, if not just log n deal
exports.bulkAdd = function(table, columns, data, cb, context) {
	pool.getConnection(function(err, conn) {
		if ( !conn ) {
			// houston - we have a problem
			cb.call(context, err);
		} else {
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
		}
	});
}



// TODO: clean these three up by checking types
exports.findRecord = function(table, data, cb, context) {
	module.exports.findRecordExtrasWithOrder(table, data, null, null, cb, context);
}


exports.findRecordWithOrder = function(table, data, order, cb, context) {
	module.exports.findRecordExtrasWithOrder(table, data, order, null, cb, context);
}


exports.findRecordExtrasWithOrder = function(table, data, order, extras, cb, context) {
	pool.getConnection(function(err, conn) {
		if ( !conn ) {
			// houston - we have a problem
			cb.call(context, err);
		} else {
			var qstr = "SELECT *";
			if ( extras ) qstr += "," + extras;
			qstr += " FROM " + table;
			if ( data ) qstr += ( typeof data === 'string' )
					? (" WHERE " + data)
					: (" WHERE ?");
			if ( order ) qstr += " ORDER BY " + order;
			conn.query(qstr, data, function(err, rows, fields) {
				conn.end();
				if (err) {
					console.log("q: " + qstr + ", err: " + err);
				} else {
					if ( 0 == rows.length ) {
						console.log("q: " + qstr + ", data: " + JSON.stringify(data)
								+ " found 0 records");
					} else {
						console.log("q: " + qstr + " | found " + rows.length + " records.");
					}
				}
				// callback with the results
				cb.call(context, err, rows, fields);
			});
		}
	});
}


// directly execute a query
//  DO NOT ABUSE OR MOCK
exports.directExec = function(qstr, cb, context) {
	pool.getConnection(function(err, conn) {
		if ( !conn ) {
			// houston - we have a problem
			cb.call(context, err);
		} else {
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
		}
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
		connection = mysql.createConnection(globals.MYSQL_CONN_INFO);
		handleDisconnect(connection);
		connection.connect();
	});
}
handleDisconnect(connection);
