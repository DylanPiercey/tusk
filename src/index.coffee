Node                        = require("./virtual/node")
{ getRoot, getDiff, isDOM } = require("./util")
{ NODE }                    = require("./constants")

# Bootstrap event listeners if we are in the browser.
require("./delegator")()

# Stores the current context for create element. Can be changed via "withContext"
renderContext = undefined

###
# Utility to create virtual elements.
# If the given type is a string then the resulting virtual node will be an html element with a tagname of that string.
# Otherwise if the type is a function it will be invoked, and the returned nodes used.
#
# @param {String|Function} type
# @param {Object} props
# @param {Array} children
# @returns {Node}
# @api public
###
tusk = (type, props = {}, children...)->
	# Create node based on type.
	switch typeof type
		when "string" then new Node(type, props, children)
		when "function" then type(props, [].concat(children...), renderContext)
		else throw new Error("Tusk: Invalid virtual node type.")

###
# Alias for calling tusk for some older JSX compilers.
#
# @api public
###
tusk.createElement = tusk

###
# Render a virtual node into the document.
#
# @param {HTMLEntity} entity
# @param {Virtual} node
# @api public
###
tusk.render = (entity, node)->
	if typeof document is "undefined"
		throw new Error("Tusk: Cannot render on the server (use toString).")

	unless isDOM(entity)
		throw new Error("Tusk: Container must be a DOM element.")

	unless node.isTusk
		throw new Error("Tusk: Can only render a virtual node.")

	root = getRoot(entity)
	prev = root[NODE]

	# Check if this entity has been rendered into before with this virtual node.
	if prev then prev.update(node)
	# Otherwise we will attempt to bootstrap.
	else
		curHTML  = node.toString()
		prevHTML = root.outerHTML
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

		node.mount(getRoot(entity))
	return

###
# Utility to attach context to #createElement for sideways data loading.
# The provided renderer will be immediately invoked.
#
# @params {*} context
# @params {Function} renderer
# @returns {Function}
###
tusk.with = (context, renderer)->
	renderContext = context
	unless (node = renderer?())?.isTusk
		throw new Error("Tusk: withContext requires a render function that returns a virtual node.")
	renderContext = undefined
	node

module.exports = tusk
