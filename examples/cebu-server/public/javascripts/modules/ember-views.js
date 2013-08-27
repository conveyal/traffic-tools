(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

Ember.assert("Ember Views require jQuery 1.7", window.jQuery && (window.jQuery().jquery.match(/^1\.7(\.\d+)?(pre|rc\d?)?/) || Ember.ENV.FORCE_JQUERY));
Ember.$ = window.jQuery;

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

// http://www.whatwg.org/specs/web-apps/current-work/multipage/dnd.html#dndevents
var dragEvents = Ember.String.w('dragstart drag dragenter dragleave dragover drop dragend');

// Copies the `dataTransfer` property from a browser event object onto the
// jQuery event object for the specified events
Ember.EnumerableUtils.forEach(dragEvents, function(eventName) {
  Ember.$.event.fixHooks[eventName] = { props: ['dataTransfer'] };
});

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Ember.get, set = Ember.set;
var indexOf = Ember.ArrayPolyfills.indexOf;

/** @private */
var ClassSet = function() {
  this.seen = {};
  this.list = [];
};

ClassSet.prototype = {
  add: function(string) {
    if (string in this.seen) { return; }
    this.seen[string] = true;

    this.list.push(string);
  },

  toDOM: function() {
    return this.list.join(" ");
  }
};

/**
  @class

  Ember.RenderBuffer gathers information regarding the a view and generates the
  final representation. Ember.RenderBuffer will generate HTML which can be pushed
  to the DOM.

  @extends Ember.Object
*/
Ember.RenderBuffer = function(tagName) {
  return new Ember._RenderBuffer(tagName);
};

Ember._RenderBuffer = function(tagName) {
  this.elementTag = tagName;
  this.childBuffers = [];
};

Ember._RenderBuffer.prototype =
/** @scope Ember.RenderBuffer.prototype */ {

  /**
    Array of class-names which will be applied in the class="" attribute

    You should not maintain this array yourself, rather, you should use
    the addClass() method of Ember.RenderBuffer.

    @type Array
    @default []
  */
  elementClasses: null,

  /**
    The id in of the element, to be applied in the id="" attribute

    You should not set this property yourself, rather, you should use
    the id() method of Ember.RenderBuffer.

    @type String
    @default null
  */
  elementId: null,

  /**
    A hash keyed on the name of the attribute and whose value will be
    applied to that attribute. For example, if you wanted to apply a
    data-view="Foo.bar" property to an element, you would set the
    elementAttributes hash to {'data-view':'Foo.bar'}

    You should not maintain this hash yourself, rather, you should use
    the attr() method of Ember.RenderBuffer.

    @type Hash
    @default {}
  */
  elementAttributes: null,

  /**
    The tagname of the element an instance of Ember.RenderBuffer represents.

    Usually, this gets set as the first parameter to Ember.RenderBuffer. For
    example, if you wanted to create a `p` tag, then you would call

      Ember.RenderBuffer('p')

    @type String
    @default null
  */
  elementTag: null,

  /**
    A hash keyed on the name of the style attribute and whose value will
    be applied to that attribute. For example, if you wanted to apply a
    background-color:black;" style to an element, you would set the
    elementStyle hash to {'background-color':'black'}

    You should not maintain this hash yourself, rather, you should use
    the style() method of Ember.RenderBuffer.

    @type Hash
    @default {}
  */
  elementStyle: null,

  /**
    Nested RenderBuffers will set this to their parent RenderBuffer
    instance.

    @type Ember._RenderBuffer
  */
  parentBuffer: null,

  /**
    Adds a string of HTML to the RenderBuffer.

    @param {String} string HTML to push into the buffer
    @returns {Ember.RenderBuffer} this
  */
  push: function(string) {
    this.childBuffers.push(String(string));
    return this;
  },

  /**
    Adds a class to the buffer, which will be rendered to the class attribute.

    @param {String} className Class name to add to the buffer
    @returns {Ember.RenderBuffer} this
  */
  addClass: function(className) {
    // lazily create elementClasses
    var elementClasses = this.elementClasses = (this.elementClasses || new ClassSet());
    this.elementClasses.add(className);

    return this;
  },

  /**
    Sets the elementID to be used for the element.

    @param {String} id
    @returns {Ember.RenderBuffer} this
  */
  id: function(id) {
    this.elementId = id;
    return this;
  },

  // duck type attribute functionality like jQuery so a render buffer
  // can be used like a jQuery object in attribute binding scenarios.

  /**
    Adds an attribute which will be rendered to the element.

    @param {String} name The name of the attribute
    @param {String} value The value to add to the attribute
    @returns {Ember.RenderBuffer|String} this or the current attribute value
  */
  attr: function(name, value) {
    var attributes = this.elementAttributes = (this.elementAttributes || {});

    if (arguments.length === 1) {
      return attributes[name];
    } else {
      attributes[name] = value;
    }

    return this;
  },

  /**
    Remove an attribute from the list of attributes to render.

    @param {String} name The name of the attribute
    @returns {Ember.RenderBuffer} this
  */
  removeAttr: function(name) {
    var attributes = this.elementAttributes;
    if (attributes) { delete attributes[name]; }

    return this;
  },

  /**
    Adds a style to the style attribute which will be rendered to the element.

    @param {String} name Name of the style
    @param {String} value
    @returns {Ember.RenderBuffer} this
  */
  style: function(name, value) {
    var style = this.elementStyle = (this.elementStyle || {});

    this.elementStyle[name] = value;
    return this;
  },

  /**
    Create a new child render buffer from a parent buffer. Optionally set
    additional properties on the buffer. Optionally invoke a callback
    with the newly created buffer.

    This is a primitive method used by other public methods: `begin`,
    `prepend`, `replaceWith`, `insertAfter`.

    @private
    @param {String} tagName Tag name to use for the child buffer's element
    @param {Ember._RenderBuffer} parent The parent render buffer that this
      buffer should be appended to.
    @param {Function} fn A callback to invoke with the newly created buffer.
    @param {Object} other Additional properties to add to the newly created
      buffer.
  */
  newBuffer: function(tagName, parent, fn, other) {
    var buffer = new Ember._RenderBuffer(tagName);
    buffer.parentBuffer = parent;

    if (other) { Ember.$.extend(buffer, other); }
    if (fn) { fn.call(this, buffer); }

    return buffer;
  },

  /**
    Replace the current buffer with a new buffer. This is a primitive
    used by `remove`, which passes `null` for `newBuffer`, and `replaceWith`,
    which passes the new buffer it created.

    @private
    @param {Ember._RenderBuffer} buffer The buffer to insert in place of
      the existing buffer.
  */
  replaceWithBuffer: function(newBuffer) {
    var parent = this.parentBuffer;
    if (!parent) { return; }

    var childBuffers = parent.childBuffers;

    var index = indexOf.call(childBuffers, this);

    if (newBuffer) {
      childBuffers.splice(index, 1, newBuffer);
    } else {
      childBuffers.splice(index, 1);
    }
  },

  /**
    Creates a new Ember.RenderBuffer object with the provided tagName as
    the element tag and with its parentBuffer property set to the current
    Ember.RenderBuffer.

    @param {String} tagName Tag name to use for the child buffer's element
    @returns {Ember.RenderBuffer} A new RenderBuffer object
  */
  begin: function(tagName) {
    return this.newBuffer(tagName, this, function(buffer) {
      this.childBuffers.push(buffer);
    });
  },

  /**
    Prepend a new child buffer to the current render buffer.

    @param {String} tagName Tag name to use for the child buffer's element
  */
  prepend: function(tagName) {
    return this.newBuffer(tagName, this, function(buffer) {
      this.childBuffers.splice(0, 0, buffer);
    });
  },

  /**
    Replace the current buffer with a new render buffer.

    @param {String} tagName Tag name to use for the new buffer's element
  */
  replaceWith: function(tagName) {
    var parentBuffer = this.parentBuffer;

    return this.newBuffer(tagName, parentBuffer, function(buffer) {
      this.replaceWithBuffer(buffer);
    });
  },

  /**
    Insert a new render buffer after the current render buffer.

    @param {String} tagName Tag name to use for the new buffer's element
  */
  insertAfter: function(tagName) {
    var parentBuffer = get(this, 'parentBuffer');

    return this.newBuffer(tagName, parentBuffer, function(buffer) {
      var siblings = parentBuffer.childBuffers;
      var index = indexOf.call(siblings, this);
      siblings.splice(index + 1, 0, buffer);
    });
  },

  /**
    Closes the current buffer and adds its content to the parentBuffer.

    @returns {Ember.RenderBuffer} The parentBuffer, if one exists. Otherwise, this
  */
  end: function() {
    var parent = this.parentBuffer;
    return parent || this;
  },

  remove: function() {
    this.replaceWithBuffer(null);
  },

  /**
    @returns {DOMElement} The element corresponding to the generated HTML
      of this buffer
  */
  element: function() {
    return Ember.$(this.string())[0];
  },

  /**
    Generates the HTML content for this buffer.

    @returns {String} The generated HTMl
  */
  string: function() {
    var content = '', tag = this.elementTag, openTag;

    if (tag) {
      var id = this.elementId,
          classes = this.elementClasses,
          attrs = this.elementAttributes,
          style = this.elementStyle,
          styleBuffer = '', prop;

      openTag = ["<" + tag];

      if (id) { openTag.push('id="' + this._escapeAttribute(id) + '"'); }
      if (classes) { openTag.push('class="' + this._escapeAttribute(classes.toDOM()) + '"'); }

      if (style) {
        for (prop in style) {
          if (style.hasOwnProperty(prop)) {
            styleBuffer += (prop + ':' + this._escapeAttribute(style[prop]) + ';');
          }
        }

        openTag.push('style="' + styleBuffer + '"');
      }

      if (attrs) {
        for (prop in attrs) {
          if (attrs.hasOwnProperty(prop)) {
            openTag.push(prop + '="' + this._escapeAttribute(attrs[prop]) + '"');
          }
        }
      }

      openTag = openTag.join(" ") + '>';
    }

    var childBuffers = this.childBuffers;

    Ember.ArrayPolyfills.forEach.call(childBuffers, function(buffer) {
      var stringy = typeof buffer === 'string';
      content += (stringy ? buffer : buffer.string());
    });

    if (tag) {
      return openTag + content + "</" + tag + ">";
    } else {
      return content;
    }
  },

  _escapeAttribute: function(value) {
    // Stolen shamelessly from Handlebars

    var escape = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "`": "&#x60;"
    };

    var badChars = /&(?!\w+;)|[<>"'`]/g;
    var possible = /[&<>"'`]/;

    var escapeChar = function(chr) {
      return escape[chr] || "&amp;";
    };

    var string = value.toString();

    if(!possible.test(string)) { return string; }
    return string.replace(badChars, escapeChar);
  }

};

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

var get = Ember.get, set = Ember.set, fmt = Ember.String.fmt;

/**
  @ignore

  Ember.EventDispatcher handles delegating browser events to their corresponding
  Ember.Views. For example, when you click on a view, Ember.EventDispatcher ensures
  that that view's `mouseDown` method gets called.
*/
Ember.EventDispatcher = Ember.Object.extend(
/** @scope Ember.EventDispatcher.prototype */{

  /**
    @private

    The root DOM element to which event listeners should be attached. Event
    listeners will be attached to the document unless this is overridden.

    Can be specified as a DOMElement or a selector string.

    The default body is a string since this may be evaluated before document.body
    exists in the DOM.

    @type DOMElement
    @default 'body'
  */
  rootElement: 'body',

  /**
    @private

    Sets up event listeners for standard browser events.

    This will be called after the browser sends a DOMContentReady event. By
    default, it will set up all of the listeners on the document body. If you
    would like to register the listeners on a different element, set the event
    dispatcher's `root` property.
  */
  setup: function(addedEvents) {
    var event, events = {
      touchstart  : 'touchStart',
      touchmove   : 'touchMove',
      touchend    : 'touchEnd',
      touchcancel : 'touchCancel',
      keydown     : 'keyDown',
      keyup       : 'keyUp',
      keypress    : 'keyPress',
      mousedown   : 'mouseDown',
      mouseup     : 'mouseUp',
      contextmenu : 'contextMenu',
      click       : 'click',
      dblclick    : 'doubleClick',
      mousemove   : 'mouseMove',
      focusin     : 'focusIn',
      focusout    : 'focusOut',
      mouseenter  : 'mouseEnter',
      mouseleave  : 'mouseLeave',
      submit      : 'submit',
      input       : 'input',
      change      : 'change',
      dragstart   : 'dragStart',
      drag        : 'drag',
      dragenter   : 'dragEnter',
      dragleave   : 'dragLeave',
      dragover    : 'dragOver',
      drop        : 'drop',
      dragend     : 'dragEnd'
    };

    Ember.$.extend(events, addedEvents || {});

    var rootElement = Ember.$(get(this, 'rootElement'));

    Ember.assert(fmt('You cannot use the same root element (%@) multiple times in an Ember.Application', [rootElement.selector || rootElement[0].tagName]), !rootElement.is('.ember-application'));
    Ember.assert('You cannot make a new Ember.Application using a root element that is a descendent of an existing Ember.Application', !rootElement.closest('.ember-application').length);
    Ember.assert('You cannot make a new Ember.Application using a root element that is an ancestor of an existing Ember.Application', !rootElement.find('.ember-application').length);

    rootElement.addClass('ember-application');

    Ember.assert('Unable to add "ember-application" class to rootElement. Make sure you set rootElement to the body or an element in the body.', rootElement.is('.ember-application'));

    for (event in events) {
      if (events.hasOwnProperty(event)) {
        this.setupHandler(rootElement, event, events[event]);
      }
    }
  },

  /**
    @private

    Registers an event listener on the document. If the given event is
    triggered, the provided event handler will be triggered on the target
    view.

    If the target view does not implement the event handler, or if the handler
    returns false, the parent view will be called. The event will continue to
    bubble to each successive parent view until it reaches the top.

    For example, to have the `mouseDown` method called on the target view when
    a `mousedown` event is received from the browser, do the following:

        setupHandler('mousedown', 'mouseDown');

    @param {String} event the browser-originated event to listen to
    @param {String} eventName the name of the method to call on the view
  */
  setupHandler: function(rootElement, event, eventName) {
    var self = this;

    rootElement.delegate('.ember-view', event + '.ember', function(evt, triggeringManager) {

      var view = Ember.View.views[this.id],
          result = true, manager = null;

      manager = self._findNearestEventManager(view,eventName);

      if (manager && manager !== triggeringManager) {
        result = self._dispatchEvent(manager, evt, eventName, view);
      } else if (view) {
        result = self._bubbleEvent(view,evt,eventName);
      } else {
        evt.stopPropagation();
      }

      return result;
    });

    rootElement.delegate('[data-ember-action]', event + '.ember', function(evt) {
      var actionId = Ember.$(evt.currentTarget).attr('data-ember-action'),
          action   = Ember.Handlebars.ActionHelper.registeredActions[actionId],
          handler  = action.handler;

      if (action.eventName === eventName) {
        evt.preventDefault();
        return handler(evt);
      }
    });
  },

  /** @private */
  _findNearestEventManager: function(view, eventName) {
    var manager = null;

    while (view) {
      manager = get(view, 'eventManager');
      if (manager && manager[eventName]) { break; }

      view = get(view, 'parentView');
    }

    return manager;
  },

  /** @private */
  _dispatchEvent: function(object, evt, eventName, view) {
    var result = true;

    var handler = object[eventName];
    if (Ember.typeOf(handler) === 'function') {
      result = handler.call(object, evt, view);
      // Do not preventDefault in eventManagers.
      evt.stopPropagation();
    }
    else {
      result = this._bubbleEvent(view, evt, eventName);
    }

    return result;
  },

  /** @private */
  _bubbleEvent: function(view, evt, eventName) {
    return Ember.run(function() {
      return view.handleEvent(eventName, evt);
    });
  },

  /** @private */
  destroy: function() {
    var rootElement = get(this, 'rootElement');
    Ember.$(rootElement).undelegate('.ember').removeClass('ember-application');
    return this._super();
  }
});

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

// Add a new named queue for rendering views that happens
// after bindings have synced.
var queues = Ember.run.queues;
queues.splice(Ember.$.inArray('actions', queues)+1, 0, 'render');

})();



