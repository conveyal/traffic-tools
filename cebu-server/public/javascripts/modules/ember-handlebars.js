(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals Handlebars */
var objectCreate = Ember.create;

/**
  @namespace
  @name Handlebars
  @private
*/

/**
  @namespace
  @name Handlebars.helpers
  @description Helpers for Handlebars templates
*/

Ember.assert("Ember Handlebars requires Handlebars 1.0.beta.5 or greater", window.Handlebars && window.Handlebars.VERSION.match(/^1\.0\.beta\.[56789]$|^1\.0\.rc\.[123456789]+/));

/**
  @class

  Prepares the Handlebars templating library for use inside Ember's view
  system.

  The Ember.Handlebars object is the standard Handlebars library, extended to use
  Ember's get() method instead of direct property access, which allows
  computed properties to be used inside templates.

  To create an Ember.Handlebars template, call Ember.Handlebars.compile().  This will
  return a function that can be used by Ember.View for rendering.
*/
Ember.Handlebars = objectCreate(Handlebars);

Ember.Handlebars.helpers = objectCreate(Handlebars.helpers);

/**
  Override the the opcode compiler and JavaScript compiler for Handlebars.
*/
Ember.Handlebars.Compiler = function() {};
Ember.Handlebars.Compiler.prototype = objectCreate(Handlebars.Compiler.prototype);
Ember.Handlebars.Compiler.prototype.compiler = Ember.Handlebars.Compiler;

Ember.Handlebars.JavaScriptCompiler = function() {};
Ember.Handlebars.JavaScriptCompiler.prototype = objectCreate(Handlebars.JavaScriptCompiler.prototype);
Ember.Handlebars.JavaScriptCompiler.prototype.compiler = Ember.Handlebars.JavaScriptCompiler;
Ember.Handlebars.JavaScriptCompiler.prototype.namespace = "Ember.Handlebars";


Ember.Handlebars.JavaScriptCompiler.prototype.initializeBuffer = function() {
  return "''";
};

/**
  Override the default buffer for Ember Handlebars. By default, Handlebars creates
  an empty String at the beginning of each invocation and appends to it. Ember's
  Handlebars overrides this to append to a single shared buffer.

  @private
*/
Ember.Handlebars.JavaScriptCompiler.prototype.appendToBuffer = function(string) {
  return "data.buffer.push("+string+");";
};

/**
  Rewrite simple mustaches from {{foo}} to {{bind "foo"}}. This means that all simple
  mustaches in Ember's Handlebars will also set up an observer to keep the DOM
  up to date when the underlying property changes.

  @private
*/
Ember.Handlebars.Compiler.prototype.mustache = function(mustache) {
  if (mustache.params.length || mustache.hash) {
    return Handlebars.Compiler.prototype.mustache.call(this, mustache);
  } else {
    var id = new Handlebars.AST.IdNode(['_triageMustache']);

    // Update the mustache node to include a hash value indicating whether the original node
    // was escaped. This will allow us to properly escape values when the underlying value
    // changes and we need to re-render the value.
    if(!mustache.escaped) {
      mustache.hash = mustache.hash || new Handlebars.AST.HashNode([]);
      mustache.hash.pairs.push(["unescaped", new Handlebars.AST.StringNode("true")]);
    }
    mustache = new Handlebars.AST.MustacheNode([id].concat([mustache.id]), mustache.hash, !mustache.escaped);
    return Handlebars.Compiler.prototype.mustache.call(this, mustache);
  }
};

/**
  Used for precompilation of Ember Handlebars templates. This will not be used during normal
  app execution.

  @param {String} string The template to precompile
*/
Ember.Handlebars.precompile = function(string) {
  var ast = Handlebars.parse(string);

  var options = {
    knownHelpers: {
      action: true,
      unbound: true,
      bindAttr: true,
      template: true,
      view: true,
      _triageMustache: true
    },
    data: true,
    stringParams: true
  };

  var environment = new Ember.Handlebars.Compiler().compile(ast, options);
  return new Ember.Handlebars.JavaScriptCompiler().compile(environment, options, undefined, true);
};

/**
  The entry point for Ember Handlebars. This replaces the default Handlebars.compile and turns on
  template-local data and String parameters.

  @param {String} string The template to compile
*/
Ember.Handlebars.compile = function(string) {
  var ast = Handlebars.parse(string);
  var options = { data: true, stringParams: true };
  var environment = new Ember.Handlebars.Compiler().compile(ast, options);
  var templateSpec = new Ember.Handlebars.JavaScriptCompiler().compile(environment, options, undefined, true);

  return Handlebars.template(templateSpec);
};

/**
  If a path starts with a reserved keyword, returns the root
  that should be used.

  @private
*/
var normalizePath = Ember.Handlebars.normalizePath = function(root, path, data) {
  var keywords = (data && data.keywords) || {},
      keyword, isKeyword;

  // Get the first segment of the path. For example, if the
  // path is "foo.bar.baz", returns "foo".
  keyword = path.split('.', 1)[0];

  // Test to see if the first path is a keyword that has been
  // passed along in the view's data hash. If so, we will treat
  // that object as the new root.
  if (keywords.hasOwnProperty(keyword)) {
    // Look up the value in the template's data hash.
    root = keywords[keyword];
    isKeyword = true;

    // Handle cases where the entire path is the reserved
    // word. In that case, return the object itself.
    if (path === keyword) {
      path = '';
    } else {
      // Strip the keyword from the path and look up
      // the remainder from the newly found root.
      path = path.substr(keyword.length+1);
    }
  }

  return { root: root, path: path, isKeyword: isKeyword };
};
/**
  Lookup both on root and on window. If the path starts with
  a keyword, the corresponding object will be looked up in the
  template's data hash and used to resolve the path.

  @param {Object} root The object to look up the property on
  @param {String} path The path to be lookedup
  @param {Object} options The template's option hash
*/

Ember.Handlebars.getPath = function(root, path, options) {
  var data = options && options.data,
      normalizedPath = normalizePath(root, path, data),
      value;

  // In cases where the path begins with a keyword, change the
  // root to the value represented by that keyword, and ensure
  // the path is relative to it.
  root = normalizedPath.root;
  path = normalizedPath.path;

  value = Ember.getPath(root, path);

  if (value === undefined && root !== window && Ember.isGlobalPath(path)) {
    value = Ember.getPath(window, path);
  }
  return value;
};

/**
  Registers a helper in Handlebars that will be called if no property with the
  given name can be found on the current context object, and no helper with
  that name is registered.

  This throws an exception with a more helpful error message so the user can
  track down where the problem is happening.

  @name Handlebars.helpers.helperMissing
  @param {String} path
  @param {Hash} options
*/
Ember.Handlebars.registerHelper('helperMissing', function(path, options) {
  var error, view = "";

  error = "%@ Handlebars error: Could not find property '%@' on object %@.";
  if (options.data){
    view = options.data.view;
  }
  throw new Ember.Error(Ember.String.fmt(error, [view, path, this]));
});


})();



(function() {

Ember.String.htmlSafe = function(str) {
  return new Handlebars.SafeString(str);
};

var htmlSafe = Ember.String.htmlSafe;

if (Ember.EXTEND_PROTOTYPES) {

  /**
    @see Ember.String.htmlSafe
  */
  String.prototype.htmlSafe = function() {
    return htmlSafe(this);
  };

}

})();



(function() {
/*jshint newcap:false*/
var set = Ember.set, get = Ember.get, getPath = Ember.getPath;

var DOMManager = {
  remove: function(view) {
    var morph = view.morph;
    if (morph.isRemoved()) { return; }
    set(view, 'element', null);
    view._lastInsert = null;
    morph.remove();
  },

  prepend: function(view, childView) {
    childView._insertElementLater(function() {
      var morph = view.morph;
      morph.prepend(childView.outerHTML);
      childView.outerHTML = null;
    });
  },

  after: function(view, nextView) {
    nextView._insertElementLater(function() {
      var morph = view.morph;
      morph.after(nextView.outerHTML);
      nextView.outerHTML = null;
    });
  },

  replace: function(view) {
    var morph = view.morph;

    view.transitionTo('preRender');
    view.clearRenderedChildren();
    var buffer = view.renderToBuffer();

    Ember.run.schedule('render', this, function() {
      if (get(view, 'isDestroyed')) { return; }
      view.invalidateRecursively('element');
      view._notifyWillInsertElement();
      morph.replaceWith(buffer.string());
      view.transitionTo('inDOM');
      view._notifyDidInsertElement();
    });
  },

  empty: function(view) {
    view.morph.html("");
  }
};

// The `morph` and `outerHTML` properties are internal only
// and not observable.

Ember._Metamorph = Ember.Mixin.create({
  isVirtual: true,
  tagName: '',

  init: function() {
    this._super();
    this.morph = Metamorph();
  },

  beforeRender: function(buffer) {
    buffer.push(this.morph.startTag());
  },

  afterRender: function(buffer) {
    buffer.push(this.morph.endTag());
  },

  createElement: function() {
    var buffer = this.renderToBuffer();
    this.outerHTML = buffer.string();
    this.clearBuffer();
  },

  domManager: DOMManager
});

Ember._MetamorphView = Ember.View.extend(Ember._Metamorph);


})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals Handlebars */

