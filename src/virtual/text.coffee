{ escapeHTML } = require("../util")

class Text
	isTusk: true

	###
	# Creates a virtual text node that can be later transformed into a real node and updated.
	# @param {String} value
	# @constructor
	###
	constructor: (value = "")->
		# Sanatize html text. (Mostly for server side rendering).
		@value = escapeHTML(value)

	###
	# Bootstraps event listeners and children from a virtual element.
	#
	# @param {HTMLElement} element
	###
	mount: (element)->
		@_element = { nodeValue } = element
		# Use Text.splitText(index) to split up text-nodes from server.
		element.splitText(nodeValue.indexOf(@value) + @value.length) if @value isnt nodeValue
		return

	###
	# Creates a real node out of the virtual node and returns it.
	#
	# @returns HTMLElement
	###
	create: -> @_element = document.createTextNode(@value)

	###
	# Given a different virtual node it will compare the nodes an update the real node accordingly.
	#
	# @param {Virtual} updated
	# @returns {Virtual}
	###
	update: (updated)->
		if updated instanceof Text and updated.toString() is @value
			updated._element = @_element
		else
			@_element.parentNode.replaceChild(updated.create(), @_element)

		return updated

	###
	# Removes the current node from it's parent.
	###
	remove: -> @_element.parentNode.removeChild(@_element)

	###
	# Return text nodes value.
	#
	# @returns {String}
	###
	toString: -> @value

module.exports  = Text
