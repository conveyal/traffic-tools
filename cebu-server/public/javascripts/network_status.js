

var mbUrl = 'http://{s}.tiles.mapbox.com/v3/openplans.map-ky03eiac/{z}/{x}/{y}.png';

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

function loadNetworkFailures()
{
	$.get('/api/network', function(data){
		traceData = data;
		
		for(var trace in traceData)
		{
			var error  = 2;
			if(traceData[trace].gpsError > 0 )
				error = traceData[trace].gpsError;
			if (traceData[trace].gpsError < 50)
				L.circle([traceData[trace].lat, traceData[trace].lon],  error).addTo(traceLayer);
			
		}
	});
}

// main 

$(document).ready(function() {
	
  map = new L.map('map').setView(defaultLatLon, 13);

  L.tileLayer(mbUrl, mbOptions).addTo(map);
  
  traceLayer.addTo(map);
  
  
  loadNetworkFailures();
  
  //setInterval(loadTraces, 10000);
  //setInterval(refreshTiles, 30000);

});
