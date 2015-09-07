/** tusk v0.7.3 https://www.npmjs.com/package/tusk */
"use strict";
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
