/*
 *	zipData.js
 *
 *	zip code data
 */


var _ = require('underscore')
	, msh = require('../scripts/mysqlHelper')
	, fc = require('../scripts/flowController')
	;


// get zip data record from wherever's more convenient
exports.getZipInfo = function(zip, cb, context) {
	msh.findRecord(msh.tables.zip, {zipcode: zip}, function(err, rows) {
		if ( !err && rows.length ) {
			cb.call(context, rows[0]);
		} else {
			cb.call(context);
		}
	});
}


var FILENAME = './data/zip2d.csv';
var zipArray = new Array();
exports.loadZipData = function() {
	var csv = require('csv');

	// Read the contents of the postal codes file and pass to our mongo postal db:
	console.log("Reading zip data from " + FILENAME);
	csv()
		.from(FILENAME, { delimiter : ',', columns : true, trim: true })
		.transform(function(data, index) {
			var ret = { zipcode: parseInt(data.zipcode)
				, city: data.city
				, state: data.state
				, lat: parseFloat(data.lat)
				, lng: parseFloat(data.lon)
			};
			return ret;
		})
		.on('record', function(data, index) {
			zipArray.push(data);
		})
		.on('end', function(count) {
			console.log("Number of zip codes processed: " + count);
			zipArray.forEach(function(data) {
				msh.addRecord(msh.tables.zip, data);
			});
		})
		.on('error', function(error) {
			console.error(error.message);
		});
}

