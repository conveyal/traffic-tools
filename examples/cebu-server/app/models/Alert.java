package models;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import play.db.jpa.Model;

@Entity
public class Alert extends Model {
	
    public String type;
    public String title;
    public Date activeFrom;
    public Date activeTo;
    
    public Boolean publiclyVisible;
    
    public Double locationLat;
    public Double locationLon;
    
    @Column(columnDefinition="TEXT")
    public String description;

    @Column(columnDefinition="TEXT")
    public String publicDescription;
    
    @ManyToOne
    public Account account;
    
}
