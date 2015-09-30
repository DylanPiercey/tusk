(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && !isFinite(value)) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b)) {
    return a === b;
  }
  var aIsArgs = isArguments(a),
      bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  var ka = objectKeys(a),
      kb = objectKeys(b),
      key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":6}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],4:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],5:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],6:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":5,"_process":4,"inherits":3}],7:[function(require,module,exports){
'use strict';
var Structure = require('./src/structure');

/**
 * Creates a new instance of Immstruct, having it's own list
 * of Structure instances.
 *
 * ### Examples:
 * ```js
 * var ImmstructInstance = require('immstruct').Immstruct;
 * var immstruct = new ImmstructInstance();
 * var structure = immstruct.get({ data: });
 * ```
 *
 * @property {Array} instances Array of `Structure` instances.
 *
 * @class {Immstruct}
 * @constructor
 * @returns {Immstruct}
 * @api public
 */
function Immstruct () {
  if (!(this instanceof Immstruct)) {
    return new Immstruct();
  }

  this._instances = {};
}

/**
 *
 * Gets or creates a new instance of {Structure}. Provide optional
 * key to be able to retrieve it from list of instances. If no key
 * is provided, a random key will be generated.
 *
 * ### Examples:
 * ```js
 * var immstruct = require('immstruct');
 * var structure = immstruct.get('myStruct', { foo: 'Hello' });
 * ```
 * @param {String} [key] - defaults to random string
 * @param {Object|Immutable} [data] - defaults to empty data
 *
 * @returns {Structure}
 * @module immstruct.get
 * @api public
 */
Immstruct.prototype.get = function (key, data) {
  return getInstance(this, {
    key: key,
    data: data
  });
};

/**
 *
 * Get list of all instances created.
 *
 * @param {String} [name] - Name of the instance to get. If undefined get all instances
 *
 * @returns {Array}
 * @module immstruct.getInstances
 * @api public
 */
Immstruct.prototype.instance = function (name) {
  if (name) return this._instances[name];
  return this._instances;
};

/**
 * Clear the entire list of `Structure` instances from the Immstruct
 * instance. You would do this to start from scratch, freeing up memory.
 *
 * ### Examples:
 * ```js
 * var immstruct = require('immstruct');
 * immstruct.clear();
 * ```
 * @module immstruct.clear
 * @api public
 */
Immstruct.prototype.clear = function () {
  this._instances = {};
};

/**
 * Remove one `Structure` instance from the Immstruct instances list.
 * Provided by key
 *
 * ### Examples:
 * ```js
 * var immstruct = require('immstruct');
 * immstruct('myKey', { foo: 'hello' });
 * immstruct.remove('myKey');
 * ```
 * @param {String} key
 *
 * @module immstruct.remove
 * @api public
 * @returns {Boolean}
 */
Immstruct.prototype.remove = function (key) {
  return delete this._instances[key];
};


/**
 * Gets or creates a new instance of `Structure` with history (undo/redo)
 * activated per default. Same usage and signature as regular `Immstruct.get`.

 * Provide optional key to be able to retrieve it from list of instances.
 * If no key is provided, a random key will be generated.
 *
 * Provide optional limit to cap the last number of history references
 * that will be kept. Once limit is reached, a new history record
 * shifts off the oldest record. The default if omitted is Infinity.
 * Setting to 0 is the as not having history enabled in the first place.
 *
 * ### Examples:
 * ```js
 * var immstruct = require('immstruct');
 * var structure = immstruct.withHistory('myStruct', 10, { foo: 'Hello' });
 * var structure = immstruct.withHistory(10, { foo: 'Hello' });
 * var structure = immstruct.withHistory('myStruct', { foo: 'Hello' });
 * var structure = immstruct.withHistory({ foo: 'Hello' });
 * ```
 *
 * @param {String} [key] - defaults to random string
 * @param {Number} [limit] - defaults to Infinity
 * @param {Object|Immutable} [data] - defaults to empty data
 *
 * @module immstruct.withHistory
 * @api public
 * @returns {Structure}
 */
Immstruct.prototype.withHistory = function (key, limit, data) {
  return getInstance(this, {
    key: key,
    data: data,
    history: true,
    historyLimit: limit
  });
};

var inst = new Immstruct();

/**
 * This is a default instance of `Immstruct` as well as a shortcut for
 * creating `Structure` instances (See `Immstruct.get` and `Immstruct`).
 * This is what is returned from `require('immstruct')`.
 *
 * From `Immstruct.get`:
 * Gets or creates a new instance of {Structure} in the default Immstruct
 * instance. A link to `immstruct.get()`. Provide optional
 * key to be able to retrieve it from list of instances. If no key
 * is provided, a random key will be generated.
 *
 * ### Examples:
 * ```js
 * var immstruct = require('immstruct');
 * var structure = immstruct('myStruct', { foo: 'Hello' });
 * var structure2 = immstruct.withHistory({ bar: 'Bye' });
 * immstruct.remove('myStruct');
 * // ...
 * ```
 *
 * @param {String} [key] - defaults to random string
 * @param {Object|Immutable} [data] - defaults to empty data
 *
 * @api public
 * @see {@link Immstruct}
 * @see {Immstruct.prototype.get}
 * @module immstruct
 * @class {Immstruct}
 * @returns {Structure|Function}
 */
module.exports = function (key, data) {
  return getInstance(inst, {
    key: key,
    data: data
  });
};

module.exports.withHistory = function (key, limit, data) {
  return getInstance(inst, {
    key: key,
    data: data,
    history: true,
    historyLimit: limit
  });
};

module.exports.Structure = Structure;
module.exports.Immstruct = Immstruct;
module.exports.clear     = inst.clear.bind(inst);
module.exports.remove    = inst.remove.bind(inst);
module.exports.get       = inst.get.bind(inst);
module.exports.instance = function (name) {
  if (name) return inst._instances[name];
  return inst._instances;
};

function getInstance (obj, options) {
  if (typeof options.key === 'object') {
    options.data = options.key;
    options.key = void 0;
  } else if (typeof options.key === 'number') {
    options.data = options.historyLimit;
    options.historyLimit = options.key;
    options.key = void 0;
  } else if (typeof options.historyLimit === 'object') {
    options.data = options.historyLimit;
    options.historyLimit = void 0;
  }

  if (options.key && obj._instances[options.key]) {
    return obj._instances[options.key];
  }

  var newInstance = new Structure(options);
  obj._instances[newInstance.key] = newInstance;
  return newInstance;
}

},{"./src/structure":11}],8:[function(require,module,exports){
'use strict';

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} once Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Holds the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Functon} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} context The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],9:[function(require,module,exports){
/**
 *  Copyright (c) 2014-2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

/**
 * Cursor is expected to be required in a node or other CommonJS context:
 *
 *     var Cursor = require('immutable/contrib/cursor');
 *
 * If you wish to use it in the browser, please check out Browserify or WebPack!
 */

var Immutable = require('immutable');
var Iterable = Immutable.Iterable;
var Iterator = Iterable.Iterator;
var Seq = Immutable.Seq;
var Map = Immutable.Map;
var Record = Immutable.Record;


function cursorFrom(rootData, keyPath, onChange) {
  if (arguments.length === 1) {
    keyPath = [];
  } else if (typeof keyPath === 'function') {
    onChange = keyPath;
    keyPath = [];
  } else {
    keyPath = valToKeyPath(keyPath);
  }
  return makeCursor(rootData, keyPath, onChange);
}


var KeyedCursorPrototype = Object.create(Seq.Keyed.prototype);
var IndexedCursorPrototype = Object.create(Seq.Indexed.prototype);

function KeyedCursor(rootData, keyPath, onChange, size) {
  this.size = size;
  this._rootData = rootData;
  this._keyPath = keyPath;
  this._onChange = onChange;
}
KeyedCursorPrototype.constructor = KeyedCursor;

function IndexedCursor(rootData, keyPath, onChange, size) {
  this.size = size;
  this._rootData = rootData;
  this._keyPath = keyPath;
  this._onChange = onChange;
}
IndexedCursorPrototype.constructor = IndexedCursor;

KeyedCursorPrototype.toString = function() {
  return this.__toString('Cursor {', '}');
}
IndexedCursorPrototype.toString = function() {
  return this.__toString('Cursor [', ']');
}

KeyedCursorPrototype.deref =
KeyedCursorPrototype.valueOf =
IndexedCursorPrototype.deref =
IndexedCursorPrototype.valueOf = function(notSetValue) {
  return this._rootData.getIn(this._keyPath, notSetValue);
}

KeyedCursorPrototype.get =
IndexedCursorPrototype.get = function(key, notSetValue) {
  return this.getIn([key], notSetValue);
}

KeyedCursorPrototype.getIn =
IndexedCursorPrototype.getIn = function(keyPath, notSetValue) {
  keyPath = listToKeyPath(keyPath);
  if (keyPath.length === 0) {
    return this;
  }
  var value = this._rootData.getIn(newKeyPath(this._keyPath, keyPath), NOT_SET);
  return value === NOT_SET ? notSetValue : wrappedValue(this, keyPath, value);
}

IndexedCursorPrototype.set =
KeyedCursorPrototype.set = function(key, value) {
  if(arguments.length === 1) {
    return updateCursor(this, function() { return key; }, []);
  } else {
    return updateCursor(this, function (m) { return m.set(key, value); }, [key]);
  }
}

IndexedCursorPrototype.push = function(/* values */) {
  var args = arguments;
  return updateCursor(this, function (m) {
    return m.push.apply(m, args);
  });
}

IndexedCursorPrototype.pop = function() {
  return updateCursor(this, function (m) {
    return m.pop();
  });
}

IndexedCursorPrototype.unshift = function(/* values */) {
  var args = arguments;
  return updateCursor(this, function (m) {
    return m.unshift.apply(m, args);
  });
}

IndexedCursorPrototype.shift = function() {
  return updateCursor(this, function (m) {
    return m.shift();
  });
}

IndexedCursorPrototype.setIn =
KeyedCursorPrototype.setIn = Map.prototype.setIn;

KeyedCursorPrototype.remove =
KeyedCursorPrototype['delete'] =
IndexedCursorPrototype.remove =
IndexedCursorPrototype['delete'] = function(key) {
  return updateCursor(this, function (m) { return m.remove(key); }, [key]);
}

IndexedCursorPrototype.removeIn =
IndexedCursorPrototype.deleteIn =
KeyedCursorPrototype.removeIn =
KeyedCursorPrototype.deleteIn = Map.prototype.deleteIn;

KeyedCursorPrototype.clear =
IndexedCursorPrototype.clear = function() {
  return updateCursor(this, function (m) { return m.clear(); });
}

IndexedCursorPrototype.update =
KeyedCursorPrototype.update = function(keyOrFn, notSetValue, updater) {
  return arguments.length === 1 ?
    updateCursor(this, keyOrFn) :
    this.updateIn([keyOrFn], notSetValue, updater);
}

IndexedCursorPrototype.updateIn =
KeyedCursorPrototype.updateIn = function(keyPath, notSetValue, updater) {
  return updateCursor(this, function (m) {
    return m.updateIn(keyPath, notSetValue, updater);
  }, keyPath);
}

IndexedCursorPrototype.merge =
KeyedCursorPrototype.merge = function(/*...iters*/) {
  var args = arguments;
  return updateCursor(this, function (m) {
    return m.merge.apply(m, args);
  });
}

IndexedCursorPrototype.mergeWith =
KeyedCursorPrototype.mergeWith = function(merger/*, ...iters*/) {
  var args = arguments;
  return updateCursor(this, function (m) {
    return m.mergeWith.apply(m, args);
  });
}

IndexedCursorPrototype.mergeIn =
KeyedCursorPrototype.mergeIn = Map.prototype.mergeIn;

IndexedCursorPrototype.mergeDeep =
KeyedCursorPrototype.mergeDeep = function(/*...iters*/) {
  var args = arguments;
  return updateCursor(this, function (m) {
    return m.mergeDeep.apply(m, args);
  });
}

IndexedCursorPrototype.mergeDeepWith =
KeyedCursorPrototype.mergeDeepWith = function(merger/*, ...iters*/) {
  var args = arguments;
  return updateCursor(this, function (m) {
    return m.mergeDeepWith.apply(m, args);
  });
}

IndexedCursorPrototype.mergeDeepIn =
KeyedCursorPrototype.mergeDeepIn = Map.prototype.mergeDeepIn;

KeyedCursorPrototype.withMutations =
IndexedCursorPrototype.withMutations = function(fn) {
  return updateCursor(this, function (m) {
    return (m || Map()).withMutations(fn);
  });
}

KeyedCursorPrototype.cursor =
IndexedCursorPrototype.cursor = function(subKeyPath) {
  subKeyPath = valToKeyPath(subKeyPath);
  return subKeyPath.length === 0 ? this : subCursor(this, subKeyPath);
}

/**
 * All iterables need to implement __iterate
 */
KeyedCursorPrototype.__iterate =
IndexedCursorPrototype.__iterate = function(fn, reverse) {
  var cursor = this;
  var deref = cursor.deref();
  return deref && deref.__iterate ? deref.__iterate(
    function (v, k) { return fn(wrappedValue(cursor, [k], v), k, cursor); },
    reverse
  ) : 0;
}

/**
 * All iterables need to implement __iterator
 */
KeyedCursorPrototype.__iterator =
IndexedCursorPrototype.__iterator = function(type, reverse) {
  var deref = this.deref();
  var cursor = this;
  var iterator = deref && deref.__iterator &&
    deref.__iterator(Iterator.ENTRIES, reverse);
  return new Iterator(function () {
    if (!iterator) {
      return { value: undefined, done: true };
    }
    var step = iterator.next();
    if (step.done) {
      return step;
    }
    var entry = step.value;
    var k = entry[0];
    var v = wrappedValue(cursor, [k], entry[1]);
    return {
      value: type === Iterator.KEYS ? k : type === Iterator.VALUES ? v : [k, v],
      done: false
    };
  });
}

KeyedCursor.prototype = KeyedCursorPrototype;
IndexedCursor.prototype = IndexedCursorPrototype;


var NOT_SET = {}; // Sentinel value

function makeCursor(rootData, keyPath, onChange, value) {
  if (arguments.length < 4) {
    value = rootData.getIn(keyPath);
  }
  var size = value && value.size;
  var CursorClass = Iterable.isIndexed(value) ? IndexedCursor : KeyedCursor;
  var cursor = new CursorClass(rootData, keyPath, onChange, size);

  if (value instanceof Record) {
    defineRecordProperties(cursor, value);
  }

  return cursor;
}

function defineRecordProperties(cursor, value) {
  try {
    value._keys.forEach(setProp.bind(undefined, cursor));
  } catch (error) {
    // Object.defineProperty failed. Probably IE8.
  }
}

function setProp(prototype, name) {
  Object.defineProperty(prototype, name, {
    get: function() {
      return this.get(name);
    },
    set: function(value) {
      if (!this.__ownerID) {
        throw new Error('Cannot set on an immutable record.');
      }
    }
  });
}

function wrappedValue(cursor, keyPath, value) {
  return Iterable.isIterable(value) ? subCursor(cursor, keyPath, value) : value;
}

function subCursor(cursor, keyPath, value) {
  if (arguments.length < 3) {
    return makeCursor( // call without value
      cursor._rootData,
      newKeyPath(cursor._keyPath, keyPath),
      cursor._onChange
    );
  }
  return makeCursor(
    cursor._rootData,
    newKeyPath(cursor._keyPath, keyPath),
    cursor._onChange,
    value
  );
}

function updateCursor(cursor, changeFn, changeKeyPath) {
  var deepChange = arguments.length > 2;
  var newRootData = cursor._rootData.updateIn(
    cursor._keyPath,
    deepChange ? Map() : undefined,
    changeFn
  );
  var keyPath = cursor._keyPath || [];
  var result = cursor._onChange && cursor._onChange.call(
    undefined,
    newRootData,
    cursor._rootData,
    deepChange ? newKeyPath(keyPath, changeKeyPath) : keyPath
  );
  if (result !== undefined) {
    newRootData = result;
  }
  return makeCursor(newRootData, cursor._keyPath, cursor._onChange);
}

function newKeyPath(head, tail) {
  return head.concat(listToKeyPath(tail));
}

function listToKeyPath(list) {
  return Array.isArray(list) ? list : Immutable.Iterable(list).toArray();
}

function valToKeyPath(val) {
  return Array.isArray(val) ? val :
    Iterable.isIterable(val) ? val.toArray() :
    [val];
}

exports.from = cursorFrom;

},{"immutable":10}],10:[function(require,module,exports){
/**
 *  Copyright (c) 2014-2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  global.Immutable = factory()
}(this, function () { 'use strict';var SLICE$0 = Array.prototype.slice;

  function createClass(ctor, superClass) {
    if (superClass) {
      ctor.prototype = Object.create(superClass.prototype);
    }
    ctor.prototype.constructor = ctor;
  }

  // Used for setting prototype methods that IE8 chokes on.
  var DELETE = 'delete';

  // Constants describing the size of trie nodes.
  var SHIFT = 5; // Resulted in best performance after ______?
  var SIZE = 1 << SHIFT;
  var MASK = SIZE - 1;

  // A consistent shared value representing "not set" which equals nothing other
  // than itself, and nothing that could be provided externally.
  var NOT_SET = {};

  // Boolean references, Rough equivalent of `bool &`.
  var CHANGE_LENGTH = { value: false };
  var DID_ALTER = { value: false };

  function MakeRef(ref) {
    ref.value = false;
    return ref;
  }

  function SetRef(ref) {
    ref && (ref.value = true);
  }

  // A function which returns a value representing an "owner" for transient writes
  // to tries. The return value will only ever equal itself, and will not equal
  // the return of any subsequent call of this function.
  function OwnerID() {}

  // http://jsperf.com/copy-array-inline
  function arrCopy(arr, offset) {
    offset = offset || 0;
    var len = Math.max(0, arr.length - offset);
    var newArr = new Array(len);
    for (var ii = 0; ii < len; ii++) {
      newArr[ii] = arr[ii + offset];
    }
    return newArr;
  }

  function ensureSize(iter) {
    if (iter.size === undefined) {
      iter.size = iter.__iterate(returnTrue);
    }
    return iter.size;
  }

  function wrapIndex(iter, index) {
    // This implements "is array index" which the ECMAString spec defines as:
    //     A String property name P is an array index if and only if
    //     ToString(ToUint32(P)) is equal to P and ToUint32(P) is not equal
    //     to 2^32−1.
    // However note that we're currently calling ToNumber() instead of ToUint32()
    // which should be improved in the future, as floating point numbers should
    // not be accepted as an array index.
    if (typeof index !== 'number') {
      var numIndex = +index;
      if ('' + numIndex !== index) {
        return NaN;
      }
      index = numIndex;
    }
    return index < 0 ? ensureSize(iter) + index : index;
  }

  function returnTrue() {
    return true;
  }

  function wholeSlice(begin, end, size) {
    return (begin === 0 || (size !== undefined && begin <= -size)) &&
      (end === undefined || (size !== undefined && end >= size));
  }

  function resolveBegin(begin, size) {
    return resolveIndex(begin, size, 0);
  }

  function resolveEnd(end, size) {
    return resolveIndex(end, size, size);
  }

  function resolveIndex(index, size, defaultIndex) {
    return index === undefined ?
      defaultIndex :
      index < 0 ?
        Math.max(0, size + index) :
        size === undefined ?
          index :
          Math.min(size, index);
  }

  function Iterable(value) {
      return isIterable(value) ? value : Seq(value);
    }


  createClass(KeyedIterable, Iterable);
    function KeyedIterable(value) {
      return isKeyed(value) ? value : KeyedSeq(value);
    }


  createClass(IndexedIterable, Iterable);
    function IndexedIterable(value) {
      return isIndexed(value) ? value : IndexedSeq(value);
    }


  createClass(SetIterable, Iterable);
    function SetIterable(value) {
      return isIterable(value) && !isAssociative(value) ? value : SetSeq(value);
    }



  function isIterable(maybeIterable) {
    return !!(maybeIterable && maybeIterable[IS_ITERABLE_SENTINEL]);
  }

  function isKeyed(maybeKeyed) {
    return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL]);
  }

  function isIndexed(maybeIndexed) {
    return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL]);
  }

  function isAssociative(maybeAssociative) {
    return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
  }

  function isOrdered(maybeOrdered) {
    return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
  }

  Iterable.isIterable = isIterable;
  Iterable.isKeyed = isKeyed;
  Iterable.isIndexed = isIndexed;
  Iterable.isAssociative = isAssociative;
  Iterable.isOrdered = isOrdered;

  Iterable.Keyed = KeyedIterable;
  Iterable.Indexed = IndexedIterable;
  Iterable.Set = SetIterable;


  var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
  var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
  var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
  var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

  /* global Symbol */

  var ITERATE_KEYS = 0;
  var ITERATE_VALUES = 1;
  var ITERATE_ENTRIES = 2;

  var REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
  var FAUX_ITERATOR_SYMBOL = '@@iterator';

  var ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL;


  function src_Iterator__Iterator(next) {
      this.next = next;
    }

    src_Iterator__Iterator.prototype.toString = function() {
      return '[Iterator]';
    };


  src_Iterator__Iterator.KEYS = ITERATE_KEYS;
  src_Iterator__Iterator.VALUES = ITERATE_VALUES;
  src_Iterator__Iterator.ENTRIES = ITERATE_ENTRIES;

  src_Iterator__Iterator.prototype.inspect =
  src_Iterator__Iterator.prototype.toSource = function () { return this.toString(); }
  src_Iterator__Iterator.prototype[ITERATOR_SYMBOL] = function () {
    return this;
  };


  function iteratorValue(type, k, v, iteratorResult) {
    var value = type === 0 ? k : type === 1 ? v : [k, v];
    iteratorResult ? (iteratorResult.value = value) : (iteratorResult = {
      value: value, done: false
    });
    return iteratorResult;
  }

  function iteratorDone() {
    return { value: undefined, done: true };
  }

  function hasIterator(maybeIterable) {
    return !!getIteratorFn(maybeIterable);
  }

  function isIterator(maybeIterator) {
    return maybeIterator && typeof maybeIterator.next === 'function';
  }

  function getIterator(iterable) {
    var iteratorFn = getIteratorFn(iterable);
    return iteratorFn && iteratorFn.call(iterable);
  }

  function getIteratorFn(iterable) {
    var iteratorFn = iterable && (
      (REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL]) ||
      iterable[FAUX_ITERATOR_SYMBOL]
    );
    if (typeof iteratorFn === 'function') {
      return iteratorFn;
    }
  }

  function isArrayLike(value) {
    return value && typeof value.length === 'number';
  }

  createClass(Seq, Iterable);
    function Seq(value) {
      return value === null || value === undefined ? emptySequence() :
        isIterable(value) ? value.toSeq() : seqFromValue(value);
    }

    Seq.of = function(/*...values*/) {
      return Seq(arguments);
    };

    Seq.prototype.toSeq = function() {
      return this;
    };

    Seq.prototype.toString = function() {
      return this.__toString('Seq {', '}');
    };

    Seq.prototype.cacheResult = function() {
      if (!this._cache && this.__iterateUncached) {
        this._cache = this.entrySeq().toArray();
        this.size = this._cache.length;
      }
      return this;
    };

    // abstract __iterateUncached(fn, reverse)

    Seq.prototype.__iterate = function(fn, reverse) {
      return seqIterate(this, fn, reverse, true);
    };

    // abstract __iteratorUncached(type, reverse)

    Seq.prototype.__iterator = function(type, reverse) {
      return seqIterator(this, type, reverse, true);
    };



  createClass(KeyedSeq, Seq);
    function KeyedSeq(value) {
      return value === null || value === undefined ?
        emptySequence().toKeyedSeq() :
        isIterable(value) ?
          (isKeyed(value) ? value.toSeq() : value.fromEntrySeq()) :
          keyedSeqFromValue(value);
    }

    KeyedSeq.prototype.toKeyedSeq = function() {
      return this;
    };



  createClass(IndexedSeq, Seq);
    function IndexedSeq(value) {
      return value === null || value === undefined ? emptySequence() :
        !isIterable(value) ? indexedSeqFromValue(value) :
        isKeyed(value) ? value.entrySeq() : value.toIndexedSeq();
    }

    IndexedSeq.of = function(/*...values*/) {
      return IndexedSeq(arguments);
    };

    IndexedSeq.prototype.toIndexedSeq = function() {
      return this;
    };

    IndexedSeq.prototype.toString = function() {
      return this.__toString('Seq [', ']');
    };

    IndexedSeq.prototype.__iterate = function(fn, reverse) {
      return seqIterate(this, fn, reverse, false);
    };

    IndexedSeq.prototype.__iterator = function(type, reverse) {
      return seqIterator(this, type, reverse, false);
    };



  createClass(SetSeq, Seq);
    function SetSeq(value) {
      return (
        value === null || value === undefined ? emptySequence() :
        !isIterable(value) ? indexedSeqFromValue(value) :
        isKeyed(value) ? value.entrySeq() : value
      ).toSetSeq();
    }

    SetSeq.of = function(/*...values*/) {
      return SetSeq(arguments);
    };

    SetSeq.prototype.toSetSeq = function() {
      return this;
    };



  Seq.isSeq = isSeq;
  Seq.Keyed = KeyedSeq;
  Seq.Set = SetSeq;
  Seq.Indexed = IndexedSeq;

  var IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';

  Seq.prototype[IS_SEQ_SENTINEL] = true;



  // #pragma Root Sequences

  createClass(ArraySeq, IndexedSeq);
    function ArraySeq(array) {
      this._array = array;
      this.size = array.length;
    }

    ArraySeq.prototype.get = function(index, notSetValue) {
      return this.has(index) ? this._array[wrapIndex(this, index)] : notSetValue;
    };

    ArraySeq.prototype.__iterate = function(fn, reverse) {
      var array = this._array;
      var maxIndex = array.length - 1;
      for (var ii = 0; ii <= maxIndex; ii++) {
        if (fn(array[reverse ? maxIndex - ii : ii], ii, this) === false) {
          return ii + 1;
        }
      }
      return ii;
    };

    ArraySeq.prototype.__iterator = function(type, reverse) {
      var array = this._array;
      var maxIndex = array.length - 1;
      var ii = 0;
      return new src_Iterator__Iterator(function() 
        {return ii > maxIndex ?
          iteratorDone() :
          iteratorValue(type, ii, array[reverse ? maxIndex - ii++ : ii++])}
      );
    };



  createClass(ObjectSeq, KeyedSeq);
    function ObjectSeq(object) {
      var keys = Object.keys(object);
      this._object = object;
      this._keys = keys;
      this.size = keys.length;
    }

    ObjectSeq.prototype.get = function(key, notSetValue) {
      if (notSetValue !== undefined && !this.has(key)) {
        return notSetValue;
      }
      return this._object[key];
    };

    ObjectSeq.prototype.has = function(key) {
      return this._object.hasOwnProperty(key);
    };

    ObjectSeq.prototype.__iterate = function(fn, reverse) {
      var object = this._object;
      var keys = this._keys;
      var maxIndex = keys.length - 1;
      for (var ii = 0; ii <= maxIndex; ii++) {
        var key = keys[reverse ? maxIndex - ii : ii];
        if (fn(object[key], key, this) === false) {
          return ii + 1;
        }
      }
      return ii;
    };

    ObjectSeq.prototype.__iterator = function(type, reverse) {
      var object = this._object;
      var keys = this._keys;
      var maxIndex = keys.length - 1;
      var ii = 0;
      return new src_Iterator__Iterator(function()  {
        var key = keys[reverse ? maxIndex - ii : ii];
        return ii++ > maxIndex ?
          iteratorDone() :
          iteratorValue(type, key, object[key]);
      });
    };

  ObjectSeq.prototype[IS_ORDERED_SENTINEL] = true;


  createClass(IterableSeq, IndexedSeq);
    function IterableSeq(iterable) {
      this._iterable = iterable;
      this.size = iterable.length || iterable.size;
    }

    IterableSeq.prototype.__iterateUncached = function(fn, reverse) {
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var iterable = this._iterable;
      var iterator = getIterator(iterable);
      var iterations = 0;
      if (isIterator(iterator)) {
        var step;
        while (!(step = iterator.next()).done) {
          if (fn(step.value, iterations++, this) === false) {
            break;
          }
        }
      }
      return iterations;
    };

    IterableSeq.prototype.__iteratorUncached = function(type, reverse) {
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterable = this._iterable;
      var iterator = getIterator(iterable);
      if (!isIterator(iterator)) {
        return new src_Iterator__Iterator(iteratorDone);
      }
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        var step = iterator.next();
        return step.done ? step : iteratorValue(type, iterations++, step.value);
      });
    };



  createClass(IteratorSeq, IndexedSeq);
    function IteratorSeq(iterator) {
      this._iterator = iterator;
      this._iteratorCache = [];
    }

    IteratorSeq.prototype.__iterateUncached = function(fn, reverse) {
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var iterator = this._iterator;
      var cache = this._iteratorCache;
      var iterations = 0;
      while (iterations < cache.length) {
        if (fn(cache[iterations], iterations++, this) === false) {
          return iterations;
        }
      }
      var step;
      while (!(step = iterator.next()).done) {
        var val = step.value;
        cache[iterations] = val;
        if (fn(val, iterations++, this) === false) {
          break;
        }
      }
      return iterations;
    };

    IteratorSeq.prototype.__iteratorUncached = function(type, reverse) {
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterator = this._iterator;
      var cache = this._iteratorCache;
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        if (iterations >= cache.length) {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          cache[iterations] = step.value;
        }
        return iteratorValue(type, iterations, cache[iterations++]);
      });
    };




  // # pragma Helper functions

  function isSeq(maybeSeq) {
    return !!(maybeSeq && maybeSeq[IS_SEQ_SENTINEL]);
  }

  var EMPTY_SEQ;

  function emptySequence() {
    return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]));
  }

  function keyedSeqFromValue(value) {
    var seq =
      Array.isArray(value) ? new ArraySeq(value).fromEntrySeq() :
      isIterator(value) ? new IteratorSeq(value).fromEntrySeq() :
      hasIterator(value) ? new IterableSeq(value).fromEntrySeq() :
      typeof value === 'object' ? new ObjectSeq(value) :
      undefined;
    if (!seq) {
      throw new TypeError(
        'Expected Array or iterable object of [k, v] entries, '+
        'or keyed object: ' + value
      );
    }
    return seq;
  }

  function indexedSeqFromValue(value) {
    var seq = maybeIndexedSeqFromValue(value);
    if (!seq) {
      throw new TypeError(
        'Expected Array or iterable object of values: ' + value
      );
    }
    return seq;
  }

  function seqFromValue(value) {
    var seq = maybeIndexedSeqFromValue(value) ||
      (typeof value === 'object' && new ObjectSeq(value));
    if (!seq) {
      throw new TypeError(
        'Expected Array or iterable object of values, or keyed object: ' + value
      );
    }
    return seq;
  }

  function maybeIndexedSeqFromValue(value) {
    return (
      isArrayLike(value) ? new ArraySeq(value) :
      isIterator(value) ? new IteratorSeq(value) :
      hasIterator(value) ? new IterableSeq(value) :
      undefined
    );
  }

  function seqIterate(seq, fn, reverse, useKeys) {
    var cache = seq._cache;
    if (cache) {
      var maxIndex = cache.length - 1;
      for (var ii = 0; ii <= maxIndex; ii++) {
        var entry = cache[reverse ? maxIndex - ii : ii];
        if (fn(entry[1], useKeys ? entry[0] : ii, seq) === false) {
          return ii + 1;
        }
      }
      return ii;
    }
    return seq.__iterateUncached(fn, reverse);
  }

  function seqIterator(seq, type, reverse, useKeys) {
    var cache = seq._cache;
    if (cache) {
      var maxIndex = cache.length - 1;
      var ii = 0;
      return new src_Iterator__Iterator(function()  {
        var entry = cache[reverse ? maxIndex - ii : ii];
        return ii++ > maxIndex ?
          iteratorDone() :
          iteratorValue(type, useKeys ? entry[0] : ii - 1, entry[1]);
      });
    }
    return seq.__iteratorUncached(type, reverse);
  }

  createClass(Collection, Iterable);
    function Collection() {
      throw TypeError('Abstract');
    }


  createClass(KeyedCollection, Collection);function KeyedCollection() {}

  createClass(IndexedCollection, Collection);function IndexedCollection() {}

  createClass(SetCollection, Collection);function SetCollection() {}


  Collection.Keyed = KeyedCollection;
  Collection.Indexed = IndexedCollection;
  Collection.Set = SetCollection;

  /**
   * An extension of the "same-value" algorithm as [described for use by ES6 Map
   * and Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)
   *
   * NaN is considered the same as NaN, however -0 and 0 are considered the same
   * value, which is different from the algorithm described by
   * [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
   *
   * This is extended further to allow Objects to describe the values they
   * represent, by way of `valueOf` or `equals` (and `hashCode`).
   *
   * Note: because of this extension, the key equality of Immutable.Map and the
   * value equality of Immutable.Set will differ from ES6 Map and Set.
   *
   * ### Defining custom values
   *
   * The easiest way to describe the value an object represents is by implementing
   * `valueOf`. For example, `Date` represents a value by returning a unix
   * timestamp for `valueOf`:
   *
   *     var date1 = new Date(1234567890000); // Fri Feb 13 2009 ...
   *     var date2 = new Date(1234567890000);
   *     date1.valueOf(); // 1234567890000
   *     assert( date1 !== date2 );
   *     assert( Immutable.is( date1, date2 ) );
   *
   * Note: overriding `valueOf` may have other implications if you use this object
   * where JavaScript expects a primitive, such as implicit string coercion.
   *
   * For more complex types, especially collections, implementing `valueOf` may
   * not be performant. An alternative is to implement `equals` and `hashCode`.
   *
   * `equals` takes another object, presumably of similar type, and returns true
   * if the it is equal. Equality is symmetrical, so the same result should be
   * returned if this and the argument are flipped.
   *
   *     assert( a.equals(b) === b.equals(a) );
   *
   * `hashCode` returns a 32bit integer number representing the object which will
   * be used to determine how to store the value object in a Map or Set. You must
   * provide both or neither methods, one must not exist without the other.
   *
   * Also, an important relationship between these methods must be upheld: if two
   * values are equal, they *must* return the same hashCode. If the values are not
   * equal, they might have the same hashCode; this is called a hash collision,
   * and while undesirable for performance reasons, it is acceptable.
   *
   *     if (a.equals(b)) {
   *       assert( a.hashCode() === b.hashCode() );
   *     }
   *
   * All Immutable collections implement `equals` and `hashCode`.
   *
   */
  function is(valueA, valueB) {
    if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
      return true;
    }
    if (!valueA || !valueB) {
      return false;
    }
    if (typeof valueA.valueOf === 'function' &&
        typeof valueB.valueOf === 'function') {
      valueA = valueA.valueOf();
      valueB = valueB.valueOf();
      if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
        return true;
      }
      if (!valueA || !valueB) {
        return false;
      }
    }
    if (typeof valueA.equals === 'function' &&
        typeof valueB.equals === 'function' &&
        valueA.equals(valueB)) {
      return true;
    }
    return false;
  }

  function fromJS(json, converter) {
    return converter ?
      fromJSWith(converter, json, '', {'': json}) :
      fromJSDefault(json);
  }

  function fromJSWith(converter, json, key, parentJSON) {
    if (Array.isArray(json)) {
      return converter.call(parentJSON, key, IndexedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
    }
    if (isPlainObj(json)) {
      return converter.call(parentJSON, key, KeyedSeq(json).map(function(v, k)  {return fromJSWith(converter, v, k, json)}));
    }
    return json;
  }

  function fromJSDefault(json) {
    if (Array.isArray(json)) {
      return IndexedSeq(json).map(fromJSDefault).toList();
    }
    if (isPlainObj(json)) {
      return KeyedSeq(json).map(fromJSDefault).toMap();
    }
    return json;
  }

  function isPlainObj(value) {
    return value && (value.constructor === Object || value.constructor === undefined);
  }

  var src_Math__imul =
    typeof Math.imul === 'function' && Math.imul(0xffffffff, 2) === -2 ?
    Math.imul :
    function imul(a, b) {
      a = a | 0; // int
      b = b | 0; // int
      var c = a & 0xffff;
      var d = b & 0xffff;
      // Shift by 0 fixes the sign on the high part.
      return (c * d) + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0) | 0; // int
    };

  // v8 has an optimization for storing 31-bit signed numbers.
  // Values which have either 00 or 11 as the high order bits qualify.
  // This function drops the highest order bit in a signed number, maintaining
  // the sign bit.
  function smi(i32) {
    return ((i32 >>> 1) & 0x40000000) | (i32 & 0xBFFFFFFF);
  }

  function hash(o) {
    if (o === false || o === null || o === undefined) {
      return 0;
    }
    if (typeof o.valueOf === 'function') {
      o = o.valueOf();
      if (o === false || o === null || o === undefined) {
        return 0;
      }
    }
    if (o === true) {
      return 1;
    }
    var type = typeof o;
    if (type === 'number') {
      var h = o | 0;
      if (h !== o) {
        h ^= o * 0xFFFFFFFF;
      }
      while (o > 0xFFFFFFFF) {
        o /= 0xFFFFFFFF;
        h ^= o;
      }
      return smi(h);
    }
    if (type === 'string') {
      return o.length > STRING_HASH_CACHE_MIN_STRLEN ? cachedHashString(o) : hashString(o);
    }
    if (typeof o.hashCode === 'function') {
      return o.hashCode();
    }
    return hashJSObj(o);
  }

  function cachedHashString(string) {
    var hash = stringHashCache[string];
    if (hash === undefined) {
      hash = hashString(string);
      if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
        STRING_HASH_CACHE_SIZE = 0;
        stringHashCache = {};
      }
      STRING_HASH_CACHE_SIZE++;
      stringHashCache[string] = hash;
    }
    return hash;
  }

  // http://jsperf.com/hashing-strings
  function hashString(string) {
    // This is the hash from JVM
    // The hash code for a string is computed as
    // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
    // where s[i] is the ith character of the string and n is the length of
    // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
    // (exclusive) by dropping high bits.
    var hash = 0;
    for (var ii = 0; ii < string.length; ii++) {
      hash = 31 * hash + string.charCodeAt(ii) | 0;
    }
    return smi(hash);
  }

  function hashJSObj(obj) {
    var hash;
    if (usingWeakMap) {
      hash = weakMap.get(obj);
      if (hash !== undefined) {
        return hash;
      }
    }

    hash = obj[UID_HASH_KEY];
    if (hash !== undefined) {
      return hash;
    }

    if (!canDefineProperty) {
      hash = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY];
      if (hash !== undefined) {
        return hash;
      }

      hash = getIENodeHash(obj);
      if (hash !== undefined) {
        return hash;
      }
    }

    hash = ++objHashUID;
    if (objHashUID & 0x40000000) {
      objHashUID = 0;
    }

    if (usingWeakMap) {
      weakMap.set(obj, hash);
    } else if (isExtensible !== undefined && isExtensible(obj) === false) {
      throw new Error('Non-extensible objects are not allowed as keys.');
    } else if (canDefineProperty) {
      Object.defineProperty(obj, UID_HASH_KEY, {
        'enumerable': false,
        'configurable': false,
        'writable': false,
        'value': hash
      });
    } else if (obj.propertyIsEnumerable !== undefined &&
               obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable) {
      // Since we can't define a non-enumerable property on the object
      // we'll hijack one of the less-used non-enumerable properties to
      // save our hash on it. Since this is a function it will not show up in
      // `JSON.stringify` which is what we want.
      obj.propertyIsEnumerable = function() {
        return this.constructor.prototype.propertyIsEnumerable.apply(this, arguments);
      };
      obj.propertyIsEnumerable[UID_HASH_KEY] = hash;
    } else if (obj.nodeType !== undefined) {
      // At this point we couldn't get the IE `uniqueID` to use as a hash
      // and we couldn't use a non-enumerable property to exploit the
      // dontEnum bug so we simply add the `UID_HASH_KEY` on the node
      // itself.
      obj[UID_HASH_KEY] = hash;
    } else {
      throw new Error('Unable to set a non-enumerable property on object.');
    }

    return hash;
  }

  // Get references to ES5 object methods.
  var isExtensible = Object.isExtensible;

  // True if Object.defineProperty works as expected. IE8 fails this test.
  var canDefineProperty = (function() {
    try {
      Object.defineProperty({}, '@', {});
      return true;
    } catch (e) {
      return false;
    }
  }());

  // IE has a `uniqueID` property on DOM nodes. We can construct the hash from it
  // and avoid memory leaks from the IE cloneNode bug.
  function getIENodeHash(node) {
    if (node && node.nodeType > 0) {
      switch (node.nodeType) {
        case 1: // Element
          return node.uniqueID;
        case 9: // Document
          return node.documentElement && node.documentElement.uniqueID;
      }
    }
  }

  // If possible, use a WeakMap.
  var usingWeakMap = typeof WeakMap === 'function';
  var weakMap;
  if (usingWeakMap) {
    weakMap = new WeakMap();
  }

  var objHashUID = 0;

  var UID_HASH_KEY = '__immutablehash__';
  if (typeof Symbol === 'function') {
    UID_HASH_KEY = Symbol(UID_HASH_KEY);
  }

  var STRING_HASH_CACHE_MIN_STRLEN = 16;
  var STRING_HASH_CACHE_MAX_SIZE = 255;
  var STRING_HASH_CACHE_SIZE = 0;
  var stringHashCache = {};

  function invariant(condition, error) {
    if (!condition) throw new Error(error);
  }

  function assertNotInfinite(size) {
    invariant(
      size !== Infinity,
      'Cannot perform this action with an infinite size.'
    );
  }

  createClass(ToKeyedSequence, KeyedSeq);
    function ToKeyedSequence(indexed, useKeys) {
      this._iter = indexed;
      this._useKeys = useKeys;
      this.size = indexed.size;
    }

    ToKeyedSequence.prototype.get = function(key, notSetValue) {
      return this._iter.get(key, notSetValue);
    };

    ToKeyedSequence.prototype.has = function(key) {
      return this._iter.has(key);
    };

    ToKeyedSequence.prototype.valueSeq = function() {
      return this._iter.valueSeq();
    };

    ToKeyedSequence.prototype.reverse = function() {var this$0 = this;
      var reversedSequence = reverseFactory(this, true);
      if (!this._useKeys) {
        reversedSequence.valueSeq = function()  {return this$0._iter.toSeq().reverse()};
      }
      return reversedSequence;
    };

    ToKeyedSequence.prototype.map = function(mapper, context) {var this$0 = this;
      var mappedSequence = mapFactory(this, mapper, context);
      if (!this._useKeys) {
        mappedSequence.valueSeq = function()  {return this$0._iter.toSeq().map(mapper, context)};
      }
      return mappedSequence;
    };

    ToKeyedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      var ii;
      return this._iter.__iterate(
        this._useKeys ?
          function(v, k)  {return fn(v, k, this$0)} :
          ((ii = reverse ? resolveSize(this) : 0),
            function(v ) {return fn(v, reverse ? --ii : ii++, this$0)}),
        reverse
      );
    };

    ToKeyedSequence.prototype.__iterator = function(type, reverse) {
      if (this._useKeys) {
        return this._iter.__iterator(type, reverse);
      }
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      var ii = reverse ? resolveSize(this) : 0;
      return new src_Iterator__Iterator(function()  {
        var step = iterator.next();
        return step.done ? step :
          iteratorValue(type, reverse ? --ii : ii++, step.value, step);
      });
    };

  ToKeyedSequence.prototype[IS_ORDERED_SENTINEL] = true;


  createClass(ToIndexedSequence, IndexedSeq);
    function ToIndexedSequence(iter) {
      this._iter = iter;
      this.size = iter.size;
    }

    ToIndexedSequence.prototype.includes = function(value) {
      return this._iter.includes(value);
    };

    ToIndexedSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      var iterations = 0;
      return this._iter.__iterate(function(v ) {return fn(v, iterations++, this$0)}, reverse);
    };

    ToIndexedSequence.prototype.__iterator = function(type, reverse) {
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        var step = iterator.next();
        return step.done ? step :
          iteratorValue(type, iterations++, step.value, step)
      });
    };



  createClass(ToSetSequence, SetSeq);
    function ToSetSequence(iter) {
      this._iter = iter;
      this.size = iter.size;
    }

    ToSetSequence.prototype.has = function(key) {
      return this._iter.includes(key);
    };

    ToSetSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._iter.__iterate(function(v ) {return fn(v, v, this$0)}, reverse);
    };

    ToSetSequence.prototype.__iterator = function(type, reverse) {
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      return new src_Iterator__Iterator(function()  {
        var step = iterator.next();
        return step.done ? step :
          iteratorValue(type, step.value, step.value, step);
      });
    };



  createClass(FromEntriesSequence, KeyedSeq);
    function FromEntriesSequence(entries) {
      this._iter = entries;
      this.size = entries.size;
    }

    FromEntriesSequence.prototype.entrySeq = function() {
      return this._iter.toSeq();
    };

    FromEntriesSequence.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._iter.__iterate(function(entry ) {
        // Check if entry exists first so array access doesn't throw for holes
        // in the parent iteration.
        if (entry) {
          validateEntry(entry);
          var indexedIterable = isIterable(entry);
          return fn(
            indexedIterable ? entry.get(1) : entry[1],
            indexedIterable ? entry.get(0) : entry[0],
            this$0
          );
        }
      }, reverse);
    };

    FromEntriesSequence.prototype.__iterator = function(type, reverse) {
      var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
      return new src_Iterator__Iterator(function()  {
        while (true) {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          var entry = step.value;
          // Check if entry exists first so array access doesn't throw for holes
          // in the parent iteration.
          if (entry) {
            validateEntry(entry);
            var indexedIterable = isIterable(entry);
            return iteratorValue(
              type,
              indexedIterable ? entry.get(0) : entry[0],
              indexedIterable ? entry.get(1) : entry[1],
              step
            );
          }
        }
      });
    };


  ToIndexedSequence.prototype.cacheResult =
  ToKeyedSequence.prototype.cacheResult =
  ToSetSequence.prototype.cacheResult =
  FromEntriesSequence.prototype.cacheResult =
    cacheResultThrough;


  function flipFactory(iterable) {
    var flipSequence = makeSequence(iterable);
    flipSequence._iter = iterable;
    flipSequence.size = iterable.size;
    flipSequence.flip = function()  {return iterable};
    flipSequence.reverse = function () {
      var reversedSequence = iterable.reverse.apply(this); // super.reverse()
      reversedSequence.flip = function()  {return iterable.reverse()};
      return reversedSequence;
    };
    flipSequence.has = function(key ) {return iterable.includes(key)};
    flipSequence.includes = function(key ) {return iterable.has(key)};
    flipSequence.cacheResult = cacheResultThrough;
    flipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      return iterable.__iterate(function(v, k)  {return fn(k, v, this$0) !== false}, reverse);
    }
    flipSequence.__iteratorUncached = function(type, reverse) {
      if (type === ITERATE_ENTRIES) {
        var iterator = iterable.__iterator(type, reverse);
        return new src_Iterator__Iterator(function()  {
          var step = iterator.next();
          if (!step.done) {
            var k = step.value[0];
            step.value[0] = step.value[1];
            step.value[1] = k;
          }
          return step;
        });
      }
      return iterable.__iterator(
        type === ITERATE_VALUES ? ITERATE_KEYS : ITERATE_VALUES,
        reverse
      );
    }
    return flipSequence;
  }


  function mapFactory(iterable, mapper, context) {
    var mappedSequence = makeSequence(iterable);
    mappedSequence.size = iterable.size;
    mappedSequence.has = function(key ) {return iterable.has(key)};
    mappedSequence.get = function(key, notSetValue)  {
      var v = iterable.get(key, NOT_SET);
      return v === NOT_SET ?
        notSetValue :
        mapper.call(context, v, key, iterable);
    };
    mappedSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      return iterable.__iterate(
        function(v, k, c)  {return fn(mapper.call(context, v, k, c), k, this$0) !== false},
        reverse
      );
    }
    mappedSequence.__iteratorUncached = function (type, reverse) {
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      return new src_Iterator__Iterator(function()  {
        var step = iterator.next();
        if (step.done) {
          return step;
        }
        var entry = step.value;
        var key = entry[0];
        return iteratorValue(
          type,
          key,
          mapper.call(context, entry[1], key, iterable),
          step
        );
      });
    }
    return mappedSequence;
  }


  function reverseFactory(iterable, useKeys) {
    var reversedSequence = makeSequence(iterable);
    reversedSequence._iter = iterable;
    reversedSequence.size = iterable.size;
    reversedSequence.reverse = function()  {return iterable};
    if (iterable.flip) {
      reversedSequence.flip = function () {
        var flipSequence = flipFactory(iterable);
        flipSequence.reverse = function()  {return iterable.flip()};
        return flipSequence;
      };
    }
    reversedSequence.get = function(key, notSetValue) 
      {return iterable.get(useKeys ? key : -1 - key, notSetValue)};
    reversedSequence.has = function(key )
      {return iterable.has(useKeys ? key : -1 - key)};
    reversedSequence.includes = function(value ) {return iterable.includes(value)};
    reversedSequence.cacheResult = cacheResultThrough;
    reversedSequence.__iterate = function (fn, reverse) {var this$0 = this;
      return iterable.__iterate(function(v, k)  {return fn(v, k, this$0)}, !reverse);
    };
    reversedSequence.__iterator =
      function(type, reverse)  {return iterable.__iterator(type, !reverse)};
    return reversedSequence;
  }


  function filterFactory(iterable, predicate, context, useKeys) {
    var filterSequence = makeSequence(iterable);
    if (useKeys) {
      filterSequence.has = function(key ) {
        var v = iterable.get(key, NOT_SET);
        return v !== NOT_SET && !!predicate.call(context, v, key, iterable);
      };
      filterSequence.get = function(key, notSetValue)  {
        var v = iterable.get(key, NOT_SET);
        return v !== NOT_SET && predicate.call(context, v, key, iterable) ?
          v : notSetValue;
      };
    }
    filterSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      var iterations = 0;
      iterable.__iterate(function(v, k, c)  {
        if (predicate.call(context, v, k, c)) {
          iterations++;
          return fn(v, useKeys ? k : iterations - 1, this$0);
        }
      }, reverse);
      return iterations;
    };
    filterSequence.__iteratorUncached = function (type, reverse) {
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        while (true) {
          var step = iterator.next();
          if (step.done) {
            return step;
          }
          var entry = step.value;
          var key = entry[0];
          var value = entry[1];
          if (predicate.call(context, value, key, iterable)) {
            return iteratorValue(type, useKeys ? key : iterations++, value, step);
          }
        }
      });
    }
    return filterSequence;
  }


  function countByFactory(iterable, grouper, context) {
    var groups = src_Map__Map().asMutable();
    iterable.__iterate(function(v, k)  {
      groups.update(
        grouper.call(context, v, k, iterable),
        0,
        function(a ) {return a + 1}
      );
    });
    return groups.asImmutable();
  }


  function groupByFactory(iterable, grouper, context) {
    var isKeyedIter = isKeyed(iterable);
    var groups = (isOrdered(iterable) ? OrderedMap() : src_Map__Map()).asMutable();
    iterable.__iterate(function(v, k)  {
      groups.update(
        grouper.call(context, v, k, iterable),
        function(a ) {return (a = a || [], a.push(isKeyedIter ? [k, v] : v), a)}
      );
    });
    var coerce = iterableClass(iterable);
    return groups.map(function(arr ) {return reify(iterable, coerce(arr))});
  }


  function sliceFactory(iterable, begin, end, useKeys) {
    var originalSize = iterable.size;

    // Sanitize begin & end using this shorthand for ToInt32(argument)
    // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
    if (begin !== undefined) {
      begin = begin | 0;
    }
    if (end !== undefined) {
      end = end | 0;
    }

    if (wholeSlice(begin, end, originalSize)) {
      return iterable;
    }

    var resolvedBegin = resolveBegin(begin, originalSize);
    var resolvedEnd = resolveEnd(end, originalSize);

    // begin or end will be NaN if they were provided as negative numbers and
    // this iterable's size is unknown. In that case, cache first so there is
    // a known size and these do not resolve to NaN.
    if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
      return sliceFactory(iterable.toSeq().cacheResult(), begin, end, useKeys);
    }

    // Note: resolvedEnd is undefined when the original sequence's length is
    // unknown and this slice did not supply an end and should contain all
    // elements after resolvedBegin.
    // In that case, resolvedSize will be NaN and sliceSize will remain undefined.
    var resolvedSize = resolvedEnd - resolvedBegin;
    var sliceSize;
    if (resolvedSize === resolvedSize) {
      sliceSize = resolvedSize < 0 ? 0 : resolvedSize;
    }

    var sliceSeq = makeSequence(iterable);

    // If iterable.size is undefined, the size of the realized sliceSeq is
    // unknown at this point unless the number of items to slice is 0
    sliceSeq.size = sliceSize === 0 ? sliceSize : iterable.size && sliceSize || undefined;

    if (!useKeys && isSeq(iterable) && sliceSize >= 0) {
      sliceSeq.get = function (index, notSetValue) {
        index = wrapIndex(this, index);
        return index >= 0 && index < sliceSize ?
          iterable.get(index + resolvedBegin, notSetValue) :
          notSetValue;
      }
    }

    sliceSeq.__iterateUncached = function(fn, reverse) {var this$0 = this;
      if (sliceSize === 0) {
        return 0;
      }
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var skipped = 0;
      var isSkipping = true;
      var iterations = 0;
      iterable.__iterate(function(v, k)  {
        if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
          iterations++;
          return fn(v, useKeys ? k : iterations - 1, this$0) !== false &&
                 iterations !== sliceSize;
        }
      });
      return iterations;
    };

    sliceSeq.__iteratorUncached = function(type, reverse) {
      if (sliceSize !== 0 && reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      // Don't bother instantiating parent iterator if taking 0.
      var iterator = sliceSize !== 0 && iterable.__iterator(type, reverse);
      var skipped = 0;
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        while (skipped++ < resolvedBegin) {
          iterator.next();
        }
        if (++iterations > sliceSize) {
          return iteratorDone();
        }
        var step = iterator.next();
        if (useKeys || type === ITERATE_VALUES) {
          return step;
        } else if (type === ITERATE_KEYS) {
          return iteratorValue(type, iterations - 1, undefined, step);
        } else {
          return iteratorValue(type, iterations - 1, step.value[1], step);
        }
      });
    }

    return sliceSeq;
  }


  function takeWhileFactory(iterable, predicate, context) {
    var takeSequence = makeSequence(iterable);
    takeSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var iterations = 0;
      iterable.__iterate(function(v, k, c) 
        {return predicate.call(context, v, k, c) && ++iterations && fn(v, k, this$0)}
      );
      return iterations;
    };
    takeSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      var iterating = true;
      return new src_Iterator__Iterator(function()  {
        if (!iterating) {
          return iteratorDone();
        }
        var step = iterator.next();
        if (step.done) {
          return step;
        }
        var entry = step.value;
        var k = entry[0];
        var v = entry[1];
        if (!predicate.call(context, v, k, this$0)) {
          iterating = false;
          return iteratorDone();
        }
        return type === ITERATE_ENTRIES ? step :
          iteratorValue(type, k, v, step);
      });
    };
    return takeSequence;
  }


  function skipWhileFactory(iterable, predicate, context, useKeys) {
    var skipSequence = makeSequence(iterable);
    skipSequence.__iterateUncached = function (fn, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterate(fn, reverse);
      }
      var isSkipping = true;
      var iterations = 0;
      iterable.__iterate(function(v, k, c)  {
        if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
          iterations++;
          return fn(v, useKeys ? k : iterations - 1, this$0);
        }
      });
      return iterations;
    };
    skipSequence.__iteratorUncached = function(type, reverse) {var this$0 = this;
      if (reverse) {
        return this.cacheResult().__iterator(type, reverse);
      }
      var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
      var skipping = true;
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        var step, k, v;
        do {
          step = iterator.next();
          if (step.done) {
            if (useKeys || type === ITERATE_VALUES) {
              return step;
            } else if (type === ITERATE_KEYS) {
              return iteratorValue(type, iterations++, undefined, step);
            } else {
              return iteratorValue(type, iterations++, step.value[1], step);
            }
          }
          var entry = step.value;
          k = entry[0];
          v = entry[1];
          skipping && (skipping = predicate.call(context, v, k, this$0));
        } while (skipping);
        return type === ITERATE_ENTRIES ? step :
          iteratorValue(type, k, v, step);
      });
    };
    return skipSequence;
  }


  function concatFactory(iterable, values) {
    var isKeyedIterable = isKeyed(iterable);
    var iters = [iterable].concat(values).map(function(v ) {
      if (!isIterable(v)) {
        v = isKeyedIterable ?
          keyedSeqFromValue(v) :
          indexedSeqFromValue(Array.isArray(v) ? v : [v]);
      } else if (isKeyedIterable) {
        v = KeyedIterable(v);
      }
      return v;
    }).filter(function(v ) {return v.size !== 0});

    if (iters.length === 0) {
      return iterable;
    }

    if (iters.length === 1) {
      var singleton = iters[0];
      if (singleton === iterable ||
          isKeyedIterable && isKeyed(singleton) ||
          isIndexed(iterable) && isIndexed(singleton)) {
        return singleton;
      }
    }

    var concatSeq = new ArraySeq(iters);
    if (isKeyedIterable) {
      concatSeq = concatSeq.toKeyedSeq();
    } else if (!isIndexed(iterable)) {
      concatSeq = concatSeq.toSetSeq();
    }
    concatSeq = concatSeq.flatten(true);
    concatSeq.size = iters.reduce(
      function(sum, seq)  {
        if (sum !== undefined) {
          var size = seq.size;
          if (size !== undefined) {
            return sum + size;
          }
        }
      },
      0
    );
    return concatSeq;
  }


  function flattenFactory(iterable, depth, useKeys) {
    var flatSequence = makeSequence(iterable);
    flatSequence.__iterateUncached = function(fn, reverse) {
      var iterations = 0;
      var stopped = false;
      function flatDeep(iter, currentDepth) {var this$0 = this;
        iter.__iterate(function(v, k)  {
          if ((!depth || currentDepth < depth) && isIterable(v)) {
            flatDeep(v, currentDepth + 1);
          } else if (fn(v, useKeys ? k : iterations++, this$0) === false) {
            stopped = true;
          }
          return !stopped;
        }, reverse);
      }
      flatDeep(iterable, 0);
      return iterations;
    }
    flatSequence.__iteratorUncached = function(type, reverse) {
      var iterator = iterable.__iterator(type, reverse);
      var stack = [];
      var iterations = 0;
      return new src_Iterator__Iterator(function()  {
        while (iterator) {
          var step = iterator.next();
          if (step.done !== false) {
            iterator = stack.pop();
            continue;
          }
          var v = step.value;
          if (type === ITERATE_ENTRIES) {
            v = v[1];
          }
          if ((!depth || stack.length < depth) && isIterable(v)) {
            stack.push(iterator);
            iterator = v.__iterator(type, reverse);
          } else {
            return useKeys ? step : iteratorValue(type, iterations++, v, step);
          }
        }
        return iteratorDone();
      });
    }
    return flatSequence;
  }


  function flatMapFactory(iterable, mapper, context) {
    var coerce = iterableClass(iterable);
    return iterable.toSeq().map(
      function(v, k)  {return coerce(mapper.call(context, v, k, iterable))}
    ).flatten(true);
  }


  function interposeFactory(iterable, separator) {
    var interposedSequence = makeSequence(iterable);
    interposedSequence.size = iterable.size && iterable.size * 2 -1;
    interposedSequence.__iterateUncached = function(fn, reverse) {var this$0 = this;
      var iterations = 0;
      iterable.__iterate(function(v, k) 
        {return (!iterations || fn(separator, iterations++, this$0) !== false) &&
        fn(v, iterations++, this$0) !== false},
        reverse
      );
      return iterations;
    };
    interposedSequence.__iteratorUncached = function(type, reverse) {
      var iterator = iterable.__iterator(ITERATE_VALUES, reverse);
      var iterations = 0;
      var step;
      return new src_Iterator__Iterator(function()  {
        if (!step || iterations % 2) {
          step = iterator.next();
          if (step.done) {
            return step;
          }
        }
        return iterations % 2 ?
          iteratorValue(type, iterations++, separator) :
          iteratorValue(type, iterations++, step.value, step);
      });
    };
    return interposedSequence;
  }


  function sortFactory(iterable, comparator, mapper) {
    if (!comparator) {
      comparator = defaultComparator;
    }
    var isKeyedIterable = isKeyed(iterable);
    var index = 0;
    var entries = iterable.toSeq().map(
      function(v, k)  {return [k, v, index++, mapper ? mapper(v, k, iterable) : v]}
    ).toArray();
    entries.sort(function(a, b)  {return comparator(a[3], b[3]) || a[2] - b[2]}).forEach(
      isKeyedIterable ?
      function(v, i)  { entries[i].length = 2; } :
      function(v, i)  { entries[i] = v[1]; }
    );
    return isKeyedIterable ? KeyedSeq(entries) :
      isIndexed(iterable) ? IndexedSeq(entries) :
      SetSeq(entries);
  }


  function maxFactory(iterable, comparator, mapper) {
    if (!comparator) {
      comparator = defaultComparator;
    }
    if (mapper) {
      var entry = iterable.toSeq()
        .map(function(v, k)  {return [v, mapper(v, k, iterable)]})
        .reduce(function(a, b)  {return maxCompare(comparator, a[1], b[1]) ? b : a});
      return entry && entry[0];
    } else {
      return iterable.reduce(function(a, b)  {return maxCompare(comparator, a, b) ? b : a});
    }
  }

  function maxCompare(comparator, a, b) {
    var comp = comparator(b, a);
    // b is considered the new max if the comparator declares them equal, but
    // they are not equal and b is in fact a nullish value.
    return (comp === 0 && b !== a && (b === undefined || b === null || b !== b)) || comp > 0;
  }


  function zipWithFactory(keyIter, zipper, iters) {
    var zipSequence = makeSequence(keyIter);
    zipSequence.size = new ArraySeq(iters).map(function(i ) {return i.size}).min();
    // Note: this a generic base implementation of __iterate in terms of
    // __iterator which may be more generically useful in the future.
    zipSequence.__iterate = function(fn, reverse) {
      /* generic:
      var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
      var step;
      var iterations = 0;
      while (!(step = iterator.next()).done) {
        iterations++;
        if (fn(step.value[1], step.value[0], this) === false) {
          break;
        }
      }
      return iterations;
      */
      // indexed:
      var iterator = this.__iterator(ITERATE_VALUES, reverse);
      var step;
      var iterations = 0;
      while (!(step = iterator.next()).done) {
        if (fn(step.value, iterations++, this) === false) {
          break;
        }
      }
      return iterations;
    };
    zipSequence.__iteratorUncached = function(type, reverse) {
      var iterators = iters.map(function(i )
        {return (i = Iterable(i), getIterator(reverse ? i.reverse() : i))}
      );
      var iterations = 0;
      var isDone = false;
      return new src_Iterator__Iterator(function()  {
        var steps;
        if (!isDone) {
          steps = iterators.map(function(i ) {return i.next()});
          isDone = steps.some(function(s ) {return s.done});
        }
        if (isDone) {
          return iteratorDone();
        }
        return iteratorValue(
          type,
          iterations++,
          zipper.apply(null, steps.map(function(s ) {return s.value}))
        );
      });
    };
    return zipSequence
  }


  // #pragma Helper Functions

  function reify(iter, seq) {
    return isSeq(iter) ? seq : iter.constructor(seq);
  }

  function validateEntry(entry) {
    if (entry !== Object(entry)) {
      throw new TypeError('Expected [K, V] tuple: ' + entry);
    }
  }

  function resolveSize(iter) {
    assertNotInfinite(iter.size);
    return ensureSize(iter);
  }

  function iterableClass(iterable) {
    return isKeyed(iterable) ? KeyedIterable :
      isIndexed(iterable) ? IndexedIterable :
      SetIterable;
  }

  function makeSequence(iterable) {
    return Object.create(
      (
        isKeyed(iterable) ? KeyedSeq :
        isIndexed(iterable) ? IndexedSeq :
        SetSeq
      ).prototype
    );
  }

  function cacheResultThrough() {
    if (this._iter.cacheResult) {
      this._iter.cacheResult();
      this.size = this._iter.size;
      return this;
    } else {
      return Seq.prototype.cacheResult.call(this);
    }
  }

  function defaultComparator(a, b) {
    return a > b ? 1 : a < b ? -1 : 0;
  }

  function forceIterator(keyPath) {
    var iter = getIterator(keyPath);
    if (!iter) {
      // Array might not be iterable in this environment, so we need a fallback
      // to our wrapped type.
      if (!isArrayLike(keyPath)) {
        throw new TypeError('Expected iterable or array-like: ' + keyPath);
      }
      iter = getIterator(Iterable(keyPath));
    }
    return iter;
  }

  createClass(src_Map__Map, KeyedCollection);

    // @pragma Construction

    function src_Map__Map(value) {
      return value === null || value === undefined ? emptyMap() :
        isMap(value) && !isOrdered(value) ? value :
        emptyMap().withMutations(function(map ) {
          var iter = KeyedIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v, k)  {return map.set(k, v)});
        });
    }

    src_Map__Map.prototype.toString = function() {
      return this.__toString('Map {', '}');
    };

    // @pragma Access

    src_Map__Map.prototype.get = function(k, notSetValue) {
      return this._root ?
        this._root.get(0, undefined, k, notSetValue) :
        notSetValue;
    };

    // @pragma Modification

    src_Map__Map.prototype.set = function(k, v) {
      return updateMap(this, k, v);
    };

    src_Map__Map.prototype.setIn = function(keyPath, v) {
      return this.updateIn(keyPath, NOT_SET, function()  {return v});
    };

    src_Map__Map.prototype.remove = function(k) {
      return updateMap(this, k, NOT_SET);
    };

    src_Map__Map.prototype.deleteIn = function(keyPath) {
      return this.updateIn(keyPath, function()  {return NOT_SET});
    };

    src_Map__Map.prototype.update = function(k, notSetValue, updater) {
      return arguments.length === 1 ?
        k(this) :
        this.updateIn([k], notSetValue, updater);
    };

    src_Map__Map.prototype.updateIn = function(keyPath, notSetValue, updater) {
      if (!updater) {
        updater = notSetValue;
        notSetValue = undefined;
      }
      var updatedValue = updateInDeepMap(
        this,
        forceIterator(keyPath),
        notSetValue,
        updater
      );
      return updatedValue === NOT_SET ? undefined : updatedValue;
    };

    src_Map__Map.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = 0;
        this._root = null;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return emptyMap();
    };

    // @pragma Composition

    src_Map__Map.prototype.merge = function(/*...iters*/) {
      return mergeIntoMapWith(this, undefined, arguments);
    };

    src_Map__Map.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoMapWith(this, merger, iters);
    };

    src_Map__Map.prototype.mergeIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
      return this.updateIn(
        keyPath,
        emptyMap(),
        function(m ) {return typeof m.merge === 'function' ?
          m.merge.apply(m, iters) :
          iters[iters.length - 1]}
      );
    };

    src_Map__Map.prototype.mergeDeep = function(/*...iters*/) {
      return mergeIntoMapWith(this, deepMerger(undefined), arguments);
    };

    src_Map__Map.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoMapWith(this, deepMerger(merger), iters);
    };

    src_Map__Map.prototype.mergeDeepIn = function(keyPath) {var iters = SLICE$0.call(arguments, 1);
      return this.updateIn(
        keyPath,
        emptyMap(),
        function(m ) {return typeof m.mergeDeep === 'function' ?
          m.mergeDeep.apply(m, iters) :
          iters[iters.length - 1]}
      );
    };

    src_Map__Map.prototype.sort = function(comparator) {
      // Late binding
      return OrderedMap(sortFactory(this, comparator));
    };

    src_Map__Map.prototype.sortBy = function(mapper, comparator) {
      // Late binding
      return OrderedMap(sortFactory(this, comparator, mapper));
    };

    // @pragma Mutability

    src_Map__Map.prototype.withMutations = function(fn) {
      var mutable = this.asMutable();
      fn(mutable);
      return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
    };

    src_Map__Map.prototype.asMutable = function() {
      return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
    };

    src_Map__Map.prototype.asImmutable = function() {
      return this.__ensureOwner();
    };

    src_Map__Map.prototype.wasAltered = function() {
      return this.__altered;
    };

    src_Map__Map.prototype.__iterator = function(type, reverse) {
      return new MapIterator(this, type, reverse);
    };

    src_Map__Map.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      var iterations = 0;
      this._root && this._root.iterate(function(entry ) {
        iterations++;
        return fn(entry[1], entry[0], this$0);
      }, reverse);
      return iterations;
    };

    src_Map__Map.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      if (!ownerID) {
        this.__ownerID = ownerID;
        this.__altered = false;
        return this;
      }
      return makeMap(this.size, this._root, ownerID, this.__hash);
    };


  function isMap(maybeMap) {
    return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
  }

  src_Map__Map.isMap = isMap;

  var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';

  var MapPrototype = src_Map__Map.prototype;
  MapPrototype[IS_MAP_SENTINEL] = true;
  MapPrototype[DELETE] = MapPrototype.remove;
  MapPrototype.removeIn = MapPrototype.deleteIn;


  // #pragma Trie Nodes



    function ArrayMapNode(ownerID, entries) {
      this.ownerID = ownerID;
      this.entries = entries;
    }

    ArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      var entries = this.entries;
      for (var ii = 0, len = entries.length; ii < len; ii++) {
        if (is(key, entries[ii][0])) {
          return entries[ii][1];
        }
      }
      return notSetValue;
    };

    ArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      var removed = value === NOT_SET;

      var entries = this.entries;
      var idx = 0;
      for (var len = entries.length; idx < len; idx++) {
        if (is(key, entries[idx][0])) {
          break;
        }
      }
      var exists = idx < len;

      if (exists ? entries[idx][1] === value : removed) {
        return this;
      }

      SetRef(didAlter);
      (removed || !exists) && SetRef(didChangeSize);

      if (removed && entries.length === 1) {
        return; // undefined
      }

      if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
        return createNodes(ownerID, entries, key, value);
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newEntries = isEditable ? entries : arrCopy(entries);

      if (exists) {
        if (removed) {
          idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
        } else {
          newEntries[idx] = [key, value];
        }
      } else {
        newEntries.push([key, value]);
      }

      if (isEditable) {
        this.entries = newEntries;
        return this;
      }

      return new ArrayMapNode(ownerID, newEntries);
    };




    function BitmapIndexedNode(ownerID, bitmap, nodes) {
      this.ownerID = ownerID;
      this.bitmap = bitmap;
      this.nodes = nodes;
    }

    BitmapIndexedNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var bit = (1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK));
      var bitmap = this.bitmap;
      return (bitmap & bit) === 0 ? notSetValue :
        this.nodes[popCount(bitmap & (bit - 1))].get(shift + SHIFT, keyHash, key, notSetValue);
    };

    BitmapIndexedNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var bit = 1 << keyHashFrag;
      var bitmap = this.bitmap;
      var exists = (bitmap & bit) !== 0;

      if (!exists && value === NOT_SET) {
        return this;
      }

      var idx = popCount(bitmap & (bit - 1));
      var nodes = this.nodes;
      var node = exists ? nodes[idx] : undefined;
      var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);

      if (newNode === node) {
        return this;
      }

      if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
        return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode);
      }

      if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) {
        return nodes[idx ^ 1];
      }

      if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
        return newNode;
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newBitmap = exists ? newNode ? bitmap : bitmap ^ bit : bitmap | bit;
      var newNodes = exists ? newNode ?
        setIn(nodes, idx, newNode, isEditable) :
        spliceOut(nodes, idx, isEditable) :
        spliceIn(nodes, idx, newNode, isEditable);

      if (isEditable) {
        this.bitmap = newBitmap;
        this.nodes = newNodes;
        return this;
      }

      return new BitmapIndexedNode(ownerID, newBitmap, newNodes);
    };




    function HashArrayMapNode(ownerID, count, nodes) {
      this.ownerID = ownerID;
      this.count = count;
      this.nodes = nodes;
    }

    HashArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var node = this.nodes[idx];
      return node ? node.get(shift + SHIFT, keyHash, key, notSetValue) : notSetValue;
    };

    HashArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }
      var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
      var removed = value === NOT_SET;
      var nodes = this.nodes;
      var node = nodes[idx];

      if (removed && !node) {
        return this;
      }

      var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);
      if (newNode === node) {
        return this;
      }

      var newCount = this.count;
      if (!node) {
        newCount++;
      } else if (!newNode) {
        newCount--;
        if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
          return packNodes(ownerID, nodes, newCount, idx);
        }
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newNodes = setIn(nodes, idx, newNode, isEditable);

      if (isEditable) {
        this.count = newCount;
        this.nodes = newNodes;
        return this;
      }

      return new HashArrayMapNode(ownerID, newCount, newNodes);
    };




    function HashCollisionNode(ownerID, keyHash, entries) {
      this.ownerID = ownerID;
      this.keyHash = keyHash;
      this.entries = entries;
    }

    HashCollisionNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      var entries = this.entries;
      for (var ii = 0, len = entries.length; ii < len; ii++) {
        if (is(key, entries[ii][0])) {
          return entries[ii][1];
        }
      }
      return notSetValue;
    };

    HashCollisionNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      if (keyHash === undefined) {
        keyHash = hash(key);
      }

      var removed = value === NOT_SET;

      if (keyHash !== this.keyHash) {
        if (removed) {
          return this;
        }
        SetRef(didAlter);
        SetRef(didChangeSize);
        return mergeIntoNode(this, ownerID, shift, keyHash, [key, value]);
      }

      var entries = this.entries;
      var idx = 0;
      for (var len = entries.length; idx < len; idx++) {
        if (is(key, entries[idx][0])) {
          break;
        }
      }
      var exists = idx < len;

      if (exists ? entries[idx][1] === value : removed) {
        return this;
      }

      SetRef(didAlter);
      (removed || !exists) && SetRef(didChangeSize);

      if (removed && len === 2) {
        return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1]);
      }

      var isEditable = ownerID && ownerID === this.ownerID;
      var newEntries = isEditable ? entries : arrCopy(entries);

      if (exists) {
        if (removed) {
          idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
        } else {
          newEntries[idx] = [key, value];
        }
      } else {
        newEntries.push([key, value]);
      }

      if (isEditable) {
        this.entries = newEntries;
        return this;
      }

      return new HashCollisionNode(ownerID, this.keyHash, newEntries);
    };




    function ValueNode(ownerID, keyHash, entry) {
      this.ownerID = ownerID;
      this.keyHash = keyHash;
      this.entry = entry;
    }

    ValueNode.prototype.get = function(shift, keyHash, key, notSetValue) {
      return is(key, this.entry[0]) ? this.entry[1] : notSetValue;
    };

    ValueNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
      var removed = value === NOT_SET;
      var keyMatch = is(key, this.entry[0]);
      if (keyMatch ? value === this.entry[1] : removed) {
        return this;
      }

      SetRef(didAlter);

      if (removed) {
        SetRef(didChangeSize);
        return; // undefined
      }

      if (keyMatch) {
        if (ownerID && ownerID === this.ownerID) {
          this.entry[1] = value;
          return this;
        }
        return new ValueNode(ownerID, this.keyHash, [key, value]);
      }

      SetRef(didChangeSize);
      return mergeIntoNode(this, ownerID, shift, hash(key), [key, value]);
    };



  // #pragma Iterators

  ArrayMapNode.prototype.iterate =
  HashCollisionNode.prototype.iterate = function (fn, reverse) {
    var entries = this.entries;
    for (var ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
      if (fn(entries[reverse ? maxIndex - ii : ii]) === false) {
        return false;
      }
    }
  }

  BitmapIndexedNode.prototype.iterate =
  HashArrayMapNode.prototype.iterate = function (fn, reverse) {
    var nodes = this.nodes;
    for (var ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
      var node = nodes[reverse ? maxIndex - ii : ii];
      if (node && node.iterate(fn, reverse) === false) {
        return false;
      }
    }
  }

  ValueNode.prototype.iterate = function (fn, reverse) {
    return fn(this.entry);
  }

  createClass(MapIterator, src_Iterator__Iterator);

    function MapIterator(map, type, reverse) {
      this._type = type;
      this._reverse = reverse;
      this._stack = map._root && mapIteratorFrame(map._root);
    }

    MapIterator.prototype.next = function() {
      var type = this._type;
      var stack = this._stack;
      while (stack) {
        var node = stack.node;
        var index = stack.index++;
        var maxIndex;
        if (node.entry) {
          if (index === 0) {
            return mapIteratorValue(type, node.entry);
          }
        } else if (node.entries) {
          maxIndex = node.entries.length - 1;
          if (index <= maxIndex) {
            return mapIteratorValue(type, node.entries[this._reverse ? maxIndex - index : index]);
          }
        } else {
          maxIndex = node.nodes.length - 1;
          if (index <= maxIndex) {
            var subNode = node.nodes[this._reverse ? maxIndex - index : index];
            if (subNode) {
              if (subNode.entry) {
                return mapIteratorValue(type, subNode.entry);
              }
              stack = this._stack = mapIteratorFrame(subNode, stack);
            }
            continue;
          }
        }
        stack = this._stack = this._stack.__prev;
      }
      return iteratorDone();
    };


  function mapIteratorValue(type, entry) {
    return iteratorValue(type, entry[0], entry[1]);
  }

  function mapIteratorFrame(node, prev) {
    return {
      node: node,
      index: 0,
      __prev: prev
    };
  }

  function makeMap(size, root, ownerID, hash) {
    var map = Object.create(MapPrototype);
    map.size = size;
    map._root = root;
    map.__ownerID = ownerID;
    map.__hash = hash;
    map.__altered = false;
    return map;
  }

  var EMPTY_MAP;
  function emptyMap() {
    return EMPTY_MAP || (EMPTY_MAP = makeMap(0));
  }

  function updateMap(map, k, v) {
    var newRoot;
    var newSize;
    if (!map._root) {
      if (v === NOT_SET) {
        return map;
      }
      newSize = 1;
      newRoot = new ArrayMapNode(map.__ownerID, [[k, v]]);
    } else {
      var didChangeSize = MakeRef(CHANGE_LENGTH);
      var didAlter = MakeRef(DID_ALTER);
      newRoot = updateNode(map._root, map.__ownerID, 0, undefined, k, v, didChangeSize, didAlter);
      if (!didAlter.value) {
        return map;
      }
      newSize = map.size + (didChangeSize.value ? v === NOT_SET ? -1 : 1 : 0);
    }
    if (map.__ownerID) {
      map.size = newSize;
      map._root = newRoot;
      map.__hash = undefined;
      map.__altered = true;
      return map;
    }
    return newRoot ? makeMap(newSize, newRoot) : emptyMap();
  }

  function updateNode(node, ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
    if (!node) {
      if (value === NOT_SET) {
        return node;
      }
      SetRef(didAlter);
      SetRef(didChangeSize);
      return new ValueNode(ownerID, keyHash, [key, value]);
    }
    return node.update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter);
  }

  function isLeafNode(node) {
    return node.constructor === ValueNode || node.constructor === HashCollisionNode;
  }

  function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
    if (node.keyHash === keyHash) {
      return new HashCollisionNode(ownerID, keyHash, [node.entry, entry]);
    }

    var idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK;
    var idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;

    var newNode;
    var nodes = idx1 === idx2 ?
      [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry)] :
      ((newNode = new ValueNode(ownerID, keyHash, entry)), idx1 < idx2 ? [node, newNode] : [newNode, node]);

    return new BitmapIndexedNode(ownerID, (1 << idx1) | (1 << idx2), nodes);
  }

  function createNodes(ownerID, entries, key, value) {
    if (!ownerID) {
      ownerID = new OwnerID();
    }
    var node = new ValueNode(ownerID, hash(key), [key, value]);
    for (var ii = 0; ii < entries.length; ii++) {
      var entry = entries[ii];
      node = node.update(ownerID, 0, undefined, entry[0], entry[1]);
    }
    return node;
  }

  function packNodes(ownerID, nodes, count, excluding) {
    var bitmap = 0;
    var packedII = 0;
    var packedNodes = new Array(count);
    for (var ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
      var node = nodes[ii];
      if (node !== undefined && ii !== excluding) {
        bitmap |= bit;
        packedNodes[packedII++] = node;
      }
    }
    return new BitmapIndexedNode(ownerID, bitmap, packedNodes);
  }

  function expandNodes(ownerID, nodes, bitmap, including, node) {
    var count = 0;
    var expandedNodes = new Array(SIZE);
    for (var ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
      expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined;
    }
    expandedNodes[including] = node;
    return new HashArrayMapNode(ownerID, count + 1, expandedNodes);
  }

  function mergeIntoMapWith(map, merger, iterables) {
    var iters = [];
    for (var ii = 0; ii < iterables.length; ii++) {
      var value = iterables[ii];
      var iter = KeyedIterable(value);
      if (!isIterable(value)) {
        iter = iter.map(function(v ) {return fromJS(v)});
      }
      iters.push(iter);
    }
    return mergeIntoCollectionWith(map, merger, iters);
  }

  function deepMerger(merger) {
    return function(existing, value, key) 
      {return existing && existing.mergeDeepWith && isIterable(value) ?
        existing.mergeDeepWith(merger, value) :
        merger ? merger(existing, value, key) : value};
  }

  function mergeIntoCollectionWith(collection, merger, iters) {
    iters = iters.filter(function(x ) {return x.size !== 0});
    if (iters.length === 0) {
      return collection;
    }
    if (collection.size === 0 && !collection.__ownerID && iters.length === 1) {
      return collection.constructor(iters[0]);
    }
    return collection.withMutations(function(collection ) {
      var mergeIntoMap = merger ?
        function(value, key)  {
          collection.update(key, NOT_SET, function(existing )
            {return existing === NOT_SET ? value : merger(existing, value, key)}
          );
        } :
        function(value, key)  {
          collection.set(key, value);
        }
      for (var ii = 0; ii < iters.length; ii++) {
        iters[ii].forEach(mergeIntoMap);
      }
    });
  }

  function updateInDeepMap(existing, keyPathIter, notSetValue, updater) {
    var isNotSet = existing === NOT_SET;
    var step = keyPathIter.next();
    if (step.done) {
      var existingValue = isNotSet ? notSetValue : existing;
      var newValue = updater(existingValue);
      return newValue === existingValue ? existing : newValue;
    }
    invariant(
      isNotSet || (existing && existing.set),
      'invalid keyPath'
    );
    var key = step.value;
    var nextExisting = isNotSet ? NOT_SET : existing.get(key, NOT_SET);
    var nextUpdated = updateInDeepMap(
      nextExisting,
      keyPathIter,
      notSetValue,
      updater
    );
    return nextUpdated === nextExisting ? existing :
      nextUpdated === NOT_SET ? existing.remove(key) :
      (isNotSet ? emptyMap() : existing).set(key, nextUpdated);
  }

  function popCount(x) {
    x = x - ((x >> 1) & 0x55555555);
    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
    x = (x + (x >> 4)) & 0x0f0f0f0f;
    x = x + (x >> 8);
    x = x + (x >> 16);
    return x & 0x7f;
  }

  function setIn(array, idx, val, canEdit) {
    var newArray = canEdit ? array : arrCopy(array);
    newArray[idx] = val;
    return newArray;
  }

  function spliceIn(array, idx, val, canEdit) {
    var newLen = array.length + 1;
    if (canEdit && idx + 1 === newLen) {
      array[idx] = val;
      return array;
    }
    var newArray = new Array(newLen);
    var after = 0;
    for (var ii = 0; ii < newLen; ii++) {
      if (ii === idx) {
        newArray[ii] = val;
        after = -1;
      } else {
        newArray[ii] = array[ii + after];
      }
    }
    return newArray;
  }

  function spliceOut(array, idx, canEdit) {
    var newLen = array.length - 1;
    if (canEdit && idx === newLen) {
      array.pop();
      return array;
    }
    var newArray = new Array(newLen);
    var after = 0;
    for (var ii = 0; ii < newLen; ii++) {
      if (ii === idx) {
        after = 1;
      }
      newArray[ii] = array[ii + after];
    }
    return newArray;
  }

  var MAX_ARRAY_MAP_SIZE = SIZE / 4;
  var MAX_BITMAP_INDEXED_SIZE = SIZE / 2;
  var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4;

  createClass(List, IndexedCollection);

    // @pragma Construction

    function List(value) {
      var empty = emptyList();
      if (value === null || value === undefined) {
        return empty;
      }
      if (isList(value)) {
        return value;
      }
      var iter = IndexedIterable(value);
      var size = iter.size;
      if (size === 0) {
        return empty;
      }
      assertNotInfinite(size);
      if (size > 0 && size < SIZE) {
        return makeList(0, size, SHIFT, null, new VNode(iter.toArray()));
      }
      return empty.withMutations(function(list ) {
        list.setSize(size);
        iter.forEach(function(v, i)  {return list.set(i, v)});
      });
    }

    List.of = function(/*...values*/) {
      return this(arguments);
    };

    List.prototype.toString = function() {
      return this.__toString('List [', ']');
    };

    // @pragma Access

    List.prototype.get = function(index, notSetValue) {
      index = wrapIndex(this, index);
      if (index >= 0 && index < this.size) {
        index += this._origin;
        var node = listNodeFor(this, index);
        return node && node.array[index & MASK];
      }
      return notSetValue;
    };

    // @pragma Modification

    List.prototype.set = function(index, value) {
      return updateList(this, index, value);
    };

    List.prototype.remove = function(index) {
      return !this.has(index) ? this :
        index === 0 ? this.shift() :
        index === this.size - 1 ? this.pop() :
        this.splice(index, 1);
    };

    List.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = this._origin = this._capacity = 0;
        this._level = SHIFT;
        this._root = this._tail = null;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return emptyList();
    };

    List.prototype.push = function(/*...values*/) {
      var values = arguments;
      var oldSize = this.size;
      return this.withMutations(function(list ) {
        setListBounds(list, 0, oldSize + values.length);
        for (var ii = 0; ii < values.length; ii++) {
          list.set(oldSize + ii, values[ii]);
        }
      });
    };

    List.prototype.pop = function() {
      return setListBounds(this, 0, -1);
    };

    List.prototype.unshift = function(/*...values*/) {
      var values = arguments;
      return this.withMutations(function(list ) {
        setListBounds(list, -values.length);
        for (var ii = 0; ii < values.length; ii++) {
          list.set(ii, values[ii]);
        }
      });
    };

    List.prototype.shift = function() {
      return setListBounds(this, 1);
    };

    // @pragma Composition

    List.prototype.merge = function(/*...iters*/) {
      return mergeIntoListWith(this, undefined, arguments);
    };

    List.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoListWith(this, merger, iters);
    };

    List.prototype.mergeDeep = function(/*...iters*/) {
      return mergeIntoListWith(this, deepMerger(undefined), arguments);
    };

    List.prototype.mergeDeepWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return mergeIntoListWith(this, deepMerger(merger), iters);
    };

    List.prototype.setSize = function(size) {
      return setListBounds(this, 0, size);
    };

    // @pragma Iteration

    List.prototype.slice = function(begin, end) {
      var size = this.size;
      if (wholeSlice(begin, end, size)) {
        return this;
      }
      return setListBounds(
        this,
        resolveBegin(begin, size),
        resolveEnd(end, size)
      );
    };

    List.prototype.__iterator = function(type, reverse) {
      var index = 0;
      var values = iterateList(this, reverse);
      return new src_Iterator__Iterator(function()  {
        var value = values();
        return value === DONE ?
          iteratorDone() :
          iteratorValue(type, index++, value);
      });
    };

    List.prototype.__iterate = function(fn, reverse) {
      var index = 0;
      var values = iterateList(this, reverse);
      var value;
      while ((value = values()) !== DONE) {
        if (fn(value, index++, this) === false) {
          break;
        }
      }
      return index;
    };

    List.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      if (!ownerID) {
        this.__ownerID = ownerID;
        return this;
      }
      return makeList(this._origin, this._capacity, this._level, this._root, this._tail, ownerID, this.__hash);
    };


  function isList(maybeList) {
    return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
  }

  List.isList = isList;

  var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

  var ListPrototype = List.prototype;
  ListPrototype[IS_LIST_SENTINEL] = true;
  ListPrototype[DELETE] = ListPrototype.remove;
  ListPrototype.setIn = MapPrototype.setIn;
  ListPrototype.deleteIn =
  ListPrototype.removeIn = MapPrototype.removeIn;
  ListPrototype.update = MapPrototype.update;
  ListPrototype.updateIn = MapPrototype.updateIn;
  ListPrototype.mergeIn = MapPrototype.mergeIn;
  ListPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
  ListPrototype.withMutations = MapPrototype.withMutations;
  ListPrototype.asMutable = MapPrototype.asMutable;
  ListPrototype.asImmutable = MapPrototype.asImmutable;
  ListPrototype.wasAltered = MapPrototype.wasAltered;



    function VNode(array, ownerID) {
      this.array = array;
      this.ownerID = ownerID;
    }

    // TODO: seems like these methods are very similar

    VNode.prototype.removeBefore = function(ownerID, level, index) {
      if (index === level ? 1 << level : 0 || this.array.length === 0) {
        return this;
      }
      var originIndex = (index >>> level) & MASK;
      if (originIndex >= this.array.length) {
        return new VNode([], ownerID);
      }
      var removingFirst = originIndex === 0;
      var newChild;
      if (level > 0) {
        var oldChild = this.array[originIndex];
        newChild = oldChild && oldChild.removeBefore(ownerID, level - SHIFT, index);
        if (newChild === oldChild && removingFirst) {
          return this;
        }
      }
      if (removingFirst && !newChild) {
        return this;
      }
      var editable = editableVNode(this, ownerID);
      if (!removingFirst) {
        for (var ii = 0; ii < originIndex; ii++) {
          editable.array[ii] = undefined;
        }
      }
      if (newChild) {
        editable.array[originIndex] = newChild;
      }
      return editable;
    };

    VNode.prototype.removeAfter = function(ownerID, level, index) {
      if (index === (level ? 1 << level : 0) || this.array.length === 0) {
        return this;
      }
      var sizeIndex = ((index - 1) >>> level) & MASK;
      if (sizeIndex >= this.array.length) {
        return this;
      }

      var newChild;
      if (level > 0) {
        var oldChild = this.array[sizeIndex];
        newChild = oldChild && oldChild.removeAfter(ownerID, level - SHIFT, index);
        if (newChild === oldChild && sizeIndex === this.array.length - 1) {
          return this;
        }
      }

      var editable = editableVNode(this, ownerID);
      editable.array.splice(sizeIndex + 1);
      if (newChild) {
        editable.array[sizeIndex] = newChild;
      }
      return editable;
    };



  var DONE = {};

  function iterateList(list, reverse) {
    var left = list._origin;
    var right = list._capacity;
    var tailPos = getTailOffset(right);
    var tail = list._tail;

    return iterateNodeOrLeaf(list._root, list._level, 0);

    function iterateNodeOrLeaf(node, level, offset) {
      return level === 0 ?
        iterateLeaf(node, offset) :
        iterateNode(node, level, offset);
    }

    function iterateLeaf(node, offset) {
      var array = offset === tailPos ? tail && tail.array : node && node.array;
      var from = offset > left ? 0 : left - offset;
      var to = right - offset;
      if (to > SIZE) {
        to = SIZE;
      }
      return function()  {
        if (from === to) {
          return DONE;
        }
        var idx = reverse ? --to : from++;
        return array && array[idx];
      };
    }

    function iterateNode(node, level, offset) {
      var values;
      var array = node && node.array;
      var from = offset > left ? 0 : (left - offset) >> level;
      var to = ((right - offset) >> level) + 1;
      if (to > SIZE) {
        to = SIZE;
      }
      return function()  {
        do {
          if (values) {
            var value = values();
            if (value !== DONE) {
              return value;
            }
            values = null;
          }
          if (from === to) {
            return DONE;
          }
          var idx = reverse ? --to : from++;
          values = iterateNodeOrLeaf(
            array && array[idx], level - SHIFT, offset + (idx << level)
          );
        } while (true);
      };
    }
  }

  function makeList(origin, capacity, level, root, tail, ownerID, hash) {
    var list = Object.create(ListPrototype);
    list.size = capacity - origin;
    list._origin = origin;
    list._capacity = capacity;
    list._level = level;
    list._root = root;
    list._tail = tail;
    list.__ownerID = ownerID;
    list.__hash = hash;
    list.__altered = false;
    return list;
  }

  var EMPTY_LIST;
  function emptyList() {
    return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, SHIFT));
  }

  function updateList(list, index, value) {
    index = wrapIndex(list, index);

    if (index !== index) {
      return list;
    }

    if (index >= list.size || index < 0) {
      return list.withMutations(function(list ) {
        index < 0 ?
          setListBounds(list, index).set(0, value) :
          setListBounds(list, 0, index + 1).set(index, value)
      });
    }

    index += list._origin;

    var newTail = list._tail;
    var newRoot = list._root;
    var didAlter = MakeRef(DID_ALTER);
    if (index >= getTailOffset(list._capacity)) {
      newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter);
    } else {
      newRoot = updateVNode(newRoot, list.__ownerID, list._level, index, value, didAlter);
    }

    if (!didAlter.value) {
      return list;
    }

    if (list.__ownerID) {
      list._root = newRoot;
      list._tail = newTail;
      list.__hash = undefined;
      list.__altered = true;
      return list;
    }
    return makeList(list._origin, list._capacity, list._level, newRoot, newTail);
  }

  function updateVNode(node, ownerID, level, index, value, didAlter) {
    var idx = (index >>> level) & MASK;
    var nodeHas = node && idx < node.array.length;
    if (!nodeHas && value === undefined) {
      return node;
    }

    var newNode;

    if (level > 0) {
      var lowerNode = node && node.array[idx];
      var newLowerNode = updateVNode(lowerNode, ownerID, level - SHIFT, index, value, didAlter);
      if (newLowerNode === lowerNode) {
        return node;
      }
      newNode = editableVNode(node, ownerID);
      newNode.array[idx] = newLowerNode;
      return newNode;
    }

    if (nodeHas && node.array[idx] === value) {
      return node;
    }

    SetRef(didAlter);

    newNode = editableVNode(node, ownerID);
    if (value === undefined && idx === newNode.array.length - 1) {
      newNode.array.pop();
    } else {
      newNode.array[idx] = value;
    }
    return newNode;
  }

  function editableVNode(node, ownerID) {
    if (ownerID && node && ownerID === node.ownerID) {
      return node;
    }
    return new VNode(node ? node.array.slice() : [], ownerID);
  }

  function listNodeFor(list, rawIndex) {
    if (rawIndex >= getTailOffset(list._capacity)) {
      return list._tail;
    }
    if (rawIndex < 1 << (list._level + SHIFT)) {
      var node = list._root;
      var level = list._level;
      while (node && level > 0) {
        node = node.array[(rawIndex >>> level) & MASK];
        level -= SHIFT;
      }
      return node;
    }
  }

  function setListBounds(list, begin, end) {
    // Sanitize begin & end using this shorthand for ToInt32(argument)
    // http://www.ecma-international.org/ecma-262/6.0/#sec-toint32
    if (begin !== undefined) {
      begin = begin | 0;
    }
    if (end !== undefined) {
      end = end | 0;
    }
    var owner = list.__ownerID || new OwnerID();
    var oldOrigin = list._origin;
    var oldCapacity = list._capacity;
    var newOrigin = oldOrigin + begin;
    var newCapacity = end === undefined ? oldCapacity : end < 0 ? oldCapacity + end : oldOrigin + end;
    if (newOrigin === oldOrigin && newCapacity === oldCapacity) {
      return list;
    }

    // If it's going to end after it starts, it's empty.
    if (newOrigin >= newCapacity) {
      return list.clear();
    }

    var newLevel = list._level;
    var newRoot = list._root;

    // New origin might need creating a higher root.
    var offsetShift = 0;
    while (newOrigin + offsetShift < 0) {
      newRoot = new VNode(newRoot && newRoot.array.length ? [undefined, newRoot] : [], owner);
      newLevel += SHIFT;
      offsetShift += 1 << newLevel;
    }
    if (offsetShift) {
      newOrigin += offsetShift;
      oldOrigin += offsetShift;
      newCapacity += offsetShift;
      oldCapacity += offsetShift;
    }

    var oldTailOffset = getTailOffset(oldCapacity);
    var newTailOffset = getTailOffset(newCapacity);

    // New size might need creating a higher root.
    while (newTailOffset >= 1 << (newLevel + SHIFT)) {
      newRoot = new VNode(newRoot && newRoot.array.length ? [newRoot] : [], owner);
      newLevel += SHIFT;
    }

    // Locate or create the new tail.
    var oldTail = list._tail;
    var newTail = newTailOffset < oldTailOffset ?
      listNodeFor(list, newCapacity - 1) :
      newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail;

    // Merge Tail into tree.
    if (oldTail && newTailOffset > oldTailOffset && newOrigin < oldCapacity && oldTail.array.length) {
      newRoot = editableVNode(newRoot, owner);
      var node = newRoot;
      for (var level = newLevel; level > SHIFT; level -= SHIFT) {
        var idx = (oldTailOffset >>> level) & MASK;
        node = node.array[idx] = editableVNode(node.array[idx], owner);
      }
      node.array[(oldTailOffset >>> SHIFT) & MASK] = oldTail;
    }

    // If the size has been reduced, there's a chance the tail needs to be trimmed.
    if (newCapacity < oldCapacity) {
      newTail = newTail && newTail.removeAfter(owner, 0, newCapacity);
    }

    // If the new origin is within the tail, then we do not need a root.
    if (newOrigin >= newTailOffset) {
      newOrigin -= newTailOffset;
      newCapacity -= newTailOffset;
      newLevel = SHIFT;
      newRoot = null;
      newTail = newTail && newTail.removeBefore(owner, 0, newOrigin);

    // Otherwise, if the root has been trimmed, garbage collect.
    } else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
      offsetShift = 0;

      // Identify the new top root node of the subtree of the old root.
      while (newRoot) {
        var beginIndex = (newOrigin >>> newLevel) & MASK;
        if (beginIndex !== (newTailOffset >>> newLevel) & MASK) {
          break;
        }
        if (beginIndex) {
          offsetShift += (1 << newLevel) * beginIndex;
        }
        newLevel -= SHIFT;
        newRoot = newRoot.array[beginIndex];
      }

      // Trim the new sides of the new root.
      if (newRoot && newOrigin > oldOrigin) {
        newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift);
      }
      if (newRoot && newTailOffset < oldTailOffset) {
        newRoot = newRoot.removeAfter(owner, newLevel, newTailOffset - offsetShift);
      }
      if (offsetShift) {
        newOrigin -= offsetShift;
        newCapacity -= offsetShift;
      }
    }

    if (list.__ownerID) {
      list.size = newCapacity - newOrigin;
      list._origin = newOrigin;
      list._capacity = newCapacity;
      list._level = newLevel;
      list._root = newRoot;
      list._tail = newTail;
      list.__hash = undefined;
      list.__altered = true;
      return list;
    }
    return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail);
  }

  function mergeIntoListWith(list, merger, iterables) {
    var iters = [];
    var maxSize = 0;
    for (var ii = 0; ii < iterables.length; ii++) {
      var value = iterables[ii];
      var iter = IndexedIterable(value);
      if (iter.size > maxSize) {
        maxSize = iter.size;
      }
      if (!isIterable(value)) {
        iter = iter.map(function(v ) {return fromJS(v)});
      }
      iters.push(iter);
    }
    if (maxSize > list.size) {
      list = list.setSize(maxSize);
    }
    return mergeIntoCollectionWith(list, merger, iters);
  }

  function getTailOffset(size) {
    return size < SIZE ? 0 : (((size - 1) >>> SHIFT) << SHIFT);
  }

  createClass(OrderedMap, src_Map__Map);

    // @pragma Construction

    function OrderedMap(value) {
      return value === null || value === undefined ? emptyOrderedMap() :
        isOrderedMap(value) ? value :
        emptyOrderedMap().withMutations(function(map ) {
          var iter = KeyedIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v, k)  {return map.set(k, v)});
        });
    }

    OrderedMap.of = function(/*...values*/) {
      return this(arguments);
    };

    OrderedMap.prototype.toString = function() {
      return this.__toString('OrderedMap {', '}');
    };

    // @pragma Access

    OrderedMap.prototype.get = function(k, notSetValue) {
      var index = this._map.get(k);
      return index !== undefined ? this._list.get(index)[1] : notSetValue;
    };

    // @pragma Modification

    OrderedMap.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = 0;
        this._map.clear();
        this._list.clear();
        return this;
      }
      return emptyOrderedMap();
    };

    OrderedMap.prototype.set = function(k, v) {
      return updateOrderedMap(this, k, v);
    };

    OrderedMap.prototype.remove = function(k) {
      return updateOrderedMap(this, k, NOT_SET);
    };

    OrderedMap.prototype.wasAltered = function() {
      return this._map.wasAltered() || this._list.wasAltered();
    };

    OrderedMap.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._list.__iterate(
        function(entry ) {return entry && fn(entry[1], entry[0], this$0)},
        reverse
      );
    };

    OrderedMap.prototype.__iterator = function(type, reverse) {
      return this._list.fromEntrySeq().__iterator(type, reverse);
    };

    OrderedMap.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      var newMap = this._map.__ensureOwner(ownerID);
      var newList = this._list.__ensureOwner(ownerID);
      if (!ownerID) {
        this.__ownerID = ownerID;
        this._map = newMap;
        this._list = newList;
        return this;
      }
      return makeOrderedMap(newMap, newList, ownerID, this.__hash);
    };


  function isOrderedMap(maybeOrderedMap) {
    return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
  }

  OrderedMap.isOrderedMap = isOrderedMap;

  OrderedMap.prototype[IS_ORDERED_SENTINEL] = true;
  OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove;



  function makeOrderedMap(map, list, ownerID, hash) {
    var omap = Object.create(OrderedMap.prototype);
    omap.size = map ? map.size : 0;
    omap._map = map;
    omap._list = list;
    omap.__ownerID = ownerID;
    omap.__hash = hash;
    return omap;
  }

  var EMPTY_ORDERED_MAP;
  function emptyOrderedMap() {
    return EMPTY_ORDERED_MAP || (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()));
  }

  function updateOrderedMap(omap, k, v) {
    var map = omap._map;
    var list = omap._list;
    var i = map.get(k);
    var has = i !== undefined;
    var newMap;
    var newList;
    if (v === NOT_SET) { // removed
      if (!has) {
        return omap;
      }
      if (list.size >= SIZE && list.size >= map.size * 2) {
        newList = list.filter(function(entry, idx)  {return entry !== undefined && i !== idx});
        newMap = newList.toKeyedSeq().map(function(entry ) {return entry[0]}).flip().toMap();
        if (omap.__ownerID) {
          newMap.__ownerID = newList.__ownerID = omap.__ownerID;
        }
      } else {
        newMap = map.remove(k);
        newList = i === list.size - 1 ? list.pop() : list.set(i, undefined);
      }
    } else {
      if (has) {
        if (v === list.get(i)[1]) {
          return omap;
        }
        newMap = map;
        newList = list.set(i, [k, v]);
      } else {
        newMap = map.set(k, list.size);
        newList = list.set(list.size, [k, v]);
      }
    }
    if (omap.__ownerID) {
      omap.size = newMap.size;
      omap._map = newMap;
      omap._list = newList;
      omap.__hash = undefined;
      return omap;
    }
    return makeOrderedMap(newMap, newList);
  }

  createClass(Stack, IndexedCollection);

    // @pragma Construction

    function Stack(value) {
      return value === null || value === undefined ? emptyStack() :
        isStack(value) ? value :
        emptyStack().unshiftAll(value);
    }

    Stack.of = function(/*...values*/) {
      return this(arguments);
    };

    Stack.prototype.toString = function() {
      return this.__toString('Stack [', ']');
    };

    // @pragma Access

    Stack.prototype.get = function(index, notSetValue) {
      var head = this._head;
      index = wrapIndex(this, index);
      while (head && index--) {
        head = head.next;
      }
      return head ? head.value : notSetValue;
    };

    Stack.prototype.peek = function() {
      return this._head && this._head.value;
    };

    // @pragma Modification

    Stack.prototype.push = function(/*...values*/) {
      if (arguments.length === 0) {
        return this;
      }
      var newSize = this.size + arguments.length;
      var head = this._head;
      for (var ii = arguments.length - 1; ii >= 0; ii--) {
        head = {
          value: arguments[ii],
          next: head
        };
      }
      if (this.__ownerID) {
        this.size = newSize;
        this._head = head;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return makeStack(newSize, head);
    };

    Stack.prototype.pushAll = function(iter) {
      iter = IndexedIterable(iter);
      if (iter.size === 0) {
        return this;
      }
      assertNotInfinite(iter.size);
      var newSize = this.size;
      var head = this._head;
      iter.reverse().forEach(function(value ) {
        newSize++;
        head = {
          value: value,
          next: head
        };
      });
      if (this.__ownerID) {
        this.size = newSize;
        this._head = head;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return makeStack(newSize, head);
    };

    Stack.prototype.pop = function() {
      return this.slice(1);
    };

    Stack.prototype.unshift = function(/*...values*/) {
      return this.push.apply(this, arguments);
    };

    Stack.prototype.unshiftAll = function(iter) {
      return this.pushAll(iter);
    };

    Stack.prototype.shift = function() {
      return this.pop.apply(this, arguments);
    };

    Stack.prototype.clear = function() {
      if (this.size === 0) {
        return this;
      }
      if (this.__ownerID) {
        this.size = 0;
        this._head = undefined;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return emptyStack();
    };

    Stack.prototype.slice = function(begin, end) {
      if (wholeSlice(begin, end, this.size)) {
        return this;
      }
      var resolvedBegin = resolveBegin(begin, this.size);
      var resolvedEnd = resolveEnd(end, this.size);
      if (resolvedEnd !== this.size) {
        // super.slice(begin, end);
        return IndexedCollection.prototype.slice.call(this, begin, end);
      }
      var newSize = this.size - resolvedBegin;
      var head = this._head;
      while (resolvedBegin--) {
        head = head.next;
      }
      if (this.__ownerID) {
        this.size = newSize;
        this._head = head;
        this.__hash = undefined;
        this.__altered = true;
        return this;
      }
      return makeStack(newSize, head);
    };

    // @pragma Mutability

    Stack.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      if (!ownerID) {
        this.__ownerID = ownerID;
        this.__altered = false;
        return this;
      }
      return makeStack(this.size, this._head, ownerID, this.__hash);
    };

    // @pragma Iteration

    Stack.prototype.__iterate = function(fn, reverse) {
      if (reverse) {
        return this.reverse().__iterate(fn);
      }
      var iterations = 0;
      var node = this._head;
      while (node) {
        if (fn(node.value, iterations++, this) === false) {
          break;
        }
        node = node.next;
      }
      return iterations;
    };

    Stack.prototype.__iterator = function(type, reverse) {
      if (reverse) {
        return this.reverse().__iterator(type);
      }
      var iterations = 0;
      var node = this._head;
      return new src_Iterator__Iterator(function()  {
        if (node) {
          var value = node.value;
          node = node.next;
          return iteratorValue(type, iterations++, value);
        }
        return iteratorDone();
      });
    };


  function isStack(maybeStack) {
    return !!(maybeStack && maybeStack[IS_STACK_SENTINEL]);
  }

  Stack.isStack = isStack;

  var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

  var StackPrototype = Stack.prototype;
  StackPrototype[IS_STACK_SENTINEL] = true;
  StackPrototype.withMutations = MapPrototype.withMutations;
  StackPrototype.asMutable = MapPrototype.asMutable;
  StackPrototype.asImmutable = MapPrototype.asImmutable;
  StackPrototype.wasAltered = MapPrototype.wasAltered;


  function makeStack(size, head, ownerID, hash) {
    var map = Object.create(StackPrototype);
    map.size = size;
    map._head = head;
    map.__ownerID = ownerID;
    map.__hash = hash;
    map.__altered = false;
    return map;
  }

  var EMPTY_STACK;
  function emptyStack() {
    return EMPTY_STACK || (EMPTY_STACK = makeStack(0));
  }

  createClass(src_Set__Set, SetCollection);

    // @pragma Construction

    function src_Set__Set(value) {
      return value === null || value === undefined ? emptySet() :
        isSet(value) && !isOrdered(value) ? value :
        emptySet().withMutations(function(set ) {
          var iter = SetIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v ) {return set.add(v)});
        });
    }

    src_Set__Set.of = function(/*...values*/) {
      return this(arguments);
    };

    src_Set__Set.fromKeys = function(value) {
      return this(KeyedIterable(value).keySeq());
    };

    src_Set__Set.prototype.toString = function() {
      return this.__toString('Set {', '}');
    };

    // @pragma Access

    src_Set__Set.prototype.has = function(value) {
      return this._map.has(value);
    };

    // @pragma Modification

    src_Set__Set.prototype.add = function(value) {
      return updateSet(this, this._map.set(value, true));
    };

    src_Set__Set.prototype.remove = function(value) {
      return updateSet(this, this._map.remove(value));
    };

    src_Set__Set.prototype.clear = function() {
      return updateSet(this, this._map.clear());
    };

    // @pragma Composition

    src_Set__Set.prototype.union = function() {var iters = SLICE$0.call(arguments, 0);
      iters = iters.filter(function(x ) {return x.size !== 0});
      if (iters.length === 0) {
        return this;
      }
      if (this.size === 0 && !this.__ownerID && iters.length === 1) {
        return this.constructor(iters[0]);
      }
      return this.withMutations(function(set ) {
        for (var ii = 0; ii < iters.length; ii++) {
          SetIterable(iters[ii]).forEach(function(value ) {return set.add(value)});
        }
      });
    };

    src_Set__Set.prototype.intersect = function() {var iters = SLICE$0.call(arguments, 0);
      if (iters.length === 0) {
        return this;
      }
      iters = iters.map(function(iter ) {return SetIterable(iter)});
      var originalSet = this;
      return this.withMutations(function(set ) {
        originalSet.forEach(function(value ) {
          if (!iters.every(function(iter ) {return iter.includes(value)})) {
            set.remove(value);
          }
        });
      });
    };

    src_Set__Set.prototype.subtract = function() {var iters = SLICE$0.call(arguments, 0);
      if (iters.length === 0) {
        return this;
      }
      iters = iters.map(function(iter ) {return SetIterable(iter)});
      var originalSet = this;
      return this.withMutations(function(set ) {
        originalSet.forEach(function(value ) {
          if (iters.some(function(iter ) {return iter.includes(value)})) {
            set.remove(value);
          }
        });
      });
    };

    src_Set__Set.prototype.merge = function() {
      return this.union.apply(this, arguments);
    };

    src_Set__Set.prototype.mergeWith = function(merger) {var iters = SLICE$0.call(arguments, 1);
      return this.union.apply(this, iters);
    };

    src_Set__Set.prototype.sort = function(comparator) {
      // Late binding
      return OrderedSet(sortFactory(this, comparator));
    };

    src_Set__Set.prototype.sortBy = function(mapper, comparator) {
      // Late binding
      return OrderedSet(sortFactory(this, comparator, mapper));
    };

    src_Set__Set.prototype.wasAltered = function() {
      return this._map.wasAltered();
    };

    src_Set__Set.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return this._map.__iterate(function(_, k)  {return fn(k, k, this$0)}, reverse);
    };

    src_Set__Set.prototype.__iterator = function(type, reverse) {
      return this._map.map(function(_, k)  {return k}).__iterator(type, reverse);
    };

    src_Set__Set.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      var newMap = this._map.__ensureOwner(ownerID);
      if (!ownerID) {
        this.__ownerID = ownerID;
        this._map = newMap;
        return this;
      }
      return this.__make(newMap, ownerID);
    };


  function isSet(maybeSet) {
    return !!(maybeSet && maybeSet[IS_SET_SENTINEL]);
  }

  src_Set__Set.isSet = isSet;

  var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';

  var SetPrototype = src_Set__Set.prototype;
  SetPrototype[IS_SET_SENTINEL] = true;
  SetPrototype[DELETE] = SetPrototype.remove;
  SetPrototype.mergeDeep = SetPrototype.merge;
  SetPrototype.mergeDeepWith = SetPrototype.mergeWith;
  SetPrototype.withMutations = MapPrototype.withMutations;
  SetPrototype.asMutable = MapPrototype.asMutable;
  SetPrototype.asImmutable = MapPrototype.asImmutable;

  SetPrototype.__empty = emptySet;
  SetPrototype.__make = makeSet;

  function updateSet(set, newMap) {
    if (set.__ownerID) {
      set.size = newMap.size;
      set._map = newMap;
      return set;
    }
    return newMap === set._map ? set :
      newMap.size === 0 ? set.__empty() :
      set.__make(newMap);
  }

  function makeSet(map, ownerID) {
    var set = Object.create(SetPrototype);
    set.size = map ? map.size : 0;
    set._map = map;
    set.__ownerID = ownerID;
    return set;
  }

  var EMPTY_SET;
  function emptySet() {
    return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()));
  }

  createClass(OrderedSet, src_Set__Set);

    // @pragma Construction

    function OrderedSet(value) {
      return value === null || value === undefined ? emptyOrderedSet() :
        isOrderedSet(value) ? value :
        emptyOrderedSet().withMutations(function(set ) {
          var iter = SetIterable(value);
          assertNotInfinite(iter.size);
          iter.forEach(function(v ) {return set.add(v)});
        });
    }

    OrderedSet.of = function(/*...values*/) {
      return this(arguments);
    };

    OrderedSet.fromKeys = function(value) {
      return this(KeyedIterable(value).keySeq());
    };

    OrderedSet.prototype.toString = function() {
      return this.__toString('OrderedSet {', '}');
    };


  function isOrderedSet(maybeOrderedSet) {
    return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
  }

  OrderedSet.isOrderedSet = isOrderedSet;

  var OrderedSetPrototype = OrderedSet.prototype;
  OrderedSetPrototype[IS_ORDERED_SENTINEL] = true;

  OrderedSetPrototype.__empty = emptyOrderedSet;
  OrderedSetPrototype.__make = makeOrderedSet;

  function makeOrderedSet(map, ownerID) {
    var set = Object.create(OrderedSetPrototype);
    set.size = map ? map.size : 0;
    set._map = map;
    set.__ownerID = ownerID;
    return set;
  }

  var EMPTY_ORDERED_SET;
  function emptyOrderedSet() {
    return EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()));
  }

  createClass(Record, KeyedCollection);

    function Record(defaultValues, name) {
      var hasInitialized;

      var RecordType = function Record(values) {
        if (values instanceof RecordType) {
          return values;
        }
        if (!(this instanceof RecordType)) {
          return new RecordType(values);
        }
        if (!hasInitialized) {
          hasInitialized = true;
          var keys = Object.keys(defaultValues);
          setProps(RecordTypePrototype, keys);
          RecordTypePrototype.size = keys.length;
          RecordTypePrototype._name = name;
          RecordTypePrototype._keys = keys;
          RecordTypePrototype._defaultValues = defaultValues;
        }
        this._map = src_Map__Map(values);
      };

      var RecordTypePrototype = RecordType.prototype = Object.create(RecordPrototype);
      RecordTypePrototype.constructor = RecordType;

      return RecordType;
    }

    Record.prototype.toString = function() {
      return this.__toString(recordName(this) + ' {', '}');
    };

    // @pragma Access

    Record.prototype.has = function(k) {
      return this._defaultValues.hasOwnProperty(k);
    };

    Record.prototype.get = function(k, notSetValue) {
      if (!this.has(k)) {
        return notSetValue;
      }
      var defaultVal = this._defaultValues[k];
      return this._map ? this._map.get(k, defaultVal) : defaultVal;
    };

    // @pragma Modification

    Record.prototype.clear = function() {
      if (this.__ownerID) {
        this._map && this._map.clear();
        return this;
      }
      var RecordType = this.constructor;
      return RecordType._empty || (RecordType._empty = makeRecord(this, emptyMap()));
    };

    Record.prototype.set = function(k, v) {
      if (!this.has(k)) {
        throw new Error('Cannot set unknown key "' + k + '" on ' + recordName(this));
      }
      var newMap = this._map && this._map.set(k, v);
      if (this.__ownerID || newMap === this._map) {
        return this;
      }
      return makeRecord(this, newMap);
    };

    Record.prototype.remove = function(k) {
      if (!this.has(k)) {
        return this;
      }
      var newMap = this._map && this._map.remove(k);
      if (this.__ownerID || newMap === this._map) {
        return this;
      }
      return makeRecord(this, newMap);
    };

    Record.prototype.wasAltered = function() {
      return this._map.wasAltered();
    };

    Record.prototype.__iterator = function(type, reverse) {var this$0 = this;
      return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterator(type, reverse);
    };

    Record.prototype.__iterate = function(fn, reverse) {var this$0 = this;
      return KeyedIterable(this._defaultValues).map(function(_, k)  {return this$0.get(k)}).__iterate(fn, reverse);
    };

    Record.prototype.__ensureOwner = function(ownerID) {
      if (ownerID === this.__ownerID) {
        return this;
      }
      var newMap = this._map && this._map.__ensureOwner(ownerID);
      if (!ownerID) {
        this.__ownerID = ownerID;
        this._map = newMap;
        return this;
      }
      return makeRecord(this, newMap, ownerID);
    };


  var RecordPrototype = Record.prototype;
  RecordPrototype[DELETE] = RecordPrototype.remove;
  RecordPrototype.deleteIn =
  RecordPrototype.removeIn = MapPrototype.removeIn;
  RecordPrototype.merge = MapPrototype.merge;
  RecordPrototype.mergeWith = MapPrototype.mergeWith;
  RecordPrototype.mergeIn = MapPrototype.mergeIn;
  RecordPrototype.mergeDeep = MapPrototype.mergeDeep;
  RecordPrototype.mergeDeepWith = MapPrototype.mergeDeepWith;
  RecordPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
  RecordPrototype.setIn = MapPrototype.setIn;
  RecordPrototype.update = MapPrototype.update;
  RecordPrototype.updateIn = MapPrototype.updateIn;
  RecordPrototype.withMutations = MapPrototype.withMutations;
  RecordPrototype.asMutable = MapPrototype.asMutable;
  RecordPrototype.asImmutable = MapPrototype.asImmutable;


  function makeRecord(likeRecord, map, ownerID) {
    var record = Object.create(Object.getPrototypeOf(likeRecord));
    record._map = map;
    record.__ownerID = ownerID;
    return record;
  }

  function recordName(record) {
    return record._name || record.constructor.name || 'Record';
  }

  function setProps(prototype, names) {
    try {
      names.forEach(setProp.bind(undefined, prototype));
    } catch (error) {
      // Object.defineProperty failed. Probably IE8.
    }
  }

  function setProp(prototype, name) {
    Object.defineProperty(prototype, name, {
      get: function() {
        return this.get(name);
      },
      set: function(value) {
        invariant(this.__ownerID, 'Cannot set on an immutable record.');
        this.set(name, value);
      }
    });
  }

  function deepEqual(a, b) {
    if (a === b) {
      return true;
    }

    if (
      !isIterable(b) ||
      a.size !== undefined && b.size !== undefined && a.size !== b.size ||
      a.__hash !== undefined && b.__hash !== undefined && a.__hash !== b.__hash ||
      isKeyed(a) !== isKeyed(b) ||
      isIndexed(a) !== isIndexed(b) ||
      isOrdered(a) !== isOrdered(b)
    ) {
      return false;
    }

    if (a.size === 0 && b.size === 0) {
      return true;
    }

    var notAssociative = !isAssociative(a);

    if (isOrdered(a)) {
      var entries = a.entries();
      return b.every(function(v, k)  {
        var entry = entries.next().value;
        return entry && is(entry[1], v) && (notAssociative || is(entry[0], k));
      }) && entries.next().done;
    }

    var flipped = false;

    if (a.size === undefined) {
      if (b.size === undefined) {
        if (typeof a.cacheResult === 'function') {
          a.cacheResult();
        }
      } else {
        flipped = true;
        var _ = a;
        a = b;
        b = _;
      }
    }

    var allEqual = true;
    var bSize = b.__iterate(function(v, k)  {
      if (notAssociative ? !a.has(v) :
          flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)) {
        allEqual = false;
        return false;
      }
    });

    return allEqual && a.size === bSize;
  }

  createClass(Range, IndexedSeq);

    function Range(start, end, step) {
      if (!(this instanceof Range)) {
        return new Range(start, end, step);
      }
      invariant(step !== 0, 'Cannot step a Range by 0');
      start = start || 0;
      if (end === undefined) {
        end = Infinity;
      }
      step = step === undefined ? 1 : Math.abs(step);
      if (end < start) {
        step = -step;
      }
      this._start = start;
      this._end = end;
      this._step = step;
      this.size = Math.max(0, Math.ceil((end - start) / step - 1) + 1);
      if (this.size === 0) {
        if (EMPTY_RANGE) {
          return EMPTY_RANGE;
        }
        EMPTY_RANGE = this;
      }
    }

    Range.prototype.toString = function() {
      if (this.size === 0) {
        return 'Range []';
      }
      return 'Range [ ' +
        this._start + '...' + this._end +
        (this._step > 1 ? ' by ' + this._step : '') +
      ' ]';
    };

    Range.prototype.get = function(index, notSetValue) {
      return this.has(index) ?
        this._start + wrapIndex(this, index) * this._step :
        notSetValue;
    };

    Range.prototype.includes = function(searchValue) {
      var possibleIndex = (searchValue - this._start) / this._step;
      return possibleIndex >= 0 &&
        possibleIndex < this.size &&
        possibleIndex === Math.floor(possibleIndex);
    };

    Range.prototype.slice = function(begin, end) {
      if (wholeSlice(begin, end, this.size)) {
        return this;
      }
      begin = resolveBegin(begin, this.size);
      end = resolveEnd(end, this.size);
      if (end <= begin) {
        return new Range(0, 0);
      }
      return new Range(this.get(begin, this._end), this.get(end, this._end), this._step);
    };

    Range.prototype.indexOf = function(searchValue) {
      var offsetValue = searchValue - this._start;
      if (offsetValue % this._step === 0) {
        var index = offsetValue / this._step;
        if (index >= 0 && index < this.size) {
          return index
        }
      }
      return -1;
    };

    Range.prototype.lastIndexOf = function(searchValue) {
      return this.indexOf(searchValue);
    };

    Range.prototype.__iterate = function(fn, reverse) {
      var maxIndex = this.size - 1;
      var step = this._step;
      var value = reverse ? this._start + maxIndex * step : this._start;
      for (var ii = 0; ii <= maxIndex; ii++) {
        if (fn(value, ii, this) === false) {
          return ii + 1;
        }
        value += reverse ? -step : step;
      }
      return ii;
    };

    Range.prototype.__iterator = function(type, reverse) {
      var maxIndex = this.size - 1;
      var step = this._step;
      var value = reverse ? this._start + maxIndex * step : this._start;
      var ii = 0;
      return new src_Iterator__Iterator(function()  {
        var v = value;
        value += reverse ? -step : step;
        return ii > maxIndex ? iteratorDone() : iteratorValue(type, ii++, v);
      });
    };

    Range.prototype.equals = function(other) {
      return other instanceof Range ?
        this._start === other._start &&
        this._end === other._end &&
        this._step === other._step :
        deepEqual(this, other);
    };


  var EMPTY_RANGE;

  createClass(Repeat, IndexedSeq);

    function Repeat(value, times) {
      if (!(this instanceof Repeat)) {
        return new Repeat(value, times);
      }
      this._value = value;
      this.size = times === undefined ? Infinity : Math.max(0, times);
      if (this.size === 0) {
        if (EMPTY_REPEAT) {
          return EMPTY_REPEAT;
        }
        EMPTY_REPEAT = this;
      }
    }

    Repeat.prototype.toString = function() {
      if (this.size === 0) {
        return 'Repeat []';
      }
      return 'Repeat [ ' + this._value + ' ' + this.size + ' times ]';
    };

    Repeat.prototype.get = function(index, notSetValue) {
      return this.has(index) ? this._value : notSetValue;
    };

    Repeat.prototype.includes = function(searchValue) {
      return is(this._value, searchValue);
    };

    Repeat.prototype.slice = function(begin, end) {
      var size = this.size;
      return wholeSlice(begin, end, size) ? this :
        new Repeat(this._value, resolveEnd(end, size) - resolveBegin(begin, size));
    };

    Repeat.prototype.reverse = function() {
      return this;
    };

    Repeat.prototype.indexOf = function(searchValue) {
      if (is(this._value, searchValue)) {
        return 0;
      }
      return -1;
    };

    Repeat.prototype.lastIndexOf = function(searchValue) {
      if (is(this._value, searchValue)) {
        return this.size;
      }
      return -1;
    };

    Repeat.prototype.__iterate = function(fn, reverse) {
      for (var ii = 0; ii < this.size; ii++) {
        if (fn(this._value, ii, this) === false) {
          return ii + 1;
        }
      }
      return ii;
    };

    Repeat.prototype.__iterator = function(type, reverse) {var this$0 = this;
      var ii = 0;
      return new src_Iterator__Iterator(function() 
        {return ii < this$0.size ? iteratorValue(type, ii++, this$0._value) : iteratorDone()}
      );
    };

    Repeat.prototype.equals = function(other) {
      return other instanceof Repeat ?
        is(this._value, other._value) :
        deepEqual(other);
    };


  var EMPTY_REPEAT;

  /**
   * Contributes additional methods to a constructor
   */
  function mixin(ctor, methods) {
    var keyCopier = function(key ) { ctor.prototype[key] = methods[key]; };
    Object.keys(methods).forEach(keyCopier);
    Object.getOwnPropertySymbols &&
      Object.getOwnPropertySymbols(methods).forEach(keyCopier);
    return ctor;
  }

  Iterable.Iterator = src_Iterator__Iterator;

  mixin(Iterable, {

    // ### Conversion to other types

    toArray: function() {
      assertNotInfinite(this.size);
      var array = new Array(this.size || 0);
      this.valueSeq().__iterate(function(v, i)  { array[i] = v; });
      return array;
    },

    toIndexedSeq: function() {
      return new ToIndexedSequence(this);
    },

    toJS: function() {
      return this.toSeq().map(
        function(value ) {return value && typeof value.toJS === 'function' ? value.toJS() : value}
      ).__toJS();
    },

    toJSON: function() {
      return this.toSeq().map(
        function(value ) {return value && typeof value.toJSON === 'function' ? value.toJSON() : value}
      ).__toJS();
    },

    toKeyedSeq: function() {
      return new ToKeyedSequence(this, true);
    },

    toMap: function() {
      // Use Late Binding here to solve the circular dependency.
      return src_Map__Map(this.toKeyedSeq());
    },

    toObject: function() {
      assertNotInfinite(this.size);
      var object = {};
      this.__iterate(function(v, k)  { object[k] = v; });
      return object;
    },

    toOrderedMap: function() {
      // Use Late Binding here to solve the circular dependency.
      return OrderedMap(this.toKeyedSeq());
    },

    toOrderedSet: function() {
      // Use Late Binding here to solve the circular dependency.
      return OrderedSet(isKeyed(this) ? this.valueSeq() : this);
    },

    toSet: function() {
      // Use Late Binding here to solve the circular dependency.
      return src_Set__Set(isKeyed(this) ? this.valueSeq() : this);
    },

    toSetSeq: function() {
      return new ToSetSequence(this);
    },

    toSeq: function() {
      return isIndexed(this) ? this.toIndexedSeq() :
        isKeyed(this) ? this.toKeyedSeq() :
        this.toSetSeq();
    },

    toStack: function() {
      // Use Late Binding here to solve the circular dependency.
      return Stack(isKeyed(this) ? this.valueSeq() : this);
    },

    toList: function() {
      // Use Late Binding here to solve the circular dependency.
      return List(isKeyed(this) ? this.valueSeq() : this);
    },


    // ### Common JavaScript methods and properties

    toString: function() {
      return '[Iterable]';
    },

    __toString: function(head, tail) {
      if (this.size === 0) {
        return head + tail;
      }
      return head + ' ' + this.toSeq().map(this.__toStringMapper).join(', ') + ' ' + tail;
    },


    // ### ES6 Collection methods (ES6 Array and Map)

    concat: function() {var values = SLICE$0.call(arguments, 0);
      return reify(this, concatFactory(this, values));
    },

    includes: function(searchValue) {
      return this.some(function(value ) {return is(value, searchValue)});
    },

    entries: function() {
      return this.__iterator(ITERATE_ENTRIES);
    },

    every: function(predicate, context) {
      assertNotInfinite(this.size);
      var returnValue = true;
      this.__iterate(function(v, k, c)  {
        if (!predicate.call(context, v, k, c)) {
          returnValue = false;
          return false;
        }
      });
      return returnValue;
    },

    filter: function(predicate, context) {
      return reify(this, filterFactory(this, predicate, context, true));
    },

    find: function(predicate, context, notSetValue) {
      var entry = this.findEntry(predicate, context);
      return entry ? entry[1] : notSetValue;
    },

    findEntry: function(predicate, context) {
      var found;
      this.__iterate(function(v, k, c)  {
        if (predicate.call(context, v, k, c)) {
          found = [k, v];
          return false;
        }
      });
      return found;
    },

    findLastEntry: function(predicate, context) {
      return this.toSeq().reverse().findEntry(predicate, context);
    },

    forEach: function(sideEffect, context) {
      assertNotInfinite(this.size);
      return this.__iterate(context ? sideEffect.bind(context) : sideEffect);
    },

    join: function(separator) {
      assertNotInfinite(this.size);
      separator = separator !== undefined ? '' + separator : ',';
      var joined = '';
      var isFirst = true;
      this.__iterate(function(v ) {
        isFirst ? (isFirst = false) : (joined += separator);
        joined += v !== null && v !== undefined ? v.toString() : '';
      });
      return joined;
    },

    keys: function() {
      return this.__iterator(ITERATE_KEYS);
    },

    map: function(mapper, context) {
      return reify(this, mapFactory(this, mapper, context));
    },

    reduce: function(reducer, initialReduction, context) {
      assertNotInfinite(this.size);
      var reduction;
      var useFirst;
      if (arguments.length < 2) {
        useFirst = true;
      } else {
        reduction = initialReduction;
      }
      this.__iterate(function(v, k, c)  {
        if (useFirst) {
          useFirst = false;
          reduction = v;
        } else {
          reduction = reducer.call(context, reduction, v, k, c);
        }
      });
      return reduction;
    },

    reduceRight: function(reducer, initialReduction, context) {
      var reversed = this.toKeyedSeq().reverse();
      return reversed.reduce.apply(reversed, arguments);
    },

    reverse: function() {
      return reify(this, reverseFactory(this, true));
    },

    slice: function(begin, end) {
      return reify(this, sliceFactory(this, begin, end, true));
    },

    some: function(predicate, context) {
      return !this.every(not(predicate), context);
    },

    sort: function(comparator) {
      return reify(this, sortFactory(this, comparator));
    },

    values: function() {
      return this.__iterator(ITERATE_VALUES);
    },


    // ### More sequential methods

    butLast: function() {
      return this.slice(0, -1);
    },

    isEmpty: function() {
      return this.size !== undefined ? this.size === 0 : !this.some(function()  {return true});
    },

    count: function(predicate, context) {
      return ensureSize(
        predicate ? this.toSeq().filter(predicate, context) : this
      );
    },

    countBy: function(grouper, context) {
      return countByFactory(this, grouper, context);
    },

    equals: function(other) {
      return deepEqual(this, other);
    },

    entrySeq: function() {
      var iterable = this;
      if (iterable._cache) {
        // We cache as an entries array, so we can just return the cache!
        return new ArraySeq(iterable._cache);
      }
      var entriesSequence = iterable.toSeq().map(entryMapper).toIndexedSeq();
      entriesSequence.fromEntrySeq = function()  {return iterable.toSeq()};
      return entriesSequence;
    },

    filterNot: function(predicate, context) {
      return this.filter(not(predicate), context);
    },

    findLast: function(predicate, context, notSetValue) {
      return this.toKeyedSeq().reverse().find(predicate, context, notSetValue);
    },

    first: function() {
      return this.find(returnTrue);
    },

    flatMap: function(mapper, context) {
      return reify(this, flatMapFactory(this, mapper, context));
    },

    flatten: function(depth) {
      return reify(this, flattenFactory(this, depth, true));
    },

    fromEntrySeq: function() {
      return new FromEntriesSequence(this);
    },

    get: function(searchKey, notSetValue) {
      return this.find(function(_, key)  {return is(key, searchKey)}, undefined, notSetValue);
    },

    getIn: function(searchKeyPath, notSetValue) {
      var nested = this;
      // Note: in an ES6 environment, we would prefer:
      // for (var key of searchKeyPath) {
      var iter = forceIterator(searchKeyPath);
      var step;
      while (!(step = iter.next()).done) {
        var key = step.value;
        nested = nested && nested.get ? nested.get(key, NOT_SET) : NOT_SET;
        if (nested === NOT_SET) {
          return notSetValue;
        }
      }
      return nested;
    },

    groupBy: function(grouper, context) {
      return groupByFactory(this, grouper, context);
    },

    has: function(searchKey) {
      return this.get(searchKey, NOT_SET) !== NOT_SET;
    },

    hasIn: function(searchKeyPath) {
      return this.getIn(searchKeyPath, NOT_SET) !== NOT_SET;
    },

    isSubset: function(iter) {
      iter = typeof iter.includes === 'function' ? iter : Iterable(iter);
      return this.every(function(value ) {return iter.includes(value)});
    },

    isSuperset: function(iter) {
      iter = typeof iter.isSubset === 'function' ? iter : Iterable(iter);
      return iter.isSubset(this);
    },

    keySeq: function() {
      return this.toSeq().map(keyMapper).toIndexedSeq();
    },

    last: function() {
      return this.toSeq().reverse().first();
    },

    max: function(comparator) {
      return maxFactory(this, comparator);
    },

    maxBy: function(mapper, comparator) {
      return maxFactory(this, comparator, mapper);
    },

    min: function(comparator) {
      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator);
    },

    minBy: function(mapper, comparator) {
      return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator, mapper);
    },

    rest: function() {
      return this.slice(1);
    },

    skip: function(amount) {
      return this.slice(Math.max(0, amount));
    },

    skipLast: function(amount) {
      return reify(this, this.toSeq().reverse().skip(amount).reverse());
    },

    skipWhile: function(predicate, context) {
      return reify(this, skipWhileFactory(this, predicate, context, true));
    },

    skipUntil: function(predicate, context) {
      return this.skipWhile(not(predicate), context);
    },

    sortBy: function(mapper, comparator) {
      return reify(this, sortFactory(this, comparator, mapper));
    },

    take: function(amount) {
      return this.slice(0, Math.max(0, amount));
    },

    takeLast: function(amount) {
      return reify(this, this.toSeq().reverse().take(amount).reverse());
    },

    takeWhile: function(predicate, context) {
      return reify(this, takeWhileFactory(this, predicate, context));
    },

    takeUntil: function(predicate, context) {
      return this.takeWhile(not(predicate), context);
    },

    valueSeq: function() {
      return this.toIndexedSeq();
    },


    // ### Hashable Object

    hashCode: function() {
      return this.__hash || (this.__hash = hashIterable(this));
    }


    // ### Internal

    // abstract __iterate(fn, reverse)

    // abstract __iterator(type, reverse)
  });

  // var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
  // var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
  // var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
  // var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

  var IterablePrototype = Iterable.prototype;
  IterablePrototype[IS_ITERABLE_SENTINEL] = true;
  IterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.values;
  IterablePrototype.__toJS = IterablePrototype.toArray;
  IterablePrototype.__toStringMapper = quoteString;
  IterablePrototype.inspect =
  IterablePrototype.toSource = function() { return this.toString(); };
  IterablePrototype.chain = IterablePrototype.flatMap;
  IterablePrototype.contains = IterablePrototype.includes;

  // Temporary warning about using length
  (function () {
    try {
      Object.defineProperty(IterablePrototype, 'length', {
        get: function () {
          if (!Iterable.noLengthWarning) {
            var stack;
            try {
              throw new Error();
            } catch (error) {
              stack = error.stack;
            }
            if (stack.indexOf('_wrapObject') === -1) {
              console && console.warn && console.warn(
                'iterable.length has been deprecated, '+
                'use iterable.size or iterable.count(). '+
                'This warning will become a silent error in a future version. ' +
                stack
              );
              return this.size;
            }
          }
        }
      });
    } catch (e) {}
  })();



  mixin(KeyedIterable, {

    // ### More sequential methods

    flip: function() {
      return reify(this, flipFactory(this));
    },

    findKey: function(predicate, context) {
      var entry = this.findEntry(predicate, context);
      return entry && entry[0];
    },

    findLastKey: function(predicate, context) {
      return this.toSeq().reverse().findKey(predicate, context);
    },

    keyOf: function(searchValue) {
      return this.findKey(function(value ) {return is(value, searchValue)});
    },

    lastKeyOf: function(searchValue) {
      return this.findLastKey(function(value ) {return is(value, searchValue)});
    },

    mapEntries: function(mapper, context) {var this$0 = this;
      var iterations = 0;
      return reify(this,
        this.toSeq().map(
          function(v, k)  {return mapper.call(context, [k, v], iterations++, this$0)}
        ).fromEntrySeq()
      );
    },

    mapKeys: function(mapper, context) {var this$0 = this;
      return reify(this,
        this.toSeq().flip().map(
          function(k, v)  {return mapper.call(context, k, v, this$0)}
        ).flip()
      );
    }

  });

  var KeyedIterablePrototype = KeyedIterable.prototype;
  KeyedIterablePrototype[IS_KEYED_SENTINEL] = true;
  KeyedIterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.entries;
  KeyedIterablePrototype.__toJS = IterablePrototype.toObject;
  KeyedIterablePrototype.__toStringMapper = function(v, k)  {return JSON.stringify(k) + ': ' + quoteString(v)};



  mixin(IndexedIterable, {

    // ### Conversion to other types

    toKeyedSeq: function() {
      return new ToKeyedSequence(this, false);
    },


    // ### ES6 Collection methods (ES6 Array and Map)

    filter: function(predicate, context) {
      return reify(this, filterFactory(this, predicate, context, false));
    },

    findIndex: function(predicate, context) {
      var entry = this.findEntry(predicate, context);
      return entry ? entry[0] : -1;
    },

    indexOf: function(searchValue) {
      var key = this.toKeyedSeq().keyOf(searchValue);
      return key === undefined ? -1 : key;
    },

    lastIndexOf: function(searchValue) {
      return this.toSeq().reverse().indexOf(searchValue);
    },

    reverse: function() {
      return reify(this, reverseFactory(this, false));
    },

    slice: function(begin, end) {
      return reify(this, sliceFactory(this, begin, end, false));
    },

    splice: function(index, removeNum /*, ...values*/) {
      var numArgs = arguments.length;
      removeNum = Math.max(removeNum | 0, 0);
      if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
        return this;
      }
      // If index is negative, it should resolve relative to the size of the
      // collection. However size may be expensive to compute if not cached, so
      // only call count() if the number is in fact negative.
      index = resolveBegin(index, index < 0 ? this.count() : this.size);
      var spliced = this.slice(0, index);
      return reify(
        this,
        numArgs === 1 ?
          spliced :
          spliced.concat(arrCopy(arguments, 2), this.slice(index + removeNum))
      );
    },


    // ### More collection methods

    findLastIndex: function(predicate, context) {
      var key = this.toKeyedSeq().findLastKey(predicate, context);
      return key === undefined ? -1 : key;
    },

    first: function() {
      return this.get(0);
    },

    flatten: function(depth) {
      return reify(this, flattenFactory(this, depth, false));
    },

    get: function(index, notSetValue) {
      index = wrapIndex(this, index);
      return (index < 0 || (this.size === Infinity ||
          (this.size !== undefined && index > this.size))) ?
        notSetValue :
        this.find(function(_, key)  {return key === index}, undefined, notSetValue);
    },

    has: function(index) {
      index = wrapIndex(this, index);
      return index >= 0 && (this.size !== undefined ?
        this.size === Infinity || index < this.size :
        this.indexOf(index) !== -1
      );
    },

    interpose: function(separator) {
      return reify(this, interposeFactory(this, separator));
    },

    interleave: function(/*...iterables*/) {
      var iterables = [this].concat(arrCopy(arguments));
      var zipped = zipWithFactory(this.toSeq(), IndexedSeq.of, iterables);
      var interleaved = zipped.flatten(true);
      if (zipped.size) {
        interleaved.size = zipped.size * iterables.length;
      }
      return reify(this, interleaved);
    },

    last: function() {
      return this.get(-1);
    },

    skipWhile: function(predicate, context) {
      return reify(this, skipWhileFactory(this, predicate, context, false));
    },

    zip: function(/*, ...iterables */) {
      var iterables = [this].concat(arrCopy(arguments));
      return reify(this, zipWithFactory(this, defaultZipper, iterables));
    },

    zipWith: function(zipper/*, ...iterables */) {
      var iterables = arrCopy(arguments);
      iterables[0] = this;
      return reify(this, zipWithFactory(this, zipper, iterables));
    }

  });

  IndexedIterable.prototype[IS_INDEXED_SENTINEL] = true;
  IndexedIterable.prototype[IS_ORDERED_SENTINEL] = true;



  mixin(SetIterable, {

    // ### ES6 Collection methods (ES6 Array and Map)

    get: function(value, notSetValue) {
      return this.has(value) ? value : notSetValue;
    },

    includes: function(value) {
      return this.has(value);
    },


    // ### More sequential methods

    keySeq: function() {
      return this.valueSeq();
    }

  });

  SetIterable.prototype.has = IterablePrototype.includes;


  // Mixin subclasses

  mixin(KeyedSeq, KeyedIterable.prototype);
  mixin(IndexedSeq, IndexedIterable.prototype);
  mixin(SetSeq, SetIterable.prototype);

  mixin(KeyedCollection, KeyedIterable.prototype);
  mixin(IndexedCollection, IndexedIterable.prototype);
  mixin(SetCollection, SetIterable.prototype);


  // #pragma Helper functions

  function keyMapper(v, k) {
    return k;
  }

  function entryMapper(v, k) {
    return [k, v];
  }

  function not(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    }
  }

  function neg(predicate) {
    return function() {
      return -predicate.apply(this, arguments);
    }
  }

  function quoteString(value) {
    return typeof value === 'string' ? JSON.stringify(value) : value;
  }

  function defaultZipper() {
    return arrCopy(arguments);
  }

  function defaultNegComparator(a, b) {
    return a < b ? 1 : a > b ? -1 : 0;
  }

  function hashIterable(iterable) {
    if (iterable.size === Infinity) {
      return 0;
    }
    var ordered = isOrdered(iterable);
    var keyed = isKeyed(iterable);
    var h = ordered ? 1 : 0;
    var size = iterable.__iterate(
      keyed ?
        ordered ?
          function(v, k)  { h = 31 * h + hashMerge(hash(v), hash(k)) | 0; } :
          function(v, k)  { h = h + hashMerge(hash(v), hash(k)) | 0; } :
        ordered ?
          function(v ) { h = 31 * h + hash(v) | 0; } :
          function(v ) { h = h + hash(v) | 0; }
    );
    return murmurHashOfSize(size, h);
  }

  function murmurHashOfSize(size, h) {
    h = src_Math__imul(h, 0xCC9E2D51);
    h = src_Math__imul(h << 15 | h >>> -15, 0x1B873593);
    h = src_Math__imul(h << 13 | h >>> -13, 5);
    h = (h + 0xE6546B64 | 0) ^ size;
    h = src_Math__imul(h ^ h >>> 16, 0x85EBCA6B);
    h = src_Math__imul(h ^ h >>> 13, 0xC2B2AE35);
    h = smi(h ^ h >>> 16);
    return h;
  }

  function hashMerge(a, b) {
    return a ^ b + 0x9E3779B9 + (a << 6) + (a >> 2) | 0; // int
  }

  var Immutable = {

    Iterable: Iterable,

    Seq: Seq,
    Collection: Collection,
    Map: src_Map__Map,
    OrderedMap: OrderedMap,
    List: List,
    Stack: Stack,
    Set: src_Set__Set,
    OrderedSet: OrderedSet,

    Record: Record,
    Range: Range,
    Repeat: Repeat,

    is: is,
    fromJS: fromJS

  };

  return Immutable;

}));
},{}],11:[function(require,module,exports){
'use strict';

var Immutable = require('immutable');
var Cursor = require('immutable/contrib/cursor/index');
var EventEmitter = require('eventemitter3');
var utils = require('./utils');

var LISTENER_SENTINEL = {};

 /**
 * Creates a new `Structure` instance. Also accessible through
 * `Immstruct.Structre`.
 *
 * A structure is also an EventEmitter object, so it has methods as
 * `.on`, `.off`, and all other EventEmitter methods.
 *
 *
 * For the `swap` event, the root structure (see `structure.current`) is passed
 * as arguments, but for type specific events (`add`, `change` and `delete`), the
 * actual changed value is passed.
 *
 * For instance:
 * ```js
 * var structure = new Structure({ 'foo': { 'bar': 'hello' } });
 *
 * structure.on('swap', function (newData, oldData, keyPath) {
 *   keyPath.should.eql(['foo', 'bar']);
 *   newData.toJS().should.eql({ 'foo': { 'bar': 'bye' } });
 *   oldData.toJS().should.eql({ 'foo': { 'bar': 'hello' } });
 * });
 *
 * structure.cursor(['foo', 'bar']).update(function () {
 *  return 'bye';
 * });
 * ```
 *
 * But for `change`
 * ```js
 * var structure = new Structure({ 'foo': { 'bar': 'hello' } });
 *
 * structure.on('change', function (newData, oldData, keyPath) {
 *   keyPath.should.eql(['foo', 'bar']);
 *   newData.should.eql('bye');
 *   oldData.should.eql('hello');
 * });
 *
 * structure.cursor(['foo', 'bar']).update(function () {
 *  return 'bye';
 * });
 * ```
 *
 * **All `keyPath`s passed to listeners are the full path to where the actual
 *  change happened**
 *
 * ### Examples:
 * ```js
 * var Structure = require('immstruct/structure');
 * var s = new Structure({ data: { foo: 'bar' }});
 *
 * // Or:
 * // var Structure = require('immstruct').Structure;
 * ```
 *
 * ### Events
 *
 * * `swap`: Emitted when cursor is updated (new information is set). Is emitted
 *   on all types of changes, additions and deletions. The passed structures are
 *   always the root structure.
 *   One use case for this is to re-render design components. Callback
 *   is passed arguments: `newStructure`, `oldStructure`, `keyPath`.
 * * `next-animation-frame`: Same as `swap`, but only emitted on animation frame.
 *   Could use with many render updates and better performance. Callback is passed
 *   arguments: `newStructure`, `oldStructure`, `keyPath`.
 * * `change`: Emitted when data/value is updated and it existed before. Emits
 *   values: `newValue`, `oldValue` and `path`.
 * * `delete`: Emitted when data/value is removed. Emits value:  `removedValue` and `path`.
 * * `add`: Emitted when new data/value is added. Emits value: `newValue` and `path`.
 * * `any`: With the same semantics as `add`, `change` or `delete`, `any` is triggered for
 *    all types of changes. Differs from swap in the arguments that it is passed.
 *    Is passed `newValue` (or undefined), `oldValue` (or undefined) and full `keyPath`.
 *    New and old value are the changed value, not relative/scoped to the reference path as
 *    with `swap`.
 *
 * ### Options
 *
 * ```json
 * {
 *   key: String, // Defaults to random string
 *   data: Object|Immutable, // defaults to empty Map
 *   history: Boolean, // Defaults to false
 *   historyLimit: Number, // If history enabled, Defaults to Infinity
 * }
 * ```
 *
 * @property {Immutable.List} history `Immutable.List` with history.
 * @property {Object|Immutable} current Provided data as immutable data
 * @property {String} key Generated or provided key.
 *
 *
 * @param {{ key: String, data: Object, history: Boolean }} [options] - defaults
 *  to random key and empty data (immutable structure). No history
 *
 * @constructor
 * @class {Structure}
 * @returns {Structure}
 * @api public
 */
function Structure (options) {
  var self = this;

  options = options || {};
  if (!(this instanceof Structure)) {
    return new Structure(options);
  }

  this.key = options.key || utils.generateRandomKey();

  this._queuedChange = false;
  this.current = options.data;
  if (!isImmutableStructure(this.current) || !this.current) {
    this.current = Immutable.fromJS(this.current || {});
  }

  if (!!options.history) {
    this.history = Immutable.List.of(this.current);
    this._currentRevision = 0;
    this._historyLimit = (typeof options.historyLimit === 'number') ?
      options.historyLimit :
      Infinity;
  }

  this._referencelisteners = Immutable.Map();
  this.on('swap', function (newData, oldData, keyPath) {
    keyPath = keyPath || [];
    var args = [newData, oldData, keyPath];
    emit(self._referencelisteners, newData, oldData, keyPath, args);
  });

  EventEmitter.call(this, arguments);
}
inherits(Structure, EventEmitter);
module.exports = Structure;

function emit(map, newData, oldData, path, args) {
  if (!map || newData === oldData) return void 0;
  map.get(LISTENER_SENTINEL, []).forEach(function (fn) {
    fn.apply(null, args);
  });

  if (path.length > 0) {
    var nextPathRoot = path[0];
    var passedNewData = newData && newData.get ? newData.get(nextPathRoot) : void 0;
    var passedOldData = oldData && oldData.get ? oldData.get(nextPathRoot) : void 0;
    return emit(map.get(nextPathRoot), passedNewData, passedOldData, path.slice(1), args);
  }

  map.forEach(function(value, key) {
    if (key === LISTENER_SENTINEL) return void 0;
    var passedNewData = (newData && newData.get) ? newData.get(key) : void 0;
    var passedOldData = (oldData && oldData.get) ? oldData.get(key) : void 0;
    emit(value, passedNewData, passedOldData, [], args);
  });
}

/**
 * Create a Immutable.js Cursor for a given `path` on the `current` structure (see `Structure.current`).
 * Changes made through created cursor will cause a `swap` event to happen (see `Events`).
 *
 * **This method returns a
 * [Immutable.js Cursor](https://github.com/facebook/immutable-js/blob/master/contrib/cursor/index.d.ts).
 * See the Immutable.js docs for more info on how to use cursors.**
 *
 * ### Examples:
 * ```js
 * var Structure = require('immstruct/structure');
 * var s = new Structure({ data: { foo: 'bar', a: { b: 'foo' } }});
 * s.cursor().set('foo', 'hello');
 * s.cursor('foo').update(function () { return 'Changed'; });
 * s.cursor(['a', 'b']).update(function () { return 'bar'; });
 * ```
 *
 * See more examples in the [tests](https://github.com/omniscientjs/immstruct/blob/master/tests/structure_test.js)
 *
 * @param {String|Array} [path] - defaults to empty string. Can be array for path. See Immutable.js Cursors
 *
 * @api public
 * @module structure.cursor
 * @returns {Cursor} Gives a Cursor from Immutable.js
 */
Structure.prototype.cursor = function (path) {
  var self = this;
  path = valToKeyPath(path) || [];

  if (!this.current) {
    throw new Error('No structure loaded.');
  }

  var changeListener = function (newRoot, oldRoot, path) {
    if(self.current === oldRoot) {
      self.current = newRoot;
    } else if(!hasIn(newRoot, path)) {
      // Othewise an out-of-sync change occured. We ignore `oldRoot`, and focus on
      // changes at path `path`, and sync this to `self.current`.
      self.current = self.current.removeIn(path);
    } else {
      // Update an existing path or add a new path within the current map.
      self.current = self.current.setIn(path, newRoot.getIn(path));
    }

    return self.current;
  };

  changeListener = handleHistory(this, changeListener);
  changeListener = handleSwap(this, changeListener);
  changeListener = handlePersisting(this, changeListener);
  return Cursor.from(self.current, path, changeListener);
};

/**
 * Creates a reference. A reference can be a pointer to a cursor, allowing
 * you to create cursors for a specific path any time. This is essentially
 * a way to have "always updated cursors" or Reference Cursors. See example
 * for better understanding the concept.
 *
 * References also allow you to listen for changes specific for a path.
 *
 * ### Examples:
 * ```js
 * var structure = immstruct({
 *   someBox: { message: 'Hello World!' }
 * });
 * var ref = structure.reference(['someBox']);
 *
 * var unobserve = ref.observe(function () {
 *   // Called when data the path 'someBox' is changed.
 *   // Also called when the data at ['someBox', 'message'] is changed.
 * });
 *
 * // Update the data using the ref
 * ref.cursor().update(function () { return 'updated'; });
 *
 * // Update the data using the initial structure
 * structure.cursor(['someBox', 'message']).update(function () { return 'updated again'; });
 *
 * // Remove the listener
 * unobserve();
 * ```
 *
 * See more examples in the [readme](https://github.com/omniscientjs/immstruct)
 *
 * @param {String|Array|Cursor} [path|cursor] - defaults to empty string. Can be
 * array for path or use path of cursor. See Immutable.js Cursors
 *
 * @api public
 * @module structure.reference
 * @returns {Reference}
 * @constructor
 */
Structure.prototype.reference = function reference (path) {
  if (isCursor(path) && path._keyPath) {
    path = path._keyPath;
  }

  path = valToKeyPath(path) || [];

  var self = this,
      cursor = this.cursor(path),
      unobservers = Immutable.Set();

  function cursorRefresher() { cursor = self.cursor(path); }
  function _subscribe (path, fn) {
    self._referencelisteners = subscribe(self._referencelisteners, path, fn);
  }
  function _unsubscribe (path, fn) {
    self._referencelisteners = unsubscribe(self._referencelisteners, path, fn);
  }

  _subscribe(path, cursorRefresher);

  return {
    /**
     * Observe for changes on a reference. On references you can observe for changes,
     * but a reference **is not** an EventEmitter it self.
     *
     * The passed `keyPath` for swap events are relative to the reference, but
     *
     *
     * **Note**: As on `swap` for normal immstruct events, the passed arguments for
     * the event is the root, not guaranteed to be the actual changed value.
     * The structure is how ever scoped to the path passed in to the reference.
     * All values passed to the eventlistener for the swap event are relative
     * to the path used as key path to the reference.
     *
     * For instance:
     *
     * ```js
     * var structure = immstruct({ 'foo': { 'bar': 'hello' } });
     * var ref = structure.reference('foo');
     * ref.observe(function (newData, oldData, keyPath) {
     *   keyPath.should.eql(['bar']);
     *   newData.toJS().should.eql({ 'bar': 'updated' });
     *   oldData.toJS().should.eql({ 'bar': 'hello' });
     * });
     * ref.cursor().update(['bar'], function () { return 'updated'; });
     * ```
     *
     * For type specific events, how ever, the actual changed value is passed,
     * not the root data. In these cases, the full keyPath to the change is passed.
     *
     * For instance:
     *
     * ```js
     * var structure = immstruct({ 'foo': { 'bar': 'hello' } });
     * var ref = structure.reference('foo');
     * ref.observe('change', function (newValue, oldValue, keyPath) {
     *   keyPath.should.eql(['foo', 'bar']);
     *   newData.should.eql('updated');
     *   oldData.should.eql('hello');
     * });
     * ref.cursor().update(['bar'], function () { return 'updated'; });
     * ```
     *
     *
     * ### Examples:
     * ```js
     * var ref = structure.reference(['someBox']);
     *
     * var unobserve = ref.observe('delete', function () {
     *   // Called when data the path 'someBox' is removed from the structure.
     * });
     * ```
     *
     * See more examples in the [readme](https://github.com/omniscientjs/immstruct)
     *
     * ### Events
     * * `swap`: Emitted when any cursor is updated (new information is set).
     *   Triggered in any data swap is made on the structure. One use case for
     *   this is to re-render design components. Data passed as arguments
     *   are scoped/relative to the path passed to the reference, this also goes for keyPath.
     *   Callback is passed arguments: `newStructure`, `oldStructure`, `keyPath`.
     * * `change`: Emitted when data/value is updated and it existed before.
     *   Emits values: `newValue`, `oldValue` and `path`.
     * * `delete`: Emitted when data/value is removed. Emits value:  `removedValue` and `path`.
     * * `add`: Emitted when new data/value is added. Emits value: `newValue` and `path`.
     * * `any`: With the same semantics as `add`, `change` or `delete`, `any` is triggered for
     *    all types of changes. Differs from swap in the arguments that it is passed.
     *    Is passed `newValue` (or undefined), `oldValue` (or undefined) and full `keyPath`.
     *    New and old value are the changed value, not relative/scoped to the reference path as
     *    with `swap`.
     *
     * @param {String} [eventName] - Type of change
     * @param {Function} callback - Callback when referenced data is swapped
     *
     * @api public
     * @module reference.observe
     * @returns {Function} Function for removing observer (unobserve)
     */
    observe: function (eventName, newFn) {
      if (typeof eventName === 'function') {
        newFn = eventName;
        eventName = void 0;
      }
      if (this._dead || typeof newFn !== 'function') return;
      if (eventName && eventName !== 'swap') {
        newFn = onEventNameAndAny(eventName, newFn);
      } else {
        newFn = emitScopedReferencedStructures(path, newFn);
      }

      _subscribe(path, newFn);
      unobservers = unobservers.add(newFn);

      return function unobserve () {
        _unsubscribe(path, newFn);
      };
    },

    /**
     * Create a new, updated, cursor from the base path provded to the
     * reference. This returns a Immutable.js Cursor as the regular
     * cursor method. You can also provide a sub-path to create a reference
     * in a deeper level.
     *
     * ### Examples:
     * ```js
     * var ref = structure.reference(['someBox']);
     * var cursor = ref.cursor('someSubPath');
     * var cursor2 = ref.cursor();
     * ```
     *
     * See more examples in the [readme](https://github.com/omniscientjs/immstruct)
     *
     * @param {String} [subpath] - Subpath to a deeper structure
     *
     * @api public
     * @module reference.cursor
     * @returns {Cursor} Immutable.js cursor
     */
    cursor: function (subPath) {
      if (this._dead) return void 0;
      subPath = valToKeyPath(subPath);
      if (subPath) return cursor.cursor(subPath);
      return cursor;
    },

    /**
     * Creates a reference on a lower level path. See creating normal references.
     *
     * ### Examples:
     * ```js
     * var structure = immstruct({
     *   someBox: { message: 'Hello World!' }
     * });
     * var ref = structure.reference('someBox');
     *
     * var newReference = ref.reference('message');
     * ```
     *
     * See more examples in the [readme](https://github.com/omniscientjs/immstruct)
     *
     * @param {String|Array} [path] - defaults to empty string. Can be array for path. See Immutable.js Cursors
     *
     * @api public
     * @see structure.reference
     * @module reference.reference
     * @returns {Reference}
     */
    reference: function (subPath) {
      subPath = valToKeyPath(subPath);
      return self.reference((cursor._keyPath || []).concat(subPath));
    },

    /**
     * Remove all observers from reference.
     *
     * @api public
     * @module reference.unobserveAll
     * @returns {Void}
     */
    unobserveAll: function (destroy) {
      if (this._dead) return void 0;
      unobservers.forEach(function(fn) {
        _unsubscribe(path, fn);
      });

      if (destroy) {
        _unsubscribe(path, cursorRefresher);
      }
    },

    /**
     * Destroy reference. Unobserve all observers, set all endpoints of reference to dead.
     * For cleaning up memory.
     *
     * @api public
     * @module reference.destroy
     * @returns {Void}
     */
    destroy: function () {
      cursor = void 0;
      this.unobserveAll(true);

      this._dead = true;
      this.observe = void 0;
      this.unobserveAll = void 0;
      this.cursor = void 0;
      this.destroy = void 0;

      cursorRefresher = void 0;
      _unsubscribe = void 0;
      _subscribe = void 0;
    }
  };
};

/**
 * Force emitting swap event. Pass on new, old and keypath passed to swap.
 * If newData is `null` current will be used.
 *
 * @param {Object} newData - Immutable object for the new data to emit
 * @param {Object} oldData - Immutable object for the old data to emit
 * @param {String} keyPath - Structure path (in tree) to where the changes occured.
 *
 * @api public
 * @module structure.forceHasSwapped
 * @returns {Void}
 */
Structure.prototype.forceHasSwapped = function (newData, oldData, keyPath) {
  this.emit('swap', newData || this.current, oldData, keyPath);
  possiblyEmitAnimationFrameEvent(this, newData || this.current, oldData, keyPath);
};


/**
 * Undo IFF history is activated and there are steps to undo. Returns new current
 * immutable structure.
 *
 * **Will NOT emit swap when redo. You have to do this yourself**.
 *
 * Define number of steps to undo in param.
 *
 * @param {Number} steps - Number of steps to undo
 *
 * @api public
 * @module structure.undo
 * @returns {Object} New Immutable structure after undo
 */
Structure.prototype.undo = function(steps) {
  this._currentRevision -= steps || 1;
  if (this._currentRevision < 0) {
    this._currentRevision = 0;
  }

  this.current = this.history.get(this._currentRevision);
  return this.current;
};

/**
 * Redo IFF history is activated and you can redo. Returns new current immutable structure.
 * Define number of steps to redo in param.
 * **Will NOT emit swap when redo. You have to do this yourself**.
 *
 * @param {Number} head - Number of steps to head to in redo
 *
 * @api public
 * @module structure.redo
 * @returns {Object} New Immutable structure after redo
 */
Structure.prototype.redo = function(head) {
  this._currentRevision += head || 1;
  if (this._currentRevision > this.history.count() - 1) {
    this._currentRevision = this.history.count() - 1;
  }

  this.current = this.history.get(this._currentRevision);
  return this.current;
};

/**
 * Undo IFF history is activated and passed `structure` exists in history.
 * Returns the same immutable structure as passed as argument.
 *
 * **Will NOT emit swap after undo. You have to do this yourself**.
 *
 * @param {Object} structure - Immutable structure to redo until
 *
 * @api public
 * @module structure.undoUntil
 * @returns {Object} New Immutable structure after undo
 */
Structure.prototype.undoUntil = function(structure) {
  this._currentRevision = this.history.indexOf(structure);
  this.current = structure;

  return structure;
};


function subscribe(listeners, path, fn) {
  return listeners.updateIn(path.concat(LISTENER_SENTINEL), Immutable.OrderedSet(), function(old) {
    return old.add(fn);
  });
}

function unsubscribe(listeners, path, fn) {
  return listeners.updateIn(path.concat(LISTENER_SENTINEL), Immutable.OrderedSet(), function(old) {
    return old.remove(fn);
  });
}

// Private decorators.

// Update history if history is active
function handleHistory (emitter, fn) {
  return function handleHistoryFunction (newData, oldData, path) {
    var newStructure = fn.apply(fn, arguments);
    if (!emitter.history || (newData === oldData)) return newStructure;

    emitter.history = emitter.history
      .take(++emitter._currentRevision)
      .push(emitter.current);

    if (emitter.history.size > emitter._historyLimit) {
      emitter.history = emitter.history.takeLast(emitter._historyLimit);
      emitter._currentRevision -= (emitter.history.size - emitter._historyLimit);
    }

    return newStructure;
  };
}

var _requestAnimationFrame = (typeof window !== 'undefined' &&
  window.requestAnimationFrame) || utils.raf;

// Update history if history is active
function possiblyEmitAnimationFrameEvent (emitter, newStructure, oldData, keyPath) {
  if (emitter._queuedChange) return void 0;
  emitter._queuedChange = true;

  _requestAnimationFrame(function () {
    emitter._queuedChange = false;
    emitter.emit('next-animation-frame', newStructure, oldData, keyPath);
  });
}

// Emit swap event on values are swapped
function handleSwap (emitter, fn) {
  return function handleSwapFunction (newData, oldData, keyPath) {
    var previous = emitter.current;
    var newStructure = fn.apply(fn, arguments);
    if(newData === previous) return newStructure;

    emitter.emit('swap', newStructure, previous, keyPath);
    possiblyEmitAnimationFrameEvent(emitter, newStructure, previous, keyPath);

    return newStructure;
  };
}

// Map changes to update events (delete/change/add).
function handlePersisting (emitter, fn) {
  return function handlePersistingFunction (newData, oldData, path) {
    var previous = emitter.current;
    var newStructure = fn.apply(fn, arguments);
    if(newData === previous) return newStructure;
    var info = analyze(newData, previous, path);

    if (info.eventName) {
      emitter.emit.apply(emitter, [info.eventName].concat(info.args));
      emitter.emit('any', info.newObject, info.oldObject, path);
    }
    return newStructure;
  };
}

// Private helpers.

function analyze (newData, oldData, path) {
  var oldObject = oldData && oldData.getIn(path);
  var newObject = newData && newData.getIn(path);

  var inOld = oldData && hasIn(oldData, path);
  var inNew = newData && hasIn(newData, path);

  var args, eventName;

  if (inOld && !inNew) {
    eventName = 'delete';
    args = [oldObject, path];
  } else if (inOld && inNew) {
    eventName = 'change';
    args = [newObject, oldObject, path];
  } else if (!inOld && inNew) {
    eventName = 'add';
    args = [newObject, path];
  }

  return {
    eventName: eventName,
    args: args,
    newObject: newObject,
    oldObject: oldObject
  };
}

// Check if path exists.
var NOT_SET = {};
function hasIn(cursor, path) {
  if(cursor.hasIn) return cursor.hasIn(path);
  return cursor.getIn(path, NOT_SET) !== NOT_SET;
}

function onEventNameAndAny(eventName, fn) {
  return function (newData, oldData, keyPath) {
    var info = analyze(newData, oldData, keyPath);

    if (info.eventName !== eventName && eventName !== 'any') return void 0;
    if (eventName === 'any') {
      return fn.call(fn, info.newObject, info.oldObject, keyPath);
    }
    return fn.apply(fn, info.args);
  };
}

function emitScopedReferencedStructures(path, fn) {
  return function withReferenceScopedStructures (newStructure, oldStructure, keyPath) {
    return fn.call(this, newStructure.getIn(path), oldStructure.getIn(path), keyPath.slice(path.length));
  };
}

function isCursor (potential) {
  return potential && typeof potential.deref === 'function';
}

// Check if passed structure is existing immutable structure.
// From https://github.com/facebook/immutable-js/wiki/Upgrading-to-Immutable-v3#additional-changes
var immutableCheckers = [
  {name: 'Iterable', method: 'isIterable' },
  {name: 'Seq', method: 'isSeq'},
  {name: 'Map', method: 'isMap'},
  {name: 'OrderedMap', method: 'isOrderedMap'},
  {name: 'List', method: 'isList'},
  {name: 'Stack', method: 'isStack'},
  {name: 'Set', method: 'isSet'}
];
function isImmutableStructure (data) {
  return immutableCheckers.some(function (checkItem) {
    return immutableSafeCheck(checkItem.name, checkItem.method, data);
  });
}

function immutableSafeCheck (ns, method, data) {
  return Immutable[ns] && Immutable[ns][method] && Immutable[ns][method](data);
}

function valToKeyPath(val) {
  if (typeof val === 'undefined') {
    return val;
  }
  return Array.isArray(val) ? val :
    immutableSafeCheck('Iterable', 'isIterable', val) ?
      val.toArray() : [val];
}

function inherits (c, p) {
  var e = {};
  Object.getOwnPropertyNames(c.prototype).forEach(function (k) {
    e[k] = Object.getOwnPropertyDescriptor(c.prototype, k);
  });
  c.prototype = Object.create(p.prototype, e);
  c['super'] = p;
}

},{"./utils":12,"eventemitter3":8,"immutable":10,"immutable/contrib/cursor/index":9}],12:[function(require,module,exports){
'use strict';

module.exports.generateRandomKey = function (len) {
  len = len || 10;
  return Math.random().toString(36).substring(2).substring(0, len);
};

// Variation shim based on the classic polyfill:
// http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
module.exports.raf = (function() {
  var glob = (typeof window === 'undefined') ? module : window;
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for(var x = 0; x < vendors.length && !glob.requestAnimationFrame; ++x) {
    glob.requestAnimationFrame = glob[vendors[x]+'RequestAnimationFrame'];
  }

  return function(callback, element) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = setTimeout(function() { callback(currTime + timeToCall); },
      timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
}());

},{}],13:[function(require,module,exports){
module.exports={
  "name": "tusk",
  "version": "0.7.6",
  "description": "A slim virtual dom implementation for immutable structures.",
  "author": "Dylan Piercey <pierceydylan@gmail.com>",
  "main": "lib/index.js",
  "license": "MIT",
  "scripts": {
    "precommit": "npm run release",
    "test": "gulp test",
    "build": "gulp build",
    "release": "gulp test && gulp build && gulp build-browser && gulp build-test"
  },
  "keywords": [
    "dom",
    "virtual",
    "react",
    "tusk",
    "render",
    "immstruct",
    "immutable",
    "jsx"
  ],
  "repository": {
    "type": "git",
    "url": "https://github.com/DylanPiercey/tusk"
  },
  "devDependencies": {
    "browserify": "^11.1.0",
    "bundle-collapser": "^1.2.1",
    "coffee-react": "^4.0.0",
    "coffee-reactify": "^4.0.0",
    "gulp": "^3.9.0",
    "gulp-cjsx": "^3.0.0",
    "gulp-header": "^1.7.1",
    "gulp-mocha": "^2.1.3",
    "gulp-sourcemaps": "^1.5.2",
    "gulp-uglify": "^1.4.1",
    "husky": "^0.10.1",
    "immstruct": "^2.0.0",
    "jsdom": "^6.5.1",
    "mocha": "^2.3.3",
    "mocha-jsdom": "^1.0.0",
    "vinyl-buffer": "^1.0.0",
    "vinyl-source-stream": "^1.1.0"
  }
}

},{}],14:[function(require,module,exports){
module.exports = {

  /*
  	 * @private
  	 * @description
  	 * The key used to attach data to the dom.
   */
  NODE: "__node__",

  /*
  	 * @private
  	 * @description
  	 * List of supported html namespaces.
   */
  NAMESPACES: {
    HTML: "http://www.w3.org/1999/xhtml",
    MATH_ML: "http://www.w3.org/1998/Math/MathML",
    SVG: "http://www.w3.org/2000/svg"
  },

  /*
  	 * @private
  	 * @description
  	 * List of html tags that are self closing.
   */
  SELF_CLOSING: ["area", "base", "br", "col", "command", "embed", "hr", "img", "input", "keygen", "link", "meta", "param", "source", "track", "wbr"],

  /*
  	 * @private
  	 * @description
  	 * List of events that are supported by tusk.
   */
  EVENTS: ["animationend", "animationiteration", "animationstart", "beforeunload", "blur", "canplay", "canplaythrough", "change", "click", "contextmenu", "copy", "cut", "dblclick", "drag", "dragend", "dragenter", "dragexit", "dragleave", "dragover", "dragstart", "drop", "durationchange", "emptied", "ended", "focus", "fullscreenchange", "input", "keydown", "keypress", "keyup", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "paste", "pause", "play", "playing", "progress", "ratechange", "reset", "scroll", "seeked", "seeking", "select", "stalled", "submit", "suspend", "timeupdate", "touchcancel", "touchend", "touchmove", "touchstart", "transitionend", "visibilitychange", "volumechange", "waiting", "wheel"]
};


},{}],15:[function(require,module,exports){
var EVENTS, NODE, handleEvent, ref;

ref = require("./constants"), NODE = ref.NODE, EVENTS = ref.EVENTS;


/*
 * @private
 * @description
 * Handle and delegate global events.
 *
 * @param {Event} e - The DOM event being handled.
 */

handleEvent = function(e) {
  var base, base1, node, ref1, target, type;
  target = e.target, type = e.type;
  type = type.toLowerCase();
  if (!e.bubbles) {
    if ((ref1 = target[NODE]) != null) {
      if (typeof (base = ref1.events)[type] === "function") {
        base[type](e);
      }
    }
  } else {
    e.stopPropagation = function() {
      return e.cancelBubble = true;
    };
    Object.defineProperty(e, "currentTarget", {
      value: target,
      writable: true
    });
    while (target) {
      e.currentTarget = target;
      node = target[NODE];
      target = target.parentNode;
      if (node != null) {
        if (typeof (base1 = node.events)[type] === "function") {
          base1[type](e);
        }
      }
      if (e.cancelBubble) {
        break;
      }
    }
  }
};

module.exports = {

  /*
  	 * Utility to create, cache and dispatch an event on a given element.
  	 *
  	 * @param {String} name
  	 * @param {HTMLEntity} elem
  	 * @param {Boolean} bubble
   */
  dispatch: function(name, elem, bubbles) {
    var e;
    if (bubbles == null) {
      bubbles = false;
    }
    e = document.createEvent("Event");
    e.initEvent(name, bubbles, false);
    Object.defineProperties(e, {
      target: {
        value: elem
      },
      srcElement: {
        value: elem
      }
    });
    handleEvent(e);
  },

  /*
  	 * @private
  	 * @description
  	 * Attach all event listeners to the dom for delegation.
   */
  init: function() {
    var i, len, type;
    if (document.__tusk) {
      return;
    }
    for (i = 0, len = EVENTS.length; i < len; i++) {
      type = EVENTS[i];
      document.addEventListener(type, handleEvent, true);
    }
    document.__tusk = true;
  }
};


},{"./constants":14}],16:[function(require,module,exports){
var NODE, Node, _context, _owner, delegator, flatten, getDiff, ref, tusk;

Node = require("./virtual/node");

delegator = require("./delegator");

NODE = require("./constants").NODE;

ref = require("./util"), flatten = ref.flatten, getDiff = ref.getDiff;

_context = void 0;

_owner = void 0;


/*
 * @namespace tusk
 * @description
 * Utility to create virtual elements.
 * If the given type is a string then the resulting virtual node will be created with a tagname of that string.
 * Otherwise if the type is a function it will be invoked, and the returned nodes used.
 * ```javascript
 * // Create a virtual element.
 * tusk("div", { id: "example" }, ...); // -> Node
 * ```
 *
 * @param {(String|Function)} type - A nodeName or a function that returns a Node.
 * @param {Object} props - The events and attributes for the resulting element.
 * @param {Array} children - The children for the resulting element.
 * @throws {TypeError} type must be a function or a string.
 * @returns {(Node|*)}
 */

tusk = function(type, props) {
  var arr, children, len, node;
  len = arguments.length - 2;
  children = ((function() {
    if (len <= 0) {
      return [];
    } else {
      arr = new Array(arguments.length - 2);
      while (len--) {
        arr[len] = arguments[len + 2];
      }
      return flatten(arr);
    }
  }).apply(this, arguments));
  switch (typeof type) {
    case "string":
      return new Node(type, _owner, props, children);
    case "function":
      _owner = type;
      node = type(props, children, _context);
      _owner = void 0;
      return node;
    default:
      throw new TypeError("Tusk: Invalid virtual node type.");
  }
};


/*
 * @static
 * @alias tusk
 */

tusk.createElement = tusk;


/*
 * @static
 * @description
 * Render a virtual node onto an html entity.
 * This will automatically re-use existing dom and initialize a tusk app.
 * ```javascript
 * // Using jsx.
 * tusk.render(document.body, <body>Hello World!</body>);
 * document.body.innerHTML; //-> "Hello World"
 * ```
 *
 * @param {HTMLEntity} entity - The dom node to render the virtual node onto.
 * @param {Node} node - The virtual node to render.
 */

tusk.render = function(entity, node) {
  var client, curHTML, prevHTML, ref1, ref2, server;
  if (typeof window === "undefined") {
    throw new Error("Tusk: Cannot render on the server (use toString).");
  }
  if (!(entity instanceof window.Node)) {
    throw new Error("Tusk: Container must be a DOM element.");
  }
  if (!(node != null ? node.isTusk : void 0)) {
    throw new Error("Tusk: Can only render a virtual node.");
  }
  if (!((ref1 = entity[NODE]) != null ? ref1.update(node) : void 0)) {
    prevHTML = entity.outerHTML;
    curHTML = node.toString();
    if (curHTML === prevHTML) {
      node.mount(entity);
    } else {
      entity[NODE] = node;
      entity.parentNode.replaceChild(node.create(), entity);
      if (prevHTML != null) {
        ref2 = getDiff(prevHTML, curHTML), server = ref2[0], client = ref2[1];
        console.warn("Tusk: Could not bootstrap document, existing html and virtual html do not match.\n\nServer:\n" + server + "\n\nClient:\n" + client);
      }
    }
    delegator.init();
  }
};


/*
 * @static
 * @description
 * Utility to attach context to #createElement for sideways data loading.
 * The provided renderer will be immediately invoked.
 * ```javascript
 * let MyComponent = function (props, children, context) {
 * 	return (
 * 		<body>
 * 			Counter: { context.counter }
 * 		</body>
 * 	);
 * };
 *
 * tusk.render(document.body,
 * 	tusk.with({ counter: 1 }, function () {
 * 		return (
 * 			<MyCounter/>
 * 		);
 * 	});
 * );
 *
 * document.body.innerHTML; //-> "Counter: 1"
 * ```
 *
 * @param {*} context - A value that any custom render functions will be invoked with.
 * @param {Function} renderer - Any nodes rendered within the function will be called with the context.
 * @throws {TypeError} The result of renderer must be a Node.
 * @returns {(Node|Text)}
 */

tusk["with"] = function(context, renderer) {
  var node;
  if (typeof renderer !== "function") {
    throw new TypeError("Tusk: renderer should be a function.");
  }
  _context = context;
  node = renderer(context);
  _context = void 0;
  return node;
};

module.exports = tusk["default"] = tusk;


},{"./constants":14,"./delegator":15,"./util":17,"./virtual/node":18}],17:[function(require,module,exports){
var flatten;

module.exports = {

  /*
  	 * @private
  	 * @description
  	 * Escape special characters in the given string of html.
  	 *
  	 * @param {String} html - the html to escape.
  	 * @returns {String}
   */
  escapeHTML: function(html) {
    return String(html).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  },

  /*
  	 * @private
  	 * @description
  	 * Utility that recursively flattens an array.
  	 *
  	 * @param {Array} arr - The array to flatten.
  	 * @param {Array} acc - The resulting array.
  	 * @returns {Array}
   */
  flatten: flatten = function(arr, acc) {
    var item, j, len;
    if (acc == null) {
      acc = [];
    }
    for (j = 0, len = arr.length; j < len; j++) {
      item = arr[j];
      if ((item != null ? item.constructor : void 0) === Array) {
        flatten(item, acc);
      } else {
        acc.push(item);
      }
    }
    return acc;
  },

  /*
  	 * @private
  	 * @description
  	 * Returns a chunk surrounding the difference between two strings, useful for debugging.
  	 *
  	 * @param {String} a
  	 * @param {String} b
  	 * @returns {Array<String>}
   */
  getDiff: function(a, b) {
    var char, end, i, j, len, start;
    for (i = j = 0, len = a.length; j < len; i = ++j) {
      char = a[i];
      if (char !== b[i]) {
        break;
      }
    }
    start = Math.max(0, i - 20);
    end = start + 80;
    return [a.slice(start, Math.min(end, a.length)), b.slice(start, Math.min(end, b.length))];
  },

  /*
  	 * @private
  	 * @description
  	 * Utility that will update or set a given virtual nodes attributes.
  	 *
  	 * @param {HTMLEntity} elem - The entity to update.
  	 * @param {Object} prev - The previous attributes.
  	 * @param {Object} next - The updated attributes.
   */
  setAttrs: function(elem, prev, next) {
    var key, val;
    if (prev === next) {
      return;
    }
    for (key in next) {
      val = next[key];
      if (val !== prev[key]) {
        elem.setAttribute(key, val);
      }
    }
    for (key in prev) {
      if (!(key in next)) {
        elem.removeAttribute(key);
      }
    }
  },

  /*
  	 * @private
  	 * @description
  	 * Utility that will update or set a given virtual nodes children.
  	 *
  	 * @param {HTMLEntity} elem - The entity to update.
  	 * @param {Object} prev - The previous children.
  	 * @param {Object} next - The updated children.
   */
  setChildren: function(elem, prev, next) {
    var child, key, prevChild;
    if (prev === next) {
      return;
    }
    for (key in next) {
      child = next[key];
      if (key in prev) {
        (prevChild = prev[key]).update(child);
        if (prevChild.index === child.index) {
          continue;
        }
      } else {
        child.create();
      }
      elem.insertBefore(child._elem, elem.childNodes[child.index]);
    }
    for (key in prev) {
      child = prev[key];
      if (!(key in next)) {
        child.remove();
      }
    }
  }
};


},{}],18:[function(require,module,exports){
var NAMESPACES, NODE, Node, SELF_CLOSING, Text, dispatch, escapeHTML, normalizeChildren, ref, ref1, setAttrs, setChildren,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

ref = require("../constants"), SELF_CLOSING = ref.SELF_CLOSING, NODE = ref.NODE, NAMESPACES = ref.NAMESPACES;

ref1 = require("../util"), escapeHTML = ref1.escapeHTML, setAttrs = ref1.setAttrs, setChildren = ref1.setChildren;

dispatch = require("../delegator").dispatch;

Text = require("./text");


/*
 * @private
 * @description
 * Utility to recursively flatten a nested array into a keyed node list and cast non-nodes to Text.
 *
 * @param {Node} node
 * @param {(Array|Node)} cur
 * @param {Number} acc
 * @returns {Object}
 */

normalizeChildren = function(node, cur, acc) {
  var child, i, j, len;
  if (cur == null) {
    cur = " ";
  }
  if (acc == null) {
    acc = 0;
  }
  if (cur.constructor === Array) {
    for (i = j = 0, len = cur.length; j < len; i = ++j) {
      child = cur[i];
      normalizeChildren(node, child, acc + i);
    }
  } else {
    if (!cur.isTusk) {
      cur = new Text(cur);
    }
    if (cur.namespaceURI == null) {
      cur.namespaceURI = node.namespaceURI;
    }
    cur.index = acc;
    node.children[cur.key || acc] = cur;
  }
};


/*
 * @private
 * @class Node
 * @description
 * Creates a virtual dom node that can be later transformed into a real node and updated.
 *
 * @param {String} type - The tagname of the element.
 * @param {Object} owner - Information about the renderer of this node.
 * @param {Object} props - An object containing events and attributes.
 * @param {Array} children - The child nodeList for the element.
 */

Node = function(type, owner, props, children) {
  var key, ref2, val;
  this.type = type;
  this.owner = owner;
  this.namespaceURI = (this.type === "svg" ? NAMESPACES.SVG : this.type === "math" ? NAMESPACES.MATH_ML : void 0);
  this.attrs = {};
  this.events = {};
  this.children = {};
  if (props != null) {
    this.key = props.key;
    delete props.key;
    this.ignore = "ignore" in props && props.ignore !== false;
    delete props.ignore;
    this.innerHTML = props.innerHTML;
    delete props.innerHTML;
    for (key in props) {
      val = props[key];
      if (key.slice(0, 2) === "on") {
        this.events[key.slice(2).toLowerCase()] = val;
      } else if ((val != null) && val !== false) {
        this.attrs[key] = val;
      }
    }
  }
  if (!((this.innerHTML != null) || (ref2 = this.type, indexOf.call(SELF_CLOSING, ref2) >= 0))) {
    normalizeChildren(this, children);
  }
};


/*
 * @private
 * @constant
 * @description
 * Mark instances as a tusk nodes.
 */

Node.prototype.isTusk = true;


/*
 * @private
 * @description
 * Bootstraps event listeners and children from a virtual node.
 *
 * @param {HTMLEntity} elem
 */

Node.prototype.mount = function(elem) {
  var child, childNodes, key, ref2;
  this._elem = (childNodes = elem.childNodes, elem);
  elem[NODE] = this;
  if (this.innerHTML == null) {
    ref2 = this.children;
    for (key in ref2) {
      child = ref2[key];
      child.mount(childNodes[child.index || key]);
    }
  }
  dispatch("mount", elem);
};


/*
 * @private
 * @description
 * Triggers dismount on this node and all of its children.
 */

Node.prototype.dismount = function() {
  var child, key, ref2;
  dispatch("dismount", this._elem);
  ref2 = this.children;
  for (key in ref2) {
    child = ref2[key];
    if (typeof child.dismount === "function") {
      child.dismount();
    }
  }
};


/*
 * @private
 * @description
 * Creates a real node out of the virtual node and returns it.
 *
 * @returns {HTMLEntity}
 */

Node.prototype.create = function() {
  var attrs, children, elem, prev;
  elem = this._elem != null ? this._elem : this._elem = document.createElementNS(this.namespaceURI || NAMESPACES.HTML, this.type);
  prev = elem[NODE];
  elem[NODE] = this;
  if (prev) {
    attrs = prev.attrs, children = prev.children;
  } else {
    attrs = children = {};
  }
  setAttrs(elem, attrs, this.attrs);
  if (this.innerHTML != null) {
    elem.innerHTML = this.innerHTML;
  } else {
    setChildren(elem, children, this.children);
  }
  dispatch("mount", elem);
  return elem;
};


/*
 * @private
 * @description
 * Given a different virtual node it will compare the nodes an update the real node accordingly.
 *
 * @param {Node} updated
 * @returns {Node}
 */

Node.prototype.update = function(updated) {
  var newOwner;
  if (this === updated) {
    return this;
  }
  if (this.ignore && updated.ignore) {
    return this;
  }
  if (this.type !== updated.type) {
    this._elem.parentNode.insertBefore(updated.create(), this._elem);
    this.remove();
  } else {
    newOwner = this.owner !== updated.owner;
    if (newOwner) {
      dispatch("dismount", this._elem);
    }
    this._elem[NODE] = updated;
    updated._elem = this._elem;
    setAttrs(this._elem, this.attrs, updated.attrs);
    if (updated.innerHTML != null) {
      if (this.innerHTML !== updated.innerHTML) {
        this._elem.innerHTML = updated.innerHTML;
      }
    } else {
      if (this.innerHTML != null) {
        while (this._elem.firstChild) {
          this._elem.removeChild(this._elem.firstChild);
        }
      }
      setChildren(this._elem, this.children, updated.children);
    }
    if (newOwner) {
      dispatch("mount", this._elem);
    }
  }
  return updated;
};


/*
 * @private
 * @description
 * Removes the current node from it's parent.
 */

Node.prototype.remove = function() {
  this.dismount();
  return this._elem.parentNode.removeChild(this._elem);
};


/*
 * @description
 * Generate valid html for the virtual node.
 *
 * @returns {String}
 */

Node.prototype.toString = function() {
  var attrs, child, children, key, ref2, ref3, ref4, val;
  attrs = children = "";
  ref2 = this.attrs;
  for (key in ref2) {
    val = ref2[key];
    attrs += " " + key + "=\"" + (escapeHTML(val)) + "\"";
  }
  if (this.innerHTML != null) {
    children = this.innerHTML;
  } else {
    ref3 = this.children;
    for (key in ref3) {
      child = ref3[key];
      children += child;
    }
  }
  if (ref4 = this.type, indexOf.call(SELF_CLOSING, ref4) >= 0) {
    return "<" + (this.type + attrs) + ">";
  } else {
    return "<" + (this.type + attrs) + ">" + children + "</" + this.type + ">";
  }
};

module.exports = Node;


},{"../constants":14,"../delegator":15,"../util":17,"./text":19}],19:[function(require,module,exports){
var Text, escapeHTML;

escapeHTML = require("../util").escapeHTML;


/*
 * @private
 * @class Text
 * @description
 * Creates a virtual text node that can be later transformed into a real node and updated.
 *
 * @param {String} value - the nodeValue for the text node.
 */

Text = function(value) {
  this.value = String(value);
};


/*
 * @private
 * @constant
 * @description
 * Mark instances as a tusk nodes.
 *
 */

Text.prototype.isTusk = true;


/*
 * @private
 * @description
 * Ensures that the provided element's node value matches the virtual value.
 *
 * @param {HTMLEntity} elem
 */

Text.prototype.mount = function(elem) {
  var nodeValue;
  this._elem = (nodeValue = elem.nodeValue, elem);
  if (this.value !== nodeValue) {
    elem.splitText(nodeValue.indexOf(this.value) + this.value.length);
  }
};


/*
 * @private
 * @description
 * Creates a real text node out of the virtual text node and returns it.
 *
 * @returns {HTMLEntity}
 */

Text.prototype.create = function() {
  if (this._elem == null) {
    this._elem = document.createTextNode(this.value);
  }
  if (this._elem.nodeValue !== this.value) {
    this._elem.nodeValue = this.value;
  }
  return this._elem;
};


/*
 * @private
 * @description
 * Given a different virtual node it will compare the nodes an update the real node accordingly.
 *
 * @param {(Node|Text)} updated
 * @returns {(Node|Text)}
 */

Text.prototype.update = function(updated) {
  if (this === updated) {
    return this;
  }
  if (updated.constructor === Text) {
    updated._elem = this._elem;
    if (this.value !== updated.value) {
      this._elem.nodeValue = updated.value;
    }
  } else {
    this._elem.parentNode.replaceChild(updated.create(), this._elem);
  }
  return updated;
};


/*
 * @private
 * @description
 * Removes the current text node from it's parent.
 */

Text.prototype.remove = function() {
  return this._elem.parentNode.removeChild(this._elem);
};


/*
 * @description
 * Generate a valid escaped html string for the virtual text node.
 *
 * @returns {String}
 */

Text.prototype.toString = function() {
  return escapeHTML(this.value);
};

module.exports = Text;


},{"../util":17}],20:[function(require,module,exports){
/** @jsx tusk */;
var assert, delegate, details, immstruct, tusk;

assert = require("assert");

immstruct = require("immstruct");

details = require("../package.json");

tusk = require("../src/index");

delegate = require("../src/delegator");

describe(details.name + "@" + details.version + " - Function", function() {
  if (typeof document === "undefined") {
    require("mocha-jsdom")();
  }
  beforeEach(function() {
    return delegate.init();
  });
  describe("Virtual component", function() {
    it("should be able to create", function() {
      var ChildComponent, MyComponent;
      ChildComponent = function(props, children) {
        var child, i;
        return tusk.createElement("h1", null, (function() {
          var j, len, results;
          results = [];
          for (i = j = 0, len = children.length; j < len; i = ++j) {
            child = children[i];
            child.attrs["class"] = "child-" + i;
            results.push(child);
          }
          return results;
        })());
      };
      MyComponent = function(arg, children) {
        var i, value;
        value = arg.value;
        return tusk.createElement("div", null, tusk.createElement(ChildComponent, {
          "value": value * 2
        }, (function() {
          var j, ref, results;
          results = [];
          for (i = j = 0, ref = value; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
            results.push(tusk.createElement("span", null, i));
          }
          return results;
        })()));
      };
      return assert.equal(tusk.createElement(MyComponent, {
        "value": 5.
      }), "<div>\n	<h1>\n		<span class=\"child-0\">0</span>\n		<span class=\"child-1\">1</span>\n		<span class=\"child-2\">2</span>\n		<span class=\"child-3\">3</span>\n		<span class=\"child-4\">4</span>\n		<span class=\"child-5\">5</span>\n	</h1>\n</div>".replace(/\t|\n/g, ""));
    });
    return it("should be able to set a context", function() {
      var MyComponent;
      MyComponent = function(props, children, context) {
        return tusk.createElement("div", null, context);
      };
      return assert.equal(tusk["with"](1, function() {
        return tusk.createElement(MyComponent, null);
      }), "<div>1</div>");
    });
  });
  return describe("Document Component", function() {
    it("should render with immutable state", function() {
      var MyCounter, i, j, render, struct;
      struct = immstruct({
        i: 0
      });
      MyCounter = function(arg, children) {
        var cursor, handleClick, message;
        message = arg.message, cursor = arg.cursor;
        handleClick = function() {
          return cursor.update(function(state) {
            return state.set("i", state.get("i") + 1);
          });
        };
        return tusk.createElement("button", {
          "onClick": handleClick
        }, message, " : ", cursor.get('i'));
      };
      document.body.innerHTML = tusk.createElement(MyCounter, {
        "message": "Times clicked",
        "cursor": struct.cursor()
      });
      render = function() {
        return tusk.render(document.body.firstChild, tusk.createElement(MyCounter, {
          "message": "Times clicked",
          "cursor": struct.cursor()
        }));
      };
      render();
      struct.on("swap", render);
      for (i = j = 0; j < 5; i = ++j) {
        document.body.firstChild.click();
      }
      return assert.equal(document.body.innerHTML, "<button>Times clicked : 5</button>");
    });
    return it("should trigger mount and dismount with owner change", function(done) {
      var ComponentA, ComponentB, elem;
      ComponentA = function() {
        return tusk.createElement("div", {
          "onDismount": (function() {
            return done();
          })
        });
      };
      ComponentB = function() {
        return tusk.createElement("div", null);
      };
      elem = document.createElement("div");
      document.body.appendChild(elem);
      tusk.render(elem, tusk.createElement(ComponentA, null));
      return tusk.render(elem, tusk.createElement(ComponentB, null));
    });
  });
});


},{"../package.json":13,"../src/delegator":15,"../src/index":16,"assert":2,"immstruct":7,"mocha-jsdom":1}],21:[function(require,module,exports){
/** @jsx tusk */;
var NAMESPACES, assert, delegate, details, tusk;

assert = require("assert");

details = require("../package.json");

tusk = require("../src/index");

delegate = require("../src/delegator");

NAMESPACES = require("../src/constants").NAMESPACES;

describe(details.name + "@" + details.version + " - Node", function() {
  if (typeof document === "undefined") {
    require("mocha-jsdom")();
  }
  beforeEach(function() {
    return delegate.init();
  });
  describe("Virtual node", function() {
    it("should be able to create", function() {
      var node;
      node = tusk.createElement("div", null);
      return assert.equal(node.type, "div");
    });
    it("should be able to set attributes", function() {
      var node;
      node = tusk.createElement("div", {
        "test": true
      });
      assert.equal(node.type, "div");
      return assert.deepEqual(node.attrs, {
        test: true
      });
    });
    it("should add children", function() {
      var node;
      node = tusk.createElement("div", null, [1, 2, 3]);
      assert.equal(node.type, "div");
      return assert.equal(Object.keys(node.children).length, 3);
    });
    it("should set innerHTML", function() {
      var node;
      node = tusk.createElement("div", {
        "innerHTML": "<span></span>"
      });
      assert.equal(node.type, "div");
      assert.equal(node.innerHTML, "<span></span>");
      return assert.equal(String(node), "<div><span></span></div>");
    });
    return it("should inherit parents namespace", function() {
      var node;
      node = tusk.createElement("svg", null, tusk.createElement("circle", null));
      assert.equal(node.namespaceURI, NAMESPACES.SVG);
      return assert.equal(node.children[0].namespaceURI, NAMESPACES.SVG);
    });
  });
  return describe("Document node", function() {
    it("should be able to create", function() {
      var elem, node;
      node = tusk.createElement("div", null);
      elem = node.create();
      assert.equal(elem.nodeName, "DIV");
      return assert.equal(elem.outerHTML, "<div></div>");
    });
    it("should be able to set attributes", function() {
      var elem, node;
      node = tusk.createElement("div", {
        "test": true
      });
      elem = node.create();
      assert.equal(elem.nodeName, "DIV");
      return assert.equal(elem.outerHTML, '<div test="true"></div>');
    });
    it("should add children", function() {
      var elem, node;
      node = tusk.createElement("div", null, [1, 2, 3]);
      elem = node.create();
      assert.equal(elem.nodeName, "DIV");
      return assert.equal(elem.outerHTML, "<div>123</div>");
    });
    it("should set innerHTML", function() {
      var elem, node;
      node = tusk.createElement("div", {
        "innerHTML": "<span></span>"
      });
      elem = node.create();
      assert.equal(elem.nodeName, "DIV");
      return assert.equal(elem.outerHTML, '<div><span></span></div>');
    });
    it("should inherit parents namespace", function() {
      var elem, node, parent;
      parent = document.createElement("div");
      node = tusk.createElement("svg", null, tusk.createElement("circle", null));
      elem = node.create();
      assert.equal(elem.namespaceURI, NAMESPACES.SVG);
      return assert.equal(elem.firstChild.namespaceURI, NAMESPACES.SVG);
    });
    it("should be able to update", function() {
      var node, parent;
      parent = document.createElement("div");
      node = tusk.createElement("div", {
        "test": 1.
      }, "content");
      parent.appendChild(node.create());
      assert.equal(parent.innerHTML, '<div test="1">content</div>');
      node = node.update(tusk.createElement("span", {
        "test": 1.
      }, "content"));
      assert.equal(parent.innerHTML, '<span test="1">content</span>');
      node = node.update(tusk.createElement("span", {
        "test": 2.
      }, "content"));
      assert.equal(parent.innerHTML, '<span test="2">content</span>');
      node = node.update(tusk.createElement("span", {
        "test": 2.
      }, "updated"));
      return assert.equal(parent.innerHTML, '<span test="2">updated</span>');
    });
    it("should not update ignored nodes", function() {
      var node, parent;
      parent = document.createElement("div");
      node = tusk.createElement("div", {
        "ignore": true,
        "test": 1.
      }, "content");
      parent.appendChild(node.create());
      assert.equal(parent.innerHTML, '<div test="1">content</div>');
      node = node.update(tusk.createElement("span", {
        "ignore": true,
        "test": 1.
      }, "content"));
      assert.equal(parent.innerHTML, '<div test="1">content</div>');
      node = node.update(tusk.createElement("span", {
        "ignore": true,
        "test": 2.
      }, "content"));
      assert.equal(parent.innerHTML, '<div test="1">content</div>');
      node = node.update(tusk.createElement("span", {
        "ignore": true,
        "test": 2.
      }, "updated"));
      return assert.equal(parent.innerHTML, '<div test="1">content</div>');
    });
    it("should keep track of keyed nodes", function() {
      var initialChildren, node, parent, updatedChildren;
      parent = document.createElement("div");
      node = tusk.createElement("div", null, tusk.createElement("div", {
        "key": "0"
      }), tusk.createElement("span", {
        "key": "1"
      }), tusk.createElement("a", {
        "key": "2"
      }));
      parent.appendChild(node.create());
      initialChildren = [].slice.call(parent.childNodes[0].childNodes);
      node.update(tusk.createElement("div", null, tusk.createElement("span", {
        "key": "1"
      }), tusk.createElement("a", {
        "key": "2"
      }), tusk.createElement("div", {
        "key": "0"
      })));
      updatedChildren = [].slice.call(parent.childNodes[0].childNodes);
      assert.equal(initialChildren[0], updatedChildren[2]);
      assert.equal(initialChildren[1], updatedChildren[0]);
      return assert.equal(initialChildren[2], updatedChildren[1]);
    });
    it("should be able to bootstrap existing dom", function() {
      var div, html, root;
      div = document.createElement("div");
      html = div.innerHTML = String(tusk.createElement("div", null));
      root = div.childNodes[0];
      tusk.render(div.firstChild, tusk.createElement("div", null));
      assert.equal(div.innerHTML, "<div></div>");
      return assert(div.childNodes[0] === root);
    });
    it("should listen for events", function(done) {
      var elem;
      elem = document.createElement("div");
      document.body.appendChild(elem);
      tusk.createElement("div", {
        "onClick": (function() {
          return done();
        })
      }).mount(elem);
      return elem.click();
    });
    it("should have a mount event", function(done) {
      var elem;
      elem = document.createElement("div");
      document.body.appendChild(elem);
      return tusk.createElement("div", {
        "onMount": (function() {
          return done();
        })
      }).mount(elem);
    });
    return it("should have a dismount event", function(done) {
      var elem, node;
      elem = document.createElement("div");
      document.body.appendChild(elem);
      node = tusk.createElement("div", {
        "onDismount": (function() {
          return done();
        })
      });
      node.mount(elem);
      return node.update(tusk.createElement("span", null));
    });
  });
});


},{"../package.json":13,"../src/constants":14,"../src/delegator":15,"../src/index":16,"assert":2,"mocha-jsdom":1}]},{},[20,21])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9saWIvX2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2Fzc2VydC9hc3NlcnQuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvaW5oZXJpdHMvaW5oZXJpdHNfYnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvdXRpbC9zdXBwb3J0L2lzQnVmZmVyQnJvd3Nlci5qcyIsIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy91dGlsL3V0aWwuanMiLCJub2RlX21vZHVsZXMvaW1tc3RydWN0L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ltbXN0cnVjdC9ub2RlX21vZHVsZXMvZXZlbnRlbWl0dGVyMy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pbW1zdHJ1Y3Qvbm9kZV9tb2R1bGVzL2ltbXV0YWJsZS9jb250cmliL2N1cnNvci9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9pbW1zdHJ1Y3Qvbm9kZV9tb2R1bGVzL2ltbXV0YWJsZS9kaXN0L2ltbXV0YWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9pbW1zdHJ1Y3Qvc3JjL3N0cnVjdHVyZS5qcyIsIm5vZGVfbW9kdWxlcy9pbW1zdHJ1Y3Qvc3JjL3V0aWxzLmpzIiwicGFja2FnZS5qc29uIiwiL1VzZXJzL2R5bGFucGllcmNleS9TdWJsaW1lL3R1c2svc3JjL2NvbnN0YW50cy5jb2ZmZWUiLCIvVXNlcnMvZHlsYW5waWVyY2V5L1N1YmxpbWUvdHVzay9zcmMvZGVsZWdhdG9yLmNvZmZlZSIsIi9Vc2Vycy9keWxhbnBpZXJjZXkvU3VibGltZS90dXNrL3NyYy9pbmRleC5jb2ZmZWUiLCIvVXNlcnMvZHlsYW5waWVyY2V5L1N1YmxpbWUvdHVzay9zcmMvdXRpbC5jb2ZmZWUiLCIvVXNlcnMvZHlsYW5waWVyY2V5L1N1YmxpbWUvdHVzay9zcmMvdmlydHVhbC9ub2RlLmNvZmZlZSIsIi9Vc2Vycy9keWxhbnBpZXJjZXkvU3VibGltZS90dXNrL3NyYy92aXJ0dWFsL3RleHQuY29mZmVlIiwiL1VzZXJzL2R5bGFucGllcmNleS9TdWJsaW1lL3R1c2svdGVzdC9mdW5jdGlvblRlc3QuY29mZmVlIiwiL1VzZXJzL2R5bGFucGllcmNleS9TdWJsaW1lL3R1c2svdGVzdC9ub2RlVGVzdC5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdldBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDMWtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9OQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvMUpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzV0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFD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V0FBZCxDQUEwQixJQUExQjtNQUNBLElBQUEsR0FBTyxJQUFJLENBQUMsYUFBTCxDQUFtQixLQUFuQixFQUEwQjtRQUFDLFlBQUEsRUFBYyxDQUFFLFNBQUE7aUJBQUcsSUFBQSxDQUFBO1FBQUgsQ0FBRixDQUFmO09BQTFCO01BQ1AsSUFBSSxDQUFDLEtBQUwsQ0FBVyxJQUFYO2FBQ0EsSUFBSSxDQUFDLE1BQUwsQ0FBWSxJQUFJLENBQUMsYUFBTCxDQUFtQixNQUFuQixFQUEyQixJQUEzQixDQUFaO0lBTGtDLENBQW5DO0VBeEh5QixDQUExQjtBQWxDcUQsQ0FBdEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIixudWxsLCIvLyBodHRwOi8vd2lraS5jb21tb25qcy5vcmcvd2lraS9Vbml0X1Rlc3RpbmcvMS4wXG4vL1xuLy8gVEhJUyBJUyBOT1QgVEVTVEVEIE5PUiBMSUtFTFkgVE8gV09SSyBPVVRTSURFIFY4IVxuLy9cbi8vIE9yaWdpbmFsbHkgZnJvbSBuYXJ3aGFsLmpzIChodHRwOi8vbmFyd2hhbGpzLm9yZylcbi8vIENvcHlyaWdodCAoYykgMjAwOSBUaG9tYXMgUm9iaW5zb24gPDI4MG5vcnRoLmNvbT5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4vLyBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSAnU29mdHdhcmUnKSwgdG9cbi8vIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlXG4vLyByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Jcbi8vIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4vLyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluXG4vLyBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgJ0FTIElTJywgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuLy8gSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4vLyBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbi8vIEFVVEhPUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOXG4vLyBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OXG4vLyBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxuLy8gd2hlbiB1c2VkIGluIG5vZGUsIHRoaXMgd2lsbCBhY3R1YWxseSBsb2FkIHRoZSB1dGlsIG1vZHVsZSB3ZSBkZXBlbmQgb25cbi8vIHZlcnN1cyBsb2FkaW5nIHRoZSBidWlsdGluIHV0aWwgbW9kdWxlIGFzIGhhcHBlbnMgb3RoZXJ3aXNlXG4vLyB0aGlzIGlzIGEgYnVnIGluIG5vZGUgbW9kdWxlIGxvYWRpbmcgYXMgZmFyIGFzIEkgYW0gY29uY2VybmVkXG52YXIgdXRpbCA9IHJlcXVpcmUoJ3V0aWwvJyk7XG5cbnZhciBwU2xpY2UgPSBBcnJheS5wcm90b3R5cGUuc2xpY2U7XG52YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLy8gMS4gVGhlIGFzc2VydCBtb2R1bGUgcHJvdmlkZXMgZnVuY3Rpb25zIHRoYXQgdGhyb3dcbi8vIEFzc2VydGlvbkVycm9yJ3Mgd2hlbiBwYXJ0aWN1bGFyIGNvbmRpdGlvbnMgYXJlIG5vdCBtZXQuIFRoZVxuLy8gYXNzZXJ0IG1vZHVsZSBtdXN0IGNvbmZvcm0gdG8gdGhlIGZvbGxvd2luZyBpbnRlcmZhY2UuXG5cbnZhciBhc3NlcnQgPSBtb2R1bGUuZXhwb3J0cyA9IG9rO1xuXG4vLyAyLiBUaGUgQXNzZXJ0aW9uRXJyb3IgaXMgZGVmaW5lZCBpbiBhc3NlcnQuXG4vLyBuZXcgYXNzZXJ0LkFzc2VydGlvbkVycm9yKHsgbWVzc2FnZTogbWVzc2FnZSxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhY3R1YWw6IGFjdHVhbCxcbi8vICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleHBlY3RlZDogZXhwZWN0ZWQgfSlcblxuYXNzZXJ0LkFzc2VydGlvbkVycm9yID0gZnVuY3Rpb24gQXNzZXJ0aW9uRXJyb3Iob3B0aW9ucykge1xuICB0aGlzLm5hbWUgPSAnQXNzZXJ0aW9uRXJyb3InO1xuICB0aGlzLmFjdHVhbCA9IG9wdGlvbnMuYWN0dWFsO1xuICB0aGlzLmV4cGVjdGVkID0gb3B0aW9ucy5leHBlY3RlZDtcbiAgdGhpcy5vcGVyYXRvciA9IG9wdGlvbnMub3BlcmF0b3I7XG4gIGlmIChvcHRpb25zLm1lc3NhZ2UpIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBvcHRpb25zLm1lc3NhZ2U7XG4gICAgdGhpcy5nZW5lcmF0ZWRNZXNzYWdlID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5tZXNzYWdlID0gZ2V0TWVzc2FnZSh0aGlzKTtcbiAgICB0aGlzLmdlbmVyYXRlZE1lc3NhZ2UgPSB0cnVlO1xuICB9XG4gIHZhciBzdGFja1N0YXJ0RnVuY3Rpb24gPSBvcHRpb25zLnN0YWNrU3RhcnRGdW5jdGlvbiB8fCBmYWlsO1xuXG4gIGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuICAgIEVycm9yLmNhcHR1cmVTdGFja1RyYWNlKHRoaXMsIHN0YWNrU3RhcnRGdW5jdGlvbik7XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gbm9uIHY4IGJyb3dzZXJzIHNvIHdlIGNhbiBoYXZlIGEgc3RhY2t0cmFjZVxuICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoKTtcbiAgICBpZiAoZXJyLnN0YWNrKSB7XG4gICAgICB2YXIgb3V0ID0gZXJyLnN0YWNrO1xuXG4gICAgICAvLyB0cnkgdG8gc3RyaXAgdXNlbGVzcyBmcmFtZXNcbiAgICAgIHZhciBmbl9uYW1lID0gc3RhY2tTdGFydEZ1bmN0aW9uLm5hbWU7XG4gICAgICB2YXIgaWR4ID0gb3V0LmluZGV4T2YoJ1xcbicgKyBmbl9uYW1lKTtcbiAgICAgIGlmIChpZHggPj0gMCkge1xuICAgICAgICAvLyBvbmNlIHdlIGhhdmUgbG9jYXRlZCB0aGUgZnVuY3Rpb24gZnJhbWVcbiAgICAgICAgLy8gd2UgbmVlZCB0byBzdHJpcCBvdXQgZXZlcnl0aGluZyBiZWZvcmUgaXQgKGFuZCBpdHMgbGluZSlcbiAgICAgICAgdmFyIG5leHRfbGluZSA9IG91dC5pbmRleE9mKCdcXG4nLCBpZHggKyAxKTtcbiAgICAgICAgb3V0ID0gb3V0LnN1YnN0cmluZyhuZXh0X2xpbmUgKyAxKTtcbiAgICAgIH1cblxuICAgICAgdGhpcy5zdGFjayA9IG91dDtcbiAgICB9XG4gIH1cbn07XG5cbi8vIGFzc2VydC5Bc3NlcnRpb25FcnJvciBpbnN0YW5jZW9mIEVycm9yXG51dGlsLmluaGVyaXRzKGFzc2VydC5Bc3NlcnRpb25FcnJvciwgRXJyb3IpO1xuXG5mdW5jdGlvbiByZXBsYWNlcihrZXksIHZhbHVlKSB7XG4gIGlmICh1dGlsLmlzVW5kZWZpbmVkKHZhbHVlKSkge1xuICAgIHJldHVybiAnJyArIHZhbHVlO1xuICB9XG4gIGlmICh1dGlsLmlzTnVtYmVyKHZhbHVlKSAmJiAhaXNGaW5pdGUodmFsdWUpKSB7XG4gICAgcmV0dXJuIHZhbHVlLnRvU3RyaW5nKCk7XG4gIH1cbiAgaWYgKHV0aWwuaXNGdW5jdGlvbih2YWx1ZSkgfHwgdXRpbC5pc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICByZXR1cm4gdmFsdWUudG9TdHJpbmcoKTtcbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIHRydW5jYXRlKHMsIG4pIHtcbiAgaWYgKHV0aWwuaXNTdHJpbmcocykpIHtcbiAgICByZXR1cm4gcy5sZW5ndGggPCBuID8gcyA6IHMuc2xpY2UoMCwgbik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHM7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0TWVzc2FnZShzZWxmKSB7XG4gIHJldHVybiB0cnVuY2F0ZShKU09OLnN0cmluZ2lmeShzZWxmLmFjdHVhbCwgcmVwbGFjZXIpLCAxMjgpICsgJyAnICtcbiAgICAgICAgIHNlbGYub3BlcmF0b3IgKyAnICcgK1xuICAgICAgICAgdHJ1bmNhdGUoSlNPTi5zdHJpbmdpZnkoc2VsZi5leHBlY3RlZCwgcmVwbGFjZXIpLCAxMjgpO1xufVxuXG4vLyBBdCBwcmVzZW50IG9ubHkgdGhlIHRocmVlIGtleXMgbWVudGlvbmVkIGFib3ZlIGFyZSB1c2VkIGFuZFxuLy8gdW5kZXJzdG9vZCBieSB0aGUgc3BlYy4gSW1wbGVtZW50YXRpb25zIG9yIHN1YiBtb2R1bGVzIGNhbiBwYXNzXG4vLyBvdGhlciBrZXlzIHRvIHRoZSBBc3NlcnRpb25FcnJvcidzIGNvbnN0cnVjdG9yIC0gdGhleSB3aWxsIGJlXG4vLyBpZ25vcmVkLlxuXG4vLyAzLiBBbGwgb2YgdGhlIGZvbGxvd2luZyBmdW5jdGlvbnMgbXVzdCB0aHJvdyBhbiBBc3NlcnRpb25FcnJvclxuLy8gd2hlbiBhIGNvcnJlc3BvbmRpbmcgY29uZGl0aW9uIGlzIG5vdCBtZXQsIHdpdGggYSBtZXNzYWdlIHRoYXRcbi8vIG1heSBiZSB1bmRlZmluZWQgaWYgbm90IHByb3ZpZGVkLiAgQWxsIGFzc2VydGlvbiBtZXRob2RzIHByb3ZpZGVcbi8vIGJvdGggdGhlIGFjdHVhbCBhbmQgZXhwZWN0ZWQgdmFsdWVzIHRvIHRoZSBhc3NlcnRpb24gZXJyb3IgZm9yXG4vLyBkaXNwbGF5IHB1cnBvc2VzLlxuXG5mdW5jdGlvbiBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsIG9wZXJhdG9yLCBzdGFja1N0YXJ0RnVuY3Rpb24pIHtcbiAgdGhyb3cgbmV3IGFzc2VydC5Bc3NlcnRpb25FcnJvcih7XG4gICAgbWVzc2FnZTogbWVzc2FnZSxcbiAgICBhY3R1YWw6IGFjdHVhbCxcbiAgICBleHBlY3RlZDogZXhwZWN0ZWQsXG4gICAgb3BlcmF0b3I6IG9wZXJhdG9yLFxuICAgIHN0YWNrU3RhcnRGdW5jdGlvbjogc3RhY2tTdGFydEZ1bmN0aW9uXG4gIH0pO1xufVxuXG4vLyBFWFRFTlNJT04hIGFsbG93cyBmb3Igd2VsbCBiZWhhdmVkIGVycm9ycyBkZWZpbmVkIGVsc2V3aGVyZS5cbmFzc2VydC5mYWlsID0gZmFpbDtcblxuLy8gNC4gUHVyZSBhc3NlcnRpb24gdGVzdHMgd2hldGhlciBhIHZhbHVlIGlzIHRydXRoeSwgYXMgZGV0ZXJtaW5lZFxuLy8gYnkgISFndWFyZC5cbi8vIGFzc2VydC5vayhndWFyZCwgbWVzc2FnZV9vcHQpO1xuLy8gVGhpcyBzdGF0ZW1lbnQgaXMgZXF1aXZhbGVudCB0byBhc3NlcnQuZXF1YWwodHJ1ZSwgISFndWFyZCxcbi8vIG1lc3NhZ2Vfb3B0KTsuIFRvIHRlc3Qgc3RyaWN0bHkgZm9yIHRoZSB2YWx1ZSB0cnVlLCB1c2Vcbi8vIGFzc2VydC5zdHJpY3RFcXVhbCh0cnVlLCBndWFyZCwgbWVzc2FnZV9vcHQpOy5cblxuZnVuY3Rpb24gb2sodmFsdWUsIG1lc3NhZ2UpIHtcbiAgaWYgKCF2YWx1ZSkgZmFpbCh2YWx1ZSwgdHJ1ZSwgbWVzc2FnZSwgJz09JywgYXNzZXJ0Lm9rKTtcbn1cbmFzc2VydC5vayA9IG9rO1xuXG4vLyA1LiBUaGUgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHNoYWxsb3csIGNvZXJjaXZlIGVxdWFsaXR5IHdpdGhcbi8vID09LlxuLy8gYXNzZXJ0LmVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmVxdWFsID0gZnVuY3Rpb24gZXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSkge1xuICBpZiAoYWN0dWFsICE9IGV4cGVjdGVkKSBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICc9PScsIGFzc2VydC5lcXVhbCk7XG59O1xuXG4vLyA2LiBUaGUgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igd2hldGhlciB0d28gb2JqZWN0cyBhcmUgbm90IGVxdWFsXG4vLyB3aXRoICE9IGFzc2VydC5ub3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RFcXVhbCA9IGZ1bmN0aW9uIG5vdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PSBleHBlY3RlZCkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJyE9JywgYXNzZXJ0Lm5vdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gNy4gVGhlIGVxdWl2YWxlbmNlIGFzc2VydGlvbiB0ZXN0cyBhIGRlZXAgZXF1YWxpdHkgcmVsYXRpb24uXG4vLyBhc3NlcnQuZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0LmRlZXBFcXVhbCA9IGZ1bmN0aW9uIGRlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmICghX2RlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIGZhaWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZSwgJ2RlZXBFcXVhbCcsIGFzc2VydC5kZWVwRXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpIHtcbiAgLy8gNy4xLiBBbGwgaWRlbnRpY2FsIHZhbHVlcyBhcmUgZXF1aXZhbGVudCwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuIHRydWU7XG5cbiAgfSBlbHNlIGlmICh1dGlsLmlzQnVmZmVyKGFjdHVhbCkgJiYgdXRpbC5pc0J1ZmZlcihleHBlY3RlZCkpIHtcbiAgICBpZiAoYWN0dWFsLmxlbmd0aCAhPSBleHBlY3RlZC5sZW5ndGgpIHJldHVybiBmYWxzZTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYWN0dWFsLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoYWN0dWFsW2ldICE9PSBleHBlY3RlZFtpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuXG4gIC8vIDcuMi4gSWYgdGhlIGV4cGVjdGVkIHZhbHVlIGlzIGEgRGF0ZSBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgRGF0ZSBvYmplY3QgdGhhdCByZWZlcnMgdG8gdGhlIHNhbWUgdGltZS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzRGF0ZShhY3R1YWwpICYmIHV0aWwuaXNEYXRlKGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwuZ2V0VGltZSgpID09PSBleHBlY3RlZC5nZXRUaW1lKCk7XG5cbiAgLy8gNy4zIElmIHRoZSBleHBlY3RlZCB2YWx1ZSBpcyBhIFJlZ0V4cCBvYmplY3QsIHRoZSBhY3R1YWwgdmFsdWUgaXNcbiAgLy8gZXF1aXZhbGVudCBpZiBpdCBpcyBhbHNvIGEgUmVnRXhwIG9iamVjdCB3aXRoIHRoZSBzYW1lIHNvdXJjZSBhbmRcbiAgLy8gcHJvcGVydGllcyAoYGdsb2JhbGAsIGBtdWx0aWxpbmVgLCBgbGFzdEluZGV4YCwgYGlnbm9yZUNhc2VgKS5cbiAgfSBlbHNlIGlmICh1dGlsLmlzUmVnRXhwKGFjdHVhbCkgJiYgdXRpbC5pc1JlZ0V4cChleHBlY3RlZCkpIHtcbiAgICByZXR1cm4gYWN0dWFsLnNvdXJjZSA9PT0gZXhwZWN0ZWQuc291cmNlICYmXG4gICAgICAgICAgIGFjdHVhbC5nbG9iYWwgPT09IGV4cGVjdGVkLmdsb2JhbCAmJlxuICAgICAgICAgICBhY3R1YWwubXVsdGlsaW5lID09PSBleHBlY3RlZC5tdWx0aWxpbmUgJiZcbiAgICAgICAgICAgYWN0dWFsLmxhc3RJbmRleCA9PT0gZXhwZWN0ZWQubGFzdEluZGV4ICYmXG4gICAgICAgICAgIGFjdHVhbC5pZ25vcmVDYXNlID09PSBleHBlY3RlZC5pZ25vcmVDYXNlO1xuXG4gIC8vIDcuNC4gT3RoZXIgcGFpcnMgdGhhdCBkbyBub3QgYm90aCBwYXNzIHR5cGVvZiB2YWx1ZSA9PSAnb2JqZWN0JyxcbiAgLy8gZXF1aXZhbGVuY2UgaXMgZGV0ZXJtaW5lZCBieSA9PS5cbiAgfSBlbHNlIGlmICghdXRpbC5pc09iamVjdChhY3R1YWwpICYmICF1dGlsLmlzT2JqZWN0KGV4cGVjdGVkKSkge1xuICAgIHJldHVybiBhY3R1YWwgPT0gZXhwZWN0ZWQ7XG5cbiAgLy8gNy41IEZvciBhbGwgb3RoZXIgT2JqZWN0IHBhaXJzLCBpbmNsdWRpbmcgQXJyYXkgb2JqZWN0cywgZXF1aXZhbGVuY2UgaXNcbiAgLy8gZGV0ZXJtaW5lZCBieSBoYXZpbmcgdGhlIHNhbWUgbnVtYmVyIG9mIG93bmVkIHByb3BlcnRpZXMgKGFzIHZlcmlmaWVkXG4gIC8vIHdpdGggT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKSwgdGhlIHNhbWUgc2V0IG9mIGtleXNcbiAgLy8gKGFsdGhvdWdoIG5vdCBuZWNlc3NhcmlseSB0aGUgc2FtZSBvcmRlciksIGVxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeVxuICAvLyBjb3JyZXNwb25kaW5nIGtleSwgYW5kIGFuIGlkZW50aWNhbCAncHJvdG90eXBlJyBwcm9wZXJ0eS4gTm90ZTogdGhpc1xuICAvLyBhY2NvdW50cyBmb3IgYm90aCBuYW1lZCBhbmQgaW5kZXhlZCBwcm9wZXJ0aWVzIG9uIEFycmF5cy5cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gb2JqRXF1aXYoYWN0dWFsLCBleHBlY3RlZCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBcmd1bWVudHMob2JqZWN0KSB7XG4gIHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqZWN0KSA9PSAnW29iamVjdCBBcmd1bWVudHNdJztcbn1cblxuZnVuY3Rpb24gb2JqRXF1aXYoYSwgYikge1xuICBpZiAodXRpbC5pc051bGxPclVuZGVmaW5lZChhKSB8fCB1dGlsLmlzTnVsbE9yVW5kZWZpbmVkKGIpKVxuICAgIHJldHVybiBmYWxzZTtcbiAgLy8gYW4gaWRlbnRpY2FsICdwcm90b3R5cGUnIHByb3BlcnR5LlxuICBpZiAoYS5wcm90b3R5cGUgIT09IGIucHJvdG90eXBlKSByZXR1cm4gZmFsc2U7XG4gIC8vIGlmIG9uZSBpcyBhIHByaW1pdGl2ZSwgdGhlIG90aGVyIG11c3QgYmUgc2FtZVxuICBpZiAodXRpbC5pc1ByaW1pdGl2ZShhKSB8fCB1dGlsLmlzUHJpbWl0aXZlKGIpKSB7XG4gICAgcmV0dXJuIGEgPT09IGI7XG4gIH1cbiAgdmFyIGFJc0FyZ3MgPSBpc0FyZ3VtZW50cyhhKSxcbiAgICAgIGJJc0FyZ3MgPSBpc0FyZ3VtZW50cyhiKTtcbiAgaWYgKChhSXNBcmdzICYmICFiSXNBcmdzKSB8fCAoIWFJc0FyZ3MgJiYgYklzQXJncykpXG4gICAgcmV0dXJuIGZhbHNlO1xuICBpZiAoYUlzQXJncykge1xuICAgIGEgPSBwU2xpY2UuY2FsbChhKTtcbiAgICBiID0gcFNsaWNlLmNhbGwoYik7XG4gICAgcmV0dXJuIF9kZWVwRXF1YWwoYSwgYik7XG4gIH1cbiAgdmFyIGthID0gb2JqZWN0S2V5cyhhKSxcbiAgICAgIGtiID0gb2JqZWN0S2V5cyhiKSxcbiAgICAgIGtleSwgaTtcbiAgLy8gaGF2aW5nIHRoZSBzYW1lIG51bWJlciBvZiBvd25lZCBwcm9wZXJ0aWVzIChrZXlzIGluY29ycG9yYXRlc1xuICAvLyBoYXNPd25Qcm9wZXJ0eSlcbiAgaWYgKGthLmxlbmd0aCAhPSBrYi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuICAvL3RoZSBzYW1lIHNldCBvZiBrZXlzIChhbHRob3VnaCBub3QgbmVjZXNzYXJpbHkgdGhlIHNhbWUgb3JkZXIpLFxuICBrYS5zb3J0KCk7XG4gIGtiLnNvcnQoKTtcbiAgLy9+fn5jaGVhcCBrZXkgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGlmIChrYVtpXSAhPSBrYltpXSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICAvL2VxdWl2YWxlbnQgdmFsdWVzIGZvciBldmVyeSBjb3JyZXNwb25kaW5nIGtleSwgYW5kXG4gIC8vfn5+cG9zc2libHkgZXhwZW5zaXZlIGRlZXAgdGVzdFxuICBmb3IgKGkgPSBrYS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIGtleSA9IGthW2ldO1xuICAgIGlmICghX2RlZXBFcXVhbChhW2tleV0sIGJba2V5XSkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLy8gOC4gVGhlIG5vbi1lcXVpdmFsZW5jZSBhc3NlcnRpb24gdGVzdHMgZm9yIGFueSBkZWVwIGluZXF1YWxpdHkuXG4vLyBhc3NlcnQubm90RGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2Vfb3B0KTtcblxuYXNzZXJ0Lm5vdERlZXBFcXVhbCA9IGZ1bmN0aW9uIG5vdERlZXBFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChfZGVlcEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnbm90RGVlcEVxdWFsJywgYXNzZXJ0Lm5vdERlZXBFcXVhbCk7XG4gIH1cbn07XG5cbi8vIDkuIFRoZSBzdHJpY3QgZXF1YWxpdHkgYXNzZXJ0aW9uIHRlc3RzIHN0cmljdCBlcXVhbGl0eSwgYXMgZGV0ZXJtaW5lZCBieSA9PT0uXG4vLyBhc3NlcnQuc3RyaWN0RXF1YWwoYWN0dWFsLCBleHBlY3RlZCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQuc3RyaWN0RXF1YWwgPSBmdW5jdGlvbiBzdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgZmFpbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlLCAnPT09JywgYXNzZXJ0LnN0cmljdEVxdWFsKTtcbiAgfVxufTtcblxuLy8gMTAuIFRoZSBzdHJpY3Qgbm9uLWVxdWFsaXR5IGFzc2VydGlvbiB0ZXN0cyBmb3Igc3RyaWN0IGluZXF1YWxpdHksIGFzXG4vLyBkZXRlcm1pbmVkIGJ5ICE9PS4gIGFzc2VydC5ub3RTdHJpY3RFcXVhbChhY3R1YWwsIGV4cGVjdGVkLCBtZXNzYWdlX29wdCk7XG5cbmFzc2VydC5ub3RTdHJpY3RFcXVhbCA9IGZ1bmN0aW9uIG5vdFN0cmljdEVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UpIHtcbiAgaWYgKGFjdHVhbCA9PT0gZXhwZWN0ZWQpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsIG1lc3NhZ2UsICchPT0nLCBhc3NlcnQubm90U3RyaWN0RXF1YWwpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSB7XG4gIGlmICghYWN0dWFsIHx8ICFleHBlY3RlZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmIChPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwoZXhwZWN0ZWQpID09ICdbb2JqZWN0IFJlZ0V4cF0nKSB7XG4gICAgcmV0dXJuIGV4cGVjdGVkLnRlc3QoYWN0dWFsKTtcbiAgfSBlbHNlIGlmIChhY3R1YWwgaW5zdGFuY2VvZiBleHBlY3RlZCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9IGVsc2UgaWYgKGV4cGVjdGVkLmNhbGwoe30sIGFjdHVhbCkgPT09IHRydWUpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZnVuY3Rpb24gX3Rocm93cyhzaG91bGRUaHJvdywgYmxvY2ssIGV4cGVjdGVkLCBtZXNzYWdlKSB7XG4gIHZhciBhY3R1YWw7XG5cbiAgaWYgKHV0aWwuaXNTdHJpbmcoZXhwZWN0ZWQpKSB7XG4gICAgbWVzc2FnZSA9IGV4cGVjdGVkO1xuICAgIGV4cGVjdGVkID0gbnVsbDtcbiAgfVxuXG4gIHRyeSB7XG4gICAgYmxvY2soKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGFjdHVhbCA9IGU7XG4gIH1cblxuICBtZXNzYWdlID0gKGV4cGVjdGVkICYmIGV4cGVjdGVkLm5hbWUgPyAnICgnICsgZXhwZWN0ZWQubmFtZSArICcpLicgOiAnLicpICtcbiAgICAgICAgICAgIChtZXNzYWdlID8gJyAnICsgbWVzc2FnZSA6ICcuJyk7XG5cbiAgaWYgKHNob3VsZFRocm93ICYmICFhY3R1YWwpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdNaXNzaW5nIGV4cGVjdGVkIGV4Y2VwdGlvbicgKyBtZXNzYWdlKTtcbiAgfVxuXG4gIGlmICghc2hvdWxkVGhyb3cgJiYgZXhwZWN0ZWRFeGNlcHRpb24oYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICBmYWlsKGFjdHVhbCwgZXhwZWN0ZWQsICdHb3QgdW53YW50ZWQgZXhjZXB0aW9uJyArIG1lc3NhZ2UpO1xuICB9XG5cbiAgaWYgKChzaG91bGRUaHJvdyAmJiBhY3R1YWwgJiYgZXhwZWN0ZWQgJiZcbiAgICAgICFleHBlY3RlZEV4Y2VwdGlvbihhY3R1YWwsIGV4cGVjdGVkKSkgfHwgKCFzaG91bGRUaHJvdyAmJiBhY3R1YWwpKSB7XG4gICAgdGhyb3cgYWN0dWFsO1xuICB9XG59XG5cbi8vIDExLiBFeHBlY3RlZCB0byB0aHJvdyBhbiBlcnJvcjpcbi8vIGFzc2VydC50aHJvd3MoYmxvY2ssIEVycm9yX29wdCwgbWVzc2FnZV9vcHQpO1xuXG5hc3NlcnQudGhyb3dzID0gZnVuY3Rpb24oYmxvY2ssIC8qb3B0aW9uYWwqL2Vycm9yLCAvKm9wdGlvbmFsKi9tZXNzYWdlKSB7XG4gIF90aHJvd3MuYXBwbHkodGhpcywgW3RydWVdLmNvbmNhdChwU2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG59O1xuXG4vLyBFWFRFTlNJT04hIFRoaXMgaXMgYW5ub3lpbmcgdG8gd3JpdGUgb3V0c2lkZSB0aGlzIG1vZHVsZS5cbmFzc2VydC5kb2VzTm90VGhyb3cgPSBmdW5jdGlvbihibG9jaywgLypvcHRpb25hbCovbWVzc2FnZSkge1xuICBfdGhyb3dzLmFwcGx5KHRoaXMsIFtmYWxzZV0uY29uY2F0KHBTbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbn07XG5cbmFzc2VydC5pZkVycm9yID0gZnVuY3Rpb24oZXJyKSB7IGlmIChlcnIpIHt0aHJvdyBlcnI7fX07XG5cbnZhciBvYmplY3RLZXlzID0gT2JqZWN0LmtleXMgfHwgZnVuY3Rpb24gKG9iaikge1xuICB2YXIga2V5cyA9IFtdO1xuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKGhhc093bi5jYWxsKG9iaiwga2V5KSkga2V5cy5wdXNoKGtleSk7XG4gIH1cbiAgcmV0dXJuIGtleXM7XG59O1xuIiwiaWYgKHR5cGVvZiBPYmplY3QuY3JlYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gIC8vIGltcGxlbWVudGF0aW9uIGZyb20gc3RhbmRhcmQgbm9kZS5qcyAndXRpbCcgbW9kdWxlXG4gIG1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaW5oZXJpdHMoY3Rvciwgc3VwZXJDdG9yKSB7XG4gICAgY3Rvci5zdXBlcl8gPSBzdXBlckN0b3JcbiAgICBjdG9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoc3VwZXJDdG9yLnByb3RvdHlwZSwge1xuICAgICAgY29uc3RydWN0b3I6IHtcbiAgICAgICAgdmFsdWU6IGN0b3IsXG4gICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgICAgY29uZmlndXJhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG4gIH07XG59IGVsc2Uge1xuICAvLyBvbGQgc2Nob29sIHNoaW0gZm9yIG9sZCBicm93c2Vyc1xuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGluaGVyaXRzKGN0b3IsIHN1cGVyQ3Rvcikge1xuICAgIGN0b3Iuc3VwZXJfID0gc3VwZXJDdG9yXG4gICAgdmFyIFRlbXBDdG9yID0gZnVuY3Rpb24gKCkge31cbiAgICBUZW1wQ3Rvci5wcm90b3R5cGUgPSBzdXBlckN0b3IucHJvdG90eXBlXG4gICAgY3Rvci5wcm90b3R5cGUgPSBuZXcgVGVtcEN0b3IoKVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvclxuICB9XG59XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gaXNCdWZmZXIoYXJnKSB7XG4gIHJldHVybiBhcmcgJiYgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCdcbiAgICAmJiB0eXBlb2YgYXJnLmNvcHkgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLmZpbGwgPT09ICdmdW5jdGlvbidcbiAgICAmJiB0eXBlb2YgYXJnLnJlYWRVSW50OCA9PT0gJ2Z1bmN0aW9uJztcbn0iLCIvLyBDb3B5cmlnaHQgSm95ZW50LCBJbmMuIGFuZCBvdGhlciBOb2RlIGNvbnRyaWJ1dG9ycy5cbi8vXG4vLyBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYVxuLy8gY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZVxuLy8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG4vLyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0cyB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsXG4vLyBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0XG4vLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcbi8vIGZvbGxvd2luZyBjb25kaXRpb25zOlxuLy9cbi8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG4vLyBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbi8vXG4vLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG4vLyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GXG4vLyBNRVJDSEFOVEFCSUxJVFksIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOXG4vLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcbi8vIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUlxuLy8gT1RIRVJXSVNFLCBBUklTSU5HIEZST00sIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRVxuLy8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblxudmFyIGZvcm1hdFJlZ0V4cCA9IC8lW3NkaiVdL2c7XG5leHBvcnRzLmZvcm1hdCA9IGZ1bmN0aW9uKGYpIHtcbiAgaWYgKCFpc1N0cmluZyhmKSkge1xuICAgIHZhciBvYmplY3RzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIG9iamVjdHMucHVzaChpbnNwZWN0KGFyZ3VtZW50c1tpXSkpO1xuICAgIH1cbiAgICByZXR1cm4gb2JqZWN0cy5qb2luKCcgJyk7XG4gIH1cblxuICB2YXIgaSA9IDE7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gIHZhciBzdHIgPSBTdHJpbmcoZikucmVwbGFjZShmb3JtYXRSZWdFeHAsIGZ1bmN0aW9uKHgpIHtcbiAgICBpZiAoeCA9PT0gJyUlJykgcmV0dXJuICclJztcbiAgICBpZiAoaSA+PSBsZW4pIHJldHVybiB4O1xuICAgIHN3aXRjaCAoeCkge1xuICAgICAgY2FzZSAnJXMnOiByZXR1cm4gU3RyaW5nKGFyZ3NbaSsrXSk7XG4gICAgICBjYXNlICclZCc6IHJldHVybiBOdW1iZXIoYXJnc1tpKytdKTtcbiAgICAgIGNhc2UgJyVqJzpcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoYXJnc1tpKytdKTtcbiAgICAgICAgfSBjYXRjaCAoXykge1xuICAgICAgICAgIHJldHVybiAnW0NpcmN1bGFyXSc7XG4gICAgICAgIH1cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiB4O1xuICAgIH1cbiAgfSk7XG4gIGZvciAodmFyIHggPSBhcmdzW2ldOyBpIDwgbGVuOyB4ID0gYXJnc1srK2ldKSB7XG4gICAgaWYgKGlzTnVsbCh4KSB8fCAhaXNPYmplY3QoeCkpIHtcbiAgICAgIHN0ciArPSAnICcgKyB4O1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgKz0gJyAnICsgaW5zcGVjdCh4KTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn07XG5cblxuLy8gTWFyayB0aGF0IGEgbWV0aG9kIHNob3VsZCBub3QgYmUgdXNlZC5cbi8vIFJldHVybnMgYSBtb2RpZmllZCBmdW5jdGlvbiB3aGljaCB3YXJucyBvbmNlIGJ5IGRlZmF1bHQuXG4vLyBJZiAtLW5vLWRlcHJlY2F0aW9uIGlzIHNldCwgdGhlbiBpdCBpcyBhIG5vLW9wLlxuZXhwb3J0cy5kZXByZWNhdGUgPSBmdW5jdGlvbihmbiwgbXNnKSB7XG4gIC8vIEFsbG93IGZvciBkZXByZWNhdGluZyB0aGluZ3MgaW4gdGhlIHByb2Nlc3Mgb2Ygc3RhcnRpbmcgdXAuXG4gIGlmIChpc1VuZGVmaW5lZChnbG9iYWwucHJvY2VzcykpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gZXhwb3J0cy5kZXByZWNhdGUoZm4sIG1zZykuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuICB9XG5cbiAgaWYgKHByb2Nlc3Mubm9EZXByZWNhdGlvbiA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiBmbjtcbiAgfVxuXG4gIHZhciB3YXJuZWQgPSBmYWxzZTtcbiAgZnVuY3Rpb24gZGVwcmVjYXRlZCgpIHtcbiAgICBpZiAoIXdhcm5lZCkge1xuICAgICAgaWYgKHByb2Nlc3MudGhyb3dEZXByZWNhdGlvbikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IobXNnKTtcbiAgICAgIH0gZWxzZSBpZiAocHJvY2Vzcy50cmFjZURlcHJlY2F0aW9uKSB7XG4gICAgICAgIGNvbnNvbGUudHJhY2UobXNnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IobXNnKTtcbiAgICAgIH1cbiAgICAgIHdhcm5lZCA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgcmV0dXJuIGRlcHJlY2F0ZWQ7XG59O1xuXG5cbnZhciBkZWJ1Z3MgPSB7fTtcbnZhciBkZWJ1Z0Vudmlyb247XG5leHBvcnRzLmRlYnVnbG9nID0gZnVuY3Rpb24oc2V0KSB7XG4gIGlmIChpc1VuZGVmaW5lZChkZWJ1Z0Vudmlyb24pKVxuICAgIGRlYnVnRW52aXJvbiA9IHByb2Nlc3MuZW52Lk5PREVfREVCVUcgfHwgJyc7XG4gIHNldCA9IHNldC50b1VwcGVyQ2FzZSgpO1xuICBpZiAoIWRlYnVnc1tzZXRdKSB7XG4gICAgaWYgKG5ldyBSZWdFeHAoJ1xcXFxiJyArIHNldCArICdcXFxcYicsICdpJykudGVzdChkZWJ1Z0Vudmlyb24pKSB7XG4gICAgICB2YXIgcGlkID0gcHJvY2Vzcy5waWQ7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgbXNnID0gZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKTtcbiAgICAgICAgY29uc29sZS5lcnJvcignJXMgJWQ6ICVzJywgc2V0LCBwaWQsIG1zZyk7XG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWJ1Z3Nbc2V0XSA9IGZ1bmN0aW9uKCkge307XG4gICAgfVxuICB9XG4gIHJldHVybiBkZWJ1Z3Nbc2V0XTtcbn07XG5cblxuLyoqXG4gKiBFY2hvcyB0aGUgdmFsdWUgb2YgYSB2YWx1ZS4gVHJ5cyB0byBwcmludCB0aGUgdmFsdWUgb3V0XG4gKiBpbiB0aGUgYmVzdCB3YXkgcG9zc2libGUgZ2l2ZW4gdGhlIGRpZmZlcmVudCB0eXBlcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIFRoZSBvYmplY3QgdG8gcHJpbnQgb3V0LlxuICogQHBhcmFtIHtPYmplY3R9IG9wdHMgT3B0aW9uYWwgb3B0aW9ucyBvYmplY3QgdGhhdCBhbHRlcnMgdGhlIG91dHB1dC5cbiAqL1xuLyogbGVnYWN5OiBvYmosIHNob3dIaWRkZW4sIGRlcHRoLCBjb2xvcnMqL1xuZnVuY3Rpb24gaW5zcGVjdChvYmosIG9wdHMpIHtcbiAgLy8gZGVmYXVsdCBvcHRpb25zXG4gIHZhciBjdHggPSB7XG4gICAgc2VlbjogW10sXG4gICAgc3R5bGl6ZTogc3R5bGl6ZU5vQ29sb3JcbiAgfTtcbiAgLy8gbGVnYWN5Li4uXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIGN0eC5kZXB0aCA9IGFyZ3VtZW50c1syXTtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPj0gNCkgY3R4LmNvbG9ycyA9IGFyZ3VtZW50c1szXTtcbiAgaWYgKGlzQm9vbGVhbihvcHRzKSkge1xuICAgIC8vIGxlZ2FjeS4uLlxuICAgIGN0eC5zaG93SGlkZGVuID0gb3B0cztcbiAgfSBlbHNlIGlmIChvcHRzKSB7XG4gICAgLy8gZ290IGFuIFwib3B0aW9uc1wiIG9iamVjdFxuICAgIGV4cG9ydHMuX2V4dGVuZChjdHgsIG9wdHMpO1xuICB9XG4gIC8vIHNldCBkZWZhdWx0IG9wdGlvbnNcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5zaG93SGlkZGVuKSkgY3R4LnNob3dIaWRkZW4gPSBmYWxzZTtcbiAgaWYgKGlzVW5kZWZpbmVkKGN0eC5kZXB0aCkpIGN0eC5kZXB0aCA9IDI7XG4gIGlmIChpc1VuZGVmaW5lZChjdHguY29sb3JzKSkgY3R4LmNvbG9ycyA9IGZhbHNlO1xuICBpZiAoaXNVbmRlZmluZWQoY3R4LmN1c3RvbUluc3BlY3QpKSBjdHguY3VzdG9tSW5zcGVjdCA9IHRydWU7XG4gIGlmIChjdHguY29sb3JzKSBjdHguc3R5bGl6ZSA9IHN0eWxpemVXaXRoQ29sb3I7XG4gIHJldHVybiBmb3JtYXRWYWx1ZShjdHgsIG9iaiwgY3R4LmRlcHRoKTtcbn1cbmV4cG9ydHMuaW5zcGVjdCA9IGluc3BlY3Q7XG5cblxuLy8gaHR0cDovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9BTlNJX2VzY2FwZV9jb2RlI2dyYXBoaWNzXG5pbnNwZWN0LmNvbG9ycyA9IHtcbiAgJ2JvbGQnIDogWzEsIDIyXSxcbiAgJ2l0YWxpYycgOiBbMywgMjNdLFxuICAndW5kZXJsaW5lJyA6IFs0LCAyNF0sXG4gICdpbnZlcnNlJyA6IFs3LCAyN10sXG4gICd3aGl0ZScgOiBbMzcsIDM5XSxcbiAgJ2dyZXknIDogWzkwLCAzOV0sXG4gICdibGFjaycgOiBbMzAsIDM5XSxcbiAgJ2JsdWUnIDogWzM0LCAzOV0sXG4gICdjeWFuJyA6IFszNiwgMzldLFxuICAnZ3JlZW4nIDogWzMyLCAzOV0sXG4gICdtYWdlbnRhJyA6IFszNSwgMzldLFxuICAncmVkJyA6IFszMSwgMzldLFxuICAneWVsbG93JyA6IFszMywgMzldXG59O1xuXG4vLyBEb24ndCB1c2UgJ2JsdWUnIG5vdCB2aXNpYmxlIG9uIGNtZC5leGVcbmluc3BlY3Quc3R5bGVzID0ge1xuICAnc3BlY2lhbCc6ICdjeWFuJyxcbiAgJ251bWJlcic6ICd5ZWxsb3cnLFxuICAnYm9vbGVhbic6ICd5ZWxsb3cnLFxuICAndW5kZWZpbmVkJzogJ2dyZXknLFxuICAnbnVsbCc6ICdib2xkJyxcbiAgJ3N0cmluZyc6ICdncmVlbicsXG4gICdkYXRlJzogJ21hZ2VudGEnLFxuICAvLyBcIm5hbWVcIjogaW50ZW50aW9uYWxseSBub3Qgc3R5bGluZ1xuICAncmVnZXhwJzogJ3JlZCdcbn07XG5cblxuZnVuY3Rpb24gc3R5bGl6ZVdpdGhDb2xvcihzdHIsIHN0eWxlVHlwZSkge1xuICB2YXIgc3R5bGUgPSBpbnNwZWN0LnN0eWxlc1tzdHlsZVR5cGVdO1xuXG4gIGlmIChzdHlsZSkge1xuICAgIHJldHVybiAnXFx1MDAxYlsnICsgaW5zcGVjdC5jb2xvcnNbc3R5bGVdWzBdICsgJ20nICsgc3RyICtcbiAgICAgICAgICAgJ1xcdTAwMWJbJyArIGluc3BlY3QuY29sb3JzW3N0eWxlXVsxXSArICdtJztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG59XG5cblxuZnVuY3Rpb24gc3R5bGl6ZU5vQ29sb3Ioc3RyLCBzdHlsZVR5cGUpIHtcbiAgcmV0dXJuIHN0cjtcbn1cblxuXG5mdW5jdGlvbiBhcnJheVRvSGFzaChhcnJheSkge1xuICB2YXIgaGFzaCA9IHt9O1xuXG4gIGFycmF5LmZvckVhY2goZnVuY3Rpb24odmFsLCBpZHgpIHtcbiAgICBoYXNoW3ZhbF0gPSB0cnVlO1xuICB9KTtcblxuICByZXR1cm4gaGFzaDtcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRWYWx1ZShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMpIHtcbiAgLy8gUHJvdmlkZSBhIGhvb2sgZm9yIHVzZXItc3BlY2lmaWVkIGluc3BlY3QgZnVuY3Rpb25zLlxuICAvLyBDaGVjayB0aGF0IHZhbHVlIGlzIGFuIG9iamVjdCB3aXRoIGFuIGluc3BlY3QgZnVuY3Rpb24gb24gaXRcbiAgaWYgKGN0eC5jdXN0b21JbnNwZWN0ICYmXG4gICAgICB2YWx1ZSAmJlxuICAgICAgaXNGdW5jdGlvbih2YWx1ZS5pbnNwZWN0KSAmJlxuICAgICAgLy8gRmlsdGVyIG91dCB0aGUgdXRpbCBtb2R1bGUsIGl0J3MgaW5zcGVjdCBmdW5jdGlvbiBpcyBzcGVjaWFsXG4gICAgICB2YWx1ZS5pbnNwZWN0ICE9PSBleHBvcnRzLmluc3BlY3QgJiZcbiAgICAgIC8vIEFsc28gZmlsdGVyIG91dCBhbnkgcHJvdG90eXBlIG9iamVjdHMgdXNpbmcgdGhlIGNpcmN1bGFyIGNoZWNrLlxuICAgICAgISh2YWx1ZS5jb25zdHJ1Y3RvciAmJiB2YWx1ZS5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgPT09IHZhbHVlKSkge1xuICAgIHZhciByZXQgPSB2YWx1ZS5pbnNwZWN0KHJlY3Vyc2VUaW1lcywgY3R4KTtcbiAgICBpZiAoIWlzU3RyaW5nKHJldCkpIHtcbiAgICAgIHJldCA9IGZvcm1hdFZhbHVlKGN0eCwgcmV0LCByZWN1cnNlVGltZXMpO1xuICAgIH1cbiAgICByZXR1cm4gcmV0O1xuICB9XG5cbiAgLy8gUHJpbWl0aXZlIHR5cGVzIGNhbm5vdCBoYXZlIHByb3BlcnRpZXNcbiAgdmFyIHByaW1pdGl2ZSA9IGZvcm1hdFByaW1pdGl2ZShjdHgsIHZhbHVlKTtcbiAgaWYgKHByaW1pdGl2ZSkge1xuICAgIHJldHVybiBwcmltaXRpdmU7XG4gIH1cblxuICAvLyBMb29rIHVwIHRoZSBrZXlzIG9mIHRoZSBvYmplY3QuXG4gIHZhciBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpO1xuICB2YXIgdmlzaWJsZUtleXMgPSBhcnJheVRvSGFzaChrZXlzKTtcblxuICBpZiAoY3R4LnNob3dIaWRkZW4pIHtcbiAgICBrZXlzID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModmFsdWUpO1xuICB9XG5cbiAgLy8gSUUgZG9lc24ndCBtYWtlIGVycm9yIGZpZWxkcyBub24tZW51bWVyYWJsZVxuICAvLyBodHRwOi8vbXNkbi5taWNyb3NvZnQuY29tL2VuLXVzL2xpYnJhcnkvaWUvZHd3NTJzYnQodj12cy45NCkuYXNweFxuICBpZiAoaXNFcnJvcih2YWx1ZSlcbiAgICAgICYmIChrZXlzLmluZGV4T2YoJ21lc3NhZ2UnKSA+PSAwIHx8IGtleXMuaW5kZXhPZignZGVzY3JpcHRpb24nKSA+PSAwKSkge1xuICAgIHJldHVybiBmb3JtYXRFcnJvcih2YWx1ZSk7XG4gIH1cblxuICAvLyBTb21lIHR5cGUgb2Ygb2JqZWN0IHdpdGhvdXQgcHJvcGVydGllcyBjYW4gYmUgc2hvcnRjdXR0ZWQuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCkge1xuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgdmFyIG5hbWUgPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZSgnW0Z1bmN0aW9uJyArIG5hbWUgKyAnXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICAgIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICAgIHJldHVybiBjdHguc3R5bGl6ZShSZWdFeHAucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodmFsdWUpLCAncmVnZXhwJyk7XG4gICAgfVxuICAgIGlmIChpc0RhdGUodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoRGF0ZS5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2YWx1ZSksICdkYXRlJyk7XG4gICAgfVxuICAgIGlmIChpc0Vycm9yKHZhbHVlKSkge1xuICAgICAgcmV0dXJuIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgYmFzZSA9ICcnLCBhcnJheSA9IGZhbHNlLCBicmFjZXMgPSBbJ3snLCAnfSddO1xuXG4gIC8vIE1ha2UgQXJyYXkgc2F5IHRoYXQgdGhleSBhcmUgQXJyYXlcbiAgaWYgKGlzQXJyYXkodmFsdWUpKSB7XG4gICAgYXJyYXkgPSB0cnVlO1xuICAgIGJyYWNlcyA9IFsnWycsICddJ107XG4gIH1cblxuICAvLyBNYWtlIGZ1bmN0aW9ucyBzYXkgdGhhdCB0aGV5IGFyZSBmdW5jdGlvbnNcbiAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgdmFyIG4gPSB2YWx1ZS5uYW1lID8gJzogJyArIHZhbHVlLm5hbWUgOiAnJztcbiAgICBiYXNlID0gJyBbRnVuY3Rpb24nICsgbiArICddJztcbiAgfVxuXG4gIC8vIE1ha2UgUmVnRXhwcyBzYXkgdGhhdCB0aGV5IGFyZSBSZWdFeHBzXG4gIGlmIChpc1JlZ0V4cCh2YWx1ZSkpIHtcbiAgICBiYXNlID0gJyAnICsgUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZGF0ZXMgd2l0aCBwcm9wZXJ0aWVzIGZpcnN0IHNheSB0aGUgZGF0ZVxuICBpZiAoaXNEYXRlKHZhbHVlKSkge1xuICAgIGJhc2UgPSAnICcgKyBEYXRlLnByb3RvdHlwZS50b1VUQ1N0cmluZy5jYWxsKHZhbHVlKTtcbiAgfVxuXG4gIC8vIE1ha2UgZXJyb3Igd2l0aCBtZXNzYWdlIGZpcnN0IHNheSB0aGUgZXJyb3JcbiAgaWYgKGlzRXJyb3IodmFsdWUpKSB7XG4gICAgYmFzZSA9ICcgJyArIGZvcm1hdEVycm9yKHZhbHVlKTtcbiAgfVxuXG4gIGlmIChrZXlzLmxlbmd0aCA9PT0gMCAmJiAoIWFycmF5IHx8IHZhbHVlLmxlbmd0aCA9PSAwKSkge1xuICAgIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgYnJhY2VzWzFdO1xuICB9XG5cbiAgaWYgKHJlY3Vyc2VUaW1lcyA8IDApIHtcbiAgICBpZiAoaXNSZWdFeHAodmFsdWUpKSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoUmVnRXhwLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSwgJ3JlZ2V4cCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gY3R4LnN0eWxpemUoJ1tPYmplY3RdJywgJ3NwZWNpYWwnKTtcbiAgICB9XG4gIH1cblxuICBjdHguc2Vlbi5wdXNoKHZhbHVlKTtcblxuICB2YXIgb3V0cHV0O1xuICBpZiAoYXJyYXkpIHtcbiAgICBvdXRwdXQgPSBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKTtcbiAgfSBlbHNlIHtcbiAgICBvdXRwdXQgPSBrZXlzLm1hcChmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBmb3JtYXRQcm9wZXJ0eShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXksIGFycmF5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGN0eC5zZWVuLnBvcCgpO1xuXG4gIHJldHVybiByZWR1Y2VUb1NpbmdsZVN0cmluZyhvdXRwdXQsIGJhc2UsIGJyYWNlcyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0UHJpbWl0aXZlKGN0eCwgdmFsdWUpIHtcbiAgaWYgKGlzVW5kZWZpbmVkKHZhbHVlKSlcbiAgICByZXR1cm4gY3R4LnN0eWxpemUoJ3VuZGVmaW5lZCcsICd1bmRlZmluZWQnKTtcbiAgaWYgKGlzU3RyaW5nKHZhbHVlKSkge1xuICAgIHZhciBzaW1wbGUgPSAnXFwnJyArIEpTT04uc3RyaW5naWZ5KHZhbHVlKS5yZXBsYWNlKC9eXCJ8XCIkL2csICcnKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcXFxcIi9nLCAnXCInKSArICdcXCcnO1xuICAgIHJldHVybiBjdHguc3R5bGl6ZShzaW1wbGUsICdzdHJpbmcnKTtcbiAgfVxuICBpZiAoaXNOdW1iZXIodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnbnVtYmVyJyk7XG4gIGlmIChpc0Jvb2xlYW4odmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnJyArIHZhbHVlLCAnYm9vbGVhbicpO1xuICAvLyBGb3Igc29tZSByZWFzb24gdHlwZW9mIG51bGwgaXMgXCJvYmplY3RcIiwgc28gc3BlY2lhbCBjYXNlIGhlcmUuXG4gIGlmIChpc051bGwodmFsdWUpKVxuICAgIHJldHVybiBjdHguc3R5bGl6ZSgnbnVsbCcsICdudWxsJyk7XG59XG5cblxuZnVuY3Rpb24gZm9ybWF0RXJyb3IodmFsdWUpIHtcbiAgcmV0dXJuICdbJyArIEVycm9yLnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZhbHVlKSArICddJztcbn1cblxuXG5mdW5jdGlvbiBmb3JtYXRBcnJheShjdHgsIHZhbHVlLCByZWN1cnNlVGltZXMsIHZpc2libGVLZXlzLCBrZXlzKSB7XG4gIHZhciBvdXRwdXQgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB2YWx1ZS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoaGFzT3duUHJvcGVydHkodmFsdWUsIFN0cmluZyhpKSkpIHtcbiAgICAgIG91dHB1dC5wdXNoKGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsXG4gICAgICAgICAgU3RyaW5nKGkpLCB0cnVlKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG91dHB1dC5wdXNoKCcnKTtcbiAgICB9XG4gIH1cbiAga2V5cy5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIGlmICgha2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgb3V0cHV0LnB1c2goZm9ybWF0UHJvcGVydHkoY3R4LCB2YWx1ZSwgcmVjdXJzZVRpbWVzLCB2aXNpYmxlS2V5cyxcbiAgICAgICAgICBrZXksIHRydWUpKTtcbiAgICB9XG4gIH0pO1xuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbmZ1bmN0aW9uIGZvcm1hdFByb3BlcnR5KGN0eCwgdmFsdWUsIHJlY3Vyc2VUaW1lcywgdmlzaWJsZUtleXMsIGtleSwgYXJyYXkpIHtcbiAgdmFyIG5hbWUsIHN0ciwgZGVzYztcbiAgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IodmFsdWUsIGtleSkgfHwgeyB2YWx1ZTogdmFsdWVba2V5XSB9O1xuICBpZiAoZGVzYy5nZXQpIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbR2V0dGVyL1NldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdHIgPSBjdHguc3R5bGl6ZSgnW0dldHRlcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZGVzYy5zZXQpIHtcbiAgICAgIHN0ciA9IGN0eC5zdHlsaXplKCdbU2V0dGVyXScsICdzcGVjaWFsJyk7XG4gICAgfVxuICB9XG4gIGlmICghaGFzT3duUHJvcGVydHkodmlzaWJsZUtleXMsIGtleSkpIHtcbiAgICBuYW1lID0gJ1snICsga2V5ICsgJ10nO1xuICB9XG4gIGlmICghc3RyKSB7XG4gICAgaWYgKGN0eC5zZWVuLmluZGV4T2YoZGVzYy52YWx1ZSkgPCAwKSB7XG4gICAgICBpZiAoaXNOdWxsKHJlY3Vyc2VUaW1lcykpIHtcbiAgICAgICAgc3RyID0gZm9ybWF0VmFsdWUoY3R4LCBkZXNjLnZhbHVlLCBudWxsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0ciA9IGZvcm1hdFZhbHVlKGN0eCwgZGVzYy52YWx1ZSwgcmVjdXJzZVRpbWVzIC0gMSk7XG4gICAgICB9XG4gICAgICBpZiAoc3RyLmluZGV4T2YoJ1xcbicpID4gLTEpIHtcbiAgICAgICAgaWYgKGFycmF5KSB7XG4gICAgICAgICAgc3RyID0gc3RyLnNwbGl0KCdcXG4nKS5tYXAoZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgICAgcmV0dXJuICcgICcgKyBsaW5lO1xuICAgICAgICAgIH0pLmpvaW4oJ1xcbicpLnN1YnN0cigyKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzdHIgPSAnXFxuJyArIHN0ci5zcGxpdCgnXFxuJykubWFwKGZ1bmN0aW9uKGxpbmUpIHtcbiAgICAgICAgICAgIHJldHVybiAnICAgJyArIGxpbmU7XG4gICAgICAgICAgfSkuam9pbignXFxuJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc3RyID0gY3R4LnN0eWxpemUoJ1tDaXJjdWxhcl0nLCAnc3BlY2lhbCcpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNVbmRlZmluZWQobmFtZSkpIHtcbiAgICBpZiAoYXJyYXkgJiYga2V5Lm1hdGNoKC9eXFxkKyQvKSkge1xuICAgICAgcmV0dXJuIHN0cjtcbiAgICB9XG4gICAgbmFtZSA9IEpTT04uc3RyaW5naWZ5KCcnICsga2V5KTtcbiAgICBpZiAobmFtZS5tYXRjaCgvXlwiKFthLXpBLVpfXVthLXpBLVpfMC05XSopXCIkLykpIHtcbiAgICAgIG5hbWUgPSBuYW1lLnN1YnN0cigxLCBuYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICduYW1lJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWUgPSBuYW1lLnJlcGxhY2UoLycvZywgXCJcXFxcJ1wiKVxuICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXFxcXFwiL2csICdcIicpXG4gICAgICAgICAgICAgICAgIC5yZXBsYWNlKC8oXlwifFwiJCkvZywgXCInXCIpO1xuICAgICAgbmFtZSA9IGN0eC5zdHlsaXplKG5hbWUsICdzdHJpbmcnKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbmFtZSArICc6ICcgKyBzdHI7XG59XG5cblxuZnVuY3Rpb24gcmVkdWNlVG9TaW5nbGVTdHJpbmcob3V0cHV0LCBiYXNlLCBicmFjZXMpIHtcbiAgdmFyIG51bUxpbmVzRXN0ID0gMDtcbiAgdmFyIGxlbmd0aCA9IG91dHB1dC5yZWR1Y2UoZnVuY3Rpb24ocHJldiwgY3VyKSB7XG4gICAgbnVtTGluZXNFc3QrKztcbiAgICBpZiAoY3VyLmluZGV4T2YoJ1xcbicpID49IDApIG51bUxpbmVzRXN0Kys7XG4gICAgcmV0dXJuIHByZXYgKyBjdXIucmVwbGFjZSgvXFx1MDAxYlxcW1xcZFxcZD9tL2csICcnKS5sZW5ndGggKyAxO1xuICB9LCAwKTtcblxuICBpZiAobGVuZ3RoID4gNjApIHtcbiAgICByZXR1cm4gYnJhY2VzWzBdICtcbiAgICAgICAgICAgKGJhc2UgPT09ICcnID8gJycgOiBiYXNlICsgJ1xcbiAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIG91dHB1dC5qb2luKCcsXFxuICAnKSArXG4gICAgICAgICAgICcgJyArXG4gICAgICAgICAgIGJyYWNlc1sxXTtcbiAgfVxuXG4gIHJldHVybiBicmFjZXNbMF0gKyBiYXNlICsgJyAnICsgb3V0cHV0LmpvaW4oJywgJykgKyAnICcgKyBicmFjZXNbMV07XG59XG5cblxuLy8gTk9URTogVGhlc2UgdHlwZSBjaGVja2luZyBmdW5jdGlvbnMgaW50ZW50aW9uYWxseSBkb24ndCB1c2UgYGluc3RhbmNlb2ZgXG4vLyBiZWNhdXNlIGl0IGlzIGZyYWdpbGUgYW5kIGNhbiBiZSBlYXNpbHkgZmFrZWQgd2l0aCBgT2JqZWN0LmNyZWF0ZSgpYC5cbmZ1bmN0aW9uIGlzQXJyYXkoYXIpIHtcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXIpO1xufVxuZXhwb3J0cy5pc0FycmF5ID0gaXNBcnJheTtcblxuZnVuY3Rpb24gaXNCb29sZWFuKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ2Jvb2xlYW4nO1xufVxuZXhwb3J0cy5pc0Jvb2xlYW4gPSBpc0Jvb2xlYW47XG5cbmZ1bmN0aW9uIGlzTnVsbChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gbnVsbDtcbn1cbmV4cG9ydHMuaXNOdWxsID0gaXNOdWxsO1xuXG5mdW5jdGlvbiBpc051bGxPclVuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PSBudWxsO1xufVxuZXhwb3J0cy5pc051bGxPclVuZGVmaW5lZCA9IGlzTnVsbE9yVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuZXhwb3J0cy5pc051bWJlciA9IGlzTnVtYmVyO1xuXG5mdW5jdGlvbiBpc1N0cmluZyhhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnO1xufVxuZXhwb3J0cy5pc1N0cmluZyA9IGlzU3RyaW5nO1xuXG5mdW5jdGlvbiBpc1N5bWJvbChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdzeW1ib2wnO1xufVxuZXhwb3J0cy5pc1N5bWJvbCA9IGlzU3ltYm9sO1xuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuZXhwb3J0cy5pc1VuZGVmaW5lZCA9IGlzVW5kZWZpbmVkO1xuXG5mdW5jdGlvbiBpc1JlZ0V4cChyZSkge1xuICByZXR1cm4gaXNPYmplY3QocmUpICYmIG9iamVjdFRvU3RyaW5nKHJlKSA9PT0gJ1tvYmplY3QgUmVnRXhwXSc7XG59XG5leHBvcnRzLmlzUmVnRXhwID0gaXNSZWdFeHA7XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuZXhwb3J0cy5pc09iamVjdCA9IGlzT2JqZWN0O1xuXG5mdW5jdGlvbiBpc0RhdGUoZCkge1xuICByZXR1cm4gaXNPYmplY3QoZCkgJiYgb2JqZWN0VG9TdHJpbmcoZCkgPT09ICdbb2JqZWN0IERhdGVdJztcbn1cbmV4cG9ydHMuaXNEYXRlID0gaXNEYXRlO1xuXG5mdW5jdGlvbiBpc0Vycm9yKGUpIHtcbiAgcmV0dXJuIGlzT2JqZWN0KGUpICYmXG4gICAgICAob2JqZWN0VG9TdHJpbmcoZSkgPT09ICdbb2JqZWN0IEVycm9yXScgfHwgZSBpbnN0YW5jZW9mIEVycm9yKTtcbn1cbmV4cG9ydHMuaXNFcnJvciA9IGlzRXJyb3I7XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuZXhwb3J0cy5pc0Z1bmN0aW9uID0gaXNGdW5jdGlvbjtcblxuZnVuY3Rpb24gaXNQcmltaXRpdmUoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IG51bGwgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdib29sZWFuJyB8fFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ251bWJlcicgfHxcbiAgICAgICAgIHR5cGVvZiBhcmcgPT09ICdzdHJpbmcnIHx8XG4gICAgICAgICB0eXBlb2YgYXJnID09PSAnc3ltYm9sJyB8fCAgLy8gRVM2IHN5bWJvbFxuICAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ3VuZGVmaW5lZCc7XG59XG5leHBvcnRzLmlzUHJpbWl0aXZlID0gaXNQcmltaXRpdmU7XG5cbmV4cG9ydHMuaXNCdWZmZXIgPSByZXF1aXJlKCcuL3N1cHBvcnQvaXNCdWZmZXInKTtcblxuZnVuY3Rpb24gb2JqZWN0VG9TdHJpbmcobykge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG8pO1xufVxuXG5cbmZ1bmN0aW9uIHBhZChuKSB7XG4gIHJldHVybiBuIDwgMTAgPyAnMCcgKyBuLnRvU3RyaW5nKDEwKSA6IG4udG9TdHJpbmcoMTApO1xufVxuXG5cbnZhciBtb250aHMgPSBbJ0phbicsICdGZWInLCAnTWFyJywgJ0FwcicsICdNYXknLCAnSnVuJywgJ0p1bCcsICdBdWcnLCAnU2VwJyxcbiAgICAgICAgICAgICAgJ09jdCcsICdOb3YnLCAnRGVjJ107XG5cbi8vIDI2IEZlYiAxNjoxOTozNFxuZnVuY3Rpb24gdGltZXN0YW1wKCkge1xuICB2YXIgZCA9IG5ldyBEYXRlKCk7XG4gIHZhciB0aW1lID0gW3BhZChkLmdldEhvdXJzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRNaW51dGVzKCkpLFxuICAgICAgICAgICAgICBwYWQoZC5nZXRTZWNvbmRzKCkpXS5qb2luKCc6Jyk7XG4gIHJldHVybiBbZC5nZXREYXRlKCksIG1vbnRoc1tkLmdldE1vbnRoKCldLCB0aW1lXS5qb2luKCcgJyk7XG59XG5cblxuLy8gbG9nIGlzIGp1c3QgYSB0aGluIHdyYXBwZXIgdG8gY29uc29sZS5sb2cgdGhhdCBwcmVwZW5kcyBhIHRpbWVzdGFtcFxuZXhwb3J0cy5sb2cgPSBmdW5jdGlvbigpIHtcbiAgY29uc29sZS5sb2coJyVzIC0gJXMnLCB0aW1lc3RhbXAoKSwgZXhwb3J0cy5mb3JtYXQuYXBwbHkoZXhwb3J0cywgYXJndW1lbnRzKSk7XG59O1xuXG5cbi8qKlxuICogSW5oZXJpdCB0aGUgcHJvdG90eXBlIG1ldGhvZHMgZnJvbSBvbmUgY29uc3RydWN0b3IgaW50byBhbm90aGVyLlxuICpcbiAqIFRoZSBGdW5jdGlvbi5wcm90b3R5cGUuaW5oZXJpdHMgZnJvbSBsYW5nLmpzIHJld3JpdHRlbiBhcyBhIHN0YW5kYWxvbmVcbiAqIGZ1bmN0aW9uIChub3Qgb24gRnVuY3Rpb24ucHJvdG90eXBlKS4gTk9URTogSWYgdGhpcyBmaWxlIGlzIHRvIGJlIGxvYWRlZFxuICogZHVyaW5nIGJvb3RzdHJhcHBpbmcgdGhpcyBmdW5jdGlvbiBuZWVkcyB0byBiZSByZXdyaXR0ZW4gdXNpbmcgc29tZSBuYXRpdmVcbiAqIGZ1bmN0aW9ucyBhcyBwcm90b3R5cGUgc2V0dXAgdXNpbmcgbm9ybWFsIEphdmFTY3JpcHQgZG9lcyBub3Qgd29yayBhc1xuICogZXhwZWN0ZWQgZHVyaW5nIGJvb3RzdHJhcHBpbmcgKHNlZSBtaXJyb3IuanMgaW4gcjExNDkwMykuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbn0gY3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB3aGljaCBuZWVkcyB0byBpbmhlcml0IHRoZVxuICogICAgIHByb3RvdHlwZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IHN1cGVyQ3RvciBDb25zdHJ1Y3RvciBmdW5jdGlvbiB0byBpbmhlcml0IHByb3RvdHlwZSBmcm9tLlxuICovXG5leHBvcnRzLmluaGVyaXRzID0gcmVxdWlyZSgnaW5oZXJpdHMnKTtcblxuZXhwb3J0cy5fZXh0ZW5kID0gZnVuY3Rpb24ob3JpZ2luLCBhZGQpIHtcbiAgLy8gRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWRkIGlzbid0IGFuIG9iamVjdFxuICBpZiAoIWFkZCB8fCAhaXNPYmplY3QoYWRkKSkgcmV0dXJuIG9yaWdpbjtcblxuICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKGFkZCk7XG4gIHZhciBpID0ga2V5cy5sZW5ndGg7XG4gIHdoaWxlIChpLS0pIHtcbiAgICBvcmlnaW5ba2V5c1tpXV0gPSBhZGRba2V5c1tpXV07XG4gIH1cbiAgcmV0dXJuIG9yaWdpbjtcbn07XG5cbmZ1bmN0aW9uIGhhc093blByb3BlcnR5KG9iaiwgcHJvcCkge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCk7XG59XG4iLCIndXNlIHN0cmljdCc7XG52YXIgU3RydWN0dXJlID0gcmVxdWlyZSgnLi9zcmMvc3RydWN0dXJlJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBJbW1zdHJ1Y3QsIGhhdmluZyBpdCdzIG93biBsaXN0XG4gKiBvZiBTdHJ1Y3R1cmUgaW5zdGFuY2VzLlxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqIGBgYGpzXG4gKiB2YXIgSW1tc3RydWN0SW5zdGFuY2UgPSByZXF1aXJlKCdpbW1zdHJ1Y3QnKS5JbW1zdHJ1Y3Q7XG4gKiB2YXIgaW1tc3RydWN0ID0gbmV3IEltbXN0cnVjdEluc3RhbmNlKCk7XG4gKiB2YXIgc3RydWN0dXJlID0gaW1tc3RydWN0LmdldCh7IGRhdGE6IH0pO1xuICogYGBgXG4gKlxuICogQHByb3BlcnR5IHtBcnJheX0gaW5zdGFuY2VzIEFycmF5IG9mIGBTdHJ1Y3R1cmVgIGluc3RhbmNlcy5cbiAqXG4gKiBAY2xhc3Mge0ltbXN0cnVjdH1cbiAqIEBjb25zdHJ1Y3RvclxuICogQHJldHVybnMge0ltbXN0cnVjdH1cbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEltbXN0cnVjdCAoKSB7XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBJbW1zdHJ1Y3QpKSB7XG4gICAgcmV0dXJuIG5ldyBJbW1zdHJ1Y3QoKTtcbiAgfVxuXG4gIHRoaXMuX2luc3RhbmNlcyA9IHt9O1xufVxuXG4vKipcbiAqXG4gKiBHZXRzIG9yIGNyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2Yge1N0cnVjdHVyZX0uIFByb3ZpZGUgb3B0aW9uYWxcbiAqIGtleSB0byBiZSBhYmxlIHRvIHJldHJpZXZlIGl0IGZyb20gbGlzdCBvZiBpbnN0YW5jZXMuIElmIG5vIGtleVxuICogaXMgcHJvdmlkZWQsIGEgcmFuZG9tIGtleSB3aWxsIGJlIGdlbmVyYXRlZC5cbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiBgYGBqc1xuICogdmFyIGltbXN0cnVjdCA9IHJlcXVpcmUoJ2ltbXN0cnVjdCcpO1xuICogdmFyIHN0cnVjdHVyZSA9IGltbXN0cnVjdC5nZXQoJ215U3RydWN0JywgeyBmb286ICdIZWxsbycgfSk7XG4gKiBgYGBcbiAqIEBwYXJhbSB7U3RyaW5nfSBba2V5XSAtIGRlZmF1bHRzIHRvIHJhbmRvbSBzdHJpbmdcbiAqIEBwYXJhbSB7T2JqZWN0fEltbXV0YWJsZX0gW2RhdGFdIC0gZGVmYXVsdHMgdG8gZW1wdHkgZGF0YVxuICpcbiAqIEByZXR1cm5zIHtTdHJ1Y3R1cmV9XG4gKiBAbW9kdWxlIGltbXN0cnVjdC5nZXRcbiAqIEBhcGkgcHVibGljXG4gKi9cbkltbXN0cnVjdC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSwgZGF0YSkge1xuICByZXR1cm4gZ2V0SW5zdGFuY2UodGhpcywge1xuICAgIGtleToga2V5LFxuICAgIGRhdGE6IGRhdGFcbiAgfSk7XG59O1xuXG4vKipcbiAqXG4gKiBHZXQgbGlzdCBvZiBhbGwgaW5zdGFuY2VzIGNyZWF0ZWQuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IFtuYW1lXSAtIE5hbWUgb2YgdGhlIGluc3RhbmNlIHRvIGdldC4gSWYgdW5kZWZpbmVkIGdldCBhbGwgaW5zdGFuY2VzXG4gKlxuICogQHJldHVybnMge0FycmF5fVxuICogQG1vZHVsZSBpbW1zdHJ1Y3QuZ2V0SW5zdGFuY2VzXG4gKiBAYXBpIHB1YmxpY1xuICovXG5JbW1zdHJ1Y3QucHJvdG90eXBlLmluc3RhbmNlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgaWYgKG5hbWUpIHJldHVybiB0aGlzLl9pbnN0YW5jZXNbbmFtZV07XG4gIHJldHVybiB0aGlzLl9pbnN0YW5jZXM7XG59O1xuXG4vKipcbiAqIENsZWFyIHRoZSBlbnRpcmUgbGlzdCBvZiBgU3RydWN0dXJlYCBpbnN0YW5jZXMgZnJvbSB0aGUgSW1tc3RydWN0XG4gKiBpbnN0YW5jZS4gWW91IHdvdWxkIGRvIHRoaXMgdG8gc3RhcnQgZnJvbSBzY3JhdGNoLCBmcmVlaW5nIHVwIG1lbW9yeS5cbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiBgYGBqc1xuICogdmFyIGltbXN0cnVjdCA9IHJlcXVpcmUoJ2ltbXN0cnVjdCcpO1xuICogaW1tc3RydWN0LmNsZWFyKCk7XG4gKiBgYGBcbiAqIEBtb2R1bGUgaW1tc3RydWN0LmNsZWFyXG4gKiBAYXBpIHB1YmxpY1xuICovXG5JbW1zdHJ1Y3QucHJvdG90eXBlLmNsZWFyID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLl9pbnN0YW5jZXMgPSB7fTtcbn07XG5cbi8qKlxuICogUmVtb3ZlIG9uZSBgU3RydWN0dXJlYCBpbnN0YW5jZSBmcm9tIHRoZSBJbW1zdHJ1Y3QgaW5zdGFuY2VzIGxpc3QuXG4gKiBQcm92aWRlZCBieSBrZXlcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiBgYGBqc1xuICogdmFyIGltbXN0cnVjdCA9IHJlcXVpcmUoJ2ltbXN0cnVjdCcpO1xuICogaW1tc3RydWN0KCdteUtleScsIHsgZm9vOiAnaGVsbG8nIH0pO1xuICogaW1tc3RydWN0LnJlbW92ZSgnbXlLZXknKTtcbiAqIGBgYFxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICpcbiAqIEBtb2R1bGUgaW1tc3RydWN0LnJlbW92ZVxuICogQGFwaSBwdWJsaWNcbiAqIEByZXR1cm5zIHtCb29sZWFufVxuICovXG5JbW1zdHJ1Y3QucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgcmV0dXJuIGRlbGV0ZSB0aGlzLl9pbnN0YW5jZXNba2V5XTtcbn07XG5cblxuLyoqXG4gKiBHZXRzIG9yIGNyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYFN0cnVjdHVyZWAgd2l0aCBoaXN0b3J5ICh1bmRvL3JlZG8pXG4gKiBhY3RpdmF0ZWQgcGVyIGRlZmF1bHQuIFNhbWUgdXNhZ2UgYW5kIHNpZ25hdHVyZSBhcyByZWd1bGFyIGBJbW1zdHJ1Y3QuZ2V0YC5cblxuICogUHJvdmlkZSBvcHRpb25hbCBrZXkgdG8gYmUgYWJsZSB0byByZXRyaWV2ZSBpdCBmcm9tIGxpc3Qgb2YgaW5zdGFuY2VzLlxuICogSWYgbm8ga2V5IGlzIHByb3ZpZGVkLCBhIHJhbmRvbSBrZXkgd2lsbCBiZSBnZW5lcmF0ZWQuXG4gKlxuICogUHJvdmlkZSBvcHRpb25hbCBsaW1pdCB0byBjYXAgdGhlIGxhc3QgbnVtYmVyIG9mIGhpc3RvcnkgcmVmZXJlbmNlc1xuICogdGhhdCB3aWxsIGJlIGtlcHQuIE9uY2UgbGltaXQgaXMgcmVhY2hlZCwgYSBuZXcgaGlzdG9yeSByZWNvcmRcbiAqIHNoaWZ0cyBvZmYgdGhlIG9sZGVzdCByZWNvcmQuIFRoZSBkZWZhdWx0IGlmIG9taXR0ZWQgaXMgSW5maW5pdHkuXG4gKiBTZXR0aW5nIHRvIDAgaXMgdGhlIGFzIG5vdCBoYXZpbmcgaGlzdG9yeSBlbmFibGVkIGluIHRoZSBmaXJzdCBwbGFjZS5cbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiBgYGBqc1xuICogdmFyIGltbXN0cnVjdCA9IHJlcXVpcmUoJ2ltbXN0cnVjdCcpO1xuICogdmFyIHN0cnVjdHVyZSA9IGltbXN0cnVjdC53aXRoSGlzdG9yeSgnbXlTdHJ1Y3QnLCAxMCwgeyBmb286ICdIZWxsbycgfSk7XG4gKiB2YXIgc3RydWN0dXJlID0gaW1tc3RydWN0LndpdGhIaXN0b3J5KDEwLCB7IGZvbzogJ0hlbGxvJyB9KTtcbiAqIHZhciBzdHJ1Y3R1cmUgPSBpbW1zdHJ1Y3Qud2l0aEhpc3RvcnkoJ215U3RydWN0JywgeyBmb286ICdIZWxsbycgfSk7XG4gKiB2YXIgc3RydWN0dXJlID0gaW1tc3RydWN0LndpdGhIaXN0b3J5KHsgZm9vOiAnSGVsbG8nIH0pO1xuICogYGBgXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IFtrZXldIC0gZGVmYXVsdHMgdG8gcmFuZG9tIHN0cmluZ1xuICogQHBhcmFtIHtOdW1iZXJ9IFtsaW1pdF0gLSBkZWZhdWx0cyB0byBJbmZpbml0eVxuICogQHBhcmFtIHtPYmplY3R8SW1tdXRhYmxlfSBbZGF0YV0gLSBkZWZhdWx0cyB0byBlbXB0eSBkYXRhXG4gKlxuICogQG1vZHVsZSBpbW1zdHJ1Y3Qud2l0aEhpc3RvcnlcbiAqIEBhcGkgcHVibGljXG4gKiBAcmV0dXJucyB7U3RydWN0dXJlfVxuICovXG5JbW1zdHJ1Y3QucHJvdG90eXBlLndpdGhIaXN0b3J5ID0gZnVuY3Rpb24gKGtleSwgbGltaXQsIGRhdGEpIHtcbiAgcmV0dXJuIGdldEluc3RhbmNlKHRoaXMsIHtcbiAgICBrZXk6IGtleSxcbiAgICBkYXRhOiBkYXRhLFxuICAgIGhpc3Rvcnk6IHRydWUsXG4gICAgaGlzdG9yeUxpbWl0OiBsaW1pdFxuICB9KTtcbn07XG5cbnZhciBpbnN0ID0gbmV3IEltbXN0cnVjdCgpO1xuXG4vKipcbiAqIFRoaXMgaXMgYSBkZWZhdWx0IGluc3RhbmNlIG9mIGBJbW1zdHJ1Y3RgIGFzIHdlbGwgYXMgYSBzaG9ydGN1dCBmb3JcbiAqIGNyZWF0aW5nIGBTdHJ1Y3R1cmVgIGluc3RhbmNlcyAoU2VlIGBJbW1zdHJ1Y3QuZ2V0YCBhbmQgYEltbXN0cnVjdGApLlxuICogVGhpcyBpcyB3aGF0IGlzIHJldHVybmVkIGZyb20gYHJlcXVpcmUoJ2ltbXN0cnVjdCcpYC5cbiAqXG4gKiBGcm9tIGBJbW1zdHJ1Y3QuZ2V0YDpcbiAqIEdldHMgb3IgY3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiB7U3RydWN0dXJlfSBpbiB0aGUgZGVmYXVsdCBJbW1zdHJ1Y3RcbiAqIGluc3RhbmNlLiBBIGxpbmsgdG8gYGltbXN0cnVjdC5nZXQoKWAuIFByb3ZpZGUgb3B0aW9uYWxcbiAqIGtleSB0byBiZSBhYmxlIHRvIHJldHJpZXZlIGl0IGZyb20gbGlzdCBvZiBpbnN0YW5jZXMuIElmIG5vIGtleVxuICogaXMgcHJvdmlkZWQsIGEgcmFuZG9tIGtleSB3aWxsIGJlIGdlbmVyYXRlZC5cbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiBgYGBqc1xuICogdmFyIGltbXN0cnVjdCA9IHJlcXVpcmUoJ2ltbXN0cnVjdCcpO1xuICogdmFyIHN0cnVjdHVyZSA9IGltbXN0cnVjdCgnbXlTdHJ1Y3QnLCB7IGZvbzogJ0hlbGxvJyB9KTtcbiAqIHZhciBzdHJ1Y3R1cmUyID0gaW1tc3RydWN0LndpdGhIaXN0b3J5KHsgYmFyOiAnQnllJyB9KTtcbiAqIGltbXN0cnVjdC5yZW1vdmUoJ215U3RydWN0Jyk7XG4gKiAvLyAuLi5cbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBba2V5XSAtIGRlZmF1bHRzIHRvIHJhbmRvbSBzdHJpbmdcbiAqIEBwYXJhbSB7T2JqZWN0fEltbXV0YWJsZX0gW2RhdGFdIC0gZGVmYXVsdHMgdG8gZW1wdHkgZGF0YVxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAc2VlIHtAbGluayBJbW1zdHJ1Y3R9XG4gKiBAc2VlIHtJbW1zdHJ1Y3QucHJvdG90eXBlLmdldH1cbiAqIEBtb2R1bGUgaW1tc3RydWN0XG4gKiBAY2xhc3Mge0ltbXN0cnVjdH1cbiAqIEByZXR1cm5zIHtTdHJ1Y3R1cmV8RnVuY3Rpb259XG4gKi9cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGtleSwgZGF0YSkge1xuICByZXR1cm4gZ2V0SW5zdGFuY2UoaW5zdCwge1xuICAgIGtleToga2V5LFxuICAgIGRhdGE6IGRhdGFcbiAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy53aXRoSGlzdG9yeSA9IGZ1bmN0aW9uIChrZXksIGxpbWl0LCBkYXRhKSB7XG4gIHJldHVybiBnZXRJbnN0YW5jZShpbnN0LCB7XG4gICAga2V5OiBrZXksXG4gICAgZGF0YTogZGF0YSxcbiAgICBoaXN0b3J5OiB0cnVlLFxuICAgIGhpc3RvcnlMaW1pdDogbGltaXRcbiAgfSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cy5TdHJ1Y3R1cmUgPSBTdHJ1Y3R1cmU7XG5tb2R1bGUuZXhwb3J0cy5JbW1zdHJ1Y3QgPSBJbW1zdHJ1Y3Q7XG5tb2R1bGUuZXhwb3J0cy5jbGVhciAgICAgPSBpbnN0LmNsZWFyLmJpbmQoaW5zdCk7XG5tb2R1bGUuZXhwb3J0cy5yZW1vdmUgICAgPSBpbnN0LnJlbW92ZS5iaW5kKGluc3QpO1xubW9kdWxlLmV4cG9ydHMuZ2V0ICAgICAgID0gaW5zdC5nZXQuYmluZChpbnN0KTtcbm1vZHVsZS5leHBvcnRzLmluc3RhbmNlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgaWYgKG5hbWUpIHJldHVybiBpbnN0Ll9pbnN0YW5jZXNbbmFtZV07XG4gIHJldHVybiBpbnN0Ll9pbnN0YW5jZXM7XG59O1xuXG5mdW5jdGlvbiBnZXRJbnN0YW5jZSAob2JqLCBvcHRpb25zKSB7XG4gIGlmICh0eXBlb2Ygb3B0aW9ucy5rZXkgPT09ICdvYmplY3QnKSB7XG4gICAgb3B0aW9ucy5kYXRhID0gb3B0aW9ucy5rZXk7XG4gICAgb3B0aW9ucy5rZXkgPSB2b2lkIDA7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMua2V5ID09PSAnbnVtYmVyJykge1xuICAgIG9wdGlvbnMuZGF0YSA9IG9wdGlvbnMuaGlzdG9yeUxpbWl0O1xuICAgIG9wdGlvbnMuaGlzdG9yeUxpbWl0ID0gb3B0aW9ucy5rZXk7XG4gICAgb3B0aW9ucy5rZXkgPSB2b2lkIDA7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMuaGlzdG9yeUxpbWl0ID09PSAnb2JqZWN0Jykge1xuICAgIG9wdGlvbnMuZGF0YSA9IG9wdGlvbnMuaGlzdG9yeUxpbWl0O1xuICAgIG9wdGlvbnMuaGlzdG9yeUxpbWl0ID0gdm9pZCAwO1xuICB9XG5cbiAgaWYgKG9wdGlvbnMua2V5ICYmIG9iai5faW5zdGFuY2VzW29wdGlvbnMua2V5XSkge1xuICAgIHJldHVybiBvYmouX2luc3RhbmNlc1tvcHRpb25zLmtleV07XG4gIH1cblxuICB2YXIgbmV3SW5zdGFuY2UgPSBuZXcgU3RydWN0dXJlKG9wdGlvbnMpO1xuICBvYmouX2luc3RhbmNlc1tuZXdJbnN0YW5jZS5rZXldID0gbmV3SW5zdGFuY2U7XG4gIHJldHVybiBuZXdJbnN0YW5jZTtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxuLy9cbi8vIFdlIHN0b3JlIG91ciBFRSBvYmplY3RzIGluIGEgcGxhaW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgYXJlIGV2ZW50IG5hbWVzLlxuLy8gSWYgYE9iamVjdC5jcmVhdGUobnVsbClgIGlzIG5vdCBzdXBwb3J0ZWQgd2UgcHJlZml4IHRoZSBldmVudCBuYW1lcyB3aXRoIGFcbi8vIGB+YCB0byBtYWtlIHN1cmUgdGhhdCB0aGUgYnVpbHQtaW4gb2JqZWN0IHByb3BlcnRpZXMgYXJlIG5vdCBvdmVycmlkZGVuIG9yXG4vLyB1c2VkIGFzIGFuIGF0dGFjayB2ZWN0b3IuXG4vLyBXZSBhbHNvIGFzc3VtZSB0aGF0IGBPYmplY3QuY3JlYXRlKG51bGwpYCBpcyBhdmFpbGFibGUgd2hlbiB0aGUgZXZlbnQgbmFtZVxuLy8gaXMgYW4gRVM2IFN5bWJvbC5cbi8vXG52YXIgcHJlZml4ID0gdHlwZW9mIE9iamVjdC5jcmVhdGUgIT09ICdmdW5jdGlvbicgPyAnficgOiBmYWxzZTtcblxuLyoqXG4gKiBSZXByZXNlbnRhdGlvbiBvZiBhIHNpbmdsZSBFdmVudEVtaXR0ZXIgZnVuY3Rpb24uXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gRXZlbnQgaGFuZGxlciB0byBiZSBjYWxsZWQuXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IENvbnRleHQgZm9yIGZ1bmN0aW9uIGV4ZWN1dGlvbi5cbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb25jZSBPbmx5IGVtaXQgb25jZVxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIEVFKGZuLCBjb250ZXh0LCBvbmNlKSB7XG4gIHRoaXMuZm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gY29udGV4dDtcbiAgdGhpcy5vbmNlID0gb25jZSB8fCBmYWxzZTtcbn1cblxuLyoqXG4gKiBNaW5pbWFsIEV2ZW50RW1pdHRlciBpbnRlcmZhY2UgdGhhdCBpcyBtb2xkZWQgYWdhaW5zdCB0aGUgTm9kZS5qc1xuICogRXZlbnRFbWl0dGVyIGludGVyZmFjZS5cbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHsgLyogTm90aGluZyB0byBzZXQgKi8gfVxuXG4vKipcbiAqIEhvbGRzIHRoZSBhc3NpZ25lZCBFdmVudEVtaXR0ZXJzIGJ5IG5hbWUuXG4gKlxuICogQHR5cGUge09iamVjdH1cbiAqIEBwcml2YXRlXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcblxuLyoqXG4gKiBSZXR1cm4gYSBsaXN0IG9mIGFzc2lnbmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50cyB0aGF0IHNob3VsZCBiZSBsaXN0ZWQuXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGV4aXN0cyBXZSBvbmx5IG5lZWQgdG8ga25vdyBpZiB0aGVyZSBhcmUgbGlzdGVuZXJzLlxuICogQHJldHVybnMge0FycmF5fEJvb2xlYW59XG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uIGxpc3RlbmVycyhldmVudCwgZXhpc3RzKSB7XG4gIHZhciBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XG4gICAgLCBhdmFpbGFibGUgPSB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW2V2dF07XG5cbiAgaWYgKGV4aXN0cykgcmV0dXJuICEhYXZhaWxhYmxlO1xuICBpZiAoIWF2YWlsYWJsZSkgcmV0dXJuIFtdO1xuICBpZiAoYXZhaWxhYmxlLmZuKSByZXR1cm4gW2F2YWlsYWJsZS5mbl07XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBhdmFpbGFibGUubGVuZ3RoLCBlZSA9IG5ldyBBcnJheShsKTsgaSA8IGw7IGkrKykge1xuICAgIGVlW2ldID0gYXZhaWxhYmxlW2ldLmZuO1xuICB9XG5cbiAgcmV0dXJuIGVlO1xufTtcblxuLyoqXG4gKiBFbWl0IGFuIGV2ZW50IHRvIGFsbCByZWdpc3RlcmVkIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIG5hbWUgb2YgdGhlIGV2ZW50LlxuICogQHJldHVybnMge0Jvb2xlYW59IEluZGljYXRpb24gaWYgd2UndmUgZW1pdHRlZCBhbiBldmVudC5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIGVtaXQoZXZlbnQsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiBmYWxzZTtcblxuICB2YXIgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW2V2dF1cbiAgICAsIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGhcbiAgICAsIGFyZ3NcbiAgICAsIGk7XG5cbiAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBsaXN0ZW5lcnMuZm4pIHtcbiAgICBpZiAobGlzdGVuZXJzLm9uY2UpIHRoaXMucmVtb3ZlTGlzdGVuZXIoZXZlbnQsIGxpc3RlbmVycy5mbiwgdW5kZWZpbmVkLCB0cnVlKTtcblxuICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICBjYXNlIDE6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCksIHRydWU7XG4gICAgICBjYXNlIDI6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEpLCB0cnVlO1xuICAgICAgY2FzZSAzOiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiksIHRydWU7XG4gICAgICBjYXNlIDQ6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMyksIHRydWU7XG4gICAgICBjYXNlIDU6IHJldHVybiBsaXN0ZW5lcnMuZm4uY2FsbChsaXN0ZW5lcnMuY29udGV4dCwgYTEsIGEyLCBhMywgYTQpLCB0cnVlO1xuICAgICAgY2FzZSA2OiByZXR1cm4gbGlzdGVuZXJzLmZuLmNhbGwobGlzdGVuZXJzLmNvbnRleHQsIGExLCBhMiwgYTMsIGE0LCBhNSksIHRydWU7XG4gICAgfVxuXG4gICAgZm9yIChpID0gMSwgYXJncyA9IG5ldyBBcnJheShsZW4gLTEpOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgIH1cblxuICAgIGxpc3RlbmVycy5mbi5hcHBseShsaXN0ZW5lcnMuY29udGV4dCwgYXJncyk7XG4gIH0gZWxzZSB7XG4gICAgdmFyIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGhcbiAgICAgICwgajtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGxpc3RlbmVyc1tpXS5vbmNlKSB0aGlzLnJlbW92ZUxpc3RlbmVyKGV2ZW50LCBsaXN0ZW5lcnNbaV0uZm4sIHVuZGVmaW5lZCwgdHJ1ZSk7XG5cbiAgICAgIHN3aXRjaCAobGVuKSB7XG4gICAgICAgIGNhc2UgMTogbGlzdGVuZXJzW2ldLmZuLmNhbGwobGlzdGVuZXJzW2ldLmNvbnRleHQpOyBicmVhaztcbiAgICAgICAgY2FzZSAyOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEpOyBicmVhaztcbiAgICAgICAgY2FzZSAzOiBsaXN0ZW5lcnNbaV0uZm4uY2FsbChsaXN0ZW5lcnNbaV0uY29udGV4dCwgYTEsIGEyKTsgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgaWYgKCFhcmdzKSBmb3IgKGogPSAxLCBhcmdzID0gbmV3IEFycmF5KGxlbiAtMSk7IGogPCBsZW47IGorKykge1xuICAgICAgICAgICAgYXJnc1tqIC0gMV0gPSBhcmd1bWVudHNbal07XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgbGlzdGVuZXJzW2ldLmZuLmFwcGx5KGxpc3RlbmVyc1tpXS5jb250ZXh0LCBhcmdzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBuZXcgRXZlbnRMaXN0ZW5lciBmb3IgdGhlIGdpdmVuIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rvbn0gZm4gQ2FsbGJhY2sgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge01peGVkfSBjb250ZXh0IFRoZSBjb250ZXh0IG9mIHRoZSBmdW5jdGlvbi5cbiAqIEBhcGkgcHVibGljXG4gKi9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBmdW5jdGlvbiBvbihldmVudCwgZm4sIGNvbnRleHQpIHtcbiAgdmFyIGxpc3RlbmVyID0gbmV3IEVFKGZuLCBjb250ZXh0IHx8IHRoaXMpXG4gICAgLCBldnQgPSBwcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50O1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gIGlmICghdGhpcy5fZXZlbnRzW2V2dF0pIHRoaXMuX2V2ZW50c1tldnRdID0gbGlzdGVuZXI7XG4gIGVsc2Uge1xuICAgIGlmICghdGhpcy5fZXZlbnRzW2V2dF0uZm4pIHRoaXMuX2V2ZW50c1tldnRdLnB1c2gobGlzdGVuZXIpO1xuICAgIGVsc2UgdGhpcy5fZXZlbnRzW2V2dF0gPSBbXG4gICAgICB0aGlzLl9ldmVudHNbZXZ0XSwgbGlzdGVuZXJcbiAgICBdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIEFkZCBhbiBFdmVudExpc3RlbmVyIHRoYXQncyBvbmx5IGNhbGxlZCBvbmNlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBOYW1lIG9mIHRoZSBldmVudC5cbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuIENhbGxiYWNrIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBUaGUgY29udGV4dCBvZiB0aGUgZnVuY3Rpb24uXG4gKiBAYXBpIHB1YmxpY1xuICovXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbiBvbmNlKGV2ZW50LCBmbiwgY29udGV4dCkge1xuICB2YXIgbGlzdGVuZXIgPSBuZXcgRUUoZm4sIGNvbnRleHQgfHwgdGhpcywgdHJ1ZSlcbiAgICAsIGV2dCA9IHByZWZpeCA/IHByZWZpeCArIGV2ZW50IDogZXZlbnQ7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpIHRoaXMuX2V2ZW50cyA9IHByZWZpeCA/IHt9IDogT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XSkgdGhpcy5fZXZlbnRzW2V2dF0gPSBsaXN0ZW5lcjtcbiAgZWxzZSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudHNbZXZ0XS5mbikgdGhpcy5fZXZlbnRzW2V2dF0ucHVzaChsaXN0ZW5lcik7XG4gICAgZWxzZSB0aGlzLl9ldmVudHNbZXZ0XSA9IFtcbiAgICAgIHRoaXMuX2V2ZW50c1tldnRdLCBsaXN0ZW5lclxuICAgIF07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8qKlxuICogUmVtb3ZlIGV2ZW50IGxpc3RlbmVycy5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdlIHdhbnQgdG8gcmVtb3ZlLlxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm4gVGhlIGxpc3RlbmVyIHRoYXQgd2UgbmVlZCB0byBmaW5kLlxuICogQHBhcmFtIHtNaXhlZH0gY29udGV4dCBPbmx5IHJlbW92ZSBsaXN0ZW5lcnMgbWF0Y2hpbmcgdGhpcyBjb250ZXh0LlxuICogQHBhcmFtIHtCb29sZWFufSBvbmNlIE9ubHkgcmVtb3ZlIG9uY2UgbGlzdGVuZXJzLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uIHJlbW92ZUxpc3RlbmVyKGV2ZW50LCBmbiwgY29udGV4dCwgb25jZSkge1xuICB2YXIgZXZ0ID0gcHJlZml4ID8gcHJlZml4ICsgZXZlbnQgOiBldmVudDtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW2V2dF0pIHJldHVybiB0aGlzO1xuXG4gIHZhciBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbZXZ0XVxuICAgICwgZXZlbnRzID0gW107XG5cbiAgaWYgKGZuKSB7XG4gICAgaWYgKGxpc3RlbmVycy5mbikge1xuICAgICAgaWYgKFxuICAgICAgICAgICBsaXN0ZW5lcnMuZm4gIT09IGZuXG4gICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnMub25jZSlcbiAgICAgICAgfHwgKGNvbnRleHQgJiYgbGlzdGVuZXJzLmNvbnRleHQgIT09IGNvbnRleHQpXG4gICAgICApIHtcbiAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3RlbmVycy5sZW5ndGg7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoXG4gICAgICAgICAgICAgbGlzdGVuZXJzW2ldLmZuICE9PSBmblxuICAgICAgICAgIHx8IChvbmNlICYmICFsaXN0ZW5lcnNbaV0ub25jZSlcbiAgICAgICAgICB8fCAoY29udGV4dCAmJiBsaXN0ZW5lcnNbaV0uY29udGV4dCAhPT0gY29udGV4dClcbiAgICAgICAgKSB7XG4gICAgICAgICAgZXZlbnRzLnB1c2gobGlzdGVuZXJzW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vXG4gIC8vIFJlc2V0IHRoZSBhcnJheSwgb3IgcmVtb3ZlIGl0IGNvbXBsZXRlbHkgaWYgd2UgaGF2ZSBubyBtb3JlIGxpc3RlbmVycy5cbiAgLy9cbiAgaWYgKGV2ZW50cy5sZW5ndGgpIHtcbiAgICB0aGlzLl9ldmVudHNbZXZ0XSA9IGV2ZW50cy5sZW5ndGggPT09IDEgPyBldmVudHNbMF0gOiBldmVudHM7XG4gIH0gZWxzZSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1tldnRdO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vKipcbiAqIFJlbW92ZSBhbGwgbGlzdGVuZXJzIG9yIG9ubHkgdGhlIGxpc3RlbmVycyBmb3IgdGhlIHNwZWNpZmllZCBldmVudC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHdhbnQgdG8gcmVtb3ZlIGFsbCBsaXN0ZW5lcnMgZm9yLlxuICogQGFwaSBwdWJsaWNcbiAqL1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbiByZW1vdmVBbGxMaXN0ZW5lcnMoZXZlbnQpIHtcbiAgaWYgKCF0aGlzLl9ldmVudHMpIHJldHVybiB0aGlzO1xuXG4gIGlmIChldmVudCkgZGVsZXRlIHRoaXMuX2V2ZW50c1twcmVmaXggPyBwcmVmaXggKyBldmVudCA6IGV2ZW50XTtcbiAgZWxzZSB0aGlzLl9ldmVudHMgPSBwcmVmaXggPyB7fSA6IE9iamVjdC5jcmVhdGUobnVsbCk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vL1xuLy8gQWxpYXMgbWV0aG9kcyBuYW1lcyBiZWNhdXNlIHBlb3BsZSByb2xsIGxpa2UgdGhhdC5cbi8vXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9mZiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXI7XG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbjtcblxuLy9cbi8vIFRoaXMgZnVuY3Rpb24gZG9lc24ndCBhcHBseSBhbnltb3JlLlxuLy9cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24gc2V0TWF4TGlzdGVuZXJzKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vXG4vLyBFeHBvc2UgdGhlIHByZWZpeC5cbi8vXG5FdmVudEVtaXR0ZXIucHJlZml4ZWQgPSBwcmVmaXg7XG5cbi8vXG4vLyBFeHBvc2UgdGhlIG1vZHVsZS5cbi8vXG5pZiAoJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBtb2R1bGUpIHtcbiAgbW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG59XG4iLCIvKipcbiAqICBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgRmFjZWJvb2ssIEluYy5cbiAqICBBbGwgcmlnaHRzIHJlc2VydmVkLlxuICpcbiAqICBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqICBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqICBvZiBwYXRlbnQgcmlnaHRzIGNhbiBiZSBmb3VuZCBpbiB0aGUgUEFURU5UUyBmaWxlIGluIHRoZSBzYW1lIGRpcmVjdG9yeS5cbiAqL1xuXG4vKipcbiAqIEN1cnNvciBpcyBleHBlY3RlZCB0byBiZSByZXF1aXJlZCBpbiBhIG5vZGUgb3Igb3RoZXIgQ29tbW9uSlMgY29udGV4dDpcbiAqXG4gKiAgICAgdmFyIEN1cnNvciA9IHJlcXVpcmUoJ2ltbXV0YWJsZS9jb250cmliL2N1cnNvcicpO1xuICpcbiAqIElmIHlvdSB3aXNoIHRvIHVzZSBpdCBpbiB0aGUgYnJvd3NlciwgcGxlYXNlIGNoZWNrIG91dCBCcm93c2VyaWZ5IG9yIFdlYlBhY2shXG4gKi9cblxudmFyIEltbXV0YWJsZSA9IHJlcXVpcmUoJ2ltbXV0YWJsZScpO1xudmFyIEl0ZXJhYmxlID0gSW1tdXRhYmxlLkl0ZXJhYmxlO1xudmFyIEl0ZXJhdG9yID0gSXRlcmFibGUuSXRlcmF0b3I7XG52YXIgU2VxID0gSW1tdXRhYmxlLlNlcTtcbnZhciBNYXAgPSBJbW11dGFibGUuTWFwO1xudmFyIFJlY29yZCA9IEltbXV0YWJsZS5SZWNvcmQ7XG5cblxuZnVuY3Rpb24gY3Vyc29yRnJvbShyb290RGF0YSwga2V5UGF0aCwgb25DaGFuZ2UpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICBrZXlQYXRoID0gW107XG4gIH0gZWxzZSBpZiAodHlwZW9mIGtleVBhdGggPT09ICdmdW5jdGlvbicpIHtcbiAgICBvbkNoYW5nZSA9IGtleVBhdGg7XG4gICAga2V5UGF0aCA9IFtdO1xuICB9IGVsc2Uge1xuICAgIGtleVBhdGggPSB2YWxUb0tleVBhdGgoa2V5UGF0aCk7XG4gIH1cbiAgcmV0dXJuIG1ha2VDdXJzb3Iocm9vdERhdGEsIGtleVBhdGgsIG9uQ2hhbmdlKTtcbn1cblxuXG52YXIgS2V5ZWRDdXJzb3JQcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFNlcS5LZXllZC5wcm90b3R5cGUpO1xudmFyIEluZGV4ZWRDdXJzb3JQcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFNlcS5JbmRleGVkLnByb3RvdHlwZSk7XG5cbmZ1bmN0aW9uIEtleWVkQ3Vyc29yKHJvb3REYXRhLCBrZXlQYXRoLCBvbkNoYW5nZSwgc2l6ZSkge1xuICB0aGlzLnNpemUgPSBzaXplO1xuICB0aGlzLl9yb290RGF0YSA9IHJvb3REYXRhO1xuICB0aGlzLl9rZXlQYXRoID0ga2V5UGF0aDtcbiAgdGhpcy5fb25DaGFuZ2UgPSBvbkNoYW5nZTtcbn1cbktleWVkQ3Vyc29yUHJvdG90eXBlLmNvbnN0cnVjdG9yID0gS2V5ZWRDdXJzb3I7XG5cbmZ1bmN0aW9uIEluZGV4ZWRDdXJzb3Iocm9vdERhdGEsIGtleVBhdGgsIG9uQ2hhbmdlLCBzaXplKSB7XG4gIHRoaXMuc2l6ZSA9IHNpemU7XG4gIHRoaXMuX3Jvb3REYXRhID0gcm9vdERhdGE7XG4gIHRoaXMuX2tleVBhdGggPSBrZXlQYXRoO1xuICB0aGlzLl9vbkNoYW5nZSA9IG9uQ2hhbmdlO1xufVxuSW5kZXhlZEN1cnNvclByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEluZGV4ZWRDdXJzb3I7XG5cbktleWVkQ3Vyc29yUHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ0N1cnNvciB7JywgJ30nKTtcbn1cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuX190b1N0cmluZygnQ3Vyc29yIFsnLCAnXScpO1xufVxuXG5LZXllZEN1cnNvclByb3RvdHlwZS5kZXJlZiA9XG5LZXllZEN1cnNvclByb3RvdHlwZS52YWx1ZU9mID1cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUuZGVyZWYgPVxuSW5kZXhlZEN1cnNvclByb3RvdHlwZS52YWx1ZU9mID0gZnVuY3Rpb24obm90U2V0VmFsdWUpIHtcbiAgcmV0dXJuIHRoaXMuX3Jvb3REYXRhLmdldEluKHRoaXMuX2tleVBhdGgsIG5vdFNldFZhbHVlKTtcbn1cblxuS2V5ZWRDdXJzb3JQcm90b3R5cGUuZ2V0ID1cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oa2V5LCBub3RTZXRWYWx1ZSkge1xuICByZXR1cm4gdGhpcy5nZXRJbihba2V5XSwgbm90U2V0VmFsdWUpO1xufVxuXG5LZXllZEN1cnNvclByb3RvdHlwZS5nZXRJbiA9XG5JbmRleGVkQ3Vyc29yUHJvdG90eXBlLmdldEluID0gZnVuY3Rpb24oa2V5UGF0aCwgbm90U2V0VmFsdWUpIHtcbiAga2V5UGF0aCA9IGxpc3RUb0tleVBhdGgoa2V5UGF0aCk7XG4gIGlmIChrZXlQYXRoLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIHZhciB2YWx1ZSA9IHRoaXMuX3Jvb3REYXRhLmdldEluKG5ld0tleVBhdGgodGhpcy5fa2V5UGF0aCwga2V5UGF0aCksIE5PVF9TRVQpO1xuICByZXR1cm4gdmFsdWUgPT09IE5PVF9TRVQgPyBub3RTZXRWYWx1ZSA6IHdyYXBwZWRWYWx1ZSh0aGlzLCBrZXlQYXRoLCB2YWx1ZSk7XG59XG5cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUuc2V0ID1cbktleWVkQ3Vyc29yUHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIHJldHVybiB1cGRhdGVDdXJzb3IodGhpcywgZnVuY3Rpb24oKSB7IHJldHVybiBrZXk7IH0sIFtdKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdXBkYXRlQ3Vyc29yKHRoaXMsIGZ1bmN0aW9uIChtKSB7IHJldHVybiBtLnNldChrZXksIHZhbHVlKTsgfSwgW2tleV0pO1xuICB9XG59XG5cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uKC8qIHZhbHVlcyAqLykge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgcmV0dXJuIHVwZGF0ZUN1cnNvcih0aGlzLCBmdW5jdGlvbiAobSkge1xuICAgIHJldHVybiBtLnB1c2guYXBwbHkobSwgYXJncyk7XG4gIH0pO1xufVxuXG5JbmRleGVkQ3Vyc29yUHJvdG90eXBlLnBvcCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdXBkYXRlQ3Vyc29yKHRoaXMsIGZ1bmN0aW9uIChtKSB7XG4gICAgcmV0dXJuIG0ucG9wKCk7XG4gIH0pO1xufVxuXG5JbmRleGVkQ3Vyc29yUHJvdG90eXBlLnVuc2hpZnQgPSBmdW5jdGlvbigvKiB2YWx1ZXMgKi8pIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHJldHVybiB1cGRhdGVDdXJzb3IodGhpcywgZnVuY3Rpb24gKG0pIHtcbiAgICByZXR1cm4gbS51bnNoaWZ0LmFwcGx5KG0sIGFyZ3MpO1xuICB9KTtcbn1cblxuSW5kZXhlZEN1cnNvclByb3RvdHlwZS5zaGlmdCA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdXBkYXRlQ3Vyc29yKHRoaXMsIGZ1bmN0aW9uIChtKSB7XG4gICAgcmV0dXJuIG0uc2hpZnQoKTtcbiAgfSk7XG59XG5cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUuc2V0SW4gPVxuS2V5ZWRDdXJzb3JQcm90b3R5cGUuc2V0SW4gPSBNYXAucHJvdG90eXBlLnNldEluO1xuXG5LZXllZEN1cnNvclByb3RvdHlwZS5yZW1vdmUgPVxuS2V5ZWRDdXJzb3JQcm90b3R5cGVbJ2RlbGV0ZSddID1cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUucmVtb3ZlID1cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGVbJ2RlbGV0ZSddID0gZnVuY3Rpb24oa2V5KSB7XG4gIHJldHVybiB1cGRhdGVDdXJzb3IodGhpcywgZnVuY3Rpb24gKG0pIHsgcmV0dXJuIG0ucmVtb3ZlKGtleSk7IH0sIFtrZXldKTtcbn1cblxuSW5kZXhlZEN1cnNvclByb3RvdHlwZS5yZW1vdmVJbiA9XG5JbmRleGVkQ3Vyc29yUHJvdG90eXBlLmRlbGV0ZUluID1cbktleWVkQ3Vyc29yUHJvdG90eXBlLnJlbW92ZUluID1cbktleWVkQ3Vyc29yUHJvdG90eXBlLmRlbGV0ZUluID0gTWFwLnByb3RvdHlwZS5kZWxldGVJbjtcblxuS2V5ZWRDdXJzb3JQcm90b3R5cGUuY2xlYXIgPVxuSW5kZXhlZEN1cnNvclByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdXBkYXRlQ3Vyc29yKHRoaXMsIGZ1bmN0aW9uIChtKSB7IHJldHVybiBtLmNsZWFyKCk7IH0pO1xufVxuXG5JbmRleGVkQ3Vyc29yUHJvdG90eXBlLnVwZGF0ZSA9XG5LZXllZEN1cnNvclByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihrZXlPckZuLCBub3RTZXRWYWx1ZSwgdXBkYXRlcikge1xuICByZXR1cm4gYXJndW1lbnRzLmxlbmd0aCA9PT0gMSA/XG4gICAgdXBkYXRlQ3Vyc29yKHRoaXMsIGtleU9yRm4pIDpcbiAgICB0aGlzLnVwZGF0ZUluKFtrZXlPckZuXSwgbm90U2V0VmFsdWUsIHVwZGF0ZXIpO1xufVxuXG5JbmRleGVkQ3Vyc29yUHJvdG90eXBlLnVwZGF0ZUluID1cbktleWVkQ3Vyc29yUHJvdG90eXBlLnVwZGF0ZUluID0gZnVuY3Rpb24oa2V5UGF0aCwgbm90U2V0VmFsdWUsIHVwZGF0ZXIpIHtcbiAgcmV0dXJuIHVwZGF0ZUN1cnNvcih0aGlzLCBmdW5jdGlvbiAobSkge1xuICAgIHJldHVybiBtLnVwZGF0ZUluKGtleVBhdGgsIG5vdFNldFZhbHVlLCB1cGRhdGVyKTtcbiAgfSwga2V5UGF0aCk7XG59XG5cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUubWVyZ2UgPVxuS2V5ZWRDdXJzb3JQcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbigvKi4uLml0ZXJzKi8pIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHJldHVybiB1cGRhdGVDdXJzb3IodGhpcywgZnVuY3Rpb24gKG0pIHtcbiAgICByZXR1cm4gbS5tZXJnZS5hcHBseShtLCBhcmdzKTtcbiAgfSk7XG59XG5cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUubWVyZ2VXaXRoID1cbktleWVkQ3Vyc29yUHJvdG90eXBlLm1lcmdlV2l0aCA9IGZ1bmN0aW9uKG1lcmdlci8qLCAuLi5pdGVycyovKSB7XG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICByZXR1cm4gdXBkYXRlQ3Vyc29yKHRoaXMsIGZ1bmN0aW9uIChtKSB7XG4gICAgcmV0dXJuIG0ubWVyZ2VXaXRoLmFwcGx5KG0sIGFyZ3MpO1xuICB9KTtcbn1cblxuSW5kZXhlZEN1cnNvclByb3RvdHlwZS5tZXJnZUluID1cbktleWVkQ3Vyc29yUHJvdG90eXBlLm1lcmdlSW4gPSBNYXAucHJvdG90eXBlLm1lcmdlSW47XG5cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUubWVyZ2VEZWVwID1cbktleWVkQ3Vyc29yUHJvdG90eXBlLm1lcmdlRGVlcCA9IGZ1bmN0aW9uKC8qLi4uaXRlcnMqLykge1xuICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgcmV0dXJuIHVwZGF0ZUN1cnNvcih0aGlzLCBmdW5jdGlvbiAobSkge1xuICAgIHJldHVybiBtLm1lcmdlRGVlcC5hcHBseShtLCBhcmdzKTtcbiAgfSk7XG59XG5cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUubWVyZ2VEZWVwV2l0aCA9XG5LZXllZEN1cnNvclByb3RvdHlwZS5tZXJnZURlZXBXaXRoID0gZnVuY3Rpb24obWVyZ2VyLyosIC4uLml0ZXJzKi8pIHtcbiAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gIHJldHVybiB1cGRhdGVDdXJzb3IodGhpcywgZnVuY3Rpb24gKG0pIHtcbiAgICByZXR1cm4gbS5tZXJnZURlZXBXaXRoLmFwcGx5KG0sIGFyZ3MpO1xuICB9KTtcbn1cblxuSW5kZXhlZEN1cnNvclByb3RvdHlwZS5tZXJnZURlZXBJbiA9XG5LZXllZEN1cnNvclByb3RvdHlwZS5tZXJnZURlZXBJbiA9IE1hcC5wcm90b3R5cGUubWVyZ2VEZWVwSW47XG5cbktleWVkQ3Vyc29yUHJvdG90eXBlLndpdGhNdXRhdGlvbnMgPVxuSW5kZXhlZEN1cnNvclByb3RvdHlwZS53aXRoTXV0YXRpb25zID0gZnVuY3Rpb24oZm4pIHtcbiAgcmV0dXJuIHVwZGF0ZUN1cnNvcih0aGlzLCBmdW5jdGlvbiAobSkge1xuICAgIHJldHVybiAobSB8fCBNYXAoKSkud2l0aE11dGF0aW9ucyhmbik7XG4gIH0pO1xufVxuXG5LZXllZEN1cnNvclByb3RvdHlwZS5jdXJzb3IgPVxuSW5kZXhlZEN1cnNvclByb3RvdHlwZS5jdXJzb3IgPSBmdW5jdGlvbihzdWJLZXlQYXRoKSB7XG4gIHN1YktleVBhdGggPSB2YWxUb0tleVBhdGgoc3ViS2V5UGF0aCk7XG4gIHJldHVybiBzdWJLZXlQYXRoLmxlbmd0aCA9PT0gMCA/IHRoaXMgOiBzdWJDdXJzb3IodGhpcywgc3ViS2V5UGF0aCk7XG59XG5cbi8qKlxuICogQWxsIGl0ZXJhYmxlcyBuZWVkIHRvIGltcGxlbWVudCBfX2l0ZXJhdGVcbiAqL1xuS2V5ZWRDdXJzb3JQcm90b3R5cGUuX19pdGVyYXRlID1cbkluZGV4ZWRDdXJzb3JQcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgdmFyIGN1cnNvciA9IHRoaXM7XG4gIHZhciBkZXJlZiA9IGN1cnNvci5kZXJlZigpO1xuICByZXR1cm4gZGVyZWYgJiYgZGVyZWYuX19pdGVyYXRlID8gZGVyZWYuX19pdGVyYXRlKFxuICAgIGZ1bmN0aW9uICh2LCBrKSB7IHJldHVybiBmbih3cmFwcGVkVmFsdWUoY3Vyc29yLCBba10sIHYpLCBrLCBjdXJzb3IpOyB9LFxuICAgIHJldmVyc2VcbiAgKSA6IDA7XG59XG5cbi8qKlxuICogQWxsIGl0ZXJhYmxlcyBuZWVkIHRvIGltcGxlbWVudCBfX2l0ZXJhdG9yXG4gKi9cbktleWVkQ3Vyc29yUHJvdG90eXBlLl9faXRlcmF0b3IgPVxuSW5kZXhlZEN1cnNvclByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICB2YXIgZGVyZWYgPSB0aGlzLmRlcmVmKCk7XG4gIHZhciBjdXJzb3IgPSB0aGlzO1xuICB2YXIgaXRlcmF0b3IgPSBkZXJlZiAmJiBkZXJlZi5fX2l0ZXJhdG9yICYmXG4gICAgZGVyZWYuX19pdGVyYXRvcihJdGVyYXRvci5FTlRSSUVTLCByZXZlcnNlKTtcbiAgcmV0dXJuIG5ldyBJdGVyYXRvcihmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFpdGVyYXRvcikge1xuICAgICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xuICAgIH1cbiAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICByZXR1cm4gc3RlcDtcbiAgICB9XG4gICAgdmFyIGVudHJ5ID0gc3RlcC52YWx1ZTtcbiAgICB2YXIgayA9IGVudHJ5WzBdO1xuICAgIHZhciB2ID0gd3JhcHBlZFZhbHVlKGN1cnNvciwgW2tdLCBlbnRyeVsxXSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHZhbHVlOiB0eXBlID09PSBJdGVyYXRvci5LRVlTID8gayA6IHR5cGUgPT09IEl0ZXJhdG9yLlZBTFVFUyA/IHYgOiBbaywgdl0sXG4gICAgICBkb25lOiBmYWxzZVxuICAgIH07XG4gIH0pO1xufVxuXG5LZXllZEN1cnNvci5wcm90b3R5cGUgPSBLZXllZEN1cnNvclByb3RvdHlwZTtcbkluZGV4ZWRDdXJzb3IucHJvdG90eXBlID0gSW5kZXhlZEN1cnNvclByb3RvdHlwZTtcblxuXG52YXIgTk9UX1NFVCA9IHt9OyAvLyBTZW50aW5lbCB2YWx1ZVxuXG5mdW5jdGlvbiBtYWtlQ3Vyc29yKHJvb3REYXRhLCBrZXlQYXRoLCBvbkNoYW5nZSwgdmFsdWUpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCA0KSB7XG4gICAgdmFsdWUgPSByb290RGF0YS5nZXRJbihrZXlQYXRoKTtcbiAgfVxuICB2YXIgc2l6ZSA9IHZhbHVlICYmIHZhbHVlLnNpemU7XG4gIHZhciBDdXJzb3JDbGFzcyA9IEl0ZXJhYmxlLmlzSW5kZXhlZCh2YWx1ZSkgPyBJbmRleGVkQ3Vyc29yIDogS2V5ZWRDdXJzb3I7XG4gIHZhciBjdXJzb3IgPSBuZXcgQ3Vyc29yQ2xhc3Mocm9vdERhdGEsIGtleVBhdGgsIG9uQ2hhbmdlLCBzaXplKTtcblxuICBpZiAodmFsdWUgaW5zdGFuY2VvZiBSZWNvcmQpIHtcbiAgICBkZWZpbmVSZWNvcmRQcm9wZXJ0aWVzKGN1cnNvciwgdmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIGN1cnNvcjtcbn1cblxuZnVuY3Rpb24gZGVmaW5lUmVjb3JkUHJvcGVydGllcyhjdXJzb3IsIHZhbHVlKSB7XG4gIHRyeSB7XG4gICAgdmFsdWUuX2tleXMuZm9yRWFjaChzZXRQcm9wLmJpbmQodW5kZWZpbmVkLCBjdXJzb3IpKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBPYmplY3QuZGVmaW5lUHJvcGVydHkgZmFpbGVkLiBQcm9iYWJseSBJRTguXG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0UHJvcChwcm90b3R5cGUsIG5hbWUpIHtcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvdHlwZSwgbmFtZSwge1xuICAgIGdldDogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXQobmFtZSk7XG4gICAgfSxcbiAgICBzZXQ6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICBpZiAoIXRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IHNldCBvbiBhbiBpbW11dGFibGUgcmVjb3JkLicpO1xuICAgICAgfVxuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHdyYXBwZWRWYWx1ZShjdXJzb3IsIGtleVBhdGgsIHZhbHVlKSB7XG4gIHJldHVybiBJdGVyYWJsZS5pc0l0ZXJhYmxlKHZhbHVlKSA/IHN1YkN1cnNvcihjdXJzb3IsIGtleVBhdGgsIHZhbHVlKSA6IHZhbHVlO1xufVxuXG5mdW5jdGlvbiBzdWJDdXJzb3IoY3Vyc29yLCBrZXlQYXRoLCB2YWx1ZSkge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA8IDMpIHtcbiAgICByZXR1cm4gbWFrZUN1cnNvciggLy8gY2FsbCB3aXRob3V0IHZhbHVlXG4gICAgICBjdXJzb3IuX3Jvb3REYXRhLFxuICAgICAgbmV3S2V5UGF0aChjdXJzb3IuX2tleVBhdGgsIGtleVBhdGgpLFxuICAgICAgY3Vyc29yLl9vbkNoYW5nZVxuICAgICk7XG4gIH1cbiAgcmV0dXJuIG1ha2VDdXJzb3IoXG4gICAgY3Vyc29yLl9yb290RGF0YSxcbiAgICBuZXdLZXlQYXRoKGN1cnNvci5fa2V5UGF0aCwga2V5UGF0aCksXG4gICAgY3Vyc29yLl9vbkNoYW5nZSxcbiAgICB2YWx1ZVxuICApO1xufVxuXG5mdW5jdGlvbiB1cGRhdGVDdXJzb3IoY3Vyc29yLCBjaGFuZ2VGbiwgY2hhbmdlS2V5UGF0aCkge1xuICB2YXIgZGVlcENoYW5nZSA9IGFyZ3VtZW50cy5sZW5ndGggPiAyO1xuICB2YXIgbmV3Um9vdERhdGEgPSBjdXJzb3IuX3Jvb3REYXRhLnVwZGF0ZUluKFxuICAgIGN1cnNvci5fa2V5UGF0aCxcbiAgICBkZWVwQ2hhbmdlID8gTWFwKCkgOiB1bmRlZmluZWQsXG4gICAgY2hhbmdlRm5cbiAgKTtcbiAgdmFyIGtleVBhdGggPSBjdXJzb3IuX2tleVBhdGggfHwgW107XG4gIHZhciByZXN1bHQgPSBjdXJzb3IuX29uQ2hhbmdlICYmIGN1cnNvci5fb25DaGFuZ2UuY2FsbChcbiAgICB1bmRlZmluZWQsXG4gICAgbmV3Um9vdERhdGEsXG4gICAgY3Vyc29yLl9yb290RGF0YSxcbiAgICBkZWVwQ2hhbmdlID8gbmV3S2V5UGF0aChrZXlQYXRoLCBjaGFuZ2VLZXlQYXRoKSA6IGtleVBhdGhcbiAgKTtcbiAgaWYgKHJlc3VsdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgbmV3Um9vdERhdGEgPSByZXN1bHQ7XG4gIH1cbiAgcmV0dXJuIG1ha2VDdXJzb3IobmV3Um9vdERhdGEsIGN1cnNvci5fa2V5UGF0aCwgY3Vyc29yLl9vbkNoYW5nZSk7XG59XG5cbmZ1bmN0aW9uIG5ld0tleVBhdGgoaGVhZCwgdGFpbCkge1xuICByZXR1cm4gaGVhZC5jb25jYXQobGlzdFRvS2V5UGF0aCh0YWlsKSk7XG59XG5cbmZ1bmN0aW9uIGxpc3RUb0tleVBhdGgobGlzdCkge1xuICByZXR1cm4gQXJyYXkuaXNBcnJheShsaXN0KSA/IGxpc3QgOiBJbW11dGFibGUuSXRlcmFibGUobGlzdCkudG9BcnJheSgpO1xufVxuXG5mdW5jdGlvbiB2YWxUb0tleVBhdGgodmFsKSB7XG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbCkgPyB2YWwgOlxuICAgIEl0ZXJhYmxlLmlzSXRlcmFibGUodmFsKSA/IHZhbC50b0FycmF5KCkgOlxuICAgIFt2YWxdO1xufVxuXG5leHBvcnRzLmZyb20gPSBjdXJzb3JGcm9tO1xuIiwiLyoqXG4gKiAgQ29weXJpZ2h0IChjKSAyMDE0LTIwMTUsIEZhY2Vib29rLCBJbmMuXG4gKiAgQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiAgVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiAgTElDRU5TRSBmaWxlIGluIHRoZSByb290IGRpcmVjdG9yeSBvZiB0aGlzIHNvdXJjZSB0cmVlLiBBbiBhZGRpdGlvbmFsIGdyYW50XG4gKiAgb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKi9cbihmdW5jdGlvbiAoZ2xvYmFsLCBmYWN0b3J5KSB7XG4gIHR5cGVvZiBleHBvcnRzID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyA/IG1vZHVsZS5leHBvcnRzID0gZmFjdG9yeSgpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKGZhY3RvcnkpIDpcbiAgZ2xvYmFsLkltbXV0YWJsZSA9IGZhY3RvcnkoKVxufSh0aGlzLCBmdW5jdGlvbiAoKSB7ICd1c2Ugc3RyaWN0Jzt2YXIgU0xJQ0UkMCA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcblxuICBmdW5jdGlvbiBjcmVhdGVDbGFzcyhjdG9yLCBzdXBlckNsYXNzKSB7XG4gICAgaWYgKHN1cGVyQ2xhc3MpIHtcbiAgICAgIGN0b3IucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShzdXBlckNsYXNzLnByb3RvdHlwZSk7XG4gICAgfVxuICAgIGN0b3IucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gY3RvcjtcbiAgfVxuXG4gIC8vIFVzZWQgZm9yIHNldHRpbmcgcHJvdG90eXBlIG1ldGhvZHMgdGhhdCBJRTggY2hva2VzIG9uLlxuICB2YXIgREVMRVRFID0gJ2RlbGV0ZSc7XG5cbiAgLy8gQ29uc3RhbnRzIGRlc2NyaWJpbmcgdGhlIHNpemUgb2YgdHJpZSBub2Rlcy5cbiAgdmFyIFNISUZUID0gNTsgLy8gUmVzdWx0ZWQgaW4gYmVzdCBwZXJmb3JtYW5jZSBhZnRlciBfX19fX18/XG4gIHZhciBTSVpFID0gMSA8PCBTSElGVDtcbiAgdmFyIE1BU0sgPSBTSVpFIC0gMTtcblxuICAvLyBBIGNvbnNpc3RlbnQgc2hhcmVkIHZhbHVlIHJlcHJlc2VudGluZyBcIm5vdCBzZXRcIiB3aGljaCBlcXVhbHMgbm90aGluZyBvdGhlclxuICAvLyB0aGFuIGl0c2VsZiwgYW5kIG5vdGhpbmcgdGhhdCBjb3VsZCBiZSBwcm92aWRlZCBleHRlcm5hbGx5LlxuICB2YXIgTk9UX1NFVCA9IHt9O1xuXG4gIC8vIEJvb2xlYW4gcmVmZXJlbmNlcywgUm91Z2ggZXF1aXZhbGVudCBvZiBgYm9vbCAmYC5cbiAgdmFyIENIQU5HRV9MRU5HVEggPSB7IHZhbHVlOiBmYWxzZSB9O1xuICB2YXIgRElEX0FMVEVSID0geyB2YWx1ZTogZmFsc2UgfTtcblxuICBmdW5jdGlvbiBNYWtlUmVmKHJlZikge1xuICAgIHJlZi52YWx1ZSA9IGZhbHNlO1xuICAgIHJldHVybiByZWY7XG4gIH1cblxuICBmdW5jdGlvbiBTZXRSZWYocmVmKSB7XG4gICAgcmVmICYmIChyZWYudmFsdWUgPSB0cnVlKTtcbiAgfVxuXG4gIC8vIEEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIHZhbHVlIHJlcHJlc2VudGluZyBhbiBcIm93bmVyXCIgZm9yIHRyYW5zaWVudCB3cml0ZXNcbiAgLy8gdG8gdHJpZXMuIFRoZSByZXR1cm4gdmFsdWUgd2lsbCBvbmx5IGV2ZXIgZXF1YWwgaXRzZWxmLCBhbmQgd2lsbCBub3QgZXF1YWxcbiAgLy8gdGhlIHJldHVybiBvZiBhbnkgc3Vic2VxdWVudCBjYWxsIG9mIHRoaXMgZnVuY3Rpb24uXG4gIGZ1bmN0aW9uIE93bmVySUQoKSB7fVxuXG4gIC8vIGh0dHA6Ly9qc3BlcmYuY29tL2NvcHktYXJyYXktaW5saW5lXG4gIGZ1bmN0aW9uIGFyckNvcHkoYXJyLCBvZmZzZXQpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgfHwgMDtcbiAgICB2YXIgbGVuID0gTWF0aC5tYXgoMCwgYXJyLmxlbmd0aCAtIG9mZnNldCk7XG4gICAgdmFyIG5ld0FyciA9IG5ldyBBcnJheShsZW4pO1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBsZW47IGlpKyspIHtcbiAgICAgIG5ld0FycltpaV0gPSBhcnJbaWkgKyBvZmZzZXRdO1xuICAgIH1cbiAgICByZXR1cm4gbmV3QXJyO1xuICB9XG5cbiAgZnVuY3Rpb24gZW5zdXJlU2l6ZShpdGVyKSB7XG4gICAgaWYgKGl0ZXIuc2l6ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBpdGVyLnNpemUgPSBpdGVyLl9faXRlcmF0ZShyZXR1cm5UcnVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZXIuc2l6ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyYXBJbmRleChpdGVyLCBpbmRleCkge1xuICAgIC8vIFRoaXMgaW1wbGVtZW50cyBcImlzIGFycmF5IGluZGV4XCIgd2hpY2ggdGhlIEVDTUFTdHJpbmcgc3BlYyBkZWZpbmVzIGFzOlxuICAgIC8vICAgICBBIFN0cmluZyBwcm9wZXJ0eSBuYW1lIFAgaXMgYW4gYXJyYXkgaW5kZXggaWYgYW5kIG9ubHkgaWZcbiAgICAvLyAgICAgVG9TdHJpbmcoVG9VaW50MzIoUCkpIGlzIGVxdWFsIHRvIFAgYW5kIFRvVWludDMyKFApIGlzIG5vdCBlcXVhbFxuICAgIC8vICAgICB0byAyXjMy4oiSMS5cbiAgICAvLyBIb3dldmVyIG5vdGUgdGhhdCB3ZSdyZSBjdXJyZW50bHkgY2FsbGluZyBUb051bWJlcigpIGluc3RlYWQgb2YgVG9VaW50MzIoKVxuICAgIC8vIHdoaWNoIHNob3VsZCBiZSBpbXByb3ZlZCBpbiB0aGUgZnV0dXJlLCBhcyBmbG9hdGluZyBwb2ludCBudW1iZXJzIHNob3VsZFxuICAgIC8vIG5vdCBiZSBhY2NlcHRlZCBhcyBhbiBhcnJheSBpbmRleC5cbiAgICBpZiAodHlwZW9mIGluZGV4ICE9PSAnbnVtYmVyJykge1xuICAgICAgdmFyIG51bUluZGV4ID0gK2luZGV4O1xuICAgICAgaWYgKCcnICsgbnVtSW5kZXggIT09IGluZGV4KSB7XG4gICAgICAgIHJldHVybiBOYU47XG4gICAgICB9XG4gICAgICBpbmRleCA9IG51bUluZGV4O1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXggPCAwID8gZW5zdXJlU2l6ZShpdGVyKSArIGluZGV4IDogaW5kZXg7XG4gIH1cblxuICBmdW5jdGlvbiByZXR1cm5UcnVlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgZnVuY3Rpb24gd2hvbGVTbGljZShiZWdpbiwgZW5kLCBzaXplKSB7XG4gICAgcmV0dXJuIChiZWdpbiA9PT0gMCB8fCAoc2l6ZSAhPT0gdW5kZWZpbmVkICYmIGJlZ2luIDw9IC1zaXplKSkgJiZcbiAgICAgIChlbmQgPT09IHVuZGVmaW5lZCB8fCAoc2l6ZSAhPT0gdW5kZWZpbmVkICYmIGVuZCA+PSBzaXplKSk7XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlQmVnaW4oYmVnaW4sIHNpemUpIHtcbiAgICByZXR1cm4gcmVzb2x2ZUluZGV4KGJlZ2luLCBzaXplLCAwKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlc29sdmVFbmQoZW5kLCBzaXplKSB7XG4gICAgcmV0dXJuIHJlc29sdmVJbmRleChlbmQsIHNpemUsIHNpemUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVzb2x2ZUluZGV4KGluZGV4LCBzaXplLCBkZWZhdWx0SW5kZXgpIHtcbiAgICByZXR1cm4gaW5kZXggPT09IHVuZGVmaW5lZCA/XG4gICAgICBkZWZhdWx0SW5kZXggOlxuICAgICAgaW5kZXggPCAwID9cbiAgICAgICAgTWF0aC5tYXgoMCwgc2l6ZSArIGluZGV4KSA6XG4gICAgICAgIHNpemUgPT09IHVuZGVmaW5lZCA/XG4gICAgICAgICAgaW5kZXggOlxuICAgICAgICAgIE1hdGgubWluKHNpemUsIGluZGV4KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIEl0ZXJhYmxlKHZhbHVlKSB7XG4gICAgICByZXR1cm4gaXNJdGVyYWJsZSh2YWx1ZSkgPyB2YWx1ZSA6IFNlcSh2YWx1ZSk7XG4gICAgfVxuXG5cbiAgY3JlYXRlQ2xhc3MoS2V5ZWRJdGVyYWJsZSwgSXRlcmFibGUpO1xuICAgIGZ1bmN0aW9uIEtleWVkSXRlcmFibGUodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0tleWVkKHZhbHVlKSA/IHZhbHVlIDogS2V5ZWRTZXEodmFsdWUpO1xuICAgIH1cblxuXG4gIGNyZWF0ZUNsYXNzKEluZGV4ZWRJdGVyYWJsZSwgSXRlcmFibGUpO1xuICAgIGZ1bmN0aW9uIEluZGV4ZWRJdGVyYWJsZSh2YWx1ZSkge1xuICAgICAgcmV0dXJuIGlzSW5kZXhlZCh2YWx1ZSkgPyB2YWx1ZSA6IEluZGV4ZWRTZXEodmFsdWUpO1xuICAgIH1cblxuXG4gIGNyZWF0ZUNsYXNzKFNldEl0ZXJhYmxlLCBJdGVyYWJsZSk7XG4gICAgZnVuY3Rpb24gU2V0SXRlcmFibGUodmFsdWUpIHtcbiAgICAgIHJldHVybiBpc0l0ZXJhYmxlKHZhbHVlKSAmJiAhaXNBc3NvY2lhdGl2ZSh2YWx1ZSkgPyB2YWx1ZSA6IFNldFNlcSh2YWx1ZSk7XG4gICAgfVxuXG5cblxuICBmdW5jdGlvbiBpc0l0ZXJhYmxlKG1heWJlSXRlcmFibGUpIHtcbiAgICByZXR1cm4gISEobWF5YmVJdGVyYWJsZSAmJiBtYXliZUl0ZXJhYmxlW0lTX0lURVJBQkxFX1NFTlRJTkVMXSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc0tleWVkKG1heWJlS2V5ZWQpIHtcbiAgICByZXR1cm4gISEobWF5YmVLZXllZCAmJiBtYXliZUtleWVkW0lTX0tFWUVEX1NFTlRJTkVMXSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc0luZGV4ZWQobWF5YmVJbmRleGVkKSB7XG4gICAgcmV0dXJuICEhKG1heWJlSW5kZXhlZCAmJiBtYXliZUluZGV4ZWRbSVNfSU5ERVhFRF9TRU5USU5FTF0pO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNBc3NvY2lhdGl2ZShtYXliZUFzc29jaWF0aXZlKSB7XG4gICAgcmV0dXJuIGlzS2V5ZWQobWF5YmVBc3NvY2lhdGl2ZSkgfHwgaXNJbmRleGVkKG1heWJlQXNzb2NpYXRpdmUpO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNPcmRlcmVkKG1heWJlT3JkZXJlZCkge1xuICAgIHJldHVybiAhIShtYXliZU9yZGVyZWQgJiYgbWF5YmVPcmRlcmVkW0lTX09SREVSRURfU0VOVElORUxdKTtcbiAgfVxuXG4gIEl0ZXJhYmxlLmlzSXRlcmFibGUgPSBpc0l0ZXJhYmxlO1xuICBJdGVyYWJsZS5pc0tleWVkID0gaXNLZXllZDtcbiAgSXRlcmFibGUuaXNJbmRleGVkID0gaXNJbmRleGVkO1xuICBJdGVyYWJsZS5pc0Fzc29jaWF0aXZlID0gaXNBc3NvY2lhdGl2ZTtcbiAgSXRlcmFibGUuaXNPcmRlcmVkID0gaXNPcmRlcmVkO1xuXG4gIEl0ZXJhYmxlLktleWVkID0gS2V5ZWRJdGVyYWJsZTtcbiAgSXRlcmFibGUuSW5kZXhlZCA9IEluZGV4ZWRJdGVyYWJsZTtcbiAgSXRlcmFibGUuU2V0ID0gU2V0SXRlcmFibGU7XG5cblxuICB2YXIgSVNfSVRFUkFCTEVfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9JVEVSQUJMRV9fQEAnO1xuICB2YXIgSVNfS0VZRURfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9LRVlFRF9fQEAnO1xuICB2YXIgSVNfSU5ERVhFRF9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX0lOREVYRURfX0BAJztcbiAgdmFyIElTX09SREVSRURfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9PUkRFUkVEX19AQCc7XG5cbiAgLyogZ2xvYmFsIFN5bWJvbCAqL1xuXG4gIHZhciBJVEVSQVRFX0tFWVMgPSAwO1xuICB2YXIgSVRFUkFURV9WQUxVRVMgPSAxO1xuICB2YXIgSVRFUkFURV9FTlRSSUVTID0gMjtcblxuICB2YXIgUkVBTF9JVEVSQVRPUl9TWU1CT0wgPSB0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nICYmIFN5bWJvbC5pdGVyYXRvcjtcbiAgdmFyIEZBVVhfSVRFUkFUT1JfU1lNQk9MID0gJ0BAaXRlcmF0b3InO1xuXG4gIHZhciBJVEVSQVRPUl9TWU1CT0wgPSBSRUFMX0lURVJBVE9SX1NZTUJPTCB8fCBGQVVYX0lURVJBVE9SX1NZTUJPTDtcblxuXG4gIGZ1bmN0aW9uIHNyY19JdGVyYXRvcl9fSXRlcmF0b3IobmV4dCkge1xuICAgICAgdGhpcy5uZXh0ID0gbmV4dDtcbiAgICB9XG5cbiAgICBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICdbSXRlcmF0b3JdJztcbiAgICB9O1xuXG5cbiAgc3JjX0l0ZXJhdG9yX19JdGVyYXRvci5LRVlTID0gSVRFUkFURV9LRVlTO1xuICBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yLlZBTFVFUyA9IElURVJBVEVfVkFMVUVTO1xuICBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yLkVOVFJJRVMgPSBJVEVSQVRFX0VOVFJJRVM7XG5cbiAgc3JjX0l0ZXJhdG9yX19JdGVyYXRvci5wcm90b3R5cGUuaW5zcGVjdCA9XG4gIHNyY19JdGVyYXRvcl9fSXRlcmF0b3IucHJvdG90eXBlLnRvU291cmNlID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gdGhpcy50b1N0cmluZygpOyB9XG4gIHNyY19JdGVyYXRvcl9fSXRlcmF0b3IucHJvdG90eXBlW0lURVJBVE9SX1NZTUJPTF0gPSBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH07XG5cblxuICBmdW5jdGlvbiBpdGVyYXRvclZhbHVlKHR5cGUsIGssIHYsIGl0ZXJhdG9yUmVzdWx0KSB7XG4gICAgdmFyIHZhbHVlID0gdHlwZSA9PT0gMCA/IGsgOiB0eXBlID09PSAxID8gdiA6IFtrLCB2XTtcbiAgICBpdGVyYXRvclJlc3VsdCA/IChpdGVyYXRvclJlc3VsdC52YWx1ZSA9IHZhbHVlKSA6IChpdGVyYXRvclJlc3VsdCA9IHtcbiAgICAgIHZhbHVlOiB2YWx1ZSwgZG9uZTogZmFsc2VcbiAgICB9KTtcbiAgICByZXR1cm4gaXRlcmF0b3JSZXN1bHQ7XG4gIH1cblxuICBmdW5jdGlvbiBpdGVyYXRvckRvbmUoKSB7XG4gICAgcmV0dXJuIHsgdmFsdWU6IHVuZGVmaW5lZCwgZG9uZTogdHJ1ZSB9O1xuICB9XG5cbiAgZnVuY3Rpb24gaGFzSXRlcmF0b3IobWF5YmVJdGVyYWJsZSkge1xuICAgIHJldHVybiAhIWdldEl0ZXJhdG9yRm4obWF5YmVJdGVyYWJsZSk7XG4gIH1cblxuICBmdW5jdGlvbiBpc0l0ZXJhdG9yKG1heWJlSXRlcmF0b3IpIHtcbiAgICByZXR1cm4gbWF5YmVJdGVyYXRvciAmJiB0eXBlb2YgbWF5YmVJdGVyYXRvci5uZXh0ID09PSAnZnVuY3Rpb24nO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0SXRlcmF0b3IoaXRlcmFibGUpIHtcbiAgICB2YXIgaXRlcmF0b3JGbiA9IGdldEl0ZXJhdG9yRm4oaXRlcmFibGUpO1xuICAgIHJldHVybiBpdGVyYXRvckZuICYmIGl0ZXJhdG9yRm4uY2FsbChpdGVyYWJsZSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRJdGVyYXRvckZuKGl0ZXJhYmxlKSB7XG4gICAgdmFyIGl0ZXJhdG9yRm4gPSBpdGVyYWJsZSAmJiAoXG4gICAgICAoUkVBTF9JVEVSQVRPUl9TWU1CT0wgJiYgaXRlcmFibGVbUkVBTF9JVEVSQVRPUl9TWU1CT0xdKSB8fFxuICAgICAgaXRlcmFibGVbRkFVWF9JVEVSQVRPUl9TWU1CT0xdXG4gICAgKTtcbiAgICBpZiAodHlwZW9mIGl0ZXJhdG9yRm4gPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIHJldHVybiBpdGVyYXRvckZuO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGlzQXJyYXlMaWtlKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlICYmIHR5cGVvZiB2YWx1ZS5sZW5ndGggPT09ICdudW1iZXInO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoU2VxLCBJdGVyYWJsZSk7XG4gICAgZnVuY3Rpb24gU2VxKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/IGVtcHR5U2VxdWVuY2UoKSA6XG4gICAgICAgIGlzSXRlcmFibGUodmFsdWUpID8gdmFsdWUudG9TZXEoKSA6IHNlcUZyb21WYWx1ZSh2YWx1ZSk7XG4gICAgfVxuXG4gICAgU2VxLm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIFNlcShhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBTZXEucHJvdG90eXBlLnRvU2VxID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgU2VxLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX190b1N0cmluZygnU2VxIHsnLCAnfScpO1xuICAgIH07XG5cbiAgICBTZXEucHJvdG90eXBlLmNhY2hlUmVzdWx0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoIXRoaXMuX2NhY2hlICYmIHRoaXMuX19pdGVyYXRlVW5jYWNoZWQpIHtcbiAgICAgICAgdGhpcy5fY2FjaGUgPSB0aGlzLmVudHJ5U2VxKCkudG9BcnJheSgpO1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLl9jYWNoZS5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgLy8gYWJzdHJhY3QgX19pdGVyYXRlVW5jYWNoZWQoZm4sIHJldmVyc2UpXG5cbiAgICBTZXEucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7XG4gICAgICByZXR1cm4gc2VxSXRlcmF0ZSh0aGlzLCBmbiwgcmV2ZXJzZSwgdHJ1ZSk7XG4gICAgfTtcblxuICAgIC8vIGFic3RyYWN0IF9faXRlcmF0b3JVbmNhY2hlZCh0eXBlLCByZXZlcnNlKVxuXG4gICAgU2VxLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgcmV0dXJuIHNlcUl0ZXJhdG9yKHRoaXMsIHR5cGUsIHJldmVyc2UsIHRydWUpO1xuICAgIH07XG5cblxuXG4gIGNyZWF0ZUNsYXNzKEtleWVkU2VxLCBTZXEpO1xuICAgIGZ1bmN0aW9uIEtleWVkU2VxKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/XG4gICAgICAgIGVtcHR5U2VxdWVuY2UoKS50b0tleWVkU2VxKCkgOlxuICAgICAgICBpc0l0ZXJhYmxlKHZhbHVlKSA/XG4gICAgICAgICAgKGlzS2V5ZWQodmFsdWUpID8gdmFsdWUudG9TZXEoKSA6IHZhbHVlLmZyb21FbnRyeVNlcSgpKSA6XG4gICAgICAgICAga2V5ZWRTZXFGcm9tVmFsdWUodmFsdWUpO1xuICAgIH1cblxuICAgIEtleWVkU2VxLnByb3RvdHlwZS50b0tleWVkU2VxID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5cblxuICBjcmVhdGVDbGFzcyhJbmRleGVkU2VxLCBTZXEpO1xuICAgIGZ1bmN0aW9uIEluZGV4ZWRTZXEodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gZW1wdHlTZXF1ZW5jZSgpIDpcbiAgICAgICAgIWlzSXRlcmFibGUodmFsdWUpID8gaW5kZXhlZFNlcUZyb21WYWx1ZSh2YWx1ZSkgOlxuICAgICAgICBpc0tleWVkKHZhbHVlKSA/IHZhbHVlLmVudHJ5U2VxKCkgOiB2YWx1ZS50b0luZGV4ZWRTZXEoKTtcbiAgICB9XG5cbiAgICBJbmRleGVkU2VxLm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIEluZGV4ZWRTZXEoYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgSW5kZXhlZFNlcS5wcm90b3R5cGUudG9JbmRleGVkU2VxID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG4gICAgSW5kZXhlZFNlcS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ1NlcSBbJywgJ10nKTtcbiAgICB9O1xuXG4gICAgSW5kZXhlZFNlcS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHJldHVybiBzZXFJdGVyYXRlKHRoaXMsIGZuLCByZXZlcnNlLCBmYWxzZSk7XG4gICAgfTtcblxuICAgIEluZGV4ZWRTZXEucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICByZXR1cm4gc2VxSXRlcmF0b3IodGhpcywgdHlwZSwgcmV2ZXJzZSwgZmFsc2UpO1xuICAgIH07XG5cblxuXG4gIGNyZWF0ZUNsYXNzKFNldFNlcSwgU2VxKTtcbiAgICBmdW5jdGlvbiBTZXRTZXEodmFsdWUpIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgPyBlbXB0eVNlcXVlbmNlKCkgOlxuICAgICAgICAhaXNJdGVyYWJsZSh2YWx1ZSkgPyBpbmRleGVkU2VxRnJvbVZhbHVlKHZhbHVlKSA6XG4gICAgICAgIGlzS2V5ZWQodmFsdWUpID8gdmFsdWUuZW50cnlTZXEoKSA6IHZhbHVlXG4gICAgICApLnRvU2V0U2VxKCk7XG4gICAgfVxuXG4gICAgU2V0U2VxLm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIFNldFNlcShhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBTZXRTZXEucHJvdG90eXBlLnRvU2V0U2VxID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9O1xuXG5cblxuICBTZXEuaXNTZXEgPSBpc1NlcTtcbiAgU2VxLktleWVkID0gS2V5ZWRTZXE7XG4gIFNlcS5TZXQgPSBTZXRTZXE7XG4gIFNlcS5JbmRleGVkID0gSW5kZXhlZFNlcTtcblxuICB2YXIgSVNfU0VRX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfU0VRX19AQCc7XG5cbiAgU2VxLnByb3RvdHlwZVtJU19TRVFfU0VOVElORUxdID0gdHJ1ZTtcblxuXG5cbiAgLy8gI3ByYWdtYSBSb290IFNlcXVlbmNlc1xuXG4gIGNyZWF0ZUNsYXNzKEFycmF5U2VxLCBJbmRleGVkU2VxKTtcbiAgICBmdW5jdGlvbiBBcnJheVNlcShhcnJheSkge1xuICAgICAgdGhpcy5fYXJyYXkgPSBhcnJheTtcbiAgICAgIHRoaXMuc2l6ZSA9IGFycmF5Lmxlbmd0aDtcbiAgICB9XG5cbiAgICBBcnJheVNlcS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oaW5kZXgsIG5vdFNldFZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5oYXMoaW5kZXgpID8gdGhpcy5fYXJyYXlbd3JhcEluZGV4KHRoaXMsIGluZGV4KV0gOiBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgQXJyYXlTZXEucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7XG4gICAgICB2YXIgYXJyYXkgPSB0aGlzLl9hcnJheTtcbiAgICAgIHZhciBtYXhJbmRleCA9IGFycmF5Lmxlbmd0aCAtIDE7XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDw9IG1heEluZGV4OyBpaSsrKSB7XG4gICAgICAgIGlmIChmbihhcnJheVtyZXZlcnNlID8gbWF4SW5kZXggLSBpaSA6IGlpXSwgaWksIHRoaXMpID09PSBmYWxzZSkge1xuICAgICAgICAgIHJldHVybiBpaSArIDE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpaTtcbiAgICB9O1xuXG4gICAgQXJyYXlTZXEucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgYXJyYXkgPSB0aGlzLl9hcnJheTtcbiAgICAgIHZhciBtYXhJbmRleCA9IGFycmF5Lmxlbmd0aCAtIDE7XG4gICAgICB2YXIgaWkgPSAwO1xuICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgXG4gICAgICAgIHtyZXR1cm4gaWkgPiBtYXhJbmRleCA/XG4gICAgICAgICAgaXRlcmF0b3JEb25lKCkgOlxuICAgICAgICAgIGl0ZXJhdG9yVmFsdWUodHlwZSwgaWksIGFycmF5W3JldmVyc2UgPyBtYXhJbmRleCAtIGlpKysgOiBpaSsrXSl9XG4gICAgICApO1xuICAgIH07XG5cblxuXG4gIGNyZWF0ZUNsYXNzKE9iamVjdFNlcSwgS2V5ZWRTZXEpO1xuICAgIGZ1bmN0aW9uIE9iamVjdFNlcShvYmplY3QpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMob2JqZWN0KTtcbiAgICAgIHRoaXMuX29iamVjdCA9IG9iamVjdDtcbiAgICAgIHRoaXMuX2tleXMgPSBrZXlzO1xuICAgICAgdGhpcy5zaXplID0ga2V5cy5sZW5ndGg7XG4gICAgfVxuXG4gICAgT2JqZWN0U2VxLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXksIG5vdFNldFZhbHVlKSB7XG4gICAgICBpZiAobm90U2V0VmFsdWUgIT09IHVuZGVmaW5lZCAmJiAhdGhpcy5oYXMoa2V5KSkge1xuICAgICAgICByZXR1cm4gbm90U2V0VmFsdWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fb2JqZWN0W2tleV07XG4gICAgfTtcblxuICAgIE9iamVjdFNlcS5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gdGhpcy5fb2JqZWN0Lmhhc093blByb3BlcnR5KGtleSk7XG4gICAgfTtcblxuICAgIE9iamVjdFNlcS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHZhciBvYmplY3QgPSB0aGlzLl9vYmplY3Q7XG4gICAgICB2YXIga2V5cyA9IHRoaXMuX2tleXM7XG4gICAgICB2YXIgbWF4SW5kZXggPSBrZXlzLmxlbmd0aCAtIDE7XG4gICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDw9IG1heEluZGV4OyBpaSsrKSB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldO1xuICAgICAgICBpZiAoZm4ob2JqZWN0W2tleV0sIGtleSwgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGlpICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGlpO1xuICAgIH07XG5cbiAgICBPYmplY3RTZXEucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgb2JqZWN0ID0gdGhpcy5fb2JqZWN0O1xuICAgICAgdmFyIGtleXMgPSB0aGlzLl9rZXlzO1xuICAgICAgdmFyIG1heEluZGV4ID0ga2V5cy5sZW5ndGggLSAxO1xuICAgICAgdmFyIGlpID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciBrZXkgPSBrZXlzW3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldO1xuICAgICAgICByZXR1cm4gaWkrKyA+IG1heEluZGV4ID9cbiAgICAgICAgICBpdGVyYXRvckRvbmUoKSA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBrZXksIG9iamVjdFtrZXldKTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgT2JqZWN0U2VxLnByb3RvdHlwZVtJU19PUkRFUkVEX1NFTlRJTkVMXSA9IHRydWU7XG5cblxuICBjcmVhdGVDbGFzcyhJdGVyYWJsZVNlcSwgSW5kZXhlZFNlcSk7XG4gICAgZnVuY3Rpb24gSXRlcmFibGVTZXEoaXRlcmFibGUpIHtcbiAgICAgIHRoaXMuX2l0ZXJhYmxlID0gaXRlcmFibGU7XG4gICAgICB0aGlzLnNpemUgPSBpdGVyYWJsZS5sZW5ndGggfHwgaXRlcmFibGUuc2l6ZTtcbiAgICB9XG5cbiAgICBJdGVyYWJsZVNlcS5wcm90b3R5cGUuX19pdGVyYXRlVW5jYWNoZWQgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVSZXN1bHQoKS5fX2l0ZXJhdGUoZm4sIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXJhYmxlID0gdGhpcy5faXRlcmFibGU7XG4gICAgICB2YXIgaXRlcmF0b3IgPSBnZXRJdGVyYXRvcihpdGVyYWJsZSk7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICBpZiAoaXNJdGVyYXRvcihpdGVyYXRvcikpIHtcbiAgICAgICAgdmFyIHN0ZXA7XG4gICAgICAgIHdoaWxlICghKHN0ZXAgPSBpdGVyYXRvci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgICBpZiAoZm4oc3RlcC52YWx1ZSwgaXRlcmF0aW9ucysrLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcblxuICAgIEl0ZXJhYmxlU2VxLnByb3RvdHlwZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlcmFibGUgPSB0aGlzLl9pdGVyYWJsZTtcbiAgICAgIHZhciBpdGVyYXRvciA9IGdldEl0ZXJhdG9yKGl0ZXJhYmxlKTtcbiAgICAgIGlmICghaXNJdGVyYXRvcihpdGVyYXRvcikpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGl0ZXJhdG9yRG9uZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgcmV0dXJuIHN0ZXAuZG9uZSA/IHN0ZXAgOiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgc3RlcC52YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG5cblxuICBjcmVhdGVDbGFzcyhJdGVyYXRvclNlcSwgSW5kZXhlZFNlcSk7XG4gICAgZnVuY3Rpb24gSXRlcmF0b3JTZXEoaXRlcmF0b3IpIHtcbiAgICAgIHRoaXMuX2l0ZXJhdG9yID0gaXRlcmF0b3I7XG4gICAgICB0aGlzLl9pdGVyYXRvckNhY2hlID0gW107XG4gICAgfVxuXG4gICAgSXRlcmF0b3JTZXEucHJvdG90eXBlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlUmVzdWx0KCkuX19pdGVyYXRlKGZuLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX2l0ZXJhdG9yO1xuICAgICAgdmFyIGNhY2hlID0gdGhpcy5faXRlcmF0b3JDYWNoZTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHdoaWxlIChpdGVyYXRpb25zIDwgY2FjaGUubGVuZ3RoKSB7XG4gICAgICAgIGlmIChmbihjYWNoZVtpdGVyYXRpb25zXSwgaXRlcmF0aW9ucysrLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdmFyIHN0ZXA7XG4gICAgICB3aGlsZSAoIShzdGVwID0gaXRlcmF0b3IubmV4dCgpKS5kb25lKSB7XG4gICAgICAgIHZhciB2YWwgPSBzdGVwLnZhbHVlO1xuICAgICAgICBjYWNoZVtpdGVyYXRpb25zXSA9IHZhbDtcbiAgICAgICAgaWYgKGZuKHZhbCwgaXRlcmF0aW9ucysrLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcblxuICAgIEl0ZXJhdG9yU2VxLnByb3RvdHlwZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlcmF0b3IgPSB0aGlzLl9pdGVyYXRvcjtcbiAgICAgIHZhciBjYWNoZSA9IHRoaXMuX2l0ZXJhdG9yQ2FjaGU7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICBpZiAoaXRlcmF0aW9ucyA+PSBjYWNoZS5sZW5ndGgpIHtcbiAgICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RlcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgY2FjaGVbaXRlcmF0aW9uc10gPSBzdGVwLnZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMsIGNhY2hlW2l0ZXJhdGlvbnMrK10pO1xuICAgICAgfSk7XG4gICAgfTtcblxuXG5cblxuICAvLyAjIHByYWdtYSBIZWxwZXIgZnVuY3Rpb25zXG5cbiAgZnVuY3Rpb24gaXNTZXEobWF5YmVTZXEpIHtcbiAgICByZXR1cm4gISEobWF5YmVTZXEgJiYgbWF5YmVTZXFbSVNfU0VRX1NFTlRJTkVMXSk7XG4gIH1cblxuICB2YXIgRU1QVFlfU0VRO1xuXG4gIGZ1bmN0aW9uIGVtcHR5U2VxdWVuY2UoKSB7XG4gICAgcmV0dXJuIEVNUFRZX1NFUSB8fCAoRU1QVFlfU0VRID0gbmV3IEFycmF5U2VxKFtdKSk7XG4gIH1cblxuICBmdW5jdGlvbiBrZXllZFNlcUZyb21WYWx1ZSh2YWx1ZSkge1xuICAgIHZhciBzZXEgPVxuICAgICAgQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyBuZXcgQXJyYXlTZXEodmFsdWUpLmZyb21FbnRyeVNlcSgpIDpcbiAgICAgIGlzSXRlcmF0b3IodmFsdWUpID8gbmV3IEl0ZXJhdG9yU2VxKHZhbHVlKS5mcm9tRW50cnlTZXEoKSA6XG4gICAgICBoYXNJdGVyYXRvcih2YWx1ZSkgPyBuZXcgSXRlcmFibGVTZXEodmFsdWUpLmZyb21FbnRyeVNlcSgpIDpcbiAgICAgIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgPyBuZXcgT2JqZWN0U2VxKHZhbHVlKSA6XG4gICAgICB1bmRlZmluZWQ7XG4gICAgaWYgKCFzZXEpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICdFeHBlY3RlZCBBcnJheSBvciBpdGVyYWJsZSBvYmplY3Qgb2YgW2ssIHZdIGVudHJpZXMsICcrXG4gICAgICAgICdvciBrZXllZCBvYmplY3Q6ICcgKyB2YWx1ZVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGluZGV4ZWRTZXFGcm9tVmFsdWUodmFsdWUpIHtcbiAgICB2YXIgc2VxID0gbWF5YmVJbmRleGVkU2VxRnJvbVZhbHVlKHZhbHVlKTtcbiAgICBpZiAoIXNlcSkge1xuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgICAgJ0V4cGVjdGVkIEFycmF5IG9yIGl0ZXJhYmxlIG9iamVjdCBvZiB2YWx1ZXM6ICcgKyB2YWx1ZVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcUZyb21WYWx1ZSh2YWx1ZSkge1xuICAgIHZhciBzZXEgPSBtYXliZUluZGV4ZWRTZXFGcm9tVmFsdWUodmFsdWUpIHx8XG4gICAgICAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiBuZXcgT2JqZWN0U2VxKHZhbHVlKSk7XG4gICAgaWYgKCFzZXEpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICdFeHBlY3RlZCBBcnJheSBvciBpdGVyYWJsZSBvYmplY3Qgb2YgdmFsdWVzLCBvciBrZXllZCBvYmplY3Q6ICcgKyB2YWx1ZVxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIHNlcTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1heWJlSW5kZXhlZFNlcUZyb21WYWx1ZSh2YWx1ZSkge1xuICAgIHJldHVybiAoXG4gICAgICBpc0FycmF5TGlrZSh2YWx1ZSkgPyBuZXcgQXJyYXlTZXEodmFsdWUpIDpcbiAgICAgIGlzSXRlcmF0b3IodmFsdWUpID8gbmV3IEl0ZXJhdG9yU2VxKHZhbHVlKSA6XG4gICAgICBoYXNJdGVyYXRvcih2YWx1ZSkgPyBuZXcgSXRlcmFibGVTZXEodmFsdWUpIDpcbiAgICAgIHVuZGVmaW5lZFxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiBzZXFJdGVyYXRlKHNlcSwgZm4sIHJldmVyc2UsIHVzZUtleXMpIHtcbiAgICB2YXIgY2FjaGUgPSBzZXEuX2NhY2hlO1xuICAgIGlmIChjYWNoZSkge1xuICAgICAgdmFyIG1heEluZGV4ID0gY2FjaGUubGVuZ3RoIC0gMTtcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPD0gbWF4SW5kZXg7IGlpKyspIHtcbiAgICAgICAgdmFyIGVudHJ5ID0gY2FjaGVbcmV2ZXJzZSA/IG1heEluZGV4IC0gaWkgOiBpaV07XG4gICAgICAgIGlmIChmbihlbnRyeVsxXSwgdXNlS2V5cyA/IGVudHJ5WzBdIDogaWksIHNlcSkgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGlpICsgMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGlpO1xuICAgIH1cbiAgICByZXR1cm4gc2VxLl9faXRlcmF0ZVVuY2FjaGVkKGZuLCByZXZlcnNlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcUl0ZXJhdG9yKHNlcSwgdHlwZSwgcmV2ZXJzZSwgdXNlS2V5cykge1xuICAgIHZhciBjYWNoZSA9IHNlcS5fY2FjaGU7XG4gICAgaWYgKGNhY2hlKSB7XG4gICAgICB2YXIgbWF4SW5kZXggPSBjYWNoZS5sZW5ndGggLSAxO1xuICAgICAgdmFyIGlpID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciBlbnRyeSA9IGNhY2hlW3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldO1xuICAgICAgICByZXR1cm4gaWkrKyA+IG1heEluZGV4ID9cbiAgICAgICAgICBpdGVyYXRvckRvbmUoKSA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCB1c2VLZXlzID8gZW50cnlbMF0gOiBpaSAtIDEsIGVudHJ5WzFdKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gc2VxLl9faXRlcmF0b3JVbmNhY2hlZCh0eXBlLCByZXZlcnNlKTtcbiAgfVxuXG4gIGNyZWF0ZUNsYXNzKENvbGxlY3Rpb24sIEl0ZXJhYmxlKTtcbiAgICBmdW5jdGlvbiBDb2xsZWN0aW9uKCkge1xuICAgICAgdGhyb3cgVHlwZUVycm9yKCdBYnN0cmFjdCcpO1xuICAgIH1cblxuXG4gIGNyZWF0ZUNsYXNzKEtleWVkQ29sbGVjdGlvbiwgQ29sbGVjdGlvbik7ZnVuY3Rpb24gS2V5ZWRDb2xsZWN0aW9uKCkge31cblxuICBjcmVhdGVDbGFzcyhJbmRleGVkQ29sbGVjdGlvbiwgQ29sbGVjdGlvbik7ZnVuY3Rpb24gSW5kZXhlZENvbGxlY3Rpb24oKSB7fVxuXG4gIGNyZWF0ZUNsYXNzKFNldENvbGxlY3Rpb24sIENvbGxlY3Rpb24pO2Z1bmN0aW9uIFNldENvbGxlY3Rpb24oKSB7fVxuXG5cbiAgQ29sbGVjdGlvbi5LZXllZCA9IEtleWVkQ29sbGVjdGlvbjtcbiAgQ29sbGVjdGlvbi5JbmRleGVkID0gSW5kZXhlZENvbGxlY3Rpb247XG4gIENvbGxlY3Rpb24uU2V0ID0gU2V0Q29sbGVjdGlvbjtcblxuICAvKipcbiAgICogQW4gZXh0ZW5zaW9uIG9mIHRoZSBcInNhbWUtdmFsdWVcIiBhbGdvcml0aG0gYXMgW2Rlc2NyaWJlZCBmb3IgdXNlIGJ5IEVTNiBNYXBcbiAgICogYW5kIFNldF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvSmF2YVNjcmlwdC9SZWZlcmVuY2UvR2xvYmFsX09iamVjdHMvTWFwI0tleV9lcXVhbGl0eSlcbiAgICpcbiAgICogTmFOIGlzIGNvbnNpZGVyZWQgdGhlIHNhbWUgYXMgTmFOLCBob3dldmVyIC0wIGFuZCAwIGFyZSBjb25zaWRlcmVkIHRoZSBzYW1lXG4gICAqIHZhbHVlLCB3aGljaCBpcyBkaWZmZXJlbnQgZnJvbSB0aGUgYWxnb3JpdGhtIGRlc2NyaWJlZCBieVxuICAgKiBbYE9iamVjdC5pc2BdKGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvV2ViL0phdmFTY3JpcHQvUmVmZXJlbmNlL0dsb2JhbF9PYmplY3RzL09iamVjdC9pcykuXG4gICAqXG4gICAqIFRoaXMgaXMgZXh0ZW5kZWQgZnVydGhlciB0byBhbGxvdyBPYmplY3RzIHRvIGRlc2NyaWJlIHRoZSB2YWx1ZXMgdGhleVxuICAgKiByZXByZXNlbnQsIGJ5IHdheSBvZiBgdmFsdWVPZmAgb3IgYGVxdWFsc2AgKGFuZCBgaGFzaENvZGVgKS5cbiAgICpcbiAgICogTm90ZTogYmVjYXVzZSBvZiB0aGlzIGV4dGVuc2lvbiwgdGhlIGtleSBlcXVhbGl0eSBvZiBJbW11dGFibGUuTWFwIGFuZCB0aGVcbiAgICogdmFsdWUgZXF1YWxpdHkgb2YgSW1tdXRhYmxlLlNldCB3aWxsIGRpZmZlciBmcm9tIEVTNiBNYXAgYW5kIFNldC5cbiAgICpcbiAgICogIyMjIERlZmluaW5nIGN1c3RvbSB2YWx1ZXNcbiAgICpcbiAgICogVGhlIGVhc2llc3Qgd2F5IHRvIGRlc2NyaWJlIHRoZSB2YWx1ZSBhbiBvYmplY3QgcmVwcmVzZW50cyBpcyBieSBpbXBsZW1lbnRpbmdcbiAgICogYHZhbHVlT2ZgLiBGb3IgZXhhbXBsZSwgYERhdGVgIHJlcHJlc2VudHMgYSB2YWx1ZSBieSByZXR1cm5pbmcgYSB1bml4XG4gICAqIHRpbWVzdGFtcCBmb3IgYHZhbHVlT2ZgOlxuICAgKlxuICAgKiAgICAgdmFyIGRhdGUxID0gbmV3IERhdGUoMTIzNDU2Nzg5MDAwMCk7IC8vIEZyaSBGZWIgMTMgMjAwOSAuLi5cbiAgICogICAgIHZhciBkYXRlMiA9IG5ldyBEYXRlKDEyMzQ1Njc4OTAwMDApO1xuICAgKiAgICAgZGF0ZTEudmFsdWVPZigpOyAvLyAxMjM0NTY3ODkwMDAwXG4gICAqICAgICBhc3NlcnQoIGRhdGUxICE9PSBkYXRlMiApO1xuICAgKiAgICAgYXNzZXJ0KCBJbW11dGFibGUuaXMoIGRhdGUxLCBkYXRlMiApICk7XG4gICAqXG4gICAqIE5vdGU6IG92ZXJyaWRpbmcgYHZhbHVlT2ZgIG1heSBoYXZlIG90aGVyIGltcGxpY2F0aW9ucyBpZiB5b3UgdXNlIHRoaXMgb2JqZWN0XG4gICAqIHdoZXJlIEphdmFTY3JpcHQgZXhwZWN0cyBhIHByaW1pdGl2ZSwgc3VjaCBhcyBpbXBsaWNpdCBzdHJpbmcgY29lcmNpb24uXG4gICAqXG4gICAqIEZvciBtb3JlIGNvbXBsZXggdHlwZXMsIGVzcGVjaWFsbHkgY29sbGVjdGlvbnMsIGltcGxlbWVudGluZyBgdmFsdWVPZmAgbWF5XG4gICAqIG5vdCBiZSBwZXJmb3JtYW50LiBBbiBhbHRlcm5hdGl2ZSBpcyB0byBpbXBsZW1lbnQgYGVxdWFsc2AgYW5kIGBoYXNoQ29kZWAuXG4gICAqXG4gICAqIGBlcXVhbHNgIHRha2VzIGFub3RoZXIgb2JqZWN0LCBwcmVzdW1hYmx5IG9mIHNpbWlsYXIgdHlwZSwgYW5kIHJldHVybnMgdHJ1ZVxuICAgKiBpZiB0aGUgaXQgaXMgZXF1YWwuIEVxdWFsaXR5IGlzIHN5bW1ldHJpY2FsLCBzbyB0aGUgc2FtZSByZXN1bHQgc2hvdWxkIGJlXG4gICAqIHJldHVybmVkIGlmIHRoaXMgYW5kIHRoZSBhcmd1bWVudCBhcmUgZmxpcHBlZC5cbiAgICpcbiAgICogICAgIGFzc2VydCggYS5lcXVhbHMoYikgPT09IGIuZXF1YWxzKGEpICk7XG4gICAqXG4gICAqIGBoYXNoQ29kZWAgcmV0dXJucyBhIDMyYml0IGludGVnZXIgbnVtYmVyIHJlcHJlc2VudGluZyB0aGUgb2JqZWN0IHdoaWNoIHdpbGxcbiAgICogYmUgdXNlZCB0byBkZXRlcm1pbmUgaG93IHRvIHN0b3JlIHRoZSB2YWx1ZSBvYmplY3QgaW4gYSBNYXAgb3IgU2V0LiBZb3UgbXVzdFxuICAgKiBwcm92aWRlIGJvdGggb3IgbmVpdGhlciBtZXRob2RzLCBvbmUgbXVzdCBub3QgZXhpc3Qgd2l0aG91dCB0aGUgb3RoZXIuXG4gICAqXG4gICAqIEFsc28sIGFuIGltcG9ydGFudCByZWxhdGlvbnNoaXAgYmV0d2VlbiB0aGVzZSBtZXRob2RzIG11c3QgYmUgdXBoZWxkOiBpZiB0d29cbiAgICogdmFsdWVzIGFyZSBlcXVhbCwgdGhleSAqbXVzdCogcmV0dXJuIHRoZSBzYW1lIGhhc2hDb2RlLiBJZiB0aGUgdmFsdWVzIGFyZSBub3RcbiAgICogZXF1YWwsIHRoZXkgbWlnaHQgaGF2ZSB0aGUgc2FtZSBoYXNoQ29kZTsgdGhpcyBpcyBjYWxsZWQgYSBoYXNoIGNvbGxpc2lvbixcbiAgICogYW5kIHdoaWxlIHVuZGVzaXJhYmxlIGZvciBwZXJmb3JtYW5jZSByZWFzb25zLCBpdCBpcyBhY2NlcHRhYmxlLlxuICAgKlxuICAgKiAgICAgaWYgKGEuZXF1YWxzKGIpKSB7XG4gICAqICAgICAgIGFzc2VydCggYS5oYXNoQ29kZSgpID09PSBiLmhhc2hDb2RlKCkgKTtcbiAgICogICAgIH1cbiAgICpcbiAgICogQWxsIEltbXV0YWJsZSBjb2xsZWN0aW9ucyBpbXBsZW1lbnQgYGVxdWFsc2AgYW5kIGBoYXNoQ29kZWAuXG4gICAqXG4gICAqL1xuICBmdW5jdGlvbiBpcyh2YWx1ZUEsIHZhbHVlQikge1xuICAgIGlmICh2YWx1ZUEgPT09IHZhbHVlQiB8fCAodmFsdWVBICE9PSB2YWx1ZUEgJiYgdmFsdWVCICE9PSB2YWx1ZUIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKCF2YWx1ZUEgfHwgIXZhbHVlQikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlQS52YWx1ZU9mID09PSAnZnVuY3Rpb24nICYmXG4gICAgICAgIHR5cGVvZiB2YWx1ZUIudmFsdWVPZiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFsdWVBID0gdmFsdWVBLnZhbHVlT2YoKTtcbiAgICAgIHZhbHVlQiA9IHZhbHVlQi52YWx1ZU9mKCk7XG4gICAgICBpZiAodmFsdWVBID09PSB2YWx1ZUIgfHwgKHZhbHVlQSAhPT0gdmFsdWVBICYmIHZhbHVlQiAhPT0gdmFsdWVCKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmICghdmFsdWVBIHx8ICF2YWx1ZUIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodHlwZW9mIHZhbHVlQS5lcXVhbHMgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgdHlwZW9mIHZhbHVlQi5lcXVhbHMgPT09ICdmdW5jdGlvbicgJiZcbiAgICAgICAgdmFsdWVBLmVxdWFscyh2YWx1ZUIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gZnJvbUpTKGpzb24sIGNvbnZlcnRlcikge1xuICAgIHJldHVybiBjb252ZXJ0ZXIgP1xuICAgICAgZnJvbUpTV2l0aChjb252ZXJ0ZXIsIGpzb24sICcnLCB7Jyc6IGpzb259KSA6XG4gICAgICBmcm9tSlNEZWZhdWx0KGpzb24pO1xuICB9XG5cbiAgZnVuY3Rpb24gZnJvbUpTV2l0aChjb252ZXJ0ZXIsIGpzb24sIGtleSwgcGFyZW50SlNPTikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGpzb24pKSB7XG4gICAgICByZXR1cm4gY29udmVydGVyLmNhbGwocGFyZW50SlNPTiwga2V5LCBJbmRleGVkU2VxKGpzb24pLm1hcChmdW5jdGlvbih2LCBrKSAge3JldHVybiBmcm9tSlNXaXRoKGNvbnZlcnRlciwgdiwgaywganNvbil9KSk7XG4gICAgfVxuICAgIGlmIChpc1BsYWluT2JqKGpzb24pKSB7XG4gICAgICByZXR1cm4gY29udmVydGVyLmNhbGwocGFyZW50SlNPTiwga2V5LCBLZXllZFNlcShqc29uKS5tYXAoZnVuY3Rpb24odiwgaykgIHtyZXR1cm4gZnJvbUpTV2l0aChjb252ZXJ0ZXIsIHYsIGssIGpzb24pfSkpO1xuICAgIH1cbiAgICByZXR1cm4ganNvbjtcbiAgfVxuXG4gIGZ1bmN0aW9uIGZyb21KU0RlZmF1bHQoanNvbikge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGpzb24pKSB7XG4gICAgICByZXR1cm4gSW5kZXhlZFNlcShqc29uKS5tYXAoZnJvbUpTRGVmYXVsdCkudG9MaXN0KCk7XG4gICAgfVxuICAgIGlmIChpc1BsYWluT2JqKGpzb24pKSB7XG4gICAgICByZXR1cm4gS2V5ZWRTZXEoanNvbikubWFwKGZyb21KU0RlZmF1bHQpLnRvTWFwKCk7XG4gICAgfVxuICAgIHJldHVybiBqc29uO1xuICB9XG5cbiAgZnVuY3Rpb24gaXNQbGFpbk9iaih2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZSAmJiAodmFsdWUuY29uc3RydWN0b3IgPT09IE9iamVjdCB8fCB2YWx1ZS5jb25zdHJ1Y3RvciA9PT0gdW5kZWZpbmVkKTtcbiAgfVxuXG4gIHZhciBzcmNfTWF0aF9faW11bCA9XG4gICAgdHlwZW9mIE1hdGguaW11bCA9PT0gJ2Z1bmN0aW9uJyAmJiBNYXRoLmltdWwoMHhmZmZmZmZmZiwgMikgPT09IC0yID9cbiAgICBNYXRoLmltdWwgOlxuICAgIGZ1bmN0aW9uIGltdWwoYSwgYikge1xuICAgICAgYSA9IGEgfCAwOyAvLyBpbnRcbiAgICAgIGIgPSBiIHwgMDsgLy8gaW50XG4gICAgICB2YXIgYyA9IGEgJiAweGZmZmY7XG4gICAgICB2YXIgZCA9IGIgJiAweGZmZmY7XG4gICAgICAvLyBTaGlmdCBieSAwIGZpeGVzIHRoZSBzaWduIG9uIHRoZSBoaWdoIHBhcnQuXG4gICAgICByZXR1cm4gKGMgKiBkKSArICgoKChhID4+PiAxNikgKiBkICsgYyAqIChiID4+PiAxNikpIDw8IDE2KSA+Pj4gMCkgfCAwOyAvLyBpbnRcbiAgICB9O1xuXG4gIC8vIHY4IGhhcyBhbiBvcHRpbWl6YXRpb24gZm9yIHN0b3JpbmcgMzEtYml0IHNpZ25lZCBudW1iZXJzLlxuICAvLyBWYWx1ZXMgd2hpY2ggaGF2ZSBlaXRoZXIgMDAgb3IgMTEgYXMgdGhlIGhpZ2ggb3JkZXIgYml0cyBxdWFsaWZ5LlxuICAvLyBUaGlzIGZ1bmN0aW9uIGRyb3BzIHRoZSBoaWdoZXN0IG9yZGVyIGJpdCBpbiBhIHNpZ25lZCBudW1iZXIsIG1haW50YWluaW5nXG4gIC8vIHRoZSBzaWduIGJpdC5cbiAgZnVuY3Rpb24gc21pKGkzMikge1xuICAgIHJldHVybiAoKGkzMiA+Pj4gMSkgJiAweDQwMDAwMDAwKSB8IChpMzIgJiAweEJGRkZGRkZGKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGhhc2gobykge1xuICAgIGlmIChvID09PSBmYWxzZSB8fCBvID09PSBudWxsIHx8IG8gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIDA7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygby52YWx1ZU9mID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBvID0gby52YWx1ZU9mKCk7XG4gICAgICBpZiAobyA9PT0gZmFsc2UgfHwgbyA9PT0gbnVsbCB8fCBvID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvID09PSB0cnVlKSB7XG4gICAgICByZXR1cm4gMTtcbiAgICB9XG4gICAgdmFyIHR5cGUgPSB0eXBlb2YgbztcbiAgICBpZiAodHlwZSA9PT0gJ251bWJlcicpIHtcbiAgICAgIHZhciBoID0gbyB8IDA7XG4gICAgICBpZiAoaCAhPT0gbykge1xuICAgICAgICBoIF49IG8gKiAweEZGRkZGRkZGO1xuICAgICAgfVxuICAgICAgd2hpbGUgKG8gPiAweEZGRkZGRkZGKSB7XG4gICAgICAgIG8gLz0gMHhGRkZGRkZGRjtcbiAgICAgICAgaCBePSBvO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNtaShoKTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gby5sZW5ndGggPiBTVFJJTkdfSEFTSF9DQUNIRV9NSU5fU1RSTEVOID8gY2FjaGVkSGFzaFN0cmluZyhvKSA6IGhhc2hTdHJpbmcobyk7XG4gICAgfVxuICAgIGlmICh0eXBlb2Ygby5oYXNoQ29kZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgcmV0dXJuIG8uaGFzaENvZGUoKTtcbiAgICB9XG4gICAgcmV0dXJuIGhhc2hKU09iaihvKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNhY2hlZEhhc2hTdHJpbmcoc3RyaW5nKSB7XG4gICAgdmFyIGhhc2ggPSBzdHJpbmdIYXNoQ2FjaGVbc3RyaW5nXTtcbiAgICBpZiAoaGFzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBoYXNoID0gaGFzaFN0cmluZyhzdHJpbmcpO1xuICAgICAgaWYgKFNUUklOR19IQVNIX0NBQ0hFX1NJWkUgPT09IFNUUklOR19IQVNIX0NBQ0hFX01BWF9TSVpFKSB7XG4gICAgICAgIFNUUklOR19IQVNIX0NBQ0hFX1NJWkUgPSAwO1xuICAgICAgICBzdHJpbmdIYXNoQ2FjaGUgPSB7fTtcbiAgICAgIH1cbiAgICAgIFNUUklOR19IQVNIX0NBQ0hFX1NJWkUrKztcbiAgICAgIHN0cmluZ0hhc2hDYWNoZVtzdHJpbmddID0gaGFzaDtcbiAgICB9XG4gICAgcmV0dXJuIGhhc2g7XG4gIH1cblxuICAvLyBodHRwOi8vanNwZXJmLmNvbS9oYXNoaW5nLXN0cmluZ3NcbiAgZnVuY3Rpb24gaGFzaFN0cmluZyhzdHJpbmcpIHtcbiAgICAvLyBUaGlzIGlzIHRoZSBoYXNoIGZyb20gSlZNXG4gICAgLy8gVGhlIGhhc2ggY29kZSBmb3IgYSBzdHJpbmcgaXMgY29tcHV0ZWQgYXNcbiAgICAvLyBzWzBdICogMzEgXiAobiAtIDEpICsgc1sxXSAqIDMxIF4gKG4gLSAyKSArIC4uLiArIHNbbiAtIDFdLFxuICAgIC8vIHdoZXJlIHNbaV0gaXMgdGhlIGl0aCBjaGFyYWN0ZXIgb2YgdGhlIHN0cmluZyBhbmQgbiBpcyB0aGUgbGVuZ3RoIG9mXG4gICAgLy8gdGhlIHN0cmluZy4gV2UgXCJtb2RcIiB0aGUgcmVzdWx0IHRvIG1ha2UgaXQgYmV0d2VlbiAwIChpbmNsdXNpdmUpIGFuZCAyXjMxXG4gICAgLy8gKGV4Y2x1c2l2ZSkgYnkgZHJvcHBpbmcgaGlnaCBiaXRzLlxuICAgIHZhciBoYXNoID0gMDtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgc3RyaW5nLmxlbmd0aDsgaWkrKykge1xuICAgICAgaGFzaCA9IDMxICogaGFzaCArIHN0cmluZy5jaGFyQ29kZUF0KGlpKSB8IDA7XG4gICAgfVxuICAgIHJldHVybiBzbWkoaGFzaCk7XG4gIH1cblxuICBmdW5jdGlvbiBoYXNoSlNPYmoob2JqKSB7XG4gICAgdmFyIGhhc2g7XG4gICAgaWYgKHVzaW5nV2Vha01hcCkge1xuICAgICAgaGFzaCA9IHdlYWtNYXAuZ2V0KG9iaik7XG4gICAgICBpZiAoaGFzaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBoYXNoO1xuICAgICAgfVxuICAgIH1cblxuICAgIGhhc2ggPSBvYmpbVUlEX0hBU0hfS0VZXTtcbiAgICBpZiAoaGFzaCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICByZXR1cm4gaGFzaDtcbiAgICB9XG5cbiAgICBpZiAoIWNhbkRlZmluZVByb3BlcnR5KSB7XG4gICAgICBoYXNoID0gb2JqLnByb3BlcnR5SXNFbnVtZXJhYmxlICYmIG9iai5wcm9wZXJ0eUlzRW51bWVyYWJsZVtVSURfSEFTSF9LRVldO1xuICAgICAgaWYgKGhhc2ggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gaGFzaDtcbiAgICAgIH1cblxuICAgICAgaGFzaCA9IGdldElFTm9kZUhhc2gob2JqKTtcbiAgICAgIGlmIChoYXNoICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIGhhc2g7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaGFzaCA9ICsrb2JqSGFzaFVJRDtcbiAgICBpZiAob2JqSGFzaFVJRCAmIDB4NDAwMDAwMDApIHtcbiAgICAgIG9iakhhc2hVSUQgPSAwO1xuICAgIH1cblxuICAgIGlmICh1c2luZ1dlYWtNYXApIHtcbiAgICAgIHdlYWtNYXAuc2V0KG9iaiwgaGFzaCk7XG4gICAgfSBlbHNlIGlmIChpc0V4dGVuc2libGUgIT09IHVuZGVmaW5lZCAmJiBpc0V4dGVuc2libGUob2JqKSA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTm9uLWV4dGVuc2libGUgb2JqZWN0cyBhcmUgbm90IGFsbG93ZWQgYXMga2V5cy4nKTtcbiAgICB9IGVsc2UgaWYgKGNhbkRlZmluZVByb3BlcnR5KSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkob2JqLCBVSURfSEFTSF9LRVksIHtcbiAgICAgICAgJ2VudW1lcmFibGUnOiBmYWxzZSxcbiAgICAgICAgJ2NvbmZpZ3VyYWJsZSc6IGZhbHNlLFxuICAgICAgICAnd3JpdGFibGUnOiBmYWxzZSxcbiAgICAgICAgJ3ZhbHVlJzogaGFzaFxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmIChvYmoucHJvcGVydHlJc0VudW1lcmFibGUgIT09IHVuZGVmaW5lZCAmJlxuICAgICAgICAgICAgICAgb2JqLnByb3BlcnR5SXNFbnVtZXJhYmxlID09PSBvYmouY29uc3RydWN0b3IucHJvdG90eXBlLnByb3BlcnR5SXNFbnVtZXJhYmxlKSB7XG4gICAgICAvLyBTaW5jZSB3ZSBjYW4ndCBkZWZpbmUgYSBub24tZW51bWVyYWJsZSBwcm9wZXJ0eSBvbiB0aGUgb2JqZWN0XG4gICAgICAvLyB3ZSdsbCBoaWphY2sgb25lIG9mIHRoZSBsZXNzLXVzZWQgbm9uLWVudW1lcmFibGUgcHJvcGVydGllcyB0b1xuICAgICAgLy8gc2F2ZSBvdXIgaGFzaCBvbiBpdC4gU2luY2UgdGhpcyBpcyBhIGZ1bmN0aW9uIGl0IHdpbGwgbm90IHNob3cgdXAgaW5cbiAgICAgIC8vIGBKU09OLnN0cmluZ2lmeWAgd2hpY2ggaXMgd2hhdCB3ZSB3YW50LlxuICAgICAgb2JqLnByb3BlcnR5SXNFbnVtZXJhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvbnN0cnVjdG9yLnByb3RvdHlwZS5wcm9wZXJ0eUlzRW51bWVyYWJsZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgfTtcbiAgICAgIG9iai5wcm9wZXJ0eUlzRW51bWVyYWJsZVtVSURfSEFTSF9LRVldID0gaGFzaDtcbiAgICB9IGVsc2UgaWYgKG9iai5ub2RlVHlwZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBBdCB0aGlzIHBvaW50IHdlIGNvdWxkbid0IGdldCB0aGUgSUUgYHVuaXF1ZUlEYCB0byB1c2UgYXMgYSBoYXNoXG4gICAgICAvLyBhbmQgd2UgY291bGRuJ3QgdXNlIGEgbm9uLWVudW1lcmFibGUgcHJvcGVydHkgdG8gZXhwbG9pdCB0aGVcbiAgICAgIC8vIGRvbnRFbnVtIGJ1ZyBzbyB3ZSBzaW1wbHkgYWRkIHRoZSBgVUlEX0hBU0hfS0VZYCBvbiB0aGUgbm9kZVxuICAgICAgLy8gaXRzZWxmLlxuICAgICAgb2JqW1VJRF9IQVNIX0tFWV0gPSBoYXNoO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1VuYWJsZSB0byBzZXQgYSBub24tZW51bWVyYWJsZSBwcm9wZXJ0eSBvbiBvYmplY3QuJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhhc2g7XG4gIH1cblxuICAvLyBHZXQgcmVmZXJlbmNlcyB0byBFUzUgb2JqZWN0IG1ldGhvZHMuXG4gIHZhciBpc0V4dGVuc2libGUgPSBPYmplY3QuaXNFeHRlbnNpYmxlO1xuXG4gIC8vIFRydWUgaWYgT2JqZWN0LmRlZmluZVByb3BlcnR5IHdvcmtzIGFzIGV4cGVjdGVkLiBJRTggZmFpbHMgdGhpcyB0ZXN0LlxuICB2YXIgY2FuRGVmaW5lUHJvcGVydHkgPSAoZnVuY3Rpb24oKSB7XG4gICAgdHJ5IHtcbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eSh7fSwgJ0AnLCB7fSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9KCkpO1xuXG4gIC8vIElFIGhhcyBhIGB1bmlxdWVJRGAgcHJvcGVydHkgb24gRE9NIG5vZGVzLiBXZSBjYW4gY29uc3RydWN0IHRoZSBoYXNoIGZyb20gaXRcbiAgLy8gYW5kIGF2b2lkIG1lbW9yeSBsZWFrcyBmcm9tIHRoZSBJRSBjbG9uZU5vZGUgYnVnLlxuICBmdW5jdGlvbiBnZXRJRU5vZGVIYXNoKG5vZGUpIHtcbiAgICBpZiAobm9kZSAmJiBub2RlLm5vZGVUeXBlID4gMCkge1xuICAgICAgc3dpdGNoIChub2RlLm5vZGVUeXBlKSB7XG4gICAgICAgIGNhc2UgMTogLy8gRWxlbWVudFxuICAgICAgICAgIHJldHVybiBub2RlLnVuaXF1ZUlEO1xuICAgICAgICBjYXNlIDk6IC8vIERvY3VtZW50XG4gICAgICAgICAgcmV0dXJuIG5vZGUuZG9jdW1lbnRFbGVtZW50ICYmIG5vZGUuZG9jdW1lbnRFbGVtZW50LnVuaXF1ZUlEO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIElmIHBvc3NpYmxlLCB1c2UgYSBXZWFrTWFwLlxuICB2YXIgdXNpbmdXZWFrTWFwID0gdHlwZW9mIFdlYWtNYXAgPT09ICdmdW5jdGlvbic7XG4gIHZhciB3ZWFrTWFwO1xuICBpZiAodXNpbmdXZWFrTWFwKSB7XG4gICAgd2Vha01hcCA9IG5ldyBXZWFrTWFwKCk7XG4gIH1cblxuICB2YXIgb2JqSGFzaFVJRCA9IDA7XG5cbiAgdmFyIFVJRF9IQVNIX0tFWSA9ICdfX2ltbXV0YWJsZWhhc2hfXyc7XG4gIGlmICh0eXBlb2YgU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG4gICAgVUlEX0hBU0hfS0VZID0gU3ltYm9sKFVJRF9IQVNIX0tFWSk7XG4gIH1cblxuICB2YXIgU1RSSU5HX0hBU0hfQ0FDSEVfTUlOX1NUUkxFTiA9IDE2O1xuICB2YXIgU1RSSU5HX0hBU0hfQ0FDSEVfTUFYX1NJWkUgPSAyNTU7XG4gIHZhciBTVFJJTkdfSEFTSF9DQUNIRV9TSVpFID0gMDtcbiAgdmFyIHN0cmluZ0hhc2hDYWNoZSA9IHt9O1xuXG4gIGZ1bmN0aW9uIGludmFyaWFudChjb25kaXRpb24sIGVycm9yKSB7XG4gICAgaWYgKCFjb25kaXRpb24pIHRocm93IG5ldyBFcnJvcihlcnJvcik7XG4gIH1cblxuICBmdW5jdGlvbiBhc3NlcnROb3RJbmZpbml0ZShzaXplKSB7XG4gICAgaW52YXJpYW50KFxuICAgICAgc2l6ZSAhPT0gSW5maW5pdHksXG4gICAgICAnQ2Fubm90IHBlcmZvcm0gdGhpcyBhY3Rpb24gd2l0aCBhbiBpbmZpbml0ZSBzaXplLidcbiAgICApO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoVG9LZXllZFNlcXVlbmNlLCBLZXllZFNlcSk7XG4gICAgZnVuY3Rpb24gVG9LZXllZFNlcXVlbmNlKGluZGV4ZWQsIHVzZUtleXMpIHtcbiAgICAgIHRoaXMuX2l0ZXIgPSBpbmRleGVkO1xuICAgICAgdGhpcy5fdXNlS2V5cyA9IHVzZUtleXM7XG4gICAgICB0aGlzLnNpemUgPSBpbmRleGVkLnNpemU7XG4gICAgfVxuXG4gICAgVG9LZXllZFNlcXVlbmNlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrZXksIG5vdFNldFZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci5nZXQoa2V5LCBub3RTZXRWYWx1ZSk7XG4gICAgfTtcblxuICAgIFRvS2V5ZWRTZXF1ZW5jZS5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24oa2V5KSB7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci5oYXMoa2V5KTtcbiAgICB9O1xuXG4gICAgVG9LZXllZFNlcXVlbmNlLnByb3RvdHlwZS52YWx1ZVNlcSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXIudmFsdWVTZXEoKTtcbiAgICB9O1xuXG4gICAgVG9LZXllZFNlcXVlbmNlLnByb3RvdHlwZS5yZXZlcnNlID0gZnVuY3Rpb24oKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICB2YXIgcmV2ZXJzZWRTZXF1ZW5jZSA9IHJldmVyc2VGYWN0b3J5KHRoaXMsIHRydWUpO1xuICAgICAgaWYgKCF0aGlzLl91c2VLZXlzKSB7XG4gICAgICAgIHJldmVyc2VkU2VxdWVuY2UudmFsdWVTZXEgPSBmdW5jdGlvbigpICB7cmV0dXJuIHRoaXMkMC5faXRlci50b1NlcSgpLnJldmVyc2UoKX07XG4gICAgICB9XG4gICAgICByZXR1cm4gcmV2ZXJzZWRTZXF1ZW5jZTtcbiAgICB9O1xuXG4gICAgVG9LZXllZFNlcXVlbmNlLnByb3RvdHlwZS5tYXAgPSBmdW5jdGlvbihtYXBwZXIsIGNvbnRleHQpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHZhciBtYXBwZWRTZXF1ZW5jZSA9IG1hcEZhY3RvcnkodGhpcywgbWFwcGVyLCBjb250ZXh0KTtcbiAgICAgIGlmICghdGhpcy5fdXNlS2V5cykge1xuICAgICAgICBtYXBwZWRTZXF1ZW5jZS52YWx1ZVNlcSA9IGZ1bmN0aW9uKCkgIHtyZXR1cm4gdGhpcyQwLl9pdGVyLnRvU2VxKCkubWFwKG1hcHBlciwgY29udGV4dCl9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1hcHBlZFNlcXVlbmNlO1xuICAgIH07XG5cbiAgICBUb0tleWVkU2VxdWVuY2UucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICB2YXIgaWk7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci5fX2l0ZXJhdGUoXG4gICAgICAgIHRoaXMuX3VzZUtleXMgP1xuICAgICAgICAgIGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIGZuKHYsIGssIHRoaXMkMCl9IDpcbiAgICAgICAgICAoKGlpID0gcmV2ZXJzZSA/IHJlc29sdmVTaXplKHRoaXMpIDogMCksXG4gICAgICAgICAgICBmdW5jdGlvbih2ICkge3JldHVybiBmbih2LCByZXZlcnNlID8gLS1paSA6IGlpKyssIHRoaXMkMCl9KSxcbiAgICAgICAgcmV2ZXJzZVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgVG9LZXllZFNlcXVlbmNlLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgaWYgKHRoaXMuX3VzZUtleXMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2l0ZXIuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX2l0ZXIuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUywgcmV2ZXJzZSk7XG4gICAgICB2YXIgaWkgPSByZXZlcnNlID8gcmVzb2x2ZVNpemUodGhpcykgOiAwO1xuICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgdmFyIHN0ZXAgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIHJldHVybiBzdGVwLmRvbmUgPyBzdGVwIDpcbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIHJldmVyc2UgPyAtLWlpIDogaWkrKywgc3RlcC52YWx1ZSwgc3RlcCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gIFRvS2V5ZWRTZXF1ZW5jZS5wcm90b3R5cGVbSVNfT1JERVJFRF9TRU5USU5FTF0gPSB0cnVlO1xuXG5cbiAgY3JlYXRlQ2xhc3MoVG9JbmRleGVkU2VxdWVuY2UsIEluZGV4ZWRTZXEpO1xuICAgIGZ1bmN0aW9uIFRvSW5kZXhlZFNlcXVlbmNlKGl0ZXIpIHtcbiAgICAgIHRoaXMuX2l0ZXIgPSBpdGVyO1xuICAgICAgdGhpcy5zaXplID0gaXRlci5zaXplO1xuICAgIH1cblxuICAgIFRvSW5kZXhlZFNlcXVlbmNlLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci5pbmNsdWRlcyh2YWx1ZSk7XG4gICAgfTtcblxuICAgIFRvSW5kZXhlZFNlcXVlbmNlLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXIuX19pdGVyYXRlKGZ1bmN0aW9uKHYgKSB7cmV0dXJuIGZuKHYsIGl0ZXJhdGlvbnMrKywgdGhpcyQwKX0sIHJldmVyc2UpO1xuICAgIH07XG5cbiAgICBUb0luZGV4ZWRTZXF1ZW5jZS5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX2l0ZXIuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUywgcmV2ZXJzZSk7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgcmV0dXJuIHN0ZXAuZG9uZSA/IHN0ZXAgOlxuICAgICAgICAgIGl0ZXJhdG9yVmFsdWUodHlwZSwgaXRlcmF0aW9ucysrLCBzdGVwLnZhbHVlLCBzdGVwKVxuICAgICAgfSk7XG4gICAgfTtcblxuXG5cbiAgY3JlYXRlQ2xhc3MoVG9TZXRTZXF1ZW5jZSwgU2V0U2VxKTtcbiAgICBmdW5jdGlvbiBUb1NldFNlcXVlbmNlKGl0ZXIpIHtcbiAgICAgIHRoaXMuX2l0ZXIgPSBpdGVyO1xuICAgICAgdGhpcy5zaXplID0gaXRlci5zaXplO1xuICAgIH1cblxuICAgIFRvU2V0U2VxdWVuY2UucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKGtleSkge1xuICAgICAgcmV0dXJuIHRoaXMuX2l0ZXIuaW5jbHVkZXMoa2V5KTtcbiAgICB9O1xuXG4gICAgVG9TZXRTZXF1ZW5jZS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLl9faXRlcmF0ZShmdW5jdGlvbih2ICkge3JldHVybiBmbih2LCB2LCB0aGlzJDApfSwgcmV2ZXJzZSk7XG4gICAgfTtcblxuICAgIFRvU2V0U2VxdWVuY2UucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaXRlcmF0b3IgPSB0aGlzLl9pdGVyLl9faXRlcmF0b3IoSVRFUkFURV9WQUxVRVMsIHJldmVyc2UpO1xuICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgdmFyIHN0ZXAgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIHJldHVybiBzdGVwLmRvbmUgPyBzdGVwIDpcbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIHN0ZXAudmFsdWUsIHN0ZXAudmFsdWUsIHN0ZXApO1xuICAgICAgfSk7XG4gICAgfTtcblxuXG5cbiAgY3JlYXRlQ2xhc3MoRnJvbUVudHJpZXNTZXF1ZW5jZSwgS2V5ZWRTZXEpO1xuICAgIGZ1bmN0aW9uIEZyb21FbnRyaWVzU2VxdWVuY2UoZW50cmllcykge1xuICAgICAgdGhpcy5faXRlciA9IGVudHJpZXM7XG4gICAgICB0aGlzLnNpemUgPSBlbnRyaWVzLnNpemU7XG4gICAgfVxuXG4gICAgRnJvbUVudHJpZXNTZXF1ZW5jZS5wcm90b3R5cGUuZW50cnlTZXEgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9pdGVyLnRvU2VxKCk7XG4gICAgfTtcblxuICAgIEZyb21FbnRyaWVzU2VxdWVuY2UucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gdGhpcy5faXRlci5fX2l0ZXJhdGUoZnVuY3Rpb24oZW50cnkgKSB7XG4gICAgICAgIC8vIENoZWNrIGlmIGVudHJ5IGV4aXN0cyBmaXJzdCBzbyBhcnJheSBhY2Nlc3MgZG9lc24ndCB0aHJvdyBmb3IgaG9sZXNcbiAgICAgICAgLy8gaW4gdGhlIHBhcmVudCBpdGVyYXRpb24uXG4gICAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICAgIHZhbGlkYXRlRW50cnkoZW50cnkpO1xuICAgICAgICAgIHZhciBpbmRleGVkSXRlcmFibGUgPSBpc0l0ZXJhYmxlKGVudHJ5KTtcbiAgICAgICAgICByZXR1cm4gZm4oXG4gICAgICAgICAgICBpbmRleGVkSXRlcmFibGUgPyBlbnRyeS5nZXQoMSkgOiBlbnRyeVsxXSxcbiAgICAgICAgICAgIGluZGV4ZWRJdGVyYWJsZSA/IGVudHJ5LmdldCgwKSA6IGVudHJ5WzBdLFxuICAgICAgICAgICAgdGhpcyQwXG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgfSwgcmV2ZXJzZSk7XG4gICAgfTtcblxuICAgIEZyb21FbnRyaWVzU2VxdWVuY2UucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaXRlcmF0b3IgPSB0aGlzLl9pdGVyLl9faXRlcmF0b3IoSVRFUkFURV9WQUxVRVMsIHJldmVyc2UpO1xuICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RlcDtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGVudHJ5ID0gc3RlcC52YWx1ZTtcbiAgICAgICAgICAvLyBDaGVjayBpZiBlbnRyeSBleGlzdHMgZmlyc3Qgc28gYXJyYXkgYWNjZXNzIGRvZXNuJ3QgdGhyb3cgZm9yIGhvbGVzXG4gICAgICAgICAgLy8gaW4gdGhlIHBhcmVudCBpdGVyYXRpb24uXG4gICAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgICB2YWxpZGF0ZUVudHJ5KGVudHJ5KTtcbiAgICAgICAgICAgIHZhciBpbmRleGVkSXRlcmFibGUgPSBpc0l0ZXJhYmxlKGVudHJ5KTtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKFxuICAgICAgICAgICAgICB0eXBlLFxuICAgICAgICAgICAgICBpbmRleGVkSXRlcmFibGUgPyBlbnRyeS5nZXQoMCkgOiBlbnRyeVswXSxcbiAgICAgICAgICAgICAgaW5kZXhlZEl0ZXJhYmxlID8gZW50cnkuZ2V0KDEpIDogZW50cnlbMV0sXG4gICAgICAgICAgICAgIHN0ZXBcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9O1xuXG5cbiAgVG9JbmRleGVkU2VxdWVuY2UucHJvdG90eXBlLmNhY2hlUmVzdWx0ID1cbiAgVG9LZXllZFNlcXVlbmNlLnByb3RvdHlwZS5jYWNoZVJlc3VsdCA9XG4gIFRvU2V0U2VxdWVuY2UucHJvdG90eXBlLmNhY2hlUmVzdWx0ID1cbiAgRnJvbUVudHJpZXNTZXF1ZW5jZS5wcm90b3R5cGUuY2FjaGVSZXN1bHQgPVxuICAgIGNhY2hlUmVzdWx0VGhyb3VnaDtcblxuXG4gIGZ1bmN0aW9uIGZsaXBGYWN0b3J5KGl0ZXJhYmxlKSB7XG4gICAgdmFyIGZsaXBTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgZmxpcFNlcXVlbmNlLl9pdGVyID0gaXRlcmFibGU7XG4gICAgZmxpcFNlcXVlbmNlLnNpemUgPSBpdGVyYWJsZS5zaXplO1xuICAgIGZsaXBTZXF1ZW5jZS5mbGlwID0gZnVuY3Rpb24oKSAge3JldHVybiBpdGVyYWJsZX07XG4gICAgZmxpcFNlcXVlbmNlLnJldmVyc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgcmV2ZXJzZWRTZXF1ZW5jZSA9IGl0ZXJhYmxlLnJldmVyc2UuYXBwbHkodGhpcyk7IC8vIHN1cGVyLnJldmVyc2UoKVxuICAgICAgcmV2ZXJzZWRTZXF1ZW5jZS5mbGlwID0gZnVuY3Rpb24oKSAge3JldHVybiBpdGVyYWJsZS5yZXZlcnNlKCl9O1xuICAgICAgcmV0dXJuIHJldmVyc2VkU2VxdWVuY2U7XG4gICAgfTtcbiAgICBmbGlwU2VxdWVuY2UuaGFzID0gZnVuY3Rpb24oa2V5ICkge3JldHVybiBpdGVyYWJsZS5pbmNsdWRlcyhrZXkpfTtcbiAgICBmbGlwU2VxdWVuY2UuaW5jbHVkZXMgPSBmdW5jdGlvbihrZXkgKSB7cmV0dXJuIGl0ZXJhYmxlLmhhcyhrZXkpfTtcbiAgICBmbGlwU2VxdWVuY2UuY2FjaGVSZXN1bHQgPSBjYWNoZVJlc3VsdFRocm91Z2g7XG4gICAgZmxpcFNlcXVlbmNlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gaXRlcmFibGUuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIGZuKGssIHYsIHRoaXMkMCkgIT09IGZhbHNlfSwgcmV2ZXJzZSk7XG4gICAgfVxuICAgIGZsaXBTZXF1ZW5jZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICBpZiAodHlwZSA9PT0gSVRFUkFURV9FTlRSSUVTKSB7XG4gICAgICAgIHZhciBpdGVyYXRvciA9IGl0ZXJhYmxlLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgICAgdmFyIHN0ZXAgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgICAgaWYgKCFzdGVwLmRvbmUpIHtcbiAgICAgICAgICAgIHZhciBrID0gc3RlcC52YWx1ZVswXTtcbiAgICAgICAgICAgIHN0ZXAudmFsdWVbMF0gPSBzdGVwLnZhbHVlWzFdO1xuICAgICAgICAgICAgc3RlcC52YWx1ZVsxXSA9IGs7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBzdGVwO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpdGVyYWJsZS5fX2l0ZXJhdG9yKFxuICAgICAgICB0eXBlID09PSBJVEVSQVRFX1ZBTFVFUyA/IElURVJBVEVfS0VZUyA6IElURVJBVEVfVkFMVUVTLFxuICAgICAgICByZXZlcnNlXG4gICAgICApO1xuICAgIH1cbiAgICByZXR1cm4gZmxpcFNlcXVlbmNlO1xuICB9XG5cblxuICBmdW5jdGlvbiBtYXBGYWN0b3J5KGl0ZXJhYmxlLCBtYXBwZXIsIGNvbnRleHQpIHtcbiAgICB2YXIgbWFwcGVkU2VxdWVuY2UgPSBtYWtlU2VxdWVuY2UoaXRlcmFibGUpO1xuICAgIG1hcHBlZFNlcXVlbmNlLnNpemUgPSBpdGVyYWJsZS5zaXplO1xuICAgIG1hcHBlZFNlcXVlbmNlLmhhcyA9IGZ1bmN0aW9uKGtleSApIHtyZXR1cm4gaXRlcmFibGUuaGFzKGtleSl9O1xuICAgIG1hcHBlZFNlcXVlbmNlLmdldCA9IGZ1bmN0aW9uKGtleSwgbm90U2V0VmFsdWUpICB7XG4gICAgICB2YXIgdiA9IGl0ZXJhYmxlLmdldChrZXksIE5PVF9TRVQpO1xuICAgICAgcmV0dXJuIHYgPT09IE5PVF9TRVQgP1xuICAgICAgICBub3RTZXRWYWx1ZSA6XG4gICAgICAgIG1hcHBlci5jYWxsKGNvbnRleHQsIHYsIGtleSwgaXRlcmFibGUpO1xuICAgIH07XG4gICAgbWFwcGVkU2VxdWVuY2UuX19pdGVyYXRlVW5jYWNoZWQgPSBmdW5jdGlvbiAoZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHJldHVybiBpdGVyYWJsZS5fX2l0ZXJhdGUoXG4gICAgICAgIGZ1bmN0aW9uKHYsIGssIGMpICB7cmV0dXJuIGZuKG1hcHBlci5jYWxsKGNvbnRleHQsIHYsIGssIGMpLCBrLCB0aGlzJDApICE9PSBmYWxzZX0sXG4gICAgICAgIHJldmVyc2VcbiAgICAgICk7XG4gICAgfVxuICAgIG1hcHBlZFNlcXVlbmNlLl9faXRlcmF0b3JVbmNhY2hlZCA9IGZ1bmN0aW9uICh0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaXRlcmF0b3IgPSBpdGVyYWJsZS5fX2l0ZXJhdG9yKElURVJBVEVfRU5UUklFUywgcmV2ZXJzZSk7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgaWYgKHN0ZXAuZG9uZSkge1xuICAgICAgICAgIHJldHVybiBzdGVwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbnRyeSA9IHN0ZXAudmFsdWU7XG4gICAgICAgIHZhciBrZXkgPSBlbnRyeVswXTtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yVmFsdWUoXG4gICAgICAgICAgdHlwZSxcbiAgICAgICAgICBrZXksXG4gICAgICAgICAgbWFwcGVyLmNhbGwoY29udGV4dCwgZW50cnlbMV0sIGtleSwgaXRlcmFibGUpLFxuICAgICAgICAgIHN0ZXBcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gbWFwcGVkU2VxdWVuY2U7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHJldmVyc2VGYWN0b3J5KGl0ZXJhYmxlLCB1c2VLZXlzKSB7XG4gICAgdmFyIHJldmVyc2VkU2VxdWVuY2UgPSBtYWtlU2VxdWVuY2UoaXRlcmFibGUpO1xuICAgIHJldmVyc2VkU2VxdWVuY2UuX2l0ZXIgPSBpdGVyYWJsZTtcbiAgICByZXZlcnNlZFNlcXVlbmNlLnNpemUgPSBpdGVyYWJsZS5zaXplO1xuICAgIHJldmVyc2VkU2VxdWVuY2UucmV2ZXJzZSA9IGZ1bmN0aW9uKCkgIHtyZXR1cm4gaXRlcmFibGV9O1xuICAgIGlmIChpdGVyYWJsZS5mbGlwKSB7XG4gICAgICByZXZlcnNlZFNlcXVlbmNlLmZsaXAgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBmbGlwU2VxdWVuY2UgPSBmbGlwRmFjdG9yeShpdGVyYWJsZSk7XG4gICAgICAgIGZsaXBTZXF1ZW5jZS5yZXZlcnNlID0gZnVuY3Rpb24oKSAge3JldHVybiBpdGVyYWJsZS5mbGlwKCl9O1xuICAgICAgICByZXR1cm4gZmxpcFNlcXVlbmNlO1xuICAgICAgfTtcbiAgICB9XG4gICAgcmV2ZXJzZWRTZXF1ZW5jZS5nZXQgPSBmdW5jdGlvbihrZXksIG5vdFNldFZhbHVlKSBcbiAgICAgIHtyZXR1cm4gaXRlcmFibGUuZ2V0KHVzZUtleXMgPyBrZXkgOiAtMSAtIGtleSwgbm90U2V0VmFsdWUpfTtcbiAgICByZXZlcnNlZFNlcXVlbmNlLmhhcyA9IGZ1bmN0aW9uKGtleSApXG4gICAgICB7cmV0dXJuIGl0ZXJhYmxlLmhhcyh1c2VLZXlzID8ga2V5IDogLTEgLSBrZXkpfTtcbiAgICByZXZlcnNlZFNlcXVlbmNlLmluY2x1ZGVzID0gZnVuY3Rpb24odmFsdWUgKSB7cmV0dXJuIGl0ZXJhYmxlLmluY2x1ZGVzKHZhbHVlKX07XG4gICAgcmV2ZXJzZWRTZXF1ZW5jZS5jYWNoZVJlc3VsdCA9IGNhY2hlUmVzdWx0VGhyb3VnaDtcbiAgICByZXZlcnNlZFNlcXVlbmNlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uIChmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgcmV0dXJuIGl0ZXJhYmxlLl9faXRlcmF0ZShmdW5jdGlvbih2LCBrKSAge3JldHVybiBmbih2LCBrLCB0aGlzJDApfSwgIXJldmVyc2UpO1xuICAgIH07XG4gICAgcmV2ZXJzZWRTZXF1ZW5jZS5fX2l0ZXJhdG9yID1cbiAgICAgIGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpICB7cmV0dXJuIGl0ZXJhYmxlLl9faXRlcmF0b3IodHlwZSwgIXJldmVyc2UpfTtcbiAgICByZXR1cm4gcmV2ZXJzZWRTZXF1ZW5jZTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gZmlsdGVyRmFjdG9yeShpdGVyYWJsZSwgcHJlZGljYXRlLCBjb250ZXh0LCB1c2VLZXlzKSB7XG4gICAgdmFyIGZpbHRlclNlcXVlbmNlID0gbWFrZVNlcXVlbmNlKGl0ZXJhYmxlKTtcbiAgICBpZiAodXNlS2V5cykge1xuICAgICAgZmlsdGVyU2VxdWVuY2UuaGFzID0gZnVuY3Rpb24oa2V5ICkge1xuICAgICAgICB2YXIgdiA9IGl0ZXJhYmxlLmdldChrZXksIE5PVF9TRVQpO1xuICAgICAgICByZXR1cm4gdiAhPT0gTk9UX1NFVCAmJiAhIXByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHYsIGtleSwgaXRlcmFibGUpO1xuICAgICAgfTtcbiAgICAgIGZpbHRlclNlcXVlbmNlLmdldCA9IGZ1bmN0aW9uKGtleSwgbm90U2V0VmFsdWUpICB7XG4gICAgICAgIHZhciB2ID0gaXRlcmFibGUuZ2V0KGtleSwgTk9UX1NFVCk7XG4gICAgICAgIHJldHVybiB2ICE9PSBOT1RfU0VUICYmIHByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHYsIGtleSwgaXRlcmFibGUpID9cbiAgICAgICAgICB2IDogbm90U2V0VmFsdWU7XG4gICAgICB9O1xuICAgIH1cbiAgICBmaWx0ZXJTZXF1ZW5jZS5fX2l0ZXJhdGVVbmNhY2hlZCA9IGZ1bmN0aW9uIChmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgaXRlcmFibGUuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGssIGMpICB7XG4gICAgICAgIGlmIChwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCBjKSkge1xuICAgICAgICAgIGl0ZXJhdGlvbnMrKztcbiAgICAgICAgICByZXR1cm4gZm4odiwgdXNlS2V5cyA/IGsgOiBpdGVyYXRpb25zIC0gMSwgdGhpcyQwKTtcbiAgICAgICAgfVxuICAgICAgfSwgcmV2ZXJzZSk7XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICB9O1xuICAgIGZpbHRlclNlcXVlbmNlLl9faXRlcmF0b3JVbmNhY2hlZCA9IGZ1bmN0aW9uICh0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaXRlcmF0b3IgPSBpdGVyYWJsZS5fX2l0ZXJhdG9yKElURVJBVEVfRU5UUklFUywgcmV2ZXJzZSk7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIHZhciBzdGVwID0gaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICAgIGlmIChzdGVwLmRvbmUpIHtcbiAgICAgICAgICAgIHJldHVybiBzdGVwO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgZW50cnkgPSBzdGVwLnZhbHVlO1xuICAgICAgICAgIHZhciBrZXkgPSBlbnRyeVswXTtcbiAgICAgICAgICB2YXIgdmFsdWUgPSBlbnRyeVsxXTtcbiAgICAgICAgICBpZiAocHJlZGljYXRlLmNhbGwoY29udGV4dCwgdmFsdWUsIGtleSwgaXRlcmFibGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZSh0eXBlLCB1c2VLZXlzID8ga2V5IDogaXRlcmF0aW9ucysrLCB2YWx1ZSwgc3RlcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbHRlclNlcXVlbmNlO1xuICB9XG5cblxuICBmdW5jdGlvbiBjb3VudEJ5RmFjdG9yeShpdGVyYWJsZSwgZ3JvdXBlciwgY29udGV4dCkge1xuICAgIHZhciBncm91cHMgPSBzcmNfTWFwX19NYXAoKS5hc011dGFibGUoKTtcbiAgICBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgIHtcbiAgICAgIGdyb3Vwcy51cGRhdGUoXG4gICAgICAgIGdyb3VwZXIuY2FsbChjb250ZXh0LCB2LCBrLCBpdGVyYWJsZSksXG4gICAgICAgIDAsXG4gICAgICAgIGZ1bmN0aW9uKGEgKSB7cmV0dXJuIGEgKyAxfVxuICAgICAgKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZ3JvdXBzLmFzSW1tdXRhYmxlKCk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIGdyb3VwQnlGYWN0b3J5KGl0ZXJhYmxlLCBncm91cGVyLCBjb250ZXh0KSB7XG4gICAgdmFyIGlzS2V5ZWRJdGVyID0gaXNLZXllZChpdGVyYWJsZSk7XG4gICAgdmFyIGdyb3VwcyA9IChpc09yZGVyZWQoaXRlcmFibGUpID8gT3JkZXJlZE1hcCgpIDogc3JjX01hcF9fTWFwKCkpLmFzTXV0YWJsZSgpO1xuICAgIGl0ZXJhYmxlLl9faXRlcmF0ZShmdW5jdGlvbih2LCBrKSAge1xuICAgICAgZ3JvdXBzLnVwZGF0ZShcbiAgICAgICAgZ3JvdXBlci5jYWxsKGNvbnRleHQsIHYsIGssIGl0ZXJhYmxlKSxcbiAgICAgICAgZnVuY3Rpb24oYSApIHtyZXR1cm4gKGEgPSBhIHx8IFtdLCBhLnB1c2goaXNLZXllZEl0ZXIgPyBbaywgdl0gOiB2KSwgYSl9XG4gICAgICApO1xuICAgIH0pO1xuICAgIHZhciBjb2VyY2UgPSBpdGVyYWJsZUNsYXNzKGl0ZXJhYmxlKTtcbiAgICByZXR1cm4gZ3JvdXBzLm1hcChmdW5jdGlvbihhcnIgKSB7cmV0dXJuIHJlaWZ5KGl0ZXJhYmxlLCBjb2VyY2UoYXJyKSl9KTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gc2xpY2VGYWN0b3J5KGl0ZXJhYmxlLCBiZWdpbiwgZW5kLCB1c2VLZXlzKSB7XG4gICAgdmFyIG9yaWdpbmFsU2l6ZSA9IGl0ZXJhYmxlLnNpemU7XG5cbiAgICAvLyBTYW5pdGl6ZSBiZWdpbiAmIGVuZCB1c2luZyB0aGlzIHNob3J0aGFuZCBmb3IgVG9JbnQzMihhcmd1bWVudClcbiAgICAvLyBodHRwOi8vd3d3LmVjbWEtaW50ZXJuYXRpb25hbC5vcmcvZWNtYS0yNjIvNi4wLyNzZWMtdG9pbnQzMlxuICAgIGlmIChiZWdpbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBiZWdpbiA9IGJlZ2luIHwgMDtcbiAgICB9XG4gICAgaWYgKGVuZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBlbmQgPSBlbmQgfCAwO1xuICAgIH1cblxuICAgIGlmICh3aG9sZVNsaWNlKGJlZ2luLCBlbmQsIG9yaWdpbmFsU2l6ZSkpIHtcbiAgICAgIHJldHVybiBpdGVyYWJsZTtcbiAgICB9XG5cbiAgICB2YXIgcmVzb2x2ZWRCZWdpbiA9IHJlc29sdmVCZWdpbihiZWdpbiwgb3JpZ2luYWxTaXplKTtcbiAgICB2YXIgcmVzb2x2ZWRFbmQgPSByZXNvbHZlRW5kKGVuZCwgb3JpZ2luYWxTaXplKTtcblxuICAgIC8vIGJlZ2luIG9yIGVuZCB3aWxsIGJlIE5hTiBpZiB0aGV5IHdlcmUgcHJvdmlkZWQgYXMgbmVnYXRpdmUgbnVtYmVycyBhbmRcbiAgICAvLyB0aGlzIGl0ZXJhYmxlJ3Mgc2l6ZSBpcyB1bmtub3duLiBJbiB0aGF0IGNhc2UsIGNhY2hlIGZpcnN0IHNvIHRoZXJlIGlzXG4gICAgLy8gYSBrbm93biBzaXplIGFuZCB0aGVzZSBkbyBub3QgcmVzb2x2ZSB0byBOYU4uXG4gICAgaWYgKHJlc29sdmVkQmVnaW4gIT09IHJlc29sdmVkQmVnaW4gfHwgcmVzb2x2ZWRFbmQgIT09IHJlc29sdmVkRW5kKSB7XG4gICAgICByZXR1cm4gc2xpY2VGYWN0b3J5KGl0ZXJhYmxlLnRvU2VxKCkuY2FjaGVSZXN1bHQoKSwgYmVnaW4sIGVuZCwgdXNlS2V5cyk7XG4gICAgfVxuXG4gICAgLy8gTm90ZTogcmVzb2x2ZWRFbmQgaXMgdW5kZWZpbmVkIHdoZW4gdGhlIG9yaWdpbmFsIHNlcXVlbmNlJ3MgbGVuZ3RoIGlzXG4gICAgLy8gdW5rbm93biBhbmQgdGhpcyBzbGljZSBkaWQgbm90IHN1cHBseSBhbiBlbmQgYW5kIHNob3VsZCBjb250YWluIGFsbFxuICAgIC8vIGVsZW1lbnRzIGFmdGVyIHJlc29sdmVkQmVnaW4uXG4gICAgLy8gSW4gdGhhdCBjYXNlLCByZXNvbHZlZFNpemUgd2lsbCBiZSBOYU4gYW5kIHNsaWNlU2l6ZSB3aWxsIHJlbWFpbiB1bmRlZmluZWQuXG4gICAgdmFyIHJlc29sdmVkU2l6ZSA9IHJlc29sdmVkRW5kIC0gcmVzb2x2ZWRCZWdpbjtcbiAgICB2YXIgc2xpY2VTaXplO1xuICAgIGlmIChyZXNvbHZlZFNpemUgPT09IHJlc29sdmVkU2l6ZSkge1xuICAgICAgc2xpY2VTaXplID0gcmVzb2x2ZWRTaXplIDwgMCA/IDAgOiByZXNvbHZlZFNpemU7XG4gICAgfVxuXG4gICAgdmFyIHNsaWNlU2VxID0gbWFrZVNlcXVlbmNlKGl0ZXJhYmxlKTtcblxuICAgIC8vIElmIGl0ZXJhYmxlLnNpemUgaXMgdW5kZWZpbmVkLCB0aGUgc2l6ZSBvZiB0aGUgcmVhbGl6ZWQgc2xpY2VTZXEgaXNcbiAgICAvLyB1bmtub3duIGF0IHRoaXMgcG9pbnQgdW5sZXNzIHRoZSBudW1iZXIgb2YgaXRlbXMgdG8gc2xpY2UgaXMgMFxuICAgIHNsaWNlU2VxLnNpemUgPSBzbGljZVNpemUgPT09IDAgPyBzbGljZVNpemUgOiBpdGVyYWJsZS5zaXplICYmIHNsaWNlU2l6ZSB8fCB1bmRlZmluZWQ7XG5cbiAgICBpZiAoIXVzZUtleXMgJiYgaXNTZXEoaXRlcmFibGUpICYmIHNsaWNlU2l6ZSA+PSAwKSB7XG4gICAgICBzbGljZVNlcS5nZXQgPSBmdW5jdGlvbiAoaW5kZXgsIG5vdFNldFZhbHVlKSB7XG4gICAgICAgIGluZGV4ID0gd3JhcEluZGV4KHRoaXMsIGluZGV4KTtcbiAgICAgICAgcmV0dXJuIGluZGV4ID49IDAgJiYgaW5kZXggPCBzbGljZVNpemUgP1xuICAgICAgICAgIGl0ZXJhYmxlLmdldChpbmRleCArIHJlc29sdmVkQmVnaW4sIG5vdFNldFZhbHVlKSA6XG4gICAgICAgICAgbm90U2V0VmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2xpY2VTZXEuX19pdGVyYXRlVW5jYWNoZWQgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgaWYgKHNsaWNlU2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICAgIGlmIChyZXZlcnNlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhY2hlUmVzdWx0KCkuX19pdGVyYXRlKGZuLCByZXZlcnNlKTtcbiAgICAgIH1cbiAgICAgIHZhciBza2lwcGVkID0gMDtcbiAgICAgIHZhciBpc1NraXBwaW5nID0gdHJ1ZTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIGl0ZXJhYmxlLl9faXRlcmF0ZShmdW5jdGlvbih2LCBrKSAge1xuICAgICAgICBpZiAoIShpc1NraXBwaW5nICYmIChpc1NraXBwaW5nID0gc2tpcHBlZCsrIDwgcmVzb2x2ZWRCZWdpbikpKSB7XG4gICAgICAgICAgaXRlcmF0aW9ucysrO1xuICAgICAgICAgIHJldHVybiBmbih2LCB1c2VLZXlzID8gayA6IGl0ZXJhdGlvbnMgLSAxLCB0aGlzJDApICE9PSBmYWxzZSAmJlxuICAgICAgICAgICAgICAgICBpdGVyYXRpb25zICE9PSBzbGljZVNpemU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcblxuICAgIHNsaWNlU2VxLl9faXRlcmF0b3JVbmNhY2hlZCA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIGlmIChzbGljZVNpemUgIT09IDAgJiYgcmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICAvLyBEb24ndCBib3RoZXIgaW5zdGFudGlhdGluZyBwYXJlbnQgaXRlcmF0b3IgaWYgdGFraW5nIDAuXG4gICAgICB2YXIgaXRlcmF0b3IgPSBzbGljZVNpemUgIT09IDAgJiYgaXRlcmFibGUuX19pdGVyYXRvcih0eXBlLCByZXZlcnNlKTtcbiAgICAgIHZhciBza2lwcGVkID0gMDtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHdoaWxlIChza2lwcGVkKysgPCByZXNvbHZlZEJlZ2luKSB7XG4gICAgICAgICAgaXRlcmF0b3IubmV4dCgpO1xuICAgICAgICB9XG4gICAgICAgIGlmICgrK2l0ZXJhdGlvbnMgPiBzbGljZVNpemUpIHtcbiAgICAgICAgICByZXR1cm4gaXRlcmF0b3JEb25lKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN0ZXAgPSBpdGVyYXRvci5uZXh0KCk7XG4gICAgICAgIGlmICh1c2VLZXlzIHx8IHR5cGUgPT09IElURVJBVEVfVkFMVUVTKSB7XG4gICAgICAgICAgcmV0dXJuIHN0ZXA7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gSVRFUkFURV9LRVlTKSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yVmFsdWUodHlwZSwgaXRlcmF0aW9ucyAtIDEsIHVuZGVmaW5lZCwgc3RlcCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yVmFsdWUodHlwZSwgaXRlcmF0aW9ucyAtIDEsIHN0ZXAudmFsdWVbMV0sIHN0ZXApO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2xpY2VTZXE7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIHRha2VXaGlsZUZhY3RvcnkoaXRlcmFibGUsIHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgIHZhciB0YWtlU2VxdWVuY2UgPSBtYWtlU2VxdWVuY2UoaXRlcmFibGUpO1xuICAgIHRha2VTZXF1ZW5jZS5fX2l0ZXJhdGVVbmNhY2hlZCA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0ZShmbiwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgXG4gICAgICAgIHtyZXR1cm4gcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdiwgaywgYykgJiYgKytpdGVyYXRpb25zICYmIGZuKHYsIGssIHRoaXMkMCl9XG4gICAgICApO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcbiAgICB0YWtlU2VxdWVuY2UuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVSZXN1bHQoKS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXJhdG9yID0gaXRlcmFibGUuX19pdGVyYXRvcihJVEVSQVRFX0VOVFJJRVMsIHJldmVyc2UpO1xuICAgICAgdmFyIGl0ZXJhdGluZyA9IHRydWU7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICBpZiAoIWl0ZXJhdGluZykge1xuICAgICAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgaWYgKHN0ZXAuZG9uZSkge1xuICAgICAgICAgIHJldHVybiBzdGVwO1xuICAgICAgICB9XG4gICAgICAgIHZhciBlbnRyeSA9IHN0ZXAudmFsdWU7XG4gICAgICAgIHZhciBrID0gZW50cnlbMF07XG4gICAgICAgIHZhciB2ID0gZW50cnlbMV07XG4gICAgICAgIGlmICghcHJlZGljYXRlLmNhbGwoY29udGV4dCwgdiwgaywgdGhpcyQwKSkge1xuICAgICAgICAgIGl0ZXJhdGluZyA9IGZhbHNlO1xuICAgICAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHlwZSA9PT0gSVRFUkFURV9FTlRSSUVTID8gc3RlcCA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBrLCB2LCBzdGVwKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIHRha2VTZXF1ZW5jZTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gc2tpcFdoaWxlRmFjdG9yeShpdGVyYWJsZSwgcHJlZGljYXRlLCBjb250ZXh0LCB1c2VLZXlzKSB7XG4gICAgdmFyIHNraXBTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgc2tpcFNlcXVlbmNlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICBpZiAocmV2ZXJzZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYWNoZVJlc3VsdCgpLl9faXRlcmF0ZShmbiwgcmV2ZXJzZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXNTa2lwcGluZyA9IHRydWU7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgIHtcbiAgICAgICAgaWYgKCEoaXNTa2lwcGluZyAmJiAoaXNTa2lwcGluZyA9IHByZWRpY2F0ZS5jYWxsKGNvbnRleHQsIHYsIGssIGMpKSkpIHtcbiAgICAgICAgICBpdGVyYXRpb25zKys7XG4gICAgICAgICAgcmV0dXJuIGZuKHYsIHVzZUtleXMgPyBrIDogaXRlcmF0aW9ucyAtIDEsIHRoaXMkMCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcbiAgICBza2lwU2VxdWVuY2UuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FjaGVSZXN1bHQoKS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgdmFyIGl0ZXJhdG9yID0gaXRlcmFibGUuX19pdGVyYXRvcihJVEVSQVRFX0VOVFJJRVMsIHJldmVyc2UpO1xuICAgICAgdmFyIHNraXBwaW5nID0gdHJ1ZTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiBuZXcgc3JjX0l0ZXJhdG9yX19JdGVyYXRvcihmdW5jdGlvbigpICB7XG4gICAgICAgIHZhciBzdGVwLCBrLCB2O1xuICAgICAgICBkbyB7XG4gICAgICAgICAgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgICBpZiAodXNlS2V5cyB8fCB0eXBlID09PSBJVEVSQVRFX1ZBTFVFUykge1xuICAgICAgICAgICAgICByZXR1cm4gc3RlcDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZSA9PT0gSVRFUkFURV9LRVlTKSB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgdW5kZWZpbmVkLCBzdGVwKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgc3RlcC52YWx1ZVsxXSwgc3RlcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHZhciBlbnRyeSA9IHN0ZXAudmFsdWU7XG4gICAgICAgICAgayA9IGVudHJ5WzBdO1xuICAgICAgICAgIHYgPSBlbnRyeVsxXTtcbiAgICAgICAgICBza2lwcGluZyAmJiAoc2tpcHBpbmcgPSBwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCB0aGlzJDApKTtcbiAgICAgICAgfSB3aGlsZSAoc2tpcHBpbmcpO1xuICAgICAgICByZXR1cm4gdHlwZSA9PT0gSVRFUkFURV9FTlRSSUVTID8gc3RlcCA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBrLCB2LCBzdGVwKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIHNraXBTZXF1ZW5jZTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gY29uY2F0RmFjdG9yeShpdGVyYWJsZSwgdmFsdWVzKSB7XG4gICAgdmFyIGlzS2V5ZWRJdGVyYWJsZSA9IGlzS2V5ZWQoaXRlcmFibGUpO1xuICAgIHZhciBpdGVycyA9IFtpdGVyYWJsZV0uY29uY2F0KHZhbHVlcykubWFwKGZ1bmN0aW9uKHYgKSB7XG4gICAgICBpZiAoIWlzSXRlcmFibGUodikpIHtcbiAgICAgICAgdiA9IGlzS2V5ZWRJdGVyYWJsZSA/XG4gICAgICAgICAga2V5ZWRTZXFGcm9tVmFsdWUodikgOlxuICAgICAgICAgIGluZGV4ZWRTZXFGcm9tVmFsdWUoQXJyYXkuaXNBcnJheSh2KSA/IHYgOiBbdl0pO1xuICAgICAgfSBlbHNlIGlmIChpc0tleWVkSXRlcmFibGUpIHtcbiAgICAgICAgdiA9IEtleWVkSXRlcmFibGUodik7XG4gICAgICB9XG4gICAgICByZXR1cm4gdjtcbiAgICB9KS5maWx0ZXIoZnVuY3Rpb24odiApIHtyZXR1cm4gdi5zaXplICE9PSAwfSk7XG5cbiAgICBpZiAoaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gaXRlcmFibGU7XG4gICAgfVxuXG4gICAgaWYgKGl0ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgdmFyIHNpbmdsZXRvbiA9IGl0ZXJzWzBdO1xuICAgICAgaWYgKHNpbmdsZXRvbiA9PT0gaXRlcmFibGUgfHxcbiAgICAgICAgICBpc0tleWVkSXRlcmFibGUgJiYgaXNLZXllZChzaW5nbGV0b24pIHx8XG4gICAgICAgICAgaXNJbmRleGVkKGl0ZXJhYmxlKSAmJiBpc0luZGV4ZWQoc2luZ2xldG9uKSkge1xuICAgICAgICByZXR1cm4gc2luZ2xldG9uO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBjb25jYXRTZXEgPSBuZXcgQXJyYXlTZXEoaXRlcnMpO1xuICAgIGlmIChpc0tleWVkSXRlcmFibGUpIHtcbiAgICAgIGNvbmNhdFNlcSA9IGNvbmNhdFNlcS50b0tleWVkU2VxKCk7XG4gICAgfSBlbHNlIGlmICghaXNJbmRleGVkKGl0ZXJhYmxlKSkge1xuICAgICAgY29uY2F0U2VxID0gY29uY2F0U2VxLnRvU2V0U2VxKCk7XG4gICAgfVxuICAgIGNvbmNhdFNlcSA9IGNvbmNhdFNlcS5mbGF0dGVuKHRydWUpO1xuICAgIGNvbmNhdFNlcS5zaXplID0gaXRlcnMucmVkdWNlKFxuICAgICAgZnVuY3Rpb24oc3VtLCBzZXEpICB7XG4gICAgICAgIGlmIChzdW0gIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgIHZhciBzaXplID0gc2VxLnNpemU7XG4gICAgICAgICAgaWYgKHNpemUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHN1bSArIHNpemU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgMFxuICAgICk7XG4gICAgcmV0dXJuIGNvbmNhdFNlcTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gZmxhdHRlbkZhY3RvcnkoaXRlcmFibGUsIGRlcHRoLCB1c2VLZXlzKSB7XG4gICAgdmFyIGZsYXRTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgZmxhdFNlcXVlbmNlLl9faXRlcmF0ZVVuY2FjaGVkID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBzdG9wcGVkID0gZmFsc2U7XG4gICAgICBmdW5jdGlvbiBmbGF0RGVlcChpdGVyLCBjdXJyZW50RGVwdGgpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgICAgaXRlci5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgIHtcbiAgICAgICAgICBpZiAoKCFkZXB0aCB8fCBjdXJyZW50RGVwdGggPCBkZXB0aCkgJiYgaXNJdGVyYWJsZSh2KSkge1xuICAgICAgICAgICAgZmxhdERlZXAodiwgY3VycmVudERlcHRoICsgMSk7XG4gICAgICAgICAgfSBlbHNlIGlmIChmbih2LCB1c2VLZXlzID8gayA6IGl0ZXJhdGlvbnMrKywgdGhpcyQwKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgIHN0b3BwZWQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gIXN0b3BwZWQ7XG4gICAgICAgIH0sIHJldmVyc2UpO1xuICAgICAgfVxuICAgICAgZmxhdERlZXAoaXRlcmFibGUsIDApO1xuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfVxuICAgIGZsYXRTZXF1ZW5jZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaXRlcmF0b3IgPSBpdGVyYWJsZS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgdmFyIHN0YWNrID0gW107XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB3aGlsZSAoaXRlcmF0b3IpIHtcbiAgICAgICAgICB2YXIgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoc3RlcC5kb25lICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgaXRlcmF0b3IgPSBzdGFjay5wb3AoKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB2YXIgdiA9IHN0ZXAudmFsdWU7XG4gICAgICAgICAgaWYgKHR5cGUgPT09IElURVJBVEVfRU5UUklFUykge1xuICAgICAgICAgICAgdiA9IHZbMV07XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICgoIWRlcHRoIHx8IHN0YWNrLmxlbmd0aCA8IGRlcHRoKSAmJiBpc0l0ZXJhYmxlKHYpKSB7XG4gICAgICAgICAgICBzdGFjay5wdXNoKGl0ZXJhdG9yKTtcbiAgICAgICAgICAgIGl0ZXJhdG9yID0gdi5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdXNlS2V5cyA/IHN0ZXAgOiBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgdiwgc3RlcCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgICByZXR1cm4gZmxhdFNlcXVlbmNlO1xuICB9XG5cblxuICBmdW5jdGlvbiBmbGF0TWFwRmFjdG9yeShpdGVyYWJsZSwgbWFwcGVyLCBjb250ZXh0KSB7XG4gICAgdmFyIGNvZXJjZSA9IGl0ZXJhYmxlQ2xhc3MoaXRlcmFibGUpO1xuICAgIHJldHVybiBpdGVyYWJsZS50b1NlcSgpLm1hcChcbiAgICAgIGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIGNvZXJjZShtYXBwZXIuY2FsbChjb250ZXh0LCB2LCBrLCBpdGVyYWJsZSkpfVxuICAgICkuZmxhdHRlbih0cnVlKTtcbiAgfVxuXG5cbiAgZnVuY3Rpb24gaW50ZXJwb3NlRmFjdG9yeShpdGVyYWJsZSwgc2VwYXJhdG9yKSB7XG4gICAgdmFyIGludGVycG9zZWRTZXF1ZW5jZSA9IG1ha2VTZXF1ZW5jZShpdGVyYWJsZSk7XG4gICAgaW50ZXJwb3NlZFNlcXVlbmNlLnNpemUgPSBpdGVyYWJsZS5zaXplICYmIGl0ZXJhYmxlLnNpemUgKiAyIC0xO1xuICAgIGludGVycG9zZWRTZXF1ZW5jZS5fX2l0ZXJhdGVVbmNhY2hlZCA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICBpdGVyYWJsZS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgXG4gICAgICAgIHtyZXR1cm4gKCFpdGVyYXRpb25zIHx8IGZuKHNlcGFyYXRvciwgaXRlcmF0aW9ucysrLCB0aGlzJDApICE9PSBmYWxzZSkgJiZcbiAgICAgICAgZm4odiwgaXRlcmF0aW9ucysrLCB0aGlzJDApICE9PSBmYWxzZX0sXG4gICAgICAgIHJldmVyc2VcbiAgICAgICk7XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICB9O1xuICAgIGludGVycG9zZWRTZXF1ZW5jZS5fX2l0ZXJhdG9yVW5jYWNoZWQgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICB2YXIgaXRlcmF0b3IgPSBpdGVyYWJsZS5fX2l0ZXJhdG9yKElURVJBVEVfVkFMVUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHZhciBzdGVwO1xuICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgaWYgKCFzdGVwIHx8IGl0ZXJhdGlvbnMgJSAyKSB7XG4gICAgICAgICAgc3RlcCA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgICAgICAgICBpZiAoc3RlcC5kb25lKSB7XG4gICAgICAgICAgICByZXR1cm4gc3RlcDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGl0ZXJhdGlvbnMgJSAyID9cbiAgICAgICAgICBpdGVyYXRvclZhbHVlKHR5cGUsIGl0ZXJhdGlvbnMrKywgc2VwYXJhdG9yKSA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBpdGVyYXRpb25zKyssIHN0ZXAudmFsdWUsIHN0ZXApO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICByZXR1cm4gaW50ZXJwb3NlZFNlcXVlbmNlO1xuICB9XG5cblxuICBmdW5jdGlvbiBzb3J0RmFjdG9yeShpdGVyYWJsZSwgY29tcGFyYXRvciwgbWFwcGVyKSB7XG4gICAgaWYgKCFjb21wYXJhdG9yKSB7XG4gICAgICBjb21wYXJhdG9yID0gZGVmYXVsdENvbXBhcmF0b3I7XG4gICAgfVxuICAgIHZhciBpc0tleWVkSXRlcmFibGUgPSBpc0tleWVkKGl0ZXJhYmxlKTtcbiAgICB2YXIgaW5kZXggPSAwO1xuICAgIHZhciBlbnRyaWVzID0gaXRlcmFibGUudG9TZXEoKS5tYXAoXG4gICAgICBmdW5jdGlvbih2LCBrKSAge3JldHVybiBbaywgdiwgaW5kZXgrKywgbWFwcGVyID8gbWFwcGVyKHYsIGssIGl0ZXJhYmxlKSA6IHZdfVxuICAgICkudG9BcnJheSgpO1xuICAgIGVudHJpZXMuc29ydChmdW5jdGlvbihhLCBiKSAge3JldHVybiBjb21wYXJhdG9yKGFbM10sIGJbM10pIHx8IGFbMl0gLSBiWzJdfSkuZm9yRWFjaChcbiAgICAgIGlzS2V5ZWRJdGVyYWJsZSA/XG4gICAgICBmdW5jdGlvbih2LCBpKSAgeyBlbnRyaWVzW2ldLmxlbmd0aCA9IDI7IH0gOlxuICAgICAgZnVuY3Rpb24odiwgaSkgIHsgZW50cmllc1tpXSA9IHZbMV07IH1cbiAgICApO1xuICAgIHJldHVybiBpc0tleWVkSXRlcmFibGUgPyBLZXllZFNlcShlbnRyaWVzKSA6XG4gICAgICBpc0luZGV4ZWQoaXRlcmFibGUpID8gSW5kZXhlZFNlcShlbnRyaWVzKSA6XG4gICAgICBTZXRTZXEoZW50cmllcyk7XG4gIH1cblxuXG4gIGZ1bmN0aW9uIG1heEZhY3RvcnkoaXRlcmFibGUsIGNvbXBhcmF0b3IsIG1hcHBlcikge1xuICAgIGlmICghY29tcGFyYXRvcikge1xuICAgICAgY29tcGFyYXRvciA9IGRlZmF1bHRDb21wYXJhdG9yO1xuICAgIH1cbiAgICBpZiAobWFwcGVyKSB7XG4gICAgICB2YXIgZW50cnkgPSBpdGVyYWJsZS50b1NlcSgpXG4gICAgICAgIC5tYXAoZnVuY3Rpb24odiwgaykgIHtyZXR1cm4gW3YsIG1hcHBlcih2LCBrLCBpdGVyYWJsZSldfSlcbiAgICAgICAgLnJlZHVjZShmdW5jdGlvbihhLCBiKSAge3JldHVybiBtYXhDb21wYXJlKGNvbXBhcmF0b3IsIGFbMV0sIGJbMV0pID8gYiA6IGF9KTtcbiAgICAgIHJldHVybiBlbnRyeSAmJiBlbnRyeVswXTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGl0ZXJhYmxlLnJlZHVjZShmdW5jdGlvbihhLCBiKSAge3JldHVybiBtYXhDb21wYXJlKGNvbXBhcmF0b3IsIGEsIGIpID8gYiA6IGF9KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBtYXhDb21wYXJlKGNvbXBhcmF0b3IsIGEsIGIpIHtcbiAgICB2YXIgY29tcCA9IGNvbXBhcmF0b3IoYiwgYSk7XG4gICAgLy8gYiBpcyBjb25zaWRlcmVkIHRoZSBuZXcgbWF4IGlmIHRoZSBjb21wYXJhdG9yIGRlY2xhcmVzIHRoZW0gZXF1YWwsIGJ1dFxuICAgIC8vIHRoZXkgYXJlIG5vdCBlcXVhbCBhbmQgYiBpcyBpbiBmYWN0IGEgbnVsbGlzaCB2YWx1ZS5cbiAgICByZXR1cm4gKGNvbXAgPT09IDAgJiYgYiAhPT0gYSAmJiAoYiA9PT0gdW5kZWZpbmVkIHx8IGIgPT09IG51bGwgfHwgYiAhPT0gYikpIHx8IGNvbXAgPiAwO1xuICB9XG5cblxuICBmdW5jdGlvbiB6aXBXaXRoRmFjdG9yeShrZXlJdGVyLCB6aXBwZXIsIGl0ZXJzKSB7XG4gICAgdmFyIHppcFNlcXVlbmNlID0gbWFrZVNlcXVlbmNlKGtleUl0ZXIpO1xuICAgIHppcFNlcXVlbmNlLnNpemUgPSBuZXcgQXJyYXlTZXEoaXRlcnMpLm1hcChmdW5jdGlvbihpICkge3JldHVybiBpLnNpemV9KS5taW4oKTtcbiAgICAvLyBOb3RlOiB0aGlzIGEgZ2VuZXJpYyBiYXNlIGltcGxlbWVudGF0aW9uIG9mIF9faXRlcmF0ZSBpbiB0ZXJtcyBvZlxuICAgIC8vIF9faXRlcmF0b3Igd2hpY2ggbWF5IGJlIG1vcmUgZ2VuZXJpY2FsbHkgdXNlZnVsIGluIHRoZSBmdXR1cmUuXG4gICAgemlwU2VxdWVuY2UuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIC8qIGdlbmVyaWM6XG4gICAgICB2YXIgaXRlcmF0b3IgPSB0aGlzLl9faXRlcmF0b3IoSVRFUkFURV9FTlRSSUVTLCByZXZlcnNlKTtcbiAgICAgIHZhciBzdGVwO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgd2hpbGUgKCEoc3RlcCA9IGl0ZXJhdG9yLm5leHQoKSkuZG9uZSkge1xuICAgICAgICBpdGVyYXRpb25zKys7XG4gICAgICAgIGlmIChmbihzdGVwLnZhbHVlWzFdLCBzdGVwLnZhbHVlWzBdLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgICAqL1xuICAgICAgLy8gaW5kZXhlZDpcbiAgICAgIHZhciBpdGVyYXRvciA9IHRoaXMuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUywgcmV2ZXJzZSk7XG4gICAgICB2YXIgc3RlcDtcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHdoaWxlICghKHN0ZXAgPSBpdGVyYXRvci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgaWYgKGZuKHN0ZXAudmFsdWUsIGl0ZXJhdGlvbnMrKywgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpdGVyYXRpb25zO1xuICAgIH07XG4gICAgemlwU2VxdWVuY2UuX19pdGVyYXRvclVuY2FjaGVkID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgdmFyIGl0ZXJhdG9ycyA9IGl0ZXJzLm1hcChmdW5jdGlvbihpIClcbiAgICAgICAge3JldHVybiAoaSA9IEl0ZXJhYmxlKGkpLCBnZXRJdGVyYXRvcihyZXZlcnNlID8gaS5yZXZlcnNlKCkgOiBpKSl9XG4gICAgICApO1xuICAgICAgdmFyIGl0ZXJhdGlvbnMgPSAwO1xuICAgICAgdmFyIGlzRG9uZSA9IGZhbHNlO1xuICAgICAgcmV0dXJuIG5ldyBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgdmFyIHN0ZXBzO1xuICAgICAgICBpZiAoIWlzRG9uZSkge1xuICAgICAgICAgIHN0ZXBzID0gaXRlcmF0b3JzLm1hcChmdW5jdGlvbihpICkge3JldHVybiBpLm5leHQoKX0pO1xuICAgICAgICAgIGlzRG9uZSA9IHN0ZXBzLnNvbWUoZnVuY3Rpb24ocyApIHtyZXR1cm4gcy5kb25lfSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzRG9uZSkge1xuICAgICAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZShcbiAgICAgICAgICB0eXBlLFxuICAgICAgICAgIGl0ZXJhdGlvbnMrKyxcbiAgICAgICAgICB6aXBwZXIuYXBwbHkobnVsbCwgc3RlcHMubWFwKGZ1bmN0aW9uKHMgKSB7cmV0dXJuIHMudmFsdWV9KSlcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH07XG4gICAgcmV0dXJuIHppcFNlcXVlbmNlXG4gIH1cblxuXG4gIC8vICNwcmFnbWEgSGVscGVyIEZ1bmN0aW9uc1xuXG4gIGZ1bmN0aW9uIHJlaWZ5KGl0ZXIsIHNlcSkge1xuICAgIHJldHVybiBpc1NlcShpdGVyKSA/IHNlcSA6IGl0ZXIuY29uc3RydWN0b3Ioc2VxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHZhbGlkYXRlRW50cnkoZW50cnkpIHtcbiAgICBpZiAoZW50cnkgIT09IE9iamVjdChlbnRyeSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0V4cGVjdGVkIFtLLCBWXSB0dXBsZTogJyArIGVudHJ5KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZXNvbHZlU2l6ZShpdGVyKSB7XG4gICAgYXNzZXJ0Tm90SW5maW5pdGUoaXRlci5zaXplKTtcbiAgICByZXR1cm4gZW5zdXJlU2l6ZShpdGVyKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGl0ZXJhYmxlQ2xhc3MoaXRlcmFibGUpIHtcbiAgICByZXR1cm4gaXNLZXllZChpdGVyYWJsZSkgPyBLZXllZEl0ZXJhYmxlIDpcbiAgICAgIGlzSW5kZXhlZChpdGVyYWJsZSkgPyBJbmRleGVkSXRlcmFibGUgOlxuICAgICAgU2V0SXRlcmFibGU7XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlU2VxdWVuY2UoaXRlcmFibGUpIHtcbiAgICByZXR1cm4gT2JqZWN0LmNyZWF0ZShcbiAgICAgIChcbiAgICAgICAgaXNLZXllZChpdGVyYWJsZSkgPyBLZXllZFNlcSA6XG4gICAgICAgIGlzSW5kZXhlZChpdGVyYWJsZSkgPyBJbmRleGVkU2VxIDpcbiAgICAgICAgU2V0U2VxXG4gICAgICApLnByb3RvdHlwZVxuICAgICk7XG4gIH1cblxuICBmdW5jdGlvbiBjYWNoZVJlc3VsdFRocm91Z2goKSB7XG4gICAgaWYgKHRoaXMuX2l0ZXIuY2FjaGVSZXN1bHQpIHtcbiAgICAgIHRoaXMuX2l0ZXIuY2FjaGVSZXN1bHQoKTtcbiAgICAgIHRoaXMuc2l6ZSA9IHRoaXMuX2l0ZXIuc2l6ZTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gU2VxLnByb3RvdHlwZS5jYWNoZVJlc3VsdC5jYWxsKHRoaXMpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRDb21wYXJhdG9yKGEsIGIpIHtcbiAgICByZXR1cm4gYSA+IGIgPyAxIDogYSA8IGIgPyAtMSA6IDA7XG4gIH1cblxuICBmdW5jdGlvbiBmb3JjZUl0ZXJhdG9yKGtleVBhdGgpIHtcbiAgICB2YXIgaXRlciA9IGdldEl0ZXJhdG9yKGtleVBhdGgpO1xuICAgIGlmICghaXRlcikge1xuICAgICAgLy8gQXJyYXkgbWlnaHQgbm90IGJlIGl0ZXJhYmxlIGluIHRoaXMgZW52aXJvbm1lbnQsIHNvIHdlIG5lZWQgYSBmYWxsYmFja1xuICAgICAgLy8gdG8gb3VyIHdyYXBwZWQgdHlwZS5cbiAgICAgIGlmICghaXNBcnJheUxpa2Uoa2V5UGF0aCkpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRXhwZWN0ZWQgaXRlcmFibGUgb3IgYXJyYXktbGlrZTogJyArIGtleVBhdGgpO1xuICAgICAgfVxuICAgICAgaXRlciA9IGdldEl0ZXJhdG9yKEl0ZXJhYmxlKGtleVBhdGgpKTtcbiAgICB9XG4gICAgcmV0dXJuIGl0ZXI7XG4gIH1cblxuICBjcmVhdGVDbGFzcyhzcmNfTWFwX19NYXAsIEtleWVkQ29sbGVjdGlvbik7XG5cbiAgICAvLyBAcHJhZ21hIENvbnN0cnVjdGlvblxuXG4gICAgZnVuY3Rpb24gc3JjX01hcF9fTWFwKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/IGVtcHR5TWFwKCkgOlxuICAgICAgICBpc01hcCh2YWx1ZSkgJiYgIWlzT3JkZXJlZCh2YWx1ZSkgPyB2YWx1ZSA6XG4gICAgICAgIGVtcHR5TWFwKCkud2l0aE11dGF0aW9ucyhmdW5jdGlvbihtYXAgKSB7XG4gICAgICAgICAgdmFyIGl0ZXIgPSBLZXllZEl0ZXJhYmxlKHZhbHVlKTtcbiAgICAgICAgICBhc3NlcnROb3RJbmZpbml0ZShpdGVyLnNpemUpO1xuICAgICAgICAgIGl0ZXIuZm9yRWFjaChmdW5jdGlvbih2LCBrKSAge3JldHVybiBtYXAuc2V0KGssIHYpfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ01hcCB7JywgJ30nKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBBY2Nlc3NcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oaywgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9yb290ID9cbiAgICAgICAgdGhpcy5fcm9vdC5nZXQoMCwgdW5kZWZpbmVkLCBrLCBub3RTZXRWYWx1ZSkgOlxuICAgICAgICBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBNb2RpZmljYXRpb25cblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oaywgdikge1xuICAgICAgcmV0dXJuIHVwZGF0ZU1hcCh0aGlzLCBrLCB2KTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5zZXRJbiA9IGZ1bmN0aW9uKGtleVBhdGgsIHYpIHtcbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUluKGtleVBhdGgsIE5PVF9TRVQsIGZ1bmN0aW9uKCkgIHtyZXR1cm4gdn0pO1xuICAgIH07XG5cbiAgICBzcmNfTWFwX19NYXAucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKGspIHtcbiAgICAgIHJldHVybiB1cGRhdGVNYXAodGhpcywgaywgTk9UX1NFVCk7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUuZGVsZXRlSW4gPSBmdW5jdGlvbihrZXlQYXRoKSB7XG4gICAgICByZXR1cm4gdGhpcy51cGRhdGVJbihrZXlQYXRoLCBmdW5jdGlvbigpICB7cmV0dXJuIE5PVF9TRVR9KTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihrLCBub3RTZXRWYWx1ZSwgdXBkYXRlcikge1xuICAgICAgcmV0dXJuIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgP1xuICAgICAgICBrKHRoaXMpIDpcbiAgICAgICAgdGhpcy51cGRhdGVJbihba10sIG5vdFNldFZhbHVlLCB1cGRhdGVyKTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS51cGRhdGVJbiA9IGZ1bmN0aW9uKGtleVBhdGgsIG5vdFNldFZhbHVlLCB1cGRhdGVyKSB7XG4gICAgICBpZiAoIXVwZGF0ZXIpIHtcbiAgICAgICAgdXBkYXRlciA9IG5vdFNldFZhbHVlO1xuICAgICAgICBub3RTZXRWYWx1ZSA9IHVuZGVmaW5lZDtcbiAgICAgIH1cbiAgICAgIHZhciB1cGRhdGVkVmFsdWUgPSB1cGRhdGVJbkRlZXBNYXAoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIGZvcmNlSXRlcmF0b3Ioa2V5UGF0aCksXG4gICAgICAgIG5vdFNldFZhbHVlLFxuICAgICAgICB1cGRhdGVyXG4gICAgICApO1xuICAgICAgcmV0dXJuIHVwZGF0ZWRWYWx1ZSA9PT0gTk9UX1NFVCA/IHVuZGVmaW5lZCA6IHVwZGF0ZWRWYWx1ZTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICB0aGlzLnNpemUgPSAwO1xuICAgICAgICB0aGlzLl9yb290ID0gbnVsbDtcbiAgICAgICAgdGhpcy5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW1wdHlNYXAoKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBDb21wb3NpdGlvblxuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uKC8qLi4uaXRlcnMqLykge1xuICAgICAgcmV0dXJuIG1lcmdlSW50b01hcFdpdGgodGhpcywgdW5kZWZpbmVkLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBzcmNfTWFwX19NYXAucHJvdG90eXBlLm1lcmdlV2l0aCA9IGZ1bmN0aW9uKG1lcmdlcikge3ZhciBpdGVycyA9IFNMSUNFJDAuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgcmV0dXJuIG1lcmdlSW50b01hcFdpdGgodGhpcywgbWVyZ2VyLCBpdGVycyk7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUubWVyZ2VJbiA9IGZ1bmN0aW9uKGtleVBhdGgpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUluKFxuICAgICAgICBrZXlQYXRoLFxuICAgICAgICBlbXB0eU1hcCgpLFxuICAgICAgICBmdW5jdGlvbihtICkge3JldHVybiB0eXBlb2YgbS5tZXJnZSA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgbS5tZXJnZS5hcHBseShtLCBpdGVycykgOlxuICAgICAgICAgIGl0ZXJzW2l0ZXJzLmxlbmd0aCAtIDFdfVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5tZXJnZURlZXAgPSBmdW5jdGlvbigvKi4uLml0ZXJzKi8pIHtcbiAgICAgIHJldHVybiBtZXJnZUludG9NYXBXaXRoKHRoaXMsIGRlZXBNZXJnZXIodW5kZWZpbmVkKSwgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5tZXJnZURlZXBXaXRoID0gZnVuY3Rpb24obWVyZ2VyKSB7dmFyIGl0ZXJzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICByZXR1cm4gbWVyZ2VJbnRvTWFwV2l0aCh0aGlzLCBkZWVwTWVyZ2VyKG1lcmdlciksIGl0ZXJzKTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5tZXJnZURlZXBJbiA9IGZ1bmN0aW9uKGtleVBhdGgpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiB0aGlzLnVwZGF0ZUluKFxuICAgICAgICBrZXlQYXRoLFxuICAgICAgICBlbXB0eU1hcCgpLFxuICAgICAgICBmdW5jdGlvbihtICkge3JldHVybiB0eXBlb2YgbS5tZXJnZURlZXAgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgIG0ubWVyZ2VEZWVwLmFwcGx5KG0sIGl0ZXJzKSA6XG4gICAgICAgICAgaXRlcnNbaXRlcnMubGVuZ3RoIC0gMV19XG4gICAgICApO1xuICAgIH07XG5cbiAgICBzcmNfTWFwX19NYXAucHJvdG90eXBlLnNvcnQgPSBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICAvLyBMYXRlIGJpbmRpbmdcbiAgICAgIHJldHVybiBPcmRlcmVkTWFwKHNvcnRGYWN0b3J5KHRoaXMsIGNvbXBhcmF0b3IpKTtcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5zb3J0QnkgPSBmdW5jdGlvbihtYXBwZXIsIGNvbXBhcmF0b3IpIHtcbiAgICAgIC8vIExhdGUgYmluZGluZ1xuICAgICAgcmV0dXJuIE9yZGVyZWRNYXAoc29ydEZhY3RvcnkodGhpcywgY29tcGFyYXRvciwgbWFwcGVyKSk7XG4gICAgfTtcblxuICAgIC8vIEBwcmFnbWEgTXV0YWJpbGl0eVxuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS53aXRoTXV0YXRpb25zID0gZnVuY3Rpb24oZm4pIHtcbiAgICAgIHZhciBtdXRhYmxlID0gdGhpcy5hc011dGFibGUoKTtcbiAgICAgIGZuKG11dGFibGUpO1xuICAgICAgcmV0dXJuIG11dGFibGUud2FzQWx0ZXJlZCgpID8gbXV0YWJsZS5fX2Vuc3VyZU93bmVyKHRoaXMuX19vd25lcklEKSA6IHRoaXM7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUuYXNNdXRhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX293bmVySUQgPyB0aGlzIDogdGhpcy5fX2Vuc3VyZU93bmVyKG5ldyBPd25lcklEKCkpO1xuICAgIH07XG5cbiAgICBzcmNfTWFwX19NYXAucHJvdG90eXBlLmFzSW1tdXRhYmxlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2Vuc3VyZU93bmVyKCk7XG4gICAgfTtcblxuICAgIHNyY19NYXBfX01hcC5wcm90b3R5cGUud2FzQWx0ZXJlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19hbHRlcmVkO1xuICAgIH07XG5cbiAgICBzcmNfTWFwX19NYXAucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICByZXR1cm4gbmV3IE1hcEl0ZXJhdG9yKHRoaXMsIHR5cGUsIHJldmVyc2UpO1xuICAgIH07XG5cbiAgICBzcmNfTWFwX19NYXAucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB0aGlzLl9yb290ICYmIHRoaXMuX3Jvb3QuaXRlcmF0ZShmdW5jdGlvbihlbnRyeSApIHtcbiAgICAgICAgaXRlcmF0aW9ucysrO1xuICAgICAgICByZXR1cm4gZm4oZW50cnlbMV0sIGVudHJ5WzBdLCB0aGlzJDApO1xuICAgICAgfSwgcmV2ZXJzZSk7XG4gICAgICByZXR1cm4gaXRlcmF0aW9ucztcbiAgICB9O1xuXG4gICAgc3JjX01hcF9fTWFwLnByb3RvdHlwZS5fX2Vuc3VyZU93bmVyID0gZnVuY3Rpb24ob3duZXJJRCkge1xuICAgICAgaWYgKG93bmVySUQgPT09IHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaWYgKCFvd25lcklEKSB7XG4gICAgICAgIHRoaXMuX19vd25lcklEID0gb3duZXJJRDtcbiAgICAgICAgdGhpcy5fX2FsdGVyZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gbWFrZU1hcCh0aGlzLnNpemUsIHRoaXMuX3Jvb3QsIG93bmVySUQsIHRoaXMuX19oYXNoKTtcbiAgICB9O1xuXG5cbiAgZnVuY3Rpb24gaXNNYXAobWF5YmVNYXApIHtcbiAgICByZXR1cm4gISEobWF5YmVNYXAgJiYgbWF5YmVNYXBbSVNfTUFQX1NFTlRJTkVMXSk7XG4gIH1cblxuICBzcmNfTWFwX19NYXAuaXNNYXAgPSBpc01hcDtcblxuICB2YXIgSVNfTUFQX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfTUFQX19AQCc7XG5cbiAgdmFyIE1hcFByb3RvdHlwZSA9IHNyY19NYXBfX01hcC5wcm90b3R5cGU7XG4gIE1hcFByb3RvdHlwZVtJU19NQVBfU0VOVElORUxdID0gdHJ1ZTtcbiAgTWFwUHJvdG90eXBlW0RFTEVURV0gPSBNYXBQcm90b3R5cGUucmVtb3ZlO1xuICBNYXBQcm90b3R5cGUucmVtb3ZlSW4gPSBNYXBQcm90b3R5cGUuZGVsZXRlSW47XG5cblxuICAvLyAjcHJhZ21hIFRyaWUgTm9kZXNcblxuXG5cbiAgICBmdW5jdGlvbiBBcnJheU1hcE5vZGUob3duZXJJRCwgZW50cmllcykge1xuICAgICAgdGhpcy5vd25lcklEID0gb3duZXJJRDtcbiAgICAgIHRoaXMuZW50cmllcyA9IGVudHJpZXM7XG4gICAgfVxuXG4gICAgQXJyYXlNYXBOb2RlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihzaGlmdCwga2V5SGFzaCwga2V5LCBub3RTZXRWYWx1ZSkge1xuICAgICAgdmFyIGVudHJpZXMgPSB0aGlzLmVudHJpZXM7XG4gICAgICBmb3IgKHZhciBpaSA9IDAsIGxlbiA9IGVudHJpZXMubGVuZ3RoOyBpaSA8IGxlbjsgaWkrKykge1xuICAgICAgICBpZiAoaXMoa2V5LCBlbnRyaWVzW2lpXVswXSkpIHtcbiAgICAgICAgICByZXR1cm4gZW50cmllc1tpaV1bMV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgQXJyYXlNYXBOb2RlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihvd25lcklELCBzaGlmdCwga2V5SGFzaCwga2V5LCB2YWx1ZSwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpIHtcbiAgICAgIHZhciByZW1vdmVkID0gdmFsdWUgPT09IE5PVF9TRVQ7XG5cbiAgICAgIHZhciBlbnRyaWVzID0gdGhpcy5lbnRyaWVzO1xuICAgICAgdmFyIGlkeCA9IDA7XG4gICAgICBmb3IgKHZhciBsZW4gPSBlbnRyaWVzLmxlbmd0aDsgaWR4IDwgbGVuOyBpZHgrKykge1xuICAgICAgICBpZiAoaXMoa2V5LCBlbnRyaWVzW2lkeF1bMF0pKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHZhciBleGlzdHMgPSBpZHggPCBsZW47XG5cbiAgICAgIGlmIChleGlzdHMgPyBlbnRyaWVzW2lkeF1bMV0gPT09IHZhbHVlIDogcmVtb3ZlZCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgU2V0UmVmKGRpZEFsdGVyKTtcbiAgICAgIChyZW1vdmVkIHx8ICFleGlzdHMpICYmIFNldFJlZihkaWRDaGFuZ2VTaXplKTtcblxuICAgICAgaWYgKHJlbW92ZWQgJiYgZW50cmllcy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgcmV0dXJuOyAvLyB1bmRlZmluZWRcbiAgICAgIH1cblxuICAgICAgaWYgKCFleGlzdHMgJiYgIXJlbW92ZWQgJiYgZW50cmllcy5sZW5ndGggPj0gTUFYX0FSUkFZX01BUF9TSVpFKSB7XG4gICAgICAgIHJldHVybiBjcmVhdGVOb2Rlcyhvd25lcklELCBlbnRyaWVzLCBrZXksIHZhbHVlKTtcbiAgICAgIH1cblxuICAgICAgdmFyIGlzRWRpdGFibGUgPSBvd25lcklEICYmIG93bmVySUQgPT09IHRoaXMub3duZXJJRDtcbiAgICAgIHZhciBuZXdFbnRyaWVzID0gaXNFZGl0YWJsZSA/IGVudHJpZXMgOiBhcnJDb3B5KGVudHJpZXMpO1xuXG4gICAgICBpZiAoZXhpc3RzKSB7XG4gICAgICAgIGlmIChyZW1vdmVkKSB7XG4gICAgICAgICAgaWR4ID09PSBsZW4gLSAxID8gbmV3RW50cmllcy5wb3AoKSA6IChuZXdFbnRyaWVzW2lkeF0gPSBuZXdFbnRyaWVzLnBvcCgpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZXdFbnRyaWVzW2lkeF0gPSBba2V5LCB2YWx1ZV07XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIG5ld0VudHJpZXMucHVzaChba2V5LCB2YWx1ZV0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNFZGl0YWJsZSkge1xuICAgICAgICB0aGlzLmVudHJpZXMgPSBuZXdFbnRyaWVzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBBcnJheU1hcE5vZGUob3duZXJJRCwgbmV3RW50cmllcyk7XG4gICAgfTtcblxuXG5cblxuICAgIGZ1bmN0aW9uIEJpdG1hcEluZGV4ZWROb2RlKG93bmVySUQsIGJpdG1hcCwgbm9kZXMpIHtcbiAgICAgIHRoaXMub3duZXJJRCA9IG93bmVySUQ7XG4gICAgICB0aGlzLmJpdG1hcCA9IGJpdG1hcDtcbiAgICAgIHRoaXMubm9kZXMgPSBub2RlcztcbiAgICB9XG5cbiAgICBCaXRtYXBJbmRleGVkTm9kZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oc2hpZnQsIGtleUhhc2gsIGtleSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIGlmIChrZXlIYXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAga2V5SGFzaCA9IGhhc2goa2V5KTtcbiAgICAgIH1cbiAgICAgIHZhciBiaXQgPSAoMSA8PCAoKHNoaWZ0ID09PSAwID8ga2V5SGFzaCA6IGtleUhhc2ggPj4+IHNoaWZ0KSAmIE1BU0spKTtcbiAgICAgIHZhciBiaXRtYXAgPSB0aGlzLmJpdG1hcDtcbiAgICAgIHJldHVybiAoYml0bWFwICYgYml0KSA9PT0gMCA/IG5vdFNldFZhbHVlIDpcbiAgICAgICAgdGhpcy5ub2Rlc1twb3BDb3VudChiaXRtYXAgJiAoYml0IC0gMSkpXS5nZXQoc2hpZnQgKyBTSElGVCwga2V5SGFzaCwga2V5LCBub3RTZXRWYWx1ZSk7XG4gICAgfTtcblxuICAgIEJpdG1hcEluZGV4ZWROb2RlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihvd25lcklELCBzaGlmdCwga2V5SGFzaCwga2V5LCB2YWx1ZSwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpIHtcbiAgICAgIGlmIChrZXlIYXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAga2V5SGFzaCA9IGhhc2goa2V5KTtcbiAgICAgIH1cbiAgICAgIHZhciBrZXlIYXNoRnJhZyA9IChzaGlmdCA9PT0gMCA/IGtleUhhc2ggOiBrZXlIYXNoID4+PiBzaGlmdCkgJiBNQVNLO1xuICAgICAgdmFyIGJpdCA9IDEgPDwga2V5SGFzaEZyYWc7XG4gICAgICB2YXIgYml0bWFwID0gdGhpcy5iaXRtYXA7XG4gICAgICB2YXIgZXhpc3RzID0gKGJpdG1hcCAmIGJpdCkgIT09IDA7XG5cbiAgICAgIGlmICghZXhpc3RzICYmIHZhbHVlID09PSBOT1RfU0VUKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICB2YXIgaWR4ID0gcG9wQ291bnQoYml0bWFwICYgKGJpdCAtIDEpKTtcbiAgICAgIHZhciBub2RlcyA9IHRoaXMubm9kZXM7XG4gICAgICB2YXIgbm9kZSA9IGV4aXN0cyA/IG5vZGVzW2lkeF0gOiB1bmRlZmluZWQ7XG4gICAgICB2YXIgbmV3Tm9kZSA9IHVwZGF0ZU5vZGUobm9kZSwgb3duZXJJRCwgc2hpZnQgKyBTSElGVCwga2V5SGFzaCwga2V5LCB2YWx1ZSwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpO1xuXG4gICAgICBpZiAobmV3Tm9kZSA9PT0gbm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgaWYgKCFleGlzdHMgJiYgbmV3Tm9kZSAmJiBub2Rlcy5sZW5ndGggPj0gTUFYX0JJVE1BUF9JTkRFWEVEX1NJWkUpIHtcbiAgICAgICAgcmV0dXJuIGV4cGFuZE5vZGVzKG93bmVySUQsIG5vZGVzLCBiaXRtYXAsIGtleUhhc2hGcmFnLCBuZXdOb2RlKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGV4aXN0cyAmJiAhbmV3Tm9kZSAmJiBub2Rlcy5sZW5ndGggPT09IDIgJiYgaXNMZWFmTm9kZShub2Rlc1tpZHggXiAxXSkpIHtcbiAgICAgICAgcmV0dXJuIG5vZGVzW2lkeCBeIDFdO1xuICAgICAgfVxuXG4gICAgICBpZiAoZXhpc3RzICYmIG5ld05vZGUgJiYgbm9kZXMubGVuZ3RoID09PSAxICYmIGlzTGVhZk5vZGUobmV3Tm9kZSkpIHtcbiAgICAgICAgcmV0dXJuIG5ld05vZGU7XG4gICAgICB9XG5cbiAgICAgIHZhciBpc0VkaXRhYmxlID0gb3duZXJJRCAmJiBvd25lcklEID09PSB0aGlzLm93bmVySUQ7XG4gICAgICB2YXIgbmV3Qml0bWFwID0gZXhpc3RzID8gbmV3Tm9kZSA/IGJpdG1hcCA6IGJpdG1hcCBeIGJpdCA6IGJpdG1hcCB8IGJpdDtcbiAgICAgIHZhciBuZXdOb2RlcyA9IGV4aXN0cyA/IG5ld05vZGUgP1xuICAgICAgICBzZXRJbihub2RlcywgaWR4LCBuZXdOb2RlLCBpc0VkaXRhYmxlKSA6XG4gICAgICAgIHNwbGljZU91dChub2RlcywgaWR4LCBpc0VkaXRhYmxlKSA6XG4gICAgICAgIHNwbGljZUluKG5vZGVzLCBpZHgsIG5ld05vZGUsIGlzRWRpdGFibGUpO1xuXG4gICAgICBpZiAoaXNFZGl0YWJsZSkge1xuICAgICAgICB0aGlzLmJpdG1hcCA9IG5ld0JpdG1hcDtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG5ld05vZGVzO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIG5ldyBCaXRtYXBJbmRleGVkTm9kZShvd25lcklELCBuZXdCaXRtYXAsIG5ld05vZGVzKTtcbiAgICB9O1xuXG5cblxuXG4gICAgZnVuY3Rpb24gSGFzaEFycmF5TWFwTm9kZShvd25lcklELCBjb3VudCwgbm9kZXMpIHtcbiAgICAgIHRoaXMub3duZXJJRCA9IG93bmVySUQ7XG4gICAgICB0aGlzLmNvdW50ID0gY291bnQ7XG4gICAgICB0aGlzLm5vZGVzID0gbm9kZXM7XG4gICAgfVxuXG4gICAgSGFzaEFycmF5TWFwTm9kZS5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oc2hpZnQsIGtleUhhc2gsIGtleSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIGlmIChrZXlIYXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAga2V5SGFzaCA9IGhhc2goa2V5KTtcbiAgICAgIH1cbiAgICAgIHZhciBpZHggPSAoc2hpZnQgPT09IDAgPyBrZXlIYXNoIDoga2V5SGFzaCA+Pj4gc2hpZnQpICYgTUFTSztcbiAgICAgIHZhciBub2RlID0gdGhpcy5ub2Rlc1tpZHhdO1xuICAgICAgcmV0dXJuIG5vZGUgPyBub2RlLmdldChzaGlmdCArIFNISUZULCBrZXlIYXNoLCBrZXksIG5vdFNldFZhbHVlKSA6IG5vdFNldFZhbHVlO1xuICAgIH07XG5cbiAgICBIYXNoQXJyYXlNYXBOb2RlLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihvd25lcklELCBzaGlmdCwga2V5SGFzaCwga2V5LCB2YWx1ZSwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpIHtcbiAgICAgIGlmIChrZXlIYXNoID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAga2V5SGFzaCA9IGhhc2goa2V5KTtcbiAgICAgIH1cbiAgICAgIHZhciBpZHggPSAoc2hpZnQgPT09IDAgPyBrZXlIYXNoIDoga2V5SGFzaCA+Pj4gc2hpZnQpICYgTUFTSztcbiAgICAgIHZhciByZW1vdmVkID0gdmFsdWUgPT09IE5PVF9TRVQ7XG4gICAgICB2YXIgbm9kZXMgPSB0aGlzLm5vZGVzO1xuICAgICAgdmFyIG5vZGUgPSBub2Rlc1tpZHhdO1xuXG4gICAgICBpZiAocmVtb3ZlZCAmJiAhbm9kZSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgdmFyIG5ld05vZGUgPSB1cGRhdGVOb2RlKG5vZGUsIG93bmVySUQsIHNoaWZ0ICsgU0hJRlQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKTtcbiAgICAgIGlmIChuZXdOb2RlID09PSBub2RlKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICB2YXIgbmV3Q291bnQgPSB0aGlzLmNvdW50O1xuICAgICAgaWYgKCFub2RlKSB7XG4gICAgICAgIG5ld0NvdW50Kys7XG4gICAgICB9IGVsc2UgaWYgKCFuZXdOb2RlKSB7XG4gICAgICAgIG5ld0NvdW50LS07XG4gICAgICAgIGlmIChuZXdDb3VudCA8IE1JTl9IQVNIX0FSUkFZX01BUF9TSVpFKSB7XG4gICAgICAgICAgcmV0dXJuIHBhY2tOb2Rlcyhvd25lcklELCBub2RlcywgbmV3Q291bnQsIGlkeCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGlzRWRpdGFibGUgPSBvd25lcklEICYmIG93bmVySUQgPT09IHRoaXMub3duZXJJRDtcbiAgICAgIHZhciBuZXdOb2RlcyA9IHNldEluKG5vZGVzLCBpZHgsIG5ld05vZGUsIGlzRWRpdGFibGUpO1xuXG4gICAgICBpZiAoaXNFZGl0YWJsZSkge1xuICAgICAgICB0aGlzLmNvdW50ID0gbmV3Q291bnQ7XG4gICAgICAgIHRoaXMubm9kZXMgPSBuZXdOb2RlcztcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBuZXcgSGFzaEFycmF5TWFwTm9kZShvd25lcklELCBuZXdDb3VudCwgbmV3Tm9kZXMpO1xuICAgIH07XG5cblxuXG5cbiAgICBmdW5jdGlvbiBIYXNoQ29sbGlzaW9uTm9kZShvd25lcklELCBrZXlIYXNoLCBlbnRyaWVzKSB7XG4gICAgICB0aGlzLm93bmVySUQgPSBvd25lcklEO1xuICAgICAgdGhpcy5rZXlIYXNoID0ga2V5SGFzaDtcbiAgICAgIHRoaXMuZW50cmllcyA9IGVudHJpZXM7XG4gICAgfVxuXG4gICAgSGFzaENvbGxpc2lvbk5vZGUucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHNoaWZ0LCBrZXlIYXNoLCBrZXksIG5vdFNldFZhbHVlKSB7XG4gICAgICB2YXIgZW50cmllcyA9IHRoaXMuZW50cmllcztcbiAgICAgIGZvciAodmFyIGlpID0gMCwgbGVuID0gZW50cmllcy5sZW5ndGg7IGlpIDwgbGVuOyBpaSsrKSB7XG4gICAgICAgIGlmIChpcyhrZXksIGVudHJpZXNbaWldWzBdKSkge1xuICAgICAgICAgIHJldHVybiBlbnRyaWVzW2lpXVsxXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5vdFNldFZhbHVlO1xuICAgIH07XG5cbiAgICBIYXNoQ29sbGlzaW9uTm9kZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ob3duZXJJRCwgc2hpZnQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKSB7XG4gICAgICBpZiAoa2V5SGFzaCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGtleUhhc2ggPSBoYXNoKGtleSk7XG4gICAgICB9XG5cbiAgICAgIHZhciByZW1vdmVkID0gdmFsdWUgPT09IE5PVF9TRVQ7XG5cbiAgICAgIGlmIChrZXlIYXNoICE9PSB0aGlzLmtleUhhc2gpIHtcbiAgICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBTZXRSZWYoZGlkQWx0ZXIpO1xuICAgICAgICBTZXRSZWYoZGlkQ2hhbmdlU2l6ZSk7XG4gICAgICAgIHJldHVybiBtZXJnZUludG9Ob2RlKHRoaXMsIG93bmVySUQsIHNoaWZ0LCBrZXlIYXNoLCBba2V5LCB2YWx1ZV0pO1xuICAgICAgfVxuXG4gICAgICB2YXIgZW50cmllcyA9IHRoaXMuZW50cmllcztcbiAgICAgIHZhciBpZHggPSAwO1xuICAgICAgZm9yICh2YXIgbGVuID0gZW50cmllcy5sZW5ndGg7IGlkeCA8IGxlbjsgaWR4KyspIHtcbiAgICAgICAgaWYgKGlzKGtleSwgZW50cmllc1tpZHhdWzBdKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB2YXIgZXhpc3RzID0gaWR4IDwgbGVuO1xuXG4gICAgICBpZiAoZXhpc3RzID8gZW50cmllc1tpZHhdWzFdID09PSB2YWx1ZSA6IHJlbW92ZWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIFNldFJlZihkaWRBbHRlcik7XG4gICAgICAocmVtb3ZlZCB8fCAhZXhpc3RzKSAmJiBTZXRSZWYoZGlkQ2hhbmdlU2l6ZSk7XG5cbiAgICAgIGlmIChyZW1vdmVkICYmIGxlbiA9PT0gMikge1xuICAgICAgICByZXR1cm4gbmV3IFZhbHVlTm9kZShvd25lcklELCB0aGlzLmtleUhhc2gsIGVudHJpZXNbaWR4IF4gMV0pO1xuICAgICAgfVxuXG4gICAgICB2YXIgaXNFZGl0YWJsZSA9IG93bmVySUQgJiYgb3duZXJJRCA9PT0gdGhpcy5vd25lcklEO1xuICAgICAgdmFyIG5ld0VudHJpZXMgPSBpc0VkaXRhYmxlID8gZW50cmllcyA6IGFyckNvcHkoZW50cmllcyk7XG5cbiAgICAgIGlmIChleGlzdHMpIHtcbiAgICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgICBpZHggPT09IGxlbiAtIDEgPyBuZXdFbnRyaWVzLnBvcCgpIDogKG5ld0VudHJpZXNbaWR4XSA9IG5ld0VudHJpZXMucG9wKCkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld0VudHJpZXNbaWR4XSA9IFtrZXksIHZhbHVlXTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmV3RW50cmllcy5wdXNoKFtrZXksIHZhbHVlXSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChpc0VkaXRhYmxlKSB7XG4gICAgICAgIHRoaXMuZW50cmllcyA9IG5ld0VudHJpZXM7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gbmV3IEhhc2hDb2xsaXNpb25Ob2RlKG93bmVySUQsIHRoaXMua2V5SGFzaCwgbmV3RW50cmllcyk7XG4gICAgfTtcblxuXG5cblxuICAgIGZ1bmN0aW9uIFZhbHVlTm9kZShvd25lcklELCBrZXlIYXNoLCBlbnRyeSkge1xuICAgICAgdGhpcy5vd25lcklEID0gb3duZXJJRDtcbiAgICAgIHRoaXMua2V5SGFzaCA9IGtleUhhc2g7XG4gICAgICB0aGlzLmVudHJ5ID0gZW50cnk7XG4gICAgfVxuXG4gICAgVmFsdWVOb2RlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihzaGlmdCwga2V5SGFzaCwga2V5LCBub3RTZXRWYWx1ZSkge1xuICAgICAgcmV0dXJuIGlzKGtleSwgdGhpcy5lbnRyeVswXSkgPyB0aGlzLmVudHJ5WzFdIDogbm90U2V0VmFsdWU7XG4gICAgfTtcblxuICAgIFZhbHVlTm9kZS5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24ob3duZXJJRCwgc2hpZnQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKSB7XG4gICAgICB2YXIgcmVtb3ZlZCA9IHZhbHVlID09PSBOT1RfU0VUO1xuICAgICAgdmFyIGtleU1hdGNoID0gaXMoa2V5LCB0aGlzLmVudHJ5WzBdKTtcbiAgICAgIGlmIChrZXlNYXRjaCA/IHZhbHVlID09PSB0aGlzLmVudHJ5WzFdIDogcmVtb3ZlZCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgU2V0UmVmKGRpZEFsdGVyKTtcblxuICAgICAgaWYgKHJlbW92ZWQpIHtcbiAgICAgICAgU2V0UmVmKGRpZENoYW5nZVNpemUpO1xuICAgICAgICByZXR1cm47IC8vIHVuZGVmaW5lZFxuICAgICAgfVxuXG4gICAgICBpZiAoa2V5TWF0Y2gpIHtcbiAgICAgICAgaWYgKG93bmVySUQgJiYgb3duZXJJRCA9PT0gdGhpcy5vd25lcklEKSB7XG4gICAgICAgICAgdGhpcy5lbnRyeVsxXSA9IHZhbHVlO1xuICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgVmFsdWVOb2RlKG93bmVySUQsIHRoaXMua2V5SGFzaCwgW2tleSwgdmFsdWVdKTtcbiAgICAgIH1cblxuICAgICAgU2V0UmVmKGRpZENoYW5nZVNpemUpO1xuICAgICAgcmV0dXJuIG1lcmdlSW50b05vZGUodGhpcywgb3duZXJJRCwgc2hpZnQsIGhhc2goa2V5KSwgW2tleSwgdmFsdWVdKTtcbiAgICB9O1xuXG5cblxuICAvLyAjcHJhZ21hIEl0ZXJhdG9yc1xuXG4gIEFycmF5TWFwTm9kZS5wcm90b3R5cGUuaXRlcmF0ZSA9XG4gIEhhc2hDb2xsaXNpb25Ob2RlLnByb3RvdHlwZS5pdGVyYXRlID0gZnVuY3Rpb24gKGZuLCByZXZlcnNlKSB7XG4gICAgdmFyIGVudHJpZXMgPSB0aGlzLmVudHJpZXM7XG4gICAgZm9yICh2YXIgaWkgPSAwLCBtYXhJbmRleCA9IGVudHJpZXMubGVuZ3RoIC0gMTsgaWkgPD0gbWF4SW5kZXg7IGlpKyspIHtcbiAgICAgIGlmIChmbihlbnRyaWVzW3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIEJpdG1hcEluZGV4ZWROb2RlLnByb3RvdHlwZS5pdGVyYXRlID1cbiAgSGFzaEFycmF5TWFwTm9kZS5wcm90b3R5cGUuaXRlcmF0ZSA9IGZ1bmN0aW9uIChmbiwgcmV2ZXJzZSkge1xuICAgIHZhciBub2RlcyA9IHRoaXMubm9kZXM7XG4gICAgZm9yICh2YXIgaWkgPSAwLCBtYXhJbmRleCA9IG5vZGVzLmxlbmd0aCAtIDE7IGlpIDw9IG1heEluZGV4OyBpaSsrKSB7XG4gICAgICB2YXIgbm9kZSA9IG5vZGVzW3JldmVyc2UgPyBtYXhJbmRleCAtIGlpIDogaWldO1xuICAgICAgaWYgKG5vZGUgJiYgbm9kZS5pdGVyYXRlKGZuLCByZXZlcnNlKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIFZhbHVlTm9kZS5wcm90b3R5cGUuaXRlcmF0ZSA9IGZ1bmN0aW9uIChmbiwgcmV2ZXJzZSkge1xuICAgIHJldHVybiBmbih0aGlzLmVudHJ5KTtcbiAgfVxuXG4gIGNyZWF0ZUNsYXNzKE1hcEl0ZXJhdG9yLCBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yKTtcblxuICAgIGZ1bmN0aW9uIE1hcEl0ZXJhdG9yKG1hcCwgdHlwZSwgcmV2ZXJzZSkge1xuICAgICAgdGhpcy5fdHlwZSA9IHR5cGU7XG4gICAgICB0aGlzLl9yZXZlcnNlID0gcmV2ZXJzZTtcbiAgICAgIHRoaXMuX3N0YWNrID0gbWFwLl9yb290ICYmIG1hcEl0ZXJhdG9yRnJhbWUobWFwLl9yb290KTtcbiAgICB9XG5cbiAgICBNYXBJdGVyYXRvci5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHR5cGUgPSB0aGlzLl90eXBlO1xuICAgICAgdmFyIHN0YWNrID0gdGhpcy5fc3RhY2s7XG4gICAgICB3aGlsZSAoc3RhY2spIHtcbiAgICAgICAgdmFyIG5vZGUgPSBzdGFjay5ub2RlO1xuICAgICAgICB2YXIgaW5kZXggPSBzdGFjay5pbmRleCsrO1xuICAgICAgICB2YXIgbWF4SW5kZXg7XG4gICAgICAgIGlmIChub2RlLmVudHJ5KSB7XG4gICAgICAgICAgaWYgKGluZGV4ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbWFwSXRlcmF0b3JWYWx1ZSh0eXBlLCBub2RlLmVudHJ5KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZS5lbnRyaWVzKSB7XG4gICAgICAgICAgbWF4SW5kZXggPSBub2RlLmVudHJpZXMubGVuZ3RoIC0gMTtcbiAgICAgICAgICBpZiAoaW5kZXggPD0gbWF4SW5kZXgpIHtcbiAgICAgICAgICAgIHJldHVybiBtYXBJdGVyYXRvclZhbHVlKHR5cGUsIG5vZGUuZW50cmllc1t0aGlzLl9yZXZlcnNlID8gbWF4SW5kZXggLSBpbmRleCA6IGluZGV4XSk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1heEluZGV4ID0gbm9kZS5ub2Rlcy5sZW5ndGggLSAxO1xuICAgICAgICAgIGlmIChpbmRleCA8PSBtYXhJbmRleCkge1xuICAgICAgICAgICAgdmFyIHN1Yk5vZGUgPSBub2RlLm5vZGVzW3RoaXMuX3JldmVyc2UgPyBtYXhJbmRleCAtIGluZGV4IDogaW5kZXhdO1xuICAgICAgICAgICAgaWYgKHN1Yk5vZGUpIHtcbiAgICAgICAgICAgICAgaWYgKHN1Yk5vZGUuZW50cnkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWFwSXRlcmF0b3JWYWx1ZSh0eXBlLCBzdWJOb2RlLmVudHJ5KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzdGFjayA9IHRoaXMuX3N0YWNrID0gbWFwSXRlcmF0b3JGcmFtZShzdWJOb2RlLCBzdGFjayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhY2sgPSB0aGlzLl9zdGFjayA9IHRoaXMuX3N0YWNrLl9fcHJldjtcbiAgICAgIH1cbiAgICAgIHJldHVybiBpdGVyYXRvckRvbmUoKTtcbiAgICB9O1xuXG5cbiAgZnVuY3Rpb24gbWFwSXRlcmF0b3JWYWx1ZSh0eXBlLCBlbnRyeSkge1xuICAgIHJldHVybiBpdGVyYXRvclZhbHVlKHR5cGUsIGVudHJ5WzBdLCBlbnRyeVsxXSk7XG4gIH1cblxuICBmdW5jdGlvbiBtYXBJdGVyYXRvckZyYW1lKG5vZGUsIHByZXYpIHtcbiAgICByZXR1cm4ge1xuICAgICAgbm9kZTogbm9kZSxcbiAgICAgIGluZGV4OiAwLFxuICAgICAgX19wcmV2OiBwcmV2XG4gICAgfTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1ha2VNYXAoc2l6ZSwgcm9vdCwgb3duZXJJRCwgaGFzaCkge1xuICAgIHZhciBtYXAgPSBPYmplY3QuY3JlYXRlKE1hcFByb3RvdHlwZSk7XG4gICAgbWFwLnNpemUgPSBzaXplO1xuICAgIG1hcC5fcm9vdCA9IHJvb3Q7XG4gICAgbWFwLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgbWFwLl9faGFzaCA9IGhhc2g7XG4gICAgbWFwLl9fYWx0ZXJlZCA9IGZhbHNlO1xuICAgIHJldHVybiBtYXA7XG4gIH1cblxuICB2YXIgRU1QVFlfTUFQO1xuICBmdW5jdGlvbiBlbXB0eU1hcCgpIHtcbiAgICByZXR1cm4gRU1QVFlfTUFQIHx8IChFTVBUWV9NQVAgPSBtYWtlTWFwKDApKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZU1hcChtYXAsIGssIHYpIHtcbiAgICB2YXIgbmV3Um9vdDtcbiAgICB2YXIgbmV3U2l6ZTtcbiAgICBpZiAoIW1hcC5fcm9vdCkge1xuICAgICAgaWYgKHYgPT09IE5PVF9TRVQpIHtcbiAgICAgICAgcmV0dXJuIG1hcDtcbiAgICAgIH1cbiAgICAgIG5ld1NpemUgPSAxO1xuICAgICAgbmV3Um9vdCA9IG5ldyBBcnJheU1hcE5vZGUobWFwLl9fb3duZXJJRCwgW1trLCB2XV0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgZGlkQ2hhbmdlU2l6ZSA9IE1ha2VSZWYoQ0hBTkdFX0xFTkdUSCk7XG4gICAgICB2YXIgZGlkQWx0ZXIgPSBNYWtlUmVmKERJRF9BTFRFUik7XG4gICAgICBuZXdSb290ID0gdXBkYXRlTm9kZShtYXAuX3Jvb3QsIG1hcC5fX293bmVySUQsIDAsIHVuZGVmaW5lZCwgaywgdiwgZGlkQ2hhbmdlU2l6ZSwgZGlkQWx0ZXIpO1xuICAgICAgaWYgKCFkaWRBbHRlci52YWx1ZSkge1xuICAgICAgICByZXR1cm4gbWFwO1xuICAgICAgfVxuICAgICAgbmV3U2l6ZSA9IG1hcC5zaXplICsgKGRpZENoYW5nZVNpemUudmFsdWUgPyB2ID09PSBOT1RfU0VUID8gLTEgOiAxIDogMCk7XG4gICAgfVxuICAgIGlmIChtYXAuX19vd25lcklEKSB7XG4gICAgICBtYXAuc2l6ZSA9IG5ld1NpemU7XG4gICAgICBtYXAuX3Jvb3QgPSBuZXdSb290O1xuICAgICAgbWFwLl9faGFzaCA9IHVuZGVmaW5lZDtcbiAgICAgIG1hcC5fX2FsdGVyZWQgPSB0cnVlO1xuICAgICAgcmV0dXJuIG1hcDtcbiAgICB9XG4gICAgcmV0dXJuIG5ld1Jvb3QgPyBtYWtlTWFwKG5ld1NpemUsIG5ld1Jvb3QpIDogZW1wdHlNYXAoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZU5vZGUobm9kZSwgb3duZXJJRCwgc2hpZnQsIGtleUhhc2gsIGtleSwgdmFsdWUsIGRpZENoYW5nZVNpemUsIGRpZEFsdGVyKSB7XG4gICAgaWYgKCFub2RlKSB7XG4gICAgICBpZiAodmFsdWUgPT09IE5PVF9TRVQpIHtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICB9XG4gICAgICBTZXRSZWYoZGlkQWx0ZXIpO1xuICAgICAgU2V0UmVmKGRpZENoYW5nZVNpemUpO1xuICAgICAgcmV0dXJuIG5ldyBWYWx1ZU5vZGUob3duZXJJRCwga2V5SGFzaCwgW2tleSwgdmFsdWVdKTtcbiAgICB9XG4gICAgcmV0dXJuIG5vZGUudXBkYXRlKG93bmVySUQsIHNoaWZ0LCBrZXlIYXNoLCBrZXksIHZhbHVlLCBkaWRDaGFuZ2VTaXplLCBkaWRBbHRlcik7XG4gIH1cblxuICBmdW5jdGlvbiBpc0xlYWZOb2RlKG5vZGUpIHtcbiAgICByZXR1cm4gbm9kZS5jb25zdHJ1Y3RvciA9PT0gVmFsdWVOb2RlIHx8IG5vZGUuY29uc3RydWN0b3IgPT09IEhhc2hDb2xsaXNpb25Ob2RlO1xuICB9XG5cbiAgZnVuY3Rpb24gbWVyZ2VJbnRvTm9kZShub2RlLCBvd25lcklELCBzaGlmdCwga2V5SGFzaCwgZW50cnkpIHtcbiAgICBpZiAobm9kZS5rZXlIYXNoID09PSBrZXlIYXNoKSB7XG4gICAgICByZXR1cm4gbmV3IEhhc2hDb2xsaXNpb25Ob2RlKG93bmVySUQsIGtleUhhc2gsIFtub2RlLmVudHJ5LCBlbnRyeV0pO1xuICAgIH1cblxuICAgIHZhciBpZHgxID0gKHNoaWZ0ID09PSAwID8gbm9kZS5rZXlIYXNoIDogbm9kZS5rZXlIYXNoID4+PiBzaGlmdCkgJiBNQVNLO1xuICAgIHZhciBpZHgyID0gKHNoaWZ0ID09PSAwID8ga2V5SGFzaCA6IGtleUhhc2ggPj4+IHNoaWZ0KSAmIE1BU0s7XG5cbiAgICB2YXIgbmV3Tm9kZTtcbiAgICB2YXIgbm9kZXMgPSBpZHgxID09PSBpZHgyID9cbiAgICAgIFttZXJnZUludG9Ob2RlKG5vZGUsIG93bmVySUQsIHNoaWZ0ICsgU0hJRlQsIGtleUhhc2gsIGVudHJ5KV0gOlxuICAgICAgKChuZXdOb2RlID0gbmV3IFZhbHVlTm9kZShvd25lcklELCBrZXlIYXNoLCBlbnRyeSkpLCBpZHgxIDwgaWR4MiA/IFtub2RlLCBuZXdOb2RlXSA6IFtuZXdOb2RlLCBub2RlXSk7XG5cbiAgICByZXR1cm4gbmV3IEJpdG1hcEluZGV4ZWROb2RlKG93bmVySUQsICgxIDw8IGlkeDEpIHwgKDEgPDwgaWR4MiksIG5vZGVzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZU5vZGVzKG93bmVySUQsIGVudHJpZXMsIGtleSwgdmFsdWUpIHtcbiAgICBpZiAoIW93bmVySUQpIHtcbiAgICAgIG93bmVySUQgPSBuZXcgT3duZXJJRCgpO1xuICAgIH1cbiAgICB2YXIgbm9kZSA9IG5ldyBWYWx1ZU5vZGUob3duZXJJRCwgaGFzaChrZXkpLCBba2V5LCB2YWx1ZV0pO1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBlbnRyaWVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgdmFyIGVudHJ5ID0gZW50cmllc1tpaV07XG4gICAgICBub2RlID0gbm9kZS51cGRhdGUob3duZXJJRCwgMCwgdW5kZWZpbmVkLCBlbnRyeVswXSwgZW50cnlbMV0pO1xuICAgIH1cbiAgICByZXR1cm4gbm9kZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhY2tOb2Rlcyhvd25lcklELCBub2RlcywgY291bnQsIGV4Y2x1ZGluZykge1xuICAgIHZhciBiaXRtYXAgPSAwO1xuICAgIHZhciBwYWNrZWRJSSA9IDA7XG4gICAgdmFyIHBhY2tlZE5vZGVzID0gbmV3IEFycmF5KGNvdW50KTtcbiAgICBmb3IgKHZhciBpaSA9IDAsIGJpdCA9IDEsIGxlbiA9IG5vZGVzLmxlbmd0aDsgaWkgPCBsZW47IGlpKyssIGJpdCA8PD0gMSkge1xuICAgICAgdmFyIG5vZGUgPSBub2Rlc1tpaV07XG4gICAgICBpZiAobm9kZSAhPT0gdW5kZWZpbmVkICYmIGlpICE9PSBleGNsdWRpbmcpIHtcbiAgICAgICAgYml0bWFwIHw9IGJpdDtcbiAgICAgICAgcGFja2VkTm9kZXNbcGFja2VkSUkrK10gPSBub2RlO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbmV3IEJpdG1hcEluZGV4ZWROb2RlKG93bmVySUQsIGJpdG1hcCwgcGFja2VkTm9kZXMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZXhwYW5kTm9kZXMob3duZXJJRCwgbm9kZXMsIGJpdG1hcCwgaW5jbHVkaW5nLCBub2RlKSB7XG4gICAgdmFyIGNvdW50ID0gMDtcbiAgICB2YXIgZXhwYW5kZWROb2RlcyA9IG5ldyBBcnJheShTSVpFKTtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGJpdG1hcCAhPT0gMDsgaWkrKywgYml0bWFwID4+Pj0gMSkge1xuICAgICAgZXhwYW5kZWROb2Rlc1tpaV0gPSBiaXRtYXAgJiAxID8gbm9kZXNbY291bnQrK10gOiB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGV4cGFuZGVkTm9kZXNbaW5jbHVkaW5nXSA9IG5vZGU7XG4gICAgcmV0dXJuIG5ldyBIYXNoQXJyYXlNYXBOb2RlKG93bmVySUQsIGNvdW50ICsgMSwgZXhwYW5kZWROb2Rlcyk7XG4gIH1cblxuICBmdW5jdGlvbiBtZXJnZUludG9NYXBXaXRoKG1hcCwgbWVyZ2VyLCBpdGVyYWJsZXMpIHtcbiAgICB2YXIgaXRlcnMgPSBbXTtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgaXRlcmFibGVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgdmFyIHZhbHVlID0gaXRlcmFibGVzW2lpXTtcbiAgICAgIHZhciBpdGVyID0gS2V5ZWRJdGVyYWJsZSh2YWx1ZSk7XG4gICAgICBpZiAoIWlzSXRlcmFibGUodmFsdWUpKSB7XG4gICAgICAgIGl0ZXIgPSBpdGVyLm1hcChmdW5jdGlvbih2ICkge3JldHVybiBmcm9tSlModil9KTtcbiAgICAgIH1cbiAgICAgIGl0ZXJzLnB1c2goaXRlcik7XG4gICAgfVxuICAgIHJldHVybiBtZXJnZUludG9Db2xsZWN0aW9uV2l0aChtYXAsIG1lcmdlciwgaXRlcnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZGVlcE1lcmdlcihtZXJnZXIpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZXhpc3RpbmcsIHZhbHVlLCBrZXkpIFxuICAgICAge3JldHVybiBleGlzdGluZyAmJiBleGlzdGluZy5tZXJnZURlZXBXaXRoICYmIGlzSXRlcmFibGUodmFsdWUpID9cbiAgICAgICAgZXhpc3RpbmcubWVyZ2VEZWVwV2l0aChtZXJnZXIsIHZhbHVlKSA6XG4gICAgICAgIG1lcmdlciA/IG1lcmdlcihleGlzdGluZywgdmFsdWUsIGtleSkgOiB2YWx1ZX07XG4gIH1cblxuICBmdW5jdGlvbiBtZXJnZUludG9Db2xsZWN0aW9uV2l0aChjb2xsZWN0aW9uLCBtZXJnZXIsIGl0ZXJzKSB7XG4gICAgaXRlcnMgPSBpdGVycy5maWx0ZXIoZnVuY3Rpb24oeCApIHtyZXR1cm4geC5zaXplICE9PSAwfSk7XG4gICAgaWYgKGl0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb247XG4gICAgfVxuICAgIGlmIChjb2xsZWN0aW9uLnNpemUgPT09IDAgJiYgIWNvbGxlY3Rpb24uX19vd25lcklEICYmIGl0ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgcmV0dXJuIGNvbGxlY3Rpb24uY29uc3RydWN0b3IoaXRlcnNbMF0pO1xuICAgIH1cbiAgICByZXR1cm4gY29sbGVjdGlvbi53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKGNvbGxlY3Rpb24gKSB7XG4gICAgICB2YXIgbWVyZ2VJbnRvTWFwID0gbWVyZ2VyID9cbiAgICAgICAgZnVuY3Rpb24odmFsdWUsIGtleSkgIHtcbiAgICAgICAgICBjb2xsZWN0aW9uLnVwZGF0ZShrZXksIE5PVF9TRVQsIGZ1bmN0aW9uKGV4aXN0aW5nIClcbiAgICAgICAgICAgIHtyZXR1cm4gZXhpc3RpbmcgPT09IE5PVF9TRVQgPyB2YWx1ZSA6IG1lcmdlcihleGlzdGluZywgdmFsdWUsIGtleSl9XG4gICAgICAgICAgKTtcbiAgICAgICAgfSA6XG4gICAgICAgIGZ1bmN0aW9uKHZhbHVlLCBrZXkpICB7XG4gICAgICAgICAgY29sbGVjdGlvbi5zZXQoa2V5LCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBpdGVycy5sZW5ndGg7IGlpKyspIHtcbiAgICAgICAgaXRlcnNbaWldLmZvckVhY2gobWVyZ2VJbnRvTWFwKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUluRGVlcE1hcChleGlzdGluZywga2V5UGF0aEl0ZXIsIG5vdFNldFZhbHVlLCB1cGRhdGVyKSB7XG4gICAgdmFyIGlzTm90U2V0ID0gZXhpc3RpbmcgPT09IE5PVF9TRVQ7XG4gICAgdmFyIHN0ZXAgPSBrZXlQYXRoSXRlci5uZXh0KCk7XG4gICAgaWYgKHN0ZXAuZG9uZSkge1xuICAgICAgdmFyIGV4aXN0aW5nVmFsdWUgPSBpc05vdFNldCA/IG5vdFNldFZhbHVlIDogZXhpc3Rpbmc7XG4gICAgICB2YXIgbmV3VmFsdWUgPSB1cGRhdGVyKGV4aXN0aW5nVmFsdWUpO1xuICAgICAgcmV0dXJuIG5ld1ZhbHVlID09PSBleGlzdGluZ1ZhbHVlID8gZXhpc3RpbmcgOiBuZXdWYWx1ZTtcbiAgICB9XG4gICAgaW52YXJpYW50KFxuICAgICAgaXNOb3RTZXQgfHwgKGV4aXN0aW5nICYmIGV4aXN0aW5nLnNldCksXG4gICAgICAnaW52YWxpZCBrZXlQYXRoJ1xuICAgICk7XG4gICAgdmFyIGtleSA9IHN0ZXAudmFsdWU7XG4gICAgdmFyIG5leHRFeGlzdGluZyA9IGlzTm90U2V0ID8gTk9UX1NFVCA6IGV4aXN0aW5nLmdldChrZXksIE5PVF9TRVQpO1xuICAgIHZhciBuZXh0VXBkYXRlZCA9IHVwZGF0ZUluRGVlcE1hcChcbiAgICAgIG5leHRFeGlzdGluZyxcbiAgICAgIGtleVBhdGhJdGVyLFxuICAgICAgbm90U2V0VmFsdWUsXG4gICAgICB1cGRhdGVyXG4gICAgKTtcbiAgICByZXR1cm4gbmV4dFVwZGF0ZWQgPT09IG5leHRFeGlzdGluZyA/IGV4aXN0aW5nIDpcbiAgICAgIG5leHRVcGRhdGVkID09PSBOT1RfU0VUID8gZXhpc3RpbmcucmVtb3ZlKGtleSkgOlxuICAgICAgKGlzTm90U2V0ID8gZW1wdHlNYXAoKSA6IGV4aXN0aW5nKS5zZXQoa2V5LCBuZXh0VXBkYXRlZCk7XG4gIH1cblxuICBmdW5jdGlvbiBwb3BDb3VudCh4KSB7XG4gICAgeCA9IHggLSAoKHggPj4gMSkgJiAweDU1NTU1NTU1KTtcbiAgICB4ID0gKHggJiAweDMzMzMzMzMzKSArICgoeCA+PiAyKSAmIDB4MzMzMzMzMzMpO1xuICAgIHggPSAoeCArICh4ID4+IDQpKSAmIDB4MGYwZjBmMGY7XG4gICAgeCA9IHggKyAoeCA+PiA4KTtcbiAgICB4ID0geCArICh4ID4+IDE2KTtcbiAgICByZXR1cm4geCAmIDB4N2Y7XG4gIH1cblxuICBmdW5jdGlvbiBzZXRJbihhcnJheSwgaWR4LCB2YWwsIGNhbkVkaXQpIHtcbiAgICB2YXIgbmV3QXJyYXkgPSBjYW5FZGl0ID8gYXJyYXkgOiBhcnJDb3B5KGFycmF5KTtcbiAgICBuZXdBcnJheVtpZHhdID0gdmFsO1xuICAgIHJldHVybiBuZXdBcnJheTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNwbGljZUluKGFycmF5LCBpZHgsIHZhbCwgY2FuRWRpdCkge1xuICAgIHZhciBuZXdMZW4gPSBhcnJheS5sZW5ndGggKyAxO1xuICAgIGlmIChjYW5FZGl0ICYmIGlkeCArIDEgPT09IG5ld0xlbikge1xuICAgICAgYXJyYXlbaWR4XSA9IHZhbDtcbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG4gICAgdmFyIG5ld0FycmF5ID0gbmV3IEFycmF5KG5ld0xlbik7XG4gICAgdmFyIGFmdGVyID0gMDtcbiAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgbmV3TGVuOyBpaSsrKSB7XG4gICAgICBpZiAoaWkgPT09IGlkeCkge1xuICAgICAgICBuZXdBcnJheVtpaV0gPSB2YWw7XG4gICAgICAgIGFmdGVyID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdBcnJheVtpaV0gPSBhcnJheVtpaSArIGFmdGVyXTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG5ld0FycmF5O1xuICB9XG5cbiAgZnVuY3Rpb24gc3BsaWNlT3V0KGFycmF5LCBpZHgsIGNhbkVkaXQpIHtcbiAgICB2YXIgbmV3TGVuID0gYXJyYXkubGVuZ3RoIC0gMTtcbiAgICBpZiAoY2FuRWRpdCAmJiBpZHggPT09IG5ld0xlbikge1xuICAgICAgYXJyYXkucG9wKCk7XG4gICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuICAgIHZhciBuZXdBcnJheSA9IG5ldyBBcnJheShuZXdMZW4pO1xuICAgIHZhciBhZnRlciA9IDA7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IG5ld0xlbjsgaWkrKykge1xuICAgICAgaWYgKGlpID09PSBpZHgpIHtcbiAgICAgICAgYWZ0ZXIgPSAxO1xuICAgICAgfVxuICAgICAgbmV3QXJyYXlbaWldID0gYXJyYXlbaWkgKyBhZnRlcl07XG4gICAgfVxuICAgIHJldHVybiBuZXdBcnJheTtcbiAgfVxuXG4gIHZhciBNQVhfQVJSQVlfTUFQX1NJWkUgPSBTSVpFIC8gNDtcbiAgdmFyIE1BWF9CSVRNQVBfSU5ERVhFRF9TSVpFID0gU0laRSAvIDI7XG4gIHZhciBNSU5fSEFTSF9BUlJBWV9NQVBfU0laRSA9IFNJWkUgLyA0O1xuXG4gIGNyZWF0ZUNsYXNzKExpc3QsIEluZGV4ZWRDb2xsZWN0aW9uKTtcblxuICAgIC8vIEBwcmFnbWEgQ29uc3RydWN0aW9uXG5cbiAgICBmdW5jdGlvbiBMaXN0KHZhbHVlKSB7XG4gICAgICB2YXIgZW1wdHkgPSBlbXB0eUxpc3QoKTtcbiAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiBlbXB0eTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0xpc3QodmFsdWUpKSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBpdGVyID0gSW5kZXhlZEl0ZXJhYmxlKHZhbHVlKTtcbiAgICAgIHZhciBzaXplID0gaXRlci5zaXplO1xuICAgICAgaWYgKHNpemUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIGVtcHR5O1xuICAgICAgfVxuICAgICAgYXNzZXJ0Tm90SW5maW5pdGUoc2l6ZSk7XG4gICAgICBpZiAoc2l6ZSA+IDAgJiYgc2l6ZSA8IFNJWkUpIHtcbiAgICAgICAgcmV0dXJuIG1ha2VMaXN0KDAsIHNpemUsIFNISUZULCBudWxsLCBuZXcgVk5vZGUoaXRlci50b0FycmF5KCkpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbXB0eS53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKGxpc3QgKSB7XG4gICAgICAgIGxpc3Quc2V0U2l6ZShzaXplKTtcbiAgICAgICAgaXRlci5mb3JFYWNoKGZ1bmN0aW9uKHYsIGkpICB7cmV0dXJuIGxpc3Quc2V0KGksIHYpfSk7XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICBMaXN0Lm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIHRoaXMoYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ0xpc3QgWycsICddJyk7XG4gICAgfTtcblxuICAgIC8vIEBwcmFnbWEgQWNjZXNzXG5cbiAgICBMaXN0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihpbmRleCwgbm90U2V0VmFsdWUpIHtcbiAgICAgIGluZGV4ID0gd3JhcEluZGV4KHRoaXMsIGluZGV4KTtcbiAgICAgIGlmIChpbmRleCA+PSAwICYmIGluZGV4IDwgdGhpcy5zaXplKSB7XG4gICAgICAgIGluZGV4ICs9IHRoaXMuX29yaWdpbjtcbiAgICAgICAgdmFyIG5vZGUgPSBsaXN0Tm9kZUZvcih0aGlzLCBpbmRleCk7XG4gICAgICAgIHJldHVybiBub2RlICYmIG5vZGUuYXJyYXlbaW5kZXggJiBNQVNLXTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBub3RTZXRWYWx1ZTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBNb2RpZmljYXRpb25cblxuICAgIExpc3QucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGluZGV4LCB2YWx1ZSkge1xuICAgICAgcmV0dXJuIHVwZGF0ZUxpc3QodGhpcywgaW5kZXgsIHZhbHVlKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgIHJldHVybiAhdGhpcy5oYXMoaW5kZXgpID8gdGhpcyA6XG4gICAgICAgIGluZGV4ID09PSAwID8gdGhpcy5zaGlmdCgpIDpcbiAgICAgICAgaW5kZXggPT09IHRoaXMuc2l6ZSAtIDEgPyB0aGlzLnBvcCgpIDpcbiAgICAgICAgdGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICB0aGlzLnNpemUgPSB0aGlzLl9vcmlnaW4gPSB0aGlzLl9jYXBhY2l0eSA9IDA7XG4gICAgICAgIHRoaXMuX2xldmVsID0gU0hJRlQ7XG4gICAgICAgIHRoaXMuX3Jvb3QgPSB0aGlzLl90YWlsID0gbnVsbDtcbiAgICAgICAgdGhpcy5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW1wdHlMaXN0KCk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLnB1c2ggPSBmdW5jdGlvbigvKi4uLnZhbHVlcyovKSB7XG4gICAgICB2YXIgdmFsdWVzID0gYXJndW1lbnRzO1xuICAgICAgdmFyIG9sZFNpemUgPSB0aGlzLnNpemU7XG4gICAgICByZXR1cm4gdGhpcy53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKGxpc3QgKSB7XG4gICAgICAgIHNldExpc3RCb3VuZHMobGlzdCwgMCwgb2xkU2l6ZSArIHZhbHVlcy5sZW5ndGgpO1xuICAgICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgdmFsdWVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGxpc3Quc2V0KG9sZFNpemUgKyBpaSwgdmFsdWVzW2lpXSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBzZXRMaXN0Qm91bmRzKHRoaXMsIDAsIC0xKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUudW5zaGlmdCA9IGZ1bmN0aW9uKC8qLi4udmFsdWVzKi8pIHtcbiAgICAgIHZhciB2YWx1ZXMgPSBhcmd1bWVudHM7XG4gICAgICByZXR1cm4gdGhpcy53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKGxpc3QgKSB7XG4gICAgICAgIHNldExpc3RCb3VuZHMobGlzdCwgLXZhbHVlcy5sZW5ndGgpO1xuICAgICAgICBmb3IgKHZhciBpaSA9IDA7IGlpIDwgdmFsdWVzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIGxpc3Quc2V0KGlpLCB2YWx1ZXNbaWldKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLnNoaWZ0ID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gc2V0TGlzdEJvdW5kcyh0aGlzLCAxKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBDb21wb3NpdGlvblxuXG4gICAgTGlzdC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbigvKi4uLml0ZXJzKi8pIHtcbiAgICAgIHJldHVybiBtZXJnZUludG9MaXN0V2l0aCh0aGlzLCB1bmRlZmluZWQsIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLm1lcmdlV2l0aCA9IGZ1bmN0aW9uKG1lcmdlcikge3ZhciBpdGVycyA9IFNMSUNFJDAuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgcmV0dXJuIG1lcmdlSW50b0xpc3RXaXRoKHRoaXMsIG1lcmdlciwgaXRlcnMpO1xuICAgIH07XG5cbiAgICBMaXN0LnByb3RvdHlwZS5tZXJnZURlZXAgPSBmdW5jdGlvbigvKi4uLml0ZXJzKi8pIHtcbiAgICAgIHJldHVybiBtZXJnZUludG9MaXN0V2l0aCh0aGlzLCBkZWVwTWVyZ2VyKHVuZGVmaW5lZCksIGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIExpc3QucHJvdG90eXBlLm1lcmdlRGVlcFdpdGggPSBmdW5jdGlvbihtZXJnZXIpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICAgIHJldHVybiBtZXJnZUludG9MaXN0V2l0aCh0aGlzLCBkZWVwTWVyZ2VyKG1lcmdlciksIGl0ZXJzKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUuc2V0U2l6ZSA9IGZ1bmN0aW9uKHNpemUpIHtcbiAgICAgIHJldHVybiBzZXRMaXN0Qm91bmRzKHRoaXMsIDAsIHNpemUpO1xuICAgIH07XG5cbiAgICAvLyBAcHJhZ21hIEl0ZXJhdGlvblxuXG4gICAgTGlzdC5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbihiZWdpbiwgZW5kKSB7XG4gICAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZTtcbiAgICAgIGlmICh3aG9sZVNsaWNlKGJlZ2luLCBlbmQsIHNpemUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNldExpc3RCb3VuZHMoXG4gICAgICAgIHRoaXMsXG4gICAgICAgIHJlc29sdmVCZWdpbihiZWdpbiwgc2l6ZSksXG4gICAgICAgIHJlc29sdmVFbmQoZW5kLCBzaXplKVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICB2YXIgdmFsdWVzID0gaXRlcmF0ZUxpc3QodGhpcywgcmV2ZXJzZSk7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXMoKTtcbiAgICAgICAgcmV0dXJuIHZhbHVlID09PSBET05FID9cbiAgICAgICAgICBpdGVyYXRvckRvbmUoKSA6XG4gICAgICAgICAgaXRlcmF0b3JWYWx1ZSh0eXBlLCBpbmRleCsrLCB2YWx1ZSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHZhciBpbmRleCA9IDA7XG4gICAgICB2YXIgdmFsdWVzID0gaXRlcmF0ZUxpc3QodGhpcywgcmV2ZXJzZSk7XG4gICAgICB2YXIgdmFsdWU7XG4gICAgICB3aGlsZSAoKHZhbHVlID0gdmFsdWVzKCkpICE9PSBET05FKSB7XG4gICAgICAgIGlmIChmbih2YWx1ZSwgaW5kZXgrKywgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBpbmRleDtcbiAgICB9O1xuXG4gICAgTGlzdC5wcm90b3R5cGUuX19lbnN1cmVPd25lciA9IGZ1bmN0aW9uKG93bmVySUQpIHtcbiAgICAgIGlmIChvd25lcklEID09PSB0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICghb3duZXJJRCkge1xuICAgICAgICB0aGlzLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VMaXN0KHRoaXMuX29yaWdpbiwgdGhpcy5fY2FwYWNpdHksIHRoaXMuX2xldmVsLCB0aGlzLl9yb290LCB0aGlzLl90YWlsLCBvd25lcklELCB0aGlzLl9faGFzaCk7XG4gICAgfTtcblxuXG4gIGZ1bmN0aW9uIGlzTGlzdChtYXliZUxpc3QpIHtcbiAgICByZXR1cm4gISEobWF5YmVMaXN0ICYmIG1heWJlTGlzdFtJU19MSVNUX1NFTlRJTkVMXSk7XG4gIH1cblxuICBMaXN0LmlzTGlzdCA9IGlzTGlzdDtcblxuICB2YXIgSVNfTElTVF9TRU5USU5FTCA9ICdAQF9fSU1NVVRBQkxFX0xJU1RfX0BAJztcblxuICB2YXIgTGlzdFByb3RvdHlwZSA9IExpc3QucHJvdG90eXBlO1xuICBMaXN0UHJvdG90eXBlW0lTX0xJU1RfU0VOVElORUxdID0gdHJ1ZTtcbiAgTGlzdFByb3RvdHlwZVtERUxFVEVdID0gTGlzdFByb3RvdHlwZS5yZW1vdmU7XG4gIExpc3RQcm90b3R5cGUuc2V0SW4gPSBNYXBQcm90b3R5cGUuc2V0SW47XG4gIExpc3RQcm90b3R5cGUuZGVsZXRlSW4gPVxuICBMaXN0UHJvdG90eXBlLnJlbW92ZUluID0gTWFwUHJvdG90eXBlLnJlbW92ZUluO1xuICBMaXN0UHJvdG90eXBlLnVwZGF0ZSA9IE1hcFByb3RvdHlwZS51cGRhdGU7XG4gIExpc3RQcm90b3R5cGUudXBkYXRlSW4gPSBNYXBQcm90b3R5cGUudXBkYXRlSW47XG4gIExpc3RQcm90b3R5cGUubWVyZ2VJbiA9IE1hcFByb3RvdHlwZS5tZXJnZUluO1xuICBMaXN0UHJvdG90eXBlLm1lcmdlRGVlcEluID0gTWFwUHJvdG90eXBlLm1lcmdlRGVlcEluO1xuICBMaXN0UHJvdG90eXBlLndpdGhNdXRhdGlvbnMgPSBNYXBQcm90b3R5cGUud2l0aE11dGF0aW9ucztcbiAgTGlzdFByb3RvdHlwZS5hc011dGFibGUgPSBNYXBQcm90b3R5cGUuYXNNdXRhYmxlO1xuICBMaXN0UHJvdG90eXBlLmFzSW1tdXRhYmxlID0gTWFwUHJvdG90eXBlLmFzSW1tdXRhYmxlO1xuICBMaXN0UHJvdG90eXBlLndhc0FsdGVyZWQgPSBNYXBQcm90b3R5cGUud2FzQWx0ZXJlZDtcblxuXG5cbiAgICBmdW5jdGlvbiBWTm9kZShhcnJheSwgb3duZXJJRCkge1xuICAgICAgdGhpcy5hcnJheSA9IGFycmF5O1xuICAgICAgdGhpcy5vd25lcklEID0gb3duZXJJRDtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBzZWVtcyBsaWtlIHRoZXNlIG1ldGhvZHMgYXJlIHZlcnkgc2ltaWxhclxuXG4gICAgVk5vZGUucHJvdG90eXBlLnJlbW92ZUJlZm9yZSA9IGZ1bmN0aW9uKG93bmVySUQsIGxldmVsLCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09PSBsZXZlbCA/IDEgPDwgbGV2ZWwgOiAwIHx8IHRoaXMuYXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIG9yaWdpbkluZGV4ID0gKGluZGV4ID4+PiBsZXZlbCkgJiBNQVNLO1xuICAgICAgaWYgKG9yaWdpbkluZGV4ID49IHRoaXMuYXJyYXkubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBuZXcgVk5vZGUoW10sIG93bmVySUQpO1xuICAgICAgfVxuICAgICAgdmFyIHJlbW92aW5nRmlyc3QgPSBvcmlnaW5JbmRleCA9PT0gMDtcbiAgICAgIHZhciBuZXdDaGlsZDtcbiAgICAgIGlmIChsZXZlbCA+IDApIHtcbiAgICAgICAgdmFyIG9sZENoaWxkID0gdGhpcy5hcnJheVtvcmlnaW5JbmRleF07XG4gICAgICAgIG5ld0NoaWxkID0gb2xkQ2hpbGQgJiYgb2xkQ2hpbGQucmVtb3ZlQmVmb3JlKG93bmVySUQsIGxldmVsIC0gU0hJRlQsIGluZGV4KTtcbiAgICAgICAgaWYgKG5ld0NoaWxkID09PSBvbGRDaGlsZCAmJiByZW1vdmluZ0ZpcnN0KSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChyZW1vdmluZ0ZpcnN0ICYmICFuZXdDaGlsZCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHZhciBlZGl0YWJsZSA9IGVkaXRhYmxlVk5vZGUodGhpcywgb3duZXJJRCk7XG4gICAgICBpZiAoIXJlbW92aW5nRmlyc3QpIHtcbiAgICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IG9yaWdpbkluZGV4OyBpaSsrKSB7XG4gICAgICAgICAgZWRpdGFibGUuYXJyYXlbaWldID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAobmV3Q2hpbGQpIHtcbiAgICAgICAgZWRpdGFibGUuYXJyYXlbb3JpZ2luSW5kZXhdID0gbmV3Q2hpbGQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWRpdGFibGU7XG4gICAgfTtcblxuICAgIFZOb2RlLnByb3RvdHlwZS5yZW1vdmVBZnRlciA9IGZ1bmN0aW9uKG93bmVySUQsIGxldmVsLCBpbmRleCkge1xuICAgICAgaWYgKGluZGV4ID09PSAobGV2ZWwgPyAxIDw8IGxldmVsIDogMCkgfHwgdGhpcy5hcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgc2l6ZUluZGV4ID0gKChpbmRleCAtIDEpID4+PiBsZXZlbCkgJiBNQVNLO1xuICAgICAgaWYgKHNpemVJbmRleCA+PSB0aGlzLmFycmF5Lmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgdmFyIG5ld0NoaWxkO1xuICAgICAgaWYgKGxldmVsID4gMCkge1xuICAgICAgICB2YXIgb2xkQ2hpbGQgPSB0aGlzLmFycmF5W3NpemVJbmRleF07XG4gICAgICAgIG5ld0NoaWxkID0gb2xkQ2hpbGQgJiYgb2xkQ2hpbGQucmVtb3ZlQWZ0ZXIob3duZXJJRCwgbGV2ZWwgLSBTSElGVCwgaW5kZXgpO1xuICAgICAgICBpZiAobmV3Q2hpbGQgPT09IG9sZENoaWxkICYmIHNpemVJbmRleCA9PT0gdGhpcy5hcnJheS5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdmFyIGVkaXRhYmxlID0gZWRpdGFibGVWTm9kZSh0aGlzLCBvd25lcklEKTtcbiAgICAgIGVkaXRhYmxlLmFycmF5LnNwbGljZShzaXplSW5kZXggKyAxKTtcbiAgICAgIGlmIChuZXdDaGlsZCkge1xuICAgICAgICBlZGl0YWJsZS5hcnJheVtzaXplSW5kZXhdID0gbmV3Q2hpbGQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gZWRpdGFibGU7XG4gICAgfTtcblxuXG5cbiAgdmFyIERPTkUgPSB7fTtcblxuICBmdW5jdGlvbiBpdGVyYXRlTGlzdChsaXN0LCByZXZlcnNlKSB7XG4gICAgdmFyIGxlZnQgPSBsaXN0Ll9vcmlnaW47XG4gICAgdmFyIHJpZ2h0ID0gbGlzdC5fY2FwYWNpdHk7XG4gICAgdmFyIHRhaWxQb3MgPSBnZXRUYWlsT2Zmc2V0KHJpZ2h0KTtcbiAgICB2YXIgdGFpbCA9IGxpc3QuX3RhaWw7XG5cbiAgICByZXR1cm4gaXRlcmF0ZU5vZGVPckxlYWYobGlzdC5fcm9vdCwgbGlzdC5fbGV2ZWwsIDApO1xuXG4gICAgZnVuY3Rpb24gaXRlcmF0ZU5vZGVPckxlYWYobm9kZSwgbGV2ZWwsIG9mZnNldCkge1xuICAgICAgcmV0dXJuIGxldmVsID09PSAwID9cbiAgICAgICAgaXRlcmF0ZUxlYWYobm9kZSwgb2Zmc2V0KSA6XG4gICAgICAgIGl0ZXJhdGVOb2RlKG5vZGUsIGxldmVsLCBvZmZzZXQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGl0ZXJhdGVMZWFmKG5vZGUsIG9mZnNldCkge1xuICAgICAgdmFyIGFycmF5ID0gb2Zmc2V0ID09PSB0YWlsUG9zID8gdGFpbCAmJiB0YWlsLmFycmF5IDogbm9kZSAmJiBub2RlLmFycmF5O1xuICAgICAgdmFyIGZyb20gPSBvZmZzZXQgPiBsZWZ0ID8gMCA6IGxlZnQgLSBvZmZzZXQ7XG4gICAgICB2YXIgdG8gPSByaWdodCAtIG9mZnNldDtcbiAgICAgIGlmICh0byA+IFNJWkUpIHtcbiAgICAgICAgdG8gPSBTSVpFO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgaWYgKGZyb20gPT09IHRvKSB7XG4gICAgICAgICAgcmV0dXJuIERPTkU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGlkeCA9IHJldmVyc2UgPyAtLXRvIDogZnJvbSsrO1xuICAgICAgICByZXR1cm4gYXJyYXkgJiYgYXJyYXlbaWR4XTtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaXRlcmF0ZU5vZGUobm9kZSwgbGV2ZWwsIG9mZnNldCkge1xuICAgICAgdmFyIHZhbHVlcztcbiAgICAgIHZhciBhcnJheSA9IG5vZGUgJiYgbm9kZS5hcnJheTtcbiAgICAgIHZhciBmcm9tID0gb2Zmc2V0ID4gbGVmdCA/IDAgOiAobGVmdCAtIG9mZnNldCkgPj4gbGV2ZWw7XG4gICAgICB2YXIgdG8gPSAoKHJpZ2h0IC0gb2Zmc2V0KSA+PiBsZXZlbCkgKyAxO1xuICAgICAgaWYgKHRvID4gU0laRSkge1xuICAgICAgICB0byA9IFNJWkU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZnVuY3Rpb24oKSAge1xuICAgICAgICBkbyB7XG4gICAgICAgICAgaWYgKHZhbHVlcykge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVzKCk7XG4gICAgICAgICAgICBpZiAodmFsdWUgIT09IERPTkUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFsdWVzID0gbnVsbDtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGZyb20gPT09IHRvKSB7XG4gICAgICAgICAgICByZXR1cm4gRE9ORTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdmFyIGlkeCA9IHJldmVyc2UgPyAtLXRvIDogZnJvbSsrO1xuICAgICAgICAgIHZhbHVlcyA9IGl0ZXJhdGVOb2RlT3JMZWFmKFxuICAgICAgICAgICAgYXJyYXkgJiYgYXJyYXlbaWR4XSwgbGV2ZWwgLSBTSElGVCwgb2Zmc2V0ICsgKGlkeCA8PCBsZXZlbClcbiAgICAgICAgICApO1xuICAgICAgICB9IHdoaWxlICh0cnVlKTtcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gbWFrZUxpc3Qob3JpZ2luLCBjYXBhY2l0eSwgbGV2ZWwsIHJvb3QsIHRhaWwsIG93bmVySUQsIGhhc2gpIHtcbiAgICB2YXIgbGlzdCA9IE9iamVjdC5jcmVhdGUoTGlzdFByb3RvdHlwZSk7XG4gICAgbGlzdC5zaXplID0gY2FwYWNpdHkgLSBvcmlnaW47XG4gICAgbGlzdC5fb3JpZ2luID0gb3JpZ2luO1xuICAgIGxpc3QuX2NhcGFjaXR5ID0gY2FwYWNpdHk7XG4gICAgbGlzdC5fbGV2ZWwgPSBsZXZlbDtcbiAgICBsaXN0Ll9yb290ID0gcm9vdDtcbiAgICBsaXN0Ll90YWlsID0gdGFpbDtcbiAgICBsaXN0Ll9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgbGlzdC5fX2hhc2ggPSBoYXNoO1xuICAgIGxpc3QuX19hbHRlcmVkID0gZmFsc2U7XG4gICAgcmV0dXJuIGxpc3Q7XG4gIH1cblxuICB2YXIgRU1QVFlfTElTVDtcbiAgZnVuY3Rpb24gZW1wdHlMaXN0KCkge1xuICAgIHJldHVybiBFTVBUWV9MSVNUIHx8IChFTVBUWV9MSVNUID0gbWFrZUxpc3QoMCwgMCwgU0hJRlQpKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZUxpc3QobGlzdCwgaW5kZXgsIHZhbHVlKSB7XG4gICAgaW5kZXggPSB3cmFwSW5kZXgobGlzdCwgaW5kZXgpO1xuXG4gICAgaWYgKGluZGV4ICE9PSBpbmRleCkge1xuICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfVxuXG4gICAgaWYgKGluZGV4ID49IGxpc3Quc2l6ZSB8fCBpbmRleCA8IDApIHtcbiAgICAgIHJldHVybiBsaXN0LndpdGhNdXRhdGlvbnMoZnVuY3Rpb24obGlzdCApIHtcbiAgICAgICAgaW5kZXggPCAwID9cbiAgICAgICAgICBzZXRMaXN0Qm91bmRzKGxpc3QsIGluZGV4KS5zZXQoMCwgdmFsdWUpIDpcbiAgICAgICAgICBzZXRMaXN0Qm91bmRzKGxpc3QsIDAsIGluZGV4ICsgMSkuc2V0KGluZGV4LCB2YWx1ZSlcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGluZGV4ICs9IGxpc3QuX29yaWdpbjtcblxuICAgIHZhciBuZXdUYWlsID0gbGlzdC5fdGFpbDtcbiAgICB2YXIgbmV3Um9vdCA9IGxpc3QuX3Jvb3Q7XG4gICAgdmFyIGRpZEFsdGVyID0gTWFrZVJlZihESURfQUxURVIpO1xuICAgIGlmIChpbmRleCA+PSBnZXRUYWlsT2Zmc2V0KGxpc3QuX2NhcGFjaXR5KSkge1xuICAgICAgbmV3VGFpbCA9IHVwZGF0ZVZOb2RlKG5ld1RhaWwsIGxpc3QuX19vd25lcklELCAwLCBpbmRleCwgdmFsdWUsIGRpZEFsdGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3Um9vdCA9IHVwZGF0ZVZOb2RlKG5ld1Jvb3QsIGxpc3QuX19vd25lcklELCBsaXN0Ll9sZXZlbCwgaW5kZXgsIHZhbHVlLCBkaWRBbHRlcik7XG4gICAgfVxuXG4gICAgaWYgKCFkaWRBbHRlci52YWx1ZSkge1xuICAgICAgcmV0dXJuIGxpc3Q7XG4gICAgfVxuXG4gICAgaWYgKGxpc3QuX19vd25lcklEKSB7XG4gICAgICBsaXN0Ll9yb290ID0gbmV3Um9vdDtcbiAgICAgIGxpc3QuX3RhaWwgPSBuZXdUYWlsO1xuICAgICAgbGlzdC5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICBsaXN0Ll9fYWx0ZXJlZCA9IHRydWU7XG4gICAgICByZXR1cm4gbGlzdDtcbiAgICB9XG4gICAgcmV0dXJuIG1ha2VMaXN0KGxpc3QuX29yaWdpbiwgbGlzdC5fY2FwYWNpdHksIGxpc3QuX2xldmVsLCBuZXdSb290LCBuZXdUYWlsKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHVwZGF0ZVZOb2RlKG5vZGUsIG93bmVySUQsIGxldmVsLCBpbmRleCwgdmFsdWUsIGRpZEFsdGVyKSB7XG4gICAgdmFyIGlkeCA9IChpbmRleCA+Pj4gbGV2ZWwpICYgTUFTSztcbiAgICB2YXIgbm9kZUhhcyA9IG5vZGUgJiYgaWR4IDwgbm9kZS5hcnJheS5sZW5ndGg7XG4gICAgaWYgKCFub2RlSGFzICYmIHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIHZhciBuZXdOb2RlO1xuXG4gICAgaWYgKGxldmVsID4gMCkge1xuICAgICAgdmFyIGxvd2VyTm9kZSA9IG5vZGUgJiYgbm9kZS5hcnJheVtpZHhdO1xuICAgICAgdmFyIG5ld0xvd2VyTm9kZSA9IHVwZGF0ZVZOb2RlKGxvd2VyTm9kZSwgb3duZXJJRCwgbGV2ZWwgLSBTSElGVCwgaW5kZXgsIHZhbHVlLCBkaWRBbHRlcik7XG4gICAgICBpZiAobmV3TG93ZXJOb2RlID09PSBsb3dlck5vZGUpIHtcbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgICB9XG4gICAgICBuZXdOb2RlID0gZWRpdGFibGVWTm9kZShub2RlLCBvd25lcklEKTtcbiAgICAgIG5ld05vZGUuYXJyYXlbaWR4XSA9IG5ld0xvd2VyTm9kZTtcbiAgICAgIHJldHVybiBuZXdOb2RlO1xuICAgIH1cblxuICAgIGlmIChub2RlSGFzICYmIG5vZGUuYXJyYXlbaWR4XSA9PT0gdmFsdWUpIHtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cblxuICAgIFNldFJlZihkaWRBbHRlcik7XG5cbiAgICBuZXdOb2RlID0gZWRpdGFibGVWTm9kZShub2RlLCBvd25lcklEKTtcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCAmJiBpZHggPT09IG5ld05vZGUuYXJyYXkubGVuZ3RoIC0gMSkge1xuICAgICAgbmV3Tm9kZS5hcnJheS5wb3AoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmV3Tm9kZS5hcnJheVtpZHhdID0gdmFsdWU7XG4gICAgfVxuICAgIHJldHVybiBuZXdOb2RlO1xuICB9XG5cbiAgZnVuY3Rpb24gZWRpdGFibGVWTm9kZShub2RlLCBvd25lcklEKSB7XG4gICAgaWYgKG93bmVySUQgJiYgbm9kZSAmJiBvd25lcklEID09PSBub2RlLm93bmVySUQpIHtcbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IFZOb2RlKG5vZGUgPyBub2RlLmFycmF5LnNsaWNlKCkgOiBbXSwgb3duZXJJRCk7XG4gIH1cblxuICBmdW5jdGlvbiBsaXN0Tm9kZUZvcihsaXN0LCByYXdJbmRleCkge1xuICAgIGlmIChyYXdJbmRleCA+PSBnZXRUYWlsT2Zmc2V0KGxpc3QuX2NhcGFjaXR5KSkge1xuICAgICAgcmV0dXJuIGxpc3QuX3RhaWw7XG4gICAgfVxuICAgIGlmIChyYXdJbmRleCA8IDEgPDwgKGxpc3QuX2xldmVsICsgU0hJRlQpKSB7XG4gICAgICB2YXIgbm9kZSA9IGxpc3QuX3Jvb3Q7XG4gICAgICB2YXIgbGV2ZWwgPSBsaXN0Ll9sZXZlbDtcbiAgICAgIHdoaWxlIChub2RlICYmIGxldmVsID4gMCkge1xuICAgICAgICBub2RlID0gbm9kZS5hcnJheVsocmF3SW5kZXggPj4+IGxldmVsKSAmIE1BU0tdO1xuICAgICAgICBsZXZlbCAtPSBTSElGVDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBub2RlO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldExpc3RCb3VuZHMobGlzdCwgYmVnaW4sIGVuZCkge1xuICAgIC8vIFNhbml0aXplIGJlZ2luICYgZW5kIHVzaW5nIHRoaXMgc2hvcnRoYW5kIGZvciBUb0ludDMyKGFyZ3VtZW50KVxuICAgIC8vIGh0dHA6Ly93d3cuZWNtYS1pbnRlcm5hdGlvbmFsLm9yZy9lY21hLTI2Mi82LjAvI3NlYy10b2ludDMyXG4gICAgaWYgKGJlZ2luICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGJlZ2luID0gYmVnaW4gfCAwO1xuICAgIH1cbiAgICBpZiAoZW5kICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGVuZCA9IGVuZCB8IDA7XG4gICAgfVxuICAgIHZhciBvd25lciA9IGxpc3QuX19vd25lcklEIHx8IG5ldyBPd25lcklEKCk7XG4gICAgdmFyIG9sZE9yaWdpbiA9IGxpc3QuX29yaWdpbjtcbiAgICB2YXIgb2xkQ2FwYWNpdHkgPSBsaXN0Ll9jYXBhY2l0eTtcbiAgICB2YXIgbmV3T3JpZ2luID0gb2xkT3JpZ2luICsgYmVnaW47XG4gICAgdmFyIG5ld0NhcGFjaXR5ID0gZW5kID09PSB1bmRlZmluZWQgPyBvbGRDYXBhY2l0eSA6IGVuZCA8IDAgPyBvbGRDYXBhY2l0eSArIGVuZCA6IG9sZE9yaWdpbiArIGVuZDtcbiAgICBpZiAobmV3T3JpZ2luID09PSBvbGRPcmlnaW4gJiYgbmV3Q2FwYWNpdHkgPT09IG9sZENhcGFjaXR5KSB7XG4gICAgICByZXR1cm4gbGlzdDtcbiAgICB9XG5cbiAgICAvLyBJZiBpdCdzIGdvaW5nIHRvIGVuZCBhZnRlciBpdCBzdGFydHMsIGl0J3MgZW1wdHkuXG4gICAgaWYgKG5ld09yaWdpbiA+PSBuZXdDYXBhY2l0eSkge1xuICAgICAgcmV0dXJuIGxpc3QuY2xlYXIoKTtcbiAgICB9XG5cbiAgICB2YXIgbmV3TGV2ZWwgPSBsaXN0Ll9sZXZlbDtcbiAgICB2YXIgbmV3Um9vdCA9IGxpc3QuX3Jvb3Q7XG5cbiAgICAvLyBOZXcgb3JpZ2luIG1pZ2h0IG5lZWQgY3JlYXRpbmcgYSBoaWdoZXIgcm9vdC5cbiAgICB2YXIgb2Zmc2V0U2hpZnQgPSAwO1xuICAgIHdoaWxlIChuZXdPcmlnaW4gKyBvZmZzZXRTaGlmdCA8IDApIHtcbiAgICAgIG5ld1Jvb3QgPSBuZXcgVk5vZGUobmV3Um9vdCAmJiBuZXdSb290LmFycmF5Lmxlbmd0aCA/IFt1bmRlZmluZWQsIG5ld1Jvb3RdIDogW10sIG93bmVyKTtcbiAgICAgIG5ld0xldmVsICs9IFNISUZUO1xuICAgICAgb2Zmc2V0U2hpZnQgKz0gMSA8PCBuZXdMZXZlbDtcbiAgICB9XG4gICAgaWYgKG9mZnNldFNoaWZ0KSB7XG4gICAgICBuZXdPcmlnaW4gKz0gb2Zmc2V0U2hpZnQ7XG4gICAgICBvbGRPcmlnaW4gKz0gb2Zmc2V0U2hpZnQ7XG4gICAgICBuZXdDYXBhY2l0eSArPSBvZmZzZXRTaGlmdDtcbiAgICAgIG9sZENhcGFjaXR5ICs9IG9mZnNldFNoaWZ0O1xuICAgIH1cblxuICAgIHZhciBvbGRUYWlsT2Zmc2V0ID0gZ2V0VGFpbE9mZnNldChvbGRDYXBhY2l0eSk7XG4gICAgdmFyIG5ld1RhaWxPZmZzZXQgPSBnZXRUYWlsT2Zmc2V0KG5ld0NhcGFjaXR5KTtcblxuICAgIC8vIE5ldyBzaXplIG1pZ2h0IG5lZWQgY3JlYXRpbmcgYSBoaWdoZXIgcm9vdC5cbiAgICB3aGlsZSAobmV3VGFpbE9mZnNldCA+PSAxIDw8IChuZXdMZXZlbCArIFNISUZUKSkge1xuICAgICAgbmV3Um9vdCA9IG5ldyBWTm9kZShuZXdSb290ICYmIG5ld1Jvb3QuYXJyYXkubGVuZ3RoID8gW25ld1Jvb3RdIDogW10sIG93bmVyKTtcbiAgICAgIG5ld0xldmVsICs9IFNISUZUO1xuICAgIH1cblxuICAgIC8vIExvY2F0ZSBvciBjcmVhdGUgdGhlIG5ldyB0YWlsLlxuICAgIHZhciBvbGRUYWlsID0gbGlzdC5fdGFpbDtcbiAgICB2YXIgbmV3VGFpbCA9IG5ld1RhaWxPZmZzZXQgPCBvbGRUYWlsT2Zmc2V0ID9cbiAgICAgIGxpc3ROb2RlRm9yKGxpc3QsIG5ld0NhcGFjaXR5IC0gMSkgOlxuICAgICAgbmV3VGFpbE9mZnNldCA+IG9sZFRhaWxPZmZzZXQgPyBuZXcgVk5vZGUoW10sIG93bmVyKSA6IG9sZFRhaWw7XG5cbiAgICAvLyBNZXJnZSBUYWlsIGludG8gdHJlZS5cbiAgICBpZiAob2xkVGFpbCAmJiBuZXdUYWlsT2Zmc2V0ID4gb2xkVGFpbE9mZnNldCAmJiBuZXdPcmlnaW4gPCBvbGRDYXBhY2l0eSAmJiBvbGRUYWlsLmFycmF5Lmxlbmd0aCkge1xuICAgICAgbmV3Um9vdCA9IGVkaXRhYmxlVk5vZGUobmV3Um9vdCwgb3duZXIpO1xuICAgICAgdmFyIG5vZGUgPSBuZXdSb290O1xuICAgICAgZm9yICh2YXIgbGV2ZWwgPSBuZXdMZXZlbDsgbGV2ZWwgPiBTSElGVDsgbGV2ZWwgLT0gU0hJRlQpIHtcbiAgICAgICAgdmFyIGlkeCA9IChvbGRUYWlsT2Zmc2V0ID4+PiBsZXZlbCkgJiBNQVNLO1xuICAgICAgICBub2RlID0gbm9kZS5hcnJheVtpZHhdID0gZWRpdGFibGVWTm9kZShub2RlLmFycmF5W2lkeF0sIG93bmVyKTtcbiAgICAgIH1cbiAgICAgIG5vZGUuYXJyYXlbKG9sZFRhaWxPZmZzZXQgPj4+IFNISUZUKSAmIE1BU0tdID0gb2xkVGFpbDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgc2l6ZSBoYXMgYmVlbiByZWR1Y2VkLCB0aGVyZSdzIGEgY2hhbmNlIHRoZSB0YWlsIG5lZWRzIHRvIGJlIHRyaW1tZWQuXG4gICAgaWYgKG5ld0NhcGFjaXR5IDwgb2xkQ2FwYWNpdHkpIHtcbiAgICAgIG5ld1RhaWwgPSBuZXdUYWlsICYmIG5ld1RhaWwucmVtb3ZlQWZ0ZXIob3duZXIsIDAsIG5ld0NhcGFjaXR5KTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgbmV3IG9yaWdpbiBpcyB3aXRoaW4gdGhlIHRhaWwsIHRoZW4gd2UgZG8gbm90IG5lZWQgYSByb290LlxuICAgIGlmIChuZXdPcmlnaW4gPj0gbmV3VGFpbE9mZnNldCkge1xuICAgICAgbmV3T3JpZ2luIC09IG5ld1RhaWxPZmZzZXQ7XG4gICAgICBuZXdDYXBhY2l0eSAtPSBuZXdUYWlsT2Zmc2V0O1xuICAgICAgbmV3TGV2ZWwgPSBTSElGVDtcbiAgICAgIG5ld1Jvb3QgPSBudWxsO1xuICAgICAgbmV3VGFpbCA9IG5ld1RhaWwgJiYgbmV3VGFpbC5yZW1vdmVCZWZvcmUob3duZXIsIDAsIG5ld09yaWdpbik7XG5cbiAgICAvLyBPdGhlcndpc2UsIGlmIHRoZSByb290IGhhcyBiZWVuIHRyaW1tZWQsIGdhcmJhZ2UgY29sbGVjdC5cbiAgICB9IGVsc2UgaWYgKG5ld09yaWdpbiA+IG9sZE9yaWdpbiB8fCBuZXdUYWlsT2Zmc2V0IDwgb2xkVGFpbE9mZnNldCkge1xuICAgICAgb2Zmc2V0U2hpZnQgPSAwO1xuXG4gICAgICAvLyBJZGVudGlmeSB0aGUgbmV3IHRvcCByb290IG5vZGUgb2YgdGhlIHN1YnRyZWUgb2YgdGhlIG9sZCByb290LlxuICAgICAgd2hpbGUgKG5ld1Jvb3QpIHtcbiAgICAgICAgdmFyIGJlZ2luSW5kZXggPSAobmV3T3JpZ2luID4+PiBuZXdMZXZlbCkgJiBNQVNLO1xuICAgICAgICBpZiAoYmVnaW5JbmRleCAhPT0gKG5ld1RhaWxPZmZzZXQgPj4+IG5ld0xldmVsKSAmIE1BU0spIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBpZiAoYmVnaW5JbmRleCkge1xuICAgICAgICAgIG9mZnNldFNoaWZ0ICs9ICgxIDw8IG5ld0xldmVsKSAqIGJlZ2luSW5kZXg7XG4gICAgICAgIH1cbiAgICAgICAgbmV3TGV2ZWwgLT0gU0hJRlQ7XG4gICAgICAgIG5ld1Jvb3QgPSBuZXdSb290LmFycmF5W2JlZ2luSW5kZXhdO1xuICAgICAgfVxuXG4gICAgICAvLyBUcmltIHRoZSBuZXcgc2lkZXMgb2YgdGhlIG5ldyByb290LlxuICAgICAgaWYgKG5ld1Jvb3QgJiYgbmV3T3JpZ2luID4gb2xkT3JpZ2luKSB7XG4gICAgICAgIG5ld1Jvb3QgPSBuZXdSb290LnJlbW92ZUJlZm9yZShvd25lciwgbmV3TGV2ZWwsIG5ld09yaWdpbiAtIG9mZnNldFNoaWZ0KTtcbiAgICAgIH1cbiAgICAgIGlmIChuZXdSb290ICYmIG5ld1RhaWxPZmZzZXQgPCBvbGRUYWlsT2Zmc2V0KSB7XG4gICAgICAgIG5ld1Jvb3QgPSBuZXdSb290LnJlbW92ZUFmdGVyKG93bmVyLCBuZXdMZXZlbCwgbmV3VGFpbE9mZnNldCAtIG9mZnNldFNoaWZ0KTtcbiAgICAgIH1cbiAgICAgIGlmIChvZmZzZXRTaGlmdCkge1xuICAgICAgICBuZXdPcmlnaW4gLT0gb2Zmc2V0U2hpZnQ7XG4gICAgICAgIG5ld0NhcGFjaXR5IC09IG9mZnNldFNoaWZ0O1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChsaXN0Ll9fb3duZXJJRCkge1xuICAgICAgbGlzdC5zaXplID0gbmV3Q2FwYWNpdHkgLSBuZXdPcmlnaW47XG4gICAgICBsaXN0Ll9vcmlnaW4gPSBuZXdPcmlnaW47XG4gICAgICBsaXN0Ll9jYXBhY2l0eSA9IG5ld0NhcGFjaXR5O1xuICAgICAgbGlzdC5fbGV2ZWwgPSBuZXdMZXZlbDtcbiAgICAgIGxpc3QuX3Jvb3QgPSBuZXdSb290O1xuICAgICAgbGlzdC5fdGFpbCA9IG5ld1RhaWw7XG4gICAgICBsaXN0Ll9faGFzaCA9IHVuZGVmaW5lZDtcbiAgICAgIGxpc3QuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBsaXN0O1xuICAgIH1cbiAgICByZXR1cm4gbWFrZUxpc3QobmV3T3JpZ2luLCBuZXdDYXBhY2l0eSwgbmV3TGV2ZWwsIG5ld1Jvb3QsIG5ld1RhaWwpO1xuICB9XG5cbiAgZnVuY3Rpb24gbWVyZ2VJbnRvTGlzdFdpdGgobGlzdCwgbWVyZ2VyLCBpdGVyYWJsZXMpIHtcbiAgICB2YXIgaXRlcnMgPSBbXTtcbiAgICB2YXIgbWF4U2l6ZSA9IDA7XG4gICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGl0ZXJhYmxlcy5sZW5ndGg7IGlpKyspIHtcbiAgICAgIHZhciB2YWx1ZSA9IGl0ZXJhYmxlc1tpaV07XG4gICAgICB2YXIgaXRlciA9IEluZGV4ZWRJdGVyYWJsZSh2YWx1ZSk7XG4gICAgICBpZiAoaXRlci5zaXplID4gbWF4U2l6ZSkge1xuICAgICAgICBtYXhTaXplID0gaXRlci5zaXplO1xuICAgICAgfVxuICAgICAgaWYgKCFpc0l0ZXJhYmxlKHZhbHVlKSkge1xuICAgICAgICBpdGVyID0gaXRlci5tYXAoZnVuY3Rpb24odiApIHtyZXR1cm4gZnJvbUpTKHYpfSk7XG4gICAgICB9XG4gICAgICBpdGVycy5wdXNoKGl0ZXIpO1xuICAgIH1cbiAgICBpZiAobWF4U2l6ZSA+IGxpc3Quc2l6ZSkge1xuICAgICAgbGlzdCA9IGxpc3Quc2V0U2l6ZShtYXhTaXplKTtcbiAgICB9XG4gICAgcmV0dXJuIG1lcmdlSW50b0NvbGxlY3Rpb25XaXRoKGxpc3QsIG1lcmdlciwgaXRlcnMpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0VGFpbE9mZnNldChzaXplKSB7XG4gICAgcmV0dXJuIHNpemUgPCBTSVpFID8gMCA6ICgoKHNpemUgLSAxKSA+Pj4gU0hJRlQpIDw8IFNISUZUKTtcbiAgfVxuXG4gIGNyZWF0ZUNsYXNzKE9yZGVyZWRNYXAsIHNyY19NYXBfX01hcCk7XG5cbiAgICAvLyBAcHJhZ21hIENvbnN0cnVjdGlvblxuXG4gICAgZnVuY3Rpb24gT3JkZXJlZE1hcCh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgPyBlbXB0eU9yZGVyZWRNYXAoKSA6XG4gICAgICAgIGlzT3JkZXJlZE1hcCh2YWx1ZSkgPyB2YWx1ZSA6XG4gICAgICAgIGVtcHR5T3JkZXJlZE1hcCgpLndpdGhNdXRhdGlvbnMoZnVuY3Rpb24obWFwICkge1xuICAgICAgICAgIHZhciBpdGVyID0gS2V5ZWRJdGVyYWJsZSh2YWx1ZSk7XG4gICAgICAgICAgYXNzZXJ0Tm90SW5maW5pdGUoaXRlci5zaXplKTtcbiAgICAgICAgICBpdGVyLmZvckVhY2goZnVuY3Rpb24odiwgaykgIHtyZXR1cm4gbWFwLnNldChrLCB2KX0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBPcmRlcmVkTWFwLm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIHRoaXMoYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgT3JkZXJlZE1hcC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ09yZGVyZWRNYXAgeycsICd9Jyk7XG4gICAgfTtcblxuICAgIC8vIEBwcmFnbWEgQWNjZXNzXG5cbiAgICBPcmRlcmVkTWFwLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihrLCBub3RTZXRWYWx1ZSkge1xuICAgICAgdmFyIGluZGV4ID0gdGhpcy5fbWFwLmdldChrKTtcbiAgICAgIHJldHVybiBpbmRleCAhPT0gdW5kZWZpbmVkID8gdGhpcy5fbGlzdC5nZXQoaW5kZXgpWzFdIDogbm90U2V0VmFsdWU7XG4gICAgfTtcblxuICAgIC8vIEBwcmFnbWEgTW9kaWZpY2F0aW9uXG5cbiAgICBPcmRlcmVkTWFwLnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICB0aGlzLnNpemUgPSAwO1xuICAgICAgICB0aGlzLl9tYXAuY2xlYXIoKTtcbiAgICAgICAgdGhpcy5fbGlzdC5jbGVhcigpO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBlbXB0eU9yZGVyZWRNYXAoKTtcbiAgICB9O1xuXG4gICAgT3JkZXJlZE1hcC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oaywgdikge1xuICAgICAgcmV0dXJuIHVwZGF0ZU9yZGVyZWRNYXAodGhpcywgaywgdik7XG4gICAgfTtcblxuICAgIE9yZGVyZWRNYXAucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKGspIHtcbiAgICAgIHJldHVybiB1cGRhdGVPcmRlcmVkTWFwKHRoaXMsIGssIE5PVF9TRVQpO1xuICAgIH07XG5cbiAgICBPcmRlcmVkTWFwLnByb3RvdHlwZS53YXNBbHRlcmVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWFwLndhc0FsdGVyZWQoKSB8fCB0aGlzLl9saXN0Lndhc0FsdGVyZWQoKTtcbiAgICB9O1xuXG4gICAgT3JkZXJlZE1hcC5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHJldHVybiB0aGlzLl9saXN0Ll9faXRlcmF0ZShcbiAgICAgICAgZnVuY3Rpb24oZW50cnkgKSB7cmV0dXJuIGVudHJ5ICYmIGZuKGVudHJ5WzFdLCBlbnRyeVswXSwgdGhpcyQwKX0sXG4gICAgICAgIHJldmVyc2VcbiAgICAgICk7XG4gICAgfTtcblxuICAgIE9yZGVyZWRNYXAucHJvdG90eXBlLl9faXRlcmF0b3IgPSBmdW5jdGlvbih0eXBlLCByZXZlcnNlKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbGlzdC5mcm9tRW50cnlTZXEoKS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgIH07XG5cbiAgICBPcmRlcmVkTWFwLnByb3RvdHlwZS5fX2Vuc3VyZU93bmVyID0gZnVuY3Rpb24ob3duZXJJRCkge1xuICAgICAgaWYgKG93bmVySUQgPT09IHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIG5ld01hcCA9IHRoaXMuX21hcC5fX2Vuc3VyZU93bmVyKG93bmVySUQpO1xuICAgICAgdmFyIG5ld0xpc3QgPSB0aGlzLl9saXN0Ll9fZW5zdXJlT3duZXIob3duZXJJRCk7XG4gICAgICBpZiAoIW93bmVySUQpIHtcbiAgICAgICAgdGhpcy5fX293bmVySUQgPSBvd25lcklEO1xuICAgICAgICB0aGlzLl9tYXAgPSBuZXdNYXA7XG4gICAgICAgIHRoaXMuX2xpc3QgPSBuZXdMaXN0O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYWtlT3JkZXJlZE1hcChuZXdNYXAsIG5ld0xpc3QsIG93bmVySUQsIHRoaXMuX19oYXNoKTtcbiAgICB9O1xuXG5cbiAgZnVuY3Rpb24gaXNPcmRlcmVkTWFwKG1heWJlT3JkZXJlZE1hcCkge1xuICAgIHJldHVybiBpc01hcChtYXliZU9yZGVyZWRNYXApICYmIGlzT3JkZXJlZChtYXliZU9yZGVyZWRNYXApO1xuICB9XG5cbiAgT3JkZXJlZE1hcC5pc09yZGVyZWRNYXAgPSBpc09yZGVyZWRNYXA7XG5cbiAgT3JkZXJlZE1hcC5wcm90b3R5cGVbSVNfT1JERVJFRF9TRU5USU5FTF0gPSB0cnVlO1xuICBPcmRlcmVkTWFwLnByb3RvdHlwZVtERUxFVEVdID0gT3JkZXJlZE1hcC5wcm90b3R5cGUucmVtb3ZlO1xuXG5cblxuICBmdW5jdGlvbiBtYWtlT3JkZXJlZE1hcChtYXAsIGxpc3QsIG93bmVySUQsIGhhc2gpIHtcbiAgICB2YXIgb21hcCA9IE9iamVjdC5jcmVhdGUoT3JkZXJlZE1hcC5wcm90b3R5cGUpO1xuICAgIG9tYXAuc2l6ZSA9IG1hcCA/IG1hcC5zaXplIDogMDtcbiAgICBvbWFwLl9tYXAgPSBtYXA7XG4gICAgb21hcC5fbGlzdCA9IGxpc3Q7XG4gICAgb21hcC5fX293bmVySUQgPSBvd25lcklEO1xuICAgIG9tYXAuX19oYXNoID0gaGFzaDtcbiAgICByZXR1cm4gb21hcDtcbiAgfVxuXG4gIHZhciBFTVBUWV9PUkRFUkVEX01BUDtcbiAgZnVuY3Rpb24gZW1wdHlPcmRlcmVkTWFwKCkge1xuICAgIHJldHVybiBFTVBUWV9PUkRFUkVEX01BUCB8fCAoRU1QVFlfT1JERVJFRF9NQVAgPSBtYWtlT3JkZXJlZE1hcChlbXB0eU1hcCgpLCBlbXB0eUxpc3QoKSkpO1xuICB9XG5cbiAgZnVuY3Rpb24gdXBkYXRlT3JkZXJlZE1hcChvbWFwLCBrLCB2KSB7XG4gICAgdmFyIG1hcCA9IG9tYXAuX21hcDtcbiAgICB2YXIgbGlzdCA9IG9tYXAuX2xpc3Q7XG4gICAgdmFyIGkgPSBtYXAuZ2V0KGspO1xuICAgIHZhciBoYXMgPSBpICE9PSB1bmRlZmluZWQ7XG4gICAgdmFyIG5ld01hcDtcbiAgICB2YXIgbmV3TGlzdDtcbiAgICBpZiAodiA9PT0gTk9UX1NFVCkgeyAvLyByZW1vdmVkXG4gICAgICBpZiAoIWhhcykge1xuICAgICAgICByZXR1cm4gb21hcDtcbiAgICAgIH1cbiAgICAgIGlmIChsaXN0LnNpemUgPj0gU0laRSAmJiBsaXN0LnNpemUgPj0gbWFwLnNpemUgKiAyKSB7XG4gICAgICAgIG5ld0xpc3QgPSBsaXN0LmZpbHRlcihmdW5jdGlvbihlbnRyeSwgaWR4KSAge3JldHVybiBlbnRyeSAhPT0gdW5kZWZpbmVkICYmIGkgIT09IGlkeH0pO1xuICAgICAgICBuZXdNYXAgPSBuZXdMaXN0LnRvS2V5ZWRTZXEoKS5tYXAoZnVuY3Rpb24oZW50cnkgKSB7cmV0dXJuIGVudHJ5WzBdfSkuZmxpcCgpLnRvTWFwKCk7XG4gICAgICAgIGlmIChvbWFwLl9fb3duZXJJRCkge1xuICAgICAgICAgIG5ld01hcC5fX293bmVySUQgPSBuZXdMaXN0Ll9fb3duZXJJRCA9IG9tYXAuX19vd25lcklEO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdNYXAgPSBtYXAucmVtb3ZlKGspO1xuICAgICAgICBuZXdMaXN0ID0gaSA9PT0gbGlzdC5zaXplIC0gMSA/IGxpc3QucG9wKCkgOiBsaXN0LnNldChpLCB1bmRlZmluZWQpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoaGFzKSB7XG4gICAgICAgIGlmICh2ID09PSBsaXN0LmdldChpKVsxXSkge1xuICAgICAgICAgIHJldHVybiBvbWFwO1xuICAgICAgICB9XG4gICAgICAgIG5ld01hcCA9IG1hcDtcbiAgICAgICAgbmV3TGlzdCA9IGxpc3Quc2V0KGksIFtrLCB2XSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdNYXAgPSBtYXAuc2V0KGssIGxpc3Quc2l6ZSk7XG4gICAgICAgIG5ld0xpc3QgPSBsaXN0LnNldChsaXN0LnNpemUsIFtrLCB2XSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvbWFwLl9fb3duZXJJRCkge1xuICAgICAgb21hcC5zaXplID0gbmV3TWFwLnNpemU7XG4gICAgICBvbWFwLl9tYXAgPSBuZXdNYXA7XG4gICAgICBvbWFwLl9saXN0ID0gbmV3TGlzdDtcbiAgICAgIG9tYXAuX19oYXNoID0gdW5kZWZpbmVkO1xuICAgICAgcmV0dXJuIG9tYXA7XG4gICAgfVxuICAgIHJldHVybiBtYWtlT3JkZXJlZE1hcChuZXdNYXAsIG5ld0xpc3QpO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoU3RhY2ssIEluZGV4ZWRDb2xsZWN0aW9uKTtcblxuICAgIC8vIEBwcmFnbWEgQ29uc3RydWN0aW9uXG5cbiAgICBmdW5jdGlvbiBTdGFjayh2YWx1ZSkge1xuICAgICAgcmV0dXJuIHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQgPyBlbXB0eVN0YWNrKCkgOlxuICAgICAgICBpc1N0YWNrKHZhbHVlKSA/IHZhbHVlIDpcbiAgICAgICAgZW1wdHlTdGFjaygpLnVuc2hpZnRBbGwodmFsdWUpO1xuICAgIH1cblxuICAgIFN0YWNrLm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIHRoaXMoYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgU3RhY2sucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3RvU3RyaW5nKCdTdGFjayBbJywgJ10nKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBBY2Nlc3NcblxuICAgIFN0YWNrLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihpbmRleCwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHZhciBoZWFkID0gdGhpcy5faGVhZDtcbiAgICAgIGluZGV4ID0gd3JhcEluZGV4KHRoaXMsIGluZGV4KTtcbiAgICAgIHdoaWxlIChoZWFkICYmIGluZGV4LS0pIHtcbiAgICAgICAgaGVhZCA9IGhlYWQubmV4dDtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoZWFkID8gaGVhZC52YWx1ZSA6IG5vdFNldFZhbHVlO1xuICAgIH07XG5cbiAgICBTdGFjay5wcm90b3R5cGUucGVlayA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2hlYWQgJiYgdGhpcy5faGVhZC52YWx1ZTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBNb2RpZmljYXRpb25cblxuICAgIFN0YWNrLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICB2YXIgbmV3U2l6ZSA9IHRoaXMuc2l6ZSArIGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICB2YXIgaGVhZCA9IHRoaXMuX2hlYWQ7XG4gICAgICBmb3IgKHZhciBpaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpaSA+PSAwOyBpaS0tKSB7XG4gICAgICAgIGhlYWQgPSB7XG4gICAgICAgICAgdmFsdWU6IGFyZ3VtZW50c1tpaV0sXG4gICAgICAgICAgbmV4dDogaGVhZFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IG5ld1NpemU7XG4gICAgICAgIHRoaXMuX2hlYWQgPSBoZWFkO1xuICAgICAgICB0aGlzLl9faGFzaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fX2FsdGVyZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYWtlU3RhY2sobmV3U2l6ZSwgaGVhZCk7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5wdXNoQWxsID0gZnVuY3Rpb24oaXRlcikge1xuICAgICAgaXRlciA9IEluZGV4ZWRJdGVyYWJsZShpdGVyKTtcbiAgICAgIGlmIChpdGVyLnNpemUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBhc3NlcnROb3RJbmZpbml0ZShpdGVyLnNpemUpO1xuICAgICAgdmFyIG5ld1NpemUgPSB0aGlzLnNpemU7XG4gICAgICB2YXIgaGVhZCA9IHRoaXMuX2hlYWQ7XG4gICAgICBpdGVyLnJldmVyc2UoKS5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlICkge1xuICAgICAgICBuZXdTaXplKys7XG4gICAgICAgIGhlYWQgPSB7XG4gICAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICAgIG5leHQ6IGhlYWRcbiAgICAgICAgfTtcbiAgICAgIH0pO1xuICAgICAgaWYgKHRoaXMuX19vd25lcklEKSB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IG5ld1NpemU7XG4gICAgICAgIHRoaXMuX2hlYWQgPSBoZWFkO1xuICAgICAgICB0aGlzLl9faGFzaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fX2FsdGVyZWQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHJldHVybiBtYWtlU3RhY2sobmV3U2l6ZSwgaGVhZCk7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5wb3AgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnNsaWNlKDEpO1xuICAgIH07XG5cbiAgICBTdGFjay5wcm90b3R5cGUudW5zaGlmdCA9IGZ1bmN0aW9uKC8qLi4udmFsdWVzKi8pIHtcbiAgICAgIHJldHVybiB0aGlzLnB1c2guYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgU3RhY2sucHJvdG90eXBlLnVuc2hpZnRBbGwgPSBmdW5jdGlvbihpdGVyKSB7XG4gICAgICByZXR1cm4gdGhpcy5wdXNoQWxsKGl0ZXIpO1xuICAgIH07XG5cbiAgICBTdGFjay5wcm90b3R5cGUuc2hpZnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnBvcC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBTdGFjay5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnNpemUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX293bmVySUQpIHtcbiAgICAgICAgdGhpcy5zaXplID0gMDtcbiAgICAgICAgdGhpcy5faGVhZCA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy5fX2hhc2ggPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMuX19hbHRlcmVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gZW1wdHlTdGFjaygpO1xuICAgIH07XG5cbiAgICBTdGFjay5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbihiZWdpbiwgZW5kKSB7XG4gICAgICBpZiAod2hvbGVTbGljZShiZWdpbiwgZW5kLCB0aGlzLnNpemUpKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIHJlc29sdmVkQmVnaW4gPSByZXNvbHZlQmVnaW4oYmVnaW4sIHRoaXMuc2l6ZSk7XG4gICAgICB2YXIgcmVzb2x2ZWRFbmQgPSByZXNvbHZlRW5kKGVuZCwgdGhpcy5zaXplKTtcbiAgICAgIGlmIChyZXNvbHZlZEVuZCAhPT0gdGhpcy5zaXplKSB7XG4gICAgICAgIC8vIHN1cGVyLnNsaWNlKGJlZ2luLCBlbmQpO1xuICAgICAgICByZXR1cm4gSW5kZXhlZENvbGxlY3Rpb24ucHJvdG90eXBlLnNsaWNlLmNhbGwodGhpcywgYmVnaW4sIGVuZCk7XG4gICAgICB9XG4gICAgICB2YXIgbmV3U2l6ZSA9IHRoaXMuc2l6ZSAtIHJlc29sdmVkQmVnaW47XG4gICAgICB2YXIgaGVhZCA9IHRoaXMuX2hlYWQ7XG4gICAgICB3aGlsZSAocmVzb2x2ZWRCZWdpbi0tKSB7XG4gICAgICAgIGhlYWQgPSBoZWFkLm5leHQ7XG4gICAgICB9XG4gICAgICBpZiAodGhpcy5fX293bmVySUQpIHtcbiAgICAgICAgdGhpcy5zaXplID0gbmV3U2l6ZTtcbiAgICAgICAgdGhpcy5faGVhZCA9IGhlYWQ7XG4gICAgICAgIHRoaXMuX19oYXNoID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLl9fYWx0ZXJlZCA9IHRydWU7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VTdGFjayhuZXdTaXplLCBoZWFkKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBNdXRhYmlsaXR5XG5cbiAgICBTdGFjay5wcm90b3R5cGUuX19lbnN1cmVPd25lciA9IGZ1bmN0aW9uKG93bmVySUQpIHtcbiAgICAgIGlmIChvd25lcklEID09PSB0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICghb3duZXJJRCkge1xuICAgICAgICB0aGlzLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgICAgIHRoaXMuX19hbHRlcmVkID0gZmFsc2U7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VTdGFjayh0aGlzLnNpemUsIHRoaXMuX2hlYWQsIG93bmVySUQsIHRoaXMuX19oYXNoKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBJdGVyYXRpb25cblxuICAgIFN0YWNrLnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmV2ZXJzZSgpLl9faXRlcmF0ZShmbik7XG4gICAgICB9XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMuX2hlYWQ7XG4gICAgICB3aGlsZSAobm9kZSkge1xuICAgICAgICBpZiAoZm4obm9kZS52YWx1ZSwgaXRlcmF0aW9ucysrLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBub2RlID0gbm9kZS5uZXh0O1xuICAgICAgfVxuICAgICAgcmV0dXJuIGl0ZXJhdGlvbnM7XG4gICAgfTtcblxuICAgIFN0YWNrLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgaWYgKHJldmVyc2UpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmV2ZXJzZSgpLl9faXRlcmF0b3IodHlwZSk7XG4gICAgICB9XG4gICAgICB2YXIgaXRlcmF0aW9ucyA9IDA7XG4gICAgICB2YXIgbm9kZSA9IHRoaXMuX2hlYWQ7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgIHZhciB2YWx1ZSA9IG5vZGUudmFsdWU7XG4gICAgICAgICAgbm9kZSA9IG5vZGUubmV4dDtcbiAgICAgICAgICByZXR1cm4gaXRlcmF0b3JWYWx1ZSh0eXBlLCBpdGVyYXRpb25zKyssIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaXRlcmF0b3JEb25lKCk7XG4gICAgICB9KTtcbiAgICB9O1xuXG5cbiAgZnVuY3Rpb24gaXNTdGFjayhtYXliZVN0YWNrKSB7XG4gICAgcmV0dXJuICEhKG1heWJlU3RhY2sgJiYgbWF5YmVTdGFja1tJU19TVEFDS19TRU5USU5FTF0pO1xuICB9XG5cbiAgU3RhY2suaXNTdGFjayA9IGlzU3RhY2s7XG5cbiAgdmFyIElTX1NUQUNLX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfU1RBQ0tfX0BAJztcblxuICB2YXIgU3RhY2tQcm90b3R5cGUgPSBTdGFjay5wcm90b3R5cGU7XG4gIFN0YWNrUHJvdG90eXBlW0lTX1NUQUNLX1NFTlRJTkVMXSA9IHRydWU7XG4gIFN0YWNrUHJvdG90eXBlLndpdGhNdXRhdGlvbnMgPSBNYXBQcm90b3R5cGUud2l0aE11dGF0aW9ucztcbiAgU3RhY2tQcm90b3R5cGUuYXNNdXRhYmxlID0gTWFwUHJvdG90eXBlLmFzTXV0YWJsZTtcbiAgU3RhY2tQcm90b3R5cGUuYXNJbW11dGFibGUgPSBNYXBQcm90b3R5cGUuYXNJbW11dGFibGU7XG4gIFN0YWNrUHJvdG90eXBlLndhc0FsdGVyZWQgPSBNYXBQcm90b3R5cGUud2FzQWx0ZXJlZDtcblxuXG4gIGZ1bmN0aW9uIG1ha2VTdGFjayhzaXplLCBoZWFkLCBvd25lcklELCBoYXNoKSB7XG4gICAgdmFyIG1hcCA9IE9iamVjdC5jcmVhdGUoU3RhY2tQcm90b3R5cGUpO1xuICAgIG1hcC5zaXplID0gc2l6ZTtcbiAgICBtYXAuX2hlYWQgPSBoZWFkO1xuICAgIG1hcC5fX293bmVySUQgPSBvd25lcklEO1xuICAgIG1hcC5fX2hhc2ggPSBoYXNoO1xuICAgIG1hcC5fX2FsdGVyZWQgPSBmYWxzZTtcbiAgICByZXR1cm4gbWFwO1xuICB9XG5cbiAgdmFyIEVNUFRZX1NUQUNLO1xuICBmdW5jdGlvbiBlbXB0eVN0YWNrKCkge1xuICAgIHJldHVybiBFTVBUWV9TVEFDSyB8fCAoRU1QVFlfU1RBQ0sgPSBtYWtlU3RhY2soMCkpO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3Moc3JjX1NldF9fU2V0LCBTZXRDb2xsZWN0aW9uKTtcblxuICAgIC8vIEBwcmFnbWEgQ29uc3RydWN0aW9uXG5cbiAgICBmdW5jdGlvbiBzcmNfU2V0X19TZXQodmFsdWUpIHtcbiAgICAgIHJldHVybiB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkID8gZW1wdHlTZXQoKSA6XG4gICAgICAgIGlzU2V0KHZhbHVlKSAmJiAhaXNPcmRlcmVkKHZhbHVlKSA/IHZhbHVlIDpcbiAgICAgICAgZW1wdHlTZXQoKS53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKHNldCApIHtcbiAgICAgICAgICB2YXIgaXRlciA9IFNldEl0ZXJhYmxlKHZhbHVlKTtcbiAgICAgICAgICBhc3NlcnROb3RJbmZpbml0ZShpdGVyLnNpemUpO1xuICAgICAgICAgIGl0ZXIuZm9yRWFjaChmdW5jdGlvbih2ICkge3JldHVybiBzZXQuYWRkKHYpfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNyY19TZXRfX1NldC5vZiA9IGZ1bmN0aW9uKC8qLi4udmFsdWVzKi8pIHtcbiAgICAgIHJldHVybiB0aGlzKGFyZ3VtZW50cyk7XG4gICAgfTtcblxuICAgIHNyY19TZXRfX1NldC5mcm9tS2V5cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcyhLZXllZEl0ZXJhYmxlKHZhbHVlKS5rZXlTZXEoKSk7XG4gICAgfTtcblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcoJ1NldCB7JywgJ30nKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBBY2Nlc3NcblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUuaGFzID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLl9tYXAuaGFzKHZhbHVlKTtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBNb2RpZmljYXRpb25cblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB1cGRhdGVTZXQodGhpcywgdGhpcy5fbWFwLnNldCh2YWx1ZSwgdHJ1ZSkpO1xuICAgIH07XG5cbiAgICBzcmNfU2V0X19TZXQucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdXBkYXRlU2V0KHRoaXMsIHRoaXMuX21hcC5yZW1vdmUodmFsdWUpKTtcbiAgICB9O1xuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS5jbGVhciA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHVwZGF0ZVNldCh0aGlzLCB0aGlzLl9tYXAuY2xlYXIoKSk7XG4gICAgfTtcblxuICAgIC8vIEBwcmFnbWEgQ29tcG9zaXRpb25cblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUudW5pb24gPSBmdW5jdGlvbigpIHt2YXIgaXRlcnMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgIGl0ZXJzID0gaXRlcnMuZmlsdGVyKGZ1bmN0aW9uKHggKSB7cmV0dXJuIHguc2l6ZSAhPT0gMH0pO1xuICAgICAgaWYgKGl0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGlmICh0aGlzLnNpemUgPT09IDAgJiYgIXRoaXMuX19vd25lcklEICYmIGl0ZXJzLmxlbmd0aCA9PT0gMSkge1xuICAgICAgICByZXR1cm4gdGhpcy5jb25zdHJ1Y3RvcihpdGVyc1swXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKHNldCApIHtcbiAgICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IGl0ZXJzLmxlbmd0aDsgaWkrKykge1xuICAgICAgICAgIFNldEl0ZXJhYmxlKGl0ZXJzW2lpXSkuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSApIHtyZXR1cm4gc2V0LmFkZCh2YWx1ZSl9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUuaW50ZXJzZWN0ID0gZnVuY3Rpb24oKSB7dmFyIGl0ZXJzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMCk7XG4gICAgICBpZiAoaXRlcnMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgaXRlcnMgPSBpdGVycy5tYXAoZnVuY3Rpb24oaXRlciApIHtyZXR1cm4gU2V0SXRlcmFibGUoaXRlcil9KTtcbiAgICAgIHZhciBvcmlnaW5hbFNldCA9IHRoaXM7XG4gICAgICByZXR1cm4gdGhpcy53aXRoTXV0YXRpb25zKGZ1bmN0aW9uKHNldCApIHtcbiAgICAgICAgb3JpZ2luYWxTZXQuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSApIHtcbiAgICAgICAgICBpZiAoIWl0ZXJzLmV2ZXJ5KGZ1bmN0aW9uKGl0ZXIgKSB7cmV0dXJuIGl0ZXIuaW5jbHVkZXModmFsdWUpfSkpIHtcbiAgICAgICAgICAgIHNldC5yZW1vdmUodmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS5zdWJ0cmFjdCA9IGZ1bmN0aW9uKCkge3ZhciBpdGVycyA9IFNMSUNFJDAuY2FsbChhcmd1bWVudHMsIDApO1xuICAgICAgaWYgKGl0ZXJzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGl0ZXJzID0gaXRlcnMubWFwKGZ1bmN0aW9uKGl0ZXIgKSB7cmV0dXJuIFNldEl0ZXJhYmxlKGl0ZXIpfSk7XG4gICAgICB2YXIgb3JpZ2luYWxTZXQgPSB0aGlzO1xuICAgICAgcmV0dXJuIHRoaXMud2l0aE11dGF0aW9ucyhmdW5jdGlvbihzZXQgKSB7XG4gICAgICAgIG9yaWdpbmFsU2V0LmZvckVhY2goZnVuY3Rpb24odmFsdWUgKSB7XG4gICAgICAgICAgaWYgKGl0ZXJzLnNvbWUoZnVuY3Rpb24oaXRlciApIHtyZXR1cm4gaXRlci5pbmNsdWRlcyh2YWx1ZSl9KSkge1xuICAgICAgICAgICAgc2V0LnJlbW92ZSh2YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzcmNfU2V0X19TZXQucHJvdG90eXBlLm1lcmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy51bmlvbi5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH07XG5cbiAgICBzcmNfU2V0X19TZXQucHJvdG90eXBlLm1lcmdlV2l0aCA9IGZ1bmN0aW9uKG1lcmdlcikge3ZhciBpdGVycyA9IFNMSUNFJDAuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgcmV0dXJuIHRoaXMudW5pb24uYXBwbHkodGhpcywgaXRlcnMpO1xuICAgIH07XG5cbiAgICBzcmNfU2V0X19TZXQucHJvdG90eXBlLnNvcnQgPSBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICAvLyBMYXRlIGJpbmRpbmdcbiAgICAgIHJldHVybiBPcmRlcmVkU2V0KHNvcnRGYWN0b3J5KHRoaXMsIGNvbXBhcmF0b3IpKTtcbiAgICB9O1xuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS5zb3J0QnkgPSBmdW5jdGlvbihtYXBwZXIsIGNvbXBhcmF0b3IpIHtcbiAgICAgIC8vIExhdGUgYmluZGluZ1xuICAgICAgcmV0dXJuIE9yZGVyZWRTZXQoc29ydEZhY3RvcnkodGhpcywgY29tcGFyYXRvciwgbWFwcGVyKSk7XG4gICAgfTtcblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUud2FzQWx0ZXJlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX21hcC53YXNBbHRlcmVkKCk7XG4gICAgfTtcblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHJldHVybiB0aGlzLl9tYXAuX19pdGVyYXRlKGZ1bmN0aW9uKF8sIGspICB7cmV0dXJuIGZuKGssIGssIHRoaXMkMCl9LCByZXZlcnNlKTtcbiAgICB9O1xuXG4gICAgc3JjX1NldF9fU2V0LnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge1xuICAgICAgcmV0dXJuIHRoaXMuX21hcC5tYXAoZnVuY3Rpb24oXywgaykgIHtyZXR1cm4ga30pLl9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSk7XG4gICAgfTtcblxuICAgIHNyY19TZXRfX1NldC5wcm90b3R5cGUuX19lbnN1cmVPd25lciA9IGZ1bmN0aW9uKG93bmVySUQpIHtcbiAgICAgIGlmIChvd25lcklEID09PSB0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHZhciBuZXdNYXAgPSB0aGlzLl9tYXAuX19lbnN1cmVPd25lcihvd25lcklEKTtcbiAgICAgIGlmICghb3duZXJJRCkge1xuICAgICAgICB0aGlzLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgICAgIHRoaXMuX21hcCA9IG5ld01hcDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG4gICAgICByZXR1cm4gdGhpcy5fX21ha2UobmV3TWFwLCBvd25lcklEKTtcbiAgICB9O1xuXG5cbiAgZnVuY3Rpb24gaXNTZXQobWF5YmVTZXQpIHtcbiAgICByZXR1cm4gISEobWF5YmVTZXQgJiYgbWF5YmVTZXRbSVNfU0VUX1NFTlRJTkVMXSk7XG4gIH1cblxuICBzcmNfU2V0X19TZXQuaXNTZXQgPSBpc1NldDtcblxuICB2YXIgSVNfU0VUX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfU0VUX19AQCc7XG5cbiAgdmFyIFNldFByb3RvdHlwZSA9IHNyY19TZXRfX1NldC5wcm90b3R5cGU7XG4gIFNldFByb3RvdHlwZVtJU19TRVRfU0VOVElORUxdID0gdHJ1ZTtcbiAgU2V0UHJvdG90eXBlW0RFTEVURV0gPSBTZXRQcm90b3R5cGUucmVtb3ZlO1xuICBTZXRQcm90b3R5cGUubWVyZ2VEZWVwID0gU2V0UHJvdG90eXBlLm1lcmdlO1xuICBTZXRQcm90b3R5cGUubWVyZ2VEZWVwV2l0aCA9IFNldFByb3RvdHlwZS5tZXJnZVdpdGg7XG4gIFNldFByb3RvdHlwZS53aXRoTXV0YXRpb25zID0gTWFwUHJvdG90eXBlLndpdGhNdXRhdGlvbnM7XG4gIFNldFByb3RvdHlwZS5hc011dGFibGUgPSBNYXBQcm90b3R5cGUuYXNNdXRhYmxlO1xuICBTZXRQcm90b3R5cGUuYXNJbW11dGFibGUgPSBNYXBQcm90b3R5cGUuYXNJbW11dGFibGU7XG5cbiAgU2V0UHJvdG90eXBlLl9fZW1wdHkgPSBlbXB0eVNldDtcbiAgU2V0UHJvdG90eXBlLl9fbWFrZSA9IG1ha2VTZXQ7XG5cbiAgZnVuY3Rpb24gdXBkYXRlU2V0KHNldCwgbmV3TWFwKSB7XG4gICAgaWYgKHNldC5fX293bmVySUQpIHtcbiAgICAgIHNldC5zaXplID0gbmV3TWFwLnNpemU7XG4gICAgICBzZXQuX21hcCA9IG5ld01hcDtcbiAgICAgIHJldHVybiBzZXQ7XG4gICAgfVxuICAgIHJldHVybiBuZXdNYXAgPT09IHNldC5fbWFwID8gc2V0IDpcbiAgICAgIG5ld01hcC5zaXplID09PSAwID8gc2V0Ll9fZW1wdHkoKSA6XG4gICAgICBzZXQuX19tYWtlKG5ld01hcCk7XG4gIH1cblxuICBmdW5jdGlvbiBtYWtlU2V0KG1hcCwgb3duZXJJRCkge1xuICAgIHZhciBzZXQgPSBPYmplY3QuY3JlYXRlKFNldFByb3RvdHlwZSk7XG4gICAgc2V0LnNpemUgPSBtYXAgPyBtYXAuc2l6ZSA6IDA7XG4gICAgc2V0Ll9tYXAgPSBtYXA7XG4gICAgc2V0Ll9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgcmV0dXJuIHNldDtcbiAgfVxuXG4gIHZhciBFTVBUWV9TRVQ7XG4gIGZ1bmN0aW9uIGVtcHR5U2V0KCkge1xuICAgIHJldHVybiBFTVBUWV9TRVQgfHwgKEVNUFRZX1NFVCA9IG1ha2VTZXQoZW1wdHlNYXAoKSkpO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoT3JkZXJlZFNldCwgc3JjX1NldF9fU2V0KTtcblxuICAgIC8vIEBwcmFnbWEgQ29uc3RydWN0aW9uXG5cbiAgICBmdW5jdGlvbiBPcmRlcmVkU2V0KHZhbHVlKSB7XG4gICAgICByZXR1cm4gdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCA/IGVtcHR5T3JkZXJlZFNldCgpIDpcbiAgICAgICAgaXNPcmRlcmVkU2V0KHZhbHVlKSA/IHZhbHVlIDpcbiAgICAgICAgZW1wdHlPcmRlcmVkU2V0KCkud2l0aE11dGF0aW9ucyhmdW5jdGlvbihzZXQgKSB7XG4gICAgICAgICAgdmFyIGl0ZXIgPSBTZXRJdGVyYWJsZSh2YWx1ZSk7XG4gICAgICAgICAgYXNzZXJ0Tm90SW5maW5pdGUoaXRlci5zaXplKTtcbiAgICAgICAgICBpdGVyLmZvckVhY2goZnVuY3Rpb24odiApIHtyZXR1cm4gc2V0LmFkZCh2KX0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBPcmRlcmVkU2V0Lm9mID0gZnVuY3Rpb24oLyouLi52YWx1ZXMqLykge1xuICAgICAgcmV0dXJuIHRoaXMoYXJndW1lbnRzKTtcbiAgICB9O1xuXG4gICAgT3JkZXJlZFNldC5mcm9tS2V5cyA9IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcyhLZXllZEl0ZXJhYmxlKHZhbHVlKS5rZXlTZXEoKSk7XG4gICAgfTtcblxuICAgIE9yZGVyZWRTZXQucHJvdG90eXBlLnRvU3RyaW5nID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX3RvU3RyaW5nKCdPcmRlcmVkU2V0IHsnLCAnfScpO1xuICAgIH07XG5cblxuICBmdW5jdGlvbiBpc09yZGVyZWRTZXQobWF5YmVPcmRlcmVkU2V0KSB7XG4gICAgcmV0dXJuIGlzU2V0KG1heWJlT3JkZXJlZFNldCkgJiYgaXNPcmRlcmVkKG1heWJlT3JkZXJlZFNldCk7XG4gIH1cblxuICBPcmRlcmVkU2V0LmlzT3JkZXJlZFNldCA9IGlzT3JkZXJlZFNldDtcblxuICB2YXIgT3JkZXJlZFNldFByb3RvdHlwZSA9IE9yZGVyZWRTZXQucHJvdG90eXBlO1xuICBPcmRlcmVkU2V0UHJvdG90eXBlW0lTX09SREVSRURfU0VOVElORUxdID0gdHJ1ZTtcblxuICBPcmRlcmVkU2V0UHJvdG90eXBlLl9fZW1wdHkgPSBlbXB0eU9yZGVyZWRTZXQ7XG4gIE9yZGVyZWRTZXRQcm90b3R5cGUuX19tYWtlID0gbWFrZU9yZGVyZWRTZXQ7XG5cbiAgZnVuY3Rpb24gbWFrZU9yZGVyZWRTZXQobWFwLCBvd25lcklEKSB7XG4gICAgdmFyIHNldCA9IE9iamVjdC5jcmVhdGUoT3JkZXJlZFNldFByb3RvdHlwZSk7XG4gICAgc2V0LnNpemUgPSBtYXAgPyBtYXAuc2l6ZSA6IDA7XG4gICAgc2V0Ll9tYXAgPSBtYXA7XG4gICAgc2V0Ll9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgcmV0dXJuIHNldDtcbiAgfVxuXG4gIHZhciBFTVBUWV9PUkRFUkVEX1NFVDtcbiAgZnVuY3Rpb24gZW1wdHlPcmRlcmVkU2V0KCkge1xuICAgIHJldHVybiBFTVBUWV9PUkRFUkVEX1NFVCB8fCAoRU1QVFlfT1JERVJFRF9TRVQgPSBtYWtlT3JkZXJlZFNldChlbXB0eU9yZGVyZWRNYXAoKSkpO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoUmVjb3JkLCBLZXllZENvbGxlY3Rpb24pO1xuXG4gICAgZnVuY3Rpb24gUmVjb3JkKGRlZmF1bHRWYWx1ZXMsIG5hbWUpIHtcbiAgICAgIHZhciBoYXNJbml0aWFsaXplZDtcblxuICAgICAgdmFyIFJlY29yZFR5cGUgPSBmdW5jdGlvbiBSZWNvcmQodmFsdWVzKSB7XG4gICAgICAgIGlmICh2YWx1ZXMgaW5zdGFuY2VvZiBSZWNvcmRUeXBlKSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICAgICAgfVxuICAgICAgICBpZiAoISh0aGlzIGluc3RhbmNlb2YgUmVjb3JkVHlwZSkpIHtcbiAgICAgICAgICByZXR1cm4gbmV3IFJlY29yZFR5cGUodmFsdWVzKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIWhhc0luaXRpYWxpemVkKSB7XG4gICAgICAgICAgaGFzSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMoZGVmYXVsdFZhbHVlcyk7XG4gICAgICAgICAgc2V0UHJvcHMoUmVjb3JkVHlwZVByb3RvdHlwZSwga2V5cyk7XG4gICAgICAgICAgUmVjb3JkVHlwZVByb3RvdHlwZS5zaXplID0ga2V5cy5sZW5ndGg7XG4gICAgICAgICAgUmVjb3JkVHlwZVByb3RvdHlwZS5fbmFtZSA9IG5hbWU7XG4gICAgICAgICAgUmVjb3JkVHlwZVByb3RvdHlwZS5fa2V5cyA9IGtleXM7XG4gICAgICAgICAgUmVjb3JkVHlwZVByb3RvdHlwZS5fZGVmYXVsdFZhbHVlcyA9IGRlZmF1bHRWYWx1ZXM7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5fbWFwID0gc3JjX01hcF9fTWFwKHZhbHVlcyk7XG4gICAgICB9O1xuXG4gICAgICB2YXIgUmVjb3JkVHlwZVByb3RvdHlwZSA9IFJlY29yZFR5cGUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShSZWNvcmRQcm90b3R5cGUpO1xuICAgICAgUmVjb3JkVHlwZVByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFJlY29yZFR5cGU7XG5cbiAgICAgIHJldHVybiBSZWNvcmRUeXBlO1xuICAgIH1cblxuICAgIFJlY29yZC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9fdG9TdHJpbmcocmVjb3JkTmFtZSh0aGlzKSArICcgeycsICd9Jyk7XG4gICAgfTtcblxuICAgIC8vIEBwcmFnbWEgQWNjZXNzXG5cbiAgICBSZWNvcmQucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKGspIHtcbiAgICAgIHJldHVybiB0aGlzLl9kZWZhdWx0VmFsdWVzLmhhc093blByb3BlcnR5KGspO1xuICAgIH07XG5cbiAgICBSZWNvcmQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGssIG5vdFNldFZhbHVlKSB7XG4gICAgICBpZiAoIXRoaXMuaGFzKGspKSB7XG4gICAgICAgIHJldHVybiBub3RTZXRWYWx1ZTtcbiAgICAgIH1cbiAgICAgIHZhciBkZWZhdWx0VmFsID0gdGhpcy5fZGVmYXVsdFZhbHVlc1trXTtcbiAgICAgIHJldHVybiB0aGlzLl9tYXAgPyB0aGlzLl9tYXAuZ2V0KGssIGRlZmF1bHRWYWwpIDogZGVmYXVsdFZhbDtcbiAgICB9O1xuXG4gICAgLy8gQHByYWdtYSBNb2RpZmljYXRpb25cblxuICAgIFJlY29yZC5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICB0aGlzLl9tYXAgJiYgdGhpcy5fbWFwLmNsZWFyKCk7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIFJlY29yZFR5cGUgPSB0aGlzLmNvbnN0cnVjdG9yO1xuICAgICAgcmV0dXJuIFJlY29yZFR5cGUuX2VtcHR5IHx8IChSZWNvcmRUeXBlLl9lbXB0eSA9IG1ha2VSZWNvcmQodGhpcywgZW1wdHlNYXAoKSkpO1xuICAgIH07XG5cbiAgICBSZWNvcmQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKGssIHYpIHtcbiAgICAgIGlmICghdGhpcy5oYXMoaykpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3Qgc2V0IHVua25vd24ga2V5IFwiJyArIGsgKyAnXCIgb24gJyArIHJlY29yZE5hbWUodGhpcykpO1xuICAgICAgfVxuICAgICAgdmFyIG5ld01hcCA9IHRoaXMuX21hcCAmJiB0aGlzLl9tYXAuc2V0KGssIHYpO1xuICAgICAgaWYgKHRoaXMuX19vd25lcklEIHx8IG5ld01hcCA9PT0gdGhpcy5fbWFwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VSZWNvcmQodGhpcywgbmV3TWFwKTtcbiAgICB9O1xuXG4gICAgUmVjb3JkLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbihrKSB7XG4gICAgICBpZiAoIXRoaXMuaGFzKGspKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgdmFyIG5ld01hcCA9IHRoaXMuX21hcCAmJiB0aGlzLl9tYXAucmVtb3ZlKGspO1xuICAgICAgaWYgKHRoaXMuX19vd25lcklEIHx8IG5ld01hcCA9PT0gdGhpcy5fbWFwKSB7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VSZWNvcmQodGhpcywgbmV3TWFwKTtcbiAgICB9O1xuXG4gICAgUmVjb3JkLnByb3RvdHlwZS53YXNBbHRlcmVkID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbWFwLndhc0FsdGVyZWQoKTtcbiAgICB9O1xuXG4gICAgUmVjb3JkLnByb3RvdHlwZS5fX2l0ZXJhdG9yID0gZnVuY3Rpb24odHlwZSwgcmV2ZXJzZSkge3ZhciB0aGlzJDAgPSB0aGlzO1xuICAgICAgcmV0dXJuIEtleWVkSXRlcmFibGUodGhpcy5fZGVmYXVsdFZhbHVlcykubWFwKGZ1bmN0aW9uKF8sIGspICB7cmV0dXJuIHRoaXMkMC5nZXQoayl9KS5fX2l0ZXJhdG9yKHR5cGUsIHJldmVyc2UpO1xuICAgIH07XG5cbiAgICBSZWNvcmQucHJvdG90eXBlLl9faXRlcmF0ZSA9IGZ1bmN0aW9uKGZuLCByZXZlcnNlKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICByZXR1cm4gS2V5ZWRJdGVyYWJsZSh0aGlzLl9kZWZhdWx0VmFsdWVzKS5tYXAoZnVuY3Rpb24oXywgaykgIHtyZXR1cm4gdGhpcyQwLmdldChrKX0pLl9faXRlcmF0ZShmbiwgcmV2ZXJzZSk7XG4gICAgfTtcblxuICAgIFJlY29yZC5wcm90b3R5cGUuX19lbnN1cmVPd25lciA9IGZ1bmN0aW9uKG93bmVySUQpIHtcbiAgICAgIGlmIChvd25lcklEID09PSB0aGlzLl9fb3duZXJJRCkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIHZhciBuZXdNYXAgPSB0aGlzLl9tYXAgJiYgdGhpcy5fbWFwLl9fZW5zdXJlT3duZXIob3duZXJJRCk7XG4gICAgICBpZiAoIW93bmVySUQpIHtcbiAgICAgICAgdGhpcy5fX293bmVySUQgPSBvd25lcklEO1xuICAgICAgICB0aGlzLl9tYXAgPSBuZXdNYXA7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1ha2VSZWNvcmQodGhpcywgbmV3TWFwLCBvd25lcklEKTtcbiAgICB9O1xuXG5cbiAgdmFyIFJlY29yZFByb3RvdHlwZSA9IFJlY29yZC5wcm90b3R5cGU7XG4gIFJlY29yZFByb3RvdHlwZVtERUxFVEVdID0gUmVjb3JkUHJvdG90eXBlLnJlbW92ZTtcbiAgUmVjb3JkUHJvdG90eXBlLmRlbGV0ZUluID1cbiAgUmVjb3JkUHJvdG90eXBlLnJlbW92ZUluID0gTWFwUHJvdG90eXBlLnJlbW92ZUluO1xuICBSZWNvcmRQcm90b3R5cGUubWVyZ2UgPSBNYXBQcm90b3R5cGUubWVyZ2U7XG4gIFJlY29yZFByb3RvdHlwZS5tZXJnZVdpdGggPSBNYXBQcm90b3R5cGUubWVyZ2VXaXRoO1xuICBSZWNvcmRQcm90b3R5cGUubWVyZ2VJbiA9IE1hcFByb3RvdHlwZS5tZXJnZUluO1xuICBSZWNvcmRQcm90b3R5cGUubWVyZ2VEZWVwID0gTWFwUHJvdG90eXBlLm1lcmdlRGVlcDtcbiAgUmVjb3JkUHJvdG90eXBlLm1lcmdlRGVlcFdpdGggPSBNYXBQcm90b3R5cGUubWVyZ2VEZWVwV2l0aDtcbiAgUmVjb3JkUHJvdG90eXBlLm1lcmdlRGVlcEluID0gTWFwUHJvdG90eXBlLm1lcmdlRGVlcEluO1xuICBSZWNvcmRQcm90b3R5cGUuc2V0SW4gPSBNYXBQcm90b3R5cGUuc2V0SW47XG4gIFJlY29yZFByb3RvdHlwZS51cGRhdGUgPSBNYXBQcm90b3R5cGUudXBkYXRlO1xuICBSZWNvcmRQcm90b3R5cGUudXBkYXRlSW4gPSBNYXBQcm90b3R5cGUudXBkYXRlSW47XG4gIFJlY29yZFByb3RvdHlwZS53aXRoTXV0YXRpb25zID0gTWFwUHJvdG90eXBlLndpdGhNdXRhdGlvbnM7XG4gIFJlY29yZFByb3RvdHlwZS5hc011dGFibGUgPSBNYXBQcm90b3R5cGUuYXNNdXRhYmxlO1xuICBSZWNvcmRQcm90b3R5cGUuYXNJbW11dGFibGUgPSBNYXBQcm90b3R5cGUuYXNJbW11dGFibGU7XG5cblxuICBmdW5jdGlvbiBtYWtlUmVjb3JkKGxpa2VSZWNvcmQsIG1hcCwgb3duZXJJRCkge1xuICAgIHZhciByZWNvcmQgPSBPYmplY3QuY3JlYXRlKE9iamVjdC5nZXRQcm90b3R5cGVPZihsaWtlUmVjb3JkKSk7XG4gICAgcmVjb3JkLl9tYXAgPSBtYXA7XG4gICAgcmVjb3JkLl9fb3duZXJJRCA9IG93bmVySUQ7XG4gICAgcmV0dXJuIHJlY29yZDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlY29yZE5hbWUocmVjb3JkKSB7XG4gICAgcmV0dXJuIHJlY29yZC5fbmFtZSB8fCByZWNvcmQuY29uc3RydWN0b3IubmFtZSB8fCAnUmVjb3JkJztcbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFByb3BzKHByb3RvdHlwZSwgbmFtZXMpIHtcbiAgICB0cnkge1xuICAgICAgbmFtZXMuZm9yRWFjaChzZXRQcm9wLmJpbmQodW5kZWZpbmVkLCBwcm90b3R5cGUpKTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgLy8gT2JqZWN0LmRlZmluZVByb3BlcnR5IGZhaWxlZC4gUHJvYmFibHkgSUU4LlxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHNldFByb3AocHJvdG90eXBlLCBuYW1lKSB7XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb3RvdHlwZSwgbmFtZSwge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KG5hbWUpO1xuICAgICAgfSxcbiAgICAgIHNldDogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgaW52YXJpYW50KHRoaXMuX19vd25lcklELCAnQ2Fubm90IHNldCBvbiBhbiBpbW11dGFibGUgcmVjb3JkLicpO1xuICAgICAgICB0aGlzLnNldChuYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBmdW5jdGlvbiBkZWVwRXF1YWwoYSwgYikge1xuICAgIGlmIChhID09PSBiKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBpZiAoXG4gICAgICAhaXNJdGVyYWJsZShiKSB8fFxuICAgICAgYS5zaXplICE9PSB1bmRlZmluZWQgJiYgYi5zaXplICE9PSB1bmRlZmluZWQgJiYgYS5zaXplICE9PSBiLnNpemUgfHxcbiAgICAgIGEuX19oYXNoICE9PSB1bmRlZmluZWQgJiYgYi5fX2hhc2ggIT09IHVuZGVmaW5lZCAmJiBhLl9faGFzaCAhPT0gYi5fX2hhc2ggfHxcbiAgICAgIGlzS2V5ZWQoYSkgIT09IGlzS2V5ZWQoYikgfHxcbiAgICAgIGlzSW5kZXhlZChhKSAhPT0gaXNJbmRleGVkKGIpIHx8XG4gICAgICBpc09yZGVyZWQoYSkgIT09IGlzT3JkZXJlZChiKVxuICAgICkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmIChhLnNpemUgPT09IDAgJiYgYi5zaXplID09PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICB2YXIgbm90QXNzb2NpYXRpdmUgPSAhaXNBc3NvY2lhdGl2ZShhKTtcblxuICAgIGlmIChpc09yZGVyZWQoYSkpIHtcbiAgICAgIHZhciBlbnRyaWVzID0gYS5lbnRyaWVzKCk7XG4gICAgICByZXR1cm4gYi5ldmVyeShmdW5jdGlvbih2LCBrKSAge1xuICAgICAgICB2YXIgZW50cnkgPSBlbnRyaWVzLm5leHQoKS52YWx1ZTtcbiAgICAgICAgcmV0dXJuIGVudHJ5ICYmIGlzKGVudHJ5WzFdLCB2KSAmJiAobm90QXNzb2NpYXRpdmUgfHwgaXMoZW50cnlbMF0sIGspKTtcbiAgICAgIH0pICYmIGVudHJpZXMubmV4dCgpLmRvbmU7XG4gICAgfVxuXG4gICAgdmFyIGZsaXBwZWQgPSBmYWxzZTtcblxuICAgIGlmIChhLnNpemUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKGIuc2l6ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICh0eXBlb2YgYS5jYWNoZVJlc3VsdCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgIGEuY2FjaGVSZXN1bHQoKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZmxpcHBlZCA9IHRydWU7XG4gICAgICAgIHZhciBfID0gYTtcbiAgICAgICAgYSA9IGI7XG4gICAgICAgIGIgPSBfO1xuICAgICAgfVxuICAgIH1cblxuICAgIHZhciBhbGxFcXVhbCA9IHRydWU7XG4gICAgdmFyIGJTaXplID0gYi5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaykgIHtcbiAgICAgIGlmIChub3RBc3NvY2lhdGl2ZSA/ICFhLmhhcyh2KSA6XG4gICAgICAgICAgZmxpcHBlZCA/ICFpcyh2LCBhLmdldChrLCBOT1RfU0VUKSkgOiAhaXMoYS5nZXQoaywgTk9UX1NFVCksIHYpKSB7XG4gICAgICAgIGFsbEVxdWFsID0gZmFsc2U7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBhbGxFcXVhbCAmJiBhLnNpemUgPT09IGJTaXplO1xuICB9XG5cbiAgY3JlYXRlQ2xhc3MoUmFuZ2UsIEluZGV4ZWRTZXEpO1xuXG4gICAgZnVuY3Rpb24gUmFuZ2Uoc3RhcnQsIGVuZCwgc3RlcCkge1xuICAgICAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFJhbmdlKSkge1xuICAgICAgICByZXR1cm4gbmV3IFJhbmdlKHN0YXJ0LCBlbmQsIHN0ZXApO1xuICAgICAgfVxuICAgICAgaW52YXJpYW50KHN0ZXAgIT09IDAsICdDYW5ub3Qgc3RlcCBhIFJhbmdlIGJ5IDAnKTtcbiAgICAgIHN0YXJ0ID0gc3RhcnQgfHwgMDtcbiAgICAgIGlmIChlbmQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBlbmQgPSBJbmZpbml0eTtcbiAgICAgIH1cbiAgICAgIHN0ZXAgPSBzdGVwID09PSB1bmRlZmluZWQgPyAxIDogTWF0aC5hYnMoc3RlcCk7XG4gICAgICBpZiAoZW5kIDwgc3RhcnQpIHtcbiAgICAgICAgc3RlcCA9IC1zdGVwO1xuICAgICAgfVxuICAgICAgdGhpcy5fc3RhcnQgPSBzdGFydDtcbiAgICAgIHRoaXMuX2VuZCA9IGVuZDtcbiAgICAgIHRoaXMuX3N0ZXAgPSBzdGVwO1xuICAgICAgdGhpcy5zaXplID0gTWF0aC5tYXgoMCwgTWF0aC5jZWlsKChlbmQgLSBzdGFydCkgLyBzdGVwIC0gMSkgKyAxKTtcbiAgICAgIGlmICh0aGlzLnNpemUgPT09IDApIHtcbiAgICAgICAgaWYgKEVNUFRZX1JBTkdFKSB7XG4gICAgICAgICAgcmV0dXJuIEVNUFRZX1JBTkdFO1xuICAgICAgICB9XG4gICAgICAgIEVNUFRZX1JBTkdFID0gdGhpcztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBSYW5nZS5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnNpemUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuICdSYW5nZSBbXSc7XG4gICAgICB9XG4gICAgICByZXR1cm4gJ1JhbmdlIFsgJyArXG4gICAgICAgIHRoaXMuX3N0YXJ0ICsgJy4uLicgKyB0aGlzLl9lbmQgK1xuICAgICAgICAodGhpcy5fc3RlcCA+IDEgPyAnIGJ5ICcgKyB0aGlzLl9zdGVwIDogJycpICtcbiAgICAgICcgXSc7XG4gICAgfTtcblxuICAgIFJhbmdlLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihpbmRleCwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhcyhpbmRleCkgP1xuICAgICAgICB0aGlzLl9zdGFydCArIHdyYXBJbmRleCh0aGlzLCBpbmRleCkgKiB0aGlzLl9zdGVwIDpcbiAgICAgICAgbm90U2V0VmFsdWU7XG4gICAgfTtcblxuICAgIFJhbmdlLnByb3RvdHlwZS5pbmNsdWRlcyA9IGZ1bmN0aW9uKHNlYXJjaFZhbHVlKSB7XG4gICAgICB2YXIgcG9zc2libGVJbmRleCA9IChzZWFyY2hWYWx1ZSAtIHRoaXMuX3N0YXJ0KSAvIHRoaXMuX3N0ZXA7XG4gICAgICByZXR1cm4gcG9zc2libGVJbmRleCA+PSAwICYmXG4gICAgICAgIHBvc3NpYmxlSW5kZXggPCB0aGlzLnNpemUgJiZcbiAgICAgICAgcG9zc2libGVJbmRleCA9PT0gTWF0aC5mbG9vcihwb3NzaWJsZUluZGV4KTtcbiAgICB9O1xuXG4gICAgUmFuZ2UucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24oYmVnaW4sIGVuZCkge1xuICAgICAgaWYgKHdob2xlU2xpY2UoYmVnaW4sIGVuZCwgdGhpcy5zaXplKSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIGJlZ2luID0gcmVzb2x2ZUJlZ2luKGJlZ2luLCB0aGlzLnNpemUpO1xuICAgICAgZW5kID0gcmVzb2x2ZUVuZChlbmQsIHRoaXMuc2l6ZSk7XG4gICAgICBpZiAoZW5kIDw9IGJlZ2luKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmFuZ2UoMCwgMCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IFJhbmdlKHRoaXMuZ2V0KGJlZ2luLCB0aGlzLl9lbmQpLCB0aGlzLmdldChlbmQsIHRoaXMuX2VuZCksIHRoaXMuX3N0ZXApO1xuICAgIH07XG5cbiAgICBSYW5nZS5wcm90b3R5cGUuaW5kZXhPZiA9IGZ1bmN0aW9uKHNlYXJjaFZhbHVlKSB7XG4gICAgICB2YXIgb2Zmc2V0VmFsdWUgPSBzZWFyY2hWYWx1ZSAtIHRoaXMuX3N0YXJ0O1xuICAgICAgaWYgKG9mZnNldFZhbHVlICUgdGhpcy5fc3RlcCA9PT0gMCkge1xuICAgICAgICB2YXIgaW5kZXggPSBvZmZzZXRWYWx1ZSAvIHRoaXMuX3N0ZXA7XG4gICAgICAgIGlmIChpbmRleCA+PSAwICYmIGluZGV4IDwgdGhpcy5zaXplKSB7XG4gICAgICAgICAgcmV0dXJuIGluZGV4XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuXG4gICAgUmFuZ2UucHJvdG90eXBlLmxhc3RJbmRleE9mID0gZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmluZGV4T2Yoc2VhcmNoVmFsdWUpO1xuICAgIH07XG5cbiAgICBSYW5nZS5wcm90b3R5cGUuX19pdGVyYXRlID0gZnVuY3Rpb24oZm4sIHJldmVyc2UpIHtcbiAgICAgIHZhciBtYXhJbmRleCA9IHRoaXMuc2l6ZSAtIDE7XG4gICAgICB2YXIgc3RlcCA9IHRoaXMuX3N0ZXA7XG4gICAgICB2YXIgdmFsdWUgPSByZXZlcnNlID8gdGhpcy5fc3RhcnQgKyBtYXhJbmRleCAqIHN0ZXAgOiB0aGlzLl9zdGFydDtcbiAgICAgIGZvciAodmFyIGlpID0gMDsgaWkgPD0gbWF4SW5kZXg7IGlpKyspIHtcbiAgICAgICAgaWYgKGZuKHZhbHVlLCBpaSwgdGhpcykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgcmV0dXJuIGlpICsgMTtcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZSArPSByZXZlcnNlID8gLXN0ZXAgOiBzdGVwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGlpO1xuICAgIH07XG5cbiAgICBSYW5nZS5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHtcbiAgICAgIHZhciBtYXhJbmRleCA9IHRoaXMuc2l6ZSAtIDE7XG4gICAgICB2YXIgc3RlcCA9IHRoaXMuX3N0ZXA7XG4gICAgICB2YXIgdmFsdWUgPSByZXZlcnNlID8gdGhpcy5fc3RhcnQgKyBtYXhJbmRleCAqIHN0ZXAgOiB0aGlzLl9zdGFydDtcbiAgICAgIHZhciBpaSA9IDA7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSAge1xuICAgICAgICB2YXIgdiA9IHZhbHVlO1xuICAgICAgICB2YWx1ZSArPSByZXZlcnNlID8gLXN0ZXAgOiBzdGVwO1xuICAgICAgICByZXR1cm4gaWkgPiBtYXhJbmRleCA/IGl0ZXJhdG9yRG9uZSgpIDogaXRlcmF0b3JWYWx1ZSh0eXBlLCBpaSsrLCB2KTtcbiAgICAgIH0pO1xuICAgIH07XG5cbiAgICBSYW5nZS5wcm90b3R5cGUuZXF1YWxzID0gZnVuY3Rpb24ob3RoZXIpIHtcbiAgICAgIHJldHVybiBvdGhlciBpbnN0YW5jZW9mIFJhbmdlID9cbiAgICAgICAgdGhpcy5fc3RhcnQgPT09IG90aGVyLl9zdGFydCAmJlxuICAgICAgICB0aGlzLl9lbmQgPT09IG90aGVyLl9lbmQgJiZcbiAgICAgICAgdGhpcy5fc3RlcCA9PT0gb3RoZXIuX3N0ZXAgOlxuICAgICAgICBkZWVwRXF1YWwodGhpcywgb3RoZXIpO1xuICAgIH07XG5cblxuICB2YXIgRU1QVFlfUkFOR0U7XG5cbiAgY3JlYXRlQ2xhc3MoUmVwZWF0LCBJbmRleGVkU2VxKTtcblxuICAgIGZ1bmN0aW9uIFJlcGVhdCh2YWx1ZSwgdGltZXMpIHtcbiAgICAgIGlmICghKHRoaXMgaW5zdGFuY2VvZiBSZXBlYXQpKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVwZWF0KHZhbHVlLCB0aW1lcyk7XG4gICAgICB9XG4gICAgICB0aGlzLl92YWx1ZSA9IHZhbHVlO1xuICAgICAgdGhpcy5zaXplID0gdGltZXMgPT09IHVuZGVmaW5lZCA/IEluZmluaXR5IDogTWF0aC5tYXgoMCwgdGltZXMpO1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICBpZiAoRU1QVFlfUkVQRUFUKSB7XG4gICAgICAgICAgcmV0dXJuIEVNUFRZX1JFUEVBVDtcbiAgICAgICAgfVxuICAgICAgICBFTVBUWV9SRVBFQVQgPSB0aGlzO1xuICAgICAgfVxuICAgIH1cblxuICAgIFJlcGVhdC5wcm90b3R5cGUudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmICh0aGlzLnNpemUgPT09IDApIHtcbiAgICAgICAgcmV0dXJuICdSZXBlYXQgW10nO1xuICAgICAgfVxuICAgICAgcmV0dXJuICdSZXBlYXQgWyAnICsgdGhpcy5fdmFsdWUgKyAnICcgKyB0aGlzLnNpemUgKyAnIHRpbWVzIF0nO1xuICAgIH07XG5cbiAgICBSZXBlYXQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKGluZGV4LCBub3RTZXRWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuaGFzKGluZGV4KSA/IHRoaXMuX3ZhbHVlIDogbm90U2V0VmFsdWU7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUuaW5jbHVkZXMgPSBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgcmV0dXJuIGlzKHRoaXMuX3ZhbHVlLCBzZWFyY2hWYWx1ZSk7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbihiZWdpbiwgZW5kKSB7XG4gICAgICB2YXIgc2l6ZSA9IHRoaXMuc2l6ZTtcbiAgICAgIHJldHVybiB3aG9sZVNsaWNlKGJlZ2luLCBlbmQsIHNpemUpID8gdGhpcyA6XG4gICAgICAgIG5ldyBSZXBlYXQodGhpcy5fdmFsdWUsIHJlc29sdmVFbmQoZW5kLCBzaXplKSAtIHJlc29sdmVCZWdpbihiZWdpbiwgc2l6ZSkpO1xuICAgIH07XG5cbiAgICBSZXBlYXQucHJvdG90eXBlLnJldmVyc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH07XG5cbiAgICBSZXBlYXQucHJvdG90eXBlLmluZGV4T2YgPSBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgaWYgKGlzKHRoaXMuX3ZhbHVlLCBzZWFyY2hWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gLTE7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUubGFzdEluZGV4T2YgPSBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgaWYgKGlzKHRoaXMuX3ZhbHVlLCBzZWFyY2hWYWx1ZSkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2l6ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiAtMTtcbiAgICB9O1xuXG4gICAgUmVwZWF0LnByb3RvdHlwZS5fX2l0ZXJhdGUgPSBmdW5jdGlvbihmbiwgcmV2ZXJzZSkge1xuICAgICAgZm9yICh2YXIgaWkgPSAwOyBpaSA8IHRoaXMuc2l6ZTsgaWkrKykge1xuICAgICAgICBpZiAoZm4odGhpcy5fdmFsdWUsIGlpLCB0aGlzKSA9PT0gZmFsc2UpIHtcbiAgICAgICAgICByZXR1cm4gaWkgKyAxO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gaWk7XG4gICAgfTtcblxuICAgIFJlcGVhdC5wcm90b3R5cGUuX19pdGVyYXRvciA9IGZ1bmN0aW9uKHR5cGUsIHJldmVyc2UpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHZhciBpaSA9IDA7XG4gICAgICByZXR1cm4gbmV3IHNyY19JdGVyYXRvcl9fSXRlcmF0b3IoZnVuY3Rpb24oKSBcbiAgICAgICAge3JldHVybiBpaSA8IHRoaXMkMC5zaXplID8gaXRlcmF0b3JWYWx1ZSh0eXBlLCBpaSsrLCB0aGlzJDAuX3ZhbHVlKSA6IGl0ZXJhdG9yRG9uZSgpfVxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgUmVwZWF0LnByb3RvdHlwZS5lcXVhbHMgPSBmdW5jdGlvbihvdGhlcikge1xuICAgICAgcmV0dXJuIG90aGVyIGluc3RhbmNlb2YgUmVwZWF0ID9cbiAgICAgICAgaXModGhpcy5fdmFsdWUsIG90aGVyLl92YWx1ZSkgOlxuICAgICAgICBkZWVwRXF1YWwob3RoZXIpO1xuICAgIH07XG5cblxuICB2YXIgRU1QVFlfUkVQRUFUO1xuXG4gIC8qKlxuICAgKiBDb250cmlidXRlcyBhZGRpdGlvbmFsIG1ldGhvZHMgdG8gYSBjb25zdHJ1Y3RvclxuICAgKi9cbiAgZnVuY3Rpb24gbWl4aW4oY3RvciwgbWV0aG9kcykge1xuICAgIHZhciBrZXlDb3BpZXIgPSBmdW5jdGlvbihrZXkgKSB7IGN0b3IucHJvdG90eXBlW2tleV0gPSBtZXRob2RzW2tleV07IH07XG4gICAgT2JqZWN0LmtleXMobWV0aG9kcykuZm9yRWFjaChrZXlDb3BpZXIpO1xuICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMgJiZcbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMobWV0aG9kcykuZm9yRWFjaChrZXlDb3BpZXIpO1xuICAgIHJldHVybiBjdG9yO1xuICB9XG5cbiAgSXRlcmFibGUuSXRlcmF0b3IgPSBzcmNfSXRlcmF0b3JfX0l0ZXJhdG9yO1xuXG4gIG1peGluKEl0ZXJhYmxlLCB7XG5cbiAgICAvLyAjIyMgQ29udmVyc2lvbiB0byBvdGhlciB0eXBlc1xuXG4gICAgdG9BcnJheTogZnVuY3Rpb24oKSB7XG4gICAgICBhc3NlcnROb3RJbmZpbml0ZSh0aGlzLnNpemUpO1xuICAgICAgdmFyIGFycmF5ID0gbmV3IEFycmF5KHRoaXMuc2l6ZSB8fCAwKTtcbiAgICAgIHRoaXMudmFsdWVTZXEoKS5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaSkgIHsgYXJyYXlbaV0gPSB2OyB9KTtcbiAgICAgIHJldHVybiBhcnJheTtcbiAgICB9LFxuXG4gICAgdG9JbmRleGVkU2VxOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgVG9JbmRleGVkU2VxdWVuY2UodGhpcyk7XG4gICAgfSxcblxuICAgIHRvSlM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TZXEoKS5tYXAoXG4gICAgICAgIGZ1bmN0aW9uKHZhbHVlICkge3JldHVybiB2YWx1ZSAmJiB0eXBlb2YgdmFsdWUudG9KUyA9PT0gJ2Z1bmN0aW9uJyA/IHZhbHVlLnRvSlMoKSA6IHZhbHVlfVxuICAgICAgKS5fX3RvSlMoKTtcbiAgICB9LFxuXG4gICAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnRvU2VxKCkubWFwKFxuICAgICAgICBmdW5jdGlvbih2YWx1ZSApIHtyZXR1cm4gdmFsdWUgJiYgdHlwZW9mIHZhbHVlLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJyA/IHZhbHVlLnRvSlNPTigpIDogdmFsdWV9XG4gICAgICApLl9fdG9KUygpO1xuICAgIH0sXG5cbiAgICB0b0tleWVkU2VxOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgVG9LZXllZFNlcXVlbmNlKHRoaXMsIHRydWUpO1xuICAgIH0sXG5cbiAgICB0b01hcDogZnVuY3Rpb24oKSB7XG4gICAgICAvLyBVc2UgTGF0ZSBCaW5kaW5nIGhlcmUgdG8gc29sdmUgdGhlIGNpcmN1bGFyIGRlcGVuZGVuY3kuXG4gICAgICByZXR1cm4gc3JjX01hcF9fTWFwKHRoaXMudG9LZXllZFNlcSgpKTtcbiAgICB9LFxuXG4gICAgdG9PYmplY3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgYXNzZXJ0Tm90SW5maW5pdGUodGhpcy5zaXplKTtcbiAgICAgIHZhciBvYmplY3QgPSB7fTtcbiAgICAgIHRoaXMuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGspICB7IG9iamVjdFtrXSA9IHY7IH0pO1xuICAgICAgcmV0dXJuIG9iamVjdDtcbiAgICB9LFxuXG4gICAgdG9PcmRlcmVkTWFwOiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFVzZSBMYXRlIEJpbmRpbmcgaGVyZSB0byBzb2x2ZSB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICAgIHJldHVybiBPcmRlcmVkTWFwKHRoaXMudG9LZXllZFNlcSgpKTtcbiAgICB9LFxuXG4gICAgdG9PcmRlcmVkU2V0OiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFVzZSBMYXRlIEJpbmRpbmcgaGVyZSB0byBzb2x2ZSB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICAgIHJldHVybiBPcmRlcmVkU2V0KGlzS2V5ZWQodGhpcykgPyB0aGlzLnZhbHVlU2VxKCkgOiB0aGlzKTtcbiAgICB9LFxuXG4gICAgdG9TZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVXNlIExhdGUgQmluZGluZyBoZXJlIHRvIHNvbHZlIHRoZSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICAgICAgcmV0dXJuIHNyY19TZXRfX1NldChpc0tleWVkKHRoaXMpID8gdGhpcy52YWx1ZVNlcSgpIDogdGhpcyk7XG4gICAgfSxcblxuICAgIHRvU2V0U2VxOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBuZXcgVG9TZXRTZXF1ZW5jZSh0aGlzKTtcbiAgICB9LFxuXG4gICAgdG9TZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIGlzSW5kZXhlZCh0aGlzKSA/IHRoaXMudG9JbmRleGVkU2VxKCkgOlxuICAgICAgICBpc0tleWVkKHRoaXMpID8gdGhpcy50b0tleWVkU2VxKCkgOlxuICAgICAgICB0aGlzLnRvU2V0U2VxKCk7XG4gICAgfSxcblxuICAgIHRvU3RhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgLy8gVXNlIExhdGUgQmluZGluZyBoZXJlIHRvIHNvbHZlIHRoZSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICAgICAgcmV0dXJuIFN0YWNrKGlzS2V5ZWQodGhpcykgPyB0aGlzLnZhbHVlU2VxKCkgOiB0aGlzKTtcbiAgICB9LFxuXG4gICAgdG9MaXN0OiBmdW5jdGlvbigpIHtcbiAgICAgIC8vIFVzZSBMYXRlIEJpbmRpbmcgaGVyZSB0byBzb2x2ZSB0aGUgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAgICAgIHJldHVybiBMaXN0KGlzS2V5ZWQodGhpcykgPyB0aGlzLnZhbHVlU2VxKCkgOiB0aGlzKTtcbiAgICB9LFxuXG5cbiAgICAvLyAjIyMgQ29tbW9uIEphdmFTY3JpcHQgbWV0aG9kcyBhbmQgcHJvcGVydGllc1xuXG4gICAgdG9TdHJpbmc6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuICdbSXRlcmFibGVdJztcbiAgICB9LFxuXG4gICAgX190b1N0cmluZzogZnVuY3Rpb24oaGVhZCwgdGFpbCkge1xuICAgICAgaWYgKHRoaXMuc2l6ZSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gaGVhZCArIHRhaWw7XG4gICAgICB9XG4gICAgICByZXR1cm4gaGVhZCArICcgJyArIHRoaXMudG9TZXEoKS5tYXAodGhpcy5fX3RvU3RyaW5nTWFwcGVyKS5qb2luKCcsICcpICsgJyAnICsgdGFpbDtcbiAgICB9LFxuXG5cbiAgICAvLyAjIyMgRVM2IENvbGxlY3Rpb24gbWV0aG9kcyAoRVM2IEFycmF5IGFuZCBNYXApXG5cbiAgICBjb25jYXQ6IGZ1bmN0aW9uKCkge3ZhciB2YWx1ZXMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBjb25jYXRGYWN0b3J5KHRoaXMsIHZhbHVlcykpO1xuICAgIH0sXG5cbiAgICBpbmNsdWRlczogZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLnNvbWUoZnVuY3Rpb24odmFsdWUgKSB7cmV0dXJuIGlzKHZhbHVlLCBzZWFyY2hWYWx1ZSl9KTtcbiAgICB9LFxuXG4gICAgZW50cmllczogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2l0ZXJhdG9yKElURVJBVEVfRU5UUklFUyk7XG4gICAgfSxcblxuICAgIGV2ZXJ5OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIGFzc2VydE5vdEluZmluaXRlKHRoaXMuc2l6ZSk7XG4gICAgICB2YXIgcmV0dXJuVmFsdWUgPSB0cnVlO1xuICAgICAgdGhpcy5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgIHtcbiAgICAgICAgaWYgKCFwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCBjKSkge1xuICAgICAgICAgIHJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZXR1cm5WYWx1ZTtcbiAgICB9LFxuXG4gICAgZmlsdGVyOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBmaWx0ZXJGYWN0b3J5KHRoaXMsIHByZWRpY2F0ZSwgY29udGV4dCwgdHJ1ZSkpO1xuICAgIH0sXG5cbiAgICBmaW5kOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQsIG5vdFNldFZhbHVlKSB7XG4gICAgICB2YXIgZW50cnkgPSB0aGlzLmZpbmRFbnRyeShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGVudHJ5ID8gZW50cnlbMV0gOiBub3RTZXRWYWx1ZTtcbiAgICB9LFxuXG4gICAgZmluZEVudHJ5OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHZhciBmb3VuZDtcbiAgICAgIHRoaXMuX19pdGVyYXRlKGZ1bmN0aW9uKHYsIGssIGMpICB7XG4gICAgICAgIGlmIChwcmVkaWNhdGUuY2FsbChjb250ZXh0LCB2LCBrLCBjKSkge1xuICAgICAgICAgIGZvdW5kID0gW2ssIHZdO1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgICByZXR1cm4gZm91bmQ7XG4gICAgfSxcblxuICAgIGZpbmRMYXN0RW50cnk6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TZXEoKS5yZXZlcnNlKCkuZmluZEVudHJ5KHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIGZvckVhY2g6IGZ1bmN0aW9uKHNpZGVFZmZlY3QsIGNvbnRleHQpIHtcbiAgICAgIGFzc2VydE5vdEluZmluaXRlKHRoaXMuc2l6ZSk7XG4gICAgICByZXR1cm4gdGhpcy5fX2l0ZXJhdGUoY29udGV4dCA/IHNpZGVFZmZlY3QuYmluZChjb250ZXh0KSA6IHNpZGVFZmZlY3QpO1xuICAgIH0sXG5cbiAgICBqb2luOiBmdW5jdGlvbihzZXBhcmF0b3IpIHtcbiAgICAgIGFzc2VydE5vdEluZmluaXRlKHRoaXMuc2l6ZSk7XG4gICAgICBzZXBhcmF0b3IgPSBzZXBhcmF0b3IgIT09IHVuZGVmaW5lZCA/ICcnICsgc2VwYXJhdG9yIDogJywnO1xuICAgICAgdmFyIGpvaW5lZCA9ICcnO1xuICAgICAgdmFyIGlzRmlyc3QgPSB0cnVlO1xuICAgICAgdGhpcy5fX2l0ZXJhdGUoZnVuY3Rpb24odiApIHtcbiAgICAgICAgaXNGaXJzdCA/IChpc0ZpcnN0ID0gZmFsc2UpIDogKGpvaW5lZCArPSBzZXBhcmF0b3IpO1xuICAgICAgICBqb2luZWQgKz0gdiAhPT0gbnVsbCAmJiB2ICE9PSB1bmRlZmluZWQgPyB2LnRvU3RyaW5nKCkgOiAnJztcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIGpvaW5lZDtcbiAgICB9LFxuXG4gICAga2V5czogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5fX2l0ZXJhdG9yKElURVJBVEVfS0VZUyk7XG4gICAgfSxcblxuICAgIG1hcDogZnVuY3Rpb24obWFwcGVyLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgbWFwRmFjdG9yeSh0aGlzLCBtYXBwZXIsIGNvbnRleHQpKTtcbiAgICB9LFxuXG4gICAgcmVkdWNlOiBmdW5jdGlvbihyZWR1Y2VyLCBpbml0aWFsUmVkdWN0aW9uLCBjb250ZXh0KSB7XG4gICAgICBhc3NlcnROb3RJbmZpbml0ZSh0aGlzLnNpemUpO1xuICAgICAgdmFyIHJlZHVjdGlvbjtcbiAgICAgIHZhciB1c2VGaXJzdDtcbiAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMikge1xuICAgICAgICB1c2VGaXJzdCA9IHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZWR1Y3Rpb24gPSBpbml0aWFsUmVkdWN0aW9uO1xuICAgICAgfVxuICAgICAgdGhpcy5fX2l0ZXJhdGUoZnVuY3Rpb24odiwgaywgYykgIHtcbiAgICAgICAgaWYgKHVzZUZpcnN0KSB7XG4gICAgICAgICAgdXNlRmlyc3QgPSBmYWxzZTtcbiAgICAgICAgICByZWR1Y3Rpb24gPSB2O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJlZHVjdGlvbiA9IHJlZHVjZXIuY2FsbChjb250ZXh0LCByZWR1Y3Rpb24sIHYsIGssIGMpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICAgIHJldHVybiByZWR1Y3Rpb247XG4gICAgfSxcblxuICAgIHJlZHVjZVJpZ2h0OiBmdW5jdGlvbihyZWR1Y2VyLCBpbml0aWFsUmVkdWN0aW9uLCBjb250ZXh0KSB7XG4gICAgICB2YXIgcmV2ZXJzZWQgPSB0aGlzLnRvS2V5ZWRTZXEoKS5yZXZlcnNlKCk7XG4gICAgICByZXR1cm4gcmV2ZXJzZWQucmVkdWNlLmFwcGx5KHJldmVyc2VkLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICByZXZlcnNlOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCByZXZlcnNlRmFjdG9yeSh0aGlzLCB0cnVlKSk7XG4gICAgfSxcblxuICAgIHNsaWNlOiBmdW5jdGlvbihiZWdpbiwgZW5kKSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgc2xpY2VGYWN0b3J5KHRoaXMsIGJlZ2luLCBlbmQsIHRydWUpKTtcbiAgICB9LFxuXG4gICAgc29tZTogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gIXRoaXMuZXZlcnkobm90KHByZWRpY2F0ZSksIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBzb3J0OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgc29ydEZhY3RvcnkodGhpcywgY29tcGFyYXRvcikpO1xuICAgIH0sXG5cbiAgICB2YWx1ZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19pdGVyYXRvcihJVEVSQVRFX1ZBTFVFUyk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIE1vcmUgc2VxdWVudGlhbCBtZXRob2RzXG5cbiAgICBidXRMYXN0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnNsaWNlKDAsIC0xKTtcbiAgICB9LFxuXG4gICAgaXNFbXB0eTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gdGhpcy5zaXplICE9PSB1bmRlZmluZWQgPyB0aGlzLnNpemUgPT09IDAgOiAhdGhpcy5zb21lKGZ1bmN0aW9uKCkgIHtyZXR1cm4gdHJ1ZX0pO1xuICAgIH0sXG5cbiAgICBjb3VudDogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gZW5zdXJlU2l6ZShcbiAgICAgICAgcHJlZGljYXRlID8gdGhpcy50b1NlcSgpLmZpbHRlcihwcmVkaWNhdGUsIGNvbnRleHQpIDogdGhpc1xuICAgICAgKTtcbiAgICB9LFxuXG4gICAgY291bnRCeTogZnVuY3Rpb24oZ3JvdXBlciwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIGNvdW50QnlGYWN0b3J5KHRoaXMsIGdyb3VwZXIsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBlcXVhbHM6IGZ1bmN0aW9uKG90aGVyKSB7XG4gICAgICByZXR1cm4gZGVlcEVxdWFsKHRoaXMsIG90aGVyKTtcbiAgICB9LFxuXG4gICAgZW50cnlTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGl0ZXJhYmxlID0gdGhpcztcbiAgICAgIGlmIChpdGVyYWJsZS5fY2FjaGUpIHtcbiAgICAgICAgLy8gV2UgY2FjaGUgYXMgYW4gZW50cmllcyBhcnJheSwgc28gd2UgY2FuIGp1c3QgcmV0dXJuIHRoZSBjYWNoZSFcbiAgICAgICAgcmV0dXJuIG5ldyBBcnJheVNlcShpdGVyYWJsZS5fY2FjaGUpO1xuICAgICAgfVxuICAgICAgdmFyIGVudHJpZXNTZXF1ZW5jZSA9IGl0ZXJhYmxlLnRvU2VxKCkubWFwKGVudHJ5TWFwcGVyKS50b0luZGV4ZWRTZXEoKTtcbiAgICAgIGVudHJpZXNTZXF1ZW5jZS5mcm9tRW50cnlTZXEgPSBmdW5jdGlvbigpICB7cmV0dXJuIGl0ZXJhYmxlLnRvU2VxKCl9O1xuICAgICAgcmV0dXJuIGVudHJpZXNTZXF1ZW5jZTtcbiAgICB9LFxuXG4gICAgZmlsdGVyTm90OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiB0aGlzLmZpbHRlcihub3QocHJlZGljYXRlKSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIGZpbmRMYXN0OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQsIG5vdFNldFZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy50b0tleWVkU2VxKCkucmV2ZXJzZSgpLmZpbmQocHJlZGljYXRlLCBjb250ZXh0LCBub3RTZXRWYWx1ZSk7XG4gICAgfSxcblxuICAgIGZpcnN0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmZpbmQocmV0dXJuVHJ1ZSk7XG4gICAgfSxcblxuICAgIGZsYXRNYXA6IGZ1bmN0aW9uKG1hcHBlciwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIGZsYXRNYXBGYWN0b3J5KHRoaXMsIG1hcHBlciwgY29udGV4dCkpO1xuICAgIH0sXG5cbiAgICBmbGF0dGVuOiBmdW5jdGlvbihkZXB0aCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIGZsYXR0ZW5GYWN0b3J5KHRoaXMsIGRlcHRoLCB0cnVlKSk7XG4gICAgfSxcblxuICAgIGZyb21FbnRyeVNlcTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gbmV3IEZyb21FbnRyaWVzU2VxdWVuY2UodGhpcyk7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24oc2VhcmNoS2V5LCBub3RTZXRWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZmluZChmdW5jdGlvbihfLCBrZXkpICB7cmV0dXJuIGlzKGtleSwgc2VhcmNoS2V5KX0sIHVuZGVmaW5lZCwgbm90U2V0VmFsdWUpO1xuICAgIH0sXG5cbiAgICBnZXRJbjogZnVuY3Rpb24oc2VhcmNoS2V5UGF0aCwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHZhciBuZXN0ZWQgPSB0aGlzO1xuICAgICAgLy8gTm90ZTogaW4gYW4gRVM2IGVudmlyb25tZW50LCB3ZSB3b3VsZCBwcmVmZXI6XG4gICAgICAvLyBmb3IgKHZhciBrZXkgb2Ygc2VhcmNoS2V5UGF0aCkge1xuICAgICAgdmFyIGl0ZXIgPSBmb3JjZUl0ZXJhdG9yKHNlYXJjaEtleVBhdGgpO1xuICAgICAgdmFyIHN0ZXA7XG4gICAgICB3aGlsZSAoIShzdGVwID0gaXRlci5uZXh0KCkpLmRvbmUpIHtcbiAgICAgICAgdmFyIGtleSA9IHN0ZXAudmFsdWU7XG4gICAgICAgIG5lc3RlZCA9IG5lc3RlZCAmJiBuZXN0ZWQuZ2V0ID8gbmVzdGVkLmdldChrZXksIE5PVF9TRVQpIDogTk9UX1NFVDtcbiAgICAgICAgaWYgKG5lc3RlZCA9PT0gTk9UX1NFVCkge1xuICAgICAgICAgIHJldHVybiBub3RTZXRWYWx1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG5lc3RlZDtcbiAgICB9LFxuXG4gICAgZ3JvdXBCeTogZnVuY3Rpb24oZ3JvdXBlciwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIGdyb3VwQnlGYWN0b3J5KHRoaXMsIGdyb3VwZXIsIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBoYXM6IGZ1bmN0aW9uKHNlYXJjaEtleSkge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0KHNlYXJjaEtleSwgTk9UX1NFVCkgIT09IE5PVF9TRVQ7XG4gICAgfSxcblxuICAgIGhhc0luOiBmdW5jdGlvbihzZWFyY2hLZXlQYXRoKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRJbihzZWFyY2hLZXlQYXRoLCBOT1RfU0VUKSAhPT0gTk9UX1NFVDtcbiAgICB9LFxuXG4gICAgaXNTdWJzZXQ6IGZ1bmN0aW9uKGl0ZXIpIHtcbiAgICAgIGl0ZXIgPSB0eXBlb2YgaXRlci5pbmNsdWRlcyA9PT0gJ2Z1bmN0aW9uJyA/IGl0ZXIgOiBJdGVyYWJsZShpdGVyKTtcbiAgICAgIHJldHVybiB0aGlzLmV2ZXJ5KGZ1bmN0aW9uKHZhbHVlICkge3JldHVybiBpdGVyLmluY2x1ZGVzKHZhbHVlKX0pO1xuICAgIH0sXG5cbiAgICBpc1N1cGVyc2V0OiBmdW5jdGlvbihpdGVyKSB7XG4gICAgICBpdGVyID0gdHlwZW9mIGl0ZXIuaXNTdWJzZXQgPT09ICdmdW5jdGlvbicgPyBpdGVyIDogSXRlcmFibGUoaXRlcik7XG4gICAgICByZXR1cm4gaXRlci5pc1N1YnNldCh0aGlzKTtcbiAgICB9LFxuXG4gICAga2V5U2VxOiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLnRvU2VxKCkubWFwKGtleU1hcHBlcikudG9JbmRleGVkU2VxKCk7XG4gICAgfSxcblxuICAgIGxhc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9TZXEoKS5yZXZlcnNlKCkuZmlyc3QoKTtcbiAgICB9LFxuXG4gICAgbWF4OiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gbWF4RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yKTtcbiAgICB9LFxuXG4gICAgbWF4Qnk6IGZ1bmN0aW9uKG1hcHBlciwgY29tcGFyYXRvcikge1xuICAgICAgcmV0dXJuIG1heEZhY3RvcnkodGhpcywgY29tcGFyYXRvciwgbWFwcGVyKTtcbiAgICB9LFxuXG4gICAgbWluOiBmdW5jdGlvbihjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gbWF4RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yID8gbmVnKGNvbXBhcmF0b3IpIDogZGVmYXVsdE5lZ0NvbXBhcmF0b3IpO1xuICAgIH0sXG5cbiAgICBtaW5CeTogZnVuY3Rpb24obWFwcGVyLCBjb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gbWF4RmFjdG9yeSh0aGlzLCBjb21wYXJhdG9yID8gbmVnKGNvbXBhcmF0b3IpIDogZGVmYXVsdE5lZ0NvbXBhcmF0b3IsIG1hcHBlcik7XG4gICAgfSxcblxuICAgIHJlc3Q6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2xpY2UoMSk7XG4gICAgfSxcblxuICAgIHNraXA6IGZ1bmN0aW9uKGFtb3VudCkge1xuICAgICAgcmV0dXJuIHRoaXMuc2xpY2UoTWF0aC5tYXgoMCwgYW1vdW50KSk7XG4gICAgfSxcblxuICAgIHNraXBMYXN0OiBmdW5jdGlvbihhbW91bnQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCB0aGlzLnRvU2VxKCkucmV2ZXJzZSgpLnNraXAoYW1vdW50KS5yZXZlcnNlKCkpO1xuICAgIH0sXG5cbiAgICBza2lwV2hpbGU6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHNraXBXaGlsZUZhY3RvcnkodGhpcywgcHJlZGljYXRlLCBjb250ZXh0LCB0cnVlKSk7XG4gICAgfSxcblxuICAgIHNraXBVbnRpbDogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gdGhpcy5za2lwV2hpbGUobm90KHByZWRpY2F0ZSksIGNvbnRleHQpO1xuICAgIH0sXG5cbiAgICBzb3J0Qnk6IGZ1bmN0aW9uKG1hcHBlciwgY29tcGFyYXRvcikge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIHNvcnRGYWN0b3J5KHRoaXMsIGNvbXBhcmF0b3IsIG1hcHBlcikpO1xuICAgIH0sXG5cbiAgICB0YWtlOiBmdW5jdGlvbihhbW91bnQpIHtcbiAgICAgIHJldHVybiB0aGlzLnNsaWNlKDAsIE1hdGgubWF4KDAsIGFtb3VudCkpO1xuICAgIH0sXG5cbiAgICB0YWtlTGFzdDogZnVuY3Rpb24oYW1vdW50KSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgdGhpcy50b1NlcSgpLnJldmVyc2UoKS50YWtlKGFtb3VudCkucmV2ZXJzZSgpKTtcbiAgICB9LFxuXG4gICAgdGFrZVdoaWxlOiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCB0YWtlV2hpbGVGYWN0b3J5KHRoaXMsIHByZWRpY2F0ZSwgY29udGV4dCkpO1xuICAgIH0sXG5cbiAgICB0YWtlVW50aWw6IGZ1bmN0aW9uKHByZWRpY2F0ZSwgY29udGV4dCkge1xuICAgICAgcmV0dXJuIHRoaXMudGFrZVdoaWxlKG5vdChwcmVkaWNhdGUpLCBjb250ZXh0KTtcbiAgICB9LFxuXG4gICAgdmFsdWVTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudG9JbmRleGVkU2VxKCk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIEhhc2hhYmxlIE9iamVjdFxuXG4gICAgaGFzaENvZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMuX19oYXNoIHx8ICh0aGlzLl9faGFzaCA9IGhhc2hJdGVyYWJsZSh0aGlzKSk7XG4gICAgfVxuXG5cbiAgICAvLyAjIyMgSW50ZXJuYWxcblxuICAgIC8vIGFic3RyYWN0IF9faXRlcmF0ZShmbiwgcmV2ZXJzZSlcblxuICAgIC8vIGFic3RyYWN0IF9faXRlcmF0b3IodHlwZSwgcmV2ZXJzZSlcbiAgfSk7XG5cbiAgLy8gdmFyIElTX0lURVJBQkxFX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfSVRFUkFCTEVfX0BAJztcbiAgLy8gdmFyIElTX0tFWUVEX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfS0VZRURfX0BAJztcbiAgLy8gdmFyIElTX0lOREVYRURfU0VOVElORUwgPSAnQEBfX0lNTVVUQUJMRV9JTkRFWEVEX19AQCc7XG4gIC8vIHZhciBJU19PUkRFUkVEX1NFTlRJTkVMID0gJ0BAX19JTU1VVEFCTEVfT1JERVJFRF9fQEAnO1xuXG4gIHZhciBJdGVyYWJsZVByb3RvdHlwZSA9IEl0ZXJhYmxlLnByb3RvdHlwZTtcbiAgSXRlcmFibGVQcm90b3R5cGVbSVNfSVRFUkFCTEVfU0VOVElORUxdID0gdHJ1ZTtcbiAgSXRlcmFibGVQcm90b3R5cGVbSVRFUkFUT1JfU1lNQk9MXSA9IEl0ZXJhYmxlUHJvdG90eXBlLnZhbHVlcztcbiAgSXRlcmFibGVQcm90b3R5cGUuX190b0pTID0gSXRlcmFibGVQcm90b3R5cGUudG9BcnJheTtcbiAgSXRlcmFibGVQcm90b3R5cGUuX190b1N0cmluZ01hcHBlciA9IHF1b3RlU3RyaW5nO1xuICBJdGVyYWJsZVByb3RvdHlwZS5pbnNwZWN0ID1cbiAgSXRlcmFibGVQcm90b3R5cGUudG9Tb3VyY2UgPSBmdW5jdGlvbigpIHsgcmV0dXJuIHRoaXMudG9TdHJpbmcoKTsgfTtcbiAgSXRlcmFibGVQcm90b3R5cGUuY2hhaW4gPSBJdGVyYWJsZVByb3RvdHlwZS5mbGF0TWFwO1xuICBJdGVyYWJsZVByb3RvdHlwZS5jb250YWlucyA9IEl0ZXJhYmxlUHJvdG90eXBlLmluY2x1ZGVzO1xuXG4gIC8vIFRlbXBvcmFyeSB3YXJuaW5nIGFib3V0IHVzaW5nIGxlbmd0aFxuICAoZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoSXRlcmFibGVQcm90b3R5cGUsICdsZW5ndGgnLCB7XG4gICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGlmICghSXRlcmFibGUubm9MZW5ndGhXYXJuaW5nKSB7XG4gICAgICAgICAgICB2YXIgc3RhY2s7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoKTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgICAgICAgIHN0YWNrID0gZXJyb3Iuc3RhY2s7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoc3RhY2suaW5kZXhPZignX3dyYXBPYmplY3QnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgY29uc29sZSAmJiBjb25zb2xlLndhcm4gJiYgY29uc29sZS53YXJuKFxuICAgICAgICAgICAgICAgICdpdGVyYWJsZS5sZW5ndGggaGFzIGJlZW4gZGVwcmVjYXRlZCwgJytcbiAgICAgICAgICAgICAgICAndXNlIGl0ZXJhYmxlLnNpemUgb3IgaXRlcmFibGUuY291bnQoKS4gJytcbiAgICAgICAgICAgICAgICAnVGhpcyB3YXJuaW5nIHdpbGwgYmVjb21lIGEgc2lsZW50IGVycm9yIGluIGEgZnV0dXJlIHZlcnNpb24uICcgK1xuICAgICAgICAgICAgICAgIHN0YWNrXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnNpemU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlKSB7fVxuICB9KSgpO1xuXG5cblxuICBtaXhpbihLZXllZEl0ZXJhYmxlLCB7XG5cbiAgICAvLyAjIyMgTW9yZSBzZXF1ZW50aWFsIG1ldGhvZHNcblxuICAgIGZsaXA6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHJlaWZ5KHRoaXMsIGZsaXBGYWN0b3J5KHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZmluZEtleTogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICB2YXIgZW50cnkgPSB0aGlzLmZpbmRFbnRyeShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGVudHJ5ICYmIGVudHJ5WzBdO1xuICAgIH0sXG5cbiAgICBmaW5kTGFzdEtleTogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gdGhpcy50b1NlcSgpLnJldmVyc2UoKS5maW5kS2V5KHByZWRpY2F0ZSwgY29udGV4dCk7XG4gICAgfSxcblxuICAgIGtleU9mOiBmdW5jdGlvbihzZWFyY2hWYWx1ZSkge1xuICAgICAgcmV0dXJuIHRoaXMuZmluZEtleShmdW5jdGlvbih2YWx1ZSApIHtyZXR1cm4gaXModmFsdWUsIHNlYXJjaFZhbHVlKX0pO1xuICAgIH0sXG5cbiAgICBsYXN0S2V5T2Y6IGZ1bmN0aW9uKHNlYXJjaFZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5maW5kTGFzdEtleShmdW5jdGlvbih2YWx1ZSApIHtyZXR1cm4gaXModmFsdWUsIHNlYXJjaFZhbHVlKX0pO1xuICAgIH0sXG5cbiAgICBtYXBFbnRyaWVzOiBmdW5jdGlvbihtYXBwZXIsIGNvbnRleHQpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHZhciBpdGVyYXRpb25zID0gMDtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLFxuICAgICAgICB0aGlzLnRvU2VxKCkubWFwKFxuICAgICAgICAgIGZ1bmN0aW9uKHYsIGspICB7cmV0dXJuIG1hcHBlci5jYWxsKGNvbnRleHQsIFtrLCB2XSwgaXRlcmF0aW9ucysrLCB0aGlzJDApfVxuICAgICAgICApLmZyb21FbnRyeVNlcSgpXG4gICAgICApO1xuICAgIH0sXG5cbiAgICBtYXBLZXlzOiBmdW5jdGlvbihtYXBwZXIsIGNvbnRleHQpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLFxuICAgICAgICB0aGlzLnRvU2VxKCkuZmxpcCgpLm1hcChcbiAgICAgICAgICBmdW5jdGlvbihrLCB2KSAge3JldHVybiBtYXBwZXIuY2FsbChjb250ZXh0LCBrLCB2LCB0aGlzJDApfVxuICAgICAgICApLmZsaXAoKVxuICAgICAgKTtcbiAgICB9XG5cbiAgfSk7XG5cbiAgdmFyIEtleWVkSXRlcmFibGVQcm90b3R5cGUgPSBLZXllZEl0ZXJhYmxlLnByb3RvdHlwZTtcbiAgS2V5ZWRJdGVyYWJsZVByb3RvdHlwZVtJU19LRVlFRF9TRU5USU5FTF0gPSB0cnVlO1xuICBLZXllZEl0ZXJhYmxlUHJvdG90eXBlW0lURVJBVE9SX1NZTUJPTF0gPSBJdGVyYWJsZVByb3RvdHlwZS5lbnRyaWVzO1xuICBLZXllZEl0ZXJhYmxlUHJvdG90eXBlLl9fdG9KUyA9IEl0ZXJhYmxlUHJvdG90eXBlLnRvT2JqZWN0O1xuICBLZXllZEl0ZXJhYmxlUHJvdG90eXBlLl9fdG9TdHJpbmdNYXBwZXIgPSBmdW5jdGlvbih2LCBrKSAge3JldHVybiBKU09OLnN0cmluZ2lmeShrKSArICc6ICcgKyBxdW90ZVN0cmluZyh2KX07XG5cblxuXG4gIG1peGluKEluZGV4ZWRJdGVyYWJsZSwge1xuXG4gICAgLy8gIyMjIENvbnZlcnNpb24gdG8gb3RoZXIgdHlwZXNcblxuICAgIHRvS2V5ZWRTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIG5ldyBUb0tleWVkU2VxdWVuY2UodGhpcywgZmFsc2UpO1xuICAgIH0sXG5cblxuICAgIC8vICMjIyBFUzYgQ29sbGVjdGlvbiBtZXRob2RzIChFUzYgQXJyYXkgYW5kIE1hcClcblxuICAgIGZpbHRlcjogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgZmlsdGVyRmFjdG9yeSh0aGlzLCBwcmVkaWNhdGUsIGNvbnRleHQsIGZhbHNlKSk7XG4gICAgfSxcblxuICAgIGZpbmRJbmRleDogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICB2YXIgZW50cnkgPSB0aGlzLmZpbmRFbnRyeShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGVudHJ5ID8gZW50cnlbMF0gOiAtMTtcbiAgICB9LFxuXG4gICAgaW5kZXhPZjogZnVuY3Rpb24oc2VhcmNoVmFsdWUpIHtcbiAgICAgIHZhciBrZXkgPSB0aGlzLnRvS2V5ZWRTZXEoKS5rZXlPZihzZWFyY2hWYWx1ZSk7XG4gICAgICByZXR1cm4ga2V5ID09PSB1bmRlZmluZWQgPyAtMSA6IGtleTtcbiAgICB9LFxuXG4gICAgbGFzdEluZGV4T2Y6IGZ1bmN0aW9uKHNlYXJjaFZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy50b1NlcSgpLnJldmVyc2UoKS5pbmRleE9mKHNlYXJjaFZhbHVlKTtcbiAgICB9LFxuXG4gICAgcmV2ZXJzZTogZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgcmV2ZXJzZUZhY3RvcnkodGhpcywgZmFsc2UpKTtcbiAgICB9LFxuXG4gICAgc2xpY2U6IGZ1bmN0aW9uKGJlZ2luLCBlbmQpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBzbGljZUZhY3RvcnkodGhpcywgYmVnaW4sIGVuZCwgZmFsc2UpKTtcbiAgICB9LFxuXG4gICAgc3BsaWNlOiBmdW5jdGlvbihpbmRleCwgcmVtb3ZlTnVtIC8qLCAuLi52YWx1ZXMqLykge1xuICAgICAgdmFyIG51bUFyZ3MgPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgcmVtb3ZlTnVtID0gTWF0aC5tYXgocmVtb3ZlTnVtIHwgMCwgMCk7XG4gICAgICBpZiAobnVtQXJncyA9PT0gMCB8fCAobnVtQXJncyA9PT0gMiAmJiAhcmVtb3ZlTnVtKSkge1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cbiAgICAgIC8vIElmIGluZGV4IGlzIG5lZ2F0aXZlLCBpdCBzaG91bGQgcmVzb2x2ZSByZWxhdGl2ZSB0byB0aGUgc2l6ZSBvZiB0aGVcbiAgICAgIC8vIGNvbGxlY3Rpb24uIEhvd2V2ZXIgc2l6ZSBtYXkgYmUgZXhwZW5zaXZlIHRvIGNvbXB1dGUgaWYgbm90IGNhY2hlZCwgc29cbiAgICAgIC8vIG9ubHkgY2FsbCBjb3VudCgpIGlmIHRoZSBudW1iZXIgaXMgaW4gZmFjdCBuZWdhdGl2ZS5cbiAgICAgIGluZGV4ID0gcmVzb2x2ZUJlZ2luKGluZGV4LCBpbmRleCA8IDAgPyB0aGlzLmNvdW50KCkgOiB0aGlzLnNpemUpO1xuICAgICAgdmFyIHNwbGljZWQgPSB0aGlzLnNsaWNlKDAsIGluZGV4KTtcbiAgICAgIHJldHVybiByZWlmeShcbiAgICAgICAgdGhpcyxcbiAgICAgICAgbnVtQXJncyA9PT0gMSA/XG4gICAgICAgICAgc3BsaWNlZCA6XG4gICAgICAgICAgc3BsaWNlZC5jb25jYXQoYXJyQ29weShhcmd1bWVudHMsIDIpLCB0aGlzLnNsaWNlKGluZGV4ICsgcmVtb3ZlTnVtKSlcbiAgICAgICk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIE1vcmUgY29sbGVjdGlvbiBtZXRob2RzXG5cbiAgICBmaW5kTGFzdEluZGV4OiBmdW5jdGlvbihwcmVkaWNhdGUsIGNvbnRleHQpIHtcbiAgICAgIHZhciBrZXkgPSB0aGlzLnRvS2V5ZWRTZXEoKS5maW5kTGFzdEtleShwcmVkaWNhdGUsIGNvbnRleHQpO1xuICAgICAgcmV0dXJuIGtleSA9PT0gdW5kZWZpbmVkID8gLTEgOiBrZXk7XG4gICAgfSxcblxuICAgIGZpcnN0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldCgwKTtcbiAgICB9LFxuXG4gICAgZmxhdHRlbjogZnVuY3Rpb24oZGVwdGgpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBmbGF0dGVuRmFjdG9yeSh0aGlzLCBkZXB0aCwgZmFsc2UpKTtcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbihpbmRleCwgbm90U2V0VmFsdWUpIHtcbiAgICAgIGluZGV4ID0gd3JhcEluZGV4KHRoaXMsIGluZGV4KTtcbiAgICAgIHJldHVybiAoaW5kZXggPCAwIHx8ICh0aGlzLnNpemUgPT09IEluZmluaXR5IHx8XG4gICAgICAgICAgKHRoaXMuc2l6ZSAhPT0gdW5kZWZpbmVkICYmIGluZGV4ID4gdGhpcy5zaXplKSkpID9cbiAgICAgICAgbm90U2V0VmFsdWUgOlxuICAgICAgICB0aGlzLmZpbmQoZnVuY3Rpb24oXywga2V5KSAge3JldHVybiBrZXkgPT09IGluZGV4fSwgdW5kZWZpbmVkLCBub3RTZXRWYWx1ZSk7XG4gICAgfSxcblxuICAgIGhhczogZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgIGluZGV4ID0gd3JhcEluZGV4KHRoaXMsIGluZGV4KTtcbiAgICAgIHJldHVybiBpbmRleCA+PSAwICYmICh0aGlzLnNpemUgIT09IHVuZGVmaW5lZCA/XG4gICAgICAgIHRoaXMuc2l6ZSA9PT0gSW5maW5pdHkgfHwgaW5kZXggPCB0aGlzLnNpemUgOlxuICAgICAgICB0aGlzLmluZGV4T2YoaW5kZXgpICE9PSAtMVxuICAgICAgKTtcbiAgICB9LFxuXG4gICAgaW50ZXJwb3NlOiBmdW5jdGlvbihzZXBhcmF0b3IpIHtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCBpbnRlcnBvc2VGYWN0b3J5KHRoaXMsIHNlcGFyYXRvcikpO1xuICAgIH0sXG5cbiAgICBpbnRlcmxlYXZlOiBmdW5jdGlvbigvKi4uLml0ZXJhYmxlcyovKSB7XG4gICAgICB2YXIgaXRlcmFibGVzID0gW3RoaXNdLmNvbmNhdChhcnJDb3B5KGFyZ3VtZW50cykpO1xuICAgICAgdmFyIHppcHBlZCA9IHppcFdpdGhGYWN0b3J5KHRoaXMudG9TZXEoKSwgSW5kZXhlZFNlcS5vZiwgaXRlcmFibGVzKTtcbiAgICAgIHZhciBpbnRlcmxlYXZlZCA9IHppcHBlZC5mbGF0dGVuKHRydWUpO1xuICAgICAgaWYgKHppcHBlZC5zaXplKSB7XG4gICAgICAgIGludGVybGVhdmVkLnNpemUgPSB6aXBwZWQuc2l6ZSAqIGl0ZXJhYmxlcy5sZW5ndGg7XG4gICAgICB9XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgaW50ZXJsZWF2ZWQpO1xuICAgIH0sXG5cbiAgICBsYXN0OiBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLmdldCgtMSk7XG4gICAgfSxcblxuICAgIHNraXBXaGlsZTogZnVuY3Rpb24ocHJlZGljYXRlLCBjb250ZXh0KSB7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgc2tpcFdoaWxlRmFjdG9yeSh0aGlzLCBwcmVkaWNhdGUsIGNvbnRleHQsIGZhbHNlKSk7XG4gICAgfSxcblxuICAgIHppcDogZnVuY3Rpb24oLyosIC4uLml0ZXJhYmxlcyAqLykge1xuICAgICAgdmFyIGl0ZXJhYmxlcyA9IFt0aGlzXS5jb25jYXQoYXJyQ29weShhcmd1bWVudHMpKTtcbiAgICAgIHJldHVybiByZWlmeSh0aGlzLCB6aXBXaXRoRmFjdG9yeSh0aGlzLCBkZWZhdWx0WmlwcGVyLCBpdGVyYWJsZXMpKTtcbiAgICB9LFxuXG4gICAgemlwV2l0aDogZnVuY3Rpb24oemlwcGVyLyosIC4uLml0ZXJhYmxlcyAqLykge1xuICAgICAgdmFyIGl0ZXJhYmxlcyA9IGFyckNvcHkoYXJndW1lbnRzKTtcbiAgICAgIGl0ZXJhYmxlc1swXSA9IHRoaXM7XG4gICAgICByZXR1cm4gcmVpZnkodGhpcywgemlwV2l0aEZhY3RvcnkodGhpcywgemlwcGVyLCBpdGVyYWJsZXMpKTtcbiAgICB9XG5cbiAgfSk7XG5cbiAgSW5kZXhlZEl0ZXJhYmxlLnByb3RvdHlwZVtJU19JTkRFWEVEX1NFTlRJTkVMXSA9IHRydWU7XG4gIEluZGV4ZWRJdGVyYWJsZS5wcm90b3R5cGVbSVNfT1JERVJFRF9TRU5USU5FTF0gPSB0cnVlO1xuXG5cblxuICBtaXhpbihTZXRJdGVyYWJsZSwge1xuXG4gICAgLy8gIyMjIEVTNiBDb2xsZWN0aW9uIG1ldGhvZHMgKEVTNiBBcnJheSBhbmQgTWFwKVxuXG4gICAgZ2V0OiBmdW5jdGlvbih2YWx1ZSwgbm90U2V0VmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhcyh2YWx1ZSkgPyB2YWx1ZSA6IG5vdFNldFZhbHVlO1xuICAgIH0sXG5cbiAgICBpbmNsdWRlczogZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhcyh2YWx1ZSk7XG4gICAgfSxcblxuXG4gICAgLy8gIyMjIE1vcmUgc2VxdWVudGlhbCBtZXRob2RzXG5cbiAgICBrZXlTZXE6IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudmFsdWVTZXEoKTtcbiAgICB9XG5cbiAgfSk7XG5cbiAgU2V0SXRlcmFibGUucHJvdG90eXBlLmhhcyA9IEl0ZXJhYmxlUHJvdG90eXBlLmluY2x1ZGVzO1xuXG5cbiAgLy8gTWl4aW4gc3ViY2xhc3Nlc1xuXG4gIG1peGluKEtleWVkU2VxLCBLZXllZEl0ZXJhYmxlLnByb3RvdHlwZSk7XG4gIG1peGluKEluZGV4ZWRTZXEsIEluZGV4ZWRJdGVyYWJsZS5wcm90b3R5cGUpO1xuICBtaXhpbihTZXRTZXEsIFNldEl0ZXJhYmxlLnByb3RvdHlwZSk7XG5cbiAgbWl4aW4oS2V5ZWRDb2xsZWN0aW9uLCBLZXllZEl0ZXJhYmxlLnByb3RvdHlwZSk7XG4gIG1peGluKEluZGV4ZWRDb2xsZWN0aW9uLCBJbmRleGVkSXRlcmFibGUucHJvdG90eXBlKTtcbiAgbWl4aW4oU2V0Q29sbGVjdGlvbiwgU2V0SXRlcmFibGUucHJvdG90eXBlKTtcblxuXG4gIC8vICNwcmFnbWEgSGVscGVyIGZ1bmN0aW9uc1xuXG4gIGZ1bmN0aW9uIGtleU1hcHBlcih2LCBrKSB7XG4gICAgcmV0dXJuIGs7XG4gIH1cblxuICBmdW5jdGlvbiBlbnRyeU1hcHBlcih2LCBrKSB7XG4gICAgcmV0dXJuIFtrLCB2XTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vdChwcmVkaWNhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gIXByZWRpY2F0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5lZyhwcmVkaWNhdGUpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gLXByZWRpY2F0ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHF1b3RlU3RyaW5nKHZhbHVlKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZycgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiB2YWx1ZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHRaaXBwZXIoKSB7XG4gICAgcmV0dXJuIGFyckNvcHkoYXJndW1lbnRzKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGRlZmF1bHROZWdDb21wYXJhdG9yKGEsIGIpIHtcbiAgICByZXR1cm4gYSA8IGIgPyAxIDogYSA+IGIgPyAtMSA6IDA7XG4gIH1cblxuICBmdW5jdGlvbiBoYXNoSXRlcmFibGUoaXRlcmFibGUpIHtcbiAgICBpZiAoaXRlcmFibGUuc2l6ZSA9PT0gSW5maW5pdHkpIHtcbiAgICAgIHJldHVybiAwO1xuICAgIH1cbiAgICB2YXIgb3JkZXJlZCA9IGlzT3JkZXJlZChpdGVyYWJsZSk7XG4gICAgdmFyIGtleWVkID0gaXNLZXllZChpdGVyYWJsZSk7XG4gICAgdmFyIGggPSBvcmRlcmVkID8gMSA6IDA7XG4gICAgdmFyIHNpemUgPSBpdGVyYWJsZS5fX2l0ZXJhdGUoXG4gICAgICBrZXllZCA/XG4gICAgICAgIG9yZGVyZWQgP1xuICAgICAgICAgIGZ1bmN0aW9uKHYsIGspICB7IGggPSAzMSAqIGggKyBoYXNoTWVyZ2UoaGFzaCh2KSwgaGFzaChrKSkgfCAwOyB9IDpcbiAgICAgICAgICBmdW5jdGlvbih2LCBrKSAgeyBoID0gaCArIGhhc2hNZXJnZShoYXNoKHYpLCBoYXNoKGspKSB8IDA7IH0gOlxuICAgICAgICBvcmRlcmVkID9cbiAgICAgICAgICBmdW5jdGlvbih2ICkgeyBoID0gMzEgKiBoICsgaGFzaCh2KSB8IDA7IH0gOlxuICAgICAgICAgIGZ1bmN0aW9uKHYgKSB7IGggPSBoICsgaGFzaCh2KSB8IDA7IH1cbiAgICApO1xuICAgIHJldHVybiBtdXJtdXJIYXNoT2ZTaXplKHNpemUsIGgpO1xuICB9XG5cbiAgZnVuY3Rpb24gbXVybXVySGFzaE9mU2l6ZShzaXplLCBoKSB7XG4gICAgaCA9IHNyY19NYXRoX19pbXVsKGgsIDB4Q0M5RTJENTEpO1xuICAgIGggPSBzcmNfTWF0aF9faW11bChoIDw8IDE1IHwgaCA+Pj4gLTE1LCAweDFCODczNTkzKTtcbiAgICBoID0gc3JjX01hdGhfX2ltdWwoaCA8PCAxMyB8IGggPj4+IC0xMywgNSk7XG4gICAgaCA9IChoICsgMHhFNjU0NkI2NCB8IDApIF4gc2l6ZTtcbiAgICBoID0gc3JjX01hdGhfX2ltdWwoaCBeIGggPj4+IDE2LCAweDg1RUJDQTZCKTtcbiAgICBoID0gc3JjX01hdGhfX2ltdWwoaCBeIGggPj4+IDEzLCAweEMyQjJBRTM1KTtcbiAgICBoID0gc21pKGggXiBoID4+PiAxNik7XG4gICAgcmV0dXJuIGg7XG4gIH1cblxuICBmdW5jdGlvbiBoYXNoTWVyZ2UoYSwgYikge1xuICAgIHJldHVybiBhIF4gYiArIDB4OUUzNzc5QjkgKyAoYSA8PCA2KSArIChhID4+IDIpIHwgMDsgLy8gaW50XG4gIH1cblxuICB2YXIgSW1tdXRhYmxlID0ge1xuXG4gICAgSXRlcmFibGU6IEl0ZXJhYmxlLFxuXG4gICAgU2VxOiBTZXEsXG4gICAgQ29sbGVjdGlvbjogQ29sbGVjdGlvbixcbiAgICBNYXA6IHNyY19NYXBfX01hcCxcbiAgICBPcmRlcmVkTWFwOiBPcmRlcmVkTWFwLFxuICAgIExpc3Q6IExpc3QsXG4gICAgU3RhY2s6IFN0YWNrLFxuICAgIFNldDogc3JjX1NldF9fU2V0LFxuICAgIE9yZGVyZWRTZXQ6IE9yZGVyZWRTZXQsXG5cbiAgICBSZWNvcmQ6IFJlY29yZCxcbiAgICBSYW5nZTogUmFuZ2UsXG4gICAgUmVwZWF0OiBSZXBlYXQsXG5cbiAgICBpczogaXMsXG4gICAgZnJvbUpTOiBmcm9tSlNcblxuICB9O1xuXG4gIHJldHVybiBJbW11dGFibGU7XG5cbn0pKTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBJbW11dGFibGUgPSByZXF1aXJlKCdpbW11dGFibGUnKTtcbnZhciBDdXJzb3IgPSByZXF1aXJlKCdpbW11dGFibGUvY29udHJpYi9jdXJzb3IvaW5kZXgnKTtcbnZhciBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudGVtaXR0ZXIzJyk7XG52YXIgdXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBMSVNURU5FUl9TRU5USU5FTCA9IHt9O1xuXG4gLyoqXG4gKiBDcmVhdGVzIGEgbmV3IGBTdHJ1Y3R1cmVgIGluc3RhbmNlLiBBbHNvIGFjY2Vzc2libGUgdGhyb3VnaFxuICogYEltbXN0cnVjdC5TdHJ1Y3RyZWAuXG4gKlxuICogQSBzdHJ1Y3R1cmUgaXMgYWxzbyBhbiBFdmVudEVtaXR0ZXIgb2JqZWN0LCBzbyBpdCBoYXMgbWV0aG9kcyBhc1xuICogYC5vbmAsIGAub2ZmYCwgYW5kIGFsbCBvdGhlciBFdmVudEVtaXR0ZXIgbWV0aG9kcy5cbiAqXG4gKlxuICogRm9yIHRoZSBgc3dhcGAgZXZlbnQsIHRoZSByb290IHN0cnVjdHVyZSAoc2VlIGBzdHJ1Y3R1cmUuY3VycmVudGApIGlzIHBhc3NlZFxuICogYXMgYXJndW1lbnRzLCBidXQgZm9yIHR5cGUgc3BlY2lmaWMgZXZlbnRzIChgYWRkYCwgYGNoYW5nZWAgYW5kIGBkZWxldGVgKSwgdGhlXG4gKiBhY3R1YWwgY2hhbmdlZCB2YWx1ZSBpcyBwYXNzZWQuXG4gKlxuICogRm9yIGluc3RhbmNlOlxuICogYGBganNcbiAqIHZhciBzdHJ1Y3R1cmUgPSBuZXcgU3RydWN0dXJlKHsgJ2Zvbyc6IHsgJ2Jhcic6ICdoZWxsbycgfSB9KTtcbiAqXG4gKiBzdHJ1Y3R1cmUub24oJ3N3YXAnLCBmdW5jdGlvbiAobmV3RGF0YSwgb2xkRGF0YSwga2V5UGF0aCkge1xuICogICBrZXlQYXRoLnNob3VsZC5lcWwoWydmb28nLCAnYmFyJ10pO1xuICogICBuZXdEYXRhLnRvSlMoKS5zaG91bGQuZXFsKHsgJ2Zvbyc6IHsgJ2Jhcic6ICdieWUnIH0gfSk7XG4gKiAgIG9sZERhdGEudG9KUygpLnNob3VsZC5lcWwoeyAnZm9vJzogeyAnYmFyJzogJ2hlbGxvJyB9IH0pO1xuICogfSk7XG4gKlxuICogc3RydWN0dXJlLmN1cnNvcihbJ2ZvbycsICdiYXInXSkudXBkYXRlKGZ1bmN0aW9uICgpIHtcbiAqICByZXR1cm4gJ2J5ZSc7XG4gKiB9KTtcbiAqIGBgYFxuICpcbiAqIEJ1dCBmb3IgYGNoYW5nZWBcbiAqIGBgYGpzXG4gKiB2YXIgc3RydWN0dXJlID0gbmV3IFN0cnVjdHVyZSh7ICdmb28nOiB7ICdiYXInOiAnaGVsbG8nIH0gfSk7XG4gKlxuICogc3RydWN0dXJlLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbiAobmV3RGF0YSwgb2xkRGF0YSwga2V5UGF0aCkge1xuICogICBrZXlQYXRoLnNob3VsZC5lcWwoWydmb28nLCAnYmFyJ10pO1xuICogICBuZXdEYXRhLnNob3VsZC5lcWwoJ2J5ZScpO1xuICogICBvbGREYXRhLnNob3VsZC5lcWwoJ2hlbGxvJyk7XG4gKiB9KTtcbiAqXG4gKiBzdHJ1Y3R1cmUuY3Vyc29yKFsnZm9vJywgJ2JhciddKS51cGRhdGUoZnVuY3Rpb24gKCkge1xuICogIHJldHVybiAnYnllJztcbiAqIH0pO1xuICogYGBgXG4gKlxuICogKipBbGwgYGtleVBhdGhgcyBwYXNzZWQgdG8gbGlzdGVuZXJzIGFyZSB0aGUgZnVsbCBwYXRoIHRvIHdoZXJlIHRoZSBhY3R1YWxcbiAqICBjaGFuZ2UgaGFwcGVuZWQqKlxuICpcbiAqICMjIyBFeGFtcGxlczpcbiAqIGBgYGpzXG4gKiB2YXIgU3RydWN0dXJlID0gcmVxdWlyZSgnaW1tc3RydWN0L3N0cnVjdHVyZScpO1xuICogdmFyIHMgPSBuZXcgU3RydWN0dXJlKHsgZGF0YTogeyBmb286ICdiYXInIH19KTtcbiAqXG4gKiAvLyBPcjpcbiAqIC8vIHZhciBTdHJ1Y3R1cmUgPSByZXF1aXJlKCdpbW1zdHJ1Y3QnKS5TdHJ1Y3R1cmU7XG4gKiBgYGBcbiAqXG4gKiAjIyMgRXZlbnRzXG4gKlxuICogKiBgc3dhcGA6IEVtaXR0ZWQgd2hlbiBjdXJzb3IgaXMgdXBkYXRlZCAobmV3IGluZm9ybWF0aW9uIGlzIHNldCkuIElzIGVtaXR0ZWRcbiAqICAgb24gYWxsIHR5cGVzIG9mIGNoYW5nZXMsIGFkZGl0aW9ucyBhbmQgZGVsZXRpb25zLiBUaGUgcGFzc2VkIHN0cnVjdHVyZXMgYXJlXG4gKiAgIGFsd2F5cyB0aGUgcm9vdCBzdHJ1Y3R1cmUuXG4gKiAgIE9uZSB1c2UgY2FzZSBmb3IgdGhpcyBpcyB0byByZS1yZW5kZXIgZGVzaWduIGNvbXBvbmVudHMuIENhbGxiYWNrXG4gKiAgIGlzIHBhc3NlZCBhcmd1bWVudHM6IGBuZXdTdHJ1Y3R1cmVgLCBgb2xkU3RydWN0dXJlYCwgYGtleVBhdGhgLlxuICogKiBgbmV4dC1hbmltYXRpb24tZnJhbWVgOiBTYW1lIGFzIGBzd2FwYCwgYnV0IG9ubHkgZW1pdHRlZCBvbiBhbmltYXRpb24gZnJhbWUuXG4gKiAgIENvdWxkIHVzZSB3aXRoIG1hbnkgcmVuZGVyIHVwZGF0ZXMgYW5kIGJldHRlciBwZXJmb3JtYW5jZS4gQ2FsbGJhY2sgaXMgcGFzc2VkXG4gKiAgIGFyZ3VtZW50czogYG5ld1N0cnVjdHVyZWAsIGBvbGRTdHJ1Y3R1cmVgLCBga2V5UGF0aGAuXG4gKiAqIGBjaGFuZ2VgOiBFbWl0dGVkIHdoZW4gZGF0YS92YWx1ZSBpcyB1cGRhdGVkIGFuZCBpdCBleGlzdGVkIGJlZm9yZS4gRW1pdHNcbiAqICAgdmFsdWVzOiBgbmV3VmFsdWVgLCBgb2xkVmFsdWVgIGFuZCBgcGF0aGAuXG4gKiAqIGBkZWxldGVgOiBFbWl0dGVkIHdoZW4gZGF0YS92YWx1ZSBpcyByZW1vdmVkLiBFbWl0cyB2YWx1ZTogIGByZW1vdmVkVmFsdWVgIGFuZCBgcGF0aGAuXG4gKiAqIGBhZGRgOiBFbWl0dGVkIHdoZW4gbmV3IGRhdGEvdmFsdWUgaXMgYWRkZWQuIEVtaXRzIHZhbHVlOiBgbmV3VmFsdWVgIGFuZCBgcGF0aGAuXG4gKiAqIGBhbnlgOiBXaXRoIHRoZSBzYW1lIHNlbWFudGljcyBhcyBgYWRkYCwgYGNoYW5nZWAgb3IgYGRlbGV0ZWAsIGBhbnlgIGlzIHRyaWdnZXJlZCBmb3JcbiAqICAgIGFsbCB0eXBlcyBvZiBjaGFuZ2VzLiBEaWZmZXJzIGZyb20gc3dhcCBpbiB0aGUgYXJndW1lbnRzIHRoYXQgaXQgaXMgcGFzc2VkLlxuICogICAgSXMgcGFzc2VkIGBuZXdWYWx1ZWAgKG9yIHVuZGVmaW5lZCksIGBvbGRWYWx1ZWAgKG9yIHVuZGVmaW5lZCkgYW5kIGZ1bGwgYGtleVBhdGhgLlxuICogICAgTmV3IGFuZCBvbGQgdmFsdWUgYXJlIHRoZSBjaGFuZ2VkIHZhbHVlLCBub3QgcmVsYXRpdmUvc2NvcGVkIHRvIHRoZSByZWZlcmVuY2UgcGF0aCBhc1xuICogICAgd2l0aCBgc3dhcGAuXG4gKlxuICogIyMjIE9wdGlvbnNcbiAqXG4gKiBgYGBqc29uXG4gKiB7XG4gKiAgIGtleTogU3RyaW5nLCAvLyBEZWZhdWx0cyB0byByYW5kb20gc3RyaW5nXG4gKiAgIGRhdGE6IE9iamVjdHxJbW11dGFibGUsIC8vIGRlZmF1bHRzIHRvIGVtcHR5IE1hcFxuICogICBoaXN0b3J5OiBCb29sZWFuLCAvLyBEZWZhdWx0cyB0byBmYWxzZVxuICogICBoaXN0b3J5TGltaXQ6IE51bWJlciwgLy8gSWYgaGlzdG9yeSBlbmFibGVkLCBEZWZhdWx0cyB0byBJbmZpbml0eVxuICogfVxuICogYGBgXG4gKlxuICogQHByb3BlcnR5IHtJbW11dGFibGUuTGlzdH0gaGlzdG9yeSBgSW1tdXRhYmxlLkxpc3RgIHdpdGggaGlzdG9yeS5cbiAqIEBwcm9wZXJ0eSB7T2JqZWN0fEltbXV0YWJsZX0gY3VycmVudCBQcm92aWRlZCBkYXRhIGFzIGltbXV0YWJsZSBkYXRhXG4gKiBAcHJvcGVydHkge1N0cmluZ30ga2V5IEdlbmVyYXRlZCBvciBwcm92aWRlZCBrZXkuXG4gKlxuICpcbiAqIEBwYXJhbSB7eyBrZXk6IFN0cmluZywgZGF0YTogT2JqZWN0LCBoaXN0b3J5OiBCb29sZWFuIH19IFtvcHRpb25zXSAtIGRlZmF1bHRzXG4gKiAgdG8gcmFuZG9tIGtleSBhbmQgZW1wdHkgZGF0YSAoaW1tdXRhYmxlIHN0cnVjdHVyZSkuIE5vIGhpc3RvcnlcbiAqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBjbGFzcyB7U3RydWN0dXJlfVxuICogQHJldHVybnMge1N0cnVjdHVyZX1cbiAqIEBhcGkgcHVibGljXG4gKi9cbmZ1bmN0aW9uIFN0cnVjdHVyZSAob3B0aW9ucykge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmICghKHRoaXMgaW5zdGFuY2VvZiBTdHJ1Y3R1cmUpKSB7XG4gICAgcmV0dXJuIG5ldyBTdHJ1Y3R1cmUob3B0aW9ucyk7XG4gIH1cblxuICB0aGlzLmtleSA9IG9wdGlvbnMua2V5IHx8IHV0aWxzLmdlbmVyYXRlUmFuZG9tS2V5KCk7XG5cbiAgdGhpcy5fcXVldWVkQ2hhbmdlID0gZmFsc2U7XG4gIHRoaXMuY3VycmVudCA9IG9wdGlvbnMuZGF0YTtcbiAgaWYgKCFpc0ltbXV0YWJsZVN0cnVjdHVyZSh0aGlzLmN1cnJlbnQpIHx8ICF0aGlzLmN1cnJlbnQpIHtcbiAgICB0aGlzLmN1cnJlbnQgPSBJbW11dGFibGUuZnJvbUpTKHRoaXMuY3VycmVudCB8fCB7fSk7XG4gIH1cblxuICBpZiAoISFvcHRpb25zLmhpc3RvcnkpIHtcbiAgICB0aGlzLmhpc3RvcnkgPSBJbW11dGFibGUuTGlzdC5vZih0aGlzLmN1cnJlbnQpO1xuICAgIHRoaXMuX2N1cnJlbnRSZXZpc2lvbiA9IDA7XG4gICAgdGhpcy5faGlzdG9yeUxpbWl0ID0gKHR5cGVvZiBvcHRpb25zLmhpc3RvcnlMaW1pdCA9PT0gJ251bWJlcicpID9cbiAgICAgIG9wdGlvbnMuaGlzdG9yeUxpbWl0IDpcbiAgICAgIEluZmluaXR5O1xuICB9XG5cbiAgdGhpcy5fcmVmZXJlbmNlbGlzdGVuZXJzID0gSW1tdXRhYmxlLk1hcCgpO1xuICB0aGlzLm9uKCdzd2FwJywgZnVuY3Rpb24gKG5ld0RhdGEsIG9sZERhdGEsIGtleVBhdGgpIHtcbiAgICBrZXlQYXRoID0ga2V5UGF0aCB8fCBbXTtcbiAgICB2YXIgYXJncyA9IFtuZXdEYXRhLCBvbGREYXRhLCBrZXlQYXRoXTtcbiAgICBlbWl0KHNlbGYuX3JlZmVyZW5jZWxpc3RlbmVycywgbmV3RGF0YSwgb2xkRGF0YSwga2V5UGF0aCwgYXJncyk7XG4gIH0pO1xuXG4gIEV2ZW50RW1pdHRlci5jYWxsKHRoaXMsIGFyZ3VtZW50cyk7XG59XG5pbmhlcml0cyhTdHJ1Y3R1cmUsIEV2ZW50RW1pdHRlcik7XG5tb2R1bGUuZXhwb3J0cyA9IFN0cnVjdHVyZTtcblxuZnVuY3Rpb24gZW1pdChtYXAsIG5ld0RhdGEsIG9sZERhdGEsIHBhdGgsIGFyZ3MpIHtcbiAgaWYgKCFtYXAgfHwgbmV3RGF0YSA9PT0gb2xkRGF0YSkgcmV0dXJuIHZvaWQgMDtcbiAgbWFwLmdldChMSVNURU5FUl9TRU5USU5FTCwgW10pLmZvckVhY2goZnVuY3Rpb24gKGZuKSB7XG4gICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gIH0pO1xuXG4gIGlmIChwYXRoLmxlbmd0aCA+IDApIHtcbiAgICB2YXIgbmV4dFBhdGhSb290ID0gcGF0aFswXTtcbiAgICB2YXIgcGFzc2VkTmV3RGF0YSA9IG5ld0RhdGEgJiYgbmV3RGF0YS5nZXQgPyBuZXdEYXRhLmdldChuZXh0UGF0aFJvb3QpIDogdm9pZCAwO1xuICAgIHZhciBwYXNzZWRPbGREYXRhID0gb2xkRGF0YSAmJiBvbGREYXRhLmdldCA/IG9sZERhdGEuZ2V0KG5leHRQYXRoUm9vdCkgOiB2b2lkIDA7XG4gICAgcmV0dXJuIGVtaXQobWFwLmdldChuZXh0UGF0aFJvb3QpLCBwYXNzZWROZXdEYXRhLCBwYXNzZWRPbGREYXRhLCBwYXRoLnNsaWNlKDEpLCBhcmdzKTtcbiAgfVxuXG4gIG1hcC5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICBpZiAoa2V5ID09PSBMSVNURU5FUl9TRU5USU5FTCkgcmV0dXJuIHZvaWQgMDtcbiAgICB2YXIgcGFzc2VkTmV3RGF0YSA9IChuZXdEYXRhICYmIG5ld0RhdGEuZ2V0KSA/IG5ld0RhdGEuZ2V0KGtleSkgOiB2b2lkIDA7XG4gICAgdmFyIHBhc3NlZE9sZERhdGEgPSAob2xkRGF0YSAmJiBvbGREYXRhLmdldCkgPyBvbGREYXRhLmdldChrZXkpIDogdm9pZCAwO1xuICAgIGVtaXQodmFsdWUsIHBhc3NlZE5ld0RhdGEsIHBhc3NlZE9sZERhdGEsIFtdLCBhcmdzKTtcbiAgfSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgSW1tdXRhYmxlLmpzIEN1cnNvciBmb3IgYSBnaXZlbiBgcGF0aGAgb24gdGhlIGBjdXJyZW50YCBzdHJ1Y3R1cmUgKHNlZSBgU3RydWN0dXJlLmN1cnJlbnRgKS5cbiAqIENoYW5nZXMgbWFkZSB0aHJvdWdoIGNyZWF0ZWQgY3Vyc29yIHdpbGwgY2F1c2UgYSBgc3dhcGAgZXZlbnQgdG8gaGFwcGVuIChzZWUgYEV2ZW50c2ApLlxuICpcbiAqICoqVGhpcyBtZXRob2QgcmV0dXJucyBhXG4gKiBbSW1tdXRhYmxlLmpzIEN1cnNvcl0oaHR0cHM6Ly9naXRodWIuY29tL2ZhY2Vib29rL2ltbXV0YWJsZS1qcy9ibG9iL21hc3Rlci9jb250cmliL2N1cnNvci9pbmRleC5kLnRzKS5cbiAqIFNlZSB0aGUgSW1tdXRhYmxlLmpzIGRvY3MgZm9yIG1vcmUgaW5mbyBvbiBob3cgdG8gdXNlIGN1cnNvcnMuKipcbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiBgYGBqc1xuICogdmFyIFN0cnVjdHVyZSA9IHJlcXVpcmUoJ2ltbXN0cnVjdC9zdHJ1Y3R1cmUnKTtcbiAqIHZhciBzID0gbmV3IFN0cnVjdHVyZSh7IGRhdGE6IHsgZm9vOiAnYmFyJywgYTogeyBiOiAnZm9vJyB9IH19KTtcbiAqIHMuY3Vyc29yKCkuc2V0KCdmb28nLCAnaGVsbG8nKTtcbiAqIHMuY3Vyc29yKCdmb28nKS51cGRhdGUoZnVuY3Rpb24gKCkge8KgcmV0dXJuICdDaGFuZ2VkJzsgfSk7XG4gKiBzLmN1cnNvcihbJ2EnLCAnYiddKS51cGRhdGUoZnVuY3Rpb24gKCkge8KgcmV0dXJuICdiYXInOyB9KTtcbiAqIGBgYFxuICpcbiAqIFNlZSBtb3JlIGV4YW1wbGVzIGluIHRoZSBbdGVzdHNdKGh0dHBzOi8vZ2l0aHViLmNvbS9vbW5pc2NpZW50anMvaW1tc3RydWN0L2Jsb2IvbWFzdGVyL3Rlc3RzL3N0cnVjdHVyZV90ZXN0LmpzKVxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBbcGF0aF0gLSBkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIENhbiBiZSBhcnJheSBmb3IgcGF0aC4gU2VlIEltbXV0YWJsZS5qcyBDdXJzb3JzXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEBtb2R1bGUgc3RydWN0dXJlLmN1cnNvclxuICogQHJldHVybnMge0N1cnNvcn0gR2l2ZXMgYSBDdXJzb3IgZnJvbSBJbW11dGFibGUuanNcbiAqL1xuU3RydWN0dXJlLnByb3RvdHlwZS5jdXJzb3IgPSBmdW5jdGlvbiAocGF0aCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHBhdGggPSB2YWxUb0tleVBhdGgocGF0aCkgfHwgW107XG5cbiAgaWYgKCF0aGlzLmN1cnJlbnQpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHN0cnVjdHVyZSBsb2FkZWQuJyk7XG4gIH1cblxuICB2YXIgY2hhbmdlTGlzdGVuZXIgPSBmdW5jdGlvbiAobmV3Um9vdCwgb2xkUm9vdCwgcGF0aCkge1xuICAgIGlmKHNlbGYuY3VycmVudCA9PT0gb2xkUm9vdCkge1xuICAgICAgc2VsZi5jdXJyZW50ID0gbmV3Um9vdDtcbiAgICB9IGVsc2UgaWYoIWhhc0luKG5ld1Jvb3QsIHBhdGgpKSB7XG4gICAgICAvLyBPdGhld2lzZSBhbiBvdXQtb2Ytc3luYyBjaGFuZ2Ugb2NjdXJlZC4gV2UgaWdub3JlIGBvbGRSb290YCwgYW5kIGZvY3VzIG9uXG4gICAgICAvLyBjaGFuZ2VzIGF0IHBhdGggYHBhdGhgLCBhbmQgc3luYyB0aGlzIHRvIGBzZWxmLmN1cnJlbnRgLlxuICAgICAgc2VsZi5jdXJyZW50ID0gc2VsZi5jdXJyZW50LnJlbW92ZUluKHBhdGgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBVcGRhdGUgYW4gZXhpc3RpbmcgcGF0aCBvciBhZGQgYSBuZXcgcGF0aCB3aXRoaW4gdGhlIGN1cnJlbnQgbWFwLlxuICAgICAgc2VsZi5jdXJyZW50ID0gc2VsZi5jdXJyZW50LnNldEluKHBhdGgsIG5ld1Jvb3QuZ2V0SW4ocGF0aCkpO1xuICAgIH1cblxuICAgIHJldHVybiBzZWxmLmN1cnJlbnQ7XG4gIH07XG5cbiAgY2hhbmdlTGlzdGVuZXIgPSBoYW5kbGVIaXN0b3J5KHRoaXMsIGNoYW5nZUxpc3RlbmVyKTtcbiAgY2hhbmdlTGlzdGVuZXIgPSBoYW5kbGVTd2FwKHRoaXMsIGNoYW5nZUxpc3RlbmVyKTtcbiAgY2hhbmdlTGlzdGVuZXIgPSBoYW5kbGVQZXJzaXN0aW5nKHRoaXMsIGNoYW5nZUxpc3RlbmVyKTtcbiAgcmV0dXJuIEN1cnNvci5mcm9tKHNlbGYuY3VycmVudCwgcGF0aCwgY2hhbmdlTGlzdGVuZXIpO1xufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgcmVmZXJlbmNlLiBBIHJlZmVyZW5jZSBjYW4gYmUgYSBwb2ludGVyIHRvIGEgY3Vyc29yLCBhbGxvd2luZ1xuICogeW91IHRvIGNyZWF0ZSBjdXJzb3JzIGZvciBhIHNwZWNpZmljIHBhdGggYW55IHRpbWUuIFRoaXMgaXMgZXNzZW50aWFsbHlcbiAqIGEgd2F5IHRvIGhhdmUgXCJhbHdheXMgdXBkYXRlZCBjdXJzb3JzXCIgb3IgUmVmZXJlbmNlIEN1cnNvcnMuIFNlZSBleGFtcGxlXG4gKiBmb3IgYmV0dGVyIHVuZGVyc3RhbmRpbmcgdGhlIGNvbmNlcHQuXG4gKlxuICogUmVmZXJlbmNlcyBhbHNvIGFsbG93IHlvdSB0byBsaXN0ZW4gZm9yIGNoYW5nZXMgc3BlY2lmaWMgZm9yIGEgcGF0aC5cbiAqXG4gKiAjIyMgRXhhbXBsZXM6XG4gKiBgYGBqc1xuICogdmFyIHN0cnVjdHVyZSA9IGltbXN0cnVjdCh7XG4gKiAgIHNvbWVCb3g6IHsgbWVzc2FnZTogJ0hlbGxvIFdvcmxkIScgfVxuICogfSk7XG4gKiB2YXIgcmVmID0gc3RydWN0dXJlLnJlZmVyZW5jZShbJ3NvbWVCb3gnXSk7XG4gKlxuICogdmFyIHVub2JzZXJ2ZSA9IHJlZi5vYnNlcnZlKGZ1bmN0aW9uICgpIHtcbiAqICAgLy8gQ2FsbGVkIHdoZW4gZGF0YSB0aGUgcGF0aCAnc29tZUJveCcgaXMgY2hhbmdlZC5cbiAqICAgLy8gQWxzbyBjYWxsZWQgd2hlbiB0aGUgZGF0YSBhdCBbJ3NvbWVCb3gnLCAnbWVzc2FnZSddIGlzIGNoYW5nZWQuXG4gKiB9KTtcbiAqXG4gKiAvLyBVcGRhdGUgdGhlIGRhdGEgdXNpbmcgdGhlIHJlZlxuICogcmVmLmN1cnNvcigpLnVwZGF0ZShmdW5jdGlvbiAoKSB7IHJldHVybiAndXBkYXRlZCc7IH0pO1xuICpcbiAqIC8vIFVwZGF0ZSB0aGUgZGF0YSB1c2luZyB0aGUgaW5pdGlhbCBzdHJ1Y3R1cmVcbiAqIHN0cnVjdHVyZS5jdXJzb3IoWydzb21lQm94JywgJ21lc3NhZ2UnXSkudXBkYXRlKGZ1bmN0aW9uICgpIHsgcmV0dXJuICd1cGRhdGVkIGFnYWluJzsgfSk7XG4gKlxuICogLy8gUmVtb3ZlIHRoZSBsaXN0ZW5lclxuICogdW5vYnNlcnZlKCk7XG4gKiBgYGBcbiAqXG4gKiBTZWUgbW9yZSBleGFtcGxlcyBpbiB0aGUgW3JlYWRtZV0oaHR0cHM6Ly9naXRodWIuY29tL29tbmlzY2llbnRqcy9pbW1zdHJ1Y3QpXG4gKlxuICogQHBhcmFtIHtTdHJpbmd8QXJyYXl8Q3Vyc29yfSBbcGF0aHxjdXJzb3JdIC0gZGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLiBDYW4gYmVcbiAqIGFycmF5IGZvciBwYXRoIG9yIHVzZSBwYXRoIG9mIGN1cnNvci4gU2VlIEltbXV0YWJsZS5qcyBDdXJzb3JzXG4gKlxuICogQGFwaSBwdWJsaWNcbiAqIEBtb2R1bGUgc3RydWN0dXJlLnJlZmVyZW5jZVxuICogQHJldHVybnMge1JlZmVyZW5jZX1cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5TdHJ1Y3R1cmUucHJvdG90eXBlLnJlZmVyZW5jZSA9IGZ1bmN0aW9uIHJlZmVyZW5jZSAocGF0aCkge1xuICBpZiAoaXNDdXJzb3IocGF0aCkgJiYgcGF0aC5fa2V5UGF0aCkge1xuICAgIHBhdGggPSBwYXRoLl9rZXlQYXRoO1xuICB9XG5cbiAgcGF0aCA9IHZhbFRvS2V5UGF0aChwYXRoKSB8fCBbXTtcblxuICB2YXIgc2VsZiA9IHRoaXMsXG4gICAgICBjdXJzb3IgPSB0aGlzLmN1cnNvcihwYXRoKSxcbiAgICAgIHVub2JzZXJ2ZXJzID0gSW1tdXRhYmxlLlNldCgpO1xuXG4gIGZ1bmN0aW9uIGN1cnNvclJlZnJlc2hlcigpIHsgY3Vyc29yID0gc2VsZi5jdXJzb3IocGF0aCk7IH1cbiAgZnVuY3Rpb24gX3N1YnNjcmliZSAocGF0aCwgZm4pIHtcbiAgICBzZWxmLl9yZWZlcmVuY2VsaXN0ZW5lcnMgPSBzdWJzY3JpYmUoc2VsZi5fcmVmZXJlbmNlbGlzdGVuZXJzLCBwYXRoLCBmbik7XG4gIH1cbiAgZnVuY3Rpb24gX3Vuc3Vic2NyaWJlIChwYXRoLCBmbikge1xuICAgIHNlbGYuX3JlZmVyZW5jZWxpc3RlbmVycyA9IHVuc3Vic2NyaWJlKHNlbGYuX3JlZmVyZW5jZWxpc3RlbmVycywgcGF0aCwgZm4pO1xuICB9XG5cbiAgX3N1YnNjcmliZShwYXRoLCBjdXJzb3JSZWZyZXNoZXIpO1xuXG4gIHJldHVybiB7XG4gICAgLyoqXG4gICAgICogT2JzZXJ2ZSBmb3IgY2hhbmdlcyBvbiBhIHJlZmVyZW5jZS4gT24gcmVmZXJlbmNlcyB5b3UgY2FuIG9ic2VydmUgZm9yIGNoYW5nZXMsXG4gICAgICogYnV0IGEgcmVmZXJlbmNlICoqaXMgbm90KiogYW4gRXZlbnRFbWl0dGVyIGl0IHNlbGYuXG4gICAgICpcbiAgICAgKiBUaGUgcGFzc2VkIGBrZXlQYXRoYCBmb3Igc3dhcCBldmVudHMgYXJlIHJlbGF0aXZlIHRvIHRoZSByZWZlcmVuY2UsIGJ1dFxuICAgICAqXG4gICAgICpcbiAgICAgKiAqKk5vdGUqKjogQXMgb24gYHN3YXBgIGZvciBub3JtYWwgaW1tc3RydWN0IGV2ZW50cywgdGhlIHBhc3NlZCBhcmd1bWVudHMgZm9yXG4gICAgICogdGhlIGV2ZW50IGlzIHRoZSByb290LCBub3QgZ3VhcmFudGVlZCB0byBiZSB0aGUgYWN0dWFsIGNoYW5nZWQgdmFsdWUuXG4gICAgICogVGhlIHN0cnVjdHVyZSBpcyBob3cgZXZlciBzY29wZWQgdG8gdGhlIHBhdGggcGFzc2VkIGluIHRvIHRoZSByZWZlcmVuY2UuXG4gICAgICogQWxsIHZhbHVlcyBwYXNzZWQgdG8gdGhlIGV2ZW50bGlzdGVuZXIgZm9yIHRoZSBzd2FwIGV2ZW50IGFyZSByZWxhdGl2ZVxuICAgICAqIHRvIHRoZSBwYXRoIHVzZWQgYXMga2V5IHBhdGggdG8gdGhlIHJlZmVyZW5jZS5cbiAgICAgKlxuICAgICAqIEZvciBpbnN0YW5jZTpcbiAgICAgKlxuICAgICAqIGBgYGpzXG4gICAgICogdmFyIHN0cnVjdHVyZSA9IGltbXN0cnVjdCh7ICdmb28nOiB7ICdiYXInOiAnaGVsbG8nIH0gfSk7XG4gICAgICogdmFyIHJlZiA9IHN0cnVjdHVyZS5yZWZlcmVuY2UoJ2ZvbycpO1xuICAgICAqIHJlZi5vYnNlcnZlKGZ1bmN0aW9uIChuZXdEYXRhLCBvbGREYXRhLCBrZXlQYXRoKSB7XG4gICAgICogICBrZXlQYXRoLnNob3VsZC5lcWwoWydiYXInXSk7XG4gICAgICogICBuZXdEYXRhLnRvSlMoKS5zaG91bGQuZXFsKHsgJ2Jhcic6ICd1cGRhdGVkJyB9KTtcbiAgICAgKiAgIG9sZERhdGEudG9KUygpLnNob3VsZC5lcWwoeyAnYmFyJzogJ2hlbGxvJyB9KTtcbiAgICAgKiB9KTtcbiAgICAgKiByZWYuY3Vyc29yKCkudXBkYXRlKFsnYmFyJ10sIGZ1bmN0aW9uICgpIHsgcmV0dXJuICd1cGRhdGVkJzsgfSk7XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBGb3IgdHlwZSBzcGVjaWZpYyBldmVudHMsIGhvdyBldmVyLCB0aGUgYWN0dWFsIGNoYW5nZWQgdmFsdWUgaXMgcGFzc2VkLFxuICAgICAqIG5vdCB0aGUgcm9vdCBkYXRhLiBJbiB0aGVzZSBjYXNlcywgdGhlIGZ1bGwga2V5UGF0aCB0byB0aGUgY2hhbmdlIGlzIHBhc3NlZC5cbiAgICAgKlxuICAgICAqIEZvciBpbnN0YW5jZTpcbiAgICAgKlxuICAgICAqIGBgYGpzXG4gICAgICogdmFyIHN0cnVjdHVyZSA9IGltbXN0cnVjdCh7ICdmb28nOiB7ICdiYXInOiAnaGVsbG8nIH0gfSk7XG4gICAgICogdmFyIHJlZiA9IHN0cnVjdHVyZS5yZWZlcmVuY2UoJ2ZvbycpO1xuICAgICAqIHJlZi5vYnNlcnZlKCdjaGFuZ2UnLCBmdW5jdGlvbiAobmV3VmFsdWUsIG9sZFZhbHVlLCBrZXlQYXRoKSB7XG4gICAgICogICBrZXlQYXRoLnNob3VsZC5lcWwoWydmb28nLCAnYmFyJ10pO1xuICAgICAqICAgbmV3RGF0YS5zaG91bGQuZXFsKCd1cGRhdGVkJyk7XG4gICAgICogICBvbGREYXRhLnNob3VsZC5lcWwoJ2hlbGxvJyk7XG4gICAgICogfSk7XG4gICAgICogcmVmLmN1cnNvcigpLnVwZGF0ZShbJ2JhciddLCBmdW5jdGlvbiAoKSB7IHJldHVybiAndXBkYXRlZCc7IH0pO1xuICAgICAqIGBgYFxuICAgICAqXG4gICAgICpcbiAgICAgKiAjIyMgRXhhbXBsZXM6XG4gICAgICogYGBganNcbiAgICAgKiB2YXIgcmVmID0gc3RydWN0dXJlLnJlZmVyZW5jZShbJ3NvbWVCb3gnXSk7XG4gICAgICpcbiAgICAgKiB2YXIgdW5vYnNlcnZlID0gcmVmLm9ic2VydmUoJ2RlbGV0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgKiAgIC8vIENhbGxlZCB3aGVuIGRhdGEgdGhlIHBhdGggJ3NvbWVCb3gnIGlzIHJlbW92ZWQgZnJvbSB0aGUgc3RydWN0dXJlLlxuICAgICAqIH0pO1xuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogU2VlIG1vcmUgZXhhbXBsZXMgaW4gdGhlIFtyZWFkbWVdKGh0dHBzOi8vZ2l0aHViLmNvbS9vbW5pc2NpZW50anMvaW1tc3RydWN0KVxuICAgICAqXG4gICAgICogIyMjIEV2ZW50c1xuICAgICAqICogYHN3YXBgOiBFbWl0dGVkIHdoZW4gYW55IGN1cnNvciBpcyB1cGRhdGVkIChuZXcgaW5mb3JtYXRpb24gaXMgc2V0KS5cbiAgICAgKiAgIFRyaWdnZXJlZCBpbiBhbnkgZGF0YSBzd2FwIGlzIG1hZGUgb24gdGhlIHN0cnVjdHVyZS4gT25lIHVzZSBjYXNlIGZvclxuICAgICAqICAgdGhpcyBpcyB0byByZS1yZW5kZXIgZGVzaWduIGNvbXBvbmVudHMuIERhdGEgcGFzc2VkIGFzIGFyZ3VtZW50c1xuICAgICAqICAgYXJlIHNjb3BlZC9yZWxhdGl2ZSB0byB0aGUgcGF0aCBwYXNzZWQgdG8gdGhlIHJlZmVyZW5jZSwgdGhpcyBhbHNvIGdvZXMgZm9yIGtleVBhdGguXG4gICAgICogICBDYWxsYmFjayBpcyBwYXNzZWQgYXJndW1lbnRzOiBgbmV3U3RydWN0dXJlYCwgYG9sZFN0cnVjdHVyZWAsIGBrZXlQYXRoYC5cbiAgICAgKiAqIGBjaGFuZ2VgOiBFbWl0dGVkIHdoZW4gZGF0YS92YWx1ZSBpcyB1cGRhdGVkIGFuZCBpdCBleGlzdGVkIGJlZm9yZS5cbiAgICAgKiAgIEVtaXRzIHZhbHVlczogYG5ld1ZhbHVlYCwgYG9sZFZhbHVlYCBhbmQgYHBhdGhgLlxuICAgICAqICogYGRlbGV0ZWA6IEVtaXR0ZWQgd2hlbiBkYXRhL3ZhbHVlIGlzIHJlbW92ZWQuIEVtaXRzIHZhbHVlOiAgYHJlbW92ZWRWYWx1ZWAgYW5kIGBwYXRoYC5cbiAgICAgKiAqIGBhZGRgOiBFbWl0dGVkIHdoZW4gbmV3IGRhdGEvdmFsdWUgaXMgYWRkZWQuIEVtaXRzIHZhbHVlOiBgbmV3VmFsdWVgIGFuZCBgcGF0aGAuXG4gICAgICogKiBgYW55YDogV2l0aCB0aGUgc2FtZSBzZW1hbnRpY3MgYXMgYGFkZGAsIGBjaGFuZ2VgIG9yIGBkZWxldGVgLCBgYW55YCBpcyB0cmlnZ2VyZWQgZm9yXG4gICAgICogICAgYWxsIHR5cGVzIG9mIGNoYW5nZXMuIERpZmZlcnMgZnJvbSBzd2FwIGluIHRoZSBhcmd1bWVudHMgdGhhdCBpdCBpcyBwYXNzZWQuXG4gICAgICogICAgSXMgcGFzc2VkIGBuZXdWYWx1ZWAgKG9yIHVuZGVmaW5lZCksIGBvbGRWYWx1ZWAgKG9yIHVuZGVmaW5lZCkgYW5kIGZ1bGwgYGtleVBhdGhgLlxuICAgICAqICAgIE5ldyBhbmQgb2xkIHZhbHVlIGFyZSB0aGUgY2hhbmdlZCB2YWx1ZSwgbm90IHJlbGF0aXZlL3Njb3BlZCB0byB0aGUgcmVmZXJlbmNlIHBhdGggYXNcbiAgICAgKiAgICB3aXRoIGBzd2FwYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7U3RyaW5nfSBbZXZlbnROYW1lXSAtIFR5cGUgb2YgY2hhbmdlXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgLSBDYWxsYmFjayB3aGVuIHJlZmVyZW5jZWQgZGF0YSBpcyBzd2FwcGVkXG4gICAgICpcbiAgICAgKiBAYXBpIHB1YmxpY1xuICAgICAqIEBtb2R1bGUgcmVmZXJlbmNlLm9ic2VydmVcbiAgICAgKiBAcmV0dXJucyB7RnVuY3Rpb259IEZ1bmN0aW9uIGZvciByZW1vdmluZyBvYnNlcnZlciAodW5vYnNlcnZlKVxuICAgICAqL1xuICAgIG9ic2VydmU6IGZ1bmN0aW9uIChldmVudE5hbWUsIG5ld0ZuKSB7XG4gICAgICBpZiAodHlwZW9mIGV2ZW50TmFtZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBuZXdGbiA9IGV2ZW50TmFtZTtcbiAgICAgICAgZXZlbnROYW1lID0gdm9pZCAwO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuX2RlYWQgfHwgdHlwZW9mIG5ld0ZuICE9PSAnZnVuY3Rpb24nKSByZXR1cm47XG4gICAgICBpZiAoZXZlbnROYW1lICYmIGV2ZW50TmFtZSAhPT0gJ3N3YXAnKSB7XG4gICAgICAgIG5ld0ZuID0gb25FdmVudE5hbWVBbmRBbnkoZXZlbnROYW1lLCBuZXdGbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuZXdGbiA9IGVtaXRTY29wZWRSZWZlcmVuY2VkU3RydWN0dXJlcyhwYXRoLCBuZXdGbik7XG4gICAgICB9XG5cbiAgICAgIF9zdWJzY3JpYmUocGF0aCwgbmV3Rm4pO1xuICAgICAgdW5vYnNlcnZlcnMgPSB1bm9ic2VydmVycy5hZGQobmV3Rm4pO1xuXG4gICAgICByZXR1cm4gZnVuY3Rpb24gdW5vYnNlcnZlICgpIHtcbiAgICAgICAgX3Vuc3Vic2NyaWJlKHBhdGgsIG5ld0ZuKTtcbiAgICAgIH07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZSBhIG5ldywgdXBkYXRlZCwgY3Vyc29yIGZyb20gdGhlIGJhc2UgcGF0aCBwcm92ZGVkIHRvIHRoZVxuICAgICAqIHJlZmVyZW5jZS4gVGhpcyByZXR1cm5zIGEgSW1tdXRhYmxlLmpzIEN1cnNvciBhcyB0aGUgcmVndWxhclxuICAgICAqIGN1cnNvciBtZXRob2QuIFlvdSBjYW4gYWxzbyBwcm92aWRlIGEgc3ViLXBhdGggdG8gY3JlYXRlIGEgcmVmZXJlbmNlXG4gICAgICogaW4gYSBkZWVwZXIgbGV2ZWwuXG4gICAgICpcbiAgICAgKiAjIyMgRXhhbXBsZXM6XG4gICAgICogYGBganNcbiAgICAgKiB2YXIgcmVmID0gc3RydWN0dXJlLnJlZmVyZW5jZShbJ3NvbWVCb3gnXSk7XG4gICAgICogdmFyIGN1cnNvciA9IHJlZi5jdXJzb3IoJ3NvbWVTdWJQYXRoJyk7XG4gICAgICogdmFyIGN1cnNvcjIgPSByZWYuY3Vyc29yKCk7XG4gICAgICogYGBgXG4gICAgICpcbiAgICAgKiBTZWUgbW9yZSBleGFtcGxlcyBpbiB0aGUgW3JlYWRtZV0oaHR0cHM6Ly9naXRodWIuY29tL29tbmlzY2llbnRqcy9pbW1zdHJ1Y3QpXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gW3N1YnBhdGhdIC0gU3VicGF0aCB0byBhIGRlZXBlciBzdHJ1Y3R1cmVcbiAgICAgKlxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICogQG1vZHVsZSByZWZlcmVuY2UuY3Vyc29yXG4gICAgICogQHJldHVybnMge0N1cnNvcn0gSW1tdXRhYmxlLmpzIGN1cnNvclxuICAgICAqL1xuICAgIGN1cnNvcjogZnVuY3Rpb24gKHN1YlBhdGgpIHtcbiAgICAgIGlmICh0aGlzLl9kZWFkKSByZXR1cm4gdm9pZCAwO1xuICAgICAgc3ViUGF0aCA9IHZhbFRvS2V5UGF0aChzdWJQYXRoKTtcbiAgICAgIGlmIChzdWJQYXRoKSByZXR1cm4gY3Vyc29yLmN1cnNvcihzdWJQYXRoKTtcbiAgICAgIHJldHVybiBjdXJzb3I7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIENyZWF0ZXMgYSByZWZlcmVuY2Ugb24gYSBsb3dlciBsZXZlbCBwYXRoLiBTZWUgY3JlYXRpbmcgbm9ybWFsIHJlZmVyZW5jZXMuXG4gICAgICpcbiAgICAgKiAjIyMgRXhhbXBsZXM6XG4gICAgICogYGBganNcbiAgICAgKiB2YXIgc3RydWN0dXJlID0gaW1tc3RydWN0KHtcbiAgICAgKiAgIHNvbWVCb3g6IHsgbWVzc2FnZTogJ0hlbGxvIFdvcmxkIScgfVxuICAgICAqIH0pO1xuICAgICAqIHZhciByZWYgPSBzdHJ1Y3R1cmUucmVmZXJlbmNlKCdzb21lQm94Jyk7XG4gICAgICpcbiAgICAgKiB2YXIgbmV3UmVmZXJlbmNlID0gcmVmLnJlZmVyZW5jZSgnbWVzc2FnZScpO1xuICAgICAqIGBgYFxuICAgICAqXG4gICAgICogU2VlIG1vcmUgZXhhbXBsZXMgaW4gdGhlIFtyZWFkbWVdKGh0dHBzOi8vZ2l0aHViLmNvbS9vbW5pc2NpZW50anMvaW1tc3RydWN0KVxuICAgICAqXG4gICAgICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IFtwYXRoXSAtIGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZy4gQ2FuIGJlIGFycmF5IGZvciBwYXRoLiBTZWUgSW1tdXRhYmxlLmpzIEN1cnNvcnNcbiAgICAgKlxuICAgICAqIEBhcGkgcHVibGljXG4gICAgICogQHNlZSBzdHJ1Y3R1cmUucmVmZXJlbmNlXG4gICAgICogQG1vZHVsZSByZWZlcmVuY2UucmVmZXJlbmNlXG4gICAgICogQHJldHVybnMge1JlZmVyZW5jZX1cbiAgICAgKi9cbiAgICByZWZlcmVuY2U6IGZ1bmN0aW9uIChzdWJQYXRoKSB7XG4gICAgICBzdWJQYXRoID0gdmFsVG9LZXlQYXRoKHN1YlBhdGgpO1xuICAgICAgcmV0dXJuIHNlbGYucmVmZXJlbmNlKChjdXJzb3IuX2tleVBhdGggfHwgW10pLmNvbmNhdChzdWJQYXRoKSk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlbW92ZSBhbGwgb2JzZXJ2ZXJzIGZyb20gcmVmZXJlbmNlLlxuICAgICAqXG4gICAgICogQGFwaSBwdWJsaWNcbiAgICAgKiBAbW9kdWxlIHJlZmVyZW5jZS51bm9ic2VydmVBbGxcbiAgICAgKiBAcmV0dXJucyB7Vm9pZH1cbiAgICAgKi9cbiAgICB1bm9ic2VydmVBbGw6IGZ1bmN0aW9uIChkZXN0cm95KSB7XG4gICAgICBpZiAodGhpcy5fZGVhZCkgcmV0dXJuIHZvaWQgMDtcbiAgICAgIHVub2JzZXJ2ZXJzLmZvckVhY2goZnVuY3Rpb24oZm4pIHtcbiAgICAgICAgX3Vuc3Vic2NyaWJlKHBhdGgsIGZuKTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoZGVzdHJveSkge1xuICAgICAgICBfdW5zdWJzY3JpYmUocGF0aCwgY3Vyc29yUmVmcmVzaGVyKTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogRGVzdHJveSByZWZlcmVuY2UuIFVub2JzZXJ2ZSBhbGwgb2JzZXJ2ZXJzLCBzZXQgYWxsIGVuZHBvaW50cyBvZiByZWZlcmVuY2UgdG8gZGVhZC5cbiAgICAgKiBGb3IgY2xlYW5pbmcgdXAgbWVtb3J5LlxuICAgICAqXG4gICAgICogQGFwaSBwdWJsaWNcbiAgICAgKiBAbW9kdWxlIHJlZmVyZW5jZS5kZXN0cm95XG4gICAgICogQHJldHVybnMge1ZvaWR9XG4gICAgICovXG4gICAgZGVzdHJveTogZnVuY3Rpb24gKCkge1xuICAgICAgY3Vyc29yID0gdm9pZCAwO1xuICAgICAgdGhpcy51bm9ic2VydmVBbGwodHJ1ZSk7XG5cbiAgICAgIHRoaXMuX2RlYWQgPSB0cnVlO1xuICAgICAgdGhpcy5vYnNlcnZlID0gdm9pZCAwO1xuICAgICAgdGhpcy51bm9ic2VydmVBbGwgPSB2b2lkIDA7XG4gICAgICB0aGlzLmN1cnNvciA9IHZvaWQgMDtcbiAgICAgIHRoaXMuZGVzdHJveSA9IHZvaWQgMDtcblxuICAgICAgY3Vyc29yUmVmcmVzaGVyID0gdm9pZCAwO1xuICAgICAgX3Vuc3Vic2NyaWJlID0gdm9pZCAwO1xuICAgICAgX3N1YnNjcmliZSA9IHZvaWQgMDtcbiAgICB9XG4gIH07XG59O1xuXG4vKipcbiAqIEZvcmNlIGVtaXR0aW5nIHN3YXAgZXZlbnQuIFBhc3Mgb24gbmV3LCBvbGQgYW5kIGtleXBhdGggcGFzc2VkIHRvIHN3YXAuXG4gKiBJZiBuZXdEYXRhIGlzIGBudWxsYCBjdXJyZW50IHdpbGwgYmUgdXNlZC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbmV3RGF0YSAtIEltbXV0YWJsZSBvYmplY3QgZm9yIHRoZSBuZXcgZGF0YSB0byBlbWl0XG4gKiBAcGFyYW0ge09iamVjdH0gb2xkRGF0YSAtIEltbXV0YWJsZSBvYmplY3QgZm9yIHRoZSBvbGQgZGF0YSB0byBlbWl0XG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5UGF0aCAtIFN0cnVjdHVyZSBwYXRoIChpbiB0cmVlKSB0byB3aGVyZSB0aGUgY2hhbmdlcyBvY2N1cmVkLlxuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAbW9kdWxlIHN0cnVjdHVyZS5mb3JjZUhhc1N3YXBwZWRcbiAqIEByZXR1cm5zIHtWb2lkfVxuICovXG5TdHJ1Y3R1cmUucHJvdG90eXBlLmZvcmNlSGFzU3dhcHBlZCA9IGZ1bmN0aW9uIChuZXdEYXRhLCBvbGREYXRhLCBrZXlQYXRoKSB7XG4gIHRoaXMuZW1pdCgnc3dhcCcsIG5ld0RhdGEgfHwgdGhpcy5jdXJyZW50LCBvbGREYXRhLCBrZXlQYXRoKTtcbiAgcG9zc2libHlFbWl0QW5pbWF0aW9uRnJhbWVFdmVudCh0aGlzLCBuZXdEYXRhIHx8IHRoaXMuY3VycmVudCwgb2xkRGF0YSwga2V5UGF0aCk7XG59O1xuXG5cbi8qKlxuICogVW5kbyBJRkYgaGlzdG9yeSBpcyBhY3RpdmF0ZWQgYW5kIHRoZXJlIGFyZSBzdGVwcyB0byB1bmRvLiBSZXR1cm5zIG5ldyBjdXJyZW50XG4gKiBpbW11dGFibGUgc3RydWN0dXJlLlxuICpcbiAqICoqV2lsbCBOT1QgZW1pdCBzd2FwIHdoZW4gcmVkby4gWW91IGhhdmUgdG8gZG8gdGhpcyB5b3Vyc2VsZioqLlxuICpcbiAqIERlZmluZSBudW1iZXIgb2Ygc3RlcHMgdG8gdW5kbyBpbiBwYXJhbS5cbiAqXG4gKiBAcGFyYW0ge051bWJlcn0gc3RlcHMgLSBOdW1iZXIgb2Ygc3RlcHMgdG8gdW5kb1xuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAbW9kdWxlIHN0cnVjdHVyZS51bmRvXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBOZXcgSW1tdXRhYmxlIHN0cnVjdHVyZSBhZnRlciB1bmRvXG4gKi9cblN0cnVjdHVyZS5wcm90b3R5cGUudW5kbyA9IGZ1bmN0aW9uKHN0ZXBzKSB7XG4gIHRoaXMuX2N1cnJlbnRSZXZpc2lvbiAtPSBzdGVwcyB8fCAxO1xuICBpZiAodGhpcy5fY3VycmVudFJldmlzaW9uIDwgMCkge1xuICAgIHRoaXMuX2N1cnJlbnRSZXZpc2lvbiA9IDA7XG4gIH1cblxuICB0aGlzLmN1cnJlbnQgPSB0aGlzLmhpc3RvcnkuZ2V0KHRoaXMuX2N1cnJlbnRSZXZpc2lvbik7XG4gIHJldHVybiB0aGlzLmN1cnJlbnQ7XG59O1xuXG4vKipcbiAqIFJlZG8gSUZGIGhpc3RvcnkgaXMgYWN0aXZhdGVkIGFuZCB5b3UgY2FuIHJlZG8uIFJldHVybnMgbmV3IGN1cnJlbnQgaW1tdXRhYmxlIHN0cnVjdHVyZS5cbiAqIERlZmluZSBudW1iZXIgb2Ygc3RlcHMgdG8gcmVkbyBpbiBwYXJhbS5cbiAqICoqV2lsbCBOT1QgZW1pdCBzd2FwIHdoZW4gcmVkby4gWW91IGhhdmUgdG8gZG8gdGhpcyB5b3Vyc2VsZioqLlxuICpcbiAqIEBwYXJhbSB7TnVtYmVyfSBoZWFkIC0gTnVtYmVyIG9mIHN0ZXBzIHRvIGhlYWQgdG8gaW4gcmVkb1xuICpcbiAqIEBhcGkgcHVibGljXG4gKiBAbW9kdWxlIHN0cnVjdHVyZS5yZWRvXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBOZXcgSW1tdXRhYmxlIHN0cnVjdHVyZSBhZnRlciByZWRvXG4gKi9cblN0cnVjdHVyZS5wcm90b3R5cGUucmVkbyA9IGZ1bmN0aW9uKGhlYWQpIHtcbiAgdGhpcy5fY3VycmVudFJldmlzaW9uICs9IGhlYWQgfHwgMTtcbiAgaWYgKHRoaXMuX2N1cnJlbnRSZXZpc2lvbiA+IHRoaXMuaGlzdG9yeS5jb3VudCgpIC0gMSkge1xuICAgIHRoaXMuX2N1cnJlbnRSZXZpc2lvbiA9IHRoaXMuaGlzdG9yeS5jb3VudCgpIC0gMTtcbiAgfVxuXG4gIHRoaXMuY3VycmVudCA9IHRoaXMuaGlzdG9yeS5nZXQodGhpcy5fY3VycmVudFJldmlzaW9uKTtcbiAgcmV0dXJuIHRoaXMuY3VycmVudDtcbn07XG5cbi8qKlxuICogVW5kbyBJRkYgaGlzdG9yeSBpcyBhY3RpdmF0ZWQgYW5kIHBhc3NlZCBgc3RydWN0dXJlYCBleGlzdHMgaW4gaGlzdG9yeS5cbiAqIFJldHVybnMgdGhlIHNhbWUgaW1tdXRhYmxlIHN0cnVjdHVyZSBhcyBwYXNzZWQgYXMgYXJndW1lbnQuXG4gKlxuICogKipXaWxsIE5PVCBlbWl0IHN3YXAgYWZ0ZXIgdW5kby4gWW91IGhhdmUgdG8gZG8gdGhpcyB5b3Vyc2VsZioqLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBzdHJ1Y3R1cmUgLSBJbW11dGFibGUgc3RydWN0dXJlIHRvIHJlZG8gdW50aWxcbiAqXG4gKiBAYXBpIHB1YmxpY1xuICogQG1vZHVsZSBzdHJ1Y3R1cmUudW5kb1VudGlsXG4gKiBAcmV0dXJucyB7T2JqZWN0fSBOZXcgSW1tdXRhYmxlIHN0cnVjdHVyZSBhZnRlciB1bmRvXG4gKi9cblN0cnVjdHVyZS5wcm90b3R5cGUudW5kb1VudGlsID0gZnVuY3Rpb24oc3RydWN0dXJlKSB7XG4gIHRoaXMuX2N1cnJlbnRSZXZpc2lvbiA9IHRoaXMuaGlzdG9yeS5pbmRleE9mKHN0cnVjdHVyZSk7XG4gIHRoaXMuY3VycmVudCA9IHN0cnVjdHVyZTtcblxuICByZXR1cm4gc3RydWN0dXJlO1xufTtcblxuXG5mdW5jdGlvbiBzdWJzY3JpYmUobGlzdGVuZXJzLCBwYXRoLCBmbikge1xuICByZXR1cm4gbGlzdGVuZXJzLnVwZGF0ZUluKHBhdGguY29uY2F0KExJU1RFTkVSX1NFTlRJTkVMKSwgSW1tdXRhYmxlLk9yZGVyZWRTZXQoKSwgZnVuY3Rpb24ob2xkKSB7XG4gICAgcmV0dXJuIG9sZC5hZGQoZm4pO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gdW5zdWJzY3JpYmUobGlzdGVuZXJzLCBwYXRoLCBmbikge1xuICByZXR1cm4gbGlzdGVuZXJzLnVwZGF0ZUluKHBhdGguY29uY2F0KExJU1RFTkVSX1NFTlRJTkVMKSwgSW1tdXRhYmxlLk9yZGVyZWRTZXQoKSwgZnVuY3Rpb24ob2xkKSB7XG4gICAgcmV0dXJuIG9sZC5yZW1vdmUoZm4pO1xuICB9KTtcbn1cblxuLy8gUHJpdmF0ZSBkZWNvcmF0b3JzLlxuXG4vLyBVcGRhdGUgaGlzdG9yeSBpZiBoaXN0b3J5IGlzIGFjdGl2ZVxuZnVuY3Rpb24gaGFuZGxlSGlzdG9yeSAoZW1pdHRlciwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIGhhbmRsZUhpc3RvcnlGdW5jdGlvbiAobmV3RGF0YSwgb2xkRGF0YSwgcGF0aCkge1xuICAgIHZhciBuZXdTdHJ1Y3R1cmUgPSBmbi5hcHBseShmbiwgYXJndW1lbnRzKTtcbiAgICBpZiAoIWVtaXR0ZXIuaGlzdG9yeSB8fCAobmV3RGF0YSA9PT0gb2xkRGF0YSkpIHJldHVybiBuZXdTdHJ1Y3R1cmU7XG5cbiAgICBlbWl0dGVyLmhpc3RvcnkgPSBlbWl0dGVyLmhpc3RvcnlcbiAgICAgIC50YWtlKCsrZW1pdHRlci5fY3VycmVudFJldmlzaW9uKVxuICAgICAgLnB1c2goZW1pdHRlci5jdXJyZW50KTtcblxuICAgIGlmIChlbWl0dGVyLmhpc3Rvcnkuc2l6ZSA+IGVtaXR0ZXIuX2hpc3RvcnlMaW1pdCkge1xuICAgICAgZW1pdHRlci5oaXN0b3J5ID0gZW1pdHRlci5oaXN0b3J5LnRha2VMYXN0KGVtaXR0ZXIuX2hpc3RvcnlMaW1pdCk7XG4gICAgICBlbWl0dGVyLl9jdXJyZW50UmV2aXNpb24gLT0gKGVtaXR0ZXIuaGlzdG9yeS5zaXplIC0gZW1pdHRlci5faGlzdG9yeUxpbWl0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3U3RydWN0dXJlO1xuICB9O1xufVxuXG52YXIgX3JlcXVlc3RBbmltYXRpb25GcmFtZSA9ICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKSB8fCB1dGlscy5yYWY7XG5cbi8vIFVwZGF0ZSBoaXN0b3J5IGlmIGhpc3RvcnkgaXMgYWN0aXZlXG5mdW5jdGlvbiBwb3NzaWJseUVtaXRBbmltYXRpb25GcmFtZUV2ZW50IChlbWl0dGVyLCBuZXdTdHJ1Y3R1cmUsIG9sZERhdGEsIGtleVBhdGgpIHtcbiAgaWYgKGVtaXR0ZXIuX3F1ZXVlZENoYW5nZSkgcmV0dXJuIHZvaWQgMDtcbiAgZW1pdHRlci5fcXVldWVkQ2hhbmdlID0gdHJ1ZTtcblxuICBfcmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZ1bmN0aW9uICgpIHtcbiAgICBlbWl0dGVyLl9xdWV1ZWRDaGFuZ2UgPSBmYWxzZTtcbiAgICBlbWl0dGVyLmVtaXQoJ25leHQtYW5pbWF0aW9uLWZyYW1lJywgbmV3U3RydWN0dXJlLCBvbGREYXRhLCBrZXlQYXRoKTtcbiAgfSk7XG59XG5cbi8vIEVtaXQgc3dhcCBldmVudCBvbiB2YWx1ZXMgYXJlIHN3YXBwZWRcbmZ1bmN0aW9uIGhhbmRsZVN3YXAgKGVtaXR0ZXIsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBoYW5kbGVTd2FwRnVuY3Rpb24gKG5ld0RhdGEsIG9sZERhdGEsIGtleVBhdGgpIHtcbiAgICB2YXIgcHJldmlvdXMgPSBlbWl0dGVyLmN1cnJlbnQ7XG4gICAgdmFyIG5ld1N0cnVjdHVyZSA9IGZuLmFwcGx5KGZuLCBhcmd1bWVudHMpO1xuICAgIGlmKG5ld0RhdGEgPT09IHByZXZpb3VzKSByZXR1cm4gbmV3U3RydWN0dXJlO1xuXG4gICAgZW1pdHRlci5lbWl0KCdzd2FwJywgbmV3U3RydWN0dXJlLCBwcmV2aW91cywga2V5UGF0aCk7XG4gICAgcG9zc2libHlFbWl0QW5pbWF0aW9uRnJhbWVFdmVudChlbWl0dGVyLCBuZXdTdHJ1Y3R1cmUsIHByZXZpb3VzLCBrZXlQYXRoKTtcblxuICAgIHJldHVybiBuZXdTdHJ1Y3R1cmU7XG4gIH07XG59XG5cbi8vIE1hcCBjaGFuZ2VzIHRvIHVwZGF0ZSBldmVudHMgKGRlbGV0ZS9jaGFuZ2UvYWRkKS5cbmZ1bmN0aW9uIGhhbmRsZVBlcnNpc3RpbmcgKGVtaXR0ZXIsIGZuKSB7XG4gIHJldHVybiBmdW5jdGlvbiBoYW5kbGVQZXJzaXN0aW5nRnVuY3Rpb24gKG5ld0RhdGEsIG9sZERhdGEsIHBhdGgpIHtcbiAgICB2YXIgcHJldmlvdXMgPSBlbWl0dGVyLmN1cnJlbnQ7XG4gICAgdmFyIG5ld1N0cnVjdHVyZSA9IGZuLmFwcGx5KGZuLCBhcmd1bWVudHMpO1xuICAgIGlmKG5ld0RhdGEgPT09IHByZXZpb3VzKSByZXR1cm4gbmV3U3RydWN0dXJlO1xuICAgIHZhciBpbmZvID0gYW5hbHl6ZShuZXdEYXRhLCBwcmV2aW91cywgcGF0aCk7XG5cbiAgICBpZiAoaW5mby5ldmVudE5hbWUpIHtcbiAgICAgIGVtaXR0ZXIuZW1pdC5hcHBseShlbWl0dGVyLCBbaW5mby5ldmVudE5hbWVdLmNvbmNhdChpbmZvLmFyZ3MpKTtcbiAgICAgIGVtaXR0ZXIuZW1pdCgnYW55JywgaW5mby5uZXdPYmplY3QsIGluZm8ub2xkT2JqZWN0LCBwYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld1N0cnVjdHVyZTtcbiAgfTtcbn1cblxuLy8gUHJpdmF0ZSBoZWxwZXJzLlxuXG5mdW5jdGlvbiBhbmFseXplIChuZXdEYXRhLCBvbGREYXRhLCBwYXRoKSB7XG4gIHZhciBvbGRPYmplY3QgPSBvbGREYXRhICYmIG9sZERhdGEuZ2V0SW4ocGF0aCk7XG4gIHZhciBuZXdPYmplY3QgPSBuZXdEYXRhICYmIG5ld0RhdGEuZ2V0SW4ocGF0aCk7XG5cbiAgdmFyIGluT2xkID0gb2xkRGF0YSAmJiBoYXNJbihvbGREYXRhLCBwYXRoKTtcbiAgdmFyIGluTmV3ID0gbmV3RGF0YSAmJiBoYXNJbihuZXdEYXRhLCBwYXRoKTtcblxuICB2YXIgYXJncywgZXZlbnROYW1lO1xuXG4gIGlmIChpbk9sZCAmJiAhaW5OZXcpIHtcbiAgICBldmVudE5hbWUgPSAnZGVsZXRlJztcbiAgICBhcmdzID0gW29sZE9iamVjdCwgcGF0aF07XG4gIH0gZWxzZSBpZiAoaW5PbGQgJiYgaW5OZXcpIHtcbiAgICBldmVudE5hbWUgPSAnY2hhbmdlJztcbiAgICBhcmdzID0gW25ld09iamVjdCwgb2xkT2JqZWN0LCBwYXRoXTtcbiAgfSBlbHNlIGlmICghaW5PbGQgJiYgaW5OZXcpIHtcbiAgICBldmVudE5hbWUgPSAnYWRkJztcbiAgICBhcmdzID0gW25ld09iamVjdCwgcGF0aF07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGV2ZW50TmFtZTogZXZlbnROYW1lLFxuICAgIGFyZ3M6IGFyZ3MsXG4gICAgbmV3T2JqZWN0OiBuZXdPYmplY3QsXG4gICAgb2xkT2JqZWN0OiBvbGRPYmplY3RcbiAgfTtcbn1cblxuLy8gQ2hlY2sgaWYgcGF0aCBleGlzdHMuXG52YXIgTk9UX1NFVCA9IHt9O1xuZnVuY3Rpb24gaGFzSW4oY3Vyc29yLCBwYXRoKSB7XG4gIGlmKGN1cnNvci5oYXNJbikgcmV0dXJuIGN1cnNvci5oYXNJbihwYXRoKTtcbiAgcmV0dXJuIGN1cnNvci5nZXRJbihwYXRoLCBOT1RfU0VUKSAhPT0gTk9UX1NFVDtcbn1cblxuZnVuY3Rpb24gb25FdmVudE5hbWVBbmRBbnkoZXZlbnROYW1lLCBmbikge1xuICByZXR1cm4gZnVuY3Rpb24gKG5ld0RhdGEsIG9sZERhdGEsIGtleVBhdGgpIHtcbiAgICB2YXIgaW5mbyA9IGFuYWx5emUobmV3RGF0YSwgb2xkRGF0YSwga2V5UGF0aCk7XG5cbiAgICBpZiAoaW5mby5ldmVudE5hbWUgIT09IGV2ZW50TmFtZSAmJiBldmVudE5hbWUgIT09ICdhbnknKSByZXR1cm4gdm9pZCAwO1xuICAgIGlmIChldmVudE5hbWUgPT09ICdhbnknKSB7XG4gICAgICByZXR1cm4gZm4uY2FsbChmbiwgaW5mby5uZXdPYmplY3QsIGluZm8ub2xkT2JqZWN0LCBrZXlQYXRoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmFwcGx5KGZuLCBpbmZvLmFyZ3MpO1xuICB9O1xufVxuXG5mdW5jdGlvbiBlbWl0U2NvcGVkUmVmZXJlbmNlZFN0cnVjdHVyZXMocGF0aCwgZm4pIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdpdGhSZWZlcmVuY2VTY29wZWRTdHJ1Y3R1cmVzIChuZXdTdHJ1Y3R1cmUsIG9sZFN0cnVjdHVyZSwga2V5UGF0aCkge1xuICAgIHJldHVybiBmbi5jYWxsKHRoaXMsIG5ld1N0cnVjdHVyZS5nZXRJbihwYXRoKSwgb2xkU3RydWN0dXJlLmdldEluKHBhdGgpLCBrZXlQYXRoLnNsaWNlKHBhdGgubGVuZ3RoKSk7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGlzQ3Vyc29yIChwb3RlbnRpYWwpIHtcbiAgcmV0dXJuIHBvdGVudGlhbCAmJiB0eXBlb2YgcG90ZW50aWFsLmRlcmVmID09PSAnZnVuY3Rpb24nO1xufVxuXG4vLyBDaGVjayBpZiBwYXNzZWQgc3RydWN0dXJlIGlzIGV4aXN0aW5nIGltbXV0YWJsZSBzdHJ1Y3R1cmUuXG4vLyBGcm9tIGh0dHBzOi8vZ2l0aHViLmNvbS9mYWNlYm9vay9pbW11dGFibGUtanMvd2lraS9VcGdyYWRpbmctdG8tSW1tdXRhYmxlLXYzI2FkZGl0aW9uYWwtY2hhbmdlc1xudmFyIGltbXV0YWJsZUNoZWNrZXJzID0gW1xuICB7bmFtZTogJ0l0ZXJhYmxlJywgbWV0aG9kOiAnaXNJdGVyYWJsZScgfSxcbiAge25hbWU6ICdTZXEnLCBtZXRob2Q6ICdpc1NlcSd9LFxuICB7bmFtZTogJ01hcCcsIG1ldGhvZDogJ2lzTWFwJ30sXG4gIHtuYW1lOiAnT3JkZXJlZE1hcCcsIG1ldGhvZDogJ2lzT3JkZXJlZE1hcCd9LFxuICB7bmFtZTogJ0xpc3QnLCBtZXRob2Q6ICdpc0xpc3QnfSxcbiAge25hbWU6ICdTdGFjaycsIG1ldGhvZDogJ2lzU3RhY2snfSxcbiAge25hbWU6ICdTZXQnLCBtZXRob2Q6ICdpc1NldCd9XG5dO1xuZnVuY3Rpb24gaXNJbW11dGFibGVTdHJ1Y3R1cmUgKGRhdGEpIHtcbiAgcmV0dXJuIGltbXV0YWJsZUNoZWNrZXJzLnNvbWUoZnVuY3Rpb24gKGNoZWNrSXRlbSkge1xuICAgIHJldHVybiBpbW11dGFibGVTYWZlQ2hlY2soY2hlY2tJdGVtLm5hbWUsIGNoZWNrSXRlbS5tZXRob2QsIGRhdGEpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gaW1tdXRhYmxlU2FmZUNoZWNrIChucywgbWV0aG9kLCBkYXRhKSB7XG4gIHJldHVybiBJbW11dGFibGVbbnNdICYmIEltbXV0YWJsZVtuc11bbWV0aG9kXSAmJiBJbW11dGFibGVbbnNdW21ldGhvZF0oZGF0YSk7XG59XG5cbmZ1bmN0aW9uIHZhbFRvS2V5UGF0aCh2YWwpIHtcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxuICByZXR1cm4gQXJyYXkuaXNBcnJheSh2YWwpID8gdmFsIDpcbiAgICBpbW11dGFibGVTYWZlQ2hlY2soJ0l0ZXJhYmxlJywgJ2lzSXRlcmFibGUnLCB2YWwpID9cbiAgICAgIHZhbC50b0FycmF5KCkgOiBbdmFsXTtcbn1cblxuZnVuY3Rpb24gaW5oZXJpdHMgKGMsIHApIHtcbiAgdmFyIGUgPSB7fTtcbiAgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYy5wcm90b3R5cGUpLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICBlW2tdID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihjLnByb3RvdHlwZSwgayk7XG4gIH0pO1xuICBjLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUocC5wcm90b3R5cGUsIGUpO1xuICBjWydzdXBlciddID0gcDtcbn1cbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMuZ2VuZXJhdGVSYW5kb21LZXkgPSBmdW5jdGlvbiAobGVuKSB7XG4gIGxlbiA9IGxlbiB8fCAxMDtcbiAgcmV0dXJuIE1hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnN1YnN0cmluZygyKS5zdWJzdHJpbmcoMCwgbGVuKTtcbn07XG5cbi8vIFZhcmlhdGlvbiBzaGltIGJhc2VkIG9uIHRoZSBjbGFzc2ljIHBvbHlmaWxsOlxuLy8gaHR0cDovL3d3dy5wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG5tb2R1bGUuZXhwb3J0cy5yYWYgPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBnbG9iID0gKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSA/IG1vZHVsZSA6IHdpbmRvdztcbiAgdmFyIGxhc3RUaW1lID0gMDtcbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcbiAgZm9yKHZhciB4ID0gMDsgeCA8IHZlbmRvcnMubGVuZ3RoICYmICFnbG9iLnJlcXVlc3RBbmltYXRpb25GcmFtZTsgKyt4KSB7XG4gICAgZ2xvYi5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSBnbG9iW3ZlbmRvcnNbeF0rJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuICB9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKGNhbGxiYWNrLCBlbGVtZW50KSB7XG4gICAgdmFyIGN1cnJUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgdmFyIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGxhc3RUaW1lKSk7XG4gICAgdmFyIGlkID0gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKTsgfSxcbiAgICAgIHRpbWVUb0NhbGwpO1xuICAgIGxhc3RUaW1lID0gY3VyclRpbWUgKyB0aW1lVG9DYWxsO1xuICAgIHJldHVybiBpZDtcbiAgfTtcbn0oKSk7XG4iLCJtb2R1bGUuZXhwb3J0cz17XG4gIFwibmFtZVwiOiBcInR1c2tcIixcbiAgXCJ2ZXJzaW9uXCI6IFwiMC43LjZcIixcbiAgXCJkZXNjcmlwdGlvblwiOiBcIkEgc2xpbSB2aXJ0dWFsIGRvbSBpbXBsZW1lbnRhdGlvbiBmb3IgaW1tdXRhYmxlIHN0cnVjdHVyZXMuXCIsXG4gIFwiYXV0aG9yXCI6IFwiRHlsYW4gUGllcmNleSA8cGllcmNleWR5bGFuQGdtYWlsLmNvbT5cIixcbiAgXCJtYWluXCI6IFwibGliL2luZGV4LmpzXCIsXG4gIFwibGljZW5zZVwiOiBcIk1JVFwiLFxuICBcInNjcmlwdHNcIjoge1xuICAgIFwicHJlY29tbWl0XCI6IFwibnBtIHJ1biByZWxlYXNlXCIsXG4gICAgXCJ0ZXN0XCI6IFwiZ3VscCB0ZXN0XCIsXG4gICAgXCJidWlsZFwiOiBcImd1bHAgYnVpbGRcIixcbiAgICBcInJlbGVhc2VcIjogXCJndWxwIHRlc3QgJiYgZ3VscCBidWlsZCAmJiBndWxwIGJ1aWxkLWJyb3dzZXIgJiYgZ3VscCBidWlsZC10ZXN0XCJcbiAgfSxcbiAgXCJrZXl3b3Jkc1wiOiBbXG4gICAgXCJkb21cIixcbiAgICBcInZpcnR1YWxcIixcbiAgICBcInJlYWN0XCIsXG4gICAgXCJ0dXNrXCIsXG4gICAgXCJyZW5kZXJcIixcbiAgICBcImltbXN0cnVjdFwiLFxuICAgIFwiaW1tdXRhYmxlXCIsXG4gICAgXCJqc3hcIlxuICBdLFxuICBcInJlcG9zaXRvcnlcIjoge1xuICAgIFwidHlwZVwiOiBcImdpdFwiLFxuICAgIFwidXJsXCI6IFwiaHR0cHM6Ly9naXRodWIuY29tL0R5bGFuUGllcmNleS90dXNrXCJcbiAgfSxcbiAgXCJkZXZEZXBlbmRlbmNpZXNcIjoge1xuICAgIFwiYnJvd3NlcmlmeVwiOiBcIl4xMS4xLjBcIixcbiAgICBcImJ1bmRsZS1jb2xsYXBzZXJcIjogXCJeMS4yLjFcIixcbiAgICBcImNvZmZlZS1yZWFjdFwiOiBcIl40LjAuMFwiLFxuICAgIFwiY29mZmVlLXJlYWN0aWZ5XCI6IFwiXjQuMC4wXCIsXG4gICAgXCJndWxwXCI6IFwiXjMuOS4wXCIsXG4gICAgXCJndWxwLWNqc3hcIjogXCJeMy4wLjBcIixcbiAgICBcImd1bHAtaGVhZGVyXCI6IFwiXjEuNy4xXCIsXG4gICAgXCJndWxwLW1vY2hhXCI6IFwiXjIuMS4zXCIsXG4gICAgXCJndWxwLXNvdXJjZW1hcHNcIjogXCJeMS41LjJcIixcbiAgICBcImd1bHAtdWdsaWZ5XCI6IFwiXjEuNC4xXCIsXG4gICAgXCJodXNreVwiOiBcIl4wLjEwLjFcIixcbiAgICBcImltbXN0cnVjdFwiOiBcIl4yLjAuMFwiLFxuICAgIFwianNkb21cIjogXCJeNi41LjFcIixcbiAgICBcIm1vY2hhXCI6IFwiXjIuMy4zXCIsXG4gICAgXCJtb2NoYS1qc2RvbVwiOiBcIl4xLjAuMFwiLFxuICAgIFwidmlueWwtYnVmZmVyXCI6IFwiXjEuMC4wXCIsXG4gICAgXCJ2aW55bC1zb3VyY2Utc3RyZWFtXCI6IFwiXjEuMS4wXCJcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPVxuXHQjIyNcblx0IyBAcHJpdmF0ZVxuXHQjIEBkZXNjcmlwdGlvblxuXHQjIFRoZSBrZXkgdXNlZCB0byBhdHRhY2ggZGF0YSB0byB0aGUgZG9tLlxuXHQjIyNcblx0Tk9ERTogXCJfX25vZGVfX1wiXG5cdCMjI1xuXHQjIEBwcml2YXRlXG5cdCMgQGRlc2NyaXB0aW9uXG5cdCMgTGlzdCBvZiBzdXBwb3J0ZWQgaHRtbCBuYW1lc3BhY2VzLlxuXHQjIyNcblx0TkFNRVNQQUNFUzpcblx0XHRIVE1MOiAgICBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGh0bWxcIlxuXHRcdE1BVEhfTUw6IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoL01hdGhNTFwiXG5cdFx0U1ZHOiAgICAgXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXG5cdCMjI1xuXHQjIEBwcml2YXRlXG5cdCMgQGRlc2NyaXB0aW9uXG5cdCMgTGlzdCBvZiBodG1sIHRhZ3MgdGhhdCBhcmUgc2VsZiBjbG9zaW5nLlxuXHQjIyNcblx0U0VMRl9DTE9TSU5HOiBbXG5cdFx0XCJhcmVhXCIsXG5cdFx0XCJiYXNlXCIsXG5cdFx0XCJiclwiLFxuXHRcdFwiY29sXCIsXG5cdFx0XCJjb21tYW5kXCIsXG5cdFx0XCJlbWJlZFwiLFxuXHRcdFwiaHJcIixcblx0XHRcImltZ1wiLFxuXHRcdFwiaW5wdXRcIixcblx0XHRcImtleWdlblwiLFxuXHRcdFwibGlua1wiLFxuXHRcdFwibWV0YVwiLFxuXHRcdFwicGFyYW1cIixcblx0XHRcInNvdXJjZVwiLFxuXHRcdFwidHJhY2tcIixcblx0XHRcIndiclwiXG5cdF1cblx0IyMjXG5cdCMgQHByaXZhdGVcblx0IyBAZGVzY3JpcHRpb25cblx0IyBMaXN0IG9mIGV2ZW50cyB0aGF0IGFyZSBzdXBwb3J0ZWQgYnkgdHVzay5cblx0IyMjXG5cdEVWRU5UUzogW1xuXHRcdFwiYW5pbWF0aW9uZW5kXCIsXG5cdFx0XCJhbmltYXRpb25pdGVyYXRpb25cIixcblx0XHRcImFuaW1hdGlvbnN0YXJ0XCIsXG5cdFx0XCJiZWZvcmV1bmxvYWRcIixcblx0XHRcImJsdXJcIixcblx0XHRcImNhbnBsYXlcIixcblx0XHRcImNhbnBsYXl0aHJvdWdoXCIsXG5cdFx0XCJjaGFuZ2VcIixcblx0XHRcImNsaWNrXCIsXG5cdFx0XCJjb250ZXh0bWVudVwiLFxuXHRcdFwiY29weVwiLFxuXHRcdFwiY3V0XCIsXG5cdFx0XCJkYmxjbGlja1wiLFxuXHRcdFwiZHJhZ1wiLFxuXHRcdFwiZHJhZ2VuZFwiLFxuXHRcdFwiZHJhZ2VudGVyXCIsXG5cdFx0XCJkcmFnZXhpdFwiLFxuXHRcdFwiZHJhZ2xlYXZlXCIsXG5cdFx0XCJkcmFnb3ZlclwiLFxuXHRcdFwiZHJhZ3N0YXJ0XCIsXG5cdFx0XCJkcm9wXCIsXG5cdFx0XCJkdXJhdGlvbmNoYW5nZVwiLFxuXHRcdFwiZW1wdGllZFwiLFxuXHRcdFwiZW5kZWRcIixcblx0XHRcImZvY3VzXCIsXG5cdFx0XCJmdWxsc2NyZWVuY2hhbmdlXCIsXG5cdFx0XCJpbnB1dFwiLFxuXHRcdFwia2V5ZG93blwiLFxuXHRcdFwia2V5cHJlc3NcIixcblx0XHRcImtleXVwXCIsXG5cdFx0XCJtb3VzZWRvd25cIixcblx0XHRcIm1vdXNlZW50ZXJcIixcblx0XHRcIm1vdXNlbGVhdmVcIixcblx0XHRcIm1vdXNlbW92ZVwiLFxuXHRcdFwibW91c2VvdXRcIixcblx0XHRcIm1vdXNlb3ZlclwiLFxuXHRcdFwibW91c2V1cFwiLFxuXHRcdFwicGFzdGVcIixcblx0XHRcInBhdXNlXCIsXG5cdFx0XCJwbGF5XCIsXG5cdFx0XCJwbGF5aW5nXCIsXG5cdFx0XCJwcm9ncmVzc1wiLFxuXHRcdFwicmF0ZWNoYW5nZVwiLFxuXHRcdFwicmVzZXRcIixcblx0XHRcInNjcm9sbFwiLFxuXHRcdFwic2Vla2VkXCIsXG5cdFx0XCJzZWVraW5nXCIsXG5cdFx0XCJzZWxlY3RcIixcblx0XHRcInN0YWxsZWRcIixcblx0XHRcInN1Ym1pdFwiLFxuXHRcdFwic3VzcGVuZFwiLFxuXHRcdFwidGltZXVwZGF0ZVwiLFxuXHRcdFwidG91Y2hjYW5jZWxcIixcblx0XHRcInRvdWNoZW5kXCIsXG5cdFx0XCJ0b3VjaG1vdmVcIixcblx0XHRcInRvdWNoc3RhcnRcIixcblx0XHRcInRyYW5zaXRpb25lbmRcIixcblx0XHRcInZpc2liaWxpdHljaGFuZ2VcIixcblx0XHRcInZvbHVtZWNoYW5nZVwiLFxuXHRcdFwid2FpdGluZ1wiLFxuXHRcdFwid2hlZWxcIlxuXHRdXG4iLCJ7IE5PREUsIEVWRU5UUyB9ID0gcmVxdWlyZShcIi4vY29uc3RhbnRzXCIpXG5cbiMjI1xuIyBAcHJpdmF0ZVxuIyBAZGVzY3JpcHRpb25cbiMgSGFuZGxlIGFuZCBkZWxlZ2F0ZSBnbG9iYWwgZXZlbnRzLlxuI1xuIyBAcGFyYW0ge0V2ZW50fSBlIC0gVGhlIERPTSBldmVudCBiZWluZyBoYW5kbGVkLlxuIyMjXG5oYW5kbGVFdmVudCA9IChlKS0+XG5cdHsgdGFyZ2V0LCB0eXBlIH0gPSBlXG5cdCMgRXZlbnRzIGFyZSBjYXNlIGluc2Vuc2l0aXZlIGluIHR1c2suXG5cdHR5cGUgPSB0eXBlLnRvTG93ZXJDYXNlKClcblxuXHR1bmxlc3MgZS5idWJibGVzIHRoZW4gdGFyZ2V0W05PREVdPy5ldmVudHNbdHlwZV0/KGUpXG5cdGVsc2Vcblx0XHQjIHN0b3BQcm9wYWdhdGlvbigpIGZhaWxzIHRvIHNldCBjYW5jZWxCdWJibGUgdG8gdHJ1ZSBpbiBXZWJraXRcblx0XHQjIEBzZWUgaHR0cDovL2NvZGUuZ29vZ2xlLmNvbS9wL2Nocm9taXVtL2lzc3Vlcy9kZXRhaWw/aWQ9MTYyMjcwXG5cdFx0ZS5zdG9wUHJvcGFnYXRpb24gPSAtPiBlLmNhbmNlbEJ1YmJsZSA9IHRydWVcblx0XHQjIFRoaXMgYWxsb3dzIHVzIHRvIGlnbm9yZSB0aGUgZGVmYXVsdCBicm93c2VyIGhhbmRsaW5nIG9mIGN1cnJlbnQgdGFyZ2V0LlxuXHRcdCMgVGhlIGJyb3dzZXIgaGFzIG5vIGlkZWEgd2hpY2ggdmlydHVhbCBlbGVtZW50cyBhcmUgYmVpbmcgZGVsZWdhdGVkIHRvby5cblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZSwgXCJjdXJyZW50VGFyZ2V0XCIsXG5cdFx0XHR2YWx1ZTogICAgdGFyZ2V0XG5cdFx0XHR3cml0YWJsZTogdHJ1ZVxuXHRcdClcblxuXHRcdCMgRGlzcGF0Y2ggZXZlbnRzIHRvIHJlZ2lzdGVyZWQgaGFuZGxlcnMuXG5cdFx0d2hpbGUgdGFyZ2V0XG5cdFx0XHRlLmN1cnJlbnRUYXJnZXQgPSB0YXJnZXRcblx0XHRcdG5vZGUgICAgICAgICAgICA9IHRhcmdldFtOT0RFXVxuXHRcdFx0dGFyZ2V0ICAgICAgICAgID0gdGFyZ2V0LnBhcmVudE5vZGVcblx0XHRcdG5vZGU/LmV2ZW50c1t0eXBlXT8oZSlcblx0XHRcdGJyZWFrIGlmIGUuY2FuY2VsQnViYmxlXG5cdHJldHVyblxuXG5tb2R1bGUuZXhwb3J0cyA9XG5cdCMjI1xuXHQjIFV0aWxpdHkgdG8gY3JlYXRlLCBjYWNoZSBhbmQgZGlzcGF0Y2ggYW4gZXZlbnQgb24gYSBnaXZlbiBlbGVtZW50LlxuXHQjXG5cdCMgQHBhcmFtIHtTdHJpbmd9IG5hbWVcblx0IyBAcGFyYW0ge0hUTUxFbnRpdHl9IGVsZW1cblx0IyBAcGFyYW0ge0Jvb2xlYW59IGJ1YmJsZVxuXHQjIyNcblx0ZGlzcGF0Y2g6IChuYW1lLCBlbGVtLCBidWJibGVzID0gZmFsc2UpLT5cblx0XHRlID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJFdmVudFwiKVxuXHRcdGUuaW5pdEV2ZW50KG5hbWUsIGJ1YmJsZXMsIGZhbHNlKVxuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKGUsXG5cdFx0XHR0YXJnZXQ6IHZhbHVlOiBlbGVtXG5cdFx0XHRzcmNFbGVtZW50OiB2YWx1ZTogZWxlbVxuXHRcdClcblx0XHRoYW5kbGVFdmVudChlKVxuXHRcdHJldHVyblxuXG5cdCMjI1xuXHQjIEBwcml2YXRlXG5cdCMgQGRlc2NyaXB0aW9uXG5cdCMgQXR0YWNoIGFsbCBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIGRvbSBmb3IgZGVsZWdhdGlvbi5cblx0IyMjXG5cdGluaXQ6IC0+XG5cdFx0cmV0dXJuIGlmIGRvY3VtZW50Ll9fdHVza1xuXHRcdCMgQXR0YWNoIGFsbCBldmVudHMgYXQgdGhlIHJvb3QgbGV2ZWwgZm9yIGRlbGVnYXRpb24uXG5cdFx0ZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVFdmVudCwgdHJ1ZSkgZm9yIHR5cGUgaW4gRVZFTlRTXG5cdFx0ZG9jdW1lbnQuX190dXNrID0gdHJ1ZVxuXHRcdHJldHVyblxuIiwiTm9kZSAgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi92aXJ0dWFsL25vZGVcIilcbmRlbGVnYXRvciAgICAgICAgICAgID0gcmVxdWlyZShcIi4vZGVsZWdhdG9yXCIpXG57IE5PREUgfSAgICAgICAgICAgICA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKVxueyBmbGF0dGVuLCBnZXREaWZmIH0gPSByZXF1aXJlKFwiLi91dGlsXCIpXG5cbiMgU3RvcmVzIHRoZSBjdXJyZW50IGNvbnRleHQgZm9yIGNyZWF0ZSBlbGVtZW50LiBDYW4gYmUgY2hhbmdlZCB2aWEgXCJ3aXRoXCIuXG5fY29udGV4dCA9IHVuZGVmaW5lZFxuXG4jIFN0b3JlcyB0aGUgY3VycmVudCByZW5kZXIgZnVuY3Rpb24gYW5kIHByb3BzLlxuX293bmVyID0gdW5kZWZpbmVkXG5cbiMjI1xuIyBAbmFtZXNwYWNlIHR1c2tcbiMgQGRlc2NyaXB0aW9uXG4jIFV0aWxpdHkgdG8gY3JlYXRlIHZpcnR1YWwgZWxlbWVudHMuXG4jIElmIHRoZSBnaXZlbiB0eXBlIGlzIGEgc3RyaW5nIHRoZW4gdGhlIHJlc3VsdGluZyB2aXJ0dWFsIG5vZGUgd2lsbCBiZSBjcmVhdGVkIHdpdGggYSB0YWduYW1lIG9mIHRoYXQgc3RyaW5nLlxuIyBPdGhlcndpc2UgaWYgdGhlIHR5cGUgaXMgYSBmdW5jdGlvbiBpdCB3aWxsIGJlIGludm9rZWQsIGFuZCB0aGUgcmV0dXJuZWQgbm9kZXMgdXNlZC5cbiMgYGBgamF2YXNjcmlwdFxuIyAvLyBDcmVhdGUgYSB2aXJ0dWFsIGVsZW1lbnQuXG4jIHR1c2soXCJkaXZcIiwgeyBpZDogXCJleGFtcGxlXCIgfSwgLi4uKTsgLy8gLT4gTm9kZVxuIyBgYGBcbiNcbiMgQHBhcmFtIHsoU3RyaW5nfEZ1bmN0aW9uKX0gdHlwZSAtIEEgbm9kZU5hbWUgb3IgYSBmdW5jdGlvbiB0aGF0IHJldHVybnMgYSBOb2RlLlxuIyBAcGFyYW0ge09iamVjdH0gcHJvcHMgLSBUaGUgZXZlbnRzIGFuZCBhdHRyaWJ1dGVzIGZvciB0aGUgcmVzdWx0aW5nIGVsZW1lbnQuXG4jIEBwYXJhbSB7QXJyYXl9IGNoaWxkcmVuIC0gVGhlIGNoaWxkcmVuIGZvciB0aGUgcmVzdWx0aW5nIGVsZW1lbnQuXG4jIEB0aHJvd3Mge1R5cGVFcnJvcn0gdHlwZSBtdXN0IGJlIGEgZnVuY3Rpb24gb3IgYSBzdHJpbmcuXG4jIEByZXR1cm5zIHsoTm9kZXwqKX1cbiMjI1xudHVzayA9ICh0eXBlLCBwcm9wcyktPlxuXHRsZW4gICAgICA9IGFyZ3VtZW50cy5sZW5ndGggLSAyXG5cdGNoaWxkcmVuID0gKFxuXHRcdGlmIGxlbiA8PSAwIHRoZW4gW11cblx0XHRlbHNlIFxuXHRcdFx0YXJyICAgICAgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDIpXG5cdFx0XHRhcnJbbGVuXSA9IGFyZ3VtZW50c1tsZW4gKyAyXSB3aGlsZSBsZW4tLVxuXHRcdFx0ZmxhdHRlbihhcnIpXG5cdClcblxuXHQjIENyZWF0ZSBub2RlIGJhc2VkIG9uIHR5cGUuXG5cdHN3aXRjaCB0eXBlb2YgdHlwZVxuXHRcdHdoZW4gXCJzdHJpbmdcIiB0aGVuIG5ldyBOb2RlKHR5cGUsIF9vd25lciwgcHJvcHMsIGNoaWxkcmVuKVxuXHRcdHdoZW4gXCJmdW5jdGlvblwiXG5cdFx0XHRfb3duZXIgPSB0eXBlXG5cdFx0XHRub2RlICAgPSB0eXBlKHByb3BzLCBjaGlsZHJlbiwgX2NvbnRleHQpXG5cdFx0XHRfb3duZXIgPSB1bmRlZmluZWRcblx0XHRcdG5vZGVcblx0XHRlbHNlIHRocm93IG5ldyBUeXBlRXJyb3IoXCJUdXNrOiBJbnZhbGlkIHZpcnR1YWwgbm9kZSB0eXBlLlwiKVxuXG4jIyNcbiMgQHN0YXRpY1xuIyBAYWxpYXMgdHVza1xuIyMjXG50dXNrLmNyZWF0ZUVsZW1lbnQgPSB0dXNrXG5cbiMjI1xuIyBAc3RhdGljXG4jIEBkZXNjcmlwdGlvblxuIyBSZW5kZXIgYSB2aXJ0dWFsIG5vZGUgb250byBhbiBodG1sIGVudGl0eS5cbiMgVGhpcyB3aWxsIGF1dG9tYXRpY2FsbHkgcmUtdXNlIGV4aXN0aW5nIGRvbSBhbmQgaW5pdGlhbGl6ZSBhIHR1c2sgYXBwLlxuIyBgYGBqYXZhc2NyaXB0XG4jIC8vIFVzaW5nIGpzeC5cbiMgdHVzay5yZW5kZXIoZG9jdW1lbnQuYm9keSwgPGJvZHk+SGVsbG8gV29ybGQhPC9ib2R5Pik7XG4jIGRvY3VtZW50LmJvZHkuaW5uZXJIVE1MOyAvLy0+IFwiSGVsbG8gV29ybGRcIlxuIyBgYGBcbiNcbiMgQHBhcmFtIHtIVE1MRW50aXR5fSBlbnRpdHkgLSBUaGUgZG9tIG5vZGUgdG8gcmVuZGVyIHRoZSB2aXJ0dWFsIG5vZGUgb250by5cbiMgQHBhcmFtIHtOb2RlfSBub2RlIC0gVGhlIHZpcnR1YWwgbm9kZSB0byByZW5kZXIuXG4jIyNcbnR1c2sucmVuZGVyID0gKGVudGl0eSwgbm9kZSktPlxuXHRpZiB0eXBlb2Ygd2luZG93IGlzIFwidW5kZWZpbmVkXCJcblx0XHR0aHJvdyBuZXcgRXJyb3IoXCJUdXNrOiBDYW5ub3QgcmVuZGVyIG9uIHRoZSBzZXJ2ZXIgKHVzZSB0b1N0cmluZykuXCIpXG5cblx0dW5sZXNzIGVudGl0eSBpbnN0YW5jZW9mIHdpbmRvdy5Ob2RlXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiVHVzazogQ29udGFpbmVyIG11c3QgYmUgYSBET00gZWxlbWVudC5cIilcblxuXHR1bmxlc3Mgbm9kZT8uaXNUdXNrXG5cdFx0dGhyb3cgbmV3IEVycm9yKFwiVHVzazogQ2FuIG9ubHkgcmVuZGVyIGEgdmlydHVhbCBub2RlLlwiKVxuXG5cdCMgQ2hlY2sgaWYgdGhpcyBlbnRpdHkgaGFzIGJlZW4gcmVuZGVyZWQgaW50byBiZWZvcmUgd2l0aCB0aGlzIHZpcnR1YWwgbm9kZS5cblx0dW5sZXNzIGVudGl0eVtOT0RFXT8udXBkYXRlKG5vZGUpXG5cdFx0cHJldkhUTUwgPSBlbnRpdHkub3V0ZXJIVE1MXG5cdFx0Y3VySFRNTCAgPSBub2RlLnRvU3RyaW5nKClcblx0XHQjIEF0dGVtcHQgdG8gc2VlIGlmIHdlIGNhbiBib290c3RyYXAgb2ZmIG9mIGV4aXN0aW5nIGRvbS5cblx0XHRpZiBjdXJIVE1MIGlzIHByZXZIVE1MIHRoZW4gbm9kZS5tb3VudChlbnRpdHkpXG5cdFx0ZWxzZVxuXHRcdFx0ZW50aXR5W05PREVdID0gbm9kZVxuXHRcdFx0ZW50aXR5LnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKG5vZGUuY3JlYXRlKCksIGVudGl0eSlcblx0XHRcdGlmIHByZXZIVE1MP1xuXHRcdFx0XHRbc2VydmVyLCBjbGllbnRdID0gZ2V0RGlmZihwcmV2SFRNTCwgY3VySFRNTClcblx0XHRcdFx0Y29uc29sZS53YXJuKFwiXCJcIlxuXHRcdFx0XHRcdFR1c2s6IENvdWxkIG5vdCBib290c3RyYXAgZG9jdW1lbnQsIGV4aXN0aW5nIGh0bWwgYW5kIHZpcnR1YWwgaHRtbCBkbyBub3QgbWF0Y2guXG5cblx0XHRcdFx0XHRTZXJ2ZXI6XG5cdFx0XHRcdFx0I3tzZXJ2ZXJ9XG5cblx0XHRcdFx0XHRDbGllbnQ6XG5cdFx0XHRcdFx0I3tjbGllbnR9XG5cdFx0XHRcdFwiXCJcIilcblx0XHQjIEJvb3RzdHJhcCBldmVudCBsaXN0ZW5lcnMgaWYgd2UgYXJlIGluIHRoZSBicm93c2VyLlxuXHRcdGRlbGVnYXRvci5pbml0KClcblx0cmV0dXJuXG5cbiMjI1xuIyBAc3RhdGljXG4jIEBkZXNjcmlwdGlvblxuIyBVdGlsaXR5IHRvIGF0dGFjaCBjb250ZXh0IHRvICNjcmVhdGVFbGVtZW50IGZvciBzaWRld2F5cyBkYXRhIGxvYWRpbmcuXG4jIFRoZSBwcm92aWRlZCByZW5kZXJlciB3aWxsIGJlIGltbWVkaWF0ZWx5IGludm9rZWQuXG4jIGBgYGphdmFzY3JpcHRcbiMgbGV0IE15Q29tcG9uZW50ID0gZnVuY3Rpb24gKHByb3BzLCBjaGlsZHJlbiwgY29udGV4dCkge1xuIyBcdHJldHVybiAoXG4jIFx0XHQ8Ym9keT5cbiMgXHRcdFx0Q291bnRlcjogeyBjb250ZXh0LmNvdW50ZXIgfVxuIyBcdFx0PC9ib2R5PlxuIyBcdCk7XG4jIH07XG4jXG4jIHR1c2sucmVuZGVyKGRvY3VtZW50LmJvZHksXG4jIFx0dHVzay53aXRoKHsgY291bnRlcjogMSB9LCBmdW5jdGlvbiAoKSB7XG4jIFx0XHRyZXR1cm4gKFxuIyBcdFx0XHQ8TXlDb3VudGVyLz5cbiMgXHRcdCk7XG4jIFx0fSk7XG4jICk7XG4jXG4jIGRvY3VtZW50LmJvZHkuaW5uZXJIVE1MOyAvLy0+IFwiQ291bnRlcjogMVwiXG4jIGBgYFxuI1xuIyBAcGFyYW0geyp9IGNvbnRleHQgLSBBIHZhbHVlIHRoYXQgYW55IGN1c3RvbSByZW5kZXIgZnVuY3Rpb25zIHdpbGwgYmUgaW52b2tlZCB3aXRoLlxuIyBAcGFyYW0ge0Z1bmN0aW9ufSByZW5kZXJlciAtIEFueSBub2RlcyByZW5kZXJlZCB3aXRoaW4gdGhlIGZ1bmN0aW9uIHdpbGwgYmUgY2FsbGVkIHdpdGggdGhlIGNvbnRleHQuXG4jIEB0aHJvd3Mge1R5cGVFcnJvcn0gVGhlIHJlc3VsdCBvZiByZW5kZXJlciBtdXN0IGJlIGEgTm9kZS5cbiMgQHJldHVybnMgeyhOb2RlfFRleHQpfVxuIyMjXG50dXNrLndpdGggPSAoY29udGV4dCwgcmVuZGVyZXIpLT5cblx0dW5sZXNzIHR5cGVvZiByZW5kZXJlciBpcyBcImZ1bmN0aW9uXCJcblx0XHR0aHJvdyBuZXcgVHlwZUVycm9yKFwiVHVzazogcmVuZGVyZXIgc2hvdWxkIGJlIGEgZnVuY3Rpb24uXCIpXG5cdF9jb250ZXh0ID0gY29udGV4dFxuXHRub2RlICAgICA9IHJlbmRlcmVyKGNvbnRleHQpXG5cdF9jb250ZXh0ID0gdW5kZWZpbmVkXG5cdG5vZGVcblxubW9kdWxlLmV4cG9ydHMgPSB0dXNrLmRlZmF1bHQgPSB0dXNrXG4iLCJtb2R1bGUuZXhwb3J0cyA9XG5cdCMjI1xuXHQjIEBwcml2YXRlXG5cdCMgQGRlc2NyaXB0aW9uXG5cdCMgRXNjYXBlIHNwZWNpYWwgY2hhcmFjdGVycyBpbiB0aGUgZ2l2ZW4gc3RyaW5nIG9mIGh0bWwuXG5cdCNcblx0IyBAcGFyYW0ge1N0cmluZ30gaHRtbCAtIHRoZSBodG1sIHRvIGVzY2FwZS5cblx0IyBAcmV0dXJucyB7U3RyaW5nfVxuXHQjIyNcblx0ZXNjYXBlSFRNTDogKGh0bWwpLT5cblx0XHRTdHJpbmcoaHRtbClcblx0XHRcdC5yZXBsYWNlKC8mL2csIFwiJmFtcDtcIilcblx0XHRcdC5yZXBsYWNlKC9cIi9nLCBcIiZxdW90O1wiKVxuXHRcdFx0LnJlcGxhY2UoLycvZywgXCImIzM5O1wiKVxuXHRcdFx0LnJlcGxhY2UoLzwvZywgXCImbHQ7XCIpXG5cdFx0XHQucmVwbGFjZSgvPi9nLCBcIiZndDtcIilcblxuXHQjIyNcblx0IyBAcHJpdmF0ZVxuXHQjIEBkZXNjcmlwdGlvblxuXHQjIFV0aWxpdHkgdGhhdCByZWN1cnNpdmVseSBmbGF0dGVucyBhbiBhcnJheS5cblx0I1xuXHQjIEBwYXJhbSB7QXJyYXl9IGFyciAtIFRoZSBhcnJheSB0byBmbGF0dGVuLlxuXHQjIEBwYXJhbSB7QXJyYXl9IGFjYyAtIFRoZSByZXN1bHRpbmcgYXJyYXkuXG5cdCMgQHJldHVybnMge0FycmF5fVxuXHQjIyNcblx0ZmxhdHRlbjogZmxhdHRlbiA9IChhcnIsIGFjYyA9IFtdKS0+XG5cdFx0Zm9yIGl0ZW0gaW4gYXJyXG5cdFx0XHRpZiBpdGVtPy5jb25zdHJ1Y3RvciBpcyBBcnJheSB0aGVuIGZsYXR0ZW4oaXRlbSwgYWNjKVxuXHRcdFx0ZWxzZSBhY2MucHVzaChpdGVtKVxuXHRcdGFjY1xuXG5cdCMjI1xuXHQjIEBwcml2YXRlXG5cdCMgQGRlc2NyaXB0aW9uXG5cdCMgUmV0dXJucyBhIGNodW5rIHN1cnJvdW5kaW5nIHRoZSBkaWZmZXJlbmNlIGJldHdlZW4gdHdvIHN0cmluZ3MsIHVzZWZ1bCBmb3IgZGVidWdnaW5nLlxuXHQjXG5cdCMgQHBhcmFtIHtTdHJpbmd9IGFcblx0IyBAcGFyYW0ge1N0cmluZ30gYlxuXHQjIEByZXR1cm5zIHtBcnJheTxTdHJpbmc+fVxuXHQjIyNcblx0Z2V0RGlmZjogKGEsIGIpLT5cblx0XHRicmVhayBmb3IgY2hhciwgaSBpbiBhIHdoZW4gY2hhciBpc250IGJbaV1cblx0XHRzdGFydCA9IE1hdGgubWF4KDAsIGkgLSAyMClcblx0XHRlbmQgICA9IHN0YXJ0ICsgODBcblx0XHRbYVtzdGFydC4uLk1hdGgubWluKGVuZCwgYS5sZW5ndGgpXSwgYltzdGFydC4uLk1hdGgubWluKGVuZCwgYi5sZW5ndGgpXV1cblxuXHQjIyNcblx0IyBAcHJpdmF0ZVxuXHQjIEBkZXNjcmlwdGlvblxuXHQjIFV0aWxpdHkgdGhhdCB3aWxsIHVwZGF0ZSBvciBzZXQgYSBnaXZlbiB2aXJ0dWFsIG5vZGVzIGF0dHJpYnV0ZXMuXG5cdCNcblx0IyBAcGFyYW0ge0hUTUxFbnRpdHl9IGVsZW0gLSBUaGUgZW50aXR5IHRvIHVwZGF0ZS5cblx0IyBAcGFyYW0ge09iamVjdH0gcHJldiAtIFRoZSBwcmV2aW91cyBhdHRyaWJ1dGVzLlxuXHQjIEBwYXJhbSB7T2JqZWN0fSBuZXh0IC0gVGhlIHVwZGF0ZWQgYXR0cmlidXRlcy5cblx0IyMjXG5cdHNldEF0dHJzOiAoZWxlbSwgcHJldiwgbmV4dCktPlxuXHRcdHJldHVybiBpZiBwcmV2IGlzIG5leHRcblxuXHRcdCMgQXBwZW5kIG5ldyBhdHRycy5cblx0XHRmb3Iga2V5LCB2YWwgb2YgbmV4dCB3aGVuIHZhbCBpc250IHByZXZba2V5XVxuXHRcdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoa2V5LCB2YWwpXG5cblx0XHQjIFJlbW92ZSBvbGQgYXR0cnMuXG5cdFx0Zm9yIGtleSBvZiBwcmV2IHdoZW4ga2V5IG5vdCBvZiBuZXh0XG5cdFx0XHRlbGVtLnJlbW92ZUF0dHJpYnV0ZShrZXkpXG5cblx0XHRyZXR1cm5cblxuXHQjIyNcblx0IyBAcHJpdmF0ZVxuXHQjIEBkZXNjcmlwdGlvblxuXHQjIFV0aWxpdHkgdGhhdCB3aWxsIHVwZGF0ZSBvciBzZXQgYSBnaXZlbiB2aXJ0dWFsIG5vZGVzIGNoaWxkcmVuLlxuXHQjXG5cdCMgQHBhcmFtIHtIVE1MRW50aXR5fSBlbGVtIC0gVGhlIGVudGl0eSB0byB1cGRhdGUuXG5cdCMgQHBhcmFtIHtPYmplY3R9IHByZXYgLSBUaGUgcHJldmlvdXMgY2hpbGRyZW4uXG5cdCMgQHBhcmFtIHtPYmplY3R9IG5leHQgLSBUaGUgdXBkYXRlZCBjaGlsZHJlbi5cblx0IyMjXG5cdHNldENoaWxkcmVuOiAoZWxlbSwgcHJldiwgbmV4dCktPlxuXHRcdHJldHVybiBpZiBwcmV2IGlzIG5leHRcblxuXHRcdCMgVXBkYXRlIG5ldyBvciBleGlzdGluZyBub2Rlcy5cblx0XHRmb3Iga2V5LCBjaGlsZCBvZiBuZXh0XG5cdFx0XHQjIEF0dGVtcHQgdG8gdXBkYXRlIGFuIGV4aXN0aW5nIG5vZGUuXG5cdFx0XHRpZiBrZXkgb2YgcHJldlxuXHRcdFx0XHQocHJldkNoaWxkID0gcHJldltrZXldKS51cGRhdGUoY2hpbGQpXG5cdFx0XHRcdCMgU2tpcCByZS1pbnNlcnQgaWYgY2hpbGQgaGFzbid0IG1vdmVkLlxuXHRcdFx0XHRjb250aW51ZSBpZiBwcmV2Q2hpbGQuaW5kZXggaXMgY2hpbGQuaW5kZXhcblx0XHRcdCMgQ3JlYXRlIHRoZSBub2RlIGlmIGl0IGlzIG5ldy5cblx0XHRcdGVsc2UgY2hpbGQuY3JlYXRlKClcblx0XHRcdCMgSW5zZXJ0IG9yIG1vdmUgdGhlIG5vZGUuXG5cdFx0XHRlbGVtLmluc2VydEJlZm9yZShjaGlsZC5fZWxlbSwgZWxlbS5jaGlsZE5vZGVzW2NoaWxkLmluZGV4XSlcblxuXHRcdCMgUmVtb3ZlIG9sZCBub2Rlc1xuXHRcdGZvciBrZXksIGNoaWxkIG9mIHByZXYgd2hlbiBrZXkgbm90IG9mIG5leHRcblx0XHRcdGNoaWxkLnJlbW92ZSgpXG5cblx0XHRyZXR1cm5cbiIsInsgU0VMRl9DTE9TSU5HLCBOT0RFLCBOQU1FU1BBQ0VTIH0gICAgPSByZXF1aXJlKFwiLi4vY29uc3RhbnRzXCIpXG57IGVzY2FwZUhUTUwsIHNldEF0dHJzLCBzZXRDaGlsZHJlbiB9ID0gcmVxdWlyZShcIi4uL3V0aWxcIilcbnsgZGlzcGF0Y2ggfSAgICAgICAgICAgICAgICAgICAgICAgICAgPSByZXF1aXJlKFwiLi4vZGVsZWdhdG9yXCIpXG5UZXh0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgID0gcmVxdWlyZShcIi4vdGV4dFwiKVxuXG4jIyNcbiMgQHByaXZhdGVcbiMgQGRlc2NyaXB0aW9uXG4jIFV0aWxpdHkgdG8gcmVjdXJzaXZlbHkgZmxhdHRlbiBhIG5lc3RlZCBhcnJheSBpbnRvIGEga2V5ZWQgbm9kZSBsaXN0IGFuZCBjYXN0IG5vbi1ub2RlcyB0byBUZXh0LlxuI1xuIyBAcGFyYW0ge05vZGV9IG5vZGVcbiMgQHBhcmFtIHsoQXJyYXl8Tm9kZSl9IGN1clxuIyBAcGFyYW0ge051bWJlcn0gYWNjXG4jIEByZXR1cm5zIHtPYmplY3R9XG4jIyNcbm5vcm1hbGl6ZUNoaWxkcmVuID0gKG5vZGUsIGN1ciA9IFwiIFwiLCBhY2MgPSAwKS0+XG5cdGlmIGN1ci5jb25zdHJ1Y3RvciBpcyBBcnJheVxuXHRcdG5vcm1hbGl6ZUNoaWxkcmVuKG5vZGUsIGNoaWxkLCBhY2MgKyBpKSBmb3IgY2hpbGQsIGkgaW4gY3VyXG5cdGVsc2Vcblx0XHQjIENhc3Qgbm9uLW5vZGVzIHRvIHRleHQuXG5cdFx0Y3VyID0gbmV3IFRleHQoY3VyKSB1bmxlc3MgY3VyLmlzVHVza1xuXHRcdCMgSW5oZXJpdCBwYXJlbnRzIG5hbWVzcGFjZS5cblx0XHRjdXIubmFtZXNwYWNlVVJJID89IG5vZGUubmFtZXNwYWNlVVJJXG5cdFx0IyBTZXQgY2hpbGQgcG9zaXRpb24gaW4gbm9kZSBsaXN0LlxuXHRcdGN1ci5pbmRleCA9IGFjY1xuXHRcdCMgQ2hpbGRyZW4gYXJlIGluZGV4ZWQgYnkgdGhlcmUgcG9zaXRpb24sIG9yIHRoZSBwcm92aWRlZCBrZXkuXG5cdFx0bm9kZS5jaGlsZHJlbltjdXIua2V5IG9yIGFjY10gPSBjdXJcblx0cmV0dXJuXG5cbiMjI1xuIyBAcHJpdmF0ZVxuIyBAY2xhc3MgTm9kZVxuIyBAZGVzY3JpcHRpb25cbiMgQ3JlYXRlcyBhIHZpcnR1YWwgZG9tIG5vZGUgdGhhdCBjYW4gYmUgbGF0ZXIgdHJhbnNmb3JtZWQgaW50byBhIHJlYWwgbm9kZSBhbmQgdXBkYXRlZC5cbiNcbiMgQHBhcmFtIHtTdHJpbmd9IHR5cGUgLSBUaGUgdGFnbmFtZSBvZiB0aGUgZWxlbWVudC5cbiMgQHBhcmFtIHtPYmplY3R9IG93bmVyIC0gSW5mb3JtYXRpb24gYWJvdXQgdGhlIHJlbmRlcmVyIG9mIHRoaXMgbm9kZS5cbiMgQHBhcmFtIHtPYmplY3R9IHByb3BzIC0gQW4gb2JqZWN0IGNvbnRhaW5pbmcgZXZlbnRzIGFuZCBhdHRyaWJ1dGVzLlxuIyBAcGFyYW0ge0FycmF5fSBjaGlsZHJlbiAtIFRoZSBjaGlsZCBub2RlTGlzdCBmb3IgdGhlIGVsZW1lbnQuXG4jIyNcbk5vZGUgPSAoQHR5cGUsIEBvd25lciwgcHJvcHMsIGNoaWxkcmVuKS0+XG5cdCMgU2V0IGltcGxpY2l0IG5hbWVzcGFjZSBmb3IgZWxlbWVudC5cblx0QG5hbWVzcGFjZVVSSSA9IChcblx0XHRpZiBAdHlwZSBpcyBcInN2Z1wiIHRoZW4gTkFNRVNQQUNFUy5TVkdcblx0XHRlbHNlIGlmIEB0eXBlIGlzIFwibWF0aFwiIHRoZW4gTkFNRVNQQUNFUy5NQVRIX01MXG5cdClcblxuXHQjIFNldCBkZWZhdWx0IHZhbHVlcy5cblx0QGF0dHJzICAgID0ge31cblx0QGV2ZW50cyAgID0ge31cblx0QGNoaWxkcmVuID0ge31cblxuXHQjIENoZWNrIGlmIHdlIHNob3VsZCBhZGQgYXR0cnMvZXZlbnRzLlxuXHRpZiBwcm9wcz9cblx0XHQjIFB1bGwgb3V0IHNwZWNpYWwgcHJvcHMuXG5cdFx0QGtleSAgICAgICA9IHByb3BzLmtleTsgZGVsZXRlIHByb3BzLmtleVxuXHRcdEBpZ25vcmUgICAgPSBcImlnbm9yZVwiIG9mIHByb3BzIGFuZCBwcm9wcy5pZ25vcmUgaXNudCBmYWxzZTsgZGVsZXRlIHByb3BzLmlnbm9yZVxuXHRcdEBpbm5lckhUTUwgPSBwcm9wcy5pbm5lckhUTUw7IGRlbGV0ZSBwcm9wcy5pbm5lckhUTUxcblxuXHRcdCMgU2VwYXJhdGUgYXR0cnMgZnJvbSBldmVudHMuXG5cdFx0Zm9yIGtleSwgdmFsIG9mIHByb3BzXG5cdFx0XHRpZiBrZXlbMC4uLjJdIGlzIFwib25cIlxuXHRcdFx0XHRAZXZlbnRzW2tleVsyLi5dLnRvTG93ZXJDYXNlKCldID0gdmFsXG5cdFx0XHRlbHNlIGlmIHZhbD8gYW5kIHZhbCBpc250IGZhbHNlXG5cdFx0XHRcdEBhdHRyc1trZXldID0gdmFsXG5cblx0IyBDaGVjayBpZiB3ZSBzaG91bGQgYXBwZW5kIGNoaWxkcmVuLlxuXHR1bmxlc3MgQGlubmVySFRNTD8gb3IgQHR5cGUgaW4gU0VMRl9DTE9TSU5HXG5cdFx0bm9ybWFsaXplQ2hpbGRyZW4oQCwgY2hpbGRyZW4pXG5cblx0cmV0dXJuXG4jIyNcbiMgQHByaXZhdGVcbiMgQGNvbnN0YW50XG4jIEBkZXNjcmlwdGlvblxuIyBNYXJrIGluc3RhbmNlcyBhcyBhIHR1c2sgbm9kZXMuXG4jIyNcbk5vZGU6OmlzVHVzayA9IHRydWVcblxuIyMjXG4jIEBwcml2YXRlXG4jIEBkZXNjcmlwdGlvblxuIyBCb290c3RyYXBzIGV2ZW50IGxpc3RlbmVycyBhbmQgY2hpbGRyZW4gZnJvbSBhIHZpcnR1YWwgbm9kZS5cbiNcbiMgQHBhcmFtIHtIVE1MRW50aXR5fSBlbGVtXG4jIyNcbk5vZGU6Om1vdW50ID0gKGVsZW0pLT5cblx0QF9lbGVtID0geyBjaGlsZE5vZGVzIH0gPSBlbGVtXG5cdGVsZW1bTk9ERV0gPSBAXG5cdCMgQm9vc3RyYXAgY2hpbGRyZW4uXG5cdGNoaWxkLm1vdW50KGNoaWxkTm9kZXNbY2hpbGQuaW5kZXggb3Iga2V5XSkgZm9yIGtleSwgY2hpbGQgb2YgQGNoaWxkcmVuIHVubGVzcyBAaW5uZXJIVE1MP1xuXHRkaXNwYXRjaChcIm1vdW50XCIsIGVsZW0pXG5cdHJldHVyblxuXG4jIyNcbiMgQHByaXZhdGVcbiMgQGRlc2NyaXB0aW9uXG4jIFRyaWdnZXJzIGRpc21vdW50IG9uIHRoaXMgbm9kZSBhbmQgYWxsIG9mIGl0cyBjaGlsZHJlbi5cbiMjI1xuTm9kZTo6ZGlzbW91bnQgPSAtPlxuXHRkaXNwYXRjaChcImRpc21vdW50XCIsIEBfZWxlbSlcblx0Y2hpbGQuZGlzbW91bnQ/KCkgZm9yIGtleSwgY2hpbGQgb2YgQGNoaWxkcmVuXG5cdHJldHVyblxuXG4jIyNcbiMgQHByaXZhdGVcbiMgQGRlc2NyaXB0aW9uXG4jIENyZWF0ZXMgYSByZWFsIG5vZGUgb3V0IG9mIHRoZSB2aXJ0dWFsIG5vZGUgYW5kIHJldHVybnMgaXQuXG4jXG4jIEByZXR1cm5zIHtIVE1MRW50aXR5fVxuIyMjXG5Ob2RlOjpjcmVhdGUgPSAtPlxuXHQjIENyZWF0ZSBhIHJlYWwgZG9tIGVsZW1lbnQgb3IgcmV1c2UgZXhpc3RpbmcuXG5cdGVsZW0gICAgICAgPSBAX2VsZW0gPz0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKEBuYW1lc3BhY2VVUkkgb3IgTkFNRVNQQUNFUy5IVE1MLCBAdHlwZSlcblx0cHJldiAgICAgICA9IGVsZW1bTk9ERV1cblx0ZWxlbVtOT0RFXSA9IEBcblxuXHQjIFRoaXMgZWxlbWVudCBjb3VsZCBoYXZlIGJlIHJldXNlZCBhdCBzb21lcG9pbnQgc28gd2UgbWFrZSBzdXJlXG5cdCMgdGhhdCB3ZSBjaGVjayBpdHMgY2hpbGRyZW4vYXR0cnMuXG5cdGlmIHByZXYgdGhlbiB7IGF0dHJzLCBjaGlsZHJlbiB9ID0gcHJldlxuXHRlbHNlIGF0dHJzID0gY2hpbGRyZW4gPSB7fVxuXG5cdHNldEF0dHJzKGVsZW0sIGF0dHJzLCBAYXR0cnMpXG5cdGlmIEBpbm5lckhUTUw/IHRoZW4gZWxlbS5pbm5lckhUTUwgPSBAaW5uZXJIVE1MXG5cdGVsc2Ugc2V0Q2hpbGRyZW4oZWxlbSwgY2hpbGRyZW4sIEBjaGlsZHJlbilcblx0ZGlzcGF0Y2goXCJtb3VudFwiLCBlbGVtKVxuXHRlbGVtXG5cbiMjI1xuIyBAcHJpdmF0ZVxuIyBAZGVzY3JpcHRpb25cbiMgR2l2ZW4gYSBkaWZmZXJlbnQgdmlydHVhbCBub2RlIGl0IHdpbGwgY29tcGFyZSB0aGUgbm9kZXMgYW4gdXBkYXRlIHRoZSByZWFsIG5vZGUgYWNjb3JkaW5nbHkuXG4jXG4jIEBwYXJhbSB7Tm9kZX0gdXBkYXRlZFxuIyBAcmV0dXJucyB7Tm9kZX1cbiMjI1xuTm9kZTo6dXBkYXRlID0gKHVwZGF0ZWQpLT5cblx0IyBJZiB3ZSBnb3QgdGhlIHNhbWUgdmlydHVhbCBub2RlIHRoZW4gd2UgdHJlYXQgaXQgYXMgYSBubyBvcC5cblx0IyBUaGlzIGFsbG93cyBmb3IgcmVuZGVyIG1lbW9pemF0aW9uLlxuXHRyZXR1cm4gdGhpcyBpZiB0aGlzIGlzIHVwZGF0ZWRcblxuXHQjIFN1cHBvcnQgaWdub3JlZCBub2Rlcy5cblx0IyBuZXZlciB1cGRhdGUgdGhlIG5vZGUgdW5sZXNzIHRoZSBpZ25vcmVkIGF0dHJpYnV0ZSBpcyByZW1vdmVkXG5cdHJldHVybiB0aGlzIGlmIHRoaXMuaWdub3JlIGFuZCB1cGRhdGVkLmlnbm9yZVxuXG5cdGlmIEB0eXBlIGlzbnQgdXBkYXRlZC50eXBlXG5cdFx0IyBVcGRhdGUgdHlwZSByZXF1aXJlcyBhIHJlLXJlbmRlci5cblx0XHRAX2VsZW0ucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUodXBkYXRlZC5jcmVhdGUoKSwgQF9lbGVtKVxuXHRcdEByZW1vdmUoKVxuXHRlbHNlXG5cdFx0bmV3T3duZXIgPSBAb3duZXIgaXNudCB1cGRhdGVkLm93bmVyXG5cdFx0ZGlzcGF0Y2goXCJkaXNtb3VudFwiLCBAX2VsZW0pIGlmIG5ld093bmVyXG5cblx0XHQjIEdpdmUgdXBkYXRlZCB0aGUgZG9tLlxuXHRcdEBfZWxlbVtOT0RFXSAgPSB1cGRhdGVkXG5cdFx0dXBkYXRlZC5fZWxlbSA9IEBfZWxlbVxuXHRcdHNldEF0dHJzKEBfZWxlbSwgQGF0dHJzLCB1cGRhdGVkLmF0dHJzKVxuXHRcdGlmIHVwZGF0ZWQuaW5uZXJIVE1MP1xuXHRcdFx0aWYgQGlubmVySFRNTCBpc250IHVwZGF0ZWQuaW5uZXJIVE1MXG5cdFx0XHRcdCMgRGlyZWN0IGlubmVySFRNTCB1cGRhdGUuXG5cdFx0XHRcdEBfZWxlbS5pbm5lckhUTUwgPSB1cGRhdGVkLmlubmVySFRNTFxuXHRcdGVsc2Vcblx0XHRcdCMgSWYgd2UgYXJlIGdvaW5nIGZyb20gaW5uZXJIVE1MIHRvIG5vZGVzIHRoZW4gd2UgbXVzdCBjbGVhbiB1cC5cblx0XHRcdEBfZWxlbS5yZW1vdmVDaGlsZChAX2VsZW0uZmlyc3RDaGlsZCkgd2hpbGUgQF9lbGVtLmZpcnN0Q2hpbGQgaWYgQGlubmVySFRNTD9cblx0XHRcdHNldENoaWxkcmVuKEBfZWxlbSwgQGNoaWxkcmVuLCB1cGRhdGVkLmNoaWxkcmVuKVxuXG5cdFx0ZGlzcGF0Y2goXCJtb3VudFwiLCBAX2VsZW0pIGlmIG5ld093bmVyXG5cblx0dXBkYXRlZFxuXG4jIyNcbiMgQHByaXZhdGVcbiMgQGRlc2NyaXB0aW9uXG4jIFJlbW92ZXMgdGhlIGN1cnJlbnQgbm9kZSBmcm9tIGl0J3MgcGFyZW50LlxuIyMjXG5Ob2RlOjpyZW1vdmUgPSAtPlxuXHRAZGlzbW91bnQoKVxuXHRAX2VsZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChAX2VsZW0pXG5cbiMjI1xuIyBAZGVzY3JpcHRpb25cbiMgR2VuZXJhdGUgdmFsaWQgaHRtbCBmb3IgdGhlIHZpcnR1YWwgbm9kZS5cbiNcbiMgQHJldHVybnMge1N0cmluZ31cbiMjI1xuTm9kZTo6dG9TdHJpbmcgPSAtPlxuXHRhdHRycyA9IGNoaWxkcmVuID0gXCJcIlxuXHRhdHRycyArPSBcIiAje2tleX09XFxcIiN7ZXNjYXBlSFRNTCh2YWwpfVxcXCJcIiBmb3Iga2V5LCB2YWwgb2YgQGF0dHJzXG5cblx0IyBVc2UgaW5uZXJIVE1MIG9yIGNoaWxkcmVuLlxuXHRpZiBAaW5uZXJIVE1MPyB0aGVuIGNoaWxkcmVuID0gQGlubmVySFRNTFxuXHRlbHNlIGNoaWxkcmVuICs9IGNoaWxkIGZvciBrZXksIGNoaWxkIG9mIEBjaGlsZHJlblxuXG5cdCMgQ2hlY2sgZm9yIHNlbGYgY2xvc2luZyBub2Rlcy5cblx0aWYgQHR5cGUgaW4gU0VMRl9DTE9TSU5HIHRoZW4gXCI8I3tAdHlwZSArIGF0dHJzfT5cIlxuXHRlbHNlIFwiPCN7QHR5cGUgKyBhdHRyc30+I3tjaGlsZHJlbn08LyN7QHR5cGV9PlwiXG5cbm1vZHVsZS5leHBvcnRzID0gTm9kZVxuIiwieyBlc2NhcGVIVE1MIH0gPSByZXF1aXJlKFwiLi4vdXRpbFwiKVxuXG4jIyNcbiMgQHByaXZhdGVcbiMgQGNsYXNzIFRleHRcbiMgQGRlc2NyaXB0aW9uXG4jIENyZWF0ZXMgYSB2aXJ0dWFsIHRleHQgbm9kZSB0aGF0IGNhbiBiZSBsYXRlciB0cmFuc2Zvcm1lZCBpbnRvIGEgcmVhbCBub2RlIGFuZCB1cGRhdGVkLlxuI1xuIyBAcGFyYW0ge1N0cmluZ30gdmFsdWUgLSB0aGUgbm9kZVZhbHVlIGZvciB0aGUgdGV4dCBub2RlLlxuIyMjXG5UZXh0ID0gKHZhbHVlKS0+XG5cdEB2YWx1ZSA9IFN0cmluZyh2YWx1ZSlcblx0cmV0dXJuXG5cbiMjI1xuIyBAcHJpdmF0ZVxuIyBAY29uc3RhbnRcbiMgQGRlc2NyaXB0aW9uXG4jIE1hcmsgaW5zdGFuY2VzIGFzIGEgdHVzayBub2Rlcy5cbiNcbiMjI1xuVGV4dDo6aXNUdXNrID0gdHJ1ZVxuXG4jIyNcbiMgQHByaXZhdGVcbiMgQGRlc2NyaXB0aW9uXG4jIEVuc3VyZXMgdGhhdCB0aGUgcHJvdmlkZWQgZWxlbWVudCdzIG5vZGUgdmFsdWUgbWF0Y2hlcyB0aGUgdmlydHVhbCB2YWx1ZS5cbiNcbiMgQHBhcmFtIHtIVE1MRW50aXR5fSBlbGVtXG4jIyNcblRleHQ6Om1vdW50ID0gKGVsZW0pLT5cblx0QF9lbGVtID0geyBub2RlVmFsdWUgfSA9IGVsZW1cblx0IyBVc2UgVGV4dC5zcGxpdFRleHQoaW5kZXgpIHRvIHNwbGl0IHVwIHRleHQtbm9kZXMgZnJvbSBzZXJ2ZXIuXG5cdGVsZW0uc3BsaXRUZXh0KG5vZGVWYWx1ZS5pbmRleE9mKEB2YWx1ZSkgKyBAdmFsdWUubGVuZ3RoKSBpZiBAdmFsdWUgaXNudCBub2RlVmFsdWVcblx0cmV0dXJuXG5cbiMjI1xuIyBAcHJpdmF0ZVxuIyBAZGVzY3JpcHRpb25cbiMgQ3JlYXRlcyBhIHJlYWwgdGV4dCBub2RlIG91dCBvZiB0aGUgdmlydHVhbCB0ZXh0IG5vZGUgYW5kIHJldHVybnMgaXQuXG4jXG4jIEByZXR1cm5zIHtIVE1MRW50aXR5fVxuIyMjXG5UZXh0OjpjcmVhdGUgPSAtPlxuXHQjIFJldXNlIHByZXZpb3VzbHkgcmVuZGVyZWQgbm9kZXMuXG5cdEBfZWxlbSAgICAgICAgICA/PSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShAdmFsdWUpXG5cdEBfZWxlbS5ub2RlVmFsdWUgPSBAdmFsdWUgdW5sZXNzIEBfZWxlbS5ub2RlVmFsdWUgaXMgQHZhbHVlXG5cdEBfZWxlbVxuXG4jIyNcbiMgQHByaXZhdGVcbiMgQGRlc2NyaXB0aW9uXG4jIEdpdmVuIGEgZGlmZmVyZW50IHZpcnR1YWwgbm9kZSBpdCB3aWxsIGNvbXBhcmUgdGhlIG5vZGVzIGFuIHVwZGF0ZSB0aGUgcmVhbCBub2RlIGFjY29yZGluZ2x5LlxuI1xuIyBAcGFyYW0geyhOb2RlfFRleHQpfSB1cGRhdGVkXG4jIEByZXR1cm5zIHsoTm9kZXxUZXh0KX1cbiMjI1xuVGV4dDo6dXBkYXRlID0gKHVwZGF0ZWQpLT5cblx0IyBJZiB3ZSBnb3QgdGhlIHNhbWUgdmlydHVhbCBub2RlIHRoZW4gd2UgdHJlYXQgaXQgYXMgYSBubyBvcC5cblx0IyBUaGlzIGFsbG93cyBmb3IgcmVuZGVyIG1lbW9pemF0aW9uLlxuXHRyZXR1cm4gdGhpcyBpZiB0aGlzIGlzIHVwZGF0ZWRcblxuXHRpZiB1cGRhdGVkLmNvbnN0cnVjdG9yIGlzIFRleHRcblx0XHR1cGRhdGVkLl9lbGVtID0gQF9lbGVtXG5cdFx0IyBJZiB3ZSBnb3QgYSBkaWZmZXJlbnQgdGV4dG5vZGUgdGhlbiB3ZSBkbyBhIHZhbHVlIHVwZGF0ZS5cblx0XHRAX2VsZW0ubm9kZVZhbHVlID0gdXBkYXRlZC52YWx1ZSBpZiBAdmFsdWUgaXNudCB1cGRhdGVkLnZhbHVlXG5cblx0ZWxzZSBAX2VsZW0ucGFyZW50Tm9kZS5yZXBsYWNlQ2hpbGQodXBkYXRlZC5jcmVhdGUoKSwgQF9lbGVtKVxuXG5cdHVwZGF0ZWRcblxuIyMjXG4jIEBwcml2YXRlXG4jIEBkZXNjcmlwdGlvblxuIyBSZW1vdmVzIHRoZSBjdXJyZW50IHRleHQgbm9kZSBmcm9tIGl0J3MgcGFyZW50LlxuIyMjXG5UZXh0OjpyZW1vdmUgPSAtPlxuXHRAX2VsZW0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChAX2VsZW0pXG5cbiMjI1xuIyBAZGVzY3JpcHRpb25cbiMgR2VuZXJhdGUgYSB2YWxpZCBlc2NhcGVkIGh0bWwgc3RyaW5nIGZvciB0aGUgdmlydHVhbCB0ZXh0IG5vZGUuXG4jXG4jIEByZXR1cm5zIHtTdHJpbmd9XG4jIyNcblRleHQ6OnRvU3RyaW5nID0gLT5cblx0ZXNjYXBlSFRNTChAdmFsdWUpXG5cbm1vZHVsZS5leHBvcnRzID0gVGV4dFxuIiwiYC8qKiBAanN4IHR1c2sgKi9gXG5hc3NlcnQgICAgPSByZXF1aXJlKFwiYXNzZXJ0XCIpXG5pbW1zdHJ1Y3QgPSByZXF1aXJlKFwiaW1tc3RydWN0XCIpXG5kZXRhaWxzICAgPSByZXF1aXJlKFwiLi4vcGFja2FnZS5qc29uXCIpXG50dXNrICAgICAgPSByZXF1aXJlKFwiLi4vc3JjL2luZGV4XCIpXG5kZWxlZ2F0ZSAgPSByZXF1aXJlKFwiLi4vc3JjL2RlbGVnYXRvclwiKVxuXG5kZXNjcmliZSBcIiN7ZGV0YWlscy5uYW1lfUAje2RldGFpbHMudmVyc2lvbn0gLSBGdW5jdGlvblwiLCAtPlxuXHRyZXF1aXJlKFwibW9jaGEtanNkb21cIikoKSBpZiB0eXBlb2YgZG9jdW1lbnQgaXMgXCJ1bmRlZmluZWRcIlxuXG5cdCMgUmUgSW5pdGlhbGl6ZSBldmVudHMgYmVmb3JlIGVhY2ggdGVzdCAobW9jaGEtanNkb20gcmVzZXRzIHRoZW0pLlxuXHRiZWZvcmVFYWNoIC0+IGRlbGVnYXRlLmluaXQoKVxuXG5cdGRlc2NyaWJlIFwiVmlydHVhbCBjb21wb25lbnRcIiwgLT5cblx0XHRpdCBcInNob3VsZCBiZSBhYmxlIHRvIGNyZWF0ZVwiLCAtPlxuXHRcdFx0Q2hpbGRDb21wb25lbnQgPSAocHJvcHMsIGNoaWxkcmVuKS0+XG5cdFx0XHRcdHR1c2suY3JlYXRlRWxlbWVudChcImgxXCIsIG51bGwsICggZm9yIGNoaWxkLCBpIGluIGNoaWxkcmVuXG5cdFx0XHRcdFx0Y2hpbGQuYXR0cnMuY2xhc3MgPSBcImNoaWxkLSN7aX1cIlxuXHRcdFx0XHRcdGNoaWxkXG5cdFx0XHRcdCkpXG5cblx0XHRcdE15Q29tcG9uZW50ID0gKHsgdmFsdWUgfSwgY2hpbGRyZW4pLT5cblx0XHRcdFx0dHVzay5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsXG5cdFx0XHRcdFx0dHVzay5jcmVhdGVFbGVtZW50KENoaWxkQ29tcG9uZW50LCB7XCJ2YWx1ZVwiOiAoIHZhbHVlICogMil9LCAoZm9yIGkgaW4gWzAuLnZhbHVlXVxuXHRcdFx0XHRcdFx0dHVzay5jcmVhdGVFbGVtZW50KFwic3BhblwiLCBudWxsLCAoIGkgKSlcblx0XHRcdFx0XHQpKVxuXHRcdFx0XHQpXG5cblx0XHRcdGFzc2VydC5lcXVhbCh0dXNrLmNyZWF0ZUVsZW1lbnQoTXlDb21wb25lbnQsIHtcInZhbHVlXCI6ICggNSApfSksIFwiXCJcIlxuXHRcdFx0XHQ8ZGl2PlxuXHRcdFx0XHRcdDxoMT5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzPVwiY2hpbGQtMFwiPjA8L3NwYW4+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzcz1cImNoaWxkLTFcIj4xPC9zcGFuPlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3M9XCJjaGlsZC0yXCI+Mjwvc3Bhbj5cblx0XHRcdFx0XHRcdDxzcGFuIGNsYXNzPVwiY2hpbGQtM1wiPjM8L3NwYW4+XG5cdFx0XHRcdFx0XHQ8c3BhbiBjbGFzcz1cImNoaWxkLTRcIj40PC9zcGFuPlxuXHRcdFx0XHRcdFx0PHNwYW4gY2xhc3M9XCJjaGlsZC01XCI+NTwvc3Bhbj5cblx0XHRcdFx0XHQ8L2gxPlxuXHRcdFx0XHQ8L2Rpdj5cblx0XHRcdFwiXCJcIi5yZXBsYWNlKC9cXHR8XFxuL2csIFwiXCIpKVxuXG5cdFx0aXQgXCJzaG91bGQgYmUgYWJsZSB0byBzZXQgYSBjb250ZXh0XCIsIC0+XG5cdFx0XHRNeUNvbXBvbmVudCA9IChwcm9wcywgY2hpbGRyZW4sIGNvbnRleHQpLT5cblx0XHRcdFx0dHVzay5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsICggY29udGV4dCApKVxuXG5cdFx0XHRhc3NlcnQuZXF1YWwodHVzay53aXRoKDEsIC0+IHR1c2suY3JlYXRlRWxlbWVudChNeUNvbXBvbmVudCwgbnVsbCkpLCBcIjxkaXY+MTwvZGl2PlwiKVxuXG5cdGRlc2NyaWJlIFwiRG9jdW1lbnQgQ29tcG9uZW50XCIsIC0+XG5cdFx0aXQgXCJzaG91bGQgcmVuZGVyIHdpdGggaW1tdXRhYmxlIHN0YXRlXCIsIC0+XG5cdFx0XHRzdHJ1Y3QgPSBpbW1zdHJ1Y3QoeyBpOiAwIH0pXG5cblx0XHRcdE15Q291bnRlciA9ICh7IG1lc3NhZ2UsIGN1cnNvciB9LCBjaGlsZHJlbiktPlxuXHRcdFx0XHRoYW5kbGVDbGljayA9IC0+XG5cdFx0XHRcdFx0Y3Vyc29yLnVwZGF0ZSgoc3RhdGUpLT5cblx0XHRcdFx0XHRcdHN0YXRlLnNldChcImlcIiwgc3RhdGUuZ2V0KFwiaVwiKSArIDEpXG5cdFx0XHRcdFx0KVxuXG5cdFx0XHRcdHR1c2suY3JlYXRlRWxlbWVudChcImJ1dHRvblwiLCB7XCJvbkNsaWNrXCI6ICggaGFuZGxlQ2xpY2sgKX0sXG5cdFx0XHRcdFx0KCBtZXNzYWdlICksIFwiIDogXCIsICggY3Vyc29yLmdldCgnaScpIClcblx0XHRcdFx0KVxuXG5cdFx0XHRkb2N1bWVudC5ib2R5LmlubmVySFRNTCA9IHR1c2suY3JlYXRlRWxlbWVudChNeUNvdW50ZXIsIHtcIm1lc3NhZ2VcIjogXCJUaW1lcyBjbGlja2VkXCIsIFwiY3Vyc29yXCI6ICggc3RydWN0LmN1cnNvcigpICl9KVxuXG5cdFx0XHRyZW5kZXIgPSAtPlxuXHRcdFx0XHR0dXNrLnJlbmRlcihkb2N1bWVudC5ib2R5LmZpcnN0Q2hpbGQsXG5cdFx0XHRcdFx0dHVzay5jcmVhdGVFbGVtZW50KE15Q291bnRlciwge1wibWVzc2FnZVwiOiBcIlRpbWVzIGNsaWNrZWRcIiwgXCJjdXJzb3JcIjogKCBzdHJ1Y3QuY3Vyc29yKCkgKX0pXG5cdFx0XHRcdClcblxuXHRcdFx0cmVuZGVyKClcblx0XHRcdHN0cnVjdC5vbihcInN3YXBcIiwgcmVuZGVyKVxuXHRcdFx0ZG9jdW1lbnQuYm9keS5maXJzdENoaWxkLmNsaWNrKCkgZm9yIGkgaW4gWzAuLi41XVxuXG5cdFx0XHRhc3NlcnQuZXF1YWwoZG9jdW1lbnQuYm9keS5pbm5lckhUTUwsIFwiPGJ1dHRvbj5UaW1lcyBjbGlja2VkIDogNTwvYnV0dG9uPlwiKVxuXG5cdFx0aXQgXCJzaG91bGQgdHJpZ2dlciBtb3VudCBhbmQgZGlzbW91bnQgd2l0aCBvd25lciBjaGFuZ2VcIiwgKGRvbmUpLT5cblx0XHRcdENvbXBvbmVudEEgPSAtPlxuXHRcdFx0XHR0dXNrLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge1wib25EaXNtb3VudFwiOiAoIC0+IGRvbmUoKSApfSlcblxuXHRcdFx0Q29tcG9uZW50QiA9IC0+XG5cdFx0XHRcdHR1c2suY3JlYXRlRWxlbWVudChcImRpdlwiLCBudWxsKVxuXG5cdFx0XHRlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtKVxuXG5cdFx0XHR0dXNrLnJlbmRlcihlbGVtLCB0dXNrLmNyZWF0ZUVsZW1lbnQoQ29tcG9uZW50QSwgbnVsbCkpXG5cdFx0XHR0dXNrLnJlbmRlcihlbGVtLCB0dXNrLmNyZWF0ZUVsZW1lbnQoQ29tcG9uZW50QiwgbnVsbCkpXG4iLCJgLyoqIEBqc3ggdHVzayAqL2BcbmFzc2VydCAgICAgICAgID0gcmVxdWlyZShcImFzc2VydFwiKVxuZGV0YWlscyAgICAgICAgPSByZXF1aXJlKFwiLi4vcGFja2FnZS5qc29uXCIpXG50dXNrICAgICAgICAgICA9IHJlcXVpcmUoXCIuLi9zcmMvaW5kZXhcIilcbmRlbGVnYXRlICAgICAgID0gcmVxdWlyZShcIi4uL3NyYy9kZWxlZ2F0b3JcIilcbnsgTkFNRVNQQUNFUyB9ID0gcmVxdWlyZShcIi4uL3NyYy9jb25zdGFudHNcIilcblxuZGVzY3JpYmUgXCIje2RldGFpbHMubmFtZX1AI3tkZXRhaWxzLnZlcnNpb259IC0gTm9kZVwiLCAtPlxuXHRyZXF1aXJlKFwibW9jaGEtanNkb21cIikoKSBpZiB0eXBlb2YgZG9jdW1lbnQgaXMgXCJ1bmRlZmluZWRcIlxuXG5cdCMgUmUgSW5pdGlhbGl6ZSBldmVudHMgYmVmb3JlIGVhY2ggdGVzdCAobW9jaGEtanNkb20gcmVzZXRzIHRoZW0pLlxuXHRiZWZvcmVFYWNoIC0+IGRlbGVnYXRlLmluaXQoKVxuXG5cdGRlc2NyaWJlIFwiVmlydHVhbCBub2RlXCIsIC0+XG5cdFx0aXQgXCJzaG91bGQgYmUgYWJsZSB0byBjcmVhdGVcIiwgLT5cblx0XHRcdG5vZGUgPSB0dXNrLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgbnVsbClcblx0XHRcdGFzc2VydC5lcXVhbChub2RlLnR5cGUsIFwiZGl2XCIpXG5cblx0XHRpdCBcInNob3VsZCBiZSBhYmxlIHRvIHNldCBhdHRyaWJ1dGVzXCIsIC0+XG5cdFx0XHRub2RlID0gdHVzay5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtcInRlc3RcIjogKCB0cnVlICl9KVxuXHRcdFx0YXNzZXJ0LmVxdWFsKG5vZGUudHlwZSwgXCJkaXZcIilcblx0XHRcdGFzc2VydC5kZWVwRXF1YWwobm9kZS5hdHRycywgdGVzdDogdHJ1ZSlcblxuXHRcdGl0IFwic2hvdWxkIGFkZCBjaGlsZHJlblwiLCAtPlxuXHRcdFx0bm9kZSA9IHR1c2suY3JlYXRlRWxlbWVudChcImRpdlwiLCBudWxsLCAoIFsxLCAyLCAzXSApKVxuXG5cdFx0XHRhc3NlcnQuZXF1YWwobm9kZS50eXBlLCBcImRpdlwiKVxuXHRcdFx0YXNzZXJ0LmVxdWFsKE9iamVjdC5rZXlzKG5vZGUuY2hpbGRyZW4pLmxlbmd0aCwgMylcblxuXHRcdGl0IFwic2hvdWxkIHNldCBpbm5lckhUTUxcIiwgLT5cblx0XHRcdG5vZGUgPSB0dXNrLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge1wiaW5uZXJIVE1MXCI6IFwiPHNwYW4+PC9zcGFuPlwifSlcblxuXHRcdFx0YXNzZXJ0LmVxdWFsKG5vZGUudHlwZSwgXCJkaXZcIilcblx0XHRcdGFzc2VydC5lcXVhbChub2RlLmlubmVySFRNTCwgXCI8c3Bhbj48L3NwYW4+XCIpXG5cdFx0XHRhc3NlcnQuZXF1YWwoU3RyaW5nKG5vZGUpLCBcIjxkaXY+PHNwYW4+PC9zcGFuPjwvZGl2PlwiKVxuXG5cdFx0aXQgXCJzaG91bGQgaW5oZXJpdCBwYXJlbnRzIG5hbWVzcGFjZVwiLCAtPlxuXHRcdFx0bm9kZSA9IHR1c2suY3JlYXRlRWxlbWVudChcInN2Z1wiLCBudWxsLCB0dXNrLmNyZWF0ZUVsZW1lbnQoXCJjaXJjbGVcIiwgbnVsbCkpXG5cdFx0XHRhc3NlcnQuZXF1YWwobm9kZS5uYW1lc3BhY2VVUkksIE5BTUVTUEFDRVMuU1ZHKVxuXHRcdFx0YXNzZXJ0LmVxdWFsKG5vZGUuY2hpbGRyZW5bMF0ubmFtZXNwYWNlVVJJLCBOQU1FU1BBQ0VTLlNWRylcblxuXHRkZXNjcmliZSBcIkRvY3VtZW50IG5vZGVcIiwgLT5cblx0XHRpdCBcInNob3VsZCBiZSBhYmxlIHRvIGNyZWF0ZVwiLCAtPlxuXHRcdFx0bm9kZSA9IHR1c2suY3JlYXRlRWxlbWVudChcImRpdlwiLCBudWxsKVxuXHRcdFx0ZWxlbSA9IG5vZGUuY3JlYXRlKClcblxuXHRcdFx0YXNzZXJ0LmVxdWFsKGVsZW0ubm9kZU5hbWUsIFwiRElWXCIpXG5cdFx0XHRhc3NlcnQuZXF1YWwoZWxlbS5vdXRlckhUTUwsIFwiPGRpdj48L2Rpdj5cIilcblxuXHRcdGl0IFwic2hvdWxkIGJlIGFibGUgdG8gc2V0IGF0dHJpYnV0ZXNcIiwgLT5cblx0XHRcdG5vZGUgPSB0dXNrLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge1widGVzdFwiOiAoIHRydWUgKX0pXG5cdFx0XHRlbGVtID0gbm9kZS5jcmVhdGUoKVxuXG5cdFx0XHRhc3NlcnQuZXF1YWwoZWxlbS5ub2RlTmFtZSwgXCJESVZcIilcblx0XHRcdGFzc2VydC5lcXVhbChlbGVtLm91dGVySFRNTCwgJzxkaXYgdGVzdD1cInRydWVcIj48L2Rpdj4nKVxuXG5cdFx0aXQgXCJzaG91bGQgYWRkIGNoaWxkcmVuXCIsIC0+XG5cdFx0XHRub2RlID0gdHVzay5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsICggWzEsIDIsIDNdICkpXG5cdFx0XHRlbGVtID0gbm9kZS5jcmVhdGUoKVxuXG5cdFx0XHRhc3NlcnQuZXF1YWwoZWxlbS5ub2RlTmFtZSwgXCJESVZcIilcblx0XHRcdGFzc2VydC5lcXVhbChlbGVtLm91dGVySFRNTCwgXCI8ZGl2PjEyMzwvZGl2PlwiKVxuXG5cdFx0aXQgXCJzaG91bGQgc2V0IGlubmVySFRNTFwiLCAtPlxuXHRcdFx0bm9kZSA9IHR1c2suY3JlYXRlRWxlbWVudChcImRpdlwiLCB7XCJpbm5lckhUTUxcIjogXCI8c3Bhbj48L3NwYW4+XCJ9KVxuXHRcdFx0ZWxlbSA9IG5vZGUuY3JlYXRlKClcblxuXHRcdFx0YXNzZXJ0LmVxdWFsKGVsZW0ubm9kZU5hbWUsIFwiRElWXCIpXG5cdFx0XHRhc3NlcnQuZXF1YWwoZWxlbS5vdXRlckhUTUwsICc8ZGl2PjxzcGFuPjwvc3Bhbj48L2Rpdj4nKVxuXG5cdFx0aXQgXCJzaG91bGQgaW5oZXJpdCBwYXJlbnRzIG5hbWVzcGFjZVwiLCAtPlxuXHRcdFx0cGFyZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuXHRcdFx0bm9kZSA9IHR1c2suY3JlYXRlRWxlbWVudChcInN2Z1wiLCBudWxsLCB0dXNrLmNyZWF0ZUVsZW1lbnQoXCJjaXJjbGVcIiwgbnVsbCkpXG5cdFx0XHRlbGVtID0gbm9kZS5jcmVhdGUoKVxuXHRcdFx0YXNzZXJ0LmVxdWFsKGVsZW0ubmFtZXNwYWNlVVJJLCBOQU1FU1BBQ0VTLlNWRylcblx0XHRcdGFzc2VydC5lcXVhbChlbGVtLmZpcnN0Q2hpbGQubmFtZXNwYWNlVVJJLCBOQU1FU1BBQ0VTLlNWRylcblxuXHRcdGl0IFwic2hvdWxkIGJlIGFibGUgdG8gdXBkYXRlXCIsIC0+XG5cdFx0XHRwYXJlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG5cdFx0XHRub2RlICAgPSB0dXNrLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge1widGVzdFwiOiAoIDEgKX0sIFwiY29udGVudFwiKVxuXHRcdFx0cGFyZW50LmFwcGVuZENoaWxkKG5vZGUuY3JlYXRlKCkpXG5cblx0XHRcdGFzc2VydC5lcXVhbChwYXJlbnQuaW5uZXJIVE1MLCAnPGRpdiB0ZXN0PVwiMVwiPmNvbnRlbnQ8L2Rpdj4nKVxuXG5cdFx0XHQjIFVwZGF0ZSB0YWcgbmFtZS5cblx0XHRcdG5vZGUgPSBub2RlLnVwZGF0ZSh0dXNrLmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIsIHtcInRlc3RcIjogKCAxICl9LCBcImNvbnRlbnRcIikpXG5cdFx0XHRhc3NlcnQuZXF1YWwocGFyZW50LmlubmVySFRNTCwgJzxzcGFuIHRlc3Q9XCIxXCI+Y29udGVudDwvc3Bhbj4nKVxuXG5cdFx0XHQjIFVwZGF0ZSBhdHRycy5cblx0XHRcdG5vZGUgPSBub2RlLnVwZGF0ZSh0dXNrLmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIsIHtcInRlc3RcIjogKCAyICl9LCBcImNvbnRlbnRcIikpXG5cdFx0XHRhc3NlcnQuZXF1YWwocGFyZW50LmlubmVySFRNTCwgJzxzcGFuIHRlc3Q9XCIyXCI+Y29udGVudDwvc3Bhbj4nKVxuXG5cdFx0XHQjIFVwZGF0ZSBjaGlsZHJlbi5cblx0XHRcdG5vZGUgPSBub2RlLnVwZGF0ZSh0dXNrLmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIsIHtcInRlc3RcIjogKCAyICl9LCBcInVwZGF0ZWRcIikpXG5cdFx0XHRhc3NlcnQuZXF1YWwocGFyZW50LmlubmVySFRNTCwgJzxzcGFuIHRlc3Q9XCIyXCI+dXBkYXRlZDwvc3Bhbj4nKVxuXG5cdFx0aXQgXCJzaG91bGQgbm90IHVwZGF0ZSBpZ25vcmVkIG5vZGVzXCIsIC0+XG5cdFx0XHRwYXJlbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG5cdFx0XHRub2RlICAgPSB0dXNrLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge1wiaWdub3JlXCI6IHRydWUsIFwidGVzdFwiOiAoIDEgKX0sIFwiY29udGVudFwiKVxuXHRcdFx0cGFyZW50LmFwcGVuZENoaWxkKG5vZGUuY3JlYXRlKCkpXG5cblx0XHRcdGFzc2VydC5lcXVhbChwYXJlbnQuaW5uZXJIVE1MLCAnPGRpdiB0ZXN0PVwiMVwiPmNvbnRlbnQ8L2Rpdj4nKVxuXG5cdFx0XHQjIFVwZGF0ZSB0YWcgbmFtZS5cblx0XHRcdG5vZGUgPSBub2RlLnVwZGF0ZSh0dXNrLmNyZWF0ZUVsZW1lbnQoXCJzcGFuXCIsIHtcImlnbm9yZVwiOiB0cnVlLCBcInRlc3RcIjogKCAxICl9LCBcImNvbnRlbnRcIikpXG5cdFx0XHRhc3NlcnQuZXF1YWwocGFyZW50LmlubmVySFRNTCwgJzxkaXYgdGVzdD1cIjFcIj5jb250ZW50PC9kaXY+JylcblxuXHRcdFx0IyBVcGRhdGUgYXR0cnMuXG5cdFx0XHRub2RlID0gbm9kZS51cGRhdGUodHVzay5jcmVhdGVFbGVtZW50KFwic3BhblwiLCB7XCJpZ25vcmVcIjogdHJ1ZSwgXCJ0ZXN0XCI6ICggMiApfSwgXCJjb250ZW50XCIpKVxuXHRcdFx0YXNzZXJ0LmVxdWFsKHBhcmVudC5pbm5lckhUTUwsICc8ZGl2IHRlc3Q9XCIxXCI+Y29udGVudDwvZGl2PicpXG5cblx0XHRcdCMgVXBkYXRlIGNoaWxkcmVuLlxuXHRcdFx0bm9kZSA9IG5vZGUudXBkYXRlKHR1c2suY3JlYXRlRWxlbWVudChcInNwYW5cIiwge1wiaWdub3JlXCI6IHRydWUsIFwidGVzdFwiOiAoIDIgKX0sIFwidXBkYXRlZFwiKSlcblx0XHRcdGFzc2VydC5lcXVhbChwYXJlbnQuaW5uZXJIVE1MLCAnPGRpdiB0ZXN0PVwiMVwiPmNvbnRlbnQ8L2Rpdj4nKVxuXG5cdFx0aXQgXCJzaG91bGQga2VlcCB0cmFjayBvZiBrZXllZCBub2Rlc1wiLCAtPlxuXHRcdFx0cGFyZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuXHRcdFx0bm9kZSAgID0gKFxuXHRcdFx0XHR0dXNrLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgbnVsbCxcblx0XHRcdFx0XHR0dXNrLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwge1wia2V5XCI6IFwiMFwifSksXG5cdFx0XHRcdFx0dHVzay5jcmVhdGVFbGVtZW50KFwic3BhblwiLCB7XCJrZXlcIjogXCIxXCJ9KSxcblx0XHRcdFx0XHR0dXNrLmNyZWF0ZUVsZW1lbnQoXCJhXCIsIHtcImtleVwiOiBcIjJcIn0pXG5cdFx0XHRcdClcblx0XHRcdClcblx0XHRcdHBhcmVudC5hcHBlbmRDaGlsZChub2RlLmNyZWF0ZSgpKVxuXHRcdFx0aW5pdGlhbENoaWxkcmVuID0gW10uc2xpY2UuY2FsbChwYXJlbnQuY2hpbGROb2Rlc1swXS5jaGlsZE5vZGVzKVxuXG5cdFx0XHRub2RlLnVwZGF0ZShcblx0XHRcdFx0dHVzay5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIG51bGwsXG5cdFx0XHRcdFx0dHVzay5jcmVhdGVFbGVtZW50KFwic3BhblwiLCB7XCJrZXlcIjogXCIxXCJ9KSxcblx0XHRcdFx0XHR0dXNrLmNyZWF0ZUVsZW1lbnQoXCJhXCIsIHtcImtleVwiOiBcIjJcIn0pLFxuXHRcdFx0XHRcdHR1c2suY3JlYXRlRWxlbWVudChcImRpdlwiLCB7XCJrZXlcIjogXCIwXCJ9KVxuXHRcdFx0XHQpXG5cdFx0XHQpXG5cdFx0XHR1cGRhdGVkQ2hpbGRyZW4gPSBbXS5zbGljZS5jYWxsKHBhcmVudC5jaGlsZE5vZGVzWzBdLmNoaWxkTm9kZXMpXG5cblx0XHRcdCMgVGVzdCB0aGF0IG5vIG5vZGVzIHdlcmUgc2NyYXBwZWQsIG9ubHkgbW92ZWQuXG5cdFx0XHRhc3NlcnQuZXF1YWwoaW5pdGlhbENoaWxkcmVuWzBdLCB1cGRhdGVkQ2hpbGRyZW5bMl0pXG5cdFx0XHRhc3NlcnQuZXF1YWwoaW5pdGlhbENoaWxkcmVuWzFdLCB1cGRhdGVkQ2hpbGRyZW5bMF0pXG5cdFx0XHRhc3NlcnQuZXF1YWwoaW5pdGlhbENoaWxkcmVuWzJdLCB1cGRhdGVkQ2hpbGRyZW5bMV0pXG5cblx0XHRpdCBcInNob3VsZCBiZSBhYmxlIHRvIGJvb3RzdHJhcCBleGlzdGluZyBkb21cIiwgLT5cblx0XHRcdGRpdiAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXG5cdFx0XHRodG1sID0gZGl2LmlubmVySFRNTCA9IFN0cmluZyh0dXNrLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgbnVsbCkpXG5cdFx0XHRyb290ID0gZGl2LmNoaWxkTm9kZXNbMF1cblx0XHRcdHR1c2sucmVuZGVyKGRpdi5maXJzdENoaWxkLCB0dXNrLmNyZWF0ZUVsZW1lbnQoXCJkaXZcIiwgbnVsbCkpXG5cblx0XHRcdGFzc2VydC5lcXVhbChkaXYuaW5uZXJIVE1MLCBcIjxkaXY+PC9kaXY+XCIpXG5cdFx0XHRhc3NlcnQoZGl2LmNoaWxkTm9kZXNbMF0gaXMgcm9vdClcblxuXHRcdGl0IFwic2hvdWxkIGxpc3RlbiBmb3IgZXZlbnRzXCIsIChkb25lKS0+XG5cdFx0XHRlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtKVxuXHRcdFx0dHVzay5jcmVhdGVFbGVtZW50KFwiZGl2XCIsIHtcIm9uQ2xpY2tcIjogKCAtPiBkb25lKCkgKX0pLm1vdW50KGVsZW0pXG5cdFx0XHRlbGVtLmNsaWNrKClcblxuXHRcdGl0IFwic2hvdWxkIGhhdmUgYSBtb3VudCBldmVudFwiLCAoZG9uZSktPlxuXHRcdFx0ZWxlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcblx0XHRcdGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZWxlbSlcblx0XHRcdHR1c2suY3JlYXRlRWxlbWVudChcImRpdlwiLCB7XCJvbk1vdW50XCI6ICggLT4gZG9uZSgpICl9KS5tb3VudChlbGVtKVxuXG5cdFx0aXQgXCJzaG91bGQgaGF2ZSBhIGRpc21vdW50IGV2ZW50XCIsIChkb25lKS0+XG5cdFx0XHRlbGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKVxuXHRcdFx0ZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChlbGVtKVxuXHRcdFx0bm9kZSA9IHR1c2suY3JlYXRlRWxlbWVudChcImRpdlwiLCB7XCJvbkRpc21vdW50XCI6ICggLT4gZG9uZSgpICl9KVxuXHRcdFx0bm9kZS5tb3VudChlbGVtKVxuXHRcdFx0bm9kZS51cGRhdGUodHVzay5jcmVhdGVFbGVtZW50KFwic3BhblwiLCBudWxsKSlcbiJdfQ==
