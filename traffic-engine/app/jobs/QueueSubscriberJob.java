package jobs;
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

//@OnApplicationStart
public class QueueSubscriberJob extends Job {
	
	public static BinaryJedis jedis = new BinaryJedis("localhost");
	
    public void doJob() {
    	
    	ExecutorService executor = Executors.newFixedThreadPool(3);

    	
    	try {
	    	while(true) {
	    		
	    		byte[] queueVal = jedis.lpop("queue".getBytes());
	    		
	    		// kick off location update worker thread to process data 
	    		executor.execute(new LocationUpdateWorker(queueVal));
	    		
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
	    			
	    			
	    		}
	    	}
    	}
    	finally {
    		jedis.disconnect();
    	}
    }
}