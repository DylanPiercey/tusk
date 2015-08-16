{ escapeHTML } = require("../util")

###
# @private
# @class Text
# @description
# Creates a virtual text node that can be later transformed into a real node and updated.
#
# @param {String} value - the nodeValue for the text node.
###
Text = (value)->
	@value = String(value)
	return

###
# @private
# @constant
# @description
# Mark instances as a tusk nodes.
#
###
Text::isTusk = true

###
# @private
# @description
# Ensures that the provided element's node value matches the virtual value.
#
# @param {HTMLEntity} elem
###
Text::mount = (elem)->
	@_elem = { nodeValue } = elem
	# Use Text.splitText(index) to split up text-nodes from server.
	elem.splitText(nodeValue.indexOf(@value) + @value.length) if @value isnt nodeValue
	return

###
# @private
# @description
# Creates a real text node out of the virtual text node and returns it.
#
# @returns {HTMLEntity}
###
Text::create = ->
	# Reuse previously rendered nodes.
	@_elem          ?= document.createTextNode(@value)
	@_elem.nodeValue = @value unless @_elem.nodeValue is @value
	@_elem

###
# @private
# @description
# Given a different virtual node it will compare the nodes an update the real node accordingly.
#
# @param {(Node|Text)} updated
# @returns {(Node|Text)}
###
Text::update = (updated)->
	# If we got the same virtual node then we treat it as a no op.
	# This allows for render memoization.
	return this if this is updated

	if updated.constructor is Text
		updated._elem = @_elem
		# If we got a different textnode then we do a value update.
		@_elem.nodeValue = updated.value if @value isnt updated.value

	else @_elem.parentNode.replaceChild(updated.create(), @_elem)

	updated

###
# @private
# @description
# Removes the current text node from it's parent.
###
Text::remove = ->
	@_elem.parentNode.removeChild(@_elem)

###
# @description
# Generate a valid escaped html string for the virtual text node.
#
# @returns {String}
###
Text::toString = ->
	escapeHTML(@value)

module.exports = Text
