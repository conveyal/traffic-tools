package com.conveyal.traffic.graph;

import java.io.IOException;

import models.MapEvent;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.ObjectMapper;

import controllers.Application;
import util.GeoUtils;
import util.MapEventData;

public class TripLineCrossing implements Comparable<TripLineCrossing> {
	
	private final MovementEdge me;
	private final TripLine tl;
	
	private final Long timeAtCrossing;
	
	public TripLineCrossing(MovementEdge me, TripLine tl, Long timeAtCrossing){
		this.me = me;
		this.tl = tl;
		this.timeAtCrossing = timeAtCrossing;

		
		// publish event only if there are listeners
		if(Application.mapListeners.hasListeners()) {
			try {
				MapEvent.instance.event.publish(this.mapEvent());
			}
			catch(Exception e) {
				e.printStackTrace();
			}
		}
	
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
	
	public String mapEvent() throws JsonGenerationException, IOException {
	
		
		MapEventData med = new MapEventData();
		
		med.message = "";
		med.type = "tripLine";
		med.geom = tl.getGeometryLonLat();

		ObjectMapper mapper = new ObjectMapper();
	
		return mapper.writeValueAsString(med);
	
	}
}
