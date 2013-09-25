package com.conveyal.traffic.graph;

import com.conveyal.traffic.graph.TrafficEdge;
import com.conveyal.traffic.graph.TripLine;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.ObjectInput;
import java.io.ObjectInputStream;
import java.io.ObjectOutput;
import java.io.ObjectOutputStream;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import models.GraphEdge;
import models.PathPoint;

import org.opentripplanner.routing.algorithm.GenericAStar;
import org.opentripplanner.routing.core.RoutingRequest;
import org.opentripplanner.routing.core.TraverseMode;
import org.opentripplanner.routing.core.TraverseModeSet;
import org.opentripplanner.routing.edgetype.StreetEdge;
import org.opentripplanner.routing.graph.Edge;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.graph.Graph.LoadLevel;
import org.opentripplanner.routing.edgetype.PlainStreetEdge;
import org.opentripplanner.routing.edgetype.StreetTraversalPermission;
import org.opentripplanner.routing.graph.Vertex;
import org.opentripplanner.routing.impl.GraphServiceImpl;
import org.opentripplanner.routing.impl.StreetVertexIndexServiceImpl;
import org.opentripplanner.routing.impl.StreetVertexIndexServiceImpl.CandidateEdgeBundle;
import org.opentripplanner.routing.spt.GraphPath;
import org.opentripplanner.routing.spt.ShortestPathTree;

import com.google.common.base.Preconditions;
import com.google.common.collect.Iterables;
import com.google.common.collect.Lists;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Envelope;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.index.strtree.STRtree;

import controllers.Application;
import gov.sandia.cognition.math.matrix.Vector;
import gov.sandia.cognition.math.matrix.VectorFactory;

import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericApplicationContext;

import play.Logger;
import play.Play;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.JedisPool;
import util.GeoUtils;
import util.ProjectedCoordinate;

public class TrafficGraph {

	private final static RoutingRequest defaultOptions = new RoutingRequest(new TraverseModeSet(TraverseMode.CAR));
	
	public static double TRIPLINE_LENGTH = 20;
	public static double TRIPLINE_OFFSET = 5; 
	
	public Long nextVehicleId = 100l; 
	public Long vehicleUpdateCount = 0l;
	public Date vehicleUpdateTimer;
	
	private File trafficGraphFile;
	
	private Graph graph;
	private StreetVertexIndexServiceImpl indexService;
	
	private TrafficEdgeIndex teIndex = null;
	private PathStatisticsIndex psIndex = new PathStatisticsIndex();
	
	private HashMap<Integer, TrafficEdge> trafficEdgeMap = null;

	//private ConcurrentHashMap<Integer, TrafficEdgeStats> trafficStats = new ConcurrentHashMap<Integer, TrafficEdgeStats>(8, 0.9f, 1);
	
	private ConcurrentHashMap<Long, VehicleState> vehicles = new ConcurrentHashMap<Long, VehicleState>(8, 0.9f, 1);
	private ConcurrentHashMap<String, Long> vehicleIds = new ConcurrentHashMap<String, Long>(8, 0.9f, 1);
	private ConcurrentHashMap<Long, Long> vehicleUpdateLock = new ConcurrentHashMap<Long, Long>(8, 0.9f, 1);
	
	public RoutingRequest getOptions() {
		return defaultOptions;
	}
	
	public static TrafficGraph load(String path) {
		
		try {
			TrafficGraph g = new TrafficGraph();
			
			Logger.info("Loading graph: " + path);
			
			File otpGraphFile = new File(path, "Graph.obj");
			
			g.graph = Graph.load(otpGraphFile, LoadLevel.DEBUG);
			g.indexService = new StreetVertexIndexServiceImpl(g.graph);
			
			g.trafficGraphFile = new File(path, "Traffic.obj");
			
			if(g.trafficGraphFile.exists()) {
				Logger.info("Loading TrafficGraph: " + path);

				
				try {
					InputStream file = new FileInputStream(g.trafficGraphFile);
					InputStream buffer = new BufferedInputStream( file );
					ObjectInput input = new ObjectInputStream ( buffer );
					try {
						g.trafficEdgeMap = (HashMap<Integer, TrafficEdge>)input.readObject();
						g.psIndex = (PathStatisticsIndex)input.readObject();
						Logger.info(g.trafficEdgeMap.size() + " TrafficEdges...");
						
					}
					finally {
						input.close();
					}
				}
				catch(Exception e) {
					Logger.info("Failed to load TrafficGraph: " + e.toString());
					e.printStackTrace();
					g.trafficEdgeMap = null;
				}
				
			}
			
			if(g.trafficEdgeMap == null) {
				
				build(g);
				
				save(g);
			}
			
			g.indexTrafficEdges();
			
			return g;
			
		}
		catch(Exception e) {
			e.printStackTrace();
			 
			return null;
		}
	}
	
