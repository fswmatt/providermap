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
var ITEMTABLE = msh.tables.items;
var TREATMENTTABLE = msh.tables.treatment;

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


exports.getProviderPricingInfo = function(req, res) {
	// get the parameters
	var provider = req.params.provider;
	var query = "SELECT num, submitted, paid, inpatient, name FROM " + ITEMTABLE
			+ " JOIN " + TREATMENTTABLE + " WHERE " + ITEMTABLE + ".treatment = "
			+ TREATMENTTABLE + ".med_id AND provider = " + provider;
	execStringQuery(res, query, "items");
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


function execStringQuery(res, query, title) {
	msh.directExec(query, function(err, rows, fields) {
		if ( !err ) {
			rjh.returnSuccess(res, rows, title);
		} else {
			rjh.returnFailure(res, "error " + err);
		}
	});
}


