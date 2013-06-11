package com.conveyal.traffic.graph;

public class TrafficEdgeStats {
	
	public final int edgeId;

	private EdgeStatsData[][] edgeData = new EdgeStatsData[8][24];

	public TrafficEdgeStats(int id) {
		edgeId = id;

		for(int i = 1; i < 8; i++) {
			for(int j = 0; j < 24; j++ ) {
				this.edgeData[i][j] = new EdgeStatsData();
			}
		}
	}
	
	public void update(double speed, int day, int hour) { 	
		 this.edgeData[day][hour].update(speed);
	}

	public double average(int day, int hour) {
		return this.edgeData[day][hour].average();
	}
	
	public double total(int day, int hour) {
		return this.edgeData[day][hour].speedTotal;
	}
	
	public void reset(int day, int hour) {
		this.edgeData[day][hour].reset();
	}
	
	public long observationCount(int day, int hour) {
		return this.edgeData[day][hour].observationCount();
	}

	private class EdgeStatsData {

		private double speedTotal = 0.0;
		private long observations = 0l;

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
		
		public long observationCount() {
			return observations;
		}

	}
}
