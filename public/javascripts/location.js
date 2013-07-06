/**
 *	location.js
 *
 *	relies on jquery
 */

// globals
// map
var map;
var markers = new Array();
// left column
var accordion = null;


window.onload = initMap;

function initMap() {
	if ( navigator.geolocation ) {
		initRegionSelector();
		navigator.geolocation.getCurrentPosition(createMap, locationError);
	} else {
		alert ("No location support");
	}
}


function detectBrowser() {
	var useragent = navigator.userAgent;
	var mapdiv = document.getElementById("map-canvas");

	if (useragent.indexOf('iPhone') != -1 || useragent.indexOf('Android') != -1 ) {
		mapdiv.style.width = '100%';
		mapdiv.style.height = '100%';
	} else {
		mapdiv.style.width = '600px';
		mapdiv.style.height = '800px';
	}
}


// show the location
function createMap(position) {
	var myRegion = getRegionForPosition(position);
	var gLatLng = new google.maps.LatLng(position.coords.latitude,
				position.coords.longitude);
	// make a map
	var locations
	map = new google.maps.Map(document.getElementById("map-canvas"), {
		zoom: 9,
		center: gLatLng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	});

	// add "You Are Here" marker
	var title = "You Are Here";
	addMarker(map, gLatLng, title, "That's you!", "1", "here");

	// add listeners for bounds events
	google.maps.event.addListener(map, "click", closeInfoWindow);

	if ( myRegion ) {
		changeRegionTo(myRegion.med_id);
		$('#theSelector').val(myRegion.med_id);
	}
}


// gets the closest region for the position
function getRegionForPosition(pos) {
	var regions;
	if ( pos && regionJson ) {
		regions = _.filter(regionJson, function(rgn) {
			return ( pos.coords.latitude <= rgn.north
				&& pos.coords.latitude >= rgn.south
				&& pos.coords.longitude <= rgn.east
				&& pos.coords.longitude >= rgn.west );
		});
		var smallestSize = 540;
		var region;
		regions.forEach(function (rgn) {
			var size = (rgn.north - rgn.south) + (rgn.east - rgn.west);
			if ( size < smallestSize ) region = rgn;
		});
		return region;
	}
}


// global for existing markers
var openInfoWindow = null;
function closeInfoWindow() {
	if ( null != openInfoWindow ) {
		openInfoWindow.close(map);
		openInfoWindow = null;
	}
}

function initRegionSelector() {
	$('#theSelector').change(regionChanged);
	var url = "/api/v0.1/getRegions"
	$.ajax({
		// the URL for the request
		url: url,
		type: "GET",
		dataType : "json",
		success: function(json) {
			loadRegionDropdown(json);
		},

		error: function( xhr, status ) {
			div.innerHTML = "Region selector fill failed.";
		},

		complete: function( xhr, status ) {
			$("#mapinfo").text("Region selector filled.");
		}
	});

}


var regionJson = null;
function loadRegionDropdown(json) {
	if ( json && json.responseCode && json.responseCode.code == 200 ) {
		regionJson = json.regions;
		var $sel = $('#theSelector');
		regionJson.forEach(function(region){
			$sel.append($("<option/>", { value: region.med_id, text: region.name}));
		});
	}
}


// selected region changed
function regionChanged(selector) {
	if ( selector && selector.target ) {
		changeRegionTo(selector.target.value);
	}
	return true;
}


var currentRegion;
var regionUrl = "/api/v0.1/getFullRegionInfo/"
function changeRegionTo(id) {
	$.ajax({ url: regionUrl + id,
		type: "GET",
		dataType : "json",
		success: function(json) {
			currentRegion = _.findWhere(regionJson, {med_id: parseInt(id)});
			resetMapToRegion(json);
		},

		error: function( xhr, status ) {
			currentRegion = null;
			div.innerHTML = "Region selector fill failed.";
		},

		complete: function( xhr, status ) {
			$("#mapinfo").text("Region selector filled.");
		}
	});
}


var providers = null;
var procedures = null;
function resetMapToRegion(json) {
	if ( json && json.responseCode && json.responseCode.code == 200 ) {
		providers = json.results.providers;
		procedures = json.results.procedures;

		// kill the markers and accordion
		clearAllMarkers();
		clearAccordion();

		// set the markers
		addProviderInfo(providers);
		map.fitBounds(new google.maps.LatLngBounds(
				new google.maps.LatLng(currentRegion.south, currentRegion.west),
				new google.maps.LatLng(currentRegion.north, currentRegion.east)));
	}
}


function clearAccordion() {
	if ( accordion ) {
		$("#left-col").accordion("destroy").empty();
		accordion = null;
	}
}