	public static void build(TrafficGraph g) {
	
		// rebuild missing map
		
		g.trafficEdgeMap = new HashMap<Integer, TrafficEdge>();
		
		Logger.info("Building TrafficEdges...");
		
		for (final Vertex v : g.graph.getVertices()) {

			for (final Edge e : v.getOutgoing()) {
				
				// only graph PSEs that can be traversed by cars
				if(e instanceof PlainStreetEdge && !((PlainStreetEdge)e).canTraverse(defaultOptions))
					continue;
				
				TrafficEdge te = new TrafficEdge((PlainStreetEdge)e, g.graph, defaultOptions);
				
				final Geometry geometry = te.getGeometry();
				if (geometry != null) {
					if (g.trafficEdgeMap != null) {
						g.trafficEdgeMap.put(te.getId(), te);
			           
					}
          
					//if (graph.getIdForEdge(e) != null) {
					//	final Envelope envelope = geometry.getEnvelopeInternal();
					//	edgeIndex.insert(envelope, e);
					//}
				}
			}
		}
		
		Logger.info("Created " + g.trafficEdgeMap.size() + " TrafficEdges.");
		
		g.buildTripLines();
	
	}
	
	public static void save(TrafficGraph g) {
		
		//g.saveTripLines();
		
		try{
			 
			Logger.info("Writing TrafficGraph");
			 
		    OutputStream file = new FileOutputStream(g.trafficGraphFile);
		    OutputStream buffer = new BufferedOutputStream( file );
		    ObjectOutput output = new ObjectOutputStream( buffer );
		    try{
		    	output.writeObject(g.trafficEdgeMap);
		    	output.writeObject(g.psIndex);
		    }
		    finally{
		    	output.close();
		    }
		}  
		catch(IOException e){
			Logger.info("Failed to write TrafficGraph: " + e.toString());
			e.printStackTrace();
		}
	}
	
	public TrafficGraph()
	{

	}
	
	public TrafficEdgeIndex getTraffEdgeIndex() {
		return teIndex;
	}
	
	public TrafficEdge getTrafficEdge(Integer id) {
		return trafficEdgeMap.get(id);
	}
	
	public void updatePaths(LinkedList<TrafficEdgeTraversal> path) {
		
		psIndex.update(path);
		
	}
	
	public void updateEdgeSpeed (Integer edgeId, Date d, Double speed) {
		
		Jedis jedisStats = Application.jedisPool.getResource();
		
		// storing stats in keys with yyyy_mm_dd_hh base 
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
		String statsKeyBase = year.toString();
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
		
		if(dayOfWeek.equals(Calendar.SATURDAY) || dayOfWeek.equals(Calendar.SUNDAY)) {
			jedisStats.hincrBy("weekend_" + hour + "_s", edgeId.toString(), cmSpeed);
			jedisStats.hincrBy("weekend_" + hour + "_c", edgeId.toString(), 1);
			
			jedisStats.incrBy("weekend_" + hour + "_s", cmSpeed);
			jedisStats.incr("weekend_" + hour + "_c");
		}
		else {
			jedisStats.hincrBy("weekday_" + hour + "_s", edgeId.toString(), cmSpeed);
			jedisStats.hincrBy("weekday_" + hour + "_c", edgeId.toString(), 1);
			
			jedisStats.incrBy("weekday_" + hour + "_s", cmSpeed);
			jedisStats.incr("weekday_" + hour + "_c");
		}
		
		jedisStats.hincrBy("cumulative_" + hour + "_s", edgeId.toString(), cmSpeed);
		jedisStats.hincrBy("cumulative_" + hour + "_c", edgeId.toString(), 1);
		
		jedisStats.incrBy("cumulative_" + hour + "_s", cmSpeed);
		jedisStats.incr("cumulative_" + hour + "_c");
		
		Application.jedisPool.returnResource(jedisStats);
		
	}
	
