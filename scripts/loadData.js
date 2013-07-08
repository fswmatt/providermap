/*
 *	loadData.js
 *
 *	loads all the data
 */

var medData = require('../scripts/medData')
	, zipData = require('../scripts/zipData')
	;

// load the zip data then the med data
zipData.loadZipData();

// load the med data
medData.loadFiles(0);

// fill in the region bounds.
//	TODO: add this to loadFiles, separate for historic (and lame) reasons
medData.fillRegionBounds();
