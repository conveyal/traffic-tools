(function() {
// ==========================================================================
// Project:  Ember Metal
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals Em:true ENV */

if ('undefined' === typeof Ember) {
  // Create core object. Make it act like an instance of Ember.Namespace so that
  // objects assigned to it are given a sane string representation.
  Ember = {};
}

/**
  @namespace
  @name Ember
  @version 1.0.pre

  All Ember methods and functions are defined inside of this namespace.
  You generally should not add new properties to this namespace as it may be
  overwritten by future versions of Ember.

  You can also use the shorthand "Em" instead of "Ember".

  Ember-Runtime is a framework that provides core functions for
  Ember including cross-platform functions, support for property
  observing and objects. Its focus is on small size and performance. You can
  use this in place of or along-side other cross-platform libraries such as
  jQuery.

  The core Runtime framework is based on the jQuery API with a number of
  performance optimizations.
*/

// aliases needed to keep minifiers from removing the global context
if ('undefined' !== typeof window) {
  window.Em = window.Ember = Em = Ember;
}

// Make sure these are set whether Ember was already defined or not

Ember.isNamespace = true;

Ember.toString = function() { return "Ember"; };


/**
  @static
  @type String
  @default '1.0.pre'
  @constant
*/
Ember.VERSION = '1.0.pre';

/**
  @static
  @type Hash
  @constant

  Standard environmental variables.  You can define these in a global `ENV`
  variable before loading Ember to control various configuration
  settings.
*/
Ember.ENV = 'undefined' === typeof ENV ? {} : ENV;

Ember.config = Ember.config || {};

// ..........................................................
// BOOTSTRAP
//

/**
  @static
  @type Boolean
  @default true
  @constant

  Determines whether Ember should enhances some built-in object
  prototypes to provide a more friendly API.  If enabled, a few methods
  will be added to Function, String, and Array.  Object.prototype will not be
  enhanced, which is the one that causes most troubles for people.

  In general we recommend leaving this option set to true since it rarely
  conflicts with other code.  If you need to turn it off however, you can
  define an ENV.EXTEND_PROTOTYPES config to disable it.
*/
Ember.EXTEND_PROTOTYPES = (Ember.ENV.EXTEND_PROTOTYPES !== false);


/**
  @static
  @type Boolean
  @default Ember.EXTEND_PROTOTYPES
  @constant

  Determines whether Ember should add ECMAScript 5 shims to older browsers.
*/
Ember.SHIM_ES5 = (Ember.ENV.SHIM_ES5 === false) ? false : Ember.EXTEND_PROTOTYPES;


/**
  @static
  @type Boolean
  @default true
  @constant

  Determines whether computed properties are cacheable by default.
  This option will be removed for the 1.1 release.

  When caching is enabled by default, you can use `volatile()` to disable
  caching on individual computed properties.
*/
Ember.CP_DEFAULT_CACHEABLE = (Ember.ENV.CP_DEFAULT_CACHEABLE !== false);

/**
  @static
  @type Boolean
  @default true
  @constant

  Determines whether views render their templates using themselves
  as the context, or whether it is inherited from the parent. This option
  will be removed in the 1.1 release.

  If you need to update your application to use the new context rules, simply
  prefix property access with `view.`:

      // Before:
      {{#each App.photosController}}
        Photo Title: {{title}}
        {{#view App.InfoView contentBinding="this"}}
          {{content.date}}
          {{content.cameraType}}
          {{otherViewProperty}}
        {{/view}}
      {{/each}}

      // After:
      {{#each App.photosController}}
        Photo Title: {{title}}
        {{#view App.InfoView}}
          {{date}}
          {{cameraType}}
          {{view.otherViewProperty}}
        {{/view}}
      {{/each}}
*/
Ember.VIEW_PRESERVES_CONTEXT = (Ember.ENV.VIEW_PRESERVES_CONTEXT !== false);

/**
  Empty function.  Useful for some operations.

  @returns {Object}
  @private
*/
Ember.K = function() { return this; };

/**
  @namespace
  @name window
  @description The global window object
*/


// Stub out the methods defined by the ember-debug package in case it's not loaded

if ('undefined' === typeof Ember.assert) { Ember.assert = Ember.K; }
if ('undefined' === typeof Ember.warn) { Ember.warn = Ember.K; }
if ('undefined' === typeof Ember.deprecate) { Ember.deprecate = Ember.K; }
if ('undefined' === typeof Ember.deprecateFunc) {
  Ember.deprecateFunc = function(_, func) { return func; };
}

// These are deprecated but still supported

if ('undefined' === typeof ember_assert) { window.ember_assert = Ember.K; }
if ('undefined' === typeof ember_warn) { window.ember_warn = Ember.K; }
if ('undefined' === typeof ember_deprecate) { window.ember_deprecate = Ember.K; }
if ('undefined' === typeof ember_deprecateFunc) {
  /** @private */
  window.ember_deprecateFunc = function(_, func) { return func; };
}


// ..........................................................
// LOGGER
//

/**
  @class

  Inside Ember-Metal, simply uses the window.console object.
  Override this to provide more robust logging functionality.
*/
Ember.Logger = window.console || { log: Ember.K, warn: Ember.K, error: Ember.K };

})();



(function() {
/*jshint newcap:false*/

// NOTE: There is a bug in jshint that doesn't recognize `Object()` without `new`
// as being ok unless both `newcap:false` and not `use strict`.
// https://github.com/jshint/jshint/issues/392

// Testing this is not ideal, but we want to use native functions
// if available, but not to use versions created by libraries like Prototype
/** @private */
var isNativeFunc = function(func) {
  // This should probably work in all browsers likely to have ES5 array methods
  return func && Function.prototype.toString.call(func).indexOf('[native code]') > -1;
};

// From: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/map
/** @private */
var arrayMap = isNativeFunc(Array.prototype.map) ? Array.prototype.map : function(fun /*, thisp */) {
  //"use strict";

  if (this === void 0 || this === null) {
    throw new TypeError();
  }

  var t = Object(this);
  var len = t.length >>> 0;
  if (typeof fun !== "function") {
    throw new TypeError();
  }

  var res = new Array(len);
  var thisp = arguments[1];
  for (var i = 0; i < len; i++) {
    if (i in t) {
      res[i] = fun.call(thisp, t[i], i, t);
    }
  }

  return res;
};

// From: https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/array/foreach
/** @private */
var arrayForEach = isNativeFunc(Array.prototype.forEach) ? Array.prototype.forEach : function(fun /*, thisp */) {
  //"use strict";

  if (this === void 0 || this === null) {
    throw new TypeError();
  }

  var t = Object(this);
  var len = t.length >>> 0;
  if (typeof fun !== "function") {
    throw new TypeError();
  }

  var thisp = arguments[1];
  for (var i = 0; i < len; i++) {
    if (i in t) {
      fun.call(thisp, t[i], i, t);
    }
  }
};

/** @private */
var arrayIndexOf = isNativeFunc(Array.prototype.indexOf) ? Array.prototype.indexOf : function (obj, fromIndex) {
  if (fromIndex === null || fromIndex === undefined) { fromIndex = 0; }
  else if (fromIndex < 0) { fromIndex = Math.max(0, this.length + fromIndex); }
  for (var i = fromIndex, j = this.length; i < j; i++) {
    if (this[i] === obj) { return i; }
  }
  return -1;
};

Ember.ArrayPolyfills = {
  map: arrayMap,
  forEach: arrayForEach,
  indexOf: arrayIndexOf
};

var utils = Ember.EnumerableUtils = {
  map: function(obj, callback, thisArg) {
    return obj.map ? obj.map.call(obj, callback, thisArg) : arrayMap.call(obj, callback, thisArg);
  },

  forEach: function(obj, callback, thisArg) {
    return obj.forEach ? obj.forEach.call(obj, callback, thisArg) : arrayForEach.call(obj, callback, thisArg);
  },

  indexOf: function(obj, element, index) {
    return obj.indexOf ? obj.indexOf.call(obj, element, index) : arrayIndexOf.call(obj, element, index);
  },

  indexesOf: function(obj, elements) {
    return elements === undefined ? [] : utils.map(elements, function(item) {
      return utils.indexOf(obj, item);
    });
  },

  removeObject: function(array, item) {
    var index = utils.indexOf(array, item);
    if (index !== -1) { array.splice(index, 1); }
  }
};


if (Ember.SHIM_ES5) {
  if (!Array.prototype.map) {
    /** @private */
    Array.prototype.map = arrayMap;
  }

  if (!Array.prototype.forEach) {
    /** @private */
    Array.prototype.forEach = arrayForEach;
  }

  if (!Array.prototype.indexOf) {
    /** @private */
    Array.prototype.indexOf = arrayIndexOf;
  }
}

})();



(function() {
// ==========================================================================
// Project:  Ember Metal
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
/*globals Node */
/**
  @class

  Platform specific methods and feature detectors needed by the framework.

  @name Ember.platform
*/
var platform = Ember.platform = {};

/**
  Identical to Object.create().  Implements if not available natively.
  @memberOf Ember.platform
  @name create
*/
Ember.create = Object.create;

if (!Ember.create) {
  /** @private */
  var K = function() {};

  Ember.create = function(obj, props) {
    K.prototype = obj;
    obj = new K();
    if (props) {
      K.prototype = obj;
      for (var prop in props) {
        K.prototype[prop] = props[prop].value;
      }
      obj = new K();
    }
    K.prototype = null;

    return obj;
  };

  Ember.create.isSimulated = true;
}

/** @private */
var defineProperty = Object.defineProperty;
var canRedefineProperties, canDefinePropertyOnDOM;

// Catch IE8 where Object.defineProperty exists but only works on DOM elements
if (defineProperty) {
  try {
    defineProperty({}, 'a',{get:function(){}});
  } catch (e) {
    /** @private */
    defineProperty = null;
  }
}

if (defineProperty) {
  // Detects a bug in Android <3.2 where you cannot redefine a property using
  // Object.defineProperty once accessors have already been set.
  /** @private */
  canRedefineProperties = (function() {
    var obj = {};

    defineProperty(obj, 'a', {
      configurable: true,
      enumerable: true,
      get: function() { },
      set: function() { }
    });

    defineProperty(obj, 'a', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: true
    });

    return obj.a === true;
  })();

  // This is for Safari 5.0, which supports Object.defineProperty, but not
  // on DOM nodes.
  /** @private */
  canDefinePropertyOnDOM = (function(){
    try {
      defineProperty(document.createElement('div'), 'definePropertyOnDOM', {});
      return true;
    } catch(e) { }

    return false;
  })();

  if (!canRedefineProperties) {
    /** @private */
    defineProperty = null;
  } else if (!canDefinePropertyOnDOM) {
    /** @private */
    defineProperty = function(obj, keyName, desc){
      var isNode;

      if (typeof Node === "object") {
        isNode = obj instanceof Node;
      } else {
        isNode = typeof obj === "object" && typeof obj.nodeType === "number" && typeof obj.nodeName === "string";
      }

      if (isNode) {
        // TODO: Should we have a warning here?
        return (obj[keyName] = desc.value);
      } else {
        return Object.defineProperty(obj, keyName, desc);
      }
    };
  }
}

/**
  Identical to Object.defineProperty().  Implements as much functionality
  as possible if not available natively.

  @memberOf Ember.platform
  @name defineProperty
  @param {Object} obj The object to modify
  @param {String} keyName property name to modify
  @param {Object} desc descriptor hash
  @returns {void}
*/
platform.defineProperty = defineProperty;

/**
  Set to true if the platform supports native getters and setters.

  @memberOf Ember.platform
  @name hasPropertyAccessors
*/
platform.hasPropertyAccessors = true;

if (!platform.defineProperty) {
  platform.hasPropertyAccessors = false;

  platform.defineProperty = function(obj, keyName, desc) {
    if (!desc.get) { obj[keyName] = desc.value; }
  };

  platform.defineProperty.isSimulated = true;
}

if (Ember.ENV.MANDATORY_SETTER && !platform.hasPropertyAccessors) {
  Ember.ENV.MANDATORY_SETTER = false;
}

})();



