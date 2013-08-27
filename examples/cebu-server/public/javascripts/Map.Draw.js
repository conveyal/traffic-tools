L.Map.Draw = L.Handler.extend({
	
	options: {
		icon: new L.DivIcon({
			iconSize: new L.Point(8, 8),
			className: 'leaflet-div-icon leaflet-editing-icon'
		})
	},
	
	initialize: function (map, type, options) {
		this._map = map;
		this.setType(type);
		L.Util.setOptions(this, options);
	},
	
	addHooks: function () {
		if(this._type == 'marker'){
			this._marker = null;
			this._map.on('click', this._drawMarker);			
		}else{
			
			if(this._type == 'polygon'){
				this._poly = new L.Polygon([]);
			}else if(this._type == 'rectangle'){
				this._poly = new L.Polygon([]);		
			}else{
				this._poly = new L.Polyline([]);
			}
			
			this._initMarkers();
			this._map.addLayer(this._markerGroup);
			this._map.addLayer(this._poly);
			this._map.on('click', this._drawPoly);
		}
	},

	removeHooks: function () {
		
		if(this._type == 'marker'){
			this._map.fire("drawend", {marker: this._marker});
			delete this._marker;
			this._map.off('click', this._drawMarker);
			
		}else{
			this._map.fire("drawend", {poly: this._poly});
			this._map.removeLayer(this._markerGroup);
			delete this._markerGroup;
			delete this._markers;
			delete this._poly;
			this._map.off('click', this._drawPoly);			
		}
	},

	setType: function (type) {
		this._type = type;
		return this._type;
	},

	_initMarkers: function () {
		if (!this._markerGroup) {
			this._markerGroup = new L.LayerGroup();
		}
		
		this._markers = [];
		
		var latlngs = this._poly._latlngs,
		    i, len, marker;


		for (i = 0, len = latlngs.length; i < len; i++) {
			marker = this._createMarker(latlngs[i], i);
			this._markers.push(marker);
		}
		
	},
	
	_createMarker: function (latlng) {

		var marker = new L.Marker(latlng, {
			icon: this.options.icon
		});
		
		marker.on('click', this._map.draw.disable, this);
		
		this._markerGroup.addLayer(marker);

		return marker;
	},
	
	_drawPoly: function (e) {
		this.draw._poly.addLatLng(e.latlng);
		this.draw._markerGroup.clearLayers();
		if((this.draw._type == 'rectangle') && ( this.draw._poly.getLatLngs().length ==2 ) ){
			var rectangle = new L.Rectangle(this.draw._poly.getBounds());
	        this.draw._poly.setLatLngs(rectangle.getLatLngs());
	        rectangle = null;
	        this.draw.disable();
		}else{			
			this.draw._initMarkers();
		}
	},
	
	_drawMarker: function (e) {
		this.draw._marker = new L.Marker(e.latlng);
		this.draw._map.addLayer(this.draw._marker);
		this.draw.disable();
	}
	
	
});

L.Map.addInitHook('addHandler', 'draw', L.Map.Draw);