package com.conveyal.traffic.graph;


import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map.Entry;

import models.GraphEdge;

import org.opentripplanner.routing.core.RoutingRequest;
import org.opentripplanner.routing.edgetype.PlainStreetEdge;
import org.opentripplanner.routing.graph.Edge;
import org.opentripplanner.routing.graph.Graph;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.LineString;

import play.Logger;
import util.GeoUtils;
import util.ProjectedCoordinate;

public class TrafficEdge implements Serializable {
	
	static final long serialVersionUID = 2;
	
	private final Integer id;
	private final PlainStreetEdge edge;
	
	private Double length = 0.0;
	private Double tripLineLength = 0.0;
	private Double pairedLength = 0.0;
	
	private List<PlainStreetEdge> downstreamEdges = new ArrayList<PlainStreetEdge>();
	private HashSet<Integer> downstreamEdgeIds = new HashSet<Integer>();
	
	private TripLine tripLine1 = null;
	private TripLine tripLine2 = null;
	
	private Boolean hasTripLines = false;
	
	public TrafficEdge(PlainStreetEdge originalPse, Graph graph, RoutingRequest options) {
		this.id = graph.getIdForEdge(originalPse);
		this.edge = originalPse;
		
		for(Edge downstreamEdge : originalPse.getToVertex().getOutgoingStreetEdges()) {
			if(downstreamEdge instanceof PlainStreetEdge && ((PlainStreetEdge)downstreamEdge).canTraverse(options)) {
				downstreamEdges.add((PlainStreetEdge)downstreamEdge);
				downstreamEdgeIds.add(graph.getIdForEdge((PlainStreetEdge)downstreamEdge));
			}
		}		
	}
	
	public Integer getId() {
		return id;
	}
	
	public Boolean hasTripLines() {
		return hasTripLines;
	}
	
	public LineString getGeometry() {
		return this.edge.getGeometry();
	}
	
	public TripLine getTl1() {
		return tripLine1;
	}
	
	public TripLine getTl2() {
		return tripLine2;
	}
	
	public Double geLength() {
		return length;
	}
	
	public Double getPairedLength() {
		return pairedLength;
	}
	
	public Double getTlLength() {
		return tripLineLength;
	}
	
	public List<PlainStreetEdge> getDownstreamEdges() {
		return downstreamEdges;
	}
	
	public HashSet<Integer> getDownstreamEdgeIds() {
		return downstreamEdgeIds;
	}
	
	public void buildTripLines() throws TripLineException {
		
		double lineLength = GeoUtils.endPointDistance(edge.getGeometry());
		
		Coordinate[] coords = edge.getGeometry().getCoordinates();
			
		// check line length, if less than 2x offset skip
		if(lineLength < TrafficGraph.TRIPLINE_OFFSET * 2)
			throw new TripLineException();
		
		ProjectedCoordinate tp1 = null;
		ProjectedCoordinate tp2 = null;
		

		if(coords.length > 2) {
			
			// find first segment
			
			ProjectedCoordinate p1 = GeoUtils.convertLonLatToEuclidean(coords[0]);
			
			int i = 1;

			ProjectedCoordinate p2 = GeoUtils.convertLonLatToEuclidean(coords[i]);
		
			
			while(p1.distance(p2) < TrafficGraph.TRIPLINE_OFFSET && i + 2 < coords.length) {
				i++;
				p2 = GeoUtils.convertLonLatToEuclidean(coords[i]);
			}
			
			// check if line length is less than offset length
			if(p1.distance(p2) < TrafficGraph.TRIPLINE_OFFSET)
				throw new TripLineException();
			
			tp1 = GeoUtils.calcPointAlongLine(p1, p2, TrafficGraph.TRIPLINE_OFFSET);
			
			// find last segment, move backward from end of line
			
			ProjectedCoordinate p4 = GeoUtils.convertLonLatToEuclidean(coords[coords.length -1]);
			
			i = coords.length - 2;
			
			ProjectedCoordinate p3 = GeoUtils.convertLonLatToEuclidean(coords[i]);
			
			while(p3.distance(p4) < TrafficGraph.TRIPLINE_OFFSET && i - 1 > 0) {
				i--;
				p3 = GeoUtils.convertLonLatToEuclidean(coords[i]);
			}
			
			// check if line length is less than offset length
			if(p3.distance(p4) < TrafficGraph.TRIPLINE_OFFSET)
				throw new TripLineException();
			
			tp2 = GeoUtils.calcPointAlongLine(p3, p4, p3.distance(p4) - TrafficGraph.TRIPLINE_OFFSET);
			
			tripLine1 = new TripLine(this, TripLine.TRIPLINE_1, tp1, p2, TrafficGraph.TRIPLINE_LENGTH);
			tripLine2 = new TripLine(this, TripLine.TRIPLINE_2, tp2, p4, TrafficGraph.TRIPLINE_LENGTH);
			
			
			// doing this inefficiently -- looping over coords for a thrid time to calc distances, need to figure out why .getLength() on 
			// original edge isnt' accurate...
			
			p1 = GeoUtils.convertLonLatToEuclidean(edge.getGeometry().getCoordinateN(0));
			
			length = 0.0;
			
			for(Coordinate coord : edge.getGeometry().getCoordinates()) {
				p2 = GeoUtils.convertLonLatToEuclidean(coord);
				
				length += p1.distance(p2);
				
				p1 = p2;
			}
			
			pairedLength = length - TrafficGraph.TRIPLINE_OFFSET;
			tripLineLength = length - (TrafficGraph.TRIPLINE_OFFSET * 2);
			
		}
		else {
			// handle two point lines more efficiently
			
			ProjectedCoordinate p1 = GeoUtils.convertLonLatToEuclidean(coords[0]);
			ProjectedCoordinate p2 = GeoUtils.convertLonLatToEuclidean(coords[1]);

			double length = p1.distance(p2);
			
			tp1 = GeoUtils.calcPointAlongLine(p1, p2, TrafficGraph.TRIPLINE_OFFSET);
			tp2 = GeoUtils.calcPointAlongLine(p1, p2, length - TrafficGraph.TRIPLINE_OFFSET);
			
			tripLine1 = new TripLine(this, TripLine.TRIPLINE_1, tp1, p2, TrafficGraph.TRIPLINE_LENGTH);
			tripLine2 = new TripLine(this, TripLine.TRIPLINE_2, tp2, p2, TrafficGraph.TRIPLINE_LENGTH);
			
			this.length = length;
			pairedLength = length - TrafficGraph.TRIPLINE_OFFSET;
			tripLineLength = length - (TrafficGraph.TRIPLINE_OFFSET * 2);
		
		}
		
		hasTripLines = true;

	}
	