var get = Ember.get, set = Ember.set, getPath = Ember.Handlebars.getPath;
/**
  @ignore
  @private
  @class

  Ember._HandlebarsBoundView is a private view created by the Handlebars `{{bind}}`
  helpers that is used to keep track of bound properties.

  Every time a property is bound using a `{{mustache}}`, an anonymous subclass
  of Ember._HandlebarsBoundView is created with the appropriate sub-template and
  context set up. When the associated property changes, just the template for
  this view will re-render.
*/
Ember._HandlebarsBoundView = Ember._MetamorphView.extend({
/** @scope Ember._HandlebarsBoundView.prototype */

  /**
    The function used to determine if the `displayTemplate` or
    `inverseTemplate` should be rendered. This should be a function that takes
    a value and returns a Boolean.

    @type Function
    @default null
  */
  shouldDisplayFunc: null,

  /**
    Whether the template rendered by this view gets passed the context object
    of its parent template, or gets passed the value of retrieving `path`
    from the `pathRoot`.

    For example, this is true when using the `{{#if}}` helper, because the
    template inside the helper should look up properties relative to the same
    object as outside the block. This would be false when used with `{{#with
    foo}}` because the template should receive the object found by evaluating
    `foo`.

    @type Boolean
    @default false
  */
  preserveContext: false,

  /**
    If `preserveContext` is true, this is the object that will be used
    to render the template.

    @type Object
  */
  previousContext: null,

  /**
    The template to render when `shouldDisplayFunc` evaluates to true.

    @type Function
    @default null
  */
  displayTemplate: null,

  /**
    The template to render when `shouldDisplayFunc` evaluates to false.

    @type Function
    @default null
  */
  inverseTemplate: null,


  /**
    The path to look up on `pathRoot` that is passed to
    `shouldDisplayFunc` to determine which template to render.

    In addition, if `preserveContext` is false, the object at this path will
    be passed to the template when rendering.

    @type String
    @default null
  */
  path: null,

  /**
    The object from which the `path` will be looked up. Sometimes this is the
    same as the `previousContext`, but in cases where this view has been generated
    for paths that start with a keyword such as `view` or `controller`, the
    path root will be that resolved object.

    @type Object
  */
  pathRoot: null,

  normalizedValue: Ember.computed(function() {
    var path = get(this, 'path'),
        pathRoot  = get(this, 'pathRoot'),
        valueNormalizer = get(this, 'valueNormalizerFunc'),
        result, templateData;

    // Use the pathRoot as the result if no path is provided. This
    // happens if the path is `this`, which gets normalized into
    // a `pathRoot` of the current Handlebars context and a path
    // of `''`.
    if (path === '') {
      result = pathRoot;
    } else {
      templateData = get(this, 'templateData');
      result = getPath(pathRoot, path, { data: templateData });
    }

    return valueNormalizer ? valueNormalizer(result) : result;
  }).property('path', 'pathRoot', 'valueNormalizerFunc').volatile(),

  rerenderIfNeeded: function() {
    if (!get(this, 'isDestroyed') && get(this, 'normalizedValue') !== this._lastNormalizedValue) {
      this.rerender();
    }
  },

  /**
    Determines which template to invoke, sets up the correct state based on
    that logic, then invokes the default Ember.View `render` implementation.

    This method will first look up the `path` key on `pathRoot`,
    then pass that value to the `shouldDisplayFunc` function. If that returns
    true, the `displayTemplate` function will be rendered to DOM. Otherwise,
    `inverseTemplate`, if specified, will be rendered.

    For example, if this Ember._HandlebarsBoundView represented the {{#with foo}}
    helper, it would look up the `foo` property of its context, and
    `shouldDisplayFunc` would always return true. The object found by looking
    up `foo` would be passed to `displayTemplate`.

    @param {Ember.RenderBuffer} buffer
  */
  render: function(buffer) {
    // If not invoked via a triple-mustache ({{{foo}}}), escape
    // the content of the template.
    var escape = get(this, 'isEscaped');

    var shouldDisplay = get(this, 'shouldDisplayFunc'),
        preserveContext = get(this, 'preserveContext'),
        context = get(this, 'previousContext');

    var inverseTemplate = get(this, 'inverseTemplate'),
        displayTemplate = get(this, 'displayTemplate');

    var result = get(this, 'normalizedValue');
    this._lastNormalizedValue = result;

    // First, test the conditional to see if we should
    // render the template or not.
    if (shouldDisplay(result)) {
      set(this, 'template', displayTemplate);

      // If we are preserving the context (for example, if this
      // is an #if block, call the template with the same object.
      if (preserveContext) {
        set(this, '_context', context);
      } else {
      // Otherwise, determine if this is a block bind or not.
      // If so, pass the specified object to the template
        if (displayTemplate) {
          set(this, '_context', result);
        } else {
        // This is not a bind block, just push the result of the
        // expression to the render context and return.
          if (result === null || result === undefined) {
            result = "";
          } else if (!(result instanceof Handlebars.SafeString)) {
            result = String(result);
          }

          if (escape) { result = Handlebars.Utils.escapeExpression(result); }
          buffer.push(result);
          return;
        }
      }
    } else if (inverseTemplate) {
      set(this, 'template', inverseTemplate);

      if (preserveContext) {
        set(this, '_context', context);
      } else {
        set(this, '_context', result);
      }
    } else {
      set(this, 'template', function() { return ''; });
    }

    return this._super(buffer);
  }
});

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set, fmt = Ember.String.fmt;
var getPath = Ember.Handlebars.getPath, normalizePath = Ember.Handlebars.normalizePath;
var forEach = Ember.ArrayPolyfills.forEach;

var EmberHandlebars = Ember.Handlebars, helpers = EmberHandlebars.helpers;

// Binds a property into the DOM. This will create a hook in DOM that the
// KVO system will look for and update if the property changes.
/** @private */
function bind(property, options, preserveContext, shouldDisplay, valueNormalizer) {
  var data = options.data,
      fn = options.fn,
      inverse = options.inverse,
      view = data.view,
      currentContext = this,
      pathRoot, path, normalized;

  normalized = normalizePath(currentContext, property, data);

  pathRoot = normalized.root;
  path = normalized.path;

  // Set up observers for observable objects
  if ('object' === typeof this) {
    // Create the view that will wrap the output of this template/property
    // and add it to the nearest view's childViews array.
    // See the documentation of Ember._HandlebarsBoundView for more.
    var bindView = view.createChildView(Ember._HandlebarsBoundView, {
      preserveContext: preserveContext,
      shouldDisplayFunc: shouldDisplay,
      valueNormalizerFunc: valueNormalizer,
      displayTemplate: fn,
      inverseTemplate: inverse,
      path: path,
      pathRoot: pathRoot,
      previousContext: currentContext,
      isEscaped: !options.hash.unescaped,
      templateData: options.data
    });

    view.appendChild(bindView);

    /** @private */
    var observer = function() {
      Ember.run.once(bindView, 'rerenderIfNeeded');
    };

    // Observes the given property on the context and
    // tells the Ember._HandlebarsBoundView to re-render. If property
    // is an empty string, we are printing the current context
    // object ({{this}}) so updating it is not our responsibility.
    if (path !== '') {
      Ember.addObserver(pathRoot, path, observer);
    }
  } else {
    // The object is not observable, so just render it out and
    // be done with it.
    data.buffer.push(getPath(pathRoot, path, options));
  }
}

/**
  '_triageMustache' is used internally select between a binding and helper for
  the given context. Until this point, it would be hard to determine if the
  mustache is a property reference or a regular helper reference. This triage
  helper resolves that.

  This would not be typically invoked by directly.

  @private
  @name Handlebars.helpers._triageMustache
  @param {String} property Property/helperID to triage
  @param {Function} fn Context to provide for rendering
  @returns {String} HTML string
*/
EmberHandlebars.registerHelper('_triageMustache', function(property, fn) {
  Ember.assert("You cannot pass more than one argument to the _triageMustache helper", arguments.length <= 2);
  if (helpers[property]) {
    return helpers[property].call(this, fn);
  }
  else {
    return helpers.bind.apply(this, arguments);
  }
});

/**
  `bind` can be used to display a value, then update that value if it
  changes. For example, if you wanted to print the `title` property of
  `content`:

      {{bind "content.title"}}

  This will return the `title` property as a string, then create a new
  observer at the specified path. If it changes, it will update the value in
  DOM. Note that if you need to support IE7 and IE8 you must modify the
  model objects properties using Ember.get() and Ember.set() for this to work as
  it relies on Ember's KVO system.  For all other browsers this will be handled
  for you automatically.

  @private
  @name Handlebars.helpers.bind
  @param {String} property Property to bind
  @param {Function} fn Context to provide for rendering
  @returns {String} HTML string
*/
EmberHandlebars.registerHelper('bind', function(property, fn) {
  Ember.assert("You cannot pass more than one argument to the bind helper", arguments.length <= 2);

  var context = (fn.contexts && fn.contexts[0]) || this;

  return bind.call(context, property, fn, false, function(result) {
    return !Ember.none(result);
  });
});

/**
  Use the `boundIf` helper to create a conditional that re-evaluates
  whenever the bound value changes.

      {{#boundIf "content.shouldDisplayTitle"}}
        {{content.title}}
      {{/boundIf}}

  @private
  @name Handlebars.helpers.boundIf
  @param {String} property Property to bind
  @param {Function} fn Context to provide for rendering
  @returns {String} HTML string
*/
EmberHandlebars.registerHelper('boundIf', function(property, fn) {
  var context = (fn.contexts && fn.contexts[0]) || this;
  var func = function(result) {
    if (Ember.typeOf(result) === 'array') {
      return get(result, 'length') !== 0;
    } else {
      return !!result;
    }
  };

  return bind.call(context, property, fn, true, func, func);
});

