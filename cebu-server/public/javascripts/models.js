var CebuTraffic = CebuTraffic || {};

(function(G, $) {

  var jsonifyValidator = function(attrs, property, model) {
    var obj;
    if (_.isString(attrs[property])) {
      try {
        obj = JSON.parse(attrs[property]);
      } catch(e) {
        // location was a string, but not JSON. This will break on the server.
      }
      if (obj) {
        model.set(property, obj, {silent: true});
      }
    }
  };

  G.Incident = Backbone.Model.extend({
    defaults: {
      id: null,
      type: null,
      timestamp: null,
      active: null,
      location: null
    },
    // This function serves to allow stringified JSON as a valid input. A bit
    // hacky, but it's a great place to do it.
    validate: function(attrs) {
      jsonifyValidator(attrs, 'location', this);
    }
  });

  G.Incidents = Backbone.Collection.extend({
    type: 'Stops',
    model: G.Incident,
    url: '/api/incident/'
  });

 

})(CebuTraffic, jQuery);