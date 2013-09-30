package controllers;

import play.*;
import play.mvc.*;
import redis.clients.jedis.BinaryJedis;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import util.GeoUtils;
import util.MapEventData;
import util.MapListener;
import util.ProjectedCoordinate;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.*;

import jobs.QueueSubscriberJob;
import models.*;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.opentripplanner.routing.impl.GraphServiceImpl;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.graph.Graph.LoadLevel;
import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericApplicationContext;

import com.conveyal.traffic.graph.MovementEdge;
import com.conveyal.traffic.graph.StatsPool;
import com.conveyal.traffic.graph.TrafficGraph;
import com.conveyal.traffic.graph.TrafficStats;
import com.conveyal.traffic.graph.TrafficStatsResponse;
import com.conveyal.traffic.graph.VehicleObservation;
import com.conveyal.traffic.graph.VehicleState;
import com.typesafe.config.ConfigFactory;
import com.vividsolutions.jts.geom.Coordinate;
import com.conveyal.trafficprobe.TrafficProbeProtos;


public class Application extends Controller {
	
	public static TrafficGraph graph = TrafficGraph.load(Play.configuration.getProperty("application.otpGraphPath"));
	
	public static MapListener mapListeners = new MapListener();
	
	public static StatsPool jedisPool = new StatsPool();

	public static void loadCsv(File csvFile) throws IOException {
		
		// reads a csv file in and pushes to redis
		// format:  device_id,seconds/millisecons,lat,lon

		BufferedReader br = new BufferedReader(new FileReader(csvFile));
		String line;

		HashMap<String, Long> timeCorrection = new HashMap<String, Long>();
		HashMap<String, Long> lastTime = new HashMap<String, Long>();

		TrafficProbeProtos.LocationUpdate.Builder locationUpdateBuilder = null;
		
		String lastImei = "";
		Integer updateSize = 0;
		
		BinaryJedis jedis = jedisPool.pool.getResource();
		
		try {
			while ((line = br.readLine()) != null) {
				try {
					String[] lineParts = line.split(",");
		
				    String imei = lineParts[0].trim();
				    
				    if(locationUpdateBuilder == null) {
				    	locationUpdateBuilder = TrafficProbeProtos.LocationUpdate.newBuilder();
				    }
				    else if(!imei.equals(lastImei) || updateSize > 10) {
				    	
				    	// flush updates 
				    	
				    	jedis.rpush("queue".getBytes(), locationUpdateBuilder.build().toByteArray());
				    	
				    	locationUpdateBuilder = TrafficProbeProtos.LocationUpdate.newBuilder();
				    	
				    	updateSize = 0;
				    }
				    
			    	if(!lastTime.containsKey(imei)) {
				    	lastTime.put(imei, 0l);
				    	timeCorrection.put(imei, 0l);
				    }
			    	Long ms = null;
			    		
				    try {
				    	ms = Long.parseLong(lineParts[1].trim());
				    } 
				    catch(NumberFormatException ne) {
				    	Double secondsDouble = Double.parseDouble(lineParts[1].trim());
				    	ms = secondsDouble.longValue() * 1000;
				    }
				    
				    // convert to milliseconds if in seconds
				    if(ms < 10000000000l)
				    	ms = ms * 1000;
				    
				    // correct times on sequence values missing increment without location updates
				    if(lastTime.get(imei).equals(ms)) {
				    	Long tc = timeCorrection.get(imei);
				    	tc += 5000;
				    	ms += tc;
				    	timeCorrection.put(imei, tc);
				    }
				    else {
				    	timeCorrection.put(imei, 0l);
				    	lastTime.put(imei, ms);
				    }
				    
				    Long lt = lastTime.get(imei);
				    
				    Double lat = Double.parseDouble(lineParts[2].trim());
					Double lon = Double.parseDouble(lineParts[3].trim());
					
					TrafficProbeProtos.LocationUpdate.Location.Builder locationBuilder = TrafficProbeProtos.LocationUpdate.Location.newBuilder();
					    
					locationBuilder.setLat(lat.floatValue());
					locationBuilder.setLon(lon.floatValue());
					
					Long timeOffset = ms - lt;
					
					// protocol buffer def assumes timeOffset in milliseconds is within bound of int32
					locationBuilder.setTimeoffset((int)(long)timeOffset);
		
					locationUpdateBuilder.addLocation(locationBuilder);
					
					Long vehicleId = Application.graph.getVehicleId(imei);
					
					locationUpdateBuilder.setPhone(vehicleId);
					locationUpdateBuilder.setTime(ms);
					
					Date time = new Date(ms);
					
					Logger.info(imei + "," + time  + "," + lat  + "," + lon);
								
					lastImei = imei;
				    updateSize++;
				}
				catch(Exception e) {
					Logger.warn("Couldn't parse CSV line: " + line);
				}
			}
			
			// flush updates
			if(updateSize > 0) 
				jedis.rpush("queue".getBytes(), locationUpdateBuilder.build().toByteArray());
			
		}	
		finally {
			
			jedisPool.pool.returnResource(jedis);
			
			br.close();

		}
		


		data();
    }

	public static void index() {
		
		render();
		 
	}
	
