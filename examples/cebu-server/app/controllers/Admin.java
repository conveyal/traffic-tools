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

//import org.openplans.tools.tracking.impl.util.GeoUtils;
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

@With(Secure.class)
public class Admin extends Controller {
	
	@Before
    static void setConnectedUser() {
        if(Security.isConnected() && Security.check("admin")) {
            renderArgs.put("user", Security.connected());
        }
        else
        	Application.index();
    }
	
	
	public static void accounts() {
		
		List<Account> accounts = Account.find("order by username").fetch();
		
		List<Operator> operators = Operator.findAll();
		
		render(accounts, operators);
	}
	
	public static void createAccount(String username, String password, String email, Boolean admin, Boolean taxi, Boolean citom, Long operatorId)
	{
		if(!username.isEmpty() && !password.isEmpty() && !email.isEmpty() && Account.find("username = ?", username).first() == null )
			new Account(username, password, email, admin, taxi, citom, operatorId);
		
		Admin.accounts();
	}
	
	public static void updateAccount(String username, String email, Boolean active, Boolean admin, Boolean taxi, Boolean citom, Long operatorId)
	{
		Account.update(username, email, active, admin, taxi, citom, operatorId);
		
		Admin.accounts();
	}
	
	public static void getAccount(String username) {
		
		Account account = Account.find("username = ?", username).first();
		
		renderJSON(account);
	}
	
	
	public static void checkUsername(String username) {
		
		if(Account.find("username = ?", username).first() != null)
			badRequest();
		else
			ok();
	
	}
	
	public static void changePassword(String currentPassword, String newPassword)
	{
		Account.changePassword(Security.connected(), currentPassword, newPassword);
	}
	
	public static void resetPassword(String username, String newPassword)
	{
		Account.resetPassword(username, newPassword);
	}
	
	public static void systemStatus() {
		
		Long registeredPhones = Phone.count();
		
		Calendar cal = Calendar.getInstance();
		cal.add(Calendar.MINUTE, -15);
		Date recentDate = cal.getTime();
		
		Long activePhones = Phone.count("lastUpdate > ?", recentDate);
		
		render(registeredPhones, activePhones);
	}
	
	public static void vechicleStatus(String imei) {
	
		
		systemStatus();
	}

}