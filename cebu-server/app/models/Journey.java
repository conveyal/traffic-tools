package models;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import play.db.jpa.Model;

@Entity
public class Journey extends Model {
	
	public String name;
	
	public Double originLat;
    public Double originLon;
    
    public Double destinationLat;
    public Double destinationLon;
    
    public Double distance;
    public Double speed;
    public Double time;
    
    @ManyToOne
    public Account account;
}
