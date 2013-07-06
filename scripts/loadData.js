/*
 *	loadData.js
 *
 *	loads all the data
 */

var medData = require('../scripts/medData')
	, zipData = require('../scripts/zipData')
	;

// load the zip data then the med data
// zipData.loadZipData();

// load the med data
// medData.loadFiles(0);

medData.fillRegionBounds();
