package com.conveyal.trafficprobe;

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
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.Menu;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.Spinner;
import android.widget.TextView;

public class ProbeLoginActivity extends Activity {

    
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		Log.i("ProbeLoginActivity", "onCreate");
		
		super.onCreate(savedInstanceState);

		setContentView(R.layout.activity_login);
		
		View.OnClickListener listener = new View.OnClickListener() {
			@Override
			public void onClick(View v) {
				
				switch (v.getId()) {
					case R.id.loginButton:
						
						TextView tv = (TextView)findViewById(R.id.bodyNumberEdit);
						
						String bodyNumber = tv.getText().toString();
						
						tv = (TextView)findViewById(R.id.driverNameEdit);
						
						String driver = tv.getText().toString();
							
						LocationService.doLogin(driver, bodyNumber);
						
						finish(); 
						
						break;
		
					 default:
						 break;
				}
			}
		   };
		 
		   Button loginButton = (Button) findViewById(R.id.loginButton);
		   loginButton.setOnClickListener(listener);
		
	}
	
	
	
	
}
