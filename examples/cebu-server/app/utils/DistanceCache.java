package utils;

import java.util.HashMap;
import java.util.List;

import javax.persistence.Query;

import org.codehaus.groovy.tools.shell.util.Logger;
import org.geotools.geometry.jts.JTS;

import com.vividsolutions.jts.geom.Coordinate;

import akka.event.Logging;

import models.Phone;
import models.Vehicle;
import models.VehicleDistance;


public class DistanceCache {

	HashMap<Vehicle,Coordinate> vechiclePositions = new HashMap<Vehicle,Coordinate>();
	
	HashMap<Vehicle,Double> vehicleDistance = new HashMap<Vehicle,Double>();
	
	HashMap<String,Vehicle> vehicleImeiLinks = new HashMap<String,Vehicle>();
	
	public void linkImeiToVehicle(String imei, Vehicle vehicle)
	{
		vehicleImeiLinks.put(imei, vehicle);
	}
	
	public Double updateDistance(String imei, Coordinate newCoord, Double error)
	{
		Double distance = 0.0;
		
		Vehicle vehicle = vehicleImeiLinks.get(imei);
		
		if(vehicle == null)
		{
			Phone phone = Phone.find("imei = ?", imei).first();
			
			if(phone == null)
				return 0.0;
			
			vehicle = phone.vehicle;
					
			vehicleImeiLinks.put(imei, vehicle);
		}	
		
		if(vechiclePositions.containsKey(vehicle))
		{
			Coordinate oldCoord = vechiclePositions.get(vehicle);
			try
			{
				distance = JTS.orthodromicDistance(newCoord,oldCoord,org.geotools.referencing.crs.DefaultGeographicCRS.WGS84);
			}
			catch(Exception e)
			{
			
			}
			
			//play.Logger.info("Distance traveled for IMEI " + imei + ": " + distance + "(" + error + ")");
			
			if(distance < (error * 4) || error > 50)
				distance = 0.0;
			else
				vechiclePositions.put(vehicle, newCoord);
			
			synchronized(vehicleDistance)
			{
				if(vehicleDistance.containsKey(vehicle))
					vehicleDistance.put(vehicle, vehicleDistance.get(vehicle) + distance);
				else
					vehicleDistance.put(vehicle, distance);
			}
						
		}
		else
			vechiclePositions.put(vehicle, newCoord);
	
		flushDistances();
		
		return distance;
	}
	
	public void flushDistances()
	{
		synchronized(vehicleDistance)
		{
			for(Vehicle vehicle : vehicleDistance.keySet())
			{
				VehicleDistance.updateDistanceTraveled(vehicle, vehicleDistance.get(vehicle));
				vehicleDistance.remove(vehicle);
			}
		}
	}
	
	
}
