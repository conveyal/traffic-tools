var mbUrl = 'http://{s}.tiles.mapbox.com/v3/conveyal.map-jc4m5i21/{z}/{x}/{y}.png';

//Setup a global namespace for our code.
Taxi = Em.Application.create({

  // When everything is loaded.
  ready: function() {

    // Start polling Twitter
    setInterval(function() {
    	Taxi.vehicles.refresh();
    }, 2000);

    // Call the superclass's `ready` method.
    this._super();
  }
});

Taxi.Vehicle = Em.Object.extend({

});

Taxi.TaxiView = Ember.View.extend({
    tagName: 'li',
    
    edit: function(event) {
    	if(event.view.get('isSelected'))
    		event.view.set('isSelected', false);
    	else
    		event.view.set('isSelected', true);
    	
    	var vehicle = event.view.get('vehicle');
    	map.setView([vehicle.recentLon, vehicle.recentLat], 16);
	  }

});

Taxi.MessageView = Ember.View.extend({
    templateName: 'message-view',
});

//An instance of ArrayController which handles collections.
Taxi.vehicles = Em.ArrayController.create({

  // Default collection is an empty array.
  content: [],

  // Simple id-to-model mapping for searches and duplicate checks.
  _idCache: {},
  
  _markerCache: {},
  _panicState: {},

  // Add a Twitter.Tweet instance to this collection.
  // Most of the work is in the built-in `pushObject` method,
  // but this is where we add our simple duplicate checking.
  addVehicle: function(vehicle) {
	  
    var id = vehicle.get("id");

    // If we don't already have an object with this id, add it.
    if (typeof this._idCache[id] === "undefined") {
      this.pushObject(vehicle);
      this._idCache[id] = vehicle;
         
      this._markerCache[id] = L.marker([vehicle.recentLon, vehicle.recentLat], {icon: TaxiIcon});
      this._panicState[id] = vehicle.panic;
    	  
      if(vehicle.panic)
    	  this._markerCache[id].setIcon(PanicIcon);
      else if(vehicle.messages.length > 0)
    	  this._markerCache[id].setIcon(TaxiIconBlue);
      
      this._markerCache[id].addTo(map);
      
      $('#taxi_list').append('<li id="' + vehicle.id + '">' + vehicle.driver.driverId + ' -- ' + vehicle.vehicle.bodyNumber + '</li>');
    }
    else if (typeof this._markerCache[id] != "undefined")
    {
    	
    	$('#' + vehicle.id).html(vehicle.driver.driverId + ' -- ' + vehicle.vehicle.bodyNumber);
    		
    	this._markerCache[id].setLatLng([vehicle.recentLon, vehicle.recentLat]);
    	
    
    	
    	if(this._panicState[id] != vehicle.panic)
    	{
    		if(vehicle.panic)
    			this._markerCache[id].setIcon(PanicIcon);   
     		else
    			this._markerCache[id].setIcon(TaxiIcon);
    	}
    
    	if(vehicle.messages.length > 0 && !this._panicState[id])
    	{
    		this._markerCache[id].setIcon(TaxiIconBlue);
    		this._panicState[id] = true;
    	}
    	else
    	{
    		if(vehicle.panic)
    			this._markerCache[id].setIcon(PanicIcon);
    		
    		this._panicState[id] = vehicle.panic;
    	}
    	
   
    	
    }
    
    var messageText = "";
    
    for(var i = 0; i < vehicle.messages.length; i++)
    {
  	  messageText += "<br/>"+ vehicle.messages[i].timestamp + "<br/>" + vehicle.messages[i].body;
    }		
    
    if(messageText != "")
    	messageText += '<br/><a href="#" onclick="clearMessages(' + vehicle.id + ');">clear messages</a>';
    	
    messageText += '<br/><a href="#" onclick="showSendForm( '+ vehicle.id + ', \'' + vehicle.driver.driverId + ' -- ' + vehicle.vehicle.bodyNumber + '\');">send message</a>';
    
    var vehicleName = vehicle.driver.driverId + ' -- ' + vehicle.vehicle.bodyNumber;
    	
    var headerStyle = "";
    
    if(vehicle.panic)
    	headerStyle = 'style="color: red;"'
    	
    
    $('#' + vehicle.id).html(' <li class="divider"></li><li><strong><a href="#"  ' + headerStyle + ' onclick="map.setView([' + vehicle.recentLon + ', ' + vehicle.recentLat + '], 15);">' + vehicleName + '</strong></a>' + messageText + '</li>');    
    this._markerCache[id].bindPopup(vehicle.driver.driverId + " -- " + vehicle.vehicle.bodyNumber + messageText);
    
  },
 

  // Public method to fetch more data. Get's called in the loop
  // above as well as whenever the `query` variable changes (via
  // an observer).
  refresh: function() {
	
	
    // Poll Twitter
    var self = this;
    var url = "/taxi/activeTaxis";
    
   
    $.getJSON(url, function(data) {
      // Make a model for each result and add it to the collection.
      for (var i = 0; i < data.length; i++) {
    	  
        self.addVehicle(Taxi.Vehicle.create(data[i]));
      }
    });
  }
});

