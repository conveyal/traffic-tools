traffic-tools
=============

A collection of vehicle traffic analysis and traffic operations management tools. The project includes:

* traffic-engine: an OpenStreetMap-based traffic monitoring engine. traffic-engine consumes GPS real-time or offline location data in CSV format and converts to an aggregate measure of roadway speed. Can be used for a variety of analysis applications, including generation of travel speed maps (https://a.tiles.mapbox.com/v3/conveyal.map-p0tdb7j3.html#13/10.2990/123.9055)

* TrafficProbe: an Android-based mobile platform for collecting real-time traffic data.  Efficiently collects and transmits GPS locations to a central traffic-engine server. And as integrated with the cebu-server instance, allows users to view traffic alerts and roadway speed overlays on a mobile device.

* examples/cebu-server: a city specific implementation of a traffic-engine front-end. This server collection real-time floating car sample data for use by traffic-engine. This also offers a variety of related traffic management interfaces including a distributed traffic alert tracking interface and analysis/querying tools for extracting data from traffic-engine generated data sets.


