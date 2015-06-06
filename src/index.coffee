Node          = require("./node")
{ normalizeNode } = require("./util")

module.exports =
	###
	# Utility to create virtual elements.
	# If the given node is a string then the resulting virtual node will be an html element with a tagname of that string.
	# 	IE: "div" -> <div></div>
	#
	# @param {String|Function} node
	# @param {Object} props
	# @param {Array} children
	# @returns {Node|NodeList}
	###
	createElement: (node, props = {}, children...)->
		normalized = normalizeNode(node, props, children)

		switch typeof node
			when "string" then new Node(node, normalized)
			when "object" then node.render(normalized)
			when "function" then node(normalized)

	render:         require("./render")
	renderToString: require("./renderToString")
