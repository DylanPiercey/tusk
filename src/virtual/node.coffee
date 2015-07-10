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
		@children[key] = new Text(child) for key, child of @children when not child?.isTusk

	###
	# Bootstraps event listeners and children from a virtual element.
	#
	# @param {HTMLElement} elem
	# @api private
	###
	mount: (elem)->
		{ childNodes } = elem
		# Boostrap children.
		child.mount(childNodes[child.index or key]) for key, child of @children unless @innerHTML?
		elem[NODE] = @
		@_elem     = elem

	###
	# Creates a real node out of the virtual node and returns it.
	#
	# @return HTMLElement
	# @api private
	###
	create: ->
		# Create a real dom element.
		elem = document.createElement(@type)
		setAttrs(elem, @attrs)
		unless @innerHTML? then setChildren(elem, @children)
		else elem.innerHTML = @innerHTML
		elem[NODE] = @
		@_elem     = elem

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
			@_elem.parentNode.replaceChild(updated.create(), @_elem)
		else
			# Give updated the dom.
			updated._elem = @_elem
			setAttrs(@_elem, @attrs, updated.attrs)
			if updated.innerHTML? then if @innerHTML isnt updated.innerHTML
				# Direct innerHTML update.
				@_elem.innerHTML = updated.innerHTML
			else
				# If we are going from innerHTML to nodes then we must clean up.
				@_elem.innerHTML = "" if @innerHTML?
				setChildren(@_elem, @children, updated.children)

		@_elem[NODE] = updated
		delete @_elem
		updated

	###
	# Removes the current node from it's parent.
	#
	# @api private
	###
	remove: ->
		@_elem.parentNode.removeChild(@_elem)
		delete @_elem[NODE]
		delete @_elem

	###
	# Override node's toString to generate valid html.
	#
	# @return {String}
	# @api public
	###
	toString: ->
		attrs = children = ""
		attrs += " #{key}=\"#{escapeHTML(val)}\"" for key, val of @attrs

		if @innerHTML then children = @innerHTML
		else children += child for key, child of @children

		if @type in SELF_CLOSING then "<#{@type + attrs}>"
		else "<#{@type + attrs}>#{children}</#{@type}>"

module.exports  = Node
