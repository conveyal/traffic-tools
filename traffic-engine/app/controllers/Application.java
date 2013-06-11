package controllers;

import play.*;
import play.mvc.*;
import util.GeoUtils;
import util.MapEventData;
import util.ProjectedCoordinate;


import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.*;

import models.*;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;
import org.opentripplanner.routing.impl.GraphServiceImpl;
import org.opentripplanner.routing.graph.Graph;
import org.opentripplanner.routing.graph.Graph.LoadLevel;

import org.springframework.context.ApplicationContext;
import org.springframework.context.support.GenericApplicationContext;

import com.conveyal.traffic.graph.MovementEdge;
import com.conveyal.traffic.graph.TrafficGraph;
import com.conveyal.traffic.graph.VehicleObservation;
import com.conveyal.traffic.graph.VehicleState;
import com.typesafe.config.ConfigFactory;
import com.vividsolutions.jts.geom.Coordinate;


public class Application extends Controller {
	
	public static PrintWriter pw;
	
	public static TrafficGraph graph = TrafficGraph.load(Play.configuration.getProperty("application.otpGraphPath"));

	public static void sendData(Long id, Long time, Double lat, Double lon) {
		
		ProjectedCoordinate pc = GeoUtils.convertLonLatToEuclidean(new Coordinate(lon,lat));
		
		VehicleObservation vo = new VehicleObservation(id, time, pc);
		
		graph.updateVehicle(id, vo);
		
		Logger.info("message for: " +id );
	}

	public static void loadCebu() throws IOException {
	    
		
		 //FileWriter outFile = new FileWriter(new File("/tmp/json.out"));
		 //pw = new PrintWriter(outFile);
		 
		 for(int offset = 0; offset <= 2000000; offset += 100000){
			
			 Logger.info("load offset: " + offset);

			 for(Object o : LocationUpdate.em().createNativeQuery("SELECT imei, timestamp, lat, lon from locationupdate WHERE lat < 30 AND (date_part('month', timestamp) = 4) ORDER BY id asc LIMIT 100000 OFFSET " + offset).getResultList()){
					 String imei = (String)((Object[])o)[0];
					 Date time = (Date)((Object[])o)[1];
					 Double lat = (Double)((Object[])o)[2];
					 Double lon = (Double)((Object[])o)[3];
					
					 Long vehicleId = graph.getVehicleId(imei);
					

					if(lat == null || lon == null)
	                                                continue;

	 
					 VehicleObservation vo = new VehicleObservation(vehicleId, time.getTime(), GeoUtils.convertLatLonToEuclidean(new Coordinate(lat, lon)));
					
					
					 graph.updateVehicle(vehicleId, vo);
					 
					 
					 //try {
						//Thread.sleep(50);
					//} catch (InterruptedException e) {
						// TODO Auto-generated catch block
				//		e.printStackTrace();
				//	}
			 }

		}

		 //pw.close();
		 
        ok();
    }

	public static void index() {
		
		render();
		 
	}
	
	public static void simulator() {
		
		render();
		 
	}

	public static void paths() {
		
		render();
		 
	}

		 
	public static void saveCebuStats() {
		    
		for(Integer edge : graph.getEdgesWithStats()) {
			for(int i = 0; i < 7; i++) {
				for(int j = 0; j < 24; j++ ) {
					if(graph.getEdgeObservations(edge, i, j) > 0)
						StatsEdge.nativeInsert(edge, i, j, graph.getEdgeSpeed(edge, i, j), graph.getTrafficEdge(edge).getGeometry(),  graph.getEdgeObservations(edge, i, j),  graph.getEdgeSpeedTotal(edge, i, j));
				}
			}
		}
    	
        ok();
    }
	
    public static void simulate() {
    	
    	Coordinate coord1 = graph.getRandomPoint();
    	Coordinate coord2 = graph.getRandomPoint();
   
    	List<Integer> edges = graph.getEdgesBetweenPoints(coord1, coord2);
    	
    	MapEventData med = new MapEventData();
		
		med.message = "";
		med.type = "simulatePath";
		med.geom = graph.getPathForEdges(edges);

		ObjectMapper mapper = new ObjectMapper();
	
		try {
			String event = mapper.writeValueAsString(med);
			MapEvent.instance.event.publish(event);
		}
		catch(Exception e) {
			e.printStackTrace();
		}
    	
    	VehicleState vs = new VehicleState((long)1, graph);
    	vs.simulateUpdatePosition(edges, 15.0);
    	
        ok();
    }

    
    public static void edges()
	{
		/*Multimap<Geometry, Edge> edgeMap = graph.getGeomEdgeMap();

		for(Edge edge : edgeMap.values())
		{
			Integer edgeId = graph.getInferredEdge(edge).getEdgeId();

			MathTransform transform;

		    try {
		    	transform = GeoUtils.getTransform(new Coordinate(38.90911, -77.00932)).inverse();

		    	if (graph.getEdge(edgeId).getGeometry() != null)
		    	{
			        Coordinate[] oldCoords = graph.getEdge(edgeId).getGeometry().getCoordinates();
			        int nCoords = oldCoords.length;
			        Coordinate[] newCoords = new Coordinate[nCoords];

			        for (int i = 0; i < nCoords - 1; ++i) {
			            Coordinate coord0 = oldCoords[i];
			            Coordinate coord1 = oldCoords[i+1];

			            double dx = coord1.x - coord0.x;
			            double dy = coord1.y - coord0.y;

			            double length = Math.sqrt(dx * dx + dy * dy);

			            Coordinate c0 = new Coordinate(coord0.x - OFFSET * dy / length, coord0.y - OFFSET * dx / length);
			            Coordinate c1 = new Coordinate(coord1.x - OFFSET * dy / length, coord1.y - OFFSET * dx / length);
			            newCoords[i] = c0;
			            newCoords[i+1] = c1; //will get overwritten except at last iteration
			        }

				    final Geometry transformed = JTS.transform( gf.createLineString(newCoords), transform);
				    transformed.setSRID(4326);


				    List<String> points = new ArrayList<String>();

		        	for(Coordinate coord : transformed.getCoordinates())
		        	{
		        		points.add(new Double(coord.x).toString() + " " + new Double(coord.y).toString());

		        	}

		        	String linestring = "LINESTRING(" + StringUtils.join(points, ", ") + ")";

				    Query idQuery = StreetEdge.em().createNativeQuery("SELECT NEXTVAL('hibernate_sequence');");
			    	BigInteger nextId = (BigInteger)idQuery.getSingleResult();

			    	StreetEdge.em().createNativeQuery("INSERT INTO streetedge (id, edgeid, shape)" +
			        	"  VALUES(?, ?, ST_GeomFromText( ?, 4326));")
			          .setParameter(1,  nextId)
			          .setParameter(2,  edgeId)	            
			          .setParameter(3,  linestring)
			          .executeUpdate();

		    	}
		    }
		    catch(Exception e)
		    {
		    	Logger.error("Can't transform geom.");
		    }

		}*/
	}


}
