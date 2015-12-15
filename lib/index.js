"use strict";

var flat      = require("flatten-array");
var Node      = require("./virtual/node");
var delegator = require("./delegator");
var NODE      = require("./constants").NODE;
var util      = require("./util");
var _context;
var _owner;

module.exports = tusk["default"] = tusk.createElement = tusk;

/*
 * @namespace tusk
 * @description
 * Utility to create virtual elements.
 * If the given type is a string then the resulting virtual node will be created with a tagname of that string.
 * Otherwise if the type is a function it will be invoked, and the returned nodes used.
 * ```javascript
 * // Create a virtual element.
 * tusk("div", { id: "example" }, ...); // -> Node
 * ```
 *
 * @param {(String|Function)} type - A nodeName or a function that returns a Node.
 * @param {Object} props - The events and attributes for the resulting element.
 * @param {Array} children - The children for the resulting element.
 * @throws {TypeError} type must be a function or a string.
 * @returns {(Node|*)}
 */
function tusk (type, props /*children...*/) {
	// Convert child arguments to an array.
	var children = new Array(Math.max(arguments.length - 2, 0));
	for (var i = children.length; i--;) children[i] = arguments[i + 2];
	children = flat(children);

	switch (typeof type) {
		case "string":
			return new Node(type, _owner, props, children);
		case "function":
			_owner = type;
			var node   = type(props, children, _context);
			_owner = undefined;
			return node;
		default:
			throw new TypeError("Tusk: Invalid virtual node type.");
	}
};

/*
 * @static
 * @description
 * Render a virtual node onto an html entity.
 * This will automatically re-use existing dom and initialize a tusk app.
 * ```javascript
 * // Using jsx.
 * tusk.render(document.body, <body>Hello World!</body>);
 * document.body.innerHTML; //-> "Hello World"
 * ```
 *
 * @param {HTMLEntity} entity - The dom node to render the virtual node onto.
 * @param {Node} node - The virtual node to render.
 */
tusk.render = function (entity, node) {
	if (typeof window === "undefined") throw new Error("Tusk: Cannot render on the server (use toString).");
	if (!(entity instanceof window.Node)) throw new Error("Tusk: Container must be a DOM element.");
	if (!node || !node.isTusk) throw new Error("Tusk: Can only render a virtual node.");

	// Check if this entity has been rendered to before.
	if (entity[NODE] && entity[NODE].update(node)) return;

	// Ensure events are initialized.
	delegator.init();

	var prevHTML = entity.outerHTML;
	var curHTML  = String(node);

	// When using server side rendering we can reuse html.
	if (curHTML === prevHTML) {
		node.mount(entity);
		return;
	}

	entity[NODE] = node;
	entity.parentNode.replaceChild(node.create(), entity);

	// Check if we should warn about not reusing html.
	if (!prevHTML) return;
	var diff = util.getDiff(prevHTML, curHTML);
	console.warn(
		"Tusk: Could not bootstrap document, existing html and virtual html do not match." +
		"\n\nServer:\n" + diff[0] +
		"\n\nClient:\n" + diff[1]
	);
};

/*
 * @static
 * @description
 * Utility to attach context to #createElement for sideways data loading.
 * The provided renderer will be immediately invoked.
 * ```javascript
 * let MyComponent = function (props, children, context) {
 * 	return (
 * 		<body>
 * 			Counter: { context.counter }
 * 		</body>
 * 	);
 * };
 *
 * tusk.render(document.body,
 * 	tusk.with({ counter: 1 }, function () {
 * 		return (
 * 			<MyCounter/>
 * 		);
 * 	});
 * );
 *
 * document.body.innerHTML; //-> "Counter: 1"
 * ```
 *
 * @param {*} context - A value that any custom render functions will be invoked with.
 * @param {Function} renderer - Any nodes rendered within the function will be called with the context.
 * @throws {TypeError} The result of renderer must be a Node.
 * @returns {(Node|Text)}
 */
tusk["with"] = function (context, renderer) {
	if (typeof renderer !== "function") throw new TypeError("Tusk: renderer should be a function.");

	_context = context;
	var node = renderer(context);
	_context = undefined;
	return node;
};
