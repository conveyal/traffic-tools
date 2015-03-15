package controllers;

import static akka.pattern.Patterns.ask;
import akka.actor.*;
import akka.dispatch.Future;
import akka.dispatch.OnSuccess;
import au.com.bytecode.opencsv.CSVWriter;
import gov.sandia.cognition.math.matrix.Vector;
import gov.sandia.cognition.math.matrix.VectorFactory;
import play.*;
import play.db.jpa.JPA;
import play.mvc.*;
import utils.DateUtils;

import java.awt.Color;

import java.io.File;
import java.io.IOException;
import java.io.StringWriter;
import java.math.BigInteger;
import java.text.SimpleDateFormat;
import java.util.*;

import javax.persistence.Query;

import org.codehaus.jackson.JsonFactory;
import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.JsonGenerator;
import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.map.*;

import org.apache.commons.lang.StringUtils;
import org.geotools.geometry.jts.JTS;
import org.opengis.referencing.operation.MathTransform;
import org.opentripplanner.routing.graph.Edge;

import com.google.common.collect.Maps;
import com.google.common.collect.Multimap;
import com.typesafe.config.Config;
import com.typesafe.config.ConfigFactory;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.LineString;

import jobs.ObservationHandler;

import models.*;
import api.*;

//@With(Secure.class)
public class Citom extends Controller {

	private static ObjectMapper mapper = new ObjectMapper(); //.configure(SerializationConfig.Feature.WRITE_DATES_AS_TIMESTAMPS, false);
	private static JsonFactory jf = new JsonFactory();

//	public static final SimpleDateFormat sdf = new SimpleDateFormat(
//		     "MM/dd/yyyy HH:mm:ss");

	private static String toJson(Object pojo, boolean prettyPrint)
    throws JsonMappingException, JsonGenerationException, IOException {
        StringWriter sw = new StringWriter();
        JsonGenerator jg = jf.createJsonGenerator(sw);
        if (prettyPrint) {
            jg.useDefaultPrettyPrinter();
        }
        mapper.writeValue(jg, pojo);
        return sw.toString();
    }
	
//	@Before
//    static void setConnectedUser() {
//        if(Security.isConnected() && Security.check("citom")) {
//            renderArgs.put("user", Security.connected());
//        }
//        else
//        	Application.index();
//    }
	
	public static void index() {
		render();
	}	
	
	public static void incidents() {
		render();
	}
	
	public static void conditions() {
		render();
	}
	
	public static void journey(String city) {
		
		List<Journey> saveJourneys = Journey.findAll();
		
		String latLon = "";
		
		if(city.equals("cebu"))
			latLon = "10.2833, 123.9000";
		if(city.equals("manila"))
			latLon = "14.5833, 121.0667";
		if(city.equals("jakarta"))
			latLon = "-6.1745, 106.8227";
		
		render(city, latLon, saveJourneys);
	}
	
	public static void area() {
		render();
	}
	
	public static void saveJourney(String name, Double originLat, Double originLon, Double destinationLat, Double destinationLon, Double speed, Double distance, Double time, String path) {
		
		Journey journey = new Journey();
		
		journey.name = name;
		journey.originLat = originLat;
		journey.originLon = originLon;
		journey.destinationLat = destinationLat;
		journey.destinationLon = destinationLon;
		journey.speed = speed;
		journey.distance = distance;
		journey.time = time;
		journey.path = path;
	
		journey.account = Security.getAccount();
		
		journey.save();
		
		Citom.journey("");
	}
	
	public static void clearJourney(Long id) {
		
		Journey journey = Journey.findById(id);
	
		journey.delete();
		
		Citom.journey("");
	}
	