/**
  @name Handlebars.helpers.with
  @param {Function} context
  @param {Hash} options
  @returns {String} HTML string
*/
EmberHandlebars.registerHelper('with', function(context, options) {
  if (arguments.length === 4) {
    var keywordName, path, rootPath, normalized;

    Ember.assert("If you pass more than one argument to the with helper, it must be in the form #with foo as bar", arguments[1] === "as");
    options = arguments[3];
    keywordName = arguments[2];
    path = arguments[0];

    Ember.assert("You must pass a block to the with helper", options.fn && options.fn !== Handlebars.VM.noop);

    if (Ember.isGlobalPath(path)) {
      Ember.bind(options.data.keywords, keywordName, path);
    } else {
      normalized = normalizePath(this, path, options.data);
      path = normalized.path;
      rootPath = normalized.root;

      // This is a workaround for the fact that you cannot bind separate objects
      // together. When we implement that functionality, we should use it here.
      var contextKey = Ember.$.expando + Ember.guidFor(rootPath);
      options.data.keywords[contextKey] = rootPath;

      // if the path is '' ("this"), just bind directly to the current context
      var contextPath = path ? contextKey + '.' + path : contextKey;
      Ember.bind(options.data.keywords, keywordName, contextPath);
    }

    return bind.call(this, path, options.fn, true, function(result) {
      return !Ember.none(result);
    });
  } else {
    Ember.assert("You must pass exactly one argument to the with helper", arguments.length === 2);
    Ember.assert("You must pass a block to the with helper", options.fn && options.fn !== Handlebars.VM.noop);
    return helpers.bind.call(options.contexts[0], context, options);
  }
});


/**
  @name Handlebars.helpers.if
  @param {Function} context
  @param {Hash} options
  @returns {String} HTML string
*/
EmberHandlebars.registerHelper('if', function(context, options) {
  Ember.assert("You must pass exactly one argument to the if helper", arguments.length === 2);
  Ember.assert("You must pass a block to the if helper", options.fn && options.fn !== Handlebars.VM.noop);

  return helpers.boundIf.call(options.contexts[0], context, options);
});

/**
  @name Handlebars.helpers.unless
  @param {Function} context
  @param {Hash} options
  @returns {String} HTML string
*/
EmberHandlebars.registerHelper('unless', function(context, options) {
  Ember.assert("You must pass exactly one argument to the unless helper", arguments.length === 2);
  Ember.assert("You must pass a block to the unless helper", options.fn && options.fn !== Handlebars.VM.noop);

  var fn = options.fn, inverse = options.inverse;

  options.fn = inverse;
  options.inverse = fn;

  return helpers.boundIf.call(options.contexts[0], context, options);
});

/**
  `bindAttr` allows you to create a binding between DOM element attributes and
  Ember objects. For example:

      <img {{bindAttr src="imageUrl" alt="imageTitle"}}>

  @name Handlebars.helpers.bindAttr
  @param {Hash} options
  @returns {String} HTML string
*/
EmberHandlebars.registerHelper('bindAttr', function(options) {

  var attrs = options.hash;

  Ember.assert("You must specify at least one hash argument to bindAttr", !!Ember.keys(attrs).length);

  var view = options.data.view;
  var ret = [];
  var ctx = this;

  // Generate a unique id for this element. This will be added as a
  // data attribute to the element so it can be looked up when
  // the bound property changes.
  var dataId = ++Ember.$.uuid;

  // Handle classes differently, as we can bind multiple classes
  var classBindings = attrs['class'];
  if (classBindings !== null && classBindings !== undefined) {
    var classResults = EmberHandlebars.bindClasses(this, classBindings, view, dataId, options);
    ret.push('class="' + Handlebars.Utils.escapeExpression(classResults.join(' ')) + '"');
    delete attrs['class'];
  }

  var attrKeys = Ember.keys(attrs);

  // For each attribute passed, create an observer and emit the
  // current value of the property as an attribute.
  forEach.call(attrKeys, function(attr) {
    var path = attrs[attr],
        pathRoot, normalized;

    Ember.assert(fmt("You must provide a String for a bound attribute, not %@", [path]), typeof path === 'string');

    normalized = normalizePath(ctx, path, options.data);

    pathRoot = normalized.root;
    path = normalized.path;

    var value = (path === 'this') ? pathRoot : getPath(pathRoot, path, options),
        type = Ember.typeOf(value);

    Ember.assert(fmt("Attributes must be numbers, strings or booleans, not %@", [value]), value === null || value === undefined || type === 'number' || type === 'string' || type === 'boolean');

    var observer, invoker;

    /** @private */
    observer = function observer() {
      var result = getPath(pathRoot, path, options);

      Ember.assert(fmt("Attributes must be numbers, strings or booleans, not %@", [result]), result === null || result === undefined || typeof result === 'number' || typeof result === 'string' || typeof result === 'boolean');

      var elem = view.$("[data-bindattr-" + dataId + "='" + dataId + "']");

      // If we aren't able to find the element, it means the element
      // to which we were bound has been removed from the view.
      // In that case, we can assume the template has been re-rendered
      // and we need to clean up the observer.
      if (elem.length === 0) {
        Ember.removeObserver(pathRoot, path, invoker);
        return;
      }

      Ember.View.applyAttributeBindings(elem, attr, result);
    };

    /** @private */
    invoker = function() {
      Ember.run.once(observer);
    };

    // Add an observer to the view for when the property changes.
    // When the observer fires, find the element using the
    // unique data id and update the attribute to the new value.
    if (path !== 'this') {
      Ember.addObserver(pathRoot, path, invoker);
    }

    // if this changes, also change the logic in ember-views/lib/views/view.js
    if ((type === 'string' || (type === 'number' && !isNaN(value)))) {
      ret.push(attr + '="' + Handlebars.Utils.escapeExpression(value) + '"');
    } else if (value && type === 'boolean') {
      // The developer controls the attr name, so it should always be safe
      ret.push(attr + '="' + attr + '"');
    }
  }, this);

  // Add the unique identifier
  // NOTE: We use all lower-case since Firefox has problems with mixed case in SVG
  ret.push('data-bindattr-' + dataId + '="' + dataId + '"');
  return new EmberHandlebars.SafeString(ret.join(' '));
});

/**
  Helper that, given a space-separated string of property paths and a context,
  returns an array of class names. Calling this method also has the side
  effect of setting up observers at those property paths, such that if they
  change, the correct class name will be reapplied to the DOM element.

  For example, if you pass the string "fooBar", it will first look up the
  "fooBar" value of the context. If that value is true, it will add the
  "foo-bar" class to the current element (i.e., the dasherized form of
  "fooBar"). If the value is a string, it will add that string as the class.
  Otherwise, it will not add any new class name.

  @param {Ember.Object} context
    The context from which to lookup properties

  @param {String} classBindings
    A string, space-separated, of class bindings to use

  @param {Ember.View} view
    The view in which observers should look for the element to update

  @param {Srting} bindAttrId
    Optional bindAttr id used to lookup elements

  @returns {Array} An array of class names to add
*/
EmberHandlebars.bindClasses = function(context, classBindings, view, bindAttrId, options) {
  var ret = [], newClass, value, elem;

  // Helper method to retrieve the property from the context and
  // determine which class string to return, based on whether it is
  // a Boolean or not.
  var classStringForPath = function(root, path, className, options) {
    var val = path !== '' ? getPath(root, path, options) : true;

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
      var parts = path.split('.');
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
  };

  // For each property passed, loop through and setup
  // an observer.
  forEach.call(classBindings.split(' '), function(binding) {

    // Variable in which the old class value is saved. The observer function
    // closes over this variable, so it knows which string to remove when
    // the property changes.
    var oldClass;

    var observer, invoker;

    var split = binding.split(':'),
        path = split[0],
        className = split[1],
        pathRoot = context,
        normalized;

    if (path !== '') {
      normalized = normalizePath(context, path, options.data);

      pathRoot = normalized.root;
      path = normalized.path;
    }

    // Set up an observer on the context. If the property changes, toggle the
    // class name.
    /** @private */
    observer = function() {
      // Get the current value of the property
      newClass = classStringForPath(pathRoot, path, className, options);
      elem = bindAttrId ? view.$("[data-bindattr-" + bindAttrId + "='" + bindAttrId + "']") : view.$();

      // If we can't find the element anymore, a parent template has been
      // re-rendered and we've been nuked. Remove the observer.
      if (elem.length === 0) {
        Ember.removeObserver(pathRoot, path, invoker);
      } else {
        // If we had previously added a class to the element, remove it.
        if (oldClass) {
          elem.removeClass(oldClass);
        }

        // If necessary, add a new class. Make sure we keep track of it so
        // it can be removed in the future.
        if (newClass) {
          elem.addClass(newClass);
          oldClass = newClass;
        } else {
          oldClass = null;
        }
      }
    };

    /** @private */
    invoker = function() {
      Ember.run.once(observer);
    };

    if (path !== '') {
      Ember.addObserver(pathRoot, path, invoker);
    }

    // We've already setup the observer; now we just need to figure out the
    // correct behavior right now on the first pass through.
    value = classStringForPath(pathRoot, path, className, options);

    if (value) {
      ret.push(value);

      // Make sure we save the current value so that it can be removed if the
      // observer fires.
      oldClass = value;
    }
  });

  return ret;
};


})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals Handlebars */

