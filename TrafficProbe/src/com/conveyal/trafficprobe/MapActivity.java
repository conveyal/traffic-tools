package com.conveyal.trafficprobe;

import org.osmdroid.DefaultResourceProxyImpl;
import org.osmdroid.ResourceProxy;
import org.osmdroid.tileprovider.MapTileProviderArray;
import org.osmdroid.tileprovider.modules.IArchiveFile;
import org.osmdroid.tileprovider.modules.MBTilesFileArchive;
import org.osmdroid.tileprovider.modules.MapTileFileArchiveProvider;
import org.osmdroid.tileprovider.modules.MapTileModuleProviderBase;
import org.osmdroid.tileprovider.tilesource.ITileSource;
import org.osmdroid.tileprovider.tilesource.TileSourceFactory;
import org.osmdroid.tileprovider.tilesource.XYTileSource;
import org.osmdroid.tileprovider.util.SimpleRegisterReceiver;
import org.osmdroid.views.MapView;
import org.osmdroid.views.overlay.MyLocationOverlay;

import android.app.Activity;
import android.os.Bundle;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.View;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;

public class MapActivity extends Activity {

	private static Boolean USE_MAPBOX = true;
	
	private static String MAPBOX_URL = "http://a.tiles.mapbox.com/v3/conveyal.map-jc4m5i21/";
	private static String MAPBOX_URL_HIRES = "http://a.tiles.mapbox.com/v3/conveyal.map-o5b3npfa/";
	
	private ITileSource customTileSource;
	private MyLocationOverlay locOverlay;
	private MapView mapView;
	private RelativeLayout mapContainer;
	
	protected void onCreate(Bundle savedInstanceState) {
		
		Log.i("MapActivity", "onCreate");	
		
		super.onCreate(savedInstanceState);	
	
		setContentView(R.layout.activity_map);
		
		if(USE_MAPBOX)
		{
			// mapbox hosted tile source
			String tileUrl = MAPBOX_URL;
			
			this.mapView = new MapView(this, 256);
			
			DisplayMetrics metrics = new DisplayMetrics();
			getWindowManager().getDefaultDisplay().getMetrics(metrics);
			
			if(metrics.densityDpi > DisplayMetrics.DENSITY_MEDIUM)
				tileUrl = MAPBOX_URL_HIRES;
				
			this.customTileSource = new XYTileSource("Mapbox", null, 0, 17, 256, ".png", tileUrl);
			mapView.setTileSource(this.customTileSource);
		}
		else
		{
			// local mbtiles cache
			
			this.customTileSource  = new XYTileSource("mbtiles", ResourceProxy.string.offline_mode, 10, 16, 256, ".png", "http://conveyal.com/");		
			
			DefaultResourceProxyImpl resourceProxy = new DefaultResourceProxyImpl(getApplicationContext());
        	SimpleRegisterReceiver simpleReceiver = new SimpleRegisterReceiver(this);    		
        	MBTilesFileArchive mbtilesDb = MBTilesFileArchive.getDatabaseFileArchive(null);  // swap null for file      	
        	IArchiveFile[] files = { mbtilesDb };
        	
			MapTileModuleProviderBase moduleProvider = new MapTileFileArchiveProvider(simpleReceiver, this.customTileSource, files);
			
			MapTileProviderArray provider = new MapTileProviderArray(this.customTileSource, null, new MapTileModuleProviderBase[]{ moduleProvider });
			
			this.mapView = new MapView(this, 256, resourceProxy, provider);
		}
		
		mapContainer = (RelativeLayout) findViewById(R.id.mainMapView);
		
		this.mapView.setLayoutParams(new LinearLayout.LayoutParams(
		          LinearLayout.LayoutParams.FILL_PARENT,
		          LinearLayout.LayoutParams.FILL_PARENT));
		
		mapContainer.addView(this.mapView);
		
		

		mapView.setBuiltInZoomControls(true);
		mapView.setMultiTouchControls(true);
	    
		mapView.getController().setZoom(16);
	    
	    locOverlay = new MyLocationOverlay(this, mapView);
	    locOverlay.enableMyLocation();
	    locOverlay.enableFollowLocation();
        
	    mapView.getOverlays().add(locOverlay);
        
        locOverlay.runOnFirstFix(new Runnable() {
			 public void run() {
				 //map.getController().animateTo(locOverlay.getMyLocation());
				 mapView.getController().setCenter(locOverlay.getMyLocation());
			    } 
        });
        
	}
	
	public void centerView(View v)
	{
		
		locOverlay.enableFollowLocation();
	}
	
	
}
