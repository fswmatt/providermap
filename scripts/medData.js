/*
 *	medData.js
 *
 *	manages the medical data
 */

var _ = require('underscore')
	, msh = require('../scripts/mysqlHelper')
	, zipData = require('../scripts/zipData')
	, fc = require('../scripts/flowController')
	;


// load the medicare data db
var inputFiles = [ {fn: "./data/Medicare_Inpatient_DRG100_FY2011.csv", inpatient: 1}
			, {fn: "./data/Medicare_Outpatient_APC30_CY2011.csv", inpatient: 0} ];

exports.loadFiles = function(index) {
	if ( index >= inputFiles.length ) {
		writeRegion();
	} else {
		loadDb(inputFiles[index].fn, inputFiles[index].inpatient, index+1, function(i) {
			module.exports.loadFiles(i);
		});
	}
}


function loadDb(filename, inpatient, i) {
	var csv = require('csv');

	// Read the contents of the postal codes file and pass to our mongo postal db:
	console.log("Reading data from " + filename);
	csv()
		.from(filename, { delimiter : ','
			, columns : [ "treatment", "pid", "pname", "pstreet", "pcity", "pstate",
							"pzip", "region", "count", "submitted", "paid" ]
			, trim: true })
		.transform(function(data, index) {
			data.treatment = fixCase(data.treatment);
			data.pname = fixCase(data.pname);
			data.pstreet = fixCase(data.pstreet);
			data.pcity = fixCase(data.pcity);
			return data;
		})
		.on('record', function(data, index) {
			// skip the first line, it's the column names
			if ( index >= 1 ) {
				saveItem(data, inpatient);
			}
		})
		.on('end', function(count) {
			console.log("Number of lines processed: " + count);
			module.exports.loadFiles(i);
		})
		.on('error', function(error) {
			console.error(error.message);
		});
}


var leaveAlone = ["AMI", "CC", "CC/MCC", "C.D.E", "FX", "G.I.", "II", "III", "IV",
		"MCC", "O.R.", "RD", "SNF", "ST", "W/O"].sort();
function fixCase(str) {
	var strs = str.split(" ");
	var newStr = "";
	strs.forEach(function(str, index) {
		if ( -1 == _.indexOf(leaveAlone, str, true) ) {
			// not there.  case it
			newStr += str.charAt(0);
			if ( str.length > 1 ) newStr += str.substr(1).toLowerCase();
		} else {
			newStr += str;
		}
		if ( index+1 < strs.length ) newStr += " ";
	});
	return newStr;
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
	var internalTi = inpatient ? 10000+ti : ti;
	if ( -1 == _.indexOf(treatmentIdArray, internalTi) ) {
		// not there, add it
		treatmentIdArray.push(internalTi);
		treatment = { med_id: ti
			, name: item.treatment
			, inpatient: inpatient
			, internal_id: internalTi
		};
		msh.addRecord("treatment", treatment);
	}

	// then the provider
	if ( -1 == _.indexOf(providerIdArray, item.pid) ) {
		// not there, add it
		providerIdArray.push(item.pid);
		zipData.getZipInfo(item.pzip, function(zd) {
			var provider = { med_id: item.pid
				, name: item.pname
				, street: item.pstreet
				, city: item.pcity
				, state: item.pstate
				, zip: item.pzip
				, lat: zd ? zd.lat : null
				, lng: zd ? zd.lng : null
				, loc_from_zip: 1
				, region: regionId
			};
			msh.addRecord("provider", provider);
		});
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

