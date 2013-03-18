traffic-tools
=============

A collection of vehicle traffic analysis and traffic operations management tools. The project includes:

* traffic-engine: an OpenStreetMap-based traffic monitoring engine. traffic-engine consumes GPS real-time or offline location data and converts to an aggregate measure of roadway speed. Can be used for a variety of analysis applications, including generation of travel speed maps (https://tiles.mapbox.com/conveyal/edit/map-p0tdb7j3#14.00/10.2989/123.9105)

* cebu-server: a city specific implementation of a traffic-engine front-end. This server collections real-time floating car sample data for use by traffic-engine. This also offers a variety of related traffic management interfaces including a distributed traffic alert tracking interface and analysis/querying tools for extracting data from traffic-engine generated data sets.

* TrafficProbe: an Android-based mobile platform for collecting real-time traffic data.  Efficiently collects and transmits GPS locations to a central traffic-engine server. And as integrated with the cebu-server instance, allows users to view traffic alerts and roadway speed overlays on a mobile device.
