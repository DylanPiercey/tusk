{ flatten, escapeHTML, getEvent } = require("./util")
selfClosing = [
	"area", "base", "br", "col", "command", "embed", "hr", "img", "input",
	"keygen", "link", "meta", "param", "source", "track", "wbr"
]

class Node
	###
	# Creates a virtual dom node that can be later transformed into a real node and updated.
	# @param {String} tag
	# @param {Object} props
	# @param {Array} children
	# @constructor
	###
	constructor: (@tag, props, children)->
		@attrs    = attrs = {}
		@events   = events = {}
		innerHTML = props.innerHTML; delete props.innerHTML

		# Separate attrs from events and sanatize them.
		for key, val of props
			if key[0...2] is "on" then events[getEvent(key)] = val
			else attrs[key] = escapeHTML(val)

		# Sanatize and flatten children.
		@children = (
			if @tag in selfClosing then []
			else if innerHTML? then [innerHTML]
			else (for child in flatten(children)
				if child instanceof Node then child
				else escapeHTML(child)
			)
		)

	###
	# Creates a real node out of the virtual node and returns it.
	#
	# @returns HTMLElement
	###
	create: ->
		# Create a real dom element.
		@_element = document.createElement(@tag)
		# Set attributes.
		@_element.setAttribute(key, val) for key, val of @attrs
		# Attach event handlers.
		@_element.addEventListener(key, val) for key, val of @events
		# Append children.
		@_element.appendChild(
			# Recursively create child node.
			if child instanceof Node then child.create()
			# Force non-nodes to strings.
			else document.createTextNode(child)
		) for child in @children
		# Return created element.
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
		@_element.addEventListener(key, val) for key, val of @events
		# Boostrap children.
		child.bootstrap(childNodes[i]) for child, i in @children when child instanceof Node
		# Return given element.
		@_element

	###
	# Given a different virtual node it will compare the nodes an update the real node accordingly.
	#
	# @param {Node} newNode
	###
	update: (newNode)->
		# Update tagName requires a re-render.
		if @tag isnt newNode.tag
			@_element.parentNode.replaceChild(newNode.create(), @_element)
			@_element = newNode._element
			{ @tag, @attrs, @events, @children } = newNode
			return this

		# Append new attrs.
		@_element.setAttribute(key, val) for key, val of newNode.attrs when val isnt @attrs[key]
		# Remove old attrs.
		@_element.removeAttribute(key) for key of @attrs when not newNode.attrs[key]?
		# Update attrs
		@attrs = newNode.attrs

		# Attach new events
		for key, val of newNode.events when val isnt @events[key]
			# Remove old event listener if needed.
			@_element.removeEventListener(key, @attrs[key]) if @attrs[key]
			# Add new event listener.
			@_element.addEventListener(key, val)

		# Remove old events
		@_element.removeEventListener(key, val) for key of @events when not newNode.events[key]?
		# Update Events
		@events = newNode.events

		# Update child nodes.
		@children = (for i in [0...Math.max(@children.length, newNode.children.length)]
			child          = @children[i]
			newChild       = newNode.children[i]
			childElement   = @_element.childNodes[i]

			# If both are nodes, then a simple recursive update will work.
			if child instanceof Node and newChild instanceof Node
				child.update(newChild)

			# Replace node with new node.
			else if child? and newChild?
				@_element.replaceChild((
					# Recursively create child node.
					if newChild instanceof Node then newChild.create()
					# Force non-nodes to strings.
					else document.createTextNode(newChild)
				), childElement)
				newChild

			# Append new node if there was no old node.
			else if newChild?
				@_element.appendChild(
					# Recursively create child node.
					if newChild instanceof Node then newChild.create()
					# Force non-nodes to strings.
					else document.createTextNode(newChild)
				)
				newChild

			# Must delete child if there was no new child.
			else if child?
				@_element.removeChild(childElement)
				# Remove dead event listeners
				for key, val of child.attrs when key[0...2] is "on"
					childElement.removeEventListener(getEvent(key), val)
				continue
		)

		return this

	###
	# Override node's toString to generate valid html.
	#
	# @returns {String}
	###
	toString: ->
		attrs = ""
		attrs += " #{key}=\"#{val}\"" for key, val of @attrs

		if @tag in selfClosing
			"<#{@tag + attrs}>"
		else
			"<#{@tag + attrs}>#{@children.join("")}</#{@tag}>"


module.exports  = Node
