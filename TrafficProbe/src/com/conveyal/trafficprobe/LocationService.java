package com.conveyal.trafficprobe;

import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.Iterator;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;

import com.conveyal.trafficprobe.TrafficProbeProtos.LocationUpdate;
import com.loopj.android.http.AsyncHttpClient;
import com.loopj.android.http.AsyncHttpResponseHandler;
import com.loopj.android.http.JsonHttpResponseHandler;
import com.loopj.android.http.RequestParams;

import de.tavendo.autobahn.WebSocketConnection;
import de.tavendo.autobahn.WebSocketException;
import de.tavendo.autobahn.WebSocketHandler;

import android.app.AlarmManager;
import android.app.Application;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.location.GpsSatellite;
import android.location.GpsStatus;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.location.LocationProvider;
import android.os.BatteryManager;
import android.os.Binder;
import android.os.Bundle;
import android.os.IBinder;
import android.preference.PreferenceManager;
import android.telephony.PhoneStateListener;
import android.telephony.SignalStrength;
import android.telephony.TelephonyManager;
import android.util.Log;

public class LocationService extends Service {

	private static int 		GPS_RETRY_INTERVAL 		= 15; 	// seconds 
	private static int 		GPS_UPDATE_INTERVAL 	= 5; 	// seconds 
	private static long		MIN_ACCURACY 			= 15; 	// meters
	private static int 		MIN_TRANSMIT_INTERVAL 	= 30; 	// seconds
	private static String 	URL_BASE 				= "http://cebutraffic.org/";
	
	private static String  	WS_LOCATION_URL			= "ws://cebutraffic.org/ws/location";
	private static String  	HTTP_LOCATION_URL		= "http://cebutraffic.org/api/locationPb";
	
	//private static String  	WS_LOCATION_URL			= "ws://192.168.120.145:9001/ws/location";
	//private static String  	HTTP_LOCATION_URL		= "http://192.168.120.145:9001/api/locationPb";
	
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
    
	
    private static Application appContext;
	private final IBinder binder = new LocationServiceBinder();
	private static ILocationServiceClient mainServiceClient;
	private ProbeLocationListener probeLocationListener;
	
	private static PendingIntent startLocationUpdateAlarmIntent = null;
	
	private LocationManager gpsLocationManager;
	private NotificationManager gpsNotificationManager;
	private static AlarmManager 	alarmManager;
	private PackageManager packageManager   = null;
	private String packageName = null;
	private static SharedPreferences prefsManager; 
	
	private static Intent batteryStatus;
	private static int signalStrength;
	
	private Date lastTransmitTime = null;
	
	private static ProbeWebsocket websocket;

	private static Integer transmitFrequency;
	private static Integer gpsFrequency;
	
	private static boolean sendDiagnosticData;
	private static boolean gpsEnabled;
	private static boolean useWebsockets;
	
	private static List<Location> locationUpdateList = Collections.synchronizedList(new ArrayList<Location>());

	private class AppPhoneStateListener extends PhoneStateListener {
		@Override
		public void onSignalStrengthsChanged(SignalStrength signalStrength) {
			LocationService.signalStrength = signalStrength.getGsmSignalStrength();	        
		}
	}
	
	public static byte[] createLocationUpdate(Long phoneId, List<Location> locations)
	{
		TrafficProbeProtos.LocationUpdate.Builder locationUpdateBuilder = TrafficProbeProtos.LocationUpdate.newBuilder();
		
		Long firstUpdate =  null;
		Long previousUpdate =  null;
		
		
		if(sendDiagnosticData) {

			// Are we charging / charged?
			int status = batteryStatus.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
			Boolean isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
			                     status == BatteryManager.BATTERY_STATUS_FULL;

			// Get battery charge level
			int level = batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
			int scale = batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1);

			Double batteryPct = level / (double)scale;
			
			locationUpdateBuilder.setCharging(isCharging);
			locationUpdateBuilder.setLevel(batteryPct.floatValue());
			locationUpdateBuilder.setNetwork(signalStrength);
			locationUpdateBuilder.setGps(gpsStatus);
			
		}
		
		
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
		
		if(firstUpdate == null)
			firstUpdate = new Date().getTime();
			
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
        
        appContext = this.getApplication();
        
        try {
        	appVersion = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        }
        catch(Exception e){
        	Log.e("LocationService", "onCreate: couldn't fetch app version");
        }
           	
        alarmManager = (AlarmManager) getSystemService(ALARM_SERVICE);
        gpsNotificationManager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        
        if(imei == null)
        {
        	TelephonyManager telephonyManager = (TelephonyManager)getSystemService(Context.TELEPHONY_SERVICE);
    		LocationService.imei = telephonyManager.getDeviceId();
        }
        
        doAuthenticate();
        
        IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
		batteryStatus = getApplicationContext().registerReceiver(null, ifilter);
		
		AppPhoneStateListener phoneStateListener  = new AppPhoneStateListener();
		TelephonyManager telephonyManager = ( TelephonyManager )getSystemService(Context.TELEPHONY_SERVICE);
		telephonyManager.listen(phoneStateListener ,PhoneStateListener.LISTEN_SIGNAL_STRENGTHS);
        
        packageManager = getPackageManager();
        Intent contentIntent = new Intent(this, ProbeMainActivity.class);
        
        packageName = getPackageName();
        
        websocket = new ProbeWebsocket();

        PendingIntent pending = PendingIntent.getActivity(getApplicationContext(), 0, contentIntent,
                android.content.Intent.FLAG_ACTIVITY_NEW_TASK);

        Notification notification = new Notification(R.drawable.tray_icon, null, System.currentTimeMillis());
        notification.flags |= Notification.FLAG_ONGOING_EVENT;
    

        notification.setLatestEventInfo(getApplicationContext(), "TrafficProbe",
                "", pending);

        gpsNotificationManager.notify(NOTIFICATION_ID, notification);
   
        SharedPreferences.OnSharedPreferenceChangeListener prefListener = new SharedPreferences.OnSharedPreferenceChangeListener() {
		 	@Override
        	public void onSharedPreferenceChanged(SharedPreferences prefs,String key) {
		 		
		 		if (key.equals("websockets")) {
		 			useWebsockets = prefsManager.getBoolean("websockets", false);
		 			
		 			if(useWebsockets)
		 				websocket.start();
		 			else
		 				websocket.stop();
		 			
   			 	} 
		 		else if(key.equals("transmitFrequency")) {
		 			transmitFrequency = prefsManager.getInt("transmitFrequency", MIN_TRANSMIT_INTERVAL);
		 			
		 		}
		 		else if(key.equals("gpsFrequency")) {
		 			gpsFrequency = prefsManager.getInt("gpsFrequency", MIN_TRANSMIT_INTERVAL);
		 			
		 		}
   		 	}
   	 	};
        
   		prefsManager = PreferenceManager.getDefaultSharedPreferences(this);
    	prefsManager.registerOnSharedPreferenceChangeListener(prefListener);
        
    	gpsFrequency = prefsManager.getInt("gpsFrequency", GPS_UPDATE_INTERVAL);
    	useWebsockets = prefsManager.getBoolean("websockets", false);
    	transmitFrequency = prefsManager.getInt("transmitFrequency", MIN_TRANSMIT_INTERVAL);
    	sendDiagnosticData = prefsManager.getBoolean("sendDiagnosticData", false);
    	
        startForeground(NOTIFICATION_ID, notification);
    	
    	startGps();
    	
    	startAlarm();
    	
