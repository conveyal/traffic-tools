package com.conveyal.traffic.graph;

import java.lang.reflect.Array;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import play.Logger;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import controllers.Application;

public class TrafficStats {
	
	private static StatsPool jedisPool = new StatsPool();
	// a data model for fast storage and retrieval of summarized views of observations by edge
	
	private HashMap<Long,Double> edgeSpeedTotals = new HashMap<Long,Double>();
	private HashMap<Long,Long> edgeCounts = new HashMap<Long,Long>();
	
	HashSet<Long> edgeIds;
	
	public TrafficStats() {
		edgeIds = null;
	}
	
	public TrafficStats(String graphName, Date fromDate, Date toDate, HashSet<Integer> daysOfWeek, Integer fromHour, Integer toHour, HashSet<Long> edgeIds) {
				
		this.edgeIds = edgeIds;
		
		if(fromDate != null && toDate != null) {
			
			// attempt a date based query -- slowest approach
			
			Calendar cal = Calendar.getInstance(); 
		    cal.setTime(fromDate); 
		    
		    Calendar calTo = Calendar.getInstance(); 
		    calTo.setTime(toDate); 
		    
		    
		    while(cal.before(calTo)) {
		    
		    	cal.add(Calendar.HOUR_OF_DAY, 1);
		   
		    	Integer hour = cal.get(Calendar.HOUR_OF_DAY);
		    	Integer dayOfWeek = cal.get(Calendar.DAY_OF_WEEK);
		    	 
		    	// skip days not in list
		    	if(daysOfWeek != null && !daysOfWeek.contains(dayOfWeek))
		    		continue;

		    	// skip hours not in range
		    	if(fromHour != null && toHour != null && (hour < fromHour || hour > toHour))
		    		continue;
		    	
		    	// query for specific hour
		    	TrafficStats hourData = new TrafficStats(graphName, cal.getTime(), edgeIds);
		    	
		    	// add the hour of data to current stats summary
		    	this.add(hourData);
		    }
		}
		else if (daysOfWeek != null && daysOfWeek.size() > 0){
			for(Integer day : daysOfWeek) {
				if(fromHour == null)
					fromHour = 0;
				if(toHour == null)
					toHour = 23;
				
				for(Integer hour = fromHour; hour <= toHour; hour++) {
					
					// query for specific hour and day of week
			    	TrafficStats dayHourData = new TrafficStats(graphName, day, hour, edgeIds);
			    	
			    	// add the hour of data to current stats summary
			    	this.add(dayHourData);
				}
			}
		}
		
		else if (fromHour != null && toHour != null){
			for(Integer hour = fromHour; hour <= toHour; hour++) {
				
				// query for specific hour and day of week
		    	TrafficStats dayHourData = new TrafficStats(graphName, hour, edgeIds);
		    	
		    	// add the hour of data to current stats summary
		    	this.add(dayHourData);
			}
		}
		else {
			this.add(new TrafficStats(graphName, edgeIds));
		}
		
	}
	
	public TrafficStats(String graphName, HashSet<Long> edgeIds) {
		
		this.edgeIds = edgeIds;
		
		String statsKeyBase = graphName + "_all";
		
		fetchData(statsKeyBase);
		
	}
	
	public TrafficStats(String graphName, Date d, HashSet<Long> edgeIds) {
		
		this.edgeIds = edgeIds;
		
		// query for a specific year_month_day_hour 
		
		Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(d.getTime());
        
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
		
		String statsKeyBase = graphName + "_date_" + year + "_" + month + "_" + day + "_" + hour;
		
		fetchData(statsKeyBase);
	}
	
	public TrafficStats(String graphName, Integer dayOfWeek, Integer hour, HashSet<Long> edgeIds) {
		
		this.edgeIds = edgeIds;
		
		// query for a specific year_month_day_hour 

		String statsKeyBase = graphName + "_day_" + dayOfWeek + "_" + hour;
		
		fetchData(statsKeyBase);
	}
	
