package api;

import java.util.ArrayList;
import java.util.List;

public class Path {

	public Long pathId;
	
	public String title;
	
	public Double distance = 0.0;
	
	public List<PathEdge> edges = new  ArrayList<PathEdge>();

	public void addEdge(Integer edgeId, Double distance, String geom) {
		PathEdge pe = new PathEdge();
		
		pe.edgeId = edgeId;
		pe.distance = distance;
		pe.geom = geom;
		
		edges.add(pe);
	}
	
	public class PathEdge {
		
		public Integer edgeId;
		public Double  distance;	
		public String  geom;
		
	}
}
