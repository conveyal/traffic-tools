
var alertMap;

// dynamic height management

$(document).ready(sizeContent);
$(window).resize(sizeContent);

function sizeContent() {
  var newHeight = $(window).height() - $("#header").height() + "px";
  $("#map").css("height", newHeight);
}


$(document).ready(function() {
  
	alertMap = new AlertMapView({updateFrequency: 10000, publicOnly: true});
	alertMap.updateAlerts();

});

