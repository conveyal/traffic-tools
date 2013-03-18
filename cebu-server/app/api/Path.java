package api;

import java.util.ArrayList;
import java.util.List;

public class Path {

	public Long pathId;
	
	public String title;
	
	public Integer minTime;
	public Integer maxTime;
	
	public Double minSpeed;
	public Double maxSpeed;
	
	public Double distance = 0.0;
	
	public List<Integer> edgeIds = new  ArrayList<Integer>();
	public List<String> edgeGeoms = new ArrayList<String>();
}
