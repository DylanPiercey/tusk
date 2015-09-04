module.exports =
	###
	# @private
	# @description
	# Escape special characters in the given string of html.
	#
	# @param {String} html - the html to escape.
	# @returns {String}
	###
	escapeHTML: (html)->
		String(html)
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")

	###
	# @private
	# @description
	# Utility that recursively flattens an array.
	#
	# @param {Array} arr - The array to flatten.
	# @param {Array} acc - The resulting array.
	# @returns {Array}
	###
	flatten: flatten = (arr, acc = [])->
		for item in arr
			if item?.constructor is Array then flatten(item, acc)
			else acc.push(item)
		acc

	###
	# @private
	# @description
	# Returns a chunk surrounding the difference between two strings, useful for debugging.
	#
	# @param {String} a
	# @param {String} b
	# @returns {Array<String>}
	###
	getDiff: (a, b)->
		break for char, i in a when char isnt b[i]
		start = Math.max(0, i - 20)
		end   = start + 80
		[a[start...Math.min(end, a.length)], b[start...Math.min(end, b.length)]]

	###
	# @private
	# @description
	# Utility that will update or set a given virtual nodes attributes.
	#
	# @param {HTMLEntity} elem - The entity to update.
	# @param {Object} prev - The previous attributes.
	# @param {Object} next - The updated attributes.
	###
	setAttrs: (elem, prev, next)->
		return if prev is next

		# Append new attrs.
		for key, val of next when val isnt prev[key]
			elem.setAttribute(key, val)

		# Remove old attrs.
		for key of prev when key not of next
			elem.removeAttribute(key)

		return

	###
	# @private
	# @description
	# Utility that will update or set a given virtual nodes children.
	#
	# @param {HTMLEntity} elem - The entity to update.
	# @param {Object} prev - The previous children.
	# @param {Object} next - The updated children.
	###
	setChildren: (elem, prev, next)->
		return if prev is next

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
		for key, child of prev when key not of next
			child.remove()

		return
