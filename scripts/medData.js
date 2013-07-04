/*
 *	medData.js
 *
 *	manages the medical data
 */

var _ = require('underscore')
	, msh = require('../scripts/mysqlHelper')
	, zipData = require('../scripts/zipData')
	, placeInfo = require('../scripts/placeInfo')
	, flowController = require('../scripts/flowController')
	;


// for debugging
var debugging = false;


// load the medicare data db
var inputFiles = [ {fn: "./data/Medicare_Inpatient_DRG100_FY2011.csv", inpatient: 1}
			, {fn: "./data/Medicare_Outpatient_APC30_CY2011.csv", inpatient: 0} ];

exports.loadFiles = function(index) {
	if ( index >= inputFiles.length ) {
		writeRegionTreatmentProvider();
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
			data.pid = parseInt(data.pid);
			data.pname = fixCase(data.pname);
			data.pstreet = fixCase(data.pstreet);
			data.pcity = fixCase(data.pcity);
			data.count = parseInt(data.count);
			data.submitted = parseFloat(data.submitted);
			data.paid = parseFloat(data.paid);
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
		"MCC", "O.R.", "OHSU", "P.O.", "PO", "RD", "SNF", "ST", "UMDNJ", "W/O"].sort();
function fixCase(str) {
	var strs = str.split(" ");
	var newStr = "";
	var len = strs.length - 1;
	strs.forEach(function(str, index) {
		if ( -1 == _.indexOf(leaveAlone, str, true) ) {
			// not there.  case it
			newStr += str.charAt(0);
			if ( str.length > 1 ) newStr += str.substr(1).toLowerCase();
		} else {
			newStr += str;
		}
		if ( index < len ) newStr += " ";
	});
	return newStr;
}


// treatments, providers, and regions are universal
var providerArray = new Array();
var regionArray = new Array();
var treatmentArray = new Array();
var itemArray = new Array();

// TODO: insert sorted instead of push().sort()
function saveItem(item, inpatient) {
	// first the region
	var region = _.find(regionArray, function(rgn) {
		return rgn.name == item.region;
	});
	if ( !region ) {
		// not there, add it at the end and set regionId to the index
		var rgn = item.region.split(" ");
		region = { med_id: regionArray.length
			, name: item.region
			, state: rgn[0]
			, procList: new Array()
		};
		regionArray.push(region);
	}

	// then the treatment
	var t = item.treatment.split(" ");
	var ti = parseInt(t[0])
	var internalTi = inpatient ? 10000+ti : ti;
	var treatment = _.find(treatmentArray, function(tmt) {
		return tmt.internal_id == internalTi;
	});
	if ( !treatment ) {
		// not there, add it
		treatment = { med_id: ti
			, name: item.treatment
			, inpatient: inpatient
			, internal_id: internalTi
		};
		treatmentArray.push(treatment);
	}

	// then the provider
	var provider = _.find(providerArray, function(prv) {
		return item.pid == prv.med_id;
	});
	if ( !provider ) {
		// not there, add it
		provider = { med_id: item.pid
			, name: item.pname
			, street: item.pstreet
			, city: item.pcity
			, state: item.pstate
			, zip: item.pzip
			, lat: null
			, lng: null
			, loc_from_zip: 1
			, region: region.med_id
		};
		providerArray.push(provider);
	}

	// the items
	var info = { provider: item.pid
		, treatment: internalTi
		, region: region.med_id
		, num: item.count
		, submitted: item.submitted
		, paid: item.paid
	};
	itemArray.push(info);

	// procedure list
	var proc = _.find(region.procList, function(proc) {
		return proc.treatment == internalTi;
	});
	if ( proc ) {
		// it's there.  add 'em
		proc.total_num += item.count;
		proc.total_submitted += item.submitted * item.count;
		proc.total_paid += item.paid * item.count;
		proc.provider_count++;
	} else {
		// new
		proc = { treatment: internalTi
			, region: region.med_id
			, provider_count: 1
			, total_num: item.count
			, total_submitted: item.submitted * item.count
			, total_paid: item.paid * item.count
		};
		region.procList.push(proc);
	}
}


// write out all the regions, treatments, and providers
function writeRegionTreatmentProvider() {
	var model = {
	};
	var callbacks = [ [{callback: writeRegion, paramsArray: regionArray, max: 20}]
		, [{callback: writeTreatment, paramsArray: treatmentArray, max: 20}]
		, [{callback: writeProvider, paramsArray: providerArray, max: 9}]
		, [{callback: writeItem, paramsArray: itemArray, max: 20}]
		, [{callback: writeProc, paramsArray: procArray, max: 20}]
		, [finish]
	];
	var fc = new flowController.FlowController({ model: model
		, callbacks: callbacks
		, startNow: true
	});
}


var procArray = new Array();
function writeRegion(model, region) {
	var procList = region.procList;
	procList.forEach(function(proc) {procArray.push(proc)});
	delete region.procList;
	if ( debugging ) { model._fc.done(); return; }
	msh.addRecord(msh.tables.region, region, function() {
		model._fc.done();
	});
}


function writeProc(model, proc) {
	proc['avg_submitted'] = proc.total_submitted / proc.total_num;
	proc['avg_paid'] = proc.total_paid / proc.total_num;
	if ( debugging ) { model._fc.done(); return; }
	msh.addRecord(msh.tables.proc, proc, function() {
		model._fc.done();
	});
}


function writeTreatment(model, treatment) {
	if ( debugging ) { model._fc.done(); return; }
	msh.addRecord(msh.tables.treatment, treatment, function() {
		model._fc.done();
	});
}


function writeItem(model, item) {
	if ( debugging ) { model._fc.done(); return; }
	msh.addRecord(msh.tables.item, item, function() {
		model._fc.done();
	});
}


function writeProvider(model, provider) {
	if ( debugging ) { model._fc.done(); return; }
	placeInfo.placeInfoFromProvider(provider, function(lat, lng) {
		if ( lat || lng ) {
			provider.lat = lat;
			provider.lng = lng;
			provider.loc_from_zip = 0;
			msh.addRecord(msh.tables.provider, provider, function() {
				model._fc.done();
			});
		} else {
			// get it from the zip table
	 		zipData.getZipInfo(provider.zip, function(zd) {
	 			if ( zd ) {
	 				provider.lat = zd.lat;
	 				provider.lng = zd.lng;
	 			}
				msh.addRecord(msh.tables.provider, provider, function() {
					model._fc.done();
				});
			});
		}
	});
}


function finish(model) {
	console.log("finished importing data");
	msh.closeConnection();
	model._fc.done();
}
