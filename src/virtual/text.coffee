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
	# @param {HTMLElement} elem
	# @api private
	###
	mount: (elem)->
		{ nodeValue } = elem
		# Use Text.splitText(index) to split up text-nodes from server.
		elem.splitText(nodeValue.indexOf(@value) + @value.length) if @value isnt nodeValue
		@_elem = elem

	###
	# Creates a real node out of the virtual node and returns it.
	#
	# @return HTMLElement
	# @api private
	###
	create: ->
		@_elem = document.createTextNode(@value)

	###
	# Given a different virtual node it will compare the nodes an update the real node accordingly.
	#
	# @param {Virtual} updated
	# @returns {Virtual}
	# @api private
	###
	update: (updated)->
		if updated instanceof Text and updated.value is @value
			updated._elem = @_elem
		else
			@_elem.parentNode.replaceChild(updated.create(), @_elem)

		delete @_elem
		updated

	###
	# Removes the current node from it's parent.
	###
	remove: ->
		@_elem.parentNode.removeChild(@_elem)
		delete @_elem

	###
	# Return text nodes value.
	#
	# @return {String}
	# @api public
	###
	toString: ->
		escapeHTML(@value)

module.exports  = Text
