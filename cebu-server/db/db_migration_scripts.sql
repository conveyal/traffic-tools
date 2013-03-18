#db migration script

update alert set 
	locationlat = location_lat, 
	locationlon = location_lon,
	activefrom = timestamp;

update alert set 
	activeto = activefrom where active = false;
	