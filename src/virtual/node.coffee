Text                                  = require("./text")
{ escapeHTML, setAttrs, setChildren } = require("../util")
{ SELF_CLOSING, NODE }                = require("../constants")

class Node
	isTusk: true

	###
	# Creates a virtual dom node that can be later transformed into a real node and updated.
	# @param {String} type
	# @param {Object} attrs
	# @param {Object} events
	# @param {Array} children
	# @constructor
	###
	constructor: (@type, @attrs, @events, @children)->
		@key       = @attrs.key or null; delete @attrs.key
		@innerHTML = @attrs.innerHTML; delete @attrs.innerHTML
		# Cast non-virtuals to text nodes.
		@children[i] = new Text(child) for child, i in @children when not child?.isTusk

	###
	# Bootstraps event listeners and children from a virtual element.
	#
	# @param {HTMLElement} element
	# @api private
	###
	mount: (element)->
		@_element = { childNodes } = element
		@_element[NODE] = @
		# Boostrap children.
		child.mount(childNodes[i]) for child, i in @children
		return

	###
	# Creates a real node out of the virtual node and returns it.
	#
	# @return HTMLElement
	# @api private
	###
	create: ->
		# Create a real dom element.
		@_element = document.createElement(@type)
		@_element[NODE] = @
		if @innerHTML? then @_element.innerHTML = @innerHTML
		else setChildren(@)
		setAttrs(@)
		@_element

	###
	# Given a different virtual node it will compare the nodes an update the real node accordingly.
	#
	# @param {Virtual} updated
	# @return {Virtual}
	# @api private
	###
	update: (updated)->
		# Update type requires a re-render.
		if @type isnt updated.type
			@_element.parentNode.replaceChild(updated.create(), @_element)
		else
			# Give updated the dom.
			updated._element = @_element
			if updated.innerHTML?
				# Direct innerHTML update.
				@_element.innerHTML = updated.innerHTML if @innerHTML isnt updated.innerHTML
			else
				# If we are going from innerHTML to nodes then we must clean up.
				@_element.innerHTML = "" if @innerHTML?
				setChildren(@, updated.children)

			setAttrs(@, updated.attrs)

		@_element[NODE] = updated
		@_element       = null
		return updated

	###
	# Removes the current node from it's parent.
	#
	# @api private
	###
	remove: ->
		@_element.parentNode.removeChild(@_element)
		@_element[NODE] = null
		@_element       = null
		return

	###
	# Override node's toString to generate valid html.
	#
	# @return {String}
	# @api public
	###
	toString: ->
		attrs = ""
		attrs += " #{key}=\"#{escapeHTML(val)}\"" for key, val of @attrs
		if @type in SELF_CLOSING then "<#{@type + attrs}>"
		else "<#{@type + attrs}>#{@innerHTML ? @children.join("")}</#{@type}>"

module.exports  = Node
