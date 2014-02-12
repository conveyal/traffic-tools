package com.conveyal.traffic.graph;

import java.io.IOException;



import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.ObjectMapper;

import controllers.Application;
import utils.GeoUtils;

public class TripLineCrossing implements Comparable<TripLineCrossing> {
	
	private final MovementEdge me;
	private final TripLine tl;
	
	private final Long timeAtCrossing;
	
	public TripLineCrossing(MovementEdge me, TripLine tl, Long timeAtCrossing){
		this.me = me;
		this.tl = tl;
		this.timeAtCrossing = timeAtCrossing;
	}
	
	public boolean isType(int type) {
		return tl.isType(type);
	}
	
	public Long getTimeAtCrossing() {
		return timeAtCrossing;
	}
	
	public TripLine getTripLine() {
		return tl;
	}
	
	public TrafficEdgeTraversal getTrafficEdgeTraversal(TripLineCrossing tl2) throws InvalidTraverseException {
		
		return new TrafficEdgeTraversal(this, tl2);
	}
	
	public Integer getEdgeId() {
		return tl.getParentEdge().getId();
	}
	
	public int compareTo(TripLineCrossing tlc) {
		if(timeAtCrossing < tlc.timeAtCrossing)
			return -1;
		else if(timeAtCrossing > tlc.timeAtCrossing)
			return 1;
		else 
			return 0;
	}

}
