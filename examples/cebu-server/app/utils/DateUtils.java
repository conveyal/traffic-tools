package utils;

import java.text.DateFormat;
import java.text.ParseException;


public class DateUtils {

	public static final String DISPLAY_FORMAT = "MM/dd/yyyy HH:mm:ss";
	
	public static final String BASIC_FORMAT = "yyyy-MM-dd hh:mm:ss";
    public static final String LOCATION_UPDATE_FORMAT = "yyyyMMdd HHmmss";

    public static java.util.Date parseLocationUpdate(String dateString) throws ParseException {
        return getLocationUpdateFormat().parse(dateString);
    }
    
    public static java.util.Date parseBasic(String dateString) throws ParseException {
        return getBasicFormat().parse(dateString);
    }
    
    public static java.util.Date parseDisplay(String dateString) throws ParseException {
        return getDisplayFormat().parse(dateString);
    }

    private static ThreadLocal locationUpdateFormat = new ThreadLocal() {
        protected synchronized Object initialValue() {
            return new java.text.SimpleDateFormat(LOCATION_UPDATE_FORMAT);
        }
    };
    
    private static ThreadLocal basicFormat = new ThreadLocal() {
        protected synchronized Object initialValue() {
            return new java.text.SimpleDateFormat(BASIC_FORMAT);
        }
    };
    
    private static ThreadLocal displayFormat = new ThreadLocal() {
        protected synchronized Object initialValue() {
            return new java.text.SimpleDateFormat(DISPLAY_FORMAT);
        }
    };

    private static DateFormat getLocationUpdateFormat(){
        return (DateFormat) locationUpdateFormat.get();
    }
    
    private static DateFormat getBasicFormat(){
        return (DateFormat) basicFormat.get();
    }
    
    private static DateFormat getDisplayFormat(){
        return (DateFormat) displayFormat.get();
    }
}