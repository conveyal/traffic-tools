
var taxiMap;

// dynamic height management

$(document).ready(sizeContent);
$(window).resize(sizeContent);

function sizeContent() {
  var newHeight = $(window).height() - $("#header").height() + "px";
  $("#map").css("height", newHeight);
}


$(document).ready(function() {
  
	taxiMap = new TaxiMapView({updateFrequency: 10000});

	$('#showActive').on('click', function (e) {
    	taxiMap.showActive();
	});

	$('#showWithMessages').on('click', function (e) {
    	taxiMap.showWithMessages();
	});

	$('#showAll').on('click', function (e) {
    	taxiMap.showAll();
	});

	$('#showLabels').on('click', function (e) {
    	
    	taxiMap.showLabels($('#showLabels').is(':checked'));
	});

});

