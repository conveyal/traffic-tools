package com.conveyal.traffic.graph;

import java.util.HashMap;
import java.util.Map;

public class TrafficStatsResponse {
	
	public Long totalObservations = 0l;
	public Map<Long,TrafficStatsEdge> edges = new HashMap<Long,TrafficStatsEdge>();
	
	public void addEdge(Long edgeId, Long observationCount, Double speed) {
		
		TrafficStatsEdge tse = new TrafficStatsEdge();
		
		tse.obvs = observationCount;
		tse.speed = speed;
		
		totalObservations += observationCount;
		
		edges.put(edgeId, tse);
	}
	
	public class TrafficStatsEdge {
		Long obvs;
		Double speed;
	}
}
