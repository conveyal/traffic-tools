package models;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.ManyToOne;
import javax.persistence.Query;

import org.apache.commons.httpclient.NameValuePair;
import org.apache.http.HttpResponse;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.hibernate.annotations.Type;

import com.conveyal.traffic.graph.utils.GeoUtils;
import com.conveyal.traffic.graph.utils.ProjectedCoordinate;
import com.conveyal.trafficprobe.TrafficProbeProtos.LocationUpdate.Location;
import com.google.gson.annotations.Expose;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Point;

import controllers.Api;

import play.Logger;
import play.db.jpa.Model;
import utils.Observation;

@Entity
public class LocationUpdate extends Model {
	
	@Expose
	public String imei;
    
	public Date timestamp;
	
	@Expose
	public Date adjustedTimestamp;
	
	public Date received;
	public Date sent;
	
	@Expose
    public Double lat;
	@Expose
	public Double lon;
    
    public Boolean panic;
    
    public Boolean boot;
    public Boolean shutdown;  
    public Boolean charging;
    
    @Expose
    public Boolean failedNetwork;
    @Expose
    public Double battery;
    @Expose
    public Integer signal;
    
    @Expose
    public Double velocity;
    
    @Expose
    public Double heading;
    
    @Expose
    public Double gpsError;
    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public Point shape;
    
    public Boolean websocket;
    
    public Observation getObservationData()
    {
    	Observation obsData = new Observation(this.imei, this.timestamp, new Coordinate(this.lat, this.lon), this.velocity, this.heading, this.gpsError);
    	
    	return obsData;
    }
    
    public Long getMinutesSinceLastUpdate()
    {
    	LocationUpdate lastUpdate = LocationUpdate.find("imei = ? and id < ? order by id desc", this.imei, this.id).first();
    	
    	if(lastUpdate != null && this.received != null && lastUpdate.received != null)
    	{
    		return (this.received.getTime() - lastUpdate.received.getTime()) / 1000 / 60;  
    	}
    	else 
    		return new Long(0);
    }
    
    public Long getMinutesSinceLastGoodNetwork()
    {
    	LocationUpdate lastUpdate = LocationUpdate.find("imei = ? and id < ? and failednetwork = false order by id desc", this.imei, this.id).first();
    	
    	if(lastUpdate != null && this.received != null && lastUpdate.received != null)
    	{
    		return (this.received.getTime() - lastUpdate.received.getTime()) / 1000 / 60;  
    	}
    	else 
    		return new Long(0);
    }
    
    static public void pbLocationUpdate(com.conveyal.trafficprobe.TrafficProbeProtos.LocationUpdate locationUpdate)
    {
    	Date timeReceived = new Date();
    	
    	Long phoneId = locationUpdate.getPhone();
    	
    	Phone phone = Phone.findById(phoneId);
    	
    	if(phone == null)
    	{
    		Logger.info("Phone " + phoneId + " not found.");
    		return;
    	}
    	 
    	Long intitialTimestamp = locationUpdate.getTime();
    	
    	Double lat = null;
    	Double lon = null;
    	
    	
    	for(Location location : locationUpdate.getLocationList())
    	{
   
    		try
    		{
	    		Date observationTime = new Date(intitialTimestamp + location.getTimeoffset());
	    		
	    		lat = new Double(location.getLat());
	    		lon = new Double(location.getLon());
	    		Double velocity = new Double(location.getVelocity());
	    		Double heading = new Double(location.getHeading());
	    		Double gpsError = new Double(location.getAccuracy());
	    		
	    		Coordinate locationCoord = new Coordinate(lon, lat);
	    		Observation observation = new Observation(phone.imei, observationTime, locationCoord, velocity, heading, gpsError);
	    		
	    		//Api.distanceCache.updateDistance(phone.imei, locationCoord, gpsError);
	    		
	    		DefaultHttpClient httpclient = new DefaultHttpClient();
	        	HttpPost httpPost = new HttpPost("http://localhost:9001/application/sendData");
	        	List <BasicNameValuePair> nvps = new ArrayList <BasicNameValuePair>();
	        	nvps.add(new BasicNameValuePair("lat", lat.toString()));
	        	nvps.add(new BasicNameValuePair("lon", lon.toString()));
	        	nvps.add(new BasicNameValuePair("id", phoneId.toString()));
	        	nvps.add(new BasicNameValuePair("time", new Long(observationTime.getTime()).toString()));
	     
	        	try {
	        		httpPost.setEntity(new UrlEncodedFormEntity(nvps));
	    			httpclient.execute(httpPost);
	    		} catch (Exception e) {
	    			e.printStackTrace();
	    		}
	    		
	    		LocationUpdate.natveInsert(LocationUpdate.em(), phone.imei, observation, observationTime, observationTime, timeReceived, true);
    		}
    		catch(Exception e)
    		{
    			Logger.error("Could not inersert location update: " + e);
    			e.printStackTrace();
    		}
    	}
    	
    	if(lat != null && lon != null)
    	{
			phone.recentLat = lat;
			phone.recentLon = lon;
			phone.lastUpdate = new Date();
			phone.save();
    	}
    }
    
    
    static public void natveInsert(EntityManager em, String imei, Observation obs, Date original, Date sent, Date received, Boolean websocket)
    {
    	Query idQuery = em().createNativeQuery("SELECT NEXTVAL('hibernate_sequence');");
    	BigInteger nextId = (BigInteger)idQuery.getSingleResult();
    	

    	em.createNativeQuery("INSERT INTO locationupdate (id, imei, adjustedtimestamp, lat, lon, velocity, heading, gpserror, shape, websocket, timestamp, received)" +
    			"  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ST_GeomFromText( ?, 4326), ?, ?, ?);")
    			.setParameter(1,  nextId)
    			.setParameter(2,  obs.getVehicleId())
    			.setParameter(3,  obs.getTimestamp())
    			.setParameter(4,  obs.getObsCoordsLatLon().y)
    			.setParameter(5,  obs.getObsCoordsLatLon().x)
    			.setParameter(6,  obs.getVelocity())
    			.setParameter(7,  obs.getHeading())
    			.setParameter(8,  obs.getAccuracy())
    			.setParameter(9,  "POINT(" + obs.getObsCoordsLatLon().y +  " " + obs.getObsCoordsLatLon().x + ")")
    			.setParameter(10,  websocket)
    			.setParameter(11,  original)
    			.setParameter(12,  received)
    			
    			.executeUpdate();
  
    }
    