(function() {
var get = Ember.get, set = Ember.set;

Ember.ControllerMixin.reopen({

  target: null,
  controllers: null,
  namespace: null,
  view: null,

  /**
    `connectOutlet` creates a new instance of a provided view
    class, wires it up to its associated controller, and
    assigns the new view to a property on the current controller.

    The purpose of this method is to enable views that use
    outlets to quickly assign new views for a given outlet.

    For example, an application view's template may look like
    this:

        <h1>My Blog</h1>
        {{outlet}}

    The view for this outlet is specified by assigning a
    `view` property to the application's controller. The
    following code will assign a new `App.PostsView` to
    that outlet:

        applicationController.connectOutlet('posts');

    In general, you will also want to assign a controller
    to the newly created view. By convention, a controller
    named `postsController` will be assigned as the view's
    controller.

    In an application initialized using `app.initialize(router)`,
    `connectOutlet` will look for `postsController` on the
    router. The initialization process will automatically
    create an instance of `App.PostsController` called
    `postsController`, so you don't need to do anything
    beyond `connectOutlet` to assign your view and wire it
    up to its associated controller.

    You can supply a `content` for the controller by supplying
    a final argument after the view class:

        applicationController.connectOutlet('posts', App.Post.find());

    You can specify a particular outlet to use. For example, if your main
    template looks like:

        <h1>My Blog</h1>
        {{outlet master}}
        {{outlet detail}}

    You can assign an `App.PostsView` to the master outlet:

        applicationController.connectOutlet({
          name: 'posts',
          outletName: 'master',
          context: App.Post.find()
        });

    @param {Class} name a view class to instantiate
    @param {Object} context a context object to assign to the
      controller's `content` property, if a controller can be
      found (optional)
  */
  connectOutlet: function(name, context) {
    // Normalize arguments. Supported arguments:
    //
    // name
    // name, context
    // options
    //
    // The options hash has the following keys:
    //
    //   name: the name of the controller and view
    //     to use. If this is passed, the name
    //     determines the view and controller.
    //   outletName: the name of the outlet to
    //     fill in. default: 'view'
    //   viewClass: the class of the view to instantiate
    //   controller: the controller instance to pass
    //     to the view
    //   context: an object that should become the
    //     controller's `content` and thus the
    //     template's context.

    var outletName, viewClass, view, controller, options;

    if (arguments.length === 1) {
      if (Ember.typeOf(name) === 'object') {
        options = name;
        outletName = options.outletName;
        name = options.name;
        viewClass = options.viewClass;
        controller = options.controller;
        context = options.context;
      }
    } else {
      options = {};
    }

    outletName = outletName || 'view';

    Ember.assert("You must supply a name or a view class to connectOutlets, but not both", (!!name && !viewClass && !controller) || (!name && !!viewClass));

    if (name) {
      var namespace = get(this, 'namespace'),
          controllers = get(this, 'controllers');

      var viewClassName = name.charAt(0).toUpperCase() + name.substr(1) + "View";
      viewClass = get(namespace, viewClassName);
      controller = get(controllers, name + 'Controller');

      Ember.assert("The name you supplied " + name + " did not resolve to a view " + viewClassName, !!viewClass);
      Ember.assert("The name you supplied " + name + " did not resolve to a controller " + name + 'Controller', (!!controller && !!context) || !context);
    }

    if (controller && context) { controller.set('content', context); }
    view = viewClass.create();
    if (controller) { set(view, 'controller', controller); }
    set(this, outletName, view);

    return view;
  }
});


})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set, addObserver = Ember.addObserver;
var getPath = Ember.getPath, meta = Ember.meta, fmt = Ember.String.fmt;
var a_slice = [].slice;
var a_forEach = Ember.EnumerableUtils.forEach;

var childViewsProperty = Ember.computed(function() {
  var childViews = this._childViews;

  var ret = Ember.A();

  a_forEach(childViews, function(view) {
    if (view.isVirtual) {
      ret.pushObjects(get(view, 'childViews'));
    } else {
      ret.push(view);
    }
  });

  return ret;
}).property().cacheable();

var VIEW_PRESERVES_CONTEXT = Ember.VIEW_PRESERVES_CONTEXT;
Ember.warn("The way that the {{view}} helper affects templates is about to change. Previously, templates inside child views would use the new view as the context. Soon, views will preserve their parent context when rendering their template. You can opt-in early to the new behavior by setting `ENV.VIEW_PRESERVES_CONTEXT = true`. For more information, see https://gist.github.com/2494968. You should update your templates as soon as possible; this default will change soon, and the option will be eliminated entirely before the 1.0 release.", VIEW_PRESERVES_CONTEXT);

/**
  @static

  Global hash of shared templates. This will automatically be populated
  by the build tools so that you can store your Handlebars templates in
  separate files that get loaded into JavaScript at buildtime.

  @type Hash
*/
Ember.TEMPLATES = {};

var invokeForState = {
  preRender: {},
  inBuffer: {},
  hasElement: {},
  inDOM: {},
  destroyed: {}
};

