package util;

import org.zeromq.ZMQ;

import play.Logger;

public class ZMQSubscriber {
	
	private static int MAX_WORKER_THREADS = 1;
	
	private ZMQ.Context context;
	private ZMQ.Socket subscriber;
	private ZMQ.Socket workers;

	private static class ZMQWorker extends Thread
    {	
        private ZMQ.Context context;

        private ZMQWorker (ZMQ.Context context)
        {
            this.context = context;
        }
        @Override
        public void run() {
            ZMQ.Socket socket = context.socket(ZMQ.SUB);
            socket.connect ("inproc://workers");

            while (true) {

                //  Wait for next request from client (C string)
                String request = socket.recvStr (0);
                System.out.println ( Thread.currentThread().getName() + " Received request: [" + request + "]");

                // working !!! 

                //  Send reply back to client (C string)
                socket.send("world", 0);
            }
        }
    }
	
	public ZMQSubscriber() {
		
		context = ZMQ.context(1);
		subscriber = context.socket(ZMQ.SUB);
		workers = context.socket(ZMQ.PUB);
		
		workers.bind ("inproc://workers");
		subscriber.bind("tcp://localhost:5556");
        
		Logger.info("bound ZMQSubscriber location listeners");

        /*for(int thread_nbr = 0; thread_nbr < MAX_WORKER_THREADS; thread_nbr++) {
            Thread worker = new ZMQWorker(context);
            worker.start();
        }*/
	}
	
	public void startProxy() {
		 //  Connect work threads to client threads via a queue
        ZMQ.proxy (subscriber, workers, null);
  
        
    	//  We never get here but clean up anyhow
        cleanup();
	}
	
	private void cleanup() {

        subscriber.close();
        workers.close();
        context.term();
	}
	
}
