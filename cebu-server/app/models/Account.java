package models;

import java.security.MessageDigest;
import java.util.Date;
import java.util.UUID;

import javax.persistence.Entity;
import javax.persistence.ManyToOne;

import notifications.Mails;

import org.apache.commons.codec.binary.Hex;
import org.hsqldb.lib.MD5;

import play.Play;
import play.db.jpa.Model;

@Entity
public class Account extends Model {
 
    public String username;
    public String password;
    
    public String email;
    
    public String passwordChangeToken;
    
    public Date lastLogin;
    
    public Boolean active;
    
    public Boolean admin;
    public Boolean citom;
    public Boolean taxi;
    
    @ManyToOne
	public Operator operator;
    
    public Account(String username, String password, String email, Boolean admin, Boolean taxi, Boolean citom, Long operatorId)
    {
    	this.username = username;
    	this.email = email;
    	
    	this.active = true;
    	
    	this.password = Account.hash(password);
    	
    	this.admin = admin;
    	this.citom = citom;
    	this.taxi = taxi;
    	
    	if(operatorId != null)
    	{
    		this.operator = Operator.findById(operatorId);
    	}
    	
    	this.save();
    }
    
    public static void update(String username, String email, Boolean active, Boolean admin, Boolean taxi, Boolean citom, Long operatorId)
    {
    	Account account = Account.find("username = ?", username).first(); 
    	
    	account.username = username;
    	account.email = email;
    	
    	account.active = active;
    	
    	account.admin = admin;
    	account.citom = citom;
    	account.taxi = taxi;
    	
    	if(operatorId != null)
    	{
    		account.operator = Operator.findById(operatorId);
    	}
    	else
    		account.operator = null;
    	
    	account.save();
    }
    
    public void login()
    {
    	this.lastLogin = new Date();
    	this.save();
    }
    
    public Boolean isAdmin()
    {
    	if(this.admin != null && this.admin)
    		return true;
    	else
    		return false;
    }
    
    public Boolean isCitom()
    {
    	if((this.citom != null && this.citom) || isAdmin())
    		return true;
    	else
    		return false;
    }
    
    public Boolean isTaxi()
    {
    	if((this.taxi != null && this.taxi) || isAdmin())
    		return true;
    	else
    		return false;
    }
    
    public static String hash(String password)
    {
    	try
    	{
    		byte[] bytes = (password.trim() + Play.secretKey).getBytes("UTF-8");

    		MessageDigest md = MessageDigest.getInstance("MD5");
    		byte[] digest = md.digest(bytes);
    	
    		String hexString = new String(Hex.encodeHex(digest));
    		
    		return hexString;
    	}
    	catch(Exception e)
    	{
    		return null;
    	}
    }

    public static Boolean initiatePasswordReset(String username)
    {
    	Account account = Account.find("username = ?", username).first(); 
    	
    	if(account != null)
    	{
    		account.passwordChangeToken = UUID.randomUUID().toString();
    		account.save();
    	
    		Mails.restPassword(account);
    		
    		return true;
    	}
    	else
    		return false;
    }
    
    
    public static Boolean validPasswordResetToken(String token)
    {
    	Account account = Account.find("passwordChangeToken = ?", token).first(); 
    	
    	if(account != null)
	    	return true;
    	else
    		return false;
    }
    
    public static Boolean completePasswordReset(String token, String password)
    {
    	Account account = Account.find("passwordChangeToken = ?", token).first(); 
    	
    	if(account != null)
    	{
    		String hashedPassword = Account.hash(password); 
    		
    		account.passwordChangeToken = null;
    		account.password = hashedPassword;
    		account.save();
    		
    		return true;
    	}
    	else
    		return false;
    }
   
    public static Boolean changePassword(String username, String currentPassword, String newPassword)
    {
    	String hashedPassword = Account.hash(currentPassword); 
    	Account user = Account.find("username = ? and password = ?", username, hashedPassword).first(); 
    	
    	if(user != null)
    	{
    		String newHashedPassword = Account.hash(newPassword); 
    		
    		user.password = newHashedPassword;
    		user.save();
    		
    		return true;
    	}
    	else 
    		return false;
    }
    
    public static Boolean resetPassword(String username, String newPassword)
    {
    	Account user = Account.find("username = ?", username).first(); 
    	
    	if(user != null)
    	{
    		String newHashedPassword = Account.hash(newPassword); 
    		
    		user.password = newHashedPassword;
    		user.save();
    		
    		return true;
    	}
    	else 
    		return false;
    }
    
    public static Boolean connect(String username, String password)
    {
    	if(username.isEmpty() || password.isEmpty())
    		return false;
    	
    	String hashedPassword = Account.hash(password); 
    	Account user = Account.find("username = ? and password = ?", username, hashedPassword).first();
    	
    	if(user != null && user.active)
    	{
    		user.login();
    		return true;
    	}
    	else
    		return false;
    
    }
    
}
