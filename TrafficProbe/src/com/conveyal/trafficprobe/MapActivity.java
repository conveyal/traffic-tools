package com.conveyal.trafficprobe;

import java.util.ArrayList;

import org.json.JSONArray;
import org.json.JSONObject;
import org.osmdroid.DefaultResourceProxyImpl;
import org.osmdroid.ResourceProxy;
import org.osmdroid.tileprovider.MapTileProviderArray;
import org.osmdroid.tileprovider.modules.IArchiveFile;
import org.osmdroid.tileprovider.modules.MBTilesFileArchive;
import org.osmdroid.tileprovider.modules.MapTileFileArchiveProvider;
import org.osmdroid.tileprovider.modules.MapTileModuleProviderBase;
import org.osmdroid.tileprovider.tilesource.ITileSource;
import org.osmdroid.tileprovider.tilesource.XYTileSource;
import org.osmdroid.tileprovider.util.SimpleRegisterReceiver;
import org.osmdroid.util.GeoPoint;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.ItemizedIconOverlay;
import org.osmdroid.views.overlay.MyLocationOverlay;
import org.osmdroid.views.overlay.OverlayItem;

import com.loopj.android.http.AsyncHttpClient;
import com.loopj.android.http.JsonHttpResponseHandler;
import com.loopj.android.http.RequestParams;

import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Bundle;
import android.support.v4.content.LocalBroadcastManager;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.Toast;

public class MapActivity extends Activity {

	private static Boolean USE_MAPBOX = true;
	
	private static String MAPBOX_URL = "http://a.tiles.mapbox.com/v3/conveyal.map-jc4m5i21/";
	private static String MAPBOX_URL_HIRES = "http://a.tiles.mapbox.com/v3/conveyal.map-o5b3npfa/";
	
	private ITileSource customTileSource;
	private MyLocationOverlay locOverlay;
	private ItemizedIconOverlay<OverlayItem> alertOverlay;
	private MapView mapView;
	private DefaultResourceProxyImpl resourceProxy;
	private	RelativeLayout mapContainer;
	
	private BroadcastReceiver messageReceiver = new BroadcastReceiver() {
	  @Override
	  public void onReceive(Context context, Intent intent) {
		  
	    if(intent != null && intent.getAction().equals(LocationService.ALERT_UPDATE_ACTION)) {
	    	updateAlertOverlay();
	    }
	    
	    if(intent != null && intent.getAction().equals(LocationService.CLEAR_PANIC_ACTION)) {
	    	LocationService.panic = false;
	    	updatePanic();
	    }

	    
	  }
	};
	
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		
		Log.i("MapActivity", "onCreate");	
		
		super.onCreate(savedInstanceState);	
	
		resourceProxy = new DefaultResourceProxyImpl(getApplicationContext());
		setContentView(R.layout.activity_map);
		
		if(USE_MAPBOX) {
			// mapbox hosted tile source
			String tileUrl = MAPBOX_URL;
			
			mapView = new MapView(this, 256);
			
			DisplayMetrics metrics = new DisplayMetrics();
			getWindowManager().getDefaultDisplay().getMetrics(metrics);
			
			if(metrics.densityDpi > DisplayMetrics.DENSITY_MEDIUM)
				tileUrl = MAPBOX_URL_HIRES;
				
			customTileSource = new XYTileSource("Mapbox", null, 0, 17, 256, ".png", tileUrl);
			mapView.setTileSource(this.customTileSource);
			
			mapView.getTileProvider().clearTileCache();
		
		}
		else {
			// local mbtiles cache
			
			customTileSource  = new XYTileSource("mbtiles", ResourceProxy.string.offline_mode, 10, 16, 256, ".png", "http://conveyal.com/");		
			
			
        	SimpleRegisterReceiver simpleReceiver = new SimpleRegisterReceiver(this);    		
        	MBTilesFileArchive mbtilesDb = MBTilesFileArchive.getDatabaseFileArchive(null);  // swap null for file      	
        	IArchiveFile[] files = { mbtilesDb };
        	
			MapTileModuleProviderBase moduleProvider = new MapTileFileArchiveProvider(simpleReceiver, this.customTileSource, files);
			
			MapTileProviderArray provider = new MapTileProviderArray(this.customTileSource, null, new MapTileModuleProviderBase[]{ moduleProvider });
			
			mapView = new MapView(this, 256, resourceProxy, provider);
		}
		