	public static void alerts(String fromDate, String toDate, String type, String query, Boolean active, Boolean csv) {
		
		List<Alert> alerts = null;
		
		Date from = new Date();
		Date to = new Date();
		
		
		/*if(filter == null || filter.isEmpty() || filter.equals("today"))
		{
			Calendar cal = Calendar.getInstance();
			cal.add(Calendar.HOUR, -24);
			from = cal.getTime();
		}
		else if(filter.equals("yesterday"))
		{
			Calendar cal = Calendar.getInstance();
			cal.add(Calendar.HOUR, -24);
			to = cal.getTime();
			
			cal = Calendar.getInstance();
			cal.add(Calendar.HOUR, -48);
			from = cal.getTime();
			
		}
		else if(filter.equals("week"))
		{
			Calendar cal = Calendar.getInstance();
			cal.add(Calendar.HOUR, -168);
			from = cal.getTime();
		}
		else if(filter.equals("custom"))
		{	
			
		}
		else
		{
			Calendar cal = Calendar.getInstance();
			cal.add(Calendar.HOUR, -24);
			from = cal.getTime();
		}*/

		try
		{
			from = DateUtils.parseDisplay(fromDate + " 00:00:01");
			to = DateUtils.parseDisplay(toDate + " 23:59:59");
		}
		catch(Exception e)
		{
			Logger.info(e.toString());
		}
		
		if(active != null && active)
		{
			if(query != null && !query.isEmpty())
			{
				query = "%" +  query.toLowerCase() + "%";

				if(type != null && !type.isEmpty())
					alerts = Alert.find("(lower(description) like ? or lower(publicdescription) like ? or lower(title) like ?) and activeTo is null and type = ?", query, query, query, type).fetch();
				else
					alerts = Alert.find("(lower(description) like ? or lower(publicdescription) like ? or lower(title) like ?) and activeTo is null ", query, query, query).fetch();
			}
			else
			{
				if(type != null && !type.isEmpty()) 
					alerts = Alert.find("activeTo is null  and type = ?", type).fetch();
				else
					alerts = Alert.find("activeTo is null").fetch();
			}
		}
		else
		{
			if(query != null && !query.isEmpty())
			{
				query = "%" +  query.toLowerCase() + "%";

				if(type != null && !type.isEmpty())
					alerts = Alert.find("(lower(description) like ? or lower(publicdescription) like ? or lower(title) like ?) and (activeFrom >= ? and (activeTo <= ? or activeTo is null)) and type = ?", query, query, query, from, to, type).fetch();
				else
					alerts = Alert.find("(lower(description) like ? or lower(publicdescription) like ? or lower(title) like ?) and (activeFrom >= ? and (activeTo <= ? or activeTo is null)) ", query, query, query, from, to).fetch();
			}
			else
			{
				if(type != null && !type.isEmpty()) 
					alerts = Alert.find("activeFrom >= ? and  (activeTo <= ? or activeTo is null) and type = ?", from, to, type).fetch();
				else
					alerts = Alert.find("activeFrom >= ? and  (activeTo <= ? or activeTo is null) ", from, to).fetch();
			}
		}

		ArrayList<AlertSimple> data = new ArrayList<AlertSimple>();

		for(Alert alert : alerts)
		{
			data.add(new AlertSimple(alert, true));
		}
	
		if(request.format == "xml")
			renderXml(data);
		else if(csv != null && csv)
		{

			StringWriter csvString = new StringWriter();
			CSVWriter csvWriter = new CSVWriter(csvString);
			
			String[] headerBase = "type, activeFrom, activeTo, user, description, publicDescription,  lat, lon".split(",");
			
			csvWriter.writeNext(headerBase);
			 
			for(Alert alert : alerts)
			{
				String[] dataFields = new String[8];
				dataFields[0] = alert.type;
				dataFields[1] = alert.activeFrom.toString();
				if(alert.activeTo != null)
					dataFields[2] = alert.activeTo.toString();
				else
					dataFields[2] = "";
				dataFields[3] = alert.account.username;
				if(alert.description != null)
					dataFields[4] = alert.description;
				else
					dataFields[4] = "";
				if(alert.publicDescription != null)
					dataFields[5] = alert.publicDescription;
				else
					dataFields[5] = "";
				dataFields[6] = alert.locationLat.toString();
				dataFields[7] = alert.locationLon.toString();
				
				csvWriter.writeNext(dataFields);
				
				List<AlertMessage> messages = AlertMessage.find("alert = ?", alert).fetch();
				
				for(AlertMessage message : messages)
				{
					String[] messageFields = new String[7];
					
					messageFields[0] = "-";
					messageFields[1] = message.timestamp.toString();
					messageFields[3] = message.account.username;
					messageFields[5] = message.description;
					
					csvWriter.writeNext(messageFields);
				}
			
			}
			
			response.setHeader("Content-Disposition", "attachment; filename=\"alert_data.csv\"");
			response.setHeader("Content-type", "text/csv");
			
			renderText(csvString);
		}
		else
		{
			try
			{
				renderJSON(mapper.writeValueAsString(data));
			}
			catch (Exception e) {
	            e.printStackTrace();
	            badRequest();
	        }
		}
	}
	
	
public static void alertsCsv(Boolean active, String filter, String fromDate, String toDate, String type) {
		
		/*List<Alert> alerts = null;
		
		Date from = new Date();
		Date to = new Date();
		
		
		if(filter == null || filter.isEmpty() || filter.equals("today"))
		{
			Calendar cal = Calendar.getInstance();
			cal.add(Calendar.HOUR, -24);
			from = cal.getTime();
		}
		else if(filter.equals("yesterday"))
		{
			Calendar cal = Calendar.getInstance();
			cal.add(Calendar.HOUR, -24);
			to = cal.getTime();
			
			cal = Calendar.getInstance();
			cal.add(Calendar.HOUR, -48);
			from = cal.getTime();
			
		}
		else if(filter.equals("week"))
		{
			Calendar cal = Calendar.getInstance();
			cal.add(Calendar.HOUR, -168);
			from = cal.getTime();
		}
		else if(filter.equals("custom"))
		{	
			try
			{
				from = Citom.sdf.parse(fromDate + " 00:00:01");
				to = Citom.sdf.parse(toDate + " 23:59:59");
			}
			catch(Exception e)
			{
				Logger.info(e.toString());
			}
		}
		else
		{
			Calendar cal = Calendar.getInstance();
			cal.add(Calendar.HOUR, -24);
			from = cal.getTime();
		}
		
		if(active != null && active)
		{
			if(type != null && !type.isEmpty())
				alerts = Alert.find("active = true and timestamp >= ? and timestamp <= ? and type = ? order by timestamp", from, to, type).fetch();
			else
				alerts = Alert.find("active = true and timestamp >= ? and timestamp <= ? order by timestamp", from, to).fetch();
		}
		else
		{
			if(type != null && !type.isEmpty())
				alerts = Alert.find("timestamp >= ? and timestamp <= ? and type = ? order by timestamp", from, to, type).fetch();
			else
				alerts = Alert.find("timestamp >= ? and timestamp <= ? order by timestamp", from, to).fetch();
		}
		
		StringWriter csvString = new StringWriter();
		CSVWriter csvWriter = new CSVWriter(csvString);
		
		String[] headerBase = "type, timestamp, user, active, description, lat, lon".split(",");
		
		csvWriter.writeNext(headerBase);
		 
		for(Alert alert : alerts)
		{
			String[] dataFields = new String[7];
			dataFields[0] = alert.type;
			dataFields[1] = alert.timestamp.toString();
			dataFields[2] = alert.account.username;
			dataFields[3] = alert.active.toString();
			dataFields[4] = alert.description;
			dataFields[5] = alert.locationLat.toString();
			dataFields[6] = alert.locationLon.toString();
			
			csvWriter.writeNext(dataFields);
			
			List<AlertMessage> messages = AlertMessage.find("alert = ?", alert).fetch();
			
			for(AlertMessage message : messages)
			{
				String[] messageFields = new String[7];
				
				messageFields[0] = "-";
				messageFields[1] = message.timestamp.toString();
				messageFields[2] = message.account.username;
				messageFields[4] = message.description;
				
				csvWriter.writeNext(messageFields);
			}
			
			
		}
		
		response.setHeader("Content-Disposition", "attachment; filename=\"alert_data.csv\"");
		response.setHeader("Content-type", "text/csv");*/
		
		renderText("");
	}
	
	
	public static void alertMessages(Long id) {
		
		Alert alert = Alert.findById(id);
		
		List<AlertMessage> messages = AlertMessage.find("alert = ?", alert).fetch();
		
		if(request.format == "xml")
			renderXml(messages);
		else
			renderJSON(messages);
	}
	
	
	public static void saveAlertMessage(Long id, String message) {
		
		Alert alert = Alert.findById(id);
		
		if(alert == null)
			badRequest();

		AlertMessage newMessage = new AlertMessage();
		newMessage.alert = alert;
		newMessage.description = message;
		newMessage.timestamp = new Date();
		newMessage.account = Security.getAccount();
		newMessage.save();
		
		ok();
	}
	
	
	public static void clearAlert(Long id) {
		
		Alert alert = Alert.findById(id);
		
		//alert.active = false;
		alert.activeTo = new Date();
		alert.save();
		
		ok();
	}
	
