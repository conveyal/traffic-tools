
var Taxi = Backbone.Model.extend({ 

	initialize: function(){
		
	},

	      	defaults: {  
              phoneId: null, 
	            imei: null,  
	            operator: null,
	            driverId: null,
	            vehicleId: null,
              driver: null,
              vehicle: null,
				      lastUpdate: null,
				      panic: null,
              active: null,
              messages: null,
				      recentLat: null,
				      recentLon: null
	        } 
});

// the main collection, used the "volatile" model to sync and reconcile changes. 
var TaxiCollection =  Backbone.Collection.extend({  
        
        model : Taxi,  
        url: '/taxi/taxis',

       initialize: function( opts ){

            this.dataParam = {type:'active'};
            this.onSuccess = opts.success;
            this.view = opts.view;
          },

          getData: function(){
            if(this.dataParam != undefined)
              this.fetch({data: $.param(this.dataParam), update: true, success: this.onSuccess});
            else
              this.fetch({update: true});
          },
         
          getActive: function() {
            this.dataParam = {type:'active'};
            this.getData();
          },  

          getWithMessages: function() {
            this.dataParam = {type:'messages'};
            this.getData();
          },

          getAll: function() {
            this.dataParam = {type:'all'};
            this.getData();
          },



    });  

var TaxiPopupView = Backbone.View.extend({

    tagName: "div",
    className: "popup-content",

    events: {
        'click #clearMessages': 'clearMessages',
        'click #clearPanic': 'clearPanic',
        'click #sendMessage': 'sendMessage'
    },

    initialize: function ( opts ) {
      
      var view = this;

      // initi handlebars templates
      this.taxiPopupTemplate = Handlebars.compile($("#taxi-popup-tpl").html());

      this.listenTo(this.model, "change", this.render);

      this.render();

      _.bindAll(this, 'sendMessage', 'clearMessages', 'clearPanic');
  
    },

    // move map/sidebar rendering here?
    render: function () {

      this.$el.html(this.taxiPopupTemplate(this.model.attributes));

      //this._popup.setContent(this.$el[0])

      return this;
    },

    sendMessage: function(target) {
	if(this.$("#messageText").val() != "") {
		var message = this.$("#messageText").val();
	        $.post('/taxi/sendMessage', {phoneId: this.model.id, message: message});

		this.$("#messageText").val("");
	}
    },

    clearMessages: function(target) {
      $.get('/taxi/clearMessages', {phoneId: this.model.id});
    },

    clearPanic: function(target) {
      $.get('/taxi/clearPanic', {phoneId: this.model.id});
    }

})

