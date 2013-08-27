package util;

public class MapListener {
	
	private Integer listenerCounter = 0;
	
	public void addListener() {
		listenerCounter++;
	}

	public void removeListener() {
		listenerCounter--;
	}
	
	public Boolean hasListeners() {
		return listenerCounter > 0;
	}

}
