
var colors = ['#A50026','#D73027','#F46D43','#FDAE61','#FEE090','#E0F3F8','#ABD9E9','#74ADD1','#4575B4','#313695'];
var negColors = ['#FEF0D9','#FDCC8A','#FC8D59','#E34A33','#B30000'];
var posColors = ['#F1EEF6','#BDC9E1','#74A9CF','#2B8CBE','#045A8D'];

var mbUrl = 'http://{s}.tiles.mapbox.com/v3/conveyal.map-jc4m5i21/{z}/{x}/{y}.png';

var cLayers = new Array();

var overlays = new L.LayerGroup();

L.EncodedPolyline = L.Polyline.extend ({
	
	initialize: function (polyline, options) {

		this._latlngs = this._decode(polyline);

		L.Polyline.prototype.initialize.call(this, this._latlngs, options);

	},
	
	setPolyline: function (polyline) {
	
		this.setLatLngs(this._decode(polyline));
	},
	
	_decode: function (polyline) {
		
		  var currentPosition = 0;

		  var currentLat = 0;
		  var currentLng = 0;
	
		  var dataLength  = polyline.length;
		  
		  var polylineLatLngs = new Array();
		  
		  while (currentPosition < dataLength) {
			  
			  var shift = 0;
			  var result = 0;
			  
			  var byte;
			  
			  do {
				  byte = polyline.charCodeAt(currentPosition++) - 63;
				  result |= (byte & 0x1f) << shift;
				  shift += 5;
			  } while (byte >= 0x20);
			  
			  var deltaLat = ((result & 1) ? ~(result >> 1) : (result >> 1));
			  currentLat += deltaLat;
	
			  shift = 0;
			  result = 0;
			
			  do {
				  byte = polyline.charCodeAt(currentPosition++) - 63;
				  result |= (byte & 0x1f) << shift;
				  shift += 5;
			  } while (byte >= 0x20);
			  
			  var deltLng = ((result & 1) ? ~(result >> 1) : (result >> 1));
			  
			  currentLng += deltLng;
	
			  polylineLatLngs.push(new L.LatLng(currentLat * 0.00001, currentLng * 0.00001));
			  
			  
		  }	
		  
		  return polylineLatLngs;
	}
	
});


var mbAttrib = 'Traffic overlay powered by OpenPlans Vehicle Tracking Tools, Map tiles &copy; Mapbox (terms).';
var mbOptions = {
  maxZoom : 17,
  attribution : mbAttrib
};

// dynamic height management

$(document).ready(sizeContent);
$(window).resize(sizeContent);

var pathLayer;

var compare = false;

var missingEdges = [];

var edgeList = {};
var conditions = null;
var baseline = null;

function sizeContent() {
  var newHeight = $(window).height() - $("#header").height() + "px";
  $("#map").css("height", newHeight);
}

function loadPath()
{
	if(missingEdges.length > 0) {

		var edgeIds = {edgeIds: missingEdges.join(',') };

		$.post('/api/edges', edgeIds, function(data) {
			missingEdges = [];
			for(edge in data.edges) {

				edgeList[data.edges[edge].edgeId] = data.edges[edge];
			}

			updatePath();
		});
	}
}

function loadStats()
{
	
	$('#observerations').html('<img src="/public/images/loader.gif"/>');


	var options = {hours: $('#hours').val()};

	$.get('/api/currentConditions', options, function(data) {
		conditions = data;
		updatePath();
	});

	if($('#compare').is(':checked')) {

		$.get('/api/baselineConditions', options, function(data) {
			baseline = data;
			updatePath();
		});

	}
	else {
		baseline = null;
	}
}

var overlayUrl = 'http://cebutraffic.org/tiles_avg/{z}/{x}/{y}.png';
var overlay = null;

function updatePath() {
	
	pathLayer.clearLayers();

	var distanceTotal = 0;
	var distanceWeightedSpeedTotal = 0; 

	for(edge in conditions.edges)
	{
		if(edgeList[edge]) {

			var edgeId = edgeList[edge].edgeId;
			var distance = edgeList[edge].distance;

			var color =  '';
			var label = '';

			if(parseInt($('#observations').val()) > conditions.edges[edgeId].obvs)
				continue;

			if (baseline) {

				if(conditions.edges[edgeId] && baseline.edges[edgeId]) {
					
					var speed1 = baseline.edges[edgeId].speed;
					var speed2 = conditions.edges[edgeId].speed;

					var pctChange = (speed2 - speed1) / speed1;

					label = 'Baseline/Current Speed: ' + (speed1  * 3.6).toFixed(1) + '/' + (speed2  * 3.6).toFixed(1) + ' km/h  Change: ' +  (pctChange * 100).toFixed(1) + '% Observations: ' + baseline.edges[edgeId].obvs + '/' + conditions.edges[edgeId].obvs; 

					if(pctChange > 0) {

						var band = Math.floor(Math.abs(pctChange) / 0.05);
						if(band > 4)
							band = 4;
						color = posColors[band];

					}
					else if( pctChange == 0) {

						label = 'no change';
						color = '#aaa';	
					}
					else {

						var band = Math.floor(Math.abs(pctChange) / 0.05);
						if(band > 4)
							band = 4;
						color = negColors[band];

					}
					
					distanceTotal += distance;
					distanceWeightedSpeedTotal += speed1 * distance;

					
				}
			}
			else if(conditions) {
				if(conditions.edges[edgeId]) {
					
					var speed = conditions.edges[edgeId].speed;

					var band = Math.floor(speed / 2)
					if(band > 9)
						band = 9;
					color = colors[band];

					distanceTotal += distance;
					distanceWeightedSpeedTotal += speed * distance;

					label = 'Speed: ' + (conditions.edges[edgeId].speed  * 3.6).toFixed(1) + ' km/h  Observations: ' + conditions.edges[edgeId].obvs; 
				}
			}

			if(color) {
				var polyline = new L.EncodedPolyline(edgeList[edge].geom, {color: color, weight: 5, opacity: 1});
				polyline.bindLabel(label);
			
				
				polyline.addTo(pathLayer);
			}
		}
		else {
			missingEdges.push(edge);
		}
	}

	loadPath();
}



$(document).ready(function() {
	
	$('#hours').on('change', loadStats);
	$('#observations').on('change', updatePath);
	$('#compare').on('change', loadStats);


	overlay = L.tileLayer(overlayUrl, mbOptions);
	
	map = new L.map('map').setView(defaultLatLon, 13);

	L.tileLayer(mbUrl, mbOptions).addTo(map);

	pathLayer = new L.layerGroup()
	pathLayer.addTo(map);

	loadStats();

	window.setInterval(loadStats, 1000 * 60 * 5);
 
});