/**
  @class

  `Ember.View` is the class in Ember responsible for encapsulating templates of HTML
  content, combining templates with data to render as sections of a page's DOM, and
  registering and responding to user-initiated events.
  
  ## HTML Tag
  The default HTML tag name used for a view's DOM representation is `div`. This can be
  customized by setting the `tagName` property. The following view class:

      ParagraphView = Ember.View.extend({
        tagName: 'em'
      })

  Would result in instances with the following HTML:

      <em id="ember1" class="ember-view"></em>

  ## HTML `class` Attribute
  The HTML `class` attribute of a view's tag can be set by providing a `classNames` property
  that is set to an array of strings:

      MyView = Ember.View.extend({
        classNames: ['my-class', 'my-other-class']
      })

  Will result in view instances with an HTML representation of:

      <div id="ember1" class="ember-view my-class my-other-class"></div>

  `class` attribute values can also be set by providing a `classNameBindings` property
  set to an array of properties names for the view. The return value of these properties 
  will be added as part of the value for the view's `class` attribute. These properties
  can be computed properties:

      MyView = Ember.View.extend({
        classNameBindings: ['propertyA', 'propertyB'],
        propertyA: 'from-a',
        propertyB: function(){
          if(someLogic){ return 'from-b'; }
        }.property()
      })

  Will result in view instances with an HTML representation of:

      <div id="ember1" class="ember-view from-a from-b"></div>

  If the value of a class name binding returns a boolean the property name itself
  will be used as the class name if the property is true. The class name will
  not be added if the value is `false` or `undefined`.

      MyView = Ember.View.extend({
        classNameBindings: ['hovered'],
        hovered: true
      })

  Will result in view instances with an HTML representation of:

      <div id="ember1" class="ember-view hovered"></div>

  When using boolean class name bindings you can supply a string value other than the 
  property name for use as the `class` HTML attribute by appending the preferred value after
  a ":" character when defining the binding:

      MyView = Ember.View.extend({
        classNameBindings: ['awesome:so-very-cool'],
        awesome: true
      })

  Will result in view instances with an HTML representation of:

      <div id="ember1" class="ember-view so-very-cool"></div>


  Boolean value class name bindings whose property names are in a camelCase-style
  format will be converted to a dasherized format:

      MyView = Ember.View.extend({
        classNameBindings: ['isUrgent'],
        isUrgent: true
      })

  Will result in view instances with an HTML representation of:

      <div id="ember1" class="ember-view is-urgent"></div>


  Class name bindings can also refer to object values that are found by
  traversing a path relative to the view itself:

      MyView = Ember.View.extend({
        classNameBindings: ['messages.empty']
        messages: Ember.Object.create({
          empty: true
        })
      })

  Will result in view instances with an HTML representation of:

      <div id="ember1" class="ember-view empty"></div>

  Updates to the the value of a class name binding will result in automatic update 
  of the  HTML `class` attribute in the view's rendered HTML representation.
  If the value becomes  `false` or `undefined` the class name will be removed.

  Both `classNames` and `classNameBindings` are concatenated properties. 
  See `Ember.Object` documentation for more information about concatenated properties.

  ## HTML Attributes
  The HTML attribute section of a view's tag can be set by providing an `attributeBindings`
  property set to an array of property names on the view. The return value of these properties
  will be used as the value of the view's HTML associated attribute:

      AnchorView = Ember.View.extend({
        tagName: 'a',
        attributeBindings: ['href'],
        href: 'http://google.com'
      })

  Will result in view instances with an HTML representation of:

      <a id="ember1" class="ember-view" href="http://google.com"></a>

  If the return value of an `attributeBindings` monitored property is a boolean
  the property will follow HTML's pattern of repeating the attribute's name as
  its value:

      MyTextInput = Ember.View.extend({
        tagName: 'input',
        attributeBindings: ['disabled'],
        disabled: true
      })

  Will result in view instances with an HTML representation of:

      <input id="ember1" class="ember-view" disabled="disabled" />

  `attributeBindings` can refer to computed properties:

      MyTextInput = Ember.View.extend({
        tagName: 'input',
        attributeBindings: ['disabled'],
        disabled: function(){
          if (someLogic) {
            return true;
          } else {
            return false;
          }
        }.property()
      })

  Updates to the the property of an attribute binding will result in automatic update 
  of the  HTML attribute in the view's rendered HTML representation.

  `attributeBindings` is a concatenated property. See `Ember.Object` documentation
  for more information about concatenated properties.

  ## Templates
  The HTML contents of a view's rendered representation are determined by its template.
  Templates can be any function that accepts an optional context parameter and returns
  a string of HTML that will be inserted within the view's tag. Most
  typically in Ember this function will be a compiled Ember.Handlebars template.

      AView = Ember.View.extend({
        template: Ember.Handlebars.compile('I am the template')
      })

  Will result in view instances with an HTML representation of:

      <div id="ember1" class="ember-view">I am the template</div>

  The default context of the compiled template will be the view instance itself:

      AView = Ember.View.extend({
        template: Ember.Handlebars.compile('Hello {{excitedGreeting}}')
      })

      aView = AView.create({
        content: Ember.Object.create({
          firstName: 'Barry'
        })
        excitedGreeting: function(){
          return this.getPath("content.firstName") + "!!!"
        }
      })

  Will result in an HTML representation of:

      <div id="ember1" class="ember-view">Hello Barry!!!</div>

  Within an Ember application is more common to define a Handlebars templates as
  part of a page:

      <script type='text/x-handlebars' data-template-name='some-template'>
        Hello
      </script>

  And associate it by name using a view's `templateName` property:

      AView = Ember.View.extend({
        templateName: 'some-template'
      })

  Using a value for `templateName` that does not have a Handlebars template with a
  matching `data-template-name` attribute will throw an error.

  Assigning a value to both `template` and `templateName` properties will throw an error.

  For views classes that may have a template later defined (e.g. as the block portion of a `{{view}}`
  Handlebars helper call in another template or in a subclass), you can provide a `defaultTemplate`
  property set to compiled template function. If a template is not later provided for the view
  instance the `defaultTemplate` value will be used:

      AView = Ember.View.extend({
        defaultTemplate: Ember.Handlebars.compile('I was the default'),
        template: null,
        templateName: null
      })

  Will result in instances with an HTML representation of:

      <div id="ember1" class="ember-view">I was the default</div>

  If a `template` or `templateName` is provided it will take precedence over `defaultTemplate`:

      AView = Ember.View.extend({
        defaultTemplate: Ember.Handlebars.compile('I was the default')
      })

      aView = AView.create({
        template: Ember.Handlebars.compile('I was the template, not default')
      })

  Will result in the following HTML representation when rendered:

      <div id="ember1" class="ember-view">I was the template, not default</div>

  ## Layouts
  Views can have a secondary template that wraps their main template. Like
  primary templates, layouts can be any function that  accepts an optional context
  parameter and returns a string of HTML that will be inserted inside view's tag. Views whose HTML
  element is self closing (e.g. `<input />`) cannot have a layout and this property will be ignored.
  
  Most typically in Ember a layout will be a compiled Ember.Handlebars template.

  A view's layout can be set directly with the `layout` property or reference an
  existing Handlebars template by name with the `layoutName` property.

  A template used as a layout must contain a single use of the Handlebars `{{yield}}`
  helper. The HTML contents of a view's rendered `template` will be inserted at this location:

      AViewWithLayout = Ember.View.extend({
        layout: Ember.Handlebars.compile("<div class='my-decorative-class'>{{yield}}</div>")
        template: Ember.Handlebars.compile("I got wrapped"),
      })

  Will result in view instances with an HTML representation of:

      <div id="ember1" class="ember-view">
        <div class="my-decorative-class">
          I got wrapped
        </div>
      </div>

  See `Handlebars.helpers.yield` for more information.

  ## Responding to Browser Events
  Views can respond to user-initiated events in one of three ways: method implementation, 
  through an event manager, and through `{{action}}` helper use in their template or layout.

  ### Method Implementation
  Views can respond to user-initiated events by implementing a method that matches the
  event name. A `jQuery.Event` object will be passed as the argument to this method.

      AView = Ember.View.extend({
        click: function(event){
          // will be called when when an instance's
          // rendered element is clicked
        }
      })

  ### Event Managers
  Views can define an object as their `eventManager` property. This object can then
  implement methods that match the desired event names. Matching events that occur
  on the view's rendered HTML or the rendered HTML of any of its DOM descendants 
  will trigger this method.  A `jQuery.Event` object will be passed as the first 
  argument to the method and an  `Ember.View` object as the second. The `Ember.View`
  will be the view whose rendered HTML was interacted with. This may be the view with
  the `eventManager` property or one of its descendent views.

      AView = Ember.View.extend({
        eventManager: Ember.Object.create({
          doubleClick: function(event, view){
            // will be called when when an instance's
            // rendered element or any rendering
            // of this views's descendent
            // elements is clicked
          }
        })
      })


  An event defined for an event manager takes precedence over events of the same
  name handled through methods on the view.


      AView = Ember.View.extend({
        mouseEnter: function(event){
          // will never trigger.
        },
        eventManager: Ember.Object.create({
          mouseEnter: function(event, view){
            // takes presedence over AView#mouseEnter
          }
        })
      })

  Similarly a view's event manager will take precedence for events of any views
  rendered as a descendent. A method name that matches an event name will not be called
  if the view instance was rendered inside the HTML representation of a view that has 
  an `eventManager` property defined that handles events of the name.  Events not handled
  by the event manager will still trigger method calls on the descendent.

      OuterView = Ember.View.extend({
        template: Ember.Handlebars.compile("outer {{#view InnerView}}inner{{/view}} outer"),
        eventManager: Ember.Object.create({
          mouseEnter: function(event, view){
            // view might be instance of either
            // OutsideView or InnerView depending on
            // where on the page the user interaction occured
          }
        })
      })

      InnerView = Ember.View.extend({
        click: function(event){
          // will be called if rendered inside
          // an OuterView because OuterView's
          // eventManager doesn't handle click events
        },
        mouseEnter: function(event){
          // will never be called if rendered inside 
          // an OuterView.
        }
      })

  ### Handlebars `{{action}}` Helper
  See `Handlebars.helpers.action`.

  ### Event Names
  Possible events names for any of the responding approaches described above are:

  Touch events: 'touchStart', 'touchMove', 'touchEnd', 'touchCancel'

  Keyboard events: 'keyDown', 'keyUp', 'keyPress'

  Mouse events: 'mouseDown', 'mouseUp', 'contextMenu', 'click', 'doubleClick', 'mouseMove',
  'focusIn', 'focusOut', 'mouseEnter', 'mouseLeave'

  Form events: 'submit', 'change', 'focusIn', 'focusOut', 'input'

  HTML5 drag and drop events: 'dragStart', 'drag', 'dragEnter', 'dragLeave', 'drop', 'dragEnd'
  
  ## Handlebars `{{view}}` Helper
  Other `Ember.View` instances can be included as part of a view's template by using the `{{view}}`
  Handlebars helper. See `Handlebars.helpers.view` for additional information.

  @extends Ember.Object
  @extends Ember.Evented
*/
Ember.View = Ember.Object.extend(Ember.Evented,
/** @scope Ember.View.prototype */ {

  /** @private */
  concatenatedProperties: ['classNames', 'classNameBindings', 'attributeBindings'],

  /**
    @type Boolean
    @default true
    @constant
  */
  isView: true,

  // ..........................................................
  // TEMPLATE SUPPORT
  //

  /**
    The name of the template to lookup if no template is provided.

    Ember.View will look for a template with this name in this view's
    `templates` object. By default, this will be a global object
    shared in `Ember.TEMPLATES`.

    @type String
    @default null
  */
  templateName: null,

  /**
    The name of the layout to lookup if no layout is provided.

    Ember.View will look for a template with this name in this view's
    `templates` object. By default, this will be a global object
    shared in `Ember.TEMPLATES`.

    @type String
    @default null
  */
  layoutName: null,

  /**
    The hash in which to look for `templateName`.

    @type Ember.Object
    @default Ember.TEMPLATES
  */
  templates: Ember.TEMPLATES,

  /**
    The template used to render the view. This should be a function that
    accepts an optional context parameter and returns a string of HTML that
    will be inserted into the DOM relative to its parent view.

    In general, you should set the `templateName` property instead of setting
    the template yourself.

    @field
    @type Function
  */
  template: Ember.computed(function(key, value) {
    if (value !== undefined) { return value; }

    var templateName = get(this, 'templateName'),
        template = this.templateForName(templateName, 'template');

    return template || get(this, 'defaultTemplate');
  }).property('templateName').cacheable(),

  /**
    The controller managing this view. If this property is set, it will be
    made available for use by the template.

    @type Object
  */
  controller: Ember.computed(function(key, value) {
    var parentView;

    if (arguments.length === 2) {
      return value;
    } else {
      parentView = get(this, 'parentView');
      return parentView ? get(parentView, 'controller') : null;
    }
  }).property().cacheable(),

  /**
    A view may contain a layout. A layout is a regular template but
    supersedes the `template` property during rendering. It is the
    responsibility of the layout template to retrieve the `template`
    property from the view (or alternatively, call `Handlebars.helpers.yield`,
    `{{yield}}`) to render it in the correct location.

    This is useful for a view that has a shared wrapper, but which delegates
    the rendering of the contents of the wrapper to the `template` property
    on a subclass.

    @field
    @type Function
  */
  layout: Ember.computed(function(key, value) {
    if (arguments.length === 2) { return value; }

    var layoutName = get(this, 'layoutName'),
        layout = this.templateForName(layoutName, 'layout');

    return layout || get(this, 'defaultLayout');
  }).property('layoutName').cacheable(),

  templateForName: function(name, type) {
    if (!name) { return; }

    var templates = get(this, 'templates'),
        template = get(templates, name);

    if (!template) {
     throw new Ember.Error(fmt('%@ - Unable to find %@ "%@".', [this, type, name]));
    }

    return template;
  },

  /**
    The object from which templates should access properties.

    This object will be passed to the template function each time the render
    method is called, but it is up to the individual function to decide what
    to do with it.

    By default, this will be the view itself.

    @type Object
  */
  context: Ember.computed(function(key, value) {
    if (arguments.length === 2) {
      set(this, '_context', value);
      return value;
    } else {
      return get(this, '_context');
    }
  }).cacheable(),

  /**
    @private

    Private copy of the view's template context. This can be set directly
    by Handlebars without triggering the observer that causes the view
    to be re-rendered.
  */
  _context: Ember.computed(function(key, value) {
    var parentView, controller;

    if (arguments.length === 2) {
      return value;
    }

    if (VIEW_PRESERVES_CONTEXT) {
      if (controller = get(this, 'controller')) {
        return controller;
      }

      parentView = get(this, '_parentView');
      if (parentView) {
        return get(parentView, '_context');
      }
    }

    return this;
  }).cacheable(),

  /**
    If a value that affects template rendering changes, the view should be
    re-rendered to reflect the new value.

    @private
  */
  _displayPropertyDidChange: Ember.observer(function() {
    this.rerender();
  }, 'context', 'controller'),

  /**
    If the view is currently inserted into the DOM of a parent view, this
    property will point to the parent of the view.

    @type Ember.View
    @default null
  */
  parentView: Ember.computed(function() {
    var parent = get(this, '_parentView');

    if (parent && parent.isVirtual) {
      return get(parent, 'parentView');
    } else {
      return parent;
    }
  }).property('_parentView').volatile(),

  _parentView: null,

  // return the current view, not including virtual views
  concreteView: Ember.computed(function() {
    if (!this.isVirtual) { return this; }
    else { return get(this, 'parentView'); }
  }).property('_parentView').volatile(),

  /**
    If false, the view will appear hidden in DOM.

    @type Boolean
    @default null
  */
  isVisible: true,

  /**
    Array of child views. You should never edit this array directly.
    Instead, use appendChild and removeFromParent.

    @private
    @type Array
    @default []
  */
  childViews: childViewsProperty,

  _childViews: [],

  /**
    When it's a virtual view, we need to notify the parent that their
    childViews will change.
  */
  _childViewsWillChange: Ember.beforeObserver(function() {
    if (this.isVirtual) {
      var parentView = get(this, 'parentView');
      if (parentView) { Ember.propertyWillChange(parentView, 'childViews'); }
    }
  }, 'childViews'),

  /**
    When it's a virtual view, we need to notify the parent that their
    childViews did change.
  */
  _childViewsDidChange: Ember.observer(function() {
    if (this.isVirtual) {
      var parentView = get(this, 'parentView');
      if (parentView) { Ember.propertyDidChange(parentView, 'childViews'); }
    }
  }, 'childViews'),

  /**
    Return the nearest ancestor that is an instance of the provided
    class.

    @param {Class} klass Subclass of Ember.View (or Ember.View itself)
    @returns Ember.View
  */
  nearestInstanceOf: function(klass) {
    var view = get(this, 'parentView');

    while (view) {
      if(view instanceof klass) { return view; }
      view = get(view, 'parentView');
    }
  },

  /**
    Return the nearest ancestor that has a given property.

    @param {String} property A property name
    @returns Ember.View
  */
  nearestWithProperty: function(property) {
    var view = get(this, 'parentView');

    while (view) {
      if (property in view) { return view; }
      view = get(view, 'parentView');
    }
  },

  /**
    Return the nearest ancestor whose parent is an instance of
    `klass`.

    @param {Class} klass Subclass of Ember.View (or Ember.View itself)
    @returns Ember.View
  */
  nearestChildOf: function(klass) {
    var view = get(this, 'parentView');

    while (view) {
      if(get(view, 'parentView') instanceof klass) { return view; }
      view = get(view, 'parentView');
    }
  },

  /**
    Return the nearest ancestor that is an Ember.CollectionView

    @returns Ember.CollectionView
  */
  collectionView: Ember.computed(function() {
    return this.nearestInstanceOf(Ember.CollectionView);
  }).cacheable(),

  /**
    Return the nearest ancestor that is a direct child of
    an Ember.CollectionView

    @returns Ember.View
  */
  itemView: Ember.computed(function() {
    return this.nearestChildOf(Ember.CollectionView);
  }).cacheable(),

  /**
    Return the nearest ancestor that has the property
    `content`.

    @returns Ember.View
  */
  contentView: Ember.computed(function() {
    return this.nearestWithProperty('content');
  }).cacheable(),

  /**
    @private

    When the parent view changes, recursively invalidate
    collectionView, itemView, and contentView
  */
  _parentViewDidChange: Ember.observer(function() {
    if (this.isDestroying) { return; }

    this.invokeRecursively(function(view) {
      view.propertyDidChange('collectionView');
      view.propertyDidChange('itemView');
      view.propertyDidChange('contentView');
    });

    if (getPath(this, 'parentView.controller') && !get(this, 'controller')) {
      this.notifyPropertyChange('controller');
    }
  }, '_parentView'),

  _controllerDidChange: Ember.observer(function() {
    if (this.isDestroying) { return; }

    this.forEachChildView(function(view) {
      view.propertyDidChange('controller');
    });
  }, 'controller'),

  cloneKeywords: function() {
    var templateData = get(this, 'templateData');

    var keywords = templateData ? Ember.copy(templateData.keywords) : {};
    set(keywords, 'view', get(this, 'concreteView'));
    set(keywords, 'controller', get(this, 'controller'));

    return keywords;
  },

  /**
    Called on your view when it should push strings of HTML into a
    Ember.RenderBuffer. Most users will want to override the `template`
    or `templateName` properties instead of this method.

    By default, Ember.View will look for a function in the `template`
    property and invoke it with the value of `context`. The value of
    `context` will be the view's controller unless you override it.

    @param {Ember.RenderBuffer} buffer The render buffer
  */
  render: function(buffer) {
    // If this view has a layout, it is the responsibility of the
    // the layout to render the view's template. Otherwise, render the template
    // directly.
    var template = get(this, 'layout') || get(this, 'template');

    if (template) {
      var context = get(this, '_context');
      var keywords = this.cloneKeywords();

      var data = {
        view: this,
        buffer: buffer,
        isRenderData: true,
        keywords: keywords
      };

      // Invoke the template with the provided template context, which
      // is the view by default. A hash of data is also passed that provides
      // the template with access to the view and render buffer.

      Ember.assert('template must be a function. Did you mean to call Ember.Handlebars.compile("...") or specify templateName instead?', typeof template === 'function');
      // The template should write directly to the render buffer instead
      // of returning a string.
      var output = template(context, { data: data });

      // If the template returned a string instead of writing to the buffer,
      // push the string onto the buffer.
      if (output !== undefined) { buffer.push(output); }
    }
  },

  invokeForState: function(name) {
    var stateName = this.state, args, fn;

    // try to find the function for the state in the cache
    if (fn = invokeForState[stateName][name]) {
      args = a_slice.call(arguments);
      args[0] = this;

      return fn.apply(this, args);
    }

    // otherwise, find and cache the function for this state
    var parent = this, states = parent.states, state;

    while (states) {
      state = states[stateName];

      while (state) {
        fn = state[name];

        if (fn) {
          invokeForState[stateName][name] = fn;

          args = a_slice.call(arguments, 1);
          args.unshift(this);

          return fn.apply(this, args);
        }

        state = state.parentState;
      }

      states = states.parent;
    }
  },

  /**
    Renders the view again. This will work regardless of whether the
    view is already in the DOM or not. If the view is in the DOM, the
    rendering process will be deferred to give bindings a chance
    to synchronize.

    If children were added during the rendering process using `appendChild`,
    `rerender` will remove them, because they will be added again
    if needed by the next `render`.

    In general, if the display of your view changes, you should modify
    the DOM element directly instead of manually calling `rerender`, which can
    be slow.
  */
  rerender: function() {
    return this.invokeForState('rerender');
  },

  clearRenderedChildren: function() {
    var lengthBefore = this.lengthBeforeRender,
        lengthAfter  = this.lengthAfterRender;

    // If there were child views created during the last call to render(),
    // remove them under the assumption that they will be re-created when
    // we re-render.

    // VIEW-TODO: Unit test this path.
    var childViews = this._childViews;
    for (var i=lengthAfter-1; i>=lengthBefore; i--) {
      if (childViews[i]) { childViews[i].destroy(); }
    }
  },

  /**
    @private

    Iterates over the view's `classNameBindings` array, inserts the value
    of the specified property into the `classNames` array, then creates an
    observer to update the view's element if the bound property ever changes
    in the future.
  */
  _applyClassNameBindings: function() {
    var classBindings = get(this, 'classNameBindings'),
        classNames = get(this, 'classNames'),
        elem, newClass, dasherizedClass;

    if (!classBindings) { return; }

    // Loop through all of the configured bindings. These will be either
    // property names ('isUrgent') or property paths relative to the view
    // ('content.isUrgent')
    a_forEach(classBindings, function(binding) {

      // Variable in which the old class value is saved. The observer function
      // closes over this variable, so it knows which string to remove when
      // the property changes.
      var oldClass, property;

      // Set up an observer on the context. If the property changes, toggle the
      // class name.
      var observer = function() {
        // Get the current value of the property
        newClass = this._classStringForProperty(binding);
        elem = this.$();

        // If we had previously added a class to the element, remove it.
        if (oldClass) {
          elem.removeClass(oldClass);
          // Also remove from classNames so that if the view gets rerendered,
          // the class doesn't get added back to the DOM.
          classNames.removeObject(oldClass);
        }

        // If necessary, add a new class. Make sure we keep track of it so
        // it can be removed in the future.
        if (newClass) {
          elem.addClass(newClass);
          oldClass = newClass;
        } else {
          oldClass = null;
        }
      };

      // Get the class name for the property at its current value
      dasherizedClass = this._classStringForProperty(binding);

      if (dasherizedClass) {
        // Ensure that it gets into the classNames array
        // so it is displayed when we render.
        classNames.push(dasherizedClass);

        // Save a reference to the class name so we can remove it
        // if the observer fires. Remember that this variable has
        // been closed over by the observer.
        oldClass = dasherizedClass;
      }

      // Extract just the property name from bindings like 'foo:bar'
      property = binding.split(':')[0];
      addObserver(this, property, observer);
    }, this);
  },

  /**
    Iterates through the view's attribute bindings, sets up observers for each,
    then applies the current value of the attributes to the passed render buffer.

    @param {Ember.RenderBuffer} buffer
  */
  _applyAttributeBindings: function(buffer) {
    var attributeBindings = get(this, 'attributeBindings'),
        attributeValue, elem, type;

    if (!attributeBindings) { return; }

    a_forEach(attributeBindings, function(binding) {
      var split = binding.split(':'),
          property = split[0],
          attributeName = split[1] || property;

      // Create an observer to add/remove/change the attribute if the
      // JavaScript property changes.
      var observer = function() {
        elem = this.$();
        attributeValue = get(this, property);

        Ember.View.applyAttributeBindings(elem, attributeName, attributeValue);
      };

      addObserver(this, property, observer);

      // Determine the current value and add it to the render buffer
      // if necessary.
      attributeValue = get(this, property);
      Ember.View.applyAttributeBindings(buffer, attributeName, attributeValue);
    }, this);
  },

  /**
    @private

    Given a property name, returns a dasherized version of that
    property name if the property evaluates to a non-falsy value.

    For example, if the view has property `isUrgent` that evaluates to true,
    passing `isUrgent` to this method will return `"is-urgent"`.
  */
  _classStringForProperty: function(property) {
    var split = property.split(':'),
        className = split[1];

    property = split[0];

    // TODO: Remove this `false` when the `getPath` globals support is removed
    var val = Ember.getPath(this, property, false);
    if (val === undefined && Ember.isGlobalPath(property)) {
      val = Ember.getPath(window, property);
    }

    // If the value is truthy and we're using the colon syntax,
    // we should return the className directly
    if (!!val && className) {
      return className;

    // If value is a Boolean and true, return the dasherized property
    // name.
    } else if (val === true) {
      // Normalize property path to be suitable for use
      // as a class name. For exaple, content.foo.barBaz
      // becomes bar-baz.
      var parts = property.split('.');
      return Ember.String.dasherize(parts[parts.length-1]);

    // If the value is not false, undefined, or null, return the current
    // value of the property.
    } else if (val !== false && val !== undefined && val !== null) {
      return val;

    // Nothing to display. Return null so that the old class is removed
    // but no new class is added.
    } else {
      return null;
    }
  },

  // ..........................................................
  // ELEMENT SUPPORT
  //

  /**
    Returns the current DOM element for the view.

    @field
    @type DOMElement
  */
  element: Ember.computed(function(key, value) {
    if (value !== undefined) {
      return this.invokeForState('setElement', value);
    } else {
      return this.invokeForState('getElement');
    }
  }).property('_parentView').cacheable(),

  /**
    Returns a jQuery object for this view's element. If you pass in a selector
    string, this method will return a jQuery object, using the current element
    as its buffer.

    For example, calling `view.$('li')` will return a jQuery object containing
    all of the `li` elements inside the DOM element of this view.

    @param {String} [selector] a jQuery-compatible selector string
    @returns {Ember.CoreQuery} the CoreQuery object for the DOM node
  */
  $: function(sel) {
    return this.invokeForState('$', sel);
  },

  /** @private */
  mutateChildViews: function(callback) {
    var childViews = this._childViews,
        idx = childViews.length,
        view;

    while(--idx >= 0) {
      view = childViews[idx];
      callback.call(this, view, idx);
    }

    return this;
  },

  /** @private */
  forEachChildView: function(callback) {
    var childViews = this._childViews;

    if (!childViews) { return this; }

    var len = childViews.length,
        view, idx;

    for(idx = 0; idx < len; idx++) {
      view = childViews[idx];
      callback.call(this, view);
    }

    return this;
  },

  /**
    Appends the view's element to the specified parent element.

    If the view does not have an HTML representation yet, `createElement()`
    will be called automatically.

    Note that this method just schedules the view to be appended; the DOM
    element will not be appended to the given element until all bindings have
    finished synchronizing.

    This is not typically a function that you will need to call directly
    when building your application. You might consider using Ember.ContainerView
    instead. If you do need to use appendTo, be sure that the target element you
    are providing is associated with an Ember.Application and does not have an
    ancestor element that is associated with an Ember view.

    @param {String|DOMElement|jQuery} A selector, element, HTML string, or jQuery object
    @returns {Ember.View} receiver
  */
  appendTo: function(target) {
    Ember.assert("You cannot append to an existing Ember.View. Consider using Ember.ContainerView instead.", !Ember.$(target).is('.ember-view') && !Ember.$(target).parents().is('.ember-view'));

    // Schedule the DOM element to be created and appended to the given
    // element after bindings have synchronized.
    this._insertElementLater(function() {
      this.$().appendTo(target);
    });

    return this;
  },

  /**
    Replaces the content of the specified parent element with this view's element.
    If the view does not have an HTML representation yet, `createElement()`
    will be called automatically.

    Note that this method just schedules the view to be appended; the DOM
    element will not be appended to the given element until all bindings have
    finished synchronizing

    @param {String|DOMElement|jQuery} A selector, element, HTML string, or jQuery object
    @returns {Ember.View} received
  */
  replaceIn: function(target) {
    Ember.assert("You cannot replace an existing Ember.View. Consider using Ember.ContainerView instead.", !Ember.$(target).is('.ember-view') && !Ember.$(target).parents().is('.ember-view'));

    this._insertElementLater(function() {
      Ember.$(target).empty();
      this.$().appendTo(target);
    });

    return this;
  },

  /**
    @private

    Schedules a DOM operation to occur during the next render phase. This
    ensures that all bindings have finished synchronizing before the view is
    rendered.

    To use, pass a function that performs a DOM operation..

    Before your function is called, this view and all child views will receive
    the `willInsertElement` event. After your function is invoked, this view
    and all of its child views will receive the `didInsertElement` event.

        view._insertElementLater(function() {
          this.createElement();
          this.$().appendTo('body');
        });

    @param {Function} fn the function that inserts the element into the DOM
  */
  _insertElementLater: function(fn) {
    this._lastInsert = Ember.guidFor(fn);
    Ember.run.schedule('render', this, this.invokeForState, 'insertElement', fn);
  },

  /**
    Appends the view's element to the document body. If the view does
    not have an HTML representation yet, `createElement()` will be called
    automatically.

    Note that this method just schedules the view to be appended; the DOM
    element will not be appended to the document body until all bindings have
    finished synchronizing.

    @returns {Ember.View} receiver
  */
  append: function() {
    return this.appendTo(document.body);
  },

  /**
    Removes the view's element from the element to which it is attached.

    @returns {Ember.View} receiver
  */
  remove: function() {
    // What we should really do here is wait until the end of the run loop
    // to determine if the element has been re-appended to a different
    // element.
    // In the interim, we will just re-render if that happens. It is more
    // important than elements get garbage collected.
    this.destroyElement();
    this.invokeRecursively(function(view) {
      view.clearRenderedChildren();
    });
  },

  /**
    The ID to use when trying to locate the element in the DOM. If you do not
    set the elementId explicitly, then the view's GUID will be used instead.
    This ID must be set at the time the view is created.

    @type String
    @readOnly
  */
  elementId: Ember.computed(function(key, value) {
    return value !== undefined ? value : Ember.guidFor(this);
  }).cacheable(),

  /**
    @private

    TODO: Perhaps this should be removed from the production build somehow.
  */
  _elementIdDidChange: Ember.beforeObserver(function() {
    throw "Changing a view's elementId after creation is not allowed.";
  }, 'elementId'),

  /**
    Attempts to discover the element in the parent element. The default
    implementation looks for an element with an ID of elementId (or the view's
    guid if elementId is null). You can override this method to provide your
    own form of lookup. For example, if you want to discover your element
    using a CSS class name instead of an ID.

    @param {DOMElement} parentElement The parent's DOM element
    @returns {DOMElement} The discovered element
  */
  findElementInParentElement: function(parentElem) {
    var id = "#" + get(this, 'elementId');
    return Ember.$(id)[0] || Ember.$(id, parentElem)[0];
  },

  /**
    Creates a new renderBuffer with the passed tagName. You can override this
    method to provide further customization to the buffer if needed. Normally
    you will not need to call or override this method.

    @returns {Ember.RenderBuffer}
  */
  renderBuffer: function(tagName) {
    tagName = tagName || get(this, 'tagName');

    // Explicitly check for null or undefined, as tagName
    // may be an empty string, which would evaluate to false.
    if (tagName === null || tagName === undefined) {
      tagName = 'div';
    }

    return Ember.RenderBuffer(tagName);
  },

  /**
    Creates a DOM representation of the view and all of its
    child views by recursively calling the `render()` method.

    After the element has been created, `didInsertElement` will
    be called on this view and all of its child views.

    @returns {Ember.View} receiver
  */
  createElement: function() {
    if (get(this, 'element')) { return this; }

    var buffer = this.renderToBuffer();
    set(this, 'element', buffer.element());

    return this;
  },

  /**
    Called when a view is going to insert an element into the DOM.
  */
  willInsertElement: Ember.K,

  /**
    Called when the element of the view has been inserted into the DOM.
    Override this function to do any set up that requires an element in the
    document body.
  */
  didInsertElement: Ember.K,

  /**
    Called when the view is about to rerender, but before anything has
    been torn down. This is a good opportunity to tear down any manual
    observers you have installed based on the DOM state
  */
  willRerender: Ember.K,

  /**
    Run this callback on the current view and recursively on child views.

    @private
  */
  invokeRecursively: function(fn) {
    fn.call(this, this);

    this.forEachChildView(function(view) {
      view.invokeRecursively(fn);
    });
  },

  /**
    Invalidates the cache for a property on all child views.
  */
  invalidateRecursively: function(key) {
    this.forEachChildView(function(view) {
      view.propertyDidChange(key);
    });
  },

  /**
    @private

    Invokes the receiver's willInsertElement() method if it exists and then
    invokes the same on all child views.

    NOTE: In some cases this was called when the element existed. This no longer
    works so we let people know. We can remove this warning code later.
  */
  _notifyWillInsertElement: function() {
    this.invokeRecursively(function(view) {
      view.trigger('willInsertElement');
    });
  },

  /**
    @private

    Invokes the receiver's didInsertElement() method if it exists and then
    invokes the same on all child views.
  */
  _notifyDidInsertElement: function() {
    this.invokeRecursively(function(view) {
      view.trigger('didInsertElement');
    });
  },

  /**
    @private

    Invokes the receiver's willRerender() method if it exists and then
    invokes the same on all child views.
  */
  _notifyWillRerender: function() {
    this.invokeRecursively(function(view) {
      view.trigger('willRerender');
    });
  },

  /**
    Destroys any existing element along with the element for any child views
    as well. If the view does not currently have a element, then this method
    will do nothing.

    If you implement willDestroyElement() on your view, then this method will
    be invoked on your view before your element is destroyed to give you a
    chance to clean up any event handlers, etc.

    If you write a willDestroyElement() handler, you can assume that your
    didInsertElement() handler was called earlier for the same element.

    Normally you will not call or override this method yourself, but you may
    want to implement the above callbacks when it is run.

    @returns {Ember.View} receiver
  */
  destroyElement: function() {
    return this.invokeForState('destroyElement');
  },

  /**
    Called when the element of the view is going to be destroyed. Override
    this function to do any teardown that requires an element, like removing
    event listeners.
  */
  willDestroyElement: function() {},

  /**
    @private

    Invokes the `willDestroyElement` callback on the view and child views.
  */
  _notifyWillDestroyElement: function() {
    this.invokeRecursively(function(view) {
      view.trigger('willDestroyElement');
    });
  },

  /** @private (nodoc) */
  _elementWillChange: Ember.beforeObserver(function() {
    this.forEachChildView(function(view) {
      Ember.propertyWillChange(view, 'element');
    });
  }, 'element'),

  /**
    @private

    If this view's element changes, we need to invalidate the caches of our
    child views so that we do not retain references to DOM elements that are
    no longer needed.

    @observes element
  */
  _elementDidChange: Ember.observer(function() {
    this.forEachChildView(function(view) {
      Ember.propertyDidChange(view, 'element');
    });
  }, 'element'),

  /**
    Called when the parentView property has changed.

    @function
  */
  parentViewDidChange: Ember.K,

  /**
    @private

    Invoked by the view system when this view needs to produce an HTML
    representation. This method will create a new render buffer, if needed,
    then apply any default attributes, such as class names and visibility.
    Finally, the `render()` method is invoked, which is responsible for
    doing the bulk of the rendering.

    You should not need to override this method; instead, implement the
    `template` property, or if you need more control, override the `render`
    method.

    @param {Ember.RenderBuffer} buffer the render buffer. If no buffer is
      passed, a default buffer, using the current view's `tagName`, will
      be used.
  */
  renderToBuffer: function(parentBuffer, bufferOperation) {
    var buffer;

    Ember.run.sync();

    // Determine where in the parent buffer to start the new buffer.
    // By default, a new buffer will be appended to the parent buffer.
    // The buffer operation may be changed if the child views array is
    // mutated by Ember.ContainerView.
    bufferOperation = bufferOperation || 'begin';

    // If this is the top-most view, start a new buffer. Otherwise,
    // create a new buffer relative to the original using the
    // provided buffer operation (for example, `insertAfter` will
    // insert a new buffer after the "parent buffer").
    if (parentBuffer) {
      var tagName = get(this, 'tagName');
      if (tagName === null || tagName === undefined) {
        tagName = 'div';
      }

      buffer = parentBuffer[bufferOperation](tagName);
    } else {
      buffer = this.renderBuffer();
    }

    this.buffer = buffer;
    this.transitionTo('inBuffer', false);

    this.lengthBeforeRender = this._childViews.length;

    this.beforeRender(buffer);
    this.render(buffer);
    this.afterRender(buffer);

    this.lengthAfterRender = this._childViews.length;

    return buffer;
  },

  beforeRender: function(buffer) {
    this.applyAttributesToBuffer(buffer);
  },

  afterRender: Ember.K,

  /**
    @private
  */
  applyAttributesToBuffer: function(buffer) {
    // Creates observers for all registered class name and attribute bindings,
    // then adds them to the element.
    this._applyClassNameBindings();

    // Pass the render buffer so the method can apply attributes directly.
    // This isn't needed for class name bindings because they use the
    // existing classNames infrastructure.
    this._applyAttributeBindings(buffer);


    a_forEach(get(this, 'classNames'), function(name){ buffer.addClass(name); });
    buffer.id(get(this, 'elementId'));

    var role = get(this, 'ariaRole');
    if (role) {
      buffer.attr('role', role);
    }

    if (get(this, 'isVisible') === false) {
      buffer.style('display', 'none');
    }
  },

  // ..........................................................
  // STANDARD RENDER PROPERTIES
  //

  /**
    Tag name for the view's outer element. The tag name is only used when
    an element is first created. If you change the tagName for an element, you
    must destroy and recreate the view element.

    By default, the render buffer will use a `<div>` tag for views.

    @type String
    @default null
  */

  // We leave this null by default so we can tell the difference between
  // the default case and a user-specified tag.
  tagName: null,

  /**
    The WAI-ARIA role of the control represented by this view. For example, a
    button may have a role of type 'button', or a pane may have a role of
    type 'alertdialog'. This property is used by assistive software to help
    visually challenged users navigate rich web applications.

    The full list of valid WAI-ARIA roles is available at:
    http://www.w3.org/TR/wai-aria/roles#roles_categorization

    @type String
    @default null
  */
  ariaRole: null,

  /**
    Standard CSS class names to apply to the view's outer element. This
    property automatically inherits any class names defined by the view's
    superclasses as well.

    @type Array
    @default ['ember-view']
  */
  classNames: ['ember-view'],

  /**
    A list of properties of the view to apply as class names. If the property
    is a string value, the value of that string will be applied as a class
    name.

        // Applies the 'high' class to the view element
        Ember.View.create({
          classNameBindings: ['priority']
          priority: 'high'
        });

    If the value of the property is a Boolean, the name of that property is
    added as a dasherized class name.

        // Applies the 'is-urgent' class to the view element
        Ember.View.create({
          classNameBindings: ['isUrgent']
          isUrgent: true
        });

    If you would prefer to use a custom value instead of the dasherized
    property name, you can pass a binding like this:

        // Applies the 'urgent' class to the view element
        Ember.View.create({
          classNameBindings: ['isUrgent:urgent']
          isUrgent: true
        });

    This list of properties is inherited from the view's superclasses as well.

    @type Array
    @default []
  */
  classNameBindings: [],

  /**
    A list of properties of the view to apply as attributes. If the property is
    a string value, the value of that string will be applied as the attribute.

        // Applies the type attribute to the element
        // with the value "button", like <div type="button">
        Ember.View.create({
          attributeBindings: ['type'],
          type: 'button'
        });

    If the value of the property is a Boolean, the name of that property is
    added as an attribute.

        // Renders something like <div enabled="enabled">
        Ember.View.create({
          attributeBindings: ['enabled'],
          enabled: true
        });
  */
  attributeBindings: [],

  state: 'preRender',

  // .......................................................
  // CORE DISPLAY METHODS
  //

  /**
    @private

    Setup a view, but do not finish waking it up.
    - configure childViews
    - register the view with the global views hash, which is used for event
      dispatch
  */
  init: function() {
    this._super();

    // Register the view for event handling. This hash is used by
    // Ember.EventDispatcher to dispatch incoming events.
    if (!this.isVirtual) Ember.View.views[get(this, 'elementId')] = this;

    // setup child views. be sure to clone the child views array first
    this._childViews = this._childViews.slice();

    Ember.assert("Only arrays are allowed for 'classNameBindings'", Ember.typeOf(this.classNameBindings) === 'array');
    this.classNameBindings = Ember.A(this.classNameBindings.slice());

    Ember.assert("Only arrays are allowed for 'classNames'", Ember.typeOf(this.classNames) === 'array');
    this.classNames = Ember.A(this.classNames.slice());

    var viewController = get(this, 'viewController');
    if (viewController) {
      viewController = Ember.getPath(viewController);
      if (viewController) {
        set(viewController, 'view', this);
      }
    }
  },

  appendChild: function(view, options) {
    return this.invokeForState('appendChild', view, options);
  },

  /**
    Removes the child view from the parent view.

    @param {Ember.View} view
    @returns {Ember.View} receiver
  */
  removeChild: function(view) {
    // If we're destroying, the entire subtree will be
    // freed, and the DOM will be handled separately,
    // so no need to mess with childViews.
    if (this.isDestroying) { return; }

    // update parent node
    set(view, '_parentView', null);

    // remove view from childViews array.
    var childViews = this._childViews;

    Ember.EnumerableUtils.removeObject(childViews, view);

    this.propertyDidChange('childViews'); // HUH?! what happened to will change?

    return this;
  },

  /**
    Removes all children from the parentView.

    @returns {Ember.View} receiver
  */
  removeAllChildren: function() {
    return this.mutateChildViews(function(view) {
      this.removeChild(view);
    });
  },

  destroyAllChildren: function() {
    return this.mutateChildViews(function(view) {
      view.destroy();
    });
  },

  /**
    Removes the view from its parentView, if one is found. Otherwise
    does nothing.

    @returns {Ember.View} receiver
  */
  removeFromParent: function() {
    var parent = get(this, '_parentView');

    // Remove DOM element from parent
    this.remove();

    if (parent) { parent.removeChild(this); }
    return this;
  },

  /**
    You must call `destroy` on a view to destroy the view (and all of its
    child views). This will remove the view from any parent node, then make
    sure that the DOM element managed by the view can be released by the
    memory manager.
  */
  willDestroy: function() {
    // calling this._super() will nuke computed properties and observers,
    // so collect any information we need before calling super.
    var childViews = this._childViews,
        parent     = get(this, '_parentView'),
        childLen;

    // destroy the element -- this will avoid each child view destroying
    // the element over and over again...
    if (!this.removedFromDOM) { this.destroyElement(); }

    // remove from non-virtual parent view if viewName was specified
    if (this.viewName) {
      var nonVirtualParentView = get(this, 'parentView');
      if (nonVirtualParentView) {
        set(nonVirtualParentView, this.viewName, null);
      }
    }

    // remove from parent if found. Don't call removeFromParent,
    // as removeFromParent will try to remove the element from
    // the DOM again.
    if (parent) { parent.removeChild(this); }

    this.state = 'destroyed';

    childLen = childViews.length;
    for (var i=childLen-1; i>=0; i--) {
      childViews[i].removedFromDOM = true;
      childViews[i].destroy();
    }

    // next remove view from global hash
    if (!this.isVirtual) delete Ember.View.views[get(this, 'elementId')];
  },

  /**
    Instantiates a view to be added to the childViews array during view
    initialization. You generally will not call this method directly unless
    you are overriding createChildViews(). Note that this method will
    automatically configure the correct settings on the new view instance to
    act as a child of the parent.

    @param {Class} viewClass
    @param {Hash} [attrs] Attributes to add
    @returns {Ember.View} new instance
    @test in createChildViews
  */
  createChildView: function(view, attrs) {
    if (Ember.View.detect(view)) {
      attrs = attrs || {};
      attrs._parentView = this;
      attrs.templateData = attrs.templateData || get(this, 'templateData');

      view = view.create(attrs);

      // don't set the property on a virtual view, as they are invisible to
      // consumers of the view API
      if (view.viewName) { set(get(this, 'concreteView'), view.viewName, view); }
    } else {
      Ember.assert('You must pass instance or subclass of View', view instanceof Ember.View);
      Ember.assert("You can only pass attributes when a class is provided", !attrs);

      if (!get(view, 'templateData')) {
        set(view, 'templateData', get(this, 'templateData'));
      }

      set(view, '_parentView', this);
    }

    return view;
  },

  becameVisible: Ember.K,
  becameHidden: Ember.K,

  /**
    @private

    When the view's `isVisible` property changes, toggle the visibility
    element of the actual DOM element.
  */
  _isVisibleDidChange: Ember.observer(function() {
    var isVisible = get(this, 'isVisible');

    this.$().toggle(isVisible);

    if (this._isAncestorHidden()) { return; }

    if (isVisible) {
      this._notifyBecameVisible();
    } else {
      this._notifyBecameHidden();
    }
  }, 'isVisible'),

  _notifyBecameVisible: function() {
    this.trigger('becameVisible');

    this.forEachChildView(function(view) {
      var isVisible = get(view, 'isVisible');

      if (isVisible || isVisible === null) {
        view._notifyBecameVisible();
      }
    });
  },

  _notifyBecameHidden: function() {
    this.trigger('becameHidden');
    this.forEachChildView(function(view) {
      var isVisible = get(view, 'isVisible');

      if (isVisible || isVisible === null) {
        view._notifyBecameHidden();
      }
    });
  },

  _isAncestorHidden: function() {
    var parent = get(this, 'parentView');

    while (parent) {
      if (get(parent, 'isVisible') === false) { return true; }

      parent = get(parent, 'parentView');
    }

    return false;
  },

  clearBuffer: function() {
    this.invokeRecursively(function(view) {
      this.buffer = null;
    });
  },

  transitionTo: function(state, children) {
    this.state = state;

    if (children !== false) {
      this.forEachChildView(function(view) {
        view.transitionTo(state);
      });
    }
  },

  /**
    @private

    Override the default event firing from Ember.Evented to
    also call methods with the given name.
  */
  trigger: function(name) {
    this._super.apply(this, arguments);
    var method = this[name];
    if (method) {
      var args = [], i, l;
      for (i = 1, l = arguments.length; i < l; i++) {
        args.push(arguments[i]);
      }
      return method.apply(this, args);
    }
  },

  has: function(name) {
    return Ember.typeOf(this[name]) === 'function' || this._super(name);
  },

  // .......................................................
  // EVENT HANDLING
  //

  /**
    @private

    Handle events from `Ember.EventDispatcher`
  */
  handleEvent: function(eventName, evt) {
    return this.invokeForState('handleEvent', eventName, evt);
  }

});

