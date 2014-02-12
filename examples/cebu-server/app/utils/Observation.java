package utils;

import gov.sandia.cognition.math.matrix.Vector;
import gov.sandia.cognition.math.matrix.VectorFactory;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Map;

import org.opengis.referencing.operation.TransformException;

import com.google.common.collect.ComparisonChain;
import com.google.common.collect.Maps;
import com.vividsolutions.jts.geom.Coordinate;

public class Observation implements Comparable<Observation> {

  private final String vehicleId;
  private final Date timestamp;
  private final Coordinate obsCoords;
  private final Double velocity;

  private final Double heading;
  private final Double accuracy;

  /*
   * This map is how we keep track of the previous records for each vehicle.
   */
  private static Map<String, Observation> vehiclesToRecords = Maps
      .newConcurrentMap();

  private static final SimpleDateFormat sdf = new SimpleDateFormat(
      "yyyy-MM-dd hh:mm:ss");

  public Observation(String vehicleId, Date timestamp,
    Coordinate obsCoords,   Double velocity, Double heading, Double accuracy) {
    this.vehicleId = vehicleId;
    this.timestamp = timestamp;
    this.obsCoords = obsCoords;
    this.velocity = velocity;
    this.heading = heading;
    this.accuracy = accuracy;


  }

  @Override
  public int compareTo(Observation o) {
    return ComparisonChain.start()
        .compare(this.timestamp, o.timestamp)
        .compare(this.vehicleId, o.vehicleId).result();
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj) {
      return true;
    }
    if (obj == null) {
      return false;
    }
    if (getClass() != obj.getClass()) {
      return false;
    }
    final Observation other = (Observation) obj;
    if (timestamp == null) {
      if (other.timestamp != null) {
        return false;
      }
    } else if (!timestamp.equals(other.timestamp)) {
      return false;
    }
    if (vehicleId == null) {
      if (other.vehicleId != null) {
        return false;
      }
    } else if (!vehicleId.equals(other.vehicleId)) {
      return false;
    }
    return true;
  }

  public Double getAccuracy() {
    return accuracy;
  }

  public Double getHeading() {
    return heading;
  }

  public Coordinate getObsCoordsLatLon() {
    return obsCoords;
  }


  public Date getTimestamp() {
    return timestamp;
  }

  public String getVehicleId() {
    return vehicleId;
  }

  public Double getVelocity() {
    return velocity;
  }

  @Override
  public int hashCode() {
    final int prime = 31;
    int result = 1;
    result =
        prime * result
            + ((timestamp == null) ? 0 : timestamp.hashCode());
    result =
        prime * result
            + ((vehicleId == null) ? 0 : vehicleId.hashCode());
    return result;
  }


  @Override
  public String toString() {
    return "Observation [vehicleId=" + vehicleId + ", timestamp="
        + timestamp + ", obsCoords=" + obsCoords + ", obsPoint="
        + ", velocity=" + velocity + ", heading="
        + heading + ", accuracy=" + accuracy + "]";
  }

  public static void clearRecordData() {
    vehiclesToRecords.clear();
  }

  public static synchronized Observation createObservation(
    String vehicleId, Date time, Coordinate obsCoords,
    Double velocity, Double heading, Double accuracy)
      throws TimeOrderException {
    final ProjectedCoordinate obsPoint =
        GeoUtils.convertLatLonToEuclidean(obsCoords);

    final Observation prevObs = vehiclesToRecords.get(vehicleId);

    /*
     * do this so we don't potentially hold on to every record in memory
     */
    final int recordNumber;
    if (prevObs != null) {
      /*
       * We check for out-of-time-order records.
       */
      if (time.getTime() <= prevObs.getTimestamp().getTime())
        throw new TimeOrderException();

  

    } else {
      recordNumber = 0;
    }

    final Observation obs =
        new Observation(vehicleId, time, obsCoords,
            velocity, heading, accuracy);

    vehiclesToRecords.put(vehicleId, obs);

    return obs;
  }

  public static synchronized Observation createObservation(
    String vehicleId, String timestamp, String latStr, String lonStr,
    String velocity, String heading, String accuracy)
      throws NumberFormatException, ParseException,
      TransformException, TimeOrderException {

    final double lat = Double.parseDouble(latStr);
    final double lon = Double.parseDouble(lonStr);
    final Coordinate obsCoords = new Coordinate(lat, lon);

    final Double velocityd =
        velocity != null ? Double.parseDouble(velocity) : null;
    final Double headingd =
        heading != null ? Double.parseDouble(heading) : null;
    final Double accuracyd =
        accuracy != null ? Double.parseDouble(accuracy) : null;
    final Date time = sdf.parse(timestamp);

    return createObservation(vehicleId, time, obsCoords, velocityd,
        headingd, accuracyd);
  }

  public static SimpleDateFormat getSdf() {
    return sdf;
  }

  public static Map<String, Observation> getVehiclesToRecords() {
    return vehiclesToRecords;
  }

  public static void remove(String name) {
    vehiclesToRecords.remove(name);
  }

}