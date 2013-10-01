package com.conveyal.traffic.graph;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Set;
import java.util.SortedMap;
import java.util.TreeMap;

import models.MapEvent;
import models.PathEdge;

import play.Logger;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.LineString;

import controllers.Application;

import util.GeoUtils;
import util.ProjectedCoordinate;

public class VehicleState {

	public static final int MAX_OBSERVATION_AGE = 30 * 60 * 1000; // don't keep crossing observations older than 30 mins
	
	public static final double SIMULATION_GPS_SPACING = 20.0; 
	public static final double SIMULATION_GPS_ERROR = 15.0;
	
	private final TrafficGraph graph; 
	private final Long vehicleId;
	private VehicleObservation lastObservation = null;
	
	private boolean simulate = false;
	private long sPairedTime = 0;
	private long sTraversedTime = 0;
	private double sPairedDist = 0.0;
	private double sTraversedDist = 0.0;
	
	private Set<Integer> sTraversed = new HashSet<Integer>();
	private Set<Integer> sPaired = new HashSet<Integer>();
	
	private HashMap<Integer, TripLineCrossing> t1Crossings = new HashMap<Integer, TripLineCrossing>();
	
	private TrafficEdgePath currentPath = new TrafficEdgePath();
	
	public VehicleState(Long id, TrafficGraph g) {
		graph = g;
		vehicleId = id;
	}
	
	public void updatePosition(VehicleObservation currentObservation) throws ObservationOutOfOrderException {
		
		// must be synchronized to prevent concurrent update operations on the same vehicle state
		synchronized(this) { 
			
			try {
				MapEvent.instance.event.publish(currentObservation.mapEvent());
			}
			catch(Exception e) {
				e.printStackTrace();
			}
			
			if(lastObservation != null) {
				
				if(currentObservation.before(lastObservation)) {
					Date c1 = new Date(currentObservation.getTime());
					Date c2 = new Date(lastObservation.getTime());
					Logger.info(c1.toString() + " < " + c2.toString());
					throw new ObservationOutOfOrderException(lastObservation, currentObservation);
				}
			
				// find edge for current VO pair
				MovementEdge me = new MovementEdge(lastObservation, currentObservation);
				
				// get tl crossings
				List<TripLineCrossing> t1cs = graph.getTraffEdgeIndex().findTl1TrafficEdges(me);
				List<TripLineCrossing> t2cs = graph.getTraffEdgeIndex().findTl2TrafficEdges(me);
				
				Boolean firstThrough = true;
				Boolean pathChanged = false;
				
				HashSet<Integer> vistedTc1s = new HashSet<Integer>();
				
				do {
					
					if(firstThrough || pathChanged) {
						
						firstThrough = false;
						pathChanged = false;
						
						for(TripLineCrossing t2crossing : t2cs) {
							
							//  find t2c crossing matching t1 crossings
							if(t1Crossings.containsKey(t2crossing.getEdgeId())) {
										
								TripLineCrossing t1crossing = t1Crossings.get(t2crossing.getEdgeId());
								
								try {
									
									// make a traversal and added to path
									TrafficEdgeTraversal tet = t1crossing.getTrafficEdgeTraversal(t2crossing);
									
									currentPath.addTraversal(tet);
									
									pathChanged = true;
									
									// clear t1 crossings and start fresh
									t1Crossings.clear();
									vistedTc1s.clear();
									
									if(simulate) {
										sTraversed.add(tet.getParentEdge().getId());
										sTraversedDist += tet.getTravelDistance();
										sTraversedTime += tet.getTravelTime();
									}
									
								} 
								catch (InvalidTraverseException e) {
									
									// not a valid traversal, skipping but still remove old tl1 crossings
									t1Crossings.clear();
								
									continue;
								}
							}
						}
						
						// check t2 crossings for those matching end of current path
						for(TripLineCrossing t1crossing : t1cs) {
					
							if(!vistedTc1s.contains(t1crossing.getEdgeId()) && !currentPath.edgeTraversed(t1crossing.getEdgeId())) {
								pathChanged = true;
								
								vistedTc1s.add(t1crossing.getEdgeId());
								t1Crossings.put(t1crossing.getEdgeId(), t1crossing);
							}
							
						}
					}
					 	
				} while(pathChanged);
				
				if(currentPath.length() > 1) {
					
					// if path is a pair (or longer) save and clear
					
					if(simulate) {
						
						for(TrafficEdgeTraversal tet : currentPath.getTraversalList()) {
							sPaired.add(tet.getParentEdge().getId());
						}
						
						sPairedDist += currentPath.getTravelDistance();
						sPairedTime += currentPath.getTravelTime();
					}
					
					currentPath.saveStats();
					currentPath.clear();
					
					
					
				}
				else if(currentPath.length() == 1 && t1Crossings.size() > 10) {
					// if we're collecting lots of t1Crossings that don't match current path reset path...
					
					currentPath.clear();
				}
				
			}
		}
		
		lastObservation = currentObservation;
	}
	
//	
//		
//		purgeCrossings(lastObservation.getTime() - MAX_OBSERVATION_AGE);
//		
//		MovementEdge me = new MovementEdge(lastObservation, currentObservation);
//		
//		// update tl1 crossing list	
//		List<TripLineCrossing> t1cs = graph.getTraffEdgeIndex().findTl1TrafficEdges(me);
//		
//		for(TripLineCrossing t1crossing : t1cs) {
//			t1Crossings.put(t1crossing.getEdgeId(), t1crossing);
//			
//			addEdgeId(t1CrossingTimes, t1crossing.getTimeAtCrossing(), t1crossing.getEdgeId());
//			
//			
//			//t1CrossingTimes.put(t1crossing.getTimeAtCrossing(), t1crossing.getEdgeId());
//			
//			//Logger.info("TL1 crossing for: " + t1crossing.getEdgeId());
//		}
//		
//		// find tl2 crossings
//		ArrayList<TripLineCrossing> t2cs = graph.getTraffEdgeIndex().findTl2TrafficEdges(me);
//		
//		// order crossing list by time
//		Collections.sort(t2cs);
//		
//		// iterate through tl2 crossings and find edge traversals
//		for(TripLineCrossing t2crossing : t2cs) {
//			
//			//Logger.info("TL2 crossing for: " + t2crossing.getEdgeId());
//			
//			if(t1Crossings.containsKey(t2crossing.getEdgeId())){
//				
//				TripLineCrossing t1crossing = t1Crossings.get(t2crossing.getEdgeId());
//				
//				try {
//					TrafficEdgeTraversal tet = t1crossing.getTrafficEdgeTraversal(t2crossing);
//					
//					
//					
//					if(!findPair(tet)) {
//						t2Crossings.put(tet.getParentEdge().getId(), tet);
//						
//						for(Integer id : tet.getParentEdge().getDownstreamEdgeIds()) {
//							upstreamCrossings.put(id, tet);
//							
//							addEdgeId(upstreamCrossingTimes, tet.getTlc1().getTimeAtCrossing(), id);
//							//upstreamCrossingTimes.put(tet.getTlc1().getTimeAtCrossing(), id);
//						}
//					
//						addEdgeId(t2CrossingTimes, tet.getTlc1().getTimeAtCrossing(), tet.getParentEdge().getId());
//						//t2CrossingTimes.put(tet.getTlc1().getTimeAtCrossing(), tet.getParentEdge().getId());
//					}
//					else
//						// purge everything prior to latest tl2 crossing
//						purgeCrossings(t2crossing.getTimeAtCrossing());
//					
//				} 
//				catch (InvalidTraverseException e) {
//					// not a valid traversal, skiping but still remove old tl1 crossings
//					
//					purgeCrossings(t1crossing.getTimeAtCrossing());
//				}
//				
//			}
//		}
//		
//		
//	}
//
//	
//	lastObservation = currentObservation;
	
