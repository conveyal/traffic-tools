package models;

import java.math.BigInteger;
import java.util.ArrayList;
import java.util.List;

import javax.persistence.Entity;
import javax.persistence.Query;

import org.apache.commons.lang.StringUtils;
import org.hibernate.annotations.Type;

import play.db.jpa.Model;

import com.vividsolutions.jts.geom.Coordinate;
import com.vividsolutions.jts.geom.LineString;
import com.vividsolutions.jts.geom.Point;

@Entity
public class PathPoint extends Model {

    
    @Type(type = "org.hibernatespatial.GeometryUserType")
    public Point shape;
    
   
    
}
