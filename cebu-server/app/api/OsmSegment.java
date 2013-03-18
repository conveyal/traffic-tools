package api;

import org.codehaus.jackson.map.annotate.JsonSerialize;

import utils.GeoJSONSerializer;

import com.vividsolutions.jts.algorithm.Angle;
import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.Geometry;
import com.vividsolutions.jts.geom.GeometryFactory;

public class OsmSegment {
  private final static double OFFSET = 8;
  private static GeometryFactory gf = new GeometryFactory();
    
  private final int id;
  private final Geometry geom;
  private final Double angle;
  private final String name;
  private final Double length;

  public OsmSegment(Integer i, Geometry g, String name) {
    if (g != null) {
      final int points = g.getCoordinates().length;
      this.angle =
          Angle.toDegrees(Angle.normalizePositive(Angle.angle(
              g.getCoordinates()[points - 2],
              g.getCoordinates()[points - 1])));

      this.length = g.getLength();
    } else {
      this.angle = null;
      this.length = null;
    }
    this.id = i;
    this.geom = offset(g);
    this.name = name;
  }

  private Geometry offset(Geometry g) {
      if (g == null) return null;
      Coordinate[] oldCoords = g.getCoordinates();
      int nCoords = oldCoords.length;
      Coordinate[] newCoords = new Coordinate[nCoords];
      
      for (int i = 0; i < nCoords - 1; ++i) {
          Coordinate coord0 = oldCoords[i];
          Coordinate coord1 = oldCoords[i+1];
          
          double dx = coord1.x - coord0.x;
          double dy = coord1.y - coord0.y;
          
          double length = Math.sqrt(dx * dx + dy * dy);
          
          Coordinate c0 = new Coordinate(coord0.x - OFFSET * dy / length, coord0.y - OFFSET * dx / length);
          Coordinate c1 = new Coordinate(coord1.x - OFFSET * dy / length, coord1.y - OFFSET * dx / length);
          newCoords[i] = c0;
          newCoords[i+1] = c1; //will get overwritten except at last iteration
      }
      
      return gf.createLineString(newCoords);
  }

@JsonSerialize
  public Double getAngle() {
    return angle;
  }

  @JsonSerialize(using = GeoJSONSerializer.class)
  public Geometry getGeom() {
    return geom;
  }

  @JsonSerialize
  public int getId() {
    return id;
  }

  @JsonSerialize
  public Double getLength() {
    return length;
  }

  @JsonSerialize
  public String getName() {
    return name;
  }

}