// TODO: Don't require the entire module
var get = Ember.get, set = Ember.set;
var PARENT_VIEW_PATH = /^parentView\./;
var EmberHandlebars = Ember.Handlebars;

/** @private */
EmberHandlebars.ViewHelper = Ember.Object.create({

  propertiesFromHTMLOptions: function(options, thisContext) {
    var hash = options.hash, data = options.data;
    var extensions = {},
        classes = hash['class'],
        dup = false;

    if (hash.id) {
      extensions.elementId = hash.id;
      dup = true;
    }

    if (classes) {
      classes = classes.split(' ');
      extensions.classNames = classes;
      dup = true;
    }

    if (hash.classBinding) {
      extensions.classNameBindings = hash.classBinding.split(' ');
      dup = true;
    }

    if (hash.classNameBindings) {
      extensions.classNameBindings = hash.classNameBindings.split(' ');
      dup = true;
    }

    if (hash.attributeBindings) {
      Ember.assert("Setting 'attributeBindings' via Handlebars is not allowed. Please subclass Ember.View and set it there instead.");
      extensions.attributeBindings = null;
      dup = true;
    }

    if (dup) {
      hash = Ember.$.extend({}, hash);
      delete hash.id;
      delete hash['class'];
      delete hash.classBinding;
    }

    // Look for bindings passed to the helper and, if they are
    // local, make them relative to the current context instead of the
    // view.
    var path, normalized;

    for (var prop in hash) {
      if (!hash.hasOwnProperty(prop)) { continue; }

      // Test if the property ends in "Binding"
      if (Ember.IS_BINDING.test(prop) && typeof hash[prop] === 'string') {
        path = hash[prop];

        normalized = Ember.Handlebars.normalizePath(null, path, data);
        if (normalized.isKeyword) {
          hash[prop] = 'templateData.keywords.'+path;
        } else if (!Ember.isGlobalPath(path)) {
          if (path === 'this') {
            hash[prop] = 'bindingContext';
          } else {
            hash[prop] = 'bindingContext.'+path;
          }
        }
      }
    }

    // Make the current template context available to the view
    // for the bindings set up above.
    extensions.bindingContext = thisContext;

    return Ember.$.extend(hash, extensions);
  },

  helper: function(thisContext, path, options) {
    var inverse = options.inverse,
        data = options.data,
        view = data.view,
        fn = options.fn,
        hash = options.hash,
        newView;

    if ('string' === typeof path) {
      newView = EmberHandlebars.getPath(thisContext, path, options);
      Ember.assert("Unable to find view at path '" + path + "'", !!newView);
    } else {
      newView = path;
    }

    Ember.assert(Ember.String.fmt('You must pass a view class to the #view helper, not %@ (%@)', [path, newView]), Ember.View.detect(newView));

    var viewOptions = this.propertiesFromHTMLOptions(options, thisContext);
    var currentView = data.view;
    viewOptions.templateData = options.data;

    if (fn) {
      Ember.assert("You cannot provide a template block if you also specified a templateName", !get(viewOptions, 'templateName') && !get(newView.proto(), 'templateName'));
      viewOptions.template = fn;
    }

    currentView.appendChild(newView, viewOptions);
  }
});

/**
  `{{view}}` inserts a new instance of `Ember.View` into a template passing its options
  to the `Ember.View`'s `create` method and using the supplied block as the view's own template.

  An empty `<body>` and the following template:

      <script type="text/x-handlebars">
        A span:
        {{#view tagName="span"}}
          hello.
        {{/view}}
      </script>

  Will result in HTML structure:

      <body>
        <!-- Note: the handlebars template script 
             also results in a rendered Ember.View
             which is the outer <div> here -->

        <div class="ember-view">
          A span:
          <span id="ember1" class="ember-view">
            Hello.
          </span>
        </div>
      </body>

  ### parentView setting

  The `parentView` property of the new `Ember.View` instance created through `{{view}}`
  will be set to the `Ember.View` instance of the template where `{{view}}` was called.

      aView = Ember.View.create({
        template: Ember.Handlebars.compile("{{#view}} my parent: {{parentView.elementId}} {{/view}}")
      })

      aView.appendTo('body')
    
  Will result in HTML structure:

      <div id="ember1" class="ember-view">
        <div id="ember2" class="ember-view">
          my parent: ember1
        </div>
      </div>

  ### Setting CSS id and class attributes

  The HTML `id` attribute can be set on the `{{view}}`'s resulting element with the `id` option.
  This option will _not_ be passed to `Ember.View.create`.

      <script type="text/x-handlebars">
        {{#view tagName="span" id="a-custom-id"}}
          hello.
        {{/view}}
      </script>

  Results in the following HTML structure:

      <div class="ember-view">
        <span id="a-custom-id" class="ember-view">
          hello.
        </span>
      </div>

  The HTML `class` attribute can be set on the `{{view}}`'s resulting element with
  the `class` or `classNameBindings` options. The `class` option
  will directly set the CSS `class` attribute and will not be passed to
  `Ember.View.create`. `classNameBindings` will be passed to `create` and use
  `Ember.View`'s class name binding functionality:

      <script type="text/x-handlebars">
        {{#view tagName="span" class="a-custom-class"}}
          hello.
        {{/view}}
      </script>

  Results in the following HTML structure:

      <div class="ember-view">
        <span id="ember2" class="ember-view a-custom-class">
          hello.
        </span>
      </div>

  ### Supplying a different view class
  `{{view}}` can take an optional first argument before its supplied options to specify a
  path to a custom view class.

      <script type="text/x-handlebars">
        {{#view "MyApp.CustomView"}}
          hello.
        {{/view}}
      </script>

  The first argument can also be a relative path. Ember will search for the view class
  starting at the `Ember.View` of the template where `{{view}}` was used as the root object:

      MyApp = Ember.Application.create({})
      MyApp.OuterView = Ember.View.extend({
        innerViewClass: Ember.View.extend({
          classNames: ['a-custom-view-class-as-property']
        }),
        template: Ember.Handlebars.compile('{{#view "innerViewClass"}} hi {{/view}}')
      })

      MyApp.OuterView.create().appendTo('body')

Will result in the following HTML:

      <div id="ember1" class="ember-view">
        <div id="ember2" class="ember-view a-custom-view-class-as-property"> 
          hi
        </div>
      </div>

  ### Blockless use

  If you supply a custom `Ember.View` subclass that specifies its own template
  or provide a `templateName` option to `{{view}}` it can be used without supplying a block.
  Attempts to use both a `templateName` option and supply a block will throw an error.

      <script type="text/x-handlebars">
        {{view "MyApp.ViewWithATemplateDefined"}}
      </script>

  ### viewName property

  You can supply a `viewName` option to `{{view}}`. The `Ember.View` instance will
  be referenced as a property of its parent view by this name.

      aView = Ember.View.create({
        template: Ember.Handlebars.compile('{{#view viewName="aChildByName"}} hi {{/view}}')
      })

      aView.appendTo('body')
      aView.get('aChildByName') // the instance of Ember.View created by {{view}} helper

  @name Handlebars.helpers.view
  @param {String} path
  @param {Hash} options
  @returns {String} HTML string
*/
EmberHandlebars.registerHelper('view', function(path, options) {
  Ember.assert("The view helper only takes a single argument", arguments.length <= 2);

  // If no path is provided, treat path param as options.
  if (path && path.data && path.data.isRenderData) {
    options = path;
    path = "Ember.View";
  }

  return EmberHandlebars.ViewHelper.helper(this, path, options);
});


})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals Handlebars */

// TODO: Don't require all of this module
var get = Ember.get, getPath = Ember.Handlebars.getPath, fmt = Ember.String.fmt;

