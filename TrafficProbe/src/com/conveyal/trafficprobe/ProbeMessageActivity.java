package com.conveyal.trafficprobe;

import org.json.JSONArray;
import org.json.JSONObject;

import com.loopj.android.http.AsyncHttpClient;
import com.loopj.android.http.AsyncHttpResponseHandler;
import com.loopj.android.http.JsonHttpResponseHandler;
import com.loopj.android.http.RequestParams;

import android.os.AsyncTask;
import android.os.Bundle;
import android.os.IBinder;
import android.preference.PreferenceManager;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.ServiceConnection;
import android.content.SharedPreferences;
import android.content.SharedPreferences.OnSharedPreferenceChangeListener;
import android.support.v4.content.LocalBroadcastManager;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.Menu;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.ListView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

public class ProbeMessageActivity extends Activity {

	private ListView messageListView;
	
	private BroadcastReceiver messageReceiver = new BroadcastReceiver() {
	  @Override
	  public void onReceive(Context context, Intent intent) {
	    // Get extra data included in the Intent
	    if(intent != null && intent.getAction().equals(LocationService.DISPLAY_MESSAGE_ACTION)) {
	    	ProbeMessageActivity.this.updateMessages();
	    }
	  }
	};
		
	@Override
	protected void onCreate(Bundle savedInstanceState) {
		Log.i("ProbeLoginActivity", "onCreate");
		
		super.onCreate(savedInstanceState);

		setContentView(R.layout.activity_messages);
		
		messageListView = (ListView)findViewById(R.id.messageListView);
	
		updateMessages();
		
		LocalBroadcastManager.getInstance(this).registerReceiver(messageReceiver,
      	      new IntentFilter(LocationService.DISPLAY_MESSAGE_ACTION));
		
		View.OnClickListener listener = new View.OnClickListener() {
			@Override
			public void onClick(View v) {
				
				switch (v.getId()) {
					case R.id.sendButton:
						ProbeMessageActivity.this.sendMessage();
						break;
						
					case R.id.clearMessage:
						ProbeMessageActivity.this.clearMessage();
						break;
				}
			}
		   };
		 
		  Button sendMessage = (Button) findViewById(R.id.sendButton);
		  sendMessage.setOnClickListener(listener);
		
		  Button clearMessage = (Button) findViewById(R.id.clearMessage);
		  clearMessage.setOnClickListener(listener);
	}
	
	private void sendMessage() {
		
	   	RequestParams params = new RequestParams();
		params.put("content", ((EditText)findViewById(R.id.sendMessageText)).getEditableText().toString());
    	params.put("imei", LocationService.imei);
    	
		AsyncHttpClient client = new AsyncHttpClient();
		client.setUserAgent("tp" + LocationService.appVersion);
		client.post(LocationService.URL_BASE + "api/messages", params,  new JsonHttpResponseHandler() {
		    @Override
		    
		    public void onSuccess(String content) {
		    	
		    	toast("Message sent."); 
		    }
		    
		    public void onFailure(Throwable error, String content) {
		    	toast("Unable to send message."); 
		    }
		});	
	
		((EditText)findViewById(R.id.sendMessageText)).getEditableText().clear();

	}
	
	private void clearMessage() {
		
		((EditText)findViewById(R.id.sendMessageText)).getEditableText().clear();
	}
	
	private void updateMessages() {
		
		if(LocationService.messages.size() == 0)
			return;
		
		Message[] messages = LocationService.messages.toArray(new Message[1]);

		
		
		messageListView.setAdapter(new MessageListItemAdapter(this, messages));
	}
	
	public void toast(final String text) {
		Context context = getApplicationContext();
		int duration = Toast.LENGTH_SHORT;

		Toast toast = Toast.makeText(context, text, duration);
		toast.show();
	}
}