/**
  Describe how the specified actions should behave in the various
  states that a view can exist in. Possible states:

  * preRender: when a view is first instantiated, and after its
    element was destroyed, it is in the preRender state
  * inBuffer: once a view has been rendered, but before it has
    been inserted into the DOM, it is in the inBuffer state
  * inDOM: once a view has been inserted into the DOM it is in
    the inDOM state. A view spends the vast majority of its
    existence in this state.
  * destroyed: once a view has been destroyed (using the destroy
    method), it is in this state. No further actions can be invoked
    on a destroyed view.
*/

  // in the destroyed state, everything is illegal

  // before rendering has begun, all legal manipulations are noops.

  // inside the buffer, legal manipulations are done on the buffer

  // once the view has been inserted into the DOM, legal manipulations
  // are done on the DOM element.

/** @private */
var DOMManager = {
  prepend: function(view, childView) {
    childView._insertElementLater(function() {
      var element = view.$();
      element.prepend(childView.$());
    });
  },

  after: function(view, nextView) {
    nextView._insertElementLater(function() {
      var element = view.$();
      element.after(nextView.$());
    });
  },

  replace: function(view) {
    var element = get(view, 'element');

    set(view, 'element', null);

    view._insertElementLater(function() {
      Ember.$(element).replaceWith(get(view, 'element'));
    });
  },

  remove: function(view) {
    var elem = get(view, 'element');

    set(view, 'element', null);
    view._lastInsert = null;

    Ember.$(elem).remove();
  },

  empty: function(view) {
    view.$().empty();
  }
};

