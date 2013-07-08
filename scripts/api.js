/*
 *	api.js
 *
 *	all of our api calls
 */


var _ = require('underscore')
	, msh = require('../scripts/mysqlHelper')
	, rjh = require('../scripts/returnJsonHelper')
	, flowController = require('../scripts/flowController')
	;


// db tables
var REGIONTABLE = msh.tables.region;
var PROVIDERTABLE = msh.tables.provider;
var ITEMTABLE = msh.tables.item;
var TREATMENTTABLE = msh.tables.treatment;
var PROCTABLE = msh.tables.proc;

var PROVIDERS = "providers";
var ITEMS = "items";
var REGIONS = "regions";
var PROCEDURES = "procedures";


exports.getRegionList = function(req, res) {
	execQueryOrderedApiReturn(res, REGIONTABLE, null, "name", REGIONS);
}


exports.getProvidersInRegion = function(req, res) {
	execQueryOrderedApiReturn(res, PROVIDERTABLE, {region: req.params.region}
		, "lat DESC", PROVIDERS);
}


exports.getFullRegionInfo = function(req, res) {
	getRegionProviderData(req, res, req.params.region);
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


function execQueryOrderedExtrasApiReturn(res, table, data, order, extras, title) {
	msh.findRecordExtrasWithOrder(table, data, order, extras, function(err, rows, fields) {
		returnResults(res, title, err, rows, fields);
	});
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


// get the region's procedures date
//	and all the region's providers and their procedures
function getRegionProviderData(req, res,region) {
	// first get providers in a region
	msh.findRecordWithOrder(PROVIDERTABLE, {region: region}, "lat DESC",
			function(err, rows, fields) {
		if ( !err ) {
			// got 'em.  load 'em all up
			var model = { req: req
				, res: res
				, procs: null
				, providerArray: new Array()
			};
			var callbacks = [ [ {callback: getProcs, paramsArray: [region]}
					, {callback: getProcsForProvider, paramsArray: rows, max: 20}
					]
				, [sendProviderData]
			];
			var fc = new flowController.FlowController({ model: model
				, callbacks: callbacks
				, startNow: true
			});
		}
	});
}


function getProcs(model, region) {
	var q = "SELECT " + PROCTABLE + ".*, " + TREATMENTTABLE + ".name FROM "
			+ PROCTABLE + " JOIN " + TREATMENTTABLE + " WHERE "
			+ PROCTABLE + ".treatment = " + TREATMENTTABLE + ".internal_id AND region = "
			+ parseInt(region);
	msh.directExec(q, function(err, rows, fields) {
		if ( !err ) model.procs = rows;
		model._fc.done();
	});
}


function getProcsForProvider(model, provider) {
	var q = "SELECT " +  ITEMTABLE + ".*, " + TREATMENTTABLE + ".name FROM " + ITEMTABLE
			+ " JOIN " + TREATMENTTABLE + " WHERE " + ITEMTABLE + ".treatment = "
			+ TREATMENTTABLE + ".internal_id AND provider = " + parseInt(provider.med_id);
	msh.directExec(q, function(err, rows, fields) {
		if ( !err ) {
			provider['procedures'] = rows;
		}
		model.providerArray.push(provider);
		model._fc.done();
	});
}


function sendProviderData(model) {
	// sort the array first
	model.providerArray = _.sortBy(model.providerArray, function(p) {return -p.lat});

	// do some calculatin'
	model.procs.forEach(function (proc) {
		proc['percentPaid'] = proc.avg_paid / proc.avg_submitted;
	});

	model.providerArray.forEach(function (provider) {
		var pPaid = 0.0;
		var pChargedRegion = 0.0;
		var pPaidRegion = 0.0;
		var count = 0.0;
		provider.procedures.forEach(function (proc) {
			var base = _.findWhere(model.procs, {treatment: proc.treatment});
			var percentPaid = proc.paid / proc.submitted;
			var percentChargedFromRegion = proc.submitted / base.avg_submitted;
			var percentPaidFromRegion = proc.paid / base.avg_paid;

			proc['percentPaid'] = percentPaid;
			proc['percentChargedFromRegion'] = percentChargedFromRegion;
			proc['percentPaidFromRegion'] = percentPaidFromRegion;
			pPaid += percentPaid;
			pChargedRegion += percentChargedFromRegion;
			pPaidRegion += percentPaidFromRegion;
			count++;
		});
		provider['avgPercentPaid'] = pPaid / count;
		provider['avgPercentChargedFromRegion'] = pChargedRegion / count;
		provider['avgPercentPaidFromRegion'] = pPaidRegion / count;
	});

	var resp = { procedures: model.procs
		, providers: model.providerArray
	};
	rjh.returnSuccess(model.res, resp, 'results');
	model._fc.done();
}
