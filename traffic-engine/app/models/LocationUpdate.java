package models;

import java.math.BigInteger;
import java.util.Calendar;
import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.ManyToOne;
import javax.persistence.Query;

import org.hibernate.annotations.Type;

import com.google.gson.annotations.Expose;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Point;


import play.Logger;
import play.db.jpa.Model;

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
    

}
 
