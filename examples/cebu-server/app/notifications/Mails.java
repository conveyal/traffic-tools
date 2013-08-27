package notifications;
 
import models.Account;

import org.apache.commons.mail.*; 
import play.*;
import play.mvc.*;
import java.util.*;
 
public class Mails extends Mailer {

   public static void restPassword(Account account) {
   
      setFrom("Cebu Traffic <cebutrafficmailer@gmail.com>");
      setSubject("Your password has been reset");
      
      addRecipient(account.email);
      
      String username = account.username;
      
      String token = account.passwordChangeToken;
      
      send(token, username);
   }
 
}