package com.conveyal.traffic.graph;

public class ObservationOutOfOrderException extends Exception {

	Long timeDelta;
	
	public ObservationOutOfOrderException(VehicleObservation o1, VehicleObservation o2) {
		timeDelta = o1.getTime() - o2.getTime();
	}
	
	public String toString() {
		return "ObservationOutOfOrderException: Observeration " + timeDelta + "ms before current.";
	}
}
