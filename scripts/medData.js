/*
 *	medData.js
 *
 *	manages the medical data
 */

var _ = require('underscore')
	, msh = require('../scripts/mysqlHelper')
	;


exports.loadDb = function(req, res) {
	console.log("loadDb");
}


// load the medicare data db
var inputFiles = [ {fn: "./data/Medicare_Inpatient_DRG100_FY2011.csv", inpatient: 1}
			, {fn: "./data/Medicare_Outpatient_APC30_CY2011.csv", inpatient: 0} ];

function loadFiles(index) {
	if ( index >= inputFiles.length ) {
		writeRegion();
	} else {
		loadDb(inputFiles[index].fn, inputFiles[index].inpatient, index+1, function(i) {
			loadFiles(i);
		});
	}
}


function loadDb(filename, inpatient, index, cb) {
	var csv = require('csv');

	// Read the contents of the postal codes file and pass to our mongo postal db:
	console.log("Reading data from " + filename);
	csv()
		.from(filename, { delimiter : ','
			, columns : [ "treatment", "pid", "pname", "pstreet", "pcity", "pstate",
							"pzip", "region", "count", "submitted", "paid" ]
			, trim: true })
		.on('record', function(data, index) {
			// skip the first line, it's the column names
			if ( index >= 1 ) {
				saveItem(data, inpatient);
			}
		})
		.on('end', function(count) {
			console.log("Number of lines processed: " + count);
			cb(index);
		})
		.on('error', function(error) {
			console.error(error.message);
		});
}


// provider id's and regions are universal
var providerIdArray = new Array();
var regionArray = new Array();
var treatmentIdArray = new Array();

function saveItem(item, inpatient) {
	// first the region
	var regionId = _.indexOf(regionArray, item.region);
	if ( -1 == regionId ) {
		// not there, add it at the end and set regionId to the index
		regionId = regionArray.length;
		regionArray.push(item.region);
	}

	// then the treatment
	var t = item.treatment.split(" ");
	var ti = parseInt(t[0])
	var treatment = null;
	var internalTi = inpatient ? 10000+ti : ti;
	if ( -1 == _.indexOf(treatmentIdArray, internalTi) ) {
		// not there, add it
		treatment = { med_id: ti
			, name: item.treatment
			, inpatient: inpatient
			, internal_id: internalTi
		};
		treatmentIdArray.push(internalTi);
	}

	// then the provider
	var provider = null;
	if ( -1 == _.indexOf(providerIdArray, item.pid) ) {
		// not there, add it
		provider = { med_id: item.pid
			, name: item.pname
			, street: item.pstreet
			, city: item.pcity
			, state: item.pstate
			, zip: item.pzip
			, region: regionId
		};
		providerIdArray.push(item.pid);
	}

	// and the items
	var info = { provider: item.pid
		, treatment: internalTi
		, region: regionId
		, num: item.count
		, submitted: item.submitted
		, paid: item.paid
	};
	msh.addRecord("items", info);
	if ( treatment ) {
		msh.addRecord("treatment", treatment);
	}
	if ( provider ) {
		msh.addRecord("provider", provider);
	}
}


// write out the region info
function writeRegion() {
	regionArray.forEach(function(elem, index) {
		var rgn = elem.split(" ");
		var region = { med_id: index
			, name: elem
			, state: rgn[0]
		};
		msh.addRecord("region", region);
	});
}


// if we're running this by itself...
// loadFiles(0);

