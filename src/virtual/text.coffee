{ escapeHTML } = require("../util")

###
# @class Text
# @description
# Creates a virtual text node that can be later transformed into a real node and updated.
#
# @param {String} value - the nodeValue for the text node.
# @private
###
Text = (value = " ")->
	@value = String(value)
	return

###
# @memberOf Text
# @description
# Mark instances as a tusk nodes.
#
# @constant
# @private
###
Text::isTusk = true

###
# @memberOf Text
# @description
# Ensures that the provided element's node value matches the virtual value.
#
# @param {HTMLEntity} elem
# @private
###
Text::mount = (elem)->
	@_elem = { nodeValue } = elem
	# Use Text.splitText(index) to split up text-nodes from server.
	elem.splitText(nodeValue.indexOf(@value) + @value.length) if @value isnt nodeValue
	return

###
# @memberOf Text
# @description
# Creates a real text node out of the virtual text node and returns it.
#
# @returns {HTMLEntity}
# @private
###
Text::create = ->
	# Reuse previously rendered nodes.
	return @_elem if @_elem
	@_elem = document.createTextNode(@value)

###
# @memberOf Text
# @description
# Given a different virtual node it will compare the nodes an update the real node accordingly.
#
# @param {(Node|Text)} updated
# @returns {(Node|Text)}
# @private
###
Text::update = (updated)->
	# If we got the same virtual node then we treat it as a no op.
	# This allows for render memoization.
	return this if this is updated

	if updated.constructor is Text
		# If we got a different textnode then we do a value update.
		if @value isnt updated.value
			@_elem.nodeValue = updated.value
	else
		@_elem.parentNode.replaceChild(updated.create(), @_elem)

	updated._elem = @_elem
	updated

###
# @memberOf Text
# @description
# Removes the current text node from it's parent.
#
# @private
###
Text::remove = ->
	@_elem.parentNode.removeChild(@_elem)

###
# @memberOf Text
# @description
# Generate a valid escaped html string for the virtual text node.
#
# @returns {String}
###
Text::toString = ->
	escapeHTML(@value)

module.exports = Text
