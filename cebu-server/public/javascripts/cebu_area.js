var mbUrl = 'http://{s}.tiles.mapbox.com/v3/conveyal.map-jc4m5i21/{z}/{x}/{y}.png';

var cLayers = new Array();

var overlays = new L.LayerGroup();

var newMarker = null;


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

function sizeContent() {
  var newHeight = $(window).height() - $("#header").height() + "px";
  $("#map").css("height", newHeight);
}

var startMarker = null;

var endMarker = null;

function mapClick(mEvent)
{
	if(startMarker == null)
	{
		newMarker = L.marker(mEvent.latlng);
		newMarker.addTo(map);
	
		var data = ich.incidentSave(null, true);
		
		newMarker.bindPopup(data);
		newMarker.openPopup();	
	}
	else if(endMarker == null)
	{
		newMarker = L.marker(mEvent.latlng);
		newMarker.addTo(map);
	
		var data = ich.incidentSave(null, true);
		
		newMarker.bindPopup(data);
		newMarker.openPopup();	
	}
	else
	{
		//
	}
}


$(document).ready(function() {
	
	map = new L.map('map').setView(defaultLatLon, 13);

	L.tileLayer(mbUrl, mbOptions).addTo(map);

	//map.on('click', mapClick);
	
	drawControl = new L.Control.Draw();
	map.addControl(drawControl);

	map.draw.enable();
 
});


