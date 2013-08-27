package utils;

import gov.sandia.cognition.math.matrix.Vector;
import gov.sandia.cognition.math.matrix.VectorFactory;

import org.geotools.geometry.jts.JTS;
import org.geotools.referencing.CRS;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.NoSuchIdentifierException;
import org.opengis.referencing.crs.CRSAuthorityFactory;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.opengis.referencing.crs.GeographicCRS;
import org.opengis.referencing.operation.MathTransform;
import org.opengis.referencing.operation.TransformException;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.CoordinateFilter;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.PrecisionModel;


 import gov.sandia.cognition.math.matrix.Vector;
import gov.sandia.cognition.math.matrix.VectorFactory;

 import org.geotools.geometry.jts.JTS;
import org.geotools.geometry.jts.JTSFactoryFinder;
import org.geotools.referencing.CRS;
import org.opengis.referencing.FactoryException;
import org.opengis.referencing.NoSuchIdentifierException;
import org.opengis.referencing.crs.CRSAuthorityFactory;
import org.opengis.referencing.crs.CoordinateReferenceSystem;
import org.opengis.referencing.crs.GeographicCRS;
import org.opengis.referencing.operation.MathTransform;
import org.opengis.referencing.operation.NoninvertibleTransformException;
import org.opengis.referencing.operation.TransformException;

 import java.util.List;

import com.conveyal.traffic.graph.utils.ProjectedCoordinate;
 import com.google.common.base.Preconditions;
