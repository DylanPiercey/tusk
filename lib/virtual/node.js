/** tusk v0.7.2 https://www.npmjs.com/package/tusk */
"use strict";
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
  var child, key, ref2;
  dispatch("dismount", this._elem);
  ref2 = this.children;
  for (key in ref2) {
    child = ref2[key];
    child.remove();
  }
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
