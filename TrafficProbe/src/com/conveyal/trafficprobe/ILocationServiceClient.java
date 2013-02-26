package com.conveyal.trafficprobe;

import android.content.Intent;

public interface ILocationServiceClient {
	
	public void setDriver(String driver);
	public void setBodyNumber(String bodyNumber);
	public void setOperator(String operator);
	
	public void setGpsStatus(String gpsStatus);
	public void setNetworkStatus(String networkStatus);
	
	public void showRegistration();
	public void showLogin();
	
}
