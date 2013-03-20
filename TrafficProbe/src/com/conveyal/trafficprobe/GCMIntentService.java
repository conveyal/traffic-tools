package com.conveyal.trafficprobe;


import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.message.BasicNameValuePair;
import org.json.JSONObject;

import android.app.AlertDialog;
import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.support.v4.content.LocalBroadcastManager;
import android.util.Log;

import com.google.android.gcm.GCMBaseIntentService;
import com.loopj.android.http.AsyncHttpClient;
import com.loopj.android.http.JsonHttpResponseHandler;
import com.loopj.android.http.RequestParams;

public class GCMIntentService extends GCMBaseIntentService {

	public GCMIntentService() {
		super(LocationService.GCM_SENDER_ID);
		
		Log.i("GCMIntentService", "starting service for: " + LocationService.GCM_SENDER_ID);
		
	}
	
	@Override
	protected void onError(Context arg0, String arg1) {
		Log.i("onError gcm", arg1);
	}

	@Override
	protected void onMessage(Context arg0, Intent messageIntent) {

		if(!messageIntent.getExtras().containsKey("type") || messageIntent.getExtras().get("type").equals("message")) {
			Log.i("onMessage gcm", messageIntent.getExtras().get("message").toString());
		 
	        Message m = new Message();
	    	
	    	m.messageBody = messageIntent.getExtras().get("message").toString();        	
	    	m.received = new Date();
	    	m.id = Long.decode(messageIntent.getExtras().get("id").toString());
	    	m.read = false;
	    	
	    	LocationService.messages.add(m);    
	    	
    	  Intent intent = new Intent(LocationService.DISPLAY_MESSAGE_ACTION);
    	  LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
    	  
		} 
		else if(messageIntent.getExtras().containsKey("type") && messageIntent.getExtras().get("type").equals("alertUpdate")) {
		
			Log.i("onMessage gcm", "alertUpdate");
			Intent intent = new Intent(LocationService.ALERT_UPDATE_ACTION);
	    	  LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
			
		}
		else if(messageIntent.getExtras().containsKey("type") && messageIntent.getExtras().get("type").equals("clearPanic")) {
			
			Log.i("onMessage gcm", "clearPanic");
			Intent intent = new Intent(LocationService.CLEAR_PANIC_ACTION);
	    	  LocalBroadcastManager.getInstance(this).sendBroadcast(intent);
			
		}
	}	

	@Override
	protected void onRegistered(Context arg0, String arg1) {

		RequestParams params = new RequestParams();
    	
    	params.put("gcmKey", arg1);
    	params.put("imei", LocationService.imei);
    	
		AsyncHttpClient client = new AsyncHttpClient();
		client.setUserAgent("tp" + LocationService.appVersion);
		client.post(LocationService.URL_BASE + "api/registerGcm", params,  new JsonHttpResponseHandler() {
		    @Override
		    
		    public void onSuccess(JSONObject response) {
		    	
		    	Log.i("onRegistered gcm", response.toString());
		    }
		    
		    public void onFailure(Throwable error, String content) {
		    	Log.i("failed to register gcm key",content);
		    }
		});	
	}

	@Override
	protected void onUnregistered(Context arg0, String arg1) {
		
		Log.i("onUnregistered gcm", arg1);

	}

}