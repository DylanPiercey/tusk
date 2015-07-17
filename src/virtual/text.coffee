{ escapeHTML, replaceNode } = require("../util")

###
# Creates a virtual text node that can be later transformed into a real node and updated.
# @param {String} value
# @constructor
###
Text = (value = " ")->
	@value = String(value)
	return

# Mark instances as a tusk nodes.
Text::isTusk = true

###
# Bootstraps event listeners and children from a virtual element.
#
# @param {HTMLElement} elem
# @api private
###
Text::mount = (elem)->
	@_elem = { nodeValue } = elem
	# Use Text.splitText(index) to split up text-nodes from server.
	elem.splitText(nodeValue.indexOf(@value) + @value.length) if @value isnt nodeValue
	elem

###
# Creates a real node out of the virtual node and returns it.
#
# @return HTMLElement
# @api private
###
Text::create = ->
	@_elem = document.createTextNode(@value)

###
# Given a different virtual node it will compare the nodes an update the real node accordingly.
#
# @param {Virtual} updated
# @returns {Virtual}
# @api private
###
Text::update = (updated)->
	unless updated instanceof Text then replaceNode(@, updated)
	else
		updated._elem = @_elem
		@_elem.nodeValue = updated.value if updated.value isnt @value
	updated

###
# Removes the current node from it's parent.
###
Text::remove = ->
	@_elem.parentNode.removeChild(@_elem)

###
# Return text nodes value.
#
# @return {String}
# @api public
###
Text::toString = ->
	escapeHTML(@value)

module.exports  = Text
