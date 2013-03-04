package com.conveyal.traffic.graph;

public class TrafficEdgeStats {
	
	public final int edgeId;
	
	private double speedTotal = 0.0;
	private long observations = 0l;

	public TrafficEdgeStats(int id) {
		edgeId = id;
	}
	
	public void update(double speed) {
		synchronized(this) {
			speedTotal += speed;
			observations++;
		}
	}

	public double average() {
		return speedTotal / observations;
	}
	
	public void reset() {
		speedTotal = 0.0;
		observations = 0l;
	}
}
