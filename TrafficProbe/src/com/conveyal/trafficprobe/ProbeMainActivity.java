package com.conveyal.trafficprobe;

import java.util.logging.Logger;

import org.json.JSONArray;
import org.json.JSONObject;

import com.loopj.android.http.AsyncHttpClient;
import com.loopj.android.http.AsyncHttpResponseHandler;
import com.loopj.android.http.JsonHttpResponseHandler;

import android.os.AsyncTask;
import android.os.Bundle;
import android.os.IBinder;
import android.preference.PreferenceManager;
import android.app.Activity;
import android.app.Dialog;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.Menu;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.TextView;

public class ProbeMainActivity extends Activity implements ILocationServiceClient, OnSharedPreferenceChangeListener {
	
	private static Intent serviceIntent;
    private LocationService locationService;
    
    private static Boolean serviceBound = false;
    
    
    private final ServiceConnection locationServiceConnection = new ServiceConnection()
    {

        public void onServiceDisconnected(ComponentName name)
        {
        	locationService = null;
        }

        public void onServiceConnected(ComponentName name, IBinder service)
        {
        	locationService = ((LocationService.LocationServiceBinder)service).getService();
        	LocationService.setServiceClient(ProbeMainActivity.this);
        }
    };
    
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		Log.i("MainActivity", "onCreate");
		
		super.onCreate(savedInstanceState);
		
		
		TelephonyManager telephonyManager = (TelephonyManager)getSystemService(Context.TELEPHONY_SERVICE);
		LocationService.imei = telephonyManager.getDeviceId();
		LocationService.phoneNumber = telephonyManager.getLine1Number();
		
		PreferenceManager.setDefaultValues(this, R.xml.preferences, false);
		
		SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this);
        
		setContentView(R.layout.activity_main);
		
		startServiceAndBind();
		 
		View.OnClickListener listener = new View.OnClickListener() {
			@Override
			public void onClick(View v) {
				
				switch (v.getId()) {
					case R.id.settingsButton:
						
						if(!LocationService.isLoggedIn())
							return;
						
						final Dialog prefsPinDialog = new Dialog(ProbeMainActivity.this);
						prefsPinDialog.setContentView(R.layout.pin_dialog);
						Button okBtn = (Button) prefsPinDialog.findViewById(R.id.pinOk);
						okBtn.setOnClickListener(new View.OnClickListener() {

						                            @Override
						                            public void onClick(View v) {

						                            		EditText pinInput = (EditText) prefsPinDialog.findViewById(R.id.pinInput);
						                            		
						                            		if(pinInput.getText().toString().equals("2020")) {
						                            			Intent settingsIntent = new Intent(ProbeMainActivity.this,
						                        						ProbePreferences.class);
						                        				startActivity(settingsIntent);
						                        				
						                        				prefsPinDialog.dismiss();
						                            		}
						                            		else
						                            			pinInput.setText("");
						                            }
						 });
						Button cancelBtn = (Button) prefsPinDialog.findViewById(R.id.pinCancel);
						cancelBtn.setOnClickListener(new View.OnClickListener() {

						                            @Override
						                            public void onClick(View v) {

						                            	prefsPinDialog.dismiss();
						                            }
						 });
						
						prefsPinDialog.setTitle("Enter PIN to unlock");
						prefsPinDialog.show();
						
						
						break;
						
					case R.id.mailButton:
						
						if(!LocationService.isLoggedIn())
							return;
						
						Intent mailIntent = new Intent(ProbeMainActivity.this,
						ProbeMessageActivity.class);
						startActivity(mailIntent);
						break;
					
					case R.id.mapButton:
						
						if(!LocationService.isLoggedIn())
							return;
						
						Intent mapIntent = new Intent(ProbeMainActivity.this,
								MapActivity.class);
						startActivity(mapIntent);
						break;
						
						
					case R.id.changeLoginButton:
						
						
						final Dialog loginPinDialog = new Dialog(ProbeMainActivity.this);
						loginPinDialog.setContentView(R.layout.pin_dialog);
						Button loginPinOkBtn = (Button) loginPinDialog.findViewById(R.id.pinOk);
						loginPinOkBtn.setOnClickListener(new View.OnClickListener() {

						                            @Override
						                            public void onClick(View v) {

						                            		EditText pinInput = (EditText) loginPinDialog.findViewById(R.id.pinInput);
						                            	
						                            		if(pinInput.getText().toString().equals("2020")) {
						                            			Intent loginIntent = new Intent(ProbeMainActivity.this,
						                            					ProbeLoginActivity.class);
						                            			startActivity(loginIntent);
						                            			
						                            			loginPinDialog.dismiss();
						                            		}
						                            		else
						                            			pinInput.setText("");
						                            }
						 });
						Button loginPinCancelBtn = (Button) loginPinDialog.findViewById(R.id.pinCancel);
						loginPinCancelBtn.setOnClickListener(new View.OnClickListener() {

						                            @Override
						                            public void onClick(View v) {

						                            	loginPinDialog.dismiss();
						                            }
						 });
						
						loginPinDialog.setTitle("Enter PIN to unlock");
						loginPinDialog.show();
						break;
		  
		 
					 default:
						 break;
				}
			}
		   };
		 
		   ImageButton settingsButton = (ImageButton) findViewById(R.id.settingsButton);
		   settingsButton.setOnClickListener(listener);
		   
		   ImageButton mailButton = (ImageButton) findViewById(R.id.mailButton);
		   mailButton.setOnClickListener(listener);
		   
		   ImageButton mapButton = (ImageButton) findViewById(R.id.mapButton);
		   mapButton.setOnClickListener(listener);
		   
		   ImageButton changeLoginButton = (ImageButton) findViewById(R.id.changeLoginButton);
		   changeLoginButton.setOnClickListener(listener);
		   
		  
		   prefs.registerOnSharedPreferenceChangeListener(this);
	}
	
	 public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
		 Log.i("MainActivity", "onSharedPreferenceChanged");
	 }
	
	@Override
	protected void onStart()
	{
		Log.i("MainActivity", "onStart");
	    super.onStart();
	    
	    startServiceAndBind();
        
        setDriver(LocationService.getDriver());
        setBodyNumber(LocationService.getBodyNumber());
        setOperator(LocationService.getOperator());
        setNetworkStatus(LocationService.getNetworkStatus());
        setGpsStatus(LocationService.getGpsStatus());
        setPhoneNumber(LocationService.phoneNumber);
        
        try{
			
			PackageManager manager = this.getPackageManager();
			PackageInfo info = manager.getPackageInfo(this.getPackageName(), 0);
			
			TextView textView = (TextView) findViewById(R.id.versionText);
			textView.setText(info.versionName);
		
		}
		catch(Exception e) {
			e.printStackTrace();
		}
	   

	}
	
	@Override
	protected void onResume()
	{
		Log.i("MainActivity", "onResume");
	    super.onResume();
	    startServiceAndBind();
	}
	
	@Override
    protected void onPause()
    {

		Log.i("MainActivity", "onPause");
		unbindService();
        super.onPause();
    }

    @Override
    protected void onDestroy()
    {

    	Log.i("MainActivity", "onDestroy");
    	unbindService();
        super.onDestroy();

    }

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		//getMenuInflater().inflate(R.menu.activity_main, menu);
		return false;
	}
	
	private void startServiceAndBind()
	{
		Log.i("MainActivity", "startService");
		
		serviceIntent = new Intent(this, LocationService.class);
     
        startService(serviceIntent);
        bindService(serviceIntent, locationServiceConnection, Context.BIND_AUTO_CREATE);
        serviceBound = true;
	}
	
	private void unbindService()
	{
		Log.i("MainActivity", "startService");
		
		try
		{
			if(serviceBound)
				unbindService(locationServiceConnection);
		}
		catch(Exception e)
		{
			Log.e("ProbeMainActivity", "unbindService unable to unbind service: " + e); 
		}
		
		serviceBound = false;
	}
	
	// show views
	
	public void showRegistration() {
		Intent registerIntent = new Intent(ProbeMainActivity.this,
		ProbeRegisterActivity.class);
		startActivity(registerIntent);
	}
	
	public void showLogin() {
		Intent loginIntent = new Intent(ProbeMainActivity.this,
		ProbeLoginActivity.class);
		startActivity(loginIntent);
	}
	
	public void showMessages() {
		Intent loginIntent = new Intent(ProbeMainActivity.this,
		ProbeMessageActivity.class);
		startActivity(loginIntent);
	}
	
	// activity methods

	public void setPhoneNumber(String phoneNumber) {
		TextView textView = (TextView) findViewById(R.id.phoneNumber);
		textView.setText(phoneNumber);
	}
	
	public void setGpsStatus(String gpsStatus) {
		TextView textView = (TextView) findViewById(R.id.gps);
		textView.setText(gpsStatus);
	}
	 
	public void setNetworkStatus(String networkStatus) {
		TextView textView = (TextView) findViewById(R.id.network);
		textView.setText(networkStatus);
	}
	
	public void setOperator(String operator) {
		TextView textView = (TextView) findViewById(R.id.operatorText);
		textView.setText(operator);
	}
	
	public void setDriver(String driver) {
		TextView textView = (TextView) findViewById(R.id.driverText);
		textView.setText(driver);
	}

	public void setBodyNumber(String bodyNumber) {
		TextView textView = (TextView) findViewById(R.id.bodyNumberText);
		textView.setText(bodyNumber);
	}
	
	
	
}