    	if(useWebsockets) {
    		websocket.start();
    	}
    	
    	
        
    }
	
	public static void updatePreferences(SharedPreferences prefs,String key) {
 		
 		if (key.equals("websockets")) {
 			useWebsockets = prefsManager.getBoolean("websockets", false);
 			
 			if(useWebsockets)
 				websocket.start();
 			else
 				websocket.stop();
 			
		 	} 
 		else if(key.equals("transmitFrequency")) {
 			transmitFrequency = prefsManager.getInt("transmitFrequency", MIN_TRANSMIT_INTERVAL);
 			
 			startAlarm();
 			
 		}
 		else if(key.equals("gpsFrequency")) {
 			gpsFrequency = prefsManager.getInt("gpsFrequency", MIN_TRANSMIT_INTERVAL);
 			
 		}
 		else if(key.equals("sendDiagnosticData")) {
 			sendDiagnosticData = prefsManager.getBoolean("sendDiagnosticData", false);
 		}
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
    	
    	Log.i("LocationService", "doAuthenticate");
    	
    	RequestParams params = new RequestParams();
    	
    	params.put("imei", LocationService.imei);
    	params.put("version", appVersion);
    	
		AsyncHttpClient client = new AsyncHttpClient();
		client.setUserAgent("tp" + appVersion);
		client.get(URL_BASE + "api/operator", params,  new JsonHttpResponseHandler() {
		    @Override
		    
		    public void onSuccess(JSONObject response) {
		    	
		    	try {
		    		driver = response.getString("driverId");
		    		bodyNumber = response.getString("bodyNumber");
		    		operator = response.getString("name");
		    		phoneId = response.getLong("id");
		    		
		    		Log.i("LocationService", "doAuthenticate authenticated " + phoneId);
		    		
		    		if(LocationService.mainServiceClient != null) {
		    			LocationService.mainServiceClient.setDriver(driver);
		    			LocationService.mainServiceClient.setBodyNumber(bodyNumber);
		    			LocationService.mainServiceClient.setOperator(operator);
		    		}	
		    		
		    		loggedIn = true;
		    	}
		    	catch(Exception e) {		    		
		    		Log.e("LocationService", "registerPhone: Unable to get operator name from response object", e);
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
		client.setUserAgent("tp" + appVersion);
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
		client.setUserAgent("tp" + appVersion);
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
		    			if(mainServiceClient != null)
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
			client.setUserAgent("tp" + appVersion);
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
    
    public static void sendLocationList()
    {
    	Log.i("LocationService", "sendLocationList: " + locationUpdateList.size() + " items pending");
    	
    	
    	if(phoneId == null)
    		return;
    	
    	if(locationUpdateList.size() == 0 && !sendDiagnosticData)
    		return;
    	
    	/*if(lastTransmitTime == null)
    		lastTransmitTime = new Date();
    	
    	
    	
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
    	}*/
    
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
    
    	
    	if(useWebsockets) {
    		websocket.sendBinaryMessage(data);
    	}
    	else {
    		// use http with binary payload
    		ByteArrayInputStream dataStream = new ByteArrayInputStream(data);
    		
    		RequestParams params = new RequestParams();
    		params.put("data", dataStream);
    		
    		AsyncHttpClient client = new AsyncHttpClient();
    		client.setUserAgent("tp" + appVersion);
    		client.post(HTTP_LOCATION_URL, params, new AsyncHttpResponseHandler() {
    			
                @Override
                public void onSuccess(String response) {
                	networkStatus = "http";
 	            	if(mainServiceClient != null)
	 	            	LocationService.mainServiceClient.setNetworkStatus(networkStatus);
                }
                
                @Override
                public void onFailure(Throwable error, String content) {
                	networkStatus = "http failure";
 	            	if(mainServiceClient != null)
	 	            	LocationService.mainServiceClient.setNetworkStatus(networkStatus);
    		    }
            });
    		
    	}
    	
    	Log.i("LocationService", "sendLocationList: seralized " + locationUpdateList.size() + " into " + data.length + "bytes.");
    	
    	locationUpdateList.clear();
    }
    
    public void onLocationChanged(Location location)
    {
    	Log.i("LocationService", "onLocationChanged: " + location);
    	
    	gpsStatus = "lock (" + Math.round(location.getAccuracy()) + "m)";
    	
    	if(mainServiceClient != null)
    		mainServiceClient.setGpsStatus(gpsStatus);
    	
    	locationUpdateList.add(location);
    	
    }
    
    
    private static void startAlarm() {
     	
     	if(startLocationUpdateAlarmIntent != null)
     		LocationService.alarmManager.cancel(startLocationUpdateAlarmIntent);
      
         startLocationUpdateAlarmIntent = PendingIntent.getBroadcast(appContext, 0, new Intent(appContext, SendLocationUpdateReciever.class), 0);
         LocationService.alarmManager.setRepeating(AlarmManager.RTC_WAKEUP, System.currentTimeMillis(),  transmitFrequency * 1000, startLocationUpdateAlarmIntent);
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
    		probeLocationListener = new ProbeLocationListener();
        }
        
        // connect location manager
        gpsLocationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
        
        gpsEnabled = gpsLocationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
        
        if(gpsEnabled)
        {	
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
	
	
	private class ProbeLocationListener implements LocationListener, GpsStatus.Listener
	{

		@Override
	    public void onLocationChanged(Location location)
	    {
	        try
	        {
	            if (location != null)
	            {
	            	Log.i("ProbeLocationListener", "onLocationChanged");
	               
	            	LocationService.this.onLocationChanged(location);
	            }

	        }
	        catch (Exception ex)
	        {
	        	Log.e("ProbeLocationListener", "onLocationChanged failed", ex);
	        }

	    }

		@Override
	    public void onProviderDisabled(String provider)
	    {
	    	Log.i("ProbeLocationListener", "onProviderDisabled");
	    	//this.restartGps();
	    }

		@Override
	    public void onProviderEnabled(String provider)
	    {
	    	Log.i("ProbeLocationListener", "onProviderEnabled");
	    	//locationService.restartGps();
	    }
		
		@Override
	    public void onStatusChanged(String provider, int status, Bundle extras)
	    {
	        if (status == LocationProvider.OUT_OF_SERVICE)
	        {
	        	Log.d("ProbeLocationListener", "onStatusChanged: " + provider + " OUT_OF_SERVICE");
	        	gpsStatus = "out of service";
	        	if(mainServiceClient != null)
	        		mainServiceClient.setGpsStatus(gpsStatus);
	        }

	        if (status == LocationProvider.AVAILABLE)
	        {
	        	Log.d("ProbeLocationListener", "onStatusChanged: " + provider + " AVAILABLE");
	        	gpsStatus = "lock";
	        	if(mainServiceClient != null)
	        		mainServiceClient.setGpsStatus(gpsStatus);
	        }

	        if (status == LocationProvider.TEMPORARILY_UNAVAILABLE)
	        {
	        	Log.d("ProbeLocationListener", "onStatusChanged: " + provider + " TEMPORARILY_UNAVAILABLE");
	        	gpsStatus = "unavailable";
	        	if(mainServiceClient != null)
	        		mainServiceClient.setGpsStatus(gpsStatus);
	        }
	    }

	    public void onGpsStatusChanged(int event)
	    {

	        switch (event)
	        {
	            case GpsStatus.GPS_EVENT_FIRST_FIX:
	            	gpsStatus = "fix";
		        	if(mainServiceClient != null)
		        		mainServiceClient.setGpsStatus(gpsStatus);
	                break;

	            case GpsStatus.GPS_EVENT_SATELLITE_STATUS:
	                GpsStatus status = gpsLocationManager.getGpsStatus(null);

	                int maxSatellites = status.getMaxSatellites();

	                Iterator<GpsSatellite> it = status.getSatellites().iterator();
	                int count = 0;

	                while (it.hasNext() && count <= maxSatellites)
	                {
	                    it.next();
	                    count++;
	                }

	                gpsStatus = count + " sats";
		        	if(mainServiceClient != null)
		        		mainServiceClient.setGpsStatus(gpsStatus);
		        	
	                break;

	            case GpsStatus.GPS_EVENT_STARTED:
	            	 gpsStatus = "searching...";
			        	if(mainServiceClient != null)
			        		mainServiceClient.setGpsStatus(gpsStatus);
	                break;

	            case GpsStatus.GPS_EVENT_STOPPED:
	            	gpsStatus = "stopped";
			        if(mainServiceClient != null)
			        		mainServiceClient.setGpsStatus(gpsStatus);
	                break;

	        }
	    }

	}
	
	
	public class ProbeWebsocket {
		
		private final WebSocketConnection websocketConnection = new WebSocketConnection();
		
		private byte[] pendingData = null;
		
		public void start() {
			if(!websocketConnection.isConnected())
				startWebsocketConnection();
		}
		
		public void stop() {
			if(websocketConnection.isConnected())
				websocketConnection.disconnect();
		}
		
		public void sendBinaryMessage(byte[] data) {
			
			if(!websocketConnection.isConnected()) {
				pendingData = data;
				
				startWebsocketConnection();
				
				return;
			}
			pendingData = null;
			websocketConnection.sendBinaryMessage(data);

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
		 	        	 
		 	        	 String version = "";
		 	        	 
		 	        	 if(packageManager != null)
		 	        	 {
		 	        		 PackageInfo info;
		 	        		 try {
		 	        			 info = packageManager.getPackageInfo(packageName, 0);
		 	        			 version = info.versionName;
		 	        		 } 
		 	        		 catch (NameNotFoundException e) {
		 	        			 //TODO Auto-generated catch block
		 	        			 e.printStackTrace();	
		 	        		}
		 	        		 
		 	        	 }
		 	        	 
		 	        	 websocketConnection.sendTextMessage("CONNECTION " + version + " " + imei + " (" + phoneId +")" );
		 	        	 
		 	        	 if(pendingData != null) {
		 	        		websocketConnection.sendBinaryMessage(pendingData);
		 	        		pendingData = null;
		 	        	 }
		 	         }
		 	 
		 	         @Override
		 	         public void onTextMessage(String payload) {
		 	           Log.d("startWebsocketConnection", "Got echo: " + payload);
		 	          
		 	           networkStatus = "connected";
		 	           if(mainServiceClient != null)
		 	        	   LocationService.mainServiceClient.setNetworkStatus(networkStatus);
		 	         }
		 	 
		 	         @Override
		 	         public void onClose(int code, String reason) {
		 	        	 
		 	            Log.d("startWebsocketConnection", "Connection lost.");
		 	            
		 	            // websockets disabled, kill off reconnect
		 	            if(!useWebsockets) {
		 	            	networkStatus = "switching to http";
		 	            	if(mainServiceClient != null)
			 	            	LocationService.mainServiceClient.setNetworkStatus(networkStatus);
		 	            	return;
		 	            }
		 	            
		 	            networkStatus = "re-connecting...";
		 	            if(mainServiceClient != null)
		 	            	LocationService.mainServiceClient.setNetworkStatus(networkStatus);
		 	          
		 	         }
		 	      });
		 	   } catch (WebSocketException e) {
		 	 
		 	      Log.d("startWebsocketConnection", e.toString());
		 	      
		 	     if(mainServiceClient != null)
		 	    	 LocationService.mainServiceClient.setNetworkStatus("error");
		 	   }
		 	}

	}

}
