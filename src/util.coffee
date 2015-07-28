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
	# Utility that recursively flattens an array.
	#
	# @param {Array} arr
	# @param {Array} acc
	# @return {Array}
	# @api private
	###
	flattenInto: flattenInto = (arr, acc)->
		for item in arr
			if item instanceof Array then flattenInto(item, acc)
			else acc.push(item)
		acc

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
	###
	createNode: createNode = (node)->
		elem = node._elem
		elem = (
			unless elem then node.create()
			else if document.documentElement.contains(elem) then elem.cloneNode(true)
			else elem
		)
		elem[NODE] = node
		node._elem = elem
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
		_elem.parentNode.replaceChild(createNode(next), _elem)
		return

	###
	# Utility that will update or set a given virtual nodes attributes.
	# @param {HTMLEntity} elem
	# @param {Object} prev
	# @param {Object} next
	# @api private
	###
	setAttrs: (elem, prev, next)->
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
		# Update new or existing nodes.
		for key, child of next
			# Attempt to update an existing node.
			if key of prev
				(prevChild = prev[key]).update(child)
				# Skip re-insert if child hasn't moved.
				continue if prevChild.index is child.index
			# Create the node if it is new.
			else createNode(child)
			# Insert or move the node.
			elem.insertBefore(child._elem, elem.childNodes[child.index])

		# Remove old nodes
		child.remove() for key, child of prev when key not of next
		return
