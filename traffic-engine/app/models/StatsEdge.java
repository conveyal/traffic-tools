package models;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

import javax.persistence.Entity;
import javax.persistence.Query;

import org.apache.commons.lang.StringUtils;
import org.hibernate.annotations.Type;
import org.opentripplanner.routing.edgetype.PlainStreetEdge;

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
    
    public Integer sday;
    public Integer shour;
    public Long observationCount;
    
    public Double speed;
    public Double speedTotal;
    
    public static void nativeInsert(Integer edgeId, Integer day, Integer hour, Double speed, LineString edge, Long observationCount, Double speedTotal)
    {
    	List<String> edgePoints = new ArrayList<String>();

    	for(Coordinate coord : edge.getCoordinates()) {
    		edgePoints.add(new Double(coord.x).toString() + " " + new Double(coord.y).toString());
    	}
    	    	
    	String edgeLinestring = "LINESTRING(" + StringUtils.join(edgePoints, ", ") + ")";
    	
	    Query idQuery = GraphEdge.em().createNativeQuery("SELECT NEXTVAL('hibernate_sequence');");
    	BigInteger nextId = (BigInteger)idQuery.getSingleResult();

    	GraphEdge.em().createNativeQuery("INSERT INTO statsedge (id, edgeid, sday, shour, shape, speed, observationcount, speedtotal)" +
        	"  VALUES(?, ?, ?, ?, ST_GeomFromText( ?, 4326), ?, ?, ?);")
          .setParameter(1,  nextId)
          .setParameter(2,  edgeId)
          .setParameter(3,  day)
          .setParameter(4,  hour)	    
          .setParameter(5,  edgeLinestring)
          .setParameter(6,  speed)
          .setParameter(7,  observationCount)
          .setParameter(8,  speedTotal)
          .executeUpdate();
    	
    }
    
}

