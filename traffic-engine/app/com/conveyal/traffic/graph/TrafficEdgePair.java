package com.conveyal.traffic.graph;

import play.Logger;

public class TrafficEdgePair {
	
	private final Long pairTravelTime; 
	private final Double pairDistance;
	private final Double pairVelocity;
	
	public TrafficEdgePair(TrafficEdgeTraversal tet1, TrafficEdgeTraversal tet2) {

		pairTravelTime = tet2.getTlc2().getTimeAtCrossing() - tet1.getTlc1().getTimeAtCrossing();
		pairDistance = tet2.getParentEdge().getPairedLength() + tet1.getParentEdge().getPairedLength();
		
		pairVelocity = pairDistance / (pairTravelTime / 1000);
		
		//Logger.info("Edge pair traversal: " + tet1.getParentEdge().getId() + " & " + tet2.getParentEdge().getId() + " (velocity: " + pairVelocity + ")");
	}
	
	public Long getTravelTime() {
		return pairTravelTime;
	}
	
	public Double getTravelDistance() {
		return pairDistance;
	}
	

}
