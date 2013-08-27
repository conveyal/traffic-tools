package models;

import javax.persistence.Entity;

import play.db.jpa.Model;

@Entity
public class Driver extends Model {
 
    public String name;
    public String driverId;
}
