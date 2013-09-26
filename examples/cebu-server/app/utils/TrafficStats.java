package utils;

import java.lang.reflect.Array;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import controllers.Application;

public class TrafficStats {
	
	private static JedisPool jedisPool = new JedisPool("localhost");
	// a data model for fast storage and retrieval of summarized views of observations by edge
	
	private HashMap<Long,Double> edgeSpeedTotals = new HashMap<Long,Double>();
	private HashMap<Long,Long> edgeCounts = new HashMap<Long,Long>();
	
	HashSet<Long> edgeIds;
	
	public TrafficStats(Date fromDate, Date toDate, HashSet<Integer> daysOfWeek, Integer fromHour, Integer toHour, HashSet<Long> edgeIds) {
				
		this.edgeIds = edgeIds;
		
		if(fromDate != null && toDate != null) {
			
			// attempt a date based query -- slowest approach
			
			Calendar cal = Calendar.getInstance(); 
		    cal.setTime(fromDate); 
		    
		    while(cal.before(toDate)) {
		    
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
		    	TrafficStats hourData = new TrafficStats(cal.getTime());
		    	
		    	// add the hour of data to current stats summary
		    	this.add(hourData);
		    }
		}
		else if (daysOfWeek != null){
			for(Integer day : daysOfWeek) {
				for(Integer hour = fromHour; hour <= toHour; hour++) {
					
					// query for specific hour and day of week
			    	TrafficStats dayHourData = new TrafficStats(day, hour);
			    	
			    	// add the hour of data to current stats summary
			    	this.add(dayHourData);
				}
			}
		}
		
		else if (fromHour != null && toHour != null){
			for(Integer hour = fromHour; hour <= toHour; hour++) {
				
				// query for specific hour and day of week
		    	TrafficStats dayHourData = new TrafficStats(hour);
		    	
		    	// add the hour of data to current stats summary
		    	this.add(dayHourData);
			}
		}
		else {
			this.add(new TrafficStats());
		}
		
	}
	
	public TrafficStats() {
		
		String statsKeyBase = "all";
		
		fetchData(statsKeyBase);
		
	}
	
	public TrafficStats(Date d) {
		// query for a specific year_month_day_hour 
		
		Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(d.getTime());
        
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
		
		String statsKeyBase = year + "_" + month + "_" + day + "_" + hour;
		
		fetchData(statsKeyBase);
	}
	
	public TrafficStats(Integer dayOfWeek, Integer hour) {
		// query for a specific year_month_day_hour 

		String statsKeyBase = "day_" + dayOfWeek + "_" + hour;
		
		fetchData(statsKeyBase);
	}
	
	public TrafficStats(Integer hour) {
		// query for a specific year_month_day_hour 

		String statsKeyBase = "hour_" + hour;
		
		fetchData(statsKeyBase);
	}
	
	private void fetchData(String keyBase) {
		
		String countKey = keyBase + "_c";
		String speedKey = keyBase + "_s";
		
		Jedis jedisStats = jedisPool.getResource();
		
		Map<String,String> counts = jedisStats.hgetAll(countKey);
		Map<String,String> speeds = jedisStats.hgetAll(speedKey);
		
		jedisPool.returnResource(jedisStats);
		
		if(edgeIds != null) {

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
	
	public Map<Long,Double> getEdgeSpeeds(HashSet<Long> ei) {
		
		Set<Long> selectedEdgeIds;
		
		if(ei != null)
			selectedEdgeIds = ei;
		else if(this.edgeIds!= null)
			selectedEdgeIds = this.edgeIds;
		else
			selectedEdgeIds = edgeCounts.keySet();
			
		HashMap<Long,Double> speeds = new HashMap<Long,Double>();
			
		for(Long id : selectedEdgeIds) {
			
			if(edgeSpeedTotals.containsKey(id)) {
				Double speed = edgeSpeedTotals.get(id);
				Long count = edgeCounts.get(id);
				
				speeds.put(id, (speed / count));	
			}
		}
		
		return speeds;
		
	}
	
	public void add(TrafficStats stats){
	
		Set<Long> ids = null;
		
		if(edgeIds != null)
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
		
		if(edgeIds != null)
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
	
	public static Double getEdgeSpeed(Integer edgeId, Date d) {
		
		Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(d.getTime());
        
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
		
		Jedis jedisStats = jedisPool.getResource();
		
		String statsKeyBase = year + "_" + month + "_" + day + "_" + hour;
		
		String countKey = statsKeyBase + "_c";
		String speedKey = statsKeyBase + "_s";
		
		String countStr = jedisStats.hget(countKey, edgeId.toString());
		String speedStr = jedisStats.hget(speedKey, edgeId.toString());
		
		jedisPool.returnResource(jedisStats);
		
		Double speed = null;
		
		if(countStr != null && !countStr.isEmpty() && speedStr != null && speedStr.isEmpty()) {
			speed = (Double)(Long.parseLong(speedStr) / Long.parseLong(countStr) / 100.0); 
		}
		
		return speed;
	}
	
	
	public static void updateEdgeStats(Integer edgeId, Date d, Double speed) {
		
		Jedis jedisStats = jedisPool.getResource();
		
		// storing stats in keys with date_yyyy_mm_dd_hh base 
		// observation counts are stored in [key]_c while speed totals are stored in [key]_s 
		// both are hashes of edge ids
		
		jedisStats.incr("totalObservations");
		
		Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(d.getTime());
		
		Integer year = calendar.get(Calendar.YEAR);
		Integer month = calendar.get(Calendar.MONTH);
		Integer day = calendar.get(Calendar.DAY_OF_MONTH);
		Integer hour = calendar.get(Calendar.HOUR_OF_DAY);
		Integer dayOfWeek = calendar.get(Calendar.DAY_OF_WEEK);
		
		
		// count observations by time bucket 
		String statsKeyBase = "date_" + year;
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
		
		jedisStats.hincrBy("day_" + dayOfWeek + "_" + hour + "_s", edgeId.toString(), cmSpeed);
		jedisStats.hincrBy("day_" + dayOfWeek + "_" + hour + "_c", edgeId.toString(), 1);
		
		jedisStats.hincrBy("hour_" + hour + "_s", edgeId.toString(), cmSpeed);
		jedisStats.hincrBy("hour_" + hour + "_c", edgeId.toString(), 1);
		
		jedisStats.hincrBy("all_s", edgeId.toString(), cmSpeed);
		jedisStats.hincrBy("all_c", edgeId.toString(), 1);
		
		jedisPool.returnResource(jedisStats);
	}
}
