util = module.exports =
	###
	# Utility to transform a string like "onDblClick" to "dblClick"
	#
	# @param {String} str
	# @returns {String}
	###
	getEvent: (str)-> str[2...3].toLowerCase() + str[3..]

	###
	# Returns the root node for an element (this is different for root entity).
	#
	# @params {HTMLEntity} entity
	# @returns {HTMLEntity}
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
	###
	getDiff: (a, b)->
		break for char, i in a when char isnt b[i]
		start = Math.max(0, i - 20)
		end   = start + 80

		[
			a[start...Math.min(end, a.length)]
			b[start...Math.min(end, b.length)]
		]

	###
	# Utility to recursively flatten a nested array.
	#
	# @param {Array} arr
	# @returns {Array}
	###
	flatten: (arr, result = [])->
		return result unless arr
		return [arr] unless Array.isArray(arr)

		for a in arr
			if Array.isArray(a) then util.flatten(a, result)
			else result.push(a)

		result

	###
	# Escape special characters in the given string of html.
	#
	# @param {String} html
	# @returns {String}
	###
	escapeHTML: (html)->
		String(html)
			.replace(/&/g, "&amp;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#39;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
