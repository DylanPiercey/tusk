Node                                  = require("./node")
{ normalizeNode, normalizeComponent } = require("./util")

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
		switch typeof node
			when "string" then new Node(node, normalizeNode(node, props, children))
			when "object" then node.render(normalizeComponent(props, children))
			when "function" then node(normalizeComponent(props, children))

	render:         require("./render")
	renderToString: require("./renderToString")
