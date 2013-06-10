package com.conveyal.traffic.graph;

import java.io.IOException;

import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;

import play.Logger;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import controllers.Application;

import util.GeoUtils;
import util.MapEventData;
import util.ProjectedCoordinate;

public class VehicleObservation {

	private final Long vehicleId;
	private Long positionTime; // unix timestamp in milliseconds
	private final ProjectedCoordinate position;
	
	public VehicleObservation(Long id, Long pT, ProjectedCoordinate p) {
		
		vehicleId = id;
		position = p;
		positionTime = pT;
		
		Logger.info(id + " - " + pT);
		
	}
	
	public ProjectedCoordinate getPosition() {
		return position;
	}
	
	public Long getTime() {
		return positionTime;
	}
	
	public void fixTime(int i) {
		positionTime += i * 1000;
	}
	
	public Boolean before(VehicleObservation o) {
		return positionTime < o.getTime();
	}
	
	public String mapEvent() throws JsonGenerationException, IOException {
	
		
		/*MapEventData med = new MapEventData();
		
		med.message = "";
		med.type = "VehicleObservation";
		med.geom = GeoUtils.geometryFactory.createPoint(GeoUtils.convertToLonLat(position));

		ObjectMapper mapper = new ObjectMapper();
		
		Application.pw.println(mapper.writeValueAsString(med) + ","); */
		return "";
	
	}
}
