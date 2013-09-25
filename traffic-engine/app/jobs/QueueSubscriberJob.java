package jobs;
import java.util.Date;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import com.conveyal.traffic.graph.VehicleObservation;
import com.vividsolutions.jts.geom.Coordinate;

import controllers.Application;
import play.*;
import play.jobs.*;
import play.test.*;
import redis.clients.jedis.BinaryJedis;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.Pipeline;
import util.GeoUtils;

@OnApplicationStart(async=true)
public class QueueSubscriberJob extends Job {
	
	private BinaryJedis jedis = new BinaryJedis("localhost");
	private Jedis jedisStats = new Jedis("localhost");
	
    public void doJob() {
    	
    	ExecutorService executor = Executors.newFixedThreadPool(3);

    	Date lastStatsUpdate = new Date();
    	Long lastTotalLocationUpdates = 0l;
    	if(jedisStats.get("totalLocationUpdates") != null) 
    		lastTotalLocationUpdates = Long.parseLong(jedisStats.get("totalLocationUpdates"));
    		
    	try {
	    	while(true) {
	    		
	    		byte[] queueVal = jedis.lpop("queue".getBytes());
	    		
	    		// wait for data if queue is empty
	    		if(queueVal == null) {
	    		
	    			try {
						Thread.sleep(1000);
					} 
	    			catch (InterruptedException e) {
						// sleep failed
					}
	    		}
	    		else {
	    			
	    			// process data
	    			
	    			// kick off location update worker thread to process data 
		    		executor.execute(new LocationUpdateWorker(queueVal));
	    			
	    		}
	    		
	    		Long elapsedMs = (new Date().getTime() - lastStatsUpdate.getTime());
	    		if(elapsedMs > 1000 * 10) {
	    			
	    			Long currentTotalLocationUpdates = 0l;
	    			if(jedisStats.get("totalLocationUpdates".getBytes()) != null) 
	    				currentTotalLocationUpdates = Long.parseLong(jedisStats.get("totalLocationUpdates"));
	    			
	    			Double  processingRate =  ((double)(currentTotalLocationUpdates - (double)lastTotalLocationUpdates) / 10);
	    			
	    			jedisStats.set("processingRate",processingRate.toString());
	    		}
	    	}
    	}
    	finally {
    		jedis.disconnect();
    	}
    }
}