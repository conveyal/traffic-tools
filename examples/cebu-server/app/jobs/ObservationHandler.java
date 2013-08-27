package jobs;

import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Queue;
import java.util.concurrent.ConcurrentLinkedQueue;

import com.jamonapi.utils.Logger;

import play.Play;
import play.jobs.Every;
import play.jobs.Job;

@Every("5s")
	public class ObservationHandler extends Job {
		
	/*static Queue<Observation> observationQueue = new ConcurrentLinkedQueue<Observation>();
	public static Queue<String> historyQueue = new ConcurrentLinkedQueue<String>();

	public static void addObservation(Observation observation, String loggerMessage)
	{
		observationQueue.add(observation);
		historyQueue.add(loggerMessage);
		
		if(historyQueue.size() > 250)
			historyQueue.poll();
	}
	
	public void doJob() throws InterruptedException, IOException {
		
		FileWriter observationLog = new FileWriter(new File(Play.configuration.get("application.logDir").toString(), "observations.log"), true);
		
		for (Observation observation; (observation = observationQueue.poll()) != null;)
		{
			Logger.log(observation.toString());
			observationLog.write(observation.getVehicleId() + "," + observation.getTimestamp()  + "," + observation.getObsCoordsLatLon().x  + "," + observation.getObsCoordsLatLon().y  + "," + observation.getVelocity()  + "," + observation.getHeading() + "," + observation.getAccuracy() + "\n");
		}
		
		observationLog.flush();
		observationLog.close();
    } */
}
