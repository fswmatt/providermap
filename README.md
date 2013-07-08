providermap
===========

Medicare provider cost mapping mashup


Introduction
------------

Providermap is a mashup of Medicare provider data on a Google map.

Providermap uses government-provided Medicare charge and payback data (included in
the data/ folder, downloaded from
http://www.cms.gov/Research-Statistics-Data-and-Systems/Files-for-Order/CostReports/Downloads/HHA94/HHA2012.zip )
to create and populate a normalized database of:
* regions
* providers
* treatments
* line-items of (provider:treatment)
* info (the real data in the files)

(I also load zipcodes from another government-provided file for worst-case geo info.)

I calculate regional averages for the region as a whole and on a (procedure:region)
pair as well for comparison purposes.

The data's displayed by region via a region selector.  Providers are color coded
based on their average percentage cost vs. their region.  The color coding is:
* < 90%	dark green
* < 95%	light green
* < 105%	black
* < 110%	light red
> 110%	dark red

That's all done on the front end in location.js:

	var styleMap = [[0.9, "vl"], [0.95, "l"], [1.05, "n"], [1.1, "h"], [10000, "vh"]];
	function styleFromPct(pct) {
		...
	}



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

