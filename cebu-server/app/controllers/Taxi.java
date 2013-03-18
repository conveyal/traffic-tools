package controllers;

import static akka.pattern.Patterns.ask;
import akka.actor.*;
import akka.dispatch.Future;
import akka.dispatch.OnSuccess;
import gov.sandia.cognition.math.matrix.Vector;
import gov.sandia.cognition.math.matrix.VectorFactory;
import play.*;
import play.db.jpa.JPA;
import play.mvc.*;

import java.awt.Color;

import java.io.File;
import java.math.BigInteger;
import java.util.*;

import javax.persistence.Query;

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

@With(Secure.class)
public class Taxi extends Controller {
	
	@Before
    static void setConnectedUser() {
        if(Security.isConnected() && Security.check("taxi")) {
            renderArgs.put("user", Security.connected());
        }
        else
        	Application.index();
    }
	
	public static void activeTaxis() {
		

		Calendar cal = Calendar.getInstance();
		cal.add(Calendar.MINUTE, -15);
		Date recentDate = cal.getTime();
		
		List<Phone> phones;
		
		//if(Security.getAccount().operator == null)
			phones = Phone.find("recentLat is not null AND recentLon is not null AND lastUpdate > ? order by id", recentDate).fetch();
		//else
		//	phones = Phone.find("lastUpdate > ? and operator = ? order by id", recentDate, Security.getAccount().operator).fetch();
		
		for(Phone phone : phones)
		{
			phone.populateUnreadMessages();
		}
		
		if(request.format == "xml")
			renderXml(phones);
		else
			renderJSON(phones);
	}
	
	public static void index() {
			
		render();
	}

	public static void clearMessages(Long phoneId) {
		
		Phone phone = Phone.findById(phoneId);
		
		phone.clearMessages();
	}

	public static void clearPanic(Long phoneId) {
		
		Phone phone = Phone.findById(phoneId);
		
		phone.clearPanic();
	}
	
	public static void sendMessage(Long phoneId, String message) {
		
		Phone phone = Phone.findById(phoneId);
		
		phone.sendMessage(message);
	}

	public static void taxis(String type) {
	
		if(type == null)
			type = "all"; 

		List<Phone> phones;

		String sql = "recentLat is not null AND recentLon is not null";	
		
		Calendar cal = Calendar.getInstance();
		cal.add(Calendar.MINUTE, -15);
		Date recentDate = cal.getTime();

		if(type.equals("active"))
		{
			phones = Phone.find(sql + " AND lastUpdate > ? order by id", recentDate).fetch();
		}
		else // active
		{	

			phones = Phone.find(sql).fetch();
		
		}

		List<PhoneSimple> phoneData = new ArrayList<PhoneSimple>(); 

		for(Phone p : phones)
		{
			Boolean include = true;
			
			// check if operator matches
			if(Security.getAccount().operator != null && (p.operator == null || p.operator.id != Security.getAccount().operator.id))
			{
				// operator not allowed
				include = false;
			}

			// check for messages
			if(include)
			{
				p.populateUnreadMessages();

				// if message query filter locations without messages
				if(type.equals("messages") && p.messages.size() < 1)
					include = false;
			}

			if(include)
				phoneData.add(new PhoneSimple(p, recentDate));
		}
		
		if(request.format == "xml")
			renderXml(phoneData);
		else
			renderJSON(phoneData);
	}

	
	public static void omReport() {
		
		List<Vehicle> vehicles = new ArrayList<Vehicle>();
		List<Phone> phones;
	
		if(Security.getAccount().operator == null)
			phones = Phone.find("not lastUpdate is null order by lastUpdate desc").fetch();
		else
			phones = Phone.find("operator = ? and not lastUpdate is null order by lastUpdate desc", Security.getAccount().operator).fetch();
			
		for(Phone phone : phones)
		{
			if(phone.vehicle != null)
				vehicles.add(phone.vehicle);
		}
		
		render(vehicles);
	}
	
	
}