(function() {
// ==========================================================================
// Project:  Ember Metal
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var o_defineProperty = Ember.platform.defineProperty,
    o_create = Ember.create,
    // Used for guid generation...
    GUID_KEY = '__ember'+ (+ new Date()),
    uuid         = 0,
    numberCache  = [],
    stringCache  = {};

var MANDATORY_SETTER = Ember.ENV.MANDATORY_SETTER;

/**
  @private
  @static
  @type String
  @constant

  A unique key used to assign guids and other private metadata to objects.
  If you inspect an object in your browser debugger you will often see these.
  They can be safely ignored.

  On browsers that support it, these properties are added with enumeration
  disabled so they won't show up when you iterate over your properties.
*/
Ember.GUID_KEY = GUID_KEY;

var GUID_DESC = {
  writable:    false,
  configurable: false,
  enumerable:  false,
  value: null
};

/**
  @private

  Generates a new guid, optionally saving the guid to the object that you
  pass in.  You will rarely need to use this method.  Instead you should
  call Ember.guidFor(obj), which return an existing guid if available.

  @param {Object} obj
    Optional object the guid will be used for.  If passed in, the guid will
    be saved on the object and reused whenever you pass the same object
    again.

    If no object is passed, just generate a new guid.

  @param {String} prefix
    Optional prefix to place in front of the guid.  Useful when you want to
    separate the guid into separate namespaces.

  @returns {String} the guid
*/
Ember.generateGuid = function generateGuid(obj, prefix) {
  if (!prefix) prefix = 'ember';
  var ret = (prefix + (uuid++));
  if (obj) {
    GUID_DESC.value = ret;
    o_defineProperty(obj, GUID_KEY, GUID_DESC);
  }
  return ret ;
};

/**
  @private

  Returns a unique id for the object.  If the object does not yet have
  a guid, one will be assigned to it.  You can call this on any object,
  Ember.Object-based or not, but be aware that it will add a _guid property.

  You can also use this method on DOM Element objects.

  @method
  @param obj {Object} any object, string, number, Element, or primitive
  @returns {String} the unique guid for this instance.
*/
Ember.guidFor = function guidFor(obj) {

  // special cases where we don't want to add a key to object
  if (obj === undefined) return "(undefined)";
  if (obj === null) return "(null)";

  var cache, ret;
  var type = typeof obj;

  // Don't allow prototype changes to String etc. to change the guidFor
  switch(type) {
    case 'number':
      ret = numberCache[obj];
      if (!ret) ret = numberCache[obj] = 'nu'+obj;
      return ret;

    case 'string':
      ret = stringCache[obj];
      if (!ret) ret = stringCache[obj] = 'st'+(uuid++);
      return ret;

    case 'boolean':
      return obj ? '(true)' : '(false)';

    default:
      if (obj[GUID_KEY]) return obj[GUID_KEY];
      if (obj === Object) return '(Object)';
      if (obj === Array)  return '(Array)';
      ret = 'ember'+(uuid++);
      GUID_DESC.value = ret;
      o_defineProperty(obj, GUID_KEY, GUID_DESC);
      return ret;
  }
};

// ..........................................................
// META
//

var META_DESC = {
  writable:    true,
  configurable: false,
  enumerable:  false,
  value: null
};

var META_KEY = Ember.GUID_KEY+'_meta';

/**
  The key used to store meta information on object for property observing.

  @static
  @type String
*/
Ember.META_KEY = META_KEY;

// Placeholder for non-writable metas.
var EMPTY_META = {
  descs: {},
  watching: {}
};

if (MANDATORY_SETTER) { EMPTY_META.values = {}; }

Ember.EMPTY_META = EMPTY_META;

if (Object.freeze) Object.freeze(EMPTY_META);

var isDefinePropertySimulated = Ember.platform.defineProperty.isSimulated;

function Meta(obj) {
  this.descs = {};
  this.watching = {};
  this.cache = {};
  this.source = obj;
}

if (isDefinePropertySimulated) {
  // on platforms that don't support enumerable false
  // make meta fail jQuery.isPlainObject() to hide from
  // jQuery.extend() by having a property that fails
  // hasOwnProperty check.
  Meta.prototype.__preventPlainObject__ = true;
}

/**
  @private
  @function

  Retrieves the meta hash for an object.  If 'writable' is true ensures the
  hash is writable for this object as well.

  The meta object contains information about computed property descriptors as
  well as any watched properties and other information.  You generally will
  not access this information directly but instead work with higher level
  methods that manipulate this hash indirectly.

  @param {Object} obj
    The object to retrieve meta for

  @param {Boolean} writable
    Pass false if you do not intend to modify the meta hash, allowing the
    method to avoid making an unnecessary copy.

  @returns {Hash}
*/
Ember.meta = function meta(obj, writable) {

  var ret = obj[META_KEY];
  if (writable===false) return ret || EMPTY_META;

  if (!ret) {
    if (!isDefinePropertySimulated) o_defineProperty(obj, META_KEY, META_DESC);

    ret = new Meta(obj);

    if (MANDATORY_SETTER) { ret.values = {}; }

    obj[META_KEY] = ret;

    // make sure we don't accidentally try to create constructor like desc
    ret.descs.constructor = null;

  } else if (ret.source !== obj) {
    if (!isDefinePropertySimulated) o_defineProperty(obj, META_KEY, META_DESC);

    ret = o_create(ret);
    ret.descs    = o_create(ret.descs);
    ret.watching = o_create(ret.watching);
    ret.cache    = {};
    ret.source   = obj;

    if (MANDATORY_SETTER) { ret.values = o_create(ret.values); }

    obj[META_KEY] = ret;
  }
  return ret;
};

Ember.getMeta = function getMeta(obj, property) {
  var meta = Ember.meta(obj, false);
  return meta[property];
};

Ember.setMeta = function setMeta(obj, property, value) {
  var meta = Ember.meta(obj, true);
  meta[property] = value;
  return value;
};

/**
  @private

  In order to store defaults for a class, a prototype may need to create
  a default meta object, which will be inherited by any objects instantiated
  from the class's constructor.

  However, the properties of that meta object are only shallow-cloned,
  so if a property is a hash (like the event system's `listeners` hash),
  it will by default be shared across all instances of that class.

  This method allows extensions to deeply clone a series of nested hashes or
  other complex objects. For instance, the event system might pass
  ['listeners', 'foo:change', 'ember157'] to `prepareMetaPath`, which will
  walk down the keys provided.

  For each key, if the key does not exist, it is created. If it already
  exists and it was inherited from its constructor, the constructor's
  key is cloned.

  You can also pass false for `writable`, which will simply return
  undefined if `prepareMetaPath` discovers any part of the path that
  shared or undefined.

  @param {Object} obj The object whose meta we are examining
  @param {Array} path An array of keys to walk down
  @param {Boolean} writable whether or not to create a new meta
    (or meta property) if one does not already exist or if it's
    shared with its constructor
*/
Ember.metaPath = function metaPath(obj, path, writable) {
  var meta = Ember.meta(obj, writable), keyName, value;

  for (var i=0, l=path.length; i<l; i++) {
    keyName = path[i];
    value = meta[keyName];

    if (!value) {
      if (!writable) { return undefined; }
      value = meta[keyName] = { __ember_source__: obj };
    } else if (value.__ember_source__ !== obj) {
      if (!writable) { return undefined; }
      value = meta[keyName] = o_create(value);
      value.__ember_source__ = obj;
    }

    meta = value;
  }

  return value;
};

/**
  @private

  Wraps the passed function so that `this._super` will point to the superFunc
  when the function is invoked.  This is the primitive we use to implement
  calls to super.

  @param {Function} func
    The function to call

  @param {Function} superFunc
    The super function.

  @returns {Function} wrapped function.
*/
Ember.wrap = function(func, superFunc) {

  function K() {}

  var newFunc = function() {
    var ret, sup = this._super;
    this._super = superFunc || K;
    ret = func.apply(this, arguments);
    this._super = sup;
    return ret;
  };

  newFunc.base = func;
  return newFunc;
};

/**
  Returns true if the passed object is an array or Array-like.

  Ember Array Protocol:

    - the object has an objectAt property
    - the object is a native Array
    - the object is an Object, and has a length property

  Unlike Ember.typeOf this method returns true even if the passed object is
  not formally array but appears to be array-like (i.e. implements Ember.Array)

      Ember.isArray(); // false
      Ember.isArray([]); // true
      Ember.isArray( Ember.ArrayProxy.create({ content: [] }) ); // true

  @param {Object} obj The object to test
  @returns {Boolean}
*/
Ember.isArray = function(obj) {
  if (!obj || obj.setInterval) { return false; }
  if (Array.isArray && Array.isArray(obj)) { return true; }
  if (Ember.Array && Ember.Array.detect(obj)) { return true; }
  if ((obj.length !== undefined) && 'object'===typeof obj) { return true; }
  return false;
};

/**
  Forces the passed object to be part of an array.  If the object is already
  an array or array-like, returns the object.  Otherwise adds the object to
  an array.  If obj is null or undefined, returns an empty array.

      Ember.makeArray();          => []
      Ember.makeArray(null);      => []
      Ember.makeArray(undefined); => []
      Ember.makeArray('lindsay'); => ['lindsay']
      Ember.makeArray([1,2,42]);  => [1,2,42]

      var controller = Ember.ArrayProxy.create({ content: [] });
      Ember.makeArray(controller) === controller;   => true

  @param {Object} obj the object
  @returns {Array}
*/
Ember.makeArray = function(obj) {
  if (obj === null || obj === undefined) { return []; }
  return Ember.isArray(obj) ? obj : [obj];
};

})();



(function() {
/**
  JavaScript (before ES6) does not have a Map implementation. Objects,
  which are often used as dictionaries, may only have Strings as keys.

  Because Ember has a way to get a unique identifier for every object
  via `Ember.guidFor`, we can implement a performant Map with arbitrary
  keys. Because it is commonly used in low-level bookkeeping, Map is
  implemented as a pure JavaScript object for performance.

  This implementation follows the current iteration of the ES6 proposal
  for maps (http://wiki.ecmascript.org/doku.php?id=harmony:simple_maps_and_sets),
  with two exceptions. First, because we need our implementation to be
  pleasant on older browsers, we do not use the `delete` name (using
  `remove` instead). Second, as we do not have the luxury of in-VM
  iteration, we implement a forEach method for iteration.

  Map is mocked out to look like an Ember object, so you can do
  `Ember.Map.create()` for symmetry with other Ember classes.
*/
/** @private */
var guidFor = Ember.guidFor,
    indexOf = Ember.ArrayPolyfills.indexOf;

var copy = function(obj) {
  var output = {};

  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) { output[prop] = obj[prop]; }
  }

  return output;
};

var copyMap = function(original, newObject) {
  var keys = original.keys.copy(),
      values = copy(original.values);

  newObject.keys = keys;
  newObject.values = values;

  return newObject;
};

// This class is used internally by Ember.js and Ember Data.
// Please do not use it at this time. We plan to clean it up
// and add many tests soon.
var OrderedSet = Ember.OrderedSet = function() {
  this.clear();
};

OrderedSet.create = function() {
  return new OrderedSet();
};

OrderedSet.prototype = {
  clear: function() {
    this.presenceSet = {};
    this.list = [];
  },

  add: function(obj) {
    var guid = guidFor(obj),
        presenceSet = this.presenceSet,
        list = this.list;

    if (guid in presenceSet) { return; }

    presenceSet[guid] = true;
    list.push(obj);
  },

  remove: function(obj) {
    var guid = guidFor(obj),
        presenceSet = this.presenceSet,
        list = this.list;

    delete presenceSet[guid];

    var index = indexOf.call(list, obj);
    if (index > -1) {
      list.splice(index, 1);
    }
  },

  isEmpty: function() {
    return this.list.length === 0;
  },

  forEach: function(fn, self) {
    // allow mutation during iteration
    var list = this.list.slice();

    for (var i = 0, j = list.length; i < j; i++) {
      fn.call(self, list[i]);
    }
  },

  toArray: function() {
    return this.list.slice();
  },

  copy: function() {
    var set = new OrderedSet();

    set.presenceSet = copy(this.presenceSet);
    set.list = this.list.slice();

    return set;
  }
};

/**
  A Map stores values indexed by keys. Unlike JavaScript's
  default Objects, the keys of a Map can be any JavaScript
  object.

  Internally, a Map has two data structures:

    `keys`: an OrderedSet of all of the existing keys
    `values`: a JavaScript Object indexed by the
      Ember.guidFor(key)

  When a key/value pair is added for the first time, we
  add the key to the `keys` OrderedSet, and create or
  replace an entry in `values`. When an entry is deleted,
  we delete its entry in `keys` and `values`.
*/

/** @private */
var Map = Ember.Map = function() {
  this.keys = Ember.OrderedSet.create();
  this.values = {};
};

Map.create = function() {
  return new Map();
};

Map.prototype = {
  /**
    Retrieve the value associated with a given key.

    @param {anything} key
    @return {anything} the value associated with the key, or undefined
  */
  get: function(key) {
    var values = this.values,
        guid = guidFor(key);

    return values[guid];
  },

  /**
    Adds a value to the map. If a value for the given key has already been
    provided, the new value will replace the old value.

    @param {anything} key
    @param {anything} value
  */
  set: function(key, value) {
    var keys = this.keys,
        values = this.values,
        guid = guidFor(key);

    keys.add(key);
    values[guid] = value;
  },

  /**
    Removes a value from the map for an associated key.

    @param {anything} key
    @returns {Boolean} true if an item was removed, false otherwise
  */
  remove: function(key) {
    // don't use ES6 "delete" because it will be annoying
    // to use in browsers that are not ES6 friendly;
    var keys = this.keys,
        values = this.values,
        guid = guidFor(key),
        value;

    if (values.hasOwnProperty(guid)) {
      keys.remove(key);
      value = values[guid];
      delete values[guid];
      return true;
    } else {
      return false;
    }
  },

  /**
    Check whether a key is present.

    @param {anything} key
    @returns {Boolean} true if the item was present, false otherwise
  */
  has: function(key) {
    var values = this.values,
        guid = guidFor(key);

    return values.hasOwnProperty(guid);
  },

  /**
    Iterate over all the keys and values. Calls the function once
    for each key, passing in the key and value, in that order.

    The keys are guaranteed to be iterated over in insertion order.

    @param {Function} callback
    @param {anything} self if passed, the `this` value inside the
      callback. By default, `this` is the map.
  */
  forEach: function(callback, self) {
    var keys = this.keys,
        values = this.values;

    keys.forEach(function(key) {
      var guid = guidFor(key);
      callback.call(self, key, values[guid]);
    });
  },

  copy: function() {
    return copyMap(this, new Map());
  }
};

var MapWithDefault = Ember.MapWithDefault = function(options) {
  Map.call(this);
  this.defaultValue = options.defaultValue;
};

MapWithDefault.create = function(options) {
  if (options) {
    return new MapWithDefault(options);
  } else {
    return new Map();
  }
};

MapWithDefault.prototype = Ember.create(Map.prototype);

MapWithDefault.prototype.get = function(key) {
  var hasValue = this.has(key);

  if (hasValue) {
    return Map.prototype.get.call(this, key);
  } else {
    var defaultValue = this.defaultValue(key);
    this.set(key, defaultValue);
    return defaultValue;
  }
};

MapWithDefault.prototype.copy = function() {
  return copyMap(this, new MapWithDefault({
    defaultValue: this.defaultValue
  }));
};

})();



