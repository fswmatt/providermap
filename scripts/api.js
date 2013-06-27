/*
 *	api.js
 *
 *	all of our api calls
 */


var fc = require('../scripts/flowController')
	, msh = require('../scripts/mysqlHelper')
	, rjh = require('../scripts/returnJsonHelper')
	, _ = require('underscore')
	;


var REGIONTABLE = msh.tables.region;
var PROVIDERTABLE = msh.tables.provider;

exports.getRegionList = function(req, res) {
	// no parameters
	msh.findRecord(REGIONTABLE, null, function(err, rows, fields) {
		if ( !err ) {
			rjh.returnSuccess(res, rows, "regions");
		} else {
			rjh.returnFailure(res, "error " + err);
		}
	});
}


exports.getProvidersInRegion = function(req, res) {
	// get the parameters
	var region = req.params.region;
	msh.findRecord(PROVIDERTABLE, {region: region}, function(err, rows, fields) {
		if ( !err ) {
			rjh.returnSuccess(res, rows, "providers");
		} else {
			rjh.returnFailure(res, "error " + err);
		}
	});
}


exports.getProvidersInState = function(req, res) {
	// get the parameters
	var state = req.params.state;
	msh.findRecord(PROVIDERTABLE, {state: state}, function(err, rows, fields) {
		if ( !err ) {
			rjh.returnSuccess(res, rows, "providers");
		} else {
			rjh.returnFailure(res, "error " + err);
		}
	});
}

exports.getProvidersInBox = function(req, res) {
	// get the parameters
	var north = req.params.north;
	var west = req.params.west;
	var south = req.params.south;
	var east = req.params.east;
}


exports.getProviderData = function(req, res) {
	// get the parameters
	var provider = req.params.provider;
	msh.findRecord(PROVIDERTABLE, {med_id: provider}, function(err, rows, fields) {
		if ( !err ) {
			rjh.returnSuccess(res, rows, "providers");
		} else {
			rjh.returnFailure(res, "error " + err);
		}
	});
}
