package api;

import java.text.SimpleDateFormat;
import java.util.Date;

import javax.persistence.ManyToOne;

import models.Message;
import models.Phone;

public class MessageResponse {
	
	public Long id;
	public Long parentId;
    public String timestamp;
    
    public String body;
    
    public MessageResponse(Message message)
    {
    	SimpleDateFormat df = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
    	
    	this.id = message.id;
    	
    	if(message.parent != null)
    		this.parentId = message.parent.id;
    
 //   	this.timestamp = df.format(message.timestamp.);
    	
    	this.body = message.body;
    }
}
	