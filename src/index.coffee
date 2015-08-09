Node                     = require("./virtual/node")
{ NODE }                 = require("./constants")
{ flattenInto, getDiff } = require("./util")

# Bootstrap event listeners if we are in the browser.
require("./delegator")()

# Stores the current context for create element. Can be changed via "with".
renderContext = null

###
# @namespace tusk
# @description
# Utility to create virtual elements.
# If the given type is a string then the resulting virtual node will be created with a tagname of that string.
# Otherwise if the type is a function it will be invoked, and the returned nodes used.
#
# @example
# // Create a virtual element.
# tusk("div", { id: "example" }, ...); // -> Node
#
# @param {(String|Function)} type - A nodeName or a function that returns a Node.
# @param {Object} props - The events and attributes for the resulting element.
# @param {Array} children - The children for the resulting element.
# @throws {TypeError} type must be a function or a string.
# @returns {(Node|*)}
###
tusk = (type, props)->
	len           = Math.max(arguments.length - 2, 0)
	children      = new Array(len)
	children[len] = arguments[len + 2] while len--
	children      = flattenInto(children, [])

	# Create node based on type.
	switch typeof type
		when "string"
			new Node(type, props, children)
		when "function"
			node = type(props, children, renderContext)
			node.owner = type if node instanceof Node
			node
		else
			throw new TypeError("Tusk: Invalid virtual node type.")

###
# @static
# @memberOf tusk
# @alias tusk
###
tusk.createElement = tusk

###
# @static
# @memberOf tusk
# @description
# Render a virtual node onto an html entity.
# This will automatically re-use existing dom and initialize a tusk app.
#
# @example
# // Using jsx.
# tusk.render(document.body, <body>Hello World!</body>);
# document.body.innerHTML; //-> "Hello World"
#
# @param {HTMLEntity} entity - The dom node to render the virtual node onto.
# @param {Node} node - The virtual node to render.
###
tusk.render = (entity, node)->
	if typeof window is "undefined"
		throw new Error("Tusk: Cannot render on the server (use toString).")

	unless entity instanceof window.Node
		throw new Error("Tusk: Container must be a DOM element.")

	unless node?.isTusk
		throw new Error("Tusk: Can only render a virtual node.")

	# Check if this entity has been rendered into before with this virtual node.
	unless entity[NODE]?.update(node)
		prevHTML = entity.outerHTML
		curHTML  = node.toString()
		# Attempt to see if we can bootstrap off of existing dom.
		unless curHTML is prevHTML
			entity.outerHTML = curHTML
			if prevHTML?
				[server, client] = getDiff(prevHTML, curHTML)
				console.warn("""
					Tusk: Could not bootstrap document, existing html and virtual html do not match.

					Server:
					#{server}

					Client:
					#{client}
				""")
		node.mount(entity)
	return

###
# @static
# @memberOf tusk
# @description
# Utility to attach context to #createElement for sideways data loading.
# The provided renderer will be immediately invoked.
#
# @example
# let MyComponent = function (props, children, context) {
# 	return (
# 		<body>
# 			Counter: { context.counter }
# 		</body>
# 	);
# };
#
# tusk.render(document.body,
# 	tusk.with({ counter: 1 }, function () {
# 		return (
# 			<MyCounter/>
# 		);
# 	});
# );
#
# document.body.innerHTML; //-> "Counter: 1"
#
# @param {*} context - A value that any custom render functions will be invoked with.
# @param {Function} renderer - Any nodes rendered within the function will be called with the context.
# @throws {TypeError} The result of renderer must be a Node.
# @returns {(Node|Text)}
###
tusk.with = (context, renderer)->
	renderContext = context
	unless (node = renderer?())?.isTusk
		throw new TypeError("Tusk: with requires a render function that returns a virtual node.")
	renderContext = undefined
	node

module.exports = tusk
