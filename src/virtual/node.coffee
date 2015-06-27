Text                                                                   = require("./text")
{ escapeHTML, flatten, selfClosing, setAttrs, setEvents, setChildren } = require("../util")

class Node
	isTusk: true

	###
	# Creates a virtual dom node that can be later transformed into a real node and updated.
	# @param {String} type
	# @param {Object} props
	# @param {Array} children
	# @constructor
	###
	constructor: (@type, props, children)->
		@innerHTML = props.innerHTML; delete props.innerHTML
		@attrs  = {}
		@events = {}

		# Separate attrs from events and sanatize attrs.
		for key, val of props
			unless key[0...2] is "on" then @attrs[key] = escapeHTML(val)
			else @events[key[2..].toLowerCase()] = val

		# Flatten children.
		@children = (
			if @type in selfClosing or @innerHTML? then []
			else flatten(children)
		)

		# Cast non-virtuals to text nodes.
		for child, i in @children when not child?.isTusk
			@children[i] = new Text(child)

	###
	# Bootstraps event listeners and children from a virtual element.
	#
	# @param {HTMLElement} element
	# @api private
	###
	mount: (element)->
		@_element = { childNodes } = element
		# Attach event handlers.
		setEvents(@)
		# Boostrap children.
		child.mount(childNodes[i]) for child, i in @children
		return

	###
	# Creates a real node out of the virtual node and returns it.
	#
	# @returns HTMLElement
	# @api private
	###
	create: ->
		# Create a real dom element.
		@_element = document.createElement(@type)
		if @innerHTML? then @_element.innerHTML = @innerHTML
		else setChildren(@)
		setEvents(@)
		setAttrs(@)
		@_element

	###
	# Given a different virtual node it will compare the nodes an update the real node accordingly.
	#
	# @param {Virtual} updated
	# @returns {Virtual}
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
				@_element.innerHTML = updated.innerHTML if @innerHTML isnt updated.innerHTML
			else
				@_element.removeChild(@_element.firstChild) while @_element.firstChild if @innerHTML?
				setChildren(@, updated.children)

			setEvents(@, updated.events)
			setAttrs(@, updated.attrs)
			@_element = null

		return updated

	###
	# Removes the current node from it's parent.
	# @api private
	###
	remove: ->
		# Remove dead event listeners
		setEvents(@, {})
		@_element.parentNode.removeChild(@_element)
		return

	###
	# Override node's toString to generate valid html.
	#
	# @returns {String}
	# @api public
	###
	toString: ->
		attrs = ""
		attrs += " #{key}=\"#{val}\"" for key, val of @attrs
		if @type in selfClosing then "<#{@type + attrs}>"
		else "<#{@type + attrs}>#{@innerHTML ? @children.join("")}</#{@type}>"

module.exports  = Node