Ember.View.reopen({
  states: Ember.View.states,
  domManager: DOMManager
});

// Create a global view hash.
Ember.View.views = {};

// If someone overrides the child views computed property when
// defining their class, we want to be able to process the user's
// supplied childViews and then restore the original computed property
// at view initialization time. This happens in Ember.ContainerView's init
// method.
Ember.View.childViewsProperty = childViewsProperty;

Ember.View.applyAttributeBindings = function(elem, name, value) {
  var type = Ember.typeOf(value);
  var currentValue = elem.attr(name);

  // if this changes, also change the logic in ember-handlebars/lib/helpers/binding.js
  if ((type === 'string' || (type === 'number' && !isNaN(value))) && value !== currentValue) {
    elem.attr(name, value);
  } else if (value && type === 'boolean') {
    elem.attr(name, name);
  } else if (!value) {
    elem.removeAttr(name);
  }
};

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set;

Ember.View.states = {
  _default: {
    // appendChild is only legal while rendering the buffer.
    appendChild: function() {
      throw "You can't use appendChild outside of the rendering process";
    },

    $: function() {
      return Ember.$();
    },

    getElement: function() {
      return null;
    },

    // Handle events from `Ember.EventDispatcher`
    handleEvent: function() {
      return true; // continue event propagation
    },

    destroyElement: function(view) {
      set(view, 'element', null);
      view._lastInsert = null;
      return view;
    }
  }
};