var currentVehicleId;

function showSendForm(id, vehicleName)
{
	currentVehicleId = id;
	
	$('#sendForm').show();
	
	$('#sendButton').html('send to ' + vehicleName);
	
}

function sendMessage()
{
	var self = this;
    var url = "/api/sendMessage";
      
    jQuery.post( url, {phoneId: currentVehicleId, message: $('#messageText').val()});
    
    $('#messageText').val('');    
    $('#sendForm').hide();
 
}

function clearMessages(id)
{
	var self = this;
    var url = "/api/clearMessages?phoneId=" + id;
      
    $.getJSON(url, function(data) {});
}


var map;

var cebuUrl = 'http://cebutraffic.org/tiles/{z}/{x}/{y}.png';

var TaxiIcon = L.icon({
	iconUrl: '/public/images/taxi.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});

var TaxiIconBlue = L.icon({
	iconUrl: '/public/images/taxi_blue.png',
	iconSize: [32, 37],
    iconAnchor: [16, 37],
    popupAnchor: [0, -37]
});


var PanicIcon = L.icon({
	iconUrl: '/public/images/crime.png',
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


var taxiLayer = new L.LayerGroup();
var taxiData = new Array();
var taxiMarkers = {}

function loadTaxis()
{
	$.get('/taxi/activeTaxis', function(data){
		taxiData = data;
		
		updateTaxis();
	});
}

function updateTaxis()
{
	taxiLayer.clearLayers();
	taxiMarkers = {}
	
	$('#taxi_list').find("li:gt(0)").remove();
	
	for(var taxi in taxiData)
	{
		taxiMarkers[taxiData[taxi].id] = new L.Marker(new L.LatLng(taxiData[taxi].recentLat.toFixed(5), taxiData[taxi].recentLon.toFixed(5)), {icon: taxiIcon});
		taxiMarkers[taxiData[taxi].id].bindPopup('<strong>' + taxiData[taxi].operator.name + '</strong>: ' + taxiData[taxi].driver.driverId);

		taxiLayer.addLayer(taxiMarkers[taxiData[taxi].id]);
		
		$('#taxi_list').append('<li><a class="taxi_item" href="#" data-id="' + taxiData[taxi].id + '">' + taxiData[taxi].operator.name + ': ' + taxiData[taxi].driver.driverId + '</a></li>');

		$('.taxi_item').click(function(event) {
			
			map.setView(taxiMarkers[$(event.target).data('id')].getLatLng(), 17);
			
			$('#taxi_list').find("li").removeClass("active");
			$(event.target).addClass("active");
			
		});
	}
}

// main 

$(document).ready(function() {
	
  
  map = new L.map('map').setView(defaultLatLon, 13);

  L.tileLayer(mbUrl, mbOptions).addTo(map);

  /*var mb = new L.TileLayer(mbUrl, mbOptions);
  map.addLayer(mb);

  var cebu = new L.TileLayer(cebuUrl, mbOptions);

  var congestion = new L.TileLayer(cebuUrl, mbOptions);
  
  map.addLayer(taxiLayer);
  
  map.addLayer(incidentLayer);
  
  map.setView(startLatLng, 15, true);
  
  var overlays = {
		  	"Taxis": taxiLayer,
		    "Velocity": cebu,
		    "Congestion": congestion,
		    "Incidents": incidentLayer
  };
 
  var layersControl = new L.Control.Layers(null, overlays);

  map.addControl(layersControl);*/
  
  //loadIncidents();
  //loadTaxis();
  
  //window.setInterval(loadTaxis, 5000);

});



