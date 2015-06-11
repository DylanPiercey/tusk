{ escapeHTML, selfClosing } = require("./util")

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
		# Sanatize attributes.
		@attrs[key] = escapeHTML(val) for key, val of @attrs
		# Sanatize text nodes.
		@children[i] = escapeHTML(child ? "") for child, i in @children when not (child instanceof Node)

	###
	# Creates a real node out of the virtual node and returns it.
	#
	# @returns HTMLElement
	###
	create: ->
		# Create a real dom element.
		@_element = document.createElement(@type)
		setAttrs(@)
		setEvents(@)
		setChildren(@)
		@_element

	###
	# Bootstraps event listeners and children from a virtual element.
	#
	# @param {HTMLElement} element
	# @returns {HTMLElement}
	###
	bootstrap: (element)->
		@_element = { childNodes } = element
		# Attach event handlers.
		setEvents(@)
		# Boostrap children.
		for child, i in @children
			node = childNodes[i]
			if child instanceof Node
				# Recursive bootstrap child.
				child.bootstrap(node)
			else if node.nodeValue isnt child
				# Use Text.splitText(index) to split up text-nodes from server.
				child.splitText(node.nodeValue.indexOf(child) + child.length)
		@_element

	###
	# Given a different virtual node it will compare the nodes an update the real node accordingly.
	#
	# @param {Node} newNode
	###
	update: (newNode)->
		# Update type requires a re-render.
		if @type isnt newNode.type
			@_element.parentNode.replaceChild(newNode.create(), @_element)
			@_element = newNode._element
			{ @type, @attrs, @events, @children } = newNode
			return this

		setAttrs(@, newNode.attrs)
		setEvents(@, newNode.events)
		setChildren(@, newNode.children)
		return this

	###
	# Override node's toString to generate valid html.
	#
	# @returns {String}
	###
	toString: ->
		attrs = ""
		attrs += " #{key}=\"#{val}\"" for key, val of @attrs
		if @type in selfClosing then "<#{@type + attrs}>"
		else "<#{@type + attrs}>#{@children.join("")}</#{@type}>"

###
# Begin Diffing Utilities
###

###
# Utility to cast a virtual node into a dom node.
#
# @params {Node|String} node
###
getElement = (node)->
	# Recursively create child node.
	if node instanceof Node then node._element or node.create()
	# Force non-nodes to strings.
	else document.createTextNode(node)

###
# Utility that will update or set a given virtual nodes attributes.
#
# @params {Node} node
# @params {Object} updated?
###
setAttrs = (node, updated)->
	{ _element, attrs } = node

	if updated
		node.attrs = updated
	else
		updated = attrs
		attrs = {}

	# Append new attrs.
	_element.setAttribute(key, val) for key, val of updated when val isnt attrs[key]
	# Remove old attrs.
	_element.removeAttribute(key) for key of attrs when not updated[key]?
	return

###
# Utility that will update or set a given virtual nodes event listeners.
#
# @params {Node} node
# @params {Object} updated?
###
setEvents = (node, updated)->
	{ _element, events } = node

	if updated
		node.events = updated
	else
		updated = events
		events = {}

	# Attach new events
	for key, val of updated when val isnt events[key]
		# Remove old event listener if needed.
		_element.removeEventListener(key, events[key]) if key of events
		# Add new event listener.
		_element.addEventListener(key, val)

	# Remove old events
	_element.removeEventListener(key, val) for key, val of events when not updated[key]?
	return

###
# Utility that will update or set a given virtual nodes children.
#
# @params {Node} node
# @params {Object} updated?
# @returns {Node}
###
setChildren = (node, updated)->
	{ _element, children } = node

	unless updated
		updated = children
		children = []

	node.children = (for i in [0...Math.max(children.length, updated.length)]
		child        = children[i]
		newChild     = updated[i]
		childElement = _element.childNodes[i]

		# If both are nodes, then a simple recursive update will work.
		if child instanceof Node and newChild instanceof Node
			child.update(newChild)

		# Replace node with new node.
		else if child? and newChild?
			_element.replaceChild(getElement(newChild), childElement)
			newChild

		# Append new node if there was no old node.
		else if newChild?
			_element.appendChild(getElement(newChild))
			newChild

		# Must delete child if there was no new child.
		else if child?
			# Remove dead event listeners
			setEvents(child, {})
			_element.removeChild(childElement)
			continue
	)
	return

module.exports  = Node
