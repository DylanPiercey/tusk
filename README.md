# TUSK

A lightweight viritual-dom with a friendly interface.

[![Join the chat at https://gitter.im/DylanPiercey/tusk](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/DylanPiercey/tusk?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm](https://img.shields.io/npm/dm/tusk.svg)](https://www.npmjs.com/package/tusk)

# Why
Many virtual-dom implementations are bulky and are not optimized for server side rendering.
Currently this is experimental and should not be used in production.

* Lightweight.
* Minimal API.
* Functional.
* Isomorphic.
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

let MyCounter = {
    initialState() {
        return { i: 0 };
    },

    handleClick(e, component, update) {
        let { attrs, events, state, children } = component;
        update({ i: state.i + 1 })
    },

    render(component) {
        let { attrs, events, state, children } = component;
        return (
            <button onClick={ MyCounter.handleClick }>
                { attrs.message } : { state.i }
            </button>
        );
    }
};

// Render into the browser.
tusk.render(<MyCounter message="Times clicked"/>, document.body);

// Render into a string (Usually for the server).
let HTML = String(<MyCounter type="Times clicked"/>);
// -> "<button>Times clicked : 0</button>"
```

# API
+ **render(component, HTMLEntity)** : Bootstrap or update a virtual `component` inside of an `HTML Entity`.

    ```javascript
    tusk.render(<div>Hello World</div>, document.body);
    ```

+ **createElement(type, props, children...)** : Create a virtual node/component (Automatically called when using JSX).

    ```javascript
    let vNode = tusk.createElement("div", { editable: true }, "Hello World");
    // Or call tusk directly
    let vNode = tusk("div", { editable: true }, "Hello World");

    // Render to string on the server.
    vNode.toString(); // '<div editable="true">Hello World</div>';

    /**
     * @params type can also be an object with a render function (shown in example above).
     */
    ```

---

### Contributions

* Use gulp to run tests.

Please feel free to create a PR!
