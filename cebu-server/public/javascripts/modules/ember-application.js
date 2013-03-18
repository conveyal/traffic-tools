(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Ember.get, set = Ember.set;

/**
  @class

  An Ember.Application instance serves as the namespace in which you define your
  application's classes. You can also override the configuration of your
  application.

  By default, Ember.Application will begin listening for events on the document.
  If your application is embedded inside a page, instead of controlling the
  entire document, you can specify which DOM element to attach to by setting
  the `rootElement` property:

      MyApp = Ember.Application.create({
        rootElement: $('#my-app')
      });

  The root of an Ember.Application must not be removed during the course of the
  page's lifetime. If you have only a single conceptual application for the
  entire page, and are not embedding any third-party Ember applications
  in your page, use the default document root for your application.

  You only need to specify the root if your page contains multiple instances
  of Ember.Application.

  @extends Ember.Object
*/
Ember.Application = Ember.Namespace.extend(
/** @scope Ember.Application.prototype */{

  /**
    The root DOM element of the Application.

    Can be specified as DOMElement or a selector string.

    @type DOMElement
    @default 'body'
  */
  rootElement: 'body',

  /**
    @type Ember.EventDispatcher
    @default null
  */
  eventDispatcher: null,

  /**
    @type Object
    @default null
  */
  customEvents: null,

  /** @private */
  init: function() {
    var eventDispatcher,
        rootElement = get(this, 'rootElement');
    this._super();

    eventDispatcher = Ember.EventDispatcher.create({
      rootElement: rootElement
    });

    set(this, 'eventDispatcher', eventDispatcher);

    // jQuery 1.7 doesn't call the ready callback if already ready
    if (Ember.$.isReady) {
      Ember.run.once(this, this.didBecomeReady);
    } else {
      var self = this;
      Ember.$(document).ready(function() {
        Ember.run.once(self, self.didBecomeReady);
      });
    }
  },

  /**
    Instantiate all controllers currently available on the namespace
    and inject them onto a router.

    Example:

        App.PostsController = Ember.ArrayController.extend();
        App.CommentsController = Ember.ArrayController.extend();

        var router = Ember.Router.create({
          ...
        });

        App.initialize(router);

        router.get('postsController')     // <App.PostsController:ember1234>
        router.get('commentsController')  // <App.CommentsController:ember1235>

        router.getPath('postsController.router') // router
  */
  initialize: function(router) {
    var properties = Ember.A(Ember.keys(this)),
        injections = get(this.constructor, 'injections'),
        namespace = this, controller, name;

    if (!router && Ember.Router.detect(namespace['Router'])) {
      router = namespace['Router'].create();
      this._createdRouter = router;
    }

    if (router) {
      set(this, 'router', router);

      // By default, the router's namespace is the current application.
      //
      // This allows it to find model classes when a state has a
      // route like `/posts/:post_id`. In that case, it would first
      // convert `post_id` into `Post`, and then look it up on its
      // namespace.
      set(router, 'namespace', this);
    }

    Ember.runLoadHooks('application', this);

    injections.forEach(function(injection) {
      properties.forEach(function(property) {
        injection[1](namespace, router, property);
      });
    });

    if (router && router instanceof Ember.Router) {
      this.startRouting(router);
    }
  },

  /** @private */
  didBecomeReady: function() {
    var eventDispatcher = get(this, 'eventDispatcher'),
        customEvents    = get(this, 'customEvents');

    eventDispatcher.setup(customEvents);

    this.ready();
  },

  /**
    @private

    If the application has a router, use it to route to the current URL, and
    trigger a new call to `route` whenever the URL changes.
  */
  startRouting: function(router) {
    var location = get(router, 'location'),
        rootElement = get(this, 'rootElement'),
        applicationController = get(router, 'applicationController');

    if (this.ApplicationView && applicationController) {
      var applicationView = this.ApplicationView.create({
        controller: applicationController
      });
      this._createdApplicationView = applicationView;

      applicationView.appendTo(rootElement);
    }

    router.route(location.getURL());
    location.onUpdateURL(function(url) {
      router.route(url);
    });
  },

  /**
    Called when the Application has become ready.
    The call will be delayed until the DOM has become ready.
  */
  ready: Ember.K,

  /** @private */
  willDestroy: function() {
    get(this, 'eventDispatcher').destroy();
    if (this._createdRouter)          { this._createdRouter.destroy(); }
    if (this._createdApplicationView) { this._createdApplicationView.destroy(); }
  },

  registerInjection: function(options) {
    this.constructor.registerInjection(options);
  }
});

Ember.Application.reopenClass({
  concatenatedProperties: ['injections'],
  injections: Ember.A(),
  registerInjection: function(options) {
    var injections = get(this, 'injections'),
        before = options.before,
        name = options.name,
        injection = options.injection,
        location;

    if (before) {
      location = injections.find(function(item) {
        if (item[0] === before) { return true; }
      });
      location = injections.indexOf(location);
    } else {
      location = get(injections, 'length');
    }

    injections.splice(location, 0, [name, injection]);
  }
});

Ember.Application.registerInjection({
  name: 'controllers',
  injection: function(app, router, property) {
    if (!/^[A-Z].*Controller$/.test(property)) { return; }

    var name = property.charAt(0).toLowerCase() + property.substr(1),
        controller = app[property].create();

    router.set(name, controller);

    controller.setProperties({
      target: router,
      controllers: router,
      namespace: app
    });
  }
});

})();



