module.exports =
	###
	# Escape special characters in the given string of html.
	#
	# @param {String} html
	# @returns {String}
	# @api private
	###
	escapeHTML: (html)->
		String(html)
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")

	###
	# Utility to recursively flatten a nested array.
	#
	# @param {Array} arr
	# @returns {Array}
	###
	flatten: flatten = (arr, result = [])->
		return result unless arr
		return [arr] unless arr instanceof Array
		for a in arr
			if a instanceof Array then flatten(a, result)
			else result.push(a)
		result

	###
	# Returns the root node for an element (this is different for the documentElement).
	#
	# @params {HTMLEntity} entity
	# @returns {HTMLEntity}
	# @api private
	###
	getRoot: (entity)->
		if entity.tagName is "HTML" then entity
		else entity.childNodes[0]

	###
	# Returns a chunk surrounding the difference between two strings, useful for debugging.
	#
	# @param {String} a
	# @param {String} b
	# @returns {Array<String>}
	# @api private
	###
	getDiff: (a, b)->
		break for char, i in a when char isnt b[i]
		start = Math.max(0, i - 20)
		end   = start + 80
		[a[start...Math.min(end, a.length)], b[start...Math.min(end, b.length)]]

	###
	# Utility that will update or set a given virtual nodes attributes.
	#
	# @params {Node} node
	# @params {Object} updated?
	# @api private
	###
	setAttrs: ({ _element, attrs }, updated)->
		unless updated
			updated = attrs
			attrs   = {}

		# Append new attrs.
		_element.setAttribute(key, val) for key, val of updated when val? and val isnt attrs[key]
		# Remove old attrs.
		_element.removeAttribute(key) for key of attrs when not key of updated
		return

	###
	# Utility that will update or set a given virtual nodes children.
	#
	# @params {Node} node
	# @params {Object} updated?
	# @returns {Node}
	# @api private
	###
	setChildren: ({ _element, children }, updated)->
		unless updated
			updated  = children
			children = []

		for child, i in updated
			# Update existing nodes.
			if i of children then children[i].update(child)
			# Add new nodes.
			else _element.appendChild(child.create())

		# Remove old nodes
		child.remove() while child = children[i++]
		return
