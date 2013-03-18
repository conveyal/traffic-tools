package models;

import java.util.Calendar;
import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import org.apache.commons.lang.time.DateUtils;

import play.db.jpa.Model;

@Entity
public class VehicleDistance extends Model {
 
	@ManyToOne
	public Vehicle vehicle;
	
	public Date date;
	
	public Double distance;
	
	public static void updateDistanceTraveled(Vehicle vehicle, Double distance)
	{
		Date today = DateUtils.truncate(new Date(), Calendar.DAY_OF_MONTH);
		
		VehicleDistance distanceObj = VehicleDistance.find("vehicle = ? AND date = ?", vehicle, today).first();
		
		if(distanceObj != null)
		{
			distanceObj.distance += distance;
			distanceObj.save();
		}
		else
		{
			distanceObj = new VehicleDistance();
			
			distanceObj.date = today;
			distanceObj.distance = distance;
			distanceObj.vehicle = vehicle;
			distanceObj.save();
		}
	}
}