	public TrafficStats(String graphName, Integer hour, HashSet<Long> edgeIds) {
		
		this.edgeIds = edgeIds;
		
		// query for a specific year_month_day_hour 

		String statsKeyBase = graphName + "_hour_" + hour;
		
		fetchData(statsKeyBase);
	}
	
	private void fetchData(String keyBase) {
		
		String countKey = keyBase + "_c";
		String speedKey = keyBase + "_s";
		
		Jedis jedisStats = jedisPool.pool.getResource();
		
		try {
			if(!jedisStats.isConnected()) {
				jedisPool.pool.returnBrokenResource(jedisStats);
				jedisStats = jedisPool.pool.getResource();
			}
			
			Map<String,String> counts = jedisStats.hgetAll(countKey);
			Map<String,String> speeds = jedisStats.hgetAll(speedKey);
			
			if(edgeIds != null && edgeIds.size() > 0) {

				for(Long id : edgeIds) {
					String idString = id.toString();
					
					if(speeds.containsKey(idString)) {
						Long speed = Long.parseLong(speeds.get(idString));
						edgeSpeedTotals.put(id, (speed / 100.0));
					}
					
					if(counts.containsKey(idString)) {
						Long count = Long.parseLong(counts.get(idString));
						edgeCounts.put(id, count);
					}
				}
			}
			else {
				
				for(String idString : speeds.keySet()) {
					Long id = Long.parseLong(idString);
					Long speed = Long.parseLong(speeds.get(idString));
					edgeSpeedTotals.put(id, (speed / 100.0));
				}
					
				for(String idString : counts.keySet()) {
					Long id = Long.parseLong(idString);
					Long count = Long.parseLong(counts.get(idString));
					edgeCounts.put(id, count);
				}
					
			}
		}
		catch (Exception e){
			Logger.error("Could not fetchData: " + e.getMessage());
		}		
		finally {
			jedisPool.pool.returnResource(jedisStats);
		}
		
		
	}
	
	public Long getTotalObservations() {
		
		Long total = 0l;
		
		for(Long edgeId : this.edgeCounts.keySet()) {
			
			if(edgeIds != null && !edgeIds.contains(edgeId))
				continue;
			else
				total += edgeCounts.get(edgeId);
		}
		
		return total;
	}
	
	public TrafficStatsResponse getEdgeSpeeds(HashSet<Long> ei) {
		
		Set<Long> selectedEdgeIds;
		
		if(ei != null)
			selectedEdgeIds = ei;
		else if(this.edgeIds!= null && edgeIds.size() > 0)
			selectedEdgeIds = this.edgeIds;
		else
			selectedEdgeIds = edgeCounts.keySet();
			
		TrafficStatsResponse response = new TrafficStatsResponse();
		
		for(Long id : selectedEdgeIds) {
			
			if(edgeSpeedTotals.containsKey(id)) {
				Double speed = edgeSpeedTotals.get(id);
				Long count = edgeCounts.get(id);
				
				response.addEdge(id,  count,  speed / count);
			}
		}
		
		return response;
		
	}
	
	public void add(TrafficStats stats){
	
		Set<Long> ids = null;
		
		if(edgeIds != null && edgeIds.size() > 0)
			ids = edgeIds;
		else
			ids = stats.edgeSpeedTotals.keySet();
		
		for(Long edgeId : ids) {
			
			if(!stats.edgeSpeedTotals.containsKey(edgeId))
				continue;
	
			if(!this.edgeSpeedTotals.containsKey(edgeId))
				this.edgeSpeedTotals.put(edgeId, 0.0);
			
			this.edgeSpeedTotals.put(edgeId, this.edgeSpeedTotals.get(edgeId) + stats.edgeSpeedTotals.get(edgeId));
		}
		
		if(edgeIds != null && edgeIds.size() > 0)
			ids = edgeIds;
		else
			stats.edgeCounts.keySet();
		
		for(Long edgeId : stats.edgeCounts.keySet()) {
			
			if(!stats.edgeCounts.containsKey(edgeId))
				continue;
			
			if(!this.edgeCounts.containsKey(edgeId))
				this.edgeCounts.put(edgeId, 0l);
			
			this.edgeCounts.put(edgeId, this.edgeCounts.get(edgeId) + stats.edgeCounts.get(edgeId));
		}
	}
	
