package jobs;
import java.io.File;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.commons.io.FileUtils;
import org.geotools.data.DataUtilities;
import org.geotools.data.DefaultTransaction;
import org.geotools.data.Transaction;
import org.geotools.data.shapefile.ShapefileDataStore;
import org.geotools.data.shapefile.ShapefileDataStoreFactory;
import org.geotools.data.simple.SimpleFeatureCollection;
import org.geotools.data.simple.SimpleFeatureSource;
import org.geotools.data.simple.SimpleFeatureStore;
import org.geotools.feature.FeatureCollections;
import org.geotools.feature.simple.SimpleFeatureBuilder;
import org.geotools.referencing.crs.DefaultGeographicCRS;
import org.opengis.feature.simple.SimpleFeature;
import org.opengis.feature.simple.SimpleFeatureType;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.LineString;

import controllers.Api;
import play.*;
import play.jobs.*;
import play.test.*;
import utils.DirectoryZip;


@OnApplicationStart
public class Bootstrap extends Job {
    private static final Object[][] Coordinate = null;

	public void doJob() {
    
    	// generate gis export from graph
    	
    	Logger.info("creating gis export...");
    	
		String exportName = "graph_gis";
		
		File outputZipFile = new File(Play.configuration.getProperty("application.publicDataDirectory"), exportName + ".zip");
		
		if(outputZipFile.exists())
			outputZipFile.delete();
		
		File outputDirectory = new File(Play.configuration.getProperty("application.publicDataDirectory"), exportName);
		
		Logger.info("outfile path:" + outputDirectory.getAbsolutePath());
		
		File outputShapefile = new File(outputDirectory, exportName + ".shp");
		
		try {
	
    		if(!outputDirectory.exists())
        	{
        		outputDirectory.mkdir();
        	}
        	
			ShapefileDataStoreFactory dataStoreFactory = new ShapefileDataStoreFactory();
			
			Map<String, Serializable> params = new HashMap<String, Serializable>();
			params.put("url", outputShapefile.toURI().toURL());
			params.put("create spatial index", Boolean.TRUE);
			
			ShapefileDataStore dataStore = (ShapefileDataStore)dataStoreFactory.createNewDataStore(params);
			dataStore.forceSchemaCRS(DefaultGeographicCRS.WGS84);

        	SimpleFeatureType EDGE_TYPE = DataUtilities.createType(
                    "Edge",                   // <- the name for our feature type
                    "edge:LineString:srid=4326," +
                    "id:String" 
            );
        	
        	
        	SimpleFeatureCollection collection = FeatureCollections.newCollection();

            SimpleFeatureBuilder featureBuilder = null;
            
           
        	dataStore.createSchema(EDGE_TYPE);
        	featureBuilder = new SimpleFeatureBuilder(EDGE_TYPE);
        
        	GeometryFactory geometryFactory = new GeometryFactory();
            
            for(Integer edgeId : Api.graph.getTrafficEdgeMap().keySet()) {

            	LineString edge = Api.graph.getTrafficEdge(edgeId).getGeometry();
            	
            	
    			
            	if(edge != null) {
            		
            		ArrayList<Coordinate> coords = new ArrayList<Coordinate>();
            		
            		for(Coordinate c : edge.getCoordinates()) {
            			coords.add(new Coordinate(c.x, c.y));
            		}
            		     
            		Coordinate[] cs = coords.toArray(new Coordinate[coords.size()]);
            		
                	Geometry geom = geometryFactory.createLineString(cs);
    			
            		featureBuilder.add(geom);
            		featureBuilder.add(edgeId);
            		SimpleFeature feature = featureBuilder.buildFeature(null);
            		Logger.info(feature.toString());
                    collection.add(feature);
         
    			}
                
        	}
            
            Transaction transaction = new DefaultTransaction("create");

            String typeName = dataStore.getTypeNames()[0];
            SimpleFeatureSource featureSource = dataStore.getFeatureSource(typeName);

            if (featureSource instanceof SimpleFeatureStore) 
            {
                SimpleFeatureStore featureStore = (SimpleFeatureStore) featureSource;

                featureStore.setTransaction(transaction);
               
                featureStore.addFeatures(collection);
                transaction.commit();

                transaction.close();
            } 
            else 
            {
            	throw new Exception(typeName + " does not support read/write access");
            }
            
            DirectoryZip.zip(outputDirectory, outputZipFile);
            FileUtils.deleteDirectory(outputDirectory);
			
		}
		catch(Exception e) {
			Logger.info("Failed to write graph gis: " + e.toString());
			e.printStackTrace();
		}
	}
}