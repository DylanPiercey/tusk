/** tusk v0.5.9 https://www.npmjs.com/package/tusk */
"use strict";
var NODE, Node, attachOwner, delegator, flattenInto, getDiff, ref, renderContext, tusk;

Node = require("./virtual/node");

delegator = require("./delegator");

NODE = require("./constants").NODE;

ref = require("./util"), flattenInto = ref.flattenInto, getDiff = ref.getDiff;

renderContext = void 0;


/*
 * @private
 * @description
 * Simply utilty to ensure that a render function (owner) is attached to all children.
 *
 * @param {(Array|Node)} node
 * @param {Function} owner
 * @param {Object|Null} props
 * @returns {*}
 */

attachOwner = function(node, owner, props) {
  var child, i, len1, results;
  if (!node) {
    return;
  }
  switch (node.constructor) {
    case Node:
      node.owner = owner;
      if (props != null ? props.key : void 0) {
        node.key = props.key;
      }
      return node;
    case Array:
      results = [];
      for (i = 0, len1 = node.length; i < len1; i++) {
        child = node[i];
        results.push(attachOwner(child, owner));
      }
      return results;
      break;
    default:
      return node;
  }
};


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

tusk = function(type, props) {
  var children, len;
  len = Math.max(arguments.length - 2, 0);
  children = new Array(len);
  while (len--) {
    children[len] = arguments[len + 2];
  }
  children = flattenInto(children, []);
  switch (typeof type) {
    case "string":
      return new Node(type, props, children);
    case "function":
      return attachOwner(type(props, children, renderContext), type, props);
    default:
      throw new TypeError("Tusk: Invalid virtual node type.");
  }
};


/*
 * @static
 * @alias tusk
 */

tusk.createElement = tusk;


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

tusk.render = function(entity, node) {
  var client, curHTML, prevHTML, ref1, ref2, server;
  if (typeof window === "undefined") {
    throw new Error("Tusk: Cannot render on the server (use toString).");
  }
  if (!(entity instanceof window.Node)) {
    throw new Error("Tusk: Container must be a DOM element.");
  }
  if (!(node != null ? node.isTusk : void 0)) {
    throw new Error("Tusk: Can only render a virtual node.");
  }
  if (!((ref1 = entity[NODE]) != null ? ref1.update(node) : void 0)) {
    prevHTML = entity.outerHTML;
    curHTML = node.toString();
    if (curHTML === prevHTML) {
      node.mount(entity);
    } else {
      entity.parentNode.replaceChild(node.create(), entity);
      if (prevHTML != null) {
        ref2 = getDiff(prevHTML, curHTML), server = ref2[0], client = ref2[1];
        console.warn("Tusk: Could not bootstrap document, existing html and virtual html do not match.\n\nServer:\n" + server + "\n\nClient:\n" + client);
      }
    }
    delegator.init();
  }
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

tusk["with"] = function(context, renderer) {
  var node;
  renderContext = context;
  node = typeof renderer === "function" ? renderer(context) : void 0;
  renderContext = void 0;
  return node;
};

module.exports = tusk["default"] = tusk;