	public static Double getEdgeSpeed(String graphName, Integer edgeId, Date d) {
		
		Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(d.getTime());
        
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
		
		
		
		String statsKeyBase = graphName + "_" + year + "_" + month + "_" + day + "_" + hour;
		
		String countKey = statsKeyBase + "_c";
		String speedKey = statsKeyBase + "_s";
		
		Jedis jedisStats = jedisPool.pool.getResource();
		
		Double speed = null;
		
		try {
		
			String countStr = jedisStats.hget(countKey, edgeId.toString());
			String speedStr = jedisStats.hget(speedKey, edgeId.toString());
			
			
			if(countStr != null && !countStr.isEmpty() && speedStr != null && speedStr.isEmpty()) {
				speed = (Double)(Long.parseLong(speedStr) / Long.parseLong(countStr) / 100.0); 
			}
			
		}
		catch (Exception e){
			Logger.error("Could not getEdgeSpeed data: " + e.getMessage());
		}	
		finally {
			jedisPool.pool.returnResource(jedisStats);
		}
		
		return speed;
	}
	
	
	public static void updateEdgeStats(String graphName, Integer edgeId, Date d, Double speed) {
		
		Jedis jedisStats = jedisPool.pool.getResource();
		
		try {
			// storing stats in keys with date_yyyy_mm_dd_hh base 
			// observation counts are stored in [key]_c while speed totals are stored in [key]_s 
			// both are hashes of edge ids
			
			jedisStats.incr(graphName + "_totalObservations");
			
			Calendar calendar = Calendar.getInstance();
	        calendar.setTimeInMillis(d.getTime());
			
			Integer year = calendar.get(Calendar.YEAR);
			Integer month = calendar.get(Calendar.MONTH);
			Integer day = calendar.get(Calendar.DAY_OF_MONTH);
			Integer hour = calendar.get(Calendar.HOUR_OF_DAY);
			Integer dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK);
			
			
			// count observations by time bucket 
			String statsKeyBase = graphName + "_date_" + year;
			jedisStats.hincrBy(statsKeyBase, month.toString(), 1);
			
			statsKeyBase += "_" + month;
			jedisStats.hincrBy(statsKeyBase, day.toString(), 1);
			
			statsKeyBase += "_" + day; 
			jedisStats.hincrBy(statsKeyBase, hour.toString(), 1);
			
			statsKeyBase += "_" + hour; 
			
			String countKey = statsKeyBase + "_c";
			String speedKey = statsKeyBase + "_s";
	
			// increment count for edgeId
			jedisStats.hincrBy(countKey, edgeId.toString(), 1);
			
			// speeds are stored as cm/s as integers for efficiency
			Long cmSpeed = Math.round(speed * 100);
			
			// increment speed
			jedisStats.hincrBy(speedKey, edgeId.toString(), cmSpeed);
			
			// store collapsed views of data too day_dow_hh_, hour_hh_ and all_  
			
			jedisStats.hincrBy(graphName + "_day_" + dayOfWeek + "_" + hour + "_s", edgeId.toString(), cmSpeed);
			jedisStats.hincrBy(graphName + "_day_" + dayOfWeek + "_" + hour + "_c", edgeId.toString(), 1);
			
			jedisStats.hincrBy(graphName + "_hour_" + hour + "_s", edgeId.toString(), cmSpeed);
			jedisStats.hincrBy(graphName + "_hour_" + hour + "_c", edgeId.toString(), 1);
			
			jedisStats.hincrBy(graphName + "_all_s", edgeId.toString(), cmSpeed);
			jedisStats.hincrBy(graphName + "_all_c", edgeId.toString(), 1);
			
			
		}
		catch (Exception e){
			Logger.error("Could not log updateEdgeStats: " + e.getMessage());
		}		
		finally {
			jedisPool.pool.returnResource(jedisStats);
		}
	}
	
	
}
