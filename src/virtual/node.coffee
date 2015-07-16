Text                                               = require("./text")
{ escapeHTML, replaceNode, setAttrs, setChildren } = require("../util")
{ SELF_CLOSING, NODE, NAMESPACES }                 = require("../constants")

###
# Utility to recursively flatten a nested array into a keyed node list and cast non-nodes to Text.
#
# @param {Array|Virtual} child
# @param {String} namespaceURI
# @return {Object}
###
normalizeChildren = (child, namespaceURI, result = {}, acc = val: -1)->
	if child instanceof Array
		normalizeChildren(i, namespaceURI, result, acc) for i in child
	else
		child               = new Text(child) unless child?.isTusk # Cast non-nodes to text.
		acc.val            += 1
		child.index         = acc.val # Set chilld position in node list.
		child.namespaceURI ?= namespaceURI # Inherit parents namespace.
		result[child.key or acc.val] = child
	return result

###
# Creates a virtual dom node that can be later transformed into a real node and updated.
# @param {String} type
# @param {Object} props
# @param {Array} children
# @constructor
###
Node = (@type, props, children)->
	# Pull out special props.
	@key       = props.key; delete props.key
	@innerHTML = props.innerHTML; delete props.innerHTML

	# Set implicit namespace for element.
	@namespaceURI = (
		if @type is "svg" then NAMESPACES.SVG
		else if @type is "math" then NAMESPACES.MATH_ML
	)

	# Separate attrs from events.
	@attrs  = {}
	@events = {}
	for key, val of props
		unless key[0...2] is "on" then @attrs[key] = val
		else @events[key[2..].toLowerCase()] = val

	# Set child nodes.
	@children = (
		# Check if the node should have any children.
		if @innerHTML? or @type in SELF_CLOSING then {}
		else normalizeChildren(children, @namespaceURI)
	)

	return

# Mark instances as a tusk nodes.
Node::isTusk = true

###
# Bootstraps event listeners and children from a virtual element.
#
# @param {HTMLElement} elem
# @api private
###
Node::mount = (elem)->
	@_elem = { childNodes } = elem
	elem[NODE] = @
	# Boostrap children.
	child.mount(childNodes[child.index or key]) for key, child of @children unless @innerHTML?
	elem

###
# Creates a real node out of the virtual node and returns it.
#
# @return {HTMLElement}
# @api private
###
Node::create = ->
	# Create a real dom element.
	@_elem = elem = document.createElementNS(@namespaceURI or NAMESPACES.HTML, @type)
	elem[NODE] = @
	setAttrs(elem, @attrs)
	if @innerHTML? then elem.innerHTML = @innerHTML
	else setChildren(elem, @children)
	elem

###
# Given a different virtual node it will compare the nodes an update the real node accordingly.
#
# @param {Virtual} updated
# @return {Virtual}
# @api private
###
Node::update = (updated)->
	# Update type requires a re-render.
	if @type isnt updated.type then replaceNode(@, updated)
	# If we got the same virtual node then we treat it as a no op.
	# This allows for render memoization.
	else if this isnt updated
		# Give updated the dom.
		@_elem[NODE]  = updated
		updated._elem = @_elem
		setAttrs(@_elem, @attrs, updated.attrs)
		if updated.innerHTML?
			if @innerHTML isnt updated.innerHTML
				# Direct innerHTML update.
				@_elem.innerHTML = updated.innerHTML
		else
			# If we are going from innerHTML to nodes then we must clean up.
			@_elem.removeChild(@_elem.firstChild) while @_elem.firstChild if @innerHTML?
			setChildren(@_elem, @children, updated.children)
	updated

###
# Removes the current node from it's parent.
#
# @api private
###
Node::remove = ->
	@_elem.parentNode.removeChild(@_elem)

###
# Override node's toString to generate valid html.
#
# @return {String}
# @api public
###
Node::toString = ->
	attrs = children = ""
	attrs += " #{key}=\"#{escapeHTML(val)}\"" for key, val of @attrs

	# Use innerHTML or children.
	if @innerHTML? then children = @innerHTML
	else children += child for key, child of @children

	# Check for self closing nodes.
	if @type in SELF_CLOSING then "<#{@type + attrs}>"
	else "<#{@type + attrs}>#{children}</#{@type}>"

module.exports = Node
