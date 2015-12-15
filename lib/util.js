"use strict";

module.exports = {
	/*
	 * @private
	 * @description
	 * Returns a chunk surrounding the difference between two strings, useful for debugging.
	 *
	 * @param {String} a
	 * @param {String} b
	 * @returns {Array<String>}
	 */
	getDiff: function (a, b) {
		for (var i = 0, len = a.length; i < len; i++) {
			if (b[i] !== b[i]) break;
		}
		var start = Math.max(0, i - 20);
		var end   = start + 80;
		return [
			a.slice(start, Math.min(end, a.length)),
			b.slice(start, Math.min(end, b.length))
		];
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
		var key;
		if (prev === next) return;

		// Append new attrs.
		for (key in next) {
			if (next[key] === prev[key]) continue;
			elem.setAttribute(key, next[key]);
		}

		// Remove old attrs.
		for (key in prev) {
			if ((key in next)) continue;
			elem.removeAttribute(key);
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
		var key, child;
		if (prev === next) return;

		// Update existing nodes.
		for (key in next) {
			child = next[key];

			if (key in prev) {
				// Update an existing node.
				prev[key].update(child);
				// Check if we should skip repositioning.
				if (prev[key].index === child.index) continue;
			} else {
				// Create the node if it is new.
				child.create();
			}

			// Insert or reposition node.
			elem.insertBefore(child._elem, elem.childNodes[child.index]);
		}

		// Remove old nodes.
		for (key in prev) {
			if (key in next) continue;
			prev[key].remove();
		}
	}
};
