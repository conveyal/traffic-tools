package models;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;
import java.util.HashMap;

import javax.persistence.Entity;
import javax.persistence.Query;

import org.apache.commons.lang.StringUtils;
import org.hibernate.annotations.Type;
import org.opentripplanner.routing.edgetype.PlainStreetEdge;

import play.Logger;
import play.db.jpa.Model;

import com.conveyal.traffic.graph.TripLine;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;

@Entity
public class StatsEdge extends Model {

    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public LineString shape;
    
    public Long edgeId;

    public Long shour;
    public Long sday;
    
    public Double speed;
    
    public static void nativeInsert(Integer edgeId, Double speed, LineString edge)
    {
    	List<String> edgePoints = new ArrayList<String>();

    	for(Coordinate coord : edge.getCoordinates()) {
    		edgePoints.add(new Double(coord.x).toString() + " " + new Double(coord.y).toString());
    	}
    	    	
    	String edgeLinestring = "LINESTRING(" + StringUtils.join(edgePoints, ", ") + ")";
    	
	    Query idQuery = GraphEdge.em().createNativeQuery("SELECT NEXTVAL('hibernate_sequence');");
    	BigInteger nextId = (BigInteger)idQuery.getSingleResult();

    	GraphEdge.em().createNativeQuery("INSERT INTO statsedge (id, edgeid, shape, speed)" +
        	"  VALUES(?, ?, ST_GeomFromText( ?, 4326), ?);")
          .setParameter(1,  nextId)
          .setParameter(2,  edgeId)	            
          .setParameter(3,  edgeLinestring)
          .setParameter(4,  speed)
          .executeUpdate();
    	
    }
    
    static public List getEdgeVelocityList()
    {
    	Query q = StatsEdge.em().createNativeQuery("SELECT edgeid, sum(speedtotal) / sum(observationcount) as speed FROM statsedge group by edgeid;");    	
    	return q.getResultList();
    }

    static public HashMap<BigInteger, Double> getEdgeVelocityForHoursDays(String hours, String days, String edgeIds)
    {
        
        HashMap<BigInteger,Double> streetVelocities = new HashMap<BigInteger,Double>();

        
        Logger.info("SELECT edgeid, sum(speedtotal) / sum(observationcount) as speed FROM statsedge WHERE edgeid in (" + edgeIds + ") AND shour in (" + hours + ") AND sday in (" + days + ") group by edgeid;");
        Query q = StatsEdge.em().createNativeQuery("SELECT edgeid, sum(speedtotal) / sum(observationcount) as speed FROM statsedge WHERE edgeid in (" + edgeIds + ") AND shour in (" + hours + ") AND sday in (" + days + ") group by edgeid;");      


        List edges = q.getResultList();
        
        Double total = 0.0;
        
        for(Object o : edges)
        {
            Object[] r = (Object[])o;   
            total += (Double)r[1];
            
            streetVelocities.put((BigInteger)r[0], (Double)r[1]);
        }

        return streetVelocities;
    }
    
    static public void runReport() {
    	
    	/*

    	#interpeak

    	select sum(speedtotal) / sum(observationcount) as speed from statsedge 
    	where edgeid in (--)
    	and shour > 9 and shour < 17
    	and sday > 1 and sday < 7


    	#pm peak;

    	select sum(speedtotal) / sum(observationcount) as speed from statsedge 
    	where edgeid in (--)
    	and shour > 15 and shour < 20
    	and sday > 1 and sday < 7

    	#night

    	select sum(speedtotal) / sum(observationcount) as speed from statsedge 
    	where edgeid in (--)
    	and shour < 5
    	and sday > 1 and sday < 7 */
    	
    	Logger.info("running report...");
    	
    	List<Journey> journeys = Journey.findAll();
    	for(Journey j : journeys) {
    		
    		
    		try {
    		Query qAm = StatsEdge.em().createNativeQuery("select sum(speedtotal) / sum(observationcount) as speed from statsedge where edgeid in (" + j.path + ") and shour > 6 and shour < 11	and sday > 1 and sday < 7"); 
    		Double am = ((Double)((Double)qAm.getResultList().get(0) * 3.6));
    		
    		Query qInter = StatsEdge.em().createNativeQuery("select sum(speedtotal) / sum(observationcount) as speed from statsedge where edgeid in (" + j.path + ") and shour > 9 and shour < 17	and sday > 1 and sday < 7"); 
    		Double inter = ((Double)((Double)qInter.getResultList().get(0) * 3.6));
    		
    		Query qPm = StatsEdge.em().createNativeQuery("select sum(speedtotal) / sum(observationcount) as speed from statsedge where edgeid in (" + j.path + ") and shour > 15 and shour < 20	and sday > 1 and sday < 7"); 
    		Double pm = ((Double)((Double)qPm.getResultList().get(0) * 3.6));
    		
    		Query qNight = StatsEdge.em().createNativeQuery("select sum(speedtotal) / sum(observationcount) as speed from statsedge where edgeid in (" + j.path + ") and shour < 5 and sday > 1 and sday < 7"); 
    		Double night = ((Double)((Double)qNight.getResultList().get(0) * 3.6));
    		
    		Logger.info(j.name + "," + am + "," + inter + "," + pm + "," + night);
    		}
    		catch (Exception e) {
    			Logger.info(j.name + " missing data data");
    		}
    	
    	}
    	
    }
    
}