/**
  `{{collection}}` is a `Ember.Handlebars` helper for adding instances of
  `Ember.CollectionView` to a template.  See `Ember.CollectionView` for additional
  information on how a `CollectionView` functions.

  `{{collection}}`'s primary use is as a block helper with a `contentBinding` option
  pointing towards an `Ember.Array`-compatible object.  An `Ember.View` instance will
  be created for each item in its `content` property. Each view will have its own
  `content` property set to the appropriate item in the collection.

  The provided block will be applied as the template for each item's view.

  Given an empty `<body>` the following template:

      <script type="text/x-handlebars">
        {{#collection contentBinding="App.items"}}
          Hi {{content.name}}
        {{/collection}}
      </script>

  And the following application code

      App = Ember.Application.create()
      App.items = [
        Ember.Object.create({name: 'Dave'}),
        Ember.Object.create({name: 'Mary'}),
        Ember.Object.create({name: 'Sara'})
      ]

  Will result in the HTML structure below

      <div class="ember-view">
        <div class="ember-view">Hi Dave</div>
        <div class="ember-view">Hi Mary</div>
        <div class="ember-view">Hi Sara</div>
      </div>

  ### Blockless Use
  If you provide an `itemViewClass` option that has its own `template` you can omit
  the block.

  The following template:

      <script type="text/x-handlebars">
        {{collection contentBinding="App.items" itemViewClass="App.AnItemView"}}
      </script>

  And application code

      App = Ember.Application.create()
      App.items = [
        Ember.Object.create({name: 'Dave'}),
        Ember.Object.create({name: 'Mary'}),
        Ember.Object.create({name: 'Sara'})
      ]

      App.AnItemView = Ember.View.extend({
        template: Ember.Handlebars.compile("Greetings {{content.name}}")
      })

  Will result in the HTML structure below

      <div class="ember-view">
        <div class="ember-view">Greetings Dave</div>
        <div class="ember-view">Greetings Mary</div>
        <div class="ember-view">Greetings Sara</div>
      </div>

  ### Specifying a CollectionView subclass
  By default the `{{collection}}` helper will create an instance of `Ember.CollectionView`.
  You can supply a `Ember.CollectionView` subclass to the helper by passing it
  as the first argument:

      <script type="text/x-handlebars">
        {{#collection App.MyCustomCollectionClass contentBinding="App.items"}}
          Hi {{content.name}}
        {{/collection}}
      </script>


  ### Forwarded `item.*`-named Options
  As with the `{{view}}`, helper options passed to the `{{collection}}` will be set on
  the resulting `Ember.CollectionView` as properties. Additionally, options prefixed with
  `item` will be applied to the views rendered for each item (note the camelcasing):

        <script type="text/x-handlebars">
          {{#collection contentBinding="App.items"
                        itemTagName="p"
                        itemClassNames="greeting"}}
            Howdy {{content.name}}
          {{/collection}}
        </script>

  Will result in the following HTML structure:

      <div class="ember-view">
        <p class="ember-view greeting">Howdy Dave</p>
        <p class="ember-view greeting">Howdy Mary</p>
        <p class="ember-view greeting">Howdy Sara</p>
      </div>
  
  @name Handlebars.helpers.collection
  @param {String} path
  @param {Hash} options
  @returns {String} HTML string
*/
Ember.Handlebars.registerHelper('collection', function(path, options) {
  // If no path is provided, treat path param as options.
  if (path && path.data && path.data.isRenderData) {
    options = path;
    path = undefined;
    Ember.assert("You cannot pass more than one argument to the collection helper", arguments.length === 1);
  } else {
    Ember.assert("You cannot pass more than one argument to the collection helper", arguments.length === 2);
  }

  var fn = options.fn;
  var data = options.data;
  var inverse = options.inverse;

  // If passed a path string, convert that into an object.
  // Otherwise, just default to the standard class.
  var collectionClass;
  collectionClass = path ? getPath(this, path, options) : Ember.CollectionView;
  Ember.assert(fmt("%@ #collection: Could not find collection class %@", [data.view, path]), !!collectionClass);

  var hash = options.hash, itemHash = {}, match;

  // Extract item view class if provided else default to the standard class
  var itemViewClass, itemViewPath = hash.itemViewClass;
  var collectionPrototype = collectionClass.proto();
  delete hash.itemViewClass;
  itemViewClass = itemViewPath ? getPath(collectionPrototype, itemViewPath, options) : collectionPrototype.itemViewClass;
  Ember.assert(fmt("%@ #collection: Could not find itemViewClass %@", [data.view, itemViewPath]), !!itemViewClass);

  // Go through options passed to the {{collection}} helper and extract options
  // that configure item views instead of the collection itself.
  for (var prop in hash) {
    if (hash.hasOwnProperty(prop)) {
      match = prop.match(/^item(.)(.*)$/);

      if(match) {
        // Convert itemShouldFoo -> shouldFoo
        itemHash[match[1].toLowerCase() + match[2]] = hash[prop];
        // Delete from hash as this will end up getting passed to the
        // {{view}} helper method.
        delete hash[prop];
      }
    }
  }

  var tagName = hash.tagName || collectionPrototype.tagName;

  if (fn) {
    itemHash.template = fn;
    delete options.fn;
  }

  var emptyViewClass;
  if (inverse && inverse !== Handlebars.VM.noop) {
    emptyViewClass = get(collectionPrototype, 'emptyViewClass');
    emptyViewClass = emptyViewClass.extend({
          template: inverse,
          tagName: itemHash.tagName
    });
  } else if (hash.emptyViewClass) {
    emptyViewClass = getPath(this, hash.emptyViewClass, options);
  }
  hash.emptyView = emptyViewClass;

  if (hash.eachHelper === 'each') {
    itemHash._context = Ember.computed(function() {
      return get(this, 'content');
    }).property('content');
    delete hash.eachHelper;
  }

  var viewOptions = Ember.Handlebars.ViewHelper.propertiesFromHTMLOptions({ data: data, hash: itemHash }, this);
  hash.itemViewClass = itemViewClass.extend(viewOptions);

  return Ember.Handlebars.helpers.view.call(this, collectionClass, options);
});




})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals Handlebars */
var getPath = Ember.Handlebars.getPath;

/**
  `unbound` allows you to output a property without binding. *Important:* The
  output will not be updated if the property changes. Use with caution.

      <div>{{unbound somePropertyThatDoesntChange}}</div>

  @name Handlebars.helpers.unbound
  @param {String} property
  @returns {String} HTML string
*/
Ember.Handlebars.registerHelper('unbound', function(property, fn) {
  var context = (fn.contexts && fn.contexts[0]) || this;
  return getPath(context, property, fn);
});

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

/*jshint debug:true*/
var getPath = Ember.Handlebars.getPath, normalizePath = Ember.Handlebars.normalizePath;

/**
  `log` allows you to output the value of a value in the current rendering
  context.

      {{log myVariable}}

  @name Handlebars.helpers.log
  @param {String} property
*/
Ember.Handlebars.registerHelper('log', function(property, options) {
  var context = (options.contexts && options.contexts[0]) || this,
      normalized = normalizePath(context, property, options.data),
      pathRoot = normalized.root,
      path = normalized.path,
      value = (path === 'this') ? pathRoot : getPath(pathRoot, path, options);
  Ember.Logger.log(value);
});

/**
  The `debugger` helper executes the `debugger` statement in the current
  context.

      {{debugger}}

  @name Handlebars.helpers.debugger
  @param {String} property
*/
Ember.Handlebars.registerHelper('debugger', function() {
  debugger;
});

})();



(function() {
var get = Ember.get, set = Ember.set;

Ember.Handlebars.EachView = Ember.CollectionView.extend(Ember._Metamorph, {
  itemViewClass: Ember._MetamorphView,
  emptyViewClass: Ember._MetamorphView,

  createChildView: function(view, attrs) {
    view = this._super(view, attrs);

    // At the moment, if a container view subclass wants
    // to insert keywords, it is responsible for cloning
    // the keywords hash. This will be fixed momentarily.
    var keyword = get(this, 'keyword');

    if (keyword) {
      var data = get(view, 'templateData');

      data = Ember.copy(data);
      data.keywords = view.cloneKeywords();
      set(view, 'templateData', data);

      var content = get(view, 'content');

      // In this case, we do not bind, because the `content` of
      // a #each item cannot change.
      data.keywords[keyword] = content;
    }

    return view;
  }
});

Ember.Handlebars.registerHelper('each', function(path, options) {
  if (arguments.length === 4) {
    Ember.assert("If you pass more than one argument to the each helper, it must be in the form #each foo in bar", arguments[1] === "in");

    var keywordName = arguments[0];

    options = arguments[3];
    path = arguments[2];
    if (path === '') { path = "this"; }

    options.hash.keyword = keywordName;
  } else {
    options.hash.eachHelper = 'each';
  }

  Ember.assert("You must pass a block to the each helper", options.fn && options.fn !== Handlebars.VM.noop);

  options.hash.contentBinding = path;
  // Set up emptyView as a metamorph with no tag
  //options.hash.emptyViewClass = Ember._MetamorphView;

  return Ember.Handlebars.helpers.collection.call(this, 'Ember.Handlebars.EachView', options);
});

})();



(function() {
/**
  `template` allows you to render a template from inside another template.
  This allows you to re-use the same template in multiple places. For example:

      <script type="text/x-handlebars">
        {{#with loggedInUser}}
          Last Login: {{lastLogin}}
          User Info: {{template "user_info"}}
        {{/with}}
      </script>

      <script type="text/x-handlebars" data-template-name="user_info">
        Name: <em>{{name}}</em>
        Karma: <em>{{karma}}</em>
      </script>

  This helper looks for templates in the global Ember.TEMPLATES hash. If you
  add &lt;script&gt; tags to your page with the `data-template-name` attribute set,
  they will be compiled and placed in this hash automatically.

  You can also manually register templates by adding them to the hash:

      Ember.TEMPLATES["my_cool_template"] = Ember.Handlebars.compile('<b>{{user}}</b>');

  @name Handlebars.helpers.template
  @param {String} templateName the template to render
*/

Ember.Handlebars.registerHelper('template', function(name, options) {
  var template = Ember.TEMPLATES[name];

  Ember.assert("Unable to find template with name '"+name+"'.", !!template);

  Ember.TEMPLATES[name](this, { data: options.data });
});

})();



