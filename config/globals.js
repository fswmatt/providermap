/**
 *	globals.js
 *
 *	all of our globals, loaded via config.js
 */


var config = require('config').cfg;
console.log("Config: " + JSON.stringify(config));

// for my shared keys
var exportedKeys = require('../../../dev/shared/sharedKeys');

// put yer own damned keys here
exports.googleKey = exportedKeys.googleKey;


// mysql
exports.CONFIG_CONN_INFO = config.mysql_config;
exports.DB_NAME = config.globals.DB_NAME;


// timeouts
exports.PRIMARY_TIMEOUT = 10000; // 10 sec
exports.SECONDARY_TIMEOUT = 1000; // 1 sec
