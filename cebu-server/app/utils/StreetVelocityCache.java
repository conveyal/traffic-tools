package utils;

import java.math.BigInteger;
import java.util.HashMap;
import java.util.List;

import javax.persistence.Query;

import org.codehaus.groovy.tools.shell.util.Logger;

import akka.event.Logging;

import models.StatsEdge;


public class StreetVelocityCache {

	HashMap<BigInteger,Double> streetVelocities = new HashMap<BigInteger,Double>();
	
	Double meanVelocity;
	public StreetVelocityCache()
	{	
		List edges = StatsEdge.getEdgeVelocityList();
		
		Double total = 0.0;
		
		for(Object o : edges)
		{
			Object[] r = (Object[])o;	
			total += (Double)r[1];
			
			streetVelocities.put((BigInteger)r[0], (Double)r[1]);
		}
		
		meanVelocity = total / edges.size();
	}

	public Double getStreetVelocity(BigInteger edgeId)
	{
		if(streetVelocities.containsKey(edgeId))
			return streetVelocities.get(edgeId);
		else
			return meanVelocity;
	}
	
}
