module.exports =
	selfClosing: [
		"area", "base", "br", "col", "command", "embed", "hr", "img", "input",
		"keygen", "link", "meta", "param", "source", "track", "wbr"
	]

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
		return [arr] unless Array.isArray(arr)
		for a in arr
			if Array.isArray(a) then flatten(a, result)
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
		_element.removeAttribute(key) for key of attrs when not updated[key]?
		return

	###
	# Utility that will update or set a given virtual nodes event listeners.
	#
	# @params {Node} node
	# @params {Object} updated?
	# @api private
	###
	setEvents: ({ _element, events }, updated)->
		unless updated
			updated = events
			events  = {}

		# Attach new events
		for key, val of updated when val isnt events[key]
			# Remove old event listener if needed.
			_element.removeEventListener(key, events[key]) if key of events
			# Add new event listener.
			_element.addEventListener(key, val)

		# Remove old events
		_element.removeEventListener(key, val) for key, val of events when not updated[key]?
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

		for child, i in children
			# Update existing nodes.
			if i of updated then child.update(updated[i])
			# Remove extra nodes.
			else child.remove()

		# Add new nodes
		_element.appendChild(child.create()) while child = updated[i++]
		return
