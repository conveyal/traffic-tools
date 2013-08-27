package models;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;

import com.google.android.gcm.server.*;

import play.db.jpa.Model;

@Entity
public class Phone extends Model {

	public String imei;
	
	public String phoneNumber;
	
	@ManyToOne
	public Operator operator;
	
	@ManyToOne
	public Driver driver;
	
	@ManyToOne
	public Vehicle vehicle;
	
	public Date lastUpdate;
	
	public Boolean panic;
	    
    public Double recentLat;
    public Double recentLon;
    
    @Column(columnDefinition="TEXT")
    public String gcmKey;
    
    @Transient
    public List<MessageData> messages = new ArrayList<MessageData>();
    
    public void clearMessages()
    {
    	List<Message> m  = Message.find("fromPhone = ?", this).fetch();
    	for(Message message : m)
    	{
    		message.read = true;
    		message.save();
    	}
    }
    
    public List<LocationUpdate> getRecentUpdates(Integer number)
    {
    	List<LocationUpdate> updates = LocationUpdate.find("imei = ? order by id desc", this.imei).fetch(number);
    	
    	return updates;
    }
    
    public List<LocationUpdate> getRecentNetwork(Integer number)
    {
    	List<LocationUpdate> updates = LocationUpdate.find("imei = ? and failednetwork = true order by id desc", this.imei).fetch(number);
    	
    	return updates;
    }
    
    public List<LocationUpdate> getRecentBoot(Integer number)
    {
    	List<LocationUpdate> updates = LocationUpdate.find("imei = ? and boot = true order by id desc", this.imei).fetch(number);
    	
    	return updates;
    }
    
    public List<LocationUpdate> getRecentShutdown(Integer number)
    {
    	List<LocationUpdate> updates = LocationUpdate.find("imei = ? and shutdown = true order by id desc", this.imei).fetch(number);
    	
    	return updates;
    }
    
    public void sendMessage(String message)
    {
    	Message m  = new Message();
    	
    	m.toPhone = this;
    	m.timestamp = new Date();
    	m.read = false;
    	m.body = message;
    	
    	m.save();
    	
    	if(gcmKey != null && gcmKey != "")
    	{
    		Sender sender = new Sender("AIzaSyDJKs_nzAsdvhtiAdRzQoiz6V_rNq0-Uq4");
    		com.google.android.gcm.server.Message gcmMessage = new com.google.android.gcm.server.Message.Builder().addData("type", "message").addData("id", m.id.toString()).addData("timestamp", m.timestamp.toLocaleString()).addData("message", m.body).build();
    
    		try {
				Result result = sender.send(gcmMessage, gcmKey, 5);
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
    	}
    }
    
    public static void updateAlerts()
    {
    	
    	Calendar cal = Calendar.getInstance();
		cal.add(Calendar.HOUR, -12);
		Date recentDate = cal.getTime();
		
		// find all active phones and send alertUpdate message
		
    	List<Phone> phones = Phone.find("lastUpdate > ?", recentDate).fetch();
    	
    	for(Phone p : phones) {
    		
    		if(p.gcmKey != null && p.gcmKey != "")
        	{
        		Sender sender = new Sender("AIzaSyDJKs_nzAsdvhtiAdRzQoiz6V_rNq0-Uq4");
        		com.google.android.gcm.server.Message gcmMessage = new com.google.android.gcm.server.Message.Builder().addData("type", "alertUpdate").build();
        
        		try {
    				Result result = sender.send(gcmMessage, p.gcmKey, 5);
    				
    			} catch (IOException e) {
    				// TODO Auto-generated catch block
    				e.printStackTrace();
    			}
        	}
    	}
    	
    }
    
    public void clearPanic()
    {
    	this.panic = false;
    	this.save();
    	
    	if(gcmKey != null && gcmKey != "")
    	{
    		Sender sender = new Sender("AIzaSyDJKs_nzAsdvhtiAdRzQoiz6V_rNq0-Uq4");
    		com.google.android.gcm.server.Message gcmMessage = new com.google.android.gcm.server.Message.Builder().addData("type", "clearPanic").build();
    
    		try {
				Result result = sender.send(gcmMessage, gcmKey, 5);
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
    	}
    }
    
    
    public void populateUnreadMessages()
    {
    	List<Message> m = Message.find("fromPhone = ? and read = false order by timestamp", this).fetch();
    	for(Message message : m)
    	{			
    		messages.add(new MessageData(message));
    	}
    }
}
 