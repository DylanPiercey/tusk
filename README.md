# TUSK

A lightweight viritual-dom with a friendly interface.

[![Join the chat at https://gitter.im/DylanPiercey/tusk](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/DylanPiercey/tusk?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
[![npm](https://img.shields.io/npm/dm/tusk.svg)](https://www.npmjs.com/package/tusk)

# Why
Many virtual-dom implementations are bulky and are not optimized for server side rendering.
Currently this is experimental and should not be used in production.

* Lightweight.
* Supports JSX.
* Zero assumptions.

# Installation

#### Npm
```console
npm install tusk
```

# Example

```javascript
/** @jsx tusk */
let tusk = require('tusk');

let MyInput = {
    handleClick(e, component, setState) {
        alert(e.target.value);
    },

    render(component, setState) {
        let { attrs, events, children } = component;
        return (
            <input type={ attrs.type } onClick={ MyInput.handleClick }/>
        }
    }
};

// Render into the browser.
tusk.render(<MyInput type="text"/>, document.body);

// Render into a string.
let HTML = String(<MyInput type="text"/>)
```

# API
+ **render(component, HTMLEntity)** : Bootstrap or update a virtual `component` inside of an `HTML Entity`.

    ```javascript
    tusk.render(<div>Hello World</div>, document.body);
    ```

+ **createElement(type, props, children...)** : Create a virtual node/component (Automatically called when using JSX).

    ```javascript
    let vNode = tusk.createElement("div", { editable: true }, "Hello World");
    vNode.toString(); // '<div editable="true">Hello World</div>';

    /**
     * @params type can also be an object with a render function (shown in example above).
     */
    ```

---

### Contributions

* Use gulp to run tests.

Please feel free to create a PR!
