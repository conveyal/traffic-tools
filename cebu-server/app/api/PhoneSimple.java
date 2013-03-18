package api;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import models.Phone;
import models.MessageData;


public class PhoneSimple {

	public Long id;

	public String imei;

	public Boolean panic;
	public List<MessageData> messages;

	public Boolean active;
	
	public Long driverId;
	public Long vehicleId;
	
	public String driver;
	public String vehicle;

	public Date lastUpdate;
	    
    public Double recentLat;
    public Double recentLon;

    public PhoneSimple(Phone phone, Date recentDate)
    {
    	this.id = phone.id;
    	this.imei = phone.imei;
    	this.panic = phone.panic;
    	this.messages = phone.messages;

    	this.recentLat = phone.recentLat;
    	this.recentLon = phone.recentLon;

    	this.lastUpdate = phone.lastUpdate;

    	if(recentDate != null)
    	{
	   		this.active = !phone.lastUpdate.before(recentDate);
	   	}

    	if(phone.driver != null)
    	{
    		this.driverId = phone.driver.id;
    		this.driver = phone.driver.driverId;
    	}
    	
    	if(phone.vehicle != null)
    	{
    		this.vehicleId = phone.vehicle.id;
    		this.vehicle = phone.vehicle.bodyNumber;
    	}
    }

  }

