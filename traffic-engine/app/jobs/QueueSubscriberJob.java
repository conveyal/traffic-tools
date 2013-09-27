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
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.Pipeline;
import util.GeoUtils;

@OnApplicationStart(async=true)
public class QueueSubscriberJob extends Job {
	
	private JedisPool jedisPool = new JedisPool("localhost");
	
    public void doJob() {
    	
    	ExecutorService executor = Executors.newFixedThreadPool(3);

    	Date lastStatsUpdate = new Date();
    	Long lastTotalLocationUpdates = 0l;
    	
    	Jedis jedis = null;
    	
    	try {
    		jedis = jedisPool.getResource();
    		if(jedis.get("totalLocationUpdates") != null) 
        		lastTotalLocationUpdates = Long.parseLong(jedis.get("totalLocationUpdates"));
        	
    	}
    	finally {
    		jedisPool.returnResource(jedis);
    	}
    	
    	
    	
    	

    	while(true) {
    		BinaryJedis jedisBinary = null;
    		byte[] queueVal = null;
    		
    		try {
    			jedisBinary = jedisPool.getResource();
        		queueVal = jedisBinary.lpop("queue".getBytes());
    		}
    		finally {
    			jedisPool.returnResource(jedisBinary);
    		}
    	
    		
    		
    		
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
    		if(elapsedMs > 1000) {
    			try {
    				jedis = jedisPool.getResource();
        			Long currentTotalLocationUpdates = 0l;
        			if(jedis.get("totalLocationUpdates".getBytes()) != null) 
        				currentTotalLocationUpdates = Long.parseLong(jedis.get("totalLocationUpdates"));
        			
        			Double  processingRate =  ((double)(currentTotalLocationUpdates - (double)lastTotalLocationUpdates));
        			
        			lastTotalLocationUpdates = currentTotalLocationUpdates;	 	 	
        			
        			jedis.set("processingRate",processingRate.toString());
    			}
    			finally {
    				jedisPool.returnResource(jedis);
    			}
 
    		}
    	}
    }
}