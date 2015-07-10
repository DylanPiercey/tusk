Text                          = require("./virtual/text")
Node                          = require("./virtual/node")
Component                     = require("./virtual/component")
{ getRoot, getDiff, flatten } = require("./util")
{ BROWSER, COMPONENT, NODE }  = require("./constants")

if BROWSER
	isDOM = require("is-dom")
	raf   = require("component-raf")
	# Bootstrap event listeners.
	require("./delegator")

###
# Utility to create virtual elements.
# If the given node is a string then the resulting virtual node will be an html element with a tagname of that string.
# 	IE: "div" -> <div></div>
#
# @param {String|Function} type
# @param {Object} props
# @param {Array} children
# @returns {Promise}->{Node}
# @api public
###
tusk = (type, props = {}, children...)->
	# Separate attrs from events.
	attrs  = {}
	events = {}
	for key, val of props
		unless key[0...2] is "on" then attrs[key] = val
		else events[key[2..].toLowerCase()] = val

	# Flatten children into a keyed object.
	children = flatten(children)

	# Create node based on type.
	switch typeof type
		when "object" then new Component(type, attrs, events, children)
		when "string" then new Node(type, attrs, events, children)
		else new Error("Tusk: Invalid virtual node type.")

###
# Alias for calling tusk for some older JSX compilers.
#
# @api public
###
tusk.createElement = tusk

###
# Render a virtual node into the document.
#
# @param {Node} node
# @param {HTMLEntity} entity
# @api public
###
tusk.render = (node, entity)->
	throw new Error("Tusk: Cannot render on the server (use toString).") unless BROWSER
	throw new Error("Tusk: Container must be a DOM element.") unless isDOM(entity)
	throw new Error("Tusk: A virtual node is required.") unless node?.isTusk
	prev = entity[COMPONENT] or entity[NODE]

	# Check if this entity has been rendered into before with this virtual node.
	if prev
		raf.cancel(prev.frame) if "frame" of prev
		prev.frame = raf(=>
			delete prev.frame
			# Update the virtual node.
			prev.update(node)
		)

		prev.updated(node)
	# Otherwise we will attempt to bootstrap.
	else
		root     = getRoot(entity)
		curHTML  = node.toString()
		prevHTML = root?.outerHTML

		# Attempt to see if we can bootstrap off of existing dom.
		unless curHTML is prevHTML
			if prevHTML?
				[server, client] = getDiff(prevHTML, curHTML)
				console.warn("""
					Tusk: Could not bootstrap document, existing html and virtual html do not match.

					Server:
					#{server}

					Client:
					#{client}
				""")
			entity.innerHTML = curHTML
			root             = getRoot(entity)
		node.mount(root)

	return

module.exports = tusk
