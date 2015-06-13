Text                                                          = require("./text")
{ escapeHTML, selfClosing, setAttrs, setEvents, setChildren } = require("./util")

class Node
	###
	# Creates a virtual dom node that can be later transformed into a real node and updated.
	# @param {String} options.type
	# @param {Object} options.attrs
	# @param {Object} options.events
	# @param {Array} options.children
	# @constructor
	###
	constructor: ({ @type, @attrs, @events, @children })->
		@innerHTML = @attrs.innerHTML; delete @attrs.innerHTML
		# Sanatize attributes.
		@attrs[key] = escapeHTML(val) for key, val of @attrs
		# Children based on keys.
		@children[i] = new Text(child) for child, i in @children when not (child instanceof Node)

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
	# @param {Node} newNode
	# @returns {Node|Text}
	# @api private
	###
	update: (newNode)->
		# Update type requires a re-render.
		if @type isnt newNode.type
			@_element.parentNode.replaceChild(newNode.create(), @_element)
		else
			# Give newnode the dom.
			newNode._element = @_element
			if newNode.innerHTML?
				@_element.innerHTML = newNode.innerHTML if @innerHTML isnt newNode.innerHTML
			else
				@_element.removeChild(@_element.firstChild) while @_element.firstChild if @innerHTML?
				setChildren(@, newNode.children)

			setEvents(@, newNode.events)
			setAttrs(@, newNode.attrs)
			@_element = null

		return newNode

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
