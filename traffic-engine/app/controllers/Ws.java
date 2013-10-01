package controllers;

import play.*;
import play.libs.F.*;
import static play.libs.F.Matcher.*;
import static play.mvc.Http.WebSocketEvent.*;
import play.mvc.*;
import play.mvc.Http.*;

import java.util.*;

import models.*;

public class Ws extends WebSocketController {
    
	 public static void map() throws InterruptedException {
		 
		 	Application.mapListeners.addListener();
		 
		 	Logger.info("connecting ws.");
		 	
	        while(inbound.isOpen()) {
	            	
	        	String event = await(MapEvent.instance.event.nextEvent());
	        
	        	outbound.send(event);
	        	
	        }
	        
	        Logger.info("disconnecting ws.");
	        
	        Application.mapListeners.removeListener();
	        
	    }
}