(function() {
// ==========================================================================
// Project:  Ember Metal
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var META_KEY = Ember.META_KEY, get, set;

var MANDATORY_SETTER = Ember.ENV.MANDATORY_SETTER;

// ..........................................................
// GET AND SET
//
// If we are on a platform that supports accessors we can get use those.
// Otherwise simulate accessors by looking up the property directly on the
// object.

/** @private */
get = function get(obj, keyName) {
  Ember.assert("You need to provide an object and key to `get`.", !!obj && keyName);
  var meta = obj[META_KEY], desc = meta && meta.descs[keyName], ret;
  if (desc) {
    return desc.get(obj, keyName);
  } else {
    var isUnknown = 'object' === typeof obj && !(keyName in obj);

    if (isUnknown && 'function' === typeof obj.unknownProperty) {
      return obj.unknownProperty(keyName);
    }

    if (MANDATORY_SETTER && meta && meta.watching[keyName] > 0) { return meta.values[keyName]; }
    return obj[keyName];
  }
};

/** @private */
set = function set(obj, keyName, value) {
  Ember.assert("You need to provide an object and key to `set`.", !!obj && keyName !== undefined);
  Ember.assert('calling set on destroyed object', !obj.isDestroyed);

  var meta = obj[META_KEY], desc = meta && meta.descs[keyName],
      isUnknown, currentValue;
  if (desc) {
    desc.set(obj, keyName, value);
  }
  else {
    isUnknown = 'object' === typeof obj && !(keyName in obj);

    // setUnknownProperty is called if `obj` is an object,
    // the property does not already exist, and the
    // `setUnknownProperty` method exists on the object
    if (isUnknown && 'function' === typeof obj.setUnknownProperty) {
      obj.setUnknownProperty(keyName, value);
    } else if (meta && meta.watching[keyName] > 0) {
      if (MANDATORY_SETTER) {
        currentValue = meta.values[keyName];
      } else {
        currentValue = obj[keyName];
      }
      // only trigger a change if the value has changed
      if (value !== currentValue) {
        Ember.propertyWillChange(obj, keyName);
        if (MANDATORY_SETTER) {
          meta.values[keyName] = value;
        } else {
          obj[keyName] = value;
        }
        Ember.propertyDidChange(obj, keyName);
      }
    } else {
      obj[keyName] = value;
    }
  }
  return value;
};

/**
  @function

  Gets the value of a property on an object.  If the property is computed,
  the function will be invoked.  If the property is not defined but the
  object implements the unknownProperty() method then that will be invoked.

  If you plan to run on IE8 and older browsers then you should use this
  method anytime you want to retrieve a property on an object that you don't
  know for sure is private.  (My convention only properties beginning with
  an underscore '_' are considered private.)

  On all newer browsers, you only need to use this method to retrieve
  properties if the property might not be defined on the object and you want
  to respect the unknownProperty() handler.  Otherwise you can ignore this
  method.

  Note that if the obj itself is null, this method will simply return
  undefined.

  @param {Object} obj
    The object to retrieve from.

  @param {String} keyName
    The property key to retrieve

  @returns {Object} the property value or null.
*/
Ember.get = get;

/**
  @function

  Sets the value of a property on an object, respecting computed properties
  and notifying observers and other listeners of the change.  If the
  property is not defined but the object implements the unknownProperty()
  method then that will be invoked as well.

  If you plan to run on IE8 and older browsers then you should use this
  method anytime you want to set a property on an object that you don't
  know for sure is private.  (My convention only properties beginning with
  an underscore '_' are considered private.)

  On all newer browsers, you only need to use this method to set
  properties if the property might not be defined on the object and you want
  to respect the unknownProperty() handler.  Otherwise you can ignore this
  method.

  @param {Object} obj
    The object to modify.

  @param {String} keyName
    The property key to set

  @param {Object} value
    The value to set

  @returns {Object} the passed value.
*/
Ember.set = set;

if (Ember.config.overrideAccessors) {
  Ember.config.overrideAccessors();
  get = Ember.get;
  set = Ember.set;
}

// ..........................................................
// PATHS
//

/** @private */
function getPath(target, path) {
  var parts = path.split(".");
  for (var i=0, l=parts.length; target && i<l; i++) {
    target = get(target, parts[i]);
    if (target && target.isDestroyed) { return undefined; }
  }
  return target;
}

var IS_GLOBAL = /^([A-Z$]|([0-9][A-Z$]))/;
var IS_GLOBAL_PATH = /^([A-Z$]|([0-9][A-Z$])).*[\.\*]/;
var HAS_THIS  = /^this[\.\*]/;
var FIRST_KEY = /^([^\.\*]+)/;

/** @private */
function firstKey(path) {
  return path.match(FIRST_KEY)[0];
}

// assumes path is already normalized
/** @private */
function normalizeTuple(target, path) {
  var hasThis  = HAS_THIS.test(path),
      isGlobal = !hasThis && IS_GLOBAL_PATH.test(path),
      key;

  if (!target || isGlobal) target = window;
  if (hasThis) path = path.slice(5);

  if (target === window) {
    key = firstKey(path);
    target = get(target, key);
    path   = path.slice(key.length+1);
  }

  // must return some kind of path to be valid else other things will break.
  if (!path || path.length===0) throw new Error('Invalid Path');

  return [ target, path ];
}

/**
  @private

  Normalizes a target/path pair to reflect that actual target/path that should
  be observed, etc.  This takes into account passing in global property
  paths (i.e. a path beginning with a captial letter not defined on the
  target) and * separators.

  @param {Object} target
    The current target.  May be null.

  @param {String} path
    A path on the target or a global property path.

  @returns {Array} a temporary array with the normalized target/path pair.
*/
Ember.normalizeTuple = function(target, path) {
  return normalizeTuple(target, path);
};

Ember.normalizeTuple.primitive = normalizeTuple;

Ember.getWithDefault = function(root, key, defaultValue) {
  var value = Ember.get(root, key);

  if (value === undefined) { return defaultValue; }
  return value;
};

Ember.getPath = function(root, path) {
  var hasThis, isGlobal, ret;

  // Helpers that operate with 'this' within an #each
  if (path === '') {
    return root;
  }

  if (!path && 'string'===typeof root) {
    path = root;
    root = null;
  }

  // If there is no root and path is a key name, return that
  // property from the global object.
  // E.g. getPath('Ember') -> Ember
  if (root === null && path.indexOf('.') < 0) { return get(window, path); }

  // detect complicated paths and normalize them
  hasThis  = HAS_THIS.test(path);

  if (!root || hasThis) {
    var tuple = normalizeTuple(root, path);
    root = tuple[0];
    path = tuple[1];
    tuple.length = 0;
  }

  return getPath(root, path);
};

Ember.setPath = function(root, path, value, tolerant) {
  var keyName;

  if (typeof root === 'string') {
    Ember.assert("Path '" + root + "' must be global if no root is given.", IS_GLOBAL.test(root));
    value = path;
    path = root;
    root = null;
  }

  if (path.indexOf('.') > 0) {
    // get the last part of the path
    keyName = path.slice(path.lastIndexOf('.') + 1);

    // get the first part of the part
    path    = path.slice(0, path.length-(keyName.length+1));

    // unless the path is this, look up the first part to
    // get the root
    if (path !== 'this') {
      root = Ember.getPath(root, path);
    }
  } else {
    Ember.assert("A global path passed to setPath must have at least one period", !IS_GLOBAL.test(path) || path.indexOf(".") > -1);
    keyName = path;
  }

  if (!keyName || keyName.length === 0) {
    throw new Error('You passed an empty path');
  }

  if (!root) {
    if (tolerant) { return; }
    else { throw new Error('Object in path '+path+' could not be found or was destroyed.'); }
  }

  return Ember.set(root, keyName, value);
};

/**
  Error-tolerant form of Ember.setPath. Will not blow up if any part of the
  chain is undefined, null, or destroyed.

  This is primarily used when syncing bindings, which may try to update after
  an object has been destroyed.
*/
Ember.trySetPath = function(root, path, value) {
  return Ember.setPath(root, path, value, true);
};

/**
  Returns true if the provided path is global (e.g., "MyApp.fooController.bar")
  instead of local ("foo.bar.baz").

  @param {String} path
  @returns Boolean
*/
Ember.isGlobalPath = function(path) {
  return IS_GLOBAL.test(path);
};

})();



(function() {
// ==========================================================================
// Project:  Ember Metal
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var GUID_KEY = Ember.GUID_KEY,
    META_KEY = Ember.META_KEY,
    EMPTY_META = Ember.EMPTY_META,
    metaFor = Ember.meta,
    o_create = Ember.create,
    objectDefineProperty = Ember.platform.defineProperty;

var MANDATORY_SETTER = Ember.ENV.MANDATORY_SETTER;

// ..........................................................
// DESCRIPTOR
//

/**
  @private
  @constructor

  Objects of this type can implement an interface to responds requests to
  get and set.  The default implementation handles simple properties.

  You generally won't need to create or subclass this directly.
*/
var Descriptor = Ember.Descriptor = function() {};

// ..........................................................
// DEFINING PROPERTIES API
//

/**
  @private

  NOTE: This is a low-level method used by other parts of the API.  You almost
  never want to call this method directly.  Instead you should use Ember.mixin()
  to define new properties.

  Defines a property on an object.  This method works much like the ES5
  Object.defineProperty() method except that it can also accept computed
  properties and other special descriptors.

  Normally this method takes only three parameters.  However if you pass an
  instance of Ember.Descriptor as the third param then you can pass an optional
  value as the fourth parameter.  This is often more efficient than creating
  new descriptor hashes for each property.

  ## Examples

      // ES5 compatible mode
      Ember.defineProperty(contact, 'firstName', {
        writable: true,
        configurable: false,
        enumerable: true,
        value: 'Charles'
      });

      // define a simple property
      Ember.defineProperty(contact, 'lastName', undefined, 'Jolley');

      // define a computed property
      Ember.defineProperty(contact, 'fullName', Ember.computed(function() {
        return this.firstName+' '+this.lastName;
      }).property('firstName', 'lastName').cacheable());
*/
Ember.defineProperty = function(obj, keyName, desc, val, meta) {
  var descs, existingDesc, watching;

  if (!meta) meta = metaFor(obj);
  descs = meta.descs;
  existingDesc = meta.descs[keyName];
  watching = meta.watching[keyName] > 0;

  if (existingDesc instanceof Ember.Descriptor) {
    existingDesc.teardown(obj, keyName);
  }

  if (desc instanceof Ember.Descriptor) {
    descs[keyName] = desc;
    if (MANDATORY_SETTER && watching) {
      objectDefineProperty(obj, keyName, {
        configurable: true,
        enumerable: true,
        writable: true,
        value: undefined // make enumerable
      });
    } else {
      obj[keyName] = undefined; // make enumerable
    }
    desc.setup(obj, keyName);
  } else {
    descs[keyName] = undefined; // shadow descriptor in proto
    if (desc == null) {
      if (MANDATORY_SETTER && watching) {
        meta.values[keyName] = val;
        objectDefineProperty(obj, keyName, {
          configurable: true,
          enumerable: true,
          set: function() {
            Ember.assert('Must use Ember.set() to access this property', false);
          },
          get: function() {
            var meta = this[META_KEY];
            return meta && meta.values[keyName];
          }
        });
      } else {
        obj[keyName] = val;
      }
    } else {
      // compatibility with ES5
      objectDefineProperty(obj, keyName, desc);
    }
  }

  // if key is being watched, override chains that
  // were initialized with the prototype
  if (watching) { Ember.overrideChains(obj, keyName, meta); }

  return this;
};


})();



(function() {
// ==========================================================================
// Project:  Ember Metal
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var AFTER_OBSERVERS = ':change';
var BEFORE_OBSERVERS = ':before';
var guidFor = Ember.guidFor;

var deferred = 0;
var array_Slice = [].slice;

/** @private */
var ObserverSet = function () {
  this.targetSet = {};
};
ObserverSet.prototype.add = function (target, path) {
  var targetSet = this.targetSet,
    targetGuid = Ember.guidFor(target),
    pathSet = targetSet[targetGuid];
  if (!pathSet) {
    targetSet[targetGuid] = pathSet = {};
  }
  if (pathSet[path]) {
    return false;
  } else {
    return pathSet[path] = true;
  }
};
ObserverSet.prototype.clear = function () {
  this.targetSet = {};
};

/** @private */
var DeferredEventQueue = function() {
  this.targetSet = {};
  this.queue = [];
};

DeferredEventQueue.prototype.push = function(target, eventName, keyName) {
  var targetSet = this.targetSet,
    queue = this.queue,
    targetGuid = Ember.guidFor(target),
    eventNameSet = targetSet[targetGuid],
    index;

  if (!eventNameSet) {
    targetSet[targetGuid] = eventNameSet = {};
  }
  index = eventNameSet[eventName];
  if (index === undefined) {
    eventNameSet[eventName] = queue.push(Ember.deferEvent(target, eventName, [target, keyName])) - 1;
  } else {
    queue[index] = Ember.deferEvent(target, eventName, [target, keyName]);
  }
};

DeferredEventQueue.prototype.flush = function() {
  var queue = this.queue;
  this.queue = [];
  this.targetSet = {};
  for (var i=0, len=queue.length; i < len; ++i) {
    queue[i]();
  }
};

var queue = new DeferredEventQueue(), beforeObserverSet = new ObserverSet();

/** @private */
function notifyObservers(obj, eventName, keyName, forceNotification) {
  if (deferred && !forceNotification) {
    queue.push(obj, eventName, keyName);
  } else {
    Ember.sendEvent(obj, eventName, [obj, keyName]);
  }
}

/** @private */
function flushObserverQueue() {
  beforeObserverSet.clear();

  queue.flush();
}

Ember.beginPropertyChanges = function() {
  deferred++;
  return this;
};

Ember.endPropertyChanges = function() {
  deferred--;
  if (deferred<=0) flushObserverQueue();
};

/**
  Make a series of property changes together in an
  exception-safe way.

      Ember.changeProperties(function() {
        obj1.set('foo', mayBlowUpWhenSet);
        obj2.set('bar', baz);
      });
*/
Ember.changeProperties = function(cb, binding){
  Ember.beginPropertyChanges();
  try {
    cb.call(binding);
  } finally {
    Ember.endPropertyChanges();
  }
};

/**
  Set a list of properties on an object. These properties are set inside
  a single `beginPropertyChanges` and `endPropertyChanges` batch, so
  observers will be buffered.
*/
Ember.setProperties = function(self, hash) {
  Ember.changeProperties(function(){
    for(var prop in hash) {
      if (hash.hasOwnProperty(prop)) Ember.set(self, prop, hash[prop]);
    }
  });
  return self;
};


/** @private */
function changeEvent(keyName) {
  return keyName+AFTER_OBSERVERS;
}

/** @private */
function beforeEvent(keyName) {
  return keyName+BEFORE_OBSERVERS;
}

Ember.addObserver = function(obj, path, target, method) {
  Ember.addListener(obj, changeEvent(path), target, method);
  Ember.watch(obj, path);
  return this;
};

/** @private */
Ember.observersFor = function(obj, path) {
  return Ember.listenersFor(obj, changeEvent(path));
};

Ember.removeObserver = function(obj, path, target, method) {
  Ember.unwatch(obj, path);
  Ember.removeListener(obj, changeEvent(path), target, method);
  return this;
};

Ember.addBeforeObserver = function(obj, path, target, method) {
  Ember.addListener(obj, beforeEvent(path), target, method);
  Ember.watch(obj, path);
  return this;
};

// Suspend observer during callback.
//
// This should only be used by the target of the observer
// while it is setting the observed path.
/** @private */
Ember._suspendBeforeObserver = function(obj, path, target, method, callback) {
  return Ember._suspendListener(obj, beforeEvent(path), target, method, callback);
};

Ember._suspendObserver = function(obj, path, target, method, callback) {
  return Ember._suspendListener(obj, changeEvent(path), target, method, callback);
};

/** @private */
Ember.beforeObserversFor = function(obj, path) {
  return Ember.listenersFor(obj, beforeEvent(path));
};

Ember.removeBeforeObserver = function(obj, path, target, method) {
  Ember.unwatch(obj, path);
  Ember.removeListener(obj, beforeEvent(path), target, method);
  return this;
};

/** @private */
Ember.notifyObservers = function(obj, keyName) {
  if (obj.isDestroying) { return; }

  notifyObservers(obj, changeEvent(keyName), keyName);
};

/** @private */
Ember.notifyBeforeObservers = function(obj, keyName) {
  if (obj.isDestroying) { return; }

  var guid, set, forceNotification = false;

  if (deferred) {
    if (beforeObserverSet.add(obj, keyName)) {
      forceNotification = true;
    } else {
      return;
    }
  }

  notifyObservers(obj, beforeEvent(keyName), keyName, forceNotification);
};


})();



