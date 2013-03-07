package com.conveyal.traffic.graph;

import java.io.Serializable;
import java.util.HashMap;
import java.util.LinkedList;

public class PathStatisticsIndex implements Serializable {
	
	private HashMap<Integer, PathStatisticsIndex> index = new HashMap<Integer, PathStatisticsIndex>();
	
	private Long count = 0l;
	private Long cumulativeTime = 0l;
	
	public PathStatisticsIndex() {
		
	}
	
	public PathStatisticsIndex(LinkedList<TrafficEdgeTraversal> path, Long time) {
		
		this.update(path, time);
	}
	
	public void update(LinkedList<TrafficEdgeTraversal> path, Long time) {
		
		TrafficEdgeTraversal tet = path.poll();
		
		if(tet != null) {
			count++;
			cumulativeTime += tet.getTlc2().getTimeAtCrossing() - time;
		
			if(!index.containsKey(tet.getParentEdge().getId()))
				index.put(tet.getParentEdge().getId(), new PathStatisticsIndex(path, time));
			else
				index.get(tet.getParentEdge().getId()).update(path, time);
			
		}	
	}
	
	
	public void update(LinkedList<TrafficEdgeTraversal> path) {
		
		TrafficEdgeTraversal tet = path.poll(); 
				
		if(tet != null) {
			
			if(!index.containsKey(tet.getParentEdge().getId()))
				index.put(tet.getParentEdge().getId(), new PathStatisticsIndex(path, tet.getTlc1().getTimeAtCrossing()));
			else
				index.get(tet.getParentEdge().getId()).update(path, tet.getTlc1().getTimeAtCrossing());
			
		}
	}
}
