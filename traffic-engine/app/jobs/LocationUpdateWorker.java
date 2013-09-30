package jobs;

import java.util.Date;

import play.Logger;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import util.GeoUtils;

import com.conveyal.traffic.graph.StatsPool;
import com.conveyal.traffic.graph.VehicleObservation;
import com.conveyal.trafficprobe.TrafficProbeProtos.LocationUpdate;
import com.conveyal.trafficprobe.TrafficProbeProtos.LocationUpdate.Location;
import com.google.protobuf.InvalidProtocolBufferException;
import com.vividsolutions.jts.geom.Coordinate;

import controllers.Application;

public class LocationUpdateWorker implements Runnable {

	static StatsPool jedisPool = new StatsPool();
	
	byte[] data = null;
	
	public LocationUpdateWorker(byte[] data) {
		
		this.data = data;
	}
	
	@Override
	public void run() {

		try {
			
			LocationUpdate locationUpdate = LocationUpdate.parseFrom(data);
		
			Long vehicleId = new Long(locationUpdate.getPhone());
			
			synchronized(Application.graph.getVehicleUpdateLock(vehicleId)) {
				
				Long intitialTimestamp = locationUpdate.getTime();
				
				Long timeOffset = 0l;
				
				for(Location location : locationUpdate.getLocationList()) {
										
					Date observationTime = new Date(intitialTimestamp + location.getTimeoffset());
					
					Double lat = new Double(location.getLat());
		    		Double lon = new Double(location.getLon());
		    		Double velocity = new Double(location.getVelocity());
		    		Double heading = new Double(location.getHeading());
		    		Double gpsError = new Double(location.getAccuracy());
					VehicleObservation vo = new VehicleObservation(vehicleId, observationTime.getTime(), GeoUtils.convertLatLonToEuclidean(new Coordinate(lat, lon)));
	
					// TODO handle logging/archival 
	
					Application.graph.updateVehicle(vehicleId, vo);
				}
				
				Jedis jedis = jedisPool.pool.getResource();
				
				try {
					jedis.incrBy("totalLocationUpdates", locationUpdate.getLocationList().size());	
				}
				catch (Exception e){
					Logger.error("Could not log totalLocationUpdates increment: " + e.getMessage());
				}
				finally {
					jedisPool.pool.returnResource(jedis);
				}
				
			}
				
		} catch (InvalidProtocolBufferException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}		
	}
}
