package models;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import play.db.jpa.Model;

public class MessageData {
	
	public Long id;
	
	public Boolean read;

    public Date timestamp;

    public String body;
    
    public MessageData(Message message)
    {
    	this.id = message.id;
    	this.read = message.read;
    	this.timestamp = message.timestamp;
    	this.body = message.body;
    }
    
}
