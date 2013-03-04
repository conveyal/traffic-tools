package com.conveyal.traffic.graph;

import java.io.Serializable;

import models.PathPoint;

import gov.sandia.cognition.math.matrix.Vector;
import gov.sandia.cognition.math.matrix.VectorFactory;
import util.GeoUtils;
import util.ProjectedCoordinate;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;

public class TripLine implements Serializable {
	
	static final long serialVersionUID = 2;
	
	public static final int TRIPLINE_1 = 1;
	public static final int TRIPLINE_2 = 2;
	
	private final TrafficEdge parentEdge;
	
	private final LineString geom;
	private final LineString geomLonLat;
	
	private final Vector tpV1;
	private final Vector tpV2;
	
	private final Integer tripLineType; 
	
	public TripLine(TrafficEdge te, int type, ProjectedCoordinate p1, ProjectedCoordinate p2, double lineLength)
	{
		// calc normal to p1-p2 at tp of lineLength 
		// http://stackoverflow.com/questions/7469959/given-2-points-how-do-i-draw-a-line-at-a-right-angle-to-the-line-formed-by-the-t/7470098#7470098
	
		parentEdge = te;
		tripLineType = type;
		
		Vector v1 = GeoUtils.getVector(p1);
		Vector v2 = GeoUtils.getVector(p2);
		
		Vector dV = v2.minus(v1);
	
		Vector rN = VectorFactory.getDefault().createVector2D(dV.getElement(1), -dV.getElement(0));
		Vector lN = VectorFactory.getDefault().createVector2D(-dV.getElement(1), dV.getElement(0));
		
		Vector uR = rN.unitVector();
		Vector uL = lN.unitVector();
		
		tpV1 = v1.plus(uL.scale(lineLength/2));
		tpV2 = v1.plus(uR.scale(lineLength/2));
				
		Coordinate[] coords = {GeoUtils.convertToProjectedCoordinate(p1.getTransform(), tpV1, p1.getReferenceLatLon()), GeoUtils.convertToProjectedCoordinate(p1.getTransform(), tpV2, p1.getReferenceLatLon())};
		
		geom = GeoUtils.projectedGeometryFactory.createLineString(coords);
		
		Coordinate[] coordsLonLat = {GeoUtils.convertToLonLat(tpV1, p1.getTransform()), GeoUtils.convertToLonLat(tpV2, p1.getTransform())};
		
		geomLonLat = GeoUtils.geometryFactory.createLineString(coordsLonLat);
	}
	
	public LineString getGeometry() {
		return this.geom;
	}
	
	public LineString getGeometryLonLat() {
		return this.geomLonLat;
	}
	
	public TrafficEdge getParentEdge(){
		return parentEdge;
	}
	
	
	public Boolean isType(Integer t){
		return tripLineType.equals(t);
	}
	
	public TripLineCrossing crossing(MovementEdge me) {
	
		if(geom.intersects(me.getGeometry())) {
			
			// check side of tl p1 vs me to make sure direction is correct
			Coordinate c1 = me.getGeometry().getCoordinateN(0);
			Coordinate c2 = me.getGeometry().getCoordinateN(1);
			 
			Coordinate p = geom.getCoordinateN(0);
					 
			if(GeoUtils.side(c1.x, c1.y, c2.x, c2.y, p.x, p.y) > 0) {
				Object g = geom.intersection(me.getGeometry());
				
				if(g instanceof Point) {
					Coordinate crossingPoint = ((Point) g).getCoordinate();
					
					Long timeAtCrossing = me.getTimeAtPoint(crossingPoint); 
					
					return new TripLineCrossing(me, this, timeAtCrossing);
				}
				else {
					return null;
				}
			}
			else
				return null;
		
		}
		else
			return null;
	}

	
	/*public double getCrossingDirection(MovementEdge mE) {
		return GeoUtils.side(mE.getA(), mE.getB(), tpV1);
	} */
	

}
