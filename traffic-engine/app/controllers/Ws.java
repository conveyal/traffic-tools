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
		 
	        while(inbound.isOpen()) {
	            
	        	Application.mapListeners.addListener();
	        	
	        	String event = await(MapEvent.instance.event.nextEvent());
	        
	        	outbound.send(event);
	        	
	        }
	        
	        Application.mapListeners.removeListener();
	        
	    }
}