(function() {
// ==========================================================================
// Project:  Ember Metal
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var guidFor = Ember.guidFor, // utils.js
    metaFor = Ember.meta, // utils.js
    get = Ember.get, // accessors.js
    set = Ember.set, // accessors.js
    normalizeTuple = Ember.normalizeTuple.primitive, // accessors.js
    GUID_KEY = Ember.GUID_KEY, // utils.js
    META_KEY = Ember.META_KEY, // utils.js
    // circular reference observer depends on Ember.watch
    // we should move change events to this file or its own property_events.js
    notifyObservers = Ember.notifyObservers, // observer.js
    forEach = Ember.ArrayPolyfills.forEach, // array.js
    FIRST_KEY = /^([^\.\*]+)/,
    IS_PATH = /[\.\*]/;

var MANDATORY_SETTER = Ember.ENV.MANDATORY_SETTER,
o_defineProperty = Ember.platform.defineProperty;

/** @private */
function firstKey(path) {
  return path.match(FIRST_KEY)[0];
}

// returns true if the passed path is just a keyName
/** @private */
function isKeyName(path) {
  return path==='*' || !IS_PATH.test(path);
}

// ..........................................................
// DEPENDENT KEYS
//

var DEP_SKIP = { __emberproto__: true }; // skip some keys and toString

/** @private */
function iterDeps(method, obj, depKey, seen, meta) {

  var guid = guidFor(obj);
  if (!seen[guid]) seen[guid] = {};
  if (seen[guid][depKey]) return;
  seen[guid][depKey] = true;

  var deps = meta.deps;
  deps = deps && deps[depKey];
  if (deps) {
    for(var key in deps) {
      if (DEP_SKIP[key]) continue;
      method(obj, key);
    }
  }
}


var WILL_SEEN, DID_SEEN;

// called whenever a property is about to change to clear the cache of any dependent keys (and notify those properties of changes, etc...)
/** @private */
function dependentKeysWillChange(obj, depKey, meta) {
  if (obj.isDestroying) { return; }

  var seen = WILL_SEEN, top = !seen;
  if (top) { seen = WILL_SEEN = {}; }
  iterDeps(propertyWillChange, obj, depKey, seen, meta);
  if (top) { WILL_SEEN = null; }
}

// called whenever a property has just changed to update dependent keys
/** @private */
function dependentKeysDidChange(obj, depKey, meta) {
  if (obj.isDestroying) { return; }

  var seen = DID_SEEN, top = !seen;
  if (top) { seen = DID_SEEN = {}; }
  iterDeps(propertyDidChange, obj, depKey, seen, meta);
  if (top) { DID_SEEN = null; }
}

// ..........................................................
// CHAIN
//

/** @private */
function addChainWatcher(obj, keyName, node) {
  if (!obj || ('object' !== typeof obj)) return; // nothing to do
  var m = metaFor(obj);
  var nodes = m.chainWatchers;
  if (!nodes || nodes.__emberproto__ !== obj) {
    nodes = m.chainWatchers = { __emberproto__: obj };
  }

  if (!nodes[keyName]) { nodes[keyName] = {}; }
  nodes[keyName][guidFor(node)] = node;
  Ember.watch(obj, keyName);
}

/** @private */
function removeChainWatcher(obj, keyName, node) {
  if (!obj || 'object' !== typeof obj) { return; } // nothing to do
  var m = metaFor(obj, false),
      nodes = m.chainWatchers;
  if (!nodes || nodes.__emberproto__ !== obj) { return; } //nothing to do
  if (nodes[keyName]) { delete nodes[keyName][guidFor(node)]; }
  Ember.unwatch(obj, keyName);
}

var pendingQueue = [];

// attempts to add the pendingQueue chains again.  If some of them end up
// back in the queue and reschedule is true, schedules a timeout to try
// again.
/** @private */
function flushPendingChains() {
  if (pendingQueue.length === 0) { return; } // nothing to do

  var queue = pendingQueue;
  pendingQueue = [];

  forEach.call(queue, function(q) { q[0].add(q[1]); });

  Ember.warn('Watching an undefined global, Ember expects watched globals to be setup by the time the run loop is flushed, check for typos', pendingQueue.length === 0);
}

/** @private */
function isProto(pvalue) {
  return metaFor(pvalue, false).proto === pvalue;
}

// A ChainNode watches a single key on an object.  If you provide a starting
// value for the key then the node won't actually watch it.  For a root node
// pass null for parent and key and object for value.
/** @private */
var ChainNode = function(parent, key, value, separator) {
  var obj;
  this._parent = parent;
  this._key    = key;

  // _watching is true when calling get(this._parent, this._key) will
  // return the value of this node.
  //
  // It is false for the root of a chain (because we have no parent)
  // and for global paths (because the parent node is the object with
  // the observer on it)
  this._watching = value===undefined;

  this._value  = value;
  this._separator = separator || '.';
  this._paths = {};
  if (this._watching) {
    this._object = parent.value();
    if (this._object) { addChainWatcher(this._object, this._key, this); }
  }

  // Special-case: the EachProxy relies on immediate evaluation to
  // establish its observers.
  //
  // TODO: Replace this with an efficient callback that the EachProxy
  // can implement.
  if (this._parent && this._parent._key === '@each') {
    this.value();
  }
};

var ChainNodePrototype = ChainNode.prototype;

ChainNodePrototype.value = function() {
  if (this._value === undefined && this._watching) {
    var obj = this._parent.value();
    this._value = (obj && !isProto(obj)) ? get(obj, this._key) : undefined;
  }
  return this._value;
};

ChainNodePrototype.destroy = function() {
  if (this._watching) {
    var obj = this._object;
    if (obj) { removeChainWatcher(obj, this._key, this); }
    this._watching = false; // so future calls do nothing
  }
};

// copies a top level object only
ChainNodePrototype.copy = function(obj) {
  var ret = new ChainNode(null, null, obj, this._separator),
      paths = this._paths, path;
  for (path in paths) {
    if (paths[path] <= 0) { continue; } // this check will also catch non-number vals.
    ret.add(path);
  }
  return ret;
};

// called on the root node of a chain to setup watchers on the specified
// path.
ChainNodePrototype.add = function(path) {
  var obj, tuple, key, src, separator, paths;

  paths = this._paths;
  paths[path] = (paths[path] || 0) + 1;

  obj = this.value();
  tuple = normalizeTuple(obj, path);

  // the path was a local path
  if (tuple[0] && tuple[0] === obj) {
    path = tuple[1];
    key  = firstKey(path);
    path = path.slice(key.length+1);

  // global path, but object does not exist yet.
  // put into a queue and try to connect later.
  } else if (!tuple[0]) {
    pendingQueue.push([this, path]);
    tuple.length = 0;
    return;

  // global path, and object already exists
  } else {
    src  = tuple[0];
    key  = path.slice(0, 0-(tuple[1].length+1));
    separator = path.slice(key.length, key.length+1);
    path = tuple[1];
  }

  tuple.length = 0;
  this.chain(key, path, src, separator);
};

// called on the root node of a chain to teardown watcher on the specified
// path
ChainNodePrototype.remove = function(path) {
  var obj, tuple, key, src, paths;

  paths = this._paths;
  if (paths[path] > 0) { paths[path]--; }

  obj = this.value();
  tuple = normalizeTuple(obj, path);
  if (tuple[0] === obj) {
    path = tuple[1];
    key  = firstKey(path);
    path = path.slice(key.length+1);
  } else {
    src  = tuple[0];
    key  = path.slice(0, 0-(tuple[1].length+1));
    path = tuple[1];
  }

  tuple.length = 0;
  this.unchain(key, path);
};

ChainNodePrototype.count = 0;

ChainNodePrototype.chain = function(key, path, src, separator) {
  var chains = this._chains, node;
  if (!chains) { chains = this._chains = {}; }

  node = chains[key];
  if (!node) { node = chains[key] = new ChainNode(this, key, src, separator); }
  node.count++; // count chains...

  // chain rest of path if there is one
  if (path && path.length>0) {
    key = firstKey(path);
    path = path.slice(key.length+1);
    node.chain(key, path); // NOTE: no src means it will observe changes...
  }
};

ChainNodePrototype.unchain = function(key, path) {
  var chains = this._chains, node = chains[key];

  // unchain rest of path first...
  if (path && path.length>1) {
    key  = firstKey(path);
    path = path.slice(key.length+1);
    node.unchain(key, path);
  }

  // delete node if needed.
  node.count--;
  if (node.count<=0) {
    delete chains[node._key];
    node.destroy();
  }

};

ChainNodePrototype.willChange = function() {
  var chains = this._chains;
  if (chains) {
    for(var key in chains) {
      if (!chains.hasOwnProperty(key)) { continue; }
      chains[key].willChange();
    }
  }

  if (this._parent) { this._parent.chainWillChange(this, this._key, 1); }
};

ChainNodePrototype.chainWillChange = function(chain, path, depth) {
  if (this._key) { path = this._key + this._separator + path; }

  if (this._parent) {
    this._parent.chainWillChange(this, path, depth+1);
  } else {
    if (depth > 1) { Ember.propertyWillChange(this.value(), path); }
    path = 'this.' + path;
    if (this._paths[path] > 0) { Ember.propertyWillChange(this.value(), path); }
  }
};

ChainNodePrototype.chainDidChange = function(chain, path, depth) {
  if (this._key) { path = this._key + this._separator + path; }
  if (this._parent) {
    this._parent.chainDidChange(this, path, depth+1);
  } else {
    if (depth > 1) { Ember.propertyDidChange(this.value(), path); }
    path = 'this.' + path;
    if (this._paths[path] > 0) { Ember.propertyDidChange(this.value(), path); }
  }
};

ChainNodePrototype.didChange = function(suppressEvent) {
  // invalidate my own value first.
  if (this._watching) {
    var obj = this._parent.value();
    if (obj !== this._object) {
      removeChainWatcher(this._object, this._key, this);
      this._object = obj;
      addChainWatcher(obj, this._key, this);
    }
    this._value  = undefined;

    // Special-case: the EachProxy relies on immediate evaluation to
    // establish its observers.
    if (this._parent && this._parent._key === '@each')
      this.value();
  }

  // then notify chains...
  var chains = this._chains;
  if (chains) {
    for(var key in chains) {
      if (!chains.hasOwnProperty(key)) { continue; }
      chains[key].didChange(suppressEvent);
    }
  }

  if (suppressEvent) { return; }

  // and finally tell parent about my path changing...
  if (this._parent) { this._parent.chainDidChange(this, this._key, 1); }
};

// get the chains for the current object.  If the current object has
// chains inherited from the proto they will be cloned and reconfigured for
// the current object.
/** @private */
function chainsFor(obj) {
  var m = metaFor(obj), ret = m.chains;
  if (!ret) {
    ret = m.chains = new ChainNode(null, null, obj);
  } else if (ret.value() !== obj) {
    ret = m.chains = ret.copy(obj);
  }
  return ret;
}

/** @private */
function notifyChains(obj, m, keyName, methodName, arg) {
  var nodes = m.chainWatchers;

  if (!nodes || nodes.__emberproto__ !== obj) { return; } // nothing to do

  nodes = nodes[keyName];
  if (!nodes) { return; }

  for(var key in nodes) {
    if (!nodes.hasOwnProperty(key)) { continue; }
    nodes[key][methodName](arg);
  }
}

Ember.overrideChains = function(obj, keyName, m) {
  notifyChains(obj, m, keyName, 'didChange', true);
};

/** @private */
function chainsWillChange(obj, keyName, m) {
  notifyChains(obj, m, keyName, 'willChange');
}

/** @private */
function chainsDidChange(obj, keyName, m) {
  notifyChains(obj, m, keyName, 'didChange');
}

// ..........................................................
// WATCH
//

/**
  @private

  Starts watching a property on an object.  Whenever the property changes,
  invokes Ember.propertyWillChange and Ember.propertyDidChange.  This is the
  primitive used by observers and dependent keys; usually you will never call
  this method directly but instead use higher level methods like
  Ember.addObserver().
*/
Ember.watch = function(obj, keyName) {
  // can't watch length on Array - it is special...
  if (keyName === 'length' && Ember.typeOf(obj) === 'array') { return this; }

  var m = metaFor(obj), watching = m.watching, desc;

  // activate watching first time
  if (!watching[keyName]) {
    watching[keyName] = 1;
    if (isKeyName(keyName)) {
      desc = m.descs[keyName];
      if (desc && desc.willWatch) { desc.willWatch(obj, keyName); }

      if ('function' === typeof obj.willWatchProperty) {
        obj.willWatchProperty(keyName);
      }

      if (MANDATORY_SETTER && keyName in obj) {
        m.values[keyName] = obj[keyName];
        o_defineProperty(obj, keyName, {
          configurable: true,
          enumerable: true,
          set: function() {
            Ember.assert('Must use Ember.set() to access this property', false);
          },
          get: function() {
            var meta = this[META_KEY];
            return meta && meta.values[keyName];
          }
        });
      }
    } else {
      chainsFor(obj).add(keyName);
    }

  }  else {
    watching[keyName] = (watching[keyName] || 0) + 1;
  }
  return this;
};

Ember.isWatching = function isWatching(obj, key) {
  var meta = obj[META_KEY];
  return (meta && meta.watching[key]) > 0;
};

Ember.watch.flushPending = flushPendingChains;

/** @private */
Ember.unwatch = function(obj, keyName) {
  // can't watch length on Array - it is special...
  if (keyName === 'length' && Ember.typeOf(obj) === 'array') { return this; }

  var m = metaFor(obj), watching = m.watching, desc;

  if (watching[keyName] === 1) {
    watching[keyName] = 0;

    if (isKeyName(keyName)) {
      desc = m.descs[keyName];
      if (desc && desc.didUnwatch) { desc.didUnwatch(obj, keyName); }

      if ('function' === typeof obj.didUnwatchProperty) {
        obj.didUnwatchProperty(keyName);
      }

      if (MANDATORY_SETTER && keyName in obj) {
        o_defineProperty(obj, keyName, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: m.values[keyName]
        });
      }
    } else {
      chainsFor(obj).remove(keyName);
    }

  } else if (watching[keyName]>1) {
    watching[keyName]--;
  }

  return this;
};

/**
  @private

  Call on an object when you first beget it from another object.  This will
  setup any chained watchers on the object instance as needed.  This method is
  safe to call multiple times.
*/
Ember.rewatch = function(obj) {
  var m = metaFor(obj, false), chains = m.chains;

  // make sure the object has its own guid.
  if (GUID_KEY in obj && !obj.hasOwnProperty(GUID_KEY)) {
    Ember.generateGuid(obj, 'ember');
  }

  // make sure any chained watchers update.
  if (chains && chains.value() !== obj) {
    m.chains = chains.copy(obj);
  }

  return this;
};

Ember.finishChains = function(obj) {
  var m = metaFor(obj, false), chains = m.chains;
  if (chains) {
    if (chains.value() !== obj) {
      m.chains = chains = chains.copy(obj);
    }
    chains.didChange(true);
  }
};

// ..........................................................
// PROPERTY CHANGES
//

/**
  This function is called just before an object property is about to change.
  It will notify any before observers and prepare caches among other things.

  Normally you will not need to call this method directly but if for some
  reason you can't directly watch a property you can invoke this method
  manually along with `Ember.propertyDidChange()` which you should call just
  after the property value changes.

  @memberOf Ember

  @param {Object} obj
    The object with the property that will change

  @param {String} keyName
    The property key (or path) that will change.

  @returns {void}
*/
function propertyWillChange(obj, keyName, value) {
  var m = metaFor(obj, false),
      watching = m.watching[keyName] > 0 || keyName === 'length',
      proto = m.proto,
      desc = m.descs[keyName];

  if (!watching) { return; }
  if (proto === obj) { return; }
  if (desc && desc.willChange) { desc.willChange(obj, keyName); }
  dependentKeysWillChange(obj, keyName, m);
  chainsWillChange(obj, keyName, m);
  Ember.notifyBeforeObservers(obj, keyName);
}

Ember.propertyWillChange = propertyWillChange;

/**
  This function is called just after an object property has changed.
  It will notify any observers and clear caches among other things.

  Normally you will not need to call this method directly but if for some
  reason you can't directly watch a property you can invoke this method
  manually along with `Ember.propertyWilLChange()` which you should call just
  before the property value changes.

  @memberOf Ember

  @param {Object} obj
    The object with the property that will change

  @param {String} keyName
    The property key (or path) that will change.

  @returns {void}
*/
function propertyDidChange(obj, keyName) {
  var m = metaFor(obj, false),
      watching = m.watching[keyName] > 0 || keyName === 'length',
      proto = m.proto,
      desc = m.descs[keyName];

  if (proto === obj) { return; }

  // shouldn't this mean that we're watching this key?
  if (desc && desc.didChange) { desc.didChange(obj, keyName); }
  if (!watching && keyName !== 'length') { return; }

  dependentKeysDidChange(obj, keyName, m);
  chainsDidChange(obj, keyName, m);
  Ember.notifyObservers(obj, keyName);
}

Ember.propertyDidChange = propertyDidChange;

var NODE_STACK = [];

/**
  Tears down the meta on an object so that it can be garbage collected.
  Multiple calls will have no effect.

  @param {Object} obj  the object to destroy
  @returns {void}
*/
Ember.destroy = function (obj) {
  var meta = obj[META_KEY], node, nodes, key, nodeObject;
  if (meta) {
    obj[META_KEY] = null;
    // remove chainWatchers to remove circular references that would prevent GC
    node = meta.chains;
    if (node) {
      NODE_STACK.push(node);
      // process tree
      while (NODE_STACK.length > 0) {
        node = NODE_STACK.pop();
        // push children
        nodes = node._chains;
        if (nodes) {
          for (key in nodes) {
            if (nodes.hasOwnProperty(key)) {
              NODE_STACK.push(nodes[key]);
            }
          }
        }
        // remove chainWatcher in node object
        if (node._watching) {
          nodeObject = node._object;
          if (nodeObject) {
            removeChainWatcher(nodeObject, node._key, node);
          }
        }
      }
    }
  }
};

})();



