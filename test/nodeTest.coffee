# @cjsx tusk
assert  = require("assert")
details = require("../package.json")
tusk    = require("../src/index")

describe "#{details.name}@#{details.version} - Node", ->
	require("mocha-jsdom")() if typeof window is "undefined"

	describe "Virtual node", ->
		it "should be able to create", ->
			node = <div/>
			assert(node.type is "div")

		it "should be able to set attributes", ->
			node = <div test={ true }/>
			assert(node.type is "div")
			assert.deepEqual(node.attrs, test: "true")

		it "should add children", ->
			node = <div>{ [1, 2, 3] }</div>

			assert(node.type is "div")
			assert(node.children.length is 3)

		it "should set innerHTML", ->
			node = <div innerHTML="<span></span>"/>

			assert(node.type is "div")
			assert(node.innerHTML is "<span></span>")
			assert(String(node) is "<div><span></span></div>")

	describe "Document node", ->
		it "should be able to create", ->
			node = <div/>
			elem = node.create()

			assert(elem.nodeName is "DIV")
			assert(elem.outerHTML is "<div></div>")

		it "should be able to set attributes", ->
			node = <div test={ true }/>
			elem = node.create()

			assert(elem.nodeName is "DIV")
			assert(elem.outerHTML is '<div test="true"></div>')

		it "should add children", ->
			node = <div>{ [1, 2, 3] }</div>
			elem = node.create()

			assert(elem.nodeName is "DIV")
			assert(elem.outerHTML is "<div>123</div>")

		it "should set innerHTML", ->
			node = <div innerHTML="<span></span>"/>
			elem = node.create()

			assert(elem.nodeName is "DIV")
			assert(elem.outerHTML is '<div><span></span></div>')

		it "should be able to update", ->
			parent = document.createElement("div")
			node   = <div test={ 1 }>content</div>
			parent.appendChild(node.create())

			assert(parent.innerHTML is '<div test="1">content</div>')

			# Update tag name.
			node = node.update(<span test={ 1 }>content</span>)
			assert(parent.innerHTML is '<span test="1">content</span>')

			# Update attrs.
			node = node.update(<span test={ 2 }>content</span>)
			assert(parent.innerHTML is '<span test="2">content</span>')

			# Update children.
			node = node.update(<span test={ 2 }>updated</span>)
			assert(parent.innerHTML is '<span test="2">updated</span>')
