App = Em.Application.create({

  ready: function() {
	  App.store.findQuery(App.Alert);
	  
    this._super();
  }
});

App.adapter = DS.Adapter.create({
	
	
    findQuery: function(store, type, query, modelArray) {
        var url = type.queryUrl;

        jQuery.getJSON(url, query, function(data) {        
        	modelArray.load( data);
        });
    },
	findMany: function(store, type, ids) {
	    var url = type.manynUrl;
	    url = url.fmt(ids.join(','));
	
	    jQuery.getJSON(url, function(data) {
	        // data is an Array of Hashes in the same order as the original
	        // Array of IDs. If your server returns a root, simply do something
	        // like:
	        // store.loadMany(type, ids, data.people)
	        store.loadMany(type, ids, data);
	    });
	},
    find: function(store, type, id) {
	    var url = type.manynUrl;
	    url = url.fmt(id);
	
	    jQuery.getJSON(url, function(data) {
	        // data is an Array of Hashes in the same order as the original
	        // Array of IDs. If your server returns a root, simply do something
	        // store.loadMany(type, ids, data.people)
	    	store.load(type, id, data);
	    });
	}
});

App.store = DS.Store.create({
	  revision: 4,
	  adapter: App.adapter
	});

App.Alert = DS.Model.extend();
App.Alert.reopenClass({
	manynUrl: '/api/alerts?id=%@',
	manynUrl: '/api/alerts?ids=%@',
	queryUrl: '/api/alerts'
});

App.alertController = Em.ArrayController.create({
	  content: App.Alert.findAll()
	});
	