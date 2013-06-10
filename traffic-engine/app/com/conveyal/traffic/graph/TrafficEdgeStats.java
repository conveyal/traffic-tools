package com.conveyal.traffic.graph;

public class TrafficEdgeStats {
	
	public final int edgeId;

	private EdgeStatsData[][] edgeData = new EdgeStatsData[7][24];

	public TrafficEdgeStats(int id) {
		edgeId = id;
	}
	
	public void update(double speed, int day, int hour) {
		 this.edgeData[day][hour].update(speed);
	}

	public double average(int day, int hour) {
		return this.edgeData[day][hour].average();
	}
	
	public void reset(Integer day, Integer hour) {
		this.edgeData[day][hour].reset();
	}
	
	public long observationCount(Integer day, Integer hour) {
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
