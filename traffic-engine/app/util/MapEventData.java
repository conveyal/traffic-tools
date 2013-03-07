package util;

import org.codehaus.jackson.map.annotate.JsonSerialize;

import com.vividsolutions.jts.geom.Geometry;

@JsonSerialize(using = GeoJSONSerializer.class)
public class MapEventData {
	   
	   public String type;
	   public String message;
	   public Geometry geom;
	   
}
