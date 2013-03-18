var mbUrl = 'http://{s}.tiles.mapbox.com/v3/openplans.map-g4j0dszr/{z}/{x}/{y}.png';

var cLayers = new Array();

var overlays = new L.LayerGroup();

var newMarker = null;

var eventIcon = L.icon({
	iconUrl: '/public/images/event.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});

var cautionIcon = L.icon({
	iconUrl: '/public/images/caution.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});

var closedroadIcon = L.icon({
	iconUrl: '/public/images/closedroad.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});

var enforcementIcon = L.icon({
	iconUrl: '/public/images/enforcement.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});

var fireIcon = L.icon({
	iconUrl: '/public/images/fire.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});

var fireIcon = L.icon({
	iconUrl: '/public/images/fire.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});

var trafficlightIcon = L.icon({
	iconUrl: '/public/images/trafficlight.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});

var constructionIcon = L.icon({
	iconUrl: '/public/images/construction.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});

var incidentIcon = L.icon({
	iconUrl: '/public/images/caraccident.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});


var floodIcon = L.icon({
	iconUrl: '/public/images/flood.png',
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
	
var incidentLayer = new L.LayerGroup();
var indcidentData = new Array();
var incidentMarkers = {}

var active = true;

function setFilterToggle(toggleState)
{
	active = toggleState;
	loadIncidents();
}

function loadIncidents()
{
	
	$.get('/citom/alerts', {active: active, type: $('#incidentType').val(), filter: $('#filter').val(), fromDate: $('#datepicker1').val(), toDate: $('#datepicker2').val()}, function(data){
		indcidentData = data;
		
		updateIncidents();
	});
}

function markerClick(mEvent)
{
	loadMessages(mEvent.target.alertData.id);
}

function loadMessages(alertId)
{
	//var alertId = mEvent.target.alertData.id;

	$.get('/citom/alertMessages', {id: alertId} , function(data){

		incidentMarkers[alertId].alertData.messages = data;
		
		var html = ich.incident(incidentMarkers[alertId].alertData, true);

		incidentMarkers[alertId].bindPopup(html);
		incidentMarkers[alertId].openPopup();

	});
}


function saveMessage(alertId)
{
	//var alertId = mEvent.target.alertData.id;

	var messageData = $('#message' + alertId).val(); 
	
	if(messageData == "")
		return;
	
	$.post('/citom/saveAlertMessage', {id: alertId,  message: messageData} , function(data){

		loadMessages(alertId);
		
	});
}


function clearAlert(alertId)
{
	//var alertId = mEvent.target.alertData.id;

	var messageData = $('#message' + alertId).val(); 
	
	$.post('/citom/clearAlert', {id: alertId} , function(data){

		loadIncidents();
		
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
		else if(indcidentData[incident].type == "fire")
			icon = fireIcon;
		else if(indcidentData[incident].type == "trafficlight")
			icon = trafficlightIcon;
		else if(indcidentData[incident].type == "enforcement")
			icon = enforcementIcon;
		else if(indcidentData[incident].type == "congestion")
			icon = cautionIcon;
		else if(indcidentData[incident].type == "construction")
			icon = constructionIcon;
		else if(indcidentData[incident].type == "roadclosed")
			icon = closedroadIcon;
		else if(indcidentData[incident].type == "event")
			icon = eventIcon;
		else
			continue;
		
		incidentMarkers[indcidentData[incident].id] = new L.marker([indcidentData[incident].location_lat.toFixed(5), indcidentData[incident].location_lon.toFixed(5)], {icon: icon});
		
		indcidentData[incident].messages = [];
		var data = ich.incident(indcidentData[incident], true);
		
		incidentMarkers[indcidentData[incident].id].alertData = indcidentData[incident]
		
		incidentMarkers[indcidentData[incident].id].bindPopup(data);
		
		incidentMarkers[indcidentData[incident].id].addTo(incidentLayer);
		
		incidentMarkers[indcidentData[incident].id].on('click', markerClick);
	}
}




function mapClick(mEvent)
{
	cancelMarker();
	
	if(newMarker == null)
	{
		newMarker = L.marker(mEvent.latlng);
		newMarker.addTo(map);
	
		var data = ich.incidentSave(null, true);
		
		newMarker.bindPopup(data);
		newMarker.openPopup();	
	}
}

function saveMarker()
{
	if(newMarker != null)
	{
		var incidentType = $('#newIncidentType').val();
		var incidentMessage = $('#newIncidentDescription').val();
		
		$.post('/citom/saveIncident', {lat: newMarker.getLatLng().lat, lng: newMarker.getLatLng().lng, message: incidentMessage, type: incidentType} , function(data){

			loadIncidents();
			
		});
	}
	map.removeLayer(newMarker);
	newMarker = null;
}

function cancelMarker()
{
	if(newMarker != null)
	{
		map.removeLayer(newMarker);
	}
	
	newMarker = null;
}

function updateFilter()
{
	if($('#filter').val() == 'custom')
	{
		$('#customCompare').show();
	}
	else
		$('#customCompare').hide();
	
	loadIncidents();
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


$(document).ready(function() {
	
	overlay = L.tileLayer(overlayUrl, mbOptions);
	
	$('#showActive').button('toggle');
	
	$('#customCompare').hide();
	$('#datepicker1').datepicker();
	$('#datepicker2').datepicker();
	
	
	map = new L.map('map').setView(defaultLatLon, 13);

	L.tileLayer(mbUrl, mbOptions).addTo(map);
	
	incidentLayer.addTo(map);

	map.on('contextmenu', mapClick);
	
	loadIncidents();
	
	$('#downloadReport').click(function(e) {
	    e.preventDefault();  //stop the browser from following
	    window.location.href = '/citom/alertsCsv?active=' + active + '&type=' + $('#incidentType').val() + '&filter=' + $('#filter').val() + '&fromDate=' + $('#datepicker1').val() + '&toDate=' + $('#datepicker2').val();
	});
 
});


