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
import utils.GeoUtils;
import utils.ProjectedCoordinate;

public class TrafficGraph {

	private final static RoutingRequest defaultOptions = new RoutingRequest(new TraverseModeSet(TraverseMode.CAR));
	
	public static double TRIPLINE_LENGTH = 30;
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
	
	public TrafficGraph(String path) {
		
		if(path != null)
			this.load(path);

	}
	
	public RoutingRequest getOptions() {
		return defaultOptions;
	}
	
	public void load(String path) {
		
		try {
			
			Logger.info("Loading graph: " + path);
			
			File otpGraphFile = new File(path, "Graph.obj");
			
			this.graph = Graph.load(otpGraphFile, LoadLevel.DEBUG);
			this.indexService = new StreetVertexIndexServiceImpl(this.graph);
			
			this.trafficGraphFile = new File(path, "Traffic.obj");
			
			if(this.trafficGraphFile.exists()) {
				Logger.info("Loading TrafficGraph: " + path);

				
				try {
					InputStream file = new FileInputStream(this.trafficGraphFile);
					InputStream buffer = new BufferedInputStream( file );
					ObjectInput input = new ObjectInputStream ( buffer );
					try {
						this.trafficEdgeMap = (HashMap<Integer, TrafficEdge>)input.readObject();
						this.psIndex = (PathStatisticsIndex)input.readObject();
						Logger.info(this.trafficEdgeMap.size() + " TrafficEdges...");
						
					}
					finally {
						input.close();
					}
				}
				catch(Exception e) {
					Logger.info("Failed to load TrafficGraph: " + e.toString());
					e.printStackTrace();
					this.trafficEdgeMap = null;
				}
				
			}
			
			if(this.trafficEdgeMap == null) {
				
				build(this);
				
				save(this);
			}
			
			this.indexTrafficEdges();
		
		}
		catch(Exception e) {
			e.printStackTrace();
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
	
	public HashMap<Integer, TrafficEdge> getTrafficEdgeMap() {
		return trafficEdgeMap;
	}
	
	public void updatePaths(LinkedList<TrafficEdgeTraversal> path) {
		
		psIndex.update(path);
		
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