	public static void trafficStats(String edgeIds, String daysOfWeek, Long fromDate, Long toDate, Integer minHour, Integer maxHour){
		
		Http.Header hd = new Http.Header();
    	
    	hd.name = "Access-Control-Allow-Origin";
    	hd.values = new ArrayList<String>();
    	hd.values.add("*");
		
		HashSet<Long> filteredEdges = null;
		
		if(edgeIds != null) {
			String[] ids = edgeIds.split(",");
			
			if(ids.length > 0) {
				filteredEdges = new HashSet<Long>();
				for(String id : ids) {
					filteredEdges.add(Long.parseLong(id));
				}
			}
		}
		
		HashSet<Integer> days = null;
		
		if(daysOfWeek != null) {
			String[] dayArray = daysOfWeek.split(",");
			
			if(dayArray.length > 0) {
				filteredEdges = new HashSet<Long>();
				for(String day : dayArray) {
					days.add(Integer.parseInt(day));
				}
			}
		}
		
		Date from = null;
		
		if(fromDate != null) 
			from = new Date(fromDate);
		
		Date to = null;
		
		if(toDate != null) 
			to = new Date(toDate);
			
		TrafficStats stats = new TrafficStats(from, to, days, minHour, maxHour, filteredEdges);
		
		TrafficStatsResponse response = stats.getEdgeSpeeds(null);
	
		renderJSON(response);
	}
	
	public static void data() {

		Jedis jedis = jedisPool.pool.getResource();
		
		try {
		
			Long unprocessedLocationUpdates = jedis.llen("queue");
			
			Long totalLocationUpdates = 0l;
			if(jedis.get("totalLocationUpdates") != null) 
				totalLocationUpdates = Long.parseLong(jedis.get("totalLocationUpdates"));
		
			String processingRate = jedis.get("processingRate");
			
			Long totalObservations = 0l;
			if(jedis.get("totalObservations") != null) 
				totalObservations = Long.parseLong(jedis.get("totalObservations"));
			
			Integer vehicleCount = graph.getVehicleCount();
			
			Double observationsPerUpdate = 0.0;
			
			if(totalLocationUpdates != 0l)
				observationsPerUpdate = (double) (totalObservations / totalLocationUpdates);
			
			render(unprocessedLocationUpdates, totalLocationUpdates, processingRate, totalObservations, vehicleCount, observationsPerUpdate);
		}
		finally {
			jedisPool.pool.returnResource(jedis);
		}
		
	}
	
	public static void simulator() {
		
		render();
		 
	}

	public static void paths() {
		
		render();
		 
	}
	
    public static void simulate() {
    	
    	Coordinate coord1 = graph.getRandomPoint();
    	Coordinate coord2 = graph.getRandomPoint();
   
    	List<Integer> edges = graph.getEdgesBetweenPoints(coord1, coord2);
    	
    	MapEventData med = new MapEventData();
		
		med.message = "";
		med.type = "simulatePath";
		med.geom = graph.getPathForEdges(edges);

		ObjectMapper mapper = new ObjectMapper();
	
		try {
			String event = mapper.writeValueAsString(med);
			MapEvent.instance.event.publish(event);
		}
		catch(Exception e) {
			e.printStackTrace();
		}
    	
    	VehicleState vs = new VehicleState((long)1, graph);
    	vs.simulateUpdatePosition(edges, 15.0);
    	
        ok();
    }
    
    public static void metadata() {
    	ok();
    }

    
    public static void edges()
	{
		/*Multimap<Geometry, Edge> edgeMap = graph.getGeomEdgeMap();

		for(Edge edge : edgeMap.values())
		{
			Integer edgeId = graph.getInferredEdge(edge).getEdgeId();

			MathTransform transform;

		    try {
		    	transform = GeoUtils.getTransform(new Coordinate(38.90911, -77.00932)).inverse();

		    	if (graph.getEdge(edgeId).getGeometry() != null)
		    	{
			        Coordinate[] oldCoords = graph.getEdge(edgeId).getGeometry().getCoordinates();
			        int nCoords = oldCoords.length;
			        Coordinate[] newCoords = new Coordinate[nCoords];

			        for (int i = 0; i < nCoords - 1; ++i) {
			            Coordinate coord0 = oldCoords[i];
			            Coordinate coord1 = oldCoords[i+1];

			            double dx = coord1.x - coord0.x;
			            double dy = coord1.y - coord0.y;

			            double length = Math.sqrt(dx * dx + dy * dy);

			            Coordinate c0 = new Coordinate(coord0.x - OFFSET * dy / length, coord0.y - OFFSET * dx / length);
			            Coordinate c1 = new Coordinate(coord1.x - OFFSET * dy / length, coord1.y - OFFSET * dx / length);
			            newCoords[i] = c0;
			            newCoords[i+1] = c1; //will get overwritten except at last iteration
			        }

				    final Geometry transformed = JTS.transform( gf.createLineString(newCoords), transform);
				    transformed.setSRID(4326);


				    List<String> points = new ArrayList<String>();

		        	for(Coordinate coord : transformed.getCoordinates())
		        	{
		        		points.add(new Double(coord.x).toString() + " " + new Double(coord.y).toString());

		        	}

		        	String linestring = "LINESTRING(" + StringUtils.join(points, ", ") + ")";

				    Query idQuery = StreetEdge.em().createNativeQuery("SELECT NEXTVAL('hibernate_sequence');");
			    	BigInteger nextId = (BigInteger)idQuery.getSingleResult();

			    	StreetEdge.em().createNativeQuery("INSERT INTO streetedge (id, edgeid, shape)" +
			        	"  VALUES(?, ?, ST_GeomFromText( ?, 4326));")
			          .setParameter(1,  nextId)
			          .setParameter(2,  edgeId)	            
			          .setParameter(3,  linestring)
			          .executeUpdate();

		    	}
		    }
		    catch(Exception e)
		    {
		    	Logger.error("Can't transform geom.");
		    }

		}*/
	}


}
