"use strict";
var CONSTANTS = require("./constants");
var EVENTS    = CONSTANTS.EVENTS;
var NODE      = CONSTANTS.NODE;

module.exports = {
	/*
	 * Utility to create, cache and dispatch an event on a given element.
	 *
	 * @param {String} name
	 * @param {HTMLEntity} elem
	 * @param {Boolean} bubble
	 */
	dispatch: function (name, elem, bubbles) {
		if (bubbles == null) bubbles = false;

		var e = document.createEvent("Event");
		e.initEvent(name, bubbles, false);
		Object.defineProperties(e, {
			target: { value: elem },
			srcElement: { value: elem }
		});
		handleEvent(e);
	},

	/*
	 * @private
	 * @description
	 * Attach all event listeners to the dom for delegation.
	 */
	init: function() {
		if (document.__tusk) return;

		for (var i = EVENTS.length; i--;) {
			document.addEventListener(EVENTS[i], handleEvent, true);
		}

		document.__tusk = true;
	}
};

/*
 * @private
 * @description
 * Handle and delegate global events.
 *
 * @param {Event} e - The DOM event being handled.
 */
function handleEvent (e) {
	var type   = e.type.toLowerCase();
	var target = e.target;
	var node   = target[NODE];

	if (!e.bubbles) {
		if (node && node.events[type]) node.events[type](e);
	} else {
		Object.defineProperty(e, "currentTarget", { value: target, writable: true });
		e.stopPropagation = function () { return e.cancelBubble = true; };

		while (target) {
			e.currentTarget = target;
			node            = target[NODE];
			target          = target.parentNode;

			if (node && node.events[type]) node.events[type](e);
			if (e.cancelBubble) break;
		}
	}
};