Ember.View.reopen({
  states: Ember.View.states
});

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
Ember.View.states.preRender = {
  parentState: Ember.View.states._default,

  // a view leaves the preRender state once its element has been
  // created (createElement).
  insertElement: function(view, fn) {
    if (view._lastInsert !== Ember.guidFor(fn)){
      return;
    }
    view.createElement();
    view._notifyWillInsertElement();
    // after createElement, the view will be in the hasElement state.
    fn.call(view);
    view.transitionTo('inDOM');
    view._notifyDidInsertElement();
  },

  empty: Ember.K,

  setElement: function(view, value) {
    if (value !== null) {
      view.transitionTo('hasElement');
    }
    return value;
  }
};

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set, meta = Ember.meta;

Ember.View.states.inBuffer = {
  parentState: Ember.View.states._default,

  $: function(view, sel) {
    // if we don't have an element yet, someone calling this.$() is
    // trying to update an element that isn't in the DOM. Instead,
    // rerender the view to allow the render method to reflect the
    // changes.
    view.rerender();
    return Ember.$();
  },

  // when a view is rendered in a buffer, rerendering it simply
  // replaces the existing buffer with a new one
  rerender: function(view) {
    Ember.deprecate("Something you did caused a view to re-render after it rendered but before it was inserted into the DOM. Because this is avoidable and the cause of significant performance issues in applications, this behavior is deprecated. If you want to use the debugger to find out what caused this, you can set ENV.RAISE_ON_DEPRECATION to true.");

    view._notifyWillRerender();

    view.clearRenderedChildren();
    view.renderToBuffer(view.buffer, 'replaceWith');
  },

  // when a view is rendered in a buffer, appending a child
  // view will render that view and append the resulting
  // buffer into its buffer.
  appendChild: function(view, childView, options) {
    var buffer = view.buffer;

    childView = this.createChildView(childView, options);
    view._childViews.push(childView);

    childView.renderToBuffer(buffer);

    view.propertyDidChange('childViews');

    return childView;
  },

  // when a view is rendered in a buffer, destroying the
  // element will simply destroy the buffer and put the
  // state back into the preRender state.
  destroyElement: function(view) {
    view.clearBuffer();
    view._notifyWillDestroyElement();
    view.transitionTo('preRender');

    return view;
  },

  empty: function() {
    Ember.assert("Emptying a view in the inBuffer state is not allowed and should not happen under normal circumstances. Most likely there is a bug in your application. This may be due to excessive property change notifications.");
  },

  // It should be impossible for a rendered view to be scheduled for
  // insertion.
  insertElement: function() {
    throw "You can't insert an element that has already been rendered";
  },

  setElement: function(view, value) {
    if (value === null) {
      view.transitionTo('preRender');
    } else {
      view.clearBuffer();
      view.transitionTo('hasElement');
    }

    return value;
  }
};


})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set, meta = Ember.meta;

