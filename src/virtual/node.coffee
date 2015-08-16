{ SELF_CLOSING, NODE, NAMESPACES }    = require("../constants")
{ escapeHTML, setAttrs, setChildren } = require("../util")
{ dispatch }                          = require("../delegator")
Text                                  = require("./text")

###
# @private
# @description
# Utility to recursively flatten a nested array into a keyed node list and cast non-nodes to Text.
#
# @param {Node} node
# @param {(Array|Node)} cur
# @param {Number} acc
# @returns {Object}
###
normalizeChildren = (node, cur = " ", acc = 0)->
	if cur.constructor is Array
		normalizeChildren(node, child, acc + i) for child, i in cur
	else
		# Cast non-nodes to text.
		cur = new Text(cur) unless cur.isTusk
		# Inherit parents namespace.
		cur.namespaceURI ?= node.namespaceURI
		# Set chilld position in node list.
		cur.index = acc
		# Children are indexed by there position, or the provided key.
		node.children[cur.key or acc] = cur
	return

###
# @private
# @class Node
# @description
# Creates a virtual dom node that can be later transformed into a real node and updated.
#
# @param {String} type - The tagname of the element.
# @param {Object} props - An object containing events and attributes.
# @param {Array} children - The child nodeList for the element.
###
Node = (@type, props, children)->
	# Set implicit namespace for element.
	@namespaceURI = (
		if @type is "svg" then NAMESPACES.SVG
		else if @type is "math" then NAMESPACES.MATH_ML
	)

	# Set default values.
	@attrs    = {}
	@events   = {}
	@children = {}

	# Check if we should add attrs/events.
	if props?
		# Pull out special props.
		@key       = props.key; delete props.key
		@innerHTML = props.innerHTML; delete props.innerHTML

		# Separate attrs from events.
		for key, val of props
			unless key[0...2] is "on" then @attrs[key] = val
			else @events[key[2..].toLowerCase()] = val

	# Check if we should append children.
	normalizeChildren(@, children) unless @innerHTML? or @type in SELF_CLOSING
	return
###
# @private
# @constant
# @description
# Mark instances as a tusk nodes.
###
Node::isTusk = true

###
# @private
# @description
# Bootstraps event listeners and children from a virtual node.
#
# @param {HTMLEntity} elem
###
Node::mount = (elem)->
	@_elem = { childNodes } = elem
	elem[NODE] = @
	# Boostrap children.
	child.mount(childNodes[child.index or key]) for key, child of @children unless @innerHTML?
	dispatch("mount", elem)
	return

###
# @private
# @description
# Creates a real node out of the virtual node and returns it.
#
# @returns {HTMLEntity}
###
Node::create = ->
	# Create a real dom element or reuse existing.
	elem       = @_elem ?= document.createElementNS(@namespaceURI or NAMESPACES.HTML, @type)
	prev       = elem[NODE]
	elem[NODE] = @

	# This element could have be reused at somepoint so we make sure
	# that we check its children/attrs.
	if prev then { attrs, children } = prev
	else attrs = children = {}

	setAttrs(elem, attrs, @attrs)
	if @innerHTML? then elem.innerHTML = @innerHTML
	else setChildren(elem, children, @children)
	dispatch("mount", elem)
	elem

###
# @private
# @description
# Given a different virtual node it will compare the nodes an update the real node accordingly.
#
# @param {Node} updated
# @returns {Node}
###
Node::update = (updated)->
	# If we got the same virtual node then we treat it as a no op.
	# This allows for render memoization.
	return this if this is updated

	if @type isnt updated.type
		# Update type requires a re-render.
		@_elem.parentNode.insertBefore(updated.create(), @_elem)
		@remove()
	else
		newOwner = @owner isnt updated.owner
		dispatch("dismount", @_elem) if newOwner

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

		dispatch("mount", @_elem) if newOwner

	updated

###
# @private
# @description
# Removes the current node from it's parent.
###
Node::remove = ->
	dispatch("dismount", @_elem)
	child.remove() for key, child of @children
	@_elem.parentNode.removeChild(@_elem)

###
# @description
# Generate valid html for the virtual node.
#
# @returns {String}
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