import com.google.common.collect.Lists;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.CoordinateFilter;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;
import com.vividsolutions.jts.geom.LineSegment;
import com.vividsolutions.jts.geom.LineString;

 public class GeoUtils {
   public static double RADIANS = 2 * Math.PI;
   
   
   public static MathTransform recentMathTransform = null;
   public static GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(),4326);
   public static GeometryFactory projectedGeometryFactory = new GeometryFactory(new PrecisionModel());
	 
   public static ProjectedCoordinate convertLatLonToEuclidean(
     Coordinate latlon) {
	   
	   Coordinate lonlat = new Coordinate(latlon.y, latlon.x);
	  
     return convertLonLatToEuclidean(lonlat);
   }
   
   public static ProjectedCoordinate convertLonLatToEuclidean(
     Coordinate lonlat) {
	   
     final MathTransform transform = getTransform(lonlat);
     final Coordinate to = new Coordinate();
    
     // the transform seems to swap the lat lon pairs
     Coordinate latlon = new Coordinate(lonlat.y, lonlat.x);
    
     try {
       JTS.transform(latlon, to,
           transform);
     } catch (final TransformException e) {
       e.printStackTrace();
     }

     return new ProjectedCoordinate(transform, new Coordinate(to.y, to.x), lonlat);
   }

   public static ProjectedCoordinate convertToProjectedCoordinate(MathTransform transform,
     Vector vec, Coordinate refLatLon) {
     return new ProjectedCoordinate(transform, new Coordinate(vec.getElement(0), vec.getElement(1)), refLatLon);
   }

   public static Coordinate convertToLatLon(
     MathTransform transform, Coordinate xy) {
	   
	 Coordinate lonlat = convertToLonLat(transform, xy);
     return new Coordinate(lonlat.y, lonlat.x);
   }
   
   public static Coordinate convertToLonLat(
     MathTransform transform, Coordinate xy) {
     final Coordinate to = new Coordinate();
     final Coordinate yx = new Coordinate(xy.y, xy.x);
     try {
     JTS.transform(yx, to, transform.inverse());
     } catch (final TransformException e) {
         e.printStackTrace();
       }
     return new Coordinate(to.y, to.x);
   }

   public static Coordinate convertToLatLon(ProjectedCoordinate pc) {
	   
	   final Coordinate point =
		         new Coordinate(pc.getX(), pc.getY());
	    return convertToLatLon(pc.getTransform(), point);
	  }
   
   public static Coordinate convertToLatLon(Vector vec, MathTransform transform) {
     final Coordinate point =
         new Coordinate(vec.getElement(0), vec.getElement(1));
     return convertToLatLon(transform, point);
   }

   public static Coordinate convertToLatLon(Vector vec, ProjectedCoordinate projCoord) {
     final Coordinate point =
         new Coordinate(vec.getElement(1), vec.getElement(0));
     return convertToLatLon(projCoord.getTransform(), point);
   }
   
   
  

   public static Coordinate convertToLonLat(ProjectedCoordinate pc) {
	   
	   final Coordinate point =
		         new Coordinate(pc.getX(), pc.getY());
	    return convertToLonLat(pc.getTransform(), point);
	  }
   
   public static Coordinate convertToLonLat(Vector vec, MathTransform transform) {
     final Coordinate point =
         new Coordinate(vec.getElement(0), vec.getElement(1));
     return convertToLonLat(transform, point);
   }

   public static Coordinate convertToLonLat(Vector vec, ProjectedCoordinate projCoord) {
     final Coordinate point =
         new Coordinate(vec.getElement(1), vec.getElement(0));
     return convertToLonLat(projCoord.getTransform(), point);
   }


   public static Coordinate getCoordinates(
     Vector meanLocation) {
     return new Coordinate(meanLocation.getElement(0),
         meanLocation.getElement(1));
   }

   /**
    * From
    * http://gis.stackexchange.com/questions/28986/geotoolkit-conversion-from
    * -lat-long-to-utm
    */
   public static int
       getEPSGCodefromUTS(Coordinate refLonLat) {
     // define base EPSG code value of all UTM zones;
     int epsg_code = 32600;
     // add 100 for all zones in southern hemisphere
     if (refLonLat.y < 0) {
       epsg_code += 100;
     }
     // finally, add zone number to code
     epsg_code += getUTMZoneForLongitude(refLonLat.x);

     return epsg_code;
   }

   public static Vector getEuclideanVectorFromLatLon(
     Coordinate coordinate) {
     final Coordinate resCoord =
    		 convertLatLonToEuclidean(coordinate);
     return VectorFactory.getDefault().createVector2D(
         resCoord.x, resCoord.y);
   }

   public static double getMetersInAngleDegrees(
     double distance) {
     return distance / (Math.PI / 180d) / 6378137d;
   }

   public static MathTransform getTransform(
     Coordinate refLatLon) {
     //    MathTransformFactory mtFactory = ReferencingFactoryFinder.getMathTransformFactory(null);
     //    ReferencingFactoryContainer factories = new ReferencingFactoryContainer(null);

     try {
       final CRSAuthorityFactory crsAuthorityFactory =
           CRS.getAuthorityFactory(false);
       
       
       final GeographicCRS geoCRS =
           crsAuthorityFactory.createGeographicCRS("EPSG:4326");
//         org.geotools.referencing.crs.DefaultGeographicCRS.WGS84;

       final CoordinateReferenceSystem dataCRS = 
           crsAuthorityFactory
               .createCoordinateReferenceSystem("EPSG:" 
                   + getEPSGCodefromUTS(refLatLon)); //EPSG:32618

       //      parameters = mtFactory.getDefaultParameters("Transverse_Mercator");
       //
       //      final double zoneNumber = zone;
       //      final double utmZoneCenterLongitude = (zoneNumber - 1) * 6 - 180 + 3; // +3 puts origin
       //      parameters.parameter("central_meridian").setValue(utmZoneCenterLongitude);
       //      parameters.parameter("latitude_of_origin").setValue(0.0);
       //      parameters.parameter("scale_factor").setValue(0.9996);
       //      parameters.parameter("false_easting").setValue(500000.0);
       //      parameters.parameter("false_northing").setValue(0.0);
       //  
       //      Map properties = Collections.singletonMap("name", "WGS 84 / UTM Zone " + zoneNumber);
       //      ProjectedCRS projCRS = factories.createProjectedCRS(properties, geoCRS, null, parameters, cartCS);

       final MathTransform transform =
           CRS.findMathTransform(geoCRS, dataCRS);
       
       GeoUtils.recentMathTransform = transform;
       
       return transform;
     } catch (final NoSuchIdentifierException e) {
       // TODO Auto-generated catch block
       e.printStackTrace();
     } catch (final FactoryException e) {
       // TODO Auto-generated catch block
       e.printStackTrace();
     }

     return null;
     //    String[] spec = new String[6];
     //    spec[0] = "+proj=utm";
     //    spec[1] = "+zone=" + zone;
     //    spec[2] = "+ellps=clrk66";
     //    spec[3] = "+units=m";
     //    spec[4] = "+datum=NAD83";
     //    spec[5] = "+no_defs";
     //    Projection projection = ProjectionFactory.fromPROJ4Specification(spec);
     //    return projection;
   }

   /*
    * Taken from OneBusAway's UTMLibrary class
    */
   public static int getUTMZoneForLongitude(double lon) {

     if (lon < -180 || lon > 180)
       throw new IllegalArgumentException(
           "Coordinates not within UTM zone limits");

     int lonZone = (int) ((lon + 180) / 6);

     if (lonZone == 60)
       lonZone--;
     return lonZone + 1;
   }

   public static Vector getVector(Coordinate coord) {
     return VectorFactory.getDefault().createVector2D(
         coord.x, coord.y);
   }

   /**
    * Inverts a geometry's projection.
    * 
    * @param orig
    * @param projection
    * @return
    */
   public static Geometry invertGeom(Geometry orig,
     final MathTransform projection) {
     // TODO FIXME XXX: what about when the geoms cross zones?
     final Geometry geom = (Geometry) orig.clone();
     geom.apply(new CoordinateFilter() {
       @Override
       public void filter(Coordinate coord) {
         final Coordinate to = new Coordinate();
         try {
           JTS.transform(coord, to, projection.inverse());
         } catch (NoninvertibleTransformException e) {
           e.printStackTrace();
         } catch (TransformException e) {
           e.printStackTrace();
         }
         coord.setCoordinate(to);
       }
     });
     geom.geometryChanged();
     return geom;
   }

   public static Coordinate makeCoordinate(Vector vec) {
     return new Coordinate(vec.getElement(0),
         vec.getElement(1));
   }

   /**
    * Finds a UTM projection and applies it to all coordinates of the given geom.
    * 
    * @param orig
    * @return
    */

   public static Geometry projectLonLatGeom(Geometry orig) {
     // TODO FIXME XXX: what about when the geoms cross zones?
     final Geometry geom = (Geometry) orig.clone();
     geom.apply(new CoordinateFilter() {
       @Override
       public void filter(Coordinate coord) {
         final ProjectedCoordinate converted =
             GeoUtils.convertLonLatToEuclidean(coord);
         coord.setCoordinate(converted);
       }
     });

     geom.geometryChanged();
     return geom;
   }

   public static List<LineSegment> getSubLineSegments(LineString lineString) {
     Preconditions.checkArgument(lineString.getNumPoints() > 1);
     final List<LineSegment> results = Lists.newArrayList();
     
     Coordinate prevCoord = lineString.getCoordinateN(0);
     for (int i = 1; i < lineString.getNumPoints(); ++i) {
       final Coordinate nextCoord = lineString.getCoordinateN(i);
       if (!nextCoord.equals2D(prevCoord)) {
         results.add(new LineSegment(prevCoord, nextCoord));
         prevCoord = nextCoord;
       }
     }
     return results;
   }

   public static double endPointDistance(Geometry g)
	{
		ProjectedCoordinate p1 = GeoUtils.convertLatLonToEuclidean(g.getCoordinates()[0]);
		ProjectedCoordinate p2 = GeoUtils.convertLatLonToEuclidean(g.getCoordinates()[g.getCoordinates().length -1]);
		
		return p1.distance(p2);
	}
   
   	public static double endPointDistance(Coordinate p1, Coordinate p2)
	{
		ProjectedCoordinate pc1 = GeoUtils.convertLatLonToEuclidean(p1);
		ProjectedCoordinate pc2 = GeoUtils.convertLatLonToEuclidean(p2);
		
		return pc1.distance(pc2);
	}
	
	public static ProjectedCoordinate calcPointAlongLine(ProjectedCoordinate p1, ProjectedCoordinate p2, double offset)
	{
		// calculate distance along line
		// http://gis.stackexchange.com/questions/26861/how-to-find-a-point-on-given-line-that-its-distance-from-another-point-is-given
		
		Vector v1 = GeoUtils.getVector(p1);
		Vector v2 = GeoUtils.getVector(p2);
		
		Vector directionVector = v2.minus(v1);
		
		double distance = p1.distance(p2);
		
		Vector w = directionVector.scale(offset/distance);
		
		Vector t = v1.plus(w);
		
		// assumes same transform for p3 as p1...
		ProjectedCoordinate p3 = GeoUtils.convertToProjectedCoordinate(p1.getTransform(), t, p1.getReferenceLatLon());
		
		return p3;
	}
	
	public static double side(Vector A, Vector B, Vector P)
	{		
		return side(A.getElement(0), A.getElement(1), B.getElement(0), B.getElement(1), P.getElement(0), P.getElement(1));
	}
	
	public static double side(double Ax, double Ay, double Bx, double By, double Px, double Py)
	{
		// sign of (Bx - Ax) * (Cy - Ay) - (By - Ay) * (Cx - Ax) determins side
		// http://www.gamedev.net/topic/542870-determine-which-side-of-a-line-a-point-is/
		
		double side = (Bx - Ax) * (Py - Ay) - (By - Ay) * (Px - Ax);
		
		return Math.signum(side);
	}
 }