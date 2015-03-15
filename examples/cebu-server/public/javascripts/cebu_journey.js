
var colors = ['#A50026','#D73027','#F46D43','#FDAE61','#FEE090','#E0F3F8','#ABD9E9','#74ADD1','#4575B4','#313695'];
var negColors = ['#FEF0D9','#FDCC8A','#FC8D59','#E34A33','#B30000'];
var posColors = ['#F1EEF6','#BDC9E1','#74A9CF','#2B8CBE','#045A8D'];

var mbUrl = 'http://{s}.tiles.mapbox.com/v3/conveyal.map-jc4m5i21/{z}/{x}/{y}.png';

var cLayers = new Array();

var overlays = new L.LayerGroup();

var newMarker = null;

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



var startIcon = L.icon({
	iconUrl: '/public/images/start_flag.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});


var endIcon = L.icon({
	iconUrl: '/public/images/end_flag.png',
    iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});


var mbAttrib = 'Traffic overlay powered by traffic engine, Map tiles &copy; Mapbox (terms).';
var mbOptions = {
  maxZoom : 17,
  attribution : mbAttrib
};

// dynamic height management

$(document).ready(sizeContent);
$(window).resize(sizeContent);


var startMarker, endMarker, path, polyline, pathEdges, pathStats1, pathStats2, statsLoadPending;
var copmareMinHour, compareMaxHour, againstMinHour, againstMaxHour;
var compareDays, compareFromDate, compareToDate;

var againstMinHour, againstMaxHour, againstMinHour, againstMaxHour;
var againstDays, againstFromDate, againstToDate;


var compare = false;


function sizeContent() {
  var newHeight = $(window).height() - $("#header").height() + "px";
  $("#map").css("height", newHeight);
}
	
function mapClick(mEvent)
{
	if(startMarker == null)
	{
		startMarker = L.marker(mEvent.latlng, {icon: startIcon, draggable: true});
		startMarker.on('drag', markerDrag);
		startMarker.on('dragend', markerDragEnd);
		startMarker.addTo(map);

	}
	else if(endMarker == null)
	{
		endMarker = L.marker(mEvent.latlng, {icon: endIcon, draggable: true});
		endMarker.on('drag', markerDrag);
		endMarker.on('dragend', markerDragEnd);
		endMarker.addTo(map);
		statsLoadPending = true;
	}
	
	
	if(startMarker != null && endMarker != null)
	{
		$('#clickIntro').hide();
		$('#dragIntro').show();
		
		loadPath();
	}
}


function markerDrag()
{
	if(startMarker != null && endMarker != null)
	{
		loadPath();
	}
}

function markerDragEnd() {

	updatePath();
	statsLoadPending = true;
	loadStats();
}

function saveRoute()
{
	$('#saveform_name').val('');
	
	$('#saveJourneyButton').on('click', function () {
		
		$('#journeySaveForm').submit();
	});
	
	$('#saveJourney').modal();
}

function clearRoute()
{
	pathLayer.clearLayers();
	
	$('#journeyDistance').text('--');
	
	$('#journeyTime').text('--');
	
	$('#avgSpeed').text('--');
	
	$('#clickIntro').show();
	$('#dragIntro').hide();
	
	if(startMarker != null)
	{
		map.removeLayer(startMarker);
		startMarker = null;
	}
	if(endMarker != null)
	{
		map.removeLayer(endMarker);
		endMarker = null;
	}
}



function loadPath()
{
	$('#saveform_origin_lat').val(startMarker.getLatLng().lat);
	$('#saveform_origin_lon').val(startMarker.getLatLng().lng);
	
	$('#saveform_destination_lat').val(endMarker.getLatLng().lat);
	$('#saveform_destination_lon').val(endMarker.getLatLng().lng);
	
	var filter = '';

	if($('#hours').val() != '' && $('#days').val() != '') {
		filter = '&hours=' + $('#hours').val() + '&days=' + $('#days').val();
	}

	pathEdges = "";
	$.get('/api/path?graphId=' + cityName + '&lat1=' + startMarker.getLatLng().lat + '&lon1=' + startMarker.getLatLng().lng + '&lat2=' + endMarker.getLatLng().lat + '&lon2=' + endMarker.getLatLng().lng + filter, function(data) {
		
		path = data;
		
		updatePath();

		if(statsLoadPending)
			loadStats()
		
		$('#saveButton').show();
	});
}

function loadStats()
{
	if(!pathEdges)
		return;

	var queryParams = {
		edgeIds: pathEdges,
		graphId: cityName
	}
	
	if(compareMaxHour && !(compareMaxHour == 23 && compareMinHour == 0)) {
		queryParams.minHour = compareMinHour;
		queryParams.maxHour = compareMaxHour;
	}

	if(compareDays) {
		queryParams.daysOfWeek = compareDays;
	}

	if($('#compareSelect').val() == 'CUSTOM' && compareFromDate && compareToDate) {
		queryParams.fromDate = compareFromDate;	
		queryParams.toDate = compareToDate;	
	}

	statsLoadPending = false;
	
	$('#compareObserverations').html('<img src="/public/images/loader.gif"/>');

	$.get('/api/trafficStats', queryParams, function(data) {
		pathStats1 = data;
		updatePath();
	});

	if(compare) {

		queryParams = {
			edgeIds: pathEdges,
			graphId: cityName
		}
		
		if(againstMaxHour && !(againstMaxHour == 23 && againstMinHour == 0)) {
			queryParams.minHour = againstMinHour;
			queryParams.maxHour = againstMaxHour;
		}

		if(againstDays) {
			queryParams.daysOfWeek = againstDays;
		}

		if($('#againstSelect').val() == 'CUSTOM' && againstFromDate && againstToDate) {
			queryParams.fromDate = againstFromDate;	
			queryParams.toDate = againstToDate;	
		}
		
		$('#againstObserverations').html('<img src="/public/images/loader.gif"/>');

		$.get('/api/trafficStats', queryParams, function(data) {
			pathStats2 = data;
			updatePath();
		});

	}
	else {
		pathStats2 = null;
	}
	
}

var overlayUrl = 'http://cebutraffic.org/tiles_avg/{z}/{x}/{y}.png';
var overlay = null;

function updatePath() {
	
	pathLayer.clearLayers();
	
	var dist = (path.distance / 1000.0);
	$('#journeyDistance').text(dist.toFixed(2));

	
	var edgeIds = new Array();
	
	var distanceTotal = 0;
	var distanceWeightedSpeedTotal = 0; 
	var distanceWeightedSpeed2Total = 0;

	for(edge in path.edges)
	{

		var edgeId = path.edges[edge].edgeId;
		var distance = path.edges[edge].distance;

		var color =  '#aaa';
		var label = '';

		if (pathStats1 && pathStats2) {

			if(pathStats1.edges[edgeId] && pathStats2.edges[edgeId]) {
				
				var speed1 = pathStats1.edges[edgeId].speed;
				var speed2 = pathStats2.edges[edgeId].speed;

				var pctChange = (speed2 - speed1) / speed1;

				label = 'Speed: ' + (speed1  * 3.6).toFixed(1) + '/' + (speed2  * 3.6).toFixed(1) + ' km/h  Change: ' +  (pctChange * 100).toFixed(1) + '% Observations: ' + pathStats1.edges[edgeId].obvs + '/' + pathStats2.edges[edgeId].obvs; 

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


				distanceWeightedSpeed2Total += speed2 * distance;
							
			}
			else {
				color = '#aaa';	
				label = 'no data'
			}


		}
		else if(pathStats1) {
			if(pathStats1.edges[edgeId]) {
				
				var speed = pathStats1.edges[edgeId].speed;

				var band = Math.floor(speed / 2)
				if(band > 9)
					band = 9;
				color = colors[band];

				distanceTotal += distance;
				distanceWeightedSpeedTotal += speed * distance;

				label = 'Speed: ' + (pathStats1.edges[edgeId].speed  * 3.6).toFixed(1) + ' km/h  Observations: ' + pathStats1.edges[edgeId].obvs; 
			}
			else {
				color = '#aaa';	
				label = 'no data'
			}
		}

		var polyline = new L.EncodedPolyline(path.edges[edge].geom, {color: color, weight: 5, opacity: 1});
		polyline.bindLabel(label);
		
		edgeIds.push(path.edges[edge].edgeId);
		
		polyline.addTo(pathLayer);
	}

	var avgSpeed = distanceWeightedSpeedTotal / distanceTotal;

	$('#avgSpeed').text((avgSpeed * 3.6).toFixed(2));

	var time1 = (path.distance / avgSpeed / 60);

	$('#journeyTime').text(time1.toFixed(2));

	if(pathStats1)
		$('#compareObserverations').text(pathStats1.totalObservations);
	
	if(pathStats2) {

		var avgSpeed2 = distanceWeightedSpeed2Total / distanceTotal;

		$('#againstObserverations').text(pathStats2.totalObservations);
		var time2 = ((distanceTotal * (avgSpeed2 - avgSpeed)) / 60 / 60);

		$('#journeyTimeDelta').text(time2.toFixed(2));
		
		$('#avgSpeedDelta').text(((avgSpeed2 - avgSpeed) * 3.6).toFixed(2));
	}
		

	pathEdges = edgeIds.join();
}

function currentConditions()
{
	if($('#currentConditions').is(':checked'))
		overlay.addTo(map);
	else
		map.removeLayer(overlay);


}

function customDate()
{
	if($('#compareSelect').val() == 'CUSTOM')
		$('#compareDates').show();
	else
		$('#compareDates').hide();
	
	if($('#againstSelect').val() == 'CUSTOM')
		$('#againstDates').show();
	else
		$('#againstDates').hide();

	loadStats()
}

function loadJourney(originLat, originLon, destinationLat, destinationLon) {

	clearRoute();

	startMarker = L.marker([originLat, originLon], {icon: startIcon, draggable: true});
	startMarker.on('drag', markerDrag);
	startMarker.on('dragend', markerDragEnd);
	startMarker.addTo(map);

	
	endMarker = L.marker([destinationLat, destinationLon], {icon: endIcon, draggable: true});
	endMarker.on('drag', markerDrag);
	endMarker.on('dragend', markerDragEnd);
	endMarker.addTo(map);
	statsLoadPending = true;
	
	$('#clickIntro').hide();
	$('#dragIntro').show();
		
	loadPath();

}


function saveCsvPath() {

	var queryParams = {
		edgeIds: pathEdges,
		graphId: cityName
	}
	
	if(compareMaxHour && !(compareMaxHour == 23 && compareMinHour == 0)) {
		queryParams.minHour = compareMinHour;
		queryParams.maxHour = compareMaxHour;
	}

	if(compareDays) {
		queryParams.daysOfWeek = compareDays;
	}

	if($('#compareSelect').val() == 'CUSTOM' && compareFromDate && compareToDate) {
		queryParams.fromDate = compareFromDate;	
		queryParams.toDate = compareToDate;	
	}


	$.get('/api/trafficStats', queryParams, function(data) {

		var lines = []
		lines.push(['edgeId','speed','observations']);
		for(edge in data.edges) {

			lines.push([edge,data.edges[edge].speed,data.edges[edge].obvs]);
		}	

		var csvStr = lines.join('\n');

		var blob = new Blob([csvStr], {type: "text/csv;charset=utf-8"});
		saveAs(blob, "path_edges.csv");
		
	});


}

function saveCsvAll() {

	var queryParams = {
			graphId: cityName
	}
	
	if(compareMaxHour && !(compareMaxHour == 23 && compareMinHour == 0)) {
		queryParams.minHour = compareMinHour;
		queryParams.maxHour = compareMaxHour;
	}

	if(compareDays) {
		queryParams.daysOfWeek = compareDays;
	}

	if($('#compareSelect').val() == 'CUSTOM' && compareFromDate && compareToDate) {
		queryParams.fromDate = compareFromDate;	
		queryParams.toDate = compareToDate;	
	}

	$.get('/api/trafficStats', queryParams, function(data) {
	
		var lines = []
		lines.push(['edgeId','speed','observations']);
		for(edge in data.edges) {

			lines.push([edge,data.edges[edge].speed,data.edges[edge].obvs]);
		}	

		var csvStr = lines.join('\n');

		var blob = new Blob([csvStr], {type: "text/csv;charset=utf-8"});
		saveAs(blob, "all_edges.csv");
	});

	
}

$(document).ready(function() {
	
	overlay = L.tileLayer(overlayUrl, mbOptions);
	
	$( "#compareSlider" ).slider({
        range: true,
        min: 0,
        max: 23,
        values: [ 0, 23 ],
        slide: function( event, ui ) {
            $("#compareHourRange").html( "" + ui.values[ 0 ] + "hr - " + ui.values[ 1 ] + 'hr');
            

        },
        change: function (event, ui ) {
        	compareMinHour = ui.values[ 0 ];
            compareMaxHour = ui.values[ 1 ];
            loadStats();
        }
    });
	
	$( "#againstSlider" ).slider({
        range: true,
        min: 0,
        max: 23,
        values: [ 0, 23 ],
        slide: function( event, ui ) {
            $("#againstHourRange").html( "" + ui.values[ 0 ] + "hr - " + ui.values[ 1 ] + 'hr');
        },
        change: function (event, ui ) {
        	againstMinHour = ui.values[ 0 ];
            againstMaxHour = ui.values[ 1 ];
            loadStats();
        }
    });

    $('.compareDays').on('click', function(evt){
    	
    	var days = [];

    	if($('#compareSunday').is(":checked"))
    		days.push(1); 
    	if($('#compareMonday').is(":checked"))
    		days.push(2);
		if($('#compareTuesday').is(":checked"))
    		days.push(3);
		if($('#compareWednesday').is(":checked"))
    		days.push(4);
		if($('#compareThursday').is(":checked"))
    		days.push(5);
		if($('#compareFriday').is(":checked"))
    		days.push(6);
		if($('#compareSaturday').is(":checked"))
    		days.push(7);
		
		if(days.length == 7 || days.length == 0)
			compareDays = null;
		else
			compareDays = days.join(",");

		loadStats();
    });

    $('.againstDays').on('click', function(evt){
    	
    	var days = [];

    	if($('#againstSunday').is(":checked"))
    		days.push(1); 
    	if($('#againstMonday').is(":checked"))
    		days.push(2);
		if($('#againstTuesday').is(":checked"))
    		days.push(3);
		if($('#againstWednesday').is(":checked"))
    		days.push(4);
		if($('#againstThursday').is(":checked"))
    		days.push(5);
		if($('#againstFriday').is(":checked"))
    		days.push(6);
		if($('#againstSaturday').is(":checked"))
    		days.push(7);
		
		if(days.length == 7 || days.length == 0)
			againsteDays = null;
		else
			againstDays = days.join(",");

		loadStats();
    });
	
	$('#dragIntro').hide();

	$('#hours').on('change', loadPath);
	$('#days').on('change', loadPath);
	
	$('#compareAgainst').on('click', function(evt){
		
		if($('#compareAgainst').is(':checked')) {
			$('#comparisonView').show();
			compare = true;
			loadStats();
		}
		else {
			$('#comparisonView').hide();
			compare = false;
			loadStats();
		}
		
	});
	
	$('#compareSelect').on('change', customDate);
	$('#againstSelect').on('change', customDate);
	
	$('#compareDates').hide();
	$('#againstDates').hide();
	
	$('#comparisonView').hide();
	
	$('#saveButton').on('click', saveRoute);
	$('#clearButton').on('click', clearRoute);

	$('#saveCsvPath').on('click', saveCsvPath);
	$('#saveCsvAll').on('click', saveCsvAll);

	$('#saveButton').hide();
	
	$('#dataNotAvailable').hide();
	
	$('#compareFromDatePicker').datepicker().on('changeDate', function(evt){
		compareFromDate = evt.date.valueOf();
		loadStats();
	});

	$('#compareToDatePicker').datepicker().on('changeDate', function(evt){
		compareToDate = evt.date.valueOf();
		loadStats();
	});

	$('#againstFromDatePicker').datepicker().on('changeDate', function(evt){
		againstFromDate = evt.date.valueOf();
		loadStats();
	});

	$('#againstToDatePicker').datepicker().on('changeDate', function(evt){
		againstToDate = evt.date.valueOf();
		loadStats();
	});

	$('#againstFromDatePicker').datepicker()
	$('#againstToDatePicker').datepicker()
	
	map = new L.map('map').setView(defaultLatLon, 13);

	L.tileLayer(mbUrl, mbOptions).addTo(map);

	map.on('click', mapClick);
	
	pathLayer = new L.layerGroup()
	pathLayer.addTo(map);
 
});


