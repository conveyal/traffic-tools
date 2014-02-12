package com.conveyal.traffic.graph;

import java.util.ArrayList;
import java.util.List;

import utils.GeoUtils;

import models.PathPoint;

import com.vividsolutions.jts.geom.Envelope;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;
import com.vividsolutions.jts.index.strtree.STRtree;

public class TrafficEdgeIndex {

	private STRtree tl1Index = new STRtree();
	private STRtree tl2Index = new STRtree();
	
	public TrafficEdgeIndex(List<TrafficEdge> tes) {
		
		for(TrafficEdge te : tes) {
			indexTrafficEdge(te);
		}
		
		index();
	}
	
	private void indexTrafficEdge(TrafficEdge te) {
		
		if(te.hasTripLines()) {	
			tl1Index.insert(te.getTl1().getGeometry().getEnvelopeInternal(), te);
			tl2Index.insert(te.getTl2().getGeometry().getEnvelopeInternal(), te);
		}
	}

	private void index() {
		tl1Index.build();
		tl2Index.build();
	}
	
	public ArrayList<TripLineCrossing> findTl1TrafficEdges(MovementEdge me) {
	
		return getTlCrossings(me, tl1Index, TripLine.TRIPLINE_1);
	}
	
	public ArrayList<TripLineCrossing> findTl2TrafficEdges(MovementEdge me) {
		
		return getTlCrossings(me, tl2Index, TripLine.TRIPLINE_2);
	}
	
	private ArrayList<TripLineCrossing> getTlCrossings(MovementEdge me, STRtree index, int type){
		
		ArrayList<TripLineCrossing> crossings = new ArrayList<TripLineCrossing>();
		
		for(TrafficEdge edge : (List<TrafficEdge>)index.query(me.getGeometry().getEnvelopeInternal())) {
			
			TripLineCrossing crossing = null;
			
			if(type == TripLine.TRIPLINE_1)
				crossing = edge.getTl1().crossing(me);
			else if(type == TripLine.TRIPLINE_2)
				crossing = edge.getTl2().crossing(me);
			
			if(crossing != null) {
				crossings.add(crossing);
			}
		}
		
		return crossings;
	}
	
}
