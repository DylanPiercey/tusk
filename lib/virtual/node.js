"use strict";

var escape       = require("escape-html");
var Text         = require("./text");
var util         = require("../util");
var dispatch     = require("../delegator").dispatch;
var CONSTANTS    = require("../constants");
var SELF_CLOSING = CONSTANTS.SELF_CLOSING;
var NODE         = CONSTANTS.NODE;
var NAMESPACES   = CONSTANTS.NAMESPACES;
var node         = Node.prototype;

module.exports = Node;

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
function Node (type, owner, props, children) {
	this.attrs    = {};
	this.events   = {};
	this.children = {};
	this.type     = type;
	this.owner    = owner;

	if (this.type === "svg") this.namespaceURI = NAMESPACES.SVG;
	else if (this.type === "math") this.namespaceURI = NAMESPACES.MATH_ML;

	if (props != null) {
		// Pull out special keys.
		this.key       = props.key;
		this.ignore    = "ignore" in props && props.ignore !== false;
		this.innerHTML = props.innerHTML;
		delete props.key;
		delete props.ignore;
		delete props.innerHTML;

		// Seperate events handlers from attrs.
		var val;
		for (var key in props) {
			val = props[key];
			if (key.slice(0, 2) === "on") {
				this.events[key.slice(2).toLowerCase()] = val;
			} else if (val != null && val !== false) {
				this.attrs[key] = val;
			}
		}
	}

	// Check if we should worry about children.
	if (this.innerHTML) return;
	if (~SELF_CLOSING.indexOf(this.type)) return;

	normalizeChildren(this, children);
};

/*
 * @private
 * @constant
 * @description
 * Mark instances as a tusk nodes.
 */
node.isTusk = true;


/*
 * @private
 * @description
 * Bootstraps event listeners and children from a virtual node.
 *
 * @param {HTMLEntity} elem
 */
node.mount = function (elem) {
	this._elem = elem;
	elem[NODE] = this;

	if (this.innerHTML == null) {
		var child;
		for (var key in this.children) {
			child = this.children[key];
			child.mount(elem.childNodes[child.index || key]);
		}
	}
	dispatch("mount", elem);
};


/*
 * @private
 * @description
 * Triggers dismount on this node and all of its children.
 */
node.dismount = function () {
	dispatch("dismount", this._elem);
	var child;
	for (var key in this.children) {
		child = this.children[key];
		if (child && child.dismount) child.dismount();
	}
};


/*
 * @private
 * @description
 * Creates a real node out of the virtual node and returns it.
 *
 * @returns {HTMLEntity}
 */
node.create = function () {
	var attrs, children;
	var elem = this._elem = (
		this.elem ||
		document.createElementNS(this.namespaceURI || NAMESPACES.HTML, this.type)
	);
	var prev   = elem[NODE];
	elem[NODE] = this;

	if (prev) {
		attrs    = prev.attrs
		children = prev.children;
	} else {
		attrs = children = {};
	}

	util.setAttrs(elem, attrs, this.attrs);

	if (this.innerHTML != null) elem.innerHTML = this.innerHTML;
	else util.setChildren(elem, children, this.children);

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
node.update = function (updated) {
	if (this === updated) return updated;
	if (this.ignore && updated.ignore) return updated;

	if (this.type !== updated.type) {
		// Updated type requires a re-render.
		this._elem.parentNode.insertBefore(updated.create(), this._elem);
		this.remove();
		return updated;
	}

	// Check if we should trigger a dismount.
	var newOwner = this.owner !== updated.owner;
	if (newOwner) dispatch("dismount", this._elem);

	// Give updated node the dom.
	this._elem[NODE] = updated;
	updated._elem    = this._elem;

	// Update nodes attrs.
	util.setAttrs(this._elem, this.attrs, updated.attrs);

	if (updated.innerHTML != null) {
		if (this.innerHTML !== updated.innerHTML) {
			// Direct inner html update.
			this._elem.innerHTML = updated.innerHTML;
		}
	} else {
		// If prev node had innerhtml then we have to clear it.
		if (this.innerHTML != null) this._elem.innerHTML = "";
		// Update children.
		util.setChildren(this._elem, this.children, updated.children);
	}

	if (newOwner) dispatch("mount", this._elem);
	return updated;
};


/*
 * @private
 * @description
 * Removes the current node from it's parent.
 */
node.remove = function () {
	this.dismount();
	this._elem.parentNode.removeChild(this._elem);
};


/*
 * @description
 * Generate valid html for the virtual node.
 *
 * @returns {String}
 */
node.toString = function () {
	var key;
	var attrs    = "";
	var children = "";

	for (key in this.attrs) {
		attrs += " " + key + "=\"" + escape(this.attrs[key]) + "\"";
	}

	// Self closing nodes will not have children.
	if (~SELF_CLOSING.indexOf(this.type)) {
		return "<" + this.type + attrs + ">";
	}

	// Check for html or virtual node children.
	if (this.innerHTML != null) {
		children = this.innerHTML;
	} else {
		for (key in this.children) {
			children += this.children[key];
		}
	}

	return "<" + this.type + attrs + ">" + children + "</" + this.type + ">";
};

/*
 * @private
 * @description
 * Utility to recursively flatten a nested array into a keyed node list and cast non-nodes to Text.
 *
 * @param {Node} n
 * @param {(Array|Node)} cur
 * @param {Number} acc
 * @returns {Object}
 */
function normalizeChildren (n, cur, acc) {
	if (cur == null) cur = " ";
	if (acc == null) acc = 0;

	if (cur.constructor === Array) {
		for (var i = 0, len = cur.length; i < len; i++) normalizeChildren(n, cur[i], acc + i);
		return;
	}

	if (!cur.isTusk) cur = new Text(cur);
	if (cur.namespaceURI == null) cur.namespaceURI = n.namespaceURI;

	cur.index                  = acc;
	n.children[cur.key || acc] = cur;
};