	public Double getEdgeSpeed(Integer edgeId, Date d) {
		
		Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(d.getTime());
        
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
		
		Jedis jedisStats = Application.jedisPool.getResource();
		
		String statsKeyBase = year + "_" + month + "_" + day + "_" + hour;
		
		String countKey = statsKeyBase + "_c";
		String speedKey = statsKeyBase + "_s";
		
		String countStr = jedisStats.hget(countKey, edgeId.toString());
		String speedStr = jedisStats.hget(speedKey, edgeId.toString());
		
		Application.jedisPool.returnResource(jedisStats);
		
		Double speed = null;
		
		if(countStr != null && !countStr.isEmpty() && speedStr != null && speedStr.isEmpty()) {
			speed = (Double)(Long.parseLong(speedStr) / Long.parseLong(countStr) / 100.0); 
		}
		
		return speed;
	}
	
	public Map<Long,Double> getCumulativeGraphSpeed(int minHour, int maxHour) {
		
		Jedis jedisStats = Application.jedisPool.getResource();
		
		HashMap<Long,Double> edgeSpeedTotals = new HashMap<Long,Double>();
		HashMap<Long,Long> edgeCounts = new HashMap<Long,Long>();
		
		for(int h = minHour; h <= maxHour; h++) {
			
			String statsKeyBase = "cumulative_" + h;
			
			String countKey = statsKeyBase + "_c";
			String speedKey = statsKeyBase + "_s";
			
			Map<String,String> counts = jedisStats.hgetAll(countKey);
			Map<String,String> speeds = jedisStats.hgetAll(speedKey);
			
			for(String k : counts.keySet()) {
		
				Long edgeId = Long.parseLong(k);
				Long count = Long.parseLong(counts.get(k));
				
				Long speed = Long.parseLong(speeds.get(k));
				
				edgeSpeedTotals.put(edgeId, edgeSpeedTotals.get(edgeId) + (speed / 100.0));
				edgeCounts.put(edgeId, edgeCounts.get(edgeId) + count);
			}

		}
		
		Application.jedisPool.returnResource(jedisStats);
		
		HashMap<Long,Double> edgeSpeeds = new HashMap<Long,Double>();
		
		for(Long edgeId : edgeCounts.keySet()) {
		
			edgeSpeeds.put(edgeId, edgeSpeedTotals.get(edgeId) / edgeCounts.get(edgeId));
		}
	
		return edgeSpeeds;
	}
	
	
	public Map<Long,Double> getGraphSpeed(Date d) {
		
		Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(d.getTime());
        
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
		
		Jedis jedisStats = Application.jedisPool.getResource();
		
		String statsKeyBase = year + "_" + month + "_" + day + "_" + hour;
		
		String countKey = statsKeyBase + "_c";
		String speedKey = statsKeyBase + "_s";
		
		Map<String,String> counts = jedisStats.hgetAll(countKey);
		Map<String,String> speeds = jedisStats.hgetAll(speedKey);
		
		Application.jedisPool.returnResource(jedisStats);

		HashMap<Long,Double> edgeSpeeds = new HashMap<Long,Double>();
		
		for(String k : counts.keySet()) {
	
			Long edgeId = Long.parseLong(k);
			Long count = Long.parseLong(counts.get(k));
			
			Long speed = Long.parseLong(speeds.get(k));
			
			edgeSpeeds.put(edgeId, ((speed / 100.0) / count));
		}

		return edgeSpeeds;
	}