(function() {
// ==========================================================================
// Project:  Ember Metal
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
Ember.warn("Computed properties will soon be cacheable by default. To enable this in your app, set `ENV.CP_DEFAULT_CACHEABLE = true`.", Ember.CP_DEFAULT_CACHEABLE);


var get = Ember.get,
    getPath = Ember.getPath,
    metaFor = Ember.meta,
    guidFor = Ember.guidFor,
    a_slice = [].slice,
    o_create = Ember.create,
    META_KEY = Ember.META_KEY,
    watch = Ember.watch,
    unwatch = Ember.unwatch;

// ..........................................................
// DEPENDENT KEYS
//

// data structure:
//  meta.deps = {
//   'depKey': {
//     'keyName': count,
//     __emberproto__: SRC_OBJ [to detect clones]
//     },
//   __emberproto__: SRC_OBJ
//  }

/**
  @private

  This function returns a map of unique dependencies for a
  given object and key.
*/
function keysForDep(obj, depsMeta, depKey) {
  var keys = depsMeta[depKey];
  if (!keys) {
    // if there are no dependencies yet for a the given key
    // create a new empty list of dependencies for the key
    keys = depsMeta[depKey] = { __emberproto__: obj };
  } else if (keys.__emberproto__ !== obj) {
    // otherwise if the dependency list is inherited from
    // a superclass, clone the hash
    keys = depsMeta[depKey] = o_create(keys);
    keys.__emberproto__ = obj;
  }
  return keys;
}

/**
  @private

  return obj[META_KEY].deps
  */
function metaForDeps(obj, meta) {
  var deps = meta.deps;
  // If the current object has no dependencies...
  if (!deps) {
    // initialize the dependencies with a pointer back to
    // the current object
    deps = meta.deps = { __emberproto__: obj };
  } else if (deps.__emberproto__ !== obj) {
    // otherwise if the dependencies are inherited from the
    // object's superclass, clone the deps
    deps = meta.deps = o_create(deps);
    deps.__emberproto__ = obj;
  }
  return deps;
}

/** @private */
function addDependentKeys(desc, obj, keyName, meta) {
  // the descriptor has a list of dependent keys, so
  // add all of its dependent keys.
  var depKeys = desc._dependentKeys, depsMeta, idx, len, depKey, keys;
  if (!depKeys) return;

  depsMeta = metaForDeps(obj, meta);

  for(idx = 0, len = depKeys.length; idx < len; idx++) {
    depKey = depKeys[idx];
    // Lookup keys meta for depKey
    keys = keysForDep(obj, depsMeta, depKey);
    // Increment the number of times depKey depends on keyName.
    keys[keyName] = (keys[keyName] || 0) + 1;
    // Watch the depKey
    watch(obj, depKey);
  }
}

/** @private */
function removeDependentKeys(desc, obj, keyName, meta) {
  // the descriptor has a list of dependent keys, so
  // add all of its dependent keys.
  var depKeys = desc._dependentKeys, depsMeta, idx, len, depKey, keys;
  if (!depKeys) return;

  depsMeta = metaForDeps(obj, meta);

  for(idx = 0, len = depKeys.length; idx < len; idx++) {
    depKey = depKeys[idx];
    // Lookup keys meta for depKey
    keys = keysForDep(obj, depsMeta, depKey);
    // Increment the number of times depKey depends on keyName.
    keys[keyName] = (keys[keyName] || 0) - 1;
    // Watch the depKey
    unwatch(obj, depKey);
  }
}

// ..........................................................
// COMPUTED PROPERTY
//

/** @private */
function ComputedProperty(func, opts) {
  this.func = func;
  this._cacheable = (opts && opts.cacheable !== undefined) ? opts.cacheable : Ember.CP_DEFAULT_CACHEABLE;
  this._dependentKeys = opts && opts.dependentKeys;
}

/**
  @constructor
*/
Ember.ComputedProperty = ComputedProperty;
ComputedProperty.prototype = new Ember.Descriptor();

/**
  @extends Ember.ComputedProperty
  @private
*/
var ComputedPropertyPrototype = ComputedProperty.prototype;

/**
  Call on a computed property to set it into cacheable mode.  When in this
  mode the computed property will automatically cache the return value of
  your function until one of the dependent keys changes.

      MyApp.president = Ember.Object.create({
        fullName: function() {
          return this.get('firstName') + ' ' + this.get('lastName');

          // After calculating the value of this function, Ember.js will
          // return that value without re-executing this function until
          // one of the dependent properties change.
        }.property('firstName', 'lastName').cacheable()
      });

  Properties are cacheable by default.

  @name Ember.ComputedProperty.cacheable
  @param {Boolean} aFlag optional set to false to disable caching
  @returns {Ember.ComputedProperty} receiver
*/
ComputedPropertyPrototype.cacheable = function(aFlag) {
  this._cacheable = aFlag !== false;
  return this;
};

/**
  Call on a computed property to set it into non-cached mode.  When in this
  mode the computed property will not automatically cache the return value.

      MyApp.outsideService = Ember.Object.create({
        value: function() {
          return OutsideService.getValue();
        }.property().volatile()
      });

  @name Ember.ComputedProperty.volatile
  @returns {Ember.ComputedProperty} receiver
*/
ComputedPropertyPrototype.volatile = function() {
  return this.cacheable(false);
};

/**
  Sets the dependent keys on this computed property.  Pass any number of
  arguments containing key paths that this computed property depends on.

      MyApp.president = Ember.Object.create({
        fullName: Ember.computed(function() {
          return this.get('firstName') + ' ' + this.get('lastName');

          // Tell Ember.js that this computed property depends on firstName
          // and lastName
        }).property('firstName', 'lastName')
      });

  @name Ember.ComputedProperty.property
  @param {String} path... zero or more property paths
  @returns {Ember.ComputedProperty} receiver
*/
ComputedPropertyPrototype.property = function() {
  var args = [];
  for (var i = 0, l = arguments.length; i < l; i++) {
    args.push(arguments[i]);
  }
  this._dependentKeys = args;
  return this;
};

/**
  In some cases, you may want to annotate computed properties with additional
  metadata about how they function or what values they operate on. For example,
  computed property functions may close over variables that are then no longer
  available for introspection.

  You can pass a hash of these values to a computed property like this:

      person: function() {
        var personId = this.get('personId');
        return App.Person.create({ id: personId });
      }.property().meta({ type: App.Person })

  The hash that you pass to the `meta()` function will be saved on the
  computed property descriptor under the `_meta` key. Ember runtime
  exposes a public API for retrieving these values from classes,
  via the `metaForProperty()` function.

  @name Ember.ComputedProperty.meta
  @param {Hash} metadata
  @returns {Ember.ComputedProperty} property descriptor instance
*/

ComputedPropertyPrototype.meta = function(meta) {
  this._meta = meta;
  return this;
};

/** @private - impl descriptor API */
ComputedPropertyPrototype.willWatch = function(obj, keyName) {
  // watch already creates meta for this instance
  var meta = obj[META_KEY];
  Ember.assert('watch should have setup meta to be writable', meta.source === obj);
  if (!(keyName in meta.cache)) {
    addDependentKeys(this, obj, keyName, meta);
  }
};

ComputedPropertyPrototype.didUnwatch = function(obj, keyName) {
  var meta = obj[META_KEY];
  Ember.assert('unwatch should have setup meta to be writable', meta.source === obj);
  if (!(keyName in meta.cache)) {
    // unwatch already creates meta for this instance
    removeDependentKeys(this, obj, keyName, meta);
  }
};

/** @private - impl descriptor API */
ComputedPropertyPrototype.didChange = function(obj, keyName) {
  // _suspended is set via a CP.set to ensure we don't clear
  // the cached value set by the setter
  if (this._cacheable && this._suspended !== obj) {
    var meta = metaFor(obj);
    if (keyName in meta.cache) {
      delete meta.cache[keyName];
      if (!meta.watching[keyName]) {
        removeDependentKeys(this, obj, keyName, meta);
      }
    }
  }
};

/** @private - impl descriptor API */
ComputedPropertyPrototype.get = function(obj, keyName) {
  var ret, cache, meta;
  if (this._cacheable) {
    meta = metaFor(obj);
    cache = meta.cache;
    if (keyName in cache) { return cache[keyName]; }
    ret = cache[keyName] = this.func.call(obj, keyName);
    if (!meta.watching[keyName]) {
      addDependentKeys(this, obj, keyName, meta);
    }
  } else {
    ret = this.func.call(obj, keyName);
  }
  return ret;
};

/** @private - impl descriptor API */
ComputedPropertyPrototype.set = function(obj, keyName, value) {
  var cacheable = this._cacheable,
      meta = metaFor(obj, cacheable),
      watched = meta.watching[keyName],
      oldSuspended = this._suspended,
      hadCachedValue,
      ret;

  this._suspended = obj;

  if (watched) { Ember.propertyWillChange(obj, keyName); }
  if (cacheable) {
    if (keyName in meta.cache) {
      delete meta.cache[keyName];
      hadCachedValue = true;
    }
  }
  ret = this.func.call(obj, keyName, value);
  if (cacheable) {
    if (!watched && !hadCachedValue) {
      addDependentKeys(this, obj, keyName, meta);
    }
    meta.cache[keyName] = ret;
  }
  if (watched) { Ember.propertyDidChange(obj, keyName); }
  this._suspended = oldSuspended;
  return ret;
};

/** @private - called when property is defined */
ComputedPropertyPrototype.setup = function(obj, keyName) {
  var meta = obj[META_KEY];
  if (meta && meta.watching[keyName]) {
    addDependentKeys(this, obj, keyName, metaFor(obj));
  }
};

/** @private - called before property is overridden */
ComputedPropertyPrototype.teardown = function(obj, keyName) {
  var meta = metaFor(obj);

  if (meta.watching[keyName] || keyName in meta.cache) {
    removeDependentKeys(this, obj, keyName, meta);
  }

  if (this._cacheable) { delete meta.cache[keyName]; }

  return null; // no value to restore
};

/**
  This helper returns a new property descriptor that wraps the passed
  computed property function.  You can use this helper to define properties
  with mixins or via Ember.defineProperty().

  The function you pass will be used to both get and set property values.
  The function should accept two parameters, key and value.  If value is not
  undefined you should set the value first.  In either case return the
  current value of the property.

  @param {Function} func
    The computed property function.

  @returns {Ember.ComputedProperty} property descriptor instance
*/
Ember.computed = function(func) {
  var args;

  if (arguments.length > 1) {
    args = a_slice.call(arguments, 0, -1);
    func = a_slice.call(arguments, -1)[0];
  }

  var cp = new ComputedProperty(func);

  if (args) {
    cp.property.apply(cp, args);
  }

  return cp;
};

/**
  Returns the cached value for a property, if one exists.
  This can be useful for peeking at the value of a computed
  property that is generated lazily, without accidentally causing
  it to be created.

  @param {Object} obj the object whose property you want to check
  @param {String} key the name of the property whose cached value you want
                      to return

*/
Ember.cacheFor = function cacheFor(obj, key) {
  var cache = metaFor(obj, false).cache;

  if (cache && key in cache) {
    return cache[key];
  }
};

Ember.computed.not = function(dependentKey) {
  return Ember.computed(dependentKey, function(key) {
    return !getPath(this, dependentKey);
  }).cacheable();
};

Ember.computed.empty = function(dependentKey) {
  return Ember.computed(dependentKey, function(key) {
    var val = getPath(this, dependentKey);
    return val === undefined || val === null || val === '' || (Ember.isArray(val) && get(val, 'length') === 0);
  }).cacheable();
};

Ember.computed.bool = function(dependentKey) {
  return Ember.computed(dependentKey, function(key) {
    return !!getPath(this, dependentKey);
  }).cacheable();
};

})();



