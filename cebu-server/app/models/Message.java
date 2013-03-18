package models;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import play.db.jpa.Model;

@Entity
public class Message extends Model {
	
	@ManyToOne
	public Phone toPhone;
	
	@ManyToOne
	public Phone fromPhone;
	
	@ManyToOne
    public Message parent;
	
	public Boolean read;

    public Date timestamp;
    
    public Double location_lat;
    public Double location_lon;
    
    @Column(columnDefinition="TEXT")
    public String body;
    
}
