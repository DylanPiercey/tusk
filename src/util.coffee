Node = require("./node.coffee")

util = module.exports =
	# List of self closing html tags.
	selfClosing: [
		"area", "base", "br", "col", "command", "embed", "hr", "img", "input",
		"keygen", "link", "meta", "param", "source", "track", "wbr"
	]

	###
	# Utility to transform a string like "onDblClick" to "dblClick"
	#
	# @param {String} str
	# @returns {String}
	###
	getEvent: (str)-> str[2...3].toLowerCase() + str[3..]

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

	###
	# Parse the class attribute so it's able to be
	# set in a more user-friendly way
	#
	# @param {String|Object|Array} obj
	# @return {String}
	###
	parseClass: (obj)->
		if Array.isArray(obj)
			return unless obj.length
			return obj.join(" ")
		else if typeof val is "object"
			return util.parseClass(key for key, val of obj when val)
		return obj

	###
	# Parse a block of styles into a string.
	#
	# @param {Object} styles
	# @return {String}
	###
	parseStyle: (obj)->
		return obj if typeof obj is "string"
		result = ""
		result += "#{key}:#{val};" for key, val of obj
		result

	###
	# Utility to normalize a nodes props and children.
	#
	# @param {String} tag
	# @param {Object} props
	# @param {Array} children
	# @returns {Object}
	###
	normalizeNode: (tag, props, children)->
		attrs       = {}
		events      = {}
		innerHTML   = props.innerHTML; delete props.innerHTML
		props.class = util.parseClass(props.class) if props.class?
		props.style = util.parseStyle(props.style) if props.style?

		# Separate attrs from events and flatten them.
		for key, val of props
			if key[0...2] is "on" then events[util.getEvent(key)] = val
			else attrs[key] = util.escapeHTML(val)

		# Sanatize and flatten children.
		children = (
			if tag in util.selfClosing then []
			else if innerHTML? then [innerHTML]
			else (for child in util.flatten(children)
				if child instanceof Node then child
				else util.escapeHTML(child)
			)
		)

		{ attrs, events, children }
