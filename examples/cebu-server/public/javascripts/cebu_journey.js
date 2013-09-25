var mbUrl = 'http://{s}.tiles.mapbox.com/v3/conveyal.map-jc4m5i21/{z}/{x}/{y}.png';

var cLayers = new Array();

var overlays = new L.LayerGroup();

var newMarker = null;

L.EncodedPolyline = L.Polyline.extend ({
	
	initialize: function (polyline, options) {
		L.Polyline.prototype.initialize.call(this, options);
	
		this._latlngs = this._decode(polyline);
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


var mbAttrib = 'Traffic overlay powered by OpenPlans Vehicle Tracking Tools, Map tiles &copy; Mapbox (terms).';
var mbOptions = {
  maxZoom : 17,
  attribution : mbAttrib
};

// dynamic height management

$(document).ready(sizeContent);
$(window).resize(sizeContent);


var startMarker, endMarker, path, polyline;

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
		startMarker.addTo(map);

	}
	else if(endMarker == null)
	{
		endMarker = L.marker(mEvent.latlng, {icon: endIcon, draggable: true});
		endMarker.on('drag', markerDrag)
		endMarker.addTo(map);
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

function savePath()
{
	$('#saveform_name').val('');
	
	$('#saveJourneyButton').on('click', function () {
		
		$('#journeySaveForm').submit();
	});
	
	$('#saveJourney').modal();
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


	$.get('/api/path?lat1=' + startMarker.getLatLng().lat + '&lon1=' + startMarker.getLatLng().lng + '&lat2=' + endMarker.getLatLng().lat + '&lon2=' + endMarker.getLatLng().lng + filter, function(data) {
		path = data;
		
		$('#saveButton').show();

		
		pathLayer.clearLayers();
		
		var speed = path.minSpeed;
		
		var dist = (path.distance / 1000.0);
		var time1 = (path.distance / speed / 60);
		
		$('#saveform_path').val(path.edgeIds.join(","));

		$('#journeyDistance').text(dist.toFixed(2));
		
		$('#journeyTime').text(time1.toFixed(2));
		
		$('#avgSpeed').text((speed * 3.6).toFixed(2));
		
		$('#saveform_time').val(time1.toFixed(2));
		$('#saveform_distance').val(dist.toFixed(2));
		$('#saveform_speed').val((speed * 3.6).toFixed(2));
		
		var time2 = (path.distance / (speed + 0.5 ) / 60);
		var timeDelta = time2 - time1;
		
		//$('#journeyTimeDelta').text('-' + timeDelta.toFixed(2));
		
		//$('#avgSpeedDelta').text('+' + (0.5 * 3.6).toFixed(2));
		
		for(segment in path.edgeGeoms)
		{
			
			
			var polyline = new L.EncodedPolyline(path.edgeGeoms[segment], {color: "#00f",	weight: 7, opacity: 0.3});
			
			polyline.addTo(pathLayer);
		}
		
	});
}

var overlayUrl = 'http://cebutraffic.org/tiles_avg/{z}/{x}/{y}.png';
var overlay = null;

function currentConditions()
{
	if($('#currentConditions').is(':checked'))
		overlay.addTo(map);
	else
		map.removeLayer(overlay);


}

function compare()
{
	if($('#compareSelect').val() == 'CUSTOM')
		$('#compareDates').show();
	else
		$('#compareDates').hide();
	
	if($('#againstSelect').val() == 'CUSTOM')
		$('#againstDates').show();
	else
		$('#againstDates').hide();
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
        }
    });
	
	$( "#againstSlider" ).slider({
        range: true,
        min: 0,
        max: 23,
        values: [ 0, 23 ],
        slide: function( event, ui ) {
            $("#againstHourRange").html( "" + ui.values[ 0 ] + "hr - " + ui.values[ 1 ] + 'hr');
        }
    });
	
	$('#dragIntro').hide();

	$('#hours').on('change', loadPath);
	$('#days').on('change', loadPath);
	
	$('#compareSelect').on('change', compare);
	$('#againstSelect').on('change', compare);
	
	$('#compareDates').hide();
	$('#againstDates').hide();
	
	$('#saveButton').hide();
	
	$('#dataNotAvailable').hide();
	
	$('#compareFromDatePicker').datepicker();
	$('#compareToDatePicker').datepicker();
	$('#againstFromDatePicker').datepicker()
	$('#againstToDatePicker').datepicker()
	
	map = new L.map('map').setView(defaultLatLon, 13);

	L.tileLayer(mbUrl, mbOptions).addTo(map);

	map.on('click', mapClick);
	
	pathLayer = new L.layerGroup()
	pathLayer.addTo(map);
 
});