(function() {
// ==========================================================================
// Project:  Ember Metal
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var o_create = Ember.create,
    meta = Ember.meta,
    metaPath = Ember.metaPath,
    guidFor = Ember.guidFor,
    a_slice = [].slice;

/**
  The event system uses a series of nested hashes to store listeners on an
  object. When a listener is registered, or when an event arrives, these
  hashes are consulted to determine which target and action pair to invoke.

  The hashes are stored in the object's meta hash, and look like this:

      // Object's meta hash
      {
        listeners: {               // variable name: `listenerSet`
          "foo:changed": {         // variable name: `targetSet`
            [targetGuid]: {        // variable name: `actionSet`
              [methodGuid]: {      // variable name: `action`
                target: [Object object],
                method: [Function function]
              }
            }
          }
        }
      }

*/

// Gets the set of all actions, keyed on the guid of each action's
// method property.
/** @private */
function actionSetFor(obj, eventName, target, writable) {
  return metaPath(obj, ['listeners', eventName, guidFor(target)], writable);
}

// Gets the set of all targets, keyed on the guid of each action's
// target property.
/** @private */
function targetSetFor(obj, eventName) {
  var listenerSet = meta(obj, false).listeners;
  if (!listenerSet) { return false; }

  return listenerSet[eventName] || false;
}

// TODO: This knowledge should really be a part of the
// meta system.
var SKIP_PROPERTIES = { __ember_source__: true };

/** @private */
function iterateSet(obj, eventName, callback, params) {
  var targetSet = targetSetFor(obj, eventName);
  if (!targetSet) { return false; }
  // Iterate through all elements of the target set
  for(var targetGuid in targetSet) {
    if (SKIP_PROPERTIES[targetGuid]) { continue; }

    var actionSet = targetSet[targetGuid];
    if (actionSet) {
      // Iterate through the elements of the action set
      for(var methodGuid in actionSet) {
        if (SKIP_PROPERTIES[methodGuid]) { continue; }

        var action = actionSet[methodGuid];
        if (action) {
          if (callback(action, params, obj) === true) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

/** @private */
function invokeAction(action, params, sender) {
  var method = action.method, target = action.target;
  // If there is no target, the target is the object
  // on which the event was fired.
  if (!target) { target = sender; }
  if ('string' === typeof method) { method = target[method]; }
  if (params) {
    method.apply(target, params);
  } else {
    method.apply(target);
  }
}

/**
  The sendEvent arguments > 2 are passed to an event listener.

  @memberOf Ember
*/
function addListener(obj, eventName, target, method) {
  Ember.assert("You must pass at least an object and event name to Ember.addListener", !!obj && !!eventName);

  if (!method && 'function' === typeof target) {
    method = target;
    target = null;
  }

  var actionSet = actionSetFor(obj, eventName, target, true),
      methodGuid = guidFor(method);

  if (!actionSet[methodGuid]) {
    actionSet[methodGuid] = { target: target, method: method };
  }

  if ('function' === typeof obj.didAddListener) {
    obj.didAddListener(eventName, target, method);
  }
}

/** @memberOf Ember */
function removeListener(obj, eventName, target, method) {
  Ember.assert("You must pass at least an object and event name to Ember.removeListener", !!obj && !!eventName);

  if (!method && 'function' === typeof target) {
    method = target;
    target = null;
  }

  var actionSet = actionSetFor(obj, eventName, target, true),
      methodGuid = guidFor(method);

  // we can't simply delete this parameter, because if we do, we might
  // re-expose the property from the prototype chain.
  if (actionSet && actionSet[methodGuid]) { actionSet[methodGuid] = null; }

  if ('function' === typeof obj.didRemoveListener) {
    obj.didRemoveListener(eventName, target, method);
  }
}

// Suspend listener during callback.
//
// This should only be used by the target of the event listener
// when it is taking an action that would cause the event, e.g.
// an object might suspend its property change listener while it is
// setting that property.
/** @private */
function suspendListener(obj, eventName, target, method, callback) {
  if (!method && 'function' === typeof target) {
    method = target;
    target = null;
  }

  var actionSet = actionSetFor(obj, eventName, target, true),
      methodGuid = guidFor(method),
      action = actionSet && actionSet[methodGuid];

  actionSet[methodGuid] = null;
  try {
    return callback.call(target);
  } finally {
    actionSet[methodGuid] = action;
  }
}

// returns a list of currently watched events
/** @memberOf Ember */
function watchedEvents(obj) {
  var listeners = meta(obj, false).listeners, ret = [];

  if (listeners) {
    for(var eventName in listeners) {
      if (!SKIP_PROPERTIES[eventName] && listeners[eventName]) {
        ret.push(eventName);
      }
    }
  }
  return ret;
}

/** @memberOf Ember */
function sendEvent(obj, eventName, params) {
  // first give object a chance to handle it
  if (obj !== Ember && 'function' === typeof obj.sendEvent) {
    obj.sendEvent(eventName, params);
  }

  iterateSet(obj, eventName, invokeAction, params);
  return true;
}

/** @memberOf Ember */
function deferEvent(obj, eventName, params) {
  var actions = [];
  iterateSet(obj, eventName, function (action) {
    actions.push(action);
  });

  return function() {
    if (obj.isDestroyed) { return; }

    if (obj !== Ember && 'function' === typeof obj.sendEvent) {
      obj.sendEvent(eventName, params);
    }

    for (var i=0, len=actions.length; i < len; ++i) {
      invokeAction(actions[i], params, obj);
    }
  };
}

/** @memberOf Ember */
function hasListeners(obj, eventName) {
  if (iterateSet(obj, eventName, function() { return true; })) {
    return true;
  }

  // no listeners!  might as well clean this up so it is faster later.
  var set = metaPath(obj, ['listeners'], true);
  set[eventName] = null;

  return false;
}

/** @memberOf Ember */
function listenersFor(obj, eventName) {
  var ret = [];
  iterateSet(obj, eventName, function (action) {
    ret.push([action.target, action.method]);
  });
  return ret;
}

Ember.addListener = addListener;
Ember.removeListener = removeListener;
Ember._suspendListener = suspendListener;
Ember.sendEvent = sendEvent;
Ember.hasListeners = hasListeners;
Ember.watchedEvents = watchedEvents;
Ember.listenersFor = listenersFor;
Ember.deferEvent = deferEvent;

})();



(function() {
// ==========================================================================
// Project:  Ember Runtime
// Copyright: ©2006-2011 Strobe Inc. and contributors.
//            Portions ©2008-2010 Apple Inc. All rights reserved.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
// Ember.Logger
// Ember.watch.flushPending
// Ember.beginPropertyChanges, Ember.endPropertyChanges
// Ember.guidFor

// ..........................................................
// HELPERS
//

var slice = [].slice,
    forEach = Ember.ArrayPolyfills.forEach;

// invokes passed params - normalizing so you can pass target/func,
// target/string or just func
/** @private */
function invoke(target, method, args, ignore) {

  if (method === undefined) {
    method = target;
    target = undefined;
  }

  if ('string' === typeof method) { method = target[method]; }
  if (args && ignore > 0) {
    args = args.length > ignore ? slice.call(args, ignore) : null;
  }

  // Unfortunately in some browsers we lose the backtrace if we rethrow the existing error,
  // so in the event that we don't have an `onerror` handler we don't wrap in a try/catch
  if ('function' === typeof Ember.onerror) {
    try {
      // IE8's Function.prototype.apply doesn't accept undefined/null arguments.
      return method.apply(target || this, args || []);
    } catch (error) {
      Ember.onerror(error);
    }
  } else {
    // IE8's Function.prototype.apply doesn't accept undefined/null arguments.
    return method.apply(target || this, args || []);
  }
}


// ..........................................................
// RUNLOOP
//

var timerMark; // used by timers...

/** @private */
var RunLoop = function(prev) {
  this._prev = prev || null;
  this.onceTimers = {};
};

RunLoop.prototype = {
  end: function() {
    this.flush();
  },

  prev: function() {
    return this._prev;
  },

  // ..........................................................
  // Delayed Actions
  //

  schedule: function(queueName, target, method) {
    var queues = this._queues, queue;
    if (!queues) { queues = this._queues = {}; }
    queue = queues[queueName];
    if (!queue) { queue = queues[queueName] = []; }

    var args = arguments.length > 3 ? slice.call(arguments, 3) : null;
    queue.push({ target: target, method: method, args: args });
    return this;
  },

  flush: function(queueName) {
    var queueNames, idx, len, queue, log;

    if (!this._queues) { return this; } // nothing to do

    function iter(item) {
      invoke(item.target, item.method, item.args);
    }

    Ember.watch.flushPending(); // make sure all chained watchers are setup

    if (queueName) {
      while (this._queues && (queue = this._queues[queueName])) {
        this._queues[queueName] = null;

        // the sync phase is to allow property changes to propagate.  don't
        // invoke observers until that is finished.
        if (queueName === 'sync') {
          log = Ember.LOG_BINDINGS;
          if (log) { Ember.Logger.log('Begin: Flush Sync Queue'); }

          Ember.beginPropertyChanges();
          try {
            forEach.call(queue, iter);
          } finally {
            Ember.endPropertyChanges();
          }

          if (log) { Ember.Logger.log('End: Flush Sync Queue'); }

        } else {
          forEach.call(queue, iter);
        }
      }

    } else {
      queueNames = Ember.run.queues;
      len = queueNames.length;
      idx = 0;

      outerloop:
      while (idx < len) {
        queueName = queueNames[idx];
        queue = this._queues && this._queues[queueName];
        delete this._queues[queueName];

        if (queue) {
          // the sync phase is to allow property changes to propagate.  don't
          // invoke observers until that is finished.
          if (queueName === 'sync') {
            log = Ember.LOG_BINDINGS;
            if (log) { Ember.Logger.log('Begin: Flush Sync Queue'); }

            Ember.beginPropertyChanges();
            try {
              forEach.call(queue, iter);
            } finally {
              Ember.endPropertyChanges();
            }

            if (log) { Ember.Logger.log('End: Flush Sync Queue'); }
          } else {
            forEach.call(queue, iter);
          }
        }

        // Loop through prior queues
        for (var i = 0; i <= idx; i++) {
          if (this._queues && this._queues[queueNames[i]]) {
            // Start over at the first queue with contents
            idx = i;
            continue outerloop;
          }
        }

        idx++;
      }
    }

    timerMark = null;

    return this;
  }

};

Ember.RunLoop = RunLoop;

// ..........................................................
// Ember.run - this is ideally the only public API the dev sees
//
/**
* @namespace Ember.run is both a function and a namespace for
* RunLoop-related functions.
* @name Ember.run
*/

/**
  Runs the passed target and method inside of a RunLoop, ensuring any
  deferred actions including bindings and views updates are flushed at the
  end.

  Normally you should not need to invoke this method yourself.  However if
  you are implementing raw event handlers when interfacing with other
  libraries or plugins, you should probably wrap all of your code inside this
  call.

      Ember.run(function(){
        // code to be execute within a RunLoop 
      });

  @name run
  @methodOf Ember.run
  @param {Object} target
    (Optional) target of method to call

  @param {Function|String} method
    Method to invoke.  May be a function or a string.  If you pass a string
    then it will be looked up on the passed target.

  @param {Object...} args
    Any additional arguments you wish to pass to the method.

  @returns {Object} return value from invoking the passed function.
*/
Ember.run = function(target, method) {
  var ret, loop;
  run.begin();
  try {
    if (target || method) { ret = invoke(target, method, arguments, 2); }
  } finally {
    run.end();
  }
  return ret;
};

/** @private */
var run = Ember.run;


/**
  Begins a new RunLoop.  Any deferred actions invoked after the begin will
  be buffered until you invoke a matching call to Ember.run.end().  This is
  an lower-level way to use a RunLoop instead of using Ember.run().

      Ember.run.begin();
      // code to be execute within a RunLoop 
      Ember.run.end();


  @returns {void}
*/
Ember.run.begin = function() {
  run.currentRunLoop = new RunLoop(run.currentRunLoop);
};

/**
  Ends a RunLoop.  This must be called sometime after you call Ember.run.begin()
  to flush any deferred actions.  This is a lower-level way to use a RunLoop
  instead of using Ember.run().

      Ember.run.begin();
      // code to be execute within a RunLoop 
      Ember.run.end();

  @returns {void}
*/
Ember.run.end = function() {
  Ember.assert('must have a current run loop', run.currentRunLoop);
  try {
    run.currentRunLoop.end();
  }
  finally {
    run.currentRunLoop = run.currentRunLoop.prev();
  }
};

/**
  Array of named queues.  This array determines the order in which queues
  are flushed at the end of the RunLoop.  You can define your own queues by
  simply adding the queue name to this array.  Normally you should not need
  to inspect or modify this property.

  @type Array
  @default ['sync', 'actions', 'destroy', 'timers']
*/
Ember.run.queues = ['sync', 'actions', 'destroy', 'timers'];

/**
  Adds the passed target/method and any optional arguments to the named
  queue to be executed at the end of the RunLoop.  If you have not already
  started a RunLoop when calling this method one will be started for you
  automatically.

  At the end of a RunLoop, any methods scheduled in this way will be invoked.
  Methods will be invoked in an order matching the named queues defined in
  the run.queues property.

      Ember.run.schedule('timers', this, function(){
        // this will be executed at the end of the RunLoop, when timers are run
        console.log("scheduled on timers queue");
      });
      Ember.run.schedule('sync', this, function(){
        // this will be executed at the end of the RunLoop, when bindings are synced
        console.log("scheduled on sync queue");
      });
      // Note the functions will be run in order based on the run queues order. Output would be:
      //   scheduled on sync queue
      //   scheduled on timers queue

  @param {String} queue
    The name of the queue to schedule against.  Default queues are 'sync' and
    'actions'

  @param {Object} target
    (Optional) target object to use as the context when invoking a method.

  @param {String|Function} method
    The method to invoke.  If you pass a string it will be resolved on the
    target object at the time the scheduled item is invoked allowing you to
    change the target function.

  @param {Object} arguments...
    Optional arguments to be passed to the queued method.

  @returns {void}
*/
Ember.run.schedule = function(queue, target, method) {
  var loop = run.autorun();
  loop.schedule.apply(loop, arguments);
};

var scheduledAutorun;
/** @private */
function autorun() {
  scheduledAutorun = null;
  if (run.currentRunLoop) { run.end(); }
}

// Used by global test teardown
/** @private */
Ember.run.hasScheduledTimers = function() {
  return !!(scheduledAutorun || scheduledLater || scheduledNext);
};

// Used by global test teardown
/** @private */
Ember.run.cancelTimers = function () {
  if (scheduledAutorun) {
    clearTimeout(scheduledAutorun);
    scheduledAutorun = null;
  }
  if (scheduledLater) {
    clearTimeout(scheduledLater);
    scheduledLater = null;
  }
  if (scheduledNext) {
    clearTimeout(scheduledNext);
    scheduledNext = null;
  }
  timers = {};
};

/**
  Begins a new RunLoop if necessary and schedules a timer to flush the
  RunLoop at a later time.  This method is used by parts of Ember to
  ensure the RunLoop always finishes.  You normally do not need to call this
  method directly.  Instead use Ember.run().

      Ember.run.autorun();

  @returns {Ember.RunLoop} the new current RunLoop
*/
Ember.run.autorun = function() {
  if (!run.currentRunLoop) {
    run.begin();

    if (!scheduledAutorun) {
      scheduledAutorun = setTimeout(autorun, 1);
    }
  }

  return run.currentRunLoop;
};

/**
  Immediately flushes any events scheduled in the 'sync' queue.  Bindings
  use this queue so this method is a useful way to immediately force all
  bindings in the application to sync.

  You should call this method anytime you need any changed state to propagate
  throughout the app immediately without repainting the UI.

      Ember.run.sync();

  @returns {void}
*/
Ember.run.sync = function() {
  run.autorun();
  run.currentRunLoop.flush('sync');
};

// ..........................................................
// TIMERS
//

var timers = {}; // active timers...

var scheduledLater;
/** @private */
function invokeLaterTimers() {
  scheduledLater = null;
  var now = (+ new Date()), earliest = -1;
  for (var key in timers) {
    if (!timers.hasOwnProperty(key)) { continue; }
    var timer = timers[key];
    if (timer && timer.expires) {
      if (now >= timer.expires) {
        delete timers[key];
        invoke(timer.target, timer.method, timer.args, 2);
      } else {
        if (earliest<0 || (timer.expires < earliest)) earliest=timer.expires;
      }
    }
  }

  // schedule next timeout to fire...
  if (earliest > 0) { scheduledLater = setTimeout(invokeLaterTimers, earliest-(+ new Date())); }
}

/**
  Invokes the passed target/method and optional arguments after a specified
  period if time.  The last parameter of this method must always be a number
  of milliseconds.

  You should use this method whenever you need to run some action after a
  period of time instead of using setTimeout().  This method will ensure that
  items that expire during the same script execution cycle all execute
  together, which is often more efficient than using a real setTimeout.

      Ember.run.later(myContext, function(){
        // code here will execute within a RunLoop in about 500ms with this == myContext
      }, 500);

  @param {Object} target
    (optional) target of method to invoke

  @param {Function|String} method
    The method to invoke.  If you pass a string it will be resolved on the
    target at the time the method is invoked.

  @param {Object...} args
    Optional arguments to pass to the timeout.

  @param {Number} wait
    Number of milliseconds to wait.

  @returns {String} a string you can use to cancel the timer in Ember.run.cancel() later.
*/
Ember.run.later = function(target, method) {
  var args, expires, timer, guid, wait;

  // setTimeout compatibility...
  if (arguments.length===2 && 'function' === typeof target) {
    wait   = method;
    method = target;
    target = undefined;
    args   = [target, method];
  } else {
    args = slice.call(arguments);
    wait = args.pop();
  }

  expires = (+ new Date()) + wait;
  timer   = { target: target, method: method, expires: expires, args: args };
  guid    = Ember.guidFor(timer);
  timers[guid] = timer;
  run.once(timers, invokeLaterTimers);
  return guid;
};

/** @private */
function invokeOnceTimer(guid, onceTimers) {
  if (onceTimers[this.tguid]) { delete onceTimers[this.tguid][this.mguid]; }
  if (timers[guid]) { invoke(this.target, this.method, this.args, 2); }
  delete timers[guid];
}

/**
  Schedules an item to run one time during the current RunLoop.  Calling
  this method with the same target/method combination will have no effect.

  Note that although you can pass optional arguments these will not be
  considered when looking for duplicates.  New arguments will replace previous
  calls.

      Ember.run(function(){
        var doFoo = function() { foo(); }
        Ember.run.once(myContext, doFoo);
        Ember.run.once(myContext, doFoo);
        // doFoo will only be executed once at the end of the RunLoop
      });

  @param {Object} target
    (optional) target of method to invoke

  @param {Function|String} method
    The method to invoke.  If you pass a string it will be resolved on the
    target at the time the method is invoked.

  @param {Object...} args
    Optional arguments to pass to the timeout.


  @returns {Object} timer
*/
Ember.run.once = function(target, method) {
  var tguid = Ember.guidFor(target),
      mguid = Ember.guidFor(method),
      onceTimers = run.autorun().onceTimers,
      guid = onceTimers[tguid] && onceTimers[tguid][mguid],
      timer;

  if (guid && timers[guid]) {
    timers[guid].args = slice.call(arguments); // replace args
  } else {
    timer = {
      target: target,
      method: method,
      args:   slice.call(arguments),
      tguid:  tguid,
      mguid:  mguid
    };

    guid  = Ember.guidFor(timer);
    timers[guid] = timer;
    if (!onceTimers[tguid]) { onceTimers[tguid] = {}; }
    onceTimers[tguid][mguid] = guid; // so it isn't scheduled more than once

    run.schedule('actions', timer, invokeOnceTimer, guid, onceTimers);
  }

  return guid;
};

var scheduledNext;
/** @private */
function invokeNextTimers() {
  scheduledNext = null;
  for(var key in timers) {
    if (!timers.hasOwnProperty(key)) { continue; }
    var timer = timers[key];
    if (timer.next) {
      delete timers[key];
      invoke(timer.target, timer.method, timer.args, 2);
    }
  }
}

/**
  Schedules an item to run after control has been returned to the system.
  This is often equivalent to calling setTimeout(function...,1).

      Ember.run.next(myContext, function(){
        // code to be executed in the next RunLoop, which will be scheduled after the current one
      });

  @param {Object} target
    (optional) target of method to invoke

  @param {Function|String} method
    The method to invoke.  If you pass a string it will be resolved on the
    target at the time the method is invoked.

  @param {Object...} args
    Optional arguments to pass to the timeout.

  @returns {Object} timer
*/
Ember.run.next = function(target, method) {
  var guid,
      timer = {
        target: target,
        method: method,
        args: slice.call(arguments),
        next: true
      };

  guid = Ember.guidFor(timer);
  timers[guid] = timer;

  if (!scheduledNext) { scheduledNext = setTimeout(invokeNextTimers, 1); }
  return guid;
};

/**
  Cancels a scheduled item.  Must be a value returned by `Ember.run.later()`,
  `Ember.run.once()`, or `Ember.run.next()`.

      var runNext = Ember.run.next(myContext, function(){
        // will not be executed
      });
      Ember.run.cancel(runNext);

      var runLater = Ember.run.later(myContext, function(){
        // will not be executed
      }, 500);
      Ember.run.cancel(runLater);

      var runOnce = Ember.run.once(myContext, function(){
        // will not be executed
      });
      Ember.run.cancel(runOnce);

  @param {Object} timer
    Timer object to cancel

  @returns {void}
*/
Ember.run.cancel = function(timer) {
  delete timers[timer];
};

})();



(function() {
// ==========================================================================
// Project:  Ember Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
// Ember.Logger
// get, getPath, setPath, trySetPath
// guidFor, isArray, meta
// addObserver, removeObserver
// Ember.run.schedule
// ..........................................................
// CONSTANTS
//

/**
  @static

  Debug parameter you can turn on. This will log all bindings that fire to
  the console. This should be disabled in production code. Note that you
  can also enable this from the console or temporarily.

  @type Boolean
  @default false
*/
Ember.LOG_BINDINGS = false || !!Ember.ENV.LOG_BINDINGS;

var get     = Ember.get,
    getPath = Ember.getPath,
    setPath = Ember.setPath,
    guidFor = Ember.guidFor,
    isGlobalPath = Ember.isGlobalPath;


/** @private */
function getPathWithGlobals(obj, path) {
  return getPath(isGlobalPath(path) ? window : obj, path);
}

// ..........................................................
// BINDING
//

/** @private */
var Binding = function(toPath, fromPath) {
  this._direction = 'fwd';
  this._from = fromPath;
  this._to   = toPath;
  this._directionMap = Ember.Map.create();
};

Binding.prototype = /** @scope Ember.Binding.prototype */ {
  /**
    This copies the Binding so it can be connected to another object.
    @returns {Ember.Binding}
  */
  copy: function () {
    var copy = new Binding(this._to, this._from);
    if (this._oneWay) { copy._oneWay = true; }
    return copy;
  },

  // ..........................................................
  // CONFIG
  //

  /**
    This will set "from" property path to the specified value. It will not
    attempt to resolve this property path to an actual object until you
    connect the binding.

    The binding will search for the property path starting at the root object
    you pass when you connect() the binding.  It follows the same rules as
    `getPath()` - see that method for more information.

    @param {String} propertyPath the property path to connect to
    @returns {Ember.Binding} receiver
  */
  from: function(path) {
    this._from = path;
    return this;
  },

  /**
    This will set the "to" property path to the specified value. It will not
    attempt to resolve this property path to an actual object until you
    connect the binding.

    The binding will search for the property path starting at the root object
    you pass when you connect() the binding.  It follows the same rules as
    `getPath()` - see that method for more information.

    @param {String|Tuple} propertyPath A property path or tuple
    @returns {Ember.Binding} this
  */
  to: function(path) {
    this._to = path;
    return this;
  },

  /**
    Configures the binding as one way. A one-way binding will relay changes
    on the "from" side to the "to" side, but not the other way around. This
    means that if you change the "to" side directly, the "from" side may have
    a different value.

    @returns {Ember.Binding} receiver
  */
  oneWay: function() {
    this._oneWay = true;
    return this;
  },

  /** @private */
  toString: function() {
    var oneWay = this._oneWay ? '[oneWay]' : '';
    return "Ember.Binding<" + guidFor(this) + ">(" + this._from + " -> " + this._to + ")" + oneWay;
  },

  // ..........................................................
  // CONNECT AND SYNC
  //

  /**
    Attempts to connect this binding instance so that it can receive and relay
    changes. This method will raise an exception if you have not set the
    from/to properties yet.

    @param {Object} obj The root object for this binding.
    @returns {Ember.Binding} this
  */
  connect: function(obj) {
    Ember.assert('Must pass a valid object to Ember.Binding.connect()', !!obj);

    var fromPath = this._from, toPath = this._to;
    Ember.trySetPath(obj, toPath, getPathWithGlobals(obj, fromPath));

    // add an observer on the object to be notified when the binding should be updated
    Ember.addObserver(obj, fromPath, this, this.fromDidChange);

    // if the binding is a two-way binding, also set up an observer on the target
    if (!this._oneWay) { Ember.addObserver(obj, toPath, this, this.toDidChange); }

    this._readyToSync = true;

    return this;
  },

  /**
    Disconnects the binding instance. Changes will no longer be relayed. You
    will not usually need to call this method.

    @param {Object} obj
      The root object you passed when connecting the binding.

    @returns {Ember.Binding} this
  */
  disconnect: function(obj) {
    Ember.assert('Must pass a valid object to Ember.Binding.disconnect()', !!obj);

    var twoWay = !this._oneWay;

    // remove an observer on the object so we're no longer notified of
    // changes that should update bindings.
    Ember.removeObserver(obj, this._from, this, this.fromDidChange);

    // if the binding is two-way, remove the observer from the target as well
    if (twoWay) { Ember.removeObserver(obj, this._to, this, this.toDidChange); }

    this._readyToSync = false; // disable scheduled syncs...
    return this;
  },

  // ..........................................................
  // PRIVATE
  //

  /** @private - called when the from side changes */
  fromDidChange: function(target) {
    this._scheduleSync(target, 'fwd');
  },

  /** @private - called when the to side changes */
  toDidChange: function(target) {
    this._scheduleSync(target, 'back');
  },

  /** @private */
  _scheduleSync: function(obj, dir) {
    var directionMap = this._directionMap;
    var existingDir = directionMap.get(obj);

    // if we haven't scheduled the binding yet, schedule it
    if (!existingDir) {
      Ember.run.schedule('sync', this, this._sync, obj);
      directionMap.set(obj, dir);
    }

    // If both a 'back' and 'fwd' sync have been scheduled on the same object,
    // default to a 'fwd' sync so that it remains deterministic.
    if (existingDir === 'back' && dir === 'fwd') {
      directionMap.set(obj, 'fwd');
    }
  },

  /** @private */
  _sync: function(obj) {
    var log = Ember.LOG_BINDINGS;

    // don't synchronize destroyed objects or disconnected bindings
    if (obj.isDestroyed || !this._readyToSync) { return; }

    // get the direction of the binding for the object we are
    // synchronizing from
    var directionMap = this._directionMap;
    var direction = directionMap.get(obj);

    var fromPath = this._from, toPath = this._to;

    directionMap.remove(obj);

    // if we're synchronizing from the remote object...
    if (direction === 'fwd') {
      var fromValue = getPathWithGlobals(obj, this._from);
      if (log) {
        Ember.Logger.log(' ', this.toString(), '->', fromValue, obj);
      }
      if (this._oneWay) {
        Ember.trySetPath(obj, toPath, fromValue);
      } else {
        Ember._suspendObserver(obj, toPath, this, this.toDidChange, function () {
          Ember.trySetPath(obj, toPath, fromValue);
        });
      }
    // if we're synchronizing *to* the remote object
    } else if (direction === 'back') {
      var toValue = getPath(obj, this._to);
      if (log) {
        Ember.Logger.log(' ', this.toString(), '<-', toValue, obj);
      }
      Ember._suspendObserver(obj, fromPath, this, this.fromDidChange, function () {
        Ember.trySetPath(Ember.isGlobalPath(fromPath) ? window : obj, fromPath, toValue);
      });
    }
  }

};

/** @private */
function mixinProperties(to, from) {
  for (var key in from) {
    if (from.hasOwnProperty(key)) {
      to[key] = from[key];
    }
  }
}

mixinProperties(Binding,
/** @scope Ember.Binding */ {

  /**
    @see Ember.Binding.prototype.from
  */
  from: function() {
    var C = this, binding = new C();
    return binding.from.apply(binding, arguments);
  },

  /**
    @see Ember.Binding.prototype.to
  */
  to: function() {
    var C = this, binding = new C();
    return binding.to.apply(binding, arguments);
  },

  /**
    Creates a new Binding instance and makes it apply in a single direction.
    A one-way binding will relay changes on the "from" side object (supplies
    as the `from` argument) the "to" side, but not the other way around.
    This means that if you change the "to" side directly, the "from" side may have
    a different value.

    @param {String} from from path.
    @param {Boolean} [flag] (Optional) passing nothing here will make the binding oneWay.  You can
    instead pass false to disable oneWay, making the binding two way again.

    @see Ember.Binding.prototype.oneWay
  */
  oneWay: function(from, flag) {
    var C = this, binding = new C(null, from);
    return binding.oneWay(flag);
  }

});

/**
  @class

  An Ember.Binding connects the properties of two objects so that whenever the
  value of one property changes, the other property will be changed also.

  ## Automatic Creation of Bindings with `/^*Binding/`-named Properties
  You do not usually create Binding objects directly but instead describe
  bindings in your class or object definition using automatic binding detection.

  Properties ending in a `Binding` suffix will be converted to Ember.Binding instances.
  The value of this property should be a string representing a path to another object or
  a custom binding instanced created using Binding helpers (see "Customizing Your Bindings"):

        valueBinding: "MyApp.someController.title"

  This will create a binding from `MyApp.someController.title` to the `value`
  property of your object instance automatically. Now the two values will be
  kept in sync.

  ## One Way Bindings

  One especially useful binding customization you can use is the `oneWay()`
  helper. This helper tells Ember that you are only interested in
  receiving changes on the object you are binding from. For example, if you
  are binding to a preference and you want to be notified if the preference
  has changed, but your object will not be changing the preference itself, you
  could do:

        bigTitlesBinding: Ember.Binding.oneWay("MyApp.preferencesController.bigTitles")

  This way if the value of MyApp.preferencesController.bigTitles changes the
  "bigTitles" property of your object will change also. However, if you
  change the value of your "bigTitles" property, it will not update the
  preferencesController.

  One way bindings are almost twice as fast to setup and twice as fast to
  execute because the binding only has to worry about changes to one side.

  You should consider using one way bindings anytime you have an object that
  may be created frequently and you do not intend to change a property; only
  to monitor it for changes. (such as in the example above).

  ## How to Manually Add Binding

  All of the examples above show you how to configure a custom binding, but
  the result of these customizations will be a binding template, not a fully
  active Binding instance. The binding will actually become active only when you
  instantiate the object the binding belongs to. It is useful however, to
  understand what actually happens when the binding is activated.

  For a binding to function it must have at least a "from" property and a "to"
  property. The from property path points to the object/key that you want to
  bind from while the to path points to the object/key you want to bind to.

  When you define a custom binding, you are usually describing the property
  you want to bind from (such as "MyApp.someController.value" in the examples
  above). When your object is created, it will automatically assign the value
  you want to bind "to" based on the name of your binding key. In the
  examples above, during init, Ember objects will effectively call
  something like this on your binding:

        binding = Ember.Binding.from(this.valueBinding).to("value");

  This creates a new binding instance based on the template you provide, and
  sets the to path to the "value" property of the new object. Now that the
  binding is fully configured with a "from" and a "to", it simply needs to be
  connected to become active. This is done through the connect() method:

        binding.connect(this);

  Note that when you connect a binding you pass the object you want it to be
  connected to.  This object will be used as the root for both the from and
  to side of the binding when inspecting relative paths.  This allows the
  binding to be automatically inherited by subclassed objects as well.

  Now that the binding is connected, it will observe both the from and to side
  and relay changes.

  If you ever needed to do so (you almost never will, but it is useful to
  understand this anyway), you could manually create an active binding by
  using the Ember.bind() helper method. (This is the same method used by
  to setup your bindings on objects):

        Ember.bind(MyApp.anotherObject, "value", "MyApp.someController.value");

  Both of these code fragments have the same effect as doing the most friendly
  form of binding creation like so:

        MyApp.anotherObject = Ember.Object.create({
          valueBinding: "MyApp.someController.value",

          // OTHER CODE FOR THIS OBJECT...

        });

  Ember's built in binding creation method makes it easy to automatically
  create bindings for you. You should always use the highest-level APIs
  available, even if you understand how it works underneath.

  @since Ember 0.9
*/
Ember.Binding = Binding;

/**
  Global helper method to create a new binding.  Just pass the root object
  along with a to and from path to create and connect the binding.

  @param {Object} obj
    The root object of the transform.

  @param {String} to
    The path to the 'to' side of the binding.  Must be relative to obj.

  @param {String} from
    The path to the 'from' side of the binding.  Must be relative to obj or
    a global path.

  @returns {Ember.Binding} binding instance
*/
Ember.bind = function(obj, to, from) {
  return new Ember.Binding(to, from).connect(obj);
};

Ember.oneWay = function(obj, to, from) {
  return new Ember.Binding(to, from).oneWay().connect(obj);
};

})();



(function() {
// ==========================================================================
// Project:  Ember Runtime
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================
var Mixin, REQUIRED, Alias,
    classToString, superClassString,
    a_map = Ember.ArrayPolyfills.map,
    a_indexOf = Ember.ArrayPolyfills.indexOf,
    a_forEach = Ember.ArrayPolyfills.forEach,
    a_slice = [].slice,
    EMPTY_META = {}, // dummy for non-writable meta
    META_SKIP = { __emberproto__: true, __ember_count__: true },
    o_create = Ember.create,
    defineProperty = Ember.defineProperty,
    guidFor = Ember.guidFor;

/** @private */
function mixinsMeta(obj) {
  var m = Ember.meta(obj, true), ret = m.mixins;
  if (!ret) {
    ret = m.mixins = { __emberproto__: obj };
  } else if (ret.__emberproto__ !== obj) {
    ret = m.mixins = o_create(ret);
    ret.__emberproto__ = obj;
  }
  return ret;
}

/** @private */
function initMixin(mixin, args) {
  if (args && args.length > 0) {
    mixin.mixins = a_map.call(args, function(x) {
      if (x instanceof Mixin) { return x; }

      // Note: Manually setup a primitive mixin here.  This is the only
      // way to actually get a primitive mixin.  This way normal creation
      // of mixins will give you combined mixins...
      var mixin = new Mixin();
      mixin.properties = x;
      return mixin;
    });
  }
  return mixin;
}

/** @private */
function isMethod(obj) {
  return 'function' === typeof obj &&
         obj.isMethod !== false &&
         obj !== Boolean && obj !== Object && obj !== Number && obj !== Array && obj !== Date && obj !== String;
}

/** @private */
function mergeMixins(mixins, m, descs, values, base) {
  var len = mixins.length, idx, mixin, guid, props, value, key, ovalue, concats;

  /** @private */
  function removeKeys(keyName) {
    delete descs[keyName];
    delete values[keyName];
  }

  for(idx=0; idx < len; idx++) {
    mixin = mixins[idx];
    Ember.assert('Expected hash or Mixin instance, got ' + Object.prototype.toString.call(mixin), typeof mixin === 'object' && mixin !== null && Object.prototype.toString.call(mixin) !== '[object Array]');

    if (mixin instanceof Mixin) {
      guid = guidFor(mixin);
      if (m[guid]) { continue; }
      m[guid] = mixin;
      props = mixin.properties;
    } else {
      props = mixin; // apply anonymous mixin properties
    }

    if (props) {
      // reset before adding each new mixin to pickup concats from previous
      concats = values.concatenatedProperties || base.concatenatedProperties;
      if (props.concatenatedProperties) {
        concats = concats ? concats.concat(props.concatenatedProperties) : props.concatenatedProperties;
      }

      for (key in props) {
        if (!props.hasOwnProperty(key)) { continue; }
        value = props[key];
        if (value instanceof Ember.Descriptor) {
          if (value === REQUIRED && descs[key]) { continue; }

          descs[key]  = value;
          values[key] = undefined;
        } else {
          // impl super if needed...
          if (isMethod(value)) {
            ovalue = descs[key] === undefined && values[key];
            if (!ovalue) { ovalue = base[key]; }
            if ('function' !== typeof ovalue) { ovalue = null; }
            if (ovalue) {
              var o = value.__ember_observes__, ob = value.__ember_observesBefore__;
              value = Ember.wrap(value, ovalue);
              value.__ember_observes__ = o;
              value.__ember_observesBefore__ = ob;
            }
          } else if ((concats && a_indexOf.call(concats, key) >= 0) || key === 'concatenatedProperties') {
            var baseValue = values[key] || base[key];
            value = baseValue ? baseValue.concat(value) : Ember.makeArray(value);
          }

          descs[key] = undefined;
          values[key] = value;
        }
      }

      // manually copy toString() because some JS engines do not enumerate it
      if (props.hasOwnProperty('toString')) {
        base.toString = props.toString;
      }

    } else if (mixin.mixins) {
      mergeMixins(mixin.mixins, m, descs, values, base);
      if (mixin._without) { a_forEach.call(mixin._without, removeKeys); }
    }
  }
}

/** @private */
function writableReq(obj) {
  var m = Ember.meta(obj), req = m.required;
  if (!req || req.__emberproto__ !== obj) {
    req = m.required = req ? o_create(req) : { __ember_count__: 0 };
    req.__emberproto__ = obj;
  }
  return req;
}

var IS_BINDING = Ember.IS_BINDING = /^.+Binding$/;

/** @private */
function detectBinding(obj, key, value, m) {
  if (IS_BINDING.test(key)) {
    var bindings = m.bindings;
    if (!bindings) {
      bindings = m.bindings = { __emberproto__: obj };
    } else if (bindings.__emberproto__ !== obj) {
      bindings = m.bindings = o_create(m.bindings);
      bindings.__emberproto__ = obj;
    }
    bindings[key] = value;
  }
}

/** @private */
function connectBindings(obj, m) {
  // TODO Mixin.apply(instance) should disconnect binding if exists
  var bindings = m.bindings, key, binding, to;
  if (bindings) {
    for (key in bindings) {
      binding = key !== '__emberproto__' && bindings[key];
      if (binding) {
        to = key.slice(0, -7); // strip Binding off end
        if (binding instanceof Ember.Binding) {
          binding = binding.copy(); // copy prototypes' instance
          binding.to(to);
        } else { // binding is string path
          binding = new Ember.Binding(to, binding);
        }
        binding.connect(obj);
        obj[key] = binding;
      }
    }
    // mark as applied
    m.bindings = { __emberproto__: obj };
  }
}

function finishPartial(obj, m) {
  connectBindings(obj, m || Ember.meta(obj));
  return obj;
}

/** @private */
function applyMixin(obj, mixins, partial) {
  var descs = {}, values = {}, m = Ember.meta(obj), req = m.required,
      key, value, desc, prevValue, paths, len, idx;

  // Go through all mixins and hashes passed in, and:
  //
  // * Handle concatenated properties
  // * Set up _super wrapping if necessary
  // * Set up computed property descriptors
  // * Copying `toString` in broken browsers
  mergeMixins(mixins, mixinsMeta(obj), descs, values, obj);

  for(key in values) {
    if (key === 'contructor') { continue; }
    if (!values.hasOwnProperty(key)) { continue; }

    desc = descs[key];
    value = values[key];

    if (desc === REQUIRED) {
      if (!(key in obj)) {
        Ember.assert('Required property not defined: '+key, !!partial);

        // for partial applies add to hash of required keys
        req = writableReq(obj);
        req.__ember_count__++;
        req[key] = true;
      }
    } else {
      while (desc && desc instanceof Alias) {
        var altKey = desc.methodName;
        if (descs[altKey] || values[altKey]) {
          value = values[altKey];
          desc  = descs[altKey];
        } else if (m.descs[altKey]) {
          desc  = m.descs[altKey];
          value = undefined;
        } else {
          desc = undefined;
          value = obj[altKey];
        }
      }

      if (desc === undefined && value === undefined) { continue; }

      prevValue = obj[key];

      if ('function' === typeof prevValue) {
        if ((paths = prevValue.__ember_observesBefore__)) {
          len = paths.length;
          for (idx=0; idx < len; idx++) {
            Ember.removeBeforeObserver(obj, paths[idx], null, key);
          }
        } else if ((paths = prevValue.__ember_observes__)) {
          len = paths.length;
          for (idx=0; idx < len; idx++) {
            Ember.removeObserver(obj, paths[idx], null, key);
          }
        }
      }

      detectBinding(obj, key, value, m);

      defineProperty(obj, key, desc, value, m);

      if ('function' === typeof value) {
        if (paths = value.__ember_observesBefore__) {
          len = paths.length;
          for (idx=0; idx < len; idx++) {
            Ember.addBeforeObserver(obj, paths[idx], null, key);
          }
        } else if (paths = value.__ember_observes__) {
          len = paths.length;
          for (idx=0; idx < len; idx++) {
            Ember.addObserver(obj, paths[idx], null, key);
          }
        }
      }

      if (req && req[key]) {
        req = writableReq(obj);
        req.__ember_count__--;
        req[key] = false;
      }
    }
  }

  if (!partial) { // don't apply to prototype
    finishPartial(obj, m);
  }

  // Make sure no required attrs remain
  if (!partial && req && req.__ember_count__>0) {
    var keys = [];
    for (key in req) {
      if (META_SKIP[key]) { continue; }
      keys.push(key);
    }
    // TODO: Remove surrounding if clause from production build
    Ember.assert('Required properties not defined: '+keys.join(','));
  }
  return obj;
}

Ember.mixin = function(obj) {
  var args = a_slice.call(arguments, 1);
  applyMixin(obj, args, false);
  return obj;
};

/**
  @class

  The `Ember.Mixin` class allows you to create mixins, whose properties can be
  added to other classes. For instance,

      App.Editable = Ember.Mixin.create({
        edit: function() {
          console.log('starting to edit');
          this.set('isEditing', true);
        },
        isEditing: false
      });

      // Mix mixins into classes by passing them as the first arguments to
      // .extend or .create.
      App.CommentView = Ember.View.extend(App.Editable, {
        template: Ember.Handlebars.compile('{{#if isEditing}}...{{else}}...{{/if}}')
      });

      commentView = App.CommentView.create();
      commentView.edit(); // => outputs 'starting to edit'

  Note that Mixins are created with `Ember.Mixin.create`, not
  `Ember.Mixin.extend`.
*/
Ember.Mixin = function() { return initMixin(this, arguments); };

/** @private */
Mixin = Ember.Mixin;

/** @private */
Mixin._apply = applyMixin;

Mixin.applyPartial = function(obj) {
  var args = a_slice.call(arguments, 1);
  return applyMixin(obj, args, true);
};

Mixin.finishPartial = finishPartial;

Mixin.create = function() {
  classToString.processed = false;
  var M = this;
  return initMixin(new M(), arguments);
};

var MixinPrototype = Mixin.prototype;

MixinPrototype.reopen = function() {
  var mixin, tmp;

  if (this.properties) {
    mixin = Mixin.create();
    mixin.properties = this.properties;
    delete this.properties;
    this.mixins = [mixin];
  } else if (!this.mixins) {
    this.mixins = [];
  }

  var len = arguments.length, mixins = this.mixins, idx;

  for(idx=0; idx < len; idx++) {
    mixin = arguments[idx];
    Ember.assert('Expected hash or Mixin instance, got ' + Object.prototype.toString.call(mixin), typeof mixin === 'object' && mixin !== null && Object.prototype.toString.call(mixin) !== '[object Array]');

    if (mixin instanceof Mixin) {
      mixins.push(mixin);
    } else {
      tmp = Mixin.create();
      tmp.properties = mixin;
      mixins.push(tmp);
    }
  }

  return this;
};

MixinPrototype.apply = function(obj) {
  return applyMixin(obj, [this], false);
};

MixinPrototype.applyPartial = function(obj) {
  return applyMixin(obj, [this], true);
};

/** @private */
function _detect(curMixin, targetMixin, seen) {
  var guid = guidFor(curMixin);

  if (seen[guid]) { return false; }
  seen[guid] = true;

  if (curMixin === targetMixin) { return true; }
  var mixins = curMixin.mixins, loc = mixins ? mixins.length : 0;
  while (--loc >= 0) {
    if (_detect(mixins[loc], targetMixin, seen)) { return true; }
  }
  return false;
}

MixinPrototype.detect = function(obj) {
  if (!obj) { return false; }
  if (obj instanceof Mixin) { return _detect(obj, this, {}); }
  var mixins = Ember.meta(obj, false).mixins;
  if (mixins) {
    return !!mixins[guidFor(this)];
  }
  return false;
};

MixinPrototype.without = function() {
  var ret = new Mixin(this);
  ret._without = a_slice.call(arguments);
  return ret;
};

/** @private */
function _keys(ret, mixin, seen) {
  if (seen[guidFor(mixin)]) { return; }
  seen[guidFor(mixin)] = true;

  if (mixin.properties) {
    var props = mixin.properties;
    for (var key in props) {
      if (props.hasOwnProperty(key)) { ret[key] = true; }
    }
  } else if (mixin.mixins) {
    a_forEach.call(mixin.mixins, function(x) { _keys(ret, x, seen); });
  }
}

MixinPrototype.keys = function() {
  var keys = {}, seen = {}, ret = [];
  _keys(keys, this, seen);
  for(var key in keys) {
    if (keys.hasOwnProperty(key)) { ret.push(key); }
  }
  return ret;
};

/** @private - make Mixin's have nice displayNames */

var NAME_KEY = Ember.GUID_KEY+'_name';
var get = Ember.get;

/** @private */
function processNames(paths, root, seen) {
  var idx = paths.length;
  for(var key in root) {
    if (!root.hasOwnProperty || !root.hasOwnProperty(key)) { continue; }
    var obj = root[key];
    paths[idx] = key;

    if (obj && obj.toString === classToString) {
      obj[NAME_KEY] = paths.join('.');
    } else if (obj && get(obj, 'isNamespace')) {
      if (seen[guidFor(obj)]) { continue; }
      seen[guidFor(obj)] = true;
      processNames(paths, obj, seen);
    }
  }
  paths.length = idx; // cut out last item
}

/** @private */
function findNamespaces() {
  var Namespace = Ember.Namespace, obj, isNamespace;

  if (Namespace.PROCESSED) { return; }

  for (var prop in window) {
    //  get(window.globalStorage, 'isNamespace') would try to read the storage for domain isNamespace and cause exception in Firefox.
    // globalStorage is a storage obsoleted by the WhatWG storage specification. See https://developer.mozilla.org/en/DOM/Storage#globalStorage
    if (prop === "globalStorage" && window.StorageList && window.globalStorage instanceof window.StorageList) { continue; }
    // Unfortunately, some versions of IE don't support window.hasOwnProperty
    if (window.hasOwnProperty && !window.hasOwnProperty(prop)) { continue; }

    // At times we are not allowed to access certain properties for security reasons.
    // There are also times where even if we can access them, we are not allowed to access their properties.
    try {
      obj = window[prop];
      isNamespace = obj && get(obj, 'isNamespace');
    } catch (e) {
      continue;
    }

    if (isNamespace) {
      Ember.deprecate("Namespaces should not begin with lowercase.", /^[A-Z]/.test(prop));
      obj[NAME_KEY] = prop;
    }
  }
}

Ember.identifyNamespaces = findNamespaces;

/** @private */
superClassString = function(mixin) {
  var superclass = mixin.superclass;
  if (superclass) {
    if (superclass[NAME_KEY]) { return superclass[NAME_KEY]; }
    else { return superClassString(superclass); }
  } else {
    return;
  }
};

/** @private */
classToString = function() {
  var Namespace = Ember.Namespace, namespace;

  // TODO: Namespace should really be in Metal
  if (Namespace) {
    if (!this[NAME_KEY] && !classToString.processed) {
      if (!Namespace.PROCESSED) {
        findNamespaces();
        Namespace.PROCESSED = true;
      }

      classToString.processed = true;

      var namespaces = Namespace.NAMESPACES;
      for (var i=0, l=namespaces.length; i<l; i++) {
        namespace = namespaces[i];
        processNames([namespace.toString()], namespace, {});
      }
    }
  }

  if (this[NAME_KEY]) {
    return this[NAME_KEY];
  } else {
    var str = superClassString(this);
    if (str) {
      return "(subclass of " + str + ")";
    } else {
      return "(unknown mixin)";
    }
  }
};

MixinPrototype.toString = classToString;

// returns the mixins currently applied to the specified object
// TODO: Make Ember.mixin
Mixin.mixins = function(obj) {
  var ret = [], mixins = Ember.meta(obj, false).mixins, key, mixin;
  if (mixins) {
    for(key in mixins) {
      if (META_SKIP[key]) { continue; }
      mixin = mixins[key];

      // skip primitive mixins since these are always anonymous
      if (!mixin.properties) { ret.push(mixins[key]); }
    }
  }
  return ret;
};

REQUIRED = new Ember.Descriptor();
REQUIRED.toString = function() { return '(Required Property)'; };

Ember.required = function() {
  return REQUIRED;
};

/** @private */
Alias = function(methodName) {
  this.methodName = methodName;
};
Alias.prototype = new Ember.Descriptor();

Ember.alias = function(methodName) {
  return new Alias(methodName);
};

// ..........................................................
// OBSERVER HELPER
//

Ember.observer = function(func) {
  var paths = a_slice.call(arguments, 1);
  func.__ember_observes__ = paths;
  return func;
};

Ember.beforeObserver = function(func) {
  var paths = a_slice.call(arguments, 1);
  func.__ember_observesBefore__ = paths;
  return func;
};

})();



(function() {
// ==========================================================================
// Project:  Ember Metal
// Copyright: ©2011 Strobe Inc. and contributors.
// License:   Licensed under MIT license (see license.js)
// ==========================================================================

})();

