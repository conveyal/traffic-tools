package com.conveyal.trafficprobe;


import android.location.*;
import android.os.Bundle;
import android.util.Log;

class ProbeLocationListener implements LocationListener, GpsStatus.Listener
{

    private static LocationService locationService;

    ProbeLocationListener(LocationService service)
    {
        Log.i("ProbeLocationListener", "ProbeLocationListener");
        locationService = service;
    }

    public void onLocationChanged(Location location)
    {
        try
        {
            if (location != null)
            {
            	Log.i("ProbeLocationListener", "onLocationChanged");
               
            	locationService.onLocationChanged(location);
            }

        }
        catch (Exception ex)
        {
        	Log.e("ProbeLocationListener", "onLocationChanged failed", ex);
        }

    }

    public void onProviderDisabled(String provider)
    {
    	Log.i("ProbeLocationListener", "onProviderDisabled");
    	locationService.restartGps();
    }

    public void onProviderEnabled(String provider)
    {
    	Log.i("ProbeLocationListener", "onProviderEnabled");
    	locationService.restartGps();
    }

    public void onStatusChanged(String provider, int status, Bundle extras)
    {
        if (status == LocationProvider.OUT_OF_SERVICE)
        {
        	Log.d("ProbeLocationListener", "onStatusChanged: " + provider + " OUT_OF_SERVICE");
        	locationService.stopGpsAndRetry();
        }

        if (status == LocationProvider.AVAILABLE)
        {
        	Log.d("ProbeLocationListener", "onStatusChanged: " + provider + " AVAILABLE");
        	
        }

        if (status == LocationProvider.TEMPORARILY_UNAVAILABLE)
        {
        	Log.d("ProbeLocationListener", "onStatusChanged: " + provider + " TEMPORARILY_UNAVAILABLE");
        	locationService.stopGpsAndRetry();
        }
    }

    public void onGpsStatusChanged(int event)
    {

        /*switch (event)
        {
            case GpsStatus.GPS_EVENT_FIRST_FIX:
                Utilities.LogDebug("GPS Event First Fix");
                mainActivity.SetStatus(mainActivity.getString(R.string.fix_obtained));
                break;

            case GpsStatus.GPS_EVENT_SATELLITE_STATUS:

                Utilities.LogDebug("GPS Satellite status obtained");
                GpsStatus status = mainActivity.gpsLocationManager.getGpsStatus(null);

                int maxSatellites = status.getMaxSatellites();

                Iterator<GpsSatellite> it = status.getSatellites().iterator();
                int count = 0;

                while (it.hasNext() && count <= maxSatellites)
                {
                    it.next();
                    count++;
                }

                mainActivity.SetSatelliteInfo(count);
                break;

            case GpsStatus.GPS_EVENT_STARTED:
                Utilities.LogInfo("GPS started, waiting for fix");
                mainActivity.SetStatus(mainActivity.getString(R.string.started_waiting));
                break;

            case GpsStatus.GPS_EVENT_STOPPED:
                Utilities.LogInfo("GPS Stopped");
                mainActivity.SetStatus(mainActivity.getString(R.string.gps_stopped));
                break;

        }*/
    }

}