(function() {
var EmberHandlebars = Ember.Handlebars, getPath = EmberHandlebars.getPath, get = Ember.get;

var ActionHelper = EmberHandlebars.ActionHelper = {
  registeredActions: {}
};

ActionHelper.registerAction = function(actionName, eventName, target, view, context) {
  var actionId = (++Ember.$.uuid).toString();

  ActionHelper.registeredActions[actionId] = {
    eventName: eventName,
    handler: function(event) {
      event.view = view;
      event.context = context;

      // Check for StateManager (or compatible object)
      if (target.isState && typeof target.send === 'function') {
        return target.send(actionName, event);
      } else {
        Ember.assert(Ember.String.fmt('Target %@ does not have action %@', [target, actionName]), target[actionName]);
        return target[actionName].call(target, event);
      }
    }
  };

  view.on('willRerender', function() {
    delete ActionHelper.registeredActions[actionId];
  });

  return actionId;
};

/**
  The `{{action}}` helper registers an HTML element within a template for
  DOM event handling.  User interaction with that element will call the method
  on the template's associated `Ember.View` instance that has the same name
  as the first provided argument to `{{action}}`:

  Given the following Handlebars template on the page

      <script type="text/x-handlebars" data-template-name='a-template'>
        <div {{action "anActionName"}}>
          click me
        </div>
      </script>

  And application code

      AView = Ember.View.extend({
        templateName; 'a-template',
        anActionName: function(event){}
      });

      aView = AView.create();
      aView.appendTo('body');

  Will results in the following rendered HTML

      <div class="ember-view">
        <div data-ember-action="1">
          click me
        </div>
      </div>

  Clicking "click me" will trigger the `anActionName` method of the `aView`
  object with a  `jQuery.Event` object as its argument. The `jQuery.Event`
  object will be extended to include a `view` property that is set to the
  original view interacted with (in this case the `aView` object).

  ### Event Propagation

  Events triggered through the action helper will automatically have
  `.preventDefault()` called on them. You do not need to do so in your event
  handlers. To stop propagation of the event, simply return `false` from your
  handler.

  If you need the default handler to trigger you should either register your
  own event handler, or use event methods on your view class.

  ### Specifying an Action Target

  A `target` option can be provided to change which object will receive the
  method call. This option must be a string representing a path to an object:

      <script type="text/x-handlebars" data-template-name='a-template'>
        <div {{action "anActionName" target="MyApplication.someObject"}}>
          click me
        </div>
      </script>

  Clicking "click me" in the rendered HTML of the above template will trigger
  the  `anActionName` method of the object at `MyApplication.someObject`.
  The first argument to this method will be a `jQuery.Event` extended to
  include a `view` property that is set to the original view interacted with.

  A path relative to the template's `Ember.View` instance can also be used as
  a target:

      <script type="text/x-handlebars" data-template-name='a-template'>
        <div {{action "anActionName" target="parentView"}}>
          click me
        </div>
      </script>

  Clicking "click me" in the rendered HTML of the above template will trigger
  the `anActionName` method of the view's parent view.

  The `{{action}}` helper is `Ember.StateManager` aware. If the target of the
  action is an `Ember.StateManager` instance `{{action}}` will use the `send`
  functionality of StateManagers. The documentation for `Ember.StateManager`
  has additional information about this use.

  If an action's target does not implement a method that matches the supplied
  action name an error will be thrown.

      <script type="text/x-handlebars" data-template-name='a-template'>
        <div {{action "aMethodNameThatIsMissing"}}>
          click me
        </div>
      </script>

  With the following application code

      AView = Ember.View.extend({
        templateName; 'a-template',
        // note: no method 'aMethodNameThatIsMissing'
        anActionName: function(event){}
      });

      aView = AView.create();
      aView.appendTo('body');

  Will throw `Uncaught TypeError: Cannot call method 'call' of undefined` when
  "click me" is clicked.

  ### Specifying DOM event type

  By default the `{{action}}` helper registers for DOM `click` events. You can
  supply an `on` option to the helper to specify a different DOM event name:

      <script type="text/x-handlebars" data-template-name='a-template'>
        <div {{action "aMethodNameThatIsMissing" on="doubleClick"}}>
          click me
        </div>
      </script>

  See `Ember.EventDispatcher` for a list of acceptable DOM event names.

  Because `{{action}}` depends on Ember's event dispatch system it will only
  function if an `Ember.EventDispatcher` instance is available. An
  `Ember.EventDispatcher` instance will be created when a new
  `Ember.Application` is created. Having an instance of `Ember.Application`
  will satisfy this requirement.

  ### Specifying a context

  By default the `{{action}}` helper passes the current Handlebars context
  along in the `jQuery.Event` object. You may specify an alternative object to
  pass as the context by providing a property path:

      <script type="text/x-handlebars" data-template-name='a-template'>
        {{#each person in people}}
          <div {{action "edit" context="person"}}>
            click me
          </div>
        {{/each}}
      </script>

  @name Handlebars.helpers.action
  @param {String} actionName
  @param {Hash} options
*/
EmberHandlebars.registerHelper('action', function(actionName, options) {
  var hash = options.hash,
      eventName = hash.on || "click",
      view = options.data.view,
      target, context, controller;

  view = get(view, 'concreteView');

  if (hash.target) {
    target = getPath(this, hash.target, options);
  } else if (controller = options.data.keywords.controller) {
    target = get(controller, 'target');
  }

  target = target || view;

  context = hash.context ? getPath(this, hash.context, options) : options.contexts[0];

  var output = [], url;

  if (hash.href && target.urlForEvent) {
    url = target.urlForEvent(actionName, context);
    output.push('href="' + url + '"');
  }

  var actionId = ActionHelper.registerAction(actionName, eventName, target, view, context);
  output.push('data-ember-action="' + actionId + '"');

  return new EmberHandlebars.SafeString(output.join(" "));
});

})();



(function() {
var get = Ember.get, set = Ember.set;

/**

  When used in a Handlebars template that is assigned to an `Ember.View` instance's
  `layout` property Ember will render the layout template first, inserting the view's
  own rendered output at the `{{ yield }}` location.

  An empty `<body>` and the following application code:

      AView = Ember.View.extend({
        classNames: ['a-view-with-layout'],
        layout: Ember.Handlebars.compile('<div class="wrapper">{{ yield }}</div>'),
        template: Ember.Handlebars.compile('<span>I am wrapped</span>')
      })

      aView = AView.create()
      aView.appendTo('body')

  Will result in the following HTML output:

      <body>
        <div class='ember-view a-view-with-layout'>
          <div class="wrapper">
            <span>I am wrapped</span>
          </div>
        </div>
      </body>

  The yield helper cannot be used outside of a template assigned to an `Ember.View`'s `layout` property
  and will throw an error if attempted.

      BView = Ember.View.extend({
        classNames: ['a-view-with-layout'],
        template: Ember.Handlebars.compile('{{yield}}')
      })

      bView = BView.create()
      bView.appendTo('body')

      // throws
      // Uncaught Error: assertion failed: You called yield in a template that was not a layout

  @name Handlebars.helpers.yield
  @param {Hash} options
  @returns {String} HTML string
*/
Ember.Handlebars.registerHelper('yield', function(options) {
  var view = options.data.view, template;

  while (view && !get(view, 'layout')) {
    view = get(view, 'parentView');
  }

  Ember.assert("You called yield in a template that was not a layout", !!view);

  template = get(view, 'template');

  if (template) { template(this, options); }
});

})();