		mapContainer = (RelativeLayout) findViewById(R.id.mainMapView);
		
		this.mapView.setLayoutParams(new LinearLayout.LayoutParams(
		          LinearLayout.LayoutParams.FILL_PARENT,
		          LinearLayout.LayoutParams.FILL_PARENT));
		
		mapContainer.addView(this.mapView);
		
		mapView.setBuiltInZoomControls(true);
		mapView.setMultiTouchControls(true);
	    
		mapView.getController().setZoom(15);
		
		mapView.getController().setCenter(new GeoPoint(10.3021258, 123.89616));

	    locOverlay = new MyLocationOverlay(this, mapView);
	    locOverlay.enableMyLocation();
	    locOverlay.enableFollowLocation();
        
	    mapView.getOverlays().add(locOverlay);
	    
        locOverlay.runOnFirstFix(new Runnable() {
		 public void run() {
			 mapView.getController().setCenter(locOverlay.getMyLocation());
		 } 
        });
        
        LocalBroadcastManager.getInstance(this).registerReceiver(messageReceiver,
      	      new IntentFilter(LocationService.ALERT_UPDATE_ACTION));
        
        LocalBroadcastManager.getInstance(this).registerReceiver(messageReceiver,
        	      new IntentFilter(LocationService.ALERT_UPDATE_ACTION));
        
        View.OnLongClickListener listener = new View.OnLongClickListener() { 
            @Override
            public boolean onLongClick(View v) {
                togglePanic(v);
                return true;
            }
        };
        
        ImageButton panicButton = (ImageButton) findViewById(R.id.panicButton);
		panicButton.setOnLongClickListener(listener);
        
