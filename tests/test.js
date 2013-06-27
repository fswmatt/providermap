/*
 *	test.js
 */


var msh = require('../scripts/mysqlHelper')
	;

exports.test = function(req, res) {
	var table = "region";
	var toWrite = { med_id: 3
		, name: "my region name"
	};
	var toQuery = { med_id: 3 };

	var id;
	msh.addRecord(table, toWrite, function(err, result) {
		if ( result ) {
			id = result.insertId;
		}
	});
	msh.findRecord(table, toQuery, function(err, rows, fields) {
		if ( ! err ) {
			console.log(rows[0]);
		}
	});
}