(function() {
var get = Ember.get, set = Ember.set;

/**
  This file implements the `location` API used by Ember's router.

  That API is:

  getURL: returns the current URL
  setURL(path): sets the current URL
  onUpdateURL(callback): triggers the callback when the URL changes
  formatURL(url): formats `url` to be placed into `href` attribute

  Calling setURL will not trigger onUpdateURL callbacks.

  TODO: This, as well as the Ember.Location documentation below, should
  perhaps be moved so that it's visible in the JsDoc output.
*/
/**
  Ember.Location returns an instance of the correct implementation of
  the `location` API.

  You can pass it a `implementation` ('hash', 'history', 'none') to force a
  particular implementation.
*/
Ember.Location = {
  create: function(options) {
    var implementation = options && options.implementation;
    Ember.assert("Ember.Location.create: you must specify a 'implementation' option", !!implementation);

    var implementationClass = this.implementations[implementation];
    Ember.assert("Ember.Location.create: " + implementation + " is not a valid implementation", !!implementationClass);

    return implementationClass.create.apply(implementationClass, arguments);
  },

  registerImplementation: function(name, implementation) {
    this.implementations[name] = implementation;
  },

  implementations: {}
};

})();



(function() {
var get = Ember.get, set = Ember.set;

/**
  Ember.HashLocation implements the location API using the browser's
  hash. At present, it relies on a hashchange event existing in the
  browser.
*/
Ember.HashLocation = Ember.Object.extend({
  init: function() {
    set(this, 'location', get(this, 'location') || window.location);
  },

  /**
    @private

    Returns the current `location.hash`, minus the '#' at the front.
  */
  getURL: function() {
    return get(this, 'location').hash.substr(1);
  },

  /**
    @private

    Set the `location.hash` and remembers what was set. This prevents
    `onUpdateURL` callbacks from triggering when the hash was set by
    `HashLocation`.
  */
  setURL: function(path) {
    get(this, 'location').hash = path;
    set(this, 'lastSetURL', path);
  },

  /**
    @private

    Register a callback to be invoked when the hash changes. These
    callbacks will execute when the user presses the back or forward
    button, but not after `setURL` is invoked.
  */
  onUpdateURL: function(callback) {
    var self = this;
    var guid = Ember.guidFor(this);

    Ember.$(window).bind('hashchange.ember-location-'+guid, function() {
      var path = location.hash.substr(1);
      if (get(self, 'lastSetURL') === path) { return; }

      set(self, 'lastSetURL', null);

      callback(location.hash.substr(1));
    });
  },

  /**
    @private

    Given a URL, formats it to be placed into the page as part
    of an element's `href` attribute.

    This is used, for example, when using the {{action}} helper
    to generate a URL based on an event.
  */
  formatURL: function(url) {
    return '#'+url;
  },

  willDestroy: function() {
    var guid = Ember.guidFor(this);

    Ember.$(window).unbind('hashchange.ember-location-'+guid);
  }
});

Ember.Location.registerImplementation('hash', Ember.HashLocation);

})();



(function() {
var get = Ember.get, set = Ember.set;

/**
  Ember.HistoryLocation implements the location API using the browser's
  history.pushState API.
*/
Ember.HistoryLocation = Ember.Object.extend({
  init: function() {
    set(this, 'location', get(this, 'location') || window.location);
    set(this, '_initialURL', get(this, 'location').pathname);
  },

  /**
    @private

    Used to give history a starting reference
   */
  _initialURL: null,

  /**
    @private

    Returns the current `location.pathname`.
  */
  getURL: function() {
    return get(this, 'location').pathname;
  },

  /**
    @private

    Uses `history.pushState` to update the url without a page reload.
  */
  setURL: function(path) {
    var state = window.history.state,
        initialURL = get(this, '_initialURL');

    if (path === "") { path = '/'; }

    if ((initialURL && initialURL !== path) || (state && state.path !== path)) {
      set(this, '_initialURL', null);
      window.history.pushState({ path: path }, null, path);
    }
  },

  /**
    @private

    Register a callback to be invoked whenever the browser
    history changes, including using forward and back buttons.
  */
  onUpdateURL: function(callback) {
    var guid = Ember.guidFor(this);

    Ember.$(window).bind('popstate.ember-location-'+guid, function(e) {
      callback(location.pathname);
    });
  },

  /**
    @private

    Used when using {{action}} helper.  Since no formatting
    is required we just return the url given.
  */
  formatURL: function(url) {
    return url;
  },

  willDestroy: function() {
    var guid = Ember.guidFor(this);

    Ember.$(window).unbind('popstate.ember-location-'+guid);
  }
});

Ember.Location.registerImplementation('history', Ember.HistoryLocation);

})();



(function() {
var get = Ember.get, set = Ember.set;

/**
  Ember.NoneLocation does not interact with the browser. It is useful for
  testing, or when you need to manage state with your Router, but temporarily
  don't want it to muck with the URL (for example when you embed your
  application in a larger page).
*/
Ember.NoneLocation = Ember.Object.extend({
  path: '',

  getURL: function() {
    return get(this, 'path');
  },

  setURL: function(path) {
    set(this, 'path', path);
  },

  onUpdateURL: function(callback) {
    // We are not wired up to the browser, so we'll never trigger the callback.
  },

  formatURL: function(url) {
    // The return value is not overly meaningful, but we do not want to throw
    // errors when test code renders templates containing {{action href=true}}
    // helpers.
    return url;
  }
});

Ember.Location.registerImplementation('none', Ember.NoneLocation);

})();



(function() {

})();



(function() {

})();

