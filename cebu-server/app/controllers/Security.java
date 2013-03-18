package controllers;
 
import models.*;
 
public class Security extends Secure.Security {
	
    static boolean authenticate(String username, String password) {
        return Account.connect(username, password);
    }
    
    static boolean check(String profile) {
        if("admin".equals(profile)) {
            return Account.find("username", connected()).<Account>first().isAdmin();
        }
        else if("citom".equals(profile)) {
            return Account.find("username", connected()).<Account>first().isCitom();
        }
        else if("taxi".equals(profile)) {
            return Account.find("username", connected()).<Account>first().isTaxi();
        }
        return false;
    }
 
    static Account getAccount()
    {
    	return Account.find("username", connected()).<Account>first();
    }
    
}