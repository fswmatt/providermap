/*
 *	placeInfo.js
 *
 *	uses google places api to get place info for the provider
 */

var request = require('request')
	, _ = require('underscore')
	, globals = require('../config/globals')
	;


exports.placeInfoFromProvider = function(provider, cb, context) {
	var reqUri = "https://maps.googleapis.com/maps/api/place/textsearch/json"
		+ "?query=" + encodeURIComponent(provider.street) + "+"
		+ encodeURIComponent(provider.city) + "+" + provider.state
		+ "&sensor=false"
		+ "&key=" + globals.googleKey;
	console.log("Getting uri " + reqUri);
	request({uri: reqUri, timeout: 10000}, function(err, response, body) {
		if (null != err || null == response || response.statusCode !== 200 ) {
			console.log("Google Places request for " + provider.name + " failed.");
		} else {
			// body's json.  make an object
			var gPlace = JSON.parse(body);

			// i'm relying on google being good and getting it on the first shot.
			if ( gPlace && gPlace.results && gPlace.results[0] && gPlace.results[0].geometry ) {
				cb.call(context, gPlace.results[0].geometry.location.lat
					, gPlace.results[0].geometry.location.lng);
			} else {
				// didn't work.  try again
				reqUri = "https://maps.googleapis.com/maps/api/place/textsearch/json"
					+ "?query=" + encodeURIComponent(provider.name) + "+"
					+ encodeURIComponent(provider.city) + "+" + provider.state
					+ "&sensor=false"
					+ "&key=" + globals.googleKey;
				console.log("******* First time failed, trying again with uri " + reqUri);
				request({uri: reqUri, timeout: 10000}, function(err, response, body) {
					if (null != err || null == response || response.statusCode !== 200 ) {
						console.log("Google Places request for " + provider.name + " failed.");
					} else {
						// body's json.  make an object
						var gPlace = JSON.parse(body);

						// i'm relying on google being good and getting it on the first shot.
						if ( gPlace && gPlace.results && gPlace.results[0]
								&& gPlace.results[0].geometry ) {
							cb.call(context, gPlace.results[0].geometry.location.lat
								, gPlace.results[0].geometry.location.lng);
						} else {
							cb.call(context, 0, 0);
						}
					}
				});
			}
		}
	});
}


