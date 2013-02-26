package com.conveyal.trafficprobe;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import com.loopj.android.http.AsyncHttpClient;
import com.loopj.android.http.AsyncHttpResponseHandler;
import com.loopj.android.http.JsonHttpResponseHandler;
import com.loopj.android.http.RequestParams;

import de.tavendo.autobahn.WebSocketConnection;
import de.tavendo.autobahn.WebSocketException;
import de.tavendo.autobahn.WebSocketHandler;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.location.Location;
import android.location.LocationManager;
import android.os.Binder;
import android.os.IBinder;
import android.preference.PreferenceManager;
import android.telephony.TelephonyManager;
import android.util.Log;

public class LocationService extends Service {

	private static int 		GPS_RETRY_INTERVAL 		= 15; 	// seconds 
	private static int 		GPS_UPDATE_INTERVAL 	= 5; 	// seconds 
	private static long		MIN_ACCURACY 			= 15; 	// meters
	private static int 		MIN_TRANSMIT_INTERVAL 	= 30; 	// seconds
	private static String 	URL_BASE 				= "http://cebutraffic.org/";
	
	private static String  	WS_LOCATION_URL			= "ws://cebutraffic.org/ws/location";
	
	private static int 		NOTIFICATION_ID			= 348723201;
	
	private static Boolean 	gpsStarted 		= false;
	private static Boolean 	loggedIn 		= false;
	private static Boolean 	registered 		= false;
	private static Boolean 	registering		= false;

	public static String 	imei 			= null;
	public static Long 		phoneId			= null;
	
	public static String 	appVersion 		= "";
	
	private static String 	driver 			= "";
    private static String 	bodyNumber 		= "";
    private static String 	operator 		= "registering...";
    
    private static String 	gpsStatus 		= "searching...";
    private static String 	networkStatus 	= "connecting...";
    
    public static ArrayList<Operator> operatorList = new ArrayList<Operator>();    
    
	
	private final IBinder binder = new LocationServiceBinder();
	private static ILocationServiceClient mainServiceClient;
	private ProbeLocationListener probeLocationListener;
	
	private LocationManager gpsLocationManager;
	private NotificationManager gpsNotificationManager;
	private AlarmManager 	retryGpsAlarmManager;
	
	private Date lastTransmitTime = null;

	private boolean gpsEnabled;
	
	private List<Location> locationUpdateList = Collections.synchronizedList(new ArrayList<Location>());

	private final WebSocketConnection websocketConnection = new WebSocketConnection();
	 
	
	public static byte[] createLocationUpdate(Long phoneId, List<Location> locations)
	{
		TrafficProbeProtos.LocationUpdate.Builder locationUpdateBuilder = TrafficProbeProtos.LocationUpdate.newBuilder();
		
		Long firstUpdate =  null;
		Long previousUpdate =  null;
		
		for(Location location : locations)
		{
			TrafficProbeProtos.LocationUpdate.Location.Builder locationBuilder = TrafficProbeProtos.LocationUpdate.Location.newBuilder();
		
			if(firstUpdate == null)
			{
				firstUpdate = location.getTime();
				
			}
			else
			{
				//
				Integer timeDelta = (int)(location.getTime() - previousUpdate);
				locationBuilder.setTimeoffset(timeDelta);
			}
			
			Log.i("LocationUpdate", "Casting from " + location.getLatitude() + ", " + location.getLongitude()  + " to "  + (float)location.getLatitude() + ", " + (float)location.getLongitude());
			
			locationBuilder.setLat((float)location.getLatitude());
			locationBuilder.setLon((float)location.getLongitude());
			
			if(location.getSpeed() > 0)
				locationBuilder.setVelocity((int)location.getSpeed());
			
			if(location.getBearing() > 0)
				locationBuilder.setHeading((int)location.getBearing());
			
			if(location.getAccuracy() > 0)
				locationBuilder.setAccuracy((int)location.getAccuracy());

			locationUpdateBuilder.addLocation(locationBuilder);
			
			previousUpdate = location.getTime();
		}
		
		if(firstUpdate != null)
		locationUpdateBuilder.setTime(firstUpdate);

		locationUpdateBuilder.setPhone(phoneId);
		
		byte[] data = locationUpdateBuilder.build().toByteArray();
		
		return data;
	}
	
	
	@Override
	public IBinder onBind(Intent intent) {
		return binder;
	}
	
	public static void setServiceClient(ILocationServiceClient mainForm)
    {
        mainServiceClient = mainForm;
    }
	