	public Double getGraphSpeedSum(Date d) {
		
		Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(d.getTime());
        
        int year = calendar.get(Calendar.YEAR);
        int month = calendar.get(Calendar.MONTH);
        int day = calendar.get(Calendar.DAY_OF_MONTH);
        int hour = calendar.get(Calendar.HOUR_OF_DAY);
		
		Jedis jedisStats = Application.jedisPool.getResource();
		
		String statsKeyBase = year + "_" + month + "_" + day + "_" + hour;
		
		String countKey = statsKeyBase + "_c";
		String speedKey = statsKeyBase + "_s";
		
		Map<String,String> counts = jedisStats.hgetAll(countKey);
		Map<String,String> speeds = jedisStats.hgetAll(speedKey);
		
		Application.jedisPool.returnResource(jedisStats);
		
		Double speed = null;
		
		HashMap<Long,Long> edgeCounts = new HashMap<Long,Long>();
		HashMap<Long,Double> edgeSpeeds = new HashMap<Long,Double>();
		
		for(String k : counts.keySet()) {
			
			Long edgeId = Long.parseLong(k);
			String v = counts.get(k);
			
			if(k != null && !k.isEmpty() && v != null && v.isEmpty()) {
				
				Long count = Long.parseLong(v);
				
				if(!edgeCounts.containsKey(edgeId))
					edgeCounts.put(edgeId, 0l);
					
				edgeCounts.put(edgeId, edgeCounts.get(edgeId) + count);				
				
			}
		}
		
		for(String k : speeds.keySet()) {
			
			String v = speeds.get(k);
			
			if(k != null && !k.isEmpty() && v != null && v.isEmpty()) {
				Long edgeId = Long.parseLong(k);
				Double speedTotal = (Long.parseLong(v) / 100.0);
				
				if(!edgeSpeeds.containsKey(edgeId))
					edgeSpeeds.put(edgeId, 0.0);
					
				edgeSpeeds.put(edgeId, (edgeCounts.get(edgeId) + speedTotal));				
				
			}
		}
		
		return speed;
	}
	
	public Long getVehicleId(String imei) {
		if(!vehicleIds.containsKey(imei))
			vehicleIds.put(imei, nextVehicleId++);
		
		return vehicleIds.get(imei);
	}
	
	public Long getVehicleUpdateLock(Long vehicleId) {
		
		if(!vehicleUpdateLock.contains(vehicleId))
			vehicleUpdateLock.put(vehicleId, new Long(0l));
		
		return vehicleUpdateLock.get(vehicleId);
	}
	
	public Integer getVehicleCount() {
		return this.vehicles.size();
	}
	
	public void updateVehicle(Long vehicleId, VehicleObservation observation) {
		
		if(vehicleUpdateTimer == null) {
			vehicleUpdateTimer = new Date();
		}
		
		if(!vehicles.containsKey(vehicleId))
			vehicles.put(vehicleId, new VehicleState(vehicleId, this));
		
		try {
			vehicles.get(vehicleId).updatePosition(observation);
		} 
		catch (ObservationOutOfOrderException e) {
			// update out of order, skipping...
			Logger.warn("Vehicle update out of order: " + e.toString());
		}
		
		if(vehicleUpdateCount % 1000 == 0){
			vehicleUpdateCount = 0l;
			
			Date currentTime = new Date();
			
			//Logger.info("Updates/sec: " + (vehicleUpdateCount / ((currentTime.getTime() + 1000 - (vehicleUpdateTimer.getTime())) / 1000)));
			
			vehicleUpdateTimer = currentTime;
		}
		
		vehicleUpdateCount++;
	}
	
	public Coordinate getRandomPoint() {
		
		int pos = (int)(Math.floor((trafficEdgeMap.values().size() * (float)Math.random())));
		TrafficEdge[] tes = trafficEdgeMap.values().toArray(new TrafficEdge[1]);
		return tes[pos].getGeometry().getCoordinateN(0);
	}
	
	public List<Integer> getEdgesBetweenPoints(Coordinate fromCoord, Coordinate toCoord) {
		
		final RoutingRequest options = TrafficGraph.defaultOptions;
		
		CandidateEdgeBundle fromEdges = indexService.getClosestEdges(fromCoord, options, null, null, false);
		CandidateEdgeBundle toEdges = indexService.getClosestEdges(toCoord, options, null, null, false);
    
		GenericAStar astar = new GenericAStar();
		final RoutingRequest req = new RoutingRequest(options.getModes());

		final Vertex fromVertex = fromEdges.best.edge.getFromVertex();
		final Vertex toVertex = toEdges.best.edge.getFromVertex();
    
		req.setRoutingContext(graph, fromVertex, toVertex);
    
		ShortestPathTree tree = astar.getShortestPathTree(req);
		tree.getPaths().get(0);
		GraphPath result = tree.getPaths().get(0);
		
		List<Integer> edgeIds = Lists.newArrayList();
    
		for (Edge edge : result.edges) {
			Integer id = graph.getIdForEdge(edge);
			if (id != null)
				edgeIds.add(id);
		}
		
		return edgeIds;
	}
	