    static public void natveInsert(EntityManager em, String imei, Observation obs, Boolean charging, Double battery, Date original, Date sent, Date received, Boolean boot, Boolean shutdown, Boolean failedNetwork, Integer signal)
    {
    	Query idQuery = em().createNativeQuery("SELECT NEXTVAL('hibernate_sequence');");
    	BigInteger nextId = (BigInteger)idQuery.getSingleResult();
    	

    	em.createNativeQuery("INSERT INTO locationupdate (id, imei, adjustedtimestamp, lat, lon, velocity, heading, gpserror, shape, charging, battery, sent, received, boot, failednetwork, signal, shutdown, timestamp)" +
    			"  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ST_GeomFromText( ?, 4326), ?, ?, ?, ?, ?, ?, ?, ?, ?);")
    			.setParameter(1,  nextId)
    			.setParameter(2,  obs.getVehicleId())
    			.setParameter(3,  obs.getTimestamp())
    			.setParameter(4,  obs.getObsCoordsLatLon().y)
    			.setParameter(5,  obs.getObsCoordsLatLon().x)
    			.setParameter(6,  obs.getVelocity())
    			.setParameter(7,  obs.getHeading())
    			.setParameter(8,  obs.getAccuracy())
    			.setParameter(9,  "POINT(" + obs.getObsCoordsLatLon().y +  " " + obs.getObsCoordsLatLon().x + ")")
    			.setParameter(10, charging)
    			.setParameter(11, battery)
    			.setParameter(12, sent)
    			.setParameter(13, received)
    			.setParameter(14, boot)
    			.setParameter(15, failedNetwork)
    			.setParameter(16, signal)
    			.setParameter(17, shutdown)
    			.setParameter(18,  original)
    			.executeUpdate();
    	
    }
    
    static public void natveInsert(EntityManager em, String imei, Boolean charging, Double battery, Date original, Date adjusted, Date sent, Date received, Boolean boot, Boolean shutdown, Boolean failedNetwork, Integer signal)
    {
    	Query idQuery = em().createNativeQuery("SELECT NEXTVAL('hibernate_sequence');");
    	BigInteger nextId = (BigInteger)idQuery.getSingleResult();

		em.createNativeQuery("INSERT INTO locationupdate (id, imei, charging, battery, sent, received, boot, failednetwork, signal, shutdown, timestamp, adjustedtimestamp)" +
    			"  VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);")
    			.setParameter(1,  nextId)
    			.setParameter(2,  imei)
    			.setParameter(3, charging)
    			.setParameter(4, battery)
    			.setParameter(5, sent)
    			.setParameter(6, received)
    			.setParameter(7, boot)
    			.setParameter(8, failedNetwork)
    			.setParameter(9, signal)
    			.setParameter(10, shutdown)
    			.setParameter(11,  original)
    			.setParameter(12,  adjusted)
    			.executeUpdate();
    	
    }
    
    public void calcAdjustedTime()
    {
    	Long timeDelta = received.getTime() - sent.getTime();
		
		Calendar calendar = Calendar.getInstance();
	
		if(timestamp != null)
			calendar.setTimeInMillis(timestamp.getTime() + timeDelta);
		else
			calendar.setTimeInMillis(sent.getTime() + timeDelta);
    	
		em().createNativeQuery("UPDATE locationupdate SET adjustedtimestamp = ? WHERE id = ?;")
    			.setParameter(1,  calendar.getTime())
    			.setParameter(2,  this.id)
    			.executeUpdate();
    	
    }

}
 