	@Override
    public void onCreate()
    {
        Log.i("LocationService", "onCreate");
        
        try {
        	appVersion = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        }
        catch(Exception e){
        	Log.e("LocationService", "onCreate: couldn't fetch app version");
        }
        
        retryGpsAlarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);
        gpsNotificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        
        if(imei == null)
        {
        	TelephonyManager telephonyManager = (TelephonyManager)getSystemService(Context.TELEPHONY_SERVICE);
    		LocationService.imei = telephonyManager.getDeviceId();
        }
        
        doAuthenticate();
        
        
        Intent contentIntent = new Intent(this, ProbeMainActivity.class);

        PendingIntent pending = PendingIntent.getActivity(getApplicationContext(), 0, contentIntent,
                android.content.Intent.FLAG_ACTIVITY_NEW_TASK);

        Notification notification = new Notification(R.drawable.tray_icon, null, System.currentTimeMillis());
        notification.flags |= Notification.FLAG_ONGOING_EVENT;
    

        notification.setLatestEventInfo(getApplicationContext(), "TrafficProbe",
                "", pending);

        gpsNotificationManager.notify(NOTIFICATION_ID, notification);
   

        startForeground(NOTIFICATION_ID, notification);
    	
    	startGps();
    	
    	startWebsocketConnection();
        
    }
	
    @Override
    public int onStartCommand(Intent intent, int flags, int startId)
    {

    	Log.i("LocationService", "onStartCommand");
    	handleIntent(intent);
    	
    	
    	
    	
        return START_STICKY;
    }

    @Override
    public void onDestroy()
    {
    	Log.i("LocationService", "onDestroy");
    	mainServiceClient = null;
        super.onDestroy();
    }

    @Override
    public void onLowMemory()
    {
    	Log.i("LocationService", "onLowMemory");
        super.onLowMemory();
    }
    
    // get state
    
    public static String getDriver() {
    	return driver;
    }
    
    public static String getBodyNumber() {
    	return bodyNumber;
    }
    
    public static String getOperator() {
    	return operator;
    }
    
    public static String getNetworkStatus() {
    	return networkStatus;
    }
    
    public static Boolean isLoggedIn() {
    	return loggedIn;
    }
    
    public static String getGpsStatus() {
    	return gpsStatus;
    }
    
    // authentication
    
