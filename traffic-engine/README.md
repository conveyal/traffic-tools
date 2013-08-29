Overview
A data processing engine for traffic-tools, collects mobile data from a variety of input soruces including mobile devices running the related TrafficProbe app or CSV data sets. Generates and stores traficc statstics in a locally isntalleds Redis datastore.

Installation
Install redis datastore

sudo apt-get install redis-server

Install java jre

sudo apt-get install openjdk-7-jre

install play framework 1.2.5

wget http://downloads.typesafe.com/releases/play-1.2.5.zip

unzip play framework

unzip play-1.2.5.zip

download traffic-tools

wget https://github.com/conveyal/traffic-tools/archive/master.zip

unzip master.zip

run server

cd traffic-tools

~/play-1.2.5/play run
