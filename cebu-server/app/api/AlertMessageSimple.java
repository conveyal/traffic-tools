package api;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import models.AlertMessage;



public class AlertMessageSimple {

    public Long id;
    public Date timestamp;
    public String description;
    public String account;


    public AlertMessageSimple(AlertMessage message)
    {
        this.id = message.id;
    	this.timestamp = message.timestamp;
    	this.description = message.description;

        this.account = message.account.username;
    	
    }

  }





