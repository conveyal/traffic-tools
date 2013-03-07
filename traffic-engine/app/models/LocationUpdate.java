package models;

import java.math.BigInteger;
import java.util.Calendar;
import java.util.Date;

import javax.persistence.Entity;
import javax.persistence.EntityManager;
import javax.persistence.ManyToOne;
import javax.persistence.Query;

import org.hibernate.annotations.Type;

import com.google.gson.annotations.Expose;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Point;


import play.Logger;
import play.db.jpa.Model;

@Entity
public class LocationUpdate extends Model {
	
	@Expose
	public String imei;
    
	public Date timestamp;
	
	@Expose
	public Date adjustedTimestamp;
	
	public Date received;
	public Date sent;
	
	@Expose
    public Double lat;
	@Expose
	public Double lon;
    
    public Boolean panic;
    
    public Boolean boot;
    public Boolean shutdown;  
    public Boolean charging;
    
    @Expose
    public Boolean failedNetwork;
    @Expose
    public Double battery;
    @Expose
    public Integer signal;
    
    @Expose
    public Double velocity;
    
    @Expose
    public Double heading;
    
    @Expose
    public Double gpsError;
    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public Point shape;
    
    public Boolean websocket;
    
    
   /* public 
    if(update.getObservations().size() > 0)
    	//{
    		/*Future<Object> future = ask(Application.remoteObservationActor, update, 60000);
    		
    		future.onSuccess(new OnSuccess<Object>() {
    			public void onSuccess(Object result) {
    				
    				if(result instanceof VehicleUpdateResponse)
    				{
    					//Application.updateVehicleStats((VehicleUpdateResponse)result);
    					
    					if(((VehicleUpdateResponse) result).pathList.size() == 0)
    						return;
    					
    					Logger.info("update results returned: " + ((VehicleUpdateResponse) result).pathList.size());
    				
    					try 
    					{ 
    						// wrapping everything around a try catch
    						if(JPA.local.get() == null)
    			            {
    							JPA.local.set(new JPA());
    							JPA.local.get().entityManager = JPA.newEntityManager();
    			            }
    						JPA.local.get().entityManager.getTransaction().begin();

    						for(ArrayList<Integer> edges : ((VehicleUpdateResponse) result).pathList)
    						{
    							String edgeIds = StringUtils.join(edges, ", ");
    							String sql = "UPDATE streetedge SET inpath = inpath + 1 WHERE edgeid IN (" + edgeIds + ") ";
    							Logger.info(edgeIds);
    							JPA.local.get().entityManager.createNativeQuery(sql).executeUpdate();
    						}
    						
    						JPA.local.get().entityManager.getTransaction().commit();	
    					}
    			        finally 
    			        {
    			            JPA.local.get().entityManager.close();
    			            JPA.local.remove();
    			        }
    				}
    			}
    		});*/
    		
    		//Application.remoteObservationActor.ak(update);
   

}
 
