try {
(function() {
  var OO = {};

  OO.VERSION = {
    "core" : {"releaseVersion": "4.8.5", "rev": "<CORE_REV>"}
  };

  OO.playerParams = {
    "core_version" : 4,
    "vast_proxy_url" : "http://player.ooyala.com/adinsertion/vast_proxy",
    "namespace": "OOV4"
  };


  OO.publicApi = OO.publicApi || {};

  // used for inserting player_params in dev harness version
  // please don't remove
  // the corresponding insertion code is found at start.js

  /*INSERT_PLAYER_PARAMS*/
  OO.playerParams = OO.playerParams || {};

  var consoleFilter;
  var recordingConsole = false;
  var MAX_CONSOLE_OUTPUT_LINES = 2000;

  /**
   * This stores the output recorded from calls to OO.log.  Recording is started
   * with OO.startRecordingConsoleOutput and stopped with OO.stopRecordingConsoleOutput.
   * @property OO#consoleOutput
   */
  OO.consoleOutput = [];

  OO.log = function() {
    if (typeof(window.console) != "undefined" && typeof(window.console.log) == "function") {
      if(OO.playerParams.debug) {
        window.console.log.apply(window.console, arguments);
      }
    }

    if (recordingConsole) {
      var toAppend = "";
      var i;
      for (i = 0; i < arguments.length; i++) {
        toAppend += arguments[i] + " ";
      }

      if (!OO.consoleOutput) {
        OO.consoleOutput = [];
      }

      var regexFilter;
      if (consoleFilter) {
        regexFilter = new RegExp(consoleFilter);
      }

      //check if the resulting output should be filtered out or not
      if (!regexFilter || regexFilter.test(toAppend))
      {
        //if we are going over the max number of lines to store, remove the oldest one.
        if (OO.consoleOutput.length >= MAX_CONSOLE_OUTPUT_LINES) {
          OO.consoleOutput.shift();
        }
        OO.consoleOutput.push(toAppend);
      }
    }
  };

  /**
   * Enables recording the output sent to OO.log. To see the output check the value
   * of OO.consoleOutput
   * @method OO#startRecordingConsoleOutput
   * @return string Message that states recording was started (Main for debugging in console)
   */
  OO.startRecordingConsoleOutput = function(filter) {
    consoleFilter = filter;
    recordingConsole = true;
    return "CONSOLE RECORDING STARTED";
  };

  /**
   * Disables recording the output sent to OO.log. To see the output check the value
   * of OO.consoleOutput
   * @method OO#stopRecordingConsoleOutput
   * @return string Message that states recording was stopped (Main for debugging in console)
   */
  OO.stopRecordingConsoleOutput = function() {
    recordingConsole = false;
    return "CONSOLE RECORDING STOPPED";
  };

  /**
   * Clears the value stored in OO.consoleOutput.
   * @method OO#clearRecordedConsoleOutput
   * @return string Message that states recorded output was cleared (Main for debugging in console)
   */
  OO.clearRecordedConsoleOutput = function() {
    if (!OO.consoleOutput) {
      OO.consoleOutput = [];
    }
    OO.consoleOutput.splice(0, OO.consoleOutput.length);
    return "CONSOLE RECORDING CLEARED";
  };

  /**
   * Set max number of lines to record. If new number is less than current output
   * it will delete the oldest lines to fit.
   * @method OO#setMaxConsoleOutputLines
   */
   OO.setMaxConsoleOutputLines = function(numLines) {
     if (!OO.consoleOutput) {
       OO.consoleOutput = [];
     }

     if (numLines < OO.consoleOutput.length) {
       OO.consoleOutput.splice(0, OO.consoleOutput.length - numLines);
     }
     MAX_CONSOLE_OUTPUT_LINES = numLines;
     return "CONSOLE MAX LINES: " + MAX_CONSOLE_OUTPUT_LINES;
   };

  // Compatibility for browsers without native JSON library (IE)
  if(!window.JSON) {
    window.JSON = {
        stringify: function(obj) {return '<object>';},
        __end_marker: true
    };
  }

  // Compatibility for browsers without native Array.prototype.indexOf (IE..)
  if(!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(obj, start) {
      var i, j = this.length;
      for (i = (start || 0); i < j; i++) {
         if (this[i] === obj) { return i; }
      }
      return -1;
    };
  }

  // namespace resolution
  var namespace = OO.playerParams.namespace || 'OO'; // default namespace is OO
  // Check if there is any conflicts here. (If we load one version of player already.)
  if (window[namespace] && window[namespace].Player) {
    OO.log("PlayerV3 is loaded already!!!");
    if (window[namespace].REV != OO.publicApi.REV) {
      OO.log("there is a different VERSION loaded:", window[namespace].REV, OO.publicApi.REV);
    }
    // throw "PlayerV3 already defined!!";
  }

  //we want to maintain a subset of the namespace so that OO.ready is available
  //as soon as this first script loads
  //do not clobber namespace.__static
  if (window[namespace] && window[namespace].__static) {
    OO.publicApi.__static = window[namespace].__static;
  } else {
    OO.publicApi.__static = {
      readyList:[],
      docReady: false,
      apiReady: false
   };
  }
  window[namespace] = OO.publicApi;
  window[namespace].__internal = OO;

  OO.isReady = function() {
    return OO.publicApi.__static.apiReady && OO.publicApi.__static.docReady;
  };

  OO.tryCallReady = function() {
    if (!OO.isReady()) { return;}
    while (OO.publicApi.__static.readyList.length > 0) {
      var fn = OO.publicApi.__static.readyList.pop();
      if (typeof fn === "function") {
        try {
          fn(OO.publicApi);
        } catch(e) {
          OO.log("Error executing ready function", e, e.stack);
        }
      }
    }
    return;
  };

  OO.publicApi.ready = function(fn) {
    OO.publicApi.__static.readyList.unshift(fn);
    OO.tryCallReady();
  };

  var curOO = OO;
  OO.publicApi.plugin = function(moduleName, moduleClassFactory) {
    // This is to make sure side load module will register to the correct canary code.
    if (curOO.isReady()) {
      OO.log("plugin is ready to register", curOO, moduleName);
      curOO.plugin(moduleName, moduleClassFactory);
    } else {
      OO.log("plugin", moduleName);
      // Make sure third party module is evaluated before normal ready callback.
      OO.publicApi.__static.readyList.push(function(ns){ ns.plugin(moduleName, moduleClassFactory); });
    }

  };

//     Underscore.js 1.3.3
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      rand = Math.floor(Math.random() * (index + 1));
      shuffled[index] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, val, context) {
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      if (a === void 0) return 1;
      if (b === void 0) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj)                                     return [];
    if (_.isArray(obj))                           return slice.call(obj);
    if (_.isArguments(obj))                       return slice.call(obj);
    if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.isArray(obj) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var results = [];
    // The `isSorted` flag is irrelevant if the array only contains two elements.
    if (array.length < 3) isSorted = true;
    _.reduce(initial, function (memo, value, index) {
      if (isSorted ? _.last(memo) !== value || !memo.length : !_.include(memo, value)) {
        memo.push(value);
        results.push(array[index]);
      }
      return memo;
    }, []);
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1), true);
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var result = {};
    each(_.flatten(slice.call(arguments, 1)), function(key) {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return _.isNumber(obj) && isFinite(obj);
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    // Original Underscore Code
    //return hasOwnProperty.call(obj, key);

    // Replacement code (the reason for this is that IE<9 don't define hasOwnProperty on DOM nodes)
    if(typeof (obj.hasOwnProperty) === "function") {
      return obj.hasOwnProperty(key);
    } else {
      return !(typeof (obj[key]) === undefined);
    }
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    '\\': '\\',
    "'": "'",
    'r': '\r',
    'n': '\n',
    't': '\t',
    'u2028': '\u2028',
    'u2029': '\u2029'
  };

  for (var p in escapes) escapes[escapes[p]] = p;
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(unescaper, function(match, escape) {
      return escapes[escape];
    });
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults(settings || {}, _.templateSettings);

    // Compile the template source, taking care to escape characters that
    // cannot be included in a string literal and then unescape them in code
    // blocks.
    var source = "__p+='" + text
      .replace(escaper, function(match) {
        return '\\' + escapes[match];
      })
      .replace(settings.escape || noMatch, function(match, code) {
        return "'+\n_.escape(" + unescape(code) + ")+\n'";
      })
      .replace(settings.interpolate || noMatch, function(match, code) {
        return "'+\n(" + unescape(code) + ")+\n'";
      })
      .replace(settings.evaluate || noMatch, function(match, code) {
        return "';\n" + unescape(code) + "\n;__p+='";
      }) + "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __p='';" +
      "var print=function(){__p+=Array.prototype.join.call(arguments, '')};\n" +
      source + "return __p;\n";

    var render = new Function(settings.variable || 'obj', '_', source);
    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for build time
    // precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' +
      source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);

/*!
 * jQuery JavaScript Library v1.8.3
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: Tue Nov 13 2012 08:20:33 GMT-0500 (Eastern Standard Time)
 */
(function( window, undefined ) {
var
	// A central reference to the root jQuery(document)
	rootjQuery,

	// The deferred used on DOM ready
	readyList,

	// Use the correct document accordingly with window argument (sandbox)
	document = window.document,
	location = window.location,
	navigator = window.navigator,

	// Map over jQuery in case of overwrite
	_jQuery = window.jQuery,

	// Map over the $ in case of overwrite
	_$ = window.$,

	// Save a reference to some core methods
	core_push = Array.prototype.push,
	core_slice = Array.prototype.slice,
	core_indexOf = Array.prototype.indexOf,
	core_toString = Object.prototype.toString,
	core_hasOwn = Object.prototype.hasOwnProperty,
	core_trim = String.prototype.trim,

	// Define a local copy of jQuery
	jQuery = function( selector, context ) {
		// The jQuery object is actually just the init constructor 'enhanced'
		return new jQuery.fn.init( selector, context, rootjQuery );
	},

	// Used for matching numbers
	core_pnum = /[\-+]?(?:\d*\.|)\d+(?:[eE][\-+]?\d+|)/.source,

	// Used for detecting and trimming whitespace
	core_rnotwhite = /\S/,
	core_rspace = /\s+/,

	// Make sure we trim BOM and NBSP (here's looking at you, Safari 5.0 and IE)
	rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,

	// A simple way to check for HTML strings
	// Prioritize #id over <tag> to avoid XSS via location.hash (#9521)
	rquickExpr = /^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,

	// Match a standalone tag
	rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>|)$/,

	// JSON RegExp
	rvalidchars = /^[\],:{}\s]*$/,
	rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
	rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
	rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d\d*\.|)\d+(?:[eE][\-+]?\d+|)/g,

	// Matches dashed string for camelizing
	rmsPrefix = /^-ms-/,
	rdashAlpha = /-([\da-z])/gi,

	// Used by jQuery.camelCase as callback to replace()
	fcamelCase = function( all, letter ) {
		return ( letter + "" ).toUpperCase();
	},

	// The ready event handler and self cleanup method
	DOMContentLoaded = function() {
		if ( document.addEventListener ) {
			document.removeEventListener( "DOMContentLoaded", DOMContentLoaded, false );
			jQuery.ready();
		} else if ( document.readyState === "complete" ) {
			// we're here because readyState === "complete" in oldIE
			// which is good enough for us to call the dom ready!
			document.detachEvent( "onreadystatechange", DOMContentLoaded );
			jQuery.ready();
		}
	},

	// [[Class]] -> type pairs
	class2type = {};

jQuery.fn = jQuery.prototype = {
	constructor: jQuery,
	init: function( selector, context, rootjQuery ) {
		var match, elem, ret, doc;

		// Handle $(""), $(null), $(undefined), $(false)
		if ( !selector ) {
			return this;
		}

		// Handle $(DOMElement)
		if ( selector.nodeType ) {
			this.context = this[0] = selector;
			this.length = 1;
			return this;
		}

		// Handle HTML strings
		if ( typeof selector === "string" ) {
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				// Assume that strings that start and end with <> are HTML and skip the regex check
				match = [ null, selector, null ];

			} else {
				match = rquickExpr.exec( selector );
			}

			// Match html or make sure no context is specified for #id
			if ( match && (match[1] || !context) ) {

				// HANDLE: $(html) -> $(array)
				if ( match[1] ) {
					context = context instanceof jQuery ? context[0] : context;
					doc = ( context && context.nodeType ? context.ownerDocument || context : document );

					// scripts is true for back-compat
					selector = jQuery.parseHTML( match[1], doc, true );
					if ( rsingleTag.test( match[1] ) && jQuery.isPlainObject( context ) ) {
						this.attr.call( selector, context, true );
					}

					return jQuery.merge( this, selector );

				// HANDLE: $(#id)
				} else {
					elem = document.getElementById( match[2] );

					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE and Opera return items
						// by name instead of ID
						if ( elem.id !== match[2] ) {
							return rootjQuery.find( selector );
						}

						// Otherwise, we inject the element directly into the jQuery object
						this.length = 1;
						this[0] = elem;
					}

					this.context = document;
					this.selector = selector;
					return this;
				}

			// HANDLE: $(expr, $(...))
			} else if ( !context || context.jquery ) {
				return ( context || rootjQuery ).find( selector );

			// HANDLE: $(expr, context)
			// (which is just equivalent to: $(context).find(expr)
			} else {
				return this.constructor( context ).find( selector );
			}

		// HANDLE: $(function)
		// Shortcut for document ready
		} else if ( jQuery.isFunction( selector ) ) {
			return rootjQuery.ready( selector );
		}

		if ( selector.selector !== undefined ) {
			this.selector = selector.selector;
			this.context = selector.context;
		}

		return jQuery.makeArray( selector, this );
	},

	// Start with an empty selector
	selector: "",

	// The current version of jQuery being used
	jquery: "1.8.3",

	// The default length of a jQuery object is 0
	length: 0,

	// The number of elements contained in the matched element set
	size: function() {
		return this.length;
	},

	toArray: function() {
		return core_slice.call( this );
	},

	// Get the Nth element in the matched element set OR
	// Get the whole matched element set as a clean array
	get: function( num ) {
		return num == null ?

			// Return a 'clean' array
			this.toArray() :

			// Return just the object
			( num < 0 ? this[ this.length + num ] : this[ num ] );
	},

	// Take an array of elements and push it onto the stack
	// (returning the new matched element set)
	pushStack: function( elems, name, selector ) {

		// Build a new jQuery matched element set
		var ret = jQuery.merge( this.constructor(), elems );

		// Add the old object onto the stack (as a reference)
		ret.prevObject = this;

		ret.context = this.context;

		if ( name === "find" ) {
			ret.selector = this.selector + ( this.selector ? " " : "" ) + selector;
		} else if ( name ) {
			ret.selector = this.selector + "." + name + "(" + selector + ")";
		}

		// Return the newly-formed element set
		return ret;
	},

	// Execute a callback for every element in the matched set.
	// (You can seed the arguments with an array of args, but this is
	// only used internally.)
	each: function( callback, args ) {
		return jQuery.each( this, callback, args );
	},

	ready: function( fn ) {
		// Add the callback
		jQuery.ready.promise().done( fn );

		return this;
	},

	eq: function( i ) {
		i = +i;
		return i === -1 ?
			this.slice( i ) :
			this.slice( i, i + 1 );
	},

	first: function() {
		return this.eq( 0 );
	},

	last: function() {
		return this.eq( -1 );
	},

	slice: function() {
		return this.pushStack( core_slice.apply( this, arguments ),
			"slice", core_slice.call(arguments).join(",") );
	},

	map: function( callback ) {
		return this.pushStack( jQuery.map(this, function( elem, i ) {
			return callback.call( elem, i, elem );
		}));
	},

	end: function() {
		return this.prevObject || this.constructor(null);
	},

	// For internal use only.
	// Behaves like an Array's method, not like a jQuery method.
	push: core_push,
	sort: [].sort,
	splice: [].splice
};

// Give the init function the jQuery prototype for later instantiation
jQuery.fn.init.prototype = jQuery.fn;

jQuery.extend = jQuery.fn.extend = function() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0] || {},
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if ( typeof target === "boolean" ) {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	}

	// Handle case when target is a string or something (possible in deep copy)
	if ( typeof target !== "object" && !jQuery.isFunction(target) ) {
		target = {};
	}

	// extend jQuery itself if only one argument is passed
	if ( length === i ) {
		target = this;
		--i;
	}

	for ( ; i < length; i++ ) {
		// Only deal with non-null/undefined values
		if ( (options = arguments[ i ]) != null ) {
			// Extend the base object
			for ( name in options ) {
				src = target[ name ];
				copy = options[ name ];

				// Prevent never-ending loop
				if ( target === copy ) {
					continue;
				}

				// Recurse if we're merging plain objects or arrays
				if ( deep && copy && ( jQuery.isPlainObject(copy) || (copyIsArray = jQuery.isArray(copy)) ) ) {
					if ( copyIsArray ) {
						copyIsArray = false;
						clone = src && jQuery.isArray(src) ? src : [];

					} else {
						clone = src && jQuery.isPlainObject(src) ? src : {};
					}

					// Never move original objects, clone them
					target[ name ] = jQuery.extend( deep, clone, copy );

				// Don't bring in undefined values
				} else if ( copy !== undefined ) {
					target[ name ] = copy;
				}
			}
		}
	}

	// Return the modified object
	return target;
};

jQuery.extend({
	noConflict: function( deep ) {
		if ( window.$ === jQuery ) {
			window.$ = _$;
		}

		if ( deep && window.jQuery === jQuery ) {
			window.jQuery = _jQuery;
		}

		return jQuery;
	},

	// Is the DOM ready to be used? Set to true once it occurs.
	isReady: false,

	// A counter to track how many items to wait for before
	// the ready event fires. See #6781
	readyWait: 1,

	// Hold (or release) the ready event
	holdReady: function( hold ) {
		if ( hold ) {
			jQuery.readyWait++;
		} else {
			jQuery.ready( true );
		}
	},

	// Handle when the DOM is ready
	ready: function( wait ) {

		// Abort if there are pending holds or we're already ready
		if ( wait === true ? --jQuery.readyWait : jQuery.isReady ) {
			return;
		}

		// Make sure body exists, at least, in case IE gets a little overzealous (ticket #5443).
		if ( !document.body ) {
			return setTimeout( jQuery.ready, 1 );
		}

		// Remember that the DOM is ready
		jQuery.isReady = true;

		// If a normal DOM Ready event fired, decrement, and wait if need be
		if ( wait !== true && --jQuery.readyWait > 0 ) {
			return;
		}

		// If there are functions bound, to execute
		readyList.resolveWith( document, [ jQuery ] );

		// Trigger any bound ready events
		if ( jQuery.fn.trigger ) {
			jQuery( document ).trigger("ready").off("ready");
		}
	},

	// See test/unit/core.js for details concerning isFunction.
	// Since version 1.3, DOM methods and functions like alert
	// aren't supported. They return false on IE (#2968).
	isFunction: function( obj ) {
		return jQuery.type(obj) === "function";
	},

	isArray: Array.isArray || function( obj ) {
		return jQuery.type(obj) === "array";
	},

	isWindow: function( obj ) {
		return obj != null && obj == obj.window;
	},

	isNumeric: function( obj ) {
		return !isNaN( parseFloat(obj) ) && isFinite( obj );
	},

	type: function( obj ) {
		return obj == null ?
			String( obj ) :
			class2type[ core_toString.call(obj) ] || "object";
	},

	isPlainObject: function( obj ) {
		// Must be an Object.
		// Because of IE, we also have to check the presence of the constructor property.
		// Make sure that DOM nodes and window objects don't pass through, as well
		if ( !obj || jQuery.type(obj) !== "object" || obj.nodeType || jQuery.isWindow( obj ) ) {
			return false;
		}

		try {
			// Not own constructor property must be Object
			if ( obj.constructor &&
				!core_hasOwn.call(obj, "constructor") &&
				!core_hasOwn.call(obj.constructor.prototype, "isPrototypeOf") ) {
				return false;
			}
		} catch ( e ) {
			// IE8,9 Will throw exceptions on certain host objects #9897
			return false;
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.

		var key;
		for ( key in obj ) {}

		return key === undefined || core_hasOwn.call( obj, key );
	},

	isEmptyObject: function( obj ) {
		var name;
		for ( name in obj ) {
			return false;
		}
		return true;
	},

	error: function( msg ) {
		throw new Error( msg );
	},

	// data: string of html
	// context (optional): If specified, the fragment will be created in this context, defaults to document
	// scripts (optional): If true, will include scripts passed in the html string
	parseHTML: function( data, context, scripts ) {
		var parsed;
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		if ( typeof context === "boolean" ) {
			scripts = context;
			context = 0;
		}
		context = context || document;

		// Single tag
		if ( (parsed = rsingleTag.exec( data )) ) {
			return [ context.createElement( parsed[1] ) ];
		}

		parsed = jQuery.buildFragment( [ data ], context, scripts ? null : [] );
		return jQuery.merge( [],
			(parsed.cacheable ? jQuery.clone( parsed.fragment ) : parsed.fragment).childNodes );
	},

	parseJSON: function( data ) {
		if ( !data || typeof data !== "string") {
			return null;
		}

		// Make sure leading/trailing whitespace is removed (IE can't handle it)
		data = jQuery.trim( data );

		// Attempt to parse using the native JSON parser first
		if ( window.JSON && window.JSON.parse ) {
			return window.JSON.parse( data );
		}

		// Make sure the incoming data is actual JSON
		// Logic borrowed from http://json.org/json2.js
		if ( rvalidchars.test( data.replace( rvalidescape, "@" )
			.replace( rvalidtokens, "]" )
			.replace( rvalidbraces, "")) ) {

			return ( new Function( "return " + data ) )();

		}
		jQuery.error( "Invalid JSON: " + data );
	},

	// Cross-browser xml parsing
	parseXML: function( data ) {
		var xml, tmp;
		if ( !data || typeof data !== "string" ) {
			return null;
		}
		try {
			if ( window.DOMParser ) { // Standard
				tmp = new DOMParser();
				xml = tmp.parseFromString( data , "text/xml" );
			} else { // IE
				xml = new ActiveXObject( "Microsoft.XMLDOM" );
				xml.async = "false";
				xml.loadXML( data );
			}
		} catch( e ) {
			xml = undefined;
		}
		if ( !xml || !xml.documentElement || xml.getElementsByTagName( "parsererror" ).length ) {
			jQuery.error( "Invalid XML: " + data );
		}
		return xml;
	},

	noop: function() {},

	// Evaluates a script in a global context
	// Workarounds based on findings by Jim Driscoll
	// http://weblogs.java.net/blog/driscoll/archive/2009/09/08/eval-javascript-global-context
	globalEval: function( data ) {
		if ( data && core_rnotwhite.test( data ) ) {
			// We use execScript on Internet Explorer
			// We use an anonymous function so that context is window
			// rather than jQuery in Firefox
			( window.execScript || function( data ) {
				window[ "eval" ].call( window, data );
			} )( data );
		}
	},

	// Convert dashed to camelCase; used by the css and data modules
	// Microsoft forgot to hump their vendor prefix (#9572)
	camelCase: function( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	},

	nodeName: function( elem, name ) {
		return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
	},

	// args is for internal usage only
	each: function( obj, callback, args ) {
		var name,
			i = 0,
			length = obj.length,
			isObj = length === undefined || jQuery.isFunction( obj );

		if ( args ) {
			if ( isObj ) {
				for ( name in obj ) {
					if ( callback.apply( obj[ name ], args ) === false ) {
						break;
					}
				}
			} else {
				for ( ; i < length; ) {
					if ( callback.apply( obj[ i++ ], args ) === false ) {
						break;
					}
				}
			}

		// A special, fast, case for the most common use of each
		} else {
			if ( isObj ) {
				for ( name in obj ) {
					if ( callback.call( obj[ name ], name, obj[ name ] ) === false ) {
						break;
					}
				}
			} else {
				for ( ; i < length; ) {
					if ( callback.call( obj[ i ], i, obj[ i++ ] ) === false ) {
						break;
					}
				}
			}
		}

		return obj;
	},

	// Use native String.trim function wherever possible
	trim: core_trim && !core_trim.call("\uFEFF\xA0") ?
		function( text ) {
			return text == null ?
				"" :
				core_trim.call( text );
		} :

		// Otherwise use our own trimming functionality
		function( text ) {
			return text == null ?
				"" :
				( text + "" ).replace( rtrim, "" );
		},

	// results is for internal usage only
	makeArray: function( arr, results ) {
		var type,
			ret = results || [];

		if ( arr != null ) {
			// The window, strings (and functions) also have 'length'
			// Tweaked logic slightly to handle Blackberry 4.7 RegExp issues #6930
			type = jQuery.type( arr );

			if ( arr.length == null || type === "string" || type === "function" || type === "regexp" || jQuery.isWindow( arr ) ) {
				core_push.call( ret, arr );
			} else {
				jQuery.merge( ret, arr );
			}
		}

		return ret;
	},

	inArray: function( elem, arr, i ) {
		var len;

		if ( arr ) {
			if ( core_indexOf ) {
				return core_indexOf.call( arr, elem, i );
			}

			len = arr.length;
			i = i ? i < 0 ? Math.max( 0, len + i ) : i : 0;

			for ( ; i < len; i++ ) {
				// Skip accessing in sparse arrays
				if ( i in arr && arr[ i ] === elem ) {
					return i;
				}
			}
		}

		return -1;
	},

	merge: function( first, second ) {
		var l = second.length,
			i = first.length,
			j = 0;

		if ( typeof l === "number" ) {
			for ( ; j < l; j++ ) {
				first[ i++ ] = second[ j ];
			}

		} else {
			while ( second[j] !== undefined ) {
				first[ i++ ] = second[ j++ ];
			}
		}

		first.length = i;

		return first;
	},

	grep: function( elems, callback, inv ) {
		var retVal,
			ret = [],
			i = 0,
			length = elems.length;
		inv = !!inv;

		// Go through the array, only saving the items
		// that pass the validator function
		for ( ; i < length; i++ ) {
			retVal = !!callback( elems[ i ], i );
			if ( inv !== retVal ) {
				ret.push( elems[ i ] );
			}
		}

		return ret;
	},

	// arg is for internal usage only
	map: function( elems, callback, arg ) {
		var value, key,
			ret = [],
			i = 0,
			length = elems.length,
			// jquery objects are treated as arrays
			isArray = elems instanceof jQuery || length !== undefined && typeof length === "number" && ( ( length > 0 && elems[ 0 ] && elems[ length -1 ] ) || length === 0 || jQuery.isArray( elems ) ) ;

		// Go through the array, translating each of the items to their
		if ( isArray ) {
			for ( ; i < length; i++ ) {
				value = callback( elems[ i ], i, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}

		// Go through every key on the object,
		} else {
			for ( key in elems ) {
				value = callback( elems[ key ], key, arg );

				if ( value != null ) {
					ret[ ret.length ] = value;
				}
			}
		}

		// Flatten any nested arrays
		return ret.concat.apply( [], ret );
	},

	// A global GUID counter for objects
	guid: 1,

	// Bind a function to a context, optionally partially applying any
	// arguments.
	proxy: function( fn, context ) {
		var tmp, args, proxy;

		if ( typeof context === "string" ) {
			tmp = fn[ context ];
			context = fn;
			fn = tmp;
		}

		// Quick check to determine if target is callable, in the spec
		// this throws a TypeError, but we will just return undefined.
		if ( !jQuery.isFunction( fn ) ) {
			return undefined;
		}

		// Simulated bind
		args = core_slice.call( arguments, 2 );
		proxy = function() {
			return fn.apply( context, args.concat( core_slice.call( arguments ) ) );
		};

		// Set the guid of unique handler to the same of original handler, so it can be removed
		proxy.guid = fn.guid = fn.guid || jQuery.guid++;

		return proxy;
	},

	// Multifunctional method to get and set values of a collection
	// The value/s can optionally be executed if it's a function
	access: function( elems, fn, key, value, chainable, emptyGet, pass ) {
		var exec,
			bulk = key == null,
			i = 0,
			length = elems.length;

		// Sets many values
		if ( key && typeof key === "object" ) {
			for ( i in key ) {
				jQuery.access( elems, fn, i, key[i], 1, emptyGet, value );
			}
			chainable = 1;

		// Sets one value
		} else if ( value !== undefined ) {
			// Optionally, function values get executed if exec is true
			exec = pass === undefined && jQuery.isFunction( value );

			if ( bulk ) {
				// Bulk operations only iterate when executing function values
				if ( exec ) {
					exec = fn;
					fn = function( elem, key, value ) {
						return exec.call( jQuery( elem ), value );
					};

				// Otherwise they run against the entire set
				} else {
					fn.call( elems, value );
					fn = null;
				}
			}

			if ( fn ) {
				for (; i < length; i++ ) {
					fn( elems[i], key, exec ? value.call( elems[i], i, fn( elems[i], key ) ) : value, pass );
				}
			}

			chainable = 1;
		}

		return chainable ?
			elems :

			// Gets
			bulk ?
				fn.call( elems ) :
				length ? fn( elems[0], key ) : emptyGet;
	},

	now: function() {
		return ( new Date() ).getTime();
	}
});

jQuery.ready.promise = function( obj ) {
	if ( !readyList ) {

		readyList = jQuery.Deferred();

		// Catch cases where $(document).ready() is called after the browser event has already occurred.
		// we once tried to use readyState "interactive" here, but it caused issues like the one
		// discovered by ChrisS here: http://bugs.jquery.com/ticket/12282#comment:15
		if ( document.readyState === "complete" ) {
			// Handle it asynchronously to allow scripts the opportunity to delay ready
			setTimeout( jQuery.ready, 1 );

		// Standards-based browsers support DOMContentLoaded
		} else if ( document.addEventListener ) {
			// Use the handy event callback
			document.addEventListener( "DOMContentLoaded", DOMContentLoaded, false );

			// A fallback to window.onload, that will always work
			window.addEventListener( "load", jQuery.ready, false );

		// If IE event model is used
		} else {
			// Ensure firing before onload, maybe late but safe also for iframes
			document.attachEvent( "onreadystatechange", DOMContentLoaded );

			// A fallback to window.onload, that will always work
			window.attachEvent( "onload", jQuery.ready );

			// If IE and not a frame
			// continually check to see if the document is ready
			var top = false;

			try {
				top = window.frameElement == null && document.documentElement;
			} catch(e) {}

			if ( top && top.doScroll ) {
				(function doScrollCheck() {
					if ( !jQuery.isReady ) {

						try {
							// Use the trick by Diego Perini
							// http://javascript.nwbox.com/IEContentLoaded/
							top.doScroll("left");
						} catch(e) {
							return setTimeout( doScrollCheck, 50 );
						}

						// and execute any waiting functions
						jQuery.ready();
					}
				})();
			}
		}
	}
	return readyList.promise( obj );
};

// Populate the class2type map
jQuery.each("Boolean Number String Function Array Date RegExp Object".split(" "), function(i, name) {
	class2type[ "[object " + name + "]" ] = name.toLowerCase();
});

// All jQuery objects should point back to these
rootjQuery = jQuery(document);
// String to Object options format cache
var optionsCache = {};

// Convert String-formatted options into Object-formatted ones and store in cache
function createOptions( options ) {
	var object = optionsCache[ options ] = {};
	jQuery.each( options.split( core_rspace ), function( _, flag ) {
		object[ flag ] = true;
	});
	return object;
}

/*
 * Create a callback list using the following parameters:
 *
 *	options: an optional list of space-separated options that will change how
 *			the callback list behaves or a more traditional option object
 *
 * By default a callback list will act like an event callback list and can be
 * "fired" multiple times.
 *
 * Possible options:
 *
 *	once:			will ensure the callback list can only be fired once (like a Deferred)
 *
 *	memory:			will keep track of previous values and will call any callback added
 *					after the list has been fired right away with the latest "memorized"
 *					values (like a Deferred)
 *
 *	unique:			will ensure a callback can only be added once (no duplicate in the list)
 *
 *	stopOnFalse:	interrupt callings when a callback returns false
 *
 */
jQuery.Callbacks = function( options ) {

	// Convert options from String-formatted to Object-formatted if needed
	// (we check in cache first)
	options = typeof options === "string" ?
		( optionsCache[ options ] || createOptions( options ) ) :
		jQuery.extend( {}, options );

	var // Last fire value (for non-forgettable lists)
		memory,
		// Flag to know if list was already fired
		fired,
		// Flag to know if list is currently firing
		firing,
		// First callback to fire (used internally by add and fireWith)
		firingStart,
		// End of the loop when firing
		firingLength,
		// Index of currently firing callback (modified by remove if needed)
		firingIndex,
		// Actual callback list
		list = [],
		// Stack of fire calls for repeatable lists
		stack = !options.once && [],
		// Fire callbacks
		fire = function( data ) {
			memory = options.memory && data;
			fired = true;
			firingIndex = firingStart || 0;
			firingStart = 0;
			firingLength = list.length;
			firing = true;
			for ( ; list && firingIndex < firingLength; firingIndex++ ) {
				if ( list[ firingIndex ].apply( data[ 0 ], data[ 1 ] ) === false && options.stopOnFalse ) {
					memory = false; // To prevent further calls using add
					break;
				}
			}
			firing = false;
			if ( list ) {
				if ( stack ) {
					if ( stack.length ) {
						fire( stack.shift() );
					}
				} else if ( memory ) {
					list = [];
				} else {
					self.disable();
				}
			}
		},
		// Actual Callbacks object
		self = {
			// Add a callback or a collection of callbacks to the list
			add: function() {
				if ( list ) {
					// First, we save the current length
					var start = list.length;
					(function add( args ) {
						jQuery.each( args, function( _, arg ) {
							var type = jQuery.type( arg );
							if ( type === "function" ) {
								if ( !options.unique || !self.has( arg ) ) {
									list.push( arg );
								}
							} else if ( arg && arg.length && type !== "string" ) {
								// Inspect recursively
								add( arg );
							}
						});
					})( arguments );
					// Do we need to add the callbacks to the
					// current firing batch?
					if ( firing ) {
						firingLength = list.length;
					// With memory, if we're not firing then
					// we should call right away
					} else if ( memory ) {
						firingStart = start;
						fire( memory );
					}
				}
				return this;
			},
			// Remove a callback from the list
			remove: function() {
				if ( list ) {
					jQuery.each( arguments, function( _, arg ) {
						var index;
						while( ( index = jQuery.inArray( arg, list, index ) ) > -1 ) {
							list.splice( index, 1 );
							// Handle firing indexes
							if ( firing ) {
								if ( index <= firingLength ) {
									firingLength--;
								}
								if ( index <= firingIndex ) {
									firingIndex--;
								}
							}
						}
					});
				}
				return this;
			},
			// Control if a given callback is in the list
			has: function( fn ) {
				return jQuery.inArray( fn, list ) > -1;
			},
			// Remove all callbacks from the list
			empty: function() {
				list = [];
				return this;
			},
			// Have the list do nothing anymore
			disable: function() {
				list = stack = memory = undefined;
				return this;
			},
			// Is it disabled?
			disabled: function() {
				return !list;
			},
			// Lock the list in its current state
			lock: function() {
				stack = undefined;
				if ( !memory ) {
					self.disable();
				}
				return this;
			},
			// Is it locked?
			locked: function() {
				return !stack;
			},
			// Call all callbacks with the given context and arguments
			fireWith: function( context, args ) {
				args = args || [];
				args = [ context, args.slice ? args.slice() : args ];
				if ( list && ( !fired || stack ) ) {
					if ( firing ) {
						stack.push( args );
					} else {
						fire( args );
					}
				}
				return this;
			},
			// Call all the callbacks with the given arguments
			fire: function() {
				self.fireWith( this, arguments );
				return this;
			},
			// To know if the callbacks have already been called at least once
			fired: function() {
				return !!fired;
			}
		};

	return self;
};
jQuery.extend({

	Deferred: function( func ) {
		var tuples = [
				// action, add listener, listener list, final state
				[ "resolve", "done", jQuery.Callbacks("once memory"), "resolved" ],
				[ "reject", "fail", jQuery.Callbacks("once memory"), "rejected" ],
				[ "notify", "progress", jQuery.Callbacks("memory") ]
			],
			state = "pending",
			promise = {
				state: function() {
					return state;
				},
				always: function() {
					deferred.done( arguments ).fail( arguments );
					return this;
				},
				then: function( /* fnDone, fnFail, fnProgress */ ) {
					var fns = arguments;
					return jQuery.Deferred(function( newDefer ) {
						jQuery.each( tuples, function( i, tuple ) {
							var action = tuple[ 0 ],
								fn = fns[ i ];
							// deferred[ done | fail | progress ] for forwarding actions to newDefer
							deferred[ tuple[1] ]( jQuery.isFunction( fn ) ?
								function() {
									var returned = fn.apply( this, arguments );
									if ( returned && jQuery.isFunction( returned.promise ) ) {
										returned.promise()
											.done( newDefer.resolve )
											.fail( newDefer.reject )
											.progress( newDefer.notify );
									} else {
										newDefer[ action + "With" ]( this === deferred ? newDefer : this, [ returned ] );
									}
								} :
								newDefer[ action ]
							);
						});
						fns = null;
					}).promise();
				},
				// Get a promise for this deferred
				// If obj is provided, the promise aspect is added to the object
				promise: function( obj ) {
					return obj != null ? jQuery.extend( obj, promise ) : promise;
				}
			},
			deferred = {};

		// Keep pipe for back-compat
		promise.pipe = promise.then;

		// Add list-specific methods
		jQuery.each( tuples, function( i, tuple ) {
			var list = tuple[ 2 ],
				stateString = tuple[ 3 ];

			// promise[ done | fail | progress ] = list.add
			promise[ tuple[1] ] = list.add;

			// Handle state
			if ( stateString ) {
				list.add(function() {
					// state = [ resolved | rejected ]
					state = stateString;

				// [ reject_list | resolve_list ].disable; progress_list.lock
				}, tuples[ i ^ 1 ][ 2 ].disable, tuples[ 2 ][ 2 ].lock );
			}

			// deferred[ resolve | reject | notify ] = list.fire
			deferred[ tuple[0] ] = list.fire;
			deferred[ tuple[0] + "With" ] = list.fireWith;
		});

		// Make the deferred a promise
		promise.promise( deferred );

		// Call given func if any
		if ( func ) {
			func.call( deferred, deferred );
		}

		// All done!
		return deferred;
	},

	// Deferred helper
	when: function( subordinate /* , ..., subordinateN */ ) {
		var i = 0,
			resolveValues = core_slice.call( arguments ),
			length = resolveValues.length,

			// the count of uncompleted subordinates
			remaining = length !== 1 || ( subordinate && jQuery.isFunction( subordinate.promise ) ) ? length : 0,

			// the master Deferred. If resolveValues consist of only a single Deferred, just use that.
			deferred = remaining === 1 ? subordinate : jQuery.Deferred(),

			// Update function for both resolve and progress values
			updateFunc = function( i, contexts, values ) {
				return function( value ) {
					contexts[ i ] = this;
					values[ i ] = arguments.length > 1 ? core_slice.call( arguments ) : value;
					if( values === progressValues ) {
						deferred.notifyWith( contexts, values );
					} else if ( !( --remaining ) ) {
						deferred.resolveWith( contexts, values );
					}
				};
			},

			progressValues, progressContexts, resolveContexts;

		// add listeners to Deferred subordinates; treat others as resolved
		if ( length > 1 ) {
			progressValues = new Array( length );
			progressContexts = new Array( length );
			resolveContexts = new Array( length );
			for ( ; i < length; i++ ) {
				if ( resolveValues[ i ] && jQuery.isFunction( resolveValues[ i ].promise ) ) {
					resolveValues[ i ].promise()
						.done( updateFunc( i, resolveContexts, resolveValues ) )
						.fail( deferred.reject )
						.progress( updateFunc( i, progressContexts, progressValues ) );
				} else {
					--remaining;
				}
			}
		}

		// if we're not waiting on anything, resolve the master
		if ( !remaining ) {
			deferred.resolveWith( resolveContexts, resolveValues );
		}

		return deferred.promise();
	}
});
jQuery.support = (function() {

	var support,
		all,
		a,
		select,
		opt,
		input,
		fragment,
		eventName,
		i,
		isSupported,
		clickFn,
		div = document.createElement("div");

	// Setup
	div.setAttribute( "className", "t" );
	div.innerHTML = "  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";

	// Support tests won't run in some limited or non-browser environments
	all = div.getElementsByTagName("*");
	a = div.getElementsByTagName("a")[ 0 ];
	if ( !all || !a || !all.length ) {
		return {};
	}

	// First batch of tests
	select = document.createElement("select");
	opt = select.appendChild( document.createElement("option") );
	input = div.getElementsByTagName("input")[ 0 ];

	a.style.cssText = "top:1px;float:left;opacity:.5";
	support = {
		// IE strips leading whitespace when .innerHTML is used
		leadingWhitespace: ( div.firstChild.nodeType === 3 ),

		// Make sure that tbody elements aren't automatically inserted
		// IE will insert them into empty tables
		tbody: !div.getElementsByTagName("tbody").length,

		// Make sure that link elements get serialized correctly by innerHTML
		// This requires a wrapper element in IE
		htmlSerialize: !!div.getElementsByTagName("link").length,

		// Get the style information from getAttribute
		// (IE uses .cssText instead)
		style: /top/.test( a.getAttribute("style") ),

		// Make sure that URLs aren't manipulated
		// (IE normalizes it by default)
		hrefNormalized: ( a.getAttribute("href") === "/a" ),

		// Make sure that element opacity exists
		// (IE uses filter instead)
		// Use a regex to work around a WebKit issue. See #5145
		opacity: /^0.5/.test( a.style.opacity ),

		// Verify style float existence
		// (IE uses styleFloat instead of cssFloat)
		cssFloat: !!a.style.cssFloat,

		// Make sure that if no value is specified for a checkbox
		// that it defaults to "on".
		// (WebKit defaults to "" instead)
		checkOn: ( input.value === "on" ),

		// Make sure that a selected-by-default option has a working selected property.
		// (WebKit defaults to false instead of true, IE too, if it's in an optgroup)
		optSelected: opt.selected,

		// Test setAttribute on camelCase class. If it works, we need attrFixes when doing get/setAttribute (ie6/7)
		getSetAttribute: div.className !== "t",

		// Tests for enctype support on a form (#6743)
		enctype: !!document.createElement("form").enctype,

		// Makes sure cloning an html5 element does not cause problems
		// Where outerHTML is undefined, this still works
		html5Clone: document.createElement("nav").cloneNode( true ).outerHTML !== "<:nav></:nav>",

		// jQuery.support.boxModel DEPRECATED in 1.8 since we don't support Quirks Mode
		boxModel: ( document.compatMode === "CSS1Compat" ),

		// Will be defined later
		submitBubbles: true,
		changeBubbles: true,
		focusinBubbles: false,
		deleteExpando: true,
		noCloneEvent: true,
		inlineBlockNeedsLayout: false,
		shrinkWrapBlocks: false,
		reliableMarginRight: true,
		boxSizingReliable: true,
		pixelPosition: false
	};

	// Make sure checked status is properly cloned
	input.checked = true;
	support.noCloneChecked = input.cloneNode( true ).checked;

	// Make sure that the options inside disabled selects aren't marked as disabled
	// (WebKit marks them as disabled)
	select.disabled = true;
	support.optDisabled = !opt.disabled;

	// Test to see if it's possible to delete an expando from an element
	// Fails in Internet Explorer
	try {
		delete div.test;
	} catch( e ) {
		support.deleteExpando = false;
	}

	if ( !div.addEventListener && div.attachEvent && div.fireEvent ) {
		div.attachEvent( "onclick", clickFn = function() {
			// Cloning a node shouldn't copy over any
			// bound event handlers (IE does this)
			support.noCloneEvent = false;
		});
		div.cloneNode( true ).fireEvent("onclick");
		div.detachEvent( "onclick", clickFn );
	}

	// Check if a radio maintains its value
	// after being appended to the DOM
	input = document.createElement("input");
	input.value = "t";
	input.setAttribute( "type", "radio" );
	support.radioValue = input.value === "t";

	input.setAttribute( "checked", "checked" );

	// #11217 - WebKit loses check when the name is after the checked attribute
	input.setAttribute( "name", "t" );

	div.appendChild( input );
	fragment = document.createDocumentFragment();
	fragment.appendChild( div.lastChild );

	// WebKit doesn't clone checked state correctly in fragments
	support.checkClone = fragment.cloneNode( true ).cloneNode( true ).lastChild.checked;

	// Check if a disconnected checkbox will retain its checked
	// value of true after appended to the DOM (IE6/7)
	support.appendChecked = input.checked;

	fragment.removeChild( input );
	fragment.appendChild( div );

	// Technique from Juriy Zaytsev
	// http://perfectionkills.com/detecting-event-support-without-browser-sniffing/
	// We only care about the case where non-standard event systems
	// are used, namely in IE. Short-circuiting here helps us to
	// avoid an eval call (in setAttribute) which can cause CSP
	// to go haywire. See: https://developer.mozilla.org/en/Security/CSP
	if ( div.attachEvent ) {
		for ( i in {
			submit: true,
			change: true,
			focusin: true
		}) {
			eventName = "on" + i;
			isSupported = ( eventName in div );
			if ( !isSupported ) {
				div.setAttribute( eventName, "return;" );
				isSupported = ( typeof div[ eventName ] === "function" );
			}
			support[ i + "Bubbles" ] = isSupported;
		}
	}

	// Run tests that need a body at doc ready
	jQuery(function() {
		var container, div, tds, marginDiv,
			divReset = "padding:0;margin:0;border:0;display:block;overflow:hidden;",
			body = document.getElementsByTagName("body")[0];

		if ( !body ) {
			// Return for frameset docs that don't have a body
			return;
		}

		container = document.createElement("div");
		container.style.cssText = "visibility:hidden;border:0;width:0;height:0;position:static;top:0;margin-top:1px";
		body.insertBefore( container, body.firstChild );

		// Construct the test element
		div = document.createElement("div");
		container.appendChild( div );

		// Check if table cells still have offsetWidth/Height when they are set
		// to display:none and there are still other visible table cells in a
		// table row; if so, offsetWidth/Height are not reliable for use when
		// determining if an element has been hidden directly using
		// display:none (it is still safe to use offsets if a parent element is
		// hidden; don safety goggles and see bug #4512 for more information).
		// (only IE 8 fails this test)
		div.innerHTML = "<table><tr><td></td><td>t</td></tr></table>";
		tds = div.getElementsByTagName("td");
		tds[ 0 ].style.cssText = "padding:0;margin:0;border:0;display:none";
		isSupported = ( tds[ 0 ].offsetHeight === 0 );

		tds[ 0 ].style.display = "";
		tds[ 1 ].style.display = "none";

		// Check if empty table cells still have offsetWidth/Height
		// (IE <= 8 fail this test)
		support.reliableHiddenOffsets = isSupported && ( tds[ 0 ].offsetHeight === 0 );

		// Check box-sizing and margin behavior
		div.innerHTML = "";
		div.style.cssText = "box-sizing:border-box;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;padding:1px;border:1px;display:block;width:4px;margin-top:1%;position:absolute;top:1%;";
		support.boxSizing = ( div.offsetWidth === 4 );
		support.doesNotIncludeMarginInBodyOffset = ( body.offsetTop !== 1 );

		// NOTE: To any future maintainer, we've window.getComputedStyle
		// because jsdom on node.js will break without it.
		if ( window.getComputedStyle ) {
			support.pixelPosition = ( window.getComputedStyle( div, null ) || {} ).top !== "1%";
			support.boxSizingReliable = ( window.getComputedStyle( div, null ) || { width: "4px" } ).width === "4px";

			// Check if div with explicit width and no margin-right incorrectly
			// gets computed margin-right based on width of container. For more
			// info see bug #3333
			// Fails in WebKit before Feb 2011 nightlies
			// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
			marginDiv = document.createElement("div");
			marginDiv.style.cssText = div.style.cssText = divReset;
			marginDiv.style.marginRight = marginDiv.style.width = "0";
			div.style.width = "1px";
			div.appendChild( marginDiv );
			support.reliableMarginRight =
				!parseFloat( ( window.getComputedStyle( marginDiv, null ) || {} ).marginRight );
		}

		if ( typeof div.style.zoom !== "undefined" ) {
			// Check if natively block-level elements act like inline-block
			// elements when setting their display to 'inline' and giving
			// them layout
			// (IE < 8 does this)
			div.innerHTML = "";
			div.style.cssText = divReset + "width:1px;padding:1px;display:inline;zoom:1";
			support.inlineBlockNeedsLayout = ( div.offsetWidth === 3 );

			// Check if elements with layout shrink-wrap their children
			// (IE 6 does this)
			div.style.display = "block";
			div.style.overflow = "visible";
			div.innerHTML = "<div></div>";
			div.firstChild.style.width = "5px";
			support.shrinkWrapBlocks = ( div.offsetWidth !== 3 );

			container.style.zoom = 1;
		}

		// Null elements to avoid leaks in IE
		body.removeChild( container );
		container = div = tds = marginDiv = null;
	});

	// Null elements to avoid leaks in IE
	fragment.removeChild( div );
	all = a = select = opt = input = fragment = div = null;

	return support;
})();
var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	rmultiDash = /([A-Z])/g;

jQuery.extend({
	cache: {},

	deletedIds: [],

	// Remove at next major release (1.9/2.0)
	uuid: 0,

	// Unique for each copy of jQuery on the page
	// Non-digits removed to match rinlinejQuery
	expando: "jQuery" + ( jQuery.fn.jquery + Math.random() ).replace( /\D/g, "" ),

	// The following elements throw uncatchable exceptions if you
	// attempt to add expando properties to them.
	noData: {
		"embed": true,
		// Ban all objects except for Flash (which handle expandos)
		"object": "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",
		"applet": true
	},

	hasData: function( elem ) {
		elem = elem.nodeType ? jQuery.cache[ elem[jQuery.expando] ] : elem[ jQuery.expando ];
		return !!elem && !isEmptyDataObject( elem );
	},

	data: function( elem, name, data, pvt /* Internal Use Only */ ) {
		if ( !jQuery.acceptData( elem ) ) {
			return;
		}

		var thisCache, ret,
			internalKey = jQuery.expando,
			getByName = typeof name === "string",

			// We have to handle DOM nodes and JS objects differently because IE6-7
			// can't GC object references properly across the DOM-JS boundary
			isNode = elem.nodeType,

			// Only DOM nodes need the global jQuery cache; JS object data is
			// attached directly to the object so GC can occur automatically
			cache = isNode ? jQuery.cache : elem,

			// Only defining an ID for JS objects if its cache already exists allows
			// the code to shortcut on the same path as a DOM node with no cache
			id = isNode ? elem[ internalKey ] : elem[ internalKey ] && internalKey;

		// Avoid doing any more work than we need to when trying to get data on an
		// object that has no data at all
		if ( (!id || !cache[id] || (!pvt && !cache[id].data)) && getByName && data === undefined ) {
			return;
		}

		if ( !id ) {
			// Only DOM nodes need a new unique ID for each element since their data
			// ends up in the global cache
			if ( isNode ) {
				elem[ internalKey ] = id = jQuery.deletedIds.pop() || jQuery.guid++;
			} else {
				id = internalKey;
			}
		}

		if ( !cache[ id ] ) {
			cache[ id ] = {};

			// Avoids exposing jQuery metadata on plain JS objects when the object
			// is serialized using JSON.stringify
			if ( !isNode ) {
				cache[ id ].toJSON = jQuery.noop;
			}
		}

		// An object can be passed to jQuery.data instead of a key/value pair; this gets
		// shallow copied over onto the existing cache
		if ( typeof name === "object" || typeof name === "function" ) {
			if ( pvt ) {
				cache[ id ] = jQuery.extend( cache[ id ], name );
			} else {
				cache[ id ].data = jQuery.extend( cache[ id ].data, name );
			}
		}

		thisCache = cache[ id ];

		// jQuery data() is stored in a separate object inside the object's internal data
		// cache in order to avoid key collisions between internal data and user-defined
		// data.
		if ( !pvt ) {
			if ( !thisCache.data ) {
				thisCache.data = {};
			}

			thisCache = thisCache.data;
		}

		if ( data !== undefined ) {
			thisCache[ jQuery.camelCase( name ) ] = data;
		}

		// Check for both converted-to-camel and non-converted data property names
		// If a data property was specified
		if ( getByName ) {

			// First Try to find as-is property data
			ret = thisCache[ name ];

			// Test for null|undefined property data
			if ( ret == null ) {

				// Try to find the camelCased property
				ret = thisCache[ jQuery.camelCase( name ) ];
			}
		} else {
			ret = thisCache;
		}

		return ret;
	},

	removeData: function( elem, name, pvt /* Internal Use Only */ ) {
		if ( !jQuery.acceptData( elem ) ) {
			return;
		}

		var thisCache, i, l,

			isNode = elem.nodeType,

			// See jQuery.data for more information
			cache = isNode ? jQuery.cache : elem,
			id = isNode ? elem[ jQuery.expando ] : jQuery.expando;

		// If there is already no cache entry for this object, there is no
		// purpose in continuing
		if ( !cache[ id ] ) {
			return;
		}

		if ( name ) {

			thisCache = pvt ? cache[ id ] : cache[ id ].data;

			if ( thisCache ) {

				// Support array or space separated string names for data keys
				if ( !jQuery.isArray( name ) ) {

					// try the string as a key before any manipulation
					if ( name in thisCache ) {
						name = [ name ];
					} else {

						// split the camel cased version by spaces unless a key with the spaces exists
						name = jQuery.camelCase( name );
						if ( name in thisCache ) {
							name = [ name ];
						} else {
							name = name.split(" ");
						}
					}
				}

				for ( i = 0, l = name.length; i < l; i++ ) {
					delete thisCache[ name[i] ];
				}

				// If there is no data left in the cache, we want to continue
				// and let the cache object itself get destroyed
				if ( !( pvt ? isEmptyDataObject : jQuery.isEmptyObject )( thisCache ) ) {
					return;
				}
			}
		}

		// See jQuery.data for more information
		if ( !pvt ) {
			delete cache[ id ].data;

			// Don't destroy the parent cache unless the internal data object
			// had been the only thing left in it
			if ( !isEmptyDataObject( cache[ id ] ) ) {
				return;
			}
		}

		// Destroy the cache
		if ( isNode ) {
			jQuery.cleanData( [ elem ], true );

		// Use delete when supported for expandos or `cache` is not a window per isWindow (#10080)
		} else if ( jQuery.support.deleteExpando || cache != cache.window ) {
			delete cache[ id ];

		// When all else fails, null
		} else {
			cache[ id ] = null;
		}
	},

	// For internal use only.
	_data: function( elem, name, data ) {
		return jQuery.data( elem, name, data, true );
	},

	// A method for determining if a DOM node can handle the data expando
	acceptData: function( elem ) {
		var noData = elem.nodeName && jQuery.noData[ elem.nodeName.toLowerCase() ];

		// nodes accept data unless otherwise specified; rejection can be conditional
		return !noData || noData !== true && elem.getAttribute("classid") === noData;
	}
});

jQuery.fn.extend({
	data: function( key, value ) {
		var parts, part, attr, name, l,
			elem = this[0],
			i = 0,
			data = null;

		// Gets all values
		if ( key === undefined ) {
			if ( this.length ) {
				data = jQuery.data( elem );

				if ( elem.nodeType === 1 && !jQuery._data( elem, "parsedAttrs" ) ) {
					attr = elem.attributes;
					for ( l = attr.length; i < l; i++ ) {
						name = attr[i].name;

						if ( !name.indexOf( "data-" ) ) {
							name = jQuery.camelCase( name.substring(5) );

							dataAttr( elem, name, data[ name ] );
						}
					}
					jQuery._data( elem, "parsedAttrs", true );
				}
			}

			return data;
		}

		// Sets multiple values
		if ( typeof key === "object" ) {
			return this.each(function() {
				jQuery.data( this, key );
			});
		}

		parts = key.split( ".", 2 );
		parts[1] = parts[1] ? "." + parts[1] : "";
		part = parts[1] + "!";

		return jQuery.access( this, function( value ) {

			if ( value === undefined ) {
				data = this.triggerHandler( "getData" + part, [ parts[0] ] );

				// Try to fetch any internally stored data first
				if ( data === undefined && elem ) {
					data = jQuery.data( elem, key );
					data = dataAttr( elem, key, data );
				}

				return data === undefined && parts[1] ?
					this.data( parts[0] ) :
					data;
			}

			parts[1] = value;
			this.each(function() {
				var self = jQuery( this );

				self.triggerHandler( "setData" + part, parts );
				jQuery.data( this, key, value );
				self.triggerHandler( "changeData" + part, parts );
			});
		}, null, value, arguments.length > 1, null, false );
	},

	removeData: function( key ) {
		return this.each(function() {
			jQuery.removeData( this, key );
		});
	}
});

function dataAttr( elem, key, data ) {
	// If nothing was found internally, try to fetch any
	// data from the HTML5 data-* attribute
	if ( data === undefined && elem.nodeType === 1 ) {

		var name = "data-" + key.replace( rmultiDash, "-$1" ).toLowerCase();

		data = elem.getAttribute( name );

		if ( typeof data === "string" ) {
			try {
				data = data === "true" ? true :
				data === "false" ? false :
				data === "null" ? null :
				// Only convert to a number if it doesn't change the string
				+data + "" === data ? +data :
				rbrace.test( data ) ? jQuery.parseJSON( data ) :
					data;
			} catch( e ) {}

			// Make sure we set the data so it isn't changed later
			jQuery.data( elem, key, data );

		} else {
			data = undefined;
		}
	}

	return data;
}

// checks a cache object for emptiness
function isEmptyDataObject( obj ) {
	var name;
	for ( name in obj ) {

		// if the public data object is empty, the private is still empty
		if ( name === "data" && jQuery.isEmptyObject( obj[name] ) ) {
			continue;
		}
		if ( name !== "toJSON" ) {
			return false;
		}
	}

	return true;
}
jQuery.extend({
	queue: function( elem, type, data ) {
		var queue;

		if ( elem ) {
			type = ( type || "fx" ) + "queue";
			queue = jQuery._data( elem, type );

			// Speed up dequeue by getting out quickly if this is just a lookup
			if ( data ) {
				if ( !queue || jQuery.isArray(data) ) {
					queue = jQuery._data( elem, type, jQuery.makeArray(data) );
				} else {
					queue.push( data );
				}
			}
			return queue || [];
		}
	},

	dequeue: function( elem, type ) {
		type = type || "fx";

		var queue = jQuery.queue( elem, type ),
			startLength = queue.length,
			fn = queue.shift(),
			hooks = jQuery._queueHooks( elem, type ),
			next = function() {
				jQuery.dequeue( elem, type );
			};

		// If the fx queue is dequeued, always remove the progress sentinel
		if ( fn === "inprogress" ) {
			fn = queue.shift();
			startLength--;
		}

		if ( fn ) {

			// Add a progress sentinel to prevent the fx queue from being
			// automatically dequeued
			if ( type === "fx" ) {
				queue.unshift( "inprogress" );
			}

			// clear up the last queue stop function
			delete hooks.stop;
			fn.call( elem, next, hooks );
		}

		if ( !startLength && hooks ) {
			hooks.empty.fire();
		}
	},

	// not intended for public consumption - generates a queueHooks object, or returns the current one
	_queueHooks: function( elem, type ) {
		var key = type + "queueHooks";
		return jQuery._data( elem, key ) || jQuery._data( elem, key, {
			empty: jQuery.Callbacks("once memory").add(function() {
				jQuery.removeData( elem, type + "queue", true );
				jQuery.removeData( elem, key, true );
			})
		});
	}
});

jQuery.fn.extend({
	queue: function( type, data ) {
		var setter = 2;

		if ( typeof type !== "string" ) {
			data = type;
			type = "fx";
			setter--;
		}

		if ( arguments.length < setter ) {
			return jQuery.queue( this[0], type );
		}

		return data === undefined ?
			this :
			this.each(function() {
				var queue = jQuery.queue( this, type, data );

				// ensure a hooks for this queue
				jQuery._queueHooks( this, type );

				if ( type === "fx" && queue[0] !== "inprogress" ) {
					jQuery.dequeue( this, type );
				}
			});
	},
	dequeue: function( type ) {
		return this.each(function() {
			jQuery.dequeue( this, type );
		});
	},
	// Based off of the plugin by Clint Helfers, with permission.
	// http://blindsignals.com/index.php/2009/07/jquery-delay/
	delay: function( time, type ) {
		time = jQuery.fx ? jQuery.fx.speeds[ time ] || time : time;
		type = type || "fx";

		return this.queue( type, function( next, hooks ) {
			var timeout = setTimeout( next, time );
			hooks.stop = function() {
				clearTimeout( timeout );
			};
		});
	},
	clearQueue: function( type ) {
		return this.queue( type || "fx", [] );
	},
	// Get a promise resolved when queues of a certain type
	// are emptied (fx is the type by default)
	promise: function( type, obj ) {
		var tmp,
			count = 1,
			defer = jQuery.Deferred(),
			elements = this,
			i = this.length,
			resolve = function() {
				if ( !( --count ) ) {
					defer.resolveWith( elements, [ elements ] );
				}
			};

		if ( typeof type !== "string" ) {
			obj = type;
			type = undefined;
		}
		type = type || "fx";

		while( i-- ) {
			tmp = jQuery._data( elements[ i ], type + "queueHooks" );
			if ( tmp && tmp.empty ) {
				count++;
				tmp.empty.add( resolve );
			}
		}
		resolve();
		return defer.promise( obj );
	}
});
var nodeHook, boolHook, fixSpecified,
	rclass = /[\t\r\n]/g,
	rreturn = /\r/g,
	rtype = /^(?:button|input)$/i,
	rfocusable = /^(?:button|input|object|select|textarea)$/i,
	rclickable = /^a(?:rea|)$/i,
	rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,
	getSetAttribute = jQuery.support.getSetAttribute;

jQuery.fn.extend({
	attr: function( name, value ) {
		return jQuery.access( this, jQuery.attr, name, value, arguments.length > 1 );
	},

	removeAttr: function( name ) {
		return this.each(function() {
			jQuery.removeAttr( this, name );
		});
	},

	prop: function( name, value ) {
		return jQuery.access( this, jQuery.prop, name, value, arguments.length > 1 );
	},

	removeProp: function( name ) {
		name = jQuery.propFix[ name ] || name;
		return this.each(function() {
			// try/catch handles cases where IE balks (such as removing a property on window)
			try {
				this[ name ] = undefined;
				delete this[ name ];
			} catch( e ) {}
		});
	},

	addClass: function( value ) {
		var classNames, i, l, elem,
			setClass, c, cl;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).addClass( value.call(this, j, this.className) );
			});
		}

		if ( value && typeof value === "string" ) {
			classNames = value.split( core_rspace );

			for ( i = 0, l = this.length; i < l; i++ ) {
				elem = this[ i ];

				if ( elem.nodeType === 1 ) {
					if ( !elem.className && classNames.length === 1 ) {
						elem.className = value;

					} else {
						setClass = " " + elem.className + " ";

						for ( c = 0, cl = classNames.length; c < cl; c++ ) {
							if ( setClass.indexOf( " " + classNames[ c ] + " " ) < 0 ) {
								setClass += classNames[ c ] + " ";
							}
						}
						elem.className = jQuery.trim( setClass );
					}
				}
			}
		}

		return this;
	},

	removeClass: function( value ) {
		var removes, className, elem, c, cl, i, l;

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( j ) {
				jQuery( this ).removeClass( value.call(this, j, this.className) );
			});
		}
		if ( (value && typeof value === "string") || value === undefined ) {
			removes = ( value || "" ).split( core_rspace );

			for ( i = 0, l = this.length; i < l; i++ ) {
				elem = this[ i ];
				if ( elem.nodeType === 1 && elem.className ) {

					className = (" " + elem.className + " ").replace( rclass, " " );

					// loop over each item in the removal list
					for ( c = 0, cl = removes.length; c < cl; c++ ) {
						// Remove until there is nothing to remove,
						while ( className.indexOf(" " + removes[ c ] + " ") >= 0 ) {
							className = className.replace( " " + removes[ c ] + " " , " " );
						}
					}
					elem.className = value ? jQuery.trim( className ) : "";
				}
			}
		}

		return this;
	},

	toggleClass: function( value, stateVal ) {
		var type = typeof value,
			isBool = typeof stateVal === "boolean";

		if ( jQuery.isFunction( value ) ) {
			return this.each(function( i ) {
				jQuery( this ).toggleClass( value.call(this, i, this.className, stateVal), stateVal );
			});
		}

		return this.each(function() {
			if ( type === "string" ) {
				// toggle individual class names
				var className,
					i = 0,
					self = jQuery( this ),
					state = stateVal,
					classNames = value.split( core_rspace );

				while ( (className = classNames[ i++ ]) ) {
					// check each className given, space separated list
					state = isBool ? state : !self.hasClass( className );
					self[ state ? "addClass" : "removeClass" ]( className );
				}

			} else if ( type === "undefined" || type === "boolean" ) {
				if ( this.className ) {
					// store className if set
					jQuery._data( this, "__className__", this.className );
				}

				// toggle whole className
				this.className = this.className || value === false ? "" : jQuery._data( this, "__className__" ) || "";
			}
		});
	},

	hasClass: function( selector ) {
		var className = " " + selector + " ",
			i = 0,
			l = this.length;
		for ( ; i < l; i++ ) {
			if ( this[i].nodeType === 1 && (" " + this[i].className + " ").replace(rclass, " ").indexOf( className ) >= 0 ) {
				return true;
			}
		}

		return false;
	},

	val: function( value ) {
		var hooks, ret, isFunction,
			elem = this[0];

		if ( !arguments.length ) {
			if ( elem ) {
				hooks = jQuery.valHooks[ elem.type ] || jQuery.valHooks[ elem.nodeName.toLowerCase() ];

				if ( hooks && "get" in hooks && (ret = hooks.get( elem, "value" )) !== undefined ) {
					return ret;
				}

				ret = elem.value;

				return typeof ret === "string" ?
					// handle most common string cases
					ret.replace(rreturn, "") :
					// handle cases where value is null/undef or number
					ret == null ? "" : ret;
			}

			return;
		}

		isFunction = jQuery.isFunction( value );

		return this.each(function( i ) {
			var val,
				self = jQuery(this);

			if ( this.nodeType !== 1 ) {
				return;
			}

			if ( isFunction ) {
				val = value.call( this, i, self.val() );
			} else {
				val = value;
			}

			// Treat null/undefined as ""; convert numbers to string
			if ( val == null ) {
				val = "";
			} else if ( typeof val === "number" ) {
				val += "";
			} else if ( jQuery.isArray( val ) ) {
				val = jQuery.map(val, function ( value ) {
					return value == null ? "" : value + "";
				});
			}

			hooks = jQuery.valHooks[ this.type ] || jQuery.valHooks[ this.nodeName.toLowerCase() ];

			// If set returns undefined, fall back to normal setting
			if ( !hooks || !("set" in hooks) || hooks.set( this, val, "value" ) === undefined ) {
				this.value = val;
			}
		});
	}
});

jQuery.extend({
	valHooks: {
		option: {
			get: function( elem ) {
				// attributes.value is undefined in Blackberry 4.7 but
				// uses .value. See #6932
				var val = elem.attributes.value;
				return !val || val.specified ? elem.value : elem.text;
			}
		},
		select: {
			get: function( elem ) {
				var value, option,
					options = elem.options,
					index = elem.selectedIndex,
					one = elem.type === "select-one" || index < 0,
					values = one ? null : [],
					max = one ? index + 1 : options.length,
					i = index < 0 ?
						max :
						one ? index : 0;

				// Loop through all the selected options
				for ( ; i < max; i++ ) {
					option = options[ i ];

					// oldIE doesn't update selected after form reset (#2551)
					if ( ( option.selected || i === index ) &&
							// Don't return options that are disabled or in a disabled optgroup
							( jQuery.support.optDisabled ? !option.disabled : option.getAttribute("disabled") === null ) &&
							( !option.parentNode.disabled || !jQuery.nodeName( option.parentNode, "optgroup" ) ) ) {

						// Get the specific value for the option
						value = jQuery( option ).val();

						// We don't need an array for one selects
						if ( one ) {
							return value;
						}

						// Multi-Selects return an array
						values.push( value );
					}
				}

				return values;
			},

			set: function( elem, value ) {
				var values = jQuery.makeArray( value );

				jQuery(elem).find("option").each(function() {
					this.selected = jQuery.inArray( jQuery(this).val(), values ) >= 0;
				});

				if ( !values.length ) {
					elem.selectedIndex = -1;
				}
				return values;
			}
		}
	},

	// Unused in 1.8, left in so attrFn-stabbers won't die; remove in 1.9
	attrFn: {},

	attr: function( elem, name, value, pass ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set attributes on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		if ( pass && jQuery.isFunction( jQuery.fn[ name ] ) ) {
			return jQuery( elem )[ name ]( value );
		}

		// Fallback to prop when attributes are not supported
		if ( typeof elem.getAttribute === "undefined" ) {
			return jQuery.prop( elem, name, value );
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		// All attributes are lowercase
		// Grab necessary hook if one is defined
		if ( notxml ) {
			name = name.toLowerCase();
			hooks = jQuery.attrHooks[ name ] || ( rboolean.test( name ) ? boolHook : nodeHook );
		}

		if ( value !== undefined ) {

			if ( value === null ) {
				jQuery.removeAttr( elem, name );
				return;

			} else if ( hooks && "set" in hooks && notxml && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				elem.setAttribute( name, value + "" );
				return value;
			}

		} else if ( hooks && "get" in hooks && notxml && (ret = hooks.get( elem, name )) !== null ) {
			return ret;

		} else {

			ret = elem.getAttribute( name );

			// Non-existent attributes return null, we normalize to undefined
			return ret === null ?
				undefined :
				ret;
		}
	},

	removeAttr: function( elem, value ) {
		var propName, attrNames, name, isBool,
			i = 0;

		if ( value && elem.nodeType === 1 ) {

			attrNames = value.split( core_rspace );

			for ( ; i < attrNames.length; i++ ) {
				name = attrNames[ i ];

				if ( name ) {
					propName = jQuery.propFix[ name ] || name;
					isBool = rboolean.test( name );

					// See #9699 for explanation of this approach (setting first, then removal)
					// Do not do this for boolean attributes (see #10870)
					if ( !isBool ) {
						jQuery.attr( elem, name, "" );
					}
					elem.removeAttribute( getSetAttribute ? name : propName );

					// Set corresponding property to false for boolean attributes
					if ( isBool && propName in elem ) {
						elem[ propName ] = false;
					}
				}
			}
		}
	},

	attrHooks: {
		type: {
			set: function( elem, value ) {
				// We can't allow the type property to be changed (since it causes problems in IE)
				if ( rtype.test( elem.nodeName ) && elem.parentNode ) {
					jQuery.error( "type property can't be changed" );
				} else if ( !jQuery.support.radioValue && value === "radio" && jQuery.nodeName(elem, "input") ) {
					// Setting the type on a radio button after the value resets the value in IE6-9
					// Reset value to it's default in case type is set after value
					// This is for element creation
					var val = elem.value;
					elem.setAttribute( "type", value );
					if ( val ) {
						elem.value = val;
					}
					return value;
				}
			}
		},
		// Use the value property for back compat
		// Use the nodeHook for button elements in IE6/7 (#1954)
		value: {
			get: function( elem, name ) {
				if ( nodeHook && jQuery.nodeName( elem, "button" ) ) {
					return nodeHook.get( elem, name );
				}
				return name in elem ?
					elem.value :
					null;
			},
			set: function( elem, value, name ) {
				if ( nodeHook && jQuery.nodeName( elem, "button" ) ) {
					return nodeHook.set( elem, value, name );
				}
				// Does not return so that setAttribute is also used
				elem.value = value;
			}
		}
	},

	propFix: {
		tabindex: "tabIndex",
		readonly: "readOnly",
		"for": "htmlFor",
		"class": "className",
		maxlength: "maxLength",
		cellspacing: "cellSpacing",
		cellpadding: "cellPadding",
		rowspan: "rowSpan",
		colspan: "colSpan",
		usemap: "useMap",
		frameborder: "frameBorder",
		contenteditable: "contentEditable"
	},

	prop: function( elem, name, value ) {
		var ret, hooks, notxml,
			nType = elem.nodeType;

		// don't get/set properties on text, comment and attribute nodes
		if ( !elem || nType === 3 || nType === 8 || nType === 2 ) {
			return;
		}

		notxml = nType !== 1 || !jQuery.isXMLDoc( elem );

		if ( notxml ) {
			// Fix name and attach hooks
			name = jQuery.propFix[ name ] || name;
			hooks = jQuery.propHooks[ name ];
		}

		if ( value !== undefined ) {
			if ( hooks && "set" in hooks && (ret = hooks.set( elem, value, name )) !== undefined ) {
				return ret;

			} else {
				return ( elem[ name ] = value );
			}

		} else {
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, name )) !== null ) {
				return ret;

			} else {
				return elem[ name ];
			}
		}
	},

	propHooks: {
		tabIndex: {
			get: function( elem ) {
				// elem.tabIndex doesn't always return the correct value when it hasn't been explicitly set
				// http://fluidproject.org/blog/2008/01/09/getting-setting-and-removing-tabindex-values-with-javascript/
				var attributeNode = elem.getAttributeNode("tabindex");

				return attributeNode && attributeNode.specified ?
					parseInt( attributeNode.value, 10 ) :
					rfocusable.test( elem.nodeName ) || rclickable.test( elem.nodeName ) && elem.href ?
						0 :
						undefined;
			}
		}
	}
});

// Hook for boolean attributes
boolHook = {
	get: function( elem, name ) {
		// Align boolean attributes with corresponding properties
		// Fall back to attribute presence where some booleans are not supported
		var attrNode,
			property = jQuery.prop( elem, name );
		return property === true || typeof property !== "boolean" && ( attrNode = elem.getAttributeNode(name) ) && attrNode.nodeValue !== false ?
			name.toLowerCase() :
			undefined;
	},
	set: function( elem, value, name ) {
		var propName;
		if ( value === false ) {
			// Remove boolean attributes when set to false
			jQuery.removeAttr( elem, name );
		} else {
			// value is true since we know at this point it's type boolean and not false
			// Set boolean attributes to the same name and set the DOM property
			propName = jQuery.propFix[ name ] || name;
			if ( propName in elem ) {
				// Only set the IDL specifically if it already exists on the element
				elem[ propName ] = true;
			}

			elem.setAttribute( name, name.toLowerCase() );
		}
		return name;
	}
};

// IE6/7 do not support getting/setting some attributes with get/setAttribute
if ( !getSetAttribute ) {

	fixSpecified = {
		name: true,
		id: true,
		coords: true
	};

	// Use this for any attribute in IE6/7
	// This fixes almost every IE6/7 issue
	nodeHook = jQuery.valHooks.button = {
		get: function( elem, name ) {
			var ret;
			ret = elem.getAttributeNode( name );
			return ret && ( fixSpecified[ name ] ? ret.value !== "" : ret.specified ) ?
				ret.value :
				undefined;
		},
		set: function( elem, value, name ) {
			// Set the existing or create a new attribute node
			var ret = elem.getAttributeNode( name );
			if ( !ret ) {
				ret = document.createAttribute( name );
				elem.setAttributeNode( ret );
			}
			return ( ret.value = value + "" );
		}
	};

	// Set width and height to auto instead of 0 on empty string( Bug #8150 )
	// This is for removals
	jQuery.each([ "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
			set: function( elem, value ) {
				if ( value === "" ) {
					elem.setAttribute( name, "auto" );
					return value;
				}
			}
		});
	});

	// Set contenteditable to false on removals(#10429)
	// Setting to empty string throws an error as an invalid value
	jQuery.attrHooks.contenteditable = {
		get: nodeHook.get,
		set: function( elem, value, name ) {
			if ( value === "" ) {
				value = "false";
			}
			nodeHook.set( elem, value, name );
		}
	};
}


// Some attributes require a special call on IE
if ( !jQuery.support.hrefNormalized ) {
	jQuery.each([ "href", "src", "width", "height" ], function( i, name ) {
		jQuery.attrHooks[ name ] = jQuery.extend( jQuery.attrHooks[ name ], {
			get: function( elem ) {
				var ret = elem.getAttribute( name, 2 );
				return ret === null ? undefined : ret;
			}
		});
	});
}

if ( !jQuery.support.style ) {
	jQuery.attrHooks.style = {
		get: function( elem ) {
			// Return undefined in the case of empty string
			// Normalize to lowercase since IE uppercases css property names
			return elem.style.cssText.toLowerCase() || undefined;
		},
		set: function( elem, value ) {
			return ( elem.style.cssText = value + "" );
		}
	};
}

// Safari mis-reports the default selected property of an option
// Accessing the parent's selectedIndex property fixes it
if ( !jQuery.support.optSelected ) {
	jQuery.propHooks.selected = jQuery.extend( jQuery.propHooks.selected, {
		get: function( elem ) {
			var parent = elem.parentNode;

			if ( parent ) {
				parent.selectedIndex;

				// Make sure that it also works with optgroups, see #5701
				if ( parent.parentNode ) {
					parent.parentNode.selectedIndex;
				}
			}
			return null;
		}
	});
}

// IE6/7 call enctype encoding
if ( !jQuery.support.enctype ) {
	jQuery.propFix.enctype = "encoding";
}

// Radios and checkboxes getter/setter
if ( !jQuery.support.checkOn ) {
	jQuery.each([ "radio", "checkbox" ], function() {
		jQuery.valHooks[ this ] = {
			get: function( elem ) {
				// Handle the case where in Webkit "" is returned instead of "on" if a value isn't specified
				return elem.getAttribute("value") === null ? "on" : elem.value;
			}
		};
	});
}
jQuery.each([ "radio", "checkbox" ], function() {
	jQuery.valHooks[ this ] = jQuery.extend( jQuery.valHooks[ this ], {
		set: function( elem, value ) {
			if ( jQuery.isArray( value ) ) {
				return ( elem.checked = jQuery.inArray( jQuery(elem).val(), value ) >= 0 );
			}
		}
	});
});
var rformElems = /^(?:textarea|input|select)$/i,
	rtypenamespace = /^([^\.]*|)(?:\.(.+)|)$/,
	rhoverHack = /(?:^|\s)hover(\.\S+|)\b/,
	rkeyEvent = /^key/,
	rmouseEvent = /^(?:mouse|contextmenu)|click/,
	rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
	hoverHack = function( events ) {
		return jQuery.event.special.hover ? events : events.replace( rhoverHack, "mouseenter$1 mouseleave$1" );
	};

/*
 * Helper functions for managing events -- not part of the public interface.
 * Props to Dean Edwards' addEvent library for many of the ideas.
 */
jQuery.event = {

	add: function( elem, types, handler, data, selector ) {

		var elemData, eventHandle, events,
			t, tns, type, namespaces, handleObj,
			handleObjIn, handlers, special;

		// Don't attach events to noData or text/comment nodes (allow plain objects tho)
		if ( elem.nodeType === 3 || elem.nodeType === 8 || !types || !handler || !(elemData = jQuery._data( elem )) ) {
			return;
		}

		// Caller can pass in an object of custom data in lieu of the handler
		if ( handler.handler ) {
			handleObjIn = handler;
			handler = handleObjIn.handler;
			selector = handleObjIn.selector;
		}

		// Make sure that the handler has a unique ID, used to find/remove it later
		if ( !handler.guid ) {
			handler.guid = jQuery.guid++;
		}

		// Init the element's event structure and main handler, if this is the first
		events = elemData.events;
		if ( !events ) {
			elemData.events = events = {};
		}
		eventHandle = elemData.handle;
		if ( !eventHandle ) {
			elemData.handle = eventHandle = function( e ) {
				// Discard the second event of a jQuery.event.trigger() and
				// when an event is called after a page has unloaded
				return typeof jQuery !== "undefined" && (!e || jQuery.event.triggered !== e.type) ?
					jQuery.event.dispatch.apply( eventHandle.elem, arguments ) :
					undefined;
			};
			// Add elem as a property of the handle fn to prevent a memory leak with IE non-native events
			eventHandle.elem = elem;
		}

		// Handle multiple events separated by a space
		// jQuery(...).bind("mouseover mouseout", fn);
		types = jQuery.trim( hoverHack(types) ).split( " " );
		for ( t = 0; t < types.length; t++ ) {

			tns = rtypenamespace.exec( types[t] ) || [];
			type = tns[1];
			namespaces = ( tns[2] || "" ).split( "." ).sort();

			// If event changes its type, use the special event handlers for the changed type
			special = jQuery.event.special[ type ] || {};

			// If selector defined, determine special event api type, otherwise given type
			type = ( selector ? special.delegateType : special.bindType ) || type;

			// Update special based on newly reset type
			special = jQuery.event.special[ type ] || {};

			// handleObj is passed to all event handlers
			handleObj = jQuery.extend({
				type: type,
				origType: tns[1],
				data: data,
				handler: handler,
				guid: handler.guid,
				selector: selector,
				needsContext: selector && jQuery.expr.match.needsContext.test( selector ),
				namespace: namespaces.join(".")
			}, handleObjIn );

			// Init the event handler queue if we're the first
			handlers = events[ type ];
			if ( !handlers ) {
				handlers = events[ type ] = [];
				handlers.delegateCount = 0;

				// Only use addEventListener/attachEvent if the special events handler returns false
				if ( !special.setup || special.setup.call( elem, data, namespaces, eventHandle ) === false ) {
					// Bind the global event handler to the element
					if ( elem.addEventListener ) {
						elem.addEventListener( type, eventHandle, false );

					} else if ( elem.attachEvent ) {
						elem.attachEvent( "on" + type, eventHandle );
					}
				}
			}

			if ( special.add ) {
				special.add.call( elem, handleObj );

				if ( !handleObj.handler.guid ) {
					handleObj.handler.guid = handler.guid;
				}
			}

			// Add to the element's handler list, delegates in front
			if ( selector ) {
				handlers.splice( handlers.delegateCount++, 0, handleObj );
			} else {
				handlers.push( handleObj );
			}

			// Keep track of which events have ever been used, for event optimization
			jQuery.event.global[ type ] = true;
		}

		// Nullify elem to prevent memory leaks in IE
		elem = null;
	},

	global: {},

	// Detach an event or set of events from an element
	remove: function( elem, types, handler, selector, mappedTypes ) {

		var t, tns, type, origType, namespaces, origCount,
			j, events, special, eventType, handleObj,
			elemData = jQuery.hasData( elem ) && jQuery._data( elem );

		if ( !elemData || !(events = elemData.events) ) {
			return;
		}

		// Once for each type.namespace in types; type may be omitted
		types = jQuery.trim( hoverHack( types || "" ) ).split(" ");
		for ( t = 0; t < types.length; t++ ) {
			tns = rtypenamespace.exec( types[t] ) || [];
			type = origType = tns[1];
			namespaces = tns[2];

			// Unbind all events (on this namespace, if provided) for the element
			if ( !type ) {
				for ( type in events ) {
					jQuery.event.remove( elem, type + types[ t ], handler, selector, true );
				}
				continue;
			}

			special = jQuery.event.special[ type ] || {};
			type = ( selector? special.delegateType : special.bindType ) || type;
			eventType = events[ type ] || [];
			origCount = eventType.length;
			namespaces = namespaces ? new RegExp("(^|\\.)" + namespaces.split(".").sort().join("\\.(?:.*\\.|)") + "(\\.|$)") : null;

			// Remove matching events
			for ( j = 0; j < eventType.length; j++ ) {
				handleObj = eventType[ j ];

				if ( ( mappedTypes || origType === handleObj.origType ) &&
					 ( !handler || handler.guid === handleObj.guid ) &&
					 ( !namespaces || namespaces.test( handleObj.namespace ) ) &&
					 ( !selector || selector === handleObj.selector || selector === "**" && handleObj.selector ) ) {
					eventType.splice( j--, 1 );

					if ( handleObj.selector ) {
						eventType.delegateCount--;
					}
					if ( special.remove ) {
						special.remove.call( elem, handleObj );
					}
				}
			}

			// Remove generic event handler if we removed something and no more handlers exist
			// (avoids potential for endless recursion during removal of special event handlers)
			if ( eventType.length === 0 && origCount !== eventType.length ) {
				if ( !special.teardown || special.teardown.call( elem, namespaces, elemData.handle ) === false ) {
					jQuery.removeEvent( elem, type, elemData.handle );
				}

				delete events[ type ];
			}
		}

		// Remove the expando if it's no longer used
		if ( jQuery.isEmptyObject( events ) ) {
			delete elemData.handle;

			// removeData also checks for emptiness and clears the expando if empty
			// so use it instead of delete
			jQuery.removeData( elem, "events", true );
		}
	},

	// Events that are safe to short-circuit if no handlers are attached.
	// Native DOM events should not be added, they may have inline handlers.
	customEvent: {
		"getData": true,
		"setData": true,
		"changeData": true
	},

	trigger: function( event, data, elem, onlyHandlers ) {
		// Don't do events on text and comment nodes
		if ( elem && (elem.nodeType === 3 || elem.nodeType === 8) ) {
			return;
		}

		// Event object or event type
		var cache, exclusive, i, cur, old, ontype, special, handle, eventPath, bubbleType,
			type = event.type || event,
			namespaces = [];

		// focus/blur morphs to focusin/out; ensure we're not firing them right now
		if ( rfocusMorph.test( type + jQuery.event.triggered ) ) {
			return;
		}

		if ( type.indexOf( "!" ) >= 0 ) {
			// Exclusive events trigger only for the exact event (no namespaces)
			type = type.slice(0, -1);
			exclusive = true;
		}

		if ( type.indexOf( "." ) >= 0 ) {
			// Namespaced trigger; create a regexp to match event type in handle()
			namespaces = type.split(".");
			type = namespaces.shift();
			namespaces.sort();
		}

		if ( (!elem || jQuery.event.customEvent[ type ]) && !jQuery.event.global[ type ] ) {
			// No jQuery handlers for this event type, and it can't have inline handlers
			return;
		}

		// Caller can pass in an Event, Object, or just an event type string
		event = typeof event === "object" ?
			// jQuery.Event object
			event[ jQuery.expando ] ? event :
			// Object literal
			new jQuery.Event( type, event ) :
			// Just the event type (string)
			new jQuery.Event( type );

		event.type = type;
		event.isTrigger = true;
		event.exclusive = exclusive;
		event.namespace = namespaces.join( "." );
		event.namespace_re = event.namespace? new RegExp("(^|\\.)" + namespaces.join("\\.(?:.*\\.|)") + "(\\.|$)") : null;
		ontype = type.indexOf( ":" ) < 0 ? "on" + type : "";

		// Handle a global trigger
		if ( !elem ) {

			// TODO: Stop taunting the data cache; remove global events and always attach to document
			cache = jQuery.cache;
			for ( i in cache ) {
				if ( cache[ i ].events && cache[ i ].events[ type ] ) {
					jQuery.event.trigger( event, data, cache[ i ].handle.elem, true );
				}
			}
			return;
		}

		// Clean up the event in case it is being reused
		event.result = undefined;
		if ( !event.target ) {
			event.target = elem;
		}

		// Clone any incoming data and prepend the event, creating the handler arg list
		data = data != null ? jQuery.makeArray( data ) : [];
		data.unshift( event );

		// Allow special events to draw outside the lines
		special = jQuery.event.special[ type ] || {};
		if ( special.trigger && special.trigger.apply( elem, data ) === false ) {
			return;
		}

		// Determine event propagation path in advance, per W3C events spec (#9951)
		// Bubble up to document, then to window; watch for a global ownerDocument var (#9724)
		eventPath = [[ elem, special.bindType || type ]];
		if ( !onlyHandlers && !special.noBubble && !jQuery.isWindow( elem ) ) {

			bubbleType = special.delegateType || type;
			cur = rfocusMorph.test( bubbleType + type ) ? elem : elem.parentNode;
			for ( old = elem; cur; cur = cur.parentNode ) {
				eventPath.push([ cur, bubbleType ]);
				old = cur;
			}

			// Only add window if we got to document (e.g., not plain obj or detached DOM)
			if ( old === (elem.ownerDocument || document) ) {
				eventPath.push([ old.defaultView || old.parentWindow || window, bubbleType ]);
			}
		}

		// Fire handlers on the event path
		for ( i = 0; i < eventPath.length && !event.isPropagationStopped(); i++ ) {

			cur = eventPath[i][0];
			event.type = eventPath[i][1];

			handle = ( jQuery._data( cur, "events" ) || {} )[ event.type ] && jQuery._data( cur, "handle" );
			if ( handle ) {
				handle.apply( cur, data );
			}
			// Note that this is a bare JS function and not a jQuery handler
			handle = ontype && cur[ ontype ];
			if ( handle && jQuery.acceptData( cur ) && handle.apply && handle.apply( cur, data ) === false ) {
				event.preventDefault();
			}
		}
		event.type = type;

		// If nobody prevented the default action, do it now
		if ( !onlyHandlers && !event.isDefaultPrevented() ) {

			if ( (!special._default || special._default.apply( elem.ownerDocument, data ) === false) &&
				!(type === "click" && jQuery.nodeName( elem, "a" )) && jQuery.acceptData( elem ) ) {

				// Call a native DOM method on the target with the same name name as the event.
				// Can't use an .isFunction() check here because IE6/7 fails that test.
				// Don't do default actions on window, that's where global variables be (#6170)
				// IE<9 dies on focus/blur to hidden element (#1486)
				if ( ontype && elem[ type ] && ((type !== "focus" && type !== "blur") || event.target.offsetWidth !== 0) && !jQuery.isWindow( elem ) ) {

					// Don't re-trigger an onFOO event when we call its FOO() method
					old = elem[ ontype ];

					if ( old ) {
						elem[ ontype ] = null;
					}

					// Prevent re-triggering of the same event, since we already bubbled it above
					jQuery.event.triggered = type;
					elem[ type ]();
					jQuery.event.triggered = undefined;

					if ( old ) {
						elem[ ontype ] = old;
					}
				}
			}
		}

		return event.result;
	},

	dispatch: function( event ) {

		// Make a writable jQuery.Event from the native event object
		event = jQuery.event.fix( event || window.event );

		var i, j, cur, ret, selMatch, matched, matches, handleObj, sel, related,
			handlers = ( (jQuery._data( this, "events" ) || {} )[ event.type ] || []),
			delegateCount = handlers.delegateCount,
			args = core_slice.call( arguments ),
			run_all = !event.exclusive && !event.namespace,
			special = jQuery.event.special[ event.type ] || {},
			handlerQueue = [];

		// Use the fix-ed jQuery.Event rather than the (read-only) native event
		args[0] = event;
		event.delegateTarget = this;

		// Call the preDispatch hook for the mapped type, and let it bail if desired
		if ( special.preDispatch && special.preDispatch.call( this, event ) === false ) {
			return;
		}

		// Determine handlers that should run if there are delegated events
		// Avoid non-left-click bubbling in Firefox (#3861)
		if ( delegateCount && !(event.button && event.type === "click") ) {

			for ( cur = event.target; cur != this; cur = cur.parentNode || this ) {

				// Don't process clicks (ONLY) on disabled elements (#6911, #8165, #11382, #11764)
				if ( cur.disabled !== true || event.type !== "click" ) {
					selMatch = {};
					matches = [];
					for ( i = 0; i < delegateCount; i++ ) {
						handleObj = handlers[ i ];
						sel = handleObj.selector;

						if ( selMatch[ sel ] === undefined ) {
							selMatch[ sel ] = handleObj.needsContext ?
								jQuery( sel, this ).index( cur ) >= 0 :
								jQuery.find( sel, this, null, [ cur ] ).length;
						}
						if ( selMatch[ sel ] ) {
							matches.push( handleObj );
						}
					}
					if ( matches.length ) {
						handlerQueue.push({ elem: cur, matches: matches });
					}
				}
			}
		}

		// Add the remaining (directly-bound) handlers
		if ( handlers.length > delegateCount ) {
			handlerQueue.push({ elem: this, matches: handlers.slice( delegateCount ) });
		}

		// Run delegates first; they may want to stop propagation beneath us
		for ( i = 0; i < handlerQueue.length && !event.isPropagationStopped(); i++ ) {
			matched = handlerQueue[ i ];
			event.currentTarget = matched.elem;

			for ( j = 0; j < matched.matches.length && !event.isImmediatePropagationStopped(); j++ ) {
				handleObj = matched.matches[ j ];

				// Triggered event must either 1) be non-exclusive and have no namespace, or
				// 2) have namespace(s) a subset or equal to those in the bound event (both can have no namespace).
				if ( run_all || (!event.namespace && !handleObj.namespace) || event.namespace_re && event.namespace_re.test( handleObj.namespace ) ) {

					event.data = handleObj.data;
					event.handleObj = handleObj;

					ret = ( (jQuery.event.special[ handleObj.origType ] || {}).handle || handleObj.handler )
							.apply( matched.elem, args );

					if ( ret !== undefined ) {
						event.result = ret;
						if ( ret === false ) {
							event.preventDefault();
							event.stopPropagation();
						}
					}
				}
			}
		}

		// Call the postDispatch hook for the mapped type
		if ( special.postDispatch ) {
			special.postDispatch.call( this, event );
		}

		return event.result;
	},

	// Includes some event props shared by KeyEvent and MouseEvent
	// *** attrChange attrName relatedNode srcElement  are not normalized, non-W3C, deprecated, will be removed in 1.8 ***
	props: "attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),

	fixHooks: {},

	keyHooks: {
		props: "char charCode key keyCode".split(" "),
		filter: function( event, original ) {

			// Add which for key events
			if ( event.which == null ) {
				event.which = original.charCode != null ? original.charCode : original.keyCode;
			}

			return event;
		}
	},

	mouseHooks: {
		props: "button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),
		filter: function( event, original ) {
			var eventDoc, doc, body,
				button = original.button,
				fromElement = original.fromElement;

			// Calculate pageX/Y if missing and clientX/Y available
			if ( event.pageX == null && original.clientX != null ) {
				eventDoc = event.target.ownerDocument || document;
				doc = eventDoc.documentElement;
				body = eventDoc.body;

				event.pageX = original.clientX + ( doc && doc.scrollLeft || body && body.scrollLeft || 0 ) - ( doc && doc.clientLeft || body && body.clientLeft || 0 );
				event.pageY = original.clientY + ( doc && doc.scrollTop  || body && body.scrollTop  || 0 ) - ( doc && doc.clientTop  || body && body.clientTop  || 0 );
			}

			// Add relatedTarget, if necessary
			if ( !event.relatedTarget && fromElement ) {
				event.relatedTarget = fromElement === event.target ? original.toElement : fromElement;
			}

			// Add which for click: 1 === left; 2 === middle; 3 === right
			// Note: button is not normalized, so don't use it
			if ( !event.which && button !== undefined ) {
				event.which = ( button & 1 ? 1 : ( button & 2 ? 3 : ( button & 4 ? 2 : 0 ) ) );
			}

			return event;
		}
	},

	fix: function( event ) {
		if ( event[ jQuery.expando ] ) {
			return event;
		}

		// Create a writable copy of the event object and normalize some properties
		var i, prop,
			originalEvent = event,
			fixHook = jQuery.event.fixHooks[ event.type ] || {},
			copy = fixHook.props ? this.props.concat( fixHook.props ) : this.props;

		event = jQuery.Event( originalEvent );

		for ( i = copy.length; i; ) {
			prop = copy[ --i ];
			event[ prop ] = originalEvent[ prop ];
		}

		// Fix target property, if necessary (#1925, IE 6/7/8 & Safari2)
		if ( !event.target ) {
			event.target = originalEvent.srcElement || document;
		}

		// Target should not be a text node (#504, Safari)
		if ( event.target.nodeType === 3 ) {
			event.target = event.target.parentNode;
		}

		// For mouse/key events, metaKey==false if it's undefined (#3368, #11328; IE6/7/8)
		event.metaKey = !!event.metaKey;

		return fixHook.filter? fixHook.filter( event, originalEvent ) : event;
	},

	special: {
		load: {
			// Prevent triggered image.load events from bubbling to window.load
			noBubble: true
		},

		focus: {
			delegateType: "focusin"
		},
		blur: {
			delegateType: "focusout"
		},

		beforeunload: {
			setup: function( data, namespaces, eventHandle ) {
				// We only want to do this special case on windows
				if ( jQuery.isWindow( this ) ) {
					this.onbeforeunload = eventHandle;
				}
			},

			teardown: function( namespaces, eventHandle ) {
				if ( this.onbeforeunload === eventHandle ) {
					this.onbeforeunload = null;
				}
			}
		}
	},

	simulate: function( type, elem, event, bubble ) {
		// Piggyback on a donor event to simulate a different one.
		// Fake originalEvent to avoid donor's stopPropagation, but if the
		// simulated event prevents default then we do the same on the donor.
		var e = jQuery.extend(
			new jQuery.Event(),
			event,
			{ type: type,
				isSimulated: true,
				originalEvent: {}
			}
		);
		if ( bubble ) {
			jQuery.event.trigger( e, null, elem );
		} else {
			jQuery.event.dispatch.call( elem, e );
		}
		if ( e.isDefaultPrevented() ) {
			event.preventDefault();
		}
	}
};

// Some plugins are using, but it's undocumented/deprecated and will be removed.
// The 1.7 special event interface should provide all the hooks needed now.
jQuery.event.handle = jQuery.event.dispatch;

jQuery.removeEvent = document.removeEventListener ?
	function( elem, type, handle ) {
		if ( elem.removeEventListener ) {
			elem.removeEventListener( type, handle, false );
		}
	} :
	function( elem, type, handle ) {
		var name = "on" + type;

		if ( elem.detachEvent ) {

			// #8545, #7054, preventing memory leaks for custom events in IE6-8
			// detachEvent needed property on element, by name of that event, to properly expose it to GC
			if ( typeof elem[ name ] === "undefined" ) {
				elem[ name ] = null;
			}

			elem.detachEvent( name, handle );
		}
	};

jQuery.Event = function( src, props ) {
	// Allow instantiation without the 'new' keyword
	if ( !(this instanceof jQuery.Event) ) {
		return new jQuery.Event( src, props );
	}

	// Event object
	if ( src && src.type ) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		this.isDefaultPrevented = ( src.defaultPrevented || src.returnValue === false ||
			src.getPreventDefault && src.getPreventDefault() ) ? returnTrue : returnFalse;

	// Event type
	} else {
		this.type = src;
	}

	// Put explicitly provided properties onto the event object
	if ( props ) {
		jQuery.extend( this, props );
	}

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || jQuery.now();

	// Mark it as fixed
	this[ jQuery.expando ] = true;
};

function returnFalse() {
	return false;
}
function returnTrue() {
	return true;
}

// jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
// http://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html
jQuery.Event.prototype = {
	preventDefault: function() {
		this.isDefaultPrevented = returnTrue;

		var e = this.originalEvent;
		if ( !e ) {
			return;
		}

		// if preventDefault exists run it on the original event
		if ( e.preventDefault ) {
			e.preventDefault();

		// otherwise set the returnValue property of the original event to false (IE)
		} else {
			e.returnValue = false;
		}
	},
	stopPropagation: function() {
		this.isPropagationStopped = returnTrue;

		var e = this.originalEvent;
		if ( !e ) {
			return;
		}
		// if stopPropagation exists run it on the original event
		if ( e.stopPropagation ) {
			e.stopPropagation();
		}
		// otherwise set the cancelBubble property of the original event to true (IE)
		e.cancelBubble = true;
	},
	stopImmediatePropagation: function() {
		this.isImmediatePropagationStopped = returnTrue;
		this.stopPropagation();
	},
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse
};

// Create mouseenter/leave events using mouseover/out and event-time checks
jQuery.each({
	mouseenter: "mouseover",
	mouseleave: "mouseout"
}, function( orig, fix ) {
	jQuery.event.special[ orig ] = {
		delegateType: fix,
		bindType: fix,

		handle: function( event ) {
			var ret,
				target = this,
				related = event.relatedTarget,
				handleObj = event.handleObj,
				selector = handleObj.selector;

			// For mousenter/leave call the handler if related is outside the target.
			// NB: No relatedTarget if the mouse left/entered the browser window
			if ( !related || (related !== target && !jQuery.contains( target, related )) ) {
				event.type = handleObj.origType;
				ret = handleObj.handler.apply( this, arguments );
				event.type = fix;
			}
			return ret;
		}
	};
});

// IE submit delegation
if ( !jQuery.support.submitBubbles ) {

	jQuery.event.special.submit = {
		setup: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Lazy-add a submit handler when a descendant form may potentially be submitted
			jQuery.event.add( this, "click._submit keypress._submit", function( e ) {
				// Node name check avoids a VML-related crash in IE (#9807)
				var elem = e.target,
					form = jQuery.nodeName( elem, "input" ) || jQuery.nodeName( elem, "button" ) ? elem.form : undefined;
				if ( form && !jQuery._data( form, "_submit_attached" ) ) {
					jQuery.event.add( form, "submit._submit", function( event ) {
						event._submit_bubble = true;
					});
					jQuery._data( form, "_submit_attached", true );
				}
			});
			// return undefined since we don't need an event listener
		},

		postDispatch: function( event ) {
			// If form was submitted by the user, bubble the event up the tree
			if ( event._submit_bubble ) {
				delete event._submit_bubble;
				if ( this.parentNode && !event.isTrigger ) {
					jQuery.event.simulate( "submit", this.parentNode, event, true );
				}
			}
		},

		teardown: function() {
			// Only need this for delegated form submit events
			if ( jQuery.nodeName( this, "form" ) ) {
				return false;
			}

			// Remove delegated handlers; cleanData eventually reaps submit handlers attached above
			jQuery.event.remove( this, "._submit" );
		}
	};
}

// IE change delegation and checkbox/radio fix
if ( !jQuery.support.changeBubbles ) {

	jQuery.event.special.change = {

		setup: function() {

			if ( rformElems.test( this.nodeName ) ) {
				// IE doesn't fire change on a check/radio until blur; trigger it on click
				// after a propertychange. Eat the blur-change in special.change.handle.
				// This still fires onchange a second time for check/radio after blur.
				if ( this.type === "checkbox" || this.type === "radio" ) {
					jQuery.event.add( this, "propertychange._change", function( event ) {
						if ( event.originalEvent.propertyName === "checked" ) {
							this._just_changed = true;
						}
					});
					jQuery.event.add( this, "click._change", function( event ) {
						if ( this._just_changed && !event.isTrigger ) {
							this._just_changed = false;
						}
						// Allow triggered, simulated change events (#11500)
						jQuery.event.simulate( "change", this, event, true );
					});
				}
				return false;
			}
			// Delegated event; lazy-add a change handler on descendant inputs
			jQuery.event.add( this, "beforeactivate._change", function( e ) {
				var elem = e.target;

				if ( rformElems.test( elem.nodeName ) && !jQuery._data( elem, "_change_attached" ) ) {
					jQuery.event.add( elem, "change._change", function( event ) {
						if ( this.parentNode && !event.isSimulated && !event.isTrigger ) {
							jQuery.event.simulate( "change", this.parentNode, event, true );
						}
					});
					jQuery._data( elem, "_change_attached", true );
				}
			});
		},

		handle: function( event ) {
			var elem = event.target;

			// Swallow native change events from checkbox/radio, we already triggered them above
			if ( this !== elem || event.isSimulated || event.isTrigger || (elem.type !== "radio" && elem.type !== "checkbox") ) {
				return event.handleObj.handler.apply( this, arguments );
			}
		},

		teardown: function() {
			jQuery.event.remove( this, "._change" );

			return !rformElems.test( this.nodeName );
		}
	};
}

// Create "bubbling" focus and blur events
if ( !jQuery.support.focusinBubbles ) {
	jQuery.each({ focus: "focusin", blur: "focusout" }, function( orig, fix ) {

		// Attach a single capturing handler while someone wants focusin/focusout
		var attaches = 0,
			handler = function( event ) {
				jQuery.event.simulate( fix, event.target, jQuery.event.fix( event ), true );
			};

		jQuery.event.special[ fix ] = {
			setup: function() {
				if ( attaches++ === 0 ) {
					document.addEventListener( orig, handler, true );
				}
			},
			teardown: function() {
				if ( --attaches === 0 ) {
					document.removeEventListener( orig, handler, true );
				}
			}
		};
	});
}

jQuery.fn.extend({

	on: function( types, selector, data, fn, /*INTERNAL*/ one ) {
		var origFn, type;

		// Types can be a map of types/handlers
		if ( typeof types === "object" ) {
			// ( types-Object, selector, data )
			if ( typeof selector !== "string" ) { // && selector != null
				// ( types-Object, data )
				data = data || selector;
				selector = undefined;
			}
			for ( type in types ) {
				this.on( type, selector, data, types[ type ], one );
			}
			return this;
		}

		if ( data == null && fn == null ) {
			// ( types, fn )
			fn = selector;
			data = selector = undefined;
		} else if ( fn == null ) {
			if ( typeof selector === "string" ) {
				// ( types, selector, fn )
				fn = data;
				data = undefined;
			} else {
				// ( types, data, fn )
				fn = data;
				data = selector;
				selector = undefined;
			}
		}
		if ( fn === false ) {
			fn = returnFalse;
		} else if ( !fn ) {
			return this;
		}

		if ( one === 1 ) {
			origFn = fn;
			fn = function( event ) {
				// Can use an empty set, since event contains the info
				jQuery().off( event );
				return origFn.apply( this, arguments );
			};
			// Use same guid so caller can remove using origFn
			fn.guid = origFn.guid || ( origFn.guid = jQuery.guid++ );
		}
		return this.each( function() {
			jQuery.event.add( this, types, fn, data, selector );
		});
	},
	one: function( types, selector, data, fn ) {
		return this.on( types, selector, data, fn, 1 );
	},
	off: function( types, selector, fn ) {
		var handleObj, type;
		if ( types && types.preventDefault && types.handleObj ) {
			// ( event )  dispatched jQuery.Event
			handleObj = types.handleObj;
			jQuery( types.delegateTarget ).off(
				handleObj.namespace ? handleObj.origType + "." + handleObj.namespace : handleObj.origType,
				handleObj.selector,
				handleObj.handler
			);
			return this;
		}
		if ( typeof types === "object" ) {
			// ( types-object [, selector] )
			for ( type in types ) {
				this.off( type, selector, types[ type ] );
			}
			return this;
		}
		if ( selector === false || typeof selector === "function" ) {
			// ( types [, fn] )
			fn = selector;
			selector = undefined;
		}
		if ( fn === false ) {
			fn = returnFalse;
		}
		return this.each(function() {
			jQuery.event.remove( this, types, fn, selector );
		});
	},

	bind: function( types, data, fn ) {
		return this.on( types, null, data, fn );
	},
	unbind: function( types, fn ) {
		return this.off( types, null, fn );
	},

	live: function( types, data, fn ) {
		jQuery( this.context ).on( types, this.selector, data, fn );
		return this;
	},
	die: function( types, fn ) {
		jQuery( this.context ).off( types, this.selector || "**", fn );
		return this;
	},

	delegate: function( selector, types, data, fn ) {
		return this.on( types, selector, data, fn );
	},
	undelegate: function( selector, types, fn ) {
		// ( namespace ) or ( selector, types [, fn] )
		return arguments.length === 1 ? this.off( selector, "**" ) : this.off( types, selector || "**", fn );
	},

	trigger: function( type, data ) {
		return this.each(function() {
			jQuery.event.trigger( type, data, this );
		});
	},
	triggerHandler: function( type, data ) {
		if ( this[0] ) {
			return jQuery.event.trigger( type, data, this[0], true );
		}
	},

	toggle: function( fn ) {
		// Save reference to arguments for access in closure
		var args = arguments,
			guid = fn.guid || jQuery.guid++,
			i = 0,
			toggler = function( event ) {
				// Figure out which function to execute
				var lastToggle = ( jQuery._data( this, "lastToggle" + fn.guid ) || 0 ) % i;
				jQuery._data( this, "lastToggle" + fn.guid, lastToggle + 1 );

				// Make sure that clicks stop
				event.preventDefault();

				// and execute the function
				return args[ lastToggle ].apply( this, arguments ) || false;
			};

		// link all the functions, so any of them can unbind this click handler
		toggler.guid = guid;
		while ( i < args.length ) {
			args[ i++ ].guid = guid;
		}

		return this.click( toggler );
	},

	hover: function( fnOver, fnOut ) {
		return this.mouseenter( fnOver ).mouseleave( fnOut || fnOver );
	}
});

jQuery.each( ("blur focus focusin focusout load resize scroll unload click dblclick " +
	"mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave " +
	"change select submit keydown keypress keyup error contextmenu").split(" "), function( i, name ) {

	// Handle event binding
	jQuery.fn[ name ] = function( data, fn ) {
		if ( fn == null ) {
			fn = data;
			data = null;
		}

		return arguments.length > 0 ?
			this.on( name, null, data, fn ) :
			this.trigger( name );
	};

	if ( rkeyEvent.test( name ) ) {
		jQuery.event.fixHooks[ name ] = jQuery.event.keyHooks;
	}

	if ( rmouseEvent.test( name ) ) {
		jQuery.event.fixHooks[ name ] = jQuery.event.mouseHooks;
	}
});
/*!
 * Sizzle CSS Selector Engine
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://sizzlejs.com/
 */
(function( window, undefined ) {

var cachedruns,
	assertGetIdNotName,
	Expr,
	getText,
	isXML,
	contains,
	compile,
	sortOrder,
	hasDuplicate,
	outermostContext,

	baseHasDuplicate = true,
	strundefined = "undefined",

	expando = ( "sizcache" + Math.random() ).replace( ".", "" ),

	Token = String,
	document = window.document,
	docElem = document.documentElement,
	dirruns = 0,
	done = 0,
	pop = [].pop,
	push = [].push,
	slice = [].slice,
	// Use a stripped-down indexOf if a native one is unavailable
	indexOf = [].indexOf || function( elem ) {
		var i = 0,
			len = this.length;
		for ( ; i < len; i++ ) {
			if ( this[i] === elem ) {
				return i;
			}
		}
		return -1;
	},

	// Augment a function for special use by Sizzle
	markFunction = function( fn, value ) {
		fn[ expando ] = value == null || value;
		return fn;
	},

	createCache = function() {
		var cache = {},
			keys = [];

		return markFunction(function( key, value ) {
			// Only keep the most recent entries
			if ( keys.push( key ) > Expr.cacheLength ) {
				delete cache[ keys.shift() ];
			}

			// Retrieve with (key + " ") to avoid collision with native Object.prototype properties (see Issue #157)
			return (cache[ key + " " ] = value);
		}, cache );
	},

	classCache = createCache(),
	tokenCache = createCache(),
	compilerCache = createCache(),

	// Regex

	// Whitespace characters http://www.w3.org/TR/css3-selectors/#whitespace
	whitespace = "[\\x20\\t\\r\\n\\f]",
	// http://www.w3.org/TR/css3-syntax/#characters
	characterEncoding = "(?:\\\\.|[-\\w]|[^\\x00-\\xa0])+",

	// Loosely modeled on CSS identifier characters
	// An unquoted value should be a CSS identifier (http://www.w3.org/TR/css3-selectors/#attribute-selectors)
	// Proper syntax: http://www.w3.org/TR/CSS21/syndata.html#value-def-identifier
	identifier = characterEncoding.replace( "w", "w#" ),

	// Acceptable operators http://www.w3.org/TR/selectors/#attribute-selectors
	operators = "([*^$|!~]?=)",
	attributes = "\\[" + whitespace + "*(" + characterEncoding + ")" + whitespace +
		"*(?:" + operators + whitespace + "*(?:(['\"])((?:\\\\.|[^\\\\])*?)\\3|(" + identifier + ")|)|)" + whitespace + "*\\]",

	// Prefer arguments not in parens/brackets,
	//   then attribute selectors and non-pseudos (denoted by :),
	//   then anything else
	// These preferences are here to reduce the number of selectors
	//   needing tokenize in the PSEUDO preFilter
	pseudos = ":(" + characterEncoding + ")(?:\\((?:(['\"])((?:\\\\.|[^\\\\])*?)\\2|([^()[\\]]*|(?:(?:" + attributes + ")|[^:]|\\\\.)*|.*))\\)|)",

	// For matchExpr.POS and matchExpr.needsContext
	pos = ":(even|odd|eq|gt|lt|nth|first|last)(?:\\(" + whitespace +
		"*((?:-\\d)?\\d*)" + whitespace + "*\\)|)(?=[^-]|$)",

	// Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
	rtrim = new RegExp( "^" + whitespace + "+|((?:^|[^\\\\])(?:\\\\.)*)" + whitespace + "+$", "g" ),

	rcomma = new RegExp( "^" + whitespace + "*," + whitespace + "*" ),
	rcombinators = new RegExp( "^" + whitespace + "*([\\x20\\t\\r\\n\\f>+~])" + whitespace + "*" ),
	rpseudo = new RegExp( pseudos ),

	// Easily-parseable/retrievable ID or TAG or CLASS selectors
	rquickExpr = /^(?:#([\w\-]+)|(\w+)|\.([\w\-]+))$/,

	rnot = /^:not/,
	rsibling = /[\x20\t\r\n\f]*[+~]/,
	rendsWithNot = /:not\($/,

	rheader = /h\d/i,
	rinputs = /input|select|textarea|button/i,

	rbackslash = /\\(?!\\)/g,

	matchExpr = {
		"ID": new RegExp( "^#(" + characterEncoding + ")" ),
		"CLASS": new RegExp( "^\\.(" + characterEncoding + ")" ),
		"NAME": new RegExp( "^\\[name=['\"]?(" + characterEncoding + ")['\"]?\\]" ),
		"TAG": new RegExp( "^(" + characterEncoding.replace( "w", "w*" ) + ")" ),
		"ATTR": new RegExp( "^" + attributes ),
		"PSEUDO": new RegExp( "^" + pseudos ),
		"POS": new RegExp( pos, "i" ),
		"CHILD": new RegExp( "^:(only|nth|first|last)-child(?:\\(" + whitespace +
			"*(even|odd|(([+-]|)(\\d*)n|)" + whitespace + "*(?:([+-]|)" + whitespace +
			"*(\\d+)|))" + whitespace + "*\\)|)", "i" ),
		// For use in libraries implementing .is()
		"needsContext": new RegExp( "^" + whitespace + "*[>+~]|" + pos, "i" )
	},

	// Support

	// Used for testing something on an element
	assert = function( fn ) {
		var div = document.createElement("div");

		try {
			return fn( div );
		} catch (e) {
			return false;
		} finally {
			// release memory in IE
			div = null;
		}
	},

	// Check if getElementsByTagName("*") returns only elements
	assertTagNameNoComments = assert(function( div ) {
		div.appendChild( document.createComment("") );
		return !div.getElementsByTagName("*").length;
	}),

	// Check if getAttribute returns normalized href attributes
	assertHrefNotNormalized = assert(function( div ) {
		div.innerHTML = "<a href='#'></a>";
		return div.firstChild && typeof div.firstChild.getAttribute !== strundefined &&
			div.firstChild.getAttribute("href") === "#";
	}),

	// Check if attributes should be retrieved by attribute nodes
	assertAttributes = assert(function( div ) {
		div.innerHTML = "<select></select>";
		var type = typeof div.lastChild.getAttribute("multiple");
		// IE8 returns a string for some attributes even when not present
		return type !== "boolean" && type !== "string";
	}),

	// Check if getElementsByClassName can be trusted
	assertUsableClassName = assert(function( div ) {
		// Opera can't find a second classname (in 9.6)
		div.innerHTML = "<div class='hidden e'></div><div class='hidden'></div>";
		if ( !div.getElementsByClassName || !div.getElementsByClassName("e").length ) {
			return false;
		}

		// Safari 3.2 caches class attributes and doesn't catch changes
		div.lastChild.className = "e";
		return div.getElementsByClassName("e").length === 2;
	}),

	// Check if getElementById returns elements by name
	// Check if getElementsByName privileges form controls or returns elements by ID
	assertUsableName = assert(function( div ) {
		// Inject content
		div.id = expando + 0;
		div.innerHTML = "<a name='" + expando + "'></a><div name='" + expando + "'></div>";
		docElem.insertBefore( div, docElem.firstChild );

		// Test
		var pass = document.getElementsByName &&
			// buggy browsers will return fewer than the correct 2
			document.getElementsByName( expando ).length === 2 +
			// buggy browsers will return more than the correct 0
			document.getElementsByName( expando + 0 ).length;
		assertGetIdNotName = !document.getElementById( expando );

		// Cleanup
		docElem.removeChild( div );

		return pass;
	});

// If slice is not available, provide a backup
try {
	slice.call( docElem.childNodes, 0 )[0].nodeType;
} catch ( e ) {
	slice = function( i ) {
		var elem,
			results = [];
		for ( ; (elem = this[i]); i++ ) {
			results.push( elem );
		}
		return results;
	};
}

function Sizzle( selector, context, results, seed ) {
	results = results || [];
	context = context || document;
	var match, elem, xml, m,
		nodeType = context.nodeType;

	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	if ( nodeType !== 1 && nodeType !== 9 ) {
		return [];
	}

	xml = isXML( context );

	if ( !xml && !seed ) {
		if ( (match = rquickExpr.exec( selector )) ) {
			// Speed-up: Sizzle("#ID")
			if ( (m = match[1]) ) {
				if ( nodeType === 9 ) {
					elem = context.getElementById( m );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					if ( elem && elem.parentNode ) {
						// Handle the case where IE, Opera, and Webkit return items
						// by name instead of ID
						if ( elem.id === m ) {
							results.push( elem );
							return results;
						}
					} else {
						return results;
					}
				} else {
					// Context is not a document
					if ( context.ownerDocument && (elem = context.ownerDocument.getElementById( m )) &&
						contains( context, elem ) && elem.id === m ) {
						results.push( elem );
						return results;
					}
				}

			// Speed-up: Sizzle("TAG")
			} else if ( match[2] ) {
				push.apply( results, slice.call(context.getElementsByTagName( selector ), 0) );
				return results;

			// Speed-up: Sizzle(".CLASS")
			} else if ( (m = match[3]) && assertUsableClassName && context.getElementsByClassName ) {
				push.apply( results, slice.call(context.getElementsByClassName( m ), 0) );
				return results;
			}
		}
	}

	// All others
	return select( selector.replace( rtrim, "$1" ), context, results, seed, xml );
}

Sizzle.matches = function( expr, elements ) {
	return Sizzle( expr, null, null, elements );
};

Sizzle.matchesSelector = function( elem, expr ) {
	return Sizzle( expr, null, null, [ elem ] ).length > 0;
};

// Returns a function to use in pseudos for input types
function createInputPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return name === "input" && elem.type === type;
	};
}

// Returns a function to use in pseudos for buttons
function createButtonPseudo( type ) {
	return function( elem ) {
		var name = elem.nodeName.toLowerCase();
		return (name === "input" || name === "button") && elem.type === type;
	};
}

// Returns a function to use in pseudos for positionals
function createPositionalPseudo( fn ) {
	return markFunction(function( argument ) {
		argument = +argument;
		return markFunction(function( seed, matches ) {
			var j,
				matchIndexes = fn( [], seed.length, argument ),
				i = matchIndexes.length;

			// Match elements found at the specified indexes
			while ( i-- ) {
				if ( seed[ (j = matchIndexes[i]) ] ) {
					seed[j] = !(matches[j] = seed[j]);
				}
			}
		});
	});
}

/**
 * Utility function for retrieving the text value of an array of DOM nodes
 * @param {Array|Element} elem
 */
getText = Sizzle.getText = function( elem ) {
	var node,
		ret = "",
		i = 0,
		nodeType = elem.nodeType;

	if ( nodeType ) {
		if ( nodeType === 1 || nodeType === 9 || nodeType === 11 ) {
			// Use textContent for elements
			// innerText usage removed for consistency of new lines (see #11153)
			if ( typeof elem.textContent === "string" ) {
				return elem.textContent;
			} else {
				// Traverse its children
				for ( elem = elem.firstChild; elem; elem = elem.nextSibling ) {
					ret += getText( elem );
				}
			}
		} else if ( nodeType === 3 || nodeType === 4 ) {
			return elem.nodeValue;
		}
		// Do not include comment or processing instruction nodes
	} else {

		// If no nodeType, this is expected to be an array
		for ( ; (node = elem[i]); i++ ) {
			// Do not traverse comment nodes
			ret += getText( node );
		}
	}
	return ret;
};

isXML = Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833)
	var documentElement = elem && (elem.ownerDocument || elem).documentElement;
	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

// Element contains another
contains = Sizzle.contains = docElem.contains ?
	function( a, b ) {
		var adown = a.nodeType === 9 ? a.documentElement : a,
			bup = b && b.parentNode;
		return a === bup || !!( bup && bup.nodeType === 1 && adown.contains && adown.contains(bup) );
	} :
	docElem.compareDocumentPosition ?
	function( a, b ) {
		return b && !!( a.compareDocumentPosition( b ) & 16 );
	} :
	function( a, b ) {
		while ( (b = b.parentNode) ) {
			if ( b === a ) {
				return true;
			}
		}
		return false;
	};

Sizzle.attr = function( elem, name ) {
	var val,
		xml = isXML( elem );

	if ( !xml ) {
		name = name.toLowerCase();
	}
	if ( (val = Expr.attrHandle[ name ]) ) {
		return val( elem );
	}
	if ( xml || assertAttributes ) {
		return elem.getAttribute( name );
	}
	val = elem.getAttributeNode( name );
	return val ?
		typeof elem[ name ] === "boolean" ?
			elem[ name ] ? name : null :
			val.specified ? val.value : null :
		null;
};

Expr = Sizzle.selectors = {

	// Can be adjusted by the user
	cacheLength: 50,

	createPseudo: markFunction,

	match: matchExpr,

	// IE6/7 return a modified href
	attrHandle: assertHrefNotNormalized ?
		{} :
		{
			"href": function( elem ) {
				return elem.getAttribute( "href", 2 );
			},
			"type": function( elem ) {
				return elem.getAttribute("type");
			}
		},

	find: {
		"ID": assertGetIdNotName ?
			function( id, context, xml ) {
				if ( typeof context.getElementById !== strundefined && !xml ) {
					var m = context.getElementById( id );
					// Check parentNode to catch when Blackberry 4.6 returns
					// nodes that are no longer in the document #6963
					return m && m.parentNode ? [m] : [];
				}
			} :
			function( id, context, xml ) {
				if ( typeof context.getElementById !== strundefined && !xml ) {
					var m = context.getElementById( id );

					return m ?
						m.id === id || typeof m.getAttributeNode !== strundefined && m.getAttributeNode("id").value === id ?
							[m] :
							undefined :
						[];
				}
			},

		"TAG": assertTagNameNoComments ?
			function( tag, context ) {
				if ( typeof context.getElementsByTagName !== strundefined ) {
					return context.getElementsByTagName( tag );
				}
			} :
			function( tag, context ) {
				var results = context.getElementsByTagName( tag );

				// Filter out possible comments
				if ( tag === "*" ) {
					var elem,
						tmp = [],
						i = 0;

					for ( ; (elem = results[i]); i++ ) {
						if ( elem.nodeType === 1 ) {
							tmp.push( elem );
						}
					}

					return tmp;
				}
				return results;
			},

		"NAME": assertUsableName && function( tag, context ) {
			if ( typeof context.getElementsByName !== strundefined ) {
				return context.getElementsByName( name );
			}
		},

		"CLASS": assertUsableClassName && function( className, context, xml ) {
			if ( typeof context.getElementsByClassName !== strundefined && !xml ) {
				return context.getElementsByClassName( className );
			}
		}
	},

	relative: {
		">": { dir: "parentNode", first: true },
		" ": { dir: "parentNode" },
		"+": { dir: "previousSibling", first: true },
		"~": { dir: "previousSibling" }
	},

	preFilter: {
		"ATTR": function( match ) {
			match[1] = match[1].replace( rbackslash, "" );

			// Move the given value to match[3] whether quoted or unquoted
			match[3] = ( match[4] || match[5] || "" ).replace( rbackslash, "" );

			if ( match[2] === "~=" ) {
				match[3] = " " + match[3] + " ";
			}

			return match.slice( 0, 4 );
		},

		"CHILD": function( match ) {
			/* matches from matchExpr["CHILD"]
				1 type (only|nth|...)
				2 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
				3 xn-component of xn+y argument ([+-]?\d*n|)
				4 sign of xn-component
				5 x of xn-component
				6 sign of y-component
				7 y of y-component
			*/
			match[1] = match[1].toLowerCase();

			if ( match[1] === "nth" ) {
				// nth-child requires argument
				if ( !match[2] ) {
					Sizzle.error( match[0] );
				}

				// numeric x and y parameters for Expr.filter.CHILD
				// remember that false/true cast respectively to 0/1
				match[3] = +( match[3] ? match[4] + (match[5] || 1) : 2 * ( match[2] === "even" || match[2] === "odd" ) );
				match[4] = +( ( match[6] + match[7] ) || match[2] === "odd" );

			// other types prohibit arguments
			} else if ( match[2] ) {
				Sizzle.error( match[0] );
			}

			return match;
		},

		"PSEUDO": function( match ) {
			var unquoted, excess;
			if ( matchExpr["CHILD"].test( match[0] ) ) {
				return null;
			}

			if ( match[3] ) {
				match[2] = match[3];
			} else if ( (unquoted = match[4]) ) {
				// Only check arguments that contain a pseudo
				if ( rpseudo.test(unquoted) &&
					// Get excess from tokenize (recursively)
					(excess = tokenize( unquoted, true )) &&
					// advance to the next closing parenthesis
					(excess = unquoted.indexOf( ")", unquoted.length - excess ) - unquoted.length) ) {

					// excess is a negative index
					unquoted = unquoted.slice( 0, excess );
					match[0] = match[0].slice( 0, excess );
				}
				match[2] = unquoted;
			}

			// Return only captures needed by the pseudo filter method (type and argument)
			return match.slice( 0, 3 );
		}
	},

	filter: {
		"ID": assertGetIdNotName ?
			function( id ) {
				id = id.replace( rbackslash, "" );
				return function( elem ) {
					return elem.getAttribute("id") === id;
				};
			} :
			function( id ) {
				id = id.replace( rbackslash, "" );
				return function( elem ) {
					var node = typeof elem.getAttributeNode !== strundefined && elem.getAttributeNode("id");
					return node && node.value === id;
				};
			},

		"TAG": function( nodeName ) {
			if ( nodeName === "*" ) {
				return function() { return true; };
			}
			nodeName = nodeName.replace( rbackslash, "" ).toLowerCase();

			return function( elem ) {
				return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
			};
		},

		"CLASS": function( className ) {
			var pattern = classCache[ expando ][ className + " " ];

			return pattern ||
				(pattern = new RegExp( "(^|" + whitespace + ")" + className + "(" + whitespace + "|$)" )) &&
				classCache( className, function( elem ) {
					return pattern.test( elem.className || (typeof elem.getAttribute !== strundefined && elem.getAttribute("class")) || "" );
				});
		},

		"ATTR": function( name, operator, check ) {
			return function( elem, context ) {
				var result = Sizzle.attr( elem, name );

				if ( result == null ) {
					return operator === "!=";
				}
				if ( !operator ) {
					return true;
				}

				result += "";

				return operator === "=" ? result === check :
					operator === "!=" ? result !== check :
					operator === "^=" ? check && result.indexOf( check ) === 0 :
					operator === "*=" ? check && result.indexOf( check ) > -1 :
					operator === "$=" ? check && result.substr( result.length - check.length ) === check :
					operator === "~=" ? ( " " + result + " " ).indexOf( check ) > -1 :
					operator === "|=" ? result === check || result.substr( 0, check.length + 1 ) === check + "-" :
					false;
			};
		},

		"CHILD": function( type, argument, first, last ) {

			if ( type === "nth" ) {
				return function( elem ) {
					var node, diff,
						parent = elem.parentNode;

					if ( first === 1 && last === 0 ) {
						return true;
					}

					if ( parent ) {
						diff = 0;
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								diff++;
								if ( elem === node ) {
									break;
								}
							}
						}
					}

					// Incorporate the offset (or cast to NaN), then check against cycle size
					diff -= last;
					return diff === first || ( diff % first === 0 && diff / first >= 0 );
				};
			}

			return function( elem ) {
				var node = elem;

				switch ( type ) {
					case "only":
					case "first":
						while ( (node = node.previousSibling) ) {
							if ( node.nodeType === 1 ) {
								return false;
							}
						}

						if ( type === "first" ) {
							return true;
						}

						node = elem;

						/* falls through */
					case "last":
						while ( (node = node.nextSibling) ) {
							if ( node.nodeType === 1 ) {
								return false;
							}
						}

						return true;
				}
			};
		},

		"PSEUDO": function( pseudo, argument ) {
			// pseudo-class names are case-insensitive
			// http://www.w3.org/TR/selectors/#pseudo-classes
			// Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
			// Remember that setFilters inherits from pseudos
			var args,
				fn = Expr.pseudos[ pseudo ] || Expr.setFilters[ pseudo.toLowerCase() ] ||
					Sizzle.error( "unsupported pseudo: " + pseudo );

			// The user may use createPseudo to indicate that
			// arguments are needed to create the filter function
			// just as Sizzle does
			if ( fn[ expando ] ) {
				return fn( argument );
			}

			// But maintain support for old signatures
			if ( fn.length > 1 ) {
				args = [ pseudo, pseudo, "", argument ];
				return Expr.setFilters.hasOwnProperty( pseudo.toLowerCase() ) ?
					markFunction(function( seed, matches ) {
						var idx,
							matched = fn( seed, argument ),
							i = matched.length;
						while ( i-- ) {
							idx = indexOf.call( seed, matched[i] );
							seed[ idx ] = !( matches[ idx ] = matched[i] );
						}
					}) :
					function( elem ) {
						return fn( elem, 0, args );
					};
			}

			return fn;
		}
	},

	pseudos: {
		"not": markFunction(function( selector ) {
			// Trim the selector passed to compile
			// to avoid treating leading and trailing
			// spaces as combinators
			var input = [],
				results = [],
				matcher = compile( selector.replace( rtrim, "$1" ) );

			return matcher[ expando ] ?
				markFunction(function( seed, matches, context, xml ) {
					var elem,
						unmatched = matcher( seed, null, xml, [] ),
						i = seed.length;

					// Match elements unmatched by `matcher`
					while ( i-- ) {
						if ( (elem = unmatched[i]) ) {
							seed[i] = !(matches[i] = elem);
						}
					}
				}) :
				function( elem, context, xml ) {
					input[0] = elem;
					matcher( input, null, xml, results );
					return !results.pop();
				};
		}),

		"has": markFunction(function( selector ) {
			return function( elem ) {
				return Sizzle( selector, elem ).length > 0;
			};
		}),

		"contains": markFunction(function( text ) {
			return function( elem ) {
				return ( elem.textContent || elem.innerText || getText( elem ) ).indexOf( text ) > -1;
			};
		}),

		"enabled": function( elem ) {
			return elem.disabled === false;
		},

		"disabled": function( elem ) {
			return elem.disabled === true;
		},

		"checked": function( elem ) {
			// In CSS3, :checked should return both checked and selected elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			var nodeName = elem.nodeName.toLowerCase();
			return (nodeName === "input" && !!elem.checked) || (nodeName === "option" && !!elem.selected);
		},

		"selected": function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			if ( elem.parentNode ) {
				elem.parentNode.selectedIndex;
			}

			return elem.selected === true;
		},

		"parent": function( elem ) {
			return !Expr.pseudos["empty"]( elem );
		},

		"empty": function( elem ) {
			// http://www.w3.org/TR/selectors/#empty-pseudo
			// :empty is only affected by element nodes and content nodes(including text(3), cdata(4)),
			//   not comment, processing instructions, or others
			// Thanks to Diego Perini for the nodeName shortcut
			//   Greater than "@" means alpha characters (specifically not starting with "#" or "?")
			var nodeType;
			elem = elem.firstChild;
			while ( elem ) {
				if ( elem.nodeName > "@" || (nodeType = elem.nodeType) === 3 || nodeType === 4 ) {
					return false;
				}
				elem = elem.nextSibling;
			}
			return true;
		},

		"header": function( elem ) {
			return rheader.test( elem.nodeName );
		},

		"text": function( elem ) {
			var type, attr;
			// IE6 and 7 will map elem.type to 'text' for new HTML5 types (search, etc)
			// use getAttribute instead to test this case
			return elem.nodeName.toLowerCase() === "input" &&
				(type = elem.type) === "text" &&
				( (attr = elem.getAttribute("type")) == null || attr.toLowerCase() === type );
		},

		// Input types
		"radio": createInputPseudo("radio"),
		"checkbox": createInputPseudo("checkbox"),
		"file": createInputPseudo("file"),
		"password": createInputPseudo("password"),
		"image": createInputPseudo("image"),

		"submit": createButtonPseudo("submit"),
		"reset": createButtonPseudo("reset"),

		"button": function( elem ) {
			var name = elem.nodeName.toLowerCase();
			return name === "input" && elem.type === "button" || name === "button";
		},

		"input": function( elem ) {
			return rinputs.test( elem.nodeName );
		},

		"focus": function( elem ) {
			var doc = elem.ownerDocument;
			return elem === doc.activeElement && (!doc.hasFocus || doc.hasFocus()) && !!(elem.type || elem.href || ~elem.tabIndex);
		},

		"active": function( elem ) {
			return elem === elem.ownerDocument.activeElement;
		},

		// Positional types
		"first": createPositionalPseudo(function() {
			return [ 0 ];
		}),

		"last": createPositionalPseudo(function( matchIndexes, length ) {
			return [ length - 1 ];
		}),

		"eq": createPositionalPseudo(function( matchIndexes, length, argument ) {
			return [ argument < 0 ? argument + length : argument ];
		}),

		"even": createPositionalPseudo(function( matchIndexes, length ) {
			for ( var i = 0; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"odd": createPositionalPseudo(function( matchIndexes, length ) {
			for ( var i = 1; i < length; i += 2 ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"lt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			for ( var i = argument < 0 ? argument + length : argument; --i >= 0; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		}),

		"gt": createPositionalPseudo(function( matchIndexes, length, argument ) {
			for ( var i = argument < 0 ? argument + length : argument; ++i < length; ) {
				matchIndexes.push( i );
			}
			return matchIndexes;
		})
	}
};

function siblingCheck( a, b, ret ) {
	if ( a === b ) {
		return ret;
	}

	var cur = a.nextSibling;

	while ( cur ) {
		if ( cur === b ) {
			return -1;
		}

		cur = cur.nextSibling;
	}

	return 1;
}

sortOrder = docElem.compareDocumentPosition ?
	function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		return ( !a.compareDocumentPosition || !b.compareDocumentPosition ?
			a.compareDocumentPosition :
			a.compareDocumentPosition(b) & 4
		) ? -1 : 1;
	} :
	function( a, b ) {
		// The nodes are identical, we can exit early
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// Fallback to using sourceIndex (in IE) if it's available on both nodes
		} else if ( a.sourceIndex && b.sourceIndex ) {
			return a.sourceIndex - b.sourceIndex;
		}

		var al, bl,
			ap = [],
			bp = [],
			aup = a.parentNode,
			bup = b.parentNode,
			cur = aup;

		// If the nodes are siblings (or identical) we can do a quick check
		if ( aup === bup ) {
			return siblingCheck( a, b );

		// If no parents were found then the nodes are disconnected
		} else if ( !aup ) {
			return -1;

		} else if ( !bup ) {
			return 1;
		}

		// Otherwise they're somewhere else in the tree so we need
		// to build up a full list of the parentNodes for comparison
		while ( cur ) {
			ap.unshift( cur );
			cur = cur.parentNode;
		}

		cur = bup;

		while ( cur ) {
			bp.unshift( cur );
			cur = cur.parentNode;
		}

		al = ap.length;
		bl = bp.length;

		// Start walking down the tree looking for a discrepancy
		for ( var i = 0; i < al && i < bl; i++ ) {
			if ( ap[i] !== bp[i] ) {
				return siblingCheck( ap[i], bp[i] );
			}
		}

		// We ended someplace up the tree so do a sibling check
		return i === al ?
			siblingCheck( a, bp[i], -1 ) :
			siblingCheck( ap[i], b, 1 );
	};

// Always assume the presence of duplicates if sort doesn't
// pass them to our comparison function (as in Google Chrome).
[0, 0].sort( sortOrder );
baseHasDuplicate = !hasDuplicate;

// Document sorting and removing duplicates
Sizzle.uniqueSort = function( results ) {
	var elem,
		duplicates = [],
		i = 1,
		j = 0;

	hasDuplicate = baseHasDuplicate;
	results.sort( sortOrder );

	if ( hasDuplicate ) {
		for ( ; (elem = results[i]); i++ ) {
			if ( elem === results[ i - 1 ] ) {
				j = duplicates.push( i );
			}
		}
		while ( j-- ) {
			results.splice( duplicates[ j ], 1 );
		}
	}

	return results;
};

Sizzle.error = function( msg ) {
	throw new Error( "Syntax error, unrecognized expression: " + msg );
};

function tokenize( selector, parseOnly ) {
	var matched, match, tokens, type,
		soFar, groups, preFilters,
		cached = tokenCache[ expando ][ selector + " " ];

	if ( cached ) {
		return parseOnly ? 0 : cached.slice( 0 );
	}

	soFar = selector;
	groups = [];
	preFilters = Expr.preFilter;

	while ( soFar ) {

		// Comma and first run
		if ( !matched || (match = rcomma.exec( soFar )) ) {
			if ( match ) {
				// Don't consume trailing commas as valid
				soFar = soFar.slice( match[0].length ) || soFar;
			}
			groups.push( tokens = [] );
		}

		matched = false;

		// Combinators
		if ( (match = rcombinators.exec( soFar )) ) {
			tokens.push( matched = new Token( match.shift() ) );
			soFar = soFar.slice( matched.length );

			// Cast descendant combinators to space
			matched.type = match[0].replace( rtrim, " " );
		}

		// Filters
		for ( type in Expr.filter ) {
			if ( (match = matchExpr[ type ].exec( soFar )) && (!preFilters[ type ] ||
				(match = preFilters[ type ]( match ))) ) {

				tokens.push( matched = new Token( match.shift() ) );
				soFar = soFar.slice( matched.length );
				matched.type = type;
				matched.matches = match;
			}
		}

		if ( !matched ) {
			break;
		}
	}

	// Return the length of the invalid excess
	// if we're just parsing
	// Otherwise, throw an error or return tokens
	return parseOnly ?
		soFar.length :
		soFar ?
			Sizzle.error( selector ) :
			// Cache the tokens
			tokenCache( selector, groups ).slice( 0 );
}

function addCombinator( matcher, combinator, base ) {
	var dir = combinator.dir,
		checkNonElements = base && combinator.dir === "parentNode",
		doneName = done++;

	return combinator.first ?
		// Check against closest ancestor/preceding element
		function( elem, context, xml ) {
			while ( (elem = elem[ dir ]) ) {
				if ( checkNonElements || elem.nodeType === 1  ) {
					return matcher( elem, context, xml );
				}
			}
		} :

		// Check against all ancestor/preceding elements
		function( elem, context, xml ) {
			// We can't set arbitrary data on XML nodes, so they don't benefit from dir caching
			if ( !xml ) {
				var cache,
					dirkey = dirruns + " " + doneName + " ",
					cachedkey = dirkey + cachedruns;
				while ( (elem = elem[ dir ]) ) {
					if ( checkNonElements || elem.nodeType === 1 ) {
						if ( (cache = elem[ expando ]) === cachedkey ) {
							return elem.sizset;
						} else if ( typeof cache === "string" && cache.indexOf(dirkey) === 0 ) {
							if ( elem.sizset ) {
								return elem;
							}
						} else {
							elem[ expando ] = cachedkey;
							if ( matcher( elem, context, xml ) ) {
								elem.sizset = true;
								return elem;
							}
							elem.sizset = false;
						}
					}
				}
			} else {
				while ( (elem = elem[ dir ]) ) {
					if ( checkNonElements || elem.nodeType === 1 ) {
						if ( matcher( elem, context, xml ) ) {
							return elem;
						}
					}
				}
			}
		};
}

function elementMatcher( matchers ) {
	return matchers.length > 1 ?
		function( elem, context, xml ) {
			var i = matchers.length;
			while ( i-- ) {
				if ( !matchers[i]( elem, context, xml ) ) {
					return false;
				}
			}
			return true;
		} :
		matchers[0];
}

function condense( unmatched, map, filter, context, xml ) {
	var elem,
		newUnmatched = [],
		i = 0,
		len = unmatched.length,
		mapped = map != null;

	for ( ; i < len; i++ ) {
		if ( (elem = unmatched[i]) ) {
			if ( !filter || filter( elem, context, xml ) ) {
				newUnmatched.push( elem );
				if ( mapped ) {
					map.push( i );
				}
			}
		}
	}

	return newUnmatched;
}

function setMatcher( preFilter, selector, matcher, postFilter, postFinder, postSelector ) {
	if ( postFilter && !postFilter[ expando ] ) {
		postFilter = setMatcher( postFilter );
	}
	if ( postFinder && !postFinder[ expando ] ) {
		postFinder = setMatcher( postFinder, postSelector );
	}
	return markFunction(function( seed, results, context, xml ) {
		var temp, i, elem,
			preMap = [],
			postMap = [],
			preexisting = results.length,

			// Get initial elements from seed or context
			elems = seed || multipleContexts( selector || "*", context.nodeType ? [ context ] : context, [] ),

			// Prefilter to get matcher input, preserving a map for seed-results synchronization
			matcherIn = preFilter && ( seed || !selector ) ?
				condense( elems, preMap, preFilter, context, xml ) :
				elems,

			matcherOut = matcher ?
				// If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
				postFinder || ( seed ? preFilter : preexisting || postFilter ) ?

					// ...intermediate processing is necessary
					[] :

					// ...otherwise use results directly
					results :
				matcherIn;

		// Find primary matches
		if ( matcher ) {
			matcher( matcherIn, matcherOut, context, xml );
		}

		// Apply postFilter
		if ( postFilter ) {
			temp = condense( matcherOut, postMap );
			postFilter( temp, [], context, xml );

			// Un-match failing elements by moving them back to matcherIn
			i = temp.length;
			while ( i-- ) {
				if ( (elem = temp[i]) ) {
					matcherOut[ postMap[i] ] = !(matcherIn[ postMap[i] ] = elem);
				}
			}
		}

		if ( seed ) {
			if ( postFinder || preFilter ) {
				if ( postFinder ) {
					// Get the final matcherOut by condensing this intermediate into postFinder contexts
					temp = [];
					i = matcherOut.length;
					while ( i-- ) {
						if ( (elem = matcherOut[i]) ) {
							// Restore matcherIn since elem is not yet a final match
							temp.push( (matcherIn[i] = elem) );
						}
					}
					postFinder( null, (matcherOut = []), temp, xml );
				}

				// Move matched elements from seed to results to keep them synchronized
				i = matcherOut.length;
				while ( i-- ) {
					if ( (elem = matcherOut[i]) &&
						(temp = postFinder ? indexOf.call( seed, elem ) : preMap[i]) > -1 ) {

						seed[temp] = !(results[temp] = elem);
					}
				}
			}

		// Add elements to results, through postFinder if defined
		} else {
			matcherOut = condense(
				matcherOut === results ?
					matcherOut.splice( preexisting, matcherOut.length ) :
					matcherOut
			);
			if ( postFinder ) {
				postFinder( null, results, matcherOut, xml );
			} else {
				push.apply( results, matcherOut );
			}
		}
	});
}

function matcherFromTokens( tokens ) {
	var checkContext, matcher, j,
		len = tokens.length,
		leadingRelative = Expr.relative[ tokens[0].type ],
		implicitRelative = leadingRelative || Expr.relative[" "],
		i = leadingRelative ? 1 : 0,

		// The foundational matcher ensures that elements are reachable from top-level context(s)
		matchContext = addCombinator( function( elem ) {
			return elem === checkContext;
		}, implicitRelative, true ),
		matchAnyContext = addCombinator( function( elem ) {
			return indexOf.call( checkContext, elem ) > -1;
		}, implicitRelative, true ),
		matchers = [ function( elem, context, xml ) {
			return ( !leadingRelative && ( xml || context !== outermostContext ) ) || (
				(checkContext = context).nodeType ?
					matchContext( elem, context, xml ) :
					matchAnyContext( elem, context, xml ) );
		} ];

	for ( ; i < len; i++ ) {
		if ( (matcher = Expr.relative[ tokens[i].type ]) ) {
			matchers = [ addCombinator( elementMatcher( matchers ), matcher ) ];
		} else {
			matcher = Expr.filter[ tokens[i].type ].apply( null, tokens[i].matches );

			// Return special upon seeing a positional matcher
			if ( matcher[ expando ] ) {
				// Find the next relative operator (if any) for proper handling
				j = ++i;
				for ( ; j < len; j++ ) {
					if ( Expr.relative[ tokens[j].type ] ) {
						break;
					}
				}
				return setMatcher(
					i > 1 && elementMatcher( matchers ),
					i > 1 && tokens.slice( 0, i - 1 ).join("").replace( rtrim, "$1" ),
					matcher,
					i < j && matcherFromTokens( tokens.slice( i, j ) ),
					j < len && matcherFromTokens( (tokens = tokens.slice( j )) ),
					j < len && tokens.join("")
				);
			}
			matchers.push( matcher );
		}
	}

	return elementMatcher( matchers );
}

function matcherFromGroupMatchers( elementMatchers, setMatchers ) {
	var bySet = setMatchers.length > 0,
		byElement = elementMatchers.length > 0,
		superMatcher = function( seed, context, xml, results, expandContext ) {
			var elem, j, matcher,
				setMatched = [],
				matchedCount = 0,
				i = "0",
				unmatched = seed && [],
				outermost = expandContext != null,
				contextBackup = outermostContext,
				// We must always have either seed elements or context
				elems = seed || byElement && Expr.find["TAG"]( "*", expandContext && context.parentNode || context ),
				// Nested matchers should use non-integer dirruns
				dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.E);

			if ( outermost ) {
				outermostContext = context !== document && context;
				cachedruns = superMatcher.el;
			}

			// Add elements passing elementMatchers directly to results
			for ( ; (elem = elems[i]) != null; i++ ) {
				if ( byElement && elem ) {
					for ( j = 0; (matcher = elementMatchers[j]); j++ ) {
						if ( matcher( elem, context, xml ) ) {
							results.push( elem );
							break;
						}
					}
					if ( outermost ) {
						dirruns = dirrunsUnique;
						cachedruns = ++superMatcher.el;
					}
				}

				// Track unmatched elements for set filters
				if ( bySet ) {
					// They will have gone through all possible matchers
					if ( (elem = !matcher && elem) ) {
						matchedCount--;
					}

					// Lengthen the array for every element, matched or not
					if ( seed ) {
						unmatched.push( elem );
					}
				}
			}

			// Apply set filters to unmatched elements
			matchedCount += i;
			if ( bySet && i !== matchedCount ) {
				for ( j = 0; (matcher = setMatchers[j]); j++ ) {
					matcher( unmatched, setMatched, context, xml );
				}

				if ( seed ) {
					// Reintegrate element matches to eliminate the need for sorting
					if ( matchedCount > 0 ) {
						while ( i-- ) {
							if ( !(unmatched[i] || setMatched[i]) ) {
								setMatched[i] = pop.call( results );
							}
						}
					}

					// Discard index placeholder values to get only actual matches
					setMatched = condense( setMatched );
				}

				// Add matches to results
				push.apply( results, setMatched );

				// Seedless set matches succeeding multiple successful matchers stipulate sorting
				if ( outermost && !seed && setMatched.length > 0 &&
					( matchedCount + setMatchers.length ) > 1 ) {

					Sizzle.uniqueSort( results );
				}
			}

			// Override manipulation of globals by nested matchers
			if ( outermost ) {
				dirruns = dirrunsUnique;
				outermostContext = contextBackup;
			}

			return unmatched;
		};

	superMatcher.el = 0;
	return bySet ?
		markFunction( superMatcher ) :
		superMatcher;
}

compile = Sizzle.compile = function( selector, group /* Internal Use Only */ ) {
	var i,
		setMatchers = [],
		elementMatchers = [],
		cached = compilerCache[ expando ][ selector + " " ];

	if ( !cached ) {
		// Generate a function of recursive functions that can be used to check each element
		if ( !group ) {
			group = tokenize( selector );
		}
		i = group.length;
		while ( i-- ) {
			cached = matcherFromTokens( group[i] );
			if ( cached[ expando ] ) {
				setMatchers.push( cached );
			} else {
				elementMatchers.push( cached );
			}
		}

		// Cache the compiled function
		cached = compilerCache( selector, matcherFromGroupMatchers( elementMatchers, setMatchers ) );
	}
	return cached;
};

function multipleContexts( selector, contexts, results ) {
	var i = 0,
		len = contexts.length;
	for ( ; i < len; i++ ) {
		Sizzle( selector, contexts[i], results );
	}
	return results;
}

function select( selector, context, results, seed, xml ) {
	var i, tokens, token, type, find,
		match = tokenize( selector ),
		j = match.length;

	if ( !seed ) {
		// Try to minimize operations if there is only one group
		if ( match.length === 1 ) {

			// Take a shortcut and set the context if the root selector is an ID
			tokens = match[0] = match[0].slice( 0 );
			if ( tokens.length > 2 && (token = tokens[0]).type === "ID" &&
					context.nodeType === 9 && !xml &&
					Expr.relative[ tokens[1].type ] ) {

				context = Expr.find["ID"]( token.matches[0].replace( rbackslash, "" ), context, xml )[0];
				if ( !context ) {
					return results;
				}

				selector = selector.slice( tokens.shift().length );
			}

			// Fetch a seed set for right-to-left matching
			for ( i = matchExpr["POS"].test( selector ) ? -1 : tokens.length - 1; i >= 0; i-- ) {
				token = tokens[i];

				// Abort if we hit a combinator
				if ( Expr.relative[ (type = token.type) ] ) {
					break;
				}
				if ( (find = Expr.find[ type ]) ) {
					// Search, expanding context for leading sibling combinators
					if ( (seed = find(
						token.matches[0].replace( rbackslash, "" ),
						rsibling.test( tokens[0].type ) && context.parentNode || context,
						xml
					)) ) {

						// If seed is empty or no tokens remain, we can return early
						tokens.splice( i, 1 );
						selector = seed.length && tokens.join("");
						if ( !selector ) {
							push.apply( results, slice.call( seed, 0 ) );
							return results;
						}

						break;
					}
				}
			}
		}
	}

	// Compile and execute a filtering function
	// Provide `match` to avoid retokenization if we modified the selector above
	compile( selector, match )(
		seed,
		context,
		xml,
		results,
		rsibling.test( selector )
	);
	return results;
}

if ( document.querySelectorAll ) {
	(function() {
		var disconnectedMatch,
			oldSelect = select,
			rescape = /'|\\/g,
			rattributeQuotes = /\=[\x20\t\r\n\f]*([^'"\]]*)[\x20\t\r\n\f]*\]/g,

			// qSa(:focus) reports false when true (Chrome 21), no need to also add to buggyMatches since matches checks buggyQSA
			// A support test would require too much code (would include document ready)
			rbuggyQSA = [ ":focus" ],

			// matchesSelector(:active) reports false when true (IE9/Opera 11.5)
			// A support test would require too much code (would include document ready)
			// just skip matchesSelector for :active
			rbuggyMatches = [ ":active" ],
			matches = docElem.matchesSelector ||
				docElem.mozMatchesSelector ||
				docElem.webkitMatchesSelector ||
				docElem.oMatchesSelector ||
				docElem.msMatchesSelector;

		// Build QSA regex
		// Regex strategy adopted from Diego Perini
		assert(function( div ) {
			// Select is set to empty string on purpose
			// This is to test IE's treatment of not explictly
			// setting a boolean content attribute,
			// since its presence should be enough
			// http://bugs.jquery.com/ticket/12359
			div.innerHTML = "<select><option selected=''></option></select>";

			// IE8 - Some boolean attributes are not treated correctly
			if ( !div.querySelectorAll("[selected]").length ) {
				rbuggyQSA.push( "\\[" + whitespace + "*(?:checked|disabled|ismap|multiple|readonly|selected|value)" );
			}

			// Webkit/Opera - :checked should return selected option elements
			// http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
			// IE8 throws error here (do not put tests after this one)
			if ( !div.querySelectorAll(":checked").length ) {
				rbuggyQSA.push(":checked");
			}
		});

		assert(function( div ) {

			// Opera 10-12/IE9 - ^= $= *= and empty values
			// Should not select anything
			div.innerHTML = "<p test=''></p>";
			if ( div.querySelectorAll("[test^='']").length ) {
				rbuggyQSA.push( "[*^$]=" + whitespace + "*(?:\"\"|'')" );
			}

			// FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
			// IE8 throws error here (do not put tests after this one)
			div.innerHTML = "<input type='hidden'/>";
			if ( !div.querySelectorAll(":enabled").length ) {
				rbuggyQSA.push(":enabled", ":disabled");
			}
		});

		// rbuggyQSA always contains :focus, so no need for a length check
		rbuggyQSA = /* rbuggyQSA.length && */ new RegExp( rbuggyQSA.join("|") );

		select = function( selector, context, results, seed, xml ) {
			// Only use querySelectorAll when not filtering,
			// when this is not xml,
			// and when no QSA bugs apply
			if ( !seed && !xml && !rbuggyQSA.test( selector ) ) {
				var groups, i,
					old = true,
					nid = expando,
					newContext = context,
					newSelector = context.nodeType === 9 && selector;

				// qSA works strangely on Element-rooted queries
				// We can work around this by specifying an extra ID on the root
				// and working up from there (Thanks to Andrew Dupont for the technique)
				// IE 8 doesn't work on object elements
				if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
					groups = tokenize( selector );

					if ( (old = context.getAttribute("id")) ) {
						nid = old.replace( rescape, "\\$&" );
					} else {
						context.setAttribute( "id", nid );
					}
					nid = "[id='" + nid + "'] ";

					i = groups.length;
					while ( i-- ) {
						groups[i] = nid + groups[i].join("");
					}
					newContext = rsibling.test( selector ) && context.parentNode || context;
					newSelector = groups.join(",");
				}

				if ( newSelector ) {
					try {
						push.apply( results, slice.call( newContext.querySelectorAll(
							newSelector
						), 0 ) );
						return results;
					} catch(qsaError) {
					} finally {
						if ( !old ) {
							context.removeAttribute("id");
						}
					}
				}
			}

			return oldSelect( selector, context, results, seed, xml );
		};

		if ( matches ) {
			assert(function( div ) {
				// Check to see if it's possible to do matchesSelector
				// on a disconnected node (IE 9)
				disconnectedMatch = matches.call( div, "div" );

				// This should fail with an exception
				// Gecko does not error, returns false instead
				try {
					matches.call( div, "[test!='']:sizzle" );
					rbuggyMatches.push( "!=", pseudos );
				} catch ( e ) {}
			});

			// rbuggyMatches always contains :active and :focus, so no need for a length check
			rbuggyMatches = /* rbuggyMatches.length && */ new RegExp( rbuggyMatches.join("|") );

			Sizzle.matchesSelector = function( elem, expr ) {
				// Make sure that attribute selectors are quoted
				expr = expr.replace( rattributeQuotes, "='$1']" );

				// rbuggyMatches always contains :active, so no need for an existence check
				if ( !isXML( elem ) && !rbuggyMatches.test( expr ) && !rbuggyQSA.test( expr ) ) {
					try {
						var ret = matches.call( elem, expr );

						// IE 9's matchesSelector returns false on disconnected nodes
						if ( ret || disconnectedMatch ||
								// As well, disconnected nodes are said to be in a document
								// fragment in IE 9
								elem.document && elem.document.nodeType !== 11 ) {
							return ret;
						}
					} catch(e) {}
				}

				return Sizzle( expr, null, null, [ elem ] ).length > 0;
			};
		}
	})();
}

// Deprecated
Expr.pseudos["nth"] = Expr.pseudos["eq"];

// Back-compat
function setFilters() {}
Expr.filters = setFilters.prototype = Expr.pseudos;
Expr.setFilters = new setFilters();

// Override sizzle attribute retrieval
Sizzle.attr = jQuery.attr;
jQuery.find = Sizzle;
jQuery.expr = Sizzle.selectors;
jQuery.expr[":"] = jQuery.expr.pseudos;
jQuery.unique = Sizzle.uniqueSort;
jQuery.text = Sizzle.getText;
jQuery.isXMLDoc = Sizzle.isXML;
jQuery.contains = Sizzle.contains;


})( window );
var runtil = /Until$/,
	rparentsprev = /^(?:parents|prev(?:Until|All))/,
	isSimple = /^.[^:#\[\.,]*$/,
	rneedsContext = jQuery.expr.match.needsContext,
	// methods guaranteed to produce a unique set when starting from a unique set
	guaranteedUnique = {
		children: true,
		contents: true,
		next: true,
		prev: true
	};

jQuery.fn.extend({
	find: function( selector ) {
		var i, l, length, n, r, ret,
			self = this;

		if ( typeof selector !== "string" ) {
			return jQuery( selector ).filter(function() {
				for ( i = 0, l = self.length; i < l; i++ ) {
					if ( jQuery.contains( self[ i ], this ) ) {
						return true;
					}
				}
			});
		}

		ret = this.pushStack( "", "find", selector );

		for ( i = 0, l = this.length; i < l; i++ ) {
			length = ret.length;
			jQuery.find( selector, this[i], ret );

			if ( i > 0 ) {
				// Make sure that the results are unique
				for ( n = length; n < ret.length; n++ ) {
					for ( r = 0; r < length; r++ ) {
						if ( ret[r] === ret[n] ) {
							ret.splice(n--, 1);
							break;
						}
					}
				}
			}
		}

		return ret;
	},

	has: function( target ) {
		var i,
			targets = jQuery( target, this ),
			len = targets.length;

		return this.filter(function() {
			for ( i = 0; i < len; i++ ) {
				if ( jQuery.contains( this, targets[i] ) ) {
					return true;
				}
			}
		});
	},

	not: function( selector ) {
		return this.pushStack( winnow(this, selector, false), "not", selector);
	},

	filter: function( selector ) {
		return this.pushStack( winnow(this, selector, true), "filter", selector );
	},

	is: function( selector ) {
		return !!selector && (
			typeof selector === "string" ?
				// If this is a positional/relative selector, check membership in the returned set
				// so $("p:first").is("p:last") won't return true for a doc with two "p".
				rneedsContext.test( selector ) ?
					jQuery( selector, this.context ).index( this[0] ) >= 0 :
					jQuery.filter( selector, this ).length > 0 :
				this.filter( selector ).length > 0 );
	},

	closest: function( selectors, context ) {
		var cur,
			i = 0,
			l = this.length,
			ret = [],
			pos = rneedsContext.test( selectors ) || typeof selectors !== "string" ?
				jQuery( selectors, context || this.context ) :
				0;

		for ( ; i < l; i++ ) {
			cur = this[i];

			while ( cur && cur.ownerDocument && cur !== context && cur.nodeType !== 11 ) {
				if ( pos ? pos.index(cur) > -1 : jQuery.find.matchesSelector(cur, selectors) ) {
					ret.push( cur );
					break;
				}
				cur = cur.parentNode;
			}
		}

		ret = ret.length > 1 ? jQuery.unique( ret ) : ret;

		return this.pushStack( ret, "closest", selectors );
	},

	// Determine the position of an element within
	// the matched set of elements
	index: function( elem ) {

		// No argument, return index in parent
		if ( !elem ) {
			return ( this[0] && this[0].parentNode ) ? this.prevAll().length : -1;
		}

		// index in selector
		if ( typeof elem === "string" ) {
			return jQuery.inArray( this[0], jQuery( elem ) );
		}

		// Locate the position of the desired element
		return jQuery.inArray(
			// If it receives a jQuery object, the first element is used
			elem.jquery ? elem[0] : elem, this );
	},

	add: function( selector, context ) {
		var set = typeof selector === "string" ?
				jQuery( selector, context ) :
				jQuery.makeArray( selector && selector.nodeType ? [ selector ] : selector ),
			all = jQuery.merge( this.get(), set );

		return this.pushStack( isDisconnected( set[0] ) || isDisconnected( all[0] ) ?
			all :
			jQuery.unique( all ) );
	},

	addBack: function( selector ) {
		return this.add( selector == null ?
			this.prevObject : this.prevObject.filter(selector)
		);
	}
});

jQuery.fn.andSelf = jQuery.fn.addBack;

// A painfully simple check to see if an element is disconnected
// from a document (should be improved, where feasible).
function isDisconnected( node ) {
	return !node || !node.parentNode || node.parentNode.nodeType === 11;
}

function sibling( cur, dir ) {
	do {
		cur = cur[ dir ];
	} while ( cur && cur.nodeType !== 1 );

	return cur;
}

jQuery.each({
	parent: function( elem ) {
		var parent = elem.parentNode;
		return parent && parent.nodeType !== 11 ? parent : null;
	},
	parents: function( elem ) {
		return jQuery.dir( elem, "parentNode" );
	},
	parentsUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "parentNode", until );
	},
	next: function( elem ) {
		return sibling( elem, "nextSibling" );
	},
	prev: function( elem ) {
		return sibling( elem, "previousSibling" );
	},
	nextAll: function( elem ) {
		return jQuery.dir( elem, "nextSibling" );
	},
	prevAll: function( elem ) {
		return jQuery.dir( elem, "previousSibling" );
	},
	nextUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "nextSibling", until );
	},
	prevUntil: function( elem, i, until ) {
		return jQuery.dir( elem, "previousSibling", until );
	},
	siblings: function( elem ) {
		return jQuery.sibling( ( elem.parentNode || {} ).firstChild, elem );
	},
	children: function( elem ) {
		return jQuery.sibling( elem.firstChild );
	},
	contents: function( elem ) {
		return jQuery.nodeName( elem, "iframe" ) ?
			elem.contentDocument || elem.contentWindow.document :
			jQuery.merge( [], elem.childNodes );
	}
}, function( name, fn ) {
	jQuery.fn[ name ] = function( until, selector ) {
		var ret = jQuery.map( this, fn, until );

		if ( !runtil.test( name ) ) {
			selector = until;
		}

		if ( selector && typeof selector === "string" ) {
			ret = jQuery.filter( selector, ret );
		}

		ret = this.length > 1 && !guaranteedUnique[ name ] ? jQuery.unique( ret ) : ret;

		if ( this.length > 1 && rparentsprev.test( name ) ) {
			ret = ret.reverse();
		}

		return this.pushStack( ret, name, core_slice.call( arguments ).join(",") );
	};
});

jQuery.extend({
	filter: function( expr, elems, not ) {
		if ( not ) {
			expr = ":not(" + expr + ")";
		}

		return elems.length === 1 ?
			jQuery.find.matchesSelector(elems[0], expr) ? [ elems[0] ] : [] :
			jQuery.find.matches(expr, elems);
	},

	dir: function( elem, dir, until ) {
		var matched = [],
			cur = elem[ dir ];

		while ( cur && cur.nodeType !== 9 && (until === undefined || cur.nodeType !== 1 || !jQuery( cur ).is( until )) ) {
			if ( cur.nodeType === 1 ) {
				matched.push( cur );
			}
			cur = cur[dir];
		}
		return matched;
	},

	sibling: function( n, elem ) {
		var r = [];

		for ( ; n; n = n.nextSibling ) {
			if ( n.nodeType === 1 && n !== elem ) {
				r.push( n );
			}
		}

		return r;
	}
});

// Implement the identical functionality for filter and not
function winnow( elements, qualifier, keep ) {

	// Can't pass null or undefined to indexOf in Firefox 4
	// Set to 0 to skip string check
	qualifier = qualifier || 0;

	if ( jQuery.isFunction( qualifier ) ) {
		return jQuery.grep(elements, function( elem, i ) {
			var retVal = !!qualifier.call( elem, i, elem );
			return retVal === keep;
		});

	} else if ( qualifier.nodeType ) {
		return jQuery.grep(elements, function( elem, i ) {
			return ( elem === qualifier ) === keep;
		});

	} else if ( typeof qualifier === "string" ) {
		var filtered = jQuery.grep(elements, function( elem ) {
			return elem.nodeType === 1;
		});

		if ( isSimple.test( qualifier ) ) {
			return jQuery.filter(qualifier, filtered, !keep);
		} else {
			qualifier = jQuery.filter( qualifier, filtered );
		}
	}

	return jQuery.grep(elements, function( elem, i ) {
		return ( jQuery.inArray( elem, qualifier ) >= 0 ) === keep;
	});
}
function createSafeFragment( document ) {
	var list = nodeNames.split( "|" ),
	safeFrag = document.createDocumentFragment();

	if ( safeFrag.createElement ) {
		while ( list.length ) {
			safeFrag.createElement(
				list.pop()
			);
		}
	}
	return safeFrag;
}

var nodeNames = "abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|" +
		"header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",
	rinlinejQuery = / jQuery\d+="(?:null|\d+)"/g,
	rleadingWhitespace = /^\s+/,
	rxhtmlTag = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,
	rtagName = /<([\w:]+)/,
	rtbody = /<tbody/i,
	rhtml = /<|&#?\w+;/,
	rnoInnerhtml = /<(?:script|style|link)/i,
	rnocache = /<(?:script|object|embed|option|style)/i,
	rnoshimcache = new RegExp("<(?:" + nodeNames + ")[\\s/>]", "i"),
	rcheckableType = /^(?:checkbox|radio)$/,
	// checked="checked" or checked
	rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
	rscriptType = /\/(java|ecma)script/i,
	rcleanScript = /^\s*<!(?:\[CDATA\[|\-\-)|[\]\-]{2}>\s*$/g,
	wrapMap = {
		option: [ 1, "<select multiple='multiple'>", "</select>" ],
		legend: [ 1, "<fieldset>", "</fieldset>" ],
		thead: [ 1, "<table>", "</table>" ],
		tr: [ 2, "<table><tbody>", "</tbody></table>" ],
		td: [ 3, "<table><tbody><tr>", "</tr></tbody></table>" ],
		col: [ 2, "<table><tbody></tbody><colgroup>", "</colgroup></table>" ],
		area: [ 1, "<map>", "</map>" ],
		_default: [ 0, "", "" ]
	},
	safeFragment = createSafeFragment( document ),
	fragmentDiv = safeFragment.appendChild( document.createElement("div") );

wrapMap.optgroup = wrapMap.option;
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// IE6-8 can't serialize link, script, style, or any html5 (NoScope) tags,
// unless wrapped in a div with non-breaking characters in front of it.
if ( !jQuery.support.htmlSerialize ) {
	wrapMap._default = [ 1, "X<div>", "</div>" ];
}

jQuery.fn.extend({
	text: function( value ) {
		return jQuery.access( this, function( value ) {
			return value === undefined ?
				jQuery.text( this ) :
				this.empty().append( ( this[0] && this[0].ownerDocument || document ).createTextNode( value ) );
		}, null, value, arguments.length );
	},

	wrapAll: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapAll( html.call(this, i) );
			});
		}

		if ( this[0] ) {
			// The elements to wrap the target around
			var wrap = jQuery( html, this[0].ownerDocument ).eq(0).clone(true);

			if ( this[0].parentNode ) {
				wrap.insertBefore( this[0] );
			}

			wrap.map(function() {
				var elem = this;

				while ( elem.firstChild && elem.firstChild.nodeType === 1 ) {
					elem = elem.firstChild;
				}

				return elem;
			}).append( this );
		}

		return this;
	},

	wrapInner: function( html ) {
		if ( jQuery.isFunction( html ) ) {
			return this.each(function(i) {
				jQuery(this).wrapInner( html.call(this, i) );
			});
		}

		return this.each(function() {
			var self = jQuery( this ),
				contents = self.contents();

			if ( contents.length ) {
				contents.wrapAll( html );

			} else {
				self.append( html );
			}
		});
	},

	wrap: function( html ) {
		var isFunction = jQuery.isFunction( html );

		return this.each(function(i) {
			jQuery( this ).wrapAll( isFunction ? html.call(this, i) : html );
		});
	},

	unwrap: function() {
		return this.parent().each(function() {
			if ( !jQuery.nodeName( this, "body" ) ) {
				jQuery( this ).replaceWith( this.childNodes );
			}
		}).end();
	},

	append: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 ) {
				this.appendChild( elem );
			}
		});
	},

	prepend: function() {
		return this.domManip(arguments, true, function( elem ) {
			if ( this.nodeType === 1 || this.nodeType === 11 ) {
				this.insertBefore( elem, this.firstChild );
			}
		});
	},

	before: function() {
		if ( !isDisconnected( this[0] ) ) {
			return this.domManip(arguments, false, function( elem ) {
				this.parentNode.insertBefore( elem, this );
			});
		}

		if ( arguments.length ) {
			var set = jQuery.clean( arguments );
			return this.pushStack( jQuery.merge( set, this ), "before", this.selector );
		}
	},

	after: function() {
		if ( !isDisconnected( this[0] ) ) {
			return this.domManip(arguments, false, function( elem ) {
				this.parentNode.insertBefore( elem, this.nextSibling );
			});
		}

		if ( arguments.length ) {
			var set = jQuery.clean( arguments );
			return this.pushStack( jQuery.merge( this, set ), "after", this.selector );
		}
	},

	// keepData is for internal use only--do not document
	remove: function( selector, keepData ) {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			if ( !selector || jQuery.filter( selector, [ elem ] ).length ) {
				if ( !keepData && elem.nodeType === 1 ) {
					jQuery.cleanData( elem.getElementsByTagName("*") );
					jQuery.cleanData( [ elem ] );
				}

				if ( elem.parentNode ) {
					elem.parentNode.removeChild( elem );
				}
			}
		}

		return this;
	},

	empty: function() {
		var elem,
			i = 0;

		for ( ; (elem = this[i]) != null; i++ ) {
			// Remove element nodes and prevent memory leaks
			if ( elem.nodeType === 1 ) {
				jQuery.cleanData( elem.getElementsByTagName("*") );
			}

			// Remove any remaining nodes
			while ( elem.firstChild ) {
				elem.removeChild( elem.firstChild );
			}
		}

		return this;
	},

	clone: function( dataAndEvents, deepDataAndEvents ) {
		dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
		deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;

		return this.map( function () {
			return jQuery.clone( this, dataAndEvents, deepDataAndEvents );
		});
	},

	html: function( value ) {
		return jQuery.access( this, function( value ) {
			var elem = this[0] || {},
				i = 0,
				l = this.length;

			if ( value === undefined ) {
				return elem.nodeType === 1 ?
					elem.innerHTML.replace( rinlinejQuery, "" ) :
					undefined;
			}

			// See if we can take a shortcut and just use innerHTML
			if ( typeof value === "string" && !rnoInnerhtml.test( value ) &&
				( jQuery.support.htmlSerialize || !rnoshimcache.test( value )  ) &&
				( jQuery.support.leadingWhitespace || !rleadingWhitespace.test( value ) ) &&
				!wrapMap[ ( rtagName.exec( value ) || ["", ""] )[1].toLowerCase() ] ) {

				value = value.replace( rxhtmlTag, "<$1></$2>" );

				try {
					for (; i < l; i++ ) {
						// Remove element nodes and prevent memory leaks
						elem = this[i] || {};
						if ( elem.nodeType === 1 ) {
							jQuery.cleanData( elem.getElementsByTagName( "*" ) );
							elem.innerHTML = value;
						}
					}

					elem = 0;

				// If using innerHTML throws an exception, use the fallback method
				} catch(e) {}
			}

			if ( elem ) {
				this.empty().append( value );
			}
		}, null, value, arguments.length );
	},

	replaceWith: function( value ) {
		if ( !isDisconnected( this[0] ) ) {
			// Make sure that the elements are removed from the DOM before they are inserted
			// this can help fix replacing a parent with child elements
			if ( jQuery.isFunction( value ) ) {
				return this.each(function(i) {
					var self = jQuery(this), old = self.html();
					self.replaceWith( value.call( this, i, old ) );
				});
			}

			if ( typeof value !== "string" ) {
				value = jQuery( value ).detach();
			}

			return this.each(function() {
				var next = this.nextSibling,
					parent = this.parentNode;

				jQuery( this ).remove();

				if ( next ) {
					jQuery(next).before( value );
				} else {
					jQuery(parent).append( value );
				}
			});
		}

		return this.length ?
			this.pushStack( jQuery(jQuery.isFunction(value) ? value() : value), "replaceWith", value ) :
			this;
	},

	detach: function( selector ) {
		return this.remove( selector, true );
	},

	domManip: function( args, table, callback ) {

		// Flatten any nested arrays
		args = [].concat.apply( [], args );

		var results, first, fragment, iNoClone,
			i = 0,
			value = args[0],
			scripts = [],
			l = this.length;

		// We can't cloneNode fragments that contain checked, in WebKit
		if ( !jQuery.support.checkClone && l > 1 && typeof value === "string" && rchecked.test( value ) ) {
			return this.each(function() {
				jQuery(this).domManip( args, table, callback );
			});
		}

		if ( jQuery.isFunction(value) ) {
			return this.each(function(i) {
				var self = jQuery(this);
				args[0] = value.call( this, i, table ? self.html() : undefined );
				self.domManip( args, table, callback );
			});
		}

		if ( this[0] ) {
			results = jQuery.buildFragment( args, this, scripts );
			fragment = results.fragment;
			first = fragment.firstChild;

			if ( fragment.childNodes.length === 1 ) {
				fragment = first;
			}

			if ( first ) {
				table = table && jQuery.nodeName( first, "tr" );

				// Use the original fragment for the last item instead of the first because it can end up
				// being emptied incorrectly in certain situations (#8070).
				// Fragments from the fragment cache must always be cloned and never used in place.
				for ( iNoClone = results.cacheable || l - 1; i < l; i++ ) {
					callback.call(
						table && jQuery.nodeName( this[i], "table" ) ?
							findOrAppend( this[i], "tbody" ) :
							this[i],
						i === iNoClone ?
							fragment :
							jQuery.clone( fragment, true, true )
					);
				}
			}

			// Fix #11809: Avoid leaking memory
			fragment = first = null;

			if ( scripts.length ) {
				jQuery.each( scripts, function( i, elem ) {
					if ( elem.src ) {
						if ( jQuery.ajax ) {
							jQuery.ajax({
								url: elem.src,
								type: "GET",
								dataType: "script",
								async: false,
								global: false,
								"throws": true
							});
						} else {
							jQuery.error("no ajax");
						}
					} else {
						jQuery.globalEval( ( elem.text || elem.textContent || elem.innerHTML || "" ).replace( rcleanScript, "" ) );
					}

					if ( elem.parentNode ) {
						elem.parentNode.removeChild( elem );
					}
				});
			}
		}

		return this;
	}
});

function findOrAppend( elem, tag ) {
	return elem.getElementsByTagName( tag )[0] || elem.appendChild( elem.ownerDocument.createElement( tag ) );
}

function cloneCopyEvent( src, dest ) {

	if ( dest.nodeType !== 1 || !jQuery.hasData( src ) ) {
		return;
	}

	var type, i, l,
		oldData = jQuery._data( src ),
		curData = jQuery._data( dest, oldData ),
		events = oldData.events;

	if ( events ) {
		delete curData.handle;
		curData.events = {};

		for ( type in events ) {
			for ( i = 0, l = events[ type ].length; i < l; i++ ) {
				jQuery.event.add( dest, type, events[ type ][ i ] );
			}
		}
	}

	// make the cloned public data object a copy from the original
	if ( curData.data ) {
		curData.data = jQuery.extend( {}, curData.data );
	}
}

function cloneFixAttributes( src, dest ) {
	var nodeName;

	// We do not need to do anything for non-Elements
	if ( dest.nodeType !== 1 ) {
		return;
	}

	// clearAttributes removes the attributes, which we don't want,
	// but also removes the attachEvent events, which we *do* want
	if ( dest.clearAttributes ) {
		dest.clearAttributes();
	}

	// mergeAttributes, in contrast, only merges back on the
	// original attributes, not the events
	if ( dest.mergeAttributes ) {
		dest.mergeAttributes( src );
	}

	nodeName = dest.nodeName.toLowerCase();

	if ( nodeName === "object" ) {
		// IE6-10 improperly clones children of object elements using classid.
		// IE10 throws NoModificationAllowedError if parent is null, #12132.
		if ( dest.parentNode ) {
			dest.outerHTML = src.outerHTML;
		}

		// This path appears unavoidable for IE9. When cloning an object
		// element in IE9, the outerHTML strategy above is not sufficient.
		// If the src has innerHTML and the destination does not,
		// copy the src.innerHTML into the dest.innerHTML. #10324
		if ( jQuery.support.html5Clone && (src.innerHTML && !jQuery.trim(dest.innerHTML)) ) {
			dest.innerHTML = src.innerHTML;
		}

	} else if ( nodeName === "input" && rcheckableType.test( src.type ) ) {
		// IE6-8 fails to persist the checked state of a cloned checkbox
		// or radio button. Worse, IE6-7 fail to give the cloned element
		// a checked appearance if the defaultChecked value isn't also set

		dest.defaultChecked = dest.checked = src.checked;

		// IE6-7 get confused and end up setting the value of a cloned
		// checkbox/radio button to an empty string instead of "on"
		if ( dest.value !== src.value ) {
			dest.value = src.value;
		}

	// IE6-8 fails to return the selected option to the default selected
	// state when cloning options
	} else if ( nodeName === "option" ) {
		dest.selected = src.defaultSelected;

	// IE6-8 fails to set the defaultValue to the correct value when
	// cloning other types of input fields
	} else if ( nodeName === "input" || nodeName === "textarea" ) {
		dest.defaultValue = src.defaultValue;

	// IE blanks contents when cloning scripts
	} else if ( nodeName === "script" && dest.text !== src.text ) {
		dest.text = src.text;
	}

	// Event data gets referenced instead of copied if the expando
	// gets copied too
	dest.removeAttribute( jQuery.expando );
}

jQuery.buildFragment = function( args, context, scripts ) {
	var fragment, cacheable, cachehit,
		first = args[ 0 ];

	// Set context from what may come in as undefined or a jQuery collection or a node
	// Updated to fix #12266 where accessing context[0] could throw an exception in IE9/10 &
	// also doubles as fix for #8950 where plain objects caused createDocumentFragment exception
	context = context || document;
	context = !context.nodeType && context[0] || context;
	context = context.ownerDocument || context;

	// Only cache "small" (1/2 KB) HTML strings that are associated with the main document
	// Cloning options loses the selected state, so don't cache them
	// IE 6 doesn't like it when you put <object> or <embed> elements in a fragment
	// Also, WebKit does not clone 'checked' attributes on cloneNode, so don't cache
	// Lastly, IE6,7,8 will not correctly reuse cached fragments that were created from unknown elems #10501
	if ( args.length === 1 && typeof first === "string" && first.length < 512 && context === document &&
		first.charAt(0) === "<" && !rnocache.test( first ) &&
		(jQuery.support.checkClone || !rchecked.test( first )) &&
		(jQuery.support.html5Clone || !rnoshimcache.test( first )) ) {

		// Mark cacheable and look for a hit
		cacheable = true;
		fragment = jQuery.fragments[ first ];
		cachehit = fragment !== undefined;
	}

	if ( !fragment ) {
		fragment = context.createDocumentFragment();
		jQuery.clean( args, context, fragment, scripts );

		// Update the cache, but only store false
		// unless this is a second parsing of the same content
		if ( cacheable ) {
			jQuery.fragments[ first ] = cachehit && fragment;
		}
	}

	return { fragment: fragment, cacheable: cacheable };
};

jQuery.fragments = {};

jQuery.each({
	appendTo: "append",
	prependTo: "prepend",
	insertBefore: "before",
	insertAfter: "after",
	replaceAll: "replaceWith"
}, function( name, original ) {
	jQuery.fn[ name ] = function( selector ) {
		var elems,
			i = 0,
			ret = [],
			insert = jQuery( selector ),
			l = insert.length,
			parent = this.length === 1 && this[0].parentNode;

		if ( (parent == null || parent && parent.nodeType === 11 && parent.childNodes.length === 1) && l === 1 ) {
			insert[ original ]( this[0] );
			return this;
		} else {
			for ( ; i < l; i++ ) {
				elems = ( i > 0 ? this.clone(true) : this ).get();
				jQuery( insert[i] )[ original ]( elems );
				ret = ret.concat( elems );
			}

			return this.pushStack( ret, name, insert.selector );
		}
	};
});

function getAll( elem ) {
	if ( typeof elem.getElementsByTagName !== "undefined" ) {
		return elem.getElementsByTagName( "*" );

	} else if ( typeof elem.querySelectorAll !== "undefined" ) {
		return elem.querySelectorAll( "*" );

	} else {
		return [];
	}
}

// Used in clean, fixes the defaultChecked property
function fixDefaultChecked( elem ) {
	if ( rcheckableType.test( elem.type ) ) {
		elem.defaultChecked = elem.checked;
	}
}

jQuery.extend({
	clone: function( elem, dataAndEvents, deepDataAndEvents ) {
		var srcElements,
			destElements,
			i,
			clone;

		if ( jQuery.support.html5Clone || jQuery.isXMLDoc(elem) || !rnoshimcache.test( "<" + elem.nodeName + ">" ) ) {
			clone = elem.cloneNode( true );

		// IE<=8 does not properly clone detached, unknown element nodes
		} else {
			fragmentDiv.innerHTML = elem.outerHTML;
			fragmentDiv.removeChild( clone = fragmentDiv.firstChild );
		}

		if ( (!jQuery.support.noCloneEvent || !jQuery.support.noCloneChecked) &&
				(elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem) ) {
			// IE copies events bound via attachEvent when using cloneNode.
			// Calling detachEvent on the clone will also remove the events
			// from the original. In order to get around this, we use some
			// proprietary methods to clear the events. Thanks to MooTools
			// guys for this hotness.

			cloneFixAttributes( elem, clone );

			// Using Sizzle here is crazy slow, so we use getElementsByTagName instead
			srcElements = getAll( elem );
			destElements = getAll( clone );

			// Weird iteration because IE will replace the length property
			// with an element if you are cloning the body and one of the
			// elements on the page has a name or id of "length"
			for ( i = 0; srcElements[i]; ++i ) {
				// Ensure that the destination node is not null; Fixes #9587
				if ( destElements[i] ) {
					cloneFixAttributes( srcElements[i], destElements[i] );
				}
			}
		}

		// Copy the events from the original to the clone
		if ( dataAndEvents ) {
			cloneCopyEvent( elem, clone );

			if ( deepDataAndEvents ) {
				srcElements = getAll( elem );
				destElements = getAll( clone );

				for ( i = 0; srcElements[i]; ++i ) {
					cloneCopyEvent( srcElements[i], destElements[i] );
				}
			}
		}

		srcElements = destElements = null;

		// Return the cloned set
		return clone;
	},

	clean: function( elems, context, fragment, scripts ) {
		var i, j, elem, tag, wrap, depth, div, hasBody, tbody, len, handleScript, jsTags,
			safe = context === document && safeFragment,
			ret = [];

		// Ensure that context is a document
		if ( !context || typeof context.createDocumentFragment === "undefined" ) {
			context = document;
		}

		// Use the already-created safe fragment if context permits
		for ( i = 0; (elem = elems[i]) != null; i++ ) {
			if ( typeof elem === "number" ) {
				elem += "";
			}

			if ( !elem ) {
				continue;
			}

			// Convert html string into DOM nodes
			if ( typeof elem === "string" ) {
				if ( !rhtml.test( elem ) ) {
					elem = context.createTextNode( elem );
				} else {
					// Ensure a safe container in which to render the html
					safe = safe || createSafeFragment( context );
					div = context.createElement("div");
					safe.appendChild( div );

					// Fix "XHTML"-style tags in all browsers
					elem = elem.replace(rxhtmlTag, "<$1></$2>");

					// Go to html and back, then peel off extra wrappers
					tag = ( rtagName.exec( elem ) || ["", ""] )[1].toLowerCase();
					wrap = wrapMap[ tag ] || wrapMap._default;
					depth = wrap[0];
					div.innerHTML = wrap[1] + elem + wrap[2];

					// Move to the right depth
					while ( depth-- ) {
						div = div.lastChild;
					}

					// Remove IE's autoinserted <tbody> from table fragments
					if ( !jQuery.support.tbody ) {

						// String was a <table>, *may* have spurious <tbody>
						hasBody = rtbody.test(elem);
							tbody = tag === "table" && !hasBody ?
								div.firstChild && div.firstChild.childNodes :

								// String was a bare <thead> or <tfoot>
								wrap[1] === "<table>" && !hasBody ?
									div.childNodes :
									[];

						for ( j = tbody.length - 1; j >= 0 ; --j ) {
							if ( jQuery.nodeName( tbody[ j ], "tbody" ) && !tbody[ j ].childNodes.length ) {
								tbody[ j ].parentNode.removeChild( tbody[ j ] );
							}
						}
					}

					// IE completely kills leading whitespace when innerHTML is used
					if ( !jQuery.support.leadingWhitespace && rleadingWhitespace.test( elem ) ) {
						div.insertBefore( context.createTextNode( rleadingWhitespace.exec(elem)[0] ), div.firstChild );
					}

					elem = div.childNodes;

					// Take out of fragment container (we need a fresh div each time)
					div.parentNode.removeChild( div );
				}
			}

			if ( elem.nodeType ) {
				ret.push( elem );
			} else {
				jQuery.merge( ret, elem );
			}
		}

		// Fix #11356: Clear elements from safeFragment
		if ( div ) {
			elem = div = safe = null;
		}

		// Reset defaultChecked for any radios and checkboxes
		// about to be appended to the DOM in IE 6/7 (#8060)
		if ( !jQuery.support.appendChecked ) {
			for ( i = 0; (elem = ret[i]) != null; i++ ) {
				if ( jQuery.nodeName( elem, "input" ) ) {
					fixDefaultChecked( elem );
				} else if ( typeof elem.getElementsByTagName !== "undefined" ) {
					jQuery.grep( elem.getElementsByTagName("input"), fixDefaultChecked );
				}
			}
		}

		// Append elements to a provided document fragment
		if ( fragment ) {
			// Special handling of each script element
			handleScript = function( elem ) {
				// Check if we consider it executable
				if ( !elem.type || rscriptType.test( elem.type ) ) {
					// Detach the script and store it in the scripts array (if provided) or the fragment
					// Return truthy to indicate that it has been handled
					return scripts ?
						scripts.push( elem.parentNode ? elem.parentNode.removeChild( elem ) : elem ) :
						fragment.appendChild( elem );
				}
			};

			for ( i = 0; (elem = ret[i]) != null; i++ ) {
				// Check if we're done after handling an executable script
				if ( !( jQuery.nodeName( elem, "script" ) && handleScript( elem ) ) ) {
					// Append to fragment and handle embedded scripts
					fragment.appendChild( elem );
					if ( typeof elem.getElementsByTagName !== "undefined" ) {
						// handleScript alters the DOM, so use jQuery.merge to ensure snapshot iteration
						jsTags = jQuery.grep( jQuery.merge( [], elem.getElementsByTagName("script") ), handleScript );

						// Splice the scripts into ret after their former ancestor and advance our index beyond them
						ret.splice.apply( ret, [i + 1, 0].concat( jsTags ) );
						i += jsTags.length;
					}
				}
			}
		}

		return ret;
	},

	cleanData: function( elems, /* internal */ acceptData ) {
		var data, id, elem, type,
			i = 0,
			internalKey = jQuery.expando,
			cache = jQuery.cache,
			deleteExpando = jQuery.support.deleteExpando,
			special = jQuery.event.special;

		for ( ; (elem = elems[i]) != null; i++ ) {

			if ( acceptData || jQuery.acceptData( elem ) ) {

				id = elem[ internalKey ];
				data = id && cache[ id ];

				if ( data ) {
					if ( data.events ) {
						for ( type in data.events ) {
							if ( special[ type ] ) {
								jQuery.event.remove( elem, type );

							// This is a shortcut to avoid jQuery.event.remove's overhead
							} else {
								jQuery.removeEvent( elem, type, data.handle );
							}
						}
					}

					// Remove cache only if it was not already removed by jQuery.event.remove
					if ( cache[ id ] ) {

						delete cache[ id ];

						// IE does not allow us to delete expando properties from nodes,
						// nor does it have a removeAttribute function on Document nodes;
						// we must handle all of these cases
						if ( deleteExpando ) {
							delete elem[ internalKey ];

						} else if ( elem.removeAttribute ) {
							elem.removeAttribute( internalKey );

						} else {
							elem[ internalKey ] = null;
						}

						jQuery.deletedIds.push( id );
					}
				}
			}
		}
	}
});
// Limit scope pollution from any deprecated API
(function() {

var matched, browser;

// Use of jQuery.browser is frowned upon.
// More details: http://api.jquery.com/jQuery.browser
// jQuery.uaMatch maintained for back-compat
jQuery.uaMatch = function( ua ) {
	ua = ua.toLowerCase();

	var match = /(chrome)[ \/]([\w.]+)/.exec( ua ) ||
		/(webkit)[ \/]([\w.]+)/.exec( ua ) ||
		/(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) ||
		/(msie) ([\w.]+)/.exec( ua ) ||
		ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) ||
		[];

	return {
		browser: match[ 1 ] || "",
		version: match[ 2 ] || "0"
	};
};

matched = jQuery.uaMatch( navigator.userAgent );
browser = {};

if ( matched.browser ) {
	browser[ matched.browser ] = true;
	browser.version = matched.version;
}

// Chrome is Webkit, but Webkit is also Safari.
if ( browser.chrome ) {
	browser.webkit = true;
} else if ( browser.webkit ) {
	browser.safari = true;
}

jQuery.browser = browser;

jQuery.sub = function() {
	function jQuerySub( selector, context ) {
		return new jQuerySub.fn.init( selector, context );
	}
	jQuery.extend( true, jQuerySub, this );
	jQuerySub.superclass = this;
	jQuerySub.fn = jQuerySub.prototype = this();
	jQuerySub.fn.constructor = jQuerySub;
	jQuerySub.sub = this.sub;
	jQuerySub.fn.init = function init( selector, context ) {
		if ( context && context instanceof jQuery && !(context instanceof jQuerySub) ) {
			context = jQuerySub( context );
		}

		return jQuery.fn.init.call( this, selector, context, rootjQuerySub );
	};
	jQuerySub.fn.init.prototype = jQuerySub.fn;
	var rootjQuerySub = jQuerySub(document);
	return jQuerySub;
};

})();
var curCSS, iframe, iframeDoc,
	ralpha = /alpha\([^)]*\)/i,
	ropacity = /opacity=([^)]*)/,
	rposition = /^(top|right|bottom|left)$/,
	// swappable if display is none or starts with table except "table", "table-cell", or "table-caption"
	// see here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
	rdisplayswap = /^(none|table(?!-c[ea]).+)/,
	rmargin = /^margin/,
	rnumsplit = new RegExp( "^(" + core_pnum + ")(.*)$", "i" ),
	rnumnonpx = new RegExp( "^(" + core_pnum + ")(?!px)[a-z%]+$", "i" ),
	rrelNum = new RegExp( "^([-+])=(" + core_pnum + ")", "i" ),
	elemdisplay = { BODY: "block" },

	cssShow = { position: "absolute", visibility: "hidden", display: "block" },
	cssNormalTransform = {
		letterSpacing: 0,
		fontWeight: 400
	},

	cssExpand = [ "Top", "Right", "Bottom", "Left" ],
	cssPrefixes = [ "Webkit", "O", "Moz", "ms" ],

	eventsToggle = jQuery.fn.toggle;

// return a css property mapped to a potentially vendor prefixed property
function vendorPropName( style, name ) {

	// shortcut for names that are not vendor prefixed
	if ( name in style ) {
		return name;
	}

	// check for vendor prefixed names
	var capName = name.charAt(0).toUpperCase() + name.slice(1),
		origName = name,
		i = cssPrefixes.length;

	while ( i-- ) {
		name = cssPrefixes[ i ] + capName;
		if ( name in style ) {
			return name;
		}
	}

	return origName;
}

function isHidden( elem, el ) {
	elem = el || elem;
	return jQuery.css( elem, "display" ) === "none" || !jQuery.contains( elem.ownerDocument, elem );
}

function showHide( elements, show ) {
	var elem, display,
		values = [],
		index = 0,
		length = elements.length;

	for ( ; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		values[ index ] = jQuery._data( elem, "olddisplay" );
		if ( show ) {
			// Reset the inline display of this element to learn if it is
			// being hidden by cascaded rules or not
			if ( !values[ index ] && elem.style.display === "none" ) {
				elem.style.display = "";
			}

			// Set elements which have been overridden with display: none
			// in a stylesheet to whatever the default browser style is
			// for such an element
			if ( elem.style.display === "" && isHidden( elem ) ) {
				values[ index ] = jQuery._data( elem, "olddisplay", css_defaultDisplay(elem.nodeName) );
			}
		} else {
			display = curCSS( elem, "display" );

			if ( !values[ index ] && display !== "none" ) {
				jQuery._data( elem, "olddisplay", display );
			}
		}
	}

	// Set the display of most of the elements in a second loop
	// to avoid the constant reflow
	for ( index = 0; index < length; index++ ) {
		elem = elements[ index ];
		if ( !elem.style ) {
			continue;
		}
		if ( !show || elem.style.display === "none" || elem.style.display === "" ) {
			elem.style.display = show ? values[ index ] || "" : "none";
		}
	}

	return elements;
}

jQuery.fn.extend({
	css: function( name, value ) {
		return jQuery.access( this, function( elem, name, value ) {
			return value !== undefined ?
				jQuery.style( elem, name, value ) :
				jQuery.css( elem, name );
		}, name, value, arguments.length > 1 );
	},
	show: function() {
		return showHide( this, true );
	},
	hide: function() {
		return showHide( this );
	},
	toggle: function( state, fn2 ) {
		var bool = typeof state === "boolean";

		if ( jQuery.isFunction( state ) && jQuery.isFunction( fn2 ) ) {
			return eventsToggle.apply( this, arguments );
		}

		return this.each(function() {
			if ( bool ? state : isHidden( this ) ) {
				jQuery( this ).show();
			} else {
				jQuery( this ).hide();
			}
		});
	}
});

jQuery.extend({
	// Add in style property hooks for overriding the default
	// behavior of getting and setting a style property
	cssHooks: {
		opacity: {
			get: function( elem, computed ) {
				if ( computed ) {
					// We should always get a number back from opacity
					var ret = curCSS( elem, "opacity" );
					return ret === "" ? "1" : ret;

				}
			}
		}
	},

	// Exclude the following css properties to add px
	cssNumber: {
		"fillOpacity": true,
		"fontWeight": true,
		"lineHeight": true,
		"opacity": true,
		"orphans": true,
		"widows": true,
		"zIndex": true,
		"zoom": true
	},

	// Add in properties whose names you wish to fix before
	// setting or getting the value
	cssProps: {
		// normalize float css property
		"float": jQuery.support.cssFloat ? "cssFloat" : "styleFloat"
	},

	// Get and set the style property on a DOM Node
	style: function( elem, name, value, extra ) {
		// Don't set styles on text and comment nodes
		if ( !elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style ) {
			return;
		}

		// Make sure that we're working with the right name
		var ret, type, hooks,
			origName = jQuery.camelCase( name ),
			style = elem.style;

		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// Check if we're setting a value
		if ( value !== undefined ) {
			type = typeof value;

			// convert relative number strings (+= or -=) to relative numbers. #7345
			if ( type === "string" && (ret = rrelNum.exec( value )) ) {
				value = ( ret[1] + 1 ) * ret[2] + parseFloat( jQuery.css( elem, name ) );
				// Fixes bug #9237
				type = "number";
			}

			// Make sure that NaN and null values aren't set. See: #7116
			if ( value == null || type === "number" && isNaN( value ) ) {
				return;
			}

			// If a number was passed in, add 'px' to the (except for certain CSS properties)
			if ( type === "number" && !jQuery.cssNumber[ origName ] ) {
				value += "px";
			}

			// If a hook was provided, use that value, otherwise just set the specified value
			if ( !hooks || !("set" in hooks) || (value = hooks.set( elem, value, extra )) !== undefined ) {
				// Wrapped to prevent IE from throwing errors when 'invalid' values are provided
				// Fixes bug #5509
				try {
					style[ name ] = value;
				} catch(e) {}
			}

		} else {
			// If a hook was provided get the non-computed value from there
			if ( hooks && "get" in hooks && (ret = hooks.get( elem, false, extra )) !== undefined ) {
				return ret;
			}

			// Otherwise just get the value from the style object
			return style[ name ];
		}
	},

	css: function( elem, name, numeric, extra ) {
		var val, num, hooks,
			origName = jQuery.camelCase( name );

		// Make sure that we're working with the right name
		name = jQuery.cssProps[ origName ] || ( jQuery.cssProps[ origName ] = vendorPropName( elem.style, origName ) );

		// gets hook for the prefixed version
		// followed by the unprefixed version
		hooks = jQuery.cssHooks[ name ] || jQuery.cssHooks[ origName ];

		// If a hook was provided get the computed value from there
		if ( hooks && "get" in hooks ) {
			val = hooks.get( elem, true, extra );
		}

		// Otherwise, if a way to get the computed value exists, use that
		if ( val === undefined ) {
			val = curCSS( elem, name );
		}

		//convert "normal" to computed value
		if ( val === "normal" && name in cssNormalTransform ) {
			val = cssNormalTransform[ name ];
		}

		// Return, converting to number if forced or a qualifier was provided and val looks numeric
		if ( numeric || extra !== undefined ) {
			num = parseFloat( val );
			return numeric || jQuery.isNumeric( num ) ? num || 0 : val;
		}
		return val;
	},

	// A method for quickly swapping in/out CSS properties to get correct calculations
	swap: function( elem, options, callback ) {
		var ret, name,
			old = {};

		// Remember the old values, and insert the new ones
		for ( name in options ) {
			old[ name ] = elem.style[ name ];
			elem.style[ name ] = options[ name ];
		}

		ret = callback.call( elem );

		// Revert the old values
		for ( name in options ) {
			elem.style[ name ] = old[ name ];
		}

		return ret;
	}
});

// NOTE: To any future maintainer, we've window.getComputedStyle
// because jsdom on node.js will break without it.
if ( window.getComputedStyle ) {
	curCSS = function( elem, name ) {
		var ret, width, minWidth, maxWidth,
			computed = window.getComputedStyle( elem, null ),
			style = elem.style;

		if ( computed ) {

			// getPropertyValue is only needed for .css('filter') in IE9, see #12537
			ret = computed.getPropertyValue( name ) || computed[ name ];

			if ( ret === "" && !jQuery.contains( elem.ownerDocument, elem ) ) {
				ret = jQuery.style( elem, name );
			}

			// A tribute to the "awesome hack by Dean Edwards"
			// Chrome < 17 and Safari 5.0 uses "computed value" instead of "used value" for margin-right
			// Safari 5.1.7 (at least) returns percentage for a larger set of values, but width seems to be reliably pixels
			// this is against the CSSOM draft spec: http://dev.w3.org/csswg/cssom/#resolved-values
			if ( rnumnonpx.test( ret ) && rmargin.test( name ) ) {
				width = style.width;
				minWidth = style.minWidth;
				maxWidth = style.maxWidth;

				style.minWidth = style.maxWidth = style.width = ret;
				ret = computed.width;

				style.width = width;
				style.minWidth = minWidth;
				style.maxWidth = maxWidth;
			}
		}

		return ret;
	};
} else if ( document.documentElement.currentStyle ) {
	curCSS = function( elem, name ) {
		var left, rsLeft,
			ret = elem.currentStyle && elem.currentStyle[ name ],
			style = elem.style;

		// Avoid setting ret to empty string here
		// so we don't default to auto
		if ( ret == null && style && style[ name ] ) {
			ret = style[ name ];
		}

		// From the awesome hack by Dean Edwards
		// http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

		// If we're not dealing with a regular pixel number
		// but a number that has a weird ending, we need to convert it to pixels
		// but not position css attributes, as those are proportional to the parent element instead
		// and we can't measure the parent instead because it might trigger a "stacking dolls" problem
		if ( rnumnonpx.test( ret ) && !rposition.test( name ) ) {

			// Remember the original values
			left = style.left;
			rsLeft = elem.runtimeStyle && elem.runtimeStyle.left;

			// Put in the new values to get a computed value out
			if ( rsLeft ) {
				elem.runtimeStyle.left = elem.currentStyle.left;
			}
			style.left = name === "fontSize" ? "1em" : ret;
			ret = style.pixelLeft + "px";

			// Revert the changed values
			style.left = left;
			if ( rsLeft ) {
				elem.runtimeStyle.left = rsLeft;
			}
		}

		return ret === "" ? "auto" : ret;
	};
}

function setPositiveNumber( elem, value, subtract ) {
	var matches = rnumsplit.exec( value );
	return matches ?
			Math.max( 0, matches[ 1 ] - ( subtract || 0 ) ) + ( matches[ 2 ] || "px" ) :
			value;
}

function augmentWidthOrHeight( elem, name, extra, isBorderBox ) {
	var i = extra === ( isBorderBox ? "border" : "content" ) ?
		// If we already have the right measurement, avoid augmentation
		4 :
		// Otherwise initialize for horizontal or vertical properties
		name === "width" ? 1 : 0,

		val = 0;

	for ( ; i < 4; i += 2 ) {
		// both box models exclude margin, so add it if we want it
		if ( extra === "margin" ) {
			// we use jQuery.css instead of curCSS here
			// because of the reliableMarginRight CSS hook!
			val += jQuery.css( elem, extra + cssExpand[ i ], true );
		}

		// From this point on we use curCSS for maximum performance (relevant in animations)
		if ( isBorderBox ) {
			// border-box includes padding, so remove it if we want content
			if ( extra === "content" ) {
				val -= parseFloat( curCSS( elem, "padding" + cssExpand[ i ] ) ) || 0;
			}

			// at this point, extra isn't border nor margin, so remove border
			if ( extra !== "margin" ) {
				val -= parseFloat( curCSS( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
			}
		} else {
			// at this point, extra isn't content, so add padding
			val += parseFloat( curCSS( elem, "padding" + cssExpand[ i ] ) ) || 0;

			// at this point, extra isn't content nor padding, so add border
			if ( extra !== "padding" ) {
				val += parseFloat( curCSS( elem, "border" + cssExpand[ i ] + "Width" ) ) || 0;
			}
		}
	}

	return val;
}

function getWidthOrHeight( elem, name, extra ) {

	// Start with offset property, which is equivalent to the border-box value
	var val = name === "width" ? elem.offsetWidth : elem.offsetHeight,
		valueIsBorderBox = true,
		isBorderBox = jQuery.support.boxSizing && jQuery.css( elem, "boxSizing" ) === "border-box";

	// some non-html elements return undefined for offsetWidth, so check for null/undefined
	// svg - https://bugzilla.mozilla.org/show_bug.cgi?id=649285
	// MathML - https://bugzilla.mozilla.org/show_bug.cgi?id=491668
	if ( val <= 0 || val == null ) {
		// Fall back to computed then uncomputed css if necessary
		val = curCSS( elem, name );
		if ( val < 0 || val == null ) {
			val = elem.style[ name ];
		}

		// Computed unit is not pixels. Stop here and return.
		if ( rnumnonpx.test(val) ) {
			return val;
		}

		// we need the check for style in case a browser which returns unreliable values
		// for getComputedStyle silently falls back to the reliable elem.style
		valueIsBorderBox = isBorderBox && ( jQuery.support.boxSizingReliable || val === elem.style[ name ] );

		// Normalize "", auto, and prepare for extra
		val = parseFloat( val ) || 0;
	}

	// use the active box-sizing model to add/subtract irrelevant styles
	return ( val +
		augmentWidthOrHeight(
			elem,
			name,
			extra || ( isBorderBox ? "border" : "content" ),
			valueIsBorderBox
		)
	) + "px";
}


// Try to determine the default display value of an element
function css_defaultDisplay( nodeName ) {
	if ( elemdisplay[ nodeName ] ) {
		return elemdisplay[ nodeName ];
	}

	var elem = jQuery( "<" + nodeName + ">" ).appendTo( document.body ),
		display = elem.css("display");
	elem.remove();

	// If the simple way fails,
	// get element's real default display by attaching it to a temp iframe
	if ( display === "none" || display === "" ) {
		// Use the already-created iframe if possible
		iframe = document.body.appendChild(
			iframe || jQuery.extend( document.createElement("iframe"), {
				frameBorder: 0,
				width: 0,
				height: 0
			})
		);

		// Create a cacheable copy of the iframe document on first call.
		// IE and Opera will allow us to reuse the iframeDoc without re-writing the fake HTML
		// document to it; WebKit & Firefox won't allow reusing the iframe document.
		if ( !iframeDoc || !iframe.createElement ) {
			iframeDoc = ( iframe.contentWindow || iframe.contentDocument ).document;
			iframeDoc.write("<!doctype html><html><body>");
			iframeDoc.close();
		}

		elem = iframeDoc.body.appendChild( iframeDoc.createElement(nodeName) );

		display = curCSS( elem, "display" );
		document.body.removeChild( iframe );
	}

	// Store the correct default display
	elemdisplay[ nodeName ] = display;

	return display;
}

jQuery.each([ "height", "width" ], function( i, name ) {
	jQuery.cssHooks[ name ] = {
		get: function( elem, computed, extra ) {
			if ( computed ) {
				// certain elements can have dimension info if we invisibly show them
				// however, it must have a current display style that would benefit from this
				if ( elem.offsetWidth === 0 && rdisplayswap.test( curCSS( elem, "display" ) ) ) {
					return jQuery.swap( elem, cssShow, function() {
						return getWidthOrHeight( elem, name, extra );
					});
				} else {
					return getWidthOrHeight( elem, name, extra );
				}
			}
		},

		set: function( elem, value, extra ) {
			return setPositiveNumber( elem, value, extra ?
				augmentWidthOrHeight(
					elem,
					name,
					extra,
					jQuery.support.boxSizing && jQuery.css( elem, "boxSizing" ) === "border-box"
				) : 0
			);
		}
	};
});

if ( !jQuery.support.opacity ) {
	jQuery.cssHooks.opacity = {
		get: function( elem, computed ) {
			// IE uses filters for opacity
			return ropacity.test( (computed && elem.currentStyle ? elem.currentStyle.filter : elem.style.filter) || "" ) ?
				( 0.01 * parseFloat( RegExp.$1 ) ) + "" :
				computed ? "1" : "";
		},

		set: function( elem, value ) {
			var style = elem.style,
				currentStyle = elem.currentStyle,
				opacity = jQuery.isNumeric( value ) ? "alpha(opacity=" + value * 100 + ")" : "",
				filter = currentStyle && currentStyle.filter || style.filter || "";

			// IE has trouble with opacity if it does not have layout
			// Force it by setting the zoom level
			style.zoom = 1;

			// if setting opacity to 1, and no other filters exist - attempt to remove filter attribute #6652
			if ( value >= 1 && jQuery.trim( filter.replace( ralpha, "" ) ) === "" &&
				style.removeAttribute ) {

				// Setting style.filter to null, "" & " " still leave "filter:" in the cssText
				// if "filter:" is present at all, clearType is disabled, we want to avoid this
				// style.removeAttribute is IE Only, but so apparently is this code path...
				style.removeAttribute( "filter" );

				// if there there is no filter style applied in a css rule, we are done
				if ( currentStyle && !currentStyle.filter ) {
					return;
				}
			}

			// otherwise, set new filter values
			style.filter = ralpha.test( filter ) ?
				filter.replace( ralpha, opacity ) :
				filter + " " + opacity;
		}
	};
}

// These hooks cannot be added until DOM ready because the support test
// for it is not run until after DOM ready
jQuery(function() {
	if ( !jQuery.support.reliableMarginRight ) {
		jQuery.cssHooks.marginRight = {
			get: function( elem, computed ) {
				// WebKit Bug 13343 - getComputedStyle returns wrong value for margin-right
				// Work around by temporarily setting element display to inline-block
				return jQuery.swap( elem, { "display": "inline-block" }, function() {
					if ( computed ) {
						return curCSS( elem, "marginRight" );
					}
				});
			}
		};
	}

	// Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
	// getComputedStyle returns percent when specified for top/left/bottom/right
	// rather than make the css module depend on the offset module, we just check for it here
	if ( !jQuery.support.pixelPosition && jQuery.fn.position ) {
		jQuery.each( [ "top", "left" ], function( i, prop ) {
			jQuery.cssHooks[ prop ] = {
				get: function( elem, computed ) {
					if ( computed ) {
						var ret = curCSS( elem, prop );
						// if curCSS returns percentage, fallback to offset
						return rnumnonpx.test( ret ) ? jQuery( elem ).position()[ prop ] + "px" : ret;
					}
				}
			};
		});
	}

});

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.hidden = function( elem ) {
		return ( elem.offsetWidth === 0 && elem.offsetHeight === 0 ) || (!jQuery.support.reliableHiddenOffsets && ((elem.style && elem.style.display) || curCSS( elem, "display" )) === "none");
	};

	jQuery.expr.filters.visible = function( elem ) {
		return !jQuery.expr.filters.hidden( elem );
	};
}

// These hooks are used by animate to expand properties
jQuery.each({
	margin: "",
	padding: "",
	border: "Width"
}, function( prefix, suffix ) {
	jQuery.cssHooks[ prefix + suffix ] = {
		expand: function( value ) {
			var i,

				// assumes a single number if not a string
				parts = typeof value === "string" ? value.split(" ") : [ value ],
				expanded = {};

			for ( i = 0; i < 4; i++ ) {
				expanded[ prefix + cssExpand[ i ] + suffix ] =
					parts[ i ] || parts[ i - 2 ] || parts[ 0 ];
			}

			return expanded;
		}
	};

	if ( !rmargin.test( prefix ) ) {
		jQuery.cssHooks[ prefix + suffix ].set = setPositiveNumber;
	}
});
var r20 = /%20/g,
	rbracket = /\[\]$/,
	rCRLF = /\r?\n/g,
	rinput = /^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,
	rselectTextarea = /^(?:select|textarea)/i;

jQuery.fn.extend({
	serialize: function() {
		return jQuery.param( this.serializeArray() );
	},
	serializeArray: function() {
		return this.map(function(){
			return this.elements ? jQuery.makeArray( this.elements ) : this;
		})
		.filter(function(){
			return this.name && !this.disabled &&
				( this.checked || rselectTextarea.test( this.nodeName ) ||
					rinput.test( this.type ) );
		})
		.map(function( i, elem ){
			var val = jQuery( this ).val();

			return val == null ?
				null :
				jQuery.isArray( val ) ?
					jQuery.map( val, function( val, i ){
						return { name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
					}) :
					{ name: elem.name, value: val.replace( rCRLF, "\r\n" ) };
		}).get();
	}
});

//Serialize an array of form elements or a set of
//key/values into a query string
jQuery.param = function( a, traditional ) {
	var prefix,
		s = [],
		add = function( key, value ) {
			// If value is a function, invoke it and return its value
			value = jQuery.isFunction( value ) ? value() : ( value == null ? "" : value );
			s[ s.length ] = encodeURIComponent( key ) + "=" + encodeURIComponent( value );
		};

	// Set traditional to true for jQuery <= 1.3.2 behavior.
	if ( traditional === undefined ) {
		traditional = jQuery.ajaxSettings && jQuery.ajaxSettings.traditional;
	}

	// If an array was passed in, assume that it is an array of form elements.
	if ( jQuery.isArray( a ) || ( a.jquery && !jQuery.isPlainObject( a ) ) ) {
		// Serialize the form elements
		jQuery.each( a, function() {
			add( this.name, this.value );
		});

	} else {
		// If traditional, encode the "old" way (the way 1.3.2 or older
		// did it), otherwise encode params recursively.
		for ( prefix in a ) {
			buildParams( prefix, a[ prefix ], traditional, add );
		}
	}

	// Return the resulting serialization
	return s.join( "&" ).replace( r20, "+" );
};

function buildParams( prefix, obj, traditional, add ) {
	var name;

	if ( jQuery.isArray( obj ) ) {
		// Serialize array item.
		jQuery.each( obj, function( i, v ) {
			if ( traditional || rbracket.test( prefix ) ) {
				// Treat each array item as a scalar.
				add( prefix, v );

			} else {
				// If array item is non-scalar (array or object), encode its
				// numeric index to resolve deserialization ambiguity issues.
				// Note that rack (as of 1.0.0) can't currently deserialize
				// nested arrays properly, and attempting to do so may cause
				// a server error. Possible fixes are to modify rack's
				// deserialization algorithm or to provide an option or flag
				// to force array serialization to be shallow.
				buildParams( prefix + "[" + ( typeof v === "object" ? i : "" ) + "]", v, traditional, add );
			}
		});

	} else if ( !traditional && jQuery.type( obj ) === "object" ) {
		// Serialize object item.
		for ( name in obj ) {
			buildParams( prefix + "[" + name + "]", obj[ name ], traditional, add );
		}

	} else {
		// Serialize scalar item.
		add( prefix, obj );
	}
}
var
	// Document location
	ajaxLocParts,
	ajaxLocation,

	rhash = /#.*$/,
	rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg, // IE leaves an \r character at EOL
	// #7653, #8125, #8152: local protocol detection
	rlocalProtocol = /^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,
	rnoContent = /^(?:GET|HEAD)$/,
	rprotocol = /^\/\//,
	rquery = /\?/,
	rscript = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
	rts = /([?&])_=[^&]*/,
	rurl = /^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,

	// Keep a copy of the old load method
	_load = jQuery.fn.load,

	/* Prefilters
	 * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
	 * 2) These are called:
	 *    - BEFORE asking for a transport
	 *    - AFTER param serialization (s.data is a string if s.processData is true)
	 * 3) key is the dataType
	 * 4) the catchall symbol "*" can be used
	 * 5) execution will start with transport dataType and THEN continue down to "*" if needed
	 */
	prefilters = {},

	/* Transports bindings
	 * 1) key is the dataType
	 * 2) the catchall symbol "*" can be used
	 * 3) selection will start with transport dataType and THEN go to "*" if needed
	 */
	transports = {},

	// Avoid comment-prolog char sequence (#10098); must appease lint and evade compression
	allTypes = ["*/"] + ["*"];

// #8138, IE may throw an exception when accessing
// a field from window.location if document.domain has been set
try {
	ajaxLocation = location.href;
} catch( e ) {
	// Use the href attribute of an A element
	// since IE will modify it given document.location
	ajaxLocation = document.createElement( "a" );
	ajaxLocation.href = "";
	ajaxLocation = ajaxLocation.href;
}

// Segment location into parts
ajaxLocParts = rurl.exec( ajaxLocation.toLowerCase() ) || [];

// Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport
function addToPrefiltersOrTransports( structure ) {

	// dataTypeExpression is optional and defaults to "*"
	return function( dataTypeExpression, func ) {

		if ( typeof dataTypeExpression !== "string" ) {
			func = dataTypeExpression;
			dataTypeExpression = "*";
		}

		var dataType, list, placeBefore,
			dataTypes = dataTypeExpression.toLowerCase().split( core_rspace ),
			i = 0,
			length = dataTypes.length;

		if ( jQuery.isFunction( func ) ) {
			// For each dataType in the dataTypeExpression
			for ( ; i < length; i++ ) {
				dataType = dataTypes[ i ];
				// We control if we're asked to add before
				// any existing element
				placeBefore = /^\+/.test( dataType );
				if ( placeBefore ) {
					dataType = dataType.substr( 1 ) || "*";
				}
				list = structure[ dataType ] = structure[ dataType ] || [];
				// then we add to the structure accordingly
				list[ placeBefore ? "unshift" : "push" ]( func );
			}
		}
	};
}

// Base inspection function for prefilters and transports
function inspectPrefiltersOrTransports( structure, options, originalOptions, jqXHR,
		dataType /* internal */, inspected /* internal */ ) {

	dataType = dataType || options.dataTypes[ 0 ];
	inspected = inspected || {};

	inspected[ dataType ] = true;

	var selection,
		list = structure[ dataType ],
		i = 0,
		length = list ? list.length : 0,
		executeOnly = ( structure === prefilters );

	for ( ; i < length && ( executeOnly || !selection ); i++ ) {
		selection = list[ i ]( options, originalOptions, jqXHR );
		// If we got redirected to another dataType
		// we try there if executing only and not done already
		if ( typeof selection === "string" ) {
			if ( !executeOnly || inspected[ selection ] ) {
				selection = undefined;
			} else {
				options.dataTypes.unshift( selection );
				selection = inspectPrefiltersOrTransports(
						structure, options, originalOptions, jqXHR, selection, inspected );
			}
		}
	}
	// If we're only executing or nothing was selected
	// we try the catchall dataType if not done already
	if ( ( executeOnly || !selection ) && !inspected[ "*" ] ) {
		selection = inspectPrefiltersOrTransports(
				structure, options, originalOptions, jqXHR, "*", inspected );
	}
	// unnecessary when only executing (prefilters)
	// but it'll be ignored by the caller in that case
	return selection;
}

// A special extend for ajax options
// that takes "flat" options (not to be deep extended)
// Fixes #9887
function ajaxExtend( target, src ) {
	var key, deep,
		flatOptions = jQuery.ajaxSettings.flatOptions || {};
	for ( key in src ) {
		if ( src[ key ] !== undefined ) {
			( flatOptions[ key ] ? target : ( deep || ( deep = {} ) ) )[ key ] = src[ key ];
		}
	}
	if ( deep ) {
		jQuery.extend( true, target, deep );
	}
}

jQuery.fn.load = function( url, params, callback ) {
	if ( typeof url !== "string" && _load ) {
		return _load.apply( this, arguments );
	}

	// Don't do a request if no elements are being requested
	if ( !this.length ) {
		return this;
	}

	var selector, type, response,
		self = this,
		off = url.indexOf(" ");

	if ( off >= 0 ) {
		selector = url.slice( off, url.length );
		url = url.slice( 0, off );
	}

	// If it's a function
	if ( jQuery.isFunction( params ) ) {

		// We assume that it's the callback
		callback = params;
		params = undefined;

	// Otherwise, build a param string
	} else if ( params && typeof params === "object" ) {
		type = "POST";
	}

	// Request the remote document
	jQuery.ajax({
		url: url,

		// if "type" variable is undefined, then "GET" method will be used
		type: type,
		dataType: "html",
		data: params,
		complete: function( jqXHR, status ) {
			if ( callback ) {
				self.each( callback, response || [ jqXHR.responseText, status, jqXHR ] );
			}
		}
	}).done(function( responseText ) {

		// Save response for use in complete callback
		response = arguments;

		// See if a selector was specified
		self.html( selector ?

			// Create a dummy div to hold the results
			jQuery("<div>")

				// inject the contents of the document in, removing the scripts
				// to avoid any 'Permission Denied' errors in IE
				.append( responseText.replace( rscript, "" ) )

				// Locate the specified elements
				.find( selector ) :

			// If not, just inject the full result
			responseText );

	});

	return this;
};

// Attach a bunch of functions for handling common AJAX events
jQuery.each( "ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split( " " ), function( i, o ){
	jQuery.fn[ o ] = function( f ){
		return this.on( o, f );
	};
});

jQuery.each( [ "get", "post" ], function( i, method ) {
	jQuery[ method ] = function( url, data, callback, type ) {
		// shift arguments if data argument was omitted
		if ( jQuery.isFunction( data ) ) {
			type = type || callback;
			callback = data;
			data = undefined;
		}

		return jQuery.ajax({
			type: method,
			url: url,
			data: data,
			success: callback,
			dataType: type
		});
	};
});

jQuery.extend({

	getScript: function( url, callback ) {
		return jQuery.get( url, undefined, callback, "script" );
	},

	getJSON: function( url, data, callback ) {
		return jQuery.get( url, data, callback, "json" );
	},

	// Creates a full fledged settings object into target
	// with both ajaxSettings and settings fields.
	// If target is omitted, writes into ajaxSettings.
	ajaxSetup: function( target, settings ) {
		if ( settings ) {
			// Building a settings object
			ajaxExtend( target, jQuery.ajaxSettings );
		} else {
			// Extending ajaxSettings
			settings = target;
			target = jQuery.ajaxSettings;
		}
		ajaxExtend( target, settings );
		return target;
	},

	ajaxSettings: {
		url: ajaxLocation,
		isLocal: rlocalProtocol.test( ajaxLocParts[ 1 ] ),
		global: true,
		type: "GET",
		contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		processData: true,
		async: true,
		/*
		timeout: 0,
		data: null,
		dataType: null,
		username: null,
		password: null,
		cache: null,
		throws: false,
		traditional: false,
		headers: {},
		*/

		accepts: {
			xml: "application/xml, text/xml",
			html: "text/html",
			text: "text/plain",
			json: "application/json, text/javascript",
			"*": allTypes
		},

		contents: {
			xml: /xml/,
			html: /html/,
			json: /json/
		},

		responseFields: {
			xml: "responseXML",
			text: "responseText"
		},

		// List of data converters
		// 1) key format is "source_type destination_type" (a single space in-between)
		// 2) the catchall symbol "*" can be used for source_type
		converters: {

			// Convert anything to text
			"* text": window.String,

			// Text to html (true = no transformation)
			"text html": true,

			// Evaluate text as a json expression
			"text json": jQuery.parseJSON,

			// Parse text as xml
			"text xml": jQuery.parseXML
		},

		// For options that shouldn't be deep extended:
		// you can add your own custom options here if
		// and when you create one that shouldn't be
		// deep extended (see ajaxExtend)
		flatOptions: {
			context: true,
			url: true
		}
	},

	ajaxPrefilter: addToPrefiltersOrTransports( prefilters ),
	ajaxTransport: addToPrefiltersOrTransports( transports ),

	// Main method
	ajax: function( url, options ) {

		// If url is an object, simulate pre-1.5 signature
		if ( typeof url === "object" ) {
			options = url;
			url = undefined;
		}

		// Force options to be an object
		options = options || {};

		var // ifModified key
			ifModifiedKey,
			// Response headers
			responseHeadersString,
			responseHeaders,
			// transport
			transport,
			// timeout handle
			timeoutTimer,
			// Cross-domain detection vars
			parts,
			// To know if global events are to be dispatched
			fireGlobals,
			// Loop variable
			i,
			// Create the final options object
			s = jQuery.ajaxSetup( {}, options ),
			// Callbacks context
			callbackContext = s.context || s,
			// Context for global events
			// It's the callbackContext if one was provided in the options
			// and if it's a DOM node or a jQuery collection
			globalEventContext = callbackContext !== s &&
				( callbackContext.nodeType || callbackContext instanceof jQuery ) ?
						jQuery( callbackContext ) : jQuery.event,
			// Deferreds
			deferred = jQuery.Deferred(),
			completeDeferred = jQuery.Callbacks( "once memory" ),
			// Status-dependent callbacks
			statusCode = s.statusCode || {},
			// Headers (they are sent all at once)
			requestHeaders = {},
			requestHeadersNames = {},
			// The jqXHR state
			state = 0,
			// Default abort message
			strAbort = "canceled",
			// Fake xhr
			jqXHR = {

				readyState: 0,

				// Caches the header
				setRequestHeader: function( name, value ) {
					if ( !state ) {
						var lname = name.toLowerCase();
						name = requestHeadersNames[ lname ] = requestHeadersNames[ lname ] || name;
						requestHeaders[ name ] = value;
					}
					return this;
				},

				// Raw string
				getAllResponseHeaders: function() {
					return state === 2 ? responseHeadersString : null;
				},

				// Builds headers hashtable if needed
				getResponseHeader: function( key ) {
					var match;
					if ( state === 2 ) {
						if ( !responseHeaders ) {
							responseHeaders = {};
							while( ( match = rheaders.exec( responseHeadersString ) ) ) {
								responseHeaders[ match[1].toLowerCase() ] = match[ 2 ];
							}
						}
						match = responseHeaders[ key.toLowerCase() ];
					}
					return match === undefined ? null : match;
				},

				// Overrides response content-type header
				overrideMimeType: function( type ) {
					if ( !state ) {
						s.mimeType = type;
					}
					return this;
				},

				// Cancel the request
				abort: function( statusText ) {
					statusText = statusText || strAbort;
					if ( transport ) {
						transport.abort( statusText );
					}
					done( 0, statusText );
					return this;
				}
			};

		// Callback for when everything is done
		// It is defined here because jslint complains if it is declared
		// at the end of the function (which would be more logical and readable)
		function done( status, nativeStatusText, responses, headers ) {
			var isSuccess, success, error, response, modified,
				statusText = nativeStatusText;

			// Called once
			if ( state === 2 ) {
				return;
			}

			// State is "done" now
			state = 2;

			// Clear timeout if it exists
			if ( timeoutTimer ) {
				clearTimeout( timeoutTimer );
			}

			// Dereference transport for early garbage collection
			// (no matter how long the jqXHR object will be used)
			transport = undefined;

			// Cache response headers
			responseHeadersString = headers || "";

			// Set readyState
			jqXHR.readyState = status > 0 ? 4 : 0;

			// Get response data
			if ( responses ) {
				response = ajaxHandleResponses( s, jqXHR, responses );
			}

			// If successful, handle type chaining
			if ( status >= 200 && status < 300 || status === 304 ) {

				// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
				if ( s.ifModified ) {

					modified = jqXHR.getResponseHeader("Last-Modified");
					if ( modified ) {
						jQuery.lastModified[ ifModifiedKey ] = modified;
					}
					modified = jqXHR.getResponseHeader("Etag");
					if ( modified ) {
						jQuery.etag[ ifModifiedKey ] = modified;
					}
				}

				// If not modified
				if ( status === 304 ) {

					statusText = "notmodified";
					isSuccess = true;

				// If we have data
				} else {

					isSuccess = ajaxConvert( s, response );
					statusText = isSuccess.state;
					success = isSuccess.data;
					error = isSuccess.error;
					isSuccess = !error;
				}
			} else {
				// We extract error from statusText
				// then normalize statusText and status for non-aborts
				error = statusText;
				if ( !statusText || status ) {
					statusText = "error";
					if ( status < 0 ) {
						status = 0;
					}
				}
			}

			// Set data for the fake xhr object
			jqXHR.status = status;
			jqXHR.statusText = ( nativeStatusText || statusText ) + "";

			// Success/Error
			if ( isSuccess ) {
				deferred.resolveWith( callbackContext, [ success, statusText, jqXHR ] );
			} else {
				deferred.rejectWith( callbackContext, [ jqXHR, statusText, error ] );
			}

			// Status-dependent callbacks
			jqXHR.statusCode( statusCode );
			statusCode = undefined;

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajax" + ( isSuccess ? "Success" : "Error" ),
						[ jqXHR, s, isSuccess ? success : error ] );
			}

			// Complete
			completeDeferred.fireWith( callbackContext, [ jqXHR, statusText ] );

			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxComplete", [ jqXHR, s ] );
				// Handle the global AJAX counter
				if ( !( --jQuery.active ) ) {
					jQuery.event.trigger( "ajaxStop" );
				}
			}
		}

		// Attach deferreds
		deferred.promise( jqXHR );
		jqXHR.success = jqXHR.done;
		jqXHR.error = jqXHR.fail;
		jqXHR.complete = completeDeferred.add;

		// Status-dependent callbacks
		jqXHR.statusCode = function( map ) {
			if ( map ) {
				var tmp;
				if ( state < 2 ) {
					for ( tmp in map ) {
						statusCode[ tmp ] = [ statusCode[tmp], map[tmp] ];
					}
				} else {
					tmp = map[ jqXHR.status ];
					jqXHR.always( tmp );
				}
			}
			return this;
		};

		// Remove hash character (#7531: and string promotion)
		// Add protocol if not provided (#5866: IE7 issue with protocol-less urls)
		// We also use the url parameter if available
		s.url = ( ( url || s.url ) + "" ).replace( rhash, "" ).replace( rprotocol, ajaxLocParts[ 1 ] + "//" );

		// Extract dataTypes list
		s.dataTypes = jQuery.trim( s.dataType || "*" ).toLowerCase().split( core_rspace );

		// A cross-domain request is in order when we have a protocol:host:port mismatch
		if ( s.crossDomain == null ) {
			parts = rurl.exec( s.url.toLowerCase() );
			s.crossDomain = !!( parts &&
				( parts[ 1 ] !== ajaxLocParts[ 1 ] || parts[ 2 ] !== ajaxLocParts[ 2 ] ||
					( parts[ 3 ] || ( parts[ 1 ] === "http:" ? 80 : 443 ) ) !=
						( ajaxLocParts[ 3 ] || ( ajaxLocParts[ 1 ] === "http:" ? 80 : 443 ) ) )
			);
		}

		// Convert data if not already a string
		if ( s.data && s.processData && typeof s.data !== "string" ) {
			s.data = jQuery.param( s.data, s.traditional );
		}

		// Apply prefilters
		inspectPrefiltersOrTransports( prefilters, s, options, jqXHR );

		// If request was aborted inside a prefilter, stop there
		if ( state === 2 ) {
			return jqXHR;
		}

		// We can fire global events as of now if asked to
		fireGlobals = s.global;

		// Uppercase the type
		s.type = s.type.toUpperCase();

		// Determine if request has content
		s.hasContent = !rnoContent.test( s.type );

		// Watch for a new set of requests
		if ( fireGlobals && jQuery.active++ === 0 ) {
			jQuery.event.trigger( "ajaxStart" );
		}

		// More options handling for requests with no content
		if ( !s.hasContent ) {

			// If data is available, append data to url
			if ( s.data ) {
				s.url += ( rquery.test( s.url ) ? "&" : "?" ) + s.data;
				// #9682: remove data so that it's not used in an eventual retry
				delete s.data;
			}

			// Get ifModifiedKey before adding the anti-cache parameter
			ifModifiedKey = s.url;

			// Add anti-cache in url if needed
			if ( s.cache === false ) {

				var ts = jQuery.now(),
					// try replacing _= if it is there
					ret = s.url.replace( rts, "$1_=" + ts );

				// if nothing was replaced, add timestamp to the end
				s.url = ret + ( ( ret === s.url ) ? ( rquery.test( s.url ) ? "&" : "?" ) + "_=" + ts : "" );
			}
		}

		// Set the correct header, if data is being sent
		if ( s.data && s.hasContent && s.contentType !== false || options.contentType ) {
			jqXHR.setRequestHeader( "Content-Type", s.contentType );
		}

		// Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
		if ( s.ifModified ) {
			ifModifiedKey = ifModifiedKey || s.url;
			if ( jQuery.lastModified[ ifModifiedKey ] ) {
				jqXHR.setRequestHeader( "If-Modified-Since", jQuery.lastModified[ ifModifiedKey ] );
			}
			if ( jQuery.etag[ ifModifiedKey ] ) {
				jqXHR.setRequestHeader( "If-None-Match", jQuery.etag[ ifModifiedKey ] );
			}
		}

		// Set the Accepts header for the server, depending on the dataType
		jqXHR.setRequestHeader(
			"Accept",
			s.dataTypes[ 0 ] && s.accepts[ s.dataTypes[0] ] ?
				s.accepts[ s.dataTypes[0] ] + ( s.dataTypes[ 0 ] !== "*" ? ", " + allTypes + "; q=0.01" : "" ) :
				s.accepts[ "*" ]
		);

		// Check for headers option
		for ( i in s.headers ) {
			jqXHR.setRequestHeader( i, s.headers[ i ] );
		}

		// Allow custom headers/mimetypes and early abort
		if ( s.beforeSend && ( s.beforeSend.call( callbackContext, jqXHR, s ) === false || state === 2 ) ) {
				// Abort if not done already and return
				return jqXHR.abort();

		}

		// aborting is no longer a cancellation
		strAbort = "abort";

		// Install callbacks on deferreds
		for ( i in { success: 1, error: 1, complete: 1 } ) {
			jqXHR[ i ]( s[ i ] );
		}

		// Get transport
		transport = inspectPrefiltersOrTransports( transports, s, options, jqXHR );

		// If no transport, we auto-abort
		if ( !transport ) {
			done( -1, "No Transport" );
		} else {
			jqXHR.readyState = 1;
			// Send global event
			if ( fireGlobals ) {
				globalEventContext.trigger( "ajaxSend", [ jqXHR, s ] );
			}
			// Timeout
			if ( s.async && s.timeout > 0 ) {
				timeoutTimer = setTimeout( function(){
					jqXHR.abort( "timeout" );
				}, s.timeout );
			}

			try {
				state = 1;
				transport.send( requestHeaders, done );
			} catch (e) {
				// Propagate exception as error if not done
				if ( state < 2 ) {
					done( -1, e );
				// Simply rethrow otherwise
				} else {
					throw e;
				}
			}
		}

		return jqXHR;
	},

	// Counter for holding the number of active queries
	active: 0,

	// Last-Modified header cache for next request
	lastModified: {},
	etag: {}

});

/* Handles responses to an ajax request:
 * - sets all responseXXX fields accordingly
 * - finds the right dataType (mediates between content-type and expected dataType)
 * - returns the corresponding response
 */
function ajaxHandleResponses( s, jqXHR, responses ) {

	var ct, type, finalDataType, firstDataType,
		contents = s.contents,
		dataTypes = s.dataTypes,
		responseFields = s.responseFields;

	// Fill responseXXX fields
	for ( type in responseFields ) {
		if ( type in responses ) {
			jqXHR[ responseFields[type] ] = responses[ type ];
		}
	}

	// Remove auto dataType and get content-type in the process
	while( dataTypes[ 0 ] === "*" ) {
		dataTypes.shift();
		if ( ct === undefined ) {
			ct = s.mimeType || jqXHR.getResponseHeader( "content-type" );
		}
	}

	// Check if we're dealing with a known content-type
	if ( ct ) {
		for ( type in contents ) {
			if ( contents[ type ] && contents[ type ].test( ct ) ) {
				dataTypes.unshift( type );
				break;
			}
		}
	}

	// Check to see if we have a response for the expected dataType
	if ( dataTypes[ 0 ] in responses ) {
		finalDataType = dataTypes[ 0 ];
	} else {
		// Try convertible dataTypes
		for ( type in responses ) {
			if ( !dataTypes[ 0 ] || s.converters[ type + " " + dataTypes[0] ] ) {
				finalDataType = type;
				break;
			}
			if ( !firstDataType ) {
				firstDataType = type;
			}
		}
		// Or just use first one
		finalDataType = finalDataType || firstDataType;
	}

	// If we found a dataType
	// We add the dataType to the list if needed
	// and return the corresponding response
	if ( finalDataType ) {
		if ( finalDataType !== dataTypes[ 0 ] ) {
			dataTypes.unshift( finalDataType );
		}
		return responses[ finalDataType ];
	}
}

// Chain conversions given the request and the original response
function ajaxConvert( s, response ) {

	var conv, conv2, current, tmp,
		// Work with a copy of dataTypes in case we need to modify it for conversion
		dataTypes = s.dataTypes.slice(),
		prev = dataTypes[ 0 ],
		converters = {},
		i = 0;

	// Apply the dataFilter if provided
	if ( s.dataFilter ) {
		response = s.dataFilter( response, s.dataType );
	}

	// Create converters map with lowercased keys
	if ( dataTypes[ 1 ] ) {
		for ( conv in s.converters ) {
			converters[ conv.toLowerCase() ] = s.converters[ conv ];
		}
	}

	// Convert to each sequential dataType, tolerating list modification
	for ( ; (current = dataTypes[++i]); ) {

		// There's only work to do if current dataType is non-auto
		if ( current !== "*" ) {

			// Convert response if prev dataType is non-auto and differs from current
			if ( prev !== "*" && prev !== current ) {

				// Seek a direct converter
				conv = converters[ prev + " " + current ] || converters[ "* " + current ];

				// If none found, seek a pair
				if ( !conv ) {
					for ( conv2 in converters ) {

						// If conv2 outputs current
						tmp = conv2.split(" ");
						if ( tmp[ 1 ] === current ) {

							// If prev can be converted to accepted input
							conv = converters[ prev + " " + tmp[ 0 ] ] ||
								converters[ "* " + tmp[ 0 ] ];
							if ( conv ) {
								// Condense equivalence converters
								if ( conv === true ) {
									conv = converters[ conv2 ];

								// Otherwise, insert the intermediate dataType
								} else if ( converters[ conv2 ] !== true ) {
									current = tmp[ 0 ];
									dataTypes.splice( i--, 0, current );
								}

								break;
							}
						}
					}
				}

				// Apply converter (if not an equivalence)
				if ( conv !== true ) {

					// Unless errors are allowed to bubble, catch and return them
					if ( conv && s["throws"] ) {
						response = conv( response );
					} else {
						try {
							response = conv( response );
						} catch ( e ) {
							return { state: "parsererror", error: conv ? e : "No conversion from " + prev + " to " + current };
						}
					}
				}
			}

			// Update prev for next iteration
			prev = current;
		}
	}

	return { state: "success", data: response };
}
var oldCallbacks = [],
	rquestion = /\?/,
	rjsonp = /(=)\?(?=&|$)|\?\?/,
	nonce = jQuery.now();

// Default jsonp settings
jQuery.ajaxSetup({
	jsonp: "callback",
	jsonpCallback: function() {
		var callback = oldCallbacks.pop() || ( jQuery.expando + "_" + ( nonce++ ) );
		this[ callback ] = true;
		return callback;
	}
});

// Detect, normalize options and install callbacks for jsonp requests
jQuery.ajaxPrefilter( "json jsonp", function( s, originalSettings, jqXHR ) {

	var callbackName, overwritten, responseContainer,
		data = s.data,
		url = s.url,
		hasCallback = s.jsonp !== false,
		replaceInUrl = hasCallback && rjsonp.test( url ),
		replaceInData = hasCallback && !replaceInUrl && typeof data === "string" &&
			!( s.contentType || "" ).indexOf("application/x-www-form-urlencoded") &&
			rjsonp.test( data );

	// Handle iff the expected data type is "jsonp" or we have a parameter to set
	if ( s.dataTypes[ 0 ] === "jsonp" || replaceInUrl || replaceInData ) {

		// Get callback name, remembering preexisting value associated with it
		callbackName = s.jsonpCallback = jQuery.isFunction( s.jsonpCallback ) ?
			s.jsonpCallback() :
			s.jsonpCallback;
		overwritten = window[ callbackName ];

		// Insert callback into url or form data
		if ( replaceInUrl ) {
			s.url = url.replace( rjsonp, "$1" + callbackName );
		} else if ( replaceInData ) {
			s.data = data.replace( rjsonp, "$1" + callbackName );
		} else if ( hasCallback ) {
			s.url += ( rquestion.test( url ) ? "&" : "?" ) + s.jsonp + "=" + callbackName;
		}

		// Use data converter to retrieve json after script execution
		s.converters["script json"] = function() {
			if ( !responseContainer ) {
				jQuery.error( callbackName + " was not called" );
			}
			return responseContainer[ 0 ];
		};

		// force json dataType
		s.dataTypes[ 0 ] = "json";

		// Install callback
		window[ callbackName ] = function() {
			responseContainer = arguments;
		};

		// Clean-up function (fires after converters)
		jqXHR.always(function() {
			// Restore preexisting value
			window[ callbackName ] = overwritten;

			// Save back as free
			if ( s[ callbackName ] ) {
				// make sure that re-using the options doesn't screw things around
				s.jsonpCallback = originalSettings.jsonpCallback;

				// save the callback name for future use
				oldCallbacks.push( callbackName );
			}

			// Call if it was a function and we have a response
			if ( responseContainer && jQuery.isFunction( overwritten ) ) {
				overwritten( responseContainer[ 0 ] );
			}

			responseContainer = overwritten = undefined;
		});

		// Delegate to script
		return "script";
	}
});
// Install script dataType
jQuery.ajaxSetup({
	accepts: {
		script: "text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"
	},
	contents: {
		script: /javascript|ecmascript/
	},
	converters: {
		"text script": function( text ) {
			jQuery.globalEval( text );
			return text;
		}
	}
});

// Handle cache's special case and global
jQuery.ajaxPrefilter( "script", function( s ) {
	if ( s.cache === undefined ) {
		s.cache = false;
	}
	if ( s.crossDomain ) {
		s.type = "GET";
		s.global = false;
	}
});

// Bind script tag hack transport
jQuery.ajaxTransport( "script", function(s) {

	// This transport only deals with cross domain requests
	if ( s.crossDomain ) {

		var script,
			head = document.head || document.getElementsByTagName( "head" )[0] || document.documentElement;

		return {

			send: function( _, callback ) {

				script = document.createElement( "script" );

				script.async = "async";

				if ( s.scriptCharset ) {
					script.charset = s.scriptCharset;
				}

				script.src = s.url;

				// Attach handlers for all browsers
				script.onload = script.onreadystatechange = function( _, isAbort ) {

					if ( isAbort || !script.readyState || /loaded|complete/.test( script.readyState ) ) {

						// Handle memory leak in IE
						script.onload = script.onreadystatechange = null;

						// Remove the script
						if ( head && script.parentNode ) {
							head.removeChild( script );
						}

						// Dereference the script
						script = undefined;

						// Callback if not abort
						if ( !isAbort ) {
							callback( 200, "success" );
						}
					}
				};
				// Use insertBefore instead of appendChild  to circumvent an IE6 bug.
				// This arises when a base node is used (#2709 and #4378).
				head.insertBefore( script, head.firstChild );
			},

			abort: function() {
				if ( script ) {
					script.onload( 0, 1 );
				}
			}
		};
	}
});
var xhrCallbacks,
	// #5280: Internet Explorer will keep connections alive if we don't abort on unload
	xhrOnUnloadAbort = window.ActiveXObject ? function() {
		// Abort all pending requests
		for ( var key in xhrCallbacks ) {
			xhrCallbacks[ key ]( 0, 1 );
		}
	} : false,
	xhrId = 0;

// Functions to create xhrs
function createStandardXHR() {
	try {
		return new window.XMLHttpRequest();
	} catch( e ) {}
}

function createActiveXHR() {
	try {
		return new window.ActiveXObject( "Microsoft.XMLHTTP" );
	} catch( e ) {}
}

// Create the request object
// (This is still attached to ajaxSettings for backward compatibility)
jQuery.ajaxSettings.xhr = window.ActiveXObject ?
	/* Microsoft failed to properly
	 * implement the XMLHttpRequest in IE7 (can't request local files),
	 * so we use the ActiveXObject when it is available
	 * Additionally XMLHttpRequest can be disabled in IE7/IE8 so
	 * we need a fallback.
	 */
	function() {
		return !this.isLocal && createStandardXHR() || createActiveXHR();
	} :
	// For all other browsers, use the standard XMLHttpRequest object
	createStandardXHR;

// Determine support properties
(function( xhr ) {
	jQuery.extend( jQuery.support, {
		ajax: !!xhr,
		cors: !!xhr && ( "withCredentials" in xhr )
	});
})( jQuery.ajaxSettings.xhr() );

// Create transport if the browser can provide an xhr
if ( jQuery.support.ajax ) {

	jQuery.ajaxTransport(function( s ) {
		// Cross domain only allowed if supported through XMLHttpRequest
		if ( !s.crossDomain || jQuery.support.cors ) {

			var callback;

			return {
				send: function( headers, complete ) {

					// Get a new xhr
					var handle, i,
						xhr = s.xhr();

					// Open the socket
					// Passing null username, generates a login popup on Opera (#2865)
					if ( s.username ) {
						xhr.open( s.type, s.url, s.async, s.username, s.password );
					} else {
						xhr.open( s.type, s.url, s.async );
					}

					// Apply custom fields if provided
					if ( s.xhrFields ) {
						for ( i in s.xhrFields ) {
							xhr[ i ] = s.xhrFields[ i ];
						}
					}

					// Override mime type if needed
					if ( s.mimeType && xhr.overrideMimeType ) {
						xhr.overrideMimeType( s.mimeType );
					}

					// X-Requested-With header
					// For cross-domain requests, seeing as conditions for a preflight are
					// akin to a jigsaw puzzle, we simply never set it to be sure.
					// (it can always be set on a per-request basis or even using ajaxSetup)
					// For same-domain requests, won't change header if already provided.
					if ( !s.crossDomain && !headers["X-Requested-With"] ) {
						headers[ "X-Requested-With" ] = "XMLHttpRequest";
					}

					// Need an extra try/catch for cross domain requests in Firefox 3
					try {
						for ( i in headers ) {
							xhr.setRequestHeader( i, headers[ i ] );
						}
					} catch( _ ) {}

					// Do send the request
					// This may raise an exception which is actually
					// handled in jQuery.ajax (so no try/catch here)
					xhr.send( ( s.hasContent && s.data ) || null );

					// Listener
					callback = function( _, isAbort ) {

						var status,
							statusText,
							responseHeaders,
							responses,
							xml;

						// Firefox throws exceptions when accessing properties
						// of an xhr when a network error occurred
						// http://helpful.knobs-dials.com/index.php/Component_returned_failure_code:_0x80040111_(NS_ERROR_NOT_AVAILABLE)
						try {

							// Was never called and is aborted or complete
							if ( callback && ( isAbort || xhr.readyState === 4 ) ) {

								// Only called once
								callback = undefined;

								// Do not keep as active anymore
								if ( handle ) {
									xhr.onreadystatechange = jQuery.noop;
									if ( xhrOnUnloadAbort ) {
										delete xhrCallbacks[ handle ];
									}
								}

								// If it's an abort
								if ( isAbort ) {
									// Abort it manually if needed
									if ( xhr.readyState !== 4 ) {
										xhr.abort();
									}
								} else {
									status = xhr.status;
									responseHeaders = xhr.getAllResponseHeaders();
									responses = {};
									xml = xhr.responseXML;

									// Construct response list
									if ( xml && xml.documentElement /* #4958 */ ) {
										responses.xml = xml;
									}

									// When requesting binary data, IE6-9 will throw an exception
									// on any attempt to access responseText (#11426)
									try {
										responses.text = xhr.responseText;
									} catch( e ) {
									}

									// Firefox throws an exception when accessing
									// statusText for faulty cross-domain requests
									try {
										statusText = xhr.statusText;
									} catch( e ) {
										// We normalize with Webkit giving an empty statusText
										statusText = "";
									}

									// Filter status for non standard behaviors

									// If the request is local and we have data: assume a success
									// (success with no data won't get notified, that's the best we
									// can do given current implementations)
									if ( !status && s.isLocal && !s.crossDomain ) {
										status = responses.text ? 200 : 404;
									// IE - #1450: sometimes returns 1223 when it should be 204
									} else if ( status === 1223 ) {
										status = 204;
									}
								}
							}
						} catch( firefoxAccessException ) {
							if ( !isAbort ) {
								complete( -1, firefoxAccessException );
							}
						}

						// Call complete if needed
						if ( responses ) {
							complete( status, statusText, responses, responseHeaders );
						}
					};

					if ( !s.async ) {
						// if we're in sync mode we fire the callback
						callback();
					} else if ( xhr.readyState === 4 ) {
						// (IE6 & IE7) if it's in cache and has been
						// retrieved directly we need to fire the callback
						setTimeout( callback, 0 );
					} else {
						handle = ++xhrId;
						if ( xhrOnUnloadAbort ) {
							// Create the active xhrs callbacks list if needed
							// and attach the unload handler
							if ( !xhrCallbacks ) {
								xhrCallbacks = {};
								jQuery( window ).unload( xhrOnUnloadAbort );
							}
							// Add to list of active xhrs callbacks
							xhrCallbacks[ handle ] = callback;
						}
						xhr.onreadystatechange = callback;
					}
				},

				abort: function() {
					if ( callback ) {
						callback(0,1);
					}
				}
			};
		}
	});
}
var fxNow, timerId,
	rfxtypes = /^(?:toggle|show|hide)$/,
	rfxnum = new RegExp( "^(?:([-+])=|)(" + core_pnum + ")([a-z%]*)$", "i" ),
	rrun = /queueHooks$/,
	animationPrefilters = [ defaultPrefilter ],
	tweeners = {
		"*": [function( prop, value ) {
			var end, unit,
				tween = this.createTween( prop, value ),
				parts = rfxnum.exec( value ),
				target = tween.cur(),
				start = +target || 0,
				scale = 1,
				maxIterations = 20;

			if ( parts ) {
				end = +parts[2];
				unit = parts[3] || ( jQuery.cssNumber[ prop ] ? "" : "px" );

				// We need to compute starting value
				if ( unit !== "px" && start ) {
					// Iteratively approximate from a nonzero starting point
					// Prefer the current property, because this process will be trivial if it uses the same units
					// Fallback to end or a simple constant
					start = jQuery.css( tween.elem, prop, true ) || end || 1;

					do {
						// If previous iteration zeroed out, double until we get *something*
						// Use a string for doubling factor so we don't accidentally see scale as unchanged below
						scale = scale || ".5";

						// Adjust and apply
						start = start / scale;
						jQuery.style( tween.elem, prop, start + unit );

					// Update scale, tolerating zero or NaN from tween.cur()
					// And breaking the loop if scale is unchanged or perfect, or if we've just had enough
					} while ( scale !== (scale = tween.cur() / target) && scale !== 1 && --maxIterations );
				}

				tween.unit = unit;
				tween.start = start;
				// If a +=/-= token was provided, we're doing a relative animation
				tween.end = parts[1] ? start + ( parts[1] + 1 ) * end : end;
			}
			return tween;
		}]
	};

// Animations created synchronously will run synchronously
function createFxNow() {
	setTimeout(function() {
		fxNow = undefined;
	}, 0 );
	return ( fxNow = jQuery.now() );
}

function createTweens( animation, props ) {
	jQuery.each( props, function( prop, value ) {
		var collection = ( tweeners[ prop ] || [] ).concat( tweeners[ "*" ] ),
			index = 0,
			length = collection.length;
		for ( ; index < length; index++ ) {
			if ( collection[ index ].call( animation, prop, value ) ) {

				// we're done with this property
				return;
			}
		}
	});
}

function Animation( elem, properties, options ) {
	var result,
		index = 0,
		tweenerIndex = 0,
		length = animationPrefilters.length,
		deferred = jQuery.Deferred().always( function() {
			// don't match elem in the :animated selector
			delete tick.elem;
		}),
		tick = function() {
			var currentTime = fxNow || createFxNow(),
				remaining = Math.max( 0, animation.startTime + animation.duration - currentTime ),
				// archaic crash bug won't allow us to use 1 - ( 0.5 || 0 ) (#12497)
				temp = remaining / animation.duration || 0,
				percent = 1 - temp,
				index = 0,
				length = animation.tweens.length;

			for ( ; index < length ; index++ ) {
				animation.tweens[ index ].run( percent );
			}

			deferred.notifyWith( elem, [ animation, percent, remaining ]);

			if ( percent < 1 && length ) {
				return remaining;
			} else {
				deferred.resolveWith( elem, [ animation ] );
				return false;
			}
		},
		animation = deferred.promise({
			elem: elem,
			props: jQuery.extend( {}, properties ),
			opts: jQuery.extend( true, { specialEasing: {} }, options ),
			originalProperties: properties,
			originalOptions: options,
			startTime: fxNow || createFxNow(),
			duration: options.duration,
			tweens: [],
			createTween: function( prop, end, easing ) {
				var tween = jQuery.Tween( elem, animation.opts, prop, end,
						animation.opts.specialEasing[ prop ] || animation.opts.easing );
				animation.tweens.push( tween );
				return tween;
			},
			stop: function( gotoEnd ) {
				var index = 0,
					// if we are going to the end, we want to run all the tweens
					// otherwise we skip this part
					length = gotoEnd ? animation.tweens.length : 0;

				for ( ; index < length ; index++ ) {
					animation.tweens[ index ].run( 1 );
				}

				// resolve when we played the last frame
				// otherwise, reject
				if ( gotoEnd ) {
					deferred.resolveWith( elem, [ animation, gotoEnd ] );
				} else {
					deferred.rejectWith( elem, [ animation, gotoEnd ] );
				}
				return this;
			}
		}),
		props = animation.props;

	propFilter( props, animation.opts.specialEasing );

	for ( ; index < length ; index++ ) {
		result = animationPrefilters[ index ].call( animation, elem, props, animation.opts );
		if ( result ) {
			return result;
		}
	}

	createTweens( animation, props );

	if ( jQuery.isFunction( animation.opts.start ) ) {
		animation.opts.start.call( elem, animation );
	}

	jQuery.fx.timer(
		jQuery.extend( tick, {
			anim: animation,
			queue: animation.opts.queue,
			elem: elem
		})
	);

	// attach callbacks from options
	return animation.progress( animation.opts.progress )
		.done( animation.opts.done, animation.opts.complete )
		.fail( animation.opts.fail )
		.always( animation.opts.always );
}

function propFilter( props, specialEasing ) {
	var index, name, easing, value, hooks;

	// camelCase, specialEasing and expand cssHook pass
	for ( index in props ) {
		name = jQuery.camelCase( index );
		easing = specialEasing[ name ];
		value = props[ index ];
		if ( jQuery.isArray( value ) ) {
			easing = value[ 1 ];
			value = props[ index ] = value[ 0 ];
		}

		if ( index !== name ) {
			props[ name ] = value;
			delete props[ index ];
		}

		hooks = jQuery.cssHooks[ name ];
		if ( hooks && "expand" in hooks ) {
			value = hooks.expand( value );
			delete props[ name ];

			// not quite $.extend, this wont overwrite keys already present.
			// also - reusing 'index' from above because we have the correct "name"
			for ( index in value ) {
				if ( !( index in props ) ) {
					props[ index ] = value[ index ];
					specialEasing[ index ] = easing;
				}
			}
		} else {
			specialEasing[ name ] = easing;
		}
	}
}

jQuery.Animation = jQuery.extend( Animation, {

	tweener: function( props, callback ) {
		if ( jQuery.isFunction( props ) ) {
			callback = props;
			props = [ "*" ];
		} else {
			props = props.split(" ");
		}

		var prop,
			index = 0,
			length = props.length;

		for ( ; index < length ; index++ ) {
			prop = props[ index ];
			tweeners[ prop ] = tweeners[ prop ] || [];
			tweeners[ prop ].unshift( callback );
		}
	},

	prefilter: function( callback, prepend ) {
		if ( prepend ) {
			animationPrefilters.unshift( callback );
		} else {
			animationPrefilters.push( callback );
		}
	}
});

function defaultPrefilter( elem, props, opts ) {
	var index, prop, value, length, dataShow, toggle, tween, hooks, oldfire,
		anim = this,
		style = elem.style,
		orig = {},
		handled = [],
		hidden = elem.nodeType && isHidden( elem );

	// handle queue: false promises
	if ( !opts.queue ) {
		hooks = jQuery._queueHooks( elem, "fx" );
		if ( hooks.unqueued == null ) {
			hooks.unqueued = 0;
			oldfire = hooks.empty.fire;
			hooks.empty.fire = function() {
				if ( !hooks.unqueued ) {
					oldfire();
				}
			};
		}
		hooks.unqueued++;

		anim.always(function() {
			// doing this makes sure that the complete handler will be called
			// before this completes
			anim.always(function() {
				hooks.unqueued--;
				if ( !jQuery.queue( elem, "fx" ).length ) {
					hooks.empty.fire();
				}
			});
		});
	}

	// height/width overflow pass
	if ( elem.nodeType === 1 && ( "height" in props || "width" in props ) ) {
		// Make sure that nothing sneaks out
		// Record all 3 overflow attributes because IE does not
		// change the overflow attribute when overflowX and
		// overflowY are set to the same value
		opts.overflow = [ style.overflow, style.overflowX, style.overflowY ];

		// Set display property to inline-block for height/width
		// animations on inline elements that are having width/height animated
		if ( jQuery.css( elem, "display" ) === "inline" &&
				jQuery.css( elem, "float" ) === "none" ) {

			// inline-level elements accept inline-block;
			// block-level elements need to be inline with layout
			if ( !jQuery.support.inlineBlockNeedsLayout || css_defaultDisplay( elem.nodeName ) === "inline" ) {
				style.display = "inline-block";

			} else {
				style.zoom = 1;
			}
		}
	}

	if ( opts.overflow ) {
		style.overflow = "hidden";
		if ( !jQuery.support.shrinkWrapBlocks ) {
			anim.done(function() {
				style.overflow = opts.overflow[ 0 ];
				style.overflowX = opts.overflow[ 1 ];
				style.overflowY = opts.overflow[ 2 ];
			});
		}
	}


	// show/hide pass
	for ( index in props ) {
		value = props[ index ];
		if ( rfxtypes.exec( value ) ) {
			delete props[ index ];
			toggle = toggle || value === "toggle";
			if ( value === ( hidden ? "hide" : "show" ) ) {
				continue;
			}
			handled.push( index );
		}
	}

	length = handled.length;
	if ( length ) {
		dataShow = jQuery._data( elem, "fxshow" ) || jQuery._data( elem, "fxshow", {} );
		if ( "hidden" in dataShow ) {
			hidden = dataShow.hidden;
		}

		// store state if its toggle - enables .stop().toggle() to "reverse"
		if ( toggle ) {
			dataShow.hidden = !hidden;
		}
		if ( hidden ) {
			jQuery( elem ).show();
		} else {
			anim.done(function() {
				jQuery( elem ).hide();
			});
		}
		anim.done(function() {
			var prop;
			jQuery.removeData( elem, "fxshow", true );
			for ( prop in orig ) {
				jQuery.style( elem, prop, orig[ prop ] );
			}
		});
		for ( index = 0 ; index < length ; index++ ) {
			prop = handled[ index ];
			tween = anim.createTween( prop, hidden ? dataShow[ prop ] : 0 );
			orig[ prop ] = dataShow[ prop ] || jQuery.style( elem, prop );

			if ( !( prop in dataShow ) ) {
				dataShow[ prop ] = tween.start;
				if ( hidden ) {
					tween.end = tween.start;
					tween.start = prop === "width" || prop === "height" ? 1 : 0;
				}
			}
		}
	}
}

function Tween( elem, options, prop, end, easing ) {
	return new Tween.prototype.init( elem, options, prop, end, easing );
}
jQuery.Tween = Tween;

Tween.prototype = {
	constructor: Tween,
	init: function( elem, options, prop, end, easing, unit ) {
		this.elem = elem;
		this.prop = prop;
		this.easing = easing || "swing";
		this.options = options;
		this.start = this.now = this.cur();
		this.end = end;
		this.unit = unit || ( jQuery.cssNumber[ prop ] ? "" : "px" );
	},
	cur: function() {
		var hooks = Tween.propHooks[ this.prop ];

		return hooks && hooks.get ?
			hooks.get( this ) :
			Tween.propHooks._default.get( this );
	},
	run: function( percent ) {
		var eased,
			hooks = Tween.propHooks[ this.prop ];

		if ( this.options.duration ) {
			this.pos = eased = jQuery.easing[ this.easing ](
				percent, this.options.duration * percent, 0, 1, this.options.duration
			);
		} else {
			this.pos = eased = percent;
		}
		this.now = ( this.end - this.start ) * eased + this.start;

		if ( this.options.step ) {
			this.options.step.call( this.elem, this.now, this );
		}

		if ( hooks && hooks.set ) {
			hooks.set( this );
		} else {
			Tween.propHooks._default.set( this );
		}
		return this;
	}
};

Tween.prototype.init.prototype = Tween.prototype;

Tween.propHooks = {
	_default: {
		get: function( tween ) {
			var result;

			if ( tween.elem[ tween.prop ] != null &&
				(!tween.elem.style || tween.elem.style[ tween.prop ] == null) ) {
				return tween.elem[ tween.prop ];
			}

			// passing any value as a 4th parameter to .css will automatically
			// attempt a parseFloat and fallback to a string if the parse fails
			// so, simple values such as "10px" are parsed to Float.
			// complex values such as "rotate(1rad)" are returned as is.
			result = jQuery.css( tween.elem, tween.prop, false, "" );
			// Empty strings, null, undefined and "auto" are converted to 0.
			return !result || result === "auto" ? 0 : result;
		},
		set: function( tween ) {
			// use step hook for back compat - use cssHook if its there - use .style if its
			// available and use plain properties where available
			if ( jQuery.fx.step[ tween.prop ] ) {
				jQuery.fx.step[ tween.prop ]( tween );
			} else if ( tween.elem.style && ( tween.elem.style[ jQuery.cssProps[ tween.prop ] ] != null || jQuery.cssHooks[ tween.prop ] ) ) {
				jQuery.style( tween.elem, tween.prop, tween.now + tween.unit );
			} else {
				tween.elem[ tween.prop ] = tween.now;
			}
		}
	}
};

// Remove in 2.0 - this supports IE8's panic based approach
// to setting things on disconnected nodes

Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
	set: function( tween ) {
		if ( tween.elem.nodeType && tween.elem.parentNode ) {
			tween.elem[ tween.prop ] = tween.now;
		}
	}
};

jQuery.each([ "toggle", "show", "hide" ], function( i, name ) {
	var cssFn = jQuery.fn[ name ];
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return speed == null || typeof speed === "boolean" ||
			// special check for .toggle( handler, handler, ... )
			( !i && jQuery.isFunction( speed ) && jQuery.isFunction( easing ) ) ?
			cssFn.apply( this, arguments ) :
			this.animate( genFx( name, true ), speed, easing, callback );
	};
});

jQuery.fn.extend({
	fadeTo: function( speed, to, easing, callback ) {

		// show any hidden elements after setting opacity to 0
		return this.filter( isHidden ).css( "opacity", 0 ).show()

			// animate to the value specified
			.end().animate({ opacity: to }, speed, easing, callback );
	},
	animate: function( prop, speed, easing, callback ) {
		var empty = jQuery.isEmptyObject( prop ),
			optall = jQuery.speed( speed, easing, callback ),
			doAnimation = function() {
				// Operate on a copy of prop so per-property easing won't be lost
				var anim = Animation( this, jQuery.extend( {}, prop ), optall );

				// Empty animations resolve immediately
				if ( empty ) {
					anim.stop( true );
				}
			};

		return empty || optall.queue === false ?
			this.each( doAnimation ) :
			this.queue( optall.queue, doAnimation );
	},
	stop: function( type, clearQueue, gotoEnd ) {
		var stopQueue = function( hooks ) {
			var stop = hooks.stop;
			delete hooks.stop;
			stop( gotoEnd );
		};

		if ( typeof type !== "string" ) {
			gotoEnd = clearQueue;
			clearQueue = type;
			type = undefined;
		}
		if ( clearQueue && type !== false ) {
			this.queue( type || "fx", [] );
		}

		return this.each(function() {
			var dequeue = true,
				index = type != null && type + "queueHooks",
				timers = jQuery.timers,
				data = jQuery._data( this );

			if ( index ) {
				if ( data[ index ] && data[ index ].stop ) {
					stopQueue( data[ index ] );
				}
			} else {
				for ( index in data ) {
					if ( data[ index ] && data[ index ].stop && rrun.test( index ) ) {
						stopQueue( data[ index ] );
					}
				}
			}

			for ( index = timers.length; index--; ) {
				if ( timers[ index ].elem === this && (type == null || timers[ index ].queue === type) ) {
					timers[ index ].anim.stop( gotoEnd );
					dequeue = false;
					timers.splice( index, 1 );
				}
			}

			// start the next in the queue if the last step wasn't forced
			// timers currently will call their complete callbacks, which will dequeue
			// but only if they were gotoEnd
			if ( dequeue || !gotoEnd ) {
				jQuery.dequeue( this, type );
			}
		});
	}
});

// Generate parameters to create a standard animation
function genFx( type, includeWidth ) {
	var which,
		attrs = { height: type },
		i = 0;

	// if we include width, step value is 1 to do all cssExpand values,
	// if we don't include width, step value is 2 to skip over Left and Right
	includeWidth = includeWidth? 1 : 0;
	for( ; i < 4 ; i += 2 - includeWidth ) {
		which = cssExpand[ i ];
		attrs[ "margin" + which ] = attrs[ "padding" + which ] = type;
	}

	if ( includeWidth ) {
		attrs.opacity = attrs.width = type;
	}

	return attrs;
}

// Generate shortcuts for custom animations
jQuery.each({
	slideDown: genFx("show"),
	slideUp: genFx("hide"),
	slideToggle: genFx("toggle"),
	fadeIn: { opacity: "show" },
	fadeOut: { opacity: "hide" },
	fadeToggle: { opacity: "toggle" }
}, function( name, props ) {
	jQuery.fn[ name ] = function( speed, easing, callback ) {
		return this.animate( props, speed, easing, callback );
	};
});

jQuery.speed = function( speed, easing, fn ) {
	var opt = speed && typeof speed === "object" ? jQuery.extend( {}, speed ) : {
		complete: fn || !fn && easing ||
			jQuery.isFunction( speed ) && speed,
		duration: speed,
		easing: fn && easing || easing && !jQuery.isFunction( easing ) && easing
	};

	opt.duration = jQuery.fx.off ? 0 : typeof opt.duration === "number" ? opt.duration :
		opt.duration in jQuery.fx.speeds ? jQuery.fx.speeds[ opt.duration ] : jQuery.fx.speeds._default;

	// normalize opt.queue - true/undefined/null -> "fx"
	if ( opt.queue == null || opt.queue === true ) {
		opt.queue = "fx";
	}

	// Queueing
	opt.old = opt.complete;

	opt.complete = function() {
		if ( jQuery.isFunction( opt.old ) ) {
			opt.old.call( this );
		}

		if ( opt.queue ) {
			jQuery.dequeue( this, opt.queue );
		}
	};

	return opt;
};

jQuery.easing = {
	linear: function( p ) {
		return p;
	},
	swing: function( p ) {
		return 0.5 - Math.cos( p*Math.PI ) / 2;
	}
};

jQuery.timers = [];
jQuery.fx = Tween.prototype.init;
jQuery.fx.tick = function() {
	var timer,
		timers = jQuery.timers,
		i = 0;

	fxNow = jQuery.now();

	for ( ; i < timers.length; i++ ) {
		timer = timers[ i ];
		// Checks the timer has not already been removed
		if ( !timer() && timers[ i ] === timer ) {
			timers.splice( i--, 1 );
		}
	}

	if ( !timers.length ) {
		jQuery.fx.stop();
	}
	fxNow = undefined;
};

jQuery.fx.timer = function( timer ) {
	if ( timer() && jQuery.timers.push( timer ) && !timerId ) {
		timerId = setInterval( jQuery.fx.tick, jQuery.fx.interval );
	}
};

jQuery.fx.interval = 13;

jQuery.fx.stop = function() {
	clearInterval( timerId );
	timerId = null;
};

jQuery.fx.speeds = {
	slow: 600,
	fast: 200,
	// Default speed
	_default: 400
};

// Back Compat <1.8 extension point
jQuery.fx.step = {};

if ( jQuery.expr && jQuery.expr.filters ) {
	jQuery.expr.filters.animated = function( elem ) {
		return jQuery.grep(jQuery.timers, function( fn ) {
			return elem === fn.elem;
		}).length;
	};
}
var rroot = /^(?:body|html)$/i;

jQuery.fn.offset = function( options ) {
	if ( arguments.length ) {
		return options === undefined ?
			this :
			this.each(function( i ) {
				jQuery.offset.setOffset( this, options, i );
			});
	}

	var docElem, body, win, clientTop, clientLeft, scrollTop, scrollLeft,
		box = { top: 0, left: 0 },
		elem = this[ 0 ],
		doc = elem && elem.ownerDocument;

	if ( !doc ) {
		return;
	}

	if ( (body = doc.body) === elem ) {
		return jQuery.offset.bodyOffset( elem );
	}

	docElem = doc.documentElement;

	// Make sure it's not a disconnected DOM node
	if ( !jQuery.contains( docElem, elem ) ) {
		return box;
	}

	// If we don't have gBCR, just use 0,0 rather than error
	// BlackBerry 5, iOS 3 (original iPhone)
	if ( typeof elem.getBoundingClientRect !== "undefined" ) {
		box = elem.getBoundingClientRect();
	}
	win = getWindow( doc );
	clientTop  = docElem.clientTop  || body.clientTop  || 0;
	clientLeft = docElem.clientLeft || body.clientLeft || 0;
	scrollTop  = win.pageYOffset || docElem.scrollTop;
	scrollLeft = win.pageXOffset || docElem.scrollLeft;
	return {
		top: box.top  + scrollTop  - clientTop,
		left: box.left + scrollLeft - clientLeft
	};
};

jQuery.offset = {

	bodyOffset: function( body ) {
		var top = body.offsetTop,
			left = body.offsetLeft;

		if ( jQuery.support.doesNotIncludeMarginInBodyOffset ) {
			top  += parseFloat( jQuery.css(body, "marginTop") ) || 0;
			left += parseFloat( jQuery.css(body, "marginLeft") ) || 0;
		}

		return { top: top, left: left };
	},

	setOffset: function( elem, options, i ) {
		var position = jQuery.css( elem, "position" );

		// set position first, in-case top/left are set even on static elem
		if ( position === "static" ) {
			elem.style.position = "relative";
		}

		var curElem = jQuery( elem ),
			curOffset = curElem.offset(),
			curCSSTop = jQuery.css( elem, "top" ),
			curCSSLeft = jQuery.css( elem, "left" ),
			calculatePosition = ( position === "absolute" || position === "fixed" ) && jQuery.inArray("auto", [curCSSTop, curCSSLeft]) > -1,
			props = {}, curPosition = {}, curTop, curLeft;

		// need to be able to calculate position if either top or left is auto and position is either absolute or fixed
		if ( calculatePosition ) {
			curPosition = curElem.position();
			curTop = curPosition.top;
			curLeft = curPosition.left;
		} else {
			curTop = parseFloat( curCSSTop ) || 0;
			curLeft = parseFloat( curCSSLeft ) || 0;
		}

		if ( jQuery.isFunction( options ) ) {
			options = options.call( elem, i, curOffset );
		}

		if ( options.top != null ) {
			props.top = ( options.top - curOffset.top ) + curTop;
		}
		if ( options.left != null ) {
			props.left = ( options.left - curOffset.left ) + curLeft;
		}

		if ( "using" in options ) {
			options.using.call( elem, props );
		} else {
			curElem.css( props );
		}
	}
};


jQuery.fn.extend({

	position: function() {
		if ( !this[0] ) {
			return;
		}

		var elem = this[0],

		// Get *real* offsetParent
		offsetParent = this.offsetParent(),

		// Get correct offsets
		offset       = this.offset(),
		parentOffset = rroot.test(offsetParent[0].nodeName) ? { top: 0, left: 0 } : offsetParent.offset();

		// Subtract element margins
		// note: when an element has margin: auto the offsetLeft and marginLeft
		// are the same in Safari causing offset.left to incorrectly be 0
		offset.top  -= parseFloat( jQuery.css(elem, "marginTop") ) || 0;
		offset.left -= parseFloat( jQuery.css(elem, "marginLeft") ) || 0;

		// Add offsetParent borders
		parentOffset.top  += parseFloat( jQuery.css(offsetParent[0], "borderTopWidth") ) || 0;
		parentOffset.left += parseFloat( jQuery.css(offsetParent[0], "borderLeftWidth") ) || 0;

		// Subtract the two offsets
		return {
			top:  offset.top  - parentOffset.top,
			left: offset.left - parentOffset.left
		};
	},

	offsetParent: function() {
		return this.map(function() {
			var offsetParent = this.offsetParent || document.body;
			while ( offsetParent && (!rroot.test(offsetParent.nodeName) && jQuery.css(offsetParent, "position") === "static") ) {
				offsetParent = offsetParent.offsetParent;
			}
			return offsetParent || document.body;
		});
	}
});


// Create scrollLeft and scrollTop methods
jQuery.each( {scrollLeft: "pageXOffset", scrollTop: "pageYOffset"}, function( method, prop ) {
	var top = /Y/.test( prop );

	jQuery.fn[ method ] = function( val ) {
		return jQuery.access( this, function( elem, method, val ) {
			var win = getWindow( elem );

			if ( val === undefined ) {
				return win ? (prop in win) ? win[ prop ] :
					win.document.documentElement[ method ] :
					elem[ method ];
			}

			if ( win ) {
				win.scrollTo(
					!top ? val : jQuery( win ).scrollLeft(),
					 top ? val : jQuery( win ).scrollTop()
				);

			} else {
				elem[ method ] = val;
			}
		}, method, val, arguments.length, null );
	};
});

function getWindow( elem ) {
	return jQuery.isWindow( elem ) ?
		elem :
		elem.nodeType === 9 ?
			elem.defaultView || elem.parentWindow :
			false;
}
// Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods
jQuery.each( { Height: "height", Width: "width" }, function( name, type ) {
	jQuery.each( { padding: "inner" + name, content: type, "": "outer" + name }, function( defaultExtra, funcName ) {
		// margin is only for outerHeight, outerWidth
		jQuery.fn[ funcName ] = function( margin, value ) {
			var chainable = arguments.length && ( defaultExtra || typeof margin !== "boolean" ),
				extra = defaultExtra || ( margin === true || value === true ? "margin" : "border" );

			return jQuery.access( this, function( elem, type, value ) {
				var doc;

				if ( jQuery.isWindow( elem ) ) {
					// As of 5/8/2012 this will yield incorrect results for Mobile Safari, but there
					// isn't a whole lot we can do. See pull request at this URL for discussion:
					// https://github.com/jquery/jquery/pull/764
					return elem.document.documentElement[ "client" + name ];
				}

				// Get document width or height
				if ( elem.nodeType === 9 ) {
					doc = elem.documentElement;

					// Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height], whichever is greatest
					// unfortunately, this causes bug #3838 in IE6/8 only, but there is currently no good, small way to fix it.
					return Math.max(
						elem.body[ "scroll" + name ], doc[ "scroll" + name ],
						elem.body[ "offset" + name ], doc[ "offset" + name ],
						doc[ "client" + name ]
					);
				}

				return value === undefined ?
					// Get width or height on the element, requesting but not forcing parseFloat
					jQuery.css( elem, type, value, extra ) :

					// Set width or height on the element
					jQuery.style( elem, type, value, extra );
			}, type, chainable ? margin : undefined, chainable, null );
		};
	});
});
// Expose jQuery to the global object
window.jQuery = window.$ = jQuery;

// Expose jQuery as an AMD module, but only for AMD loaders that
// understand the issues with loading multiple versions of jQuery
// in a page that all might call define(). The loader will indicate
// they have special allowances for multiple jQuery versions by
// specifying define.amd.jQuery = true. Register as a named module,
// since jQuery can be concatenated with other files that may use define,
// but not use a proper concatenation script that understands anonymous
// AMD modules. A named AMD is safest and most robust way to register.
// Lowercase jquery is used because AMD module names are derived from
// file names, and jQuery is normally delivered in a lowercase file name.
// Do this after creating the global so that if an AMD module wants to call
// noConflict to hide this version of jQuery, it will work.
if ( typeof define === "function" && define.amd && define.amd.jQuery ) {
	define( "jquery", [], function () { return jQuery; } );
}

})( window );

var HazmatBuilder = function(_,root) {
  // Actual Hazmat Code
  // top level module
  var Hazmat  = function(config) {
    this.config = config || {};
    if(!_.isObject(this.config)) {
      throw new Error('Hazmat is not initialized properly');
    }
    this.fail = _.isFunction(this.config.fail) ? this.config.fail : Hazmat.fail;
    this.warn = _.isFunction(this.config.warn) ? this.config.warn : Hazmat.warn;
    this.log = _.isFunction(this.config.log) ? this.config.log : Hazmat.log;
  };

  _.extend(Hazmat, {

    // constants
    ID_REGEX : /^[\_\-A-Za-z0-9]+$/,

    // factory
    create : function(config) {
      return new Hazmat(config);
    },

    // noConflict
    noConflict : function() {
      root.Hazmat = Hazmat.original;
      return Hazmat;
    },

    // default log function
    log : function() {
      if(window.console && _.isFunction(window.console.log)) {
        window.console.log.apply(window.console, arguments);
      }
    },

    // default fail function
    fail : function(_reason, _data) {
      var reason = _reason || "", data = _data || {};
      Hazmat.log('Hazmat Failure::', reason, data);
      throw new Error('Hazmat Failure '+reason.toString());
    },

    // default warn function
    warn : function(_reason, _data) {
      var reason = _reason || "", data = _data || {};
      Hazmat.log('Hazmat Warning::', reason, data);
    },

    // global fixers
    fixDomId : function(_value) {
      if(_.isString(_value) && _value.length > 0) {
        return _value.replace(/[^A-Za-z0-9\_]/g,'');
      } else {
        return null;
      }
    },

    // global testers
    isDomId : function(value) {
      return _.isString(value) && value.match(Hazmat.ID_REGEX);
    },


    __placeholder : true
  });

  _.extend(Hazmat.prototype, {
    _safeValue : function(name, value, fallback, type) {
      // make fallback safe and eat exceptions
      var _fallback = fallback;
      if(_.isFunction(fallback)) {
        fallback = _.once(function() {
          try {
            return _fallback.apply(this, arguments);
          } catch(e) {
          }
        });
      }

      if(type.checker(value)) {
        return value;
      } else if(type.evalFallback && _.isFunction(fallback) && type.checker(fallback(value))){
        this.warn('Expected valid '+type.name+' for '+name+' but was able to sanitize it:', [value, fallback(value)]);
        return fallback(value);
      } else if(type.checker(_fallback)){
        this.warn('Expected valid '+type.name+' for '+name+' but was able to fallback to default value:', [value, _fallback]);
        return _fallback;
      } else {
        this.fail('Expected valid '+type.name+' for '+name+' but received:', value);
      }
    },

    safeString : function(name, value, fallback) {
      return this._safeValue(name, value, fallback, {name: 'String', checker: _.isString, evalFallback:true});
    },

    safeStringOrNull : function(name, value, fallback) {
      if(value == null) {
        return value;
      } else {
        return this._safeValue(name, value, fallback, {name: 'String', checker: _.isString, evalFallback:true});
      }
    },

    safeDomId : function(name, value, fallback) {
      return this._safeValue(name, value, fallback, {name: 'DOM ID', checker: Hazmat.isDomId, evalFallback:true});
    },

    safeFunction : function(name, value, fallback) {
      return this._safeValue(name, value, fallback, {name: 'Function', checker: _.isFunction, evalFallback:false});
    },

    safeFunctionOrNull : function(name, value, fallback) {
      if(value == null) {
        return value;
      } else {
        return this._safeValue(name, value, fallback, {name: 'Function', checker: _.isFunction, evalFallback:false});
      }
    },

    safeObject : function(name, value, fallback) {
      return this._safeValue(name, value, fallback, {name: 'Object', checker: _.isObject, evalFallback:false});
    },

    safeObjectOrNull : function(name, value, fallback) {
      if(value == null) {
        return value;
      } else {
        return this._safeValue(name, value, fallback, {name: 'Object', checker: _.isObject, evalFallback:false});
      }
    },
    
    safeArray : function(name, value, fallback) {
      return this._safeValue(name, value, fallback, {name: 'Array', checker: _.isArray, evalFallback:false});
    },
    
    safeArrayOfElements : function(name, value, elementValidator, fallback) {
      var safeArray = this._safeValue(name, value, fallback, {name: 'Array', checker: _.isArray, evalFallback:false});
      return _.map(safeArray, elementValidator);
    },

    __placeholder:true
  });

  return Hazmat;
};

// Integration with Node.js/Browser
if(typeof window !== 'undefined' && typeof window._ !== 'undefined') {
  var hazmat = HazmatBuilder(window._, window);
  hazmat.original = window.Hazmat;
  window.Hazmat = hazmat;
} else {
  var _ = require('underscore');
  var hazmat = HazmatBuilder(_);
  _.extend(exports,hazmat);
}

/* A JavaScript implementation of the SHA family of hashes, as defined in FIPS
 * PUB 180-2 as well as the corresponding HMAC implementation as defined in
 * FIPS PUB 198a
 *
 * Version 1.31 Copyright Brian Turek 2008-2012
 * Distributed under the BSD License
 * See http://caligatio.github.com/jsSHA/ for more information
 *
 * Several functions taken from Paul Johnson
 */
(function ()
{
	var charSize = 8,
	b64pad = "",
	hexCase = 0,

	str2binb = function (str)
	{
		var bin = [], mask = (1 << charSize) - 1,
			length = str.length * charSize, i;

		for (i = 0; i < length; i += charSize)
		{
			bin[i >> 5] |= (str.charCodeAt(i / charSize) & mask) <<
				(32 - charSize - (i % 32));
		}

		return bin;
	},

	hex2binb = function (str)
	{
		var bin = [], length = str.length, i, num;

		for (i = 0; i < length; i += 2)
		{
			num = parseInt(str.substr(i, 2), 16);
			if (!isNaN(num))
			{
				bin[i >> 3] |= num << (24 - (4 * (i % 8)));
			}
			else
			{
				return "INVALID HEX STRING";
			}
		}

		return bin;
	},

	binb2hex = function (binarray)
	{
		var hex_tab = (hexCase) ? "0123456789ABCDEF" : "0123456789abcdef",
			str = "", length = binarray.length * 4, i, srcByte;

		for (i = 0; i < length; i += 1)
		{
			srcByte = binarray[i >> 2] >> ((3 - (i % 4)) * 8);
			str += hex_tab.charAt((srcByte >> 4) & 0xF) +
				hex_tab.charAt(srcByte & 0xF);
		}

		return str;
	},

	binb2b64 = function (binarray)
	{
		var tab = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" +
			"0123456789+/", str = "", length = binarray.length * 4, i, j,
			triplet;

		for (i = 0; i < length; i += 3)
		{
			triplet = (((binarray[i >> 2] >> 8 * (3 - i % 4)) & 0xFF) << 16) |
				(((binarray[i + 1 >> 2] >> 8 * (3 - (i + 1) % 4)) & 0xFF) << 8) |
				((binarray[i + 2 >> 2] >> 8 * (3 - (i + 2) % 4)) & 0xFF);
			for (j = 0; j < 4; j += 1)
			{
				if (i * 8 + j * 6 <= binarray.length * 32)
				{
					str += tab.charAt((triplet >> 6 * (3 - j)) & 0x3F);
				}
				else
				{
					str += b64pad;
				}
			}
		}
		return str;
	},

	rotr = function (x, n)
	{
		return (x >>> n) | (x << (32 - n));
	},

	shr = function (x, n)
	{
		return x >>> n;
	},

	ch = function (x, y, z)
	{
		return (x & y) ^ (~x & z);
	},

	maj = function (x, y, z)
	{
		return (x & y) ^ (x & z) ^ (y & z);
	},

	sigma0 = function (x)
	{
		return rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22);
	},

	sigma1 = function (x)
	{
		return rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25);
	},

	gamma0 = function (x)
	{
		return rotr(x, 7) ^ rotr(x, 18) ^ shr(x, 3);
	},

	gamma1 = function (x)
	{
		return rotr(x, 17) ^ rotr(x, 19) ^ shr(x, 10);
	},

	safeAdd_2 = function (x, y)
	{
		var lsw = (x & 0xFFFF) + (y & 0xFFFF),
			msw = (x >>> 16) + (y >>> 16) + (lsw >>> 16);

		return ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
	},

	safeAdd_4 = function (a, b, c, d)
	{
		var lsw = (a & 0xFFFF) + (b & 0xFFFF) + (c & 0xFFFF) + (d & 0xFFFF),
			msw = (a >>> 16) + (b >>> 16) + (c >>> 16) + (d >>> 16) +
				(lsw >>> 16);

		return ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
	},

	safeAdd_5 = function (a, b, c, d, e)
	{
		var lsw = (a & 0xFFFF) + (b & 0xFFFF) + (c & 0xFFFF) + (d & 0xFFFF) +
				(e & 0xFFFF),
			msw = (a >>> 16) + (b >>> 16) + (c >>> 16) + (d >>> 16) +
				(e >>> 16) + (lsw >>> 16);

		return ((msw & 0xFFFF) << 16) | (lsw & 0xFFFF);
	},

	coreSHA2 = function (message, messageLen, variant)
	{
		var a, b, c, d, e, f, g, h, T1, T2, H, lengthPosition, i, t, K, W = [],
			appendedMessageLength;

		if (variant === "SHA-224" || variant === "SHA-256")
		{
			lengthPosition = (((messageLen + 65) >> 9) << 4) + 15;
			K = [
					0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5,
					0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5,
					0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3,
					0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174,
					0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC,
					0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA,
					0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7,
					0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967,
					0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13,
					0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85,
					0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3,
					0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070,
					0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5,
					0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3,
					0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208,
					0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2
				];

			if (variant === "SHA-224")
			{
				H = [
						0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
						0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
					];
			}
			else
			{
				H = [
						0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A,
						0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19
					];
			}
		}

		message[messageLen >> 5] |= 0x80 << (24 - messageLen % 32);
		message[lengthPosition] = messageLen;

		appendedMessageLength = message.length;

		for (i = 0; i < appendedMessageLength; i += 16)
		{
			a = H[0];
			b = H[1];
			c = H[2];
			d = H[3];
			e = H[4];
			f = H[5];
			g = H[6];
			h = H[7];

			for (t = 0; t < 64; t += 1)
			{
				if (t < 16)
				{
					W[t] = message[t + i];
				}
				else
				{
					W[t] = safeAdd_4(
							gamma1(W[t - 2]), W[t - 7],
							gamma0(W[t - 15]), W[t - 16]
						);
				}

				T1 = safeAdd_5(h, sigma1(e), ch(e, f, g), K[t], W[t]);
				T2 = safeAdd_2(sigma0(a), maj(a, b, c));
				h = g;
				g = f;
				f = e;
				e = safeAdd_2(d, T1);
				d = c;
				c = b;
				b = a;
				a = safeAdd_2(T1, T2);
			}

			H[0] = safeAdd_2(a, H[0]);
			H[1] = safeAdd_2(b, H[1]);
			H[2] = safeAdd_2(c, H[2]);
			H[3] = safeAdd_2(d, H[3]);
			H[4] = safeAdd_2(e, H[4]);
			H[5] = safeAdd_2(f, H[5]);
			H[6] = safeAdd_2(g, H[6]);
			H[7] = safeAdd_2(h, H[7]);
		}

		switch (variant)
		{
		case "SHA-224":
			return [
				H[0], H[1], H[2], H[3],
				H[4], H[5], H[6]
			];
		case "SHA-256":
			return H;
		default:
			return [];
		}
	},

	jsSHA = function (srcString, inputFormat)
	{

		this.sha224 = null;
		this.sha256 = null;

		this.strBinLen = null;
		this.strToHash = null;

		if ("HEX" === inputFormat)
		{
			if (0 !== (srcString.length % 2))
			{
				return "TEXT MUST BE IN BYTE INCREMENTS";
			}
			this.strBinLen = srcString.length * 4;
			this.strToHash = hex2binb(srcString);
		}
		else if (("ASCII" === inputFormat) ||
			 ('undefined' === typeof(inputFormat)))
		{
			this.strBinLen = srcString.length * charSize;
			this.strToHash = str2binb(srcString);
		}
		else
		{
			return "UNKNOWN TEXT INPUT TYPE";
		}
	};

	jsSHA.prototype = {
		getHash : function (variant, format)
		{
			var formatFunc = null, message = this.strToHash.slice();

			switch (format)
			{
			case "HEX":
				formatFunc = binb2hex;
				break;
			case "B64":
				formatFunc = binb2b64;
				break;
			default:
				return "FORMAT NOT RECOGNIZED";
			}

			switch (variant)
			{
			case "SHA-224":
				if (null === this.sha224)
				{
					this.sha224 = coreSHA2(message, this.strBinLen, variant);
				}
				return formatFunc(this.sha224);
			case "SHA-256":
				if (null === this.sha256)
				{
					this.sha256 = coreSHA2(message, this.strBinLen, variant);
				}
				return formatFunc(this.sha256);
			default:
				return "HASH NOT RECOGNIZED";
			}
		},

		getHMAC : function (key, inputFormat, variant, outputFormat)
		{
			var formatFunc, keyToUse, i, retVal, keyBinLen, hashBitSize,
				keyWithIPad = [], keyWithOPad = [];

			switch (outputFormat)
			{
			case "HEX":
				formatFunc = binb2hex;
				break;
			case "B64":
				formatFunc = binb2b64;
				break;
			default:
				return "FORMAT NOT RECOGNIZED";
			}

			switch (variant)
			{
			case "SHA-224":
				hashBitSize = 224;
				break;
			case "SHA-256":
				hashBitSize = 256;
				break;
			default:
				return "HASH NOT RECOGNIZED";
			}

			if ("HEX" === inputFormat)
			{
				if (0 !== (key.length % 2))
				{
					return "KEY MUST BE IN BYTE INCREMENTS";
				}
				keyToUse = hex2binb(key);
				keyBinLen = key.length * 4;
			}
			else if ("ASCII" === inputFormat)
			{
				keyToUse = str2binb(key);
				keyBinLen = key.length * charSize;
			}
			else
			{
				return "UNKNOWN KEY INPUT TYPE";
			}

			if (64 < (keyBinLen / 8))
			{
				keyToUse = coreSHA2(keyToUse, keyBinLen, variant);
				keyToUse[15] &= 0xFFFFFF00;
			}
			else if (64 > (keyBinLen / 8))
			{
				keyToUse[15] &= 0xFFFFFF00;
			}

			for (i = 0; i <= 15; i += 1)
			{
				keyWithIPad[i] = keyToUse[i] ^ 0x36363636;
				keyWithOPad[i] = keyToUse[i] ^ 0x5C5C5C5C;
			}

			retVal = coreSHA2(
						keyWithIPad.concat(this.strToHash),
						512 + this.strBinLen, variant);
			retVal = coreSHA2(
						keyWithOPad.concat(retVal),
						512 + hashBitSize, variant);

			return (formatFunc(retVal));
		}
	};

	window.jsSHA = jsSHA;
}());

window.LZW = {
  // LZW-compress a string
  encode: function (s) {
      var dict = {};
      var data = (s + "").split("");
      var out = [];
      var currChar;
      var phrase = data[0];
      var code = 256;
      for (var i=1; i<data.length; i++) {
          currChar=data[i];
          if (dict[phrase + currChar] != null) {
              phrase += currChar;
          }
          else {
              out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
              dict[phrase + currChar] = code;
              code++;
              phrase=currChar;
          }
      }
      out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
      for (var i=0; i<out.length; i++) {
          out[i] = String.fromCharCode(out[i]);
      }
      return out.join("");
  },

  // Decompress an LZW-encoded string
  decode: function (s) {
      var dict = {};
      var data = (s + "").split("");
      var currChar = data[0];
      var oldPhrase = currChar;
      var out = [currChar];
      var code = 256;
      var phrase;
      for (var i=1; i<data.length; i++) {
          var currCode = data[i].charCodeAt(0);
          if (currCode < 256) {
              phrase = data[i];
          }
          else {
             phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
          }
          out.push(phrase);
          currChar = phrase.charAt(0);
          dict[code] = oldPhrase + currChar;
          code++;
          oldPhrase = phrase;
      }
      return out.join("");
  }

};
/* base64 encode/decode compatible with window.btoa/atob
 *
 * window.atob/btoa is a Firefox extension to convert binary data (the "b")
 * to base64 (ascii, the "a").
 *
 * It is also found in Safari and Chrome.  It is not available in IE.
 *
 * if (!window.btoa) window.btoa = base64.encode
 * if (!window.atob) window.atob = base64.decode
 *
 * The original spec's for atob/btoa are a bit lacking
 * https://developer.mozilla.org/en/DOM/window.atob
 * https://developer.mozilla.org/en/DOM/window.btoa
 *
 * window.btoa and base64.encode takes a string where charCodeAt is [0,255]
 * If any character is not [0,255], then an DOMException(5) is thrown.
 *
 * window.atob and base64.decode take a base64-encoded string
 * If the input length is not a multiple of 4, or contains invalid characters
 *   then an DOMException(5) is thrown.
 */

(function () {
  var base64 = {};
  base64.PADCHAR = '=';
  base64.ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

  base64.makeDOMException = function() {
    // sadly in FF,Safari,Chrome you can't make a DOMException
    var e, tmp;

    try {
      return new DOMException(DOMException.INVALID_CHARACTER_ERR);
    } catch (tmp) {
      // not available, just passback a duck-typed equiv
      // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Error
      // https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Error/prototype
      var ex = new Error("DOM Exception 5");

      // ex.number and ex.description is IE-specific.
      ex.code = ex.number = 5;
      ex.name = ex.description = "INVALID_CHARACTER_ERR";

      // Safari/Chrome output format
      ex.toString = function() { return 'Error: ' + ex.name + ': ' + ex.message; };
      return ex;
    }
  }

  base64.getbyte64 = function(s,i) {
    // This is oddly fast, except on Chrome/V8.
    //  Minimal or no improvement in performance by using a
    //   object with properties mapping chars to value (eg. 'A': 0)
    var idx = base64.ALPHA.indexOf(s.charAt(i));
    if (idx === -1) {
      throw base64.makeDOMException();
    }
    return idx;
  }

  base64.decode = function(s) {
    // convert to string
    s = '' + s;
    var getbyte64 = base64.getbyte64;
    var pads, i, b10;
    var imax = s.length
    if (imax === 0) {
      return s;
    }

    if (imax % 4 !== 0) {
      throw base64.makeDOMException();
    }

    pads = 0
    if (s.charAt(imax - 1) === base64.PADCHAR) {
      pads = 1;
      if (s.charAt(imax - 2) === base64.PADCHAR) {
        pads = 2;
      }
      // either way, we want to ignore this last block
      imax -= 4;
    }

    var x = [];
    for (i = 0; i < imax; i += 4) {
      b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) |
      (getbyte64(s,i+2) << 6) | getbyte64(s,i+3);
      x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff, b10 & 0xff));
    }

    switch (pads) {
      case 1:
        b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12) | (getbyte64(s,i+2) << 6);
        x.push(String.fromCharCode(b10 >> 16, (b10 >> 8) & 0xff));
        break;
      case 2:
        b10 = (getbyte64(s,i) << 18) | (getbyte64(s,i+1) << 12);
        x.push(String.fromCharCode(b10 >> 16));
        break;
    }
    return x.join('');
  }

  base64.getbyte = function(s,i) {
    var x = s.charCodeAt(i);
    if (x > 255) {
      throw base64.makeDOMException();
    }
    return x;
  }

  base64.encode = function(s) {
    if (arguments.length !== 1) {
      throw new SyntaxError("Not enough arguments");
    }
    var padchar = base64.PADCHAR;
    var alpha   = base64.ALPHA;
    var getbyte = base64.getbyte;

    var i, b10;
    var x = [];

    // convert to string
    s = '' + s;

    var imax = s.length - s.length % 3;

    if (s.length === 0) {
      return s;
    }
    for (i = 0; i < imax; i += 3) {
      b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8) | getbyte(s,i+2);
      x.push(alpha.charAt(b10 >> 18));
      x.push(alpha.charAt((b10 >> 12) & 0x3F));
      x.push(alpha.charAt((b10 >> 6) & 0x3f));
      x.push(alpha.charAt(b10 & 0x3f));
    }
    switch (s.length - imax) {
      case 1:
        b10 = getbyte(s,i) << 16;
        x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
        padchar + padchar);
        break;
      case 2:
        b10 = (getbyte(s,i) << 16) | (getbyte(s,i+1) << 8);
        x.push(alpha.charAt(b10 >> 18) + alpha.charAt((b10 >> 12) & 0x3F) +
        alpha.charAt((b10 >> 6) & 0x3f) + padchar);
        break;
    }
    return x.join('');
  }

  window.base64 = base64;
}());

  (function(OO) {
    // Resolve all 3rd parties conflicts
    // Beyond this point we can use OO._ for underscore and OO.$ for zepto
    OO._ = window._.noConflict();
    OO.$ = window.$.noConflict(true);

    var hazmatConfig = {};
    // 'debugHazmat' flag needs to be set before plugins are loaded. If we added
    // this flag to the OO namespace, it would be overriden during plugin initalization,
    // so we need to use a global var instead
    if (!window.debugHazmat) {
      hazmatConfig = {
        warn: function() { return; }
      };
    }

    OO.HM = window.Hazmat.noConflict().create(hazmatConfig);

    OO.jsSHA = window.jsSHA;

    OO.LZW = window.LZW;

    if(!window.console || !window.console.log) {
      window.console = window.console || {};
      window.console.log = function() {};
    }

  }(OO));

  (function(OO,_,HM) {
    // Ensure playerParams exists
    OO.playerParams = HM.safeObject('environment.playerParams', OO.playerParams,{});

    // Init publisher's OO.playerParams via player parameter object
    OO.configurePublisher = function(parameters) {
      OO.playerParams.pcode = parameters.pcode || OO.playerParams.pcode || '';
      OO.playerParams.playerBrandingId = parameters.playerBrandingId || OO.playerParams.playerBrandingId || '';
      OO.playerParams.debug = parameters.debug || OO.playerParams.debug || '';
    };

    OO.isPublisherConfigured = function() {
      return !!(OO.playerParams.pcode && OO.playerParams.playerBrandingId);
    };

    // Set API end point environment
    OO.setServerHost = function(parameters) {
      OO.playerParams.api_ssl_server = parameters.api_ssl_server || OO.playerParams.api_ssl_server || null;
      OO.playerParams.api_server = parameters.api_server || OO.playerParams.api_server || null;
      OO.playerParams.auth_ssl_server = parameters.auth_ssl_server || OO.playerParams.auth_ssl_server || null;
      OO.playerParams.auth_server = parameters.auth_server || OO.playerParams.auth_server || null;
      OO.playerParams.analytics_ssl_server = parameters.analytics_ssl_server || OO.playerParams.analytics_ssl_server || null;
      OO.playerParams.analytics_server = parameters.analytics_server || OO.playerParams.analytics_server || null;

      updateServerHost();
    };

    var updateServerHost = function () {
      OO.SERVER =
      {
        API: OO.isSSL ? OO.playerParams.api_ssl_server || "https://player.ooyala.com" :
                        OO.playerParams.api_server || "http://player.ooyala.com",
        AUTH: OO.isSSL ? OO.playerParams.auth_ssl_server || "https://player.ooyala.com/sas" :
                        OO.playerParams.auth_server || "http://player.ooyala.com/sas",
        ANALYTICS: OO.isSSL ? OO.playerParams.analytics_ssl_server || "https://player.ooyala.com" :
                              OO.playerParams.analytics_server || "http://player.ooyala.com"
      };
    }

    // process tweaks
    // tweaks is optional. Hazmat takes care of this but throws an undesirable warning.
    OO.playerParams.tweaks = OO.playerParams.tweaks || '';
    OO.playerParams.tweaks = HM.safeString('environment.playerParams.tweaks', OO.playerParams.tweaks,'');
    OO.playerParams.tweaks = OO.playerParams.tweaks.split(',');

    // explicit list of supported tweaks
    OO.tweaks = {};
    OO.tweaks["android-enable-hls"] = _.contains(OO.playerParams.tweaks, 'android-enable-hls');
    OO.tweaks["html5-force-mp4"] = _.contains(OO.playerParams.tweaks, 'html5-force-mp4');

    // Max timeout for fetching ads metadata, default to 3 seconds.
    OO.playerParams.maxAdsTimeout = OO.playerParams.maxAdsTimeout || 5;
    // max wrapper ads depth we look, we will only look up to 3 level until we get vast inline ads
    OO.playerParams.maxVastWrapperDepth = OO.playerParams.maxVastWrapperDepth || 3;
    OO.playerParams.minLiveSeekWindow = OO.playerParams.minLiveSeekWindow || 10;

    // Ripped from: http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
    OO.guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
      return v.toString(16);
    });
    OO.playerCount = 0;

    // Check environment to see if this is prod
    OO.isProd = !!(OO.playerParams.environment &&
                   OO.playerParams.environment.match(/^prod/i));

    // Environment invariant.
    OO.platform = window.navigator.platform;
    OO.os = window.navigator.appVersion;
    OO.supportsVideo = !!document.createElement('video').canPlayType;

    OO.browserSupportsCors = (function() {
      try {
        return _.has(new XMLHttpRequest(), "withCredentials") ||
          _.has(XMLHttpRequest.prototype, "withCredentials");
      } catch(e) {
        return false;
      }
    }());

    OO.isWindows = (function() {
      return !!OO.platform.match(/Win/);
    }());

    OO.isIos = (function() {
      return !!OO.platform.match(/iPhone|iPad|iPod/);
    }());

    OO.isIphone = (function() {
      return !!OO.platform.match(/iPhone|iPod/);
    }());

    OO.isIpad = (function() {
      return !!OO.platform.match(/iPad/);
    }());

    OO.iosMajorVersion = (function() {
      try {
        if (OO.isIos) {
          return parseInt(window.navigator.userAgent.match(/OS (\d+)/)[1], 10);
        } else {
          return null;
        }
      } catch(err) {
        return null;
      }
    }());

    OO.isAndroid = (function() {
      return !!(OO.os.match(/Android/) && !OO.os.match(/Windows Phone/));
    }());

    OO.isAndroid4Plus = (function() {
      var version = OO.os.match(/Android [\d\.]*;/);
      if (version && version.length > 0) {
        version = parseInt(version[0].substring(version[0].indexOf(' ') + 1,
                           version[0].search('[\.\;]')));
      }
      return OO.isAndroid && version >= 4;
    }());

    OO.isRimDevice = (function() {
      return !!(OO.os.match(/BlackBerry/) || OO.os.match(/PlayBook/));
    }());

    OO.isFirefox = (function() {
      return !!window.navigator.userAgent.match(/Firefox/);
    }());

    OO.isChrome = (function () {
      return (!!window.navigator.userAgent.match(/Chrome/) && !window.navigator.userAgent.match(/Edge/));
    }());

    OO.isSafari = (function () {
      return (!!window.navigator.userAgent.match(/AppleWebKit/) &&
              !window.navigator.userAgent.match(/Chrome/) &&
              !window.navigator.userAgent.match(/like iPhone/));
    }());

    OO.chromeMajorVersion = (function () {
      try {
        return parseInt(window.navigator.userAgent.match(/Chrome.([0-9]*)/)[1], 10);
      } catch(err) {
        return null;
      }
    }());

    OO.isIE = (function(){
      return !!window.navigator.userAgent.match(/MSIE/) || !!window.navigator.userAgent.match(/Trident/);
    }());

    OO.isEdge = (function(){
      return !!window.navigator.userAgent.match(/Edge/);
    }());

    OO.isIE11Plus = (function(){
      // check if IE
      if (!window.navigator.userAgent.match(/Trident/)) {
        return false;
      }

      // extract version number
      var ieVersionMatch = window.navigator.userAgent.match(/rv:(\d*)/);
      var ieVersion = ieVersionMatch && ieVersionMatch[1];
      return ieVersion >= 11;
    }());

    OO.isWinPhone = (function(){
      return !!OO.os.match(/Windows Phone/) || !!OO.os.match(/ZuneWP/) || !!OO.os.match(/XBLWP/);
    }());

    OO.isSmartTV = (function(){
      return (!!window.navigator.userAgent.match(/SmartTV/) ||
             !!window.navigator.userAgent.match(/NetCast/));
    }());

    OO.isMacOs = (function() {
      return !OO.isIos && !!OO.os.match(/Mac/) && !window.navigator.userAgent.match(/like iPhone/);
    }());

    OO.isMacOsLionOrLater = (function() {
      // TODO: revisit for Firefox when possible/necessary
      var macOs = OO.os.match(/Mac OS X ([0-9]+)_([0-9]+)/);
      if (macOs == null || macOs.length < 3) { return false; }
      return (parseInt(macOs[1],10) >= 10 && parseInt(macOs[2],10) >= 7);
    }());

    OO.isKindleHD = (function(){
      return !!OO.os.match(/Silk\/2/);
    }());

    OO.supportAds = (function() {
      // We are disabling ads for Android 2/3 device, the reason is that main video is not resuming after
      // ads finish. Util we can figure out a work around, we will keep ads disabled.
      return !OO.isWinPhone && !OO.os.match(/Android [23]/);
    }());

    OO.allowGesture = (function() {
      return OO.isIos;
    }());

    OO.allowAutoPlay = (function() {
      return !OO.isIos && !OO.isAndroid;
    }());

    OO.supportTouch = (function() {
      // IE8- doesn't support JS functions on DOM elements
      if (document.documentElement.hasOwnProperty && document.documentElement.hasOwnProperty("ontouchstart")) { return true; }
      return false;
    }());

    OO.docDomain = (function() {
      var domain = null;
      try {
        domain = document.domain;
      } catch(e) {}
      if (!OO._.isEmpty(domain)) { return domain; }
      if (OO.isSmartTV) { return 'SmartTV'; }
      return 'unknown';
    }());

    OO.uiParadigm = (function() {
      var paradigm = 'tablet';

      // The below code attempts to decide whether or not we are running in 'mobile' mode
      // Meaning that no controls are displayed, chrome is minimized and only fullscreen playback is allowed
      // Unfortunately there is no clean way to figure out whether the device is tablet or phone
      // or even to properly detect device screen size http://tripleodeon.com/2011/12/first-understand-your-screen/
      // So there is a bunch of heuristics for doing just that
      // Anything that is not explicitly detected as mobile defaults to desktop
      // so worst case they get ugly chrome instead of unworking player
      if(OO.isAndroid4Plus && OO.tweaks["android-enable-hls"]) {
        // special case for Android 4+ running HLS
        paradigm = 'tablet';
      } else if(OO.isIphone) {
        paradigm = 'mobile-native';
      } else if(OO.os.match(/BlackBerry/)) {
        paradigm = 'mobile-native';
      } else if(OO.os.match(/iPad/)) {
        paradigm = 'tablet';
      } else if(OO.isKindleHD) {
        // Kindle Fire HD
        paradigm = 'mobile-native';
      } else if(OO.os.match(/Silk/)) {
        // Kindle Fire
        paradigm = 'mobile';
      } else if(OO.os.match(/Android 2/)) {
        // On Android 2+ only window.outerWidth is reliable, so we are using that and window.orientation
        if((window.orientation % 180) == 0 &&  (window.outerWidth / window.devicePixelRatio) <= 480 ) {
          // portrait mode
          paradigm = 'mobile';
        } else if((window.outerWidth / window.devicePixelRatio) <= 560 ) {
          // landscape mode
          paradigm = 'mobile';
        }
      } else if(OO.os.match(/Android/)) {
          paradigm = 'tablet';
      } else if (OO.isWinPhone) {
        // Windows Phone is mobile only for now, tablets not yet released
        paradigm = 'mobile';
      } else if(!!OO.platform.match(/Mac/)    // Macs
                || !!OO.platform.match(/Win/)  // Winboxes
                || !!OO.platform.match(/Linux/)) {    // Linux
        paradigm = 'desktop';
      }

      return paradigm;
    }());

    /**
     * Determines if a single video element should be used.<br/>
     * <ul><li>Use single video element on iOS, all versions</li>
     *     <li>Use single video element on Android < v4.0</li>
     *     <li>Use single video element on Android with Chrome < v40<br/>
     *       (note, it might work on earlier versions but don't know which ones! Does not work on v18)</li>
     * @private
     * @returns {boolean} True if a single video element is required
     */
    OO.requiresSingleVideoElement = (function() {
      var iosRequireSingleElement = OO.isIos;
      var androidRequireSingleElement = OO.isAndroid && (!OO.isAndroid4Plus || OO.chromeMajorVersion < 40);
      return iosRequireSingleElement || androidRequireSingleElement;
    }());

    // TODO(jj): need to make this more comprehensive
    // Note(jj): only applies to mp4 videos for now
    OO.supportedVideoProfiles = (function() {
      // iOS only supports baseline profile
      if (OO.isIos || OO.isAndroid) {
        return "baseline";
      }
      return null;
    }());

    // TODO(bz): add flash for device when we decide to use stream data from sas
    // TODO(jj): add AppleTV and other devices as necessary
    OO.device = (function() {
        var device = 'html5';
        if (OO.isIphone) { device = 'iphone-html5'; }
        else if (OO.isIpad) { device = 'ipad-html5'; }
        else if (OO.isAndroid) { device = 'android-html5'; }
        else if (OO.isRimDevice) { device = 'rim-html5'; }
        else if (OO.isWinPhone) { device = 'winphone-html5'; }
        else if (OO.isSmartTV) { device = 'smarttv-html5'; }
        return device;
    }());

    // list of environment-specific modules needed by the environment or empty to include all
    // Note: should never be empty because of html5
    OO.environmentRequiredFeatures = (function(){
      var features = [];

      if (OO.os.match(/Android 2/)) {  // safari android
        features.push('html5-playback');
      } else { // normal html5
        features.push('html5-playback');
        if (OO.supportAds) { features.push('ads'); }
      }

      return _.reduce(features, function(memo, feature) {return memo+feature+' ';}, '');
    }());

    OO.supportMidRollAds = (function() {
      return (OO.uiParadigm === "desktop" && !OO.isIos && !OO.isRimDevice);
    }());

    OO.supportCookies = (function() {
      document.cookie = "ooyala_cookie_test=true";
      var cookiesSupported = document.cookie.indexOf("ooyala_cookie_test=true") >= 0;
      document.cookie = "ooyala_cookie_test=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      return cookiesSupported;
    }());

    OO.isSSL = document.location.protocol == "https:";

    updateServerHost();

    // returns true iff environment-specific feature is required to run in current environment
    OO.requiredInEnvironment = OO.featureEnabled = function(feature) {
      return !!OO.environmentRequiredFeatures.match(new RegExp(feature));
    };

    // Detect Chrome Extension. We will recieve an acknowledgement from the content script, which will prompt us to start sending logs
    OO.chromeExtensionEnabled = document.getElementById('ooyala-extension-installed') ? true : false;

    // Locale Getter and Setter
    OO.locale = "";
    OO.setLocale = function(locale) {
      OO.locale = locale.toUpperCase();
    };
    OO.getLocale = function() {
      return (OO.locale || document.documentElement.lang || navigator.language ||
              navigator.userLanguage || "en").substr(0,2).toUpperCase();
    };
  }(OO, OO._, OO.HM));

(function(OO, $, _){
  /*
   *  extend jquery lib
   */

  // add support for ie8/9 cross domain requests to jquery
  // see more here: http://bugs.jquery.com/ticket/8283
  // and here: https://github.com/jaubourg/ajaxHooks/blob/master/src/xdr.js
  if (window.XDomainRequest) {
    OO.$.ajaxTransport(function(s) {
      if (s.crossDomain && s.async) {
        if (s.timeout) {
          s.xdrTimeout = s.timeout;
          delete s.timeout;
        }
        var xdr;
        return {
          send: function(_, complete) {
            function callback(status, statusText, responses, responseHeaders) {
              xdr.onload = xdr.onerror = xdr.ontimeout = OO.$.noop;
              xdr = undefined;
              complete(status, statusText, responses, responseHeaders);
            }
            xdr = new XDomainRequest();
            xdr.open(s.type, s.url);
            xdr.onload = function() {
              callback(200, "OK", {
                text: xdr.responseText
              }, "Content-Type: " + xdr.contentType);
            };
            xdr.onerror = function() {
              callback(404, "Not Found");
            };
            xdr.onprogress = function() {};
            if (s.xdrTimeout) {
              xdr.ontimeout = function() {
                callback(0, "timeout");
              };
              xdr.timeout = s.xdrTimeout;
            }
            xdr.send((s.hasContent && s.data) || null);
          },
          abort: function() {
            if (xdr) {
              xdr.onerror = OO.$.noop();
              xdr.abort();
            }
          }
        };
      }
    });
  }


  $.getScriptRetry = function (url, callback, options) {
    options = options || {};
    var errorCallBack = options.error;
    var removeOptions = ['error', 'dataType', 'success'];
    _.each(removeOptions, function(k) { delete(options[k]); });

    // default settings; may be overridden by passing options
    var settings = {
      'url': url,
      'type': 'get',
      'dataType': 'script',
      'success': callback,
      'cache': true,
      'timeout': 5000,
      'tryCount': 0,
      'retryLimit': 1,
      'warning': false,
      'warningMessage': 'Can not load URL',
      'error': function () {
        if (this.tryCount < this.retryLimit) {
          this.tryCount++;
          $.ajax(this);
        } else {
          if (this.warning) {
            alert(this.warningMessage);
          }
          if (errorCallBack) { errorCallBack.apply(null, arguments); }
        }
      }
    }

    _.extend(settings, options);

    $.ajax(settings);
  };


}(OO, OO.$, OO._));

  /**
   * @public
   * @namespace OO
   */
  (function(OO,_){

    // External States
    /**
     * @public
     * @description The Ooyala Player run-time states apply to an Ooyala player while it is running. These states apply equally to both HTML5 and Flash players.
     * State changes occur either through user interaction (for example, the user clickes the PLAY button), or programmatically via API calls. For more information,
     * see <a href="http://support.ooyala.com/developers/documentation/api/pbv4_api_events.html" target="target">Player Message Bus Events</a>.
     * @summary Represents the Ooyala Player run-time states.
     * @namespace OO.STATE
     */
    OO.STATE = {
      /**
       * The embed code has been set. The movie and its metadata is currently being loaded into the player.
       * @public
       */
      LOADING : 'loading',
      /**
       * One of the following applies:
       * <ul>
       *   <li>All of the necessary data is loaded in the player. Playback of the movie can begin.</li>
       *   <li>Playback of the asset has finished and is ready to restart from the beginning.</li>
       * </ul>
       * @public
       */
      READY : 'ready',
      /**
       * The player is currently playing video content.
       * @public
       */
      PLAYING : 'playing',
      /**
       * The player has currently paused after playback had begun.
       * @public
       */
      PAUSED : 'paused',

      /**
       * Playback has currently stopped because it doesn't have enough movie data to continue and is downloading more.
       * @public
       */
      BUFFERING : 'buffering',
      /** The player has encountered an error that prevents playback of the asset. The error could be due to many reasons,
       * such as video format, syndication rules, or the asset being disabled. Refer to the list of errors for details.
       * The error code for the root cause of the error is available from the [OO.Player.getErrorCode()]{@link OO.Player#getErrorCode} method.
       * @public
       */
      ERROR : 'error',
      /**
       * The player has been destroyed via its [OO.Player.destroy(<i>callback</i>)]{@link OO.Player#destroy} method.
       * @public
       */
      DESTROYED : 'destroyed',

      __end_marker : true
    };

    // All Events Constants
    /**
     * @description The Ooyala Player events are default events that are published by the event bus.Your modules can subscribe to any and all of these events.
     * Use message bus events to subscribe to or publish player events from video to ad playback. For more information,
     * see <a href="http://support.ooyala.com/developers/documentation/api/pbv4_api_events.html" target="target">Player Message Bus Events</a>.
     * @summary Represents the Ooyala Player events.
     * @namespace OO.EVENTS
     * @public
     */
    OO.EVENTS = {

     /**
      * A player was created. This is the first event that is sent after player creation.
      * This event provides the opportunity for any other modules to perform their own initialization.
      * The handler is called with the query string parameters.
      * The DOM has been created at this point, and plugins may make changes or additions to the DOM.<br/><br/>
      *
      *
      * @event OO.EVENTS#PLAYER_CREATED
      * @public
      */
      PLAYER_CREATED : 'playerCreated',

      PLAYER_EMBEDDED: 'playerEmbedded',

      /**
       * An attempt has been made to set the embed code.
       * If you are developing a plugin, reset the internal state since the player is switching to a new asset.
       * Depending on the context, the handler is called with:
       *   <ul>
       *     <li>The ID (embed code) of the asset.</li>
       *     <li>The ID (embed code) of the asset, with options.</li>
       *   </ul>
       *
       *
       * @event OO.EVENTS#SET_EMBED_CODE
       * @public
       */
      SET_EMBED_CODE : 'setEmbedCode',

      /**
       * An attempt has been made to set a new asset.
       * If you are developing a plugin, reset the internal state since the player is switching to a new asset.
       * Depending on the context, the handler is called with:
       *   <ul>
       *     <li>The asset Object</li>
       *     <li>The asset Object, with options.</li>
       *   </ul>
       *
       * <h5>Compatibility: </h5>
       * <p style="text-indent: 1em;">HTML5, Flash</p>
       *
       * @event OO.EVENTS#SET_ASSET
       */
      SET_ASSET: 'setAsset',

      /**
       * A new asset has been specified to for playback and has basic passed validation.
       * The handler will be called with an object representing the new asset.
       * The object will have the following structure:
       *   <ul>
       *     <li>{
       *           Content:
       *           <ul>
       *                 <li>title: String,</li>
       *                 <li>description: String,</li>
       *                 <li>duration: Number,</li>
       *                 <li>posterImages: Array,</li>
       *                 <li>streams: Array,</li>
       *                 <li>captions: Array</li>
       *           </ul>
       *     }</li>
       *
       *   </ul>
       *
       * <h5>Compatibility: </h5>
       * <p style="text-indent: 1em;">HTML5, Flash</p>
       *
       * @event OO.EVENTS#ASSET_CHANGED
       */
      ASSET_CHANGED: 'assetChanged',

      /**
       * The player's embed code has changed. The handler is called with two parameters:
       * <ul>
       *    <li>The ID (embed code) of the asset.</li>
       *    <li>The options JSON object.</li>
       * </ul>
       *
       *
       * @event OO.EVENTS#EMBED_CODE_CHANGED
       * @public
       */
      EMBED_CODE_CHANGED : 'embedCodeChanged',

      /**
       * An <code>AUTH_TOKEN_CHANGED</code> event is triggered when an authorization token is issued by the Player Authorization API.<br/>
       * For example, in device registration, an authorization token is issued, as described in
       * <a href="http://support.ooyala.com/developers/documentation/concepts/device_registration.html" target="target">Device Registration</a>.
       * The handler is called with a new value for the authorization token.<br/><br/>
       *
       *
       * @event OO.EVENTS#AUTH_TOKEN_CHANGED
       * @public
       */
      AUTH_TOKEN_CHANGED: "authTokenChanged",

      /**
       * The GUID has been set. The handler is called with the GUID.
       * <p>This event notifies plugin or page developers that a unique ID has been either generated or loaded for the current user's browser.
       * This is useful for analytics.</p>
       * <p>In HTML5, Flash, and Chromecast environments, a unique user is identified by local storage or a cookie. </p>
       * <p>To generate the GUID, Flash players use the timestamp indicating when the GUID is generated, and append random data to it.
       * The string is then converted to base64.</p>
       * <p>To generate the GUID, HTML5 players use the current time, browser
       * information, and random data and hash it and convert it to base64.</p>
       * <p>Within the same browser on the desktop, once a GUID is set by one platform
       * it is used for both platforms for the user. If a user clears their browser cache, that user's (device's) ID will be regenerated the next time
       * they watch video. Incognito modes will track a user for a single session, but once the browser is closed the GUID is erased.</p>
       * <p>For more information, see <b>unique user</b> <a href="http://support.ooyala.com/users/users/documentation/reference/glossary.html" target="target">Glossary</a>.</p>
       *
       *
       * @event OO.EVENTS#GUID_SET
       * @public
       */
      GUID_SET: 'guidSet',

      WILL_FETCH_PLAYER_XML: 'willFetchPlayerXml',
      PLAYER_XML_FETCHED: 'playerXmlFetched',
      WILL_FETCH_CONTENT_TREE: 'willFetchContentTree',

      SAVE_PLAYER_SETTINGS: 'savePlayerSettings',

      /**
       * A content tree was fetched. The handler is called with a JSON object that represents the content data for the current asset.<br/><br/>
       *
       *
       * <h5>Analytics:</h5>
       * <p style="text-indent: 1em;">Records a <code>display</code> event. For more information see
       * <a href="http://support.ooyala.com/developers/documentation/concepts/analytics_plays-and-displays.html" target="target">Displays, Plays, and Play Starts</a>.</p>
       *
       * @event OO.EVENTS#CONTENT_TREE_FETCHED
       * @public
       */
      CONTENT_TREE_FETCHED: 'contentTreeFetched',

      WILL_FETCH_METADATA: 'willFetchMetadata',

      /**
       * The metadata, which is typically set in Backlot, has been retrieved.
       * The handler is called with the JSON object containing all metadata associated with the current asset.
       * The metadata includes page-level, asset-level, player-level, and account-level metadata, in addition to
       * metadata specific to 3rd party plugins. This is typically used for ad and anlytics plugins, but can be used
       * wherever you need specific logic based on the asset type.<br/><br/>
       *
       *
       * @event OO.EVENTS#METADATA_FETCHED
       * @public
       */
      METADATA_FETCHED: 'metadataFetched',


      /**
       * The thumbnail metadata needed for thumbnail previews while seeking has been fetched and will be
       * passed through to the event handlers subscribing to this event.
       * Thumbnail metadata will have the following structure:
       * {
          data: {
            available_time_slices: [10],  //times that have thumbnails available
            available_widths: [100],       //widths of thumbnails available
            thumbnails: {
                  10: {100: {url: http://test.com, height: 100, width: 100}}
            }
          }
        }
       * <br/><br/>
       *
       *
       * @event OO.EVENTS#THUMBNAILS_FETCHED
       * @public
       */
      THUMBNAILS_FETCHED: 'thumbnailsFetched',

      WILL_FETCH_AUTHORIZATION: 'willFetchAuthorization',

      /**
       * Playback was authorized. The handler is called with an object containing the entire SAS response, and includes the value of <code>video_bitrate</code>.
       * <p>For more information see
       * <a href="http://support.ooyala.com/developers/documentation/concepts/encodingsettings_videobitrate.html" target="target">Video Bit Rate</a>.</p>
       *
       *
       * @event OO.EVENTS#AUTHORIZATION_FETCHED
       * @public
       */
      AUTHORIZATION_FETCHED: 'authorizationFetched',

      WILL_FETCH_AD_AUTHORIZATION: 'willFetchAdAuthorization',
      AD_AUTHORIZATION_FETCHED: 'adAuthorizationFetched',

      /**
       * An attempt has been made to update current asset for cms-less player.
       * The handler is called with:
       *   <ul>
       *     <li>The asset Object, with optional fields populated</li>
       *   </ul>
       *
       *
       * @event OO.EVENTS#UPDATE_ASSET
       * @public
       */
      UPDATE_ASSET: 'updateAsset',

      /**
       * New asset parameters were specified for playback and have passed basic validation.
       * The handler will be called with an object representing the new parameters.
       * The object will have the following structure:
       *   <ul> {
       *     <li> id: String </li>
       *     <li> content:
       *           <ul>
       *                 <li>title: String,</li>
       *                 <li>description: String,</li>
       *                 <li>duration: Number,</li>
       *                 <li>posterImages: Array,</li>
       *                 <li>streams: Array,</li>
       *                 <li>captions: Array</li>
       *           </ul>
       *     </li>
       *     <li> relatedVideos:
       *           <ul>
       *                 <li>title: String,</li>
       *                 <li>description: String,</li>
       *                 <li>thumbnailUrl: String,</li>
       *                 <li>asset: Object</li>
       *           </ul>
       *     </li>
       *   }</ul>
       *
       * <h5>Compatibility: </h5>
       * <p style="text-indent: 1em;">HTML5, Flash</p>
       *
       * @event OO.EVENTS#ASSET_UPDATED
       */
      ASSET_UPDATED: 'assetUpdated',


      CAN_SEEK: 'canSeek',
      WILL_RESUME_MAIN_VIDEO: 'willResumeMainVideo',

      /**
       * The player has indicated that it is in a playback-ready state.
       * All preparations are complete, and the player is ready to receive playback commands
       * such as play, seek, and so on. The default UI shows the <b>Play</b> button,
       * displaying the non-clickable spinner before this point. <br/><br/>
       *
       *
       * @event OO.EVENTS#PLAYBACK_READY
       * @public
       */
      PLAYBACK_READY: 'playbackReady',

      /**
       * Play has been called for the first time. <br/><br/>
       *
       *
       * @event OO.EVENTS#INITIAL_PLAY
       * @public
       */
      INITIAL_PLAY: "initialPlay", // when play is called for the very first time ( in start screen )

      /**
       * Indicates that the video framework is ready to accept play commands
       *
       *
       * @event OO.EVENTS#CAN_PLAY
       */
      CAN_PLAY: 'canPlay',
      WILL_PLAY : 'willPlay',


      /** The user has restarted the playback after the playback finished.
      * The handler is called with the following optional argument:
      * <ul>
      *   <li>[optional] The time to restart video from, in seconds. </li>
      * </ul>
      *
      * If no argument is provided, playback restarts from the beginning.
      *
      * @event OO.EVENTS#REPLAY
      */
      REPLAY : 'replay',

      /**
       * The playhead time changed. The handler is called with the following arguments:
       * <ul>
       *   <li>The current time.</li>
       *   <li>The duration.</li>
       *   <li>The name of the buffer.</li>
       *   <li>The seek range.</li>
       *   <li>The id of the video (as defined by the module that controls it).</li>
       * </ul>
       *
       *
       * <h5>Analytics:</h5>
       * <p style="text-indent: 1em;">The first event is <code>video start</code>. Other instances of the event feed the <code>% completed data points</code>.</p>
       * <p style="text-indent: 1em;">For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/analytics_plays-and-displays.html">Displays, Plays, and Play Starts</a>.</p>
       *
       * @event OO.EVENTS#PLAYHEAD_TIME_CHANGED
       * @public
       */
      PLAYHEAD_TIME_CHANGED: 'playheadTimeChanged',

      /**
       * The player is buffering the data stream.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The url of the video that is buffering.</li>
       *   <li>The id of the video that is buffering (as defined by the module that controls it).</li>
       * </ul><br/><br/>
       *
       *
       * @event OO.EVENTS#BUFFERING
       * @public
       */
      BUFFERING: 'buffering', // playing stops because player is buffering

      /**
       * Play resumes because the player has completed buffering. The handler is called with the URL of the stream.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The url of the video that has buffered.</li>
       *   <li>The id of the video that has buffered (as defined by the module that controls it).</li>
       * </ul><br/><br/>
       *
       *
       * @event OO.EVENTS#BUFFERED
       * @public
       */
      BUFFERED: 'buffered',

      /**
       * The player is downloading content (it can play while downloading).
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The current time.</li>
       *   <li>The duration.</li>
       *   <li>The name of the buffer.</li>
       *   <li>The seek range.</li>
       *   <li>The id of the video (as defined by the module that controls it).</li>
       * </ul>
       * <br/><br/>
       *
       *
       * @event OO.EVENTS#DOWNLOADING
       * @public
       */
      DOWNLOADING:  'downloading', // player is downloading content (could be playing while downloading)

      /**
       * Lists the available bitrate information. The handler is called with an array containing the available streams,
       * each object must include the following and only the following:
       *   <ul>
       *     <li>bitrate: The bitrate in bits per second. (number)</li>
       *     <li>height: The vertical resolution of the stream. (number)</li>
       *     <li>width: The horizontal resolution of the stream. (number)</li>
       *     <li>id: A unique identifier for the stream. (string)</li>
       *   </ul>
       * If The video plugin supports automatic ABR, one stream will have an ID of "auto" and a bitrate of 0.
       *
       * <p>For more information see
       * <a href="http://support.ooyala.com/developers/documentation/concepts/encodingsettings_videobitrate.html" target="target">Video Bit Rate</a>.</p>
       * @event OO.EVENTS#BITRATE_INFO_AVAILABLE
       * @public
       */
      BITRATE_INFO_AVAILABLE: 'bitrateInfoAvailable',

      /**
       * A request to set a specific stream bitrate has occurred.
       * The event is published with parameter containing a string ID of the bitrate to change to.
       * This will be an ID from one of the stream objects published in BITRATE_INFO_AVAILABLE.
       * To use automatic ABR, the ID will be "auto".
       *
       * @event OO.EVENTS#SET_TARGET_BITRATE
       */
      SET_TARGET_BITRATE: 'setTargetBitrate',

      /**
       * The current playing bitrate has changed. The handler is called with the stream object
       * which includes the following and only the following:
       *   <ul>
       *     <li>bitrate: The bitrate in bits per second. (number)</li>
       *     <li>height: The vertical resolution of the stream. (number)</li>
       *     <li>width: The horizontal resolution of the stream. (number)</li>
       *     <li>id: A unique identifier for the stream. (string).</li>
       *   </ul>
       * If the player is using automatic ABR, it should publish a stream object with an ID of "auto" and bitrate set to 0.
       *
       * <p>For more information see
       * <a href="http://support.ooyala.com/developers/documentation/concepts/encodingsettings_videobitrate.html" target="target">Video Bit Rate</a>.</p>
       * @event OO.EVENTS#BITRATE_CHANGED
       * @public
       */
      BITRATE_CHANGED: 'bitrateChanged',

      /**
       * The current playing bitrate has changed. The handler is called with the stream object
       *
       * <p>For more information see
       * <a href="http://support.ooyala.com/developers/documentation/concepts/encodingsettings_videobitrate.html" target="target">Video Bit Rate</a>.</p>
       * @event OO.EVENTS#SEND_QUALITY_CHANGE
       * @public
       */
      SEND_QUALITY_CHANGE : 'receiveVideoQualityChangeEvent',

      /**
       * Lists the available closed caption information including languages and locale.
       *
       * Provide the following arguments:
       * <ul>
       *   <li>object containing:
       *     <ul>
       *       <li><code>languages</code>: (array) a list of available languages.</li>
       *       <li><code>locale</code>: (object) contains language names by id. For example, <code>{en:"English", fr:"Français", sp:"Español"}</code>.</li>
       *     </ul>
       *   </li>
       * </ul>
       *
       * @event OO.EVENTS#CLOSED_CAPTIONS_INFO_AVAILABLE
       * @public
       */
      CLOSED_CAPTIONS_INFO_AVAILABLE: 'closedCaptionsInfoAvailable',

      /**
       * Sets the closed captions language to use.  To remove captions, specify <code>"none"</code> as the language.
       *
       * Provide the following arguments:
       * <ul>
       *   <li>string specifying the language in which the captions appear.
       *   </li>
       * </ul>
       *
       * @event OO.EVENTS#SET_CLOSED_CAPTIONS_LANGUAGE
       * @public
       */
      SET_CLOSED_CAPTIONS_LANGUAGE: 'setClosedCaptionsLanguage',


      /**
       * Raised when closed caption text is changed at a point in time.
       *
       * Provide the following arguments:
       * <ul>
       *   <li>TBD
       *   </li>
       * </ul>
       *
       * @event OO.EVENTS#CLOSED_CAPTION_CUE_CHANGED
       * @private
       */
      CLOSED_CAPTION_CUE_CHANGED: 'closedCaptionCueChanged',


      /**
       * Raised when asset dimensions become available.
       *
       * Provide the following arguments in an object:
       * <ul>
       *   <li>width: the width of the asset (number)
       *   </li>
       *   <li>height: the height of the asset (number)
       *   </li>
       *   <li>videoId: the id of the video (string)
       *   </li>
       * </ul>
       *
       * @event OO.EVENTS#ASSET_DIMENSION
       * @public
       */
      ASSET_DIMENSION: 'assetDimension',

      SCRUBBING: 'scrubbing',
      SCRUBBED: 'scrubbed',

      /**
       * A request to perform a seek has occurred. The playhead is requested to move to
       * a specific location, specified in milliseconds. The handler is called with the position to which to seek.<br/><br/>
       *
       *
       * @event OO.EVENTS#SEEK
       * @public
       */
      SEEK: 'seek',

      /**
       * The player has finished seeking the main video to the requested position.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The current time of the video after seeking.</li>
       * </ul>
       *
       *
       * @event OO.EVENTS#SEEKED
       * @public
       */
      SEEKED: 'seeked',

      /**
       * A request to perform a seek to the live point has occurred. The playhead is requested to move to
       * the live point location. The handler is called as a seek with the position to seek equal to the video duration.<br/><br/>
       *
       *
       * @event OO.EVENTS#LIVE_BUTTON_CLICKED
       * @public
       */
      LIVE_BUTTON_CLICKED : 'liveButtonClicked',

      /**
       * A playback request has been made. <br/><br/>
       *
       *
       * @event OO.EVENTS#PLAY
       * @public
       */
      PLAY: 'play',

      PLAYING: 'playing',
      PLAY_FAILED: 'playFailed',

      /**
       * A player pause has been requested. <br/><br/>
       *
       *
       * @event OO.EVENTS#PAUSE
       * @public
       */
      PAUSE: 'pause',

      /**
       * The player was paused. If a PAUSE event is fired by the Ad Manager,
       * the <code>"pauseForAdPlayback"</code> parameter is included as an argument.<br/><br/>
       *
       *
       * @event OO.EVENTS#PAUSED
       * @public
       */
      PAUSED: 'paused',

      /**
       * The video and asset were played. The handler is called with the arguments that were passed.<br/><br/>
       *
       *
       * @event OO.EVENTS#PLAYED
       * @public
       */
      PLAYED: 'played',

      SHOULD_DISPLAY_CUE_POINTS: 'shouldDisplayCuePoints',
      INSERT_CUE_POINT: 'insertCuePoint',
      RESET_CUE_POINTS: 'resetCuePoints',

      /**
       * This event is triggered before a change is made to the full screen setting of the player.
       * The handler is called with <code>true</code> if the full screen setting will be enabled,
       * and is called with <code>false</code> if the full screen setting will be disabled.
       *
       *
       * @event OO.EVENTS#WILL_CHANGE_FULLSCREEN
       * @public
       */
      WILL_CHANGE_FULLSCREEN: 'willChangeFullscreen',

      /**
       * The fullscreen state has changed. Depending on the context, the handler is called with:
       * <ul>
       *   <li><code>isFullscreen</code> and <code>paused</code>:</li>
       *     <ul>
       *       <li><code>isFullscreen</code> is set to <code>true</code> or <code>false</code>.</li>
       *       <li><code>isFullscreen</code> and <code>paused</code> are each set to <code>true</code> or <code>false</code>.</li>
       *     </ul>
       *   </li>
       *   <li>The id of the video that has entered fullscreen (as defined by the module that controls it).
       * </ul>
       *
       *
       * @event OO.EVENTS#FULLSCREEN_CHANGED
       * @public
       */
      FULLSCREEN_CHANGED: 'fullscreenChanged',

      /**
       * The screen size has changed. This event can also be triggered by a screen orientation change for handheld devices.
       * Depending on the context, the handler is called with:
       *   <ul>
       *     <li>The width of the player.</li>
       *     <li>The height of the player.</li>
       *   </ul>
       *
       *
       * @event OO.EVENTS#SIZE_CHANGED
       * @public
       */
      SIZE_CHANGED: 'sizeChanged',

      /**
       * A request to change volume has been made.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The desired volume of the video element.</li>
       *   <li>The id of the video on which to change the volume (as defined by the module that controls it).
       *        If null or undefined, all video elements volume will be changed</li>
       * </ul>
       *
       *
       * @event OO.EVENTS#CHANGE_VOLUME
       * @public
       */
      CHANGE_VOLUME: 'changeVolume',

      /**
       * The volume has changed. The handler is called with the current volume, which has a value between 0 and 1, inclusive.<br/><br/>
       *
       *
       * @event OO.EVENTS#VOLUME_CHANGED
       * @public
       */
      VOLUME_CHANGED: 'volumeChanged',

      /**
       * Controls are shown.<br/><br/>
       *
       *
       * @event OO.EVENTS#CONTROLS_SHOWN
       * @public
       */
      CONTROLS_SHOWN: 'controlsShown',

      /**
       * Controls are hidden.<br/><br/>
       *
       *
       * @event OO.EVENTS#CONTROLS_HIDDEN
       * @public
       */
      CONTROLS_HIDDEN: 'controlsHidden',
      END_SCREEN_SHOWN: 'endScreenShown',

      /**
       * An error has occurred. The handler is called with a JSON object that always includes an error code field,
       * and may also include other error-specific fields.<br/><br/>
       *
       *
       * @event OO.EVENTS#ERROR
       * @public
       */
      ERROR: 'error',

      /**
       * The player is currently being destroyed, and anything created by your module must also be deleted.
       * After the destruction is complete, there is nothing left to send an event.
       * Any plugin that creates or has initialized any long-living logic should listen to this event and clean up that logic.
       * <br/><br/>
       *
       *
       * @event OO.EVENTS#DESTROY
       * @public
       */
      DESTROY: 'destroy',

      WILL_PLAY_FROM_BEGINNING: 'willPlayFromBeginning',

      DISABLE_PLAYBACK_CONTROLS: 'disablePlaybackControls',
      ENABLE_PLAYBACK_CONTROLS: 'enablePlaybackControls',


      // Video Controller action events

      /**
       * Denotes that the video controller is ready for playback to be triggered.
       * @event OO.EVENTS#VC_READY
       * @public
       */
      VC_READY: 'videoControllerReady',

      /**
       * Commands the video controller to create a video element.
       * Provide the following arguments:
       * <ul>
       *   <li><code>videoId (string)</code>
       *   </li>
       *   <li>streams (object) containing:
       *     <ul>
       *       <li>Encoding type (string) as key defined in OO.VIDEO.ENCODINGS
       *       </li>
       *       <li>Key-value pair (object) as value containing:
       *         <ul>
       *           <li>url (string): Url of the stream</li>
       *           <li>drm (object): Denoted by type of DRM with data as value object containing:
       *             <ul>
       *               <li>Type of DRM (string) as key (ex. "widevine", "fairplay", "playready")</li>
       *               <li>DRM specific data (object) as value</li>
       *             </ul>
       *           </li>
       *         </ul>
       *       </li>
       *     </ul>
       *   </li>
       *   <li>parentContainer of the element. This is a jquery element. (object)
       *   </li>
       *   <li>optional params object (object) containing:
       *     <ul>
       *       <li><code>closedCaptions</code>: (object) The possible closed captions available on this video. Permitted values: <code>null (default), closedCaptions</code>.</li>
       *       <li><code>crossorigin</code>: The crossorigin attribute value to set on the video. Permitted values: <code>null (default), "anonymous"</code>.</li>
       *       <li><code>technology</code>: The core video technology required (string) (ex. OO.VIDEO.TECHNOLOGY.HTML5)</li>
       *       <li><code>features</code>: The video plugin features required (string) (ex. OO.VIDEO.FEATURE.CLOSED_CAPTIONS)</li>
       *     </ul>
       *   </li>
       * </ul>
       * @event OO.EVENTS#VC_CREATE_VIDEO_ELEMENT
       * @public
       */
      VC_CREATE_VIDEO_ELEMENT: 'videoControllerCreateVideoElement',

      /**
       * A message to be interpreted by the Video Controller to update the URL of the stream for an element.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The name of the element who's URL is being altered</li>
       *   <li>The new url to be used</li>
       * </ul>
       * @event OO.EVENTS#VC_UPDATE_ELEMENT_STREAM
       * @public
       */
      VC_UPDATE_ELEMENT_STREAM: 'videoControllerUpdateElementStream',

      /**
       * The Video Controller has created the desired video element, as denoted by id (string).
       * The handler is called with the following arguments:
       * <ul>
       *   <li>Object containing:
       *     <ul>
       *       <li><code>videoId</code>: The id of the video as defined by the module that controls it.</li>
       *       <li><code>encodings</code>: The encoding types supported by the new video element.</li>
       *       <li><code>parent</code>: The parent element of the video element.</li>
       *       <li><code>domId</code>: The DOM id of the video element.</li>
       *       <li><code>videoElement</code>: The video element or its wrapper as created by the video plugin.</li>
       *     </ul>
       *   </li>
       * </ul>
       * @event OO.EVENTS#VC_VIDEO_ELEMENT_CREATED
       * @public
       */
      VC_VIDEO_ELEMENT_CREATED: 'videoControllerVideoElementCreated',

      /**
       * Commands the Video Controller to bring a video element into the visible range given the video element id (string).
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video to focus (as defined by the module that controls it).</li>
       * </ul>
       * @event OO.EVENTS#VC_FOCUS_VIDEO_ELEMENT
       * @public
       */
      VC_FOCUS_VIDEO_ELEMENT: 'videoControllerFocusVideoElement',

      /**
       * The Video Controller has moved a video element (string) into focus.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that is in focus (as defined by the module that controls it).</li>
       * </ul>
       * @event OO.EVENTS#VC_VIDEO_ELEMENT_IN_FOCUS
       * @public
       */
      VC_VIDEO_ELEMENT_IN_FOCUS: 'videoControllerVideoElementInFocus',

      /**
       * The Video Controller has removed a video element (string) from focus.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that lost focus (as defined by the module that controls it).</li>
       * </ul>
       * @event OO.EVENTS#VC_VIDEO_ELEMENT_LOST_FOCUS
       * @public
       */
      VC_VIDEO_ELEMENT_LOST_FOCUS: 'videoControllerVideoElementLostFocus',

      /**
       * Commands the Video Controller to dispose a video element given the video element id (string).
       * @event OO.EVENTS#VC_DISPOSE_VIDEO_ELEMENT
       * @public
       */
      VC_DISPOSE_VIDEO_ELEMENT: 'videoControllerDisposeVideoElement',

      /**
       * The Video Controller has disposed the denoted video element (string).
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that was disposed (as defined by the module that controls it).</li>
       * </ul>
       * @event OO.EVENTS#VC_VIDEO_ELEMENT_DISPOSED
       * @public
       */
      VC_VIDEO_ELEMENT_DISPOSED: 'videoControllerVideoElementDisposed',

      /**
       * Commands the video controller to set the stream for a video element.
       * It should be given the video element name (string) and an object of streams denoted by encoding type (object).
       * @event OO.EVENTS#VC_SET_VIDEO_STREAMS
       * @public
       */
      VC_SET_VIDEO_STREAMS: 'videoControllerSetVideoStreams',

      /**
       * The Video Controller has encountered an error attempting to configure video elements.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that encountered the error (as defined by the module that controls it).</li>
       *   <li>The error details (object) containing an error code.</li>
       * @event OO.EVENTS#VC_ERROR
       * @public
       */
      VC_ERROR: 'videoControllerError',


      // Video Player action events

      /**
       * Sets the video element's initial playback time.
       * @event OO.EVENTS#VC_SET_INITIAL_TIME
       * @public
       */
      VC_SET_INITIAL_TIME: 'videoSetInitialTime',

      /**
       * Commands the video element to play.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video to play (as defined by the module that controls it).</li>
       * </ul>
       * @event OO.EVENTS#VC_PLAY
       * @public
       */
      VC_PLAY: 'videoPlay',

      /**
       * The video element has been initialized and deferred command to play is unblocked
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that is will be played (as defined by the module that controls it).</li>
       * </ul>
       * @event OO.EVENTS#VC_CAN_PLAY
       * @public
       */
      VC_CAN_PLAY: 'videoCanPlay',

      /**
       * The video element has detected a command to play and will begin playback.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video to seek (as defined by the module that controls it).</li>
       *   <li>The url of the video that will play.</li>
       * </ul>
       * @event OO.EVENTS#VC_WILL_PLAY
       * @public
       */
      VC_WILL_PLAY: 'videoWillPlay',

      /**
       * The video element has detected playback in progress.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that is playing (as defined by the module that controls it).</li>
       * </ul>
       * @event OO.EVENTS#VC_PLAYING
       * @public
       */
      VC_PLAYING: 'videoPlaying',

      /**
       * The video element has detected playback completion.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that has played (as defined by the module that controls it).</li>
       * </ul>
       * @event OO.EVENTS#VC_PLAYED
       * @public
       */
      VC_PLAYED: 'videoPlayed',

      /**
       * The video element has detected playback failure.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that has played (as defined by the module that controls it).</li>
       *   <li>The error code of the failure (string).</li>
       * </ul>
       * @event OO.EVENTS#VC_PLAY_FAILED
       * @public
       */
      VC_PLAY_FAILED: 'videoPlayFailed',

      /**
       * Commands the video element to pause.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video to pause (as defined by the module that controls it).</li>
       *   <li>Optional string indicating the reason for the pause.  Supported values include:
       *     <ul>
       *       <li>"transition" indicates that a pause was triggered because a video is going into or out of focus.</li>
       *       <li>null or undefined for all other cases.</li>
       *     </ul>
       *   </li>
       * </ul>
       * @event OO.EVENTS#VC_PAUSE
       * @public
       */
      VC_PAUSE: 'videoPause',

      /**
       * The video element has detected video state change to paused.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that has paused (as defined by the module that controls it).</li>
       * </ul>
       * @event OO.EVENTS#VC_PAUSED
       * @public
       */
      VC_PAUSED: 'videoPaused',

      /**
       * Commands the video element to seek.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video to seek (as defined by the module that controls it).</li>
       *   <li>The time position to seek to (in seconds).</li>
       * </ul>
       * @event OO.EVENTS#VC_SEEK
       * @public
       */
      VC_SEEK: 'videoSeek',

      /**
       * The video element has detected seeking.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that is seeking (as defined by the module that controls it).</li>
       * </ul>
       * @event OO.EVENTS#VC_SEEKING
       * @public
       */
      VC_SEEKING: 'videoSeeking',

      /**
       * The video element has detected seeked.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that has seeked (as defined by the module that controls it).</li>
       *   <li>The current time of the video after seeking.</li>
       * </ul>
       * @event OO.EVENTS#VC_SEEKED
       * @public
       */
      VC_SEEKED: 'videoSeeked',

      /**
       * Commands the video element to preload.
       * @event OO.EVENTS#VC_PRELOAD
       * @public
       */
      VC_PRELOAD: 'videoPreload',

      /**
       * Commands the video element to reload.
       * @event OO.EVENTS#VC_RELOAD
       * @public
       */
      VC_RELOAD: 'videoReload',

      /**
       * Commands the video controller to prepare all video elements for playback.  This event should be
       * called on a click event and used to enable api-control on html5-based video elements.
       * @event OO.EVENTS#VC_PRIME_VIDEOS
       * @public
       */
      VC_PRIME_VIDEOS: 'videoPrimeVideos',

      /**
       * Notifies the player of tags (such as ID3) encountered during video playback.
       * The handler is called with the following arguments:
       * <ul>
       *   <li>The id of the video that has paused (as defined by the module that controls it). (string)</li>
       *   <li>The type of metadata tag found, such as ID3. (string)</li>
       *   <li>The metadata. (string|object)</li>
       * </ul>
       * @event OO.EVENTS#VC_TAG_FOUND
       * @public
       */
      VC_TAG_FOUND: 'videoTagFound',

      WILL_FETCH_ADS: 'willFetchAds',
      DISABLE_SEEKING: 'disableSeeking',
      ENABLE_SEEKING: 'enableSeeking',

      /**
       * This event is triggered before an ad is played. Depending on the context, the handler is called with:
       *   <ul>
       *     <li>The duration of the ad.</li>
       *     <li>The ID of the ad.</li>
       *   </ul>
       *
       *
       * <h5>Analytics:</h5>
       * <p style="text-indent: 1em;"Triggers an <b>Ad Analytics</b> <code>AD_IMPRESSION</code> event.</p>
       *
       * @event OO.EVENTS#WILL_PLAY_ADS
       * @public
       */
      WILL_PLAY_ADS: 'willPlayAds',
      WILL_PLAY_SINGLE_AD: 'willPlaySingleAd',
      WILL_PAUSE_ADS: 'willPauseAds',
      WILL_RESUME_ADS: 'willResumeAds',

      /**
       * This event is triggered to indicate that a non-linear ad will be played.  The handler is called with:
       *   <ul>
       *     <li>An object representing the ad.  For a definition, see class 'Ad' from the ad manager framework.</li>
       *   </ul>
       *
       * @event OO.EVENTS#WILL_PLAY_NONLINEAR_AD
       */
      WILL_PLAY_NONLINEAR_AD: 'willPlayNonlinearAd',

      /**
       * A non-linear ad will play now.  The handler is called with:
       *   <ul>
       *     <li>An object containing the following fields:</li>
       *     <ul>
       *       <li>ad: An object representing the ad.  For a definition, see class 'Ad' from the ad manager framework.</li>
       *       <li>url: [optional] The url of the nonlinear ad.</li>
       *     </ul>
       *   </ul>
       *
       * @event OO.EVENTS#PLAY_NONLINEAR_AD
       */
      PLAY_NONLINEAR_AD: 'playNonlinearAd',

      /**
       * A set of ads have been played. Depending on the context, the handler is called with:
       *   <ul>
       *     <li>The duration of the ad.</li>
       *     <li>The ID of the item to play.</li>
       *   </ul>
       *
       *
       * @event OO.EVENTS#ADS_PLAYED
       * @public
       */
      ADS_PLAYED: 'adsPlayed',

      SINGLE_AD_PLAYED: 'singleAdPlayed',

      /**
       * This event is triggered when an error has occurred with an ad. <br/><br/>
       *
       *
       * @event OO.EVENTS#ADS_ERROR
       * @public
       */
      ADS_ERROR: 'adsError',

      /**
       * This event is triggered when an ad has been clicked. <br/><br/>
       *
       *
       * @event OO.EVENTS#ADS_CLICKED
       * @public
       */
      ADS_CLICKED: 'adsClicked',

      FIRST_AD_FETCHED: "firstAdFetched",
      AD_CONFIG_READY: "adConfigReady",

      /**
       * This event is triggered before the companion ads are shown.
       * Companion ads are displayed on a customer page and are not displayed in the player.
       * This event notifies the page handler to display the specified ad, and is the only means by which companion ads can appear.
       * If the page does not handle this event, companion ads will not appear.
       * Depending on the context, the handler is called with:
       *   <ul>
       *     <li>The ID of all companion ads.</li>
       *     <li>The ID of a single companion ad.</li>
       *   </ul>
       *
       *
       * <h5>Analytics:</h5>
       * <p style="text-indent: 1em;"Triggers an <b>Ad Analytics</b> <code>AD_IMPRESSION</code> event.</p>
       *
       * @event OO.EVENTS#WILL_SHOW_COMPANION_ADS
       * @public
       */
      WILL_SHOW_COMPANION_ADS: "willShowCompanionAds",
      AD_FETCH_FAILED: "adFetchFailed",

      MIDROLL_PLAY_FAILED: "midrollPlayFailed",
      SKIP_AD: "skipAd",
      UPDATE_AD_COUNTDOWN: "updateAdCountdown",

      // this player is part of these experimental variations
      REPORT_EXPERIMENT_VARIATIONS: "reportExperimentVariations",

      FETCH_STYLE: "fetchStyle",
      STYLE_FETCHED: "styleFetched",
      SET_STYLE: "setStyle",

      USE_SERVER_SIDE_HLS_ADS: "useServerSideHlsAds",

      LOAD_ALL_VAST_ADS: "loadAllVastAds",
      ADS_FILTERED: "adsFiltered",
      ADS_MANAGER_HANDLING_ADS: "adsManagerHandlingAds",
      ADS_MANAGER_FINISHED_ADS: "adsManagerFinishedAds",

      // This event contains the information AMC need to know to place the overlay in the correct position.
      OVERLAY_RENDERING: "overlayRendering",

     /**
      * Event for signaling Ad Marquee rendering:
      *   <ul>
      *     <li>Boolean parameter, 'false' to not show ad marquee, 'true' to show ad marquee based on skin config</li>
      *   </ul>
      *
      *
      * @event OO.EVENTS#SHOW_AD_MARQUEE
      */
     SHOW_AD_MARQUEE: "showAdMarquee",

      // Window published beforeUnload event. It's still user cancellable.
      /**
       * The window, document, and associated resources are being unloaded.
       * The handler is called with <code>true</code> if a page unload has been requested, <code>false</code> otherwise.
       * This event may be required since some browsers perform asynchronous page loading while the current page is still active,
       * meaning that the end user loads a page with the Ooyala player, plays an asset, then redirects the page to a new URL they have specified.
       * Some browsers will start loading the new data while still displaying the player, which will result in an error since the networking has already been reset.
       * To prevent such false errors, listen to this event and ignore any errors raised after such actions have occurred.
       * <br/><br/>
       *
       *
       * @event OO.EVENTS#PAGE_UNLOAD_REQUESTED
       * @public
       */
      PAGE_UNLOAD_REQUESTED: "pageUnloadRequested",
      // Either 1) The page is refreshing (almost certain) or 2) The user tried to refresh
      // the page, the embedding page had an "Are you sure?" prompt, the user clicked
      // on "stay", and a real error was produced due to another reason during the
      // following few seconds. The real error, if any, will be received in some seconds.
      // If we are certain it has unloaded, it's too late to be useful.
      PAGE_PROBABLY_UNLOADING: "pageProbablyUnloading",

      // DiscoveryApi publishes these, OoyalaAnalytics listens for them and propagates to reporter.js
      REPORT_DISCOVERY_IMPRESSION: "reportDiscoveryImpression",
      REPORT_DISCOVERY_CLICK: "reportDiscoveryClick",

      /**
       * The UI layer has finished its initial render. The handler is called with an object
       * of the following structure:
       *
       * <ul>
       *   <li>videoWrapperClass: The class name of the element containing the UI layer</li>
       *   <li>pluginsClass: The class name of the element into which the plugins content should be inserted</li>
       * </ul>
       *
       * If the UI layer doesn't require any special handling, the values for these two keys will be null.
       *
       * @event OO.EVENTS#UI_READY
       */
      UI_READY: "uiReady",

      __end_marker : true
    };

    /**
     * @description Represents the Ooyala V4 Player Errors. Use message bus events to handle errors by subscribing to the <code>OO.EVENTS.ERROR</code> event.
     * For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/errors_overview.html" target="target">Errors and Error Handling Overview</a>.
     * @summary Represents the Ooyala V4 Player Errors.
     * @namespace OO.ERROR
     * @public
     */
    OO.ERROR = {
     /**
      * @description Represents the <code>OO.ERROR.API</code> Ooyala V4 Player Errors. Use message bus events to handle errors by subscribing to the <code>OO.EVENTS.ERROR</code> event.
      * For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/errors_overview.html" target="target">Errors and Error Handling Overview</a>.
      * @summary Represents the <code>OO.ERROR.API</code> Ooyala V4 Player Errors.
      * @namespace OO.ERROR.API
      * @public
      */
      API: {
       /**
        * @description <code>OO.ERROR.API.NETWORK ('network')</code>: Cannot contact the server.
        * @constant OO.ERROR.API.NETWORK
        * @type {string}
        * @public
        */
        NETWORK:'network',
        /**
         * @description Represents the <code>OO.ERROR.API.SAS</code> Ooyala V4 Player Errors for the Stream Authorization Server.
         * Use message bus events to handle errors by subscribing to the <code>OO.EVENTS.ERROR</code> event.
         * For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/errors_overview.html" target="target">Errors and Error Handling Overview</a>.
         * @summary Represents the <code>OO.ERROR.API.SAS</code> Ooyala V4 Player Errors.
         * @namespace OO.ERROR.API.SAS
         * @public
         */
        SAS: {
         /**
          * @description <code>OO.ERROR.API.SAS.GENERIC ('sas')</code>: Invalid authorization response.
          * @constant OO.ERROR.API.SAS.GENERIC
          * @type {string}
          * @public
          */
          GENERIC:'sas',
          /**
           * @description <code>OO.ERROR.API.SAS.GEO ('geo')</code>: This video is not authorized for your location.
           * @constant OO.ERROR.API.SAS.GEO
           * @type {string}
           * @public
           */
          GEO:'geo',
          /**
           * @description <code>OO.ERROR.API.SAS.DOMAIN ('domain')</code>: This video is not authorized for your domain.
           * @constant OO.ERROR.API.SAS.DOMAIN
           * @type {string}
           * @public
           */
          DOMAIN:'domain',
          /**
           * @description <code>OO.ERROR.API.SAS.FUTURE ('future')</code>: This video will be available soon.
           * @constant OO.ERROR.API.SAS.FUTURE
           * @type {string}
           * @public
           */
          FUTURE:'future',
          /**
           * @description <code>OO.ERROR.API.SAS.PAST ('past')</code>: This video is no longer available.
           * @constant OO.ERROR.API.SAS.PAST
           * @type {string}
           * @public
           */
          PAST:'past',
          /**
           * @description <code>OO.ERROR.API.SAS.DEVICE ('device')</code>: This video is not authorized for playback on this device.
           * @constant OO.ERROR.API.SAS.DEVICE
           * @type {string}
           * @public
           */
          DEVICE:'device',
          /**
           * @description <code>OO.ERROR.API.SAS.PROXY ('proxy')</code>: An anonymous proxy was detected. Please disable the proxy and retry.
           * @constant OO.ERROR.API.SAS.PROXY
           * @type {string}
           * @public
           */
          PROXY:'proxy',
          /**
           * @description <code>OO.ERROR.API.SAS.CONCURRENT_STREAM ('concurrent_streams')S</code>: You have exceeded the maximum number of concurrent streams.
           * @constant OO.ERROR.API.SAS.CONCURRENT_STREAMS
           * @type {string}
           * @public
           */
          CONCURRENT_STREAMS:'concurrent_streams',
          /**
           * @description <code>OO.ERROR.API.SAS.INVALID_HEARTBEAT ('invalid_heartbeat')</code>: Invalid heartbeat response.
           * @constant OO.ERROR.API.SAS.INVALID_HEARTBEAT
           * @type {string}
           * @public
           */
          INVALID_HEARTBEAT:'invalid_heartbeat',
          /**
           * @description <code>OO.ERROR.API.SAS.ERROR_DEVICE_INVALID_AUTH_TOKEN ('device_invalid_auth_token')</code>: Invalid Ooyala Player token.
           * @constant OO.ERROR.API.SAS.ERROR_DEVICE_INVALID_AUTH_TOKEN
           * @type {string}
           * @public
           */
          ERROR_DEVICE_INVALID_AUTH_TOKEN:'device_invalid_auth_token',
          /**
           * @description <code>OO.ERROR.API.SAS.ERROR_DEVICE_LIMIT_REACHED ('device_limit_reached')</code>: The device limit has been reached.
           * The device limit is the maximum number of devices that can be registered with the viewer.
           * When the number of registered devices exceeds the device limit for the account or provider, this error is displayed.
           * @constant OO.ERROR.API.SAS.ERROR_DEVICE_LIMIT_REACHED
           * @type {string}
           * @public
           */
          ERROR_DEVICE_LIMIT_REACHED:'device_limit_reached',
          /**
           * @description <code>OO.ERROR.API.SAS.ERROR_DEVICE_BINDING_FAILED ('device_binding_failed')</code>: Device binding failed.
           * If the number of devices registered is already equal to the number of devices that may be bound for the account,
           * attempting to register a new device will result in this error.
           * @constant OO.ERROR.API.SAS.ERROR_DEVICE_BINDING_FAILED
           * @type {string}
           * @public
           */
          ERROR_DEVICE_BINDING_FAILED:'device_binding_failed',
          /**
           * @description <code>OO.ERROR.API.SAS.ERROR_DEVICE_ID_TOO_LONG ('device_id_too_long')</code>: The device ID is too long.
           * The length limit for the device ID is 1000 characters.
           * @constant OO.ERROR.API.SAS.ERROR_DEVICE_ID_TOO_LONG
           * @type {string}
           * @public
           */
          ERROR_DEVICE_ID_TOO_LONG:'device_id_too_long',
          /**
           * @description <code>OO.ERROR.API.SAS.ERROR_DRM_RIGHTS_SERVER_ERROR ('drm_server_error')</code>: DRM server error.
           * @constant OO.ERROR.API.SAS.ERROR_DRM_RIGHTS_SERVER_ERROR
           * @type {string}
           * @public
           */
          ERROR_DRM_RIGHTS_SERVER_ERROR:'drm_server_error',
          /**
           * @description <code>OO.ERROR.API.SAS.ERROR_DRM_GENERAL_FAILURE ('drm_general_failure')</code>: General error with acquiring license.
           * @constant OO.ERROR.API.SAS.ERROR_DRM_GENERAL_FAILURE
           * @type {string}
           * @public
           */
          ERROR_DRM_GENERAL_FAILURE:'drm_general_failure',

          /**
           * @description <code>OO.ERROR.API.SAS.ERROR_INVALID_ENTITLEMENTS ('invalid_entitlements')</code>: User Entitlement Terminated - Stream No Longer Active for the User.
           * @constant OO.ERROR.API.SAS.ERROR_INVALID_ENTITLEMENTS
           * @type {string}
           * @public
           */
          ERROR_INVALID_ENTITLEMENTS:'invalid_entitlements'
        },
       /**
        * @description <code>OO.ERROR.API.CONTENT_TREE ('content_tree')</code>: Invalid Content.
        * @constant OO.ERROR.API.CONTENT_TREE
        * @type {string}
        * @public
        */
        CONTENT_TREE:'content_tree',
       /**
        * @description <code>OO.ERROR.API.METADATA ('metadata')</code>: Invalid Metadata.
        * @constant OO.ERROR.API.METADATA
        * @type {string}
        * @public
        */
        METADATA:'metadata'
      },
     /**
      * @description Represents the <code>OO.ERROR.PLAYBACK</code> Ooyala V4 Player Errors. Use message bus events to handle errors by subscribing to the <code>OO.EVENTS.ERROR</code> event.
      * For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/errors_overview.html" target="target">Errors and Error Handling Overview</a>.
      * @summary Represents the <code>OO.ERROR.PLAYBACK</code> Ooyala V4 Player Errors.
      * @namespace OO.ERROR.PLAYBACK
      * @public
      */
      PLAYBACK: {
       /**
        * @description <code>OO.ERROR.PLAYBACK.GENERIC ('playback')</code>: Could not play the content.
        * @constant OO.ERROR.PLAYBACK.GENERIC
        * @type {string}
        * @public
        */
        GENERIC:'playback',
        /**
         * @description <code>OO.ERROR.PLAYBACK.STREAM ('stream')</code>: This video is not encoded for your device.
         * @constant OO.ERROR.PLAYBACK.STREAM
         * @type {string}
         * @public
         */
        STREAM:'stream',
        /**
         * @description <code>OO.ERROR.PLAYBACK.LIVESTREAM ('livestream')</code>: Live stream is off air.
         * @constant OO.ERROR.PLAYBACK.LIVESTREAM
         * @type {string}
         * @public
         */
        LIVESTREAM:'livestream',
        /**
         * @description <code>OO.ERROR.PLAYBACK.NETWORK ('network_error')</code>: The network connection was temporarily lost.
         * @constant OO.ERROR.PLAYBACK.NETWORK
         * @type {string}
         * @public
         */
        NETWORK: 'network_error'
      },
      CHROMECAST: {
        MANIFEST:'chromecast_manifest',
        MEDIAKEYS:'chromecast_mediakeys',
        NETWORK:'chromecast_network',
        PLAYBACK:'chromecast_playback'
      },
     /**
      * @description <code>OO.ERROR.UNPLAYABLE_CONTENT ('unplayable_content')</code>: This video is not playable on this player.
      * @constant OO.ERROR.UNPLAYABLE_CONTENT
      * @type {string}
      * @public
      */
      UNPLAYABLE_CONTENT:'unplayable_content',
     /**
      * @description <code>OO.ERROR.INVALID_EXTERNAL_ID ('invalid_external_id')</code>: Invalid External ID.
      * @constant OO.ERROR.INVALID_EXTERNAL_ID
      * @type {string}
      * @public
      */
      INVALID_EXTERNAL_ID:'invalid_external_id',
      /**
       * @description <code>OO.ERROR.EMPTY_CHANNEL ('empty_channel')</code>: This channel is empty.
       * @constant OO.ERROR.EMPTY_CHANNEL
       * @type {string}
       * @public
       */
      EMPTY_CHANNEL:'empty_channel',
      /**
       * @description <code>OO.ERROR.EMPTY_CHANNEL_SET ('empty_channel_set')</code>: This channel set is empty.
       * @constant OO.ERROR.EMPTY_CHANNEL_SET
       * @type {string}
       * @public
       */
      EMPTY_CHANNEL_SET:'empty_channel_set',
      /**
       * @description <code>OO.ERROR.CHANNEL_CONTENT ('channel_content')</code>: This channel is not playable at this time.
       * @constant OO.ERROR.CHANNEL_CONTENT
       * @type {string}
       * @public
       */
      CHANNEL_CONTENT:'channel_content',
      /**
       * @description Represents the <code>OO.ERROR.VC</code> Ooyala V4 Player Errors for the Video Technology stack.
       * Use message bus events to handle errors by subscribing to the <code>OO.EVENTS.ERROR</code> event.
           * For more information, see <a href="http://support.ooyala.com/developers/documentation/concepts/errors_overview.html" target="target">Errors and Error Handling Overview</a>.
           * @summary Represents the <code>OO.ERROR.VC</code> Ooyala V4 Player Errors.
       * @namespace OO.ERROR.VC
       */
      VC: {
        /**
        * @description <code>OO.ERROR.VC.UNSUPPORTED_ENCODING ('unsupported_encoding')</code>:
        *    This device does not have an available decoder for this stream type.
        * @constant OO.ERROR.VC.UNSUPPORTED_ENCODING
        * @type {string}
        */
        UNSUPPORTED_ENCODING:'unsupported_encoding',

        /**
        * @description <code>OO.ERROR.VC.UNABLE_TO_CREATE_VIDEO_ELEMENT ('unable_to_create_video_element')</code>:
        *    A video element to play the given stream could not be created.
        * @constant OO.ERROR.VC.UNABLE_TO_CREATE_VIDEO_ELEMENT
        * @type {string}
        */
        UNABLE_TO_CREATE_VIDEO_ELEMENT:'unable_to_create_video_element'
      }
    };

    // All Server-side URLS
    OO.URLS = {
      VAST_PROXY: _.template('http://player.ooyala.com/nuplayer/mobile_vast_ads_proxy?callback=<%=cb%>&embed_code=<%=embedCode%>&expires=<%=expires%>&tag_url=<%=tagUrl%>'),
      EXTERNAL_ID: _.template('<%=server%>/player_api/v1/content_tree/external_id/<%=pcode%>/<%=externalId%>'),
      CONTENT_TREE: _.template('<%=server%>/player_api/v1/content_tree/embed_code/<%=pcode%>/<%=embedCode%>'),
      METADATA: _.template('<%=server%>/player_api/v1/metadata/embed_code/<%=playerBrandingId%>/<%=embedCode%>?videoPcode=<%=pcode%>'),
      SAS: _.template('<%=server%>/player_api/v2/authorization/embed_code/<%=pcode%>/<%=embedCode%>'),
      ANALYTICS: _.template('<%=server%>/reporter.js'),
      THUMBNAILS: _.template('<%=server%>/api/v1/thumbnail_images/<%=embedCode%>'),
      __end_marker : true
    };

    OO.VIDEO = {
      MAIN: "main",
      ADS: "ads",

      /**
       * @description Represents the <code>OO.VIDEO.ENCODING</code> encoding types.
       * @summary Represents the <code>OO.VIDEO.ENCODING</code> encoding types.
       * @namespace OO.VIDEO.ENCODING
       */
      ENCODING: {
        /**
         * @description Represents DRM support for the encoding types.
         * @summary Represents the <code>OO.VIDEO.ENCODING.DRM</code> encoding types.
         * @namespace OO.VIDEO.ENCODING.DRM
         */
        DRM : {
          /**
           * @description <code>OO.VIDEO.ENCODING.DRM.HLS ('hls_drm')</code>:
           *   An encoding type for drm HLS streams.
           * @constant OO.VIDEO.ENCODING.DRM.HLS
           * @type {string}
           */
          HLS: "hls_drm",

          /**
           * @description <code>OO.VIDEO.ENCODING.DRM.DASH ('dash_drm')</code>:
           *   An encoding type for drm dash streams.
           * @constant OO.VIDEO.ENCODING.DRM.DASH
           * @type {string}
           */
          DASH: "dash_drm",
        },
        /**
         * @description <code>OO.VIDEO.ENCODING.AUDIO ('audio')</code>:
         *   An encoding type for non-drm audio streams.
         * @constant OO.VIDEO.ENCODING.AUDIO
         * @type {string}
         */
        AUDIO: "audio",

        /**
         * @description <code>OO.VIDEO.ENCODING.DASH ('dash')</code>:
         *   An encoding type for non-drm dash streams (mpd extension).
         * @constant OO.VIDEO.ENCODING.DASH
         * @type {string}
         */
        DASH: "dash",

        /**
         * @description <code>OO.VIDEO.ENCODING.HDS ('hds')</code>:
         *   An encoding type for non-drm hds streams (hds extension).
         * @constant OO.VIDEO.ENCODING.HDS
         * @type {string}
         */
        HDS: "hds",

        /**
         * @description <code>OO.VIDEO.ENCODING.HLS ('hls')</code>:
         *   An encoding type for non-drm HLS streams (m3u8 extension).
         * @constant OO.VIDEO.ENCODING.HLS
         * @type {string}
         */
        HLS: "hls",

        /**
         * @description <code>OO.VIDEO.ENCODING.IMA ('ima')</code>:
         *   A string that represents a video stream that is controlled and configured directly by IMA.
         * @constant OO.VIDEO.ENCODING.IMA
         * @type {string}
         */
        IMA: "ima",

        /**
         * @description <code>OO.VIDEO.ENCODING.PULSE ('pulse')</code>:
         *   A string that represents a video stream that is controlled and configured directly by Pulse.
         * @constant OO.VIDEO.ENCODING.PULSE
         * @type {string}
         */
        PULSE: "pulse",

        /**
         * @description <code>OO.VIDEO.ENCODING.MP4 ('mp4')</code>:
         *   An encoding type for non-drm mp4 streams (mp4 extension).
         * @constant OO.VIDEO.ENCODING.MP4
         * @type {string}
         */
        MP4: "mp4",

        /**
         * @description <code>OO.VIDEO.ENCODING.RTMP ('rtmp')</code>:
         *   An encoding type for non-drm rtmp streams.
         * @constant OO.VIDEO.ENCODING.RTMP
         * @type {string}
         */
        RTMP: "rtmp",

        /**
         * @description <code>OO.VIDEO.ENCODING.SMOOTH ('smooth')</code>:
         *   An encoding type for non-drm smooth streams.
         * @constant OO.VIDEO.ENCODING.SMOOTH
         * @type {string}
         */
        SMOOTH: "smooth",

        /**
         * @description <code>OO.VIDEO.ENCODING.WEBM ('webm')</code>:
         *   An encoding type for non-drm webm streams (webm extension).
         * @constant OO.VIDEO.ENCODING.WEBM
         * @type {string}
         */
        WEBM: "webm",

        /**
         * @description <code>OO.VIDEO.ENCODING.AKAMAI_HD_VOD ('akamai_hd_vod')</code>:
         *   An encoding type for akamai hd vod streams.
         * @constant OO.VIDEO.ENCODING.AKAMAI_HD_VOD
         * @type {string}
         */
        AKAMAI_HD_VOD: "akamai_hd_vod",

        /**
         * @description <code>OO.VIDEO.ENCODING.AKAMAI_HD2_VOD_HLS ('akamai_hd2_vod_hls')</code>:
         *   An encoding type for akamai hd2 vod hls streams.
         * @constant OO.VIDEO.ENCODING.AKAMAI_HD2_VOD_HLS
         * @type {string}
         */
        AKAMAI_HD2_VOD_HLS: "akamai_hd2_vod_hls",

        /**
         * @description <code>OO.VIDEO.ENCODING.AKAMAI_HD2_VOD_HDS ('akamai_hd2_vod_hds')</code>:
         *   An encoding type for akamai hd2 vod hds streams.
         * @constant OO.VIDEO.ENCODING.AKAMAI_HD2_VOD_HDS
         * @type {string}
         */
        AKAMAI_HD2_VOD_HDS: "akamai_hd2_vod_hds",

        /**
         * @description <code>OO.VIDEO.ENCODING.AKAMAI_HD2_HDS ('akamai_hd2_hds')</code>:
         *   An encoding type for akamai hd2 live/remote hds streams.
         * @constant OO.VIDEO.ENCODING.AKAMAI_HD2_HDS
         * @type {string}
         */
        AKAMAI_HD2_HDS: "akamai_hd2_hds",

        /**
         * @description <code>OO.VIDEO.ENCODING.AKAMAI_HD2_HLS ('akamai_hd2_hls')</code>:
         *   An encoding type for akamai hd2 live hls streams.
         * @constant OO.VIDEO.ENCODING.AKAMAI_HD2_HLS
         * @type {string}
         */
        AKAMAI_HD2_HLS: "akamai_hd2_hls",

        /**
         * @description <code>OO.VIDEO.ENCODING.FAXS_HLS ('faxs_hls')</code>:
         *   An encoding type for adobe faxs streams.
         * @constant OO.VIDEO.ENCODING.FAXS_HLS
         * @type {string}
         */
        FAXS_HLS: "faxs_hls",

        /**
         * @description <code>OO.VIDEO.ENCODING.WIDEVINE_HLS ('wv_hls')</code>:
         *   An encoding type for widevine hls streams.
         * @constant OO.VIDEO.ENCODING.WIDEVINE_HLS
         * @type {string}
         */
        WIDEVINE_HLS: "wv_hls",

        /**
         * @description <code>OO.VIDEO.ENCODING.WIDEVINE_MP4 ('wv_mp4')</code>:
         *   An encoding type for widevine mp4 streams.
         * @constant OO.VIDEO.ENCODING.WIDEVINE_MP4
         * @type {string}
         */
        WIDEVINE_MP4: "wv_mp4",

        /**
         * @description <code>OO.VIDEO.ENCODING.WIDEVINE_WVM ('wv_wvm')</code>:
         *   An encoding type for widevine wvm streams.
         * @constant OO.VIDEO.ENCODING.WIDEVINE_WVM
         * @type {string}
         */
        WIDEVINE_WVM: "wv_wvm",

        /**
         * @description <code>OO.VIDEO.ENCODING.UNKNOWN ('unknown')</code>:
         *   An encoding type for unknown streams.
         * @constant OO.VIDEO.ENCODING.UNKNOWN
         * @type {string}
         */
        UNKNOWN: "unknown"
      },

      /**
       * @description Represents the <code>OO.VIDEO.FEATURE</code> feature list. Used to denote which
       * features are supported by a video player.
       * @summary Represents the <code>OO.VIDEO.FEATURE</code> feature list.
       * @namespace OO.VIDEO.FEATURE
       */
      FEATURE: {
        /**
         * @description <code>OO.VIDEO.FEATURE.CLOSED_CAPTIONS ('closedCaptions')</code>:
         *   Closed captions parsed by the video element and sent to the player.
         * @constant OO.VIDEO.FEATURE.CLOSED_CAPTIONS
         * @type {string}
         */
        CLOSED_CAPTIONS: "closedCaptions",

        /**
         * @description <code>OO.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_GIVE ('videoObjectSharingGive')</code>:
         *   The video object is accessible and can be found by the player via the DOM element id.  Other
         *   modules can use this video object if required.
         * @constant OO.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_GIVE
         * @type {string}
         */
        VIDEO_OBJECT_SHARING_GIVE: "videoObjectSharingGive",

        /**
         * @description <code>OO.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_TAKE ('videoObjectSharingTake')</code>:
         *   The video object used can be created external from this video plugin.  This plugin will use the
         *   existing video element as its own.
         * @constant OO.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_TAKE
         * @type {string}
         */
        VIDEO_OBJECT_SHARING_TAKE: "videoObjectSharingTake",

        /**
         * @description <code>OO.VIDEO.FEATURE.BITRATE_CONTROL ('bitrateControl')</code>:
         *   The video object allows the playing bitrate to be selected via the SET_TARGET_BITRATE event.
         *   The video controller must publish BITRATE_INFO_AVAILABLE with a list of bitrate objects that can be selected.
         *   The video controller must publish BITRATE_CHANGED events with the bitrate object that was switched to.
         *   A bitrate object should at minimum contain height, width, and bitrate properties. Height and width
         *   should be the vertical and horizontal resoluton of the stream and bitrate should be in bits per second.
         * @constant OO.VIDEO.FEATURE.BITRATE_CONTROL
         * @type {string}
         */
        BITRATE_CONTROL: "bitrateControl"
      },

      /**
       * @description Represents the <code>OO.VIDEO.TECHNOLOGY</code> core video technology.
       * @summary Represents the <code>OO.VIDEO.TECHNOLOGY</code> core technology of the video element.
       * @namespace OO.VIDEO.TECHNOLOGY
       */
      TECHNOLOGY: {
        /**
         * @description <code>OO.VIDEO.TECHNOLOGY.FLASH ('flash')</code>:
         *   The core video technology is based on Adobe Flash.
         * @constant OO.VIDEO.TECHNOLOGY.FLASH
         * @type {string}
         */
        FLASH: "flash",

        /**
         * @description <code>OO.VIDEO.TECHNOLOGY.HTML5 ('html5')</code>:
         *   The core video technology is based on the native html5 'video' tag.
         * @constant OO.VIDEO.TECHNOLOGY.HTML5
         * @type {string}
         */
        HTML5: "html5",

        /**
         * @description <code>OO.VIDEO.TECHNOLOGY.MIXED ('mixed')</code>:
         *   The core video technology used may be based on any one of multiple core technologies.
         * @constant OO.VIDEO.TECHNOLOGY.MIXED
         * @type {string}
         */
        MIXED: "mixed",

        /**
         * @description <code>OO.VIDEO.TECHNOLOGY.OTHER ('other')</code>:
         *   The video is based on a core video technology that doesn't fit into another classification
         *   found in <code>OO.VIDEO.TECHNOLOGY</code>.
         * @constant OO.VIDEO.TECHNOLOGY.OTHER
         * @type {string}
         */
        OTHER: "other"
      }

    };

    OO.CSS = {
      VISIBLE_POSITION : "0px",
      INVISIBLE_POSITION : "-100000px",
      VISIBLE_DISPLAY : "block",
      INVISIBLE_DISPLAY : "none",
      VIDEO_Z_INDEX: 10000,
      SUPER_Z_INDEX: 20000,
      ALICE_SKIN_Z_INDEX: 11000,
      OVERLAY_Z_INDEX: 10500,
      TRANSPARENT_COLOR : "rgba(255, 255, 255, 0)",

      __end_marker : true
    };

    OO.TEMPLATES = {
      RANDOM_PLACE_HOLDER: ['[place_random_number_here]', '<now>', '[timestamp]', '<rand-num>', '[cache_buster]', '[random]'],
      REFERAK_PLACE_HOLDER: ['[referrer_url]', '[LR_URL]'],
      EMBED_CODE_PLACE_HOLDER: ['[oo_embedcode]'],
      MESSAGE : '\
                  <table width="100%" height="100%" bgcolor="black" style="padding-left:55px; padding-right:55px; \
                  background-color:black; color: white;">\
                  <tbody>\
                  <tr valign="middle">\
                  <td align="right"><span style="font-family:Arial; font-size:20px">\
                  <%= message %>\
                  </span></td></tr></tbody></table>\
                  ',
      __end_marker : true
    };

    OO.CONSTANTS = {
      // Ad frequency constants
      AD_PLAY_COUNT_KEY: "oo_ad_play_count",
      AD_ID_TO_PLAY_COUNT_DIVIDER: ":",
      AD_PLAY_COUNT_DIVIDER: "|",
      MAX_AD_PLAY_COUNT_HISTORY_LENGTH: 20,

      CONTROLS_BOTTOM_PADDING: 10,

      SEEK_TO_END_LIMIT: 4,

      CLOSED_CAPTIONS: {
        SHOWING: "showing",
        HIDDEN: "hidden",
        DISABLED: "disabled"
      },

      OOYALA_PLAYER_SETTINGS_KEY: 'ooyala_player_settings',

      __end_marker : true
    };

  }(OO,OO._));

(function(OO) {
  // place holder for all text resource key
  OO.TEXT = {
    ADS_COUNTDOWN: 'adsCountdown',
    ADS_COUNTDOWN_SECONDS: 'adsCountdownSeconds',
    LIVE: 'LIVE',

    __end_marker: true
  };

}(OO));

(function(OO) {
  OO.MESSAGES = {
    EN: {},
    ES: {},
    FR: {},
    JA: {}
  };

  var en = OO.MESSAGES.EN;
  var es = OO.MESSAGES.ES;
  var fr = OO.MESSAGES.FR;
  var ja = OO.MESSAGES.JA;

  // ENGLISH
  en[OO.ERROR.API.NETWORK] = "Cannot Contact Server";
  en[OO.ERROR.API.SAS.GENERIC] = "Invalid Authorization Response";
  en[OO.ERROR.API.SAS.GEO] = "This video is not authorized in your location";
  en[OO.ERROR.API.SAS.DOMAIN] = "This video is not authorized for your domain";
  en[OO.ERROR.API.SAS.FUTURE] = "This video will be available soon";
  en[OO.ERROR.API.SAS.PAST] = "This video is no longer available";
  en[OO.ERROR.API.SAS.DEVICE] = "This video is not authorized for playback on this device";
  en[OO.ERROR.API.SAS.PROXY] = "An anonymous proxy was detected. Please disable the proxy and retry.";
  en[OO.ERROR.API.SAS.CONCURRENT_STREAMS] = "You have exceeded the maximum number of concurrent streams";
  en[OO.ERROR.API.SAS.INVALID_HEARTBEAT] = "Invalid heartbeat response";
  en[OO.ERROR.API.SAS.ERROR_INVALID_ENTITLEMENTS] = "User Entitlement Terminated - Stream No Longer Active for the User";
  en[OO.ERROR.API.CONTENT_TREE] = "Invalid Content";
  en[OO.ERROR.API.METADATA] = "Invalid Metadata";
  en[OO.ERROR.PLAYBACK.GENERIC] = "Could not play the content";
  en[OO.ERROR.PLAYBACK.STREAM] = "This video isn't encoded for your device";
  en[OO.ERROR.PLAYBACK.LIVESTREAM] = "Live stream is off air";
  en[OO.ERROR.PLAYBACK.NETWORK] = "Network connection temporarily lost";
  en[OO.ERROR.UNPLAYABLE_CONTENT] = "This video is not playable on this player";
  en[OO.ERROR.INVALID_EXTERNAL_ID] = "Invalid External ID";
  en[OO.ERROR.EMPTY_CHANNEL] = "This channel is empty";
  en[OO.ERROR.EMPTY_CHANNEL_SET] = "This channel set is empty";
  en[OO.ERROR.CHANNEL_CONTENT] = "This channel is not playable at this time";
  en[OO.ERROR.VC_PLAY_FAILED] = "This video is not encoded for your device";
  en[OO.TEXT.ADS_COUNTDOWN] = "Advertisement: Your Video will resume shortly";
  en[OO.TEXT.ADS_COUNTDOWN_SECONDS] = "Advertisement: Your Video will resume in <%= time %> <%= seconds %>";
  en[OO.TEXT.LIVE] = "LIVE";

  // SPANISH
  es[OO.ERROR.API.NETWORK] = "No se puede contactar al servidor";
  es[OO.ERROR.API.SAS.GENERIC] = "Respuesta de autorización no válida";
  es[OO.ERROR.API.SAS.GEO] = "El vídeo no está autorizado en su ubicación";
  es[OO.ERROR.API.SAS.DOMAIN] = "El vídeo no está autorizado para su dominio";
  es[OO.ERROR.API.SAS.FUTURE] = "El vídeo estará disponible pronto";
  es[OO.ERROR.API.SAS.PAST] = "El vídeo ya no está disponible";
  es[OO.ERROR.API.SAS.DEVICE] = "El vídeo no está autorizado para reproducirse en este dispositivo";
  es[OO.ERROR.API.SAS.PROXY] = "Se detectó un proxy anónimo. Deshabilite el proxy e intente nuevamente.";
  es[OO.ERROR.API.SAS.CONCURRENT_STREAMS] = "Ha superado la cantidad máxima de transmisiones concurrentes";
  es[OO.ERROR.API.SAS.INVALID_HEARTBEAT] = "Respuesta de pulso no válida";
  es[OO.ERROR.API.SAS.ERROR_INVALID_ENTITLEMENTS] = "La suscripción del usuario a terminado - El video ya no está disponible para el usuario";
  es[OO.ERROR.API.CONTENT_TREE] = "Contenido no válido";
  es[OO.ERROR.API.METADATA] = "Metadatos no válidos";
  es[OO.ERROR.PLAYBACK.GENERIC] = "No se pudo reproducir el contenido";
  es[OO.ERROR.PLAYBACK.STREAM] = "El vídeo no está codificado para su dispositivo";
  es[OO.ERROR.PLAYBACK.LIVESTREAM] = "La transmisión en vivo está fuera del aire";
  es[OO.ERROR.PLAYBACK.NETWORK] = "La conexión de red se halla temporalmente perdida";
  es[OO.ERROR.UNPLAYABLE_CONTENT] = "El vídeo no se puede reproducir en este reproductor";
  es[OO.ERROR.INVALID_EXTERNAL_ID] = "ID externo no válido";
  es[OO.ERROR.EMPTY_CHANNEL] = "El canal está vacío";
  es[OO.ERROR.EMPTY_CHANNEL_SET] = "El conjunto de canales está vacío";
  es[OO.ERROR.CHANNEL_CONTENT] = "El canal no se puede reproducir en este momento";
  es[OO.ERROR.VC_PLAY_FAILED] = "El vídeo no está codificado para su dispositivo";
  es[OO.TEXT.ADS_COUNTDOWN] = "Anuncio: el vídeo se reanudará en breve";
  es[OO.TEXT.LIVE] = "EN VIVO";

  // FRENCH
  fr[OO.ERROR.API.NETWORK] = "Impossible de contacter le serveur";
  fr[OO.ERROR.API.SAS.GENERIC] = "Réponse d'autorisation non valide";
  fr[OO.ERROR.API.SAS.GEO] = "Cette vidéo n'est pas autorisée dans votre pays";
  fr[OO.ERROR.API.SAS.DOMAIN] = "Cette vidéo n'est pas autorisée pour votre domaine";
  fr[OO.ERROR.API.SAS.FUTURE] = "Cette vidéo sera bientôt disponible";
  fr[OO.ERROR.API.SAS.PAST] = "Cette vidéo n'est plus disponible";
  fr[OO.ERROR.API.SAS.DEVICE] = "La lecture de cette vidéo n'est pas autorisée sur cet appareil";
  fr[OO.ERROR.API.SAS.PROXY] = "Un proxy anonyme a été détecté. Désactivez le proxy, puis réessayez.";
  fr[OO.ERROR.API.SAS.CONCURRENT_STREAMS] = "Vous avez dépassé le nombre maximum de flux simultanés.";
  fr[OO.ERROR.API.SAS.INVALID_HEARTBEAT] = "Réponse du signal de pulsation ('heartbeat') non valide";
  fr[OO.ERROR.API.CONTENT_TREE] = "Contenu non valide";
  fr[OO.ERROR.API.METADATA] = "Métadonnées non valides";
  fr[OO.ERROR.PLAYBACK.GENERIC] = "Impossible de lire le contenu";
  fr[OO.ERROR.PLAYBACK.STREAM] = "Cette vidéo n'est pas encodée pour votre appareil";
  fr[OO.ERROR.PLAYBACK.LIVESTREAM] = "Le flux direct a été interrompu";
  fr[OO.ERROR.PLAYBACK.NETWORK] = "Connexion au réseau temporairement interrompue";
  fr[OO.ERROR.UNPLAYABLE_CONTENT] = "Vous ne pouvez pas lire cette vidéo sur ce lecteur";
  fr[OO.ERROR.INVALID_EXTERNAL_ID] = "Identifiant externe non valide";
  fr[OO.ERROR.EMPTY_CHANNEL] = "Cette chaîne est vide";
  fr[OO.ERROR.EMPTY_CHANNEL_SET] = "Ce groupe de chaînes est vide";
  fr[OO.ERROR.CHANNEL_CONTENT] = "Vous ne pouvez pas lire cette chaîne pour le moment";
  fr[OO.ERROR.VC_PLAY_FAILED] = "Cette vidéo n'est pas encodée pour votre appareil";
  fr[OO.TEXT.ADS_COUNTDOWN] = "Publicité : votre vidéo reprendra bientôt";
  fr[OO.TEXT.LIVE] = "EN DIRECT";

  // JAPANESE
  ja[OO.ERROR.API.NETWORK] = "後でご確認ください。";
  ja[OO.ERROR.API.SAS.GENERIC] = "ビデオを認証できません。";
  ja[OO.ERROR.API.SAS.GEO] = "この地域ではこのビデオは許可されていません。";
  ja[OO.ERROR.API.SAS.DOMAIN] = "お使いのドメインではこのビデオは許可されていません。";
  ja[OO.ERROR.API.SAS.FUTURE] = "このビデオはしばらくすると再生可能になります。";
  ja[OO.ERROR.API.SAS.PAST] = "このビデオは、既に御利用いただけません。";
  ja[OO.ERROR.API.SAS.DEVICE] = "このビデオは、このデバイスでの再生は許可されていません。";
  ja[OO.ERROR.API.SAS.CONCURRENT_STREAMS] = "最大同時接続数を超えています。";
  ja[OO.ERROR.API.SAS.INVALID_HEARTBEAT] = "同時再生ストリームの最大数に達しました。";
  ja[OO.ERROR.API.CONTENT_TREE] = "不正なコンテンツです。";
  ja[OO.ERROR.API.METADATA] = "不正なメタデータです。";
  ja[OO.ERROR.PLAYBACK.GENERIC] = "このコンテンツを再生できませんでした。";
  ja[OO.ERROR.PLAYBACK.STREAM] = "このビデオは、お使いのデバイス向けにエンコードされていません。";
  ja[OO.ERROR.PLAYBACK.LIVESTREAM] = "ライブ配信はされておりません。";
  ja[OO.ERROR.PLAYBACK.NETWORK] = "ネットワークに一時的に接続できません。";
  ja[OO.ERROR.UNPLAYABLE_CONTENT] = "このビデオは、このプレーヤーでは再生できません。";
  ja[OO.ERROR.INVALID_EXTERNAL_ID] = "External IDが不正です。";
  ja[OO.ERROR.EMPTY_CHANNEL] = "このチャンネルは空です。";
  ja[OO.ERROR.EMPTY_CHANNEL_SET] = "このチャンネルセットは空です。";
  ja[OO.ERROR.CHANNEL_CONTENT] = "このチャンネルは、現在再生できません。";
  ja[OO.ERROR.VC_PLAY_FAILED] = "このビデオは、お使いのデバイス向けにエンコードされていません。";
  ja[OO.TEXT.ADS_COUNTDOWN] = "広告：";
  ja[OO.TEXT.ADS_COUNTDOWN_SECONDS] = "広告: <%= time %>数秒後にビデオの再生が開始します";
  ja[OO.TEXT.LIVE] = "ライブ";
  OO.getLocalizedMessage = function(code) {
    var language = OO.getLocale();
    return (OO.MESSAGES[language] ? OO.MESSAGES[language][code] : undefined) ||
           OO.MESSAGES.EN[code] ||
           "";
  };
}(OO));

  (function(OO) {
    OO.stylus_css = {
      'root.styl' : "#<%= elementId %>>div{width:0;height:0;position:relative;z-index:10000;overflow:hidden}#<%= elementId %> .innerWrapper{background:#000;text-align:left}#<%= elementId %> .innerWrapper:-webkit-full-screen{width:100%;height:100%}#<%= elementId %> .innerWrapper:-webkit-full-screen video{width:100%}#<%= elementId %> .innerWrapper.fullscreen{position:fixed;top:0;left:0;width:100%;height:100%;background:#fff}#<%= elementId %> .oo_playhead{-ms-touch-action:none}",
      __end_marker:1 };
  }(OO));

    OO.VERSION.core.rev='796778274824b347eb703933c94ac0861292e621';


  (function(OO) {
    OO.get_css = function(cssName) {
      if (!OO.stylus_css || !cssName) { return null; }
      return OO.stylus_css[cssName + ".styl"];
    };

  }(OO));
  (function(OO,_,$) {
    OO.getRandomString = function() { return Math.random().toString(36).substring(7); };

    OO.safeClone = function(source) {
      if (_.isNumber(source) || _.isString(source) || _.isBoolean(source) || _.isFunction(source) ||
          _.isNull(source) || _.isUndefined(source)) {
        return source;
      }
      var result = (source instanceof Array) ? [] : {};
      try {
        $.extend(true, result, source);
      } catch(e) { OO.log("deep clone error", e); }
      return result;
    };

    OO.d = function() {
      if (OO.isDebug) { OO.log.apply(OO, arguments); }
      OO.$("#OOYALA_DEBUG_CONSOLE").append(JSON.stringify(OO.safeClone(arguments))+'<br>');
    };

    // Note: This inherit only for simple inheritance simulation, the Parennt class still has a this binding
    // to the parent class. so any variable initiated in the Parent Constructor, will not be available to the
    // Child Class, you need to copy paste constructor to Child Class to make it work.
    // coffeescript is doing a better job here by binding the this context to child in the constructor.
    // Until we switch to CoffeeScript, we need to be careful using this simplified inherit lib.
    OO.inherit = function(ParentClass, myConstructor) {
      if (typeof(ParentClass) !== "function") {
        OO.log("invalid inherit, ParentClass need to be a class", ParentClass);
        return null;
      }
      var SubClass = function() {
        ParentClass.apply(this, arguments);
        if (typeof(myConstructor) === "function") { myConstructor.apply(this, arguments); }
      };
      var parentClass = new ParentClass();
      OO._.extend(SubClass.prototype, parentClass);
      SubClass.prototype.parentClass = parentClass;
      return SubClass;
    };

    var styles = {}; // keep track of all styles added so we can remove them later if destroy is called

    OO.attachStyle = function(styleContent, playerId) {
      var s = $('<style type="text/css">' + styleContent + '</style>').appendTo("head");
      styles[playerId] = styles[playerId] || [];
      styles[playerId].push(s);
    };

    OO.removeStyles = function(playerId) {
      OO._.each(styles[playerId], function(style) {
        style.remove();
      });
    };

    // object: object to get the inner property for, ex. {"mod":{"fw":{"data":{"key":"val"}}}}
    // keylist: list of keys to find, ex. ["mod", "fw", "data"]
    // example output: {"key":"val"}
    OO.getInnerProperty = function(object, keylist) {
      var innerObject = object;
      var list = keylist;
      while (list.length > 0) {
        var key = list.shift();
        // Note that function and arrays are objects
        if (_.isNull(innerObject) || !_.isObject(innerObject) ||
            _.isFunction(innerObject) || _.isArray(innerObject)) {
          return null;
        }
        innerObject = innerObject[key];
      }
      return innerObject;
    };

    OO.formatSeconds = function(timeInSeconds) {
      var seconds = parseInt(timeInSeconds,10) % 60;
      var hours = parseInt(timeInSeconds / 3600, 10);
      var minutes = parseInt((timeInSeconds - hours * 3600) / 60, 10);


      if (hours < 10) {
        hours = '0' + hours;
      }

      if (minutes < 10) {
        minutes = '0' + minutes;
      }

      if (seconds < 10) {
        seconds = '0' + seconds;
      }

      return (parseInt(hours,10) > 0) ? (hours + ":" + minutes + ":" + seconds) : (minutes + ":" + seconds);
    };

    OO.timeStringToSeconds = function(timeString) {
      var timeArray = (timeString || '').split(":");
      return _.reduce(timeArray, function(m, s) { return m * 60 + parseInt(s, 10); }, 0);
    };

    OO.leftPadding = function(num, totalChars) {
      var pad = '0';
      var numString = num ? num.toString() : '';
      while (numString.length < totalChars) {
        numString = pad + numString;
      }
      return numString;
    };

    OO.getColorString = function(color) {
      return '#' + (OO.leftPadding(color.toString(16), 6)).toUpperCase();
    };

    OO.hexToRgb = function(hex) {
      var r = (hex & 0xFF0000) >> 16;
      var g = (hex & 0xFF00) >> 8;
      var b = (hex & 0xFF);
      return [r, g, b];
    };

    OO.changeColor = function(color, ratio, darker) {
      var minmax     = darker ? Math.max : Math.min;
      var boundary = darker ? 0 : 255;
      var difference = Math.round(ratio * 255) * (darker ? -1 : 1);
      var rgb = OO.hexToRgb(color);
      return [
        OO.leftPadding(minmax(rgb[0] + difference, boundary).toString(16), 2),
        OO.leftPadding(minmax(rgb[1] + difference, boundary).toString(16), 2),
        OO.leftPadding(minmax(rgb[2] + difference, boundary).toString(16), 2)
      ].join('');
    };

    OO.decode64 = function(s) {
      s = s.replace(/\n/g,"");
      var results = "";
      var j, i = 0;
      var enc = [];
      var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

      //shortcut for browsers with atob
      if (window.atob) {
        return atob(s);
      }

      do {
        for (j = 0; j < 4; j++) {
          enc[j] = b64.indexOf(s.charAt(i++));
        }
        results += String.fromCharCode((enc[0] << 2) | (enc[1] >> 4),
                                        enc[2] == 64 ? 0 : ((enc[1] & 15) << 4) | (enc[2] >> 2),
                                        enc[3] == 64 ? 0 : ((enc[2] & 3) << 6) | enc[3]);
      } while (i < s.length);

      //trim tailing null characters
      return results.replace(/\0/g, "");
    };

    OO.pixelPing = function (url) {
      var img = new Image();
      img.onerror = img.onabort = function() { OO.d("onerror:", url); };
      img.src = OO.getNormalizedTagUrl(url);
    };

    // ping array of urls.
    OO.pixelPings = function (urls) {
        if (_.isEmpty(urls)) { return; }
        _.each(urls, function(url) {
          OO.pixelPing(url);
        }, this);
    };

    // helper function to convert types to boolean
    // the (!!) trick only works to verify if a string isn't the empty string
    // therefore, we must use a special case for that
    OO.stringToBoolean = function(value) {
      if (typeof value === 'string') {
        return (value.toLowerCase().indexOf("true") > -1 || value.toLowerCase().indexOf("yes") > -1);
      }
      return !!value;
    }

    OO.regexEscape = function(value) {
      var specials = /[<>()\[\]{}]/g;
      return value.replace(specials, "\\$&");
    };

    OO.getNormalizedTagUrl = function (url, embedCode) {
      var ts = new Date().getTime();
      var pageUrl = escape(document.URL);

      var placeHolderReplace = function (template, replaceValue) {
        _.each(template, function (placeHolder) {
          var regexSearchVal = new RegExp("(" +
                                    OO.regexEscape(placeHolder) + ")", 'gi');
          url = url.replace(regexSearchVal, replaceValue);
        }, this);
      }

      // replace the timestamp and referrer_url placeholders
      placeHolderReplace(OO.TEMPLATES.RANDOM_PLACE_HOLDER, ts);
      placeHolderReplace(OO.TEMPLATES.REFERAK_PLACE_HOLDER, pageUrl);

      // first make sure that the embedCode exists, then replace the
      // oo_embedcode placeholder
      if (embedCode) {
        placeHolderReplace(OO.TEMPLATES.EMBED_CODE_PLACE_HOLDER, embedCode);
      }
      return url;
    };

    OO.safeSeekRange = function(seekRange) {
      return {
        start : seekRange.length > 0 ? seekRange.start(0) : 0,
        end : seekRange.length > 0 ? seekRange.end(0) : 0
      };
    };

    OO.loadedJS = OO.loadedJS || {};

    OO.jsOnSuccessList = OO.jsOnSuccessList || {};

    OO.safeFuncCall = function(fn) {
      if (typeof fn !== "function") { return; }
      try {
        fn.apply();
      } catch (e) {
        OO.log("Can not invoke function!", e);
      }
    };

    OO.loadScriptOnce = function(jsSrc, successCallBack, errorCallBack, timeoutInMillis) {
      OO.jsOnSuccessList[jsSrc] = OO.jsOnSuccessList[jsSrc] || [];
      if (OO.loadedJS[jsSrc]) {
        // invoke call back directly if loaded.
        if (OO.loadedJS[jsSrc] === "loaded") {
          OO.safeFuncCall(successCallBack);
        } else if (OO.loadedJS[jsSrc] === "loading") {
          OO.jsOnSuccessList[jsSrc].unshift(successCallBack);
        }
        return false;
      }
      OO.loadedJS[jsSrc] = "loading";
      $.ajax({
        url: jsSrc,
        type: 'GET',
        cache: true,
        dataType: 'script',
        timeout: timeoutInMillis || 15000,
        success: function() {
          OO.loadedJS[jsSrc] = "loaded";
          OO.jsOnSuccessList[jsSrc].unshift(successCallBack);
          OO._.each(OO.jsOnSuccessList[jsSrc], function(fn) {
            OO.safeFuncCall(fn);
          }, this);
          OO.jsOnSuccessList[jsSrc] = [];
        },
        error: function() {
          OO.safeFuncCall(errorCallBack);
        }
      });
      return true;
    };

    try {
      OO.localStorage = window.localStorage;
    } catch (err) {
      OO.log(err);
    }
    if (!OO.localStorage) {
      OO.localStorage = {
        getItem: function (sKey) {
          if (!sKey || !this.hasOwnProperty(sKey)) { return null; }
          return unescape(document.cookie.replace(new RegExp("(?:^|.*;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*((?:[^;](?!;))*[^;]?).*"), "$1"));
        },
        key: function (nKeyId) {
          return unescape(document.cookie.replace(/\s*\=(?:.(?!;))*$/, "").split(/\s*\=(?:[^;](?!;))*[^;]?;\s*/)[nKeyId]);
        },
        setItem: function (sKey, sValue) {
          if(!sKey) { return; }
          document.cookie = escape(sKey) + "=" + escape(sValue) + "; expires=Tue, 19 Jan 2038 03:14:07 GMT; path=/";
          this.length = document.cookie.match(/\=/g).length;
        },
        length: 0,
        removeItem: function (sKey) {
          if (!sKey || !this.hasOwnProperty(sKey)) { return; }
          document.cookie = escape(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
          this.length--;
        },
        hasOwnProperty: function (sKey) {
          return (new RegExp("(?:^|;\\s*)" + escape(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
        }
      };
      OO.localStorage.length = (document.cookie.match(/\=/g) || OO.localStorage).length;
    }

    // A container to properly request OO.localStorage.setItem
    OO.setItem = function (sKey, sValue) {
      try {
        OO.localStorage.setItem(sKey, sValue);
      } catch (err) {
        OO.log(err);
      }
    };

    OO.JSON = window.JSON;

  }(OO, OO._, OO.$));

  (function(OO,_) {

    OO.Emitter  = function(messageBus){
      this.mb = messageBus;
      this._subscribers = {};
    };

    _.extend(OO.Emitter.prototype,  {
      on  : function(eventName, subscriber, callback){
        this._subscribers[eventName] = this._subscribers[eventName]  || [];
        this._subscribers[eventName].push({callback: callback, subscriber: subscriber});
      },

      off  : function(eventName, subscriber, callback){
        this._subscribers[eventName] = _.reject(this._subscribers[eventName] || [], function(elem) {
          return (elem.callback == callback || callback === undefined) && elem.subscriber === subscriber;
        });
      },

      trigger  : function(eventName /* , args... */){
        _.each(this._subscribers[eventName] || [], _.bind(this._triggerSubscriber, this, eventName, arguments));
        _.each(this._subscribers['*'] || [], _.bind(this._triggerSubscriber, this, eventName, arguments));
      },

      _triggerSubscriber : function(eventName, params, subscriber) {
        try {
          subscriber.callback.apply(this,params);
        } catch (e) {
          var stack = e.stack || "unavailable";
          OO.log('Uncaught exception', e, 'Stack', stack,'triggering subscriber', subscriber,
            'with event',eventName, 'Parameters: ', params);
        }
      },

      __placeholder:true
    });

  }(OO, OO._));

  (function(OO,_) {
    /**
     * @classdesc Represents the Ooyala V4 Player Message Bus. Use message bus events to subscribe to or publish player events from video to ad playback.
     * <p>When you create an {@link OO.Player} object (for example, <code>myplayer = OO.Player.create(...)</code> ), that object contains a Message Bus object named <code>mb</code>.
     * For example, you would access the <code><a href="#publish">publish()</a></code> method by calling <code>myplayer.mb.publish(...)</code>.</p>
     * @class
     * @public
     */
    OO.MessageBus = function() {
      this._emitter = new OO.Emitter(this);
      this._dependentEmitter = new OO.Emitter(this);
      this._interceptEmitter = new OO.Emitter(this);
      this._interceptArgs = {};
      this._dependentList = {};
      this._blockList = {};
      this._readyEventList = {};
      this._dispatching = false;   // whether message bus is currently dispatching published events
      this._publishingQueue = [];
      this.blockedEvent = {};
      this.blockedParams = {};

      // public properties
      this._messageHistory = [];
      this._tracer = _.bind(this._internalTracer, this);   // default internal tracer

      // add a random ID for debug
      this.MbId = OO.getRandomString();

      this.debug = false;
    };

    _.extend(OO.MessageBus.prototype,  {
      // Adds a tracer function, which will be fired for each published/executed event
      addTracer: function(newTracer) {
        if(newTracer && _.isFunction(newTracer)) {
          if(this._tracer) {
            this._tracer = _.wrap(this._tracer, function(f) { newTracer.apply(this, _.rest(arguments)); });
          } else {
            this._tracer = newTracer;
          }
        }
      },

      _internalTracer: function() {
        this._messageHistory.push(_.toArray(arguments));
      },

      messageTraceSnapshot: function() {
        return _.toArray(this._messageHistory);
      },

      /*
       * addDependent blocks eventName until dependentEvent fires, at which point onMergeParams will be
       * called.  This means that eventName MUST be fired before dependentEvent.
       */
      /**
       * Enables you to send a publish or subscribe message that is dependent on a condition or event.
       * For example, you might want to change the UI based on the location or time of day.
       * This method blocks the event (<code>eventName</code>) until the dependent event (<code>dependentEvent</code>) fires.
       * For more information and examples of usage, see
       * <a href="http://support.ooyala.com/developers/documentation/reference/player_v3_dev_listenevent.html" target="target">Listening to a Message Bus Event</a>.
       *
       * @method addDependent
       * @memberOf OO.MessageBus.prototype
       * @param {String} eventName The name of the event.
       * @param {String} dependentEvent The name of the event that triggers the specified event name.
       * @param {String} subscriber The name of the subscriber to which the message bus will publish the event.
       * @param {function} onMergeParams (Optional) A function used to pass data to the handler for the dependent event.
       * This function is only necessary if need to complete a computation before passing data to the dependent event handler.
       * This function can take up to four arguments and returns an array of arguments to be passed into the dependent event listener.
       * @example
       *        //  This blocks the PAUSED event from firing until
       *        // the 'user_allowed_pause' event has fired
       *        player.mb.addDependent(
       *          OO.EVENTS.PAUSED,
       *          'user_allowed_pause',
       *          'example',
       *          function(){}
       *        );
       * @public
       */
      addDependent: function(eventName, dependentEvent, subscriber, onMergeParams){
        // TODO, add a circular detectecion here.
        if (!eventName || eventName == "" || !dependentEvent || dependentEvent == "") {
          console.error("MB: addDependent called on message bus from subscriber " + subscriber + " with no event name given.");
          return;
        }

        if (this.debug) {
          OO.log("MB DEBUG: \'" + eventName + "\' depends on \'" + dependentEvent + "\'. Added by \'" + subscriber + "\'");
        }

        this._dependentList[eventName] = this._dependentList[eventName] || [];
        this._dependentList[eventName].push(dependentEvent);
        this._blockList[dependentEvent] = this._blockList[dependentEvent] || [];
        this._blockList[dependentEvent].push(eventName);
        this.blockedParams[eventName] = [];

        var onSourceReady = OO._.bind(function(e) {
          if (this.blockedEvent[e] != 1) {
            return;
          }

          var args = OO.safeClone(_.flatten(arguments));
          var origParams = OO.safeClone(this.blockedParams[eventName]);
          args.shift(); origParams.shift();

          var newArgs = onMergeParams && onMergeParams.apply(this, [eventName, dependentEvent, origParams, args]) || origParams;
          newArgs = [e].concat(newArgs);
          delete this.blockedEvent[e];
          this.blockedParams[e] = [];

          if (this.debug) {
            OO.log("MB DEBUG: unblocking \'" + e + "\' because of \'" + dependentEvent + "\' with args ", newArgs);
          }

          this._publish.apply(this, newArgs);

        }, this);

        this._dependentEmitter.on(eventName, subscriber, onSourceReady);
      },

      /**
       * Removes all dependencies on event 'source' by event 'target'
       * @memberOf OO.MessageBus.prototype
       * @param {string} source The depending event that is blocked
       * @param {string} target The dependent event that is blocking
       * @public
       */
      removeDependent: function(source, target) {
        if (!source || source == "" || !target || target == "") {
          console.warn("MB: removeDependent called on message bus with no event name given.");
          return;
        }

        if (this.debug) {
          OO.log("MB DEBUG: \'" + source + "\' no longer depends on \'" + target + "\'");
        }

        this._clearDependent(source, target);
      },

      /**
       * Enables you to publish events to the message bus.<br/>
       *
       * @method publish
       * @memberOf OO.MessageBus.prototype
       * @param {String} eventName The name of the event. Comma-separated arguments for the event may follow the event name as needed.
       * @example myplayer.mb.publish(OO.EVENTS.PLAY);
       * @example myplayer.mb.publish(OO.EVENTS.WILL_CHANGE_FULLSCREEN,true);
       * @public
       */
      publish: function() {
        if (!arguments || !arguments[0] || arguments[0] == "") {
          console.error("MB: publish called on message bus with no event name given.");
          return;
        }

        var args = OO.safeClone(_.flatten(arguments));
        this._publishingQueue.push(args);

        if (this.debug) {
          OO.log("MB DEBUG: queueing \'" + arguments[0] + "\' w\/ args", args);
        }

        if(!this._dispatching) {
          this._dispatching = true;
          var ev = this._publishingQueue.shift();
          while(ev) {
            this._publish.apply(this, ev);
            ev = this._publishingQueue.shift();
          }
          this._dispatching = false;
        }
      },


      _publish: function(eventName) {
        // queue event here untill all dependency is cleared.
        // also trigger queued event if there are blocked by this event.
        this._readyEventList[eventName] = 1;
        var args = OO.safeClone(_.flatten(arguments));

        this._interceptEmitter.trigger.apply(this._interceptEmitter, args);
        if (this._interceptArgs[eventName] === false) { this._interceptArgs[eventName] = true; return; }
        if (this._interceptArgs[eventName]) {
          args = _.flatten([eventName, this._interceptArgs[eventName]]);
        }

        if(this._tracer && _.isFunction(this._tracer)) {
          var params = _.flatten(['publish'].concat(args));
          this._tracer.apply(this._tracer, params);
        }

        if (this._noDependency(eventName)) {
          if (this.debug) {
            OO.log("MB DEBUG: publishing \'" + eventName + "\' w\/ args ", args);
          }

          this._emitter.trigger.apply(this._emitter, args);
          _.each(this._blockList[eventName], function(e) {
            this._clearDependent(e, eventName);
            args[0] = e;
            this._dependentEmitter.trigger.apply(this._dependentEmitter, args);
          }, this);
          delete this._blockList[eventName];
        } else {
          if (this.debug) {
            OO.log("MB DEBUG: blocking \'" + eventName + "\' because of \'" + this._dependentList ? this._dependentList[eventName] : "[null]"  + "\'");
          }
          this.blockedEvent[eventName] = 1;
          this.blockedParams[eventName] = args;
        }
      },

      /*
       * eventName is the event to intercept
       * subscriber is the subscriber
       * callback returns a list of arguments, not including the eventName
       */
      /**
       * Enables you to subscribe to events to the message bus using a callback function that
       * allows you to manipulate the event payload and name. The returned list of arguments
       * from the callback can be used in subsequent event triggers. For more information and examples of usage, see
       * <a href="http://support.ooyala.com/developers/documentation/reference/player_v3_dev_listenevent.html" target="target">Listening to a Message Bus Event</a>.<br/>
       *
       * @method intercept
       * @memberOf OO.MessageBus.prototype
       * @param {String} eventName The name of the event to intercept.
       * @param {String} subscriber The name of the subscriber to which the message bus will publish the event.
       * @param {function} callback A function that returns a list of arguments used in subsequent event triggers.
       * This allows you to manipulate the event payload and name. To cancel propagation of an event using an intercepter,
       * return <code>false</code> instead of an array.
       * @example In the following example we subscribe to the published message bus PLAY event,
       * specify 'test-plugin' as the subscriber and specify a payload of 'hello'.
       *
       * We also include an intercept that swaps the string 'goodbye' into the payload
       * so that when the message bus publishes the PLAY event, the console outputs 'goodbye' instead of 'hello':
       *
       * mb.subscribe(OO.EVENTS.PLAY, "test-plugin", function(eventName, payload) {
       *    console.log(eventName+": "+payload);
       * });
       *
       * mb.publish(OO.EVENTS.PLAY, "hello");
       *
       * // Console displays "play: hello"
       *
       * mb.intercept(OO.EVENTS.PLAY, "test-plugin", function(eventName, payload) {
       *     return ["goodbye"];
       * });
       *
       * //   Console displays "play: goodbye"
       * @private
       */
      intercept: function(eventName, subscriber, callback) {
        this._interceptEmitter.on(eventName, subscriber, _.bind(function(e) {
          if (!eventName || eventName == "") {
            console.error("MB: intercept called on message bus from subscriber " + subscriber + " with no event name given.");
            return;
          }
          var args = OO.safeClone(_.flatten(arguments));
          if (this._interceptArgs[eventName] != false) {
            this._interceptArgs[eventName] = callback.apply(this, args);
          }
        }, this));
        this._interceptArgs[eventName] = [eventName];
      },

      /**
       * Subscribe to an event published to the message bus.
       *
       * @method subscribe
       * @memberOf OO.MessageBus.prototype
       * @param {String} eventName The name of the event.
       * @param {String} subscriber The name of the subscriber to which the message bus will publish the event.
       * @param {Function} callback The function that will execute when the subscriber receives the event notification.
       * @example myplayer.mb.subscribe(OO.EVENTS.METADATA_FETCHED, 'example', function(eventName) {});
       * @example // Subscribes to all events published by the Message Bus
       * messageBus.subscribe("*", 'example', function(eventName) {});
       * @public
       */
      subscribe: function(eventName, subscriber, callback) {
        // TODO check if it is on the dependent queue, should not allow this action if a event is blocking
        // other event.
        if (!eventName || eventName == "") {
          console.error("MB: subscribe called on message bus from subscriber " + subscriber + " with no event name given.");
          return;
        }
        this._emitter.on(eventName, subscriber, callback);
      },

      /**
       * Unsubscribes from an event published to the message bus.
       *
       * @method unsubscribe
       * @memberOf OO.MessageBus.prototype
       * @param {String} eventName The name of the event.
       * @param {String} subscriber The name of the subscriber to which the message bus will unsubscribe from the event.
       * @param {Function} callback The function that normally executes when the subscriber receives the event notification.
       * @example messageBus.unsubscribe(OO.EVENTS.METADATA_FETCHED, 'example', function(eventName) {});
       * @example // Unsubscribes from all events published by the Message Bus
       * messageBus.unsubscribe("*", 'example', function(eventName) {});
       * @public
       */
      unsubscribe: function(eventName, subscriber, callback) {
        if (!eventName || eventName == "") {
          console.error("MB: unsubscribe called on message bus from subscriber " + subscriber + " with no event name given.");
          return;
        }
        this._emitter.off(eventName, subscriber, callback);
      },

      // Start of the private member function, all internal used func will prefix with _

      _noDependency: function(eventName) {
        if (!this._dependentList[eventName]) { return true; }
        return (this._dependentList[eventName].length === 0);
      },

      _clearDependent: function(source, target) {
        var depEvents = this._dependentList[source];
        this._dependentList[source] = OO._.filter(depEvents, function(e){ return e !== target; }, this);
      },

      /////////////////////
      //// DEBUG TOOLS ////
      /////////////////////

      /**
       * Start debugging the message bus messages. It will display when dependents are added,
       * when they are removed, when messages get blocked, when messages are queued
       * and when they actually get published.
       *
       * This is mainly intended to be used in the console when debugging.
       * @private
       * @return {string} Message that states debugging has started. (Mostly for console output)
       */
      startDebug: function() {
        this.debug = true;
        return "MB DEBUGGING STARTED";
      },

      /**
       * Stop debugging the message bus messages.
       *
       * This is mainly intended to be used in the console when debugging.
       * @private
       * @return {string} Message that states debugging has stopped. (Mostly for console output)
       */
      stopDebug: function() {
        this.debug = false;
        return "MB DEBUGGING STOPPED";
      },

      /**
       * Return a test formatted string of the dependent messages and which ones are
       * currently blocked.
       * @private
       * @return {string} Formatted string of dependent messages and which ones are blocked.
       */
      listDependencies: function() {
        var output = "------------------------------------\n" +
                     "[blocked] Message --> Dependency\n" +
                     "------------------------------------\n"
        var index;
        if (this._dependentList) {
          for (var eventName in this._dependentList) {
            if (this._dependentList[eventName]) {
              for (index = 0; index < this._dependentList[eventName].length; index++) {
                if (this.blockedEvent[eventName] == 1) {
                  output += "[blocked]";
                }

                output += eventName + " --> " + this._dependentList[eventName] + "\n";
              }
            }
          }
        }

        output += "------------------------------------";
        return output;
      }

    });

  }(OO,OO._));

(function (OO, _) {
  OO.StateMachine = {

    //Based on https://github.com/jakesgordon/javascript-state-machine
    create: function(_cfg) {
      // validate parameters
      var cfg = OO.HM.safeObject('statemachine.create.cfg', _cfg);
      var initial = OO.HM.safeDomId('statemachine.create.cfg.initial', cfg.initial);
      var fsm = OO.HM.safeObject('statemachine.create.cfg.target', cfg.target, {});
      var events = OO.HM.safeArrayOfElements('statemachine.create.cfg.events', cfg.events, function(element){ return OO.HM.safeObject('statemachine.create.cfg.events[]', element); }, []);
      var moduleName = OO.HM.safeString('statemachine.create.cfg.moduleName', cfg.moduleName,"");
      var mb = OO.HM.safeObject('statemachine.create.cfg.messageBus', cfg.messageBus);

      var map        = {};
      var n;

      fsm.debugTransitions = false;
      var lastEvent = "";

      OO.StateMachine.addToActiveList(cfg.moduleName, fsm);

      var doCallback = function(name) {
        var f = null;
        var shortEventName = name.replace(/[^\/]*\//,'').match(/^(.)(.*)/);   // transform xxx/abc into ['abc','a','bc']
        var shortMethodName = 'on'+shortEventName[1].toUpperCase() + shortEventName[2];
        if(fsm[shortMethodName]) {
          f = fsm[shortMethodName];
        } else {
          var fullEventName = name.replace(/\/.*/, '').match(/^(.)(.*)/);    // transform xyz/abc into ['xyz','x','yz']
          var fullMethodName = 'on'+fullEventName[1].toUpperCase() + fullEventName[2] + shortEventName[1].toUpperCase() + shortEventName[2];
          if(fsm[fullMethodName]) {
            f = fsm[fullMethodName];
          }
        }

        if (f) {
          try {
            var result = f.apply(fsm, arguments);
            return (result !== false ? 'ok' : 'fail');
          }
          catch(e) {
            OO.log(e);
            if(OO.TEST_TEST_TEST) {
              throw e;  // rethrow in test environment
            }
            return 'fail';
          }
        }

        // callback not found
        return 'not_found';
      };

      var add = function(e) {
        var from = (e.from instanceof Array) ? e.from : (e.from ? [e.from] : ['*']); // allow 'wildcard' transition if 'from' is not specified
        var n;
        map[e.name] = map[e.name] || {};
        for (n = 0 ; n < from.length ; n++) {
          map[e.name][from[n]] = e.to || from[n]; // allow no-op transition if 'to' is not specified
        }
      };

      fsm.removeEvent = function(eventname) {
        if (map[eventname]) map[eventname] = null;
      }

      fsm.destroyFsm = function() {
        OO.StateMachine.removeFromActiveList(this.moduleName, this);
        for (n in map) {
          mb.unsubscribe(n.toString(), moduleName, fsm.receive);
        }
        cfg = null;
        initial = null;
        fsm = null;
        events = null;
        moduleName = null;
        mb = null;
        map = {};
      };

      var updateState = function(fsm, state) {
        if (!fsm || state === "*") { return; } // no op  for * state
        if (fsm.debugTransitions) {
          OO.log( "Transition " + (moduleName ? moduleName : "") +
                  "\n  OldState: " + (fsm.currentState ? fsm.currentState : "") +
                  "\n  NewState: " + (state ? state : "") +
                  "\n  CausedBy: " + (lastEvent ? lastEvent : ""));
        }
        fsm.currentState = state;
      };

      fsm.canReceive = function(event) { return map[event] && (map[event].hasOwnProperty(fsm.currentState) || map[event].hasOwnProperty('*')); };

      fsm.receive = function(event/*....arguments*/) {
        //drop events not valid in current state
        if (!fsm) {
          return;
        }
        if (!fsm.canReceive(event)) {
          //using arguments[0] instead of event because safari and iOS don't display this nicely in the console.
          OO.log('dropped event \'' + arguments[0] + '\' for \'' + moduleName + '\' while in state \'' + fsm.currentState + '\' with map:',map);
          return;
        }

        lastEvent = arguments[0];

        var from  = fsm.currentState;
        var to    = map[event][from] || map[event]['*'] || from;
        var n;

        //handle transition to same state
        if (from === to) {
          doCallback.apply(fsm, arguments);
          return;
        }

        updateState(fsm, to);

        var callbackResult = 'not_found';
        if(to !== "*") { callbackResult = doCallback.apply(fsm, _.union([to], _.rest(arguments))); }
        if(callbackResult==='not_found') { callbackResult = doCallback.apply(fsm, arguments); }

        switch ( callbackResult )  {
          case 'not_found':
            OO.log('Module \'' + moduleName + '\' does not handle state \'' + to + '\' or event \'' + arguments[0] + '\'');
            updateState(fsm, from);
            break;
          case 'fail':
            updateState(fsm, from);
            break;
          case 'ok':
            break;
        }
      };

      for(n = 0 ; n < events.length ; n++) {
        if(typeof(events[n]) == 'object') {
          add(events[n]);
        }
      }

      updateState(fsm, initial);
      if (mb !== undefined) {
        for(n in map) {
          mb.subscribe(n.toString(), moduleName, fsm.receive);
        }
      }

      return fsm;
    },

    activeStateMachines: {},

    /**
     * Adds a StateMachine to the list of currently active state machines.
     * @public
     * @method StateMachine#addToActiveList
     */
    addToActiveList: function(smName, sm)  {
      if (!this.activeStateMachines[smName]) {
        this.activeStateMachines[smName] = [];
      }

      this.activeStateMachines[smName].push(sm);
    },

    /**
     * Remove the StateMachine from the list of curently active state machines.
     * @public
     * @method StateMachine#removeFromActiveList
     */
    removeFromActiveList: function(smName, sm) {
      var list = this.activeStateMachines[smName];
      if (!list) {
        return;
      }

      for (var index = 0; index < list.length; index++) {
        if(list[index] === sm) {
          list.splice(index, 1);
          break;
        }
      }
    },

    /**
     * Enable debugging state transitions for a particular state machine. If
     * multiple of the same state machine are active, all of them have debugging
     * enabled.
     * @public
     * @method StateMachine#startDebugTransitionsFor
     * @return string Message stating whether debugging was succesfully started
     *           (Mostly for debugging in the console)
     */
    startDebugTransitionsFor: function(smName) {
      var result = this.debugTransitionsHelper(smName, true)
      var msg;
      if (result) {
        msg = "STATEMACHINE \'" + smName + "\' DEBUGGING STARTED";
      } else {
        msg = "Couldn't find \'" + smName +"\'";
      }

      return msg;
    },

    /**
    * Disable debugging state transitions for a particular state machine. If
    * multiple of the same state machine are active, all of them have debugging
    * disabled.
     * @public
     * @method StateMachine#stopDebugTransitionsFor
     * @return string Message stating whether debugging was succesfully stopped
     *           (Mostly for debugging in the console)
     */
    stopDebugTransitionsFor: function(smName) {
      var result = this.debugTransitionsHelper(smName, false)
      var msg;
      if (result) {
        msg = "STATEMACHINE \'" + smName + "\' DEBUGGING STOPPED";
      } else {
        msg = "Couldn't find \'" + smName +"\'";
      }

      return msg;
    },

    /**
     * Helper function to enable/disable all statemachines with the specified name.
     * @private
     * @method StateMachine#debugTransitionsHelper
     * @param string smName - name of the statemachine you want to debug
     * @param boolean enable - whether to turn debugging on or off.
     * @return boolean True if successfully at least 1 state machine found to enable/disable
     */
    debugTransitionsHelper: function(smName, enable) {
      var list = this.activeStateMachines[smName];
      if (!list) {
        return false;
      }

      for ( var i = 0; i < list.length; i++) {
        list[i].debugTransitions = enable;
      }

      return true;
    },

    /**
     * Returns a list of active state machines by name along with a count of
     * how many instances are each state machine are active.
     * @public
     * @method StateMachine#getActiveList
     * @return object An object who's keys are the names of the statemachines and
     *           the value is the number of active instances of that statemachine.
     */
    getActiveList: function() {
      var list = {};
      for (var smName in this.activeStateMachines) {
        list[smName] = this.activeStateMachines[smName].length;
      }
      return list;
    },

    __end_marker : true,

  };

}(OO, OO._));

(function(OO,_, $) {
  /**
   * An array of all registered modules.
   * @field OO#modules
   * @public
   */
  OO.modules = [];

  /**
   * Registers a module to be instantiated with each player.
   * @method OO#registerModule
   * @public
   * @param {string} _moduleName The name of the module
   * @param {object} _moduleClassFacotry A factory for creating an instance of the module
   */
  OO.registerModule = function(_moduleName, _moduleFactoryMethod) {
    // validate params
    var moduleName = OO.HM.safeDomId('moduleName', _moduleName, OO.HM.fixDomId),
      moduleFactoryMethod = OO.HM.safeFunction('moduleFactoryMethod', _moduleFactoryMethod);

    OO.modules.push({ name: moduleName, factory: moduleFactoryMethod});
  };

  /**
   * Registers a plugin to be instantiated with each player.
   * @method OO#plugin
   * @public
   * @param {string} moduleName The name of the module
   * @param {object} moduleClassFacotry A factory for creating an instance of the module
   */
  OO.plugin = function(moduleName, moduleClassFactory) {
    OO.log("Registered optional plugin: ", moduleName);
    OO.registerModule(moduleName, function(messageBus, id) {
      // TODO, check if we need to catch any exception here.
      var moduleClass = moduleClassFactory.apply({}, [OO, OO._, OO.$, window]);
      var plugin = new moduleClass(messageBus, id);
      return plugin;
    });
  };

  /**
   * Exposes an API object to the public scope.
   * @method OO#exposeStatieApi
   * @public
   * @param {string} _apiModule The route of the api module
   * @param {object} _apiObject The api object to expose
   */
  OO.exposeStaticApi = function(_apiModule, _apiObject) {
    // validate params
    var apiModule = OO.HM.safeDomId('apiModule', _apiModule),
      apiObject = OO.HM.safeObject('apiObject', _apiObject);

    OO.publicApi[apiModule] = OO.publicApi[apiModule] || {};
    OO._.extend(OO.publicApi[apiModule], apiObject);
  };
}(OO, OO._, OO.$));

(function(OO,_, $) {
  OO.players  = {};

  /**
   * @classdesc Creates and destroys an instance of the Ooyala V4 Player.
   * @class OO.Player
   * @public
   * @param {string} _elementId The DOM id of the element that wraps the player
   * @param {string|object} _asset The asset's Ooyala id or metadata
   * @param {object} _parameters The session parameters
   */
  OO.Player = function(_elementId, _asset, _parameters) {
    // validate params
    // _parameters is optional. Hazmat takes care of this but throws an undesirable warning.
    _parameters = _parameters || {};

    var elementId = OO.HM.safeDomId('Player.create.elementId', _elementId),
        parameters = OO.HM.safeObject('Player.create.parameters', _parameters, {}),
        persistentSettings = {"closedCaptionOptions":{}};

    parameters.onCreate = OO.HM.safeFunctionOrNull('Player.create.parameters.onCreate', parameters.onCreate);

    //instance variables
    var mb = new OO.MessageBus();

    $("#" + elementId).html(''); // clear the container for player rendering.

    // Module initialziation
    var modules = OO._.map(OO.modules, function(moduleDefinition) {
      var id = moduleDefinition.name + '-' + OO.getRandomString();
      var module = {
        name: moduleDefinition.name,
        moduleId: id, // a random id to help debug
        instance: moduleDefinition.factory(mb, id, parameters)   // Modules Only See MB directly, not the player
      };
      OO.log("Loaded plugin", module.moduleId, module);
      return module;
    });

    // init persistent player settings from local storage
    var localSettings = OO.localStorage.getItem(OO.CONSTANTS.OOYALA_PLAYER_SETTINGS_KEY);
    if (localSettings) {
      persistentSettings = JSON.parse(localSettings);
    }

    // Api setup
    var playerApi = new OO.PlayerApi(mb, _elementId, modules, parameters, persistentSettings);

    // Destroyal
    mb.subscribe(OO.EVENTS.DESTROY, 'player', _.bind(function(event, embedCode) {
      $("#" + elementId).empty();
      delete OO.players[elementId];
      OO.removeStyles(elementId);

      // [PBW-459] Call optional destory() callback after DESTROY is complete.
      playerApi.triggerDestroyCallback();
    }, this));

    // give the creator a chance to initalize itself
    if(_.isFunction(parameters.onCreate)) {
      parameters.onCreate(playerApi);
    }

    // announce player instance was created
    mb.publish(OO.EVENTS.PLAYER_CREATED, elementId, parameters, persistentSettings);

    /*
    PARTITION THE FLOW TO CMS-LESS PLAYER. Prevent any setEmbedCode action to execute
    */
    if (typeof _asset === 'object') {
      _asset = OO.HM.safeObject('assetObject', _asset);
      playerApi.setAsset(_asset, parameters);
    }
    // Normal CMS workflow. Initiate content loading
    else if (typeof _asset === 'string') {
      _asset = OO.HM.safeStringOrNull('assetString', _asset);
      playerApi.setEmbedCode(_asset, parameters);
    }

    return playerApi;
  };

  // Public Player API Class Methods
  OO.exposeStaticApi('Player', {
    /**
     * Creates a player object and attaches it to the specified element.
     * This is an asynchronous method and will return before the player is completely initialized.
     * Listen for the <code>PLAYBACK_READY</code> event to determine whether the player is completely initialized.
     *
     * @public
     * @method create
     * @memberOf OO.Player
     * @param {Number} elementId The ID of the element to which to attach the player object.
     * @param {Number} asset The asset. The player will load the asset. Only a single video is supported.
     * @param {Object} parameters The player parameters. These can be used to customize player ads and behavior, and can determine player styles.
     * For more information, see <a href="http://support.ooyala.com/developers/documentation/api/player_v3_api_embedparams.html" target="target">Embedded Parameters</a>.
     * @return {Object} The created player object.
     */
    create: function(elementId, asset, parameters) {
      parameters = parameters || {};
      //Check and see if correct routing is with correct player version
      if (!OO.playerParams['core_version'] || (OO.playerParams['core_version'] !== "4" && OO.playerParams['core_version'] !== 4)) {
        //wrong routing with v4 player, so throw an error since v4 player doesn't accept non-v4 routing
        console.error("Error: A v4 player has been specified using a mismatch route. v4 players can only be used with a v4 route.");
        return null;
      }

      // extend Pcode, playerBrandingId and debug to playerParams
      OO.configurePublisher(parameters);
      if (!OO.isPublisherConfigured()) {
        console.error("Error: pcode and playerBrandingId must be provided");
        return null;
      }

      // Set player environment if provided in parameters
      OO.setServerHost(parameters);

      // will not allow OO.players create twice for the same embedding element.
      if (!OO.players[elementId]) {
        OO.playerCount++;
        OO.players[elementId] = OO.Player(elementId, asset, parameters);
      }

      if (OO.DEBUG !== false && OO.DEBUG !== true) {
        OO.DEBUG = (parameters.debug === true);
        if (OO.DEBUG === true) {
          this.exposeDebugApi(elementId, OO.players[elementId]);
          //activate tools from the player params
          this.enableDebugTools(elementId, parameters["enableDebugTools"]);
        }
      }

      return OO.players[elementId];
    },

    /**
     * Isolates the specified player for debugging. <code>debug.ooyala.com</code> automatically generates a valid V3 embedded player.
     * When you call this on a player it automatically generates the corresponding <code>debug.ooyala.com</code> test page.
     *
     * @public
     * @method isolate
     * @memberOf OO.Player.prototype
     * @param {String} targetPlayer The name of the <code>div</code> container in which to load the player.
     * @return url The link to the isolated player.
     */
    isolate:function(targetPlayer) {
      var url = "http://debug.ooyala.com/?";

      var pbid = OO.playerParams.playerBrandingId;
      var p = null;

      if (pbid) {
        url += "pbid=" + pbid + "&";
      }

      // find the player
      var player;
      if (targetPlayer) {
        player = OO.players[targetPlayer];
      } else if (OO.playerCount > 1) {
        console.log("More than one player to choose.  Please specify the target div of the intended player as a parameter");
        console.log("Available players are: ", _.keys(OO.players));
        return _.keys(OO.players);
      } else if (OO.playerCount < 1) {
        console.log("There are no players on the page to isolate");
        return "";
      } else {
        // Get the only player available in the list
        player = _.values(OO.players)[0];
      }

      var params = JSON.stringify(player.parameters);
      var ec = player.embedCode;

      if (params) {
        url += "options=" + encodeURIComponent(params) + "&";
      }

      if (ec) {
        url += "ec=" + ec + "&";
      }


      // If this isn't local development or default, then there is a version specified
      if (OO.playerParams.environment !== "local-dev" && OO.playerParams.v3_version_source !== "default") {
        url += "version=" + OO.playerParams.v3_version + "&";
      }
      //We need to check if it is suppose to play a html5 player or not, so we check if the platform doesn't have flash in the string
      // and that if it doesn't then it is also not html5-fallback which would need to play the flash player.
      var environmentRF = OO.environmentRequiredFeatures;
      if (environmentRF.indexOf("html5-playback") > -1) {
        url += "useHtml5=true" + "&";
      }

      console.log("If you are copying this link, do not highlight. right click and press 'copy link address'");
      return url;
    },

    /**
     * Private function that exposes the debug api to the public version of OO.
     * @private
     * @method player#exposeDebugApi
     */
    exposeDebugApi: function(playerName, player) {
      if(!OO.publicApi) {
        return;
      }

      if(!OO.publicApi.DEBUG) {
        OO.publicApi.DEBUG = {};
      }

      /* CONSOLE OUTPUT TOOLS */

      /**
       * Refer to OO.consoleOutput
       * @method OO#DEBUG#consoleOutput
       */
      OO.publicApi.DEBUG.consoleOutput = OO.consoleOutput;

      /**
       * Refer to OO.startRecordingConsoleOutput.
       * @method OO#DEBUG#startRecordingConsoleOutput
       */
      OO.publicApi.DEBUG.startRecordingConsoleOutput = OO.startRecordingConsoleOutput;

      /**
       * Refer to OO.stopRecordingConsoleOutput.
       * @method OO#DEBUG#stopRecordingConsoleOutput
       */
      OO.publicApi.DEBUG.stopRecordingConsoleOutput = OO.stopRecordingConsoleOutput;

      /**
       * Refer to OO.clearRecordedConsoleOutput
       * @method OO#DEBUG#clearRecordedConsoleOutput
       */
      OO.publicApi.DEBUG.clearRecordedConsoleOutput = OO.clearRecordedConsoleOutput;

      /**
       * Refer to OO.setMaxConsoleOutputLines
       * @method OO#DEBUG#setMaxConsoleOutputLines
       */
      OO.publicApi.DEBUG.setMaxConsoleOutputLines = OO.setMaxConsoleOutputLines;


      /* STATE MACHINE TOOLS */
      /**
       * Refer to StateMachine.getActiveList
       * @method OO#DEBUG#listStateMachines
       */
      OO.publicApi.DEBUG.listStateMachines = OO._.bind(OO.StateMachine.getActiveList, OO.StateMachine);

      /**
       * Refer to StateMachine.startDebugTransitionsFor
       * @method OO#DEBUG#startDebugStateMachine
       */
      OO.publicApi.DEBUG.startDebugStateMachine = OO._.bind(OO.StateMachine.startDebugTransitionsFor, OO.StateMachine);

      /**
       * Refer to StateMachine.stopDebugTransitionsFor
       * @method OO#DEBUG#stopDebugStateMachine
       */
      OO.publicApi.DEBUG.stopDebugStateMachine = OO._.bind(OO.StateMachine.stopDebugTransitionsFor, OO.StateMachine);

      /* MESSAGE BUS TOOLS */
      OO.publicApi.DEBUG[playerName] = OO.publicApi.DEBUG[playerName] || {};

      /**
       * Refer to MessageBus.startDebug
       * @method OO#DEBUG#[playerName]#startDebugMB
       */
      OO.publicApi.DEBUG[playerName].startDebugMB = OO._.bind(player.mb.startDebug, player.mb);

      /**
       * Refer to MessageBus.stopDebug
       * @method OO#DEBUG#[playerName]#stopDebugMB
       */
      OO.publicApi.DEBUG[playerName].stopDebugMB = OO._.bind(player.mb.stopDebug, player.mb);

      /**
       * Refer to MessageBus.listDependencies
       * @method OO#DEBUG#[playerName]#listMBDependencies
       */
      OO.publicApi.DEBUG[playerName].listMBDependencies = OO._.bind(player.mb.listDependencies, player.mb);

      // Extend debug player apis with all debug tools defined within modules
      $.extend(OO.publicApi.DEBUG[playerName], OO.debug_tools[playerName])
    },

    /**
     * Private function that enables debug tools specified in the player creation parameters.
     * The tools can only be enabled if debug is set to true. Here is an example playerparam
     * usage of each possible command, with documentation for each:
     * {
     *   "debug":true,
     *   "enableDebugTools":{
     *   "startRecordingConsoleOutput":"OldState.*Init",                 //this turns on recording console output. You can pass in a regex to filter out what output you actually want to record. You don't need the initial and ending '/'. Look up RegExp in javascript for more info.
     *   "setMaxConsoleOutputLines":100,                                 //set the max number of lines to record. It's FIFO so it dumps the oldest message when full.
     *   "startDebugStateMachine":"adManagerController,Api,something",   //specify which statemachines you care about recording. Use  "all" to turn it on for all statemachines
     *   "startDebugMB":true                                             //this turns on the detailed message bus debugging. You will know when a message is queue up to be sent out and when it actually gets propogated to listeners. You also see when messages create/remove dependents. Super verbose.
     *   }
     * }
     *
     * Two important things to note:
     * 1. These features get turned on after the player is created. So this will not capture messages and debug output while the player is initializing.
     * 2. If the console message isn't sent through OO.log, it won't get recorded. 
     * @private
     * @method player#enableDebugTools
     * @param {string} elementId The div in which the player lives
     * @param {object} options The value of "enableDebugTools" inside the player params
     */
    enableDebugTools: function(elementId, options) {
      if(!OO.publicApi || !OO.publicApi.DEBUG || !options || !elementId) {
        return;
      }

      if (options.hasOwnProperty("startRecordingConsoleOutput")) {
        var filter = options["startRecordingConsoleOutput"];
        OO.publicApi.DEBUG.startRecordingConsoleOutput(filter);
      }

      if (OO._.isFinite(options["setMaxConsoleOutputLines"])) {
        OO.publicApi.DEBUG.setMaxConsoleOutputLines(options["setMaxConsoleOutputLines"]);
      }

      if (options.hasOwnProperty("startDebugStateMachine") && OO._.isString(options["startDebugStateMachine"])) {
        var smList = [];
        if (options["startDebugStateMachine"] === "all") {
          smList = OO.publicApi.DEBUG.listStateMachines();
          for (var smName in smList) {
            if (smList.hasOwnProperty(smName)) {
              OO.publicApi.DEBUG.startDebugStateMachine(smName);
            }
          }
        } else {
          smList = options["startDebugStateMachine"].split(",");
          for (var index in smList) {
            if (smList.hasOwnProperty(index)) {
              var smName = smList[index].trim();
              OO.publicApi.DEBUG.startDebugStateMachine(smName);
            }
          }
        }
      }

      if (options["startDebugMB"] === true ) {
        OO.publicApi.DEBUG[elementId].startDebugMB();
      }
    },

    __placeholder : 0
  });
}(OO, OO._, OO.$));

(function(OO,_, $) {
  /**
   * @classdesc API layer for the Ooyala Player.  This class takes no direct action on the player.  It stores
   *   player properties and provides an API layer for the player that interacts with the message bus.
   * @class OO.PlayerApi
   * @public
   * @param {object} _mb The player message bus
   * @param {string} _elementId The DOM id of the root player element
   * @param {string} _modules The module instances for the player
   * @param {string} _parameters The parameters for the first playback session
   * @property {object} mb The message bus instance for the player
   * @property {object} modules The module instances for the player
   * @property {object} parameters The parameters for the playback session
   * @property {object} persistentSettings The persistent settings for the player
   */
  OO.PlayerApi = function(_mb, _elementId, _modules, _parameters, _persistentSettings) {
    // player properties
    this.mb = _mb;
    this.modules = _modules;
    this.parameters = _parameters;
    this.persistentSettings = _persistentSettings;
    var elementId = _elementId;

    // video state
    var playbackReady = false;
    var isAdPlaying = false;
    var isPlaying = false;
    var playheadTime = -1;
    var duration = -1;
    var adDuration = -1;
    var bufferLength = -1;
    var item = null;
    var authStartTime = -1;
    var closedCaptionsLanguages = {};
    var bitratesInfo = {};
    var error = null;
    var currentBitrate = null;
    var _playedOnce = false;
    var startTime = null;

    // session state
    var state = OO.STATE.LOADING;
    var clockOffset = 0;
    var fullscreen = false;
    var volume = 1;
    var _playQueued = false;
    var _atEndScreen = false;
    var destroyCallback = null;


    /*
     * Helpers
     */

    var updateStateOnPlay = function() {
      _playedOnce = true;
      _playQueued = false;
      _atEndScreen = false;
    };

    var resetPlayState = function() {
      playbackReady = false;
      isAdPlaying = false;
      isPlaying = false;
      state = OO.STATE.LOADING;
      playheadTime = -1;
      duration = -1;
      adDuration = -1;
      bufferLength = -1;
      item = null;
      authStartTime = -1;
      closedCaptionsLanguages = {};
      bitratesInfo = {};
      error = null;
      currentBitrate = null;
      _playedOnce = false;
      _atEndScreen = false;
    };


    /*
     * State Tracking
     */

    this.mb.subscribe(OO.EVENTS.PLAYBACK_READY, 'player', _.bind(function() {
      state = OO.STATE.READY;
      playbackReady = true;
      if (_playQueued) { this.play(); }
    }, this));

    this.mb.subscribe(OO.EVENTS.REPLAY, 'player', _.bind(function() {
      updateStateOnPlay();
    }, this));

    this.mb.subscribe(OO.EVENTS.PLAY, 'player', _.bind(function() {
      updateStateOnPlay();
    }, this));

    this.mb.subscribe(OO.EVENTS.INITIAL_PLAY, 'player', _.bind(function() {
      updateStateOnPlay();
    }, this));

    this.mb.subscribe(OO.EVENTS.PLAYING, 'player', _.bind(function() {
      // initial time:
      // TODO, w3c has introduced a new attribute for HTML 5 tag: initialTime
      // http://www.w3.org/TR/2011/WD-html5-20110113/video.html#dom-media-initialtime
      // Once it is widely supported, we can directly set this attribute instead.
      if (state != OO.STATE.ERROR) {
        state = OO.STATE.PLAYING;
        _playedOnce = true;
        isPlaying = true;
      }
      _atEndScreen = false;
    }, this));

    this.mb.subscribe(OO.EVENTS.PAUSED, 'player', _.bind(function() {
      if (state != OO.STATE.ERROR) {
        state = OO.STATE.PAUSED;
      }
      isPlaying = false;
    }, this));

    this.mb.subscribe(OO.EVENTS.BUFFERING, 'player', _.bind(function() {
      if (state != OO.STATE.ERROR) {
        state = OO.STATE.BUFFERING;
      }
    }, this));

    this.mb.subscribe(OO.EVENTS.BUFFERED, 'player', _.bind(function() {
      // If the video is still in a buffering state after we've finished buffering,
      // Change it to either a playing or paused state
      if (state === OO.STATE.BUFFERING) {
        state = (isPlaying) ? OO.STATE.PLAYING : OO.STATE.PAUSED;
      }
    }, this));

    this.mb.subscribe(OO.EVENTS.PLAYED, 'player', _.bind(function() {
      state = OO.STATE.READY;
      _atEndScreen = true;
      isPlaying = false;
    }, this));

    this.mb.subscribe(OO.EVENTS.WILL_PLAY_ADS, 'player', _.bind(function(event, newAdDuration) {
      adDuration = newAdDuration;
      _playedOnce = true;
      isAdPlaying = true;
      _atEndScreen = false;
    }, this));

    this.mb.subscribe(OO.EVENTS.ADS_PLAYED, 'player', _.bind(function() {
      adDuration = -1;
      isAdPlaying = false;
    }, this));

    // listen for some events to keep a copy of metadata for APIs
    this.mb.subscribe(OO.EVENTS.CONTENT_TREE_FETCHED, 'player', _.bind(function(event, tree) {
      // NOTE[jigish]: we do not support channels yet, so currentItem *is* the root item
      item = tree;
      if (!tree) { return; }
      // preset duration to what contentTree thinks it is. we'll change it later
      duration = tree.duration;
    }, this));

    this.mb.subscribe(OO.EVENTS.WILL_FETCH_AUTHORIZATION, 'player', _.bind(function(event) {
      authStartTime = new Date().getTime();
    }, this));

    this.mb.subscribe(OO.EVENTS.AUTHORIZATION_FETCHED, 'player', _.bind(function(event, tree) {
      if (!tree.debug_data || !tree.debug_data.user_info) { return; }
      var currentTime = new Date().getTime();
      var latency = (currentTime - authStartTime - tree.debug_data.server_latency) / 2;
      clockOffset = (tree.debug_data.user_info.request_timestamp * 1000) + latency - currentTime;
    }, this));

    this.mb.subscribe(OO.EVENTS.PLAYHEAD_TIME_CHANGED, 'player', _.bind(function(event, time, newDuration, buffer) {
      playheadTime = time;
      duration = newDuration;
      bufferLength = buffer;
      if (!startTime) { startTime = new Date().getTime(); }
    }, this));

    this.mb.subscribe(OO.EVENTS.DOWNLOADING, 'player', _.bind(function(event, time, newDuration, buffer) {
      playheadTime = time;
      duration = newDuration;
      bufferLength = buffer;
    }, this));

    this.mb.subscribe(OO.EVENTS.FULLSCREEN_CHANGED, 'player', _.bind(function(event, state) {
      fullscreen = state;
    }, this));

    this.mb.subscribe(OO.EVENTS.ERROR, 'player', _.bind(function(event, err) {
      error = err;
      state = OO.STATE.ERROR;
      isPlaying = false;
    }, this));

    this.mb.subscribe(OO.EVENTS.VOLUME_CHANGED, 'player', _.bind(function(event, newVolume) {
      volume = newVolume;
    }, this));

    // Copies player settings from skin UI (source) to current settings (destination).
    // Source settings will override properties of destination settings.
    // Mutated destination settings are then saved to local storage.
    this.mb.subscribe(OO.EVENTS.SAVE_PLAYER_SETTINGS, 'player', _.bind(function(event, sourceSettings) {
      _.extend(this.persistentSettings.closedCaptionOptions, sourceSettings.closedCaptionOptions);
      var newSettings = JSON.stringify(this.persistentSettings);
      // save new settings to local storage
      OO.localStorage.setItem(OO.CONSTANTS.OOYALA_PLAYER_SETTINGS_KEY, newSettings);
    }, this));

    this.mb.subscribe(OO.EVENTS.SET_EMBED_CODE, 'player', _.bind(function(event, embedCode, options) {
      // TODO: Should this be a replacement rather than an extend?  Some parameters do not live past the
      // session, such as autoplay.
      this.parameters = _.extend(this.parameters, options);
      resetPlayState();
    }, this));

    this.mb.subscribe(OO.EVENTS.SET_ASSET, 'player', _.bind(function(event, asset, options) {
      // TODO: Should this be a replacement rather than an extend?  Some parameters do not live past the
      // session, such as autoplay.
      this.parameters = _.extend(this.parameters, options);
      resetPlayState();
    }, this));

    this.mb.subscribe(OO.EVENTS.ASSET_CHANGED, 'player', _.bind(function(event, asset) {
      item = asset.content;
      duration = item.duration;
    }, this));

    this.mb.subscribe(OO.EVENTS.DESTROY, 'player', _.bind(function(event, embedCode) {
      state = OO.STATE.DESTROYED;
    }, this));

    this.mb.subscribe(OO.EVENTS.BITRATE_INFO_AVAILABLE, 'player', _.bind(function(event, info) {
      bitratesInfo = info.bitrates;
    }, this));

    this.mb.subscribe(OO.EVENTS.BITRATE_CHANGED, 'player', _.bind(function(event, info) {
      currentBitrate = info;
    }, this));

    this.mb.subscribe(OO.EVENTS.CLOSED_CAPTIONS_INFO_AVAILABLE, 'player', _.bind(function(event, info) {
      closedCaptionsLanguages = info;
    }, this));


    /*
     * Public Player API Instance Methods
     *
     * NOTE[jigish]: Some functions are aliased to maintain compatibility with the flash player. Others are
     * aliased because they are Channel APIs and Channels are not supported yet.
     *
     * TODO[jigish]:
     * setQueryStringParameters
     */

    /**
     * Sets the embed code for the current player. You may optionally specify an <code>options</code> object
     * that enables you to dynamically assign an ad set or other asset-level options to the embed code.
     * For example, you can set the initial position from which the player will start.
     * This is an asynchronous method and may return before having completed the operation.
     * If your logic depends on the completion of this operation, listen to the corresponding event.
     *
     * @public
     * @method setEmbedCode
     * @memberOf OO.Player.prototype
     * @param {String} embedCode An embed code belonging to the same provider as the ad set code.
     * @param {Object} options <b>(Optional)</b> An object containing a hash of key-value pairs representing the unique ad set code.
     */
    this.setEmbedCode = function(embedCode, options) {
      this.mb.publish(OO.EVENTS.SET_EMBED_CODE, embedCode, options || {});
    };

    /**
     * Sets the asset streams for the current player. You may optionally specify an <code>options</code> object
     * that enables you to dynamically assign an ad set or other asset-level options to the asset.
     * For example, you can set the initial position from which the player will start.
     * This is an asynchronous method and may return before having completed the operation.
     * If your logic depends on the completion of this operation, listen to the corresponding event.
     *
     * @method setAsset
     * @memberOf OO.Player.prototype
     * @param {String} asset An object of content metadata
     * @param {Object} options <b>(Optional)</b> An object containing a hash of key-value pairs representing playback configuration
     */
    this.setAsset = function(asset, options) {
      this.mb.publish(OO.EVENTS.SET_ASSET, asset, options || {});
    };

    /**
     * Plays the current video and the entire asset including ads, or queues it for playback if the video is not ready.
     * This is an asynchronous method and may return before having completed the operation.
     * If your logic depends on the completion of this operation, listen to the corresponding event.
     *
     * @public
     * @method play
     * @memberOf OO.Player.prototype
     */
    this.play = function() {
      if (state == OO.STATE.ERROR) {
        return;
      } else if (!playbackReady) {
        _playQueued = true;
        return;
      }

      this.mb.publish(_atEndScreen ? OO.EVENTS.REPLAY : (_playedOnce ? OO.EVENTS.PLAY : OO.EVENTS.INITIAL_PLAY));
    };

    /**
     * Pauses the current video playback.
     * This is an asynchronous method and may return before having completed the operation.
     * If your logic depends on the completion of this operation, listen to the corresponding event.
     *
     * @public
     * @method pause
     * @memberOf OO.Player.prototype
     */
    this.pause = function() {
      this.mb.publish(OO.EVENTS.PAUSE);
    };

    /**
     * Seeks to the specified number of seconds from the beginning.
     * This is an asynchronous method and may return before having completed the operation.
     * If your logic depends on the completion of this operation, listen to the <code>BUFFERED</code> event.
     *
     * @public
     * @method seek
     * @memberOf OO.Player.prototype
     * @param {Number} seconds The number of seconds from the beginning at which to begin playing the video.
     */
    this.seek = function(seconds) {
      if (_atEndScreen) {
        this.mb.publish(OO.EVENTS.REPLAY, seconds);
      }
      else {
        this.mb.publish(OO.EVENTS.SEEK, seconds);
      }
    };

    /**
     * Sets the current volume on a best-effort basis according to the underlying device limitations.
     * This is an asynchronous method and may return before having completed the operation.
     * If your logic depends on the completion of this operation, listen to the corresponding event.
     *
     * @public
     * @method setVolume
     * @memberOf OO.Player.prototype
     * @param {Number} volume The volume. Specify a value between 0 and 1, inclusive.
     */
    this.setVolume = function(volume) {
      this.mb.publish(OO.EVENTS.CHANGE_VOLUME, volume);
    };

    /**
     * Destroys the item. When this method is called, the player is removed, all activity is stopped, and any video is unloaded.
     * This is an asynchronous method and may return before having completed the operation.
     * If your logic depends on the completion of this operation, listen to the corresponding event.
     *
     * @public
     * @method destroy
     * @memberOf OO.Player.prototype
     * @param {function} callback (<b>Optional</b>) A function callback used to notify a web page
     * that the <code>destroy</code> method has completed destroying the HTML5 player.
     */
    this.destroy = _.bind(function(callback) {
      // [PBW-459] Save optional callback to be called after DESTROY event is unblocked.
      if (callback && typeof callback === "function") {
        destroyCallback = callback;
      }
      this.mb.publish(OO.EVENTS.DESTROY);
    }, this);

    this.triggerDestroyCallback = function() {
      if (destroyCallback) {
        destroyCallback();
        destroyCallback = null;
      }
    };

    /**
     * Set related media for unbundled player.
     *
     * @public
     * @method updateAsset
     * @memberOf OO.Player.prototype
     * @param {Object} Object with asset structure where id field should not be empty. Other fields will be updated if populated.
     *
     */
    this.updateAsset = function(updatedAsset) {
      this.mb.publish(OO.EVENTS.UPDATE_ASSET, updatedAsset);
    };

    /* Getters */

    /**
     * Retrieves the playhead position in seconds.
     *
     * @public
     * @method getPlayheadTime
     * @memberOf OO.Player.prototype
     * @return {Number} The playhead position, in seconds.
     */
    this.getPlayheadTime = function() {
      return playheadTime;
    };

    this.getLiveTime = function() {
      return new Date(startTime + (playheadTime * 1000) + clockOffset);
    };

    /**
     * Retrieves the total duration, in milliseconds, of the video.
     *
     * @public
     * @method getDuration
     * @memberOf OO.Player.prototype
     * @return {Number} The total duration of the video in milliseconds.
     */
    this.getDuration = function() {
      return duration;
    };

    /**
     * Retrieves the total duration, in milliseconds, of the videos.
     *
     * @public
     * @method getAdDuration
     * @memberOf OO.Player.prototype
     * @return {Number} The total duration of the ad videos in milliseconds.
     */
    this.getAdDuration = function() {
      return adDuration;
    };

    /**
     * Retrieves the current size of the buffer in seconds.<br/>
     *
     * @public
     * @method getBufferLength
     * @memberOf OO.Player.prototype
     * @return {Number} The current size of the buffer in seconds when buffer length is supported; returns 0 otherwise.
     */
    this.getBufferLength = function() {
      return bufferLength;
    };

    /**
     * Retrieves an object describing the current video.
     *
     * @public
     * @method getItem
     * @memberOf OO.Player.prototype
     * @return {Object} The current video, described in an object containing the following attributes:
     * <ul>
     *    <li><code>embedCode</code></li>
     *    <li><code>title</code></li>
     *    <li><code>description</code></li>
     *    <li><code>time</code> (play length in seconds)</li>
     *    <li><code>lineup</code></li>
     *    <li><code>promo</code></li>
     *    <li><code>hostedAtURL</code></li>
     * </ul>
     */
    this.getItem = function() {
      return item;
    };

    /**
     * Retrieves the description of the current video. This function retrieves the description that was set
     * in the the <b>Backlot Manage Details</b> tab or the equivalent manual setting.
     *
     * @public
     * @method getDescription
     * @memberOf OO.Player.prototype
     * @return {String} The description of the current video. For example, <code>Season 22 Opening Game</code>.
     */
    this.getDescription = function() {
      if (!item) { return null; }
      return item.description;
    };

    /**
     * Retrieves the embed code for the current player.
     *
     * @public
     * @method getEmbedCode
     * @memberOf OO.Player.prototype
     * @return {String} The embed code for the current player.
     */
    this.getEmbedCode = function() {
      if (!item) { return null; }
      return item.embedCode || item.embed_code || ""; // it could be one or the other
    };

    /**
     * Retrieves the title of the current video.
     *
     * @public
     * @method getTitle
     * @memberOf OO.Player.prototype
     * @return {String} The title of the current video. For example, <code>My Snowboarding Channel</code>.
     */
    this.getTitle = function() {
      if (!item) { return null; }
      return item.title;
    };

    /**
     * Determines whether the player is in full screen mode.
     *
     * @public
     * @method isFullscreen
     * @memberOf OO.Player.prototype
     * @return {Boolean} <code>true</code> if the player is in full screen mode, <code>false</code> otherwise.
     */
    this.isFullscreen = function() {
      return fullscreen;
    };

    /**
     * Retrieves the current error code if it exists.
     *
     * @public
     * @method getErrorCode
     * @memberOf OO.Player.prototype
     * @return {String} The error code, if it exists.
     */
    this.getErrorCode = function() {
      return error != null ? error.code : null;
    };

    /**
     * Retrieves the current player state. See {@link OO.STATE} for descriptions of the states.
     *
     * @public
     * @method getState
     * @memberOf OO.Player.prototype
     * @return {String} One of the following values:
     * <ul>
     *   <li><code>LOADING</code></li>
     *   <li><code>READY</code></li>
     *   <li><code>PLAYING</code></li>
     *   <li><code>PAUSED</code></li>
     *   <li><code>BUFFERING</code></li>
     *   <li><code>ERROR</code></li>
     *   <li><code>DESTROYED</code></li>
     * </ul>
     */
    this.getState = function() {
      return state;
    };

    /**
     * Retrieves the current volume on a best-effort basis according to underlying device limitations.
     *
     * @public
     * @method getVolume
     * @memberOf OO.Player.prototype
     * @return {Number} The volume, whose value is between 0 and 1, inclusive.
     */
    this.getVolume = function() {
      return volume;
    };

    this.skipAd = function() {
      this.mb.publish(OO.EVENTS.SKIP_AD);
    };

    /**
     * Retrieves an array of available bitrate information object.
     *
     * @public
     * @method getBitratesAvailable
     * @memberOf OO.Player.prototype
     * @return {Array} An array of available bitrate information object. The handler is called with an array containing the available streams, each object includes:
     *   <ul>
     *     <li>bitrate: The bitrate in bits per second. (number)</li>
     *     <li>height: The vertical resolution of the stream. (number)</li>
     *     <li>width: The horizontal resolution of the stream. (number)</li>
     *     <li>id: A unique identifier for the stream. (string)</li>
     *   </ul>
     * If The video plugin supports automatic ABR, one stream will have an ID of "auto" and a bitrate of 0.
     *
     * @see getTargetBitrate
     * @see setTargetBitrate
     */
    this.getBitratesAvailable = function() {
      return bitratesInfo;
    };

    /**
     * Retrieves the current bitrate information object.
     *
     * @public
     * @method getTargetBitrate
     * @memberOf OO.Player.prototype
     * @return {Object} The current bitrate information object. Each object includes:
     *   <ul>
     *     <li>bitrate: The bitrate in bits per second. (number|string)</li>
     *     <li>height: The vertical resolution of the stream. (number)</li>
     *     <li>width: The horizontal resolution of the stream. (number)</li>
     *     <li>id: A unique identifier for the stream. (string)</li>
     *   </ul>
     * @see getBitratesAvailable
     */
    this.getCurrentBitrate = function() {
      return currentBitrate;
    };

    /**
     * Sets the target bitrate. You must specify the ID of an available bitrate information object.
     * To determine which bitrates are available, call <code>{@link getBitratesAvailable}()</code>.<br/><br/>
     * <p><b><font color="red">NOTE: </font></b>This setting does not carry over to new asset.
     * This is an asynchronous method and may return before having completed the operation.
     * If your logic depends on the completion of this operation, listen to the corresponding event.
     *
     * @public
     * @method setTargetBitrate
     * @memberOf OO.Player.prototype
     * @param {String} id ID of the stream to switch to. ID should correspond to an ID property from
     *   one of the available bitrates.
     * @see getBitratesAvailable
     */
    this.setTargetBitrate = function(id) {
      this.mb.publish(OO.EVENTS.SEND_QUALITY_CHANGE, id);
      this.mb.publish(OO.EVENTS.SET_TARGET_BITRATE, id);
    };

    /**
     * Retrieves a list of supported closed captions languages for the currently playing item.
     * This list is derived from the closed captions XML (DFXP [now TTML]) file for this content, uploaded via Backlot.
     * For more information about this file see
     * <a href"http://support.ooyala.com/developers/documentation/tasks/api_closed_captions_upload.html" target="target">Uploading and Viewing a Closed Captions File</a>.
     * If there is no DFXP (now TTML) file in place, this method returns an empty list. In live streaming mode,
     * the closed caption languages are derived from the stream itself.
     *
     * @public
     * @method getCurrentItemClosedCaptionsLanguages
     * @memberOf OO.Player.prototype
     * @return {Array} A list of supported closed captions languages for the currently playing item.
     */
    this.getCurrentItemClosedCaptionsLanguages = function() {
      return closedCaptionsLanguages;
    };

    /**
     * Sets the language of the closed captions (CC) that will be shown in the player. If you do not upload the Closed Captions file,
     * the content will play back without closed captions. In Live streaming mode, the closed caption languages are derived
     * from the stream itself. Note that because of the way that closed captions are supported in iOS,
     * we are not able to add closed caption data for IOS web for remote assets.<br/><br/>
     * <p><b><font color="red">NOTE: </font></b> Because of the way that closed captions are supported in iOS,
     * closed caption data cannot be added for IOS web for remote assets.</p><br/>
     *
     * @public
     * @method setClosedCaptionsLanguage
     * @memberOf OO.Player.prototype
     * @param {String} language Specify the ISO 639-1 language code. For example, specify <code>"en"</code>, <code>"de"</code>, or <code>"ja"</code>
     * for English, German, or Japanese.
     * Use <code>"zh-hans"</code> for Simplified Chinese and <code>"zh-hant"</code> for Traditional Chinese.
     * To show no closed captions, set the language to <code>"none"</code>.
     */
    this.setClosedCaptionsLanguage = function(language) {
      this.mb.publish(OO.EVENTS.SET_CLOSED_CAPTIONS_LANGUAGE, language);
    };

    /**
     * Subscribe to a specified event.
     *
     * @public
     * @method subscribe
     * @memberOf OO.Player.prototype
     * @param {String} eventName The name of the event.
     * @param {String} subscriber The name of the subscriber to which the message bus will publish the event.
     * @param {Function} callback The function that will execute when the subscriber receives the event notification.
     */
    this.subscribe = function(eventName, subscriber, callback) {
      this.mb.subscribe(eventName, subscriber, function() {
        var argsArray = _.toArray(arguments);
        argsArray.unshift(callback);
        _.defer.apply(this, argsArray);
      } );
    };

    /**
     * Retrieves the core player version.
     *
     * @public
     * @method getVersion
     * @memberOf OO.Player.prototype
     * @return {String} The core player version.
     */
    this.getVersion = function() {
      return OO.VERSION.version;
    };

    /**
     * Retrieves the ID of the DOM element the player was created inside.
     *
     * @public
     * @method getElementId
     * @memberOf OO.Player.prototype
     * @return {String} The ID of the DOM element the player was created inside.
     */
    this.getElementId = function() {
      return elementId;
    };

    /**
     * Determine if main content is currently playing
     *
     * @public
     * @method isPlaying
     * @memberOf OO.Player.prototype
     * @return {Boolean} Whether or not the player is currently playing.
     */
    this.isPlaying = function() {
      return isPlaying;
    };

    /**
     * Determine if an ad is currently playing
     *
     * @public
     * @method isAdPlaying
     * @memberOf OO.Player.prototype
     * @return {Boolean} Whether or not the player is currently playing.
     */
    this.isAdPlaying = function() {
      return isAdPlaying;
    };
  }
}(OO, OO._, OO.$));

(function(OO,_,$) {
  //local constants
  var IFRAME_URL = _.template('<%=server%>/ooyala_storage.html')({ server: OO.SERVER.API });
  var DOMAIN = OO.SERVER.API;
  var IFRAME_LOAD_MESSAGE = "LOADED";
  var IFRAME_LOAD_TIMEOUT = 3000;
  var IFRAME_STATE_INIT = 0;
  var IFRAME_STATE_ERROR = 1;
  var IFRAME_STATE_READY = 2;

  var iframeState = IFRAME_STATE_INIT; //state of iframe
  var postMessageQueue = []; //messages waiting until iframe ready
  var callbacks = {}; //Store Callback functions
  var errorTimeout = null;

  //add iframe
  var iframe = document.createElement('iframe');
  iframe.style.display = "none";
  iframe.src = IFRAME_URL;

  $(document).ready(function() {
    document.body.appendChild(iframe);
    errorTimeout = setTimeout(function() {
      onIframeLoaded(IFRAME_STATE_ERROR);
    }, IFRAME_LOAD_TIMEOUT);
  });

  //add event listener
  if (window.addEventListener) {
    window.addEventListener("message", onMessage, false);
  } else if (window.attachEvent) {
    window.attachEvent("onmessage", onMessage);
  }

  function onMessage(event) {
    if (event.origin !== DOMAIN) { return; }

    //listen for loaded message
    if (event.data === IFRAME_LOAD_MESSAGE) {
      clearTimeout(errorTimeout);
      onIframeLoaded(IFRAME_STATE_READY);
      return;
    }
    var msg = null;
    try { msg = OO.JSON.parse(event.data); } catch(e) {} //do nothing, will be caught by next line

    if (!msg || !msg.callback) { return; } //result can be null

    if (callbacks[msg.callback]) {
      callbacks[msg.callback](msg.result);
      delete callbacks[msg.callback];
    }
  }

  function onIframeLoaded(state) {
    var a;
    iframeState = state;
    while((a = postMessageQueue.pop()) != undefined) {
      callPostMessage(a[0], a[1], a[2]);
    }
  }

  function callPostMessage(method, args, callback) {
    if (iframeState === IFRAME_STATE_INIT) {
      postMessageQueue.push(arguments);
      return;
    }

    if (iframeState === IFRAME_STATE_ERROR || !iframe.contentWindow.postMessage) {
      var result;
      if (method == "setItem") {
        result = OO[method].apply(OO.localStorage, args);
      } else {
        result = OO.localStorage[method].apply(OO.localStorage, args);
      }
      if(!!callback) {
        callback(result);
      }
    } else {
      var msg = {
        method: method,
        arguments: args,
        callback: Math.random().toString(36).substring(7) //random id
      };
      callbacks[msg.callback] = callback;
      iframe.contentWindow.postMessage(JSON.stringify(msg), DOMAIN);
    }
  }

  OO.ooyalaStorage = {
    getItem: function(key, callback) {
      callPostMessage("getItem", [key], callback);
    },
    key: function(keyId, callback) {
      callPostMessage("key", [keyId], callback);
    },
    setItem: function(key, value, callback) {
      callPostMessage("setItem", [key, value], callback);
    },
    removeItem: function(key, callback) {
      callPostMessage("removeItem", [key], callback);
    },
    hasOwnProperty: function(key, callback) {
      callPostMessage("hasOwnProperty", [key], callback);
    }
  };
  if (!!OO.TEST_TEST_TEST) {
    OO.ooyalaStorage._getIframeState = function() {
      return iframeState;
    };
  }
}(OO, OO._, OO.$));

(function(OO,_,$) {
  callbackQueue = [];
  OO.GUID = undefined;

  OO.ooyalaStorage.getItem("ooyala_guid", _.bind(function(value) {
    if (value) {
      OO.GUID = value;
    } else {
      OO.GUID = generateDeviceId();
      OO.ooyalaStorage.setItem("ooyala_guid", OO.GUID);
    }
    while((callback = callbackQueue.pop()) != undefined) {
      callback(OO.GUID);
    }
  }), this);

  OO.publicApi.getGuid = OO.getGuid = function(callback) {
    if (OO.GUID) {
      if (typeof callback === "function") {
        try {
          callback(OO.GUID);
        } catch (e) {
          //do nothing on error
        }
      }
    } else {
      callbackQueue.push(callback);
    }
  };

  generateDeviceId = function() {
    var randomString = (new Date().getTime()) + window.navigator.userAgent + Math.random().toString(16).split(".")[1];
    return new OO.jsSHA(randomString, 'ASCII').getHash('SHA-256', 'B64');
  };

  OO.plugin("DeviceId", function(OO, _, $, W) {
    return function(mb, id) {
      mb.subscribe(OO.EVENTS.PLAYER_CREATED, "DeviceId", function() {
        OO.publicApi.getGuid(function(guid) {
          mb.publish(OO.EVENTS.GUID_SET, guid);
        });
      });
    };
  });

}(OO, OO._, OO.$));

(function(OO, $, _){
  /*
   *  Defines a basic chromeless UI
   */
  var ChromelessUi = function(messageBus, id) {
    this.id = id;
    this.mb = messageBus;
    this.width = 0;
    this.height = 0;
    this.useCustomControls = !OO.uiParadigm.match(/mobile/);
    this.useNativeControls = !!OO.uiParadigm.match(/native/);
    this.originalZ = null;
    this.originalOverflow = null;
    this.playbackReady = false;

    OO.StateMachine.create({
      initial:'Init',
      messageBus:this.mb,
      moduleName:'ChromelessUi',
      target:this,
      events:[
        {name:OO.EVENTS.PLAYER_CREATED,         from:'Init',        to:'PlayerCreated'},
        {name:OO.EVENTS.EMBED_CODE_CHANGED,                       from:'*',                                          to:'WaitingPlaybackReady'},
        {name:OO.EVENTS.ASSET_CHANGED,                            from:'*',                                          to:'WaitingPlaybackReady'},
        {name:OO.EVENTS.PLAYBACK_READY,                           from:'WaitingPlaybackReady',                       to:'Ready'},
        {name:OO.EVENTS.INITIAL_PLAY,                             from:"*"},
        {name:OO.EVENTS.WILL_PLAY,                                from:['Ready','Paused'],                           to:'StartingToPlay'},
        {name:OO.EVENTS.PLAYING,                                  from:['StartingToPlay', 'Paused'],                 to:'Playing'},
        {name:OO.EVENTS.ERROR,                  from:'*'},
        {name:OO.EVENTS.PLAY,                   from:'*'},
        {name:OO.EVENTS.WILL_CHANGE_FULLSCREEN, from:'*'},
        {name:OO.EVENTS.FULLSCREEN_CHANGED,     from:'*'},
        {name:OO.EVENTS.VC_PLAYING,             from:'*'},
        {name:OO.EVENTS.INITIAL_PLAY,           from:'*'},
        {name:OO.EVENTS.REPLAY,                 from:'*'},
        {name:OO.EVENTS.WILL_PLAY_ADS,          from:'*'},
        {name:OO.EVENTS.PLAY_MIDROLL_STREAM,    from:'*'},
        {name:OO.EVENTS.PLAYING,                from:'*'},
        ]
    });
  };

  _.extend(ChromelessUi.prototype, {

    onInitialPlay: function() {
      if (!this.playbackReady) { return; }
    },

    onPlayerCreated: function(event, elementId, params) {
      this.elementId = elementId;
      this.topMostElement = $('#'+this.elementId);
      this.topMostElement.append('<div class="innerWrapper"></div>');
      this.rootElement = this.topMostElement.find("div.innerWrapper");
      this.params = params;

      // plugins placeholder
      this.rootElement.append("<div class='plugins' style='position: absolute; width: 100%; height: 100%;'></div>");

      // bind UI events.
      var fullscreenEvents = ["fullscreenchange", "webkitfullscreenchange"];
      var onBrowserOriginatedFullscreenChange = _.bind(this._onBrowserOriginatedFullscreenChange, this);
      var rootElement = this.rootElement;
      _.each(fullscreenEvents, function(e) { rootElement.on(e, onBrowserOriginatedFullscreenChange); });
      // https://developer.mozilla.org/en/DOM/Using_full-screen_mode
      // Mozilla is dispatching the fullscreen event to the document object instead of the dom object that
      // change to full screen.
      // TODO, keep an eye on the doc if they change the notification to the dom element instead.
      $(document).on("mozfullscreenchange", onBrowserOriginatedFullscreenChange);
      document.onwebkitfullscreenchange = onBrowserOriginatedFullscreenChange;
      $(document).on("MSFullscreenChange", onBrowserOriginatedFullscreenChange);
      //$(document).on("webkitfullscreenchange", onBrowserOriginatedFullscreenChange);
      $(window).resize(_.bind(this._onResize, this));
      rootElement.on("mresize",_.bind(this._onResize, this));

      // BeforeUnload Event
      $(window).on("beforeunload", _.bind(this._onBeforeUnload, this));

      this.mb.publish(OO.EVENTS.PLAYER_EMBEDDED, {
        videoWrapperClass: "innerWrapper",
        pluginsClass: "plugins"
      });
    },

    onEmbedCodeChanged: function() {
      this._assetChanged();
    },

    onAssetChanged: function() {
      this._assetChanged();
    },

    _assetChanged: function() {
      this.playbackReady = false;
    },

    onPlaybackReady: function(event, playbackPackage) {
      this.playbackReady = true;
    },

    _isFullscreen: function() {
      if (this.rootElement.hasClass("fullscreen")) { return true; }
      var isFullscreen = document.fullscreen || document.mozFullScreen || document.webkitIsFullScreen ||
        document.webkitDisplayingFullscreen || document.msFullscreenElement;
      return !!isFullscreen;
    },

    _onBrowserOriginatedFullscreenChange: function() {
      OO.d('Fullscreen Changed',this._isFullscreen());
      this.mb.publish(OO.EVENTS.SIZE_CHANGED, this.rootElement.innerWidth(), this.rootElement.innerHeight());
      this.mb.publish(OO.EVENTS.FULLSCREEN_CHANGED, this._isFullscreen());
    },

    onFullscreenChanged: function(event, isFullscreen) {
      if(isFullscreen && !this.originalZ && !this.originalOverflow) {
        // increase the z-index of the player before going to fullscreen, to make sure it won't be behind other players
        // some browsers unfortunately show through elements with higher z-index even when in fullscreen mode
        this.originalZ = this.rootElement.css('z-index');
        this.originalOverflow = this.rootElement.css('overflow');
        this.rootElement.css('z-index', this.originalZ + 1000);
        this.rootElement.css('overflow','visible');
      } else if (!isFullscreen) {
        // reset the z-index of the player before exiting fullscreen, to make sure it is back to same level as other players
        // some browsers unfortunately show through elements with higher z-index even when in fullscreen mode
        this.rootElement.css('z-index', "");
        this.rootElement.css('overflow', this.originalOverflow);
        this.originalZ = null;
        this.originalOverflow = null;
      }
    },

    _onResize: function() {
      if (this.width != this.rootElement.innerWidth() || this.height != this.rootElement.innerHeight()) {
        this.width = this.rootElement.innerWidth();
        this.height = this.rootElement.innerHeight();
        this.mb.publish(OO.EVENTS.SIZE_CHANGED, this.width, this.height);
      }
    },

    onPlay: function() {
      if(!this.useCustomControls && !this.useNativeControls) {
        this.mb.publish(OO.EVENTS.WILL_CHANGE_FULLSCREEN, true);
      }
    },

    onWillChangeFullscreen: function(event, shouldEnterFullscreen) {
      if (!this.useNativeControls && !this.useCustomControls) { return; }
      if (shouldEnterFullscreen) {
        this._showFullscreen();
      } else {
        this._hideFullscreen();
      }
    },

    _getActiveVideo: function() {
      var mainVideo = this.rootElement.find("video.video");
      var activeVideo = mainVideo.get(0);
      var pluginVideo = this.rootElement.find("div.plugins video").get(0);
      if ( pluginVideo && !this._isVideoDomVisible("video.video") ) {
         activeVideo = pluginVideo;
      }
      return activeVideo;
    },

    _showFullscreen: function() {
      var el = this.rootElement[0];
      var activeVideo = this._getActiveVideo();
      var fullscreenApi = el.requestFullScreen || el.requestFullscreen || el.mozRequestFullScreen ||
            el.webkitRequestFullScreen || el.msRequestFullscreen;
      if ((!fullscreenApi || (OO.isAndroid && !OO.isChrome)) && activeVideo && activeVideo.webkitEnterFullscreen) {
        // this uglyness is cause mobile chrome on android claims to support full screen on divs (next method), but doesn't actually work
        // however we still prefer to use div fullscreen on anything else so we only try this if android is detected
        // update: Chrome on Android looks to properly support the fullscreen API for divs, so now we check
        // specifically for the native browser which still does not.
        activeVideo.isFullScreenMode = true;
        activeVideo.webkitEnterFullscreen();
      } else if (fullscreenApi) {
        $(activeVideo).css("background-color","black");
        fullscreenApi.call(el);
      } else {
        this.rootElement.addClass("fullscreen");
      }
      this.mb.publish(OO.EVENTS.FULLSCREEN_CHANGED, true);
    },

    _hideFullscreen: function() {
      var activeVideo = this._getActiveVideo();
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      } else if (activeVideo && activeVideo.webkitExitFullscreen) {
        activeVideo.isFullScreenMode = false;
        activeVideo.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else {
        this.rootElement.removeClass("fullscreen");
      }

      $(activeVideo).css("background-color","");
      this.mb.publish(OO.EVENTS.FULLSCREEN_CHANGED, false);
    },

    _isVideoDomVisible: function(domSelector) {
       return (this.rootElement.find(domSelector).css("display") == OO.CSS.VISIBLE_DISPLAY);
    },

    _onBeforeUnload: function(event) {
      // A still user-cancellable page unload request has been made.
      this.mb.publish(OO.EVENTS.PAGE_UNLOAD_REQUESTED, true);
    },

    __placeholder: true
  });

  OO.registerModule('chromeless_ui', function(messageBus, id) {
    return new ChromelessUi(messageBus, id);
  });
}(OO, OO.$, OO._));

/*
 * Asset Controller
 */

 (function(OO, _, $) {
  /**
   * @class AssetController
   * @classdesc The Asset controller main class.  This class is registered as a module with the player.
   * @private
   * @param {object} messageBus The player message bus
   * @param {string} id The ID of the player module
   */
  var AssetController = function(messageBus, id) {
    this.toString = function() {return 'asset-controller';};
    this.mb = messageBus;
    this.id = id;
    this.currentAssetId = "";

    this.mb.subscribe(OO.EVENTS.SET_ASSET, 'asset', _.bind(this.setAsset, this));
    this.mb.subscribe(OO.EVENTS.UPDATE_ASSET, 'asset', _.bind(this.updateAsset, this));
  };

  _.extend(AssetController.prototype, {
    /**
     * Converts values from the asset JSON to what the player is expecting
     * @method AssetController#normalizeAsset
     * @private
     * @param {object} asset The new asset metadata
     */
    normalizeAsset: function(asset) {
      asset.content.duration = asset.content.duration * 1000;
    },

    /**
     * Called when the asset is changed.  Verify asset object satisfy required parameters
     * @method AssetController#setAsset
     * @private
     * @param {string} eventname The name of the event raised
     * @param {object} asset The new asset metadata
     * @param {object} params The player parameters
     * @fires OO.EVENTS.PLAYBACK_READY
     */
    setAsset: function(eventname, asset, params) {
      // Verify if asset object satisfy required settings (Required settings are TBD)
      if (this.validate(asset)) {
        this.normalizeAsset(asset);
        this.currentAssetId = asset.id;
        this.mb.publish(OO.EVENTS.ASSET_CHANGED, asset, params);

        if (this.validateKeyframes(asset)) {
          this.mb.publish(OO.EVENTS.THUMBNAILS_FETCHED, {data: asset.content.keyFrames});
        }

        if (asset.relatedVideos && asset.relatedVideos.length > 0) {
          this.mb.publish(OO.EVENTS.DISCOVERY_API.RELATED_VIDEOS_FETCHED, {videos: asset.relatedVideos});
        }

      } else {
        this.mb.publish(OO.EVENTS.ERROR, { code: OO.ERROR.API.CONTENT_TREE });
      }
    },

    /**
     * Called to update metadata about the currently playing asset. Unrequired field in the
     * asset JSON can be filled in here after the initial SET_ASSET call without interrupting playback.
     * Will publish ASSET_UPDATED if the asset passes validation.
     * @method AssetController#updateAsset
     * @private
     * @param {string} eventname The name of the event raised
     * @param {object} asset The new asset metadata
     * @param {object} params The player parameters
     * @fires OO.EVENTS.ASSET_UPDATED
     */
    updateAsset: function(eventname, asset, params) {
      // Verify if asset object satisfy required settings (Required settings are TBD)
      if (this.validateUpdate(asset)) {
        this.mb.publish(OO.EVENTS.ASSET_UPDATED, asset);
      }

      if (this.validateKeyframes(asset)) {
          this.mb.publish(OO.EVENTS.THUMBNAILS_FETCHED, {data: asset.content.keyFrames});
      }

      if (asset.relatedVideos.length > 0) {
        this.mb.publish(OO.EVENTS.DISCOVERY_API.RELATED_VIDEOS_FETCHED, {videos: asset.relatedVideos});
      }
    },

    /**
     * Validate asset params
     * @method AssetController#validate
     * @private
     * @param {object} asset The new asset metadata
     * @param {object} params The player parameters
     * @return {Boolean} <code>true</code> if the asset fulfills required params, <code>false</code> otherwise.
     * Required params TBD
     */
    validate: function(asset) {
      this.validateRelatedVideos(asset);
      return  asset &&
              typeof asset.id == "string" &&
              asset.content &&
              asset.content.streams &&
              asset.content.streams.length > 0 &&
              typeof asset.content.title == "string" &&
              typeof asset.content.description == "string" &&
              typeof asset.content.duration == "number" &&
              asset.content.posterImages &&
              asset.content.posterImages.length > 0 &&
              asset.content.captions;
    },
    /**
     * Validate asset params when updating the asset
     * @method AssetController#validateUpdate
     * @private
     * @param {object} asset The updated asset metadata
     * @return {Boolean} <code>true</code> if the asset fulfills required params, <code>false</code> otherwise.
     * Required params TBD
     */
    validateUpdate: function(asset) {
      this.validateRelatedVideos(asset);
      return  asset &&
              typeof asset.id == "string" &&
              (asset.id == this.currentAssetId) &&
              ((asset.relatedVideos && asset.relatedVideos.length > 0) ||
                (asset.content &&
                  (typeof asset.content.title == "string" ||
                   typeof asset.content.description == "string" ||
                   typeof asset.content.duration == "number" ||
                   asset.content.captions ||
                  (asset.content.posterImages && asset.content.posterImages.length > 0))
                )
              )
    },

    /**
     * Validate related videos
     * @method AssetController#validateRelatedVideos
     * @private
     * @param {object} asset Related video asset
     */
    validateRelatedVideos: function(asset) {
      if (asset.relatedVideos && asset.relatedVideos.length > 0){
        var validatedRelatedVideos = [];
        for (var i = 0; i < asset.relatedVideos.length; i++){
          if (this.validate(asset.relatedVideos[i].asset) &&
            typeof asset.relatedVideos[i].name == "string" &&
            typeof asset.relatedVideos[i].preview_image_url == "string") {
            validatedRelatedVideos.push(asset.relatedVideos[i]);
          }
        }
        asset.relatedVideos = validatedRelatedVideos;
      }
    },

    validateKeyframes: function(asset) {
      return  asset && asset.content &&
              asset.content.keyFrames &&
              asset.content.keyFrames.available_widths &&
              asset.content.keyFrames.available_widths.length > 0 &&
              asset.content.keyFrames.available_time_slices &&
              asset.content.keyFrames.available_time_slices.length > 0 &&
              asset.content.keyFrames.thumbnails &&
              Object.keys(asset.content.keyFrames.thumbnails).length == asset.content.keyFrames.available_time_slices.length;
    }
  });

  OO.registerModule('assetController', function(messageBus, id) {
    return new AssetController(messageBus, id);
  });

}(OO, OO._, OO.$));
/*
 * Playback Controller
 */

(function(OO, _, $) {
  /**
   * @class PlaybackController
   * @classdesc The playback controller main class.  This class is registered as a module with the player.
   * @private
   * @param {object} messageBus The player message bus
   * @param {string} id The ID of the player module
   */
  var PlaybackController = function(messageBus, id) {
    this.toString = function() {return 'playback-controller';};
    this.mb = messageBus;
    this.id = id;

    // elements
    // TODO: Will this controller ever manage multiple playback elements?
    this.playbackElements = {};
    this.currentPlaybackElement = null;

    // state
    this.willPlayFromBeginning = true;
    this.metadataHasFetched = false;
    this.isFirstStream = true;
    this.playedAtLeastOnce = false;
    this.endScreenShown = false;

    // properties
    this.playerParams = null;
    this.shouldPreload = true;
    this.initialTime = 0;
    this.closedCaptions = null;

    // Default values for initialBitrate Override.
    // bitrateProperty.level a fraction from 0 to 1 from max_bitrate to choose, or "auto" to defer to video plugin ABR
    // bitrateProperty.duration a number (sec) to hold the level until ABR is set back to "auto"
    this.bitrateProperty = {level: "auto", duration: 15};
    this.bitrateOverrideFunction = null;
    this.bitrateOverrideTimer = null;
    this.chosenBitrateIndex = "auto";
    this.isBitrateOverrideReady = {
      "isBitrateInfoAvailable": false,
      "isMainVideoElementInFocus": false,
      "isBitrateOverridden" : false
    };

    // subscribes
    this.mb.subscribe(OO.EVENTS.PLAYER_CREATED, 'playback', _.bind(this.playerCreated, this));
    this.mb.subscribe(OO.EVENTS.EMBED_CODE_CHANGED, 'playback', _.bind(this.embedCodeChanged, this));
    this.mb.subscribe(OO.EVENTS.SET_ASSET, 'playback', _.bind(this.setAsset, this));
    this.mb.subscribe(OO.EVENTS.CONTENT_TREE_FETCHED, 'playback', _.bind(this.contentTreeFetched, this));
    this.mb.subscribe(OO.EVENTS.METADATA_FETCHED, 'playback', _.bind(this.metadataFetched, this));
    this.mb.subscribe(OO.EVENTS.AUTHORIZATION_FETCHED, 'playback', _.bind(this.authorizationFetched, this));
    this.mb.subscribe(OO.EVENTS.INITIAL_PLAY, 'playback', _.bind(this.initialPlay, this));
    this.mb.subscribe(OO.EVENTS.WILL_PLAY_FROM_BEGINNING, 'playback',
                      _.bind(this.onWillPlayFromBeginning, this));
    this.mb.subscribe(OO.EVENTS.PLAYED, 'playback', _.bind(this.played, this));
    this.mb.subscribe(OO.EVENTS.ASSET_CHANGED, 'playback', _.bind(this.assetChanged, this));

    this.mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, 'playback',
                      _.bind(this.vcVideoElementCreated, this));
    this.mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_IN_FOCUS, 'playback',
                      _.bind(this.videoControllerVideoElementInFocus, this));
    this.mb.subscribe(OO.EVENTS.VC_PLAYED, 'playback', _.bind(this.vcPlayed, this));
    this.mb.subscribe(OO.EVENTS.VC_PLAYING, 'playback', _.bind(this.vcPlaying, this));
    this.mb.subscribe(OO.EVENTS.VC_CAN_PLAY, 'playback', _.bind(this.vcCanPlay, this));
    this.mb.subscribe(OO.EVENTS.VC_PAUSED, 'playback', _.bind(this.vcPaused, this));
    this.mb.subscribe(OO.EVENTS.VC_SEEKED, 'playback', _.bind(this.vcSeeked, this));
    this.mb.subscribe(OO.EVENTS.VC_PLAY_FAILED, 'playback', _.bind(this.vcPlayFailed, this));
    this.mb.subscribe(OO.EVENTS.VC_ERROR, 'playback', _.bind(this.vcError, this));
    this.mb.subscribe(OO.EVENTS.VC_WILL_PLAY, 'playback', _.bind(this.vcWillPlay, this));
    this.mb.subscribe(OO.EVENTS.REPLAY, 'playback', _.bind(this.replay, this));
    this.mb.subscribe(OO.EVENTS.PLAYBACK_READY, 'playback', _.bind(this.playbackReady, this));
    this.mb.subscribe(OO.EVENTS.BITRATE_INFO_AVAILABLE, 'playback', _.bind(this.bitrateInfoAvailable, this));
    this.mb.subscribe(OO.EVENTS.SET_TARGET_BITRATE, 'playback', _.bind(this.setTargetBitrate, this));

    // TODO: Can we deprecate this event?
    this.mb.subscribe(OO.EVENTS.WILL_RESUME_MAIN_VIDEO, 'playback', _.bind(this.willResume, this));
  };

  _.extend(PlaybackController.prototype, {
    // ************
    // Helpers
    // ************

    /**
     * Extracts the playable streams from the auth response.
     * @method PlaybackController#getStreams
     * @protected
     * @param {object} playbackAuth The autorization response containing stream information
     * @returns {object} The streams associated with the current asset denoted by encoding type
     */
    getStreams: function(playbackAuth) {
      if (!playbackAuth) { return null; }
      if (_.isEmpty(playbackAuth.streams)) { return null; }
      var streams = {};
      for (var i = 0; i < playbackAuth.streams.length; i++) {
        var deliveryType = playbackAuth.streams[i].delivery_type;
        if (!playbackAuth.streams[i].url || !deliveryType) continue;

        var drmData = playbackAuth.streams[i].drm || {};

        if (!_.isEmpty(drmData) && deliveryType != 'remote_asset') {
          deliveryType = deliveryType.concat("_drm");
        }

        streams[deliveryType] = {
          url: OO.decode64(playbackAuth.streams[i].url.data)
        };

        if (!_.isEmpty(drmData)) {
          streams[deliveryType].drm = drmData;
        }

        // [PBW-5096]: pass akamai secure content metadata information to video plugin
        var akamai_secure_hd = playbackAuth.streams[i].akamai_secure_hd || null;
        if (typeof akamai_secure_hd === "boolean") {
          streams[deliveryType].contentMetadata = {
            "assetId": this.currentEmbedCode,
            "accountId": this.playerParams.pcode,
            "secureContent": akamai_secure_hd
          };
        }
        streams.isLive = playbackAuth.streams[i].is_live_stream || false;
      }

      if (streams['remote_asset']) {
        streams[OO.VIDEO.ENCODING.UNKNOWN] = streams['remote_asset'];
        delete streams['remote_asset'];
      }
      return streams;
    },

    /**
     * Extracts the playable streams from the auth response.
     * @method PlaybackController#getAssets
     * @protected
     * @param {object} asset The JSON object containing stream information
     * @returns {object} The streams associated with the current asset denoted by encoding type
     */
    getAssets: function(asset) {
      if (!asset) { return null; }
      if (_.isEmpty(asset.content.streams)) { return null; }
      var streams = {};
      for (var i = 0; i < asset.content.streams.length; i++) {
        if (!asset.content.streams[i].url || !asset.content.streams[i].delivery_type) continue;
        streams[asset.content.streams[i].delivery_type] = {url: asset.content.streams[i].url};
      }
      streams.isLive = asset.content.is_live_stream || false;
      return streams;
    },

    assetChanged: function(event, asset){
      if (this.bitrateOverrideTimer) {
        clearTimeout(this.bitrateOverrideTimer);
        this.bitrateOverrideTimer = null;
      }
      this.chosenBitrateIndex = "auto";
      this.isBitrateOverrideReady = {
        "isBitrateInfoAvailable": false,
        "isMainVideoElementInFocus": false,
        "isBitrateOverridden" : false
      };

      this.streams = this.getAssets(asset);
      this.closedCaptions = {
        "closed_captions": asset.content.captions.closed_captions,
        "closed_captions_vtt": asset.content.captions.closed_captions_vtt
      };
      this.dataReady();
    },

    /**
     * Checks if all of the metadata has been raised.
     * @method PlaybackController#checkDataReady
     * @protected
     */
    checkDataReady: function() {
      if (this.contentTree != null && this.metadataHasFetched && this.authorization != null) {
        this.dataReady();

        // TODO: consider making a timeout to fire playback ready in case the video element is never created
        // Note that having the video element never created while not raising an error event is not an
        // expected scenario.
      }
    },

    /**
     * Called when all playback metadata has been fetched.  Creates the main video element.
     * @method PlaybackController#dataReady
     * @protected
     * @fires OO.EVENTS.VC_CREATE_VIDEO_ELEMENT
     */
    dataReady: function() {
      var mainVideoId = OO.VIDEO.MAIN;
      this.playbackElements[mainVideoId] = { "streams": this.streams };
      this.currentPlaybackElement = mainVideoId;
      this.publishClosedCaptionInfo(mainVideoId, this.closedCaptions);
      var platform = this.playerParams? this.playerParams.platform : void 0;
      var params = {
        "closedCaptions": this.playbackElements[mainVideoId].closedCaptions,
        "platform": platform
      };
      this.mb.publish(OO.EVENTS.VC_CREATE_VIDEO_ELEMENT, mainVideoId, this.streams, null, params);
    },

    /**
     * Resets internal data associated with a stream.
     * @method PlaybackController#resetStreamData
     * @protected
     */
    resetStreamData: function() {
      // data
      this.contentTree = null;
      this.metadataHasFetched = false;
      this.authorization = null;
      this.streams = null;
      this.currentEmbedCode = null;
      this.endScreenShown = false;

      // Clear out initialTime on all subsequent stream loads
      if (!this.isFirstStream) {
        this.initialTime = 0;
      }
      this.isFirstStream = false;

      // state
      this.playedAtLeastOnce = false;
    },

    /**
     * Triggers stream preloading if should preload.
     * @method PlaybackController#preloadStream
     * @protected
     * @fires OO.EVENTS.VC_PRELOAD;
     */
    preloadStream: function() {
      // preload the stream
      if (this.shouldPreload) {
        this.mb.publish(OO.EVENTS.VC_PRELOAD, this.currentPlaybackElement);
      }
    },

    /**
     * Triggers autoplay if required.
     * @method PlaybackController#triggerAutoplay
     * @protected
     * @fires OO.EVENTS.INITIAL_PLAY
     */
    triggerAutoplay: function() {
      var autoPlay = !this.playerParams ? false :
                     (this.playerParams.autoPlay === 'true' || this.playerParams.autoPlay === true ||
                      this.playerParams.autoplay === 'true' || this.playerParams.autoplay === true);

      if (this.playedAtLeastOnce == false && autoPlay && OO.allowAutoPlay) {
        this.mb.publish(OO.EVENTS.INITIAL_PLAY);
      }
    },

    /**
     * Triggers playback if should loop playback.
     * @method PlaybackController#triggerLoopPlay
     * @protected
     * @fires OO.EVENTS.REPLAY
     */
    triggerLoopPlay: function() {
      var loop = !this.playerParams ? false :
                 (this.playerParams['loop'] === 'true' || this.playerParams['loop'] === true);
      if (loop) {
        this.mb.publish(OO.EVENTS.REPLAY);
      }
    },


    // **************
    // Callbacks
    // **************

    /**
     * Called when the player is created.  Initializes locale and settings, and configures the system
     * to pause the stream if visibility changes.
     * @method PlaybackController#playerCreated
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {string} elementId The element id of the player instance
     * @param {object} params Page-level player parameters
     * @fires OO.EVENTS.PAUSE
     */
    playerCreated: function(eventname, elementId, params) {
      this.playerParams = params;

      if (typeof this.playerParams === "object") {
        // Set HTML5 locale
        if (this.playerParams["locale"] !== undefined) {
          OO.setLocale(this.playerParams["locale"]);
        }

        // Let page-level parameters override our default value for shouldPreload from true to false only
        if (this.playerParams["preload"] === false) {
          this.shouldPreload = false;
        }

        // Save initial time
        if (this.playerParams["initialTime"] !== undefined){
          var time = parseInt(this.playerParams["initialTime"], 10);
          if (!isNaN(time) && time > 0) {
            this.initialTime = time;
          }
        }
      }

      if (OO.isIos && OO.iosMajorVersion == 7) {
        // [pbw-1832] iOS 7's visibilitychange event is different/bad, so use pageshow
        window.addEventListener("pageshow", _.bind(function() {
          this.mb.publish(OO.EVENTS.PAUSE);
        }, this));
      } else if (OO.isAndroid || OO.isIos) {
        // [pbw-1832] on other mobile, pause when the tab is switched or the browser is backgrounded
        document.addEventListener("visibilitychange", _.bind(function(evt) {
          if (document.hidden) {
            this.mb.publish(OO.EVENTS.PAUSE);
          }
        }, this));
      }
      this.initialBitrateOverride(params);
    },

    /**
     * Called when playback is created.
     * @method PlaybackController#playbackReady
     * @protected
     */
    playbackReady: function() {
      this.triggerAutoplay();
    },

    /**
     * Called when player is created. Store any bitrateOverride params and callback
     * @method PlaybackController#initialBitrateOverride
     * @protected
     */
    initialBitrateOverride: function(params) {
      if (params && params.initialBitrate) {
        var level = params.initialBitrate.level;
        if (level == "auto" || ($.isNumeric(level) && level >= 0 && level <= 1)) {
          this.bitrateProperty.level = level;
        }
        var duration = params.initialBitrate.duration;
        if ($.isNumeric(duration) && duration > 0) {
          this.bitrateProperty.duration = duration;
        }
      }
      if (params && params.bitrateOverrideFunction && typeof params.bitrateOverrideFunction === "function") {
        this.bitrateOverrideFunction = params.bitrateOverrideFunction;
      }
    },

    /**
     * Called when BITRATE_INFO_AVAILABLE is published. Execute any bitrate override.
     * @method PlaybackController#bitrateInfoAvailable
     * @protected
     */
    bitrateInfoAvailable: function (eventname, params) {
      if (params && params.bitrates && this.bitrateProperty.level != "auto") {
        // Form and sort array of bitrates
        var bitrateArray = [];
        var bitrateMap = {};
        for (var index = 0; index < params.bitrates.length; index++) {
          if (params.bitrates[index].id != "auto") {
            bitrateArray.push(params.bitrates[index].bitrate);
            bitrateMap[params.bitrates[index].bitrate] = params.bitrates[index].id;
          }
        }
        bitrateArray.sort( function(a, b) { return a - b; } );

        // Choose the bitrate, closes to the level * maxBitrateAvailable
        if (bitrateArray.length > 0) {
          var preferredBitrate = this.bitrateProperty.level * bitrateArray[bitrateArray.length - 1];
          var chosenBitrate = bitrateArray[0];
          for (var index = 0; index < bitrateArray.length; index++) {
            if (bitrateArray[index] <= preferredBitrate) {
              chosenBitrate = bitrateArray[index];
            } else {
              break;
            }
          }
          this.chosenBitrateIndex = bitrateMap[chosenBitrate];
          this.isBitrateOverrideReady.isBitrateInfoAvailable = true;
        }
        this.publishInitialBitrateOverride();
      }
    },

    /**
     * Called everytime VC_PLAYING is published. Execute any bitrate override once.
     * @method PlaybackController#publishInitialBitrateOverride
     * @protected
     */
    publishInitialBitrateOverride: function() {
      if (!this.isBitrateOverrideReady.isBitrateOverridden && this.isBitrateOverrideReady.isMainVideoElementInFocus) {
        if (typeof this.bitrateOverrideFunction === "function") {
          this.bitrateOverrideFunction();
          this.isBitrateOverrideReady.isBitrateOverridden = true;
        }
        // Only trigger this Once every initial playback and after replay
        else if (this.isBitrateOverrideReady.isBitrateInfoAvailable &&
                this.bitrateProperty.level != "auto" &&
                this.chosenBitrateIndex != "auto") {
          this.mb.publish(OO.EVENTS.SET_TARGET_BITRATE, this.chosenBitrateIndex, {setTimer: true});
          this.isBitrateOverrideReady.isBitrateOverridden = true;
        }
      }
    },

    /**
     * Called everytime VC_VIDEO_ELEMENT_IN_FOCUS is published. For now is used if initialBitrateOverride is needed
     * @method PlaybackController#videoControllerVideoElementInFocus
     * @protected
     */
    videoControllerVideoElementInFocus: function(eventname, id) {
      this.isBitrateOverrideReady.isMainVideoElementInFocus = (id == OO.VIDEO.MAIN);
      this.publishInitialBitrateOverride();
    },

    /**
     * Called when SET_TARGET_BITRATE is published.
     * @method PlaybackController#setTargetBitrate
     * @protected
     */
    setTargetBitrate: function (eventname, param, timer) {
      // Set a timer to disable bitrate Override, once duration is reached.
      if (!!timer && timer.setTimer) {
        this.bitrateOverrideTimer = setTimeout(
          _.bind(function(){ this.mb.publish(OO.EVENTS.SET_TARGET_BITRATE, "auto"); }, this),
          this.bitrateProperty.duration * 1000
        );
      }
      // Clear timer if another SET_TARGET_BITRATE is called, including self
      else if (this.bitrateOverrideTimer) {
        clearTimeout(this.bitrateOverrideTimer);
        this.bitrateOverrideTimer = null;
      }
    },

    /**
     * Called when authorization has been fetched.  Checks if the player is ready.
     * @method PlaybackController#authorizationFetched
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {object} params Authorization data
     */
    authorizationFetched: function(eventname, params) {
      this.authorization = params;
      this.streams = this.getStreams(params);
      this.checkDataReady();
    },

    /**
     * Called when the content metadata has been fetched.  Checks if the player is ready.
     * @method PlaybackController#contentTreeFetched
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {object} tree Movie metadata
     */
    contentTreeFetched: function(eventname, tree) {
      this.contentTree = tree;
      if (tree) {
        this.closedCaptions = {
          "closed_captions": tree.closed_captions,
          "closed_captions_vtt": tree.closed_captions_vtt
        };
      }
      this.checkDataReady();
    },

    /**
     * Called to publish the possible closed caption languages from content tree.
     * @method PlaybackController#publishClosedCaptionInfo
     * @protected
     * @param {string} videoId The id of the video element to which the caption info belongs
     * @param {object} tree Movie metadata
     */
    publishClosedCaptionInfo: function(videoId, captions) {
      if (captions) {
        var closedCaptions = {};

        //Check if the object contains either form of closed captions and that they have the correct info needed
        if (captions.closed_captions_vtt && captions.closed_captions_vtt.captions && _.size(captions.closed_captions_vtt.captions) > 0) {
          closedCaptions.closed_captions_vtt = captions.closed_captions_vtt.captions;
          closedCaptions.availableLanguages = captions.closed_captions_vtt.languages;
          closedCaptions.locale = {};
          for (var i = 0; i < closedCaptions.availableLanguages.length; i++) {
            var language = closedCaptions.availableLanguages[i];
            closedCaptions.locale[language] = closedCaptions.closed_captions_vtt[language].name;
          }
        }
        if (captions.closed_captions && captions.closed_captions.length > 0) {
          closedCaptions.closed_captions_dfxp = captions.closed_captions[0];
          closedCaptions.availableLanguages = captions.closed_captions[0].languages;
        }

        //Make sure the object contains at least one form of closed captions
        if (_.size(closedCaptions) > 0) {
          var availableLanguages = { videoId: videoId };
          availableLanguages.languages = ((captions.closed_captions_vtt && captions.closed_captions_vtt.languages) ||
                                          (closedCaptions.closed_captions_dfxp && closedCaptions.closed_captions_dfxp.languages));
          availableLanguages.locale = {};

          //Make sure we have available languages
          if (availableLanguages.languages && availableLanguages.languages.length > 0) {
            for (var i = 0; i < availableLanguages.languages.length; i++) {
              var language = availableLanguages.languages[i];
              if (closedCaptions.closed_captions_vtt && closedCaptions.closed_captions_vtt[language]) {
                availableLanguages.locale[language] = closedCaptions.closed_captions_vtt[language].name;
              }
            }

            _.extend(this.playbackElements[this.currentPlaybackElement], { "closedCaptions": closedCaptions });
            this.mb.publish(OO.EVENTS.CLOSED_CAPTIONS_INFO_AVAILABLE, availableLanguages);
          }
        }
      }
    },

    /**
     * Called when the playback metadata has been fetched.  Checks if the player is ready.
     * @method PlaybackController#metadataFetched
     * @protected
     */
    metadataFetched: function() {
      this.metadataHasFetched = true;
      this.checkDataReady();
    },

    /**
     * Called when playback is started.  Triggers intention to start playback of the main video.
     * @method PlaybackController#initialPlay
     * @protected
     * @fires OO.EVENTS.WILL_PLAY_FROM_BEGINNING
     */
    initialPlay: function() {
      if (this.willPlayFromBeginning) {
        this.mb.publish(OO.EVENTS.WILL_PLAY_FROM_BEGINNING);
      }
      this.willPlayFromBeginning = false;

      // For mobile, start the main video on this click and then pause. If not,
      // the video may not auto resume play when returning from prerolls.
      if (OO.isIos || OO.isAndroid) {
        this.mb.publish(OO.EVENTS.VC_PRIME_VIDEOS);
      }
    },

    /**
     * Called when playback on the content video should be started.
     * Brings the main video element into focus and triggers playback.
     * @method PlaybackController#onWillPlayFromBeginning
     * @protected
     * @fires OO.EVENTS.PLAY
     * @fires OO.EVENTS.VC_FOCUS_VIDEO_ELEMENT
     */
    onWillPlayFromBeginning: function() {
      this.mb.publish(OO.EVENTS.VC_FOCUS_VIDEO_ELEMENT, this.currentPlaybackElement);
      this.mb.publish(OO.EVENTS.VC_SET_INITIAL_TIME, OO.VIDEO.MAIN, this.initialTime);
      this.mb.publish(OO.EVENTS.PLAY);
      //this.mb.publish(OO.EVENTS.PLAY, this.currentPlaybackElement);
    },

    /**
     * Called when the video element has been created.  Triggers preloading and autoplay.
     * @method PlaybackController#vcVideoElementCreated
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {object} elementParams Properties of the video element including its domId and supported encodings
     * @fires OO.EVENTS.PLAYBACK_READY
     */
    vcVideoElementCreated: function(eventname, elementParams) {
      if (this.currentPlaybackElement && (elementParams["videoId"] === this.currentPlaybackElement)) {
        this.mb.publish(OO.EVENTS.PLAYBACK_READY);
        this.preloadStream();
      }
    },

    /**
     * Called when the stream is changed.  Resets playback data and disposes any existing playback elements.
     * @method PlaybackController#embedCodeChanged
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {object} embedCode The new embed code
     * @param {object} params The player parameters
     * @fires OO.EVENTS.VC_DISPOSE_VIDEO_ELEMENT
     */
    embedCodeChanged: function(eventname, embedCode, params) {
      // TODO: Only do all of this if the embed code actually changed?

      var autoPlay = !this.playerParams ? false :
               (this.playerParams.autoPlay === 'true' || this.playerParams.autoPlay === true ||
                this.playerParams.autoplay === 'true' || this.playerParams.autoplay === true);

      this.resetStreamData();
      this.currentEmbedCode = embedCode;
      if (this.bitrateOverrideTimer) {
        clearTimeout(this.bitrateOverrideTimer);
        this.bitrateOverrideTimer = null;
      }
      this.chosenBitrateIndex = "auto";
      this.isBitrateOverrideReady = {
        "isBitrateInfoAvailable": false,
        "isMainVideoElementInFocus": false,
        "isBitrateOverridden" : false
      };

      if (!params) this.playerParams = {};
      else this.playerParams = params;

      if (this.playerParams['locale'] !== undefined) {
        OO.setLocale(this.playerParams['locale']);
      }

      this.playerParams.autoPlay = autoPlay; // autoPlay should be preserved across videos in a series.
      this.willPlayFromBeginning = true;

      // Destroy any existing playback elements
      for (var element in this.playbackElements) {
        if (!element) continue;
        this.mb.publish(OO.EVENTS.VC_DISPOSE_VIDEO_ELEMENT, element);
      }
    },

    /**
     * Called when the asset is changed.  Resets playback data and disposes any existing playback elements.
     * Sets the locale based on player parameters.
     * @method PlaybackController#setAsset
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {object} asset The new asset object
     * @param {object} params The player parameters
     * @fires OO.EVENTS.VC_DISPOSE_VIDEO_ELEMENT
     */
    setAsset: function(eventname, asset, params) {
      this.resetStreamData();
      this.playerParams = params;
      this.willPlayFromBeginning = true;

      if (this.playerParams['locale'] !== undefined) {
        OO.setLocale(this.playerParams['locale']);
      }

      // Destroy any existing playback elements
      for (var element in this.playbackElements) {
        if (!element) continue;
        this.mb.publish(OO.EVENTS.VC_DISPOSE_VIDEO_ELEMENT, element);
      }
    },

    /**
     * Called when the stream should resume.  Tells the video controller to play the stream.
     * @method PlaybackController#willResume
     * @protected
     * @fires OO.EVENTS.VC_PLAY
     */
    willResume: function() {
      this.mb.publish(OO.EVENTS.VC_PLAY, this.currentPlaybackElement);
    },

    /**
     * Called when the video controller reports playback failure.  Raises playback error events.
     * @method PlaybackController#vcPlayFailed
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {string} videoId The id of the video element on which playback failed
     * @param {string} mediaErrorCode The error code raised by the video controller
     * @fires OO.EVENTS.PLAY_FAILED
     * @fires OO.EVENTS.ERROR
     */
    vcPlayFailed: function(eventname, videoId, mediaErrorCode) {
      if (!this.currentPlaybackElement || (videoId !== this.currentPlaybackElement)) return;

      this.mb.publish(OO.EVENTS.PLAY_FAILED, mediaErrorCode);
      mediaErrorCode = parseInt(mediaErrorCode);
      var mediaErrorAborted = !!window.MediaError ? window.MediaError.MEDIA_ERR_ABORTED : 1;
      var mediaErrorNetwork = !!window.MediaError ? window.MediaError.MEDIA_ERR_NETWORK : 2;
      var mediaErrorSourceNotSupported = !!window.MediaError ? window.MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED : 4;
      // TODO: Should mediaErrorAborted associate to it's own message?
      if (mediaErrorCode === mediaErrorAborted) {
        this.mb.publish(OO.EVENTS.ERROR, { code: OO.ERROR.PLAYBACK.GENERIC });
      } else if (mediaErrorCode === mediaErrorNetwork) {
        this.mb.publish(OO.EVENTS.ERROR, { code: OO.ERROR.PLAYBACK.NETWORK });
      } else if (mediaErrorCode === mediaErrorSourceNotSupported) {
        this.mb.publish(OO.EVENTS.ERROR, { code: OO.ERROR.PLAYBACK.GENERIC });
      } else if (mediaErrorCode === 6) {
        this.mb.publish(OO.EVENTS.ERROR, { code: OO.ERROR.API.SAS.ERROR_DRM_RIGHTS_SERVER_ERROR });
      } else {
        if (this.contentTree) {
          switch(this.contentTree.content_type) {
            case "Video":
              this.mb.publish(OO.EVENTS.ERROR, { code: OO.ERROR.PLAYBACK.STREAM });
              break;
            case "LiveStream":
              this.mb.publish(OO.EVENTS.ERROR, { code: OO.ERROR.PLAYBACK.LIVESTREAM });
              break;
            default:
              this.mb.publish(OO.EVENTS.ERROR, { code: OO.ERROR.PLAYBACK.GENERIC });
          }
        }
      }
    },

    /**
     * Called when the video controller encountered an error configuring a video element.  Raises error if
     * the video element was a main video element.
     * @protected
     * @param {string} eventname The name of the event raised.
     * @param {string} videoId The id of the video element which encountered a video controller error.
     * @param {object} errorDetails The details of the error including the error code.
     * @fires OO.EVENTS.ERROR
     */
    vcError: function(eventname, videoId, errorDetails) {
      if (!this.currentPlaybackElement || (videoId !== this.currentPlaybackElement)) {
        return;
      }

      this.mb.publish(OO.EVENTS.ERROR, errorDetails);
    },

    /**
     * Called when the video element received a play command and will be acting on it.  Raises willPlay if
     * the video element was a main video element.
     * @method PlaybackController#vcWillPlay
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {string} videoId The id of the video element which reported willPlay
     * @fires OO.EVENTS.WILL_PLAY
     */
    vcWillPlay: function(event, videoId) {
      if (this.playbackElements[videoId]) {
        this.mb.publish(OO.EVENTS.WILL_PLAY);

        //[pbw-1734] iOS fullscreen blocks the replay button, so mimic functionality here
        if (OO.isIos && this.endScreenShown) {
          this.mb.publish(OO.EVENTS.REPLAY);
        }

        this.endScreenShown = false;
      }
    },

    /**
     * Called when the content video is replayed.
     * @method PlaybackController#replay
     * @protected
     * @fires OO.EVENTS.SEEK
     * @fires OO.EVENTS.WILL_PLAY_FROM_BEGINNING
     */
    replay: function(event, initialTime) {
      this.endScreenShown = false;
      if (this.bitrateOverrideTimer) {
        clearTimeout(this.bitrateOverrideTimer);
        this.bitrateOverrideTimer = null;
      }
      this.isBitrateOverrideReady.isBitrateOverridden = false;
      this.initialTime = initialTime || 0;
      //PBI-1736 Do not send 'seek' here.  WILL_PLAY_FROM_BEGINNING will take care
      //of setting the time back to the beginning of the video. Otherwise there
      //may be problems on Android w/ ads.
      this.mb.publish(OO.EVENTS.WILL_PLAY_FROM_BEGINNING);
    },

    /**
     * Called when the video controller reports playback completion.  Raises played event.
     * @method PlaybackController#vcPlayed
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {string} videoId The id of the video element which reported played
     * @fires OO.EVENTS.PLAYED
     */
    vcPlayed: function(eventname, videoId) {
      if (!this.currentPlaybackElement || (videoId !== this.currentPlaybackElement)) return;

      this.endScreenShown = true;
      this.playedAtLeastOnce = true;
      this.mb.publish(OO.EVENTS.PLAYED);
    },

    /**
     * Called when the video controller reports playback in progress.  Raises playing event.
     * @method PlaybackController#vcPlaying
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {string} videoId The id of the video element which reported playing
     * @fires OO.EVENTS.PLAYING
     */
    vcPlaying: function(eventname, videoId) {
      if (!this.currentPlaybackElement || (videoId !== this.currentPlaybackElement)) return;
      // used to check this.userRequest before raising
      this.mb.publish(OO.EVENTS.PLAYING);
    },

    vcCanPlay: function(eventname, videoId) {
      if (this.currentPlaybackElement === videoId) {
        this.mb.publish(OO.EVENTS.CAN_PLAY);
      }
    },

    /**
     * Called when the video controller reports playback paused.  Raises paused event.
     * @method PlaybackController#vcPaused
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {string} videoId The id of the video element which reported paused
     * @fires OO.EVENTS.PAUSED
     */
    vcPaused: function(eventname, videoId) {
      if (!this.currentPlaybackElement || (videoId !== this.currentPlaybackElement)) return;
      this.mb.publish(OO.EVENTS.PAUSED);
    },

    /**
     * Called when the video controller reports video seeked.  Raises seeked event.
     * method PlaybackController#vcSeeked
     * @protected
     * @param {string} eventname The name of the event raised
     * @param {string} videoId The id of the video element which reported paused
     * @param {number} playhead The current time of the video after seeking
     * @fires OO.EVENTS.SEEKED
     */
    vcSeeked: function(eventname, videoId, playhead) {
      if (!this.currentPlaybackElement || (videoId !== this.currentPlaybackElement)) return;
      this.mb.publish(OO.EVENTS.SEEKED, playhead);
    },

    /**
     * Called when the main video playback is completed.  Preloads the stream and checks for loop play.
     * @method PlaybackController#played
     * @protected
     */
    played: function() {
      this.playedAtLeastOnce = true;
      this.preloadStream(); // re-initiate the playback ready for replay.
      this.triggerLoopPlay();
    }
  });

  OO.registerModule('playbackController', function(messageBus, id) {
    return new PlaybackController(messageBus, id);
  });
}(OO, OO._, OO.$));

/*
 * Video Controller
 * Controls and manages video player plugins. Acts as an interface between CORE and the actual video player.
 * Handles transition between main video player and ads player
 */

(function(OO, _, $) {
  /**
   * Logs data to the browser console in debug mode.
   * @private
   * @method log
   */
  var log = function() {
    OO.log.apply(this, $.merge(["VC:"], arguments));
  };

  /**
   * The list of registered plugins
   * key: video plugin name (string)
   * value: video plugin (object)
   * @private
   * @field registeredPlugins
   */
  var registeredPlugins = {};

  /**
   * The list of encodings to a videoPlugin name.
   * key: encoding (ex: OO.VIDEO.ENCODING.MP4) (string)
   * value: video plugin names (Queue or Array)
   * @private
   * @field encodingToPlugins
   */
  var encodingToPlugins = {};

  /**
   * Retrieves a list of the supported encodings.
   * @private
   * @method getSupportedEncodings
   */
  var getSupportedEncodings = _.bind(function() {
    var encodings = [];
    _.each(encodingToPlugins, function(value, index) {
      if (value && value.length > 0) encodings.push(index);
    });
    return encodings;
  }, this);

   /**
   * @class OO.Video
   * @classdesc Provides the ability to register, verify, and unregister video plugins within the Ooyala player.
   * @public
   */
  OO.Video = {
    /**
     * Registers a new video plugin. The format of the video plugin is validated, and
     * the video plugin is only registered if it defines the required functions and properties.
     * @public
     * @method OO.Video#register
     * @param {object} videoPlugin The video plugin object to be registered.
     */
    plugin: function(videoPlugin) {
      if (!this.validate(videoPlugin)) return;
      log("Registering video plugin:", videoPlugin.name);
      for (var index = 0; index < videoPlugin.encodings.length; index++) {
        var encoding = videoPlugin.encodings[index];
        if (encodingToPlugins[encoding]) {
          encodingToPlugins[encoding].push(videoPlugin.name);
        } else {
          encodingToPlugins[encoding] = [videoPlugin.name];
        }
      }
      registeredPlugins[videoPlugin.name] = videoPlugin;
    },

    /**
     * Unregisters a video plugin.
     * @public
     * @method OO.Video#unregister
     * @memberOf OO.Video
     * @param {string} name The name of the video plugin to unregister, traditionally represented by
     *                      <code>videoPlugin.name</code>.
     */
    unregister: function(name) {
      log("Removing a video plugin:", name);
      if (name && registeredPlugins[name]) {
        // Removes plugin from encodingToPlugin
        for (var index = 0; index < registeredPlugins[name].encodings.length; index++) {
          var encoding = registeredPlugins[name].encodings[index];
          var priorityIndex = encodingToPlugins[encoding] ? encodingToPlugins[encoding].indexOf(name) : -1;
          if (priorityIndex > -1) {
            encodingToPlugins[encoding].splice(priorityIndex, 1);
          }
        }

        // Removes plugin from registeredPlugins
        if (_.isFunction(registeredPlugins[name].destroy)) {
          try {
            registeredPlugins[name].destroy();
          } catch (err) {
            log("Error destroying a video plugin", name, ".", err);
          }
        }

        delete registeredPlugins[name];
      }
    },

    /**
     * Validates the format of a video plugin and checks if it is already registered.<br/>
     * The video plugin must define the following functions:<br/>
     * <ul>
     *    <li><code>create()</code></li>
     * </ul>
     * The video plugin must define the following properties:
     * <ul>
     *     <li><code>name (string)</code></li>
     *     <li><code>encodings (array)</code></li>
     *     <li><code>features (array)</code></li>
     *     <li><code>technology (string)</code></li>
     * </ul>
     * @public
     * @method validate
     * @memberOf OO.Video
     * @instance
     * @param {object} videoPlugin The video plugin object.
     * @return {boolean} <code>true</code> if the video plugin meets the template requirements,
     * <code>false</code> otherwise.
     */
    validate: function(videoPlugin) {
      // TODO: Enhance this to support type array
      var properties = {"name":"string", "encodings":"object", "features":"object", "technology":"string"};
      var functions = ["create"];

      function raiseValidationError(errorString) {
        log(errorString);
        // TODO - raise real error
      }

      function checkForProperty(propertyName, propertyType, managerName) {
        if (!_.has(videoPlugin, propertyName)) {
          raiseValidationError("The video plugin '" + managerName + "' requires a '" + propertyName +
                               "' property");
          return false;
        }
        if (typeof videoPlugin[propertyName] != propertyType) {
          raiseValidationError("The video plugin '" + managerName + "' property '" + propertyName +
                               "' should be type '" + propertyType + "'");
          return false;
        }
        return true;
      }

      function checkForFunction(functionName, managerName) {
        if (!_.isFunction(videoPlugin[functionName])) {
          raiseValidationError("The video plugin '" + managerName + "' requires a '" + functionName +
                               "' function");
          return false;
        }
        return true;
      }

      if (!videoPlugin) {
        raiseValidationError("The video plugin must be defined");
        return false;
      }
      if (!_.isObject(videoPlugin)) {
        raiseValidationError("The video plugin must be an object");
        return false;
      }
      for (var key in properties) {
        if (!checkForProperty(key, properties[key], videoPlugin.name)) return false;
      }
      for (var x = 0; x < functions.length; x++) {
        if (!checkForFunction(functions[x], videoPlugin.name)) return false;
      }
      if (registeredPlugins[videoPlugin.name]) {
        raiseValidationError("The video plugin '" + videoPlugin.name + "' has already been registered");
        return false;
      }

      return true;
    },

    /**
     * Returns a list of all registered video plugins.  This is primarily used in testing.
     * @private
     * @method OO.Video#getRegisteredPlugins
     * @returns {object} All registered video plugins, referenced by name.
     */
    getRegisteredPlugins: function() {
      return registeredPlugins;
    }
  };

  OO.exposeStaticApi('Video', OO.Video);


  /**
   * @class VideoControllerInterface
   * @classdesc The interface to the controller provided to a plugin.
   * @public
   * @param vtc The video tech controller instance
   * @param videoId The id of the video instance
   * @param electedPlugin The plugin from which the video element is built
   */
  var VideoControllerInterface = function(vtc, videoId, electedPlugin) {
    /**
     * Event types accepted by the video controller from video plugins for the <code>notify()</code> method.
     * See VideoController#EVENTS for the full list of events and associated parameters.
     * @field VideoControllerInterface#EVENTS
     * @public
     */
    this.EVENTS = vtc.EVENTS;

    /**
     * Notifies the Video Controller of an event from the video.
     * @method VideoControllerInterface#notify
     * @public
     * @param {string} eventname The event name (see VideoController#EVENTS).
     * @param {object} eventparams The event parameters.
     *                             See VideoController#EVENTS for the required parameters for each event.
     */
    this.notify = _.bind(vtc.notify, vtc, videoId, electedPlugin);

    /**
     * Notifies the Video Controller that the video element is not ready to receive play commands.  This
     * will only have an effect if called before returning the element in the create API.
     * This should only be used in cases when the video wrapper will not be able to handle play events
     * in a synchronous fashion on devices such as Android that require playback directly upon user click.
     * @method VideoControllerInterface#markNotReady
     * @public
     */
    this.markNotReady = _.bind(vtc.markNotReady, vtc, videoId);

    /**
     * Notifies the Video Controller that the video element is ready to receive play commands.  This function
     * should only be called if VideoControllerInterface.markNotReady was called.
     * @method VideoControllerInterface#markReady
     * @public
     */
    this.markReady = _.bind(vtc.markReady, vtc, videoId);

    // temp placeholder, required by bitmovin plugin
    this.PLUGIN_MAGIC = '087d2ef5-9d39-43ed-a57a-16a312c87c0b';
  };


  /**
   * @class VideoController
   * @classdesc The video controller main class.  This class is registered as a module with the player.
   * @private
   * @param {object} messageBus The player message bus
   * @param {string} id The ID of the player module
   * @property {object} activeInstances An object of active video instances referenced by unique video ids
   * @property {string} focusVideoId The id of the video currently in focus
   * @property {string} elementId The id of the root element this video controller will interact with
   */
  var VideoController = function(messageBus, id) {
    // constants
    var READY_TIMEOUT = 3000;

    // module variables
    var mb = messageBus;
    var readyTimer = null;
    var elementsNotReady = [];

    // element variables
    var activeElements = [];
    var rootElement = null;

    // element properties
    this.activeInstances = {};
    this.focusVideoId = null;
    var activeLanguage = "";
    var ccMode = OO.CONSTANTS.CLOSED_CAPTIONS.SHOWING;
    this.elementId = null;
    this.currentPlayhead = 0;

    this.toString = function() {return 'video-controller';};

    /**
     * A wrapper for video elements.
     * @constructor
     * @private
     * @param {object} params The parameters for the video element.
     *                        It must contain the following fields:<br/>
     *   plugin {object} The plugin that created the video element<br />
     *   parentContainer {object} The parent element of the video element<br />
     *   wrapper {object} The video wrapper
     * @property {string} plugin The name of the plugin used to create this element
     * @property {string} domId The DOM ID of the video element
     * @property {object} supportedEncodings A list of encodings supported by the element
     * @property {object} parentContainer The parent element of the video element
     * @property {object} wrapper The element wrapper created by the video plugin
     * @property {string} sharedObjectToInstance The name of the instance that shares the video object with
     *   this element (usually null)
     * @property {boolean} isControllingObject True if the wrapper is currently controlling the video element
     */
    var videoElement = function(params) {
      this.plugin = params.plugin && params.plugin.name;
      this.domId = _generateUniqueName();
      this.supportedEncodings = params.plugin.encodings || [];
      this.parentContainer = params.parentContainer || (rootElement && rootElement.find(".innerWrapper")) || null;
      this.wrapper = params.wrapper;
      this.sharedObjectToInstance = params.sharedObjectToInstance;
      this.isControllingObject = (params.isControllingObject === undefined) ? true :
                                                                              params.isControllingObject;
    };

    /**
     * A wrapper object for video instances.
     * @constructor
     * @private
     * @param {object} params The parameters for the video instance.
     *                        It must contain the following fields:<br/>
     *   plugin {object} The plugin that created the video element<br />
     *   parentContainer {object} The parent element of the video element<br />
     *   element {object} The video element object<br />
     *   isControllingElement {boolean} True if the instance is controlling the video element<br />
     *   stream {object} The stream url and drm associated with the instance<br />
     *   vtcInterface {object} The instance's interface with the vtc<br />
     *   closedCaptions {object} The closed captions object that contains the possible closed captions<br />
     *   crossorigin {string} The crossorigin attribute value if there is one to be set<br />
     *   params {string} The full list of instance parameters<br />
     * @property {object} element Points to the element wrapped by this object
     * @property {boolean} isControllingElement True if the actual element is controlled by this instance.
     *                                          Instances that share existing elements initialize to false.
     * @property {number} playhead The last saved playhead value of the stream, used to resume after unloading
     * @property {string} encoding The encoding of the last stream used
     * @property {object} stream The last stream used
     * @property {object} vtcInterface The interface to the vtc used by the element
     * @property {object} closedCaptions The closed captions object that contains the possible closed captions
     * @property {object} crossorigin The crossorigin attribute value
     * @property {boolean} isLive True if it is a live asset, false otherwise
     * @property {boolean} playing True if the video is current playing
     * @property {boolean} disableNativeSeek True if the video element should disable seeks that come from the
     *                                       native video element.
     */
    var videoInstance = function(params) {
      this.plugin = params.plugin && params.plugin.name;
      this.parentContainer = params.parentContainer;
      this.element = params.element || null;
      this.isControllingElement = !!params.isControllingElement;
      this.playhead = 0;
      this.encoding = params.encoding || null;
      this.stream = params.stream || null;
      this.vtcInterface = params.vtcInterface || {};
      this.closedCaptions = params.closedCaptions || {};
      this.crossorigin = params.crossorigin || null;
      this.isLive = params.isLive || false;
      this.params = params.params || {};
      this.playing = false;
      this.disableNativeSeek = false;
    };

    // state variables
    // TODO: Just use the replay event directly
    var pageLevelParams = {};
    var errorTimer = null;
    var shouldEmitErrors = true;
    var unemittedErrors = [];
    var currentVolume = null;
    var isPlaybackReady = false;

    // Determine whether or not to preload based on platform
    // TODO (neeraj): do we only need to default false on specific versions?
    var canPreload = !(OO.isChrome || OO.isIos || OO.isAndroid || OO.isSafari || OO.isFirefox);

    /**
     * Event types accepted by the Video Controller from video plugins for the notify API
     * @public
     * @field VideoController#EVENTS
     */
    this.EVENTS = {
      /**
       * @constant VideoController.EVENTS.PLAY
       * @type {string}
       * @description <code>VideoController.EVENTS.PLAY ('play')</code>:
       *   The video will begin to play.
       *   It should meet the following guidelines:<br />
       *    - It should be raised each time a play command is going to be executed.<br />
       *    - It need not be raised before the play occurs<br />
       *   Expected params: {url:string}
       */
      PLAY: "play",

      /**
       * @constant VideoController.EVENTS.CAN_PLAY
       * @type {string}
       * @description <code>VideoController.EVENTS.CAN_PLAY ('canPlay')</code>:
       *   Play can be called because the video renderer is ready.
       *   It should meet the following guidelines:<br />
       *    - It should be raised each time a stream is loaded and becomes ready to receive play commands<br />
       *    - It does not need to be called after a seek<br />
       *    - It does not need to be called after an underflow<br />
       *   Expected params: none
       */
      CAN_PLAY: "canPlay",

      /**
       * @constant VideoController.EVENTS.PLAYING
       * @type {string}
       * @description <code>VideoController.EVENTS.PLAYING ('playing')</code>:
       *   The video has begun to play
       *   It should meet the following guidelines:<br />
       *    - It should be raised each time a play is initiated, whether coming from seek, paused, or initial play<br />
       *    - It need not be raised after an underflow<br />
       *   Expected params: none
       */
      PLAYING: "playing",

      /**
       * @constant VideoController.EVENTS.ENDED
       * @type {string}
       * @description <code>VideoController.EVENTS.ENDED ('ended')</code>:
       *   The video has ended.
       *   It should meet the following guidelines:<br />
       *    - It should be raised once each time a stream reaches the end<br />
       *    - It should mark the end of the play session<br />
       *    - It should be raised at the end of a replayed stream<br />
       *   Expected params: none
       */
      ENDED: "ended",

      /**
       * @constant VideoController.EVENTS.ERROR
       * @type {string}
       * @description <code>VideoController.EVENTS.ERROR ('error')</code>:
       *   The video has encountered an error.
       *   It should meet the following guidelines:<br />
       *    - It should <br />
       *   Expected params: {errorcode:object}
       */
      ERROR: "error",

      /**
       * @constant VideoController.EVENTS.SEEKING
       * @type {string}
       * @description <code>VideoController.EVENTS.SEEKING ('seeking')</code>:
       *   The video is being seeked.
       *   It should meet the following guidelines:<br />
       *    - It should be raised as soon as seeking has begun<br />
       *    - It may be raised any number of times during a seek<br />
       *    - It should not be raised after SEEKED<br />
       *    - It should not be raised if attempting to seek outside of the seek range
       *      (if seeking is not possible or will not succeed)<br />
       *   Expected params: none
       */
      SEEKING: "seeking",

      /**
       * @constant VideoController.EVENTS.SEEKED
       * @type {string}
       * @description <code>VideoController.EVENTS.SEEKED ('seeked')</code>:
       *   The video has seeked.
       *   It should meet the following guidelines:<br />
       *    - It should be raised before time updates at the new position are raised<br />
       *   Expected params: none
       */
      SEEKED: "seeked",

      /**
       * @constant VideoController.EVENTS.PAUSED
       * @type {string}
       * @description <code>VideoController.EVENTS.PAUSED ('paused')</code>:
       *   The video has paused.
       *   It should meet the following guidelines:<br />
       *    - It should be raised when the paused state is entered<br />
       *    - It should not be raised when the video has stopped playing due to underflow<br />
       *    - It does not need to be raised when a stream is loaded; the state will be assumed to be paused
       *      until PLAYING is raised<br />
       *   Expected params: none
       */
      PAUSED: "paused",

      /**
       * @constant VideoController.EVENTS.RATE_CHANGE
       * @type {string}
       * @description <code>VideoController.EVENTS.RATE_CHANGE ('ratechange')</code>:
       *   The video speed has changed.
       *   Expected params: {rate:number}
       */
      RATE_CHANGE: "ratechange",

      /**
       * @constant VideoController.EVENTS.STALLED
       * @type {string}
       * @description <code>VideoController.EVENTS.STALLED ('stalled')</code>:
       *   The stream is attempting to fetch new data but is not receiving the expected data.
       *   It should meet the following guidelines:<br />
       *    - It can be raised while the stream is still playing<br />
       *   Expected params: {url:string}
       */
      STALLED: "stalled",

      /**
       * @constant VideoController.EVENTS.TIME_UPDATE
       * @type {string}
       * @description <code>VideoController.EVENTS.TIME_UPDATE ('timeupdate')</code>:
       *   The stream has changed time position.
       *   It should meet the following guidelines:<br />
       *    - It should be raised at least twice per second while the video is playing.<br />
       *    - It need not be raised while the video is paused.<br />
       *    - It should not be raised after and video has raised the ENDED event.<br />
       *    - Once the seeking event has been raised, this event should not be raised until the seek has completed.<br />
       *    - It should not be raised before initial time has been reached.<br />
       *   Expected params:
       *   {currentTime:number, duration:number, buffer:number, seekRange:{end:number, start:number}
       */
      TIME_UPDATE: "timeupdate",

      /**
       * @constant VideoController.EVENTS.VOLUME_CHANGE
       * @type {string}
       * @description <code>VideoController.EVENTS.VOLUME_CHANGE ('volumechange')</code>:
       *   The stream has changed volume.
       *   It should meet the following guidelines:<br />
       *    - It should be raised with volume '0' when muted<br />
       *    - It should be raised when unmuted<br />
       *   Expected params: {volume:number}
       */
      VOLUME_CHANGE: "volumechange",

      /**
       * @constant VideoController.EVENTS.BUFFERING
       * @type {string}
       * @description <code>VideoController.EVENTS.BUFFERING ('buffering')</code>:
       *   The stream is buffering.
       *   It should meet the following guidelines:<br />
       *    - It should be raised when buffering state is entered<br />
       *    - It can be raised any number of times during buffering but only once is required<br />
       *    - It should not be raised after BUFFERED unless buffering state has been entered again<br />
       *   Expected params: {url:string}
       */
      BUFFERING: "buffering",

      /**
       * @constant VideoController.EVENTS.BUFFERED
       * @type {string}
       * @description <code>VideoController.EVENTS.BUFFERED ('buffered')</code>:
       *   The stream has buffered.
       *   It should meet the following guidelines:<br />
       *    - It should be raised when buffering state has exited<br />
       *   Expected params: {url:string}
       */
      BUFFERED: "buffered",

      /**
       * @constant VideoController.EVENTS.DURATION_CHANGE
       * @type {string}
       * @description <code>VideoController.EVENTS.DURATION_CHANGE ('durationchange')</code>:
       *   The stream duration has changed.
       *   Expected params:
       *     {currentTime:number, duration:number, buffer:number, seekRange:{end:number, start:number}}
       */
      DURATION_CHANGE: "durationchange",

      /**
       * @constant VideoController.EVENTS.PROGRESS
       * @type {string}
       * @description <code>VideoController.EVENTS.PROGRESS ('progress')</code>:
       *   Data is being fetched from the network.
       *   It should meet the following guidelines:<br />
       *    - It should <br />
       *   Expected params:
       *     {currentTime:number, duration:number, buffer:number, seekRange:{end:number, start:number}}
       */
      PROGRESS: "progress",

      /**
       * @constant VideoController.EVENTS.WAITING
       * @type {string}
       * @description <code>VideoController.EVENTS.WAITING ('waiting')</code>:
       *   The playback buffer is empty but the player is attempting to stream.
       *   It should meet the following guidelines:<br />
       *    - It should be raised when playback stops due to buffer underflow<br />
       *   Expected params: {url:string}
       */
      WAITING: "waiting",

      /**
       * @constant VideoController.EVENTS.FULLSCREEN_CHANGED
       * @type {string}
       * @description <code>VideoController.EVENTS.FULLSCREEN_CHANGED ('fullScreenChanged')</code>:
       *   The fullscreen state has changed.
       *   Expected params: {isFullScreen:boolean, paused:boolean}
       */
      FULLSCREEN_CHANGED: "fullScreenChanged",

      /**
       * @constant VideoController.EVENTS.CAPTIONS_FOUND_ON_PLAYING
       * @type {string}
       * @description <code>VideoController.EVENTS.CAPTIONS_FOUND_ON_PLAYING ('captionsFoundOnPlaying')</code>:
       *   The video has detected captions on the video while playing.
       *   Expected params: {languages:[string], locale:{string:string}}
       */
      CAPTIONS_FOUND_ON_PLAYING: "captionsFoundOnPlaying",

      /**
       * @constant VideoController.EVENTS.ASSET_DIMENSION
       * @type {string}
       * @description <code>VideoController.EVENTS.ASSET_DIMENSION ('assetDimension')</code>:
       *   New video dimension information has been received.
       *   It should meet the following guidelines:<br />
       *    - It should be raised when video dimensions are first determined<br />
       *    - It should be raised any time the video dimensions change<br />
       *    - The dimensions should be specified in pixels<br />
       *   Expected params: {width:number,height:number}
       */
      ASSET_DIMENSION: "assetDimension",

      /**
       * @constant VideoController.EVENTS.BITRATE_CHANGED
       * @type {string}
       * @description <code>VideoController.EVENTS.BITRATE_CHANGED ('bitrateChanged')</code>:
       *   The bitrate being played has changed.
       *   It should meet the following guidelines:<br />
       *    - It should be raised once when entering and exiting ABR mode<br />
       *    - It should not be raised while in ABR mode<br />
       *    - When entering ABR mode, the bitrate property should be set to the string "auto"<br />
       *    - The bitrate property should be specified in bits per second<br />
       *    - The height and width properties should indidicate the vertical and horizontal resolution of the
       *       stream<br />
       *   Expected params: {height:number, width:number, bitrate:(number|string)}
       */
      BITRATE_CHANGED: "bitrateChanged",

      /**
       * @constant VideoController.EVENTS.BITRATES_AVAILABLE
       * @type {string}
       * @description <code>VideoController.EVENTS.BITRATES_AVAILABLE ('bitratesAvailable')</code>:
       *   There are multiple bitrates available to be played.
       *   It should meet the following guidelines:<br />
       *    - If ABR is available, parameters should contain an object whose bitrate property is set to the
       *       string "auto".<br />
       *    - The bitrate property should be specified in bits per second<br />
       *    - The height and width properties should indidicate the vertical and horizontal resolution of the
       *       stream<br />
       *   Expected params: [{height:number, width:number, bitrate:(number|string)}]
       */
      BITRATES_AVAILABLE: "bitratesAvailable",

      /**
       * @constant VideoController.EVENTS.CLOSED_CAPTION_CUE_CHANGED
       * @type {string}
       * @description <code>VideoController.EVENTS.CLOSED_CAPTION_CUE_CHANGED ('closedCaptionCueChanged')</code>:
       *   The active closed captions text has changed.
       *   It should meet the following guidelines:<br />
       *    - The parameter should contain the text of the new closed caption cue<br />
       *    - Empty string parameter signifies no active cue<br />
       *   Expected params: string
       */
      CLOSED_CAPTION_CUE_CHANGED: "closedCaptionCueChanged",

      /**
       * @constant VideoController.EVENTS.METADATA_FOUND
       * @type {string}
       * @description <code>VideoController.EVENTS.METADATA_FOUND ('metadataFound')</code>:
       *   A metadata tag, such as an ID3 tag, was found in the movie.
       *   It should meet the following guidelines:<br />
       *    - The type field indicates the data type, such as ID3<br />
       *    - The data field contains the tag data<br />
       *   Expected params: [{type:string, data:[object|string]}]
       */
      METADATA_FOUND: "metadataFound"
    };

    var SETTINGS = {
      ENCODING_PRIORITY: "encodingPriority",
      INITIAL_VOLUME: "initialVolume",
    };

    /**
     * List of encoding priority in-order. Can be managed by backlot/backdoor/page level params
     * The priority order is: pageLevel > backlot > backdoor > default
     * @private
     * @field VideoController#settingLevels
     */
    var settingLevels = {
      DEFAULT: "default",
      PAGE: "pageLevel",
      BACKLOT: "backlot",
      BACKDOOR: "backdoor"
    };
    var encodingPriority = {};
    encodingPriority[settingLevels.DEFAULT] = [OO.VIDEO.ENCODING.DRM.DASH,
                                               OO.VIDEO.ENCODING.DRM.HLS,
                                               OO.VIDEO.ENCODING.HLS,
                                               OO.VIDEO.ENCODING.AKAMAI_HD2_VOD_HLS,
                                               OO.VIDEO.ENCODING.AKAMAI_HD2_HLS,
                                               OO.VIDEO.ENCODING.DASH,
                                               OO.VIDEO.ENCODING.MP4,
                                               OO.VIDEO.ENCODING.HDS,
                                               OO.VIDEO.ENCODING.WEBM,
                                               OO.VIDEO.ENCODING.IMA,
                                               OO.VIDEO.ENCODING.PULSE];
    var chosenEncodingPriority = settingLevels.DEFAULT;

    var initialCss = { "width":"100%", "height":"100%", "position":"absolute", "visibility":"hidden",
                       "z-index":OO.CSS.VIDEO_Z_INDEX };
    if (OO.isIos) {
      initialCss["display"] = OO.CSS.INVISIBLE_DISPLAY;
    } else {
      initialCss["left"] = "-100000px";
    }

    var initialize = _.bind(function() {
      mb.subscribe(OO.EVENTS.PLAYER_CREATED, 'vtc', playerCreated);
      mb.subscribe(OO.EVENTS.METADATA_FETCHED, 'vtc', metadataFetched);
      mb.subscribe(OO.EVENTS.EMBED_CODE_CHANGED, 'vtc', embedCodeChanged);
      mb.subscribe(OO.EVENTS.ASSET_CHANGED, 'vtc', assetChanged);
      mb.subscribe(OO.EVENTS.PLAYBACK_READY, 'vtc', playbackReady);
      mb.subscribe(OO.EVENTS.VC_CREATE_VIDEO_ELEMENT, 'vtc', vcCreateVideoElement);
      mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, 'vtc', vcVideoElementCreated);
      mb.subscribe(OO.EVENTS.VC_UPDATE_ELEMENT_STREAM, 'vtc', vcUpdateElementStream);
      mb.subscribe(OO.EVENTS.VC_DISPOSE_VIDEO_ELEMENT, 'vtc', vcDisposeVideoElement);
      mb.subscribe(OO.EVENTS.VC_FOCUS_VIDEO_ELEMENT, 'vtc', vcFocusVideoElement);
      mb.subscribe(OO.EVENTS.WILL_PLAY_ADS, 'vtc', willPlayAds);
      mb.subscribe(OO.EVENTS.ADS_PLAYED, 'vtc', adsPlayed);
      mb.subscribe(OO.EVENTS.VC_PRELOAD, 'vtc', vcPreload);
      mb.subscribe(OO.EVENTS.VC_RELOAD, 'vtc', vcReload);
      mb.subscribe(OO.EVENTS.VC_SET_INITIAL_TIME, 'vtc', vcSetInitialTime);
      mb.subscribe(OO.EVENTS.VC_SET_VIDEO_STREAMS, 'vtc', vcSetVideoStreams);
      mb.subscribe(OO.EVENTS.VC_PRIME_VIDEOS, 'vtc', vcPrimeVideos);
      mb.subscribe(OO.EVENTS.PLAY, 'vtc', play);
      mb.subscribe(OO.EVENTS.VC_PLAY, 'vtc', vcPlay);
      mb.subscribe(OO.EVENTS.PAUSE, 'vtc', pause);
      mb.subscribe(OO.EVENTS.VC_PAUSE, 'vtc', vcPause);
      mb.subscribe(OO.EVENTS.SEEK, 'vtc', seek);
      mb.subscribe(OO.EVENTS.VC_SEEK, 'vtc', vcSeek);
      mb.subscribe(OO.EVENTS.CHANGE_VOLUME, 'vtc', changeVolume);
      mb.subscribe(OO.EVENTS.PAGE_UNLOAD_REQUESTED, 'vtc', pageUnloadRequested);
      mb.subscribe(OO.EVENTS.DISABLE_SEEKING, 'vtc', disableSeeking);
      mb.subscribe(OO.EVENTS.ENABLE_SEEKING, 'vtc', enableSeeking);
      mb.subscribe(OO.EVENTS.SET_CLOSED_CAPTIONS_LANGUAGE, 'vtc', setClosedCaptionsLanguage);
      mb.subscribe(OO.EVENTS.SET_TARGET_BITRATE, 'vtc', setTargetBitrate);
      mb.subscribe(OO.EVENTS.DESTROY, 'vtc', _.bind(this.onDestroy, this));
      mb.subscribe(OO.EVENTS.LIVE_BUTTON_CLICKED, 'vtc', onLiveClicked);
    }, this);

    // ********************
    // Playback setup
    // ********************

    var playerCreated = _.bind(function(eventname, elementId, params) {
      this.elementId = elementId;
      rootElement = $("#" + elementId);
      pageLevelParams = params;
      if (pageLevelParams) {
        // Check if encoding priority is set at page level
        if (pageLevelParams[SETTINGS.ENCODING_PRIORITY]) {
          encodingPriority[settingLevels.PAGE] = pageLevelParams[SETTINGS.ENCODING_PRIORITY];

          // Update chosenSteamPriority to settingLevels.PAGE
          chosenEncodingPriority = settingLevels.PAGE;
        }

        // Collect initial volume
        if (pageLevelParams[SETTINGS.INITIAL_VOLUME] !== undefined){
          currentVolume = parseFloat(pageLevelParams[SETTINGS.INITIAL_VOLUME]);
        }
      }

      OO.debug_tools = OO.debug_tools || {};
      if (!OO.debug_tools[elementId]) {
        OO.debug_tools[elementId] = {};
      }
      OO.debug_tools[elementId].video = videoDebugging;
    }, this);

    var metadataFetched = _.bind(function(eventname, backlotMetadata) {
      // TODO: Check if encoding priority is set at backdoor level (it will be a string)
      // If so, add it to encodingPriority[settingLevels.BACKDOOR], and update chosenSteamPriority to
      //    settingLevels.BACKDOOR if it was settingLevels.DEFAULT

      // Check if encoding priority is set at backlot movie level
      if (backlotMetadata && backlotMetadata["base"] && backlotMetadata["base"][SETTINGS.ENCODING_PRIORITY]) {
        var data = backlotMetadata["base"][SETTINGS.ENCODING_PRIORITY];
        // strip out '&.*;' and spaces and parens
        data = data.replace(/(&.+?;)|[ \[\]]/g, "");
        encodingPriority[settingLevels.BACKLOT] = data.split(",");

        // Update chosenSteamPriority to settingLevels.BACKLOT it it was anything other than PAGE
        if (chosenEncodingPriority !== settingLevels.PAGE) {
          chosenEncodingPriority = settingLevels.BACKLOT;
        }
      }
    }, this);

    var embedCodeChanged = _.bind(function() {
      // Remove backlot settings because they are specific to the movie
      encodingPriority[settingLevels.BACKLOT] = null;

      // Update the chosenEncodingPriority if it was set to backlot
      if (chosenEncodingPriority === settingLevels.BACKLOT) {
        chosenEncodingPriority = encodingPriority[settingLevels.BACKDOOR] ?
                               settingLevels.BACKDOOR : settingLevels.DEFAULT;
      }

      isPlaybackReady = false;
    }, this);

    var assetChanged = _.bind(function() {
      isPlaybackReady = false;
    }, this);

    var playbackReady = _.bind(function() {
      isPlaybackReady = true;
    }, this);

    var onLiveClicked = _.bind(function() {
      _callIfInControl(this.focusVideoId, "onLiveClick");
    }, this);

    // ********************
    // Element creation and destroy
    // ********************

    /**
     * Selects an encoding and if required, creates a new element that can play this stream.
     * This is a callback to OO.EVENTS.VC_CREATE_VIDEO_ELEMENT
     * @private
     * @method VideoController#vcCreateVideoElement
     * @param {string} eventname The name of the event that triggered this function
     * @param {string} videoId The id to use for the new element
     * @param {object} streams An object with the encoding types as the keys and stream urls and drm object as the values
     * @param {object} parentContainer The parent container of the new element
     * @param {object} params An object with optional parameters to set on the new element
     * @fires OO.EVENTS.VC_ERROR
     * @fires OO.EVENTS.VC_FOCUS_VIDEO_ELEMENT
     */
    var vcCreateVideoElement = _.bind(function(eventname, videoId, streams, parentContainer, params) {
      // Get the list of possible plugins
      var validPlugins;
      var currentController;

      if (params && (params.technology || params.features)) {
        // Filter the list of usable plugins based on technology and feature restrictions
        var pluginsForTechnology = _filterPluginsByTechnology(params.technology);
        var pluginsForFeatures = _filterPluginsByFeatures(params.features);
        validPlugins = _.pick(registeredPlugins, _.intersection(pluginsForTechnology, pluginsForFeatures));
      } else {
        // For performance, avoid the logic of filtering if no filtering parameters are specified
        validPlugins = registeredPlugins;
      }

      // Select an encoding.  If none are selected, raise an error
      var chosenEncoding = _selectEncoding(streams,
                                           _getFilteredSupportedEncodings(validPlugins),
                                           _getEncodingPriorities());

      if (!chosenEncoding) {
        mb.publish(OO.EVENTS.VC_ERROR, videoId, {code: OO.ERROR.VC.UNSUPPORTED_ENCODING});
        return;
      }
      log("For video '" + videoId + "', selected encoding '" + chosenEncoding + "', with stream url " +
          streams[chosenEncoding]);

      // Check if the element already exists and if the element supports the chosen encoding
      var wasInFocus = !!(this.focusVideoId && (this.focusVideoId === videoId));
      if (this.activeInstances[videoId] && this.activeInstances[videoId].element) {
        if (validPlugins[this.activeInstances[videoId].plugin] &&
            _.contains(this.activeInstances[videoId].element.supportedEncodings, chosenEncoding)) {
          // There is another element with the same videoId that supports the chosen stream and is in the
          // filtered list of plugins
          log("Element already existed and supports chosen encoding.  Setting new video url.");
          _setVideoStream(videoId, chosenEncoding, streams[chosenEncoding], streams.isLive);
          if (params) {
            _setClosedCaptions(videoId, params.closedCaptions);
            _setCrossorigin(videoId, params.crossorigin);
          }
          // Secure content
          _setSecureContent(videoId, streams[chosenEncoding].contentMetadata);

          //Workaround for PBW-5179 to save the current playhead of the main video
          if (OO.isIos) {
            currentController = this.activeInstances[videoId].element.sharedObjectToInstance;
            if (currentController === "main" && this.activeInstances[currentController].element) {
              this.currentPlayhead = _safeFunctionCall(this.activeInstances[currentController].element, "getCurrentTime");
            }
          }

          _notifyElementCreated(videoId);
          return;
        } else {
          // There is another element with the same videoId but which doesn't have support for the current stream
          // Destroy the current element at videoId
          log("Element already existed but does not support chosen encoding.  Destroying exising element.");
          vcDisposeVideoElement(OO.EVENTS.VC_CREATE_VIDEO_ELEMENT, videoId);
        }
      }

      // Select a plugin
      var possiblePlugins = _.intersection(encodingToPlugins[chosenEncoding] || [], _.keys(validPlugins));
      var electedPlugin = null;

      // If we only have an unknown stream possible, try to use the first registered plugin.
      if ((possiblePlugins == null || possiblePlugins.length < 1)
          && chosenEncoding == OO.VIDEO.ENCODING.UNKNOWN && _.size(validPlugins) > 0) {
        electedPlugin = validPlugins[_.keys(validPlugins)[0]];
      } else if (possiblePlugins && possiblePlugins.length > 0 && _.size(validPlugins) > 0) {
        electedPlugin = validPlugins[possiblePlugins[0]];
      }

      if (!electedPlugin) {
        mb.publish(OO.EVENTS.VC_ERROR, videoId, {code: OO.ERROR.VC.UNSUPPORTED_ENCODING});
        return;
      }

      log("For video '" + videoId + "', elected plugin '" + electedPlugin.name + "'");

      // If the max number of elements reached on elected plugin, create a virtual element
      _createInstance(electedPlugin, videoId, parentContainer, chosenEncoding, streams[chosenEncoding], streams.isLive, params);

      // TODO: Should we place the element in the parent ourselves?
      //       Would require a direct handle to the element

      // Notify results
      if (this.activeInstances[videoId]) {
        _notifyElementCreated(videoId);
        if (wasInFocus) {
          mb.publish(OO.EVENTS.VC_FOCUS_VIDEO_ELEMENT, videoId);
        }
      } else {
        mb.publish(OO.EVENTS.VC_ERROR, videoId, {code: OO.ERROR.VC.UNABLE_TO_CREATE_VIDEO_ELEMENT});
      }
    }, this);

    var _filterPluginsByTechnology = _.bind(function(technology) {
      if (!technology) {
        return _.keys(registeredPlugins);
      }

      var plugins = [];
      for (name in registeredPlugins) {
        if (registeredPlugins[name].technology === technology) {
          plugins.push(name);
        }
      }

      return plugins;
    }, this);

    var _filterPluginsByFeatures = _.bind(function(features) {
      if (!features || features.length < 1) {
        return _.keys(registeredPlugins);
      }

      var plugins = [];
      for (name in registeredPlugins) {
        var unsupportedFeatures = _.difference(features, registeredPlugins[name].features);
        if (!unsupportedFeatures || unsupportedFeatures.length === 0) {
          plugins.push(name);
        }
      }

      return plugins;
    }, this);

    var _getFilteredSupportedEncodings = _.bind(function(subsetOfPlugins) {
      var encodings = [];
      for (var plugin in subsetOfPlugins) {
        encodings = encodings.concat(registeredPlugins[plugin].encodings);
      }

      return _.uniq(encodings);
    }, this);

    var _getEncodingPriorities = _.bind(function(){
      //TODO: could be calculated and stored when setting our current chosen encoding priority list

      //Calculate the priorities not included in our current encoding priorities.
      //These priorities will be appended to the end of the returned list
      var currentPriorites = encodingPriority[chosenEncodingPriority];
      var unprioritized = $(getSupportedEncodings()).not(currentPriorites).get();
      return currentPriorites.concat(unprioritized);
    }, this);

    var _selectEncoding = _.bind(function(streams, supportedList, priorityOrder) {
      if (!streams || _.size(streams) < 1) return;
      var encodings = {};

      // Get the intersection of the streams we have and the streams we support
      for (var index = 0; index < supportedList.length; index++) {
        var encoding = supportedList[index];
        if (streams.hasOwnProperty(encoding)) {
          encodings[encoding] = streams[encoding];
        }
      }

      var chosenEncoding = null;

      // Select an encoding based on encodingPriority[chosenEncodingPriority]
      for (var index = 0; index < priorityOrder.length; index++) {
        if (encodings.hasOwnProperty(priorityOrder[index])) {
          chosenEncoding = priorityOrder[index];
          break;
        }
      }

      // Check for unkown stream type if no other streams are supported
      if (chosenEncoding == null && streams.hasOwnProperty(OO.VIDEO.ENCODING.UNKNOWN)) {
        chosenEncoding = OO.VIDEO.ENCODING.UNKNOWN;
      }

      return chosenEncoding;
    }, this);

    var _notifyElementCreated = _.bind(function(videoId) {
      // If the element doesn't exist, return;
      if (!(this.activeInstances && this.activeInstances[videoId] && this.activeInstances[videoId].element)) {
        return;
      }

      // Get the true element
      var element = this.activeInstances[videoId].element;
      var videoElement = (element.parentContainer && element.parentContainer.length > 0) ?
                         element.parentContainer.find("#" + element.domId) : [];


      // Retrieve the stream url
      var streamUrl = this.activeInstances[videoId].stream ? this.activeInstances[videoId].stream.url : null;

      //Workaround to allow iPhone to remove closed captions before switching the video element
      if (OO.isIos) {
        _.delay(function() {
          // raise an event denoting success
          mb.publish(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, {
            "videoId": videoId,
            "encodings": element.supportedEncodings,
            "parent": element.parentContainer,
            "domId": element.domId,
            "videoElement": videoElement,
            "streamUrl": streamUrl
          });
        }, 1);
      } else {
        // raise an event denoting success
        mb.publish(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, {
          "videoId": videoId,
          "encodings": element.supportedEncodings,
          "parent": element.parentContainer,
          "domId": element.domId,
          "videoElement": videoElement,
          "streamUrl": streamUrl
        });
      }
    }, this);

    var vcUpdateElementStream = _.bind(function(event, videoId, newUrl) {
      // If the element doesn't exist, return;
      if (!(this.activeInstances && this.activeInstances[videoId] && this.activeInstances[videoId].element)) {
        return;
      }

      // Update the stream url
      if (this.activeInstances[videoId].stream) {
        this.activeInstances[videoId].stream.url = newUrl;

        _setVideoStream(videoId, this.activeInstances[videoId].encoding, this.activeInstances[videoId].stream, this.activeInstances[videoId].isLive);
      }
    }, this);

    /**
     * Creates a video element and instance.
     * @private
     * @method VideoController#_createInstance
     * @param {object} electedPlugin The plugin to use when creating a new instance.
     * @param {string} videoId The name of the new video instance.
     * @param {object} parentContainer The DOM object below which to append the new element
     * @param {string} encoding The encoding of video stream, possible values are found in OO.VIDEO.ENCODING
     * @param {object} stream The object contains url and drm to load on the new video element.
     * @param {boolean} isLive True if it is a live asset, false otherwise
     * @param {object} params Parameters that apply to the video element.  These include "crossorigin" and
     *                        closedCaptions settings.
     * @fires OO.EVENTS.VC_ERROR
     */
    var _createInstance = _.bind(function(electedPlugin, videoId, parentContainer, encoding, stream, isLive, params) {
      if (!electedPlugin || !videoId) return;

      // Check if device limitations require that elements be shared
      if (_checkIfElementSharingRequired(electedPlugin)) {
        // Get the instance of the existing video element that the new element should share with
        var instanceToShare = _getInstanceToShare(electedPlugin.technology);

        if (instanceToShare && this.activeInstances[instanceToShare].plugin !== electedPlugin.name) {
          // An element must be shared, and the existing element was created by the same plugin as the
          // desired plugin for the new element.  Do inter-plugin sharing rather than creating a new element.
          if (_checkIfInterpluginSharingSupported(instanceToShare, electedPlugin)) {
            if (this.activeInstances[instanceToShare]) {
              _createSharedElementBetweenPlugins(electedPlugin, videoId, encoding, stream, isLive, parentContainer, params,
                                                 instanceToShare);
            }
            else {
              mb.publish(OO.EVENTS.VC_ERROR, videoId, {code: OO.ERROR.VC.UNABLE_TO_CREATE_VIDEO_ELEMENT});
            }
            return;
          }
          else {
            // Video element sharing is required but not supported by the plugins in use.
            // Delete an element with the same technology to make space for a new element.
            // [update] After testing, we found that new elements require playback to be triggered by a user
            // click event.  To prevent users from needing to click, do not dispose the old video element.
            //_disposeElementKeepInstance(instanceToShare);
          }
        } else if (instanceToShare) {
          // An element must be shared, and the existing element was created by the same plugin as the
          // desired plugin for the new element.  Do intra-plugin sharing of the element rather than creating
          // a new element.
          _createSharedElement(electedPlugin, videoId, encoding, stream, isLive, params);
          return;
        } else {
          // This is hit if an element allows sharing but is of technology MIXED (which can never be shared)
          // [update] After testing, we found that new elements require playback to be triggered by a user
          // click event.  To prevent users from needing to click, do not dispose the old video element.
          //this.disposeAnyElementKeepInstance();
        }
      }

      if (electedPlugin.maxSupportedElements > -1 &&
          _countElements(electedPlugin.name) >= electedPlugin.maxSupportedElements) {
        // If limited number of elements and if we exceeded the limit, create shared element
        _createSharedElement(electedPlugin, videoId, encoding, stream, isLive, params);
      } else {
        // If unlimited or if we didn't exceed the limit
        _createRealElement(electedPlugin, videoId, parentContainer, encoding, stream, isLive, params);
      }
    }, this);

    /**
     * Returns true if device limitations state that the maximum number of elements of a given type have been
     * created.  This will indicate whether or not a new HTML5-based element can be created based on the
     * technology of the elected plugin and existing elements.
     * @private
     * @method VideoController#_checkIfElementSharingRequired
     * @param {object} electedPlugin The plugin to use when creating a new instance.
     * @returns {boolean} True if new video elements cannot be created.
     */
    var _checkIfElementSharingRequired = _.bind(function(electedPlugin) {
      // check if single element mode required and if it's an html5 video
      if (OO.requiresSingleVideoElement &&
          ((electedPlugin.technology === OO.VIDEO.TECHNOLOGY.HTML5)||
           (electedPlugin.technology === OO.VIDEO.TECHNOLOGY.MIXED))) {
        // check if any other html5-based elements exist
        for (var instance in this.activeInstances) {
         if ((registeredPlugins[this.activeInstances[instance].plugin].technology ===
              OO.VIDEO.TECHNOLOGY.HTML5 ||
              registeredPlugins[this.activeInstances[instance].plugin].technology ===
              OO.VIDEO.TECHNOLOGY.MIXED) &&
             (this.activeInstances[instance].element)) {
           return true;
         }
        }
      }

      return false;
    }, this);

    /**
     * Returns true if the plugins of the existing video element and new video element support sharing.
     * @private
     * @method VideoController#_checkIfInterpluginSharingSupported
     * @param {object} instanceToShare The video instance that should be shared.
     * @param {object} electedPlugin The plugin to use when creating a new instance.
     * @returns {boolean} True if inter-plugin sharing is supported by the plugins.
     */
    var _checkIfInterpluginSharingSupported = _.bind(function(instanceToShare, electedPlugin) {
      // Check if existing plugin supports videoObjectSharingGive
      var giveSupported = _.contains(
        registeredPlugins[this.activeInstances[instanceToShare].plugin].features,
        OO.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_GIVE);

      // Check if electedPlugin supports feature videoObjectSharingTake
      var takeSupported = _.contains(
        electedPlugin.features,
        OO.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_TAKE);

      var sameTech = (registeredPlugins[this.activeInstances[instanceToShare].plugin].technology ===
                      electedPlugin.technology);

      var isNotMixed = (electedPlugin.technology !== OO.VIDEO.TECHNOLOGY.MIXED);

      return giveSupported && takeSupported && sameTech && isNotMixed;
    }, this);

    /**
     * Returns a reference to the instance that should be shared by new elements created with the same
     * technology.
     * @private
     * @method VideoController#_getInstanceToShare
     * @returns {object} A reference to the video instance to share.
     */
    var _getInstanceToShare = _.bind(function(technology) {
      var instanceToShare = null;

      // return first html5-based element with sharing capability
      for (var instance in this.activeInstances) {
        if (registeredPlugins[this.activeInstances[instance].plugin].technology !== technology) {
          continue;
        }

        // Only share with an instance that has an element
        if (!this.activeInstances[instance].element) {
          continue;
        }

        // Check if existing plugin supports videoObjectSharingGive
        // If it doesn't, only return it if no other eligible plugins support Give
        if (!_.contains(
            registeredPlugins[this.activeInstances[instance].plugin].features,
            OO.VIDEO.FEATURE.VIDEO_OBJECT_SHARING_GIVE)) {
          instanceToShare = instance;
          continue;
        }

        return instance;
      }

      return instanceToShare;
    }, this);

    var _createSharedElementBetweenPlugins = _.bind(function(electedPlugin, videoId, encoding, stream, isLive, parentContainer,
                                                             params, instanceToShare) {
      if (!electedPlugin || !videoId) return;

      log("For video '" + videoId + "', sharing element with video '" + instanceToShare + "'");
      this.activeInstances[instanceToShare].element.sharedObjectToInstance = videoId;

      // Create the element object
      var element = new videoElement({ plugin: electedPlugin,
                                       parentContainer: parentContainer,
                                       sharedObjectToInstance: instanceToShare,
                                       isControllingObject: false });
      activeElements.push(element);

      // Create the video instance object if it doesn't already exist
      var vtcInterface = new VideoControllerInterface(this, videoId, electedPlugin);
      if (!this.activeInstances[videoId]) {
        this.activeInstances[videoId] = new videoInstance({plugin: electedPlugin,
                                                           parentContainer: parentContainer,
                                                           element: element,
                                                           encoding: encoding,
                                                           stream: stream,
                                                           isLive: isLive,
                                                           vtcInterface: vtcInterface,
                                                           isControllingElement: true,
                                                           params: params});
      } else {
        this.activeInstances[videoId].element = element;
      }

      if (params) {
        _setClosedCaptions(videoId, params.closedCaptions);
        _setCrossorigin(videoId, params.crossorigin);
      }

      // Create the shared element
      var domId = this.activeInstances[instanceToShare].element.domId;
      var calculatedElementId = _getElementIdOfVideo(domId);
      element.wrapper = electedPlugin.createFromExisting(calculatedElementId,
                                                         vtcInterface,
                                                         this.elementId);

      // Set the stream
      _setVideoStream(videoId, encoding, stream, isLive);

      // Secure content
      _setSecureContent(videoId, stream.contentMetadata);
    }, this);

    var _countElements = _.bind(function(pluginName) {
      var count = 0;
      for (var index = 0; index < activeElements.length; index++) {
        if (activeElements[index].plugin === pluginName) {
          count++;
        }
      }
      return count;
    }, this);

    var _createSharedElement = _.bind(function(electedPlugin, videoId, encoding, stream, isLive, params) {
      if (!electedPlugin || !videoId) return;

      // Find an element to wrap
      var element = null;
      for (var index = 0; index < activeElements.length; index++) {
        if (activeElements[index].plugin === electedPlugin.name) {
          element = activeElements[index];
          break;
        }
      }

      if (!element) return;

      log("For video '" + videoId + "', sharing existing element with index " + index);

      // Create the video instance object if it doesn't already exist
      var vtcInterface = new VideoControllerInterface(this, videoId, electedPlugin);
      if (!this.activeInstances[videoId]) {
        this.activeInstances[videoId] = new videoInstance({plugin: electedPlugin,
                                                           parentContainer: element.parentContainer,
                                                           element: element,
                                                           encoding: encoding,
                                                           stream: stream,
                                                           isLive: isLive,
                                                           vtcInterface: vtcInterface,
                                                           params: params});
      } else {
        this.activeInstances[videoId].element = element;
      }

      if (params) {
        _setClosedCaptions(videoId, params.closedCaptions);
        _setCrossorigin(videoId, params.crossorigin);
      }

      // Secure content
      _setSecureContent(videoId, stream.contentMetadata);
    }, this);

    var _createRealElement = _.bind(function(electedPlugin, videoId, parentContainer, encoding, stream, isLive, params) {
      if (!electedPlugin || !videoId) return;

      // Create the element object
      var element = new videoElement({plugin:electedPlugin, parentContainer:parentContainer});
      activeElements.push(element);

      // Create the video instance object if it doesn't already exist
      var vtcInterface = new VideoControllerInterface(this, videoId, electedPlugin);
      if (!this.activeInstances[videoId]) {
        this.activeInstances[videoId] = new videoInstance({plugin: electedPlugin,
                                                           parentContainer: element.parentContainer,
                                                           element: element,
                                                           encoding: encoding,
                                                           stream: stream,
                                                           isLive: isLive,
                                                           vtcInterface: vtcInterface,
                                                           isControllingElement: true,
                                                           params: params});
      } else {
        this.activeInstances[videoId].element = element;
      }

      if (params) {
        _setClosedCaptions(videoId, params.closedCaptions);
        _setCrossorigin(videoId, params.crossorigin);
      }

      // Create the real element
      element.wrapper = electedPlugin.create(element.parentContainer,
                                             element.domId,
                                             vtcInterface,
                                             initialCss,
                                             this.elementId);
      // Set the stream
      _setVideoStream(videoId, encoding, stream, isLive);

      // Secure content
      _setSecureContent(videoId, stream.contentMetadata);
    }, this);

    var vcVideoElementCreated = _.bind(function(eventname, elementParams) {
      // Set current volume
      if (typeof currentVolume === "number") {
        mb.publish(OO.EVENTS.CHANGE_VOLUME, currentVolume, elementParams["videoId"]);
      }
      _changeCrossorigin(elementParams["videoId"]);
    }, this);

    /**
     * Disposes an entire video instance as well as a non-shared element.
     * @private
     * @method VideoController#vcDisposeVideoElement
     * @param {string} eventname The name of the event that triggered this instance disposal.
     * @param {string} videoId The name of the disposed video instance.
     * @fires OO.EVENTS.VC_VIDEO_ELEMENT_DISPOSED
     */
    var vcDisposeVideoElement = _.bind(function(eventname, videoId) {
      if (!videoId) return;

      // Remove focus
      if (this.focusVideoId === videoId) {
        // Note: this function attempts to pause the video, but this will take place after the destroy
        _removeFocusFromElement(videoId);
      }

      // Hand off element control
      _handoffElementControl(videoId);

      // Delete the instance
      var element = this.activeInstances[videoId].element;
      delete this.activeInstances[videoId];

      // Destroy orphaned elements
      if (element && !_hasInstances(element)) {
        // If not associated with virtual instances, destroy the element
        _safeFunctionCall(element, "destroy", []);
        activeElements = _.without(activeElements, element);
        element = null;
      }

      // Delete the instance and notify
      mb.publish(OO.EVENTS.VC_VIDEO_ELEMENT_DISPOSED, videoId);
    }, this);

    var _hasInstances = _.bind(function(element) {
      if (!element) return false;
      for (var instance in this.activeInstances) {
        if (this.activeInstances[instance] &&
            this.activeInstances[instance].element &&
            this.activeInstances[instance].element === element )
          return true;
      }
      return false;
    }, this);

    var willPlayAds = _.bind(function(eventname, params) {
      // Remove the closed captions prior to ad play on iOS
      if (OO.isIos && params && params.duration > 0) {
        setClosedCaptionsLanguage('', '', {"mode": ccMode});
      }
    }, this);


    // ********************
    // Element focus
    // ********************

    var vcFocusVideoElement = _.bind(function(eventname, videoId) {
      // If already in focus
      if (videoId && (this.focusVideoId === videoId)) {
        mb.publish(OO.EVENTS.VC_VIDEO_ELEMENT_IN_FOCUS, videoId);
        return;
      }

      // Defocus currently focused element
      // Don't necessarily need to do null check here
      if (this.focusVideoId) {
        _removeFocusFromElement(this.focusVideoId);
      }
      this.focusVideoId = null;

      // Check if we should focus anything
      if (!videoId || !this.activeInstances[videoId]) {
        return;
      }
      this.focusVideoId = videoId;

      _prepareInstanceForAction(videoId);

      // Focus the element
      var css = { "visibility": "visible" };
      if (OO.isIos) {
        css["display"] = OO.CSS.VISIBLE_DISPLAY;
      } else {
        css["left"] = "0px";
      }
      _safeFunctionCall(this.activeInstances[videoId].element, "applyCss", [css]);

      //Workaround to allow iPhone to remove closed captions before switching the video element
      if (OO.isIos) {
        _.delay(function() {
          mb.publish(OO.EVENTS.VC_VIDEO_ELEMENT_IN_FOCUS, videoId);
        }, 1);
      } else {
        mb.publish(OO.EVENTS.VC_VIDEO_ELEMENT_IN_FOCUS, videoId);
      }

      // Set the closed captions for the element in focus
      setClosedCaptionsLanguage('', activeLanguage, {"mode": ccMode});
    }, this);

    var _removeFocusFromElement = _.bind(function(videoId) {
      if (!(videoId && this.activeInstances && this.activeInstances[videoId] &&
            this.activeInstances[videoId].element)) {
        return;
      }

      // Send the 'transition' parameter to indicate that the video is going into hiding
      // The skin should use this field to know not to show the pause animation
      mb.publish(OO.EVENTS.VC_PAUSE, videoId, "transition");

      this.focusVideoId = null;
      var css = { "visibility": "hidden" };
      if (OO.isIos) {
        css["display"] = OO.CSS.INVISIBLE_DISPLAY;
      } else {
        css["left"] = "-100000px";
      }

      _safeFunctionCall(this.activeInstances[videoId].element, "applyCss", [css]);
      _safeFunctionCall(this.activeInstances[videoId].element, "setClosedCaptionsMode", [OO.CONSTANTS.CLOSED_CAPTIONS.DISABLED]);

      mb.publish(OO.EVENTS.VC_VIDEO_ELEMENT_LOST_FOCUS, videoId);
    }, this);


    // ********************
    // Plugin control apis
    // ********************

    var adsPlayed = _.bind(function(eventname) {
      _safeFunctionCall(this.activeInstances[this.focusVideoId].element, "onAdsPlayed");
    }, this);

    var vcSetVideoStreams = _.bind(function(eventname, videoId, streams, isLive) {
      if (!(videoId && this.activeInstances && this.activeInstances[videoId] &&
            this.activeInstances[videoId].element)) {
        return;
      }

      // if streams parameter is empty, clear stream object from the video
      if (!streams) {
        _setVideoStream(videoId, "", {url:""}, false);
        return;
      }

      var chosenEncoding = _selectEncoding(streams,
                                           this.activeInstances[videoId].element.supportedEncodings,
                                           _getEncodingPriorities());

      /*
        // TODO: Do we wish to select an encoding based on the full list of plugins or use the one we have?
        mb.publish(OO.EVENTS.VC_DISPOSE_VIDEO_ELEMENT, OO.VIDEO.ADS);
        mb.publish(OO.EVENTS.VC_CREATE_VIDEO_ELEMENT, OO.VIDEO.ADS, streams, this.pluginsElement);
        (if it was in focus, focus the new element)
      */

      // If none are selected, raise an error
      if (!chosenEncoding) {
        mb.publish(OO.EVENTS.VC_ERROR, videoId, {code: OO.ERROR.VC.UNSUPPORTED_ENCODING});
        return;
      }

      _setVideoStream(videoId, chosenEncoding, streams[chosenEncoding], isLive || this.activeInstances[videoId].isLive);
    }, this);

    var vcPreload = _.bind(function(eventname, videoId) {
      if (canPreload) {
        _callIfInControl(videoId, "load", [true]);
      }
    }, this);

    var vcReload = _.bind(function(eventname, videoId) {
      _callIfInControl(videoId, "load", [false]);
    }, this);

    var vcSetInitialTime = _.bind(function(eventname, videoId, initialTime) {
      if (this.activeInstances && this.activeInstances[videoId] && this.activeInstances[videoId].element) {
        // NOTE: Each video technology may handle this differently.
        _safeFunctionCall(this.activeInstances[videoId].element, "setInitialTime", [initialTime]);
      }
    }, this);

    var vcPrimeVideos = _.bind(function() {
      // Prime each video element to enable api-controlled video playback on devices
      for (var videoId in this.activeInstances) {
        _callIfInControl(videoId, "primeVideoElement", []);
      }
    }, this);

    var play = _.bind(function() {
      // TODO: May need to take url as a parameter
      mb.publish(OO.EVENTS.VC_PLAY, this.focusVideoId);
    }, this);

    var vcPlay = _.bind(function(eventname, videoId, url) {
      if (!(this.activeInstances && this.activeInstances[videoId])) {
        return;
      }

      if (url) {
        if (this.activeInstances[videoId].stream) {
          this.activeInstances[videoId].stream.url = url;
        } else {
          this.activeInstances[videoId].stream = {url:url};
        }
      }

      _prepareInstanceForAction(videoId);

      // This value may be null in the case where a module will be controlling the url manually
      // This is true for freewheel
      if (this.activeInstances[videoId].stream && this.activeInstances[videoId].stream.url) {
        _setVideoStream(videoId, this.activeInstances[videoId].encoding, this.activeInstances[videoId].stream, this.activeInstances[videoId].isLive);
        // If we don't sent playing to true here, then if we lose element control before playing is raised
        // we may not keep our current position.  This happens when switching to an ad after seeking if
        // we were paused.
        this.activeInstances[videoId].playing = true;
      }

      // Focus the video element?
      _safeFunctionCall(this.activeInstances[videoId].element, "play", []);
    }, this);

    var pause = _.bind(function() {
      mb.publish(OO.EVENTS.VC_PAUSE, this.focusVideoId);
    }, this);

    var vcPause = _.bind(function(eventname, videoId) {
      _callIfInControl(videoId, "pause", []);
    }, this);

    var seek = _.bind(function(eventname, time, videoIdIn) {
      var videoId = videoIdIn || this.focusVideoId;
      mb.publish(OO.EVENTS.VC_SEEK, videoId, time);
    }, this);

    var vcSeek = _.bind(function(eventname, videoId, time) {
      if (videoId && this.activeInstances[videoId] && this.activeInstances[videoId].element &&
          this.activeInstances[videoId].element.wrapper) {
        _callIfInControl(videoId, "seek", [time]);
      }
    }, this);

    var changeVolume = _.bind(function(eventname, newVolume, videoId) {
      if (typeof(newVolume) !== "number" || newVolume < 0 || newVolume > 1) {
        log("Can not assign volume with invalid value", newVolume);
        return;
      }

      currentVolume = newVolume;
      if (videoId) {
        _callIfInControl(videoId, "setVolume", [currentVolume]);
      } else {
        // Change the volume on all active elements
        for (var index=0; index < activeElements.length; index++) {
          _safeFunctionCall(activeElements[index], "setVolume", [currentVolume]);
        }
      }
    }, this);

    var pageUnloadRequested = _.bind(function() {
      _delayErrorPublishing();
    }, this);

    var enableSeeking = _.bind(function(eventname, videoId) {
      if (videoId && this.activeInstances[videoId]) {
        this.activeInstances[videoId].disableNativeSeek = false;
        if (this.activeInstances[videoId].isControllingElement &&
            this.activeInstances[videoId].element &&
            this.activeInstances[videoId].element.isControllingObject &&
            this.activeInstances[videoId].element.wrapper) {
          this.activeInstances[videoId].element.wrapper.disableNativeSeek = false;
        }
      }
    }, this);

    var disableSeeking = _.bind(function(eventname, videoId) {
      if (videoId && this.activeInstances[videoId]) {
        this.activeInstances[videoId].disableNativeSeek = true;
        if (this.activeInstances[videoId].isControllingElement &&
            this.activeInstances[videoId].element &&
            this.activeInstances[videoId].element.isControllingObject &&
            this.activeInstances[videoId].element.wrapper) {
          this.activeInstances[videoId].element.wrapper.disableNativeSeek = true;
        }
      }
    }, this);

    var setClosedCaptionsLanguage = _.bind(function(eventName, language, params) {
      var captionParams = params || {};
      if (captionParams.mode == null) {
        captionParams.mode = OO.CONSTANTS.CLOSED_CAPTIONS.SHOWING;
      }
      activeLanguage = language;
      ccMode = captionParams.mode;

      if (this.focusVideoId && captionParams.mode == OO.CONSTANTS.CLOSED_CAPTIONS.DISABLED) {
        _callIfInControl(this.focusVideoId, "setClosedCaptionsMode", [captionParams.mode]);
      } else if (this.activeInstances[this.focusVideoId]) {
        // March 2016 iPhone and iPad use their native video players so we must let them also render the captions, instead of our skin.
        if (captionParams.mode == OO.CONSTANTS.CLOSED_CAPTIONS.HIDDEN && (OO.isIphone || (OO.isIpad && captionParams.isFullScreen))) {
          captionParams.mode = OO.CONSTANTS.CLOSED_CAPTIONS.SHOWING;
        }

        _callIfInControl(this.focusVideoId, "setClosedCaptions", [language, this.activeInstances[this.focusVideoId].closedCaptions, captionParams]);
      }
    }, this);

    var setTargetBitrate = _.bind(function(eventName, targetBitrate) {
      // check bitrate feature available and call setBitrate on plugin
      if (this.focusVideoId && _.contains(registeredPlugins[this.activeInstances[this.focusVideoId].plugin].features,
                                          OO.VIDEO.FEATURE.BITRATE_CONTROL)) {
        _callIfInControl(this.focusVideoId, "setBitrate", [targetBitrate]);
      }
    }, this);

    /**
     * Destroy the Video Tech Controller, all elements, and all plugins.
     * @method VideoController#onDestroy
     * @public
     */
    this.onDestroy = function() {
      // Destroy all instances
      for (var videoId in this.activeInstances) {
        vcDisposeVideoElement(OO.EVENTS.DESTROY, videoId);
      }

      // TODO: Destroy self
    };

    // ********************
    // Public Plugin APIs
    // ********************

    /**
     * Notify the Video Controller of an event from the video.  This is not called directly by the plugins.
     * @method VideoController#notify
     * @protected
     * @param {string} videoId The id of the video element
     * @param {string} plugin The plugin name
     * @param {string} eventname The event name as found in VideoController#EVENTS
     * @param {object} eventparams The event parameters.
     *                             Refer to VideoController#EVENTS for required parameters for each event.
     * @fires OO.EVENTS.VC_WILL_PLAY
     * @fires OO.EVENTS.SEEK
     * @fires OO.EVENTS.VC_CAN_PLAY
     * @fires OO.EVENTS.VC_PLAYING
     * @fires OO.EVENTS.VC_PLAYED
     * @fires OO.EVENTS.VC_ERROR
     * @fires OO.EVENTS.VC_SEEKING
     * @fires OO.EVENTS.VC_SEEKED
     * @fires OO.EVENTS.VC_PAUSED
     * @fires OO.EVENTS.PLAYHEAD_TIME_CHANGED
     * @fires OO.EVENTS.VOLUME_CHANGED
     * @fires OO.EVENTS.BUFFERING
     * @fires OO.EVENTS.BUFFERED
     * @fires OO.EVENTS.DOWNLOADING
     * @fires OO.EVENTS.FULLSCREEN_CHANGED
     * @fires OO.EVENTS.CLOSED_CAPTIONS_INFO_AVAILABLE
     * @fires OO.EVENTS.ASSET_DIMENSION
     */
    this.notify = function(videoId, plugin, eventname, eventparams) {
      var params = eventparams || {};
      switch(eventname) {
        case this.EVENTS.PLAY:
          mb.publish(OO.EVENTS.VC_WILL_PLAY, videoId, params["url"]);
          break;
        case this.EVENTS.CAN_PLAY:
          mb.publish(OO.EVENTS.VC_CAN_PLAY, videoId);
          break;
        case this.EVENTS.PLAYING:
          mb.publish(OO.EVENTS.VC_PLAYING, videoId); // this used to have the stream url as a parameter
          break;
        case this.EVENTS.ENDED:
          if (this.activeInstances[videoId]) {
            this.activeInstances[videoId].playing = false;
          }
          mb.publish(OO.EVENTS.VC_PLAYED, videoId);
          break;
        case this.EVENTS.ERROR:
          this.markReady(videoId);
          if (this.activeInstances[videoId]) {
            this.activeInstances[videoId].playing = false;
          }
          _handleErrors(params["errorcode"], videoId);
          break;
        case this.EVENTS.SEEKING:
          mb.publish(OO.EVENTS.VC_SEEKING, videoId);
          break;
        case this.EVENTS.SEEKED:
          if (this.activeInstances[videoId]) {
            var playhead = _safeFunctionCall(this.activeInstances[videoId].element, "getCurrentTime");
            mb.publish(OO.EVENTS.VC_SEEKED, videoId, playhead);
          }
          break;
        case this.EVENTS.PAUSED:
          mb.publish(OO.EVENTS.VC_PAUSED, videoId); // this event used to have the url as the parameter
          break;
        case this.EVENTS.TIME_UPDATE:
          if (typeof params["duration"] !== "number") return;
          if (typeof params["currentTime"] !== "number") return;
          mb.publish(OO.EVENTS.PLAYHEAD_TIME_CHANGED, params["currentTime"], params["duration"],
                     params["buffer"], params["seekRange"], videoId);
          break;
        case this.EVENTS.VOLUME_CHANGE:
          mb.publish(OO.EVENTS.VOLUME_CHANGED, params["volume"], videoId);
          break;
        case this.EVENTS.BUFFERING:
          mb.publish(OO.EVENTS.BUFFERING, params["url"], videoId);
          break;
        case this.EVENTS.BUFFERED:
          mb.publish(OO.EVENTS.BUFFERED, params["url"], videoId);
          break;
        case this.EVENTS.DURATION_CHANGE:
          if (typeof params["duration"] !== "number") return;
          mb.publish(OO.EVENTS.PLAYHEAD_TIME_CHANGED, params["currentTime"], params["duration"],
                     params["buffer"], params["seekRange"], videoId);
          break;
        case this.EVENTS.PROGRESS:
          mb.publish(OO.EVENTS.DOWNLOADING, params["currentTime"], params["duration"],
                     params["buffer"], params["seekRange"], videoId);
          break;
        case this.EVENTS.WAITING:
          mb.publish(OO.EVENTS.BUFFERING, params["url"], videoId);
          break;
        case this.EVENTS.FULLSCREEN_CHANGED:
          mb.publish(OO.EVENTS.FULLSCREEN_CHANGED, params["isFullScreen"], params["paused"], videoId);
          setClosedCaptionsLanguage('', activeLanguage, {"mode": ccMode, "isFullScreen": params["isFullScreen"]});
          break;
        case this.EVENTS.CAPTIONS_FOUND_ON_PLAYING:
          if (this.activeInstances[videoId] && eventparams) {
            //Set crossorigin so that we can load captions from outside sources
            _setCrossorigin(videoId, "anonymous");

            //Add the found plugins from the plugin to our existing available captions
            var availableClosedCaptions = {
              videoId: videoId,
              languages: [],
              locale: {}
            };
            if (this.activeInstances[videoId].closedCaptions &&
                this.activeInstances[videoId].closedCaptions.availableLanguages &&
                this.activeInstances[videoId].closedCaptions.locale) {

              availableClosedCaptions.languages = this.activeInstances[videoId].closedCaptions.availableLanguages;
              availableClosedCaptions.locale = this.activeInstances[videoId].closedCaptions.locale;
            }

            availableClosedCaptions.languages = _.union(availableClosedCaptions.languages, eventparams.languages);
            availableClosedCaptions.locale = _.extend(availableClosedCaptions.locale, eventparams.locale);

            mb.publish(OO.EVENTS.CLOSED_CAPTIONS_INFO_AVAILABLE, availableClosedCaptions);
          }
          break;
        case this.EVENTS.ASSET_DIMENSION:
          if (typeof params["width"] == "number" && params["width"] > 0 &&
              typeof params["height"] == "number" && params["height"] > 0) {
            _.extend(params, {videoId: videoId});
            mb.publish(OO.EVENTS.ASSET_DIMENSION, params);
          }
          break;
        case this.EVENTS.BITRATES_AVAILABLE:
          //publish bitrate available event to MB, possibly store the bitrates?
          mb.publish(OO.EVENTS.BITRATE_INFO_AVAILABLE, {bitrates: eventparams});
          break;
        case this.EVENTS.BITRATE_CHANGED:
          if (_validateBitrate(eventparams)) {
            mb.publish(OO.EVENTS.BITRATE_CHANGED, eventparams);
          } else {
            log("Invalid bitrate object reported", eventparams);
          }
          break;
        case this.EVENTS.CLOSED_CAPTION_CUE_CHANGED:
          if (typeof eventparams !== 'string') return;
          mb.publish(OO.EVENTS.CLOSED_CAPTION_CUE_CHANGED, eventparams);
          break;
        case this.EVENTS.METADATA_FOUND:
          if (eventparams["type"] && eventparams["data"]) {
            mb.publish(OO.EVENTS.VC_TAG_FOUND, videoId, eventparams["type"], eventparams["data"]);
          }
          break;
      }
    };

    /**
     * Notifies the Video Controller that the video element is not ready to receive play commands.  This
     * will only have an effect if called before returning the element in the create API.
     * This should only be used in cases when the video wrapper will not be able to handle play events
     * in a synchronous fashion on devices such as Android that require playback directly upon user click.
     * @method VideoController#markNotReady
     * @protected
     * @param {string} videoId The videoId to mark as not ready.
     */
    this.markNotReady = function(videoId) {
      if (videoId && this.activeInstances[videoId] && !isPlaybackReady) {
        elementsNotReady.push(videoId);

        if (readyTimer === null) {
          mb.addDependent(OO.EVENTS.PLAYBACK_READY, OO.EVENTS.VC_READY, "vtc", _restoreOrigParams);
          readyTimer = setTimeout(_declareReadyOnTimeout, READY_TIMEOUT);
        }
      }
    };

    /**
     * Notifies the Video Controller that the video element is ready to receive play commands.  This function
     * should only be called if VideoControllerInterface.markNotReady was called.
     * @method VideoController#markReady
     * @protected
     * @param {string|null} videoId The videoId to mark as ready.  If null is passed, marks all elements as ready.
     * @fires OO.EVENTS.VC_READY
     */
    this.markReady = function(videoId) {
      if (readyTimer === null && elementsNotReady.length === 0) {
        return;
      }

      if (!videoId) {
        elementsNotReady = [];
      } else {
        elementsNotReady = _.without(elementsNotReady, videoId);
      }

      if (elementsNotReady.length === 0) {
        if (readyTimer !== null) {
          clearTimeout(readyTimer);
          readyTimer = null;
        }
        mb.publish(OO.EVENTS.VC_READY);
      }
    };

    // ********************
    // Helpers
    // ********************

    /**
     * This ensures that the parameters from the blocked event are maintained if it has a dependent
     * If nothing (or null) is returned, the blocked event would get raised with the parameters of
     * the blocker rather than the parameters which were specified by the caller.
     * This is required to ensure that VC_PLAY passes the stream url
     * This will change with PBW-2910 and can be removed at that time.
     * @private
     * @method VideoController#_restoreOrigParams
     */
    var _restoreOrigParams = function(eventName, dependentEvent, origParams, args){
      return origParams;
    };

    /**
     * Marks all plugins as ready.
     * @private
     * @method VideoController#_declareReadyOnTimeout
     */
    var _declareReadyOnTimeout = _.bind(function() {
      this.markReady();
    }, this);

    /**
     * Safely triggers a function with the specified video wrapper.
     * @method VideoController#_safeFunctionCall
     * @private
     * @param {string} videoElement The element on which to call a function
     * @param {string} func The function to call
     * @param {object} params An array containing the function parameters
     * @returns {*} The return value of the function that was run or null
     */
    var _safeFunctionCall = function(videoElement, func, params) {
      if (!videoElement) return;
      var videoWrapper = videoElement.wrapper;
      if (!videoWrapper) return;
      try {
        if (_.isFunction(videoWrapper[func])) {
          return videoWrapper[func].apply(videoWrapper, params);
        }
      } catch (err) {
        console.warn("Video tech plugin", (videoElement && videoElement.plugin), "at function '" + func +
            "' threw exception - ", err);
      }
      return null;
    };

    /**
     * Calls a function on a video element if the videoInstance is controlling the video element.
     * When a virtual instance has control, the instance managing real element does not (and vica versa).
     * @private
     * @method VideoController#_callIfInControl
     * @param {string} videoId The id of the video instance to call a function on
     * @param {string} func The function to call on the video instance
     * @param {object} params A list of the parameters to pass to the function
     * @returns {*} The return value of the function that was run or null
     */
    var _callIfInControl = _.bind(function(videoId, func, params) {
      if (!this.activeInstances[videoId] ||
          !this.activeInstances[videoId].element ||
          !this.activeInstances[videoId].isControllingElement) return;
      return _safeFunctionCall(this.activeInstances[videoId].element, func, params);
    }, this);

    /**
     * Sets crossorigin attribute based on the video instance.
     * @private
     * @method VideoController#_setCrossorigin
     * @param {string} videoId The id of the video to set the attribute
     * @param {object} crossorigin The crossorigin object to set on the element
     */
    var _setCrossorigin = _.bind(function(videoId, crossorigin) {
      if (!this.activeInstances[videoId]) return;
      this.activeInstances[videoId].crossorigin = crossorigin;
      _changeCrossorigin(videoId);
    }, this);

    /**
     * Changes crossorigin attribute based on the video instance.
     * @private
     * @method VideoController#_changeCrossorigin
     * @param {string} videoId The id of the video to set the attribute
     */
    var _changeCrossorigin = _.bind(function(videoId) {
      if (!this.activeInstances[videoId]) return;

      if (this.activeInstances[videoId].crossorigin) {
        _callIfInControl(videoId, "setCrossorigin", [this.activeInstances[videoId].crossorigin]);
      } else {
        _callIfInControl(videoId, "setCrossorigin", [null]);
      }
    }, this);

    /**
     * Switches playback sessions between unique instances of a single shared video element.
     * @private
     * @method VideoController#_switchElementBetweenInstances
     * @param {string} videoId The id of the video taking control
     */
    var _switchElementBetweenInstances = _.bind(function(videoId) {
      var oldController = _takeElementControl(videoId);

      // Set the crossorigin attribute
      _changeCrossorigin(videoId);

      // Update the vtc interface for the wrapper
      this.activeInstances[videoId].element.wrapper.controller = this.activeInstances[videoId].vtcInterface;

      // Reset the stream url and position
      _resetElementDataAfterSwitch(this.activeInstances[videoId], oldController);
    }, this);

    /**
     * Switch control from the instance currently in control of the shared element to the specified instance.
     * @private
     * @method VideoController#_takeElementControl
     * @param {string} videoId The id of the video taking control
     * @returns {object} The video instance that previously had control of the shared element
     */
    var _takeElementControl = _.bind(function(videoId) {
      var newController = this.activeInstances[videoId];
      if (newController.isControllingElement) return newController;

      // Find the instance currently in control
      var oldController = null;
      for (var instance in this.activeInstances) {
        if (this.activeInstances[instance] &&
            this.activeInstances[instance].element &&
            this.activeInstances[instance].element === newController.element &&
            this.activeInstances[instance].isControllingElement) {
          oldController = this.activeInstances[instance];
          break;
        }
      }

      log("Switching element between instances.  From: '" + instance + "', To: '" + videoId + "'");

      // Swap Control
      newController.isControllingElement = true;
      if (oldController) {
        oldController.isControllingElement = false;
        return oldController;
      }
    }, this);

    /**
     * Switch control from the specified instance to another instance using the same element.
     * @private
     * @method VideoController#_handoffElementControl
     * @param {string} videoId The id of the video losing control
     */
    var _handoffElementControl = _.bind(function(videoId) {
      var oldController = this.activeInstances[videoId];
      if (!oldController.isControllingElement) return;

      // Find an instance not currently in control
      var newController = null;
      for (var instance in this.activeInstances) {
        if (this.activeInstances[instance] &&
            this.activeInstances[instance].element &&
            this.activeInstances[instance].element === oldController.element &&
            !this.activeInstances[instance].isControllingElement) {
          newController = this.activeInstances[instance];
          break;
        }
      }

      // Swap Control
      oldController.isControllingElement = false;
      if (newController) {
        newController.isControllingElement = true;
      }
    }, this);

    /**
     * If the video object is shared, switch control between element wrappers
     * @private
     * @method VideoController#_switchElementWrapperControl
     * @param {string} videoId The id of the video instance taking control
     */
    var _switchElementWrapperControl = _.bind(function(videoId) {
      if (!this.activeInstances[videoId].element.isControllingObject) {
        // Switch control
        var oldController = this.activeInstances[videoId].element.sharedObjectToInstance;
        log("Switching wrapper between elements.  From: '" + oldController + "', To: '" + videoId + "'");
        _safeFunctionCall(this.activeInstances[oldController].element, "sharedElementGive", []);
        this.activeInstances[oldController].element.isControllingObject = false;
        _safeFunctionCall(this.activeInstances[videoId].element, "sharedElementTake", []);
        this.activeInstances[videoId].element.isControllingObject = true;

        // Reset the stream url and position
        _resetElementDataAfterSwitch(this.activeInstances[videoId], this.activeInstances[oldController]);
      }
    }, this);

    /**
     * Sets the stream url and position to that of the newInstance and saves the playhead of the old instance.
     * @private
     * @method VideoController#_resetElementDataAfterSwitch
     * @param {object} newInstance The video instance taking control of the element
     * @param {object} oldInstance The video instance losing control of the element
     */
    var _resetElementDataAfterSwitch = _.bind(function(newInstance, oldInstance) {
      // Save the old playhead
      if (oldInstance) {
        // Check if the stream has finished playing or hasn't played at all, if so, save 0 as the playhead
        if (oldInstance.playing === true) {
          oldInstance.playhead = _safeFunctionCall(oldInstance.element, "getCurrentTime");
          /* PBW-5179: In iOS, getCurrentTime() returns zero for the main video. Below is the workaround to set
             the playhead to the correct value */
          if (OO.isIos && oldInstance.playhead === 0) {
            oldInstance.playhead  = this.currentPlayhead;
            this.currentPlayhead = 0;
          }
        } else {
          oldInstance.playhead = 0;
        }
      }

      // Set the new stream
      if (newInstance.stream) {
        var stream = newInstance.stream;
        var encoding = newInstance.encoding;
        var isLive = newInstance.isLive;
        _callIfInControl(newInstance.element, "setPlatform", [newInstance.params.platform, encoding]);
        _safeFunctionCall(newInstance.element, "setVideoUrl", [stream.url, encoding, isLive || false]);
        newInstance.playing = false;
        // Set DRM data if needed
        if (stream.drm && !_.isEmpty(stream.drm) && _isSupportedDRMEncoding(encoding)) {
          _safeFunctionCall(newInstance.element, "setDRM", [stream.drm]);
        }
      }

      // Set initial time if required
      if (newInstance.playhead > 0) {
        _safeFunctionCall(newInstance.element, "setInitialTime", [newInstance.playhead]);
      }

      // Restore native seeking state
      if (newInstance.element && newInstance.element.wrapper) {
        newInstance.element.wrapper.disableNativeSeek = newInstance.disableNativeSeek;
      }
    }, this);

    /**
     * Disposes a video element while keeping the video instance around.  Selects which video element to
     * dispose based on technology.
     * This function is not being called and might be deprecated.  It was made public to enable unit testing.
     * @protected
     * @method VideoController#_disposeAnyElementKeepInstance
     */
    this.disposeAnyElementKeepInstance = function() {
      // Favor disposal of an HTML5-based instance in case the mixed instance is not HTML5-based.
      var favoredTechnology = OO.VIDEO.TECHNOLOGY.HTML5;
      var videoId = _findElementToDispose(favoredTechnology);
      _disposeElementKeepInstance(videoId);
    };

    /**
     * Selects which video element to dispose based on technology.  If an element of this technology cannot
     * be found, an element of technology "mixed" will be selected (if available).
     * This function is not being called and might be deprecated.
     * @private
     * @method VideoController#_findElementToDispose
     * @param {string} desiredTechnology The technology of the video instance to select
     */
    var _findElementToDispose = _.bind(function(desiredTechnology) {
      var instanceToDispose = null;
      for (var instance in this.activeInstances) {
        if (this.activeInstances[instance] &&
            this.activeInstances[instance].element) {
          var technology = registeredPlugins[this.activeInstances[instance].plugin].technology;
          if (technology === desiredTechnology) {
            return instance;
          } else if (technology === OO.VIDEO.TECHNOLOGY.MIXED) {
            instanceToDispose = instance;
          }
        }
      }

      return instanceToDispose;
    }, this);

    /**
     * Disposes a video element while keeping the video instance around.
     * This function is not being called and might be deprecated.
     * @private
     * @method VideoController#_disposeElementKeepInstance
     * @param {string} videoId The id of the video instance within which to dispose the video element
     */
    var _disposeElementKeepInstance = _.bind(function(videoId) {
      if (!videoId) return;

      // NOTE: Be careful here for ads.  We don't want a new ad to use the position of the previous stream.
      // Currently there is no issue here because ads will attempt to re-create the instance, thus not
      // hitting this line of code.
      // Check if the stream has finished playing or hasn't played at all, if so, save 0 as the playhead
      if (this.activeInstances[videoId].playing === true) {
        this.activeInstances[videoId].playhead = _safeFunctionCall(this.activeInstances[videoId].element,
                                                                   "getCurrentTime");
      } else {
        this.activeInstances[videoId].playhead = 0;
      }

      // Remove focus
      if (this.focusVideoId === videoId) {
        // Note: this function attempts to pause the video, but this will take place after the destroy
        _removeFocusFromElement(videoId);
      }

      // Remove element from all shared instances
      for (var instance in this.activeInstances) {
        if (instance === videoId) continue;
        if (this.activeInstances[instance] &&
            this.activeInstances[instance].element &&
            this.activeInstances[instance].element === this.activeInstances[videoId].element) {
          this.activeInstances[instance].isControllingElement = true;
          this.activeInstances[instance].element = null;
        }
      }

      // Quietly dispose the video element, do not raise an event to denote instance destroyal
      if (this.activeInstances[videoId].element) {
        _safeFunctionCall(this.activeInstances[videoId].element, "destroy", []);
        activeElements = _.without(activeElements, this.activeInstances[videoId].element);
        this.activeInstances[instance].isControllingElement = true;
        this.activeInstances[videoId].element = null;
      }
    }, this);

    /**
     * Re-creates a video element for an existing instance.
     * @private
     * @method VideoController#_recreateDisposedElement
     * @param {string} videoId The id of the video instance within which to re-create the video element
     */
    var _recreateDisposedElement = _.bind(function(videoId) {
      // Grab the playhead before creating a new element
      var playhead = this.activeInstances[videoId].playhead;

      _createInstance(registeredPlugins[this.activeInstances[videoId].plugin],
                      videoId,
                      this.activeInstances[videoId].parentContainer,
                      this.activeInstances[videoId].encoding,
                      this.activeInstances[videoId].stream,
                      this.activeInstances[videoId].isLive,
                      this.activeInstances[videoId].params);

      vcVideoElementCreated("recreate", { "videoId" : videoId });

      // Set initial time if required
      if (playhead > 0) {
        _safeFunctionCall(this.activeInstances[videoId].element, "setInitialTime", [playhead]);
      }

      // Restore native seeking state
      if (this.activeInstances[videoId].element && this.activeInstances[videoId].element.wrapper) {
        this.activeInstances[videoId].element.wrapper.disableNativeSeek =
           this.activeInstances[videoId].disableNativeSeek;
      }
    }, this);

    /**
     * Prepares and instance to take action.  Recreates dispose elements and takes element control.
     * @private
     * @method VideoController#_prepareInstanceForAction
     * @param {string} videoId The id of the video instance to prepare for action.
     */
    var _prepareInstanceForAction = _.bind(function(videoId) {
      if (this.activeInstances[videoId] && !this.activeInstances[videoId].element) {
        _recreateDisposedElement(videoId);
      }

      // If it's virtual, switch to this element
      if (!this.activeInstances[videoId].isControllingElement) {
        _switchElementBetweenInstances(videoId);
      }

      // If the video object is shared, switch control between element wrappers
      _switchElementWrapperControl(videoId);
    }, this);

    /**
     * Some plugins do not set the desired domId on the core video element.  Make a best-effort to find the
     * actual video element.  This won't be possible for flash-based videos.
     * @private
     * @method VideoController#_getElementIdOfVideo
     * @param {string} domId The dom id of the element to find
     */
    var _getElementIdOfVideo = _.bind(function(domId){
      var element = $("#" + domId);
      if (element.length > 0 && !element.is("video")) {
        var foundElementId = element.find("video").attr("id");
        if (foundElementId) {
          return foundElementId;
        }
      }

      return domId;
    }, this);

    /**
     * Sets the video stream and DRM on the given element.
     * @private
     * @method VideoController#_setVideoStream
     * @param {string} videoId The id of the video instance
     * @param {string} encoding The encoding of video stream, possible values are found in OO.VIDEO.ENCODING
     * @param {object} stream The url and drm of the stream to set on the video element
     * @param {boolean} isLive True if it is a live asset, false otherwise
     */
    var _setVideoStream = _.bind(function(videoId, encoding, stream, isLive) {
      if (!this.activeInstances[videoId]) return;
      this.activeInstances[videoId].playhead = 0;
      this.activeInstances[videoId].playing = false;
      this.activeInstances[videoId].stream = stream;
      this.activeInstances[videoId].encoding = encoding;

      if (stream.drm && !_.isEmpty(stream.drm) && _isSupportedDRMEncoding(encoding)) {
        _callIfInControl(videoId, "setDRM", [stream.drm]);
      }
      _callIfInControl(videoId, "setPlatform", [this.activeInstances[videoId].params.platform, encoding]);
      return _callIfInControl(videoId, "setVideoUrl", [stream.url, encoding, isLive || false]);
    }, this);

    /**
     * Check if the DRM encoding is currently supported
     * @private
     * @method VideoController#_isSupportedDRMEncoding
     * @param {string} encoding The encoding of video stream, possible values are found in OO.VIDEO.ENCODING
     * @return {boolean} True if DRM for the encoding is supported, otherwise false
     */
    var _isSupportedDRMEncoding = _.bind(function(encoding) {
      for (var key in OO.VIDEO.ENCODING.DRM) {
        if (OO.VIDEO.ENCODING.DRM[key] == encoding) return true;
      }
      return false;
    }, this);

    /**
     * Saves the closed captions object to the instance.
     * @private
     * @method VideoController#_setClosedCaptions
     * @param {string} videoId The id of the video instance
     * @param {object} closedCaptions The closed captions to set on the video element
     */
    var _setClosedCaptions = _.bind(function(videoId, closedCaptions) {
      if (!this.activeInstances[videoId]) return;
      this.activeInstances[videoId].closedCaptions = closedCaptions;
    }, this);

    /**
     * Sets the video stream secureContent
     * @private
     * @method VideoController#_setSecureContent
     * @param {string} videoId The id of the video instance
     * @param {object} contentMetadata the assetId and accountId of the content
     */
    var _setSecureContent = _.bind(function(videoId, contentMetadata) {
      if (!this.activeInstances[videoId] || !contentMetadata) return;
      _callIfInControl(videoId, "setSecureContent", [contentMetadata]);
    }, this);

    /**
     * Emits errors if possible, otherwise saves errors in a list.
     * HTML5 Media Error Constants:
     *   MediaError.MEDIA_ERR_ABORTED = 1
     *   MediaError.MEDIA_ERR_NETWORK = 2
     *   MediaError.MEDIA_ERR_DECODE = 3
     *   MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED = 4
     *   MediaError.MEDIA_ERR_ENCRYPTED = 5 (Chrome only)
     *   Ooyala Extensions:
     *   NO_STREAM = 0
     *   UNKNOWN = -1
     * @method VideoController#_handleErrors
     * @param {object} code The error code
     * @param {string} videoId The id of the video
     * @fires OO.EVENTS.PAGE_PROBABLY_UNLOADING
     * @fires OO.EVENTS.VC_PLAY_FAILED
     */
    var _handleErrors = _.bind(function(code, videoId) {
      if (shouldEmitErrors) {
        _emitErrors();
      } else {
        // The error occurred when the page was probably unloading.
        // Happens more often on low bandwidth.
        OO.d("Error not emitted: " + code);
        // TODO: Store the videoId
        unemittedErrors.push(code);
        mb.publish(OO.EVENTS.PAGE_PROBABLY_UNLOADING);
        return;
      }

      mb.publish(OO.EVENTS.VC_PLAY_FAILED, videoId, JSON.stringify(code));
    }, this);

    /**
     * Emits unemitted errors.
     * @method VideoController#_emitErrors
     * @private
     * @fires OO.EVENTS.VC_PLAY_FAILED
     */
    var _emitErrors = _.bind(function() {
      // Any errors that occurred after selecting to "stay" and before
      // the time limit are dispatched.
      shouldEmitErrors = true;
      // TODO: Get the videoId
      var videoId = "";
      _.each(unemittedErrors, function(e) {
        mb.publish(OO.EVENTS.VC_PLAY_FAILED, videoId, JSON.stringify(e));
      });
      unemittedErrors = [];
    }, this);

    /**
     * Delays error publishing by 5 seconds.
     * @method VideoController#_delayErrorPublishing
     * @private
     */
    var _delayErrorPublishing = _.bind(function() {
      // User-cancellable event beforeUnload has been dispatched to window.
      // Prevent errors to be dispatched due to the video element being destroyed.
      shouldEmitErrors = false;
      // Clear previous timeout in case the user selected "stay" and then
      // navigated away again, otherwise the error may get emitted on low bandwidth.
      clearTimeout(errorTimer);

      // Restore error dispatching after a timeout.
      // TODO: Can this be a defer?  Why do we need this?
      _.delay(_.bind(function() {
        // This will happen after the user clicks on "leave" or "stay" in case
        // the embedding webpage adds another listener which gives the option.
        // After 5 seconds it is assumed the user stayed on the page.
        errorTimer = _.delay(_emitErrors, 5000);
      }, this), 1);
    }, this);

    var _generateUniqueName = function() {
      // TODO: make more unique
      return Math.random().toString(36).substring(7);
    };

    /**
     * Validates a bitrate object before published to message bus.
     * Bitrate object needs the following properties:
     *   id: a String that uniquely identifies the object
     *   bitrate: a Number representing the bitrate
     *   height: a Number equal to vertical resolution
     *   width: a Number equal to the horizontal resolution
     * @method VideoController#_delayErrorPublishing
     * @param {Object} bitrate An object representing the bitrate switched to.
     * @private
     */
    var _validateBitrate = function(bitrate) {
      if (!bitrate) return false;
      var idValid = (bitrate.id !== undefined && typeof bitrate.id === "string");
      var bitrateValid = (bitrate.bitrate !== undefined && typeof bitrate.bitrate === "number");
      var heightValid = (bitrate.height !== undefined && typeof bitrate.height === "number");
      var widthValid = (bitrate.width !== undefined && typeof bitrate.width === "number");
      return (idValid && bitrateValid && heightValid && widthValid);
    };

    // ********************
    // Debugging
    // ********************

    var self = this;
    var videoDebugging = {
      getRegisteredPlugins: function() {
        return OO.Video.getRegisteredPlugins();
      },

      getEncodingPriority: function() {
        return _getEncodingPriorities();
      },

      getSupportedEncodings: function() {
        return _getFilteredSupportedEncodings(this.getRegisteredPlugins());
      },

      getVideoInstances: function() {
        return self.activeInstances;
      },

      getVideoElements: function() {
        return activeElements;
      }
    };

    // ********************
    // Setup
    // ********************

    initialize();
  };

  OO.registerModule('videoController', function(messageBus, id) {
    return new VideoController(messageBus, id);
  });
}(OO, OO._, OO.$));

/*
 * Metadata Controller
 */

 (function(OO, _, $) {
  /**
   * @class MetadataController
   * @classdesc The Metadata controller main class.  This class is registered as a module with the player.
   * @private
   * @param {object} messageBus The player message bus
   * @param {string} id The ID of the player module
   */
  var MetadataController = function(messageBus, id) {
    this.toString = function() {return 'metadata-controller';};
    this.mb = messageBus;
    this.id = id;
    this.metadataFetched = false;
    this.metadata = null;

    this.mb.subscribe(OO.EVENTS.METADATA_FETCHED, 'metadata', _.bind(this.onMetadataFetched, this));
    this.mb.subscribe(OO.EVENTS.SET_EMBED_CODE, 'metadata', _.bind(this.onSetEmbedCode, this));
  };

  _.extend(MetadataController.prototype, {
    /**
     * Called when the metadata API is fetched. Parse Thumbnail metadata setting from API response.
     * This is customer specific metadata format that we know of.
     * This method will need to be replaced by calling a separate general purpose API for thumbnail.
     * @method MetadataController#onMetadataFetched
     * @param {string} eventName The name of the event for which this callback is called
     * @param {object} metadata Backlot metadata
     */
    onMetadataFetched: function(eventName, metadata) {
      this.metadataFetched = true;
      this.metadata = metadata;
    },

    /**
     * Called when the embed code has been set. This happens after an external ID has been
     * translated to an Ooyala embed code so we don't need special handling for that case.
     * @method MetadataController#onSetEmbedCode.
     * @param {string} eventName The name of the event for which this callback is called
     * @param {object} embedCode the embedCode to be played
     */
    onSetEmbedCode: function(eventName, embedCode) {
      this.metadataFetched = false;
      this.metadata = null;
      var urlParams = {
        server: OO.SERVER.API,
        embedCode: embedCode
      };
      $.ajax({
        url: OO.URLS.THUMBNAILS(urlParams),
        type: 'GET',
        dataType: 'json',
        cache: true,
        success: _.bind(this._thumbnailsFetched, this),
        error: _.bind(this._thumbnailsFailed.bind, this)
      });
    },

    _thumbnailsFetched: function(data){
      if (data && data.data && !_.isEmpty(data.data.thumbnails)) {
        this.mb.publish(OO.EVENTS.THUMBNAILS_FETCHED, data);
      }
    },

    // Deploying this code before the backend is done, this allows for graceful
    // fallback to the ESPN specific use case
    _thumbnailsFailed: function(request, status, error){
      if (this.metadataFetched) {
        this.onMetadataFetched("", this.metadata);
      }
    }

  });

  OO.registerModule('metadataController', function(messageBus, id) {
    return new MetadataController(messageBus, id);
  });

}(OO, OO._, OO.$));
(function(OO,_,$){
  /*
   *  Defines the playback controller
   */

  var ApiModule = function(messageBus, id, params) {
    this.mb = messageBus;
    this.id = id;
    this.params = params || {};

    this.contentTree = {};
    this.metadata = {};
    this.sasResponse = {};
    this.authToken = OO.localStorage.getItem("oo_auth_token");

    this._aborting = false;
    this._contentAjax = null;
    this._metadataAjax = null;
    this._sasAjax = null;

    OO.StateMachine.create({
      initial:'Init',
      messageBus:this.mb,
      moduleName:'Api',
      target:this,
      events:[
        {name:OO.EVENTS.SET_EMBED_CODE,                     from:'*',                                          to:'Init'},
        {name:OO.EVENTS.EMBED_CODE_CHANGED,                 from:'Init',                                       to:'WaitingForAPIResponse'},

        {name:OO.EVENTS.WILL_FETCH_CONTENT_TREE,            from:'WaitingForAPIResponse'},
        {name:OO.EVENTS.WILL_FETCH_METADATA,                from:'WaitingForAPIResponse'},
        {name:OO.EVENTS.WILL_FETCH_AUTHORIZATION,           from:'WaitingForAPIResponse'},
        {name:OO.EVENTS.WILL_FETCH_AD_AUTHORIZATION,        from:['WaitingForAPIResponse', "Init"]},

        {name:OO.EVENTS.PLAYBACK_READY,                     from:'WaitingForAPIResponse',                      to:'Init'},
      ]
    });
  };

  _.extend(ApiModule.prototype, {

    onSetEmbedCode: function(event, embedCode, options) {
      // store parameters
      this.rootEmbedCode = embedCode;
      this.adSetCode = options ? options.adSetCode : undefined;
      this.embedToken = (options && options.embedToken) || this.embedToken;
      this.authToken = (options && options.authToken) || this.authToken;
      this.mb.publish(OO.EVENTS.EMBED_CODE_CHANGED, embedCode, options);
    },

    onEmbedCodeChanged: function(event, embedCode) {
      // store parameters
      this.currentEmbedCode = embedCode;

      this._abort(this._contentAjax);
      this._abort(this._metadataAjax);
      this._abort(this._sasAjax);

      // start server request
      var request = {
        embedCode: this.currentEmbedCode,
        pcode: OO.playerParams.pcode || "unknown",
        playerBrandingId : OO.playerParams.playerBrandingId || "unknown",
        params: {}
      };

      if (!_.isEmpty(this.adSetCode)) {
        _.extend(request.params, { adSetCode: this.adSetCode });
      }
      if (!_.isEmpty(this.embedToken)) {
        _.extend(request.params, { embedToken: this.embedToken });
      }

      // Note(bz): Temporary call to fetch player xml until we move to player api
      var apiRequest = _.extend({}, request, { server: OO.SERVER.API });
      var authRequest = _.extend({}, request, { server: OO.SERVER.AUTH });

      //always publish the metadata event, but only html5 should publish the others.
      this.mb.publish(OO.EVENTS.WILL_FETCH_METADATA, apiRequest);
      if (OO.requiredInEnvironment('html5-playback')) {
        this.mb.publish(OO.EVENTS.WILL_FETCH_PLAYER_XML, apiRequest);
        this.mb.publish(OO.EVENTS.WILL_FETCH_CONTENT_TREE, apiRequest);
        this.mb.publish(OO.EVENTS.WILL_FETCH_AUTHORIZATION, authRequest);
      }
    },

    // Ooyala API Calls

    /*
     *  Content Tree
     */
    onWillFetchContentTree: function(event, request) {
      if (typeof this.contentTree[this.currentEmbedCode] != "undefined") {
        this.mb.publish(OO.EVENTS.CONTENT_TREE_FETCHED, this.contentTree[this.currentEmbedCode]);
      } else {
        this._contentAjax = $.ajax({
          url: OO.URLS.CONTENT_TREE(request) + "?" + $.param(request.params),
          type: 'GET',
          dataType: 'json',
          crossDomain: true,
          success: _.bind(this._onContentTreeFetched, this),
          error: _.bind(this._onApiError, this)
        });
      }
    },

    _onContentTreeFetched: function(response) {
      var embed_code;
      var safe_response = OO.HM.safeObject("playbackControl.contentTree", response, {});

      this._contentAjax = null;

      if (safe_response.errors && safe_response.errors.code == 0) {
        _.each(safe_response.content_tree, _.bind(function(value, embed_code){
          this.contentTree[embed_code] = safe_response.content_tree[embed_code];

        }, this));
      }

      var supportedContentType = ["Video", "VideoAd", "LiveStream", "Channel", "MultiChannel"];
      if (this.contentTree[this.currentEmbedCode]) {
        var hostedAtURL = safe_response.content_tree[this.currentEmbedCode].hostedAtURL;
        if (hostedAtURL == "" || hostedAtURL == null) {
          safe_response.content_tree[this.currentEmbedCode].hostedAtURL = document.URL;
        }

        var contentIsSupportedInHtml5 = supportedContentType.indexOf(this.contentTree[this.currentEmbedCode].content_type) >= 0;
        if (contentIsSupportedInHtml5) {
          this.mb.publish(OO.EVENTS.CONTENT_TREE_FETCHED, this.contentTree[this.currentEmbedCode], this.currentEmbedCode);
        } else {
          this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.CONTENT_TREE });
        }
      } else {
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.UNPLAYABLE_CONTENT });
      }
    },


    /*
     *  Metadata
     */
    onWillFetchMetadata: function(event, request) {
      // send the metadata request
      if (typeof this.metadata[this.currentEmbedCode] != "undefined") {
        this.mb.publish(OO.EVENTS.METADATA_FETCHED, this.metadata[this.currentEmbedCode]);
      } else {
        this._metadataAjax = $.ajax({
          url: OO.URLS.METADATA(request) + "&" + $.param(request.params),
          type: 'GET',
          dataType: 'json',
          crossDomain: true,
          success: _.bind(this._onMetadataFetched, this),
          error: _.bind(this._onApiError, this)
        });
      }
    },

    _onMetadataFetched: function(response) {
      this.metadata = this.metadata || {};
      var safeResponse = OO.HM.safeObject("api.metadata", response, {});
      this._metadataAjax = null;

      if (safeResponse.errors && safeResponse.errors.code == 0) {
        _.each(safeResponse.metadata, _.bind(function(value, embedCode){
          this.metadata[embedCode] = safeResponse.metadata[embedCode];

          // allow to override module params from player params
          this.metadata[embedCode].modules = this.metadata[embedCode].modules || {};
          this.metadata[embedCode].modules = _.extend(this.metadata[embedCode].modules, this.params.modules || {});
        }, this));
      }
      this.mb.publish(OO.EVENTS.METADATA_FETCHED, this.metadata[this.currentEmbedCode] || {});

      if (safeResponse.errors && safeResponse.errors.player_movie_mismatch &&
        typeof(window.console) != "undefined" && typeof(window.console.log) == "function") {
          console.log("WARNING: Player and movie providers do not match");
      }
    },

    /*
     *  SAS
     */
    onWillFetchAuthorization: function(event, request) {
      if (this.sasResponse[this.currentEmbedCode] && this.sasResponse[this.currentEmbedCode].code == 0) {
        this.mb.publish(OO.EVENTS.AUTHORIZATION_FETCHED, this.sasResponse[this.currentEmbedCode]);
      } else {
        //add additional params for SAS
        this._sendSasRequest(request, _.bind(this._onAuthorizationFetched, this), _.bind(this._onApiError, this));
      }
    },

    _onAuthorizationFetched: function(response) {
      var code, codes;
      this._sasAjax = null;

      var safe_response = OO.HM.safeObject("playbackControl.sasResponse", response, {});

      //save auth token
      if (safe_response.auth_token) {
        OO.setItem("oo_auth_token", safe_response.auth_token);
        this.authToken = safe_response.auth_token;
      } else {
        OO.localStorage.removeItem("oo_auth_token");
        this.authToken = null;
      }

      _.each(safe_response.authorization_data, _.bind(function(value, embed_code){
        this.sasResponse[embed_code] = safe_response.authorization_data[embed_code];
        if (safe_response.debug_data) {
          this.sasResponse[embed_code].debug_data = safe_response.debug_data;
        }
        if (safe_response.user_info) {
          this.sasResponse[embed_code].user_info = safe_response.user_info;
        }
        if (safe_response.auth_token) {
          this.sasResponse[embed_code].auth_token = safe_response.auth_token;
        }
        if (safe_response.heartbeat_data) {
          this.sasResponse[embed_code].heartbeat_data = safe_response.heartbeat_data;
        }
      }, this));
      code = this.sasResponse[this.currentEmbedCode].code;

      // Always publish the Authorization Response for Flash and only publish this on success for HTML5
      if (code == 0) {
        this.mb.publish(OO.EVENTS.AUTHORIZATION_FETCHED, this.sasResponse[this.currentEmbedCode]);
        return;
      }
      if (!_.isString(code)) {
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.SAS.GENERIC });
        return;
      }
      codes = code.split(',');
      if (_.contains(codes, '2')) {
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.SAS.DOMAIN });
      } else if (_.contains(codes, '3')) {
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.SAS.GEO });
      } else if (_.contains(codes, '4')) {
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.SAS.FUTURE });
      } else if (_.contains(codes, '5')) {
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.SAS.PAST });
      } else if (_.contains(codes, '13')) {
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.SAS.DEVICE });
      } else if (_.contains(codes, '18')) {
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.SAS.CONCURRENT_STREAMS });
      } else if (_.contains(codes, '24')) {
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.SAS.PROXY });
      } else {
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.SAS.GENERIC });
      }
    },

    onWillFetchAdAuthorization: function(event, request) {
      this._sendSasRequest(request, _.bind(this._onAdAuthorizationFetched, this));
    },

    _onAdAuthorizationFetched: function(response) {
      var safe_response = OO.HM.safeObject("playbackControl.sasResponse", response, {});

      var ooyalaAds = {};
      _.each(safe_response.authorization_data, _.bind(function(value, embed_code){
        ooyalaAds[embed_code] = safe_response.authorization_data[embed_code];
      }, this));

      this.mb.publish(OO.EVENTS.AD_AUTHORIZATION_FETCHED, ooyalaAds);
    },

    _sendSasRequest: function(request, callback, errorback) {
      var profiles = OO.supportedVideoProfiles,
      device = OO.device;

      $.extend(request.params, { device: device, domain:OO.docDomain});
      if (profiles) {
       $.extend(request.params, {profiles:profiles}); // set profiles if any
      }
      if (this.authToken) {
        $.extend(request.params, { auth_token: this.authToken });
      }

      this._sasAjax = $.ajax({
        url: OO.URLS.SAS(request) + "?" + $.param(request.params),
        type: 'GET',
        dataType: 'json',
        xhrFields: {
          withCredentials: true
        },
        crossDomain: true,
        success: callback,
        error: errorback
      });
    },

    _abort: function(ajax) {
      if (!ajax) { return; }
      this._aborting = true;
      ajax.abort();
      this._aborting = false;
    },

    _onApiError: function(xhr, status, error) {
      if (this._aborting) { return; }

      OO.d(error, status, xhr);
      this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.API.NETWORK, xhrStatus : status });
    },

    __placeholder: true
  });

  OO.registerModule('api', function(messageBus, id, params) {
    return new ApiModule(messageBus, id, params);
  });
}(OO, OO._, OO.$));

OO.plugin("Channels", function(OO, _, $, W) {

  /*
   * Channel Module:  Intercept all CONTENT_TREE_FETCHED events.
   *   If the player is a flash player, and channels are enabled, play the flash player v2 style
   *   If the player is a flash player, and channels are disabled, publish an error
   *   If the player is html5 and channels are enabled, play the first video of the channel
   *   If the player is html5 and channels are disabled, publish an error
   */
  var Channels = function(mb, id) {
    this.id = id;
    this.mb = mb;
    this.channel_tree = null;
    this.channel_pos = -1;
    this.replay = false;

    OO.StateMachine.create({
      initial:'Init',
      messageBus:this.mb,
      moduleName:'Channels',
      target:this,
      events:[
        {name:OO.EVENTS.PLAYER_CREATED, from:'*'}
      ]
    });
  };

  _.extend(Channels.prototype, {
    onPlayerCreated: function(event, elementId, params) {
      this.enableChannels = params.enableChannels || OO.playerParams.enableChannels || false;
      this.mb.intercept(OO.EVENTS.CONTENT_TREE_FETCHED, "channels",
        _.bind(this._checkTreeForChannel, this));
    },

    _checkTreeForChannel: function(eventName, tree) {
      var supportedContentType = ["Channel", "MultiChannel"];

      //if i get a tree from V3, it will have contenttype
      if (tree && (supportedContentType.indexOf(tree.content_type) >= 0 || tree.lineup)) {
        if (this.enableChannels) {
          //if this is a html5 player, take first child's embed code
          if (OO.requiredInEnvironment('html5-playback') || OO.requiredInEnvironment('cast-playback')) {
            if(!tree.children) {
              if(tree.content_type == 'Channel') {
                this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.EMPTY_CHANNEL });
              } else {
                this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.EMPTY_CHANNEL_SET });
              }
              return false;
            }
            this.channel_tree = tree;
            this.channel_pos = 0;
            this.mb.subscribe(OO.EVENTS.PLAYED, 'channels', _.bind(this.onPlayed, this));
            this.mb.subscribe(OO.EVENTS.PLAYBACK_READY, 'channels', _.bind(this.onPlaybackReady, this));
            this.mb.publish(OO.EVENTS.SET_EMBED_CODE, tree.children[0].embed_code);
          }
          return false;
        }

        //If this is a channel, and channels are not enabled, error out
        this.mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.CHANNEL_CONTENT });
        return false;
      }

      return [tree];
    },


    onPlayed: function(event) {
      this.channel_pos++;

      //Every time a video is played, set the embed code to the next video.
      if(this.channel_tree.children[this.channel_pos]) {
        this.mb.publish(OO.EVENTS.SET_EMBED_CODE, this.channel_tree.children[this.channel_pos].embed_code);
      }

      //If we played the last video, reset to the first video
      else {
        this.channel_pos = 0;
        this.mb.publish(OO.EVENTS.SET_EMBED_CODE, this.channel_tree.children[0].embed_code);
      }
    },

    //Every time the video is loaded (other than first), autoplay
    onPlaybackReady: function(event) {
      if(this.channel_pos > 0) {
        this.mb.publish(OO.EVENTS.PLAY);
      }
    }
  });

  // Return class definition.
  return Channels;
});
OO.plugin("ExternalId", function(OO, _, $, W) {

  /*
   * Channel Module:  Intercept all CONTENT_TREE_FETCHED events.
   *   If the player is a flash player, and ExternalId are enabled, play the flash player v2 style
   *   If the player is a flash player, and ExternalId are disabled, publish an error
   *   If the player is html5 and ExternalId are enabled, play the first video of the channel
   *   If the player is html5 and ExternalId are disabled, publish an error
   */
  var ExternalId = function(mb, id) {
    this.id = id;
    this.mb = mb;

    this.mb.intercept(OO.EVENTS.SET_EMBED_CODE, "ExternalId", _.bind(this._checkExternalId, this));
  };

  _.extend(ExternalId.prototype, {
    /*
     *  External ID lookup
     */
     _checkExternalId: function(event, embedCode, options) {
       var externalId = embedCode.match("^extId:(.*)");
       if (externalId && externalId[1]) {
         this.externalId = externalId[1];
         this.options = options || {};
         this._fetchExternalId({
           externalId: this.externalId,
           pcode: OO.playerParams.pcode || "1kNG061cgaoolOncv54OAO1ceO-I",
           server: OO.SERVER.API
         });
         return false;
       }
       return [embedCode, options];
     },

    _fetchExternalId: function(request) {
      this._contentAjax = $.ajax({
        url: OO.URLS.EXTERNAL_ID(request),
        type: 'GET',
        dataType: 'json',
        crossDomain: true,
        cache:false,
        success: _.bind(this._onExternalIdFetched, this),
        error: _.bind(this._onExternalIdError, this)
      });
    },

    _onExternalIdFetched: function(response) {
      var embedCode = null;
      var safe_response = OO.HM.safeObject("playbackControl.contentTree", response, {});

      if (safe_response.errors && safe_response.errors.code == 0) {
        _.each(safe_response.content_tree, _.bind(function(value, ec){
          if (value["external_id"] === this.externalId) {
            embedCode = ec;
          }
        }, this));
      }

      // save the external Id in the option hash (in case it's needed for analytics and such)
      _.extend(this.options, {"originalId" : this.externalId});

      if (embedCode) {
        this.mb.publish(OO.EVENTS.SET_EMBED_CODE, embedCode, this.options);
      } else {
        this.mb.publish(OO.EVENTS.ERROR, { code: OO.ERROR.INVALID_EXTERNAL_ID });
      }
    },

    _onExternalIdError: function(response) {
      this.mb.publish(OO.EVENTS.ERROR, { code: OO.ERROR.INVALID_EXTERNAL_ID });
    }
  });

  // Return class definition.
  return ExternalId;
});

(function(OO, _, $){

  var AuthHeartbeat = function(messageBus, id) {
    if (!OO.requiredInEnvironment('html5-playback')) { return; }
    this.mb = messageBus;
    this.id = id;

    this.embedCode = null;
    this.authToken = null;
    this.heartbeatInterval = 300;  // in sec
    this.timer = null;
    this.retries = 3;

    //internal constants
    this.AUTH_HEARTBEAT_URL = _.template('<%=server%>/player_api/v1/auth_heartbeat/pcode/<%=pcode%>/auth_token/<%=authToken%>?embed_code=<%=embedCode%>');

    //listeners
    this.mb.subscribe(OO.EVENTS.EMBED_CODE_CHANGED, 'auth_heartbeat', _.bind(this._onEmbedCodeChanged, this));
    this.mb.subscribe(OO.EVENTS.AUTHORIZATION_FETCHED, 'auth_heartbeat', _.bind(this._onAuthorizationFetched, this));
  };

  _.extend(AuthHeartbeat.prototype, {
    _onEmbedCodeChanged: function(event, embedCode) {
      this.embedCode = embedCode;
      if (this.timer) {
        clearInterval(this.timer);
      }
      if (this.ajax) {
        this.ajax.error = null;
        this.ajax.abort();
        this.ajax = null;
      }
      this.retries = 3;
    },

    _onAuthorizationFetched: function(event, authResponse) {
      if (authResponse.heartbeat_data && authResponse.heartbeat_data.heartbeat_interval) {
        this.heartbeatInterval = authResponse.heartbeat_data.heartbeat_interval;
      }
      if (authResponse.auth_token) {
        this.authToken = authResponse.auth_token;
      }
      if (authResponse.require_heartbeat === true) {
        this.timer = setInterval(_.bind(this._onTimerTick, this), this.heartbeatInterval * 1000);
        this._onTimerTick(); //Fire first heartbeat NOW.
      }
    },

    _onTimerTick: function() {
      //send heartbeat
      this.ajax = $.ajax({
        url: this.AUTH_HEARTBEAT_URL({
          server: OO.SERVER.AUTH,
          pcode: OO.playerParams.pcode || "unknown",
          authToken: this.authToken || "",
          embedCode: this.embedCode || ""
        }),
        type: 'GET',
        dataType: 'json',
        crossDomain: true,
        cache: false,
        success: _.bind(this._onHeartbeatResponse, this),
        error: _.bind(this._onHeartbeatErrorResponse, this)
      });
    },

    _onHeartbeatResponse: function(response) {
      this.ajax = null;
      if (!response.message || response.message != "OK" || !response.signature) {
        this._onHeartbeatError(OO.ERROR.API.SAS.INVALID_HEARTBEAT);
      }
      else if (!response.expires || response.expires < new Date().getTime()/1000) {
        this._onHeartbeatError(OO.ERROR.API.SAS.INVALID_HEARTBEAT);
      }
      else {
        this.retries = 3;
        if (response.auth_token != null) {
          this.authToken = response.auth_token;
          OO.setItem("oo_auth_token", response.auth_token);
        }
      }
    },

    _onHeartbeatErrorResponse: function(response) {
      this.ajax = null;
      if (response && response.responseText && response.responseText.indexOf("Invalid entitlements") > -1) {
        this._onHeartbeatError(OO.ERROR.API.SAS.ERROR_INVALID_ENTITLEMENTS);
      } else {
        this._onHeartbeatError(OO.ERROR.API.SAS.CONCURRENT_STREAMS);
      }
    },

    _onHeartbeatError: function(errorMessage) {
      this.ajax = null;
      this.retries--;

      if (this.retries > 0) {
        this._onTimerTick();
        return;
      }

      if (this.timer) {
        clearInterval(this.timer);
      }
      this.mb.publish(OO.EVENTS.ERROR, { code: errorMessage });
    }
  });

  OO.registerModule('auth_heartbeat', function(messageBus, id) {
    return new AuthHeartbeat(messageBus, id);
  });

}(OO, OO._, OO.$));

/*
 * Ad Manager Controller
 *
 * owner: PBI
 * version: 1.0
 *
 */

(function(OO, _, $){
  OO.EVENTS.AMC_ALL_ADS_DONE               = 'adManagerControllerAllAdsDone';
  OO.EVENTS.AMC_PREROLLS_DONE              = 'adManagerControllerPrerollsDone';
  OO.EVENTS.AMC_ALL_READY                  = 'adManagerControllerAllReady';
 /**
  * A set of ads from an ad manager has started. This may be followed by multiple WILL_PLAY_SINGLE_AD/SINGLE_AD_PLAYED events.
  *
  *
  * @event OO.EVENTS#AD_POD_STARTED
  */
  OO.EVENTS.AD_POD_STARTED                 = 'adPodStarted';
 /**
  * A set of ads from an ad manager has ended.
  *
  *
  * @event OO.EVENTS#AD_POD_ENDED
  */
  OO.EVENTS.AD_POD_ENDED                   = 'adPodEnded';
 /**
  * A nonlinear ad has finished playing.
  *
  *
  * @event OO.EVENTS#NONLINEAR_AD_PLAYED
  */
  OO.EVENTS.NONLINEAR_AD_PLAYED            = 'nonlinearAdPlayed';
 /**
  * A nonlinear ad will be hidden. This will not count against the clock timer determining how long the ad will be shown.
  *
  *
  * @event OO.EVENTS#HIDE_NONLINEAR_AD
  */
  OO.EVENTS.HIDE_NONLINEAR_AD              = 'hideNonlinearAd';
 /**
  * A hidden nonlinear ad will be shown.
  *
  *
  * @event OO.EVENTS#SHOW_NONLINEAR_AD
  */
  OO.EVENTS.SHOW_NONLINEAR_AD              = 'showNonlinearAd';
 /**
  * A nonlinear ad will now display a close button.
  *
  *
  * @event OO.EVENTS#SHOW_NONLINEAR_AD_CLOSE_BUTTON
  */
  OO.EVENTS.SHOW_NONLINEAR_AD_CLOSE_BUTTON = 'showNonlinearAdCloseButton';
 /**
  * A nonlinear ad was loaded in the UI.
  *
  *
  * @event OO.EVENTS#NONLINEAR_AD_DISPLAYED
  */
  OO.EVENTS.NONLINEAR_AD_DISPLAYED         = 'nonlinearAdDisplayed';
 /**
  * An individual ad manager is taking control of the session to play an ad. This only happens when an ad manager controls its own timeline.
  *
  *
  * @event OO.EVENTS#AD_MANAGER_HANDLED_ADS
  */
  OO.EVENTS.AD_MANAGER_HANDLED_ADS         = 'adManagerHandledAds';
 /**
  * A linear ad can now enable or display a skip button.
  *
  *
  * @event OO.EVENTS#SHOW_AD_SKIP_BUTTON
  */
  OO.EVENTS.SHOW_AD_SKIP_BUTTON            = 'showAdSkipButton';

  /**
   * Event for signaling Ad Controls (Scrubber bar and Control bar) rendering:
   *   <ul>
   *     <li>Boolean parameter, 'false' to not show ad controls, 'true' to show ad controls based on skin config</li>
   *   </ul>
   *
   *
   * @event OO.EVENTS#SHOW_AD_CONTROLS
   */
  OO.EVENTS.SHOW_AD_CONTROLS                = 'showAdControls';

  /**
   * Event for signaling Ad Marquee rendering:
   *   <ul>
   *     <li>Boolean parameter, 'false' to not show ad marquee, 'true' to show ad marquee based on skin config</li>
   *   </ul>
   *
   *
   * @event OO.EVENTS#SHOW_AD_MARQUEE
   */
  OO.EVENTS.SHOW_AD_MARQUEE                = 'showAdMarquee';

  /**
   * Event for signaling that an Ad Clickthrough URL has opened a new window.
   *
   * @event OO.EVENTS#ADS_CLICKTHROUGH_OPENED
   */
  OO.EVENTS.ADS_CLICKTHROUGH_OPENED        = 'adsClickthroughOpened';

  // Timeouts
  var MAX_AD_MANAGER_LOAD_TIMEOUT = 3000;
  var MAX_AD_LOAD_TIMEOUT = 5000;
  var MAX_VIDEO_RELOAD_TIMEOUT = 2000;
  var DEFAULT_VIDEO_SKIP_BUTTON_TIME = 5;

  // Maximum duration for ad request before timeout
  var MAX_AD_REQUEST_TIMEOUT = 2000;

  /**
   * The list of registered ad managers.
   *   key: ad manager name (the name property of the ad manager object)
   *   value: ad manager (object)
   * @private
   */
  var adManagerFactories = {};

  // Settings to store in adManagerSettings.  These could come from the page or the server.
  var SETTINGS = {
    PAUSE_AD_ON_CLICK: "pauseAdOnClick",
    AD_LOAD_TIMEOUT: "adLoadTimeout",
    DISPLAY_CUE_POINTS: "displayCuePointMarkers",
    REPLAY_ADS: "replayAds",
    SHOW_NONLINEAR_CLOSE_BUTTON: "showNonLinearCloseButton",
    SHOW_LINEAR_AD_SKIP_BUTTON: "showLinearAdSkipButton",
    LINEAR_AD_SKIP_BUTTON_START_TIME: "linearAdSkipButtonStartTime",
    ALLOW_AD_CLICK_THROUGH_ON_VIDEO: "allowAdClickThroughOnVideo"
  };

  /**
   * This array is used to keep a list of all ad managers that were unregistered before the controller was
   * setup. The controller will use this list to raise an event for each unregistered ad manager.
   * @private
   * @type {Array}
   */
  var unregisteredAdManagerFactories = [];

  /**
   * @class OO.Ads
   * @classdesc Enables you to register, verify, and unregister ad managers within the Ooyala player.
   * The related ad manager events are not processed on the standard message bus.
   * @public
   */
  OO.Ads = {
    /**
     * Registers a new ad manager factory. The factory will be used to instantiate ad managers
     * when the player is created. The format of the resulting ad manager is validated and the
     * ad manager factory is only registered if the ad manager defines the required functions and properties.
     * @public
     * @method OO.Ads#manager
     * @param {object} adManagerFactory The ad manager factory function to register
     */
    manager: function(adManagerFactory) {
      if (typeof adManagerFactory == 'function') {
        //validate the resulting ad manager
        var adManager = adManagerFactory.apply({}, [_, $]);
        if (OO.Ads.validateAdManager(adManager)) {
          OO.log("AMC: Registering ad manager factory: " + adManager.name);
          adManagerFactories[adManager.name] = adManagerFactory;
        }
      }
    },

    /**
     * Unregisters an ad manager factory.
     * @public
     * @method OO.Ads#unregisterAdManager
     * @memberOf OO.Ads
     * @param {string} name The name of the ad manager factory to unregister, traditionally represented by
     *                      the resulting ad manager instance adManager.name
     */
    unregisterAdManager: function(name) {
      OO.log("AMC: Removing an ad manager factory: " + name);
      if (name && adManagerFactories[name]) {
        unregisteredAdManagerFactories.push(name);
        delete adManagerFactories[name];
      }
    },

    /**
     * Validates the format of an ad manager and checks if the ad manager is already registered.<br/>
     * The ad manager must define the following functions:<br/>
     * <ul><li>initialize</li>
     *     <li>buildTimeline</li>
     *     <li>playAd</li>
     *     <li>cancelAd</li> </ul>
     * The ad manager must define the following properties:
     * <ul><li>name (string)</li>
     *     <li>ready (boolean)</li></ul>
     * @public
     * @method validateAdManager
     * @memberOf OO.Ads
     * @instance
     * @param {object} adManager The ad manager object
     * @returns {boolean} <code>true</code> if the ad manager meets the template requirements, <code>false</code> otherwise.
     */
    validateAdManager: function(adManager) {
      var properties = {"name":"string", "ready":"boolean"};
      var functions = ["initialize", "buildTimeline", "playAd", "cancelAd"];

      function raiseValidationError(errorString) {
        OO.log("AMC: " + errorString);
        // TODO - raise real error
        //mb.publish(OO.EVENTS.ERROR, { code : OO.ERROR.NEW_CODE });
      }

      function checkForProperty(propertyName, propertyType, managerName) {
        if (!_.has(adManager, propertyName)) {
          raiseValidationError("The ad manager '" + managerName + "' requires a '" + propertyName +
                               "' property");
          return false;
        }
        if (typeof adManager[propertyName] != propertyType) {
          raiseValidationError("The ad manager '" + managerName + "' property '" + propertyName +
                               "' should be type '" + propertyType + "'");
          return false;
        }
        return true;
      }

      function checkForFunction(functionName, managerName) {
        if (!_.isFunction(adManager[functionName])) {
          raiseValidationError("The ad manager '" + managerName + "' requires a '" + functionName +
                               "' function");
          return false;
        }
        return true;
      }

      if (!adManager) { raiseValidationError(" The ad manager must be defined"); return false;}
      if (!_.isObject(adManager)) { raiseValidationError("The ad manager must be an object"); return false;}
      for (var key in properties) {
        if (!checkForProperty(key, properties[key], adManager.name)) return false;
      }
      for (var x = 0; x < functions.length; x++) {
        if (!checkForFunction(functions[x], adManager.name)) return false;
      }
      if (adManagerFactories[adManager.name]) {
        raiseValidationError("The ad manager '" + adManager.name + "' has already been registered");
        return false;
      }

      return true;
    },

    /**
     * Returns the names of ad managers that were registered but have been unregistered.
     * This is used in testing.
     * @method OO.Ads#getUnregisteredAdManagers
     * @public
     * @returns {string[]} A list of all ad managers that have been unregistered.
     */
    getUnregisteredAdManagers: function() { return unregisteredAdManagerFactories; }
  };

  OO.exposeStaticApi('Ads', OO.Ads);

  /**
   * @class AdManagerInterface
   * @classdesc
   * Exposes certain parts of the Ad Manager Controller (AMC) to ad managers.  This acts as a layer through
   * which the ad manager can interact with the ad manager controller.
   * @private
   */
  var AdManagerInterface = function() {
    // List of properties and functions to expose
    var exposedProperties = ["EVENTS", "ADTYPE", "AD_CANCEL_CODE", "AD_SETTINGS", "MAX_AD_REQUEST_TIMEOUT", "Ad", "ui",
        "platform", "adManagerSettings", "playerSettings", "backlotSettings", "pageSettings",
        "currentEmbedCode", "movieMetadata", "startTime", "movieDuration", "isLiveStream"];
    var exposedFunctions =  ["updateMainStreamUrl","playAd", "addPlayerListener", "removePlayerListener", "loadAdModule",
        "onAdManagerReady", "removeAdManager", "adsClicked", "raiseAdError", "appendToTimeline",
        "showCompanion", "forceAdToPlay", "adManagerWillControlAds", "adsClickthroughOpened",
        "adManagerDoneControllingAds", "notifyPodStarted", "notifyPodEnded", "notifyLinearAdStarted",
        "notifyLinearAdEnded", "notifyNonlinearAdStarted", "notifyNonlinearAdEnded", "hidePlayerUi", "isLastAdPlayed",
        "sendURLToLoadAndPlayNonLinearAd", "showSkipVideoAdButton", "focusAdVideo", "getRegisteredAdManagers", "unregisterAdManager"];

    var exposed = _.union(exposedProperties, exposedFunctions);

    for (var i = 0; i < exposed.length; i++) {
      if (_.isFunction(controller[exposed[i]])) {
        // exposes functions bound to the correct instance
        this[exposed[i]] = _.bind(controller[exposed[i]], controller);
      } else {
        // exposes properties bound to the correct instance
        var getter = _.bind(function(key) {
            return this[key];
          }, controller, exposed[i]);
        Object.defineProperty(this, exposed[i], { get:getter });
      }
    }
  };

  /**
   * @class AdManagerControllerPlatform
   * @classdesc Exposes information about the device platform as defined by the Ooyala player.
   * @public
   * @property {string} platform The device platform.
   * @property {string} os The device operating system.
   * @property {boolean} isIos <code>true</code> if the OS is iOS, <code>false</code> otherwise.
   * @property {string} iosMajorVersion The iOS version if applicable.
   * @property {boolean} isAndroid4Plus <code>true</code> if the OS is Android 4.0 or above, <code>false</code> otherwise.
   * @property {boolean} isFirefox <code>true</code> if the browser is Firefox, <code>false</code> otherwise.
   * @property {boolean} isChrome <code>true</code> if the browser is Chrome, <code>false</code> otherwise.
   * @property {string} chromeMajorVersion The browser version if the browser is Chrome
   * @property {boolean} isIE <code>true</code> if the browser is Internet Explorer, <code>false</code> otherwise.
   * @property {boolean} isIE11Plus <code>true</code> if the browser version is IE 11.0 or above
   * @property {boolean} isMacOs <code>true</code> if the OS is desktop Mac OS, <code>false</code> otherwise.
   * @property {boolean} isMacOsLionOrLater <code>true</code> if the OS version is Mac OS Lion or later, <code>false</code> otherwise.
   * @property {boolean} isKindleHD <code>true</code> if the device is Kindle HD, <code>false</code> otherwise.
   * @property {boolean} isSSL <code>true</code> if SSL is being used, <code>false</code> otherwise.
   * @property {string} device Device information
   * @property {boolean} isIphone <code>true</code> if the device is an iPhone, <code>false</code> otherwise.
   * @property {boolean} isIpad <code>true</code> if the device is an iPad, <code>false</code> otherwise.
   * @property {boolean} isAndroid <code>true</code> if the OS is Android OS, <code>false</code> otherwise.
   * @property {boolean} isRimDevice <code>true</code> if the device is Rim device, <code>false</code> otherwise.
   * @property {boolean} isWinPhone <code>true</code> if the device is a Windows Phone, <code>false</code> otherwise.
   * @property {boolean} isSmartTV <code>true</code> if the device is a SmartTV, <code>false</code> otherwise.
   * @property {boolean} DEV <code>true</code> if running in debug mode, <code>false</code> otherwise.
   */
  var AdManagerControllerPlatform = function() {
    this.requiredInEnvironment = OO.requiredInEnvironment;
    /**
     * The list of properties in OO that should be exposed to ad managers.
     * @private
     */
    var platform_params = ["platform", "os", "isIos", "iosMajorVersion", "isAndroid4Plus", "isFirefox",
      "isChrome", "chromeMajorVersion", "isIE", "isIE11Plus", "isMacOs", "isMacOsLionOrLater", "isKindleHD",
      "isSSL", "device", "isIphone", "isIpad", "isAndroid", "isRimDevice", "isWinPhone",
      "isSmartTV", "DEV"];

    for (var i = 0; i < platform_params.length; i++) {
      this[platform_params[i]] = OO[platform_params[i]];
    }
  };

  /**
   * @class AdManagerControllerUi
   * @classdesc
   * Handles the display of video ads, ad marquee, and controls.
   * Exposes information about the UI as defined by the Ooyala player.
   * All elements are jQuery elements.  To access the DOM element, append <code>[0]</code>.
   * These values are only ready once <code>{adManager}.registerUi</code> is called.
   * @public
   * @property {boolean} useSingleVideoElement <code>true</code> if a single video element is used for both the ad and the
   *                                           content video, <code>false</code> otherwise.
   * @property {object} rootElement The root html element of the Ooyala player.
   * @property {object} videoWrapper The parent element to the content video element.
   * @property {object} playerSkinVideoWrapper The skin-integrated parent element to the content video element.
   *                                           Currently the same as videoWrapper.
   * @property {object} ooyalaVideoElement The content video element.
   * @property {object} adVideoElement The ad video element.  Sometimes this is the same as the content video
   *                                   element.
   * @property {object} adWrapper The parent element for plugin elements.
   * @property {object} pluginsElement The element to house ad video and ad UI
   * @property {object} playerSkinPluginsElement The skin-integrated element to house ad video and ad UI
   * @property {number} height The player height.
   * @property {number} width The player width.
   * @property {object} uiParameters Contains parameters (videoWrapperClass and pluginsClass) required to setup the UI
   * @param {object} messageBus The player message bus
   * @param {object} settings Ad playback settings (e.g. showAdMarquee)
   * @param {object} registeredAdManagers A reference to the registered ad managers
   */
  var AdManagerControllerUi = function(messageBus, settings, registeredAdManagers) {
    var mb = messageBus;
    var adManagers = registeredAdManagers;

    // Page Elements
    this.elementId             = null;
    this.useSingleVideoElement = false;
    this.rootElement           = null;
    this.videoWrapper          = null;
    this.playerSkinVideoWrapper = null;
    this.ooyalaVideoElement    = null;
    this.adVideoElement        = null;
    this.adWrapper             = null;
    this.pluginsElement        = null;
    this.playerSkinPluginsElement = null;
    this.height                = null;
    this.width                 = null;
    this.uiParameters          = {};
    this.aliceUiParameters     = {};
    var elementInFocus         = null;

    var _init = _.bind(function() {
      this.useSingleVideoElement = OO.requiresSingleVideoElement;

      mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, 'amcUi', _videoElementCreated);
      mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_DISPOSED, 'amcUi', _videoElementDisposed);
      mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_IN_FOCUS, 'amcUi', _videoElementInFocus);
      mb.subscribe(OO.EVENTS.EMBED_CODE_CHANGED, 'amcUi', _embedCodeChanged);
    }, this);

    /**
     * Destroys the UI class.
     * @protected
     * @method AdManagerControllerUi#destroy
     */
    this.destroy = function() {
      _disposeElements();
      mb.unsubscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, 'amcUi');
      mb.unsubscribe(OO.EVENTS.VC_VIDEO_ELEMENT_IN_FOCUS, 'amcUi');
      mb.unsubscribe(OO.EVENTS.VC_VIDEO_ELEMENT_DISPOSED, 'amcUi');
      mb.unsubscribe(OO.EVENTS.EMBED_CODE_CHANGED, 'amcUi');
    };

    /**
     * Generates an unused element id by taking in a base id and appending
     * a random string to the end of it if necessary.
     * @private
     * @param {string} baseId  the base id to use
     * @returns {string}
     */
    var _generateUniqueElementId = function(baseId) {
      var generatedId = baseId;
      while (document.getElementById(generatedId)) {
        generatedId = baseId + "-" + OO.getRandomString();
      }
      return generatedId;
    };

    /**
     * Sets the element properties and creates ad elements.
     * @protected
     * @method AdManagerControllerUi#setupUiElements
     */
    this.setupUiElements = function() {
      var uiParams = this.uiParameters;
      //TODO: Should the ids for these elements be set by ChromelessUI?
      this.videoWrapper = this.rootElement.find("." + uiParams.videoWrapperClass);
      this.pluginsElement = this.videoWrapper.find("." + uiParams.pluginsClass);

      // TODO: Set this id somewhere else
      //When we have multiple players, we want our plugin div ids
      //to be unique for the instances where the plugin will search
      //for the div (like ad SDKs)
      this.pluginsElement.attr("id", _generateUniqueElementId("ooyala-plugins-element"));

      // TODO: Set this id somewhere else
      //When we have multiple players, we want our wrapper div ids
      //to be unique for the instances where the plugin will search
      //for the div (like ad SDKs)
      this.videoWrapper.attr("id", _generateUniqueElementId("ooyala-inner-wrapper"));

      //Alice UI params are used for ad plugins that need to interact with the Alice UI,
      //such as IMA.
      var aliceUiParams = this.aliceUiParameters;

      if (!_.isEmpty(aliceUiParams)) {
        this.playerSkinVideoWrapper = this.rootElement.find("." + aliceUiParams.videoWrapperClass);
        this.playerSkinPluginsElement = this.playerSkinVideoWrapper.find("." + aliceUiParams.pluginsClass);
        this.playerSkinPluginsElement.attr("id", _generateUniqueElementId("ooyala-plugins-element"));
        this.playerSkinVideoWrapper.attr("id", _generateUniqueElementId("ooyala-inner-wrapper"));
      }

      this.adWrapper = this.useSingleVideoElement ? this.videoWrapper : this.pluginsElement;
    };

    /**
     * Register the ui elements with the ad managers
     * @protected
     * @method AdManagerControllerUi#registerUi
     */
    this.registerUi = function() {
      for (var key in adManagers) {
        if (adManagers[key]) {
          _safeFunctionCall(adManagers[key], "registerUi", []);
        }
      }
    };

    /**
     * Sets up the UI elements for ad use and registers the UI elements with the ad managers.
     * @protected
     * @method AdManagerControllerUi#setupAndRegisterUi
     */
    this.setupAndRegisterUi = function() {
      this.setupUiElements();
      this.registerUi();

      // [PBW-1743] We need to create and "activate" the plugin video on a click so that we can control
      // it with JS later on mobile
      if (OO.isAndroid || OO.isIos) {
        _primeHtml5Video();
      }
    };

    /**
     * This function should be called page load.  It primes the player for HTML5 playback by
     * creating an ad video element before play is called.  This is required for platforms that only
     * allow video play on user interaction (such as Android and iOS).
     * @private
     */
    var _primeHtml5Video = _.bind(function() {
      OO.log("AMC: Prepping player with a video element on load");
      var streams = {};
      streams[OO.VIDEO.ENCODING.MP4] = "";

      // Get list of restrictions from registered ad managers
      var restrictionTech = null;
      var restrictionFeatures = [];
      for (var adManager in adManagers) {
        if (adManagers[adManager].videoRestrictions) {
          if (adManagers[adManager].videoRestrictions.technology) {
            restrictionTech = adManagers[adManager].videoRestrictions.technology;
          }
          if (adManagers[adManager].videoRestrictions.features) {
            for (var index in adManagers[adManager].videoRestrictions.features) {
              restrictionFeatures.push(adManagers[adManager].videoRestrictions.features[index]);
            }
          }
        }
      }

      restrictionFeatures = _.uniq(restrictionFeatures);
      this.createAdVideoElement(streams,
                                { "technology": restrictionTech,
                                  "features": restrictionFeatures });
    }, this);

    /**
     * Creates the adVideoElement.
     * @protected
     * @method AdManagerControllerUi#createAdVideoElement
     * @param {object} streamsDesired An object listing the stream urls and encoding types of the ads
     * @param {object} restrictions An object that lists restrictions the ad manager has on the video plugin
     *   used.  ex. {"technology":OO.VIDEO.TECHNOLOGY.HTML5, "features":[OO.VIDEO.FEATURE.VIDEO_OBJECT_OPEN]}
     * @fires OO.EVENTS.VC_CREATE_VIDEO_ELEMENT
     */
    this.createAdVideoElement = function(streamsDesired, restrictions) {
      var streams = {};
      for (var encoding in streamsDesired) {
        streams[encoding] = { url:streamsDesired[encoding] };
      }
      mb.publish(OO.EVENTS.VC_CREATE_VIDEO_ELEMENT, OO.VIDEO.ADS, streams, this.pluginsElement,
                 restrictions);
    };

    /**
     * Saves the video element if it was created successfully.
     * @private
     * @method AdManagerControllerUi#_videoElementCreated
     * @param {string} eventname The name of the event that triggered this callback
     * @param {object} elementParams The parameters of the element created including id, domId, parent,
     *                               video element, and supported encodings
     */
    var _videoElementCreated = _.bind(function(eventname, elementParams) {
      if (elementParams["videoId"] === OO.VIDEO.MAIN) {
        this.ooyalaVideoElement = elementParams["videoElement"];
        var streamUrl = elementParams["streamUrl"];
        // If single video element is required, registered the ui after the main video element has been created
        if (this.useSingleVideoElement) {
          //setup UI
          this.setupAndRegisterUi();
        }
      } else if (elementParams["videoId"] === OO.VIDEO.ADS) {
        this.adVideoElement =  elementParams["videoElement"];
        this.adWrapper = elementParams["parent"];
      }
    }, this);

    /**
     * Destroys any existing video elements associated with the AMF.
     * @private
     * @method AdManagerControllerUi#_disposeElements
     * @fires OO.EVENTS.VC_DISPOSE_VIDEO_ELEMENT
     */
    var _disposeElements = _.bind(function() {
      if (this.adVideoElement) {
        mb.publish(OO.EVENTS.VC_DISPOSE_VIDEO_ELEMENT, OO.VIDEO.ADS);
      }
    }, this);

    /**
     * Removes the ad video element from saved properties.
     * @private
     * @method AdManagerControllerUi#_videoElementDisposed
     * @param {string} eventname The name of the event that triggered this callback
     * @param {string} videoId The video tech id of the element disposed
     */
    var _videoElementDisposed = _.bind(function(eventname, videoId) {
      if (videoId === OO.VIDEO.ADS) {
        this.adVideoElement = null;
      }
    }, this);

    /**
     * Called when a video element is brought to focus.  Saves the focused element id.
     * @private
     * @method AdManagerControllerUi#_videoElementInFocus
     * @param {string} eventname The name of the event that triggered this callback
     * @param {string} videoId The video tech id of the element in focus
     */
    var _videoElementInFocus = _.bind(function(eventname, videoId) {
      elementInFocus = videoId;
      if (elementInFocus === OO.VIDEO.ADS) {
        for (var key in adManagers) {
          if (adManagers[key]) {
            _safeFunctionCall(adManagers[key], "adVideoFocused", []);
          }
        }
      }
    }, this);

    /**
     * Destroys any ad video elements when the content video is switched.
     * @private
     * @method AdManagerControllerUi#_embedCodeChanged
     */
    var _embedCodeChanged = _.bind(function() {
      _disposeElements();
    }, this);


    ////// UI Transition Functions //////

    /**
     * Retrieves whether or not the ad is in focus.
     * @protected
     * @method AdManagerControllerUi#isAdInFocus
     * @returns {boolean} true if ad is in focus, false otherwise
     */
    this.isAdInFocus = function() {
      return elementInFocus === OO.VIDEO.ADS;
    };

    /**
     * Transitions the UI from content video to ad.
     * @protected
     * @method AdManagerControllerUi#transitionToAd
     */
    this.transitionToAd = function() {
      mb.publish(OO.EVENTS.VC_FOCUS_VIDEO_ELEMENT, OO.VIDEO.ADS);
    };

    /**
     * Transitions the UI from ad video to content video.
     * @protected
     * @method AdManagerControllerUi#transitionToMainContent
     * @param {boolean} shouldResumeContent True if the player should resume the content after transitioning
     * @param {boolean} ended True if the stream has ended
     * @fires OO.EVENTS.PLAY
     */
    this.transitionToMainContent = function(shouldResumeContent, ended) {
      if (elementInFocus !== OO.VIDEO.MAIN) {
        mb.publish(OO.EVENTS.VC_FOCUS_VIDEO_ELEMENT, OO.VIDEO.MAIN);
      }

      if (shouldResumeContent && !ended) {
        mb.publish(OO.EVENTS.VC_PLAY, OO.VIDEO.MAIN);
      }
    };

    /**
     * Called when the ad manager controller initializes.  Raises SHOULD_DISPLAY_CUE_POINTS with true or false
     * depending on whether or not cue points should be displayed according to the metadata.
     * @fires OO.EVENTS.SHOULD_DISPLAY_CUE_POINTS
     */
    this.shouldDisplayCuePointMarkers = function() {
      mb.publish(OO.EVENTS.SHOULD_DISPLAY_CUE_POINTS, settings[SETTINGS.DISPLAY_CUE_POINTS]);
    };

    /**
     * Uses the timeline and movie duration to create a list of times in seconds at which to display cue points.
     * @param {Array} timeline The array of ads in the timeline
     * @param {int} duration The duration of the main content video in seconds
     * @fires OO.EVENTS.RESET_CUE_POINTS
     */
    this.resetCuePoints = function(timeline, duration) {
      // replace position>duration with duration
      var times = timeline.map(function(ad) {
                                 if (ad.position > duration) return duration;
                                 return ad.position;
                               }, this);
      mb.publish(OO.EVENTS.RESET_CUE_POINTS, times);
    };

    _init();
  };

  /**
   * @class AdManagerController
   * @classdesc The ad manager controller main class.  This class is registered as a module with the player.
   * @public
   * @property {object} adManagerSettings Ad settings used by the ad manager controller.
   * @property {object} playerSettings Ad settings specific to the player.
   * @property {object} backlotSettings Ad settings set in Backlot.
   * @property {object} pageSettings Ad settings set at the page level.
   * @property {object} ui The current instance of the <code>AdManagerControllerUi</code> class.
   * @property {object} platform The current instance of <code>AdManagerControllerPlatform</code> class.
   * @property {string} currentEmbedCode Code representing the current content video stream.
   * @property {object} movieMetadata Metadata for the content video stream.
   * @property {number} startTime The start position of the content video stream (seconds).
   * @property {number} movieDuration The duration of the content video stream (seconds).
   * @param {object} messageBus The player message bus.
   * @param {string} id The ID of the player module.
   */
  OO.AdManagerController = function(messageBus, id) {
    // Module Properties
    var moduleName       = 'adManagerController';
    var mb               = messageBus;
    // Indicates whether or not all registered ad managers are ready
    var allready         = false;  // TODO: This could get out of sync if an ad manager is loaded late
    // Listeners registered by the ad managers
    var managerListeners = {};
    // Indicates whether or not the ad manager controller has been initialized
    var initialized      = false;

    // Player/page Properties
    this.adManagerSettings    = {};
    this.playerSettings       = {};
    this.backlotSettings      = null;
    this.pageSettings         = null;
    var backlotSettingsRaised = null;
    var pageSettingsRaised    = null;
    var movieMetadataRaised   = null;

    // Movie Properties
    var lastEmbedCode     = "";
    this.currentEmbedCode = "";
    this.movieMetadata    = null;
    this.startTime        = -1;
    this.movieDuration    = -1;
    this.isLiveStream     = false;

    // Movie state Properties
    var currentPlayhead           = -1;
    var maxPlayhead               = -1;
    var timeline                  = [];
    var repeatAds                 = [];
    var adQueue                   = [];
    var skipAdsOnSeek             = false;
    var seekToEndThreshold        = 0;
    var lastAdIndex               = 0;
    var seeking                   = false;
    var seeked                    = false;
    var seekedPosition            = 0;
    var paused                    = false;
    var started                   = false;
    var startTriggered            = false;
    this.ended                    = false;
    this.waitForPostrollToPlay    = true;
    var adManagersControllingAds  = {};
    //This flag is used when initialTime (customization) is greater than 0.
    //This is to prevent ads prior to initialTime from triggering when
    //the initial time seek is slightly less (milliseconds) than the initial time.
    //This is mainly observed in iOS devices.
    var reachedStartTime          = false;
    var lastFullscreenState       = false;

    // This lets us know if a new stream is being loaded
    // This is needed so that don't call AMC_PREROLLS_DONE if an ad was playing and was cancelled
    // when a new stream was loaded.
    var newStreamHandling         = false;

    // UI Setup
    var uiSetup        = false;

    // Ad state Properties
    var overlay                   = false;
    var currentAd                 = null;
    var lastOverlayAd             = null;
    this.adStarted                = false;
    var adPaused                  = false;
    var cancelling                = false;
    var adTimeouts                = {};
    var skipButtonTimeout         = {};
    var adManagerShowSkipButton   = true;
    var adManagerSkipButtonOffset = null;
    var singleAdPlaying           = false;
    var pendingPodEnd             = false;

    // AMC modules
    this.ui        = null;
    this.platform  = null;
    this.interface = null;

    // AMC Ad Managers
    this.adManagers = {};
    this.unregisteredAdManagers = [];

    // Timeouts
    // OO.playerParams.maxAdsTimeout - TODO: see if this value is useful in the AMC
    this.MAX_AD_MODULE_LOAD_TIMEOUT  = 5000;
    this.MAX_AD_REQUEST_TIMEOUT = MAX_AD_REQUEST_TIMEOUT;

    // Unit test helper
    this.testMode = false;

    //Exposing settings from adManagerSettings. These are the options specified on the page or from the server.
    this.AD_SETTINGS = SETTINGS;

    /**
     * Events to which ad managers can subscribe. These events are not processed on the standard message bus.
     * @public
     * @field OO.AdManagerController#EVENTS
     * @example
     * var amc = new AdManagerController(mb, id);
     * amc.addPlayerListener(amc.EVENTS.INITIAL_PLAY_REQUESTED, callback);
     * @property {string} INITIAL_PLAY_REQUESTED Raised the first time playback is requested.
     * @property {string} REPLAY_REQUESTED Raised when a stream is replayed
     * @property {string} PLAY_STARTED Raised when the content video first begins to play
     * @property {string} PLAYHEAD_TIME_CHANGED Raised periodically during content playback, reporting the
     *                    current position and duration
     * @property {string} AD_PLAYHEAD_TIME_CHANGED Raised periodically during ad playback, reporting the
     *                    current position and duration
     * @property {string} PAUSE Raised when the content video is paused
     * @property {string} RESUME Raised when the content video is resumed
     * @property {string} CONTENT_COMPLETED Raised when the content video completes
     * @property {string} CONTENT_AND_ADS_COMPLETED Raised when the content video and all ads have completed playing
     * @property {string} SIZE_CHANGED Raised when the size of the player is changed
     * @property {string} CONTENT_CHANGED Raised when the content video is changed
     * @property {string} FULLSCREEN_CHANGED Raised when the player enters and exits fullscreen mode
     * @property {string} VOLUME_CHANGED Raised when the user requests a change in video volume
     * @property {string} AD_VOLUME_CHANGED Raised when the user requests a change in video volume against the
     *                    OO.VIDEO.ADS element
     * @property {string} MAIN_CONTENT_IN_FOCUS Raised when the main element has gained focus
     * @property {string} VIDEO_TAG_FOUND Raised when an embedded tag has been found in the video stream
     * @property {string} CONTENT_URL_CHANGED Raised when a url has been selected to stream from
     */
    this.EVENTS = {
      INITIAL_PLAY_REQUESTED :    "initialPlayRequested",
      REPLAY_REQUESTED :          "replayRequested",
      PLAY_STARTED :              "playStarted",
      PLAYHEAD_TIME_CHANGED :     "playheadTimeChanged",
      AD_PLAYHEAD_TIME_CHANGED :  "adPlayheadTimeChanged",
      PAUSE :                     "pause",
      RESUME :                    "resume",
      CONTENT_COMPLETED :         "contentCompleted",
      CONTENT_AND_ADS_COMPLETED : "contentAndAdsCompleted",
      SIZE_CHANGED :              "sizeChanged",
      CONTROLS_SHOWN :            "controlsShown",
      CONTROLS_HIDDEN :           "controlsHidden",
      CONTENT_CHANGED :           "contentChanged",
      FULLSCREEN_CHANGED :        "fullscreenChanged",
      VOLUME_CHANGED :            "volumeChanged",
      AD_VOLUME_CHANGED :         "adVolumeChanged",
      MAIN_CONTENT_IN_FOCUS :     "mainContentInFocus",
      VIDEO_TAG_FOUND :           "videoTagFound",
      CONTENT_URL_CHANGED :       "contentURLChanged"
    };

    /**
     * States used internally for passing into _checkTimeline function.
     * @private
     * @field OO.AdManagerController#STATES
     * @property {string} SEEKED The seeked state
     * @property {string} CONTENT_VIDEO_PLAYED The contentVideoPlayed state
     */
    var STATES = {
      SEEKED :                    "seeked",
      CONTENT_VIDEO_PLAYED :      "contentVideoPlayed"
    };

    /**
     * Defines possible ad types.
     * @public
     * @field OO.AdManagerController#ADTYPE
     * @example
     * var amc = new AdManagerController(mb, id);
     * var ad = new amc.Ad(position, duration, name, adObj, amc.ADTYPE.LINEAR_VIDEO);
     * @property {string} LINEAR_OVERLAY The type name for an ad that is not a video but requires the main
     *                                   video be paused.
     * @property {string} NONLINEAR_OVERLAY The type name for an ad that is not a video and does not require
     *                                      the main video be paused.
     * @property {string} LINEAR_VIDEO The type name for an ad that is a video and requires the main video be
     *                                 paused.
     * @property {string} COMPANION The type name for an ad that is a companion ad.
     * @property {string} AD_REQUEST The type name for an ad request.
     * @property {string} UNKNOWN_AD_REQUEST The type name for an unknown ad request.
     */
    this.ADTYPE = {
      LINEAR_OVERLAY : "linearOverlay",
      NONLINEAR_OVERLAY : "nonlinearOverlay",
      LINEAR_VIDEO : "linearVideo",
      COMPANION : "companion",
      AD_REQUEST: "adRequest",
      UNKNOWN_AD_REQUEST: "unknownAdRequest"
    };

    /**
     * Defines ad cancellation codes.
     * @public
     * @field OO.AdManagerController#AD_CANCEL_CODE
     * @property {string} SKIPPED The ad was skipped by the user via the skip ad button
     * @property {string} TIMEOUT The ad timed out
     * @property {string} ERROR The ad threw an error
     * @property {string} STREAM_ENDED The main video stream ended
     */
    this.AD_CANCEL_CODE = {
      SKIPPED : "skipped",
      TIMEOUT : "timeout",
      ERROR : "error",
      STREAM_ENDED : "streamEnded"
    };

    /**
     * @class Ad
     * @classdesc Represents an ad or a set of podded ads. This object contains a reference to the actual ad object provided by
     * the ad manager.
     * <b>Constructor</b>: Represents an ad or a set of podded ads. This object contains a reference to the actual ad object provided by
     * the ad manager.
     * @public
     * @example
     * var amc = new AdManagerController(mb, id);
     * var ad = new amc.Ad({position:10000, duration:7000, adManager:"example-ad-manager", ad:adObj,
     *                      adType:amc.ADTYPE.LINEAR_VIDEO});
     * @param adData {object} The ad data object describes the ad, it must contain the following fields:<br/>
     *   <code>position {number}</code> The time, in seconds, in the video at which the ad(s) will play.<br />
     *   <code>duration {number}</code> The duration of the ad(s) (seconds).<br />
     *   <code>adManager {string}</code> The name of the ad manager (<code>{adManager}.name</code>) that will play the ad.<br />
     *   <code>ad {object}</code> The ad object.<br />
     *   <code>adType {string}</code> The type of ad created (e.g. <code>{AdManagerController}.ADTYPE.LINEAR_VIDEO</code>).
     * @property {string} id A unique ID for the ad.
     * @property {number} position The position in the stream at which to play the ad (seconds).
     * @property {number} duration The duration of the ad (seconds).
     * @property {string} adManager The name of the ad manager that owns the ad.
     * @property {object} ad The ad object.
     * @property {boolean} isLinear <code>true</code> if the ad is linear, <code>false</code> otherwise.
     * @property {boolean} played <code>true</code> if the ad has been played during the current video, <code>false</code> otherwise.
     * @property {object} videoRestrictions An object that lists restrictions the ad manager has on the video plugin
     *   used.  ex. {"technology":OO.VIDEO.TECHNOLOGY.HTML5, "features":[OO.VIDEO.FEATURE.VIDEO_OBJECT_OPEN]}
     */
    this.Ad = function(adData) {
      if (!adData) adData = {};
      this.id = _.uniqueId(adData['adManager'] + "_");
      this.position = adData['position'] || 0;
      this.duration = adData['duration'] || 0;
      this.adManager = adData['adManager'];
      this.ad = adData['ad'] || {};
      this.adType = adData['adType'] || controller.ADTYPE.LINEAR_VIDEO;
      this.isLinear = this.adType === controller.ADTYPE.LINEAR_VIDEO ||
                      this.adType === controller.ADTYPE.LINEAR_OVERLAY;
      this.isRequest = this.adType === controller.ADTYPE.AD_REQUEST ||
                       this.adType === controller.ADTYPE.UNKNOWN_AD_REQUEST;
      this.streams = adData['streams'] || {};
      this.played = false;
      this.videoRestrictions = adData['videoRestrictions'];
    };

    var states_noLinearAdPlaying = ['Init', 'Ready', 'Playback', 'Reload', 'Overlay'];
    var states_linearAd = ['LinearAd'];

    // State Machine
    this.fsm = OO.StateMachine.create({
        initial:    'Init',
        messageBus: mb,
        moduleName: moduleName,
        target:     this,
        events:[
          // Setup and teardown
          {name:OO.EVENTS.PLAYER_CREATED,            from:'Init',  to:'Init'},

          // Playback events
          {name:OO.EVENTS.PLAY,                      from:states_linearAd, to:'*'},
          {name:OO.EVENTS.INITIAL_PLAY,              from:'Ready',         to:'Playback'},
          {name:OO.EVENTS.SET_EMBED_CODE,            from:'*',             to:'Reload'},
          {name:OO.EVENTS.EMBED_CODE_CHANGED,        from:'*',             to:'Ready'},
          {name:OO.EVENTS.PLAYED,                    from:'*',             to:'Ready'},
          {name:OO.EVENTS.REPLAY,                    from:'*',             to:'Playback'},

          // Ad events
          {name:OO.EVENTS.AMC_ALL_READY,           from:'*',                      to:'Ready'},
          {name:OO.EVENTS.WILL_PLAY_ADS,           from:states_noLinearAdPlaying, to:'LinearAd'},
          {name:OO.EVENTS.AD_POD_STARTED,          from:'*',                      to:'LinearAd'},
          {name:OO.EVENTS.WILL_PLAY_NONLINEAR_AD,  from:'*',                      to:'*'},
          {name:OO.EVENTS.PLAY_NONLINEAR_AD,       from:'*',                      to:'Overlay'},
          {name:OO.EVENTS.NONLINEAR_AD_PLAYED,     from:'*',                      to:'Playback'},
          {name:OO.EVENTS.ADS_PLAYED,              from:'*',                      to:'Playback'}
          // ad load error
        ]
      });

    ///// Setup /////

    // Load the ad managers if all the settings are available
    var _tryInit = _.bind(function() {
      if (initialized || !pageSettingsRaised || !backlotSettingsRaised || !movieMetadataRaised) return;
      initialized = true;
      if (this.testMode) {
        _declareAllReadyOnTimeout();
      } else {
        _.delay(_.bind(_declareAllReadyOnTimeout, this), MAX_AD_MANAGER_LOAD_TIMEOUT);
      }

      // Parse global metadata locally
      for (var setting in SETTINGS) {
        if (typeof this.pageSettings[SETTINGS[setting]] != "undefined") {
          this.adManagerSettings[SETTINGS[setting]] = this.pageSettings[SETTINGS[setting]];
        }
      }

      // Send the metadata to the ad managers
      for (var key in this.adManagers) {
        var manager = this.adManagers[key];
        if (manager) {
          // Merge the backlot and page level data where page level gets precedence
          var metadata = OO.getInnerProperty(this.backlotSettings, ["modules", key, "metadata"]) || {};
          metadata = _.extend(metadata, OO.getInnerProperty(this.pageSettings, [key]));

          // Note: For now the amc must parse ad-manager specific settings
          //       We should only support setting these settings globally and this code should be removed
          for (var setting in SETTINGS) {
             if (typeof metadata[SETTINGS[setting]] != "undefined") {

               // Exception: For IMA, allow provider page settings to override ad manager page settings
               // TODO: Take this control of out of the amc and put it in the google ad manager
               if ((manager.name == "google-ima-ads-manager") &&
                   (this.adManagerSettings[SETTINGS[setting]] != null)) {
                 return;
               }

               this.adManagerSettings[SETTINGS[setting]] = metadata[SETTINGS[setting]];
             }
           }

          _safeFunctionCall(manager, "loadMetadata", [metadata,
                                                      OO.getInnerProperty(this.backlotSettings, ["base"]) || {},
                                                      this.movieMetadata]);
        }
      }

      // Change the type of booleans to proper boolean with proper defaults
      this.adManagerSettings[SETTINGS.PAUSE_AD_ON_CLICK] =
        (typeof this.adManagerSettings[SETTINGS.PAUSE_AD_ON_CLICK] == "undefined") ?
          true : _stringToBoolean(this.adManagerSettings[SETTINGS.PAUSE_AD_ON_CLICK]);
      this.adManagerSettings[SETTINGS.DISPLAY_CUE_POINTS] =
        (typeof this.adManagerSettings[SETTINGS.DISPLAY_CUE_POINTS] == "undefined") ?
          true : _stringToBoolean(this.adManagerSettings[SETTINGS.DISPLAY_CUE_POINTS]);
      this.adManagerSettings[SETTINGS.REPLAY_ADS] =
        (typeof this.adManagerSettings[SETTINGS.REPLAY_ADS] == "undefined") ?
          true : _stringToBoolean(this.adManagerSettings[SETTINGS.REPLAY_ADS]);
      this.adManagerSettings[SETTINGS.SHOW_NONLINEAR_CLOSE_BUTTON] =
        (typeof this.adManagerSettings[SETTINGS.SHOW_NONLINEAR_CLOSE_BUTTON] == "undefined") ?
          false : _stringToBoolean(this.adManagerSettings[SETTINGS.SHOW_NONLINEAR_CLOSE_BUTTON]);
      this.adManagerSettings[SETTINGS.SHOW_LINEAR_AD_SKIP_BUTTON] =
        (typeof this.adManagerSettings[SETTINGS.SHOW_LINEAR_AD_SKIP_BUTTON] == "undefined") ?
          false : _stringToBoolean(this.adManagerSettings[SETTINGS.SHOW_LINEAR_AD_SKIP_BUTTON]);
      this.adManagerSettings[SETTINGS.LINEAR_AD_SKIP_BUTTON_START_TIME] =
        (typeof this.adManagerSettings[SETTINGS.LINEAR_AD_SKIP_BUTTON_START_TIME] == "undefined") ?
          DEFAULT_VIDEO_SKIP_BUTTON_TIME : parseInt(this.adManagerSettings[SETTINGS.LINEAR_AD_SKIP_BUTTON_START_TIME]);
      this.adManagerSettings[SETTINGS.ALLOW_AD_CLICK_THROUGH_ON_VIDEO] =
        (typeof this.adManagerSettings[SETTINGS.ALLOW_AD_CLICK_THROUGH_ON_VIDEO] == "undefined") ?
          true : _stringToBoolean(this.adManagerSettings[SETTINGS.ALLOW_AD_CLICK_THROUGH_ON_VIDEO]);

      // Handle metadata settings
      this.ui.shouldDisplayCuePointMarkers();
      if (this.adManagerSettings[SETTINGS.AD_LOAD_TIMEOUT] != null) {
        MAX_AD_LOAD_TIMEOUT = this.adManagerSettings[SETTINGS.AD_LOAD_TIMEOUT] * 1000;
      }

      _checkAllReady();
    }, this);

    var _stringToBoolean = _.bind(function(value) {
      value = value.toString().toLowerCase();
      return value === "true" || value === "yes" || value === "1";
    }, this);

    var _resetPlaybackEventDependencies = _.bind(function(destroying) {
      destroying = destroying || false;
      // Remove existing dependencies
      mb.removeDependent(OO.EVENTS.PLAYBACK_READY, OO.EVENTS.AMC_ALL_READY);
      mb.removeDependent(OO.EVENTS.WILL_PLAY_FROM_BEGINNING, OO.EVENTS.AMC_PREROLLS_DONE);
      mb.removeDependent(OO.EVENTS.PLAYED, OO.EVENTS.AMC_ALL_ADS_DONE);
      // AD_MANAGER_HANDLED_ADS should be removed but NOT re-added
      mb.removeDependent(OO.EVENTS.PLAYED, OO.EVENTS.AD_MANAGER_HANDLED_ADS);
      // Reset this because it tracks which ad managers are trying to block PLAYED
      adManagersControllingAds = {};

      if (!destroying) {
        // This ensures that the parameters from the blocked event are maintained if it has a dependent
        // If nothing (or null) is returned, the blocked event would get raised with the parameters of
        // the blocker rather than the parameters which were specified by the caller.
        // This is required to ensure that VC_PLAY passes the stream url
        // This will change with PBW-2910 and can be removed at that time.
        var restoreOrigParams = function(eventName, dependentEvent, origParams, args){
          return origParams;
        };

        // Add new dependencies
        mb.addDependent(OO.EVENTS.PLAYBACK_READY, OO.EVENTS.AMC_ALL_READY, moduleName, restoreOrigParams);
        mb.addDependent(OO.EVENTS.WILL_PLAY_FROM_BEGINNING, OO.EVENTS.AMC_PREROLLS_DONE, moduleName, restoreOrigParams);
        mb.addDependent(OO.EVENTS.PLAYED, OO.EVENTS.AMC_ALL_ADS_DONE, moduleName, restoreOrigParams);
      }
    }, this);

    /**
     * Collects page settings, sets up event dependencies, attempts init, destroys self if required, sets
     * up UI, platform, and interface classes, sets up root video element references in AdManagerControllerUi.
     * @method OO.AdManagerController#onPlayerCreated
     * @protected
     * @param {string} eventname The name of the event for which this callback is called
     * @param {string} elementId The ID of the root Ooyala element
     * @param {object} params Page level parameters
     * @fires OO.EVENTS.AMC_ALL_READY
     */
    this.onPlayerCreated = function(eventname, elementId, params) {
      var destroyEarly = _.bind(function() {
        _destroy();
        mb.publish(OO.EVENTS.AMC_ALL_READY, Object.keys(this.adManagers));
      }, this);

      // instantiate the ad managers
      for (var i in adManagerFactories) {
        var adManagerFactory = adManagerFactories[i];
        var adManager = adManagerFactory.apply({}, [_, $]);
        OO.log("AMC: Registering ad manager: " + adManager.name);
        this.adManagers[adManager.name] = adManager;
      }

      if ((!this.adManagers) || _.isEmpty(this.adManagers)) {
        destroyEarly();
        return;
      }

      if (!OO.supportAds ||
          !OO.requiredInEnvironment('ads') ||
          OO.requiredInEnvironment('flash-playback')) {
        destroyEarly();
        return;
      }

      this.ui = new AdManagerControllerUi(mb, this.adManagerSettings, this.adManagers);
      this.platform = new AdManagerControllerPlatform(mb);
      this.interface = new AdManagerInterface(this);

      this.pageSettings = params;
      pageSettingsRaised = true;
      if (params && params.initialTime != null) {
        this.startTime = params.initialTime;
      }

      // Setup root element
      this.ui.elementId = elementId;
      this.ui.rootElement = $("#" + elementId);
      if (!this.ui.rootElement) return destroyEarly();
      this.ui.height = this.ui.rootElement.height();
      this.ui.width = this.ui.rootElement.width();

      // Add dependecies for preroll and postroll
      _resetPlaybackEventDependencies();
      mb.intercept(OO.EVENTS.DESTROY, moduleName, _.bind(this.onDestroy, this));

      // Initialize ad managers
      for (var key in this.adManagers) {
        if (this.adManagers[key]) {
          _safeFunctionCall(this.adManagers[key], "initialize", [this.interface, elementId]);
        }
      }

      // Init
      mb.subscribe(OO.EVENTS.PLAYER_EMBEDDED, moduleName, _.bind(this.onPlayerEmbedded, this));
      mb.subscribe(OO.EVENTS.METADATA_FETCHED, moduleName, _.bind(this.onMetadataFetched, this));
      mb.subscribe(OO.EVENTS.CONTENT_TREE_FETCHED, moduleName, _.bind(this.onContentTreeFetched, this));
      mb.subscribe(OO.EVENTS.AUTHORIZATION_FETCHED, moduleName, _.bind(this.onAuthorizationFetched, this));
      mb.subscribe(OO.EVENTS.ASSET_CHANGED, moduleName, _.bind(this.onAssetChanged, this));
      mb.subscribe(OO.EVENTS.UI_READY, moduleName, _.bind(this.onUiReady, this));
      mb.subscribe(OO.EVENTS.PLAYBACK_READY, moduleName, _.bind(this.onPlaybackReady, this));

      // Playback
      mb.subscribe(OO.EVENTS.WILL_PLAY_FROM_BEGINNING, moduleName, _.bind(this.onWillPlayFromBeginning, this));
      mb.subscribe(OO.EVENTS.PLAYHEAD_TIME_CHANGED, moduleName, _.bind(this.onPlayheadTimeChanged, this));
      mb.subscribe(OO.EVENTS.PAUSE, moduleName, _.bind(this.onPause, this));
      mb.subscribe(OO.EVENTS.WILL_PLAY, moduleName, _.bind(this.onWillPlay, this));
      mb.subscribe(OO.EVENTS.PLAYING, moduleName, _.bind(this.onPlaying, this));
      mb.subscribe(OO.EVENTS.SEEK, moduleName, _.bind(this.onSeek, this));
      mb.subscribe(OO.EVENTS.SEEKED, moduleName, _.bind(this.onSeeked, this));
      mb.subscribe(OO.EVENTS.VC_PLAY, moduleName, onVideoPlay);
      mb.subscribe(OO.EVENTS.VC_PLAYING, moduleName, _.bind(this.onVideoPlaying, this));
      mb.subscribe(OO.EVENTS.VC_PLAY_FAILED, moduleName, _.bind(this.onVideoPlayFailed, this));
      mb.subscribe(OO.EVENTS.VC_PLAYED, moduleName, _.bind(this.onVideoPlayed, this));
      mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_IN_FOCUS, moduleName, _.bind(this.onVideoElementInFocus, this));

      // Settings
      mb.subscribe(OO.EVENTS.FULLSCREEN_CHANGED, moduleName, _.bind(this.onFullscreenChanged, this));
      mb.subscribe(OO.EVENTS.SIZE_CHANGED, moduleName, _.bind(this.onSizeChanged, this));
      mb.subscribe(OO.EVENTS.VOLUME_CHANGED, moduleName, _.bind(this.onVolumeChanged, this));
      mb.subscribe(OO.EVENTS.CONTROLS_SHOWN, moduleName, _.bind(this.onControlsShown, this));
      mb.subscribe(OO.EVENTS.CONTROLS_HIDDEN, moduleName, _.bind(this.onControlsHidden, this));

      // Interaction
      mb.subscribe(OO.EVENTS.ADS_CLICKED, moduleName, _.bind(this.onAdsClicked, this));
      mb.subscribe(OO.EVENTS.SKIP_AD, moduleName, _.bind(this.onSkipAd, this));

      // Ad events
      mb.subscribe(OO.EVENTS.WILL_PAUSE_ADS, moduleName, _.bind(this.onWillPauseAds, this));
      mb.subscribe(OO.EVENTS.WILL_RESUME_ADS, moduleName, _.bind(this.onWillResumeAds, this));
      mb.subscribe(OO.EVENTS.AD_POD_ENDED, moduleName, _.bind(this.onAdPodEnded, this));

      //SSAI events (like ID3 tags)
      mb.subscribe(OO.EVENTS.VC_TAG_FOUND, moduleName, _.bind(this.onVideoTagFound, this));
      mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, moduleName, _.bind(this.onVideoElementCreated, this));

      _tryInit();
    };

    var trySetupUI = _.bind(function() {
      //We want to make sure we have the ui parameters from Mjolnir before proceeding
      if (!uiSetup && !_.isEmpty(this.ui.uiParameters)) {
        //setup UI
        this.ui.setupAndRegisterUi();
        uiSetup = true;
      }
    }, this);

    /**
     * Called when the player is embedded. Stores the provided UI parameters for possible later use.
     * @method OO.AdManagerController#onPlayerEmbedded
     * @protected
     */
    this.onPlayerEmbedded = function(eventName, uiParams) {
      //Store the ui params received here for later use (either when we
      //receive UI_READY event or PLAYBACK_READY event)
      //We only want to use the values from PLAYER_EMBEDDED if we did not
      //receive any from the UI_READY event
      if (uiParams) {
        this.ui.uiParameters = uiParams;
      }
    };

    /**
     * Called when the Alice UI is ready. Sets up the AMC UI with the parameters
     * provided in the message.
     * @method OO.AdManagerController#onUiReady
     * @protected
     */
    this.onUiReady = function(eventName, uiParams) {
      if (uiParams) {
        this.ui.aliceUiParameters = uiParams;
      }
      //When using single video elements, we will setup the UI later
      //when the video element is created
      if (!this.ui.useSingleVideoElement) {
        trySetupUI();
      }
    };

    /**
     * Called when playback is deemed ready. Attempts to setup the UI.
     * @method OO.AdManagerController#onPlaybackReady
     * @protected
     */
    this.onPlaybackReady = function() {
      //When using single video elements, we will setup the UI later
      //when the video element is created
      if (!this.ui.useSingleVideoElement) {
        trySetupUI();
      }
    };

    /**
     * Called when Backlot settings are available.
     * Attempts initialization.
     * @method OO.AdManagerController#onMetadataFetched
     * @protected
     * @param {string} eventname The name of the event for which this callback is called
     * @param {object} metadata Backlot metadata
     * @fires OO.EVENTS.AMC_ALL_READY
     */
    this.onMetadataFetched = function(eventname, metadata) {
      this.backlotSettings = metadata;
      backlotSettingsRaised = true;
      _tryInit();
    };

    /**
     * Called when the movie metadata is available.
     * Attempts initialization.
     * @method OO.AdManagerController#onContentTreeFetched
     * @protected
     * @param {string} eventname The name of the event for which this callback is called
     * @param {object} content Movie metadata (duration in milliseconds)
     * @fires OO.EVENTS.AMC_ALL_READY
     */
    this.onContentTreeFetched = function(eventname, content) {
      this.movieMetadata = content;
      movieMetadataRaised = true;
      if (content && content.duration && (this.movieDuration == -1)) {
        this.movieDuration = content.duration/1000;
      }

      _tryInit();

      // TODO: What do i do with content.cue_ads:[] and content.ads:[],
      //   which doesn't appear to be legacy ads although it might be.
    };

    /**
     * Called when authorization with the Ooyala server has completed.  Checks if the content is live or VOD.
     * @method OO.AdManagerController#onAuthorizationFetched
     * @protected
     * @param {string} event The name of the event for which this callback is called
     * @param {object} authorization
     */
    this.onAuthorizationFetched = function(event, authorization) {
      this.isLiveStream = false;
      if (authorization && authorization.streams && authorization.streams[0])
      {
        this.isLiveStream = authorization.streams[0]['is_live_stream'];
      }
    };

    /**
     * Called when the CMSless flow is used, receiving a JSON object full of asset metadata and player params.
     * @method OO.AdManagerController#onAssetChanged
     * @protected
     * @param {string} event The name of the even for which the callback is called
     * @param {object} asset The JSON object containing all of the asset metadata
     * @param {object} params The page level player parameters specified for the asset.
     */

    this.onAssetChanged = function(event, asset, params) {
      // Mark each ad manager as not ready - need to load new metadata
      for (var name in this.adManagers) {
        this.adManagers[name].ready = false;
      }

      if (asset.id != this.currentEmbedCode) {
        lastEmbedCode = this.currentEmbedCode;
      }
      this.currentEmbedCode = asset.id;
      if (lastEmbedCode != '' && lastEmbedCode != this.currentEmbedCode) {
        _triggerAdManagerCallback(this.EVENTS.CONTENT_CHANGED);
        _handleNewStream();
      }

      this.pageSettings = params;
      this.backlotSettings = {};
      backlotSettingsRaised = true;

      this.movieMetadata = asset.content;
      movieMetadataRaised = true;
      if (asset.content && asset.content.duration && (this.movieDuration == -1)) {
        this.movieDuration = asset.content.duration/1000;
      }

      this.isLiveStream = false;
      if (asset.content && asset.content.streams && asset.content.streams[0])
      {
        this.isLiveStream = asset.content.streams[0]['is_live_stream'];
      }

      _tryInit();
    };

    /**
     * Loads an ad module asynchronously from the network.
     * @public
     * @method OO.AdManagerController#loadAdModule
     * @param {string} adManager The name of the ad manager making the request (<code>{adManager}.name</code>).
     * @param {string} path The network path to the remote ad module to load.
     * @param {function} callback Calls this function when the network request is complete with one parameter
     *                            indicating success (<code>true</code>) or failure (<code>false</code>).
     */
    this.loadAdModule = function(adManager, path, callback) {
      _.defer(
        function(amc, adManager, path, callback) {
          OO.loadScriptOnce(path,
            _.bind(function() {
              callback(true);
              amc.onAdManagerReady();
            }, amc, adManager, callback),
            _.bind(function() { callback(false);
              amc.removeAdManager(adManager); }, amc, adManager, callback),
            amc.MAX_AD_MODULE_LOAD_TIMEOUT);
        }, this, adManager, path, callback);
    };

    /**
     * When one ad manager reports it is ready, the ad manager controller checks all of the registered managers
     * to see if they are ready.
     * @public
     * @method OO.AdManagerController#onAdManagerReady
     * @fires OO.EVENTS.AMC_ALL_READY
     */
    this.onAdManagerReady = function() {
      _checkAllReady();
    };

    /**
     * Unregisters an ad manager.  This is called when an ad manager fails to set up or become ready.
     * @public
     * @method OO.AdManagerController#removeAdManager
     * @param {string} adManager The name of the ad manager.
     * @fires OO.EVENTS.AMC_ALL_READY
     */
    this.removeAdManager = function(adManager) {
      OO.log("AMC: removing failed ad manager " + adManager);
      this.unregisterAdManager(adManager);
      _checkAllReady();
    };

    // Check if all ad managers loaded
    var _checkAllReady = _.bind(function() {
      // TODO: figure out why this is called twice when a manager fails to load
      if (allready) return;

      for (var adManager in this.adManagers) {
        if (!this.adManagers[adManager].ready) return;
      }

      allready = true;
      _buildTimeline();
      mb.publish(OO.EVENTS.AMC_ALL_READY, Object.keys(this.adManagers));
    }, this);

    // Abort ad managers that are not yet ready
    var _declareAllReadyOnTimeout = _.bind(function() {
      if (!allready) {
        for (var adManager in this.adManagers) {
          if (!this.adManagers[adManager].ready) {
            this.removeAdManager(adManager);
          }
        }

        if (!allready) {
          allready = true;
          _buildTimeline();
          mb.publish(OO.EVENTS.AMC_ALL_READY, Object.keys(this.adManagers));
        }
      }
    }, this);

    /**
     * Destroys self if there are no ad managers registered.
     * Resets the newStreamHandling flag as the handling is now completed.
     * @method OO.AdManagerController#onAdManagerControllerAllReady
     * @protected
     */
    this.onAdManagerControllerAllReady = function() {
      if ((!adManagerFactories) || _.isEmpty(adManagerFactories)) {
        OO.log("AMC: No ad manager factories, destroying AMC");
        _destroy();
        return;
      }

      newStreamHandling = false;
    };

    ////////// Timeline Control //////////

    // Build timeline for ads
    var _buildTimeline = _.bind(function() {
      for (var key in this.adManagers) {
        var manager = this.adManagers[key];
        if (manager) {
          // TODO: Check if returned array of this.Ad where the adManager property is set correctly
          // or should we just set the adManager property?
          var managerTimeline = _safeFunctionCall(manager, "buildTimeline", []);
          if (_.isArray(managerTimeline)) {
            timeline = _.union(timeline, managerTimeline);
            _extractRepeatAds(timeline);
          }
        }
      }

      timeline = _sortAdArray(timeline);

      // TODO: Make sure this is called when an ad manager asynchronously adds ads
      this.ui.resetCuePoints(timeline, this.movieDuration);
    }, this);

    // goes through timeline to find any repeat ads
    var _extractRepeatAds = _.bind(function(timeline) {
      _.each(timeline, function(timelineAd) {
        if (isRepeatAd(timelineAd)) {
          timelineAd.ad.lastPlayed = timelineAd.position;
          timelineAd.ad.playTimes = {};
          repeatAds.push(timelineAd);
        }
      }, this);
    }, this);

    /**
     * Adds ads to the controller's ad timeline.  This function can be called at any time.
     * @method OO.AdManagerController#appendToTimeline
     * @public
     * @param {OO.AdManagerController#Ad[]} adManagerTimeline An array of ads to add to the timeline.
     *                                                        The ads are not required to be in time order.
     */
    this.appendToTimeline = function(adManagerTimeline) {
      if (_.isArray(adManagerTimeline)) {
        timeline = timeline.concat(adManagerTimeline);
        timeline = _sortAdArray(timeline);
        _extractRepeatAds(adManagerTimeline);
      }
    };

    /**
     * Add single ad to the controller's active ad queue and then re-sort them.
     * @private
     * @param {OO.AdManagerController#Ad[]} adToAppend Single ad that is appended to adQueue
     *                                                 and sorted into place.
     */
    var _appendToQueue = _.bind(function(adToAppend) {
        adQueue.push(adToAppend);
        adQueue = _sortAdArray(adQueue);
    }, this);

    // Sort ad array by time increasing
    // Sort (!isLinear) last
    // Sort isRequest first
    var _sortAdArray = function(adArray) {
      var sorted = adArray;
      if ((!OO._.isArray(sorted)) || (!sorted.length) || (sorted.length < 1)) return [];
      sorted.sort(function(a, b){
          if (!a || !OO._.isObject(a) || a.position == undefined) return 1;
          if (!b || !OO._.isObject(b) || b.position == undefined) return -1;
          if (a.position < b.position) return -1;
          if (a.position === b.position) {
            if (a.isRequest) {
              return -1;
            } else if (b.isRequest) {
              return 1;
            } else if (!a.isLinear) {
              return 1;
            } else if (!b.isLinear) {
              return -1;
            } else {
              return 0;
            }
          }
          return 1;
        });
      return sorted;
    };

    /**
     * Raises an event on the message bus to notify listeners that a companion ad is to be shown.
     * @method OO.AdManagerController#showCompanion
     * @public
     * @param {object} companion The companion ad to display.
     * @fires OO.EVENTS.WILL_SHOW_COMPANION_ADS
     */
    this.showCompanion = function(companion) {
      // Defer so that external JS exception will not hang our player.
      mb.publish(OO.EVENTS.WILL_SHOW_COMPANION_ADS, {ads: companion});
    };

    /**
     * Not yet implemented.
     * @private
     * @method OO.AdManagerController#hideCompanion
     */
    this.hideCompanion = function() {
    };

    /**
     * Blocks the AMC from bringing up the end screen until <code>adManagerDoneControllingAds()</code>
     * is called.
     * @public
     * @method OO.AdManagerController#adManagerWillControlAds
     */
    //EVENTS.CONTENT_COMPLETED will not be called as long as you are in this mode.
    this.adManagerWillControlAds = function(adManagerName) {
      if (!adManagersControllingAds[adManagerName])
      {
        if ($.isEmptyObject(adManagersControllingAds))
        {
          mb.addDependent(OO.EVENTS.PLAYED, OO.EVENTS.AD_MANAGER_HANDLED_ADS, moduleName, function(){});
        }

        adManagersControllingAds[adManagerName] = true;
      }
    };

    /**
     * Forces an ad to play immediately, bypassing the timeline.
     * @public
     * @method OO.AdManagerController#forceAdToPlay
     * @param {object} adManager The name of the ad manager that will play the ad.
     * @param {object} ad An object containing all the optional parameters for the ad.
     * @param {OO.AdManagerController#ADTYPE} adType The type of ad you are trying to force.
     * @param {object} streams Object containing the ad video stream types
     * @param {number} duration The duration of the ad
     */
    this.forceAdToPlay = function(adManager, ad, adType, streams, duration) {
      var adData = {
        "adManager": adManager,
        "adType": adType,
        "ad": ad,
        "streams": streams,
        "duration": duration,
        "position": -1 //we want it to play immediately
      };
      var newAd = new this.Ad(adData);
      _appendToQueue(newAd);
      _extractRepeatAds([newAd]);
      //if we've received a pod end notification, do not check timeline.
      //The timeline will be checked when we handle the adPodEnded message
      if (!pendingPodEnd) {
        _checkTimeline(currentPlayhead, false);
      }
    };

    /**
     * This unblocks the AMC so it can bring up the end screen.
     * @public
     * @method OO.AdManagerController#adManagerDoneControllingAds
     */
    this.adManagerDoneControllingAds = function(adManagerName) {
      if (adManagersControllingAds[adManagerName]) {
        //delete this ad manager from the list and if it's empty then publish the message.
        delete adManagersControllingAds[adManagerName];
        if ($.isEmptyObject(adManagersControllingAds)) {
          //releasing the dependent, so EVENTS.PLAYED can be sent out.
          mb.publish(OO.EVENTS.AD_MANAGER_HANDLED_ADS);
        }
       }
    };

    /**
     * If we don't provide argument, this checks if some ad manager is controlling ads.
     * If we provide an argument, this checks if the specified ad manager is controlling ads.
     * @private
     * @method OO.AdManagerController#isAdManagerControllingAds
     * @param {adManagerName#String}
     * @returns {boolean} Whether ads are being controlled by any ad manager/a particular ad manager,
     *                    depending on whether an argument is provided.
     */
    this.isAdManagerControllingAds = function(adManagerName) {
      if (!adManagerName) {
        return $.isEmptyObject(adManagersControllingAds);
      }

      return !!(adManagersControllingAds[adManagerName]);
    };

    // Check if an ad should be played at the current time
    // state is an optional string parameter
    // TODO: If you end up with an overlay in the middle, playback will run until the time of the next ad
    //       If this happens we don't respect people's pauses because we are still working through the ad queue
    var _checkTimeline = _.bind(function(playhead, lastAdBreakOnly, state) {
      if (!timeline || singleAdPlaying) return;

      if (!seekToEndThreshold) {
        seekToEndThreshold = this.movieDuration - OO.CONSTANTS.SEEK_TO_END_LIMIT;
      }
      var adDuration = _populateQueue(playhead, lastAdBreakOnly, state);
      // TODO: Consider moving the duration calculation here.

      // Play the ads in the queue
      if (adQueue.length > 0) {
        //If we're in ad mode, trigger next ad
        if ($.inArray(this.currentState, states_linearAd) >= 0) {
          _triggerNextAd();
        }
        //else enter ad mode first
        else {
          _enterAdMode({type: adQueue[0].adManager, duration: adDuration}); //TODO: type needs to change to FREEWHEEL and GOOGLE_IMA and LIVERAIL
          // TODO: Liverail used to call this with useCustomCountdown:true, maybe need to add metadata to the ad object and include it here
        }
        return;
      } else if (this.tryAdsCompleted()) {
        return;
      }

      if (!started) {
        mb.publish(OO.EVENTS.AMC_PREROLLS_DONE);
      }
    }, this);

    var _handleRepeatAds = _.bind(function(playhead, areAdsPlaying, state) {
      var adQueueTemp = [];
      if (state !== STATES.SEEKED) {
        _.each(repeatAds, function(repeatAd) {
          var nextTimeToPlay = repeatAd.ad.lastPlayed + repeatAd.ad.repeatAfter;

          // Check if the current playhead has passed the next time the repeat is supposed to play
          // If the main content video has ended, we may want to play a repeat ad
          if ((nextTimeToPlay <= playhead && playhead < this.movieDuration) || (!areAdsPlaying && state === STATES.CONTENT_VIDEO_PLAYED)) {
            if (this.startTime >= 0) {
              var repeatInterval = repeatAd.ad.repeatAfter;
              var positionOfLastAd;
              if (playhead > repeatAd.position) {
                positionOfLastAd = Math.floor((playhead - repeatAd.position) / repeatInterval) * repeatInterval  + repeatAd.position;
              }
              else {
                positionOfLastAd = repeatAd.position;
              }
              repeatAd.ad.lastPlayed = positionOfLastAd;
            }
            else {
              repeatAd.ad.lastPlayed = nextTimeToPlay;
            }

            // Only play the repeat ad if a non-repeat ad is not playing (i.e. a midroll/postroll)
            if (!areAdsPlaying && !_checkRepeatAdPlayed(repeatAd, repeatAd.ad.lastPlayed)) {
              adQueue.push(repeatAd);
            }
          }
        }, this);
      }
      // only do logic for repeat ads if seeking to the future
      else {
        _.each(repeatAds, function(repeatAd) {
          var repeatInterval = repeatAd.ad.repeatAfter;
          var currentAd = _getCurrentAd();
          if (currentAd && currentAd === repeatAd) {
            repeatAd.ad.firstPlay = true;
          }

          // this get's where the repeat ad was supposed to play last
          // (consider: repeat interval of 5 seconds and current play head is at 28,
          // 28 / 5 = 5 * 5 = 25 seconds is the where the last repeat ad should have played)
          var positionOfLastAd;
          if (playhead > repeatAd.position) {
            positionOfLastAd = Math.floor((playhead - repeatAd.position) / repeatInterval) * repeatInterval  + repeatAd.position;
          }
          else {
            positionOfLastAd = repeatAd.position;
          }

          // if there isn't an ad to play after seek then assume lastPlayed is the "supposed" last played position
          // and try to play repeat the ad
          if (!currentAd) {
            var nextTimeToPlay = repeatAd.ad.lastPlayed + repeatInterval;
            // do not play if the playhead is too close to end of main content
            // also, only care about paying the ad tax for the closest repeat ad position (position of last ad)
            if ((nextTimeToPlay <= playhead && playhead < seekToEndThreshold) && !_checkRepeatAdPlayed(repeatAd, positionOfLastAd)) {
              adQueueTemp.push(repeatAd);
            }
            repeatAd.ad.lastPlayed = positionOfLastAd;
          }
          // if there is a current ad but the playhead would be past the point
          // of a supposed last ad, then pretend the lastPlayed for repeat ad is at the
          // supposed last ad position
          else if (currentAd && playhead >= positionOfLastAd) {
            repeatAd.ad.lastPlayed = positionOfLastAd;
          }
        }, this);
      }
      adQueue = adQueue.concat(adQueueTemp);
    }, this);

    var _checkRepeatAdPlayed = _.bind(function(repeatAd, positionOfLastAd) {
      var played = false;
      if (repeatAd) {
        if (positionOfLastAd in repeatAd.ad.playTimes) {
          played = repeatAd.ad.playTimes[positionOfLastAd];
        }
      }
      return played;
    }, this);

    var _populateQueue = _.bind(function(playhead, lastAdBreakOnly, state) {
      if (timeline == undefined || timeline.length == 0) return;
      var adDuration = 0;

      // If we should only play the last ad, empty the queue before handling so that we only play the ads from new position
      if (lastAdBreakOnly) adQueue = [];

      // Find our current ad index starting with last ad index
      while (timeline[lastAdIndex] &&
             timeline[lastAdIndex].position > playhead &&
             lastAdIndex > 0) {
        lastAdIndex--;
      }

      var index = lastAdIndex;
      while (timeline[index] &&
             (index < timeline.length - 1) &&
             (timeline[index].played == true )) {
        index++;
      }


      // Build up the ad queue
      while (timeline[index] && timeline[index].position <= playhead) {
        lastAdIndex = index;

        // On a seek, only play ads at the most recent position
        if (lastAdBreakOnly &&
            (adQueue.length > 0) &&
            (timeline[index].position != adQueue[adQueue.length - 1].position)) {
          adQueue = [];
          adDuration = 0;
        }

        if (timeline[index].played || (skipAdsOnSeek && timeline[index].position < seekedPosition)) {
          index++;
          continue;
        }

        // Check if it's already in the queue
        if (_.indexOf(adQueue, timeline[index]) >= 0) {
          index++;
          continue;
        }

        adQueue.push(timeline[index]);
        if (timeline[index].isLinear) adDuration = adDuration + timeline[index].duration;
        index++;
      }

      // try to add repeat ads to queue
      if (adQueue.length > 0) {
        _handleRepeatAds(playhead, true, state);
      }
      else {
        _handleRepeatAds(playhead, false, state);
        _.each(adQueue, function(ad) {
          if (ad.isLinear) {
            adDuration = adDuration + ad.duration;
          }
        }, this);
      }

      // sort ads in case of 2 repeat ads where one is an overlay and the other is a linear ad
      // linear ad should go first
      adQueue = _sortAdArray(adQueue);

      return adDuration;
    }, this);

    /**
     * Returns the ad timeline.  This is used in unit testing.
     * @method OO.AdManagerController#getTimeline
     * @protected
     * @returns {OO.AdManagerController#Ad[]} An array of the ads to play during the current video,
     *                                        arranged in order of time and ad type.
     */
    this.getTimeline = function() { return timeline; };

    /**
     * Returns the repeat ads.  This is used in unit testing.
     * @method OO.AdManagerController#getRepeatAds
     * @protected
     * @returns {OO.AdManagerController#Ad[]} An array of ads that have been specified to repeat.
     */
    this.getRepeatAds = function() { return _.clone(repeatAds); };

    /**
     * Returns the ad queue.  This is used in unit testing.
     * @method OO.AdManagerController#getAdQueue
     * @protected
     * @returns {OO.AdManagerController#Ad[]} An array of the ads in the queue to be played during the
     *                                        current commercial break, arranged in play order.
     */
    this.getAdQueue = function() { return adQueue; };

    /**
     * Determines whether the last ad in the timeline is marked as played.
     * @method OO.AdManagerController#isLastAdPlayed
     * @public
     * @returns {boolean} <code>true</code> if the last ad in the timeline is marked as played, <code>false</code> otherwise.
    */
    this.isLastAdPlayed = function() {
      return timeline.length == 0 || timeline[timeline.length - 1].played;
    };

    /**
     * Dispatchs a <code>WILL_PLAY_NONLINEAR_AD</code> event with the nonLinear ad URL.
     * @method OO.AdManagerController#sendURLToLoadAndPlayNonLinearAd
     * @public
     * @param {object} ad Contains the ad details.
     * @param {string} adId Contains the unique ID that the AMC provides to the ad.
     * @param {string} url The URL for the overlay image.
     * @fires OO.EVENTS.WILL_PLAY_NONLINEAR_AD
     */
    this.sendURLToLoadAndPlayNonLinearAd = function(ad, adId, url) {
      mb.publish(OO.EVENTS.PLAY_NONLINEAR_AD, {"ad":ad, "url": url});
      this.notifyNonlinearAdStarted(adId);

      // If url is null, do not show the close button; the close button is currently only supported on overlays that we
      // render. Additionally, close button should not be displayed if customer sets parameter to true without a url.
      if(url && this.adManagerSettings[SETTINGS.SHOW_NONLINEAR_CLOSE_BUTTON]) {
        mb.publish(OO.EVENTS.SHOW_NONLINEAR_AD_CLOSE_BUTTON);
      }
    };

    /**
     * Sets the flag allowSkipButtonToBeShow to True or false, called by the ad managers. NOTE: It is important to call
     * this function before starting to play the ad, so that the flag is set when the play head updates.
     * @method OO.AdManagerController#showSkipVideoAdButton
     * @public
     * @param {boolean} allowButton If set to true, then it will display the skip button if the page level param is also
     * set, if set to false, it will prevent the button from displaying even if the page level param is set to true.
     * @param {string} offset Optional parameter which includes a time offset value in seconds which must be met before skip button is shown.
     *                        If a percent ('%') is suffixed, will be treated as a percentage of duration rather than seconds. Will
     *                        only be accepted if allowButton is valid
     */
    this.showSkipVideoAdButton = function(allowButton, offset) {
      if(typeof allowButton === 'boolean') {
        adManagerShowSkipButton = allowButton;

        if (offset) {
          adManagerSkipButtonOffset = offset;
        }
      }
    };

    /**
     * Attempts to trigger the next ad. If there are ads in the ad queue appropriate for our current state, we will
     * play the first ad in the ad queue. Otherwise, we will publish ADS_PLAYED.
     * @private
     * @method OO.AdManagerController#_triggerNextAd
     * @fires OO.EVENTS.ADS_PLAYED
     */
    var _triggerNextAd = _.bind(function() {
      var linear = _inLinearAdMode();
      // Some ad managers will create a fake ad to take time to download the list of ads while the movie is paused.
      // If this happens they will be appended to the timeline by the time adPodEnded is called.  Check the timeline
      // immediately and trigger ads to prevent the main video from advancing if more ads were added at the current
      // time slot.
      var lastAdBreakOnly = seeked || (!started && currentPlayhead > 0) ||
                            this.startTime >= this.movieDuration;

      if (this.startTime >= this.movieDuration || this.ended) {
        currentPlayhead = Number.MAX_VALUE;
      }
      _populateQueue(currentPlayhead, lastAdBreakOnly);

      //We want to play an ad appropriate for the mode we are in. If we are in
      //linear ad mode, we want to play a linear ad if the next ad is linear.
      //If we are not in linear ad mode, we want to play a non linear ad.
      if (adQueue.length <= 0 || (adQueue[0] && !adQueue[0].isRequest && adQueue[0].isLinear !== linear)) {
        //if we're currently in linear ad mode, publish ads played to get out
        //since we have run out of linear ads to play
        if (linear) {
          mb.publish(OO.EVENTS.ADS_PLAYED);
        }
        return;
      }

      var nextAd = adQueue.shift();
      this.playAd(nextAd);
    }, this);

    var _resetRepeatAds = _.bind(function() {
      maxPlayhead = -1;
      repeatAds = [];
    }, this);

    var _getCurrentAd = function() {
      if (adQueue.length > 0) {
        return adQueue[0];
      }
      return null;
    };

    var _cancelCurrentAd = _.bind(function(cancelParams) {
      cancelling = true;
      if (currentAd && this.adManagers[currentAd.adManager]) {
        _notifyCancelAd(currentAd, cancelParams);
        // Overlay should be hidden by the ad manager now.  This should be done in cancelAd.
        mb.publish(OO.EVENTS.ADS_PLAYED);
      }
    }, this);

    var _notifyCancelAd = _.bind(function(ad, cancelParams) {
      if (ad && this.adManagers[ad.adManager]) {
        _safeFunctionCall(this.adManagers[ad.adManager], "cancelAd", [ad, cancelParams]);
      }
    }, this);

    //////// End Timeline Control ////////


    ///////// Ad Manager Control /////////

    /**
     * Update the url of the main stream content being played.
     * @public
     * @method OO.AdManagerController#updateMainStreamUrl
     * @param  {string} newUrl The new url to be used.
     * @fires OO.EVENTS.VC_UPDATE_ELEMENT_STREAM
     */
    this.updateMainStreamUrl = function(newUrl) {
      mb.publish(OO.EVENTS.VC_UPDATE_ELEMENT_STREAM, OO.VIDEO.MAIN, newUrl);
    };

    // TODO: If an ad manager calls this we should also raise WILL_PLAY_ADS somehow.
    // Maybe expose a different function to the ad managers
    /**
     * Triggers playback of an ad.
     * @public
     * @method OO.AdManagerController#playAd
     * @param {object} ad From <code>this.Ad</code>, the object representing the ad.
     * @fires OO.EVENTS.AD_POD_STARTED
     * @fires OO.EVENTS.WILL_PLAY_SINGLE_AD
     * @fires OO.EVENTS.WILL_PLAY_NONLINEAR_AD
     */
    this.playAd = function(ad) {
      if(!ad)
      {
        return;
      }

      // add the ad's current play position if it is a repeat ad
      if (isRepeatAd(ad)) {
        var position;

        // if firstPlay is true, it means that the currentAd playing is the first play of an ad that
        // is supposed to repeat. this issue/situation only happens if the repeat ad is a midroll and
        // the user seeks far past the midroll.
        if (ad.ad.firstPlay) {
          position = ad.position;
          ad.ad.firstPlay = false;
        }
        else {
          position = ad.ad.lastPlayed;
        }
        ad.ad.playTimes[position] = true;
      }

      cancelling = false;
      currentAd = ad;
      currentAd.played = true;

      if (ad.isLinear || ad.isRequest) {
        // Linear ad (not overlay)
        // These params may not be required
        OO.log("AMC: Will play a linear ad for time: " + ad.position + " at playhead " + currentPlayhead);

        // Setup functions to cancel and end ads
        var cancelAd = _.bind(function(mb, ad, adId){
            OO.log("AMC: Cancelling an ad due to timeout " + adId);
            _notifyCancelAd(ad, {
              code : this.AD_CANCEL_CODE.TIMEOUT
            });
            mb.publish(OO.EVENTS.SINGLE_AD_PLAYED, adId);
            mb.publish(OO.EVENTS.AD_POD_ENDED, adId);
          }, this, mb, ad, ad.id);

        setAdTimeouts(ad, cancelAd, MAX_AD_LOAD_TIMEOUT);

        // trigger ads
        if (ad.adManager && this.adManagers[ad.adManager]) {
          var videoRestrictions = this.adManagers[ad.adManager].videoRestrictions;
          if (ad.videoRestrictions) {
            videoRestrictions = ad.videoRestrictions;
          }
          if (ad.adType === this.ADTYPE.UNKNOWN_AD_REQUEST) {
            //we want to create the video element but not focus it
            mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, 'amc', startAdPlayback);
            mb.subscribe(OO.EVENTS.VC_ERROR, 'amc', _.bind(_stopAdOnVcError, this, ad.id));

            // Create video element
            this.ui.createAdVideoElement(ad.streams, videoRestrictions);
          } else if (ad.adType === this.ADTYPE.LINEAR_VIDEO && (!ad.ad || !ad.ad.ssai)) {
            // Play linear video ads through the ooyala player (vtc)
            mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, 'amc', videoElementCreated);
            mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_IN_FOCUS, 'amc', _.bind(startAdPlayback, this, ad));
            mb.subscribe(OO.EVENTS.VC_ERROR, 'amc', _.bind(_stopAdOnVcError, this, ad.id));

            // Create video element
            this.ui.createAdVideoElement(ad.streams, videoRestrictions);
          } else {
            //TODO: Currently will hide ssai ad controls to avoid pausing/resuming of ssai ad
            //(skin has too many states to consider)
            if (ad.ad.ssai) {
              mb.publish(OO.EVENTS.SHOW_AD_CONTROLS, false);
            }
            // Play linear overlay ads through the ad manager itself
            _safeFunctionCall(this.adManagers[ad.adManager], "playAd", [ad]);
          }
        } else {
          this.notifyPodEnded(ad.id);
        }
      } else {
        overlay = true;
        currentAd = ad;
        // Non-linear ad (overlay)
        //Storing the ad details so that if a video ad plays and ends we can redisplay the overlay.
        lastOverlayAd = currentAd;
        mb.publish(OO.EVENTS.WILL_PLAY_NONLINEAR_AD, ad);
      }
    };

    /**
    * Determines whether or not the current ad is a repeat ad.
    * @param currentAd The current ad to check
    */
    var isRepeatAd = _.bind(function(currentAd) {
      if (currentAd && currentAd.ad) {
        return currentAd.ad.repeatAfter;
      }
      return null;
    }, this);

    /**
    * Sets a timeout for the specified ad, and calls the specified callback
    * if the timeout occurs.
    * @param ad The ad for which to set the timeout.
    * @param callback The function to call when a timeout occurs.
    * @param duration The timeout limit.
    */
    var setAdTimeouts = _.bind(function(ad, callback, duration){
      //we want to avoid the situation where our ad timeout is
      //different from our ad manager's timeout if they control ads

      //until we can sync timeouts, we will not handle our ad timeout
      //if the ad manager is controlling ads
      if(ad && typeof callback === "function" && !this.isAdManagerControllingAds(ad.adManager))
      {
        adTimeouts[ad.id] = _.delay(callback, duration);
      }
    }, this);

    /**
     * Called when the ad video element is created. Will focus the ad element.
     * @private
     * @method OO.AdManagerController#videoElementCreated
     * @param {string} eventname The name of the event
     * @param {string} videoDetails The details of the video element that has been created
     */
    var videoElementCreated = _.bind(function(eventname, adDetails) {
      if (!(adDetails && adDetails["videoId"] === OO.VIDEO.ADS)) {
        return;
      }
      mb.unsubscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, 'amc');
      this.focusAdVideo();
    }, this);

    /**
     * Tells the ui class to transition to the ad video element.
     * @public
     * @method OO.AdManagerController#focusAdVideo
     */
    this.focusAdVideo = function() {
      this.ui.transitionToAd();
    };

    /**
     * Trigger ads from the ad manager itself and publish VTC play event.
     * @private
     * @method OO.AdManagerController#startAdPlayback
     * @param {object} ad The ad object to start playback on
     * @param {string} eventname The name of the event triggering this callback
     * @param {string} videoId The id of the video element
     * @fires OO.EVENTS.VC_PLAY
     */
    var startAdPlayback = _.bind(function() {
      mb.unsubscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, 'amc');
      mb.unsubscribe(OO.EVENTS.VC_VIDEO_ELEMENT_IN_FOCUS, 'amc');
      mb.unsubscribe(OO.EVENTS.VC_ERROR, 'amc');
      _safeFunctionCall(this.adManagers[currentAd.adManager], "playAd", [currentAd]);
      if (currentAd.adType === this.ADTYPE.LINEAR_VIDEO) {
        mb.publish(OO.EVENTS.VC_PLAY, OO.VIDEO.ADS);
      }
    }, this);

    /**
     */
    var handleAdStarted = _.bind(function(adId) {
      clearAdTimeout(adId);
      this.adStarted = true;
    }, this);

    /**
     * Helper function that checks if a timeout exists for a particular adId and
     * erases it.
     * @private
     * @method OO.AdManagerController#clearAdTimeout
     * @param adId The ad id whose timeout should be erased. (Ad id comes from the
     *        AMC when playAd() is called)
     */
    var clearAdTimeout = _.bind(function(adId) {
      if (adTimeouts && adTimeouts[adId]) {
        clearTimeout(adTimeouts[adId]);
        delete adTimeouts[adId];
      }
    }, this);

    /**
     * Stops the ad playback attempt upon error raised from VTC.
     * @private
     * @method OO.AdManagerController#_stopAdOnVcError
     * @param {string} adId The id of the ad (Ad.id)
     * @param {string} eventname The name of the event triggering the callback
     * @param {string} videoId The id of the video that encountered an error
     * @param {number} errorCode The error code associated with the VTC error
     */
    var _stopAdOnVcError = _.bind(function(adId, eventname, videoId, errorCode) {
      if (videoId !== OO.VIDEO.ADS) {
        return;
      }
      mb.unsubscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, 'amc');
      mb.unsubscribe(OO.EVENTS.VC_VIDEO_ELEMENT_IN_FOCUS, 'amc');
      mb.unsubscribe(OO.EVENTS.VC_ERROR, 'amc');
      if (currentAd && currentAd.isLinear && this.adManagers[currentAd.adManager]) {
        _safeFunctionCall(this.adManagers[currentAd.adManager], "adVideoError", [currentAd, errorCode]);
      }
      this.notifyPodEnded(adId);
    }, this);

    /**
     * Notifies the player that an ad or a set of podded ads has begun.  This cancels any ad timeouts.
     * @public
     * @method OO.AdManagerController#notifyPodStarted
     * @param {string} adId The ID of the ad (<code>Ad.id</code>).
     * @param {number} numberOfAds The number of ads in the pod or set.
     * @fires OO.EVENTS.AD_POD_STARTED
     */
    this.notifyPodStarted = function(adId, numberOfAds) {
      OO.log("AMC: Start ad pod " + adId);
      clearAdTimeout(adId);
      mb.publish(OO.EVENTS.AD_POD_STARTED, numberOfAds);
    };

    /**
     * Notifies the player that an ad or a set of podded ads has ended.
     * @public
     * @method OO.AdManagerController#notifyPodEnded
     * @param {string} adId The ID of the ad (<code>Ad.id</code>).
     * @fires OO.EVENTS.AD_POD_ENDED
     */
    this.notifyPodEnded = function(adId) {
      OO.log("AMC: End ad pod " + adId);
      pendingPodEnd = true;
      clearAdTimeout(adId);
      //We want to publish the UI messages before the ended message.
      //Otherwise, the ended message can queue up another ad, and we might
      //end up showing the UI for an ad when we don't want UI for with this line
      _showPlayerUi();
      mb.publish(OO.EVENTS.AD_POD_ENDED, adId);
    };

    /**
     * Notifies the player that a nonlinear ad has begun.  This cancels any ad timeouts.
     * @public
     * @method OO.AdManagerController#notifyNonlinearAdStarted
     * @param {string} adId The ID of the ad (<code>Ad.id</code>).
     */
    this.notifyNonlinearAdStarted = function(adId) {
      OO.log("AMC: Start of non-linear ad " + adId);
      handleAdStarted(adId);
    };

    /**
     * Notifies the player that a nonlinear ad has ended.
     * @public
     * @method OO.AdManagerController#notifyNonlinearAdEnded
     * @param {string} adId The ID of the ad (<code>Ad.id</code>).
     * @fires OO.EVENTS.NONLINEAR_AD_PLAYED
     */
    this.notifyNonlinearAdEnded = function(adId) {
      lastOverlayAd = null;
      OO.log("AMC: End of non-linear ad " + adId);
      //We want to publish the UI messages before the played message.
      //Otherwise, the played message can queue up another ad, and we might
      //end up showing the UI for an ad when we don't want UI for with this line
      _showPlayerUi();
      mb.publish(OO.EVENTS.NONLINEAR_AD_PLAYED, adId);
    };

    /**
     * Notifies the player that a single linear ad has started.  The ad may be within a pod of ads.
     * @public
     * @method OO.AdManagerController#notifyLinearAdStarted
     * @param {string} adId The id of the AMC ad recieved from playad()
     * @param {object} properties Properties of the ad.  This is an object containing
     *   <code>name</code> (string), <code>duration</code> (seconds), <code>clickUrl</code> (string), <code>indexInPod</code> (number indicating the position
     *   among podded ads (1 for first ad, 2 for second, etc), <code>skippable</code> (boolean).
     * @fires OO.EVENTS.WILL_PLAY_SINGLE_AD
     */
    this.notifyLinearAdStarted = function(adId, properties) {
      OO.log("AMC: Start of linear ad " + adId);
      singleAdPlaying = true;
      mb.publish(OO.EVENTS.WILL_PLAY_SINGLE_AD, properties);
      handleAdStarted(adId);
    };

    /**
     * Notifies the player that a single linear ad has ended.  The ad may be within a pod of ads.
     * @public
     * @method OO.AdManagerController#notifyLinearAdEnded
     * @param {string} adId The ID of the ad (<code>Ad.id</code>).
     * @fires OO.EVENTS.SINGLE_AD_PLAYED
     */
    this.notifyLinearAdEnded = function(adId) {
      OO.log("AMC: End of linear ad " + adId);
      singleAdPlaying = false;
      clearTimeout(skipButtonTimeout);
      mb.publish(OO.EVENTS.SINGLE_AD_PLAYED, adId);
    };

    /**
     * Requests the player to hide its UI. Used by Ad Managers that handle their own UI.
     * @public
     * @method OO.AdManagerController#hidePlayerUi
     * @fires OO.EVENTS.SHOW_AD_MARQUEE
     */
    this.hidePlayerUi = function() {
      mb.publish(OO.EVENTS.SHOW_AD_CONTROLS, false);
      mb.publish(OO.EVENTS.SHOW_AD_MARQUEE, false);
    };

    /**
     * Requests the player to show its UI.
     * @private
     * @method OO.AdManagerController#_showPlayerUi
     * @fires OO.EVENTS.SHOW_AD_MARQUEE
     */
    var _showPlayerUi = _.bind(function() {
      mb.publish(OO.EVENTS.SHOW_AD_CONTROLS, true);
      mb.publish(OO.EVENTS.SHOW_AD_MARQUEE, true);
    }, this);

    /**
     * Raises an ads error on the message bus.
     * @method OO.AdManagerController#raiseAdError
     * @protected
     * @param {(object|string)} error The error name or information.
     * @fires OO.EVENTS.ADS_ERROR
     */
    this.raiseAdError = function(error) {
      mb.publish(OO.EVENTS.ADS_ERROR, error);
    };

    ///// AD MANAGER MESSAGE BUS APIs /////

    /**
     * Adds listeners on events in <code>AdManagerController.EVENTS</code> that are triggered by this class.
     * @public
     * @method OO.AdManagerController#addPlayerListener
     * @param {string} eventname The name of the event for which this callback is called.
     * @param {function} callback The listener callback function.
     */
    this.addPlayerListener = function(eventname, callback) {
      // Ad managers can call this to listen to events through the AdManagerController
      // Throw warning if selecting an event that's not allowed?
      if (_.indexOf(_.values(this.EVENTS), eventname) < 0) return;

      if (managerListeners[eventname] == null) {
        managerListeners[eventname] = [];
      }

      if (!_.isFunction(callback)) return;
      managerListeners[eventname].push(callback);
    };

    /**
     * Removes listeners on events in <code>AdManagerController.EVENTS</code> that are triggered by this class.
     * @public
     * @method OO.AdManagerController#removePlayerListener
     * @param {string} eventname The name of the event for which this callback is called.
     * @param {function} callback The listener callback function.
     */
    this.removePlayerListener = function(eventname, callback) {
      var callbackList = managerListeners[eventname];
      if (callbackList) {
        var index = callbackList.indexOf(callback);
        if (index >= 0) {
          callbackList.splice(index, 1);
        }
        if (callbackList.length <= 0) {
          delete managerListeners[eventname];
        }
      }
    };

    // Trigger callbacks on behalf of the ad managers
    var _triggerAdManagerCallback = _.bind(function(playEvent) {
      if (managerListeners[playEvent] && _.isArray(managerListeners[playEvent])) {
        for (var i = 0; i < managerListeners[playEvent].length; i++) {
          managerListeners[playEvent][i].apply(this, arguments);
        }
      }
    }, this);


    ///// Playback Listeners /////

    /**
     * Called when playback is triggered.  Resumes ad playback if an ad was playing.
     * @method OO.AdManagerController#onPlay
     * @protected
     * @fires OO.EVENTS.WILL_RESUME_ADS
     */
    this.onPlay = function() {
      // to be safe, again check linear ad mode
      if ($.inArray(this.currentState, states_linearAd) < 0 || !this.adStarted) return;

      // apply the play to the linear ad
      mb.publish(OO.EVENTS.WILL_RESUME_ADS);
    };

    /**
     * A new stream is being played, checks the timeline for ads before playback begins.
     * @method OO.AdManagerController#onInitialPlay
     * @protected
     * @fires this.EVENTS.INITIAL_PLAY_REQUESTED
     * @fires OO.EVENTS.BUFFERING
     * @fires OO.EVENTS.WILL_PLAY_ADS
     */
    this.onInitialPlay = function() {
      if (this.startTime <= 0) {
        currentPlayhead = 0;
        this.startTime = 0;
      }

      // [PBK-255] [PBW-199] [PBW-223]
      if (OO.isAndroid && OO.isChrome) {
        // Required to pass OO.VIDEO.MAIN so that the video controller knows to reload this element
        // even if it's not in focus
        mb.publish(OO.EVENTS.VC_RELOAD, OO.VIDEO.MAIN);
      }

      _triggerAdManagerCallback(this.EVENTS.INITIAL_PLAY_REQUESTED);

      //Set the current playhead to the start time so we only play the ad pod
      //that is closest to the start time and skip other previous ones.
      currentPlayhead = this.startTime;

      // trigger ads
      _checkTimeline(currentPlayhead, currentPlayhead > 0);
    };

    /**
     * Called when a replay is triggered.  Resets AMC settings and triggers prerolls.
     * @protected
     * @method OO.AdManagerController#onReplay
     */
    this.onReplay = function() {
      // Movie state Properties
      this.startTime  = 0;
      currentPlayhead = 0;

      _resetMovieState();
      _resetAdState();
      _resetPlaybackEventDependencies();
      _resetRepeatAds();

      _triggerAdManagerCallback(this.EVENTS.REPLAY_REQUESTED);

      //clear the timeline if we want to replay ads
      if (this.adManagerSettings[SETTINGS.REPLAY_ADS]) {
        timeline = [];
        _buildTimeline();
      } else {
        _.each(timeline, _.bind(function (ad) { ad.played = true; }, this));
      }
      _checkTimeline(0, false);
    };

    /**
     * Called when a stream is first played.  Used to set the <code>lastEmbedCode</code> field.
     * @protected
     * @method OO.AdManagerController#onWillPlayFromBeginning
     */
    this.onWillPlayFromBeginning = function() {
      if (started) return;
      if ($.inArray(this.currentState, states_linearAd) >= 0) return;
      lastEmbedCode = this.currentEmbedCode;
    };

    /**
     * Called when the embed code is set for a movie.
     * @protected
     * @method OO.AdManagerController#onSetEmbedCode
     * @param {string} eventname The name of the event for which this callback is called.
     * @param {string} embedCode The video’s Ooyala content ID found in Backlot.
     * @param {object} options Page level settings for the new embed code.
     */
    this.onSetEmbedCode = function(eventname, embedCode, options) {
      if (options) {
        this.pageSettings = _.extend(this.pageSettings, options);
      }
    };

    /**
     * Called when the embed code is changed.<br/>
     * If the embed code is new:<br/>
     * <ul><li>ad timelines are reset</li>
     *     <li>new metadata will be loaded</li>
     *     <li>ad managers are marked as not ready</li>
     *     <li><code>adManager['loadMetadata']</code> is called with the new metadata</li>
     * @protected
     * @method OO.AdManagerController#onEmbedCodeChanged
     * @param {string} eventname The name of the event for which this callback is called.
     * @param {string} embedcode The video’s Ooyala content ID found in Backlot.
     * @fires this.EVENTS.CONTENT_CHANGED
     * @fires OO.EVENTS.WILL_PLAY_ADS
     */
    this.onEmbedCodeChanged = function(eventname, embedcode) {
      // Mark each ad manager as not ready - need to load new metadata
      for (var name in this.adManagers) {
        this.adManagers[name].ready = false;
      }

      if (embedcode != this.currentEmbedCode) {
        lastEmbedCode = this.currentEmbedCode;
      }
      this.currentEmbedCode = embedcode;
      if (lastEmbedCode != '' && lastEmbedCode != this.currentEmbedCode) {
        _triggerAdManagerCallback(this.EVENTS.CONTENT_CHANGED);
        _handleNewStream();
      }
    };

    /**
     * Called when a video time changes.
     * If the main video is not paused or seeking, then the timeline is checked for ads to play.
     * @protected
     * @method OO.AdManagerController#onPlayheadTimeChanged
     * @param {string} eventname The name of the event for which this callback is called.
     * @param {number} playhead Current video time (seconds).
     * @param {number} duration Duration of the current video (seconds)
     * @fires this.EVENTS.PLAYHEAD_TIME_CHANGED
     * @fires OO.EVENTS.WILL_PLAY_ADS
     */
    this.onPlayheadTimeChanged = function(eventname, playhead, duration, buffer, seekRange, videoId) {
      if (videoId === OO.VIDEO.MAIN) {
        //for main content playheads, we are reading the playhead time to determine
        //when to start ad playback

        // Throw out playheads before we started playback
        if (!started || this.ended) {
          return;
        }

        currentPlayhead = playhead;
        this.movieDuration = duration;

        if (playhead > maxPlayhead) {
          maxPlayhead = playhead;
        }

        if (paused || seeked || seeking) {
          return;
        }

        if (!reachedStartTime && currentPlayhead > this.startTime) {
          OO.log("Reached start time at playhead: " + currentPlayhead + " for start time: " + this.startTime);
          reachedStartTime = true;
        }

        if (this.startTime == -1) {
          this.startTime = currentPlayhead;
          return;
        }

        //Do not play additional ads if we are currently in ad mode
        var linear = _inLinearAdMode();
        if (linear) {
          return;
        }

        // Set to true in order to only play the last ad on the timeline when it reaches
        // the new time.
        if (reachedStartTime) {
          _checkTimeline(currentPlayhead, true);
        }

        // Call ad manager listeners
        _triggerAdManagerCallback(this.EVENTS.PLAYHEAD_TIME_CHANGED, playhead, duration);
      } else if (videoId === OO.VIDEO.ADS) {
        //for ad playheads, we are reading the playhead time to determine
        //when to show the skip ad button

        var adManagerSetting = {};
        adManagerSetting[SETTINGS.SHOW_LINEAR_AD_SKIP_BUTTON] = adManagerShowSkipButton;
        //Retrieve the skip button setting prioritized by: page level, XML (via ad manager),
        //then provider level/default value
        var showSkipButton = getSetting(SETTINGS.SHOW_LINEAR_AD_SKIP_BUTTON,
                                                [
                                                  this.pageSettings,
                                                  adManagerSetting,
                                                  this.adManagerSettings
                                                ]);

        if (typeof showSkipButton !== 'undefined') {
          showSkipButton = _stringToBoolean(showSkipButton);
        }

        if (showSkipButton) {
          var adManagerOffset;
          //Calculate the XML provided offset depending on if it was provided as a percent or in seconds
          if (adManagerSkipButtonOffset) {
            if (adManagerSkipButtonOffset.indexOf('%') === adManagerSkipButtonOffset.length - 1) {
              adManagerOffset = parseInt(adManagerSkipButtonOffset)/100 * currentAd.duration;
            } else {
              adManagerOffset = parseInt(adManagerSkipButtonOffset);
            }
          }
          adManagerSetting[SETTINGS.LINEAR_AD_SKIP_BUTTON_START_TIME] = adManagerOffset;
          //Priority (most to least): page level, XML (via ad manager), provider level/default value
          var triggerPoint = getSetting(SETTINGS.LINEAR_AD_SKIP_BUTTON_START_TIME,
                                        [
                                          this.pageSettings,
                                          adManagerSetting,
                                          this.adManagerSettings
                                        ]);

          if (_.isNumber(triggerPoint) && triggerPoint >= 0) {
            if (playhead >= triggerPoint) {
              mb.publish(OO.EVENTS.SHOW_AD_SKIP_BUTTON);
            }
          }
        }

        // Call ad manager listeners
        _triggerAdManagerCallback(this.EVENTS.AD_PLAYHEAD_TIME_CHANGED, playhead, duration);
      }
    };

    /**
     * Retrieves the value of a setting (key). Iterates through the provided settings to grab the first
     * value it can find for the provided key. Prioritized from first item in the array to the last.
     * @private
     * @method OO.AdManagerController#getSetting
     * @param {string} setting The setting to retrieve (the key)
     * @param {array} settings The settings to iterate through. Prioritized from first to last. Each item
     *                         in the array must be an object with key value pairs.
     * @return {object|boolean|string} The retrieved setting (the value), if found. Otherwise returns undefined
     */
    var getSetting = _.bind(function(setting, settings) {
      var settingsObject, value;
      for(var i = 0; i < settings.length; i++){
        settingsObject = settings[i];
        value = settingsObject[setting];
        if (typeof value !== 'undefined') {
          break;
        }
      }
      return value;
    }, this);

    /**
     * Called when pause is triggered.
     * @protected
     * @method OO.AdManagerController#onPause
     * @fires this.EVENTS.PAUSE
     * @fires OO.EVENTS.WILL_PAUSE_ADS
     */
    this.onPause = function() {
      // If in linear ad mode, apply the controls to the ad
      if ($.inArray(this.currentState, states_linearAd) >= 0 && this.adStarted) {
        // apply the pause to the linear ad
        if (currentAd && this.adManagers[currentAd.adManager]) {
          mb.publish(OO.EVENTS.WILL_PAUSE_ADS);
        }
        return;
      }

      paused = true;

      // If the state is overlay, pause the overlay counter
      if (overlay) {
        var pauseOverlayTimer = 'pauseOverlayTimer';
        _triggerAdManagerCallback(pauseOverlayTimer);
      }

      // Call ad manager listeners
      if (started) {
        _triggerAdManagerCallback(this.EVENTS.PAUSE);
      }
    };

    /**
     * Called when an ad will be paused.  Triggers pauseAd in the appropriate ad manager.
     * @protected
     * @method OO.AdManagerController#onWillPauseAds
     */
    this.onWillPauseAds = function() {
      if (currentAd && this.adManagers[currentAd.adManager]) {
        _safeFunctionCall(this.adManagers[currentAd.adManager], "pauseAd", [currentAd]);
        mb.publish(OO.EVENTS.VC_PAUSE, OO.VIDEO.ADS);
        adPaused = true;
      }
    };

    /**
     * Called when an ad will be resumed.  Triggers resumeAd in the appropriate ad manager.
     * @protected
     * @method OO.AdManagerController#onWillResumeAds
     */
    this.onWillResumeAds = function() {
      if (currentAd && this.adManagers[currentAd.adManager]) {
        _safeFunctionCall(this.adManagers[currentAd.adManager], "resumeAd", [currentAd]);
        mb.publish(OO.EVENTS.VC_PLAY, OO.VIDEO.ADS);
        adPaused = false;
      }
    };

     /**
     * Handle seek.
     * Note: This gets called on scrubber seek but not on button seek unless the player is paused.
     * @protected
     * @method OO.AdManagerController#onWillPlay
     * @param {string} eventname The name of the event for which this callback is called
     * @param {string} streamurl The url of the stream about to play
     * @fires this.EVENTS.PLAY_STARTED
     * @fires OO.EVENTS.WILL_PLAY_ADS
     */
    this.onWillPlay = function(eventname, streamurl) {
      // Notify ad managers of initial play
      if (!started) {
        _triggerAdManagerCallback(this.EVENTS.PLAY_STARTED);
      }

      if (paused && startTriggered) {
        _triggerAdManagerCallback(this.EVENTS.RESUME, streamurl)
      }

      if (startTriggered) {
        started = true;
      }

      if (!paused) return;
      paused = false;

      if (seeked) {
        _handleSeek();
      }
    };

    /**
     * Called when a video is told to play.  Tracks whether or not the main video has been told to play.
     * @private
     * @method OO.AdManagerController#onVideoPlay
     */
    var onVideoPlay = _.bind(function(event, videoId) {
      if (videoId == OO.VIDEO.MAIN) {
        startTriggered = true;
      }
    }, this);

    /**
     * Called when main video is playing
     * @protected
     * @method OO.AdManagerController#onPlaying
     */
    this.onPlaying = function() {
      seeking = false;
      started = true;
    };

    /**
     * Called when a video completes.
     * @protected
     * @method OO.AdManagerController#onVideoPlayed
     */
    this.onVideoPlayed = function(event, videoId) {
      if (videoId === OO.VIDEO.MAIN) {
        onContentVideoPlayed(event, videoId);
      } else if (videoId === OO.VIDEO.ADS) {
        if (currentAd && currentAd.isLinear && this.adManagers[currentAd.adManager]) {
          _safeFunctionCall(this.adManagers[currentAd.adManager], "adVideoEnded");
        }
      }
    };

    /**
     * Called when a video element comes into focus.
     * @protected
     * @method OO.AdManagerController#onVideoElementInFocus
     * @param event     the event name
     * @param videoId   the id of the element that came into focus
     */
    this.onVideoElementInFocus = function(event, videoId) {
      //notify the ad managers of the focus
      if (videoId === OO.VIDEO.MAIN) {
        _showPlayerUi();
        _triggerAdManagerCallback(this.EVENTS.MAIN_CONTENT_IN_FOCUS);
      }
    };

    // TODO: This didn't get called after failed postroll
    /**
     * Called when the video in the main video element ends.
     * Triggers postrolls.
     * @private
     * @method OO.AdManagerController#onContentVideoPlayed
     * @fires OO.EVENTS.WILL_PLAY_ADS
     * @fires this.EVENTS.CONTENT_COMPLETED
     */
    var onContentVideoPlayed = _.bind(function(event, videoId) {
      // Ignore if not the main content video
      if (videoId !== OO.VIDEO.MAIN) return;

      // If an overlay is playing, stop it now
      //(PIliev) This needs to happen before this.ended = true
      //so that we don't try to show the end screen before playing postrolls
      //and end up with no end screen after postroll.
      //(AngieIsrani)we need to test for the case where ended = true before all of the
      //events triggered by CancelledCurrentAd are handled which in turn brings
      //the end screen error back
      if (overlay) {
        _cancelOverlay();
      }

      this.ended = true;

      //In order to prevent the overlay from appearing on replay after the post-roll we must null out the var.
      lastOverlayAd = null;
      overlay = false;
      this.waitForPostrollToPlay = false;
      _triggerAdManagerCallback(this.EVENTS.CONTENT_COMPLETED);
      _checkTimeline(Number.MAX_VALUE, false, STATES.CONTENT_VIDEO_PLAYED);
    }, this);

    // TODO: Does this get called on embed code change from pause
    /**
     * Called when a stream has completed.
     * @protected
     * @method OO.AdManagerController#onPlayed
     * @fires this.EVENTS.CONTENT_COMPLETED
     */
    this.onPlayed = function() {
      started = false;
      startTriggered = false;
      lastEmbedCode = this.currentEmbedCode;
    };

    /**
     * Called while a video is seeking.  Updates the current playhead if a video ad is not playing.
     * @protected
     * @method OO.AdManagerController#onSeek
     * @param {string} eventname The name of the event for which this callback is called
     * @param {number} playhead The current video position (seconds)
     */
    this.onSeek = function(eventname, playhead) {
      if ($.inArray(this.currentState, states_linearAd) >= 0) {
        // Trigger a seek on ads
        if (currentAd && currentAd.adManager) {
          _safeFunctionCall(this.adManagers[currentAd.adManager], "seekAd");
        }

        return;
      }

      //if a seek is detected that does not go to start time
      //this means another seek other than the initial seek has occurred.
      //We consider this as having reached the start time as well
      //(for the purposes of gating checkTImelines for playhead changes and seeks)
      if (!reachedStartTime && playhead != this.startTime) {
        reachedStartTime = true;
      }

      // If true, will skip ads when seeking on the specific threshold
      skipAdsOnSeek = playhead >= seekToEndThreshold;
      seekedPosition = playhead;
      currentPlayhead = playhead;
      seeking = true;
    };

    /**
     * Called when a video has seeked.  If an ad is playing, do nothing.<br/>
     * If it just returned from playing a video ad in single element mode, switch back to the content video.<br/>
     * If the stream started from an offset note that the video has now started.<br/>
     * If not currently scrubbing, check the timeline if any ads were skipped over.<br/>
     * Note: Does not get called on seek to beginning.<br/>
     * &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Does get called while scrubbing and at scrubbed and after willPlay
     * if weren't paused.
     * @protected
     * @method OO.AdManagerController#onSeeked
     * @param {string} eventname The name of the event
     * @param {?number} playhead The current time of the video after seeking.
     * @fires OO.EVENTS.WILL_PLAY_ADS
     */
    this.onSeeked = function(eventname, playhead) {
      if (typeof playhead === "number") {
        currentPlayhead = playhead;
      }
      if (playhead > maxPlayhead) {
        maxPlayhead = playhead;
      }
      seeking = false;
      _tryHandleSeek();
    };

    /**
     * Called when video started playback. Notifies ad managers of the event.
     * @protected
     * @method OO.AdManagerController#onVideoPlaying
     * @param {string} event The event name
     * @param {string} videoId The id of the video that started playback
     */
    this.onVideoPlaying = function(event, videoId) {
      if (videoId === OO.VIDEO.ADS && currentAd) {
        _safeFunctionCall(this.adManagers[currentAd.adManager], "adVideoPlaying");
      }
    };

    /**
     * Reset ad manager controller on stream play failed.
     * @protected
     * @method OO.AdManagerController#onVideoPlayFailed
     * @param {string} event The name of the event triggering the callback
     * @param {string} videoId The id of the video that encountered an error
     * @param {number} errorCode The error code associated with the VTC error
     */
    this.onVideoPlayFailed = function(event, videoId, errorCode) {
      if (videoId === OO.VIDEO.ADS) {
        if(currentAd && currentAd.isLinear && this.adManagers[currentAd.adManager]) {
          _safeFunctionCall(this.adManagers[currentAd.adManager], "adVideoError", [currentAd, errorCode]);
        }
      } else if (videoId === OO.VIDEO.MAIN) {
        // TODO: Verify that reset is the correct action to take on stream playback failure
        _reset();
      }
    };

    ///// Playback Handling /////

    var _resetSeekState = _.bind(function() {
      seeked = false;
      seeking = false;
    }, this);

    /**
     * Helper function to determine checking the timeline for ad is needed.
     * @private
     * @method OO.AdManagerController#_tryHandleSeek
     */
    var _tryHandleSeek = _.bind(function() {
      if (!started) return;

      seeking = false;
      seeked = true;
      if (!paused) {
        _handleSeek();
      }
    }, this);

    /**
     * After seeking, check the timeline for ads.
     * @private
     * @method OO.AdManagerController#_handleSeek
     */
    var _handleSeek = _.bind(function() {
      _resetSeekState();

      if (reachedStartTime) {
        _checkTimeline(currentPlayhead, true, STATES.SEEKED);
      }
    }, this);

    // Reset data on new stream and trigger prerolls
    var _handleNewStream = _.bind(function() {
      _cancelCurrentAd({
        code : this.AD_CANCEL_CODE.STREAM_ENDED
      });
      _reset();
      newStreamHandling = true;
    }, this);


    ///// Settings Listeners /////

    /**
     * Will raise an event to tell the ad manager that it has entered or exited fullscreen mode.
     * @private
     * @method OO.AdManagerController#onFullscreenChanged
     * @param {string} eventname The name of the event for which this callback is called
     * @param {boolean} isFullscreen The current fullscreen state
     * @fires this.EVENTS.FULLSCREEN_CHANGED
     */
    this.onFullscreenChanged = function(eventname, isFullscreen) {
      if (isFullscreen !== lastFullscreenState) {
        _triggerAdManagerCallback(this.EVENTS.FULLSCREEN_CHANGED, isFullscreen);
        lastFullscreenState = isFullscreen;
      }
    };

    /**
     * Called when the video size changes.  Note down the new size and raise event to ad managers.
     * @protected
     * @method OO.AdManagerController#onSizeChanged
     * @param {string} event The sizeChanged event name
     * @param {number} width The new player width
     * @param {number} height The new player height
     * @fires this.EVENTS.SIZE_CHANGED
     */
    this.onSizeChanged = function(event, width, height) {
      if (width < 0 || height < 0) return;
      this.ui.height = height;
      this.ui.width = width;
      // Call ad manager listeners
      _triggerAdManagerCallback(this.EVENTS.SIZE_CHANGED, width, height);
    };

    /**
     * Called when the control bar is shown. Raises event to ad managers.
     * @protected
     * @method OO.AdManagerController#onControlsShown
     * @fires this.EVENTS.CONTROLS_SHOWN
     */
    this.onControlsShown = function() {
      _triggerAdManagerCallback(this.EVENTS.CONTROLS_SHOWN);
    };

    /**
     * Called when the control bar is shown. Raises event to ad managers.
     * @protected
     * @method OO.AdManagerController#onControlsHidden
     * @fires this.EVENTS.CONTROLS_HIDDEN
     */
    this.onControlsHidden = function() {
      _triggerAdManagerCallback(this.EVENTS.CONTROLS_HIDDEN);
    };

    /**
     * Ad managers that use VTC video elements will not need to take action on volume change.  Ad managers
     * who do not use VTC video elements will need to listen on the VOLUME_CHANGED event and trigger the
     * change manually.
     * @protected
     * @method OO.AdManagerController#onVolumeChanged
     * @param {string} eventname The name of the event for which this callback is called
     * @param {number} volume The current volume level
     * @param {string} videoId The video tech id of the element disposed
     */
    this.onVolumeChanged = function(eventname, volume, videoId) {
      _triggerAdManagerCallback(this.EVENTS.VOLUME_CHANGED, volume);
      if (videoId === OO.VIDEO.ADS) {
        _triggerAdManagerCallback(this.EVENTS.AD_VOLUME_CHANGED, volume);
      }
    };


    ///// Interaction Listeners /////

    /**
     * When an ad is clicked.  If the ad is playing and if possible, pause the ad and show controls.
     * If the ad was paused, resume it and hide controls if necessary. However if SETTINGS.ALLOW_AD_CLICK_THROUGH_ON_VIDEO
     * is set to false, default is true, then we want to ignore the click if it comes from the video window.
     * @public
     * @method OO.AdManagerController#adsClicked
     * @param {object} prop The argument from the event that contains an object having the source from which the button
     * was clicked.
     */
    this.adsClicked = function(prop) {
      if (!currentAd) {
        return;
      }

      if (adPaused && (!prop || (prop.source != "learnMoreButton"))) {
        mb.publish(OO.EVENTS.PLAY);
       } else {
        if (this.adManagerSettings[SETTINGS.PAUSE_AD_ON_CLICK]) {
          //Dispatch pause event to pause the main video when an overlay is clicked.
          if (currentAd && !currentAd.isLinear) {
            mb.publish(OO.EVENTS.PAUSE);
          } else {
            this.onPause();
          }
        }
        if((currentAd.isLinear && (!this.adManagerSettings[SETTINGS.ALLOW_AD_CLICK_THROUGH_ON_VIDEO]
          && prop && prop.source == "videoWindow"))) {
          return;
        }
        if (this.adManagers[currentAd.adManager]) {
          _safeFunctionCall(this.adManagers[currentAd.adManager], "playerClicked", [currentAd, true]);
        }
      }
    };

    /**
     * Called when an ad's clickthrough URL is opened. Currently, it is called by each individual ad manager
     * because clickthroughs behave differently across the different ad managers (Google IMA, FreeWheel, VAST).
     * @public
     * @method OO.AdManagerController#adsClickthroughOpened
     * @fires OO.EVENTS.ADS_CLICKTHROUGH_OPENED
     */
    this.adsClickthroughOpened = function() {
      mb.publish(OO.EVENTS.ADS_CLICKTHROUGH_OPENED);
    };

    /**
     * When the ad is closed with the X button, cancel the ad.
     * @public
     * @method OO.AdManagerController#onSkipAd
     */
    this.onSkipAd = function() {
      if (this.currentState == 'LinearAd') {
        OO.log("AMC: Canceling linear ad due to skip button clicked.");
        _notifyCancelAd(currentAd, {
          code : this.AD_CANCEL_CODE.SKIPPED
        });
      } else if (this.currentState == 'Overlay') {
        OO.log("AMC: Canceling nonlinear ad due to skip button clicked.");
       _cancelOverlay();
      }
    };

    /**
     * Cancels the current overlay. Notifies the overlay's ad manager of the event.
     * @private
     * @method OO.AdManagerController#_cancelOverlay
     */
    var _cancelOverlay = _.bind(function() {
      if (overlay && currentAd && this.adManagers[currentAd.adManager]) {
        cancelling = true;
        _safeFunctionCall(this.adManagers[currentAd.adManager], "cancelOverlay", [currentAd]);
        mb.publish(OO.EVENTS.NONLINEAR_AD_PLAYED, currentAd.id);
      }
    }, this);

    ///// Events Raised Locally Listeners /////

    var _enterAdMode = _.bind(function(adEventDetails) {
      _resetSeekState();

      // If an overlay is playing, hide it now
      if (overlay && currentAd && this.adManagers[currentAd.adManager]) {
        if (_.isFunction(this.adManagers[currentAd.adManager].hideOverlay)) {
          _safeFunctionCall(this.adManagers[currentAd.adManager], "hideOverlay", [currentAd]);
          mb.publish(OO.EVENTS.HIDE_NONLINEAR_AD);
        }
        else {
          //If an overlay is playing and the ad manager cancels the overlay instead of just hiding it, we need to update
          // the state of the the AMC to know that it is cancelled and done so we don't trigger the next ad in the queue
          // if the overlay calls adPodEnded. It also calls the cancelOverlay function inside of the ad admanager.
          _cancelOverlay();
        }
      }

      mb.publish(OO.EVENTS.WILL_PLAY_ADS, adEventDetails);
    }, this);

    var _inLinearAdMode = _.bind(function() {
      return $.inArray(this.currentState, states_linearAd) >= 0;
    }, this);

    var _prepareAndTriggerAd = _.bind(function() {
      _triggerNextAd();
    }, this);

    /**
     * Called when ad mode is beginning.
     * Either notifies that the main content video will be unloaded or triggers the first ad in the set.
     * @protected
     * @method OO.AdManagerController#onWillPlayAds
     * @fires OO.EVENTS.AD_POD_STARTED
     * @fires OO.EVENTS.WILL_PLAY_SINGLE_AD
     */
    this.onWillPlayAds = function() {
      _prepareAndTriggerAd();
    };

    /**
     * When this function is called, the state machine switches to LinearAd. This empty function must exist
     * for the state machine to change states.
     * @protected
     * @method OO.AdManagerController#onAdPodStarted
     */
    this.onAdPodStarted = function() {
      mb.publish(OO.EVENTS.DISABLE_SEEKING, OO.VIDEO.ADS);
    };

    /**
     * Sets overlay state.  Shows the overlay.
     * @protected
     * @method OO.AdManagerController#onWillPlayNonlinearAd
     * @param {string} eventname The name of the event for which this callback is called
     * @param {object} ad The ad that will be played
     */
    this.onWillPlayNonlinearAd = function(eventname, ad) {
      // Setup functions to cancel and end ads
      var cancelAd = _.bind(function(mb, ad, adId){
        lastOverlayAd = null;
        OO.log("AMC: Cancelling a non-linear ad due to timeout " + adId);
        _notifyCancelAd(ad, {
          code : this.AD_CANCEL_CODE.TIMEOUT
        });
        mb.publish(OO.EVENTS.NONLINEAR_AD_PLAYED, adId);
      }, this, mb, ad, ad.id);

      setAdTimeouts(ad, cancelAd, MAX_AD_LOAD_TIMEOUT);

      // trigger ads
      if (ad.adManager && this.adManagers[ad.adManager]) {
        _safeFunctionCall(this.adManagers[ad.adManager], "playAd", [ad]);
      } else {
        this.notifyNonlinearAdEnded(ad.id);
      }
    };

    /**
     * Callback for when linear ads start to play.
     * @protected
     * @method OO.AdManagerController#onPlayNonlinearAd
     */
    this.onPlayNonlinearAd = function() {
      //Must be defined so the state machine remains in the proper state (overlay state)
    };

    var _handleEndOfAd = _.bind(function(adId) {
      _resetAdState();
      if (!cancelling) {
        // only trigger more ads if we're not in ad-cancelling mode
        _triggerNextAd();
      }
    }, this);

    /**
     * Trigger next queued ad if the ended ad is the current ad.
     * @protected
     * @method OO.AdManagerController#onAdPodEnded
     * @param {string} eventname The name of the event for which this callback is called
     * @param {string} adId ID of the ad that finished playing
     * @fires OO.EVENTS.AD_POD_STARTED
     * @fires OO.EVENTS.WILL_PLAY_SINGLE_AD
     */
    this.onAdPodEnded = function(eventname, adId) {
      pendingPodEnd = false;
      mb.publish(OO.EVENTS.ENABLE_SEEKING, OO.VIDEO.ADS);
      mb.publish(OO.EVENTS.VC_SET_VIDEO_STREAMS, OO.VIDEO.ADS, null);
      _handleEndOfAd(adId);
    };

    /**
     * Trigger next queued ad if the ended ad is the current ad.
     * @protected
     * @method OO.AdManagerController#onNonlinearAdPlayed
     * @param {string} eventname The name of the event for which this callback is called
     * @param {string} adId The ID of the ad that has ended
     * @fires OO.EVENTS.AD_POD_STARTED
     * @fires OO.EVENTS.WILL_PLAY_SINGLE_AD
     */
    this.onNonlinearAdPlayed = function(eventname, adId) {
      // Overlay should be hidden by the ad manager now.
      _handleEndOfAd(adId);
    };

    /**
    * Checks to see if all ads are done. If so, handles the necessary state changes
    * and publishes the required events for when all ads are done.
    * @protected
    * @method OO.AdManagerController#tryAdsCompleted
    * @fires OO.EVENTS.AMC_ALL_ADS_DONE
    * @returns {boolean} True if it is determined that all ads are done, false otherwise
    */
    this.tryAdsCompleted = function() {
      var allDone = false;
      //if the next ad is a non linear ad, we still want to publish AMC_ALL_ADS_DONE assuming
      //the other conditions are met
      if (this.ended && !this.waitForPostrollToPlay && (adQueue.length <= 0 || (adQueue[0] && !adQueue[0].isLinear && !adQueue[0].isRequest))) {
        this.waitForPostrollToPlay = true;
        this.ui.transitionToMainContent(false, this.ended);
        allDone = true;
        OO.log("AMC: All ads completed, unblocking played event");
        mb.publish(OO.EVENTS.AMC_ALL_ADS_DONE);
      }
      return allDone;
    };

    /**
     * Resumes the content video after ads are completed.  Re-enables controls and ends ad mode.
     * @protected
     * @method OO.AdManagerController#onAdsPlayed
     * @fires OO.EVENTS.AMC_ALL_ADS_DONE
     * @fires OO.EVENTS.AMC_PREROLLS_DONE
     * @fires OO.EVENTS.ENABLE_PLAYBACK_CONTROLS
     */
    this.onAdsPlayed = function() {
      cancelling = false;

      if (this.tryAdsCompleted()) {
        return;
      }

      //We do not want to disturb the play/pause state if the main content is in focus
      //so only resume when ad is in focus
      var shouldResume = !newStreamHandling && startTriggered && this.ui.isAdInFocus();
      this.ui.transitionToMainContent(shouldResume, this.ended);

      // resume from preroll, NOTE: (started=false) on replay unless in single element mode
      if (!started && !newStreamHandling) {
        mb.publish(OO.EVENTS.AMC_PREROLLS_DONE);
      }

      //This will trigger any pending overlays
      _triggerNextAd();

      _resetAdState();

      // Reshow the overlay if the ad finished playing, if there was one.
      if (overlay && currentAd && this.adManagers[currentAd.adManager]) {
        _safeFunctionCall(this.adManagers[currentAd.adManager], "showOverlay");
        mb.publish(OO.EVENTS.SHOW_NONLINEAR_AD);
      }
    };


    /**
     * Alerts the ad manager that an ad has been clicked on and it should react.
     * @protected
     * @method OO.AdManagerController#onAdsClicked
     * @param {object} event The event object that sent when the event dispatches.
     * @param {object} prop An Object sent with the event that contains data we need to find what the source of ads clicked
     * was.
     */
    this.onAdsClicked = function(event, prop) {
      this.adsClicked(prop);
    };
    // Exposed to ad manager
    //adPlaybackError

    /**
     * Alerts the ad manager that a video stream tag has been found.
     * @protected
     * @method OO.AdManagerController#onVideoTagFound
     * @param {string} event The event that triggered this callback.
     * @param {string} videoId The id of the video element that processed a tag.
     * @param {string} tagType The type of tag that was detected.
     * @param {object} metadata Any metadata attached to the found tag.
     */
    this.onVideoTagFound = function(event, videoId, tagType, metadata) {
      _triggerAdManagerCallback(this.EVENTS.VIDEO_TAG_FOUND, videoId, tagType, metadata);
    };

    /**
     * Notifies ad manager plugins that a URL for the MAIN element has been selected/changed.
     * @protected
     * @method AdManagerController#onVideoElementCreated
     * @param {string} eventname The name of the event that triggered this callback
     * @param {object} elementParams The parameters of the element created including id, domId, parent,
     *                               video element, and supported encodings
     */
    this.onVideoElementCreated = _.bind(function(eventname, elementParams) {
      if (elementParams["videoId"] === OO.VIDEO.MAIN) {
        var streamUrl = elementParams["streamUrl"];
        if (streamUrl) {
          _triggerAdManagerCallback(this.EVENTS.CONTENT_URL_CHANGED, streamUrl);
        }
      }
    }, this);

    ///////// CLEANUP ////////

    var _resetAdState = _.bind(function() {
      if (lastOverlayAd) {
        currentAd = lastOverlayAd;
        overlay = true;
        this.adStarted = true;
      }
      else {
        currentAd = null;
        overlay = false;
        this.adStarted = false;
      }
      singleAdPlaying = false;
      adPaused = false;
      adManagerShowSkipButton = true;
      adManagerSkipButtonOffset = null;
      pendingPodEnd = false;
    }, this);

    var _resetMovieState = _.bind(function() {
      adQueue                    = [];
      lastAdIndex                = 0;
      seeked                     = false;
      seeking                    = false;
      paused                     = false;
      lastOverlayAd              = null;
      this.ended                 = false;
      seekToEndThreshold         = 0;
      skipAdsOnSeek              = false;
      seekedPosition             = 0;
      this.waitForPostrollToPlay = true;
      started                    = false;
      startTriggered             = false;
      movieMetadataRaised        = false;
      backlotSettingsRaised      = false;
    }, this);

    // Reset all movie properties
    var _reset = _.bind(function(destroying) {
      // Ad manager state
      allready    = false;
      initialized = false;

      // Movie data properties
      this.movieMetadata = null;
      this.startTime     = -1;
      this.movieDuration = -1;
      this.isLiveStream  = false;

      // Movie state properties
      currentPlayhead = -1;
      timeline        = [];
      cancelling      = false;

      _resetMovieState();
      _resetAdState();
      _resetPlaybackEventDependencies(destroying);
    }, this);

    var _destroy = _.bind(function() {
      if (this.ui && (typeof this.ui.destroy === "function")) {
        this.ui.destroy();
      }

      // stop any ads that are playing
      if (this.currentState == 'LinearAd' || this.currentState == 'Overlay') {
        _cancelCurrentAd({
          code: this.AD_CANCEL_CODE.STREAM_ENDED
        });
      }

      for (var key in this.adManagers) {
        this.unregisterAdManager(key);
      }

      this.fsm.destroyFsm();
      _reset(true);
    }, this);

    /**
     * Called when the player is being destroyed.  Destroys the ad manager controller, including the state
     * machine and all registered ad managers.
     * @protected
     * @method OO.AdManagerController#onDestroy
     */
    this.onDestroy = function() {
      _destroy();
    };

    /**
     * Returns a list of all registered ad managers. This is used in testing.
     * @method OO.AdManagerController#getRegisteredAdManagers
     * @public
     * @returns {Object[]} A list of all registered ad managers
     */
    this.getRegisteredAdManagers = function() {
      return this.adManagers;
    };

    /**
     * Unregisters an ad manager.
     * @public
     * @method OO.AdManagerController#unregisterAdManager
     * @param {string} name The name of the ad manager to unregister, traditionally represented by
     *                      adManager.name
     */
    this.unregisterAdManager = function(name) {
      OO.log("AMC: Removing an ad manager: " + name);
      if (name && this.adManagers[name]) {
        if (_.isFunction(this.adManagers[name].destroy)) {
          try {
            this.adManagers[name].destroy();
          } catch (err) {
            OO.log("AMC: Error destroying an ad manager - " + err);
          }
        }

        this.unregisteredAdManagers.push(name);
        delete this.adManagers[name];
      }
    };
  };

  // Helpers
  // Safely trigger an ad manager function
  var _safeFunctionCall = function(adManager, func, params) {
    try {
      if (_.isFunction(adManager[func])) {
        return adManager[func].apply(adManager, params);
      }
    } catch (err) {
      OO.log("AMC: ad manager",
             (adManager && adManager.name),
             "at function '" + func + "' threw exception -",
             err);
    }
    return null;
  };

  /**
   * The ad manager controller object.
   * @private
   */
  var controller = null;

  OO.registerModule('adManagerController', _.bind(function(messageBus, id) {
    return controller = new OO.AdManagerController(messageBus, id);
  }, this));
}(OO, OO._, OO.$));

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
if (!OO)
{
  OO = {};
}

},{}],2:[function(require,module,exports){
require("./InitOO.js");

if (!window._)
{
  window._ = require('underscore');
}

if (!OO._)
{
  OO._ = window._.noConflict();
}

},{"./InitOO.js":1,"underscore":6}],3:[function(require,module,exports){
require("./InitAnalyticsNamespace.js");

/**
 * If Analytics.EVENTS or Analytics.REQUIRED_PLUGIN_FUNCTIONS do not already
 * exist, create them.
 */

/**
 * @public
 * @description These are the ad types Ooyala Player supports
 * @namespace OO.Analytics.AD_TYPE
 */
if (!OO.Analytics.AD_TYPE)
{
  var AD_TYPE =
  {
    LINEAR_OVERLAY: "linearOverlay",
    NONLINEAR_OVERLAY: "nonlinearOverlay",
    LINEAR_VIDEO: "linearVideo",
    COMPANION: "companion"
  };
  OO.Analytics.AD_TYPE = AD_TYPE;
}

/**
 * @public
 * @description These are the stream types Ooyala Player supports
 * @namespace OO.Analytics.STREAM_TYPE
 */
if (!OO.Analytics.STREAM_TYPE)
{
  var STREAM_TYPE =
  {
    VOD: "vod",
    LIVE_STREAM: "liveStream"
  };
  OO.Analytics.STREAM_TYPE = STREAM_TYPE;
}

/**
 * @public
 * @description [DEPRECATED]
 * These are the Ooyala Player error codes
 * @namespace OO.Analytics.ERROR_CODE
 */
if (!OO.Analytics.ERROR_CODE)
{
  var ERROR_CODE =
  {
    "100": "General Error"
  };
  OO.Analytics.ERROR_CODE = ERROR_CODE;
}

/**
 * @public
 * @description These are the events associated with the Analytics Framework.
 * @namespace OO.Analytics.EVENTS
 */
if (!OO.Analytics.EVENTS)
{
  var EVENTS =
  {
    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_PLAYER_CREATED
     * @description This message is sent when the player is first created.
     * @param {Array} paramArray Array of length 1, containing the original parameters
     * passed into the player
     */
    VIDEO_PLAYER_CREATED:           'video_player_created',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_ELEMENT_CREATED
     * @description This message is sent when the video element is first created.
     */
    VIDEO_ELEMENT_CREATED:           'video_element_created',

    /**
     * @public
     * @event OO.Analytics.EVENTS#INITIAL_PLAYBACK_REQUESTED
     * @description This message is sent the first time the user tries to play the video.
     * In the case of autoplay, it will be sent immediately after the player is ready to play.
     */
    INITIAL_PLAYBACK_REQUESTED:     'initial_playback_requested',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_CONTENT_COMPLETED
     * @description This message is sent when main content playback has completed.
     */
    VIDEO_CONTENT_COMPLETED:        'video_content_completed',

    /**
     * @public
     * @event OO.Analytics.EVENTS#PLAYBACK_COMPLETED
     * @description This message is sent when video and ad playback has completed.
     */
    PLAYBACK_COMPLETED:             'playback_completed',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_PLAY_REQUESTED
     * @description This message is sent every time there is a request to try and
     * initiate video playback (except the first time. See VIDEO_FIRST_PLAY_REQUESTED).
     * This is only the request, not when video playback has actually started.
     */
    VIDEO_PLAY_REQUESTED:           'video_play_requested',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_PAUSE_REQUESTED
     * @description This message is sent every time there is a request to try and
     * pause the video. This is only the request, not when video playback has actually
     * paused.
     */
    VIDEO_PAUSE_REQUESTED:          'video_pause_requested',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_PLAYING
     * @description This message is sent when video playback has started or resumed.
     */
    VIDEO_PLAYING:                  'video_playing',

    /**
     * @event OO.Analytics.EVENTS#VIDEO_PAUSED
     * @description This message is sent when video playback has paused.
     */
    VIDEO_PAUSED:                   'video_paused',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_REPLAY_REQUESTED
     * @description This message is sent after VIDEO_ENDED, when the player is
     * requested to start video playback from the beginning of the video. This
     * is only the request, not when the video actually start playing again.
     */
    VIDEO_REPLAY_REQUESTED:         'video_replay_requested',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_SOURCE_CHANGED
     * @description This message is sent when the player has received a new video source
     * to load.  This will happen when the first video initially starts to load,
     * when switching video sources during playback and also when switching to a
     * new video after VIDEO_ENDED.  This will not be received on VIDEO_REPLAY_REQUESTED.
     * @param {Array} paramArray Array of length 1, containing an instance of
     * OO.Analytics.EVENT_DATA.VideoSourceData
     */
    VIDEO_SOURCE_CHANGED:           'video_source_changed',

    /**
     * @event OO.Analytics.EVENTS#VIDEO_STREAM_METADATA_UPDATED
     * @description This message is sent when video stream metadata has been
     * downloaded.  In contains information about the stream and metadata
     * for any plugins that should be loaded.
     * @param {Array} paramArray Array of length 1, contains an object holding all
     * the metadata for each plugin that should be loaded
     */
    VIDEO_STREAM_METADATA_UPDATED:  'video_stream_metadata_updated',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_CONTENT_METADATA_UPDATED
     * @description This message is sent when the video content data has been
     * downloaded. This will contain information about the video content. For
     * example, title and description.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoContentMetadata
     */
    VIDEO_CONTENT_METADATA_UPDATED: 'video_content_metadata_updated',

    /**
     * @public
     * @event OO.Analytics.EVENTS#STREAM_TYPE_UPDATED
     * @description This message is sent when the content stream type has been
     * determined by the player.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.StreamTypeMetadata
     */
    STREAM_TYPE_UPDATED: 'stream_type_updated',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_SEEK_REQUESTED
     * @description This message is sent when a video seek is requested.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoSeekRequestedData
     */
    VIDEO_SEEK_REQUESTED:             'video_seek_requested',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_SEEK_COMPLETED
     * @description This message is sent when a video seek has completed.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoSeekCompletedData
     */
    VIDEO_SEEK_COMPLETED:               'video_seek_completed',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_STREAM_DOWNLOADING
     * @description This message is sent when a video stream is downloading data.
     * If the stream has to stop because of a buffer underrun, that is considered
     * a buffering event.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoDownloadingMetadata
     */
    VIDEO_STREAM_DOWNLOADING:       'video_stream_downloading',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_BUFFERING_STARTED
     * @description This message is sent when a video stream has to pause playback
     * to load more data. It is also sent when the stream is buffering before
     * initial playback is started.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoBufferingStartedData
     */
    VIDEO_BUFFERING_STARTED:        'video_buffering_started',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_BUFFERING_ENDED
     * @description This message is sent when a video stream has buffered and
     * is ready to resume playback.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoBufferingEndedData
     */
    VIDEO_BUFFERING_ENDED:          'video_buffering_ended',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_STREAM_BITRATE_PROFILES
     * @description This message is sent when all of the possible bitrate profiles for a stream are available.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoBitrateProfileLookupData
     */
    VIDEO_STREAM_BITRATE_PROFILES: 'video_stream_bitrate_profiles',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_STREAM_TARGET_BITRATE_REQUESTED
     * @description Sent when the a specific bitrate profile is requested. Automatic
     * bitrate selection is "auto".
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoTargetBitrateData
     */
    VIDEO_STREAM_TARGET_BITRATE_REQUESTED: 'video_stream_target_bitrate_requested',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_STREAM_BITRATE_CHANGED
     * @description This message is sent when the video stream's bitrate changes.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoBitrateProfileData
     */
    VIDEO_STREAM_BITRATE_CHANGED: 'video_stream_bitrate_changed',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_STREAM_POSITION_CHANGED
     * @description This message is sent, periodically, when the video stream position changes.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoStreamPositionChangedData
     */
    VIDEO_STREAM_POSITION_CHANGED:  'video_stream_position_changed',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VIDEO_ERROR
     * @description [DEPRECATED]
     * (NOTE: replaced by OO.Analytics.EVENTS.ERROR#VIDEO_PLAYBACK)
     * This message is sent when a video error occurs.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VideoErrorData
     */
    VIDEO_ERROR:                    'video_error',

    /**
     * @public
     * @event OO.Analytics.EVENTS#AD_BREAK_STARTED
     * @description This message is sent when the player stops the main content
     * to start playing linear ads.
     */
    AD_BREAK_STARTED:               'ad_break_started',

    /**
     * @public
     * @event OO.Analytics.EVENTS#AD_BREAK_ENDED
     * @description This message is sent when the player has finished playing ads
     * and is ready to playback the main video.
     */
    AD_BREAK_ENDED:                 'ad_break_ended',

    /**
     * @event OO.Analytics.EVENTS#AD_POD_STARTED
     * @description This message is sent when an ad pod starts.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.AdPodStartedData
     */
    AD_POD_STARTED:                 'ad_pod_started',

    /**
     * @public
     * @event OO.Analytics.EVENTS#AD_POD_ENDED
     * @description This message is sent when an ad pod ends.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.AdPodEndedData
     */
    AD_POD_ENDED:                   'ad_pod_ended',

    /**
     * @public
     * @event OO.Analytics.EVENTS#AD_STARTED
     * @description This message is sent when the player starts an ad playback.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.AdStartedData
     */
    AD_STARTED:                     'ad_started',

    /**
     * @public
     * @event OO.Analytics.EVENTS#AD_ENDED
     * @description This message is sent when the player ends an ad playback.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.AdEndedData
     */
    AD_ENDED:                       'ad_ended',

    /**
     * @public
     * @event OO.Analytics.EVENTS#AD_SKIPPED
     * @description This message is sent when an ad is skipped.
     */
    AD_SKIPPED:                     'ad_skipped',

    /**
     * @public
     * @event OO.Analytics.EVENTS#AD_ERROR
     * @description This message is sent when there is an error during ad playback.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.AdErrorData
     */
    AD_ERROR:                       'ad_error',

    /**
     * @public
     * @event OO.Analytics.EVENTS#AD_IMPRESSION
     * @description This message is sent when the ad video element first plays.
     */
    AD_IMPRESSION:                  'ad_impression',

    /**
     * @public
     * @event OO.Analytics.EVENTS#AD_CLICKTHROUGH_OPENED
     * @description This message is sent when an ad clickthrough event has occurred.
     */
    AD_CLICKTHROUGH_OPENED:         'ad_clickthrough_opened',

    /**
     * @public
     * @event OO.Analytics.EVENTS#FULLSCREEN_CHANGED
     * @description This message is sent when the player enters and exits fullscreen.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.FullscreenChangedData
     */
    FULLSCREEN_CHANGED:             'fullscreen_changed',

    /**
     * @public
     * @event OO.Analytics.EVENTS#VOLUME_CHANGED
     * @description This message is sent when the player volume has changed.
     * @param {Array} paramArray Array of length 1, contains an instance of
     * OO.Analytics.EVENT_DATA.VolumeChangedData
     */
    VOLUME_CHANGED:                 'volume_changed',

    /**
     * @public
     * @event OO.Analytics.EVENTS#DESTROY
     * @description This message is sent when the player and its plugins are destroying.
     */
    DESTROY:                        'destroy',

    /**
     * @public
     * @event OO.Analytics.EVENTS.ERROR
     * @description This property contains different the categories of Ooyala Player Errors.
     */
    ERROR:
    {
      /**
       * @public
       * @event OO.Analytics.EVENTS.ERROR#GENERAL
       * @description This message is sent when a general error occurs.
       * @param {Array} paramArray Array of length 1, contains an instance of
       * OO.Analytics.EVENT_DATA.GeneralErrorData
       */
      GENERAL:                      'general_error',

      /**
       * @public
       * @event OO.Analytics.EVENTS.ERROR#METADATA_LOADING
       * @description This message is sent when a metadata loading error occurs
       * (invalid metadata, invalid content, or a network error when loading metadata).
       * @param {Array} paramArray Array of length 1, contains an instance of
       * OO.Analytics.EVENT_DATA.MetadataLoadingError
       */
      METADATA_LOADING:             'metadata_loading_error',

      /**
       * @public
       * @event OO.Analytics.EVENTS.ERROR#VIDEO_PLAYBACK
       * @description This message is sent when a video playback error occurs.
       * @param {Array} paramArray Array of length 1, contains an instance of
       * OO.Analytics.EVENT_DATA.VideoPlaybackErrorData
       */
      VIDEO_PLAYBACK:               'video_playback_error',

      /**
       * @public
       * @event OO.Analytics.EVENTS.ERROR#AUTHORIZATION
       * @description This message is sent when a stream authorization server (SAS) error occurs.
       * @param {Array} paramArray Array of length 1, contains an instance of
       * OO.Analytics.EVENT_DATA.AuthorizationErrorData
       */
      AUTHORIZATION:                'authorization_error'
    }
  };
  OO.Analytics.EVENTS = EVENTS;
}

if (!OO.Analytics.EVENT_DATA)
{
  var EVENT_DATA = {};

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoElementData
   * @classdesc Contains the data passed along with VIDEO_ELEMENT_CREATED. This includes
   * the stream url of the video element.
   * @property {string} streamUrl This is the video element's stream URL
   */
  EVENT_DATA.VideoElementData = function(streamUrl)
  {
    var checkElementData = OO._.bind(checkDataType, this, "VideoElementData");
    this.streamUrl = checkElementData(streamUrl, "streamUrl", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoSourceData
   * @classdesc Contains the data passed along with VIDEO_SOURCE_CHANGED. This
   * includes the embed code (video id) and any metadata this video stream needs
   * pass along to other plugins (for example, it could contain ad tag data or analytics
   * account information).
   * @property  {string} embedCode This is the video stream's unique id
   * @property  {object} metadata   An object containing metadata about the video stream and player id to be used
   */
  EVENT_DATA.VideoSourceData = function(embedCode, metadata)
  {
    var checkSourceData = OO._.bind(checkDataType, this, "VideoSourceData");
    this.embedCode = checkSourceData(embedCode, "embedCode", ["string"]);
    this.metadata  = checkSourceData(metadata, "metadata", ["object"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoContentMetadata
   * @classdesc Contains information about the content of the video stream,
   * such as title and description.
   * @property  {string} title Title of the video
   * @property  {string} description Video description
   * @property  {number} duration Duration of the video in milliseconds
   * @property  {object} closedCaptions Object containing information about the closed captions available
   * @property  {string} contentType A string indicating the type of content in the stream (ex. "video").
   * @property  {string} hostedAtURL The url the video is being hosted from
   */
  EVENT_DATA.VideoContentMetadata = function(title, description, duration, closedCaptions, contentType, hostedAtURL)
  {
    var checkContentData = OO._.bind(checkDataType, this, "VideoContentMetadata");
    this.title          = checkContentData(title, "title", ["string"]);
    this.description    = checkContentData(description, "description", ["string"]);
    this.duration       = checkContentData(duration, "duration", ["number"]);
    this.closedCaptions = checkContentData(closedCaptions, "closedCaptions", ["object"]);
    this.contentType    = checkContentData(contentType, "contentType", ["string"]);
    this.hostedAtURL    = checkContentData(hostedAtURL, "hostedAtURL", ["string"]);
  };

  /**
   * public
   * @class Analytics.EVENT_DATA#StreamTypeMetadata
   * @classdesc Contains information about the content stream type
   * @property {string} streamType OO.Analytics.STREAM_TYPE of the stream.
   */
  EVENT_DATA.StreamTypeMetadata = function(streamType)
  {
    var checkStreamTypeData = OO._.bind(checkDataType, this, "StreamTypeMetadata");
    this.streamType         = checkStreamTypeData(streamType, "streamType", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoDownloadingMetadata
   * @classdesc Contains information about the stream that is being downloaded.
   * @property {number} currentTime The current time of the player
   * @property {number} totalStreamDuration The duration of the video stream
   * @property {number} streamBufferedUntilTime The stream is buffered until this timestamp
   * @property {number} seekableRangeStart The earliest time the user can seek to
   * @property {number} seekableRangeEnd The latest time the user can seek to
   */
  EVENT_DATA.VideoDownloadingMetadata = function(currentTime, totalStreamDuration, streamBufferedUntilTime, seekableRangeStart, seekableRangeEnd)
  {
    var checkDownloadData = OO._.bind(checkDataType, this, "VideoDownloadingMetadata");
    this.currentTime             = checkDownloadData(currentTime, "currentTime", ["number"]);
    this.totalStreamDuration     = checkDownloadData(totalStreamDuration, "totalStreamDuration", ["number"]);
    this.streamBufferedUntilTime = checkDownloadData(streamBufferedUntilTime, "streamBufferedUntilTime", ["number"]);
    this.seekableRangeStart      = checkDownloadData(seekableRangeStart, "seekableRangeStart", ["number"]);
    this.seekableRangeEnd        = checkDownloadData(seekableRangeEnd, "seekableRangeEnd", ["number"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoBufferingStartedData
   * @classdesc Contains information about the stream that has started buffering.
   * @property {string} streamUrl The url of the stream that is buffering
   */
  EVENT_DATA.VideoBufferingStartedData = function(streamUrl)
  {
    var checkBufferingStartedData = OO._.bind(checkDataType, this, "VideoBufferingStartedData");
    this.streamUrl = checkBufferingStartedData(streamUrl, "streamUrl", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoBufferingEndedData
   * @classdesc Contains information about the stream that finished buffering.
   * @property {string} streamUrl The url of the stream that finished buffering
   */
  EVENT_DATA.VideoBufferingEndedData = function(streamUrl)
  {
    var checkBufferingEndedData = OO._.bind(checkDataType, this, "VideoBufferingEndedData");
    this.streamUrl = checkBufferingEndedData(streamUrl, "streamUrl", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoBitrateProfileLookupData
   * @classdesc Contains a lookup table for all the possible bitrates available. The
   * keys are the profile ids for each profile.
   * @property {object} profiles A lookup table containing instances of VideoBitrateProfileData. The key is the 'id' of each VideoBitrateProfileData.
   *
   * @constructor
   * @param {object} bitrateProfileArray An array of objects containing profile data
   * (bitrate, width, height, and id)
   */
  EVENT_DATA.VideoBitrateProfileLookupData = function(bitrateProfileArray)
  {
    var checkBitrateProfileList = OO._.bind(checkDataType, this, "VideoBitrateProfileLookupData");
    var list = checkBitrateProfileList(bitrateProfileArray, "bitrateProfileArray", ["array"]);
    this.profiles = {};
    for(var key in list)
    {
      var entry = list[key];
      this.profiles[entry.id] = entry;
    }
  }

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoBitrateProfileData
   * @classdesc Contains information about a bitrate profile.
   * @property {string} id The id of this profile
   * @property {number} bitrate The bitrate of this profile
   * @property {number} width The width of this profile
   * @property {number} height The height of this profile
   */
  EVENT_DATA.VideoBitrateProfileData = function(bitrateProfile)
  {
    var checkBitrateProfile = OO._.bind(checkDataType, this, "VideoBitrateProfileData");
    this.bitrate = checkBitrateProfile(bitrateProfile.bitrate, "bitrate", ["number"]);
    this.height = checkBitrateProfile(bitrateProfile.height, "height", ["number"]);
    this.width = checkBitrateProfile(bitrateProfile.width, "width", ["number"]);
    this.id = checkBitrateProfile(bitrateProfile.id, "id", ["string"]);
  }

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoTargetBitrateData
   * @classdesc Contains information what bitrate profile is being requested.
   * @property {string} targetProfile The id of the bitrate profile being requested.
   */
  EVENT_DATA.VideoTargetBitrateData = function(targetProfile)
  {
    var checkTargetBitrate = OO._.bind(checkDataType, this, "VideoTargetBitrateData");
    this.targetProfile = checkTargetBitrate(targetProfile, "targetProfile", ["string"]);
  }

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoSeekRequestedData
   * @classdesc Contains information about seeking to a particular time in the stream.
   * @property {number} seekingToTime The time requested to be seeked to
   */
  EVENT_DATA.VideoSeekRequestedData = function(seekingToTime)
  {
    var checkSeekStartedData = OO._.bind(checkDataType, this, "VideoSeekRequestedData");
    this.seekingToTime = checkSeekStartedData(seekingToTime, "seekingToTime", ["number"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoSeekCompletedData
   * @classdesc Contains information about the result of seeking to a particular
   * time in the stream.
   * @property {number} timeSeekedTo The time that was actually seeked to
   */
  EVENT_DATA.VideoSeekCompletedData = function(timeSeekedTo)
  {
    var checkSeekEndedData = OO._.bind(checkDataType, this, "VideoSeekCompletedData");
    this.timeSeekedTo = checkSeekEndedData(timeSeekedTo, "timeSeekedTo", ["number"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoStreamPositionChangedData
   * @classdesc Contains information about the current stream position and the length of the stream.
   * @property {number} streamPosition The current stream position
   * @property {number} totalStreamDuration The total length/duration of the stream
   * @property {string} videoId Id used to differentiate between various streams (such as ad vs content playback).
   *                            Possible values are defined in OO.VIDEO.
   */
  EVENT_DATA.VideoStreamPositionChangedData = function(streamPosition, totalStreamDuration, videoId)
  {
    var checkVideoStreamPositionChangedData = OO._.bind(checkDataType, this, "VideoStreamPositionChangedData");
    this.streamPosition = checkVideoStreamPositionChangedData(streamPosition, "streamPosition", ["number"]);
    this.totalStreamDuration = checkVideoStreamPositionChangedData(totalStreamDuration, "totalStreamDuration", ["number"]);
    this.videoId = checkVideoStreamPositionChangedData(videoId, "videoId", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoErrorData
   * @classdesc [DEPRECATED]
   * (NOTE: replaced by Analytics.EVENT_DATA.VideoPlaybackErrorData)
   * Contains information about the error code and message of the video error.
   * @property {string} errorCode The error code
   * @property {string} errorMessage The error message
   *
   * @constructor
   * @param {string} errorCode The error code
   */
  EVENT_DATA.VideoErrorData = function(errorCode)
  {
    var checkVideoErrorData = OO._.bind(checkDataType, this, "VideoErrorData");
    this.errorCode = checkVideoErrorData(errorCode, "errorCode", ["string"]);
    this.errorMessage = translateErrorCode(errorCode);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#GeneralErrorData
   * @classdesc Contains information about the error code and message of a general error.
   * @property {string} errorCode The error code
   * @property {string} errorMessage The error message
   */
  EVENT_DATA.GeneralErrorData = function(errorCode, errorMessage)
  {
    var checkGeneralErrorData = OO._.bind(checkDataType, this, "GeneralErrorData");
    this.errorCode = checkGeneralErrorData(errorCode, "errorCode", ["string"]);
    this.errorMessage = checkGeneralErrorData(errorMessage, "errorMessage", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#MetadataLoadingErrorData
   * @classdesc Contains information about the error code and message of a metadata loading
   * error.
   * @property {string} errorCode The error code
   * @property {string} errorMessage The error message
   */
  EVENT_DATA.MetadataLoadingErrorData = function(errorCode, errorMessage)
  {
    var checkMetadataLoadingErrorData = OO._.bind(checkDataType, this, "MetadataLoadingErrorData");
    this.errorCode = checkMetadataLoadingErrorData(errorCode, "errorCode", ["string"]);
    this.errorMessage = checkMetadataLoadingErrorData(errorMessage, "errorMessage", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VideoPlaybackErrorData
   * @classdesc Contains information about the error code and message of the video error.
   * @property {string} errorCode The error code
   * @property {string} errorMessage The error message
   */
  EVENT_DATA.VideoPlaybackErrorData = function(errorCode, errorMessage)
  {
    var checkVideoPlaybackErrorData = OO._.bind(checkDataType, this, "VideoPlaybackErrorData");
    this.errorCode = checkVideoPlaybackErrorData(errorCode, "errorCode", ["string"]);
    this.errorMessage = checkVideoPlaybackErrorData(errorMessage, "errorMessage", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#AuthorizationErrorData
   * @classdesc Contains information about the error code and message of the authorization error.
   * @property {string} errorCode The error code
   * @property {string} errorMessage The error message
   */
  EVENT_DATA.AuthorizationErrorData = function(errorCode, errorMessage)
  {
    var checkAuthorizationErrorData = OO._.bind(checkDataType, this, "AuthorizationErrorData");
    this.errorCode = checkAuthorizationErrorData(errorCode, "errorCode", ["string"]);
    this.errorMessage = checkAuthorizationErrorData(errorMessage, "errorMessage", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#AdPodStartedData
   * @classdesc Contain information about how many ads are in the ad pod.
   * @property {number} numberOfAds The number of ads in the pod
   */
  EVENT_DATA.AdPodStartedData = function(numberOfAds)
  {
    var checkAdPodStartedData = OO._.bind(checkDataType, this, "AdPodStartedData");
    this.numberOfAds = checkAdPodStartedData(numberOfAds, "numberOfAds", ["number"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#AdPodEndedData
   * @classdesc Contain information about the adId of the ad pod.
   * @property {string} adId The id of the ad pod
   */
  EVENT_DATA.AdPodEndedData = function(adId)
  {
    var checkAdPodEndedData = OO._.bind(checkDataType, this, "AdPodEndedData");
    this.adId = checkAdPodEndedData(adId, "adId", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#AdStartedData
   * @classdesc Contains information about the type of ad that has started and its ad data.
   * @property {string} adType The type of ad (linear video, linear overlay, nonlinear overlay)
   * @property {object} adMetadata The metadata associated with the ad(i.e. EVENT_DATA.LinearVideoData or EVENT_DATA.NonLinearOverlayData)
   */
  EVENT_DATA.AdStartedData = function(adType, adMetadataIn)
  {
    var checkAdStartedData = OO._.bind(checkDataType, this, "AdStartedData");
    this.adType = checkAdStartedData(adType, "adType", ["string"]);
    this.adMetadata = selectAdType(adType, adMetadataIn);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#LinearVideoData
   * @classdesc Contains information about the linear video ad data.
   * @property {string} adId The id of the ad
   * @property {number} adDuration The duration of the ad video stream
   * @property {number} adPodPosition The index of the current ad in its ad pod
   */
  EVENT_DATA.LinearVideoData = function(adId, adDuration, adPodPosition)
  {
    var checkLinearVideoData = OO._.bind(checkDataType, this, "LinearVideoData");
    this.adId = checkLinearVideoData(adId, "adId", ["string"]);
    this.adDuration = checkLinearVideoData(adDuration, "adDuration", ["number"]);
    this.adPodPosition = checkLinearVideoData(adPodPosition, "adPodPosition", ["number"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#NonLinearOverlayData
   * @classdesc Contains information about the non linear overlay ad data.
   * @property {string} adId The id of the ad
   */
  EVENT_DATA.NonLinearOverlayData = function(adId)
  {
    var checkNonLinearOverlayData = OO._.bind(checkDataType, this, "NonLinearOverlayData");
    this.adId = checkNonLinearOverlayData(adId, "adId", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#AdEndedData
   * @classdesc Contains information about the type of ad that has ended and its ad data.
   * @property {string} adType The type of ad (linear video, linear overlay, nonlinear overlay)
   * @property {string} adId The id of the ad
   */
  EVENT_DATA.AdEndedData = function(adType, adId)
  {
    var checkAdEndedData = OO._.bind(checkDataType, this, "AdEndedData");
    this.adType = checkAdEndedData(adType, "adType", ["string"]);
    this.adId = checkAdEndedData(adId, "adId", ["string"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#AdErrorData
   * @classdesc Contains information about the ad error.
   * @property {object|string} The error object or string
   */
  EVENT_DATA.AdErrorData = function(error)
  {
    var checkAdErrorData = OO._.bind(checkDataType, this, "AdErrorData");
    this.error = checkAdErrorData(error, "error", ["string", "object"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#FullscreenChangedData
   * @classdesc Contains information about whether the player is entering or exiting fullscreen.
   * @property {boolean} changingToFullscreen Whether or not the player is entering fullscreen.
   * true represents that the player is entering fullscreen. false represents that the player is
   * exiting fullscreen.
   */
  EVENT_DATA.FullscreenChangedData = function(changingToFullscreen)
  {
    var checkFullscreenChangedData = OO._.bind(checkDataType, this, "FullscreenChangedData");
    this.changingToFullscreen = checkFullscreenChangedData(changingToFullscreen, "changingToFullscreen", ["boolean"]);
  };

  /**
   * @public
   * @class Analytics.EVENT_DATA#VolumeChangedData
   * @classdesc Contains information about the value of the current volume.
   * @property {number} volume  The current volume after the change; the volume is a value from 0 - 1, with 0
   * representing a muted state and 1 representing the maximum volume.
   */
  EVENT_DATA.VolumeChangedData = function(currentVolume)
  {
    var checkVolumeChangedData = OO._.bind(checkDataType, this, "VolumeChangedData");
    this.currentVolume = checkVolumeChangedData(currentVolume, "currentVolume", ["number"]);
  };

  var checkDataType = function(className, data, varName, expectedTypes)
  {
    var error = true;
    var toRet = data;
    for (var i = 0; i < expectedTypes.length; i++)
    {
      var expectedType = expectedTypes[i];
      if (expectedType === "string")
      {
        if (OO._.isString(toRet))
        {
          error = false;
          break;
        }
      }
      else if (expectedType === "object")
      {
        if (toRet && OO._.isObject(toRet))
        {
          error = false;
          break;
        }
      }
      else if (expectedType === "array")
      {
        if (toRet && OO._.isArray(toRet))
        {
          error = false;

        }
      }
      else if (expectedType === "number")
      {
        // in the case number comes in as a string, try parsing it.
        var toRetFloat = parseFloat(toRet);
        if (OO._.isNumber(toRet))
        {
          error = false;
          break;
        }
        else if (!isNaN(toRetFloat))
        {
          toRet = toRetFloat;
          error = false;
          break;
        }
      }
      else if (expectedType === "boolean")
      {
        if (OO._.isBoolean(toRet))
        {
          error = false;
        }
        else if (toRet === "true")
        {
          toRet = true;
          error = false;
          break;
        }
        else if (toRet === "false")
        {
          toRet = false;
          error = false;
          break;
        }
      }
    }

    if (error)
    {
      logErrorString
      (
        "Analytics.EVENT_DATA." + className + " being created with invalid " + varName +
        ". Should be one of these types [" + expectedTypes + "] but was [" + typeof(data) + "]."
      );
      return undefined;
    }

    return toRet;
  };

  /**
   * @private
   * @class Analytics#selectAdType
   * @classdesc Checks for a recognized Ad Type and returns the corresponding EVENT_DATA object.
   * @property {string} adType The type of ad (linear video, linear overlay, nonlinear overlay)
   * @property {object} adMetadata The metadata associated with the ad
   * @returns {object} The EVENT_DATA object that associates with the Ad Type.
   */
  var selectAdType = function(adType, adMetadataIn)
  {
    var adMetadataOut;
    switch (adType)
    {
      case OO.Analytics.AD_TYPE.LINEAR_VIDEO:
        adMetadataOut = new EVENT_DATA.LinearVideoData
        (
          adMetadataIn.name,
          adMetadataIn.duration,
          adMetadataIn.indexInPod
        );
        break;
      case OO.Analytics.AD_TYPE.NONLINEAR_OVERLAY:
        adMetadataOut = new EVENT_DATA.NonLinearOverlayData
        (
          adMetadataIn.id
        );
        break;
      default:
        logErrorString
        (
          "Ad Type not recognized. Should be one of these values [" +
          OO._.values(OO.Analytics.AD_TYPE) + "] but was [" + adType + "]."
        );
        break;
    }
    return adMetadataOut;
  };

  /**
   * @private
   * @class Analytics#translateErrorCode
   * @classdesc Translates the error code provided into the corresponding error message.
   * @property {number} code The error code
   * @returns {string} The error string associated with the error code number.
   */
  var translateErrorCode = function(code)
  {
    var errorMessage;
    if (_.has(ERROR_CODE, code))
    {
      errorMessage = ERROR_CODE[code];
    }
    else
    {
      logErrorString("Error code not recognized. Error code provided was: " + code);
    }
    return errorMessage;
  };

  /**
   * @private
   * @class Analytics#logErrorString
   * @classdesc Helper function to return an error string with the Analytics Constants prefix.
   * @property {string} origStr the error string
   * @returns {string} The new error string.
   */
  var logErrorString = function(origStr)
  {
    OO.log("Error AnalyticsConstants: " + origStr);
  };

  OO.Analytics.EVENT_DATA = EVENT_DATA;
}

if (!OO.Analytics.REQUIRED_PLUGIN_FUNCTIONS)
{
  /**
   * @public
   * @constant
   * @type string[]
   * @description This is a list of the required functions for a plugin to
   * be considered valid by the Analytics Framework.
   * <ul>
   *    <li>getName() - Returns a non-empty string containing the name of the plugin.</li>
   *    <li>getVersion() - Returns a non-empty string containing the version of the plugin.</li>
   *    <li>setPluginID(id) - A function for setting the plugin id on an instance of the plugin.</li>
   *    <li>getPluginID() - Returns the plugin id assigned by setPluginID().</li>
   *    <li>init() - A function for initializing the plugin.</li>
   *    <li>setMetadata(metadata) - A function for passing metadata specific to this plugin.</li>
   *    <li>destroy() - Destructor function for cleanup.</li>
   *    <li>processEvent(eventName, paramArray) - A function to receive events that are published through the framework.</li>
   * </ul>
   */
  var REQUIRED_PLUGIN_FUNCTIONS =
  [
    "getName",
    "getVersion",
    "setPluginID",
    "getPluginID",
    "init",
    "setMetadata",
    "destroy",
    "processEvent"
  ];
  OO.Analytics.REQUIRED_PLUGIN_FUNCTIONS = REQUIRED_PLUGIN_FUNCTIONS;
}

},{"./InitAnalyticsNamespace.js":5}],4:[function(require,module,exports){
require("../../html5-common/js/utils/InitModules/InitOOUnderscore.js")
require("./InitAnalyticsNamespace.js");
require("./AnalyticsConstants.js");

 /**
  * @public
 * @class OO.Analytics.RecordedEvent
 * @classdesc Store the information for a published event, including the time
 * was sent.
 * @param  {int}    timeStamp The time the event was published
 * @param  {string} eventName The event name
 * @param  {Array}  params The parameters passed in with the event
 */
OO.Analytics.RecordedEvent = function(timeStamp, eventName, params)
{
  this.timeStamp = timeStamp;
  this.eventName = eventName;
  this.params = params;
};

/**
 * @public
 * @class OO.Analytics.Framework
 * @classdesc The Analytics Framework's goal is to abstract capturing all the events
 * in code for the purpose of analytics reporting (from any source). When a plugin
 * is registered with the framework, it will be validated, registered and automatically
 * receive all messages that are published to the framework.  The list of events that are
 * currently supported are located in AnalyticsConstants.js.  That file also contains
 * all the methods that need to be implemented by a plugin for it to be considered valid.
 */
OO.Analytics.Framework = function()
{
  var _ = OO._;
  var _registeredPlugins = {};
  var _recordedEventList = [];
  var _recording = true;
  var _pluginMetadata;
  var _eventExistenceLookup = {};
  var _uniquePluginId = 0;
  var MAX_PLUGINS = 20; //this is an arbitrary limit but we shouldn't ever reach this (not even close).
  var MAX_EVENTS_RECORDED = 500;

  /**
   * Helper function for readability mainly. Binds private functions to 'this' instance
   * of Framework, to give access to private variables.
   * @private
   * @method OO.Analytics.Framework#privateMember
   * @param  {function} functionVar The function to be bound to this instance of Framework
   * @return {function}             Bound function.
   */
  var privateMember = _.bind(function(functionVar)
  {
    if (!_.isFunction(functionVar))
    {
      throw (createErrorString("Trying to make private function but " + functionVar + " is not a function."));
      return;
    }
    return _.bind(functionVar, this);
  }, this);


  /**
   * Set the metadata for all plugins. Each plugin will only receive the data
   * pluginMetadata["myPluginName"]. This can only be set once per framework instance.
   * @public
   * @method OO.Analytics.Framework#setPluginMetadata
   * @param  {object}  pluginMetadata Object containing metadata for all plugins
   * @return {boolean}                Return true if metadata is valid and has not been set before.
   */
  this.setPluginMetadata = function(pluginMetadata)
  {
    var success = false;
    //just a warning if we are setting the metadata multiple times. This may be valid
    //if so, this can be removed.
    if (_pluginMetadata)
    {
      OO.log(createErrorString("Trying to run setPluginMetadata more than once. Ignoring new data."));
    }

    if (_.isObject(pluginMetadata))
    {
      //set the metadata and then set it on any plugin that is already registered
      _pluginMetadata = pluginMetadata
      var pluginList = this.getPluginIDList();
      for (var i = 0; i < pluginList.length; i++)
      {
          var plugin = getPluginInstance(pluginList[i]);
          passMetadataToPlugin(plugin);
      }

      success = true;
    }
    else
    {
      OO.log(createErrorString("Calling setPluginMetadata without valid metadata object. Defaulting to no metadata"));
    }

    return success;
  }

  /**
   * Destructor/cleanup for OO.Analytics.Framework.
   * @public
   * @method OO.Analytics.Framework#destroy
   */
  this.destroy = privateMember(function()
  {
    OO.Analytics.UnregisterFrameworkInstance(this);
    for (var pluginID in _registeredPlugins)
    {
      this.unregisterPlugin(pluginID);
    }
    _ = null;
    _registeredPlugins = null;
    _recordedEventList = null;
    _pluginMetadata = null;
    _eventExistenceLookup = null;
  });

  /**
   * Adds event and params to list of recorded events.  Plugins can later grab
   * this info in case events are published before the plugin is ready to process
   * them.
   * @private
   * @method OO.Analytics.Framework#recordEvent
   * @param  {string} eventName Event name to record
   * @param  {Array}  params    The params sent along with the event.
   */
  var recordEvent = privateMember(function(eventName, params)
  {
    if (_recording && _recordedEventList.length < MAX_EVENTS_RECORDED)
    {
      var timeStamp = new Date().getTime();
      var eventToRecord = new OO.Analytics.RecordedEvent(timeStamp, eventName, params);
      _recordedEventList.push(eventToRecord);
    }
    else
    {
      stopRecordingEvents();
    }
  });

  /**
   * Clears the list of recorded events.
   * @private
   * @method OO.Analytics.Framework#clearRecordedEvents
   */
  var clearRecordedEvents = privateMember(function()
  {
    _recordedEventList = [];
  });

  /**
   * Enable recording of events.
   * @private
   * @method OO.Analytics.Framework#startRecordingEvents
   */
  var startRecordingEvents = privateMember(function()
  {
    _recording = true;
  });

  /**
   * Disable recording of events.
   * @private
   * @method OO.Analytics.Framework#stopRecordingEvents
   */
  var stopRecordingEvents = privateMember(function()
  {
    _recording = false;
  });

  /**
   * Returns a shallow copy array of the currently stored recordedEvents in chronological
   * order.
   * @public
   * @method OO.Analytics.Framework#getRecordedEvents
   * @return {Array} Shallow copy of recordedEvents in chronological order.
   */
  this.getRecordedEvents = function()
  {
    if (_recordedEventList)
    {
      return _.clone(_recordedEventList);
    }

    return [];
  };

  /**
   * Register plugin as a factory. It will be validated and an instance of it will
   * be maintained internally.  The plugin will then be able to receive events
   * from the framework. Multiple of the same plugin factory can be registered.
   * Each one will have its own unique plugin id.
   * @public
   * @method OO.Analytics.Framework#registerPlugin
   * @param  {function} pluginFactory Plugin factory function
   * @return {string}                 Returns a unique plugin id for this plugin factory.
   */
  this.registerPlugin = function(pluginFactory)
  {
    var pluginID;
    var plugin;
    var errorOccured = false;

    //sanity check
    if (!pluginFactory)
    {
      OO.log(createErrorString("Trying to register plugin class that is a falsy value."));
      errorOccured = true;
    }

    if (!errorOccured)
    {
      try
      {
        plugin = new pluginFactory(this);
      }
      catch (error)
      {
        OO.log(error);
        OO.log(createErrorString("Error was thrown during plugin creation."))
        errorOccured = true;
      }
    }

    if (!errorOccured)
    {
      if (!this.validatePlugin(plugin))
      {
        errorOccured = true;
      }
      else
      {
        //initialize the plugin. If we have metadata then give it to the plugin. Otherwise it will be sent in Analytics.Framework.setPluginMetadata;
        safeFunctionCall(plugin, "init");
        if (_pluginMetadata)
        {
          passMetadataToPlugin(plugin);
        }
      }
    }

    if (!errorOccured)
    {
      pluginID = createPluginId(plugin);
      if (!pluginID)
      {
        errorOccured = true;
      }
      else if (!_registeredPlugins[pluginID])
      {
        _registeredPlugins[pluginID] = {factory:pluginFactory, instance:plugin, active:true};
        safeFunctionCall(plugin, "setPluginID", [pluginID]);
      }
    }

    if (errorOccured)
    {
      if(pluginID)
      {
        OO.log(createErrorString("\'" + pluginID + "\' is not valid and was not registered."));
      }
      else
      {
        var pluginName = safeFunctionCall(plugin, "getName");
        if (pluginName)
        {
          OO.log(createErrorString("\'" + pluginName + "\' is not valid and was not registered."));
        }
        else
        {
          OO.log(createErrorString("Plugin validation failed and was not registered."));
        }
      }
    }

    return pluginID;
  };

  /**
   * Remove plugin from the framework. All instances will stop receiving messages from
   * the framework.
   * @public
   * @method OO.Analytics.Framework#unregisterPlugin
   * @param  {string}  pluginIDToRemove Plugin id to be removed
   * @return {boolean}                  Return true if plugin was found and removed.
   */
  this.unregisterPlugin = function(pluginIDToRemove)
  {
    var removedSuccessfully = false;

    if (pluginIDToRemove && _registeredPlugins && _registeredPlugins[pluginIDToRemove])
    {
      var plugin = getPluginInstance(pluginIDToRemove);
      safeFunctionCall(plugin, "destroy");
      delete _registeredPlugins[pluginIDToRemove];
      removedSuccessfully = true;
    }

    return removedSuccessfully;
  };

  /**
   * Validates that a plugin instance has all the correct functions.
   * @public
   * @method OO.Analytics.Framework#validatePlugin
   * @param  {object} plugin Plugin instance to be validated
   * @return {boolean}       Return true if plugin contains all the correct functions.
   */
  this.validatePlugin = function(plugin)
  {
    var isValid = true;
    if (!plugin)
    {
      isValid = false;
      OO.log(createErrorString("Plugin has falsy value and is not valid. Actual value: "), plugin);
    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    ///IMPORTANT: This should be the only function to break the rule of using safeFunctionCall
    ///           for calling plugin functions, since it's checking if the plugin is valid to
    ///           begin with.
    /////////////////////////////////////////////////////////////////////////////////////////////

    if (isValid)
    {
      //test if all required functions are in the plugin
      for ( var i = 0; i < OO.Analytics.REQUIRED_PLUGIN_FUNCTIONS.length; i++)
      {
        var reqFunc = OO.Analytics.REQUIRED_PLUGIN_FUNCTIONS[i];
        if(!plugin.hasOwnProperty(reqFunc) || typeof plugin[reqFunc] !== 'function')
        {
          isValid = false;
          if(plugin.getName && typeof plugin.getName === 'function')
          {
            try
            {
              OO.log(createErrorString("Plugin \'" + plugin.getName() + "\' missing function: " + reqFunc));
            }
            catch(e)
            {
              OO.log(createErrorString("Plugin missing function: " + reqFunc));
            }
          }
          else
          {
            OO.log(createErrorString("Plugin missing function: " + reqFunc));
          }
          break;
        }
      }

      //if it's still valid check whether the getName returns a non empty string
      if (isValid)
      {
        try
        {
          var name = plugin.getName();
          if (!name || !_.isString(name))
          {
            OO.log(createErrorString("Plugin does not have \'string\' as return type of getName() or is empty string"));
            isValid = false;
          }
        }
        catch (e)
        {
          OO.log(createErrorString("Plugin throws error on call to getName"));
          isValid = false;
        }

      }

      //if it's still valid check whether the getVersion returns a non empty string
      if (isValid)
      {
        try
        {
          var version = plugin.getVersion();
          if (!version || !_.isString(version))
          {
            OO.log(createErrorString("Plugin does not have \'string\' as return type of getVersion() or is empty string"));
            isValid = false;
          }
        }
        catch(e)
        {
          OO.log(createErrorString("Plugin throws error on call to getVersion"));
          isValid = false;
        }
      }
    }
    return isValid;
  };

  /**
   * Get a list of plugin ids for the currently registered plugins.
   * @public
   * @method OO.Analytics.Framework#getPluginIDList
   * @return {Array} An array of plugin IDs.
   */
  this.getPluginIDList = function()
  {
    var list = [];
    if (_registeredPlugins)
    {
      for (var pluginID in _registeredPlugins)
      {
        list.push(pluginID);
      }
    }
    return list;
  };

  /**
   * Return the instance of the plugin for a given id. This is for convinience
   * since the factory and instance are stored together in an object.
   * @private
   * @method OO.Analytics.Framework#getPluginInstance
   * @param  {string} pluginID The id of the plugin.
   * @return {object}          Returns the plugin instance.
   */
  var getPluginInstance = privateMember(function(pluginID)
  {
    var toReturn;
    if (_registeredPlugins && _registeredPlugins[pluginID])
    {
      toReturn = _registeredPlugins[pluginID].instance;
    }
    return toReturn;
  });

  /**
   * Return whether or not a plugin is active and able to receive events.
   * @public
   * @method OO.Analytics.Framework#isPluginActive
   * @param {string}  pluginID Plugin id to check
   * @return {boolean}         Returns true if plugin is active. If plugin isn't registered, it will return false.
   */
  this.isPluginActive = function(pluginID)
  {
    if (pluginID &&
        _registeredPlugins &&
        _registeredPlugins[pluginID] &&
        _.isBoolean(_registeredPlugins[pluginID].active))
    {
      return _registeredPlugins[pluginID].active;
    }
    return false;
  };

  /**
   * Set a plugin to be active and receive messages.
   * @public
   * @method OO.Analytics.Framework#makePluginActive
   * @param {string}   pluginID Plugin id to set to active
   * @return {boolean}          Returns true if plugin found and was able to be activated.
   */
  this.makePluginActive = function(pluginID)
  {
    var success = false;
    if (pluginID && _registeredPlugins && _registeredPlugins[pluginID])
    {
      _registeredPlugins[pluginID].active = true;
      success = true;
    }
    return success;
  };

  /**
   * Set a plugin to be inactive.
   * @public
   * @method OO.Analytics.Framework#makePluginInactive
   * @param  {string}  pluginID Plugin id to set to inactive
   * @return {boolean}          Returns true if plugin found and was able to be deactivated.
   */
  this.makePluginInactive = function(pluginID)
  {
    var success = false;
    if (pluginID && _registeredPlugins && _registeredPlugins[pluginID])
    {
      _registeredPlugins[pluginID].active = false;
      success = true;
    }
    return success;
  };

  /**
   * Helper function to flatten an object with a nested objects into a single array of values.
   * @public
   * @method OO.Analytics.Framework#flattenEvents
   * @param {object} eventObject The event key-value pair to flatten
   * @returns {string[]} An array of strings representing the flattened values of the object.
   */
  this.flattenEvents = function(eventObject)
  {
    var eventArray = [];
    var eventKeys = _.keys(eventObject);
    for (var i = 0; i < eventKeys.length; i++)
    {
      var eventKey = eventKeys[i];
      var eventValue = eventObject[eventKey];
      if (typeof eventValue === "object")
      {
        var innerEvents = this.flattenEvents(eventValue);
        for (var j = 0; j < innerEvents.length; j++)
        {
          var innerEvent = innerEvents[j];
          eventArray.push(innerEvent);
        }
      }
      else
      {
        eventArray.push(eventValue);
      }
    }
    return eventArray;
  };

  /**
   * Helper function to create the events lookup dictionary.
   * @public
   * @method OO.Analytics.Framework#createEventDictionary
   * @returns {object|null} The created events dictionary. Returns null if there are any errors.
   */
  this.createEventDictionary = function()
  {
    var eventDictionary = null;
    var eventArray = this.flattenEvents(OO.Analytics.EVENTS);
    if (eventArray && eventArray instanceof Array)
    {
      eventDictionary = {};
      for (var i = 0; i < eventArray.length; i++)
      {
        var eventName = eventArray[i];
        eventDictionary[eventName] = true;
      }
    }
    return eventDictionary;
  };

  _eventExistenceLookup = this.createEventDictionary();

  /**
   * Publish an event to all registered and active plugins.
   * @public
   * @method OO.Analytics.Framework#publishEvent
   * @param  {string} eventName Name of event to publish
   * @param  {Array}  params    Parameters to pass along with the event.
   * @return {boolean}          Return true if message is in OO.Analytics.EVENTS and was successfully published.
   */
  this.publishEvent = function(eventName, params)
  {
    var eventPublished = false;
    if (_eventExistenceLookup[eventName])
    {
      //if the params don't come in as an Array then create an empty array to pass in for everything.
      if (!_.isArray(params))
      {
        params = [];
      }
      //record the message
      if(_recording)
      {
        recordEvent(eventName, params);
      }
      //propogate the message to all active plugins.
      var pluginID;
      for (pluginID in _registeredPlugins)
      {
        if (this.isPluginActive(pluginID))
        {
          var plugin = getPluginInstance(pluginID);
          safeFunctionCall(plugin, "processEvent",[eventName, params]);
        }
      }
      eventPublished = true;
    }
    else
    {
      OO.log(createErrorString("Event \'" + eventName + "\' being published and it's not in the list of OO.Analytics.EVENTS"));
    }
    return eventPublished;
  };

  /**
   * Create a unique id for a given plugin/factory. In case someone needs to register
   * multiple of the same plugin or two plugins  have the same name, this creates
   * unique ids for each.
   * @private
   * @method OO.Analytics.Framework#createPluginId
   * @param  {object} plugin Instance of plugin to create id for.
   * @return {string}        The plugin id.
   */
  var createPluginId = privateMember(function(plugin)
  {
    var id = null;
    var error;
    //Plugin ID's are create using sequential numbers. Nothing fancy but this
    //way the framework can keep track of how many have been registered. There is
    //a chance that someone could have an infinite loop where plugins get registered
    //unregistered all the time, so this will output some error messages to help
    //debug that.
    if (plugin)
    {
      var name = safeFunctionCall(plugin, "getName");
      var version = safeFunctionCall(plugin, "getVersion");
      if (name && version)
      {
        id = _uniquePluginId + "_" + name + "_" + version;
        //we shouldn't have any naming conflicts but just in case, throw an error
        if (!_registeredPlugins[id])
        {
          _uniquePluginId++;
        }
        else
        {
          OO.log(createErrorString("Failed to create a unique name for plugin " + name + "_" + version));
          id = null;
        }

        if (_uniquePluginId > MAX_PLUGINS)
        {
          OO.log(createErrorString("You have tried to create more than " + MAX_PLUGINS + " unique plugin ids. There is probably an infinite loop or some other error."));
        }
      }
    }
    return id;
  });

  /**
   * Helper function to give a plugin it's correct set of metadata.
   * @private
   * @method OO.Analytics.Framework#passMetadataToPlugin
   * @param  {object} plugin The plugin instance to give the metadata to
   */
  var passMetadataToPlugin = privateMember(function(plugin)
  {
    if (_pluginMetadata)
    {
      var pluginName = safeFunctionCall(plugin, "getName");
      if (!pluginName)
      {
        OO.log(createErrorString("Trying to pass in metadata to plugin that does not have valid name"));
        return;
      }

      var metadataForThisPlugin = _pluginMetadata[pluginName];
      safeFunctionCall(plugin, "setMetadata", [metadataForThisPlugin]);
    }
  });

 /**
  * Helper function to create consistent error messages.
  * @private
  * @method OO.Analytics.Framework#createErrorString
  * @param  {string} errorDetails The error details.
  * @return {string}              The new error message.
  */
  var createErrorString = function(errorDetails)
  {
    return "ERROR Analytics Framework: " + errorDetails;
  };

  /**
   * This function does several things:
   * -Safely call a function on an instance of a plugin.
   * -Elminates checking to see if function exists.
   * -If an error is thrown while calling the function, this will catch it and
   * output a message and the framework can continue running.
   * -If OO.DEBUG is true, safeFunctionCall will check if the function being called
   * is in the list of required functions. If it's not, then it will output a message.
   * Only functions in the required list should be called in the framework code.
   * @private
   * @method OO.Analytics.Framework#safeFunctionCall
   * @param  {object} plugin   Plugin instance to call function on.
   * @param  {string} funcName Name of function to call.
   * @param  {array}  params   The parameters to pass into the function.
   * @return {varies}          Returns the function's return value. If an error occurred, returns null.
   */
  var safeFunctionCall = privateMember(function(plugin, funcName, params)
  {
    if (OO.DEBUG)
    {
      debugCheckFunctionIsInRequiredList(funcName);
    }

    try
    {
      if (_.isFunction(plugin[funcName]))
      {
        return plugin[funcName].apply(plugin, params);
      }
    }
    catch (err)
    {
      try
      {
        if (plugin && _.isFunction(plugin.getName))
        {
          OO.log(createErrorString("Error occurred during call to function \'" + funcName + "\' on plugin \'" + plugin.getName() + "\'\n", err));
        }
      }
      catch(e)
      {
        OO.log(createErrorString("Error occurred during call to function \'" + funcName + "\' on plugin\n", err));
      }
    }

    return null;
  });

  /**
   * Check if function name exists in the list of require functions for plugins.
   * Outputs error message if it doesn't exist.
   * @private
   * @method OO.Analytics.Framework#safeFunctionCall
   * @param  {string} funcName Name of the function to check.
   */
  var debugCheckFunctionIsInRequiredList = privateMember(function(funcName)
  {
    if(!_.contains(OO.Analytics.REQUIRED_PLUGIN_FUNCTIONS, funcName))
    {
      OO.log(createErrorString("Calling function \'" + funcName + "\' in framework code and it's not in the REQUIRED_PLUGIN_FUNCTIONS list."));
    }
  });

  //Register this instance so it will register all the plugin factories currently loaded.
  OO.Analytics.RegisterFrameworkInstance(this);
};

},{"../../html5-common/js/utils/InitModules/InitOOUnderscore.js":2,"./AnalyticsConstants.js":3,"./InitAnalyticsNamespace.js":5}],5:[function(require,module,exports){
require("../../html5-common/js/utils/InitModules/InitOO.js");
require("../../html5-common/js/utils/InitModules/InitOOUnderscore.js");

if (!OO.Analytics)
{
  OO.Analytics = {};
}

if (!OO.Analytics.FrameworkInstanceList)
{
  OO.Analytics.FrameworkInstanceList = [];
}

if (!OO.Analytics.PluginFactoryList)
{
  OO.Analytics.PluginFactoryList = [];
}

if (!OO.Analytics.RegisterPluginFactory)
{
  /**
   * Registers a plugin factory in a global list of factories and then
   * registers the factory with any existing framework instances.
   * @public
   * @method OO.Analytics.Framework#RegisterPluginFactory
   * @param  {object} factory The factory creation function
   */
  OO.Analytics.RegisterPluginFactory = function(factory)
  {
    //Add plugin to the factory list.
    OO.Analytics.PluginFactoryList.push(factory);

    //Register this plugin with any existing frameworks.
    if (OO.Analytics.FrameworkInstanceList && OO.Analytics.FrameworkInstanceList.length)
    {
      for(var i = 0; i < OO.Analytics.FrameworkInstanceList.length; i++)
      {
        OO.Analytics.FrameworkInstanceList[i].registerPluginFactory(factory);
      }
    }
  }
}


if (!OO.Analytics.FrameworkRegistrationObject)
{
  /**
   * @class FrameworkRegistrationObject
   * @classdesc This class wraps a framework object to only expose
   * registerPluginFactory.  It will be used to let plugins register to frameworks
   * at the global scope. Please note that this class is not important to analytics plugins. You only need to use this class if you're creating your own version of the Analytics Framework.
   * @public
   * @param  {object} framework Analytics framework instance
   */
  OO.Analytics.FrameworkRegistrationObject = function(framework)
  {
    this.registerPluginFactory = function(pluginFactory)
    {
      framework.registerPlugin(pluginFactory);
    }
  }
}


if (!OO.Analytics.RegisterFrameworkInstance)
{
  /**
   * Registers a framework instance in a global list of frameworks and then
   * register any plugin factory that are in the global plugin factory list.
   * @public
   * @method OO.Analytics.Framework#RegisterFrameworkInstance
   * @param  {object} framework Instance of the framework to register
   */
  OO.Analytics.RegisterFrameworkInstance = function(framework)
  {
    var frameworkRegistrationObject = new OO.Analytics.FrameworkRegistrationObject(framework);
    framework.frameworkRegistrationObject = frameworkRegistrationObject;
    OO.Analytics.FrameworkInstanceList.push(frameworkRegistrationObject);

    //check to see if any plugin factories already existed and register them to this plugin.
    if (OO._.isArray(OO.Analytics.PluginFactoryList) && OO.Analytics.PluginFactoryList.length > 0)
    {
      for (var i = 0; i < OO.Analytics.PluginFactoryList.length; i++)
      {
        framework.registerPlugin(OO.Analytics.PluginFactoryList[i]);
      }
    }
  }
}

if (!OO.Analytics.UnregisterFrameworkInstance)
{
  /**
   * Remove a framework instance from the global list of instance. You must have
   * a reference to the FrameworkRegistrationObject from that framework to remove it.
   * This is meant for framework instances to remove themselves from the list only.
   * @public
   * @method OO.Analytics.Framework#UnregisterFrameworkInstance
   * @param  {object} framework Instance of the FrameworkRegistrationObject created when framework instance was registered
   */
  OO.Analytics.UnregisterFrameworkInstance = function(framework)
  {
    if (framework)
    {
      var regObj = framework.frameworkRegistrationObject;
      if (regObj)
      {
        OO.Analytics.FrameworkInstanceList = OO._.without(OO.Analytics.FrameworkInstanceList, regObj);
      }
    }
  }
}

},{"../../html5-common/js/utils/InitModules/InitOO.js":1,"../../html5-common/js/utils/InitModules/InitOOUnderscore.js":2}],6:[function(require,module,exports){
//     Underscore.js 1.3.3
//     (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
//     Underscore is freely distributable under the MIT license.
//     Portions of Underscore are inspired or borrowed from Prototype,
//     Oliver Steele's Functional, and John Resig's Micro-Templating.
//     For all details and documentation:
//     http://documentcloud.github.com/underscore

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var slice            = ArrayProto.slice,
      unshift          = ArrayProto.unshift,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) { return new wrapper(obj); };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root['_'] = _;
  }

  // Current version.
  _.VERSION = '1.3.3';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, l = obj.length; i < l; i++) {
        if (i in obj && iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      for (var key in obj) {
        if (_.has(obj, key)) {
          if (iterator.call(context, obj[key], key, obj) === breaker) return;
        }
      }
    }
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results[results.length] = iterator.call(context, value, index, list);
    });
    if (obj.length === +obj.length) results.length = obj.length;
    return results;
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError('Reduce of empty array with no initial value');
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var reversed = _.toArray(obj).reverse();
    if (context && !initial) iterator = _.bind(iterator, context);
    return initial ? _.reduce(reversed, iterator, memo, context) : _.reduce(reversed, iterator);
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, iterator, context) {
    var result;
    any(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(iterator, context);
    each(obj, function(value, index, list) {
      if (iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    each(obj, function(value, index, list) {
      if (!iterator.call(context, value, index, list)) results[results.length] = value;
    });
    return results;
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, iterator, context) {
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(iterator, context);
    each(obj, function(value, index, list) {
      if (!(result = result && iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, iterator, context) {
    iterator || (iterator = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(iterator, context);
    each(obj, function(value, index, list) {
      if (result || (result = iterator.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if a given value is included in the array or object using `===`.
  // Aliased as `contains`.
  _.include = _.contains = function(obj, target) {
    var found = false;
    if (obj == null) return found;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    found = any(obj, function(value) {
      return value === target;
    });
    return found;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    return _.map(obj, function(value) {
      return (_.isFunction(method) ? method || value : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, function(value){ return value[key]; });
  };

  // Return the maximum element or (element-based computation).
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.max.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return -Infinity;
    var result = {computed : -Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed >= result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0]) return Math.min.apply(Math, obj);
    if (!iterator && _.isEmpty(obj)) return Infinity;
    var result = {computed : Infinity};
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      computed < result.computed && (result = {value : value, computed : computed});
    });
    return result.value;
  };

  // Shuffle an array.
  _.shuffle = function(obj) {
    var shuffled = [], rand;
    each(obj, function(value, index, list) {
      rand = Math.floor(Math.random() * (index + 1));
      shuffled[index] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, val, context) {
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value : value,
        criteria : iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria, b = right.criteria;
      if (a === void 0) return 1;
      if (b === void 0) return -1;
      return a < b ? -1 : a > b ? 1 : 0;
    }), 'value');
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = function(obj, val) {
    var result = {};
    var iterator = _.isFunction(val) ? val : function(obj) { return obj[val]; };
    each(obj, function(value, index) {
      var key = iterator(value, index);
      (result[key] || (result[key] = [])).push(value);
    });
    return result;
  };

  // Use a comparator function to figure out at what index an object should
  // be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator) {
    iterator || (iterator = _.identity);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >> 1;
      iterator(array[mid]) < iterator(obj) ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely convert anything iterable into a real, live array.
  _.toArray = function(obj) {
    if (!obj)                                     return [];
    if (_.isArray(obj))                           return slice.call(obj);
    if (_.isArguments(obj))                       return slice.call(obj);
    if (obj.toArray && _.isFunction(obj.toArray)) return obj.toArray();
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    return _.isArray(obj) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    return (n != null) && !guard ? slice.call(array, 0, n) : array[0];
  };

  // Returns everything but the last entry of the array. Especcialy useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if ((n != null) && !guard) {
      return slice.call(array, Math.max(array.length - n, 0));
    } else {
      return array[array.length - 1];
    }
  };

  // Returns everything but the first entry of the array. Aliased as `tail`.
  // Especially useful on the arguments object. Passing an **index** will return
  // the rest of the values in the array from that index onward. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = function(array, index, guard) {
    return slice.call(array, (index == null) || guard ? 1 : index);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, function(value){ return !!value; });
  };

  // Return a completely flattened version of an array.
  _.flatten = function(array, shallow) {
    return _.reduce(array, function(memo, value) {
      if (_.isArray(value)) return memo.concat(shallow ? value : _.flatten(value));
      memo[memo.length] = value;
      return memo;
    }, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator) {
    var initial = iterator ? _.map(array, iterator) : array;
    var results = [];
    // The `isSorted` flag is irrelevant if the array only contains two elements.
    if (array.length < 3) isSorted = true;
    _.reduce(initial, function (memo, value, index) {
      if (isSorted ? _.last(memo) !== value || !memo.length : !_.include(memo, value)) {
        memo.push(value);
        results.push(array[index]);
      }
      return memo;
    }, []);
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays. (Aliased as "intersect" for back-compat.)
  _.intersection = _.intersect = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.indexOf(other, item) >= 0;
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = _.flatten(slice.call(arguments, 1), true);
    return _.filter(array, function(value){ return !_.include(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var args = slice.call(arguments);
    var length = _.max(_.pluck(args, 'length'));
    var results = new Array(length);
    for (var i = 0; i < length; i++) results[i] = _.pluck(args, "" + i);
    return results;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i, l;
    if (isSorted) {
      i = _.sortedIndex(array, item);
      return array[i] === item ? i : -1;
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item);
    for (i = 0, l = array.length; i < l; i++) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item) {
    if (array == null) return -1;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) return array.lastIndexOf(item);
    var i = array.length;
    while (i--) if (i in array && array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var len = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(len);

    while(idx < len) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Binding with arguments is also known as `curry`.
  // Delegates to **ECMAScript 5**'s native `Function.bind` if available.
  // We check for `func.bind` first, to fail fast when `func` is undefined.
  _.bind = function bind(func, context) {
    var bound, args;
    if (func.bind === nativeBind && nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Bind all of an object's methods to that object. Useful for ensuring that
  // all callbacks defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length == 0) funcs = _.functions(obj);
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time.
  _.throttle = function(func, wait) {
    var context, args, timeout, throttling, more, result;
    var whenDone = _.debounce(function(){ more = throttling = false; }, wait);
    return function() {
      context = this; args = arguments;
      var later = function() {
        timeout = null;
        if (more) func.apply(context, args);
        whenDone();
      };
      if (!timeout) timeout = setTimeout(later, wait);
      if (throttling) {
        more = true;
      } else {
        result = func.apply(context, args);
      }
      whenDone();
      throttling = true;
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      if (immediate && !timeout) func.apply(context, args);
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      return memo = func.apply(this, arguments);
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return function() {
      var args = [func].concat(slice.call(arguments, 0));
      return wrapper.apply(this, args);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    if (times <= 0) return func();
    return function() {
      if (--times < 1) { return func.apply(this, arguments); }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = nativeKeys || function(obj) {
    if (obj !== Object(obj)) throw new TypeError('Invalid object');
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys[keys.length] = key;
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    return _.map(obj, _.identity);
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var result = {};
    each(_.flatten(slice.call(arguments, 1)), function(key) {
      if (key in obj) result[key] = obj[key];
    });
    return result;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      for (var prop in source) {
        if (obj[prop] == null) obj[prop] = source[prop];
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function.
  function eq(a, b, stack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the Harmony `egal` proposal: http://wiki.ecmascript.org/doku.php?id=harmony:egal.
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a._chain) a = a._wrapped;
    if (b._chain) b = b._wrapped;
    // Invoke a custom `isEqual` method if one is provided.
    if (a.isEqual && _.isFunction(a.isEqual)) return a.isEqual(b);
    if (b.isEqual && _.isFunction(b.isEqual)) return b.isEqual(a);
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = stack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (stack[length] == a) return true;
    }
    // Add the first object to the stack of traversed objects.
    stack.push(a);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          // Ensure commutative equality for sparse arrays.
          if (!(result = size in a == size in b && eq(a[size], b[size], stack))) break;
        }
      }
    } else {
      // Objects with different constructors are not equivalent.
      if ('constructor' in a != 'constructor' in b || a.constructor != b.constructor) return false;
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], stack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    stack.pop();
    return result;
  }

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType == 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Is a given variable an arguments object?
  _.isArguments = function(obj) {
    return toString.call(obj) == '[object Arguments]';
  };
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Is a given value a function?
  _.isFunction = function(obj) {
    return toString.call(obj) == '[object Function]';
  };

  // Is a given value a string?
  _.isString = function(obj) {
    return toString.call(obj) == '[object String]';
  };

  // Is a given value a number?
  _.isNumber = function(obj) {
    return toString.call(obj) == '[object Number]';
  };

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return _.isNumber(obj) && isFinite(obj);
  };

  // Is the given value `NaN`?
  _.isNaN = function(obj) {
    // `NaN` is the only value for which `===` is not reflexive.
    return obj !== obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value a date?
  _.isDate = function(obj) {
    return toString.call(obj) == '[object Date]';
  };

  // Is the given value a regular expression?
  _.isRegExp = function(obj) {
    return toString.call(obj) == '[object RegExp]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Has own property?
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  // Run a function **n** times.
  _.times = function (n, iterator, context) {
    for (var i = 0; i < n; i++) iterator.call(context, i);
  };

  // Escape a string for HTML interpolation.
  _.escape = function(string) {
    return (''+string).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g,'&#x2F;');
  };

  // If the value of the named property is a function then invoke it;
  // otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return null;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object, ensuring that
  // they're correctly added to the OOP wrapper as well.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name){
      addToWrapper(name, _[name] = obj[name]);
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = idCounter++;
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /.^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    '\\': '\\',
    "'": "'",
    'r': '\r',
    'n': '\n',
    't': '\t',
    'u2028': '\u2028',
    'u2029': '\u2029'
  };

  for (var p in escapes) escapes[escapes[p]] = p;
  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;
  var unescaper = /\\(\\|'|r|n|t|u2028|u2029)/g;

  // Within an interpolation, evaluation, or escaping, remove HTML escaping
  // that had been previously added.
  var unescape = function(code) {
    return code.replace(unescaper, function(match, escape) {
      return escapes[escape];
    });
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    settings = _.defaults(settings || {}, _.templateSettings);

    // Compile the template source, taking care to escape characters that
    // cannot be included in a string literal and then unescape them in code
    // blocks.
    var source = "__p+='" + text
      .replace(escaper, function(match) {
        return '\\' + escapes[match];
      })
      .replace(settings.escape || noMatch, function(match, code) {
        return "'+\n_.escape(" + unescape(code) + ")+\n'";
      })
      .replace(settings.interpolate || noMatch, function(match, code) {
        return "'+\n(" + unescape(code) + ")+\n'";
      })
      .replace(settings.evaluate || noMatch, function(match, code) {
        return "';\n" + unescape(code) + "\n;__p+='";
      }) + "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __p='';" +
      "var print=function(){__p+=Array.prototype.join.call(arguments, '')};\n" +
      source + "return __p;\n";

    var render = new Function(settings.variable || 'obj', '_', source);
    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for build time
    // precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' +
      source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // The OOP Wrapper
  // ---------------

  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.
  var wrapper = function(obj) { this._wrapped = obj; };

  // Expose `wrapper.prototype` as `_.prototype`
  _.prototype = wrapper.prototype;

  // Helper function to continue chaining intermediate results.
  var result = function(obj, chain) {
    return chain ? _(obj).chain() : obj;
  };

  // A method to easily add functions to the OOP wrapper.
  var addToWrapper = function(name, func) {
    wrapper.prototype[name] = function() {
      var args = slice.call(arguments);
      unshift.call(args, this._wrapped);
      return result(func.apply(_, args), this._chain);
    };
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      var wrapped = this._wrapped;
      method.apply(wrapped, arguments);
      var length = wrapped.length;
      if ((name == 'shift' || name == 'splice') && length === 0) delete wrapped[0];
      return result(wrapped, this._chain);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    wrapper.prototype[name] = function() {
      return result(method.apply(this._wrapped, arguments), this._chain);
    };
  });

  // Start chaining a wrapped Underscore object.
  wrapper.prototype.chain = function() {
    this._chain = true;
    return this;
  };

  // Extracts the result from a wrapped and chained object.
  wrapper.prototype.value = function() {
    return this._wrapped;
  };

}).call(this);

},{}]},{},[4]);


OO.exposeStaticApi("Analytics", OO.Analytics);


OO.plugin("AnalyticsFrameworkTranslator", function (OO, _, $, W)
{
  var mb;
  var af;
  var adMode = false;
  var impressionMade = false;

  // used for OO.EVENTS.ERROR message
  var errorCategoryDictionary = {};
  errorCategoryDictionary.SAS = OO.ERROR.API.SAS;
  errorCategoryDictionary.PLAYBACK = OO.ERROR.PLAYBACK;
  errorCategoryDictionary.METADATA_LOADING = OO.ERROR.API;
  errorCategoryDictionary.GENERAL = OO.ERROR;

  /**
   * Helper function for readability mainly. Binds private functions to 'this' instance
   * of Framework, to give access to private variables.
   * @private
   * @method OO.Analytics.Framework#privateMember
   * @param  {function} functionVar The function to be bound to this instance of Framework
   * @return {function}             Bound function.
   */
  var privateMember = _.bind(function(functionVar)
  {
    if (!_.isFunction(functionVar))
    {
      throw (createErrorString("Trying to make private function but " + functionVar + " is not a function."));
    }
    return _.bind(functionVar, this);
  }, this);


  var AnalyticsFrameworkTranslator = function(mbIn, id)
  {
    this.id = id;
    mb = mbIn;
    af = new OO.Analytics.Framework();
    mb.subscribe(OO.EVENTS.PLAYER_CREATED, "AnalyticsFrameworkTranslator", onPlayerCreated);
    mb.subscribe(OO.EVENTS.EMBED_CODE_CHANGED, "AnalyticsFrameworkTranslator", onEmbedCodeChanged);
    mb.subscribe(OO.EVENTS.CONTENT_TREE_FETCHED, "AnalyticsFrameworkTranslator", onContentTreeFetched);
    mb.subscribe(OO.EVENTS.METADATA_FETCHED, "AnalyticsFrameworkTranslator", onMetadataFetched);
    mb.subscribe(OO.EVENTS.AUTHORIZATION_FETCHED, "AnalyticsFrameworkTranslator", onAuthorizationFetched);
    mb.subscribe(OO.EVENTS.INITIAL_PLAY, "AnalyticsFrameworkTranslator", onInitialPlay);
    mb.subscribe(OO.EVENTS.PLAY, "AnalyticsFrameworkTranslator", onPlay);
    mb.subscribe(OO.EVENTS.DOWNLOADING, "AnalyticsFrameworkTranslator", onDownloading);
    mb.subscribe(OO.EVENTS.BUFFERING, "AnalyticsFrameworkTranslator", onBuffering);
    mb.subscribe(OO.EVENTS.BUFFERED, "AnalyticsFrameworkTranslator", onBuffered);
    mb.subscribe(OO.EVENTS.BITRATE_INFO_AVAILABLE, "AnalyticsFrameworkTranslator", onBitrateInfoAvailable);
    mb.subscribe(OO.EVENTS.SET_TARGET_BITRATE, "AnalyticsFrameworkTranslator", onSetTargetBitrate);
    mb.subscribe(OO.EVENTS.BITRATE_CHANGED, "AnalyticsFrameworkTranslator", onBitrateChanged);
    mb.subscribe(OO.EVENTS.PLAYING, "AnalyticsFrameworkTranslator", onPlaying);
    mb.subscribe(OO.EVENTS.PLAYHEAD_TIME_CHANGED, "AnalyticsFrameworkTranslator", onPlayheadTimeChanged);
    mb.subscribe(OO.EVENTS.PLAYED, "AnalyticsFrameworkTranslator", onPlayed);
    mb.subscribe(OO.EVENTS.PAUSE, "AnalyticsFrameworkTranslator", onPause);
    mb.subscribe(OO.EVENTS.PAUSED, "AnalyticsFrameworkTranslator", onPaused);
    mb.subscribe(OO.EVENTS.REPLAY, "AnalyticsFrameworkTranslator", onReplay);
    mb.subscribe(OO.EVENTS.SEEK, "AnalyticsFrameworkTranslator", onSeek);
    mb.subscribe(OO.EVENTS.SEEKED, "AnalyticsFrameworkTranslator", onSeeked);
    mb.subscribe(OO.EVENTS.WILL_PLAY_ADS, "AnalyticsFrameworkTranslator", onWillPlayAds);
    mb.subscribe(OO.EVENTS.AD_POD_STARTED, "AnalyticsFrameworkTranslator", onAdPodStarted);
    mb.subscribe(OO.EVENTS.AD_POD_ENDED, "AnalyticsFrameworkTranslator", onAdPodEnded);
    mb.subscribe(OO.EVENTS.WILL_PLAY_SINGLE_AD, "AnalyticsFrameworkTranslator", onWillPlaySingleAd);
    mb.subscribe(OO.EVENTS.SINGLE_AD_PLAYED, "AnalyticsFrameworkTranslator", onSingleAdPlayed);
    mb.subscribe(OO.EVENTS.WILL_PLAY_NONLINEAR_AD, "AnalyticsFrameworkTranslator", onWillPlayNonlinearAd);
    mb.subscribe(OO.EVENTS.NONLINEAR_AD_PLAYED, "AnalyticsFrameworkTranslator", onNonlinearAdPlayed);
    mb.subscribe(OO.EVENTS.ADS_PLAYED, "AnalyticsFrameworkTranslator", onAdsPlayed);
    mb.subscribe(OO.EVENTS.SKIP_AD, "AnalyticsFrameworkTranslator", onSkipAd);
    mb.subscribe(OO.EVENTS.ADS_ERROR, "AnalyticsFrameworkTranslator", onAdsError);
    mb.subscribe(OO.EVENTS.ADS_CLICKTHROUGH_OPENED, "AnalyticsFrameworkTranslator", onAdsClickthroughOpened);
    mb.subscribe(OO.EVENTS.FULLSCREEN_CHANGED, "AnalyticsFrameworkTranslator", onFullscreenChanged);
    mb.subscribe(OO.EVENTS.VOLUME_CHANGED, "AnalyticsFrameworkTranslator", onVolumeChanged);
    mb.subscribe(OO.EVENTS.DESTROY, "AnalyticsFrameworkTranslator", onDestroy);
    mb.subscribe(OO.EVENTS.VC_PLAYED, "AnalyticsFrameworkTranslator", onVideoPlayed);
    mb.subscribe(OO.EVENTS.VC_PLAYING, "AnalyticsFrameworkTranslator", onVideoPlaying);
    mb.subscribe(OO.EVENTS.VC_VIDEO_ELEMENT_CREATED, "AnalyticsFrameworkTranslator", onVideoElementCreated);
    mb.subscribe(OO.EVENTS.ERROR, "AnalyticsFrameworkTranslator", onError);

    // [DEPRECATED] (NOTE: Is being replaced by OO.EVENTS.ERROR)
    mb.subscribe(OO.EVENTS.VC_PLAY_FAILED, "AnalyticsFrameworkTranslator", onVideoPlayFailed);

  };

  // Event Callbacks
  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.PLAYER_CREATED -> OO.Analytics.EVENTS.VIDEO_PLAYER_CREATED.
   * @private
   * @method AnalyticsFrameworkTranslator#onPlayerCreated
   * @param {string} eventName Core message bus event name
   * @param {string} elementId The id of the DOM element that contains the player
   * @param {object} metadata The configuration metadata associated with the player
   * (i.e. pcode, playerBrandingId, skin configuration, player configuration parameters)
   */
  var onPlayerCreated = privateMember(function(eventName, elementId, metadata)
  {
    var param1;
    try
    {
      // TODO checkDataType
      param1 = metadata;
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.setPluginMetadata(param1);
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_PLAYER_CREATED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.EMBED_CODE_CHANGED -> OO.Analytics.EVENTS.VIDEO_SOURCE_CHANGED.
   * @private
   * @method AnalyticsFrameworkTranslator#onEmbedCodeChanged
   * @param {string} eventName Core message bus event name
   * @param {string} embedCode The embed code
   * @param {object} params The configuration metadata associated with the player
   * (i.e. pcode, playerBrandingId, skin configuration, player configuration parameters)
   */
  var onEmbedCodeChanged = privateMember(function(eventName, embedCode, params)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoSourceData(embedCode, params);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_SOURCE_CHANGED, [param1]);
  });

  /**
   * Callback to map core mesesage bus event to AnalyticsFramework event:
   * OO.EVENTS.CONTENT_TREE_FETCHED -> OO.Analytics.EVENTS.VIDEO_CONTENT_METADATA_UPDATED.
   * @private
   * @method AnalyticsFrameworkTranslator#onContentTreeFetched
   * @param {string} eventName Core message bus event name
   * @param {object} content The metadata associated with the content
   * (i.e. title, description, duration, etc)
   */
  var onContentTreeFetched = privateMember(function(eventName, content)
  {
    var param1;
    try
    {
      var contentInfo = content;
      param1 = new OO.Analytics.EVENT_DATA.VideoContentMetadata(contentInfo.title,
        contentInfo.description,
        contentInfo.duration,
        contentInfo.closed_captions,
        contentInfo.content_type,
        contentInfo.hostedAtURL);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_CONTENT_METADATA_UPDATED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.METADATA_FETCHED -> OO.Analytics.EVENTS.VIDEO_STREAM_METADATA_UPDATED.
   * @private
   * @method AnalyticsFrameworkTranslator#onMetadataFetched
   * @param {string} eventName Core message bus event name
   * @param {object} metadata The Backdoor and Backlot metadata
   */
  var onMetadataFetched = privateMember(function(eventName, metadata)
  {
    var param1;
    try
    {
      // TODO checkDataType
      param1 = metadata;
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_STREAM_METADATA_UPDATED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.AUTHORIZATION_FETCHED -> OO.Analytics.STREAM_TYPE_UPDATED
   * @private
   * @method AnalyticsFrameworkTranslator#onAuthorizationFetched
   * @param {string} eventName Core message bus event name
   * @param {object} authMetadata Authorization metadata
   */
  var onAuthorizationFetched = privateMember(function(eventName, authMetadata)
  {
    var param1;
    try
    {
      var streamType;

      if (authMetadata && authMetadata.streams && authMetadata.streams[0]
          && authMetadata.streams[0]['is_live_stream'])
      {
        streamType = OO.Analytics.STREAM_TYPE.LIVE_STREAM;
      }
      else
      {
        streamType = OO.Analytics.STREAM_TYPE.VOD;
      }
      param1 = new OO.Analytics.EVENT_DATA.StreamTypeMetadata(streamType);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.STREAM_TYPE_UPDATED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.INITIAL_PLAY -> OO.Analytics.EVENTS.VIDEO_PLAY_REQUESTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onInitialPlay
   * @param {string} eventName Core message bus event name
   */
  var onInitialPlay = privateMember(function(eventName)
  {
    af.publishEvent(OO.Analytics.EVENTS.INITIAL_PLAYBACK_REQUESTED);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.PLAY -> OO.Analytics.EVENTS.VIDEO_PLAY_REQUESTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onPlay
   * @param {string} eventName Core message bus event name
   */
  var onPlay = privateMember(function(eventName)
  {
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_PLAY_REQUESTED);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.DOWNLOADING -> OO.Analytics.EVENTS.VIDEO_STREAM_DOWNLOADING.
   * @private
   * @method AnalyticsFrameworkTranslator#onDownloading
   * @param {string} eventName Core message bus event name
   * @param {number} currentTime The current video position represented in seconds
   * @param {number} duration The total stream duration represented in seconds
   * @param {number} buffer Represents up until what time / video stream position (in seconds)
   * has been buffered
   * @param {object} seekRange Represents the range in which a user is able to seek
   */
  var onDownloading = privateMember(function(eventName, currentTime, duration, buffer, seekRange)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoDownloadingMetadata(currentTime,
        duration,
        buffer,
        seekRange.start,
        seekRange.end);
    }
    catch(e)
    {
      param1 = {};
      logEventDataError(eventName);
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_STREAM_DOWNLOADING, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.BUFFERING -> OO.Analytics.EVENTS.VIDEO_BUFFERING_STARTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onBuffering
   * @param {string} eventName Core message bus event name
   * @param {string} url The stream url
   */
  var onBuffering = privateMember(function(eventName, url)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoBufferingStartedData(url);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_BUFFERING_STARTED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.BUFFERED -> OO.Analytics.EVENTS.VIDEO_BUFFERING_ENDED.
   * @private
   * @method AnalyticsFrameworkTranslator#onBuffered
   * @param {string} eventName Core message bus event name
   * @param {string} url The stream url
   */
  var onBuffered = privateMember(function(eventName, url)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoBufferingEndedData(url);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_BUFFERING_ENDED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.BITRATE_INFO_AVAILABLE -> OO.Analytics.EVENTS.VIDEO_STREAM_BITRATE_PROFILES.
   * @private
   * @method AnalyticsFrameworkTranslator#onBitrateInfoAvailable
   * @param {string} eventName Core message bus event name
   * @param {array} bitrateProfiles An array of all the bitrate profiles
   */
  var onBitrateInfoAvailable = privateMember(function(eventName, bitrateProfiles)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoBitrateProfileLookupData(bitrateProfiles.bitrates);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_STREAM_BITRATE_PROFILES, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.SET_TARGET_BITRATE -> OO.Analytics.EVENTS.VIDEO_STREAM_TARGET_BITRATE_REQUESTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onSetTargetBitrate
   * @param {string} eventName Core message bus event name
   * @param {string} bitrateProfileId The id of the bitrate profile requested
   */
  var onSetTargetBitrate = privateMember(function(eventName, bitrateProfileId)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoTargetBitrateData(bitrateProfileId);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_STREAM_TARGET_BITRATE_REQUESTED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.BITRATE_CHANGED -> OO.Analytics.EVENTS.VIDEO_STREAM_BITRATE_CHANGED.
   * @private
   * @method AnalyticsFrameworkTranslator#onBitrateChanged
   * @param {string} eventName Core message bus event name
   * @param {object} bitrateProfile An object containing the bitrate profile data of the new stream
   */
  var onBitrateChanged = privateMember(function(eventName, bitrateProfile)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoBitrateProfileData(bitrateProfile);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_STREAM_BITRATE_CHANGED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.PLAYING -> OO.Analytics.EVENTS.VIDEO_PLAYING.
   * @private
   * @method AnalyticsFrameworkTranslator#onPlaying
   * @param {string} eventName Core message bus event name
   */
  var onPlaying = privateMember(function(eventName)
  {
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_PLAYING);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.PLAYHEAD_TIME_CHANGED -> OO.Analytics.EVENTS.VIDEO_STREAM_POSITION_CHANGED.
   * @private
   * @method AnalyticsFrameworkTranslator#onPlayheadTimeChanged
   * @param {string} eventName Core message bus event name
   * @param {number} playheadPosition New playhead position in the current stream
   * @param {number} streamDuration Current streams total duration
   * @param {number} buffer The amount of the stream that has been buffered
   * @param {object} seekRange The available seek range given as {end:number, start:number}
   * @param {string} videoId Id used to differentiate between various streams (such as ad vs content playback).
   *                         Possible values are defined in OO.VIDEO.
   */
  var onPlayheadTimeChanged = privateMember(function(eventName, playheadPosition, streamDuration, buffer, seekRange, videoId)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoStreamPositionChangedData(playheadPosition, streamDuration, videoId);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_STREAM_POSITION_CHANGED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.PLAYED -> OO.Analytics.EVENTS.PLAYBACK_COMPLETED.
   * @private
   * @method AnalyticsFrameworkTranslator#onPlayed
   * @param {string} eventName Core message bus event name
   */
  var onPlayed = privateMember(function(eventName)
  {
    af.publishEvent(OO.Analytics.EVENTS.PLAYBACK_COMPLETED);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.PAUSE -> OO.Analytics.EVENTS.VIDEO_PAUSE_REQUESTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onPause
   * @param {string} eventName Core message bus event name
   */
  var onPause = privateMember(function(eventName)
  {
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_PAUSE_REQUESTED);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.PAUSED -> OO.Analytics.EVENTS.VIDEO_PAUSED.
   * @private
   * @method AnalyticsFrameworkTranslator#onPaused
   * @param {string} eventName Core message bus event name
   */
  var onPaused = privateMember(function(eventName)
  {
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_PAUSED);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.REPLAY -> OO.Analytics.EVENTS.VIDEO_REPLAY_REQUESTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onReplay
   * @param {string} eventName Core message bus event name
   */
  var onReplay = privateMember(function(eventName)
  {
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_REPLAY_REQUESTED);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.SEEK -> OO.Analytics.EVENTS.VIDEO_SEEK_REQUESTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onSeek
   * @param {string} eventName Core message bus event name
   * @param {number} playhead The video stream position (in seconds) to seek to
   */
  var onSeek = privateMember(function(eventName, playhead)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoSeekRequestedData(playhead);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_SEEK_REQUESTED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.SEEKED -> OO.Analytics.EVENTS.VIDEO_SEEK_COMPLETED.
   * @private
   * @method AnalyticsFrameworkTranslator#onSeeked
   * @param {string} eventName Core message bus event name
   * @param {number} playhead The video stream position (in seconds) after seeking
   */
  var onSeeked = privateMember(function(eventName, playhead)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoSeekCompletedData(playhead);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_SEEK_COMPLETED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.WILL_PLAY_ADS -> OO.Analytics.EVENTS.AD_BREAK_STARTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onWillPlayAds
   * @param {string} eventName Core message bus event name
   */
  var onWillPlayAds = privateMember(function(eventName)
  {
    adMode = true;
    af.publishEvent(OO.Analytics.EVENTS.AD_BREAK_STARTED);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.AD_POD_STARTED -> OO.Analytics.EVENTS.AD_POD_STARTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onAdPodStarted
   * @param {string} eventName Core message bus event name
   * @param {number} numberOfAds The number of ads in the ad pod
   */
  var onAdPodStarted = privateMember(function(eventName, numberOfAds)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.AdPodStartedData(numberOfAds);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.AD_POD_STARTED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.AD_POD_ENDED -> OO.Analytics.EVENTS.AD_POD_ENDED.
   * @private
   * @method AnalyticsFrameworkTranslator#onAdPodEnded
   * @param {string} eventName Core message bus event name
   * @param {string} adId The id of the ad pod
   */
  var onAdPodEnded = privateMember(function(eventName, adId)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.AdPodEndedData(adId);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.AD_POD_ENDED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.WILL_PLAY_SINGLE_AD -> OO.Analytics.EVENTS.AD_STARTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onWillPlaySingleAd
   * @param {string} eventName Core message bus event name
   * @param {object} adMetadata The ad metadata
   */
  var onWillPlaySingleAd = privateMember(function(eventName, adMetadata)
  {
    impressionMade = false;
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.AdStartedData(OO.Analytics.AD_TYPE.LINEAR_VIDEO, adMetadata);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.AD_STARTED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.SINGLE_AD_PLAYED -> OO.Analytics.EVENTS.AD_ENDED.
   * @private
   * @method AnalyticsFrameworkTranslator#onSingleAdPlayed
   * @param {string} eventName Core message bus event name
   * @param {string} adId The id of the ad
   */
  var onSingleAdPlayed = privateMember(function(eventName, adId)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.AdEndedData(OO.Analytics.AD_TYPE.LINEAR_VIDEO, adId);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.AD_ENDED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.WILL_PLAY_NONLINEAR_AD -> OO.Analytics.EVENTS.AD_STARTED.
   * @private
   * @method AnalyticsFrameworkTranslator#onWillPlayNonlinearAd
   * @param {string} eventName Core message bus event name
   * @param {string} adMetadata The ad metadata
   */
  var onWillPlayNonlinearAd = privateMember(function(eventName, adMetadata)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.AdStartedData(OO.Analytics.AD_TYPE.NONLINEAR_OVERLAY, adMetadata);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.AD_STARTED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.NONLINEAR_AD_PLAYED -> OO.Analytics.EVENTS.AD_ENDED.
   * @private
   * @method AnalyticsFrameworkTranslator#onNonlinearAdPlayed
   * @param {string} eventName Core message bus event name
   * @param {string} adId The id of the ad
   */
  var onNonlinearAdPlayed = privateMember(function(eventName, adId)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.AdEndedData(OO.Analytics.AD_TYPE.NONLINEAR_OVERLAY, adId);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.AD_ENDED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.ADS_PLAYED -> OO.Analytics.EVENTS.AD_BREAK_ENDED.
   * @private
   * @method AnalyticsFrameworkTranslator#onAdsPlayed
   * @param {string} eventName Core message bus event name
   */
  var onAdsPlayed = privateMember(function(eventName)
  {
    adMode = false;
    impressionMade = false;
    af.publishEvent(OO.Analytics.EVENTS.AD_BREAK_ENDED);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.SKIP_AD -> OO.Analytics.EVENTS.AD_SKIPPED.
   * @private
   * @method AnalyticsFrameworkTranslator#onSkipAd
   * @param {string} eventName Core message bus event name
   */
  var onSkipAd = privateMember(function(eventName)
  {
    af.publishEvent(OO.Analytics.EVENTS.AD_SKIPPED);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.ADS_ERROR -> OO.Analytics.EVENTS.AD_ERROR.
   * @private
   * @method AnalyticsFrameworkTranslator#onAdsError
   * @param {string} eventName Core message bus event name
   * @param {string|object} error The string or object containing the error information
   */
  var onAdsError = privateMember(function(eventName, error)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.AdErrorData(error);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.AD_ERROR, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.ADS_CLICKTHROUGH_OPENED -> OO.Analytics.EVENTS.AD_CLICKTHROUGH_OPENED.
   * @private
   * @method AnalyticsFrameworkTranslator#onAdsClickthroughOpened
   * @param {string} eventName Core message bus event name
   */
  var onAdsClickthroughOpened = privateMember(function(eventName)
  {
    af.publishEvent(OO.Analytics.EVENTS.AD_CLICKTHROUGH_OPENED);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.FULLSCREEN_CHANGED -> OO.Analytics.EVENTS.FULLSCREEN_CHANGED.
   * @private
   * @method AnalyticsFrameworkTranslator#onFullscreenChanged
   * @param {string} eventName Core message bus event name
   * @param {boolean} changingToFullscreen Whether or not the player is entering fullscreen.
   * true represents that the player is entering fullscreen. false represents that the player is
   * exiting fullscreen.
   */
  var onFullscreenChanged = privateMember(function(eventName, changingToFullscreen)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.FullscreenChangedData(changingToFullscreen);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.FULLSCREEN_CHANGED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.VOLUME_CHANGED -> OO.Analytics.EVENTS.VOLUME_CHANGED.
   * @private
   * @method AnalyticsFrameworkTranslator#onVolumeChanged
   * @param {string} eventName Core message bus event name
   * @param {number} volume The current volume after the change; the volume is a
   * value from 0 - 1, with 0 representing a muted state and 1 representing
   * the maximum volume.
   */
  var onVolumeChanged = privateMember(function(eventName, volume)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VolumeChangedData(volume);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VOLUME_CHANGED, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.DESTROY -> OO.Analytics.EVENTS.DESTROY.
   * @private
   * @method AnalyticsFrameworkTranslator#onDestroy
   * @param {string} eventName Core message bus event name
   */
  var onDestroy = privateMember(function(eventName)
  {
    af.publishEvent(OO.Analytics.EVENTS.DESTROY);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.VC_PLAYED -> OO.Analytics.EVENTS.VIDEO_CONTENT_COMPLETED.
   * @private
   * @method AnalyticsFrameworkTranslator#onVideoPlayed
   * @param {string} eventName Core message bus event name
   * @param {string} videoType The video type. It is either OO.VIDEO.MAIN or
   * OO.VIDEO.ADS.
   */
  var onVideoPlayed = privateMember(function(eventName, videoType)
  {
    if (videoType === OO.VIDEO.MAIN)
    {
      af.publishEvent(OO.Analytics.EVENTS.VIDEO_CONTENT_COMPLETED);
    }
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.VC_PLAYING -> OO.Analytics.EVENTS.AD_IMPRESSION.
   * @private
   * @method AnalyticsFrameworkTranslator#onVideoPlaying
   * @param {string} eventName Core message bus event name
   * @param {string} videoType The video type. It is either OO.VIDEO.MAIN or
   * OO.VIDEO.ADS.
   */
  var onVideoPlaying = privateMember(function(eventName, videoType)
  {
    if (videoType === OO.VIDEO.ADS && adMode && !impressionMade)
    {
      impressionMade = true;
      af.publishEvent(OO.Analytics.EVENTS.AD_IMPRESSION);
    }
  });

  /**
   * [DEPRECATED]
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.VC_PLAY_FAILED -> OO.Analytics.EVENTS.VIDEO_ERROR.
   * @private
   * @method AnalyticsFrameworkTranslator#onVideoPlayFailed
   * @param {string} eventName Core message bus event name
   * @param {string} videoType The video type. It is either OO.VIDEO.MAIN or
   * OO.VIDEO.ADS.
   * @param {string} code The error code number as a string
   */
  var onVideoPlayFailed = privateMember(function(eventName, videoType, code)
  {
    var param1;
    try
    {
      param1 = new OO.Analytics.EVENT_DATA.VideoErrorData(code);
    }
    catch(e)
    {
      logEventDataError(eventName);
      param1 = {};
    }
    af.publishEvent(OO.Analytics.EVENTS.VIDEO_ERROR, [param1]);
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.VC_VIDEO_ELEMENT_CREATED -> OO.Analytics.EVENTS.VIDEO_ELEMENT_CREATED.
   * @private
   * @method AnalyticsFrameworkTranslator#onVideoElementCreated
   * @param {string} eventName Core message bus event name
   * @param {string} videoType The video type. It is either OO.VIDEO.MAIN or
   * OO.VIDEO.ADS.
   */
  var onVideoElementCreated = privateMember(function(eventName, videoType)
  {
    if (videoType)
    {
      var videoId = videoType.videoId;
      //We only want to publish this info for main content
      if (videoId === OO.VIDEO.MAIN)
      {
        var param1 = null;
        try
        {
          param1 = new OO.Analytics.EVENT_DATA.VideoElementData(videoType.streamUrl);
        }
        catch(e)
        {
          logEventDataError(eventName);
          param1 = {};
        }
        af.publishEvent(OO.Analytics.EVENTS.VIDEO_ELEMENT_CREATED, [param1]);
      }
    }
  });

  /**
   * Callback to map core message bus event to AnalyticsFramework event:
   * OO.EVENTS.ERROR -> {OO.Analytics.EVENTS.ERROR.VIDEO, OO.Analytics.EVENTS.ERROR.AUTHORIZATION}.
   * @private
   * @method AnalyticsFrameworkTranslator#onError
   * @param {string} eventName Core message bus event name
   * @param {object} errorData Contains error code information
   * @param {string} errorData.code The Ooyala Error Event code
   */
  var onError = privateMember(function(eventName, errorData)
  {
    if (errorData && errorData.code)
    {
      var errorCode = errorData.code;
      var errorCategory = getErrorCategory(errorCode);
      if (errorCategory)
      {
        var param1;
        var errorMessage = OO.getLocalizedMessage(errorCode);
        switch(errorCategory)
        {
          case "SAS":
            param1 = new OO.Analytics.EVENT_DATA.AuthorizationErrorData(errorCode, errorMessage);
            af.publishEvent(OO.Analytics.EVENTS.ERROR.AUTHORIZATION, [param1]);
            break;
          case "PLAYBACK":
            param1 = new OO.Analytics.EVENT_DATA.VideoPlaybackErrorData(errorCode, errorMessage);
            af.publishEvent(OO.Analytics.EVENTS.ERROR.VIDEO_PLAYBACK, [param1]);
            break;
          case "METADATA_LOADING":
            param1 = new OO.Analytics.EVENT_DATA.MetadataLoadingErrorData(errorCode, errorMessage);
            af.publishEvent(OO.Analytics.EVENTS.ERROR.METADATA_LOADING, [param1]);
            break;
          case "GENERAL":
            param1 = new OO.Analytics.EVENT_DATA.GeneralErrorData(errorCode, errorMessage);
            af.publishEvent(OO.Analytics.EVENTS.ERROR.GENERAL, [param1]);
            break;
        }
      }
      else
      {
        createErrorString("error while reporting error message - " +
                          "error code does not fall under a recognized category. " +
                          "error code provided is: " + errorCode);
      }
    }
    else
    {
      createErrorString("error while reporting error message - " +
                        "expected errorData is malformed: " + errorData);
    }
  });

  /**
   * Helper function to return the category (SAS/PLAYBACK) that the error falls under.
   * @private
   * @method AnalyticsFrameworkTranslator#getErrorCategory
   * @param {string} errorCode The Ooyala Player Error Code emitted by the error event
   * @returns {string} The corresponding error category.
   */
  var getErrorCategory = privateMember(function(errorCode)
  {
    var resultingCategory = null;
    var categories = _.keys(errorCategoryDictionary);
    for (var i = 0; i < categories.length; i++)
    {
      var category = categories[i];
      var availableErrors =  _.values(errorCategoryDictionary[category]);
      if (_.contains(availableErrors, errorCode))
      {
        resultingCategory = category;
        break;
      }
    }
    return resultingCategory;
  });

  /**
   * Helper function to return an error string with the Analytics Framework Translator
   * prefix.
   * @private
   * @method AnalyticsFrameworkTranslator#createErrorString
   * @param {string} origStr the error string
   * @returns The new error string.
   */
  var createErrorString = privateMember(function(origStr)
  {
    return "Error AnalyticsFrameworkTranslator: " + origStr;
  });

  /**
   * Helper function to log the error string.
   * @private
   * @method AnalyticsFrameworkTranslator#logEventDataError
   * @param {string} eventName Core message bus event name
   */
  var logEventDataError = privateMember(function(eventName)
  {
    OO.log(createErrorString(eventName + " data changed and is causing an error."));
  });

  return AnalyticsFrameworkTranslator;
});

  (function(OO, $, _) {
    OO.AnalyticsBase = function(messageBus, id) { };

    _.extend(OO.AnalyticsBase.prototype, {
      loadSucceed: function() {}, // Override this function to do additional setup.

      reportEvent: function() {
        throw "Please override this function";
      },

      // Private funciton:

      setup: function(messageBus, id, analyticsType) {
        this.mb = messageBus;
        this.elementId = id;

        this._loaded = false;
        this._bufferedEvents = [];
        this.mb.subscribe('*', analyticsType, _.bind(this._onAnalyticsEvent,this));
      },

      loadExternalAnalyticsJs: function(url) {
        $.getScriptRetry(url, _.bind(this._onLoaded, this), {
          error: function() {
            // TODO: report error to some log server.
            OO.log("can not load url", url);
          }
        });
      },

      _onLoaded: function() {
        this._loaded = true;
        this.loadSucceed();
        if (!this._bufferedEvents) { return; }
        _.each(this._bufferedEvents, function(e){
          this._safeReportEvent.apply(this, e);
        }, this);
      },

      _onAnalyticsEvent: function() {
        // TODO: white labeling here.
        if (this._loaded) {
          this._safeReportEvent.apply(this, arguments);
        } else {
          this._bufferedEvents.push(arguments);
        }
      },

      _safeReportEvent: function() {
        try {
          this.reportEvent.apply(this, arguments);
        } catch (e) {
            OO.log("can not log event");
        }
      },

      __place_holder: true
    });

  }(OO, OO.$, OO._));
  (function(OO, $, _) {
    var OOYALA_ANALYTICS = "ooyala_analytics";

    var OoyalaAnalytics = OO.inherit(OO.AnalyticsBase, function(messageBus, id) {
      if (!OO.requiredInEnvironment('html5-playback')) { return; }

      this.setup(messageBus, id, OOYALA_ANALYTICS);

      this.lastEmbedCode = '';
      this.currentEmbedcode = '';
      this.playingInstreamAd = false;
      this.guid = undefined;
      this.accountId = undefined;
      this.accountIdSet = false;
      this.guidSet = false;
      this.parameters = undefined;
      this.documentUrl = undefined;

      // Note: we load the external JS analytics after the SAS response comes back, so we can propagate the
      // accountId parameter into Reporter if there is one. However, we also need to listen for error events,
      // in case the SAS Authorization fails. If that happens, we also load external JS analytics and
      // instantiate Reporter without an accountId. In either case, we unsubscribe from future authorization
      // fetched or error events.
      // TODO(playback-team): are you guys sure there's no race with SAS authorization request here?
      messageBus.subscribe(OO.EVENTS.AUTHORIZATION_FETCHED, OOYALA_ANALYTICS,
        _.bind(this._onAuthorizationFetched, this));
      messageBus.subscribe(OO.EVENTS.ERROR, OOYALA_ANALYTICS, _.bind(this._onErrorEvent, this));
      messageBus.subscribe(OO.EVENTS.GUID_SET, OOYALA_ANALYTICS, _.bind(this._onGuidSet, this));
      messageBus.subscribe(OO.EVENTS.REPORT_DISCOVERY_IMPRESSION, OOYALA_ANALYTICS,
        _.bind(this._onReportDiscoveryImpression, this));
      messageBus.subscribe(OO.EVENTS.REPORT_DISCOVERY_CLICK, OOYALA_ANALYTICS,
        _.bind(this._onReportDiscoveryClick, this));
      messageBus.subscribe(OO.EVENTS.PLAYER_CREATED, OOYALA_ANALYTICS,
        _.bind(this._onPlayerCreated, this));
    });

    _.extend(OoyalaAnalytics.prototype, {
      _onGuidSet: function(event, guid) {
        this.guid = guid;
        this.guidSet = true;
        this._onGuidAndAccountIdSet();
      },

      _onPlayerCreated: function(event, elementId, params) {
        this.parameters = params;
        if (this.parameters && this.parameters.docUrl) {
          this.documentUrl = this.parameters.docUrl;
        } else if (this.parameters && this.parameters["flashParams"] && this.parameters["flashParams"]["docUrl"]) {
          this.documentUrl = this.parameters["flashParams"]["docUrl"];
        }
      },

      _onAuthorizationFetched: function(event, tree) {
        if (tree.user_info && tree.user_info.account_id) {
          this.accountId = tree.user_info.account_id;
        } else if (tree.debug_data && tree.debug_data.user_info && tree.debug_data.user_info.account_id) {
          this.accountId = tree.debug_data.user_info.account_id;
        }
        this.mb.unsubscribe(OO.EVENTS.ERROR, OOYALA_ANALYTICS);
        this.mb.unsubscribe(OO.EVENTS.AUTHORIZATION_FETCHED, OOYALA_ANALYTICS);
        if (_.isNumber(this.accountId)) {
          // Convert numeric id to a string, since reporter.js does a strict type check for strings
          this.accountId = this.accountId.toString();
        }
        if (!_.isString(this.accountId)) {
          this.accountId = undefined;
          OO.d("OO.OoyalaAnalytics: SAS authorization fetched without an accountId");
        } else {
          OO.d("OO.OoyalaAnalytics: SAS authorization fetched with accountId == " + this.accountId);
        }
        this.accountIdSet = true;
        this._onGuidAndAccountIdSet();
      },

      _onGuidAndAccountIdSet: function() {
        if (!this.guidSet || !this.accountIdSet) { return; }
        OO.d("Loading Analtics Module...");
        this.loadExternalAnalyticsJs(OO.URLS.ANALYTICS({ server: OO.SERVER.ANALYTICS }));
      },

      _onErrorEvent: function(event, params) {
        if (!params || !params["code"]) { return; }
        var code = params["code"];
        var isAuthError = false;
        // Check if it's a SAS API error. If yes, call _onAuthorizationError, otherwise ignore.
        _.each(OO.ERROR.API.SAS, function(value, key) {
          if (value === code) { isAuthError = true; }
        });
        if (isAuthError) { this._onAuthorizationError(event, code); }
      },

      _onAuthorizationError: function(event, errorCode) {
        this.mb.unsubscribe(OO.EVENTS.ERROR, OOYALA_ANALYTICS);
        this.mb.unsubscribe(OO.EVENTS.AUTHORIZATION_FETCHED, OOYALA_ANALYTICS);
        OO.d("OO.OoyalaAnalytics: SAS authorization failed, loading external analytics module ...");
        this.loadExternalAnalyticsJs(OO.URLS.ANALYTICS({ server: OO.SERVER.ANALYTICS }));
      },

      _onReportDiscoveryImpression: function(event, params) {
        if (!this.reporter) { return; }
        try {
          this.reporter.reportDiscoveryImpression(params.relatedVideos, params.custom);
        } catch (e) {
          OO.log("Failed to report a discovery impression event with params " + JSON.stringify(params) +
            ": " + e);
        }
      },

      _onReportDiscoveryClick: function(event, params) {
        if (!this.reporter) { return; }
        try {
          this.reporter.reportDiscoveryClick(params.clickedVideo, params.custom);
        } catch (e) {
          OO.log("Failed to report a discovery click event with params " + JSON.stringify(params) +
            ": " + e);
        }
      },

      loadSucceed: function() {
        //todo this should not be possible
        if (!window.Ooyala || !window.Ooyala.Reporter) { return; }
        OoyalaAnalytics.Reporter = Ooyala.Reporter;
        OoyalaAnalytics.Pinger = Ooyala.Pinger;
        //this.guid = OoyalaAnalytics.Pinger.getOrCreateGuid();
        //this.mb.publish(OO.EVENTS.GUID_SET, this.guid);
        this.reporter = null;
        // TODO: if pcode is not set, we may have an error.
        if (!OO.playerParams.pcode) { return; }
        var analyticsParams = {
          accountId: this.accountId,
          guid: this.guid,
          playerBrandingId: OO.playerParams.playerBrandingId,
        };
        if (this.documentUrl) {
          analyticsParams = _.extend(analyticsParams, {documentUrl: this.documentUrl});
        }
        this.reporter = new OoyalaAnalytics.Reporter(OO.playerParams.pcode, analyticsParams);
      },

      reportEvent: function(eventName, arg1, arg2) {
        if (!this.reporter) { return; } // TODO report error here. should never happend
        switch (eventName) {
          case OO.EVENTS.PLAYER_CREATED :
            this.reporter.reportPlayerLoad();
            break;
          case OO.EVENTS.EMBED_CODE_CHANGED :
            // TODO: get the right duration for the video.
            // When setEmbedCode is called on the same asset it is NOT treated as a replay
            if (arg1 != this.currentEmbedcode) {
              this.lastEmbedCode = this.currentEmbedcode;
            } else {
              this.lastEmbedCode = '';
            }
            this.currentEmbedcode = arg1;
            break;
          case OO.EVENTS.CONTENT_TREE_FETCHED :
            // TODO: get the right duration for the video.
            this.reporter.initializeVideo(this.currentEmbedcode, arg1.duration);
            break;
          case OO.EVENTS.WILL_PLAY_FROM_BEGINNING:
            if (this.lastEmbedCode === this.currentEmbedcode) {
              this.reporter.reportReplay();
            } else {
              this.reporter.reportVideoStarted();
              this.lastEmbedCode = this.currentEmbedcode;
            }
            break;
          // TODO: reportAdRequest, reportAdClickToSite, reportAdPlayFailure
          // TODO: Add ad metadata
          case OO.EVENTS.WILL_PLAY_ADS :
            this.playingInstreamAd = true;
            var adSource = Ooyala.Reporter.AdSource.UNKNOWN;
            if (arg1 && arg1.type && typeof(arg1.type) == "string") {
              adSource = Ooyala.Reporter.AdSource[arg1.type.toUpperCase()];
            }
            this.reporter.setAdSource(adSource, this.currentEmbedcode, arg1 && arg1.click_url);
            this.reporter.reportAdImpression();
            break;
          case OO.EVENTS.ADS_PLAYED :
            this.playingInstreamAd = false;
            // TODO, report ads end.
            break;
          case OO.EVENTS.ADS_CLICKED :
            this.reporter.reportAdClickToVideo();
            break;
          case OO.EVENTS.PLAYHEAD_TIME_CHANGED:
            if (this.playingInstreamAd) {
              this.reporter.reportAdPlaythrough(arg1, arg2);
            } else {
              if (arg1 > 0) {
                this.reporter.reportPlayheadUpdate(Math.floor(arg1 * 1000));
              }
            }
            break;
          case OO.EVENTS.REPORT_EXPERIMENT_VARIATIONS:
            this.reporter.reportExperimentVariation(arg1.variationIds);
            break;
          case OO.EVENTS.INITIAL_PLAY:
            this.reporter.reportPlayRequested();
            break;
        }

      },

      __place_holder: true
    });

    OO.registerModule(OOYALA_ANALYTICS, function(messageBus, id) {
      return new OoyalaAnalytics(messageBus, id);
    });

  }(OO, OO.$, OO._));

/*
 * Librato Plugin
 *
 * owner: PBS
 * version: 0.1
 *
 * The Librato plugin utilizes the librato.com API to handle instrumentation
 * of various events within the player. Note: The allowed use of this plugin is only
 * under the condition that this plugin does not send/store any user information along with
 * each request.
 */
OO.plugin("Librato", function(OO, _, $, W) {
  // Throttling for now...logic by @gregm ;)
  var THROTTLE = Math.floor(Math.random() * 10);
  // Return an empty function or die
  if (THROTTLE > 0) { return (function(){}); }

  var RANGE_ABOVE_THRESHOLD_TEXT = "-above-range";
  var RANGE_BELOW_THRESHOLD_TEXT = "-below-range";
  var RANGE_WITHIN_THRESHOLD_TEXT = "-within-range";

  /**
   * The threshold configuration for each timed event
   * @private
   */
  var LibratoConfig = {
    "events": [
      {
        "name": "v4-load-time",
        "low": 500,
        "high": 2000
      },
      {
        "name": "v4-playback-ready",
        "low": 1000,
        "high": 3000
      },
      {
        "name": "v4-time-to-first-content-frame",
        "low": 1000,
        "high": 5000
      },
      {
        "name": "v4-time-to-first-ad-frame",
        "low": 1000,
        "high": 5000
      }
    ]
  };

  /**
   * @class LibratoHelper
   * @classdesc Helper class for Librato plugin; contains various helper methods like "reportSingleMetric", etc.
   * @public
   */
  var LibratoHelper = function() {
    // calculate authorization header
    this.basic_auth_token = "abelrios@ooyala.com" + ":" + "95d53e8841835839469f2a2f96fd95b564342ffadff759ad9d49f1897805db1b";
    if (window.btoa) {
      this.basic_auth_token = btoa(this.basic_auth_token);
    } else {
      this.basic_auth_token = window.base64.encode(this.basic_auth_token);
    }
    // figure out the source string
    this.source = this._generateSourceString();
  };

  _.extend(LibratoHelper.prototype, {

    /**
     * Measures the millisecond difference from 2 millisecond values
     * @method _measureDurationMilli
     * @param {number} startTs Starting millisecond value
     * @param {number} endTs Ending millisecond value
     * @return {number} The difference of endTs and startTs milliseconds
     */
    _measureDurationMilli: function(startTs, endTs) {
      return endTs - startTs;
    },

    /**
     * Creates a metric value object that is properly formatted for Librato
     * @method _addMetricValue
     * @param {object}  metrics The metrics value object
     * @param {string} name The metric name to track
     * @param {number} value The metric value (some sort of measurement)
     * @return {object} The modified metrics object
     */
    _addMetricValue: function(metrics, name, value) {
      metrics[name] = { "value" : value, "source" : this.source };
      return metrics;
    },

    /**
     * Creates and sends a single metric value to Librato API
     * @method _reportSingleMetric
     * @param {string} name The metric name
     * @param {number} value The metric value (some sorf of measurement)
     */
    _reportSingleMetric: function(name, value) {
      var metrics = {};
      this._addMetricValue(metrics, name, value);
      this._sendReport(metrics);
    },

    /**
     * AJAX request to send metric call to Librato API
     * @method _sendReport
     * @param {metrics} The metrics object
     */
    _sendReport: function(metrics) {
      // send the ping
      $.ajax({
        url: "https://metrics-api.librato.com/v1/metrics",
        type: "post",
        data: { gauges: metrics },
        dataType: "json",
        headers: { "Authorization": "Basic " + this.basic_auth_token },
        success: function (data) {
        }
      });
    },

    /**
     * Evaluates where a counting measurement falls within a defined threshold
     * @method _getThresholdText
     * @param {number} value The metric value
     * @param {object} item The configuration item that contains the threshold data
     * @return {string} The the threshold value result
     */
    _getThresholdText: function(value, item) {
      var text = RANGE_WITHIN_THRESHOLD_TEXT;
      if (value > item.high) {
        text = RANGE_ABOVE_THRESHOLD_TEXT;
      } else if (value < item.low) {
        text = RANGE_BELOW_THRESHOLD_TEXT;
      }

      return item.name + text;
    },

    /**
     * Matches a given event name with a name in configuration
     * @method _matchEvent
     * @param {string} name The event name to use as a key
     * @return {object} The matched configuration object
     */
    _matchEvent: function(name) {
      var match;
      _.each(LibratoConfig.events, function(item, idx) {
          if(item.name === name) {
            match = item;
          }
      });
      return match;
    },

    /**
     * Generates the source string to use in each metric call
     * @method _generateSourceString
     * @return {string} The properly formatted source string
     */
    _generateSourceString: function() {
      var source_data = {};
      var source_template = _.template("<%= platform %>-<%= os %>-<%= browser %>");

      // platform
      if (OO.featureEnabled("flash-playback")) {
        source_data.platform = "flash";
      } else {
        source_data.platform = "html5";
      }

      // OS
      if (OO.isIos) {
        source_data.os = "ios";
      } else if (OO.isAndroid) {
        source_data.os = "android";
      } else if (OO.isMacOs) {
        source_data.os = "macosx";
      } else if (OO.isWinPhone) {
        source_data.os = "winphone";
      } else if (OO.isWindows) {
        source_data.os = "windows";
      } else {
        source_data.os = "generic";
      }

      // browser
      if (OO.isChrome) {
        source_data.browser = "chrome";
      } else if (OO.isFirefox) {
        source_data.browser = "firefox";
      } else if (OO.isIE11Plus) {
        source_data.browser = "ie11plus";
      } else if (OO.isIE) {
        source_data.browser = "ieold";
      } else if (OO.isSafari) {
        source_data.browser = "safari";
      } else {
        source_data.browser = "generic";
      }
      return source_template(source_data);
    },

    /**
     * Plugin Initializer
     * @method start
     */
    start: function() {
      var metrics = {};
      this._addMetricValue(metrics, "v4-load", 1);

      // measure v4 load performance data
      if (!!window.performance && !!window.performance.getEntries) {
        // Get data about core.js
        var regex = ".*v4.*core";
        var v4_performance = _.find(window.performance.getEntriesByType("resource"), function(e) { return e.name.match(regex); } );

        // timing data found
        if (!!v4_performance) {
          if (v4_performance.duration > 0) {
            // We have the load time, so let's log that
            this._addMetricValue(metrics, this._getThresholdText(v4_performance.duration, this._matchEvent("v4-load-time")), 1);
          }
        }
      }

      this._sendReport(metrics);
    }

  });

  // We must defer measuring player load times until after this script is processed
  // Since when this code is executed initially, it's part of the loading sequence
  var libratoHelper = new LibratoHelper();
  _.defer(_.bind(libratoHelper.start, libratoHelper));


  // ------------------------------- Instance Functions ----------------------

  var Librato = function(messageBus, id) {
    this.id = id;
    this.mb = messageBus;
    this.initializationTs = this._takeTimestamp();

    // track important events
    this.mb.subscribe(OO.EVENTS.SET_EMBED_CODE, 'librato', _.bind(this._onSetEmbedCode, this));
    this.mb.subscribe(OO.EVENTS.PLAYBACK_READY, 'librato', _.bind(this._onPlaybackReady, this));
    this.mb.subscribe(OO.EVENTS.INITIAL_PLAY, 'librato', _.bind(this._onInitialPlay, this));
    this.mb.subscribe(OO.EVENTS.PLAY, 'librato', _.bind(this._onInitialPlay, this));
    this.mb.subscribe(OO.EVENTS.PLAYING, 'librato', _.bind(this._onInitialPlay, this));
    this.mb.subscribe(OO.EVENTS.ADS_PLAYED, 'librato', _.bind(this._onAdsPlayed, this));
    this.mb.subscribe(OO.EVENTS.PLAYHEAD_TIME_CHANGED, 'librato', _.bind(this._onPlayheadTimeChanged, this));
    this.mb.subscribe(OO.EVENTS.PLAY_FAILED, 'librato', _.bind(this._onPlayerPlayFailure, this));
    this.mb.subscribe(OO.EVENTS.ERROR, 'librato', _.bind(this._onPlayerError, this));
    this.mb.subscribe(OO.EVENTS.WILL_PLAY_ADS, 'librato', _.bind(this._willPlayAds, this));
  };

  _.extend(Librato.prototype, {
    /**
     * Creates a timestamp
     * @method _takeTimestamp
     * @return {object} A date object
     */
    _takeTimestamp: function() {
      return new Date().getTime();
    },

    /**
     * Set Embed Code Event Handler
     * @method _onSetEmbedCode
     */
    _onSetEmbedCode: function() {
      this.setEmbedCodeTs = this._takeTimestamp();
      this.wasPlayStartReported = false;
      this.wasTimeToFirstFrameReported = false;
      this.wasTimeToFirstAdFrameReported = false;
      this.adsPlaying = false;
    },

    /**
     * Playback Ready Event Handler
     * @method _onPlaybackReady
     */
    _onPlaybackReady: function() {
      libratoHelper._reportSingleMetric("v4-playback-ready", 1);
      this.playbackReadyTs = this._takeTimestamp();
      var diff = libratoHelper._measureDurationMilli(this.setEmbedCodeTs, this.playbackReadyTs);
      libratoHelper._reportSingleMetric(libratoHelper._getThresholdText(diff, libratoHelper._matchEvent("v4-playback-ready")), 1);
    },

    /**
     * Initial Play Event Handler
     * @method _onInitialPlay
     */
    _onInitialPlay: function() {
      if (this.wasPlayStartReported) { return; }

      this.lastStateChangeTs = this._takeTimestamp();
      this.wasPlayStartReported = true;
      libratoHelper._reportSingleMetric("v4-play", 1);
    },

    /**
     * Will Play Ads Event Handler
     * @method _willPlayAds
     */
    _willPlayAds: function() {
      this.lastStateChangeTs = this._takeTimestamp(); // reset the state timestamp
      this.adsPlaying = true;
      libratoHelper._reportSingleMetric("v4-play-ad", 1);
    },

    /**
     * Ads Played Event Handler
     * @method _onAdsPlayed
     */
    _onAdsPlayed: function() {
      this.lastStateChangeTs = this._takeTimestamp(); // reset the state timestamp
      this.adsPlaying = false;
    },

    /**
     * Playhead Time Changed Event Handler
     * @method _onPlayheadTimeChanged
     */
    _onPlayheadTimeChanged: function(name, playhead) {
      if (this.wasTimeToFirstFrameReported && this.wasTimeToFirstAdFrameReported) { return; }
      if (!playhead || playhead <= 0) { return; }

      // first frame appeared playhead seconds ago...
      this.firstFrameTs = this._takeTimestamp(); // TODO do we need to account for already played frames?
      var diff = libratoHelper._measureDurationMilli(this.lastStateChangeTs, this.firstFrameTs);

      if (!this.wasTimeToFirstFrameReported && !this.adsPlaying) {
        libratoHelper._reportSingleMetric(libratoHelper._getThresholdText(diff, libratoHelper._matchEvent("v4-time-to-first-content-frame")), 1);
        this.wasTimeToFirstFrameReported = true;
      }

      if (this.adsPlaying && !this.wasTimeToFirstAdFrameReported) {
        libratoHelper._reportSingleMetric(libratoHelper._getThresholdText(diff, libratoHelper._matchEvent("v4-time-to-first-ad-frame")), 1);
        this.wasTimeToFirstAdFrameReported = true;
      }
    },

    /**
     * Player Play Failure Event Handler
     * @method _onPlayerPlayFailure
     */
    _onPlayerPlayFailure: function() {
      libratoHelper._reportSingleMetric("v4-play-fail", 1);
    },

    /**
     * Player Error Event Handler
     * @method _onPlayerError
     */
    _onPlayerError: function(type, error) {
      this.errorTs = this._takeTimestamp();
      // We essentially want to handle errors on a case by case basis to determine
      // which errors have more weight
      libratoHelper._reportSingleMetric("v4-error", 1);
    }

  });

  return Librato;
});

(function(OO, $, _){
	/*
	 == mresize jQuery plugin (event based element resize fn) ==
	 Version: 1.0.1
	 Plugin URI: http://manos.malihu.gr/event-based-jquery-element-resize/
	 Author: malihu
	 Author URI: http://manos.malihu.gr
	 License: MIT License (MIT)
	 */

	/*
	 Copyright 2014 Manos Malihutsakis (email: manos@malihu.gr)

	 Permission is hereby granted, free of charge, to any person obtaining a copy
	 of this software and associated documentation files (the "Software"), to deal
	 in the Software without restriction, including without limitation the rights
	 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	 copies of the Software, and to permit persons to whom the Software is
	 furnished to do so, subject to the following conditions:

	 The above copyright notice and this permission notice shall be included in
	 all copies or substantial portions of the Software.

	 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	 THE SOFTWARE.
	 */
	$.event.special.mresize={
		add:function(){
			var el=$(this);
			if(el.data("mresize")) return;
			if(el.css("position")==="static") el.css("position","relative");
			el
				.append("<div class='resize' style='position:absolute; width:auto; height:auto; top:0; right:0; bottom:0; left:0; margin:0; padding:0; overflow:hidden; visibility:hidden; z-index:-1'><iframe style='width:100%; height:0; border:0; visibility:visible; margin:0' /><iframe style='width:0; height:100%; border:0; visibility:visible; margin:0' /></div>")
				.data("mresize",{"w":el.width(),"h":el.height(),t:null,throttle:100})
				.find(".resize iframe").each(function(){
					$(this.contentWindow || this).on("resize",function(){
						var d=el.data("mresize");
						if(d.w!==el.width() || d.h!==el.height()){
							if(d.t) clearTimeout(d.t);
							d.t=setTimeout(function(){
								el.triggerHandler("mresize");
								d.w=el.width();
								d.h=el.height();
							},d.throttle);
						}
					});
				});
		},
		remove:function(){
			$(this).removeData("mresize").find(".resize").remove();
		}
	};
}(OO, OO.$, OO._));
  OO.exposeStaticApi('EVENTS', OO.EVENTS);
  OO.exposeStaticApi('CONSTANTS', OO.CONSTANTS);
  OO.publicApi.log = OO.log;
  OO.exposeStaticApi('ERROR', OO.ERROR);
  OO.exposeStaticApi('STATE', OO.STATE);
  OO.exposeStaticApi('VERSION', OO.VERSION);
  OO.exposeStaticApi('VIDEO', OO.VIDEO);
  OO.publicApi.$ = OO.$;
  OO.publicApi._ = OO._;

  OO.publicApi.__static.apiReady = true;
  OO.$(document).ready(function() {
    OO.publicApi.__static.docReady = true;
    OO.tryCallReady();
  });
}());

} catch (err) {
  if (err && window.console && window.console.log) { window.console.log(err, err.stack); }
}