Ember.View.states.hasElement = {
  parentState: Ember.View.states._default,

  $: function(view, sel) {
    var elem = get(view, 'element');
    return sel ? Ember.$(sel, elem) : Ember.$(elem);
  },

  getElement: function(view) {
    var parent = get(view, 'parentView');
    if (parent) { parent = get(parent, 'element'); }
    if (parent) { return view.findElementInParentElement(parent); }
    return Ember.$("#" + get(view, 'elementId'))[0];
  },

  setElement: function(view, value) {
    if (value === null) {
      view.transitionTo('preRender');
    } else {
      throw "You cannot set an element to a non-null value when the element is already in the DOM.";
    }

    return value;
  },

  // once the view has been inserted into the DOM, rerendering is
  // deferred to allow bindings to synchronize.
  rerender: function(view) {
    view._notifyWillRerender();

    view.clearRenderedChildren();

    view.domManager.replace(view);
    return view;
  },

  // once the view is already in the DOM, destroying it removes it
  // from the DOM, nukes its element, and puts it back into the
  // preRender state if inDOM.

  destroyElement: function(view) {
    view._notifyWillDestroyElement();
    view.domManager.remove(view);
    return view;
  },

  empty: function(view) {
    var _childViews = view._childViews, len, idx;
    if (_childViews) {
      len = _childViews.length;
      for (idx = 0; idx < len; idx++) {
        _childViews[idx]._notifyWillDestroyElement();
      }
    }
    view.domManager.empty(view);
  },

  // Handle events from `Ember.EventDispatcher`
  handleEvent: function(view, eventName, evt) {
    if (view.has(eventName)) {
      // Handler should be able to re-dispatch events, so we don't
      // preventDefault or stopPropagation.
      return view.trigger(eventName, evt);
    } else {
      return true; // continue event propagation
    }
  }
};

Ember.View.states.inDOM = {
  parentState: Ember.View.states.hasElement,

  insertElement: function(view, fn) {
    if (view._lastInsert !== Ember.guidFor(fn)){
      return;
    }
    throw "You can't insert an element into the DOM that has already been inserted";
  }
};

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var destroyedError = "You can't call %@ on a destroyed view", fmt = Ember.String.fmt;

Ember.View.states.destroyed = {
  parentState: Ember.View.states._default,

  appendChild: function() {
    throw fmt(destroyedError, ['appendChild']);
  },
  rerender: function() {
    throw fmt(destroyedError, ['rerender']);
  },
  destroyElement: function() {
    throw fmt(destroyedError, ['destroyElement']);
  },
  empty: function() {
    throw fmt(destroyedError, ['empty']);
  },

  setElement: function() {
    throw fmt(destroyedError, ["set('element', ...)"]);
  },

  // Since element insertion is scheduled, don't do anything if
  // the view has been destroyed between scheduling and execution
  insertElement: Ember.K
};


})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set, meta = Ember.meta;
var forEach = Ember.EnumerableUtils.forEach;

var childViewsProperty = Ember.computed(function() {
  return get(this, '_childViews');
}).property('_childViews').cacheable();

/**
  @class

  A `ContainerView` is an `Ember.View` subclass that allows for manual or programatic
  management of a view's `childViews` array that will correctly update the `ContainerView`
  instance's rendered DOM representation.

  ## Setting Initial Child Views
  The initial array of child views can be set in one of two ways. You can provide
  a `childViews` property at creation time that contains instance of `Ember.View`:


        aContainer = Ember.ContainerView.create({
          childViews: [Ember.View.create(), Ember.View.create()]
        })

  You can also provide a list of property names whose values are instances of `Ember.View`:

        aContainer = Ember.ContainerView.create({
          childViews: ['aView', 'bView', 'cView'],
          aView: Ember.View.create(),
          bView: Ember.View.create()
          cView: Ember.View.create()
        })

  The two strategies can be combined:

        aContainer = Ember.ContainerView.create({
          childViews: ['aView', Ember.View.create()],
          aView: Ember.View.create()
        })

  Each child view's rendering will be inserted into the container's rendered HTML in the same
  order as its position in the `childViews` property.

  ## Adding and Removing Child Views
  The views in a container's `childViews` array should be added and removed by manipulating
  the `childViews` property directly.

  To remove a view pass that view into a `removeObject` call on the container's `childViews` property.

  Given an empty `<body>` the following code

        aContainer = Ember.ContainerView.create({
          classNames: ['the-container'],
          childViews: ['aView', 'bView'],
          aView: Ember.View.create({
            template: Ember.Handlebars.compile("A")
          }),
          bView: Ember.View.create({
            template: Ember.Handlebars.compile("B")
          })
        })

        aContainer.appendTo('body')

  Results in the HTML

        <div class="ember-view the-container">
          <div class="ember-view">A</div>
          <div class="ember-view">B</div>
        </div>

  Removing a view

        aContainer.get('childViews') // [aContainer.aView, aContainer.bView]
        aContainer.get('childViews').removeObject(aContainer.get('bView'))
        aContainer.get('childViews') // [aContainer.aView]

  Will result in the following HTML

        <div class="ember-view the-container">
          <div class="ember-view">A</div>
        </div>


  Similarly, adding a child view is accomplished by adding `Ember.View` instances to the
  container's `childViews` property.

  Given an empty `<body>` the following code

        aContainer = Ember.ContainerView.create({
          classNames: ['the-container'],
          childViews: ['aView', 'bView'],
          aView: Ember.View.create({
            template: Ember.Handlebars.compile("A")
          }),
          bView: Ember.View.create({
            template: Ember.Handlebars.compile("B")
          })
        })

        aContainer.appendTo('body')

  Results in the HTML

        <div class="ember-view the-container">
          <div class="ember-view">A</div>
          <div class="ember-view">B</div>
        </div>

  Adding a view

        AnotherViewClass = Ember.View.extend({
          template: Ember.Handlebars.compile("Another view")
        })

        aContainer.get('childViews') // [aContainer.aView, aContainer.bView]
        aContainer.get('childViews').pushObject(AnotherViewClass.create())
        aContainer.get('childViews') // [aContainer.aView, aContainer.bView, <AnotherViewClass instance>]

  Will result in the following HTML

        <div class="ember-view the-container">
          <div class="ember-view">A</div>
          <div class="ember-view">B</div>
          <div class="ember-view">Another view</div>
        </div>


  Direct manipulation of childViews presence or absence in the DOM via calls to
  `remove` or `removeFromParent` or calls to a container's `removeChild` may not behave
  correctly.

  Calling `remove()` on a child view will remove the view's HTML, but it will remain as part of its
  container's `childView`s property.

  Calling `removeChild()` on the container will remove the passed view instance from the container's
  `childView`s but keep its HTML within the container's rendered view.

  Calling `removeFromParent()` behaves as expected but should be avoided in favor of direct
  manipulation of a container's `childViews` property.

        aContainer = Ember.ContainerView.create({
          classNames: ['the-container'],
          childViews: ['aView', 'bView'],
          aView: Ember.View.create({
            template: Ember.Handlebars.compile("A")
          }),
          bView: Ember.View.create({
            template: Ember.Handlebars.compile("B")
          })
        })

        aContainer.appendTo('body')

  Results in the HTML

        <div class="ember-view the-container">
          <div class="ember-view">A</div>
          <div class="ember-view">B</div>
        </div>

  Calling `aContainer.get('aView').removeFromParent()` will result in the following HTML

        <div class="ember-view the-container">
          <div class="ember-view">B</div>
        </div>

  And the `Ember.View` instance stored in `aContainer.aView` will be removed from `aContainer`'s
  `childViews` array.

  ## Templates and Layout
  A `template`, `templateName`, `defaultTemplate`, `layout`, `layoutName` or `defaultLayout`
  property on a container view will not result in the template or layout being rendered.
  The HTML contents of a `Ember.ContainerView`'s DOM representation will only be the rendered HTML
  of its child views.

  ## Binding a View to Display

  If you would like to display a single view in your ContainerView, you can set its `currentView`
  property. When the `currentView` property is set to a view instance, it will be added to the
  ContainerView's `childViews` array. If the `currentView` property is later changed to a
  different view, the new view will replace the old view. If `currentView` is set to `null`, the
  last `currentView` will be removed.

  This functionality is useful for cases where you want to bind the display of a ContainerView to
  a controller or state manager. For example, you can bind the `currentView` of a container to
  a controller like this:

      // Controller
      App.appController = Ember.Object.create({
        view: Ember.View.create({
          templateName: 'person_template'
        })
      });

      // Handlebars template
      {{view Ember.ContainerView currentViewBinding="App.appController.view"}}

  @extends Ember.View
*/

