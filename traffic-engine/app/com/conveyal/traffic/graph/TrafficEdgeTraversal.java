package com.conveyal.traffic.graph;

import java.io.IOException;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.ObjectMapper;

import controllers.Application;

import models.MapEvent;
import play.Logger;
import util.MapEventData;

public class TrafficEdgeTraversal {
	
	private final TrafficEdge parentEdge;
	
	private final TripLineCrossing tlc1;
	private final TripLineCrossing tlc2;
	
	private final Long travelTime;
	private final Double velocity;
	
	public TrafficEdgeTraversal(TripLineCrossing tl1, TripLineCrossing tl2) throws InvalidTraverseException {
		
		tlc1 = tl1;
		tlc2 = tl2;
				
		if(tl1.getEdgeId().equals(tl2.getEdgeId()) && tl1.isType(TripLine.TRIPLINE_1) && tl2.isType(TripLine.TRIPLINE_2) && tl2.getTimeAtCrossing()  > tl1.getTimeAtCrossing()) {
			parentEdge = tl1.getTripLine().getParentEdge();
			
			travelTime = tl2.getTimeAtCrossing() - tl1.getTimeAtCrossing();
			velocity = tl1.getTripLine().getParentEdge().getTlLength() / (travelTime / 1000);
			
			//Logger.info("Edge traversal: " + parentEdge.getId() + "(velocity: " + velocity + ")");
			
			// publish map event only if there are listeners
			if(Application.mapListeners.hasListeners()) {
				try {
					MapEvent.instance.event.publish(this.mapEvent());
				}
				catch(Exception e) {
					e.printStackTrace();
				}
			}
		}
		else
			throw new InvalidTraverseException();
	}
	
	public TrafficEdge getParentEdge() {
		return parentEdge;
	}
	
	public TripLineCrossing getTlc1() {
		return tlc1;
	}
	
	public TripLineCrossing getTlc2() {
		return tlc2;
	}
	
	public Long getTravelTime() {
		return travelTime;
	}
	
	public Double getTravelDistance() {
		return parentEdge.getTlLength();
	}
	
	public TrafficEdgePair pair(TrafficEdgeTraversal tet2) {
		
		return new TrafficEdgePair(this, tet2);
		
	}
	
	public String mapEvent() throws JsonGenerationException, IOException {
	
		
		MapEventData med = new MapEventData();
		
		med.message = "Velocity: " + velocity;
		med.type = "streetEdge";
		med.geom = parentEdge.getGeometry();

		ObjectMapper mapper = new ObjectMapper();
		return mapper.writeValueAsString(med);
	}
}