(function() {
/**
  The `outlet` helper allows you to specify that the current
  view's controller will fill in the view for a given area.

      {{outlet}}

  By default, when the the current controller's `view`
  property changes, the outlet will replace its current
  view with the new view.

      controller.set('view', someView);

  You can also specify a particular name, other than view:

      {{outlet masterView}}
      {{outlet detailView}}

  Then, you can control several outlets from a single
  controller:

      controller.set('masterView', postsView);
      controller.set('detailView', postView);

  @name Handlebars.helpers.outlet
  @param {String} property the property on the controller
    that holds the view for this outlet
*/
Ember.Handlebars.registerHelper('outlet', function(property, options) {
  if (property && property.data && property.data.isRenderData) {
    options = property;
    property = 'view';
  }

  options.hash.currentViewBinding = "controller." + property;

  return Ember.Handlebars.helpers.view.call(this, Ember.ContainerView, options);
});

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var set = Ember.set, get = Ember.get;

/**
  @class

  Creates an HTML input of type 'checkbox' with HTML related properties 
  applied directly to the input.

      {{view Ember.Checkbox classNames="applicaton-specific-checkbox"}}

      <input id="ember1" class="ember-view ember-checkbox applicaton-specific-checkbox" type="checkbox">

  You can add a `label` tag yourself in the template where the Ember.Checkbox is being used.

      <label>
        Some Title
        {{view Ember.Checkbox classNames="applicaton-specific-checkbox"}}
      </label>


  The `checked` attribute of an Ember.Checkbox object should always be set
  through the Ember object or by interacting with its rendered element representation
  via the mouse, keyboard, or touch.  Updating the value of the checkbox via jQuery will
  result in the checked value of the object and its element losing synchronization.
  
  ## Layout and LayoutName properties
  Because HTML `input` elements are self closing `layout` and `layoutName` properties will
  not be applied. See `Ember.View`'s layout section for more information.

*/
Ember.Checkbox = Ember.View.extend({
  classNames: ['ember-checkbox'],

  tagName: 'input',

  attributeBindings: ['type', 'checked', 'disabled'],

  type: "checkbox",
  checked: false,
  disabled: false,

  init: function() {
    this._super();
    this.on("change", this, this._updateElementValue);
  },

  /**
    @private
  */
  _updateElementValue: function() {
    set(this, 'checked', this.$().prop('checked'));
  }
});

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set;

/** @class */
Ember.TextSupport = Ember.Mixin.create(
/** @scope Ember.TextSupport.prototype */ {

  value: "",

  attributeBindings: ['placeholder', 'disabled', 'maxlength'],
  placeholder: null,
  disabled: false,
  maxlength: null,

  insertNewline: Ember.K,
  cancel: Ember.K,

  init: function() {
    this._super();
    this.on("focusOut", this, this._elementValueDidChange);
    this.on("change", this, this._elementValueDidChange);
    this.on("keyUp", this, this.interpretKeyEvents);
  },

  /**
    @private
  */
  interpretKeyEvents: function(event) {
    var map = Ember.TextSupport.KEY_EVENTS;
    var method = map[event.keyCode];

    this._elementValueDidChange();
    if (method) { return this[method](event); }
  },

  _elementValueDidChange: function() {
    set(this, 'value', this.$().val());
  }

});

Ember.TextSupport.KEY_EVENTS = {
  13: 'insertNewline',
  27: 'cancel'
};

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set;

/**
  @class

  The `Ember.TextField` view class renders a text
  [input](https://developer.mozilla.org/en/HTML/Element/Input) element. It
  allows for binding Ember properties to the text field contents (`value`),
  live-updating as the user inputs text.

  Example:

      {{view Ember.TextField valueBinding="firstName"}}

  ## Layout and LayoutName properties
  Because HTML `input` elements are self closing `layout` and `layoutName` properties will
  not be applied. See `Ember.View`'s layout section for more information.
  
  @extends Ember.TextSupport
*/
Ember.TextField = Ember.View.extend(Ember.TextSupport,
  /** @scope Ember.TextField.prototype */ {

  classNames: ['ember-text-field'],
  tagName: "input",
  attributeBindings: ['type', 'value', 'size'],

  /**
    The value attribute of the input element. As the user inputs text, this
    property is updated live.

    @type String
    @default ""
  */
  value: "",

  /**
    The type attribute of the input element.

    @type String
    @default "text"
  */
  type: "text",

  /**
    The size of the text field in characters.

    @type String
    @default null
  */
  size: null
});

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set;

Ember.Button = Ember.View.extend(Ember.TargetActionSupport, {
  classNames: ['ember-button'],
  classNameBindings: ['isActive'],

  tagName: 'button',

  propagateEvents: false,

  attributeBindings: ['type', 'disabled', 'href'],

  /** @private
    Overrides TargetActionSupport's targetObject computed
    property to use Handlebars-specific path resolution.
  */
  targetObject: Ember.computed(function() {
    var target = get(this, 'target'),
        root = get(this, 'context'),
        data = get(this, 'templateData');

    if (typeof target !== 'string') { return target; }

    return Ember.Handlebars.getPath(root, target, { data: data });
  }).property('target').cacheable(),

  // Defaults to 'button' if tagName is 'input' or 'button'
  type: Ember.computed(function(key, value) {
    var tagName = this.get('tagName');
    if (value !== undefined) { this._type = value; }
    if (this._type !== undefined) { return this._type; }
    if (tagName === 'input' || tagName === 'button') { return 'button'; }
  }).property('tagName').cacheable(),

  disabled: false,

  // Allow 'a' tags to act like buttons
  href: Ember.computed(function() {
    return this.get('tagName') === 'a' ? '#' : null;
  }).property('tagName').cacheable(),

  mouseDown: function() {
    if (!get(this, 'disabled')) {
      set(this, 'isActive', true);
      this._mouseDown = true;
      this._mouseEntered = true;
    }
    return get(this, 'propagateEvents');
  },

  mouseLeave: function() {
    if (this._mouseDown) {
      set(this, 'isActive', false);
      this._mouseEntered = false;
    }
  },

  mouseEnter: function() {
    if (this._mouseDown) {
      set(this, 'isActive', true);
      this._mouseEntered = true;
    }
  },

  mouseUp: function(event) {
    if (get(this, 'isActive')) {
      // Actually invoke the button's target and action.
      // This method comes from the Ember.TargetActionSupport mixin.
      this.triggerAction();
      set(this, 'isActive', false);
    }

    this._mouseDown = false;
    this._mouseEntered = false;
    return get(this, 'propagateEvents');
  },

  keyDown: function(event) {
    // Handle space or enter
    if (event.keyCode === 13 || event.keyCode === 32) {
      this.mouseDown();
    }
  },

  keyUp: function(event) {
    // Handle space or enter
    if (event.keyCode === 13 || event.keyCode === 32) {
      this.mouseUp();
    }
  },

  // TODO: Handle proper touch behavior.  Including should make inactive when
  // finger moves more than 20x outside of the edge of the button (vs mouse
  // which goes inactive as soon as mouse goes out of edges.)

  touchStart: function(touch) {
    return this.mouseDown(touch);
  },

  touchEnd: function(touch) {
    return this.mouseUp(touch);
  },

  init: function() {
    Ember.deprecate("Ember.Button is deprecated and will be removed from future releases. Consider using the `{{action}}` helper.");
    this._super();
  }
});

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var get = Ember.get, set = Ember.set;

/**
  @class

  The `Ember.TextArea` view class renders a
  [textarea](https://developer.mozilla.org/en/HTML/Element/textarea) element.
  It allows for binding Ember properties to the text area contents (`value`),
  live-updating as the user inputs text.

  ## Layout and LayoutName properties

  Because HTML `textarea` elements do not contain inner HTML the `layout` and `layoutName` 
  properties will not be applied. See `Ember.View`'s layout section for more information.

  @extends Ember.TextSupport
*/
Ember.TextArea = Ember.View.extend(Ember.TextSupport,
/** @scope Ember.TextArea.prototype */ {

  classNames: ['ember-text-area'],

  tagName: "textarea",
  attributeBindings: ['rows', 'cols'],
  rows: null,
  cols: null,

  _updateElementValue: Ember.observer(function() {
    // We do this check so cursor position doesn't get affected in IE
    var value = get(this, 'value');
    if (value !== this.$().val()) {
      this.$().val(value);
    }
  }, 'value'),

  init: function() {
    this._super();
    this.on("didInsertElement", this, this._updateElementValue);
  }

});

})();



(function() {
Ember.TabContainerView = Ember.View.extend({
  init: function() {
    Ember.deprecate("Ember.TabContainerView is deprecated and will be removed from future releases.");
    this._super();
  }
});

})();



(function() {
var get = Ember.get, getPath = Ember.getPath;

Ember.TabPaneView = Ember.View.extend({
  tabsContainer: Ember.computed(function() {
    return this.nearestInstanceOf(Ember.TabContainerView);
  }).property().volatile(),

  isVisible: Ember.computed(function() {
    return get(this, 'viewName') === getPath(this, 'tabsContainer.currentView');
  }).property('tabsContainer.currentView').volatile(),

  init: function() {
    Ember.deprecate("Ember.TabPaneView is deprecated and will be removed from future releases.");
    this._super();
  }
});

})();



(function() {
var get = Ember.get, setPath = Ember.setPath;

Ember.TabView = Ember.View.extend({
  tabsContainer: Ember.computed(function() {
    return this.nearestInstanceOf(Ember.TabContainerView);
  }).property().volatile(),

  mouseUp: function() {
    setPath(this, 'tabsContainer.currentView', get(this, 'value'));
  },

  init: function() {
    Ember.deprecate("Ember.TabView is deprecated and will be removed from future releases.");
    this._super();
  }
});

})();



(function() {

})();