Ember.ContainerView = Ember.View.extend({

  init: function() {
    this._super();

    var childViews = get(this, 'childViews');
    Ember.defineProperty(this, 'childViews', childViewsProperty);

    var _childViews = this._childViews;

    forEach(childViews, function(viewName, idx) {
      var view;

      if ('string' === typeof viewName) {
        view = get(this, viewName);
        view = this.createChildView(view);
        set(this, viewName, view);
      } else {
        view = this.createChildView(viewName);
      }

      _childViews[idx] = view;
    }, this);

    var currentView = get(this, 'currentView');
    if (currentView) _childViews.push(currentView);

    // Make the _childViews array observable
    Ember.A(_childViews);

    // Sets up an array observer on the child views array. This
    // observer will detect when child views are added or removed
    // and update the DOM to reflect the mutation.
    get(this, 'childViews').addArrayObserver(this, {
      willChange: 'childViewsWillChange',
      didChange: 'childViewsDidChange'
    });
  },

  /**
    Instructs each child view to render to the passed render buffer.

    @param {Ember.RenderBuffer} buffer the buffer to render to
    @private
  */
  render: function(buffer) {
    this.forEachChildView(function(view) {
      view.renderToBuffer(buffer);
    });
  },

  /**
    When the container view is destroyed, tear down the child views
    array observer.

    @private
  */
  willDestroy: function() {
    get(this, 'childViews').removeArrayObserver(this, {
      willChange: 'childViewsWillChange',
      didChange: 'childViewsDidChange'
    });

    this._super();
  },

  /**
    When a child view is removed, destroy its element so that
    it is removed from the DOM.

    The array observer that triggers this action is set up in the
    `renderToBuffer` method.

    @private
    @param {Ember.Array} views the child views array before mutation
    @param {Number} start the start position of the mutation
    @param {Number} removed the number of child views removed
  **/
  childViewsWillChange: function(views, start, removed) {
    if (removed === 0) { return; }

    var changedViews = views.slice(start, start+removed);
    this.initializeViews(changedViews, null, null);

    this.invokeForState('childViewsWillChange', views, start, removed);
  },

  /**
    When a child view is added, make sure the DOM gets updated appropriately.

    If the view has already rendered an element, we tell the child view to
    create an element and insert it into the DOM. If the enclosing container view
    has already written to a buffer, but not yet converted that buffer into an
    element, we insert the string representation of the child into the appropriate
    place in the buffer.

    @private
    @param {Ember.Array} views the array of child views afte the mutation has occurred
    @param {Number} start the start position of the mutation
    @param {Number} removed the number of child views removed
    @param {Number} the number of child views added
  */
  childViewsDidChange: function(views, start, removed, added) {
    var len = get(views, 'length');

    // No new child views were added; bail out.
    if (added === 0) return;

    var changedViews = views.slice(start, start+added);
    this.initializeViews(changedViews, this, get(this, 'templateData'));

    // Let the current state handle the changes
    this.invokeForState('childViewsDidChange', views, start, added);
  },

  initializeViews: function(views, parentView, templateData) {
    forEach(views, function(view) {
      set(view, '_parentView', parentView);

      if (!get(view, 'templateData')) {
        set(view, 'templateData', templateData);
      }
    });
  },

  /**
    Schedules a child view to be inserted into the DOM after bindings have
    finished syncing for this run loop.

    @param {Ember.View} view the child view to insert
    @param {Ember.View} prev the child view after which the specified view should
                     be inserted
    @private
  */
  _scheduleInsertion: function(view, prev) {
    if (prev) {
      prev.domManager.after(prev, view);
    } else {
      this.domManager.prepend(this, view);
    }
  },

  currentView: null,

  _currentViewWillChange: Ember.beforeObserver(function() {
    var childViews = get(this, 'childViews'),
        currentView = get(this, 'currentView');

    if (currentView) {
      childViews.removeObject(currentView);
    }
  }, 'currentView'),

  _currentViewDidChange: Ember.observer(function() {
    var childViews = get(this, 'childViews'),
        currentView = get(this, 'currentView');

    if (currentView) {
      childViews.pushObject(currentView);
    }
  }, 'currentView')
});

// Ember.ContainerView extends the default view states to provide different
// behavior for childViewsWillChange and childViewsDidChange.
Ember.ContainerView.states = {
  parent: Ember.View.states,

  inBuffer: {
    childViewsDidChange: function(parentView, views, start, added) {
      var buffer = parentView.buffer,
          startWith, prev, prevBuffer, view;

      // Determine where to begin inserting the child view(s) in the
      // render buffer.
      if (start === 0) {
        // If views were inserted at the beginning, prepend the first
        // view to the render buffer, then begin inserting any
        // additional views at the beginning.
        view = views[start];
        startWith = start + 1;
        view.renderToBuffer(buffer, 'prepend');
      } else {
        // Otherwise, just insert them at the same place as the child
        // views mutation.
        view = views[start - 1];
        startWith = start;
      }

      for (var i=startWith; i<start+added; i++) {
        prev = view;
        view = views[i];
        prevBuffer = prev.buffer;
        view.renderToBuffer(prevBuffer, 'insertAfter');
      }
    }
  },

  hasElement: {
    childViewsWillChange: function(view, views, start, removed) {
      for (var i=start; i<start+removed; i++) {
        views[i].remove();
      }
    },

    childViewsDidChange: function(view, views, start, added) {
      // If the DOM element for this container view already exists,
      // schedule each child view to insert its DOM representation after
      // bindings have finished syncing.
      var prev = start === 0 ? null : views[start-1];

      for (var i=start; i<start+added; i++) {
        view = views[i];
        this._scheduleInsertion(view, prev);
        prev = view;
      }
    }
  }
};

Ember.ContainerView.states.inDOM = {
  parentState: Ember.ContainerView.states.hasElement
};

Ember.ContainerView.reopen({
  states: Ember.ContainerView.states
});

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set, fmt = Ember.String.fmt;

/**
  @class

  `Ember.CollectionView` is an `Ember.View` descendent responsible for managing a
  collection (an array or array-like object) by maintaing a child view object and 
  associated DOM representation for each item in the array and ensuring that child
  views and their associated rendered HTML are updated when items in the array
  are added, removed, or replaced.

  ## Setting content
  The managed collection of objects is referenced as the `Ember.CollectionView` instance's
  `content` property.

      someItemsView = Ember.CollectionView.create({
        content: ['A', 'B','C']
      })

  The view for each item in the collection will have its `content` property set
  to the item.

  ## Specifying itemViewClass
  By default the view class for each item in the managed collection will be an instance
  of `Ember.View`. You can supply a different class by setting the `CollectionView`'s
  `itemViewClass` property.

  Given an empty `<body>` and the following code:


        someItemsView = Ember.CollectionView.create({
          classNames: ['a-collection'],
          content: ['A','B','C'],
          itemViewClass: Ember.View.extend({
            template: Ember.Handlebars.compile("the letter: {{view.content}}")
          })
        })

        someItemsView.appendTo('body')

  Will result in the following HTML structure

        <div class="ember-view a-collection">
          <div class="ember-view">the letter: A</div>
          <div class="ember-view">the letter: B</div>
          <div class="ember-view">the letter: C</div>
        </div>

  ## Automatic matching of parent/child tagNames

  Setting the `tagName` property of a `CollectionView` to any of 
  "ul", "ol", "table", "thead", "tbody", "tfoot", "tr", or "select" will result
  in the item views receiving an appropriately matched `tagName` property.


  Given an empty `<body>` and the following code:

        anUndorderedListView = Ember.CollectionView.create({
          tagName: 'ul',
          content: ['A','B','C'],
          itemViewClass: Ember.View.extend({
            template: Ember.Handlebars.compile("the letter: {{view.content}}")
          })
        })

        anUndorderedListView.appendTo('body')

  Will result in the following HTML structure

        <ul class="ember-view a-collection">
          <li class="ember-view">the letter: A</li>
          <li class="ember-view">the letter: B</li>
          <li class="ember-view">the letter: C</li>
        </ul>

  Additional tagName pairs can be provided by adding to `Ember.CollectionView.CONTAINER_MAP `

        Ember.CollectionView.CONTAINER_MAP['article'] = 'section'


  ## Empty View
  You can provide an `Ember.View` subclass to the `Ember.CollectionView` instance as its
  `emptyView` property. If the `content` property of a `CollectionView` is set to `null`
  or an empty array, an instance of this view will be the `CollectionView`s only child.

        aListWithNothing = Ember.CollectionView.create({
          classNames: ['nothing']
          content: null,
          emptyView: Ember.View.extend({
            template: Ember.Handlebars.compile("The collection is empty")
          })
        })

        aListWithNothing.appendTo('body')

  Will result in the following HTML structure

        <div class="ember-view nothing">
          <div class="ember-view">
            The collection is empty
          </div>
        </div>

  ## Adding and Removing items
  The `childViews` property of a `CollectionView` should not be directly manipulated. Instead,
  add, remove, replace items from its `content` property. This will trigger
  appropriate changes to its rendered HTML.

  ## Use in templates via the `{{collection}}` Ember.Handlebars helper
  Ember.Handlebars provides a helper specifically for adding `CollectionView`s to templates.
  See `Ember.Handlebars.collection` for more details

  @since Ember 0.9
  @extends Ember.ContainerView
*/
Ember.CollectionView = Ember.ContainerView.extend(
/** @scope Ember.CollectionView.prototype */ {

  /**
    A list of items to be displayed by the Ember.CollectionView.

    @type Ember.Array
    @default null
  */
  content: null,

  /**
    @private

    This provides metadata about what kind of empty view class this
    collection would like if it is being instantiated from another
    system (like Handlebars)
  */
  emptyViewClass: Ember.View,

  /**
    An optional view to display if content is set to an empty array.

    @type Ember.View
    @default null
  */
  emptyView: null,

  /**
    @type Ember.View
    @default Ember.View
  */
  itemViewClass: Ember.View,

  /** @private */
  init: function() {
    var ret = this._super();
    this._contentDidChange();
    return ret;
  },

  _contentWillChange: Ember.beforeObserver(function() {
    var content = this.get('content');

    if (content) { content.removeArrayObserver(this); }
    var len = content ? get(content, 'length') : 0;
    this.arrayWillChange(content, 0, len);
  }, 'content'),

  /**
    @private

    Check to make sure that the content has changed, and if so,
    update the children directly. This is always scheduled
    asynchronously, to allow the element to be created before
    bindings have synchronized and vice versa.
  */
  _contentDidChange: Ember.observer(function() {
    var content = get(this, 'content');

    if (content) {
      Ember.assert(fmt("an Ember.CollectionView's content must implement Ember.Array. You passed %@", [content]), Ember.Array.detect(content));
      content.addArrayObserver(this);
    }

    var len = content ? get(content, 'length') : 0;
    this.arrayDidChange(content, 0, null, len);
  }, 'content'),

  willDestroy: function() {
    var content = get(this, 'content');
    if (content) { content.removeArrayObserver(this); }

    this._super();
  },

  arrayWillChange: function(content, start, removedCount) {
    // If the contents were empty before and this template collection has an
    // empty view remove it now.
    var emptyView = get(this, 'emptyView');
    if (emptyView && emptyView instanceof Ember.View) {
      emptyView.removeFromParent();
    }

    // Loop through child views that correspond with the removed items.
    // Note that we loop from the end of the array to the beginning because
    // we are mutating it as we go.
    var childViews = get(this, 'childViews'), childView, idx, len;

    len = get(childViews, 'length');

    var removingAll = removedCount === len;

    if (removingAll) {
      this.invokeForState('empty');
    }

    for (idx = start + removedCount - 1; idx >= start; idx--) {
      childView = childViews[idx];
      if (removingAll) { childView.removedFromDOM = true; }
      childView.destroy();
    }
  },

  /**
    Called when a mutation to the underlying content array occurs.

    This method will replay that mutation against the views that compose the
    Ember.CollectionView, ensuring that the view reflects the model.

    This array observer is added in contentDidChange.

    @param {Array} addedObjects
      the objects that were added to the content

    @param {Array} removedObjects
      the objects that were removed from the content

    @param {Number} changeIndex
      the index at which the changes occurred
  */
  arrayDidChange: function(content, start, removed, added) {
    var itemViewClass = get(this, 'itemViewClass'),
        childViews = get(this, 'childViews'),
        addedViews = [], view, item, idx, len, itemTagName;

    if ('string' === typeof itemViewClass) {
      itemViewClass = Ember.getPath(itemViewClass);
    }

    Ember.assert(fmt("itemViewClass must be a subclass of Ember.View, not %@", [itemViewClass]), Ember.View.detect(itemViewClass));

    len = content ? get(content, 'length') : 0;
    if (len) {
      for (idx = start; idx < start+added; idx++) {
        item = content.objectAt(idx);

        view = this.createChildView(itemViewClass, {
          content: item,
          contentIndex: idx
        });

        addedViews.push(view);
      }
    } else {
      var emptyView = get(this, 'emptyView');
      if (!emptyView) { return; }

      emptyView = this.createChildView(emptyView);
      addedViews.push(emptyView);
      set(this, 'emptyView', emptyView);
    }
    childViews.replace(start, 0, addedViews);
  },

  createChildView: function(view, attrs) {
    view = this._super(view, attrs);

    var itemTagName = get(view, 'tagName');
    var tagName = (itemTagName === null || itemTagName === undefined) ? Ember.CollectionView.CONTAINER_MAP[get(this, 'tagName')] : itemTagName;

    set(view, 'tagName', tagName);

    return view;
  }
});

/**
  @static

  A map of parent tags to their default child tags. You can add
  additional parent tags if you want collection views that use
  a particular parent tag to default to a child tag.

  @type Hash
  @constant
*/
Ember.CollectionView.CONTAINER_MAP = {
  ul: 'li',
  ol: 'li',
  table: 'tr',
  thead: 'tr',
  tbody: 'tr',
  tfoot: 'tr',
  tr: 'td',
  select: 'option'
};

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();



(function() {
// ==========================================================================
// Project:   Ember - JavaScript Application Framework
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2011 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*globals jQuery*/

})();

