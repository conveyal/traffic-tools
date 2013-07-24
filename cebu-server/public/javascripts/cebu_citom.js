
var startLatLng = new L.LatLng(10.3181373, 123.8956844); 

var mbUrl = 'http://{s}.tiles.mapbox.com/v3/conveyal.map-jc4m5i21/{z}/{x}/{y}.png';

var cLayers = new Array();

var overlays = new L.LayerGroup();

var IncidentIcon = L.Icon.extend({
    iconUrl: '/public/images/caraccident.png',
    iconSize: new L.Point(32, 37),
    iconAnchor: new L.Point(16, 37),
    popupAnchor: new L.Point(0, -37)
});

var incidentIcon = new IncidentIcon();

var FloodIcon = L.Icon.extend({
	iconUrl: '/public/images/flood.png',
    iconSize: new L.Point(32, 37),
    iconAnchor: new L.Point(16, 37),
    popupAnchor: new L.Point(0, -37)
});

var floodIcon = new FloodIcon();

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
	
var incidentLayer = new L.LayerGroup();
var indcidentData = new Array();
var incidentMarkers = {}

function loadIncidents()
{
	$.get('/api/alerts', function(data){
		indcidentData = data;
		
		updateIncidents();
	});
}

function updateIncidents()
{
	incidentLayer.clearLayers();
	incidentMarkers = {}
	
	for(var incident in indcidentData)
	{
		var icon = null;
		
		if(indcidentData[incident].type == "incident")
			icon = incidentIcon;
		else if(indcidentData[incident].type == "flood")
			icon = floodIcon;
		else
			continue;

		incidentMarkers[indcidentData[incident].id] = new L.Marker(new L.LatLng(indcidentData[incident].location_lat.toFixed(5), indcidentData[incident].location_lon.toFixed(5)), {icon: icon});
		incidentMarkers[indcidentData[incident].id].bindPopup(indcidentData[incident].description);
		
		
		incidentLayer.addLayer(incidentMarkers[indcidentData[incident].id]);
	}
}

// main 

function sliderChange(event, ui)
{
	$('#hourLabel').text($( "#slider" ).slider( "value"));
	
	overlays.clearLayers();
	
	overlays.addLayer(cLayers[$( "#slider" ).slider( "value")]);
	
}

$(document).ready(function() {
	
  map = new L.Map('map');

  var mb = new L.TileLayer(mbUrl, mbOptions);
  map.addLayer(mb);
  
  
  for(var i = 0; i < 24; i++)
  {
  	var cebuUrl = '/tiles_c' + i + '/{z}/{x}/{y}.png';
  	cLayers[i] = new L.TileLayer(cebuUrl, mbOptions);
  }
  
  overlays.addLayer(cLayers[0]);
  
  map.addLayer(overlays);
  
  map.setView(startLatLng, 15, true);
  
  $( "#slider" ).slider({ min: 0, max: 23, 
	  change: sliderChange });
  
  $( "#datepicker" ).datepicker({
		showButtonPanel: true,
		disabled: true
	});

});