(function() {
/*jshint eqeqeq:false */

var set = Ember.set, get = Ember.get, getPath = Ember.getPath;
var indexOf = Ember.EnumerableUtils.indexOf, indexesOf = Ember.EnumerableUtils.indexesOf;

/**
  @class

  The Ember.Select view class renders a
  [select](https://developer.mozilla.org/en/HTML/Element/select) HTML element,
  allowing the user to choose from a list of options. The selected option(s)
  are updated live in the `selection` property, while the corresponding value
  is updated in the `value` property.

  ### Using Strings
  The simplest version of an Ember.Select takes an array of strings for the options
  of a select box and a valueBinding to set the value.

  Example:

      App.controller = Ember.Object.create({
        selected: null,
        content: [
          "Yehuda",
          "Tom"
        ]
      })

      {{view Ember.Select
             contentBinding="App.controller.content"
             valueBinding="App.controller.selected"
      }}

  Would result in the following HTML:

      <select class="ember-select">
        <option value="Yehuda">Yehuda</option>
        <option value="Tom">Tom</option>
      </select>

  Selecting Yehuda from the select box will set `App.controller.selected` to "Yehuda"

  ### Using Objects
  An Ember.Select can also take an array of JS or Ember objects.

  When using objects you need to supply optionLabelPath and optionValuePath parameters
  which will be used to get the label and value for each of the options.

  Usually you will bind to either the selection or the value attribute of the select.

  Use selectionBinding if you would like to set the whole object as a property on the target.
  Use valueBinding if you would like to set just the value.

  Example using selectionBinding:

      App.controller = Ember.Object.create({
        selectedPerson: null,
        selectedPersonId: null,
        content: [
          Ember.Object.create({firstName: "Yehuda", id: 1}),
          Ember.Object.create({firstName: "Tom",    id: 2})
        ]
      })

      {{view Ember.Select
             contentBinding="App.controller.content"
             optionLabelPath="content.firstName"
             optionValuePath="content.id"
             selectionBinding="App.controller.selectedPerson"
             prompt="Please Select"}}

      <select class="ember-select">
        <option value>Please Select</option>
        <option value="1">Yehuda</option>
        <option value="2">Tom</option>
      </select>

  Selecting Yehuda here will set `App.controller.selectedPerson` to
  the Yehuda object.

  Example using valueBinding:

      {{view Ember.Select
             contentBinding="App.controller.content"
             optionLabelPath="content.firstName"
             optionValuePath="content.id"
             valueBinding="App.controller.selectedPersonId"
             prompt="Please Select"}}

  Selecting Yehuda in this case will set `App.controller.selectedPersonId` to 1.

  @extends Ember.View
*/
Ember.Select = Ember.View.extend(
  /** @scope Ember.Select.prototype */ {

  tagName: 'select',
  classNames: ['ember-select'],
  defaultTemplate: Ember.Handlebars.compile('{{#if view.prompt}}<option value>{{view.prompt}}</option>{{/if}}{{#each view.content}}{{view Ember.SelectOption contentBinding="this"}}{{/each}}'),
  attributeBindings: ['multiple'],

  /**
    The `multiple` attribute of the select element. Indicates whether multiple
    options can be selected.

    @type Boolean
    @default false
  */
  multiple: false,

  /**
    The list of options.

    If `optionLabelPath` and `optionValuePath` are not overridden, this should
    be a list of strings, which will serve simultaneously as labels and values.

    Otherwise, this should be a list of objects. For instance:

        content: Ember.A([
            { id: 1, firstName: 'Yehuda' },
            { id: 2, firstName: 'Tom' }
          ])),
        optionLabelPath: 'content.firstName',
        optionValuePath: 'content.id'

    @type Array
    @default null
  */
  content: null,

  /**
    When `multiple` is false, the element of `content` that is currently
    selected, if any.

    When `multiple` is true, an array of such elements.

    @type Object or Array
    @default null
  */
  selection: null,

  /**
    In single selection mode (when `multiple` is false), value can be used to get
    the current selection's value or set the selection by it's value.

    It is not currently supported in multiple selection mode.

    @type String
    @default null
  */
  value: Ember.computed(function(key, value) {
    if (arguments.length === 2) { return value; }

    var valuePath = get(this, 'optionValuePath').replace(/^content\.?/, '');
    return valuePath ? getPath(this, 'selection.' + valuePath) : get(this, 'selection');
  }).property('selection').cacheable(),

  /**
    If given, a top-most dummy option will be rendered to serve as a user
    prompt.

    @type String
    @default null
  */
  prompt: null,

  /**
    The path of the option labels. See `content`.

    @type String
    @default 'content'
  */
  optionLabelPath: 'content',

  /**
    The path of the option values. See `content`.

    @type String
    @default 'content'
  */
  optionValuePath: 'content',

  _change: function() {
    if (get(this, 'multiple')) {
      this._changeMultiple();
    } else {
      this._changeSingle();
    }
  },

  selectionDidChange: Ember.observer(function() {
    var selection = get(this, 'selection'),
        isArray = Ember.isArray(selection);
    if (get(this, 'multiple')) {
      if (!isArray) {
        set(this, 'selection', Ember.A([selection]));
        return;
      }
      this._selectionDidChangeMultiple();
    } else {
      this._selectionDidChangeSingle();
    }
  }, 'selection'),

  valueDidChange: Ember.observer(function() {
    var content = get(this, 'content'),
        value = get(this, 'value'),
        valuePath = get(this, 'optionValuePath').replace(/^content\.?/, ''),
        selectedValue = (valuePath ? getPath(this, 'selection.' + valuePath) : get(this, 'selection')),
        selection;

    if (value !== selectedValue) {
      selection = content.find(function(obj) {
        return value === (valuePath ? get(obj, valuePath) : obj);
      });

      this.set('selection', selection);
    }
  }, 'value'),


  _triggerChange: function() {
    var selection = get(this, 'selection');

    if (selection) { this.selectionDidChange(); }

    this._change();
  },

  _changeSingle: function() {
    var selectedIndex = this.$()[0].selectedIndex,
        content = get(this, 'content'),
        prompt = get(this, 'prompt');

    if (!content) { return; }
    if (prompt && selectedIndex === 0) { set(this, 'selection', null); return; }

    if (prompt) { selectedIndex -= 1; }
    set(this, 'selection', content.objectAt(selectedIndex));
  },

  _changeMultiple: function() {
    var options = this.$('option:selected'),
        prompt = get(this, 'prompt'),
        offset = prompt ? 1 : 0,
        content = get(this, 'content');

    if (!content){ return; }
    if (options) {
      var selectedIndexes = options.map(function(){
        return this.index - offset;
      }).toArray();
      set(this, 'selection', content.objectsAt(selectedIndexes));
    }
  },

  _selectionDidChangeSingle: function() {
    var el = this.$()[0],
        content = get(this, 'content'),
        selection = get(this, 'selection'),
        selectionIndex = content ? indexOf(content, selection) : -1,
        prompt = get(this, 'prompt');

    if (prompt) { selectionIndex += 1; }
    if (el) { el.selectedIndex = selectionIndex; }
  },

  _selectionDidChangeMultiple: function() {
    var content = get(this, 'content'),
        selection = get(this, 'selection'),
        selectedIndexes = content ? indexesOf(content, selection) : [-1],
        prompt = get(this, 'prompt'),
        offset = prompt ? 1 : 0,
        options = this.$('option'),
        adjusted;

    if (options) {
      options.each(function() {
        adjusted = this.index > -1 ? this.index + offset : -1;
        this.selected = indexOf(selectedIndexes, adjusted) > -1;
      });
    }
  },

  init: function() {
    this._super();
    this.on("didInsertElement", this, this._triggerChange);
    this.on("change", this, this._change);
  }
});

Ember.SelectOption = Ember.View.extend({
  tagName: 'option',
  attributeBindings: ['value', 'selected'],

  defaultTemplate: function(context, options) {
    options = { data: options.data, hash: {} };
    Ember.Handlebars.helpers.bind.call(context, "view.label", options);
  },

  init: function() {
    this.labelPathDidChange();
    this.valuePathDidChange();

    this._super();
  },

  selected: Ember.computed(function() {
    var content = get(this, 'content'),
        selection = getPath(this, 'parentView.selection');
    if (getPath(this, 'parentView.multiple')) {
      return selection && indexOf(selection, content) > -1;
    } else {
      // Primitives get passed through bindings as objects... since
      // `new Number(4) !== 4`, we use `==` below
      return content == selection;
    }
  }).property('content', 'parentView.selection').volatile(),

  labelPathDidChange: Ember.observer(function() {
    var labelPath = getPath(this, 'parentView.optionLabelPath');

    if (!labelPath) { return; }

    Ember.defineProperty(this, 'label', Ember.computed(function() {
      return getPath(this, labelPath);
    }).property(labelPath).cacheable());
  }, 'parentView.optionLabelPath'),

  valuePathDidChange: Ember.observer(function() {
    var valuePath = getPath(this, 'parentView.optionValuePath');

    if (!valuePath) { return; }

    Ember.defineProperty(this, 'value', Ember.computed(function() {
      return getPath(this, valuePath);
    }).property(valuePath).cacheable());
  }, 'parentView.optionValuePath')
});


})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals Handlebars */
// Find templates stored in the head tag as script tags and make them available
// to Ember.CoreView in the global Ember.TEMPLATES object. This will be run as as
// jQuery DOM-ready callback.
//
// Script tags with "text/x-handlebars" will be compiled
// with Ember's Handlebars and are suitable for use as a view's template.
// Those with type="text/x-raw-handlebars" will be compiled with regular
// Handlebars and are suitable for use in views' computed properties.
Ember.Handlebars.bootstrap = function(ctx) {
  var selectors = 'script[type="text/x-handlebars"], script[type="text/x-raw-handlebars"]';

  if (Ember.ENV.LEGACY_HANDLEBARS_TAGS) { selectors += ', script[type="text/html"]'; }

  Ember.warn("Ember no longer parses text/html script tags by default. Set ENV.LEGACY_HANDLEBARS_TAGS = true to restore this functionality.", Ember.ENV.LEGACY_HANDLEBARS_TAGS || Ember.$('script[type="text/html"]').length === 0);

  Ember.$(selectors, ctx)
    .each(function() {
    // Get a reference to the script tag
    var script = Ember.$(this),
        type   = script.attr('type');

    var compile = (script.attr('type') === 'text/x-raw-handlebars') ?
                  Ember.$.proxy(Handlebars.compile, Handlebars) :
                  Ember.$.proxy(Ember.Handlebars.compile, Ember.Handlebars),
      // Get the name of the script, used by Ember.View's templateName property.
      // First look for data-template-name attribute, then fall back to its
      // id if no name is found.
      templateName = script.attr('data-template-name') || script.attr('id'),
      template = compile(script.html()),
      view, viewPath, elementId, options;

    if (templateName) {
      // For templates which have a name, we save them and then remove them from the DOM
      Ember.TEMPLATES[templateName] = template;

      // Remove script tag from DOM
      script.remove();
    } else {
      if (script.parents('head').length !== 0) {
        // don't allow inline templates in the head
        throw new Ember.Error("Template found in <head> without a name specified. " +
                         "Please provide a data-template-name attribute.\n" +
                         script.html());
      }

      // For templates which will be evaluated inline in the HTML document, instantiates a new
      // view, and replaces the script tag holding the template with the new
      // view's DOM representation.
      //
      // Users can optionally specify a custom view subclass to use by setting the
      // data-view attribute of the script tag.
      viewPath = script.attr('data-view');
      view = viewPath ? Ember.getPath(viewPath) : Ember.View;

      // Get the id of the script, used by Ember.View's elementId property,
      // Look for data-element-id attribute.
      elementId = script.attr('data-element-id');

      options = { template: template };
      if (elementId) { options.elementId = elementId; }

      view = view.create(options);

      view._insertElementLater(function() {
        script.replaceWith(this.$());

        // Avoid memory leak in IE
        script = null;
      });
    }
  });
};

Ember.$(document).ready(
  function(){
    Ember.Handlebars.bootstrap( Ember.$(document) );
  }
);

})();



(function() {
// ==========================================================================
// Project:   Ember Handlebars Views
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();

