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
	# Utility to recursively flatten a nested array into a keyed node list.
	#
	# @param {Array} arr
	# @returns {Object}
	###
	flatten: flatten = (arr, result = {}, acc = val: -1)->
		if arr instanceof Array then flatten(a, result, acc) for a in arr
		else if arr?
			acc.val++
			result[arr?.key or acc.val] = arr
			arr.index = acc.val if arr.isTusk
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
		moved          = {}
		{ childNodes } = _element

		# If we arent given an update then we will just append all children.
		unless updated
			updated  = children
			children = []

		for key, child of updated
			# Update existing nodes.
			if key of children
				(old = children[key]).update(child)
				# Mark a node as moved if it's index has changed.
				if old.index isnt child.index
					moved[child.index] = childNodes[old.index]
			# Add new nodes.
			else _element.appendChild(child.create())

		# Remove old nodes
		child.remove() for key, child of children when not key of updated
		# Reposition moved nodes
		_element.insertBefore(childEl, childNodes[pos]) for pos, childEl of moved

		return
