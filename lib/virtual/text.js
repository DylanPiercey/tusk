"use strict";

var escape     = require("escape-html");
var text       = Text.prototype;
module.exports = Text;

/*
 * @private
 * @class Text
 * @description
 * Creates a virtual text node that can be later transformed into a real node and updated.
 *
 * @param {String} value - the nodeValue for the text node.
 */
function Text (value) {
	this.value = String(value);
}


/*
 * @private
 * @constant
 * @description
 * Mark instances as a tusk nodes.
 *
 */
text.isTusk = true;


/*
 * @private
 * @description
 * Ensures that the provided element's node value matches the virtual value.
 *
 * @param {HTMLEntity} elem
 */
text.mount = function (elem) {
	this._elem = elem;
	var nodeValue = elem.nodeValue;
	// Re use existing dom.
	if (this.value === nodeValue) return;
	// Use text split to create new nodes from server.
	elem.splitText(nodeValue.indexOf(this.value) + this.value.length);
};

/*
 * @private
 * @description
 * Creates a real text node out of the virtual text node and returns it.
 *
 * @returns {HTMLEntity}
 */
text.create = function () {
	this._elem = this._elem || document.createTextNode(this.value);
	// Re use existing dom.
	if (this.value !== this._elem.nodeValue) {
		this._elem.nodeValue = this.value;
	};
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
text.update = function (updated) {
	if (this === updated) return updated;

	if (updated.constructor !== Text) {
		// Updated type requires a re-render.
		this._elem.parentNode.replaceChild(updated.create(), this._elem);
		return updated;
	}

	updated._elem = this._elem;
	if (this.value !== updated.value) {
		this._elem.nodeValue = updated.value;
	}

	return updated;
};

/*
 * @private
 * @description
 * Removes the current text node from it's parent.
 */
text.remove = function () {
	this._elem.parentNode.removeChild(this._elem);
};

/*
 * @description
 * Generate a valid escaped html string for the virtual text node.
 *
 * @returns {String}
 */
text.toString = function () {
	return escape(this.value);
};
