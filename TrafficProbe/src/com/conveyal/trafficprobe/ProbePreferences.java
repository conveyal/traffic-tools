package com.conveyal.trafficprobe;

import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.os.Bundle;
import android.preference.PreferenceActivity;
import android.preference.PreferenceManager;

public class ProbePreferences extends PreferenceActivity implements  OnSharedPreferenceChangeListener {

	@Override
	protected void onCreate(Bundle savedInstanceState) {

		super.onCreate(savedInstanceState);
		addPreferencesFromResource(R.xml.preferences);

	}

	@Override
	protected void onResume() 
	{
	    super.onResume();
	    getPreferenceScreen().getSharedPreferences().registerOnSharedPreferenceChangeListener(this);
	    //PreferenceManager.getDefaultSharedPreferences(this).registerOnSharedPreferenceChangeListener(this);
	    //this.getSharedPreferences(this, MODE_PRIVATE).registerOnSharedPreferenceChangeListener(this);
	}

	@Override
	protected void onPause() 
	{
	    super.onPause();          
	     getPreferenceScreen().getSharedPreferences().unregisterOnSharedPreferenceChangeListener(this);
	    //PreferenceManager.getDefaultSharedPreferences(this).unregisterOnSharedPreferenceChangeListener(this);
	    //this.getSharedPreferences("myPrefDB", MODE_PRIVATE).unregisterOnSharedPreferenceChangeListener(this);
	}
	
	@Override
    public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) 
    {//DO Stuff
		LocationService.updatePreferences(sharedPreferences, key);
    }
	
}