static public void doAuthenticate() {
		
    	if(loggedIn)
    		return;
    	
    	RequestParams params = new RequestParams();
    	
    	params.put("imei", LocationService.imei);
    	params.put("version", appVersion);
    	
		AsyncHttpClient client = new AsyncHttpClient();
		client.get(URL_BASE + "api/operator", params,  new JsonHttpResponseHandler() {
		    @Override
		    
		    public void onSuccess(JSONObject response) {
		    	
		    	try {
		    		driver = response.getString("driverId");
		    		bodyNumber = response.getString("bodyNumber");
		    		operator = response.getString("name");
		    		phoneId = response.getLong("id");
		    		
		    		if(LocationService.mainServiceClient != null) {
		    			LocationService.mainServiceClient.setDriver(driver);
		    			LocationService.mainServiceClient.setBodyNumber(bodyNumber);
		    			LocationService.mainServiceClient.setOperator(operator);
		    		}	
		    		
		    		loggedIn = true;
		    	}
		    	catch(Exception e) {
		    		Log.e("MainAcivity", "registerPhone: Unable to get operator name from response object", e);
		    		doLoginPrompt();
		    	}
		    }
		    
		    public void onFailure(Throwable error, String content) {
		    	doRegisterPrompt();
		    	loggedIn = false;
		    }
		});	
	}
    
    static public void doLogin(String driver, String bodyNumber) {
		
    	
    	RequestParams params = new RequestParams();
    	
    	params.put("imei", LocationService.imei);
    	params.put("driver", driver);
   		params.put("vehicle", bodyNumber);
    	
		AsyncHttpClient client = new AsyncHttpClient();
		client.post(URL_BASE + "api/login", params,  new JsonHttpResponseHandler() {
		    @Override
		    
		    public void onSuccess(JSONObject response) {
		    	
		    	try {
		    		LocationService.driver = response.getString("driverId");
		    		LocationService.bodyNumber = response.getString("bodyNumber");
		    		operator = response.getString("name");
		    		
		    		if(LocationService.mainServiceClient != null) {
		    			LocationService.mainServiceClient.setDriver(LocationService.driver);
		    			LocationService.mainServiceClient.setBodyNumber(LocationService.bodyNumber);
		    			LocationService.mainServiceClient.setOperator(operator);
		    		}	
		    		
		    		
		    		loggedIn = true;
		    	}
		    	catch(Exception e) {
		    		Log.e("MainAcivity", "registerPhone: Unable to get operator name from response object", e);
		    		doLoginPrompt();
		    	}
		    }
		    
		    public void onFailure(Throwable error, String content) {
		    	doRegisterPrompt();
		    	loggedIn = false;
		    }
		});	
	}
    
    static public void doLoginPrompt() {
    	
    	mainServiceClient.showLogin();
    	
    }
    
    static public void doRegisterPrompt() {
    		

    	
		AsyncHttpClient client = new AsyncHttpClient();
		client.get(URL_BASE + "api/register",  new JsonHttpResponseHandler() {
		    @Override
		    
		    public void onSuccess(JSONArray response) {
		    	
		    	try {
		    		    
		    		if (response != null) { 
		    		   
		    			int len = response.length();
		    		   
		    			operatorList.clear();
		    			
		    			for (int i=0;i<len;i++){ 
		    			  
		    				JSONObject obj = (JSONObject)response.get(i);
		    			  
		    				Operator operator = new Operator();
		    			  
		    				operator.name = obj.getString("name");
		    				operator.id = obj.getLong("id");
		    			  
		    				operatorList.add(operator);
		    		   } 
		    			
		    			mainServiceClient.showRegistration();
		    		}
		    		else
		    		{
		    			// need to handle failed registration calls
		    		}

		    		
		    		    			    		
		    	}
		    	catch(Exception e) {
		    		Log.e("MainAcivity", "registerPhone: Unable to get operator name from response object", e);
		    	}
		    }
		    
		    public void onFailure(Throwable error, String content) {
		    	registered = false;
		    }
		});	
    	
    }
    
    static public void doRegister(Long operatorId) {
    	
    	if(operatorId != null) {
	    	RequestParams params = new RequestParams();
	    	
	    	params.put("imei", LocationService.imei);
	    	params.put("operator", operatorId.toString());
	    	
			AsyncHttpClient client = new AsyncHttpClient();
			client.post(URL_BASE + "api/register", params,  new AsyncHttpResponseHandler() {
			    @Override
			    
			    public void onSuccess(String content) {
			    	
			    	doLoginPrompt();
			    }
			    
			    public void onFailure(Throwable error, String content) {
			    	registered = false;
			    	
			    	// how to handle?
			    }
			});	
    	}
    	
    }
    
    private void handleIntent(Intent intent)
    {
    	// handle received intents
    }
    
    private void sendLocationList()
    {
    	Log.i("LocationService", "sendLocationList: " + locationUpdateList.size() + " items pending");
    	   	
    	if(locationUpdateList.size() == 0)
    		return;
    	
    	if(lastTransmitTime == null)
    		lastTransmitTime = new Date();
    	
    	SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
    	Integer transmitFrequency = prefs.getInt("transmitFrequency", MIN_TRANSMIT_INTERVAL);
    	
    	synchronized(lastTransmitTime)
    	{
    		Date currentTime = new Date();
    		if(lastTransmitTime.getTime() > (currentTime.getTime() - (transmitFrequency * 1000)))
    		{
    			// too soon, wait until MIN_TRANSMIT_FREQUENCY is met
    			Log.i("LocationService", "sendLocationList: only " + ((lastTransmitTime.getTime() - currentTime.getTime()) / 1000) + " seconds since last transmit, waiting");
    			return;
    		}
    		
    		// sending now
    		lastTransmitTime = currentTime;
    	}
    
    	List<Location> locations = new ArrayList<Location>();
    	
    	Long lastUpdate = null;
    	
    	for(Location l: locationUpdateList)
    	{
    		if(lastUpdate == null)
    			locations.add(l);
    		else if(((l.getTime() - lastUpdate) / 1000) >= (GPS_UPDATE_INTERVAL * 0.95))
    			locations.add(l);
    		else
    			continue;
    		
    		lastUpdate = l.getTime();
    	}
    	
    	byte[] data = createLocationUpdate(phoneId, locations);
    	
    	websocketConnection.sendBinaryMessage(data);
    	
    	Log.i("LocationService", "sendLocationList: seralized " + locationUpdateList.size() + " into " + data.length + "bytes.");
    	
    	locationUpdateList.clear();
    }
    
    public void onLocationChanged(Location location)
    {
    	Log.i("LocationService", "onLocationChanged: " + location);
    	
    	gpsStatus = "lock (" + Math.round(location.getAccuracy()) + "m)";
    	
    	if(mainServiceClient != null)
    		mainServiceClient.setGpsStatus(gpsStatus);
    	
    	//if(MIN_ACCURACY < Math.abs(location.getAccuracy()))
    	//	Log.i("LocationService", "onLocationChanged: gps error exceeds minimum " + location.getAccuracy());
    	//else
    		locationUpdateList.add(location);
    	
    	sendLocationList();
    	
    }
    
    
    private void startWebsocketConnection() {
   	 
 	   final String wsuri = WS_LOCATION_URL;
 	 
 	   try {
 		   
 		  websocketConnection.connect(wsuri, new WebSocketHandler() {
 	 
 	         @Override
 	         public void onOpen() {
 	        	 Log.d("startWebsocketConnection", "Status: Connected to " + wsuri);
 	        	 networkStatus = "connected";
 	        	 
 	        	 if(mainServiceClient != null)
 	        		 LocationService.mainServiceClient.setNetworkStatus(networkStatus);
 	        	 
 	        	 websocketConnection.sendTextMessage("CONNECTION_TEST");
 	         }
 	 
 	         @Override
 	         public void onTextMessage(String payload) {
 	           Log.d("startWebsocketConnection", "Got echo: " + payload);
 	          
 	          networkStatus = "connected";
 	           LocationService.mainServiceClient.setNetworkStatus(networkStatus);
 	         }
 	 
 	         @Override
 	         public void onClose(int code, String reason) {
 	        	 
 	            Log.d("startWebsocketConnection", "Connection lost.");
 	           
 	            networkStatus = "re-connecting...";
 	            LocationService.mainServiceClient.setNetworkStatus(networkStatus);
 	           
 	            try {
					Thread.sleep(5000);
				} catch (InterruptedException e) {
					Log.d("startWebsocketConnection", e.toString());
					e.printStackTrace();
				}
 	            
 	            startWebsocketConnection();
 	         }
 	      });
 	   } catch (WebSocketException e) {
 	 
 	      Log.d("startWebsocketConnection", e.toString());
 	      
 	      LocationService.mainServiceClient.setNetworkStatus("error");
 	   }
 	}
    
    private void startGps()
    {
    	Log.i("LocationService", "startGps");
    	
    	if(gpsStarted)
    		return;
    	
    	gpsStarted = true;
    	
    	if(mainServiceClient != null)
    		mainServiceClient.setGpsStatus("starting...");
    	
    	if (probeLocationListener == null)
        {
    		probeLocationListener = new ProbeLocationListener(this);
        }
        
        // connect location manager
        gpsLocationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        gpsEnabled = gpsLocationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
        
        if(gpsEnabled)
        {
        	SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(getApplicationContext());
        	Integer gpsFrequency = prefs.getInt("gpsFrequency", GPS_UPDATE_INTERVAL);
        	
        	Log.i("LocationService", "startGps attaching listeners, frequency: " + gpsFrequency);
        	// request gps location and status updates
        	
        	gpsLocationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, gpsFrequency * 1000, 0, probeLocationListener);
        	gpsLocationManager.addGpsStatusListener(probeLocationListener);
        	
            // update gps status in main activity
        }
        else
        {
        	Log.e("LocationService", "startGps failed, GPS not enabled");
            // update gps status in main activity
        }
    }
    
    private void stopGps()
    {
    	Log.i("LocationService", "stopGps");
    	
    	if(gpsLocationManager == null)
    		gpsLocationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
    	
    	if(probeLocationListener != null)
    	{
    		gpsLocationManager.removeUpdates(probeLocationListener);
    		gpsLocationManager.removeGpsStatusListener(probeLocationListener);
    	}
    	
    	gpsStarted = false;
    }

    public void restartGps()
    {
    	Log.i("LocationService", "restartGps");
    	
    	gpsStatus = "searching...";
    	
    	// reset gps notication bindings
    	
    	stopGps();
    	startGps();
    }
    
    public void stopGpsAndRetry()
    {

    	Log.d("LocationService", "stopGpsAndRetry");
    	
    	restartGps();

    	// !!! need to bind alarm to retry gps
    	
        /*Intent i = new Intent(this, LocationService.class);

        i.putExtra("retrygps", true);

        PendingIntent pi = PendingIntent.getService(this, 0, i, 0);
        retryGpsAlarmManager.cancel(pi);

        retryGpsAlarmManager.set(AlarmManager.ELAPSED_REALTIME_WAKEUP,
                SystemClock.elapsedRealtime() + GPS_RETRY_INTERVAL * 1000, pi); */

    }
	
	
	public class LocationServiceBinder extends Binder
    {
        public LocationService getService()
        {
        	Log.i("LocationService", "getService");
            return LocationService.this;
        }
    }
}
