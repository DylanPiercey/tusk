Node                        = require("./node")
{ escapeHTML, selfClosing } = require("./util")

###
# Utility to convert an object of properties to a string of html attributes.
#
# @param {Node} node
# @returns {String}
###
getAttrs = ({ attrs })->
	result = ""
	result += " #{key}=\"#{escapeHTML(val)}\"" for key, val of attrs
	result

###
# Utility to convert an array of child nodes to a string of html.
#
# @param {Node} node
# @returns {String}
###
getChildren = ({ attrs, children })->
	return attrs.innerHTML if attrs?.innerHTML?
	# Stringify all children.
	result = ""
	result += (
		if child instanceof Node then stringify(child)
		else escapeHTML(child)
	) for child in children
	result


###
# Render a virtual node into an html string.
#
# @param {Node} node
# @returns {String}
###
stringify = (node)->
	if node.tag in selfClosing
		"<#{node.tag + getAttrs(node)}/>"
	else
		"<#{node.tag + getAttrs(node)}>#{getChildren(node)}</#{node.tag}>"

module.exports = stringify