var styleMap = [[0.9, "vl"], [0.95, "l"], [1.05, "n"], [1.1, "h"], [10000, "vh"]];
function styleFromPct(pct) {
	if ( pct ) {
		var style = _.find(styleMap, function(st) {return pct < st[0];});
		return style[1];
	} else {
		return "n";
	}
}
function addProviderInfo(providers) {
	if ( providers ) {
		var ah = ""; // accordionHtml
		providers.forEach(function(provider) {
			var style = styleFromPct(provider.avgPercentChargedFromRegion);
			var h = "<h3 id=" + provider.med_id + " class=" + style + ">"
						+ provider.name + "</h3><p>"
						+ provider.street + "</br>" + provider.city + ", "
						+ provider.state + "  " + provider.zip + "</p>";
			// marker
			markers.push(addMarker( map, new google.maps.LatLng(provider.lat, provider.lng)
				, provider.name, h, provider.med_id
			));

			// accordion
			ah += h;
		});
		accordion = $("#left-col").html(ah).accordion({ heightStyle: "content"
				, collapsible: true
				, activate: onAccordionActivate
				, create: onAccordionCreate
			});
	}
}


// adds a flag to the map
function addMarker(map, latLng, title, content, id, type) {
	var marker = new google.maps.Marker( { map: map
		, position: latLng
		, title: title
		, clickable: true
		, animation: google.maps.Animation.DROP
	});
	var infoWindow = new google.maps.InfoWindow( { content: content
		, position: latLng
	});
	var listener = google.maps.event.addListener(marker, "click", function(event) {
		closeInfoWindow();
		infoWindow.open(map);
		openInfoWindow = infoWindow;
		openAccordionToId(id);
	});
	var markerObj = { id: id
		, marker: marker
		, info: infoWindow
		, listener: listener
	};
	console.log("Adding marker for " + title);
	return markerObj;
}


var markerJustClicked = false;
// opens the accordion to this id
function openAccordionToId(id) {
	var index = -1;
	markers.some(function(elem, i) {
		if ( elem.id == id ) {
			index = i;
			return true;
		}
		return false;
	});
	if ( index > -1 ) {
		markerJustClicked = true;
		if ( null != accordion ) {
			$("#left-col").accordion({active: index});
		}
	}
}


function clearAllMarkers() {
	closeInfoWindow();
	markers.forEach(function(marker) {
		google.maps.event.removeListener(marker.listener);
		marker.marker.setMap(null);
	});
	markers = new Array();
}


// accordion functions
function onAccordionActivate(e, ui) {
	if ( ui.newHeader && ui.newHeader[0] ) {
		var newId = ui.newHeader[0].id;
		showMarkerForId(newId);

		// scroll the list.  TODO: make this #%$@ing thing work
/*		if ($(ui.newHeader).offset() ) {
			var top = $(ui.newHeader).offset().top;
			$.scrollTo($(ui.newHeader));
		}
*/	}
}


function onAccordionCreate(e, ui) {
	if ( ui.header && ui.header[0] ) {
		var index = Math.round((markers.length-1.5)/2);
		var newId = markers[index].id
		$("#left-col").accordion({active: index});
//		var newId = ui.header[0].id;
		showMarkerForId(newId);
	}
}


function showMarkerForId(id) {
	if ( ! markerJustClicked ) {
		closeInfoWindow();
		var marker = _.findWhere(markers, {id: parseInt(id)});
		if ( marker ) {
			marker.info.open(map);
			openInfoWindow = marker.info;
		}
	}
	markerJustClicked = false;
}


// location error
function locationError(error) {
	var errType = { 0: "Unknown error"
		, 1: "Permission denied"
		, 2: "Position not available"
		, 3: "Timed out"
	};
	var errorMsg = errType[error.code];
	if ( error.code == 0 || error.code == 2 ) {
		errorMsg = errorMsg + " " + error.msg;
	}
	var div = document.getElementById("mapinfo");
	div.innerHTML = "Error getting current location.  Error: " + errorMsg;
	log.console("Location error: " + errorMsg);
}


// math helpers
var MILES_PER_KM = 0.621371;
var EARTH_RADIUS_KM = 6371;
var MILES_PER_DEGREE = 69;
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
	var dLat = deg2rad(lat2-lat1);	// deg2rad below
	var dLon = deg2rad(lon2-lon1);
	var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
			Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
			Math.sin(dLon/2) * Math.sin(dLon/2);
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	var d = EARTH_RADIUS_KM * c; // Distance in km
	return d;
}

function getDistanceFromLatLonInMiles(lat1, lon1, lat2, lon2) {
	return getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) * MILES_PER_KM;
}

function deg2rad(deg) {
	return deg * (Math.PI/180)
}