	public LineString getPathForEdges(List<Integer> edges, Double spacing, Double error) {
		List<Coordinate> coordList = new ArrayList<Coordinate>();
		
		Double remainingDistance = 0.0;	
		ProjectedCoordinate previousPc = null;
		
		for(Integer edgeId : edges) {
			
			for(Coordinate originalCoord : trafficEdgeMap.get(edgeId).getGeometry().getCoordinates()) {
				
				ProjectedCoordinate currentPc = GeoUtils.convertLonLatToEuclidean(originalCoord);
				
				if(previousPc != null) {
					
					double segmentDistance = previousPc.distance(currentPc);
					double segmentPosition = 0.0;
					
					int numPoints = (int)Math.floor((segmentDistance + remainingDistance)  / spacing);
				
					ProjectedCoordinate point = null;
					
					for(int i = 1; i <= numPoints; i++) {
						
						segmentPosition = (i * spacing) - remainingDistance;
						
						point = GeoUtils.calcPointAlongLine(previousPc, currentPc, segmentPosition);
					
						double pointErrorDistance = error * (1 - Math.log10(Math.random() * 10));
						double pointErrorAngle = GeoUtils.RADIANS * Math.random();
						
						point.x = point.x + pointErrorDistance * Math.cos(pointErrorAngle);
						point.y = point.y + pointErrorDistance * Math.sin(pointErrorAngle);
						
						coordList.add(GeoUtils.convertToLonLat(point));
						
					}
					
					if(point != null)
						remainingDistance = segmentDistance - segmentPosition;
					else
						remainingDistance = segmentDistance + remainingDistance;
						
				}
				
				previousPc = currentPc;
				
				
				/*if(previousPc != null) {
					
					if(previousPc.distance(currentPc) + remainingDistance < spacing) {
						remainingDistance += previousPc.distance(currentPc);
					}
					else {
						
						double pointDistance = (remainingDistance + previousPc.distance(currentPc));
						
						int numPoints = (int)Math.floor(pointDistance / spacing);
						
						ProjectedCoordinate point = null;
						
						double totalSegmentDistance = (numPoints * spacing) - remainingDistance;
						
						for(int i = 1; i <= numPoints; i++) {
							
							point = GeoUtils.calcPointAlongLine(previousPc, currentPc, (i * spacing) - remainingDistance);
							coordList.add(GeoUtils.convertToLonLat(point));
							remainingDistance = 0.0;
						}
						
						if(point != null)
							remainingDistance = previousPc.distance(currentPc) - totalSegmentDistance;
						else
							remainingDistance = previousPc.distance(currentPc) + remainingDistance;
					}
				}
				previousPc = currentPc;*/
			}
		}
		
		Coordinate[] coords = coordList.toArray(new Coordinate[1]);
		
		return GeoUtils.geometryFactory.createLineString(coords);
	}
	
	
	public LineString getPathForEdges(List<Integer> edges) {
		List<Coordinate> coordList = new ArrayList<Coordinate>();

		for(Integer edgeId : edges) {
			
			for(Coordinate originalCoord : trafficEdgeMap.get(edgeId).getGeometry().getCoordinates()) {
				coordList.add(originalCoord);
			}
		}
		
		Coordinate[] coords = coordList.toArray(new Coordinate[1]);
		
		return GeoUtils.geometryFactory.createLineString(coords);
	}
	
	private void saveTripLines() {
		
		Logger.info("Saving trip lines...");

		for(TrafficEdge te : trafficEdgeMap.values()) {
			te.save();
		}
	}
	
	private void buildTripLines() {
		
		Logger.info("Building trip lines...");
		
		Integer validTripLineEdges = 0;
		Integer invalidTripLineEdges = 0;
		
		for(TrafficEdge te : trafficEdgeMap.values()) {
			try {
				te.buildTripLines();
				
				validTripLineEdges++;
			}
			catch(TripLineException tle) {
				// invalid edge for trip lines
				
				// need include skiped edges for traversal to link longer edges !!! 
				
				invalidTripLineEdges++;
			}
		}
		
		Logger.info(validTripLineEdges + " TrafficEdges with trip lines (" + invalidTripLineEdges + " invalid TEs)");
	}
	
	private void indexTrafficEdges() {
		
		Logger.info("Indexing trip lines...");
		
		List<TrafficEdge> tes = new ArrayList<TrafficEdge>();
		
		for(TrafficEdge te : trafficEdgeMap.values()) {
			tes.add(te);
		}
		
		teIndex = new TrafficEdgeIndex(tes);
		
	}
}
