package models;

import play.libs.F;

public class MapEvent {
	
   public static MapEvent instance = new MapEvent();
   public final F.EventStream event = new F.EventStream();

   private MapEvent() { }

}
