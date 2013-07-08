providermap
===========

medicare provider cost mapping mashup


Introduction
------------

providermap is

Quick Start
-----------

**Prereq's: Install and start MySql**

**In your project directory, install and verify using npm:**

    my-project$ npm install config

**In the config directory edit default.js to match your MySql setup:**

    (example default changes):

	module.exports = {
		cfg: {
			mysql_config: { host: 'yourhost'
				, port: 3306
				, user: 'youruser'
				, password: userpw
				},
			globals: { DB_NAME: 'yourdb'
				}
			}
		};

**...and in config/globals.js set your Google API key:**

    (example changes):

	// for my shared keys
	// var exportedKeys = require('../../../dev/shared/sharedKeys');

	// put yer own damned keys here
	exports.googleKey = 'mygooglekey';

**Set up the db schema by running data/config.sql.  Set the db name to match if you changed it:**

    my-project$ mysql -h yourhost -D med_data -P 3306 -u youruser -p userpw < data/config.sql

**Load the data.  It'll take about 20 minutes.:**

    my-project$ node scripts/loadData.js

**Start your application server:**

    my-project$ node app.js


License
-------

May be freely distributed under the MIT license

Copyright (c) 2013 Matt Siegel

