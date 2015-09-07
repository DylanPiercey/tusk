Node                 = require("./virtual/node")
delegator            = require("./delegator")
{ NODE }             = require("./constants")
{ flatten, getDiff } = require("./util")

# Stores the current context for create element. Can be changed via "with".
_context = undefined

# Stores the current render function and props.
_owner = undefined

###
# @namespace tusk
# @description
# Utility to create virtual elements.
# If the given type is a string then the resulting virtual node will be created with a tagname of that string.
# Otherwise if the type is a function it will be invoked, and the returned nodes used.
# ```javascript
# // Create a virtual element.
# tusk("div", { id: "example" }, ...); // -> Node
# ```
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
	children      = flatten(children)

	# Create node based on type.
	switch typeof type
		when "string" then new Node(type, _owner, props, children)
		when "function"
			_owner = type
			node   = type(props, children, _context)
			_owner = undefined
			node
		else throw new TypeError("Tusk: Invalid virtual node type.")

###
# @static
# @alias tusk
###
tusk.createElement = tusk

###
# @static
# @description
# Render a virtual node onto an html entity.
# This will automatically re-use existing dom and initialize a tusk app.
# ```javascript
# // Using jsx.
# tusk.render(document.body, <body>Hello World!</body>);
# document.body.innerHTML; //-> "Hello World"
# ```
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
		if curHTML is prevHTML then node.mount(entity)
		else
			entity.parentNode.replaceChild(node.create(), entity)
			if prevHTML?
				[server, client] = getDiff(prevHTML, curHTML)
				console.warn("""
					Tusk: Could not bootstrap document, existing html and virtual html do not match.

					Server:
					#{server}

					Client:
					#{client}
				""")
		# Bootstrap event listeners if we are in the browser.
		delegator.init()
	return

###
# @static
# @description
# Utility to attach context to #createElement for sideways data loading.
# The provided renderer will be immediately invoked.
# ```javascript
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
# ```
#
# @param {*} context - A value that any custom render functions will be invoked with.
# @param {Function} renderer - Any nodes rendered within the function will be called with the context.
# @throws {TypeError} The result of renderer must be a Node.
# @returns {(Node|Text)}
###
tusk.with = (context, renderer)->
	unless typeof renderer is "function"
		throw new TypeError("Tusk: renderer should be a function.")
	_context = context
	node     = renderer(context)
	_context = undefined
	node

module.exports = tusk.default = tusk
