package models;

import java.util.Calendar;
import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.Query;

import org.apache.commons.lang.time.DateUtils;

import play.db.jpa.Model;

@Entity
public class Vehicle extends Model {
 
    public String bodyNumber;
    
    public Double getDistanceToday()
    {
    	Date today = DateUtils.truncate(new Date(), Calendar.DAY_OF_MONTH);
    	
    	Query query= Vehicle.em().createQuery("SELECT SUM(v.distance) FROM VehicleDistance as v WHERE vehicle_id = ? and date >= ?")
    			.setParameter(1, this.id)
    			.setParameter(2, today);
    	
    	Double distance = (Double) query.getSingleResult();
    	
    	if(distance != null && distance > 0)
    		return distance / 1000;
    	else
    		return 0.0;
    }
    
    public Double getDistanceSevenDays()
    {
	    Calendar weekCal = Calendar.getInstance();
	    weekCal.add(Calendar.DATE, -7);
	    
	    Date week = DateUtils.truncate(weekCal.getTime(), Calendar.DAY_OF_MONTH);
    	
    	Query query= Vehicle.em().createQuery("SELECT SUM(v.distance) FROM VehicleDistance as v WHERE vehicle_id = ? and date > ?")
    			.setParameter(1, this.id)
    			.setParameter(2, week);
    	
    	Double distance = (Double) query.getSingleResult();
    	
    	if(distance != null && distance > 0)
    		return distance / 1000;
    	else
    		return 0.0;
    }
    
    public Double getDistanceThirtyDays()
    {
    	Calendar monthCal = Calendar.getInstance();
    	monthCal.add(Calendar.DATE, -30);
	    
	    Date month = DateUtils.truncate(monthCal.getTime(), Calendar.DAY_OF_MONTH);
    	
    	Query query= Vehicle.em().createQuery("SELECT SUM(v.distance) FROM VehicleDistance as v WHERE vehicle_id = ? and date > ?")
    			.setParameter(1, this.id)
    			.setParameter(2, month);
    	
    	Double distance = (Double) query.getSingleResult();
    	
    	if(distance != null && distance > 0)
    		return distance / 1000;
    	else
    		return 0.0;
    }
}
