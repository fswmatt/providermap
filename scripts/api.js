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
	execQueryApiReturn(res, REGIONTABLE, null, "regions");
}


exports.getProvidersInRegion = function(req, res) {
	// get the parameters
	var region = req.params.region;
	execQueryApiReturn(res, PROVIDERTABLE, {region: region}, "providers");
}


exports.getProvidersInState = function(req, res) {
	// get the parameters
	var state = req.params.state;
	execQueryApiReturn(res, PROVIDERTABLE, {state: state}, "providers");
}


exports.getProvidersInBox = function(req, res) {
	// get the parameters
	var clause = "lat < " + parseInt(req.params.north)
			+ " AND lat > " + parseInt(req.params.south)
			+ " AND lng > " + parseInt(req.params.west)
			+ " AND lng < " + parseInt(req.params.east);
	execQueryApiReturn(res, PROVIDERTABLE, clause, "providers");
}


exports.getProviderData = function(req, res) {
	// get the parameters
	var provider = req.params.provider;
	execQueryApiReturn(res, PROVIDERTABLE, {med_id: provider}, "providers");
}


function execQueryApiReturn(res, table, data, title) {
	msh.findRecord(table, data, function(err, rows, fields) {
		if ( !err ) {
			rjh.returnSuccess(res, rows, title);
		} else {
			rjh.returnFailure(res, "error " + err);
		}
	});
}
