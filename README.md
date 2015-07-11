# TUSK

A lightweight viritual-dom with a friendly interface.

[![Join the chat at https://gitter.im/DylanPiercey/tusk](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/DylanPiercey/tusk?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm](https://img.shields.io/npm/dm/tusk.svg)](https://www.npmjs.com/package/tusk)

# Why
Many virtual-dom implementations are bulky and are not optimized for immutable data or server side rendering.
Currently this is experimental and should not be used in production.

* Lightweight.
* Minimal API.
* Designed for immutable data.
* No extra "data-react-id" attributes.
* No random span's inserted into DOM.
* Supports JSX.

# Installation

#### Npm
```console
npm install tusk
```

# Example

```javascript
/** @jsx tusk */
let tusk = require('tusk');
// Using immstruct for example, feel free to replace with immutable.js or others.
let immstruct = require('immstruct');
// Define some initial state for the app.
let struct = immstruct({ i : 0 });

function MyCounter (props, children) {
    let { message, cursor } = props;
    
    // Define handlers.
    let handleClick = (e)=> cursor.update((state)=> state.set("i", state.get("i") + 1));
    
    // Render the component.
    return (
        <button onClick={ handleClick }>
            { message } : { cursor.get('i') }
        </button>
    );
}

// Render into the browser. (Returns a function to re-run the render).
update = tusk.render(document.body, ()=> {
    <MyCounter message="Times clicked" cursor={ struct.cursor() }/>
});

// We can use the update function to re-render when the state changes.
struct.on("next-animation-frame", update)

// We can also render into a string (Usually for the server).
let HTML = String(<MyCounter type="Times clicked" cursor={ struct.cursor() }/>);
// -> "<button>Times clicked : 0</button>"
```

# API
+ **render(HTMLEntity, render)** : Bootstrap or update a virtual `node` inside of an `HTML Entity`.

```javascript
// render must be a function that returns virtual nodes.
tusk.render(document.body, ()=> <div>Hello World</div>);
// -> [Function] that will render with the same arguments.
```

+ **createElement(type, props, children...)** : Create a virtual node/component.

```javascript
// Automatically called when using JSX.
let vNode = tusk.createElement("div", { editable: true }, "Hello World");
// Or call tusk directly
let vNode = tusk("div", { editable: true }, "Hello World");

// Render to string on the server.
vNode.toString(); // '<div editable="true">Hello World</div>';

/**
 * @params type can also be a function (shown in example above).
 */
```

---

### Contributions

* Use gulp to run tests.

Please feel free to create a PR!
