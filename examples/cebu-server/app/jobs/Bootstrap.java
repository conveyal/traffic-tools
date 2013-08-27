package jobs;
import play.*;
import play.jobs.*;
import play.test.*;
import models.*;

@OnApplicationStart
public class Bootstrap extends Job {
    public void doJob() {
    	
        // Check if the database is empty
        if(Operator.count() == 0) {
            Fixtures.loadModels("initial-operator-data.yml");
        }
        
        if(Alert.count() == 0) {
            Fixtures.loadModels("initial-alert-data.yml");
        }
        
        if(Message.count() == 0) {
            Fixtures.loadModels("initial-message-data.yml");
        }
    }
}