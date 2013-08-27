L.Control.Draw = L.Control.extend({
	options: {
		position: 'topright',
		drawMarker: true,
		drawPolyline: true,
		drawPolygon: true,
		drawRectangle: true
	},

	onAdd: function (map) {
		var className = 'leaflet-control-draw',
		    container = L.DomUtil.create('div', className);

		if(this.options.drawMarker) this._createButton('Draw a marker', className + '-marker', container, this._drawMarker, map.draw);
		if(this.options.drawPolyline) this._createButton('Draw a polyline', className + '-polyline', container, this._drawPolyline, map.draw);
		if(this.options.drawPolygon) this._createButton('Draw a polygon', className + '-polygon', container, this._drawPolygon, map.draw);
		if(this.options.drawRectangle) this._createButton('Draw a rectangle', className + '-rectangle', container, this._drawRectangle, map.draw);
		
		return container;
	},

	_createButton: function (title, className, container, fn, context) {
		var link = L.DomUtil.create('a', className, container);
		link.href = '#';
		link.title = title;

		L.DomEvent
			.addListener(link, 'click', L.DomEvent.stopPropagation)
			.addListener(link, 'click', L.DomEvent.preventDefault)
			.addListener(link, 'click', fn, context);

		return link;
	},

	_drawMarker: function () {
		this.setType('marker');
		this.enable();
	},
	
	_drawPolyline: function () {
		this.setType('polyline');
		this.enable();
	},
	
	_drawPolygon: function () {
		this.setType('polygon');
		this.enable();
	},
	
	_drawRectangle: function () {
		this.setType('rectangle');
		this.enable();
	}	
	
});

L.Map.addInitHook(function () {
	if (this.options.drawControl) {
		this.drawControl = new L.Control.Draw();
		this.addControl(this.drawControl);
	}
});