	public static void createAlert() {
		
		AlertSimple alert;
		
		Phone.updateAlerts();

        try {
        	alert = mapper.readValue(params.get("body"), AlertSimple.class);

            Alert newAlert = new Alert();
            
            newAlert.title = alert.title;
			newAlert.locationLat = alert.locationLat;
			newAlert.locationLon = alert.locationLon;
			newAlert.description = alert.description;
			newAlert.publicDescription = alert.publicDescription;
			newAlert.type = alert.type;
			newAlert.publiclyVisible = alert.publiclyVisible;
			newAlert.account = Security.getAccount();
			newAlert.activeFrom = alert.activeFrom;
			newAlert.activeTo = alert.activeTo;
			
			newAlert.save();
			//ok();
            renderJSON(Citom.toJson(new AlertSimple(newAlert, true), false));

        } catch (Exception e) {
            e.printStackTrace();
            badRequest();
        }
		
	}

	public static void updateAlert() {
		
		AlertSimple alert;
		
		Phone.updateAlerts();

        try {
        	alert = mapper.readValue(params.get("body"), AlertSimple.class);

            if(alert.id == null)
                badRequest();

            Alert updatedAlert = Alert.findById(alert.id);
            
            updatedAlert.title = alert.title;
			updatedAlert.locationLat = alert.locationLat;
			updatedAlert.locationLon = alert.locationLon;
			updatedAlert.description = alert.description;
			updatedAlert.publicDescription = alert.publicDescription;
			updatedAlert.type = alert.type;
			updatedAlert.publiclyVisible = alert.publiclyVisible;
			
			updatedAlert.activeFrom = alert.activeFrom;
			updatedAlert.activeTo = alert.activeTo;
				

			updatedAlert.save();
			ok();
            //renderJSON(Api.toJson(updatedAlert, false));
        } catch (Exception e) {
            e.printStackTrace();
            badRequest();
        }
		
	}

}