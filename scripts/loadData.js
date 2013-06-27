/*
 *	loadData.js
 *
 *	loads all the data
 */

var medData = require('../scripts/medData')
	, zipData = require('../scripts/zipData')
	, fc = require('../scripts/flowController')
	;

// load the zip data then the med data
// zipData.loadZipData();

// load the med data
medData.loadFiles(0);
