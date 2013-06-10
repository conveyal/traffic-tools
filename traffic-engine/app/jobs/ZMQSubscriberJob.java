package jobs;
import play.*;
import play.jobs.*;
import play.test.*;
import util.ZMQSubscriber;

//@OnApplicationStart
public class ZMQSubscriberJob extends Job {
	
    public void doJob() {
    	
    	ZMQSubscriber subscriber = new ZMQSubscriber();
    		
    	subscriber.startProxy();
    
    }
}