        updateOverlay();
        updatePanic();
        
	}
	
	@Override
	protected void onDestroy()
	{
		mapView.getTileProvider().clearTileCache();
		
		super.onDestroy();
		
		Log.i("MapActivity", "onDestroy");	
	}
	
	public void toggleOverlay(View v) {
		
		if(!LocationService.showOverlay) {
			LocationService.showOverlay = true;
		}
		else {
			LocationService.showOverlay = false;
		}
		
		updateOverlay();
	}
	
	
	public void updateOverlay()
	{
		ImageView toggleButtonView = (ImageView)findViewById(R.id.toggleOverlay);
		
		Log.i("MapActivity", "toggleOverlay");
		
		if(!LocationService.showOverlay)
		{
			toggleButtonView.setImageResource(R.drawable.pushpin);
			
			if(alertOverlay != null && mapView.getOverlays().contains(alertOverlay)) {
				mapView.getOverlays().remove(alertOverlay);
				mapView.invalidate();
			}
			
		}
		else
		{
			toggleButtonView.setImageResource(R.drawable.pushpin_blue);
			
			updateAlertOverlay();
		}
	}
	
	public void togglePanic(View v) {
		
		if(!LocationService.panic) {
			LocationService.panic = true;
		}
		else {
			LocationService.panic = false;
		}
		
		updatePanic();
	}
	
	public void updatePanic()
	{
		ImageView toggleButtonView = (ImageView)findViewById(R.id.panicButton);
		
		Log.i("MapActivity", "togglePanic");
		
		
	 	RequestParams params = new RequestParams();
		params.put("panic", LocationService.panic.toString());
    	params.put("imei", LocationService.imei);
    	
		AsyncHttpClient client = new AsyncHttpClient();
		client.setUserAgent("tp" + LocationService.appVersion);
		client.post(LocationService.URL_BASE + "api/panic", params,  new JsonHttpResponseHandler() {
		    @Override
		    
		    public void onSuccess(String content) {
		    	
		    	//
		    }
		    
		    public void onFailure(Throwable error, String content) {
		    	//
		    }
		});	
		
		if(LocationService.panic)
		{
			toggleButtonView.setImageResource(R.drawable.panic);
			
			
		}
		else
		{
			toggleButtonView.setImageResource(R.drawable.panic_gray);
		}
	}
	
	
	public void centerView(View v)
	{
		locOverlay.enableFollowLocation();
	}
	
	private void updateAlertOverlay() {
	
		if(LocationService.showOverlay) {
			
			RequestParams params = new RequestParams();
			
			params.put("imei", LocationService.imei);
			
			AsyncHttpClient client = new AsyncHttpClient();
			client.setUserAgent("tp" + LocationService.appVersion);
			client.get(LocationService.URL_BASE + "api/alerts", params,  new JsonHttpResponseHandler() {
			    @Override
			    
			    public void onSuccess(JSONArray response) {
			    	
			    	if(!LocationService.showOverlay)
			    		return;
			    	
			    	if(alertOverlay != null && mapView.getOverlays().contains(alertOverlay)) {
						mapView.getOverlays().remove(alertOverlay);
						mapView.invalidate();
					}
					
					ArrayList<OverlayItem> items = new ArrayList<OverlayItem>();
					
					for(int i = 0; i < response.length(); i++) {
						try {
							JSONObject obj = response.getJSONObject(i);
							
							String description = "";
							
							if(obj.has("publicDescription"))
								description += obj.getString("publicDescription");
							
							if(obj.has("description"))
								description += "\n" + obj.getString("description");	
							
							if(description.trim().equals(""))
								description = obj.getString("type");	
							
							OverlayItem itemMarker = new OverlayItem(obj.getString("title"), description, new GeoPoint(obj.getDouble("locationLat"), obj.getDouble("locationLon")));
							
							
							if(obj.getString("type").equals("congestion"))
								itemMarker.setMarker(MapActivity.this.getResources().getDrawable(R.drawable.congestion));
							else if(obj.getString("type").equals("construction"))
								itemMarker.setMarker(MapActivity.this.getResources().getDrawable(R.drawable.construction));
							else if(obj.getString("type").equals("enforcement"))
								itemMarker.setMarker(MapActivity.this.getResources().getDrawable(R.drawable.enforcement));
							else if(obj.getString("type").equals("event"))
								itemMarker.setMarker(MapActivity.this.getResources().getDrawable(R.drawable.event));
							else if(obj.getString("type").equals("fire"))
								itemMarker.setMarker(MapActivity.this.getResources().getDrawable(R.drawable.fire));
							else if(obj.getString("type").equals("flood"))
								itemMarker.setMarker(MapActivity.this.getResources().getDrawable(R.drawable.flood));
							else if(obj.getString("type").equals("incident"))
								itemMarker.setMarker(MapActivity.this.getResources().getDrawable(R.drawable.incident));
							else if(obj.getString("type").equals("roadclosed"))
								itemMarker.setMarker(MapActivity.this.getResources().getDrawable(R.drawable.roadclosed));
							else if(obj.getString("type").equals("trafficlight"))
								itemMarker.setMarker(MapActivity.this.getResources().getDrawable(R.drawable.trafficlight));
							
							items.add(itemMarker);
						
						}
						catch(Exception e) {
							Log.e("MapActivity", "updateAlertOverlay: item parse failed");
							
						}
						
						
					}
					
					
					
				    alertOverlay = new ItemizedIconOverlay<OverlayItem>(items,
			                new ItemizedIconOverlay.OnItemGestureListener<OverlayItem>() {
			                    @Override
			                    public boolean onItemSingleTapUp(final int index,
			                            final OverlayItem item) {
			                        Toast.makeText(
			                        		MapActivity.this, item.mTitle + ": " + item.mDescription ,Toast.LENGTH_SHORT).show();
			                        return true; // We 'handled' this event.
			                    }
			                    @Override
			                    public boolean onItemLongPress(final int index,
			                            final OverlayItem item) {
			                        Toast.makeText(
			                        		MapActivity.this, item.mTitle + ": " + item.mDescription ,Toast.LENGTH_SHORT).show();
			                        return false;
			                    }
			                }, resourceProxy);
				    
				    mapView.getOverlays().add(alertOverlay);
				    mapView.invalidate();
			    }
			    
			    public void onFailure(Throwable error, String content) {
			    	
			    	Log.i("MapActivity", "alert update failed: "  + error.getMessage() + " -- " + content);		   
			    	
			    
			    }
			});
			
			
			
			
			
		}
	}
	
	
	
}
