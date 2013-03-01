package com.conveyal.trafficprobe;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;


public class SendLocationUpdateReciever extends BroadcastReceiver 
{    
	private PendingIntent startLocationUpdateAlarmIntent;
	
     @Override
     public void onReceive(Context context, Intent intent) 
     {   
         LocationService.sendLocationList();
         
     }
    
}