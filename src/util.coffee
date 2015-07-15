{ NODE } = require("./constants")

module.exports =
	###
	# Escape special characters in the given string of html.
	#
	# @param {String} html
	# @return {String}
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
	# Test if a value is a DOM node in the current window.
	#
	# @param {*} val
	# @return {Boolean}
	# @api private
	###
	isDOM: (val)->
		typeof window isnt "undefined" and val instanceof window.Node

	###
	# Utility to recursively flatten a nested array into a keyed node list.
	#
	# @param {Array|Virtual} node
	# @return {Object}
	###
	flatten: flatten = (node, result = {}, acc = val: -1)->
		if node instanceof Array then flatten(child, result, acc) for child in node
		else
			acc.val += 1
			if node?
				node.index = acc.val if node.isTusk
				result[node.key or acc.val] = node
			else result[acc.val] = node
		result

	###
	# Returns the root node for an element (this is different for the documentElement).
	#
	# @param {HTMLEntity} entity
	# @return {HTMLEntity}
	# @api private
	###
	getRoot: (entity)->
		if entity.tagName is "HTML" then entity
		else entity.firstChild

	###
	# Returns a chunk surrounding the difference between two strings, useful for debugging.
	#
	# @param {String} a
	# @param {String} b
	# @return {Array<String>}
	# @api private
	###
	getDiff: (a, b)->
		break for char, i in a when char isnt b[i]
		start = Math.max(0, i - 20)
		end   = start + 80
		[a[start...Math.min(end, a.length)], b[start...Math.min(end, b.length)]]

	###
	# Utility to extract out or create an elem from an existing node.
	#
	# @param {Virtual} node
	# @return {HTMLEntity}
	###
	createElem: createElem = (node)->
		elem = node._elem
		elem = (
			unless elem then node.create()
			else if document.contains(elem) then elem.cloneNode(true)
			else elem
		)
		elem[NODE] = node
		elem

	###
	# Utility to replace one node with another.
	#
	# @param {HTMLEntity} elem
	# @param {Object} prev
	# @param {Object} next
	# @api private
	###
	replaceNode: ({ _elem }, next)->
		_elem.parentNode.replaceChild(createElem(next), _elem)
		return

	###
	# Utility that will update or set a given virtual nodes attributes.
	# @param {HTMLEntity} elem
	# @param {Object} prev
	# @param {Object} next
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
	# @param {HTMLEntity} elem
	# @param {Object} prev
	# @param {Object} next
	# @return {Node}
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
			else elem.appendChild(createElem(child))

		# Remove old nodes
		child.remove() for key, child of prev when not key of next
		# Reposition moved nodes
		elem.insertBefore(childEl, childNodes[pos]) for pos, childEl of moved
		return
