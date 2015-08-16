/** tusk v0.5.7 https://www.npmjs.com/package/tusk */
"use strict";
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
