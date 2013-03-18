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
public class GraphEdge extends Model {
 
    public Integer edgeId;
    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public LineString shape;
    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public LineString tripLine1;
    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public LineString tripLine2;
    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public Point tripPoint1;
    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public Point tripPoint2;
    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public Point tripPoint1Origin;
    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public Point tripPoint2Origin;
    
    public static void nativeInsert(Integer edgeId, PlainStreetEdge edge, TripLine tripLine1, TripLine tripLine2)
    {
    	List<String> edgePoints = new ArrayList<String>();
    	List<String> tripLine1Points = new ArrayList<String>();
    	List<String> tripLine2Points = new ArrayList<String>();

    	for(Coordinate coord : edge.getGeometry().getCoordinates()) {
    		edgePoints.add(new Double(coord.x).toString() + " " + new Double(coord.y).toString());
    	}
    	
    	for(Coordinate coord : tripLine1.getGeometryLonLat().getCoordinates()) {
    		tripLine1Points.add(new Double(coord.x).toString() + " " + new Double(coord.y).toString());
    	}
    	
    	for(Coordinate coord : tripLine2.getGeometryLonLat().getCoordinates()) {
    		tripLine2Points.add(new Double(coord.x).toString() + " " + new Double(coord.y).toString());
    	}
    	
    	String edgeLinestring = "LINESTRING(" + StringUtils.join(edgePoints, ", ") + ")";
    	String tripLine1Linestring = "LINESTRING(" + StringUtils.join(tripLine1Points, ", ") + ")";
    	String tripLine2Linestring = "LINESTRING(" + StringUtils.join(tripLine2Points, ", ") + ")";

	    Query idQuery = GraphEdge.em().createNativeQuery("SELECT NEXTVAL('hibernate_sequence');");
    	BigInteger nextId = (BigInteger)idQuery.getSingleResult();

    	GraphEdge.em().createNativeQuery("INSERT INTO graphedge (id, edgeid, shape, tripLine1, tripLine2)" +
        	"  VALUES(?, ?, ST_GeomFromText( ?, 4326), ST_GeomFromText( ?, 4326), ST_GeomFromText( ?, 4326)" +
        	");")
          .setParameter(1,  nextId)
          .setParameter(2,  edgeId)	            
          .setParameter(3,  edgeLinestring)
          .setParameter(4,  tripLine1Linestring)
          .setParameter(5,  tripLine2Linestring)
          .executeUpdate();
    	
    }
    
    public static void nativeInsert(Integer edgeId, PlainStreetEdge edge)
    {
    	List<String> edgePoints = new ArrayList<String>();
    	
    	for(Coordinate coord : edge.getGeometry().getCoordinates()) {
    		edgePoints.add(new Double(coord.x).toString() + " " + new Double(coord.y).toString());
    	}
    	
    	String edgeLinestring = "LINESTRING(" + StringUtils.join(edgePoints, ", ") + ")";
    	
	    Query idQuery = GraphEdge.em().createNativeQuery("SELECT NEXTVAL('hibernate_sequence');");
    	BigInteger nextId = (BigInteger)idQuery.getSingleResult();

    	GraphEdge.em().createNativeQuery("INSERT INTO graphedge (id, edgeid, shape)" +
        	"  VALUES(?, ?, ST_GeomFromText( ?, 4326)" +
        	");")
          .setParameter(1,  nextId)
          .setParameter(2,  edgeId)	            
          .setParameter(3,  edgeLinestring)
          .executeUpdate();
    	
    }
    
}
