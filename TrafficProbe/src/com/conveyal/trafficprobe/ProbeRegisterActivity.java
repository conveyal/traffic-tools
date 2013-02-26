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
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.Spinner;
import android.widget.TextView;

public class ProbeRegisterActivity extends Activity {

    
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		Log.i("ProbeLoginActivity", "onCreate");
		
		super.onCreate(savedInstanceState);

		setContentView(R.layout.activity_register);
		
		Spinner spinner = (Spinner) findViewById(R.id.operatorList);

		// Application of the Array to the Spinner
		ArrayAdapter spinnerArrayAdapter = new ArrayAdapter(this, android.R.layout.simple_spinner_item, LocationService.operatorList.toArray());
		spinnerArrayAdapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item); // The drop down vieww
		spinner.setAdapter(spinnerArrayAdapter);
		
		View.OnClickListener listener = new View.OnClickListener() {
			@Override
			public void onClick(View v) {
				
				switch (v.getId()) {
					case R.id.registerButton:
						
						Spinner spinner = (Spinner) findViewById(R.id.operatorList);
						Operator operator = (Operator)spinner.getSelectedItem();
						
						LocationService.doRegister(operator.id);
						
						finish();
						
						break;
				
		  
		 
					 default:
						 break;
				}
			}
		   };
		 
		   Button registerButton = (Button) findViewById(R.id.registerButton);
		   registerButton.setOnClickListener(listener);
		   
		
		
	}
	
	
	
	
}
