package com.conveyal.traffic.graph;

import util.ProjectedCoordinate;

public class VehicleObservation {

	private final Long positionTime; // unix timestamp in milliseconds
	private final ProjectedCoordinate position;
	
	public VehicleObservation(Long pT, ProjectedCoordinate p) {
		position = p;
		positionTime = pT;
	}
	
	public ProjectedCoordinate getPosition() {
		return position;
	}
	
	public Long getTime() {
		return positionTime;
	}
	
	public Boolean before(VehicleObservation o) {
		return positionTime < o.getTime();
	}
}
