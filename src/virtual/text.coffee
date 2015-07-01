{ escapeHTML } = require("../util")

class Text
	isTusk: true

	###
	# Creates a virtual text node that can be later transformed into a real node and updated.
	# @param {String} value
	# @constructor
	###
	constructor: (value = "")->
		@value = String(value)

	###
	# Bootstraps event listeners and children from a virtual element.
	#
	# @param {HTMLElement} element
	# @api private
	###
	mount: (element)->
		@_element = { nodeValue } = element
		# Use Text.splitText(index) to split up text-nodes from server.
		element.splitText(nodeValue.indexOf(@value) + @value.length) if @value isnt nodeValue
		return

	###
	# Creates a real node out of the virtual node and returns it.
	#
	# @return HTMLElement
	# @api private
	###
	create: ->
		@_element = document.createTextNode(@value)

	###
	# Given a different virtual node it will compare the nodes an update the real node accordingly.
	#
	# @param {Virtual} updated
	# @returns {Virtual}
	# @api private
	###
	update: (updated)->
		if updated instanceof Text and updated.toString() is @value
			updated._element = @_element
		else
			@_element.parentNode.replaceChild(updated.create(), @_element)

		@_element = null
		return updated

	###
	# Removes the current node from it's parent.
	###
	remove: ->
		@_element.parentNode.removeChild(@_element)
		@_element = null
		return

	###
	# Return text nodes value.
	#
	# @return {String}
	# @api public
	###
	toString: ->
		escapeHTML(@value)

module.exports  = Text
