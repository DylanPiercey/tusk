module.exports =
	###
	# @description
	# Escape special characters in the given string of html.
	#
	# @param {String} html - the html to escape.
	# @returns {String}
	# @private
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
	# @param {Array} arr - The array to flatten.
	# @param {Array} acc - The resulting array.
	# @returns {Array}
	# @private
	###
	flattenInto: flattenInto = (arr, acc)->
		for item in arr
			if item instanceof Array then flattenInto(item, acc)
			else acc.push(item)
		acc

	###
	# @description
	# Returns a chunk surrounding the difference between two strings, useful for debugging.
	#
	# @param {String} a
	# @param {String} b
	# @returns {Array<String>}
	# @private
	###
	getDiff: (a, b)->
		break for char, i in a when char isnt b[i]
		start = Math.max(0, i - 20)
		end   = start + 80
		[a[start...Math.min(end, a.length)], b[start...Math.min(end, b.length)]]

	###
	# Utility to create, cache and dispatch an event on a given element.
	#
	# @param {String} name
	# @param {HTMLEntity} elem
	# @param {Boolean} bubble
	###
	dispatch: (name, elem, bubbles = false)->
		event = document.createEvent("Event")
		event.initEvent(name, bubbles, false)
		elem.dispatchEvent(event)
		return

	###
	# @description
	# Utility that will update or set a given virtual nodes attributes.
	#
	# @param {HTMLEntity} elem - The entity to update.
	# @param {Object} prev - The previous attributes.
	# @param {Object} next - The updated attributes.
	# @private
	###
	setAttrs: (elem, prev, next)->
		# Append new attrs.
		elem.setAttribute(key, val) for key, val of next when val? and val isnt prev[key]
		# Remove old attrs.
		elem.removeAttribute(key) for key of prev when not key of next
		return

	###
	# @description
	# Utility that will update or set a given virtual nodes children.
	#
	# @param {HTMLEntity} elem - The entity to update.
	# @param {Object} prev - The previous children.
	# @param {Object} next - The updated children.
	# @private
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
			else child.create()
			# Insert or move the node.
			elem.insertBefore(child._elem, elem.childNodes[child.index])

		# Remove old nodes
		child.remove() for key, child of prev when key not of next
		return
