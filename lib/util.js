/** tusk v0.6.0 https://www.npmjs.com/package/tusk */
"use strict";
var flattenInto;

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
  flattenInto: flattenInto = function(arr, acc) {
    var item, j, len;
    for (j = 0, len = arr.length; j < len; j++) {
      item = arr[j];
      if (item instanceof Array) {
        flattenInto(item, acc);
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
        if ((val == null) || val === false) {
          elem.removeAttribute(key);
        } else {
          elem.setAttribute(key, val);
        }
      }
    }
    for (key in prev) {
      if (!key in next) {
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