var TaxiMapView = Backbone.View.extend({

	initialize: function ( opts ) {
      
      var view = this;

      // initi handlebars templates
      this.taxiPopupTemplate = Handlebars.compile($("#taxi-popup-tpl").html());


      // set update frequency from otps
      this.updateFrequency = opts.updateFrequency;

      // create/bind collection if not set via opts
      if(opts.collection == undefined)
          this.collection = new TaxiCollection({success: this.onCollectionUpdate});

      // Marker caches
      this.taxiLayers = {};

      // Li caches
      this.taxiItems = {};
      
      // Event bindings for the taxi collection
      this.collection.on('add', this.onModelAdd, this);
      this.collection.on('reset', this.onCollectionReset, this);
      this.collection.on('remove', this.onModelRemove, this);
      this.collection.on('change', this.onModelChange, this);

      // Custom icons
      this.taxiIcon = L.icon({
			  iconUrl: '/public/images/taxi.png',
			  iconSize: [32, 37],
		    iconAnchor: [16, 37],
		    popupAnchor: [0, -37],
        labelAnchor: [10, -16]
  	   });

      this.taxiIconBlue = L.icon({
  		  iconUrl: '/public/images/taxi_blue.png',
  		  iconSize: [32, 37],
  	    iconAnchor: [16, 37],
  	    popupAnchor: [0, -37],
        labelAnchor: [10, -16]
  		});

      this.taxiIconGray = L.icon({
          iconUrl: '/public/images/taxi_gray.png',
          iconSize: [32, 37],
          iconAnchor: [16, 37],
          popupAnchor: [0, -37],
          labelAnchor: [10, -16]
      });

  	
  	   this.panicIcon = L.icon({
  			  iconUrl: '/public/images/crime.png',
  			  iconSize: [32, 37],
  		    iconAnchor: [16, 37],
  		    popupAnchor: [0, -37],
          labelAnchor: [10, -16]
  		});

     // Base layer config is optional, default to Mapbox Streets
      var url = 'http://{s}.tiles.mapbox.com/v3/conveyal.map-jc4m5i21/{z}/{x}/{y}.png';
          baseLayer = L.tileLayer(url, {
            attribution: '&copy; OpenStreetMap contributors, CC-BY-SA. <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>' 
          });

      // Init the map
      this.map = L.map($('#map').get(0), {
        center: [10.31741, 123.894], //TODO: add to the config file for now
        zoom: 15,
        maxZoom: 17
      });

      this.map.addLayer(baseLayer);

      // Remove default prefix
      this.map.attributionControl.setPrefix('');

      // Add a layer group for taxis
      this.taxiLayerGroup = L.layerGroup().addTo(this.map);

      this.updateTaxis();

      this.startTimer();

      var view = this;


    },

    openPopup: function(modelId)
    {
      var data = this.collection.get(modelId);

      this.popupView = new TaxiPopupView({model: data});

      this.taxiLayers[modelId].bindPopup(this.popupView.$el[0]).openPopup();
    
    },

    startTimer: function() {
      var view = this;
      if(view.updateFrequency)
        view.timer = setInterval(function () { view.collection.getData() }, view.updateFrequency)
    },

    updateTaxis: function() {

      this.collection.getData();
  
    },

    showLabels: function(show) {

      this._showLabels = show;

      for(marker_id in this.taxiLayers)
      {
        if(show)
        {
          this.taxiLayers[marker_id].noHide(true);
          this.taxiLayers[marker_id].showLabel();
        }
        else
        {
          this.taxiLayers[marker_id].noHide(false);
          this.taxiLayers[marker_id].hideLabel();
        }

      }
    },

    showAll: function() {
      this.collection.getAll();

    },

    showActive: function() {
      this.collection.getActive();
    },

    showWithMessages: function() {
      this.collection.getWithMessages();
    },


    // move map/sidebar rendering here?
    render: function () {

      return this;
    },

    // When the stop collection resets, clear all the markers and add new ones.
    onCollectionReset: function() {
      //this.stopLayerGroup.clearLayers();

      var removeList = {}
      

      this.collection.each(function(model, i) {
        if(this.taxiLayers[model.id] == undefined)
          this.onModelAdd(model);
        else
          this.onModelChange(model);

        removeList[model.id] = false;
      }, this);

      
    },

    onModelChange: function(model) {
    	this.taxiLayers[model.id].setLatLng([model.get('recentLat'), model.get('recentLon')]);

      if(model.get('panic'))
        this.taxiLayers[model.id].setIcon(this.panicIcon);
      else if (model.get('messages') && model.get('messages').length > 0)
        this.taxiLayers[model.id].setIcon(this.taxiIconBlue);
      else if (! model.get('active'))
        this.taxiLayers[model.id].setIcon(this.taxiIconGray);
      else
        this.taxiLayers[model.id].setIcon(this.taxiIcon);
    },

    // Clean up when a taxi model is removed from the collection (ie deleted)
    onModelRemove: function(model) {

      if(model.id != null)
      {
        this.taxiLayers[model.id].noHide(false);
        this.taxiLayerGroup.removeLayer(this.taxiLayers[model.id]);

        delete this.taxiLayers[model.id];

        delete this.taxiItems[model.id];
      }
    },

    // Add the marker and bind events when a new taxi is created.
    onModelAdd: function(model) {

      var markerLayer;
      var markerIcon;

      if(model.get('panic'))
        markerIcon = this.panicIcon;
      else if (model.get('messages') && model.get('messages').length > 0)
        markerIcon = this.taxiIconBlue;
      else if (! model.get('active'))
        markerIcon = this.taxiIconGray;
      else
        markerIcon = this.taxiIcon;

        if(model.get('recentLon') == null)
          console.log(model.get('id'));
        this.taxiLayers[model.id] = markerLayer = L.marker([model.get('recentLat'),
          model.get('recentLon')], {
            draggable: false,
            id: model.id,
            icon: markerIcon
          });
      
      if(model.get('vehicle') != null && model.get('driver') != null)
        markerLayer.bindLabel(model.get('vehicle') + ' -- ' + model.get('driver'), {noHide: this._showLabels});

      var view = this;

      var modelId = model.id;

      // trigger the sidebar actions when the icon is clicked.
      markerLayer.on('click', function(evt) {
        view.openPopup(modelId)
      }, this);

      // Add it to the map
      this.taxiLayerGroup.addLayer(markerLayer);

      // turn on labels
      if(this._showLabels)
          markerLayer.showLabel();


    },

 });  
