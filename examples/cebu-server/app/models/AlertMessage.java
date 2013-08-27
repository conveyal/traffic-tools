package models;

import java.util.Date;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import play.db.jpa.Model;

@Entity
public class AlertMessage extends Model {
	
    public Date timestamp;
    
    @ManyToOne	
	public Alert alert;
    
    @Column(columnDefinition="TEXT")
    public String description;
    
    @ManyToOne
    public Account account;
}