	public void save() {
		
		if(hasTripLines)
			GraphEdge.nativeInsert(id, edge, tripLine1, tripLine2);
		else
			GraphEdge.nativeInsert(id, edge);
	}

	
	
	 // not merging edges for now. 
	
	/* public static TrafficEdge mergeEdge(PlainStreetEdge originalPse, TrafficGraph graph) {
		
		TrafficEdge me = new TrafficEdge(graph.getNextEdgeId());
		mergeEdge(originalPse, me, graph.getOptions());
		
		graph.setEdgeIds(me.id, me.edges);
		
		Logger.info(me.id + ": " + me.edges.size());
		
		return me;
	}
	
	private static TrafficEdge mergeEdge(PlainStreetEdge originalPse, TrafficEdge me, RoutingRequest options) {
		
		if(me.edgeGeom == null)
			me.edgeGeom = originalPse.getGeometry();
		else {
			
			LineString mergedGeom = concatinateLineStrings(me.edgeGeom, originalPse.getGeometry());
			
			// if disjoint bail
			if(mergedGeom != null)
				me.edgeGeom = mergedGeom;
			else
				return me;
		}
		
		me.edges.add(originalPse);
		
		if(originalPse.getToVertex().getOutgoingStreetEdges().size() == 1 && originalPse.getToVertex().getOutgoingStreetEdges().get(0) instanceof PlainStreetEdge && ((PlainStreetEdge)originalPse.getToVertex().getOutgoingStreetEdges().get(0)).canTraverse(options)) {
			
			PlainStreetEdge downstreamEdge =(PlainStreetEdge)originalPse.getToVertex().getOutgoingStreetEdges().get(0);
			
			// detect loops
			if(!me.edges.contains(downstreamEdge))
					mergeEdge(downstreamEdge, me, options);
		}
		
		return me;
	}
	
	private static LineString concatinateLineStrings(LineString e1, LineString e2) {
		
		Coordinate[] c1 = e1.getCoordinates();
		Coordinate[] c2 = e2.getCoordinates();
		
		// check for disjoint linestrings or return null
		if(!c1[0].equals2D(c2[c2.length -1])) {		
			
			Coordinate[] c3 = concat(c1, c2);
			
			return GeoUtils.geometryFactory.createLineString(c3);
		}
		else
			return null;
			
		
	}
	
	public static <T> T[] concat(T[] first, T[] second) {
		  T[] result = Arrays.copyOf(first, first.length + second.length);
		  System.arraycopy(second, 0, result, first.length, second.length);
		  return result;
		} */
	
	

}

