package com.conveyal.trafficprobe;



import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.preference.PreferenceManager;

import android.util.Log;

public class BootReceiver extends BroadcastReceiver {

	@Override
	public void onReceive(Context context, Intent intent) {
		
		Log.i("BootReceiver", "onReceive");
		
		SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(context);
        boolean bootstart = prefs.getBoolean("bootstart", false);
        
        if (bootstart)
        {
        	Log.i("BootReceiver", "Starting LocationService");
            Intent serviceIntent = new Intent(context, LocationService.class);
            serviceIntent.putExtra("immediate", true);
            context.startService(serviceIntent);

        }
        else
        	Log.i("BootReceiver", "Disabled by bootstart preferences");
        

	}

}
