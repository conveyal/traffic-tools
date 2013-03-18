traffic-tools
=============

A collection of vehicle traffic analysis and traffic operations managmenet tools. The project includes:

* traffic-engine: an OpenStreetMap-based traffic monitoring engine. traffic-engine consumes GPS real-time or offline location data and converts to an agreggate measure of roadway speed. Can be used for a variety of analysis applications, including generation of travel speed maps (https://tiles.mapbox.com/conveyal/edit/map-p0tdb7j3#14.00/10.2989/123.9105)

* cebu-server: a city speicfic implementation of a traffic-engine front-end. this server collections real-time floating car sample data for use by traffic-engine. This also offers a variety of related traffic management interfaces including a distributed traffic alert tracking interface and analysis/quering tools for extracting data from traffic-engine generated data sets.

* TrafficProbe: an Android-based mobile platform for collecting real-time traffic data.  Efficiently collects and transmits GPS locatoins to a central traffic-engine server. And as integrated with the cebu-server instance, allows users to view traffic alerts and roadway speed overlays on a mobile device.
