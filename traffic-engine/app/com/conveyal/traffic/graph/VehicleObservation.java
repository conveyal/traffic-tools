package com.conveyal.traffic.graph;

import java.io.IOException;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import util.GeoUtils;
import util.MapEventData;
import util.ProjectedCoordinate;

public class VehicleObservation {

	private final Long vehicleId;
	private final Long positionTime; // unix timestamp in milliseconds
	private final ProjectedCoordinate position;
	
	public VehicleObservation(Long id, Long pT, ProjectedCoordinate p) {
		
		vehicleId = id;
		position = p;
		positionTime = pT;
		
	}
	
	public ProjectedCoordinate getPosition() {
		return position;
	}
	
	public Long getTime() {
		return positionTime;
	}
	
	public Boolean before(VehicleObservation o) {
		return positionTime < o.getTime();
	}
	
	public String mapEvent() throws JsonGenerationException, IOException {
	
		
		MapEventData med = new MapEventData();
		
		med.message = "";
		med.type = "VehicleObservation";
		med.geom = GeoUtils.geometryFactory.createPoint(GeoUtils.convertToLonLat(position));

		ObjectMapper mapper = new ObjectMapper();
	
		return mapper.writeValueAsString(med);
	
	}
}
