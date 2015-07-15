Text                                                        = require("./text")
{ escapeHTML, flatten, replaceNode, setAttrs, setChildren } = require("../util")
{ SELF_CLOSING, NODE }                                      = require("../constants")

###
# Creates a virtual dom node that can be later transformed into a real node and updated.
# @param {String} type
# @param {Object} props
# @param {Array} children
# @constructor
###
Node = (@type, props, children)->
	@key       = props.key
	@innerHTML = props.innerHTML
	delete props.key
	delete props.innerHTML

	# Separate attrs from events.
	@attrs  = {}
	@events = {}
	for key, val of props
		unless key[0...2] is "on" then @attrs[key] = val
		else @events[key[2..].toLowerCase()] = val

	# Check if the node should have any children.
	unless @type in SELF_CLOSING or @innerHTML?
		# Flatten children into a keyed object.
		@children = flatten(children)
		# Cast non-virtuals to text nodes.
		@children[key] = new Text(child) for key, child of @children when not child?.isTusk

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
# @return HTMLElement
# @api private
###
Node::create = ->
	# Create a real dom element.
	@_elem = elem = document.createElement(@type)
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
