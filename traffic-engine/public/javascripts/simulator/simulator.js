

var mbUrl = 'http://{s}.tiles.mapbox.com/v3/conveyal.map-o1bd1xee/{z}/{x}/{y}.png';

var overlayUrl = 'http://{s}.tiles.mapbox.com/v3/conveyal.map-p0tdb7j3/{z}/{x}/{y}.png';


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
	
var traceLayer = new L.LayerGroup();
var traceData = new Array();

function runSimulation() {

	$.get('/application/simulate');

}


function clearSimulation() {

	geoJsonOverlay.clearLayers();	

}



$(document).ready(function() {
	
  map = new L.map('map').setView([38.8921, -77.0455], 15);

  L.tileLayer(mbUrl, mbOptions).addTo(map);

	geoJsonOverlay = L.layerGroup();
	geoJsonOverlay.addTo(map);
	
	loadData();

});