	// for simulation -- applies a m/s velocity to a given path
	public void simulateUpdatePosition(List<Integer> edges, Double velocity) {
		
		simulate = true;
		
		lastObservation = null;
		
		sPairedTime = 0;
		sTraversedTime = 0;
		sPairedDist = 0.0;
		sTraversedDist = 0.0;
		
		sTraversed = new HashSet<Integer>();
		sPaired = new HashSet<Integer>();
		
		t1Crossings.clear();

		Logger.info("Starting simulator for " + edges.size() + " lines.");
		
    	LineString path = graph.getPathForEdges(edges, SIMULATION_GPS_SPACING, SIMULATION_GPS_ERROR);
    
		for(Coordinate c : path.getCoordinates()) {
			ProjectedCoordinate currentCoord = GeoUtils.convertLonLatToEuclidean(c);
			VehicleObservation currentObservation = null;
			
			if(lastObservation != null) {
				double distance = lastObservation.getPosition().distance(currentCoord);
				long time = (long)((distance / velocity) * 1000) + lastObservation.getTime();
				
				currentObservation = new VehicleObservation(vehicleId, time, currentCoord);
			}
			else
				currentObservation = new VehicleObservation(vehicleId, new Long(0), currentCoord);
				
			try {
				updatePosition(currentObservation);
					
			}
			catch(ObservationOutOfOrderException e) {
				// this should only happen if multiple updates are being performed on the same VehicleState at the same time
				Logger.error(vehicleId + ": " + e.toString());
			}
			
		}
		
		Double totalDist = 0.0;
		Double pairedDist = 0.0;
		Double traversedDist = 0.0;
		Double overmatchedDist = 0.0;
		
		Integer traversedCount = sTraversed.size();
		Integer pairedCount = sPaired.size();
		
		for(Integer edge : edges) {
			TrafficEdge te = graph.getTrafficEdge(edge);
			Double dist = te.geLength();
			
			totalDist += dist;
			
			if(sTraversed.contains(edge))
				traversedDist += dist;
			
			sTraversed.remove(edge);
			
			if(sPaired.contains(edge))
				pairedDist += dist;
			
			sPaired.remove(edge);
		}
		
		Integer overmatchedCount = sTraversed.size();
		
		for(Integer edge : sTraversed ) {
			TrafficEdge te = graph.getTrafficEdge(edge);
			overmatchedDist +=  te.geLength();
		}
		
		Double pairedPct = pairedDist / totalDist;
		Double traversedPct = traversedDist / totalDist;
		
		Double traversedVelocity = sTraversedDist / (sTraversedTime / 1000);
		Double pairedVelocity = sPairedDist / (sPairedTime / 1000);
		
		Logger.info("\n\tSimulation for " + edges.size() + " edges (" + Math.round(totalDist) + "m) at "+ velocity + " m/s: \n" +
			"\t" + traversedCount + " traversed (" + Math.round(traversedDist) + "m - " + (int)(traversedPct * 100) + "%)\n " + 
			"\t" + pairedCount + " paired (" + Math.round(pairedDist) + "m - " + (int)(pairedPct * 100) + "%)\n" + 
			"\t" + overmatchedCount + " overmatched (" + Math.round(overmatchedDist) + "m)\n" + 
			"\t" + traversedVelocity + " m/s average traversed\n" +
			"\t" + pairedVelocity + " m/s average paired"); 


	}
	
//	private boolean findPair(TrafficEdgeTraversal tet2) {
//		
//		if(upstreamCrossings.containsKey(tet2.getParentEdge().getId())) {
//			
//			TrafficEdgeTraversal tet1 = upstreamCrossings.get(tet2.getParentEdge().getId());
//			
//			TrafficEdgePath pair = tet1.pair(tet2);
//
//			Double averageSpeed = pair.getTravelDistance() / (pair.getTravelTime() / 1000);
//			
//			if(averageSpeed > 50.0)
//				Logger.warn("Average Speed exceeds 50 m/s");
//			else {
//				Date d = new Date(tet1.getTlc2().getTimeAtCrossing());
//		        
//				TrafficStats.updateEdgeStats(tet1.getParentEdge().getId(), d, averageSpeed);
//				TrafficStats.updateEdgeStats(tet2.getParentEdge().getId(), d, averageSpeed);
//			}
//			
//			
//			if(simulate) {
//				sPaired.add(tet1.getParentEdge().getId());
//				sPaired.add(tet2.getParentEdge().getId());
//				
//				sPairedDist += pair.getTravelDistance();
//				sPairedTime += pair.getTravelTime();
//			}
//			
//			// update crossing list
//			int cls = crossingList.size();
//			
//			if(cls == 4) {
//			
//				crossingList.poll();
//				crossingList.poll();
//			} 
//			else if(cls == 3) {
//				crossingList.poll();
//			}
//			
//			crossingList.add(tet1);
//			crossingList.add(tet2);
//			
//			if(crossingList.size() == 4) {	
//				graph.updatePaths(crossingList);
//			}
//			
//			return true;
//		}
//		else 
//			return false;
//		
//	}
//	
//	private void purgeCrossings(Long purgeTime) {
//	
//		// get all crossings before purgeTime and remove from crossing lists...
//		
//		SortedMap<Long, Set<Integer>> edgeIdSetsToRemove = t1CrossingTimes.headMap(purgeTime);
//		
//		for(Set<Integer> edgeIds : edgeIdSetsToRemove.values()) {
//			for(Integer edgeId: edgeIds) {
//				t1Crossings.remove(edgeId);
//			}
//		}
//		
//		edgeIdSetsToRemove.clear();
//		
//		edgeIdSetsToRemove = t2CrossingTimes.headMap(purgeTime);
//		
//		for(Set<Integer> edgeIds : edgeIdSetsToRemove.values()) {
//			for(Integer edgeId: edgeIds) {
//				t2Crossings.remove(edgeId);
//			}
//		}
//		
//		edgeIdSetsToRemove.clear();
//		
//		edgeIdSetsToRemove = upstreamCrossingTimes.headMap(purgeTime);
//		
//		for(Set<Integer> edgeIds : edgeIdSetsToRemove.values()) {
//			for(Integer edgeId: edgeIds) {
//				upstreamCrossings.remove(edgeId);
//			}
//		}
//		
//		edgeIdSetsToRemove.clear();
//	}
//	
//	private static void addEdgeId(TreeMap<Long, Set<Integer>> map, Long time, Integer id) {
//		if(!map.containsKey(time))
//			map.put(time, new HashSet<Integer>());
//		
//		map.get(time).add(id);
//		
//	} 
	
}
