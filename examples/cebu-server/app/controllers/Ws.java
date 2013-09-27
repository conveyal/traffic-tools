package controllers;

import static play.mvc.Http.WebSocketEvent.BinaryFrame;

import com.conveyal.trafficprobe.TrafficProbeProtos.LocationUpdate;

import play.Logger;
import play.mvc.Http.WebSocketClose;
import play.mvc.Http.WebSocketEvent;
import play.mvc.Http.WebSocketFrame;
import play.mvc.WebSocketController;
import redis.clients.jedis.BinaryJedis;
import redis.clients.jedis.JedisPool;
import redis.clients.jedis.JedisPoolConfig;
import utils.StatsPool;


public class Ws extends WebSocketController {
	
	static StatsPool jedisPool = new StatsPool();
	
	static void processPbFrame(byte[] data, String source) {
		try {
			
			BinaryJedis jedis = jedisPool.pool.getResource();
			
			try {
				if(!jedis.isConnected()) {
					jedisPool.pool.returnBrokenResource(jedis);
					jedis = jedisPool.pool.getResource();
				}
				
				jedis.rpush("queue".getBytes(), data);
				
			}
			finally {
				jedisPool.pool.returnResource(jedis);
			}
			
			LocationUpdate locationUpdate = LocationUpdate.parseFrom(data);
		  	
		  	Logger.info(source + " binary frame recieved: " + locationUpdate.getLocationList().size() + " updates/" + data.length + " bytes from phone " + locationUpdate.getPhone());
		  	
		  	// print diagnostic data
		  	if(locationUpdate.hasLevel())
		  		Logger.info("battery charging: " + locationUpdate.getCharging() + " battery level: " + locationUpdate.getLevel() + " network signal: " + locationUpdate.getNetwork() + " gps status: "  + locationUpdate.getGps() );
		  	
		  	models.LocationUpdate.pbLocationUpdate(locationUpdate);
		}
		catch(Exception e) {
			e.printStackTrace();
		}
	}
	
	public static void location() {
	
		while(inbound.isOpen()) {
			
			try
			{
				WebSocketEvent e = await(inbound.nextEvent());
				
				if(e instanceof WebSocketFrame) {
	                  WebSocketFrame frame = (WebSocketFrame)e;
	                  
	                  if(frame.isBinary) {
	                	  
	                	  	byte[] data = frame.binaryData;
	                	  	
	                	  	processPbFrame(data, "websocket");
	                  }
	                  else {
	                	  
	                	  Logger.info("Websocket text frame recieved: " + frame.textData);
	                	  
	                	 // if(frame.textData.equals("CONNECTION_TEST"))
	                	 //	  outbound.send("CONNECTED");
	                  }
		                  
	             }
	             if(e instanceof WebSocketClose) {
	                 Logger.info("Socket closed");
	             }
				
			}
			catch(Exception e)
			{
				e.printStackTrace();
			}
		        
	    }
	}
}
