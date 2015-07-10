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
	# @param {Array|Virtual} node
	# @returns {Object}
	###
	flatten: flatten = (node, result = {}, acc = val: -1)->
		if node instanceof Array then flatten(child, result, acc) for child in node
		else if node?
			acc.val++
			result[node?.key or acc.val] = node
			node.index = acc.val if node.isTusk
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
	# @params {HTMLEntity} elem
	# @params {Object} prev
	# @params {Object} next
	# @api private
	###
	setAttrs: (elem, prev, next)->
		unless next
			next = prev
			prev = {}

		# Append new attrs.
		elem.setAttribute(key, val) for key, val of next when val? and val isnt prev[key]
		# Remove old attrs.
		elem.removeAttribute(key) for key of prev when not key of next
		return

	###
	# Utility that will update or set a given virtual nodes children.
	#
	# @params {HTMLEntity} elem
	# @params {Object} prev
	# @params {Object} next
	# @returns {Node}
	# @api private
	###
	setChildren: (elem, prev, next)->
		moved          = {}
		{ childNodes } = elem

		unless next
			next = prev
			prev = {}

		for key, child of next
			# Update existing nodes.
			if key of prev
				(prevChild = prev[key]).update(child)
				# Mark a node as moved if it's index has changed.
				if prevChild.index isnt child.index
					moved[child.index] = childNodes[prevChild.index]
			# Add new nodes.
			else elem.appendChild(child.create())

		# Remove old nodes
		child.remove() for key, child of prev when not key of next
		# Reposition moved nodes
		elem.insertBefore(childEl, childNodes[pos]) for pos, childEl of moved
		return
