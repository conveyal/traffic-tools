package com.conveyal.traffic.graph;

import util.GeoUtils;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.LineString;

public class MovementEdge {
	
	private final LineString geom;
	
	private final VehicleObservation position1;
	private final VehicleObservation position2;
	
	private final double distance;
	
	public MovementEdge(VehicleObservation p1, VehicleObservation p2) {
		position1 = p1;
		position2 = p2;
		
		distance = p1.getPosition().distance(p2.getPosition());
		
		Coordinate[] coords = {position1.getPosition(), position2.getPosition()};
		
		geom = GeoUtils.projectedGeometryFactory.createLineString(coords);
	}
	
	public double getDistance() {
		return distance;
	}
	
	public LineString getGeometry() {
		return geom;
	}
	
	public Long getTime() {
		return position2.getTime() - position1.getTime();
	}
	
	public Long getTimeAtPoint(Coordinate point) {
		return position1.getTime() + (long)(getTime() * (position1.getPosition().distance(point) / distance));
	}

}
