package com.conveyal.traffic.graph;

import java.util.ArrayList;
import java.util.Date;
import java.util.HashSet;
import java.util.List;

import play.Logger;

public class TrafficEdgePath {
	
	private List<TrafficEdgeTraversal> traversalList = new ArrayList<TrafficEdgeTraversal>();
	
	private Long pathTravelTime = 0l;
	private Double pathDistance = 0.0;
	private Double pathVelocity = 0.0;
	
	private TrafficEdge lastTet = null;
	
	private HashSet<Integer> traversedIds = new HashSet<Integer>();
	
	public TrafficEdgePath() {
	
		//Logger.info("Edge pair traversal: " + tet1.getParentEdge().getId() + " & " + tet2.getParentEdge().getId() + " (velocity: " + pairVelocity + ")");
	}
	
	public void addTraversal(TrafficEdgeTraversal tet) {
		traversalList.add(tet);
		lastTet = tet.getParentEdge();
	
		traversedIds.add(tet.getParentEdge().getId());
		
		updatePathAverages();
	}
	
	public Integer getLastEdgeId() {
		return lastTet.getId();
	}
	
	public TrafficEdge getLastEdge() {
		return lastTet;
	}
	
	public Boolean edgeTraversed(Integer edgeId) {
		return traversedIds.contains(edgeId);
	}
	
	public List<TrafficEdgeTraversal> getTraversalList() {
		return traversalList;
	}
	
	public void updatePathAverages() {

		pathTravelTime = 0l;
		pathDistance = 0.0;
		pathVelocity = 0.0;
		
		for(TrafficEdgeTraversal tet : traversalList) {
			
			pathTravelTime += (tet.getTlc2().getTimeAtCrossing() - tet.getTlc1().getTimeAtCrossing()); 
	
			pathDistance += tet.getParentEdge().getTlLength();
		}
		
		if(pathDistance > 0.0 && pathTravelTime > 0.0)
			pathVelocity = pathDistance / (pathTravelTime / 1000);
		
	}
	
	public void saveStats() {
		
		if(pathVelocity > 50.0)
			Logger.warn("Average Speed exceeds 50 m/s: "  + pathVelocity);
		else {
			for(TrafficEdgeTraversal tet : traversalList) { 
				TrafficStats.updateEdgeStats(tet.getParentEdge().getId(), new Date(tet.getTlc2().getTimeAtCrossing()), pathVelocity);
			}
		}
		
	}
	
	public void clear() {
		
		traversedIds.clear();
		traversalList.clear();
		lastTet = null;
		updatePathAverages();
		
	}
	
	public Integer length() {
		return traversalList.size();
	}
	
	public Long getTravelTime() {
		return pathTravelTime;
	}
	
	public Double getTravelDistance() {
		return pathDistance;
	}
	

}
