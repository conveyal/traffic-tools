Overview
--------

A demonstration client interface for traffic-tools, developed for deployment in Cebu City. Includes additional functions for managing traffic alert data and tracking taxi fleets utilizing the TrafficProbe application.

Traffic statstics interfaces depend on a locally installed instance of traffic-engine, and a Redis databse. Can be used stand-alone (with Postgres/PostGIS) for alert and taxi tracking functions.

Installation
------------

###install database

sudo apt-get install postgresql-9.1
sudo apt-get install postgresql-9.1-postgis(installing 1.5x)

###Install java jre

sudo apt-get install openjdk-7-jre

### install play framework 1.2.5

wget http://downloads.typesafe.com/releases/play-1.2.5.zip

### unzip play framework

unzip play-1.2.5.zip

### create database

sudo su postgres

createdb cebu-traffic

psql cebu-traffic < /usr/share/postgresql/9.1/contrib/postgis-1.5/postgis.sql


### change database security settings to allow local access:

sudo nano /etc/postgresql/9.1/main/pg_hba.conf

and change all local connections to “trust” 

(Aternatively, and more secure: create a DB user and update play configuration to use related login.)

### restart database 

sudo /etc/init.d/postgresql restart

### download cebu-traffic 

wget https://github.com/openplans/cebu-taxi/archive/master.zip

unzip master.zip

### configure server

cd cebu-taxi/cebu-server/

nano conf/application.conf

change db.url to reference database name (include DB user account here if needed)

### run server

~/play-1.2.5/play run
