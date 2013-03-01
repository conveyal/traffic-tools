
wget http://download.geofabrik.de/openstreetmap/asia/philippines.osm.bz2
bunzip2 philippines.osm.bz2
mv philippines.osm ph.osm.xml
osmosis --read-xml ph.osm.xml --bounding-box top=11.26 right=124.387207 left=123.273468 bottom=9.400291 --write-xml cebu.osm.xml
