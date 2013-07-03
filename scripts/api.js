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


// db tables
var REGIONTABLE = msh.tables.region;
var PROVIDERTABLE = msh.tables.provider;
var ITEMTABLE = msh.tables.items;
var TREATMENTTABLE = msh.tables.treatment;

var PROVIDERS = "providers";
var ITEMS = "items";
var REGIONS = "regions";

exports.getRegionList = function(req, res) {
	execQueryOrderedApiReturn(res, REGIONTABLE, null, "name", REGIONS);
}


exports.getProvidersInRegion = function(req, res) {
	execQueryOrderedApiReturn(res, PROVIDERTABLE, {region: req.params.region}
		, "lat DESC", PROVIDERS);
}


exports.getProvidersInState = function(req, res) {
	execQueryOrderedApiReturn(res, PROVIDERTABLE, {state: req.params.state}
			, "lat DESC", PROVIDERS);
}


exports.getProvidersInBox = function(req, res) {
	// get the parameters
	var clause = "lat < " + parseInt(req.params.north)
			+ " AND lat > " + parseInt(req.params.south)
			+ " AND lng > " + parseInt(req.params.west)
			+ " AND lng < " + parseInt(req.params.east);
	execQueryOrderedApiReturn(res, PROVIDERTABLE, clause, "lat DESC", PROVIDERS);
}


exports.getProviderData = function(req, res) {
	execQueryApiReturn(res, PROVIDERTABLE, {med_id: req.params.provider}, PROVIDERS);
}


exports.getProviderPricingInfo = function(req, res) {
	// get the parameters
	var query = "SELECT num, submitted, paid, inpatient, name FROM " + ITEMTABLE
			+ " JOIN " + TREATMENTTABLE + " WHERE " + ITEMTABLE + ".treatment = "
			+ TREATMENTTABLE + ".med_id AND provider = " + req.params.provider;
	execStringQuery(res, query, ITEMS);
}


function execQueryOrderedApiReturn(res, table, data, order, title) {
	msh.findRecordWithOrder(table, data, order, function(err, rows, fields) {
		returnResults(res, title, err, rows, fields);
	});
}


function execQueryApiReturn(res, table, data, title) {
	msh.findRecord(table, data, function(err, rows, fields) {
		returnResults(res, title, err, rows, fields);
	});
}


function execStringQuery(res, query, title) {
	msh.directExec(query, function(err, rows, fields) {
		returnResults(res, title, err, rows, fields);
	});
}


function returnResults(res, title, err, rows, fields) {
	if ( !err ) {
		rjh.returnSuccess(res, rows, title);
	} else {
		rjh.returnFailure(res, "error " + err);
	}
}
