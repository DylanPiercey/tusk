# @cjsx tusk
assert         = require("assert")
details        = require("../package.json")
tusk           = require("../lib/index")
delegate       = require("../lib/delegator")
{ NAMESPACES } = require("../lib/constants")

describe "#{details.name}@#{details.version} - Node", ->
	require("mocha-jsdom")() if typeof document is "undefined"

	# Re Initialize events before each test (mocha-jsdom resets them).
	beforeEach -> delegate.init()

	describe "Virtual node", ->
		it "should be able to create", ->
			node = <div/>
			assert.equal(node.type, "div")

		it "should be able to set attributes", ->
			node = <div test={ true }/>
			assert.equal(node.type, "div")
			assert.deepEqual(node.attrs, test: true)

		it "should add children", ->
			node = <div>{ [1, 2, 3] }</div>

			assert.equal(node.type, "div")
			assert.equal(Object.keys(node.children).length, 3)

		it "should set innerHTML", ->
			node = <div innerHTML="<span></span>"/>

			assert.equal(node.type, "div")
			assert.equal(node.innerHTML, "<span></span>")
			assert.equal(String(node), "<div><span></span></div>")

		it "should inherit parents namespace", ->
			node = <svg><circle/></svg>
			assert.equal(node.namespaceURI, NAMESPACES.SVG)
			assert.equal(node.children[0].namespaceURI, NAMESPACES.SVG)

	describe "Document node", ->
		it "should be able to create", ->
			node = <div/>
			elem = node.create()

			assert.equal(elem.nodeName, "DIV")
			assert.equal(elem.outerHTML, "<div></div>")

		it "should be able to set attributes", ->
			node = <div test={ true }/>
			elem = node.create()

			assert.equal(elem.nodeName, "DIV")
			assert.equal(elem.outerHTML, '<div test="true"></div>')

		it "should add children", ->
			node = <div>{ [1, 2, 3] }</div>
			elem = node.create()

			assert.equal(elem.nodeName, "DIV")
			assert.equal(elem.outerHTML, "<div>123</div>")

		it "should set innerHTML", ->
			node = <div innerHTML="<span></span>"/>
			elem = node.create()

			assert.equal(elem.nodeName, "DIV")
			assert.equal(elem.outerHTML, '<div><span></span></div>')

		it "should inherit parents namespace", ->
			parent = document.createElement("div")
			node = <svg><circle/></svg>
			elem = node.create()
			assert.equal(elem.namespaceURI, NAMESPACES.SVG)
			assert.equal(elem.firstChild.namespaceURI, NAMESPACES.SVG)

		it "should be able to update", ->
			parent = document.createElement("div")
			node   = <div test={ 1 }>content</div>
			parent.appendChild(node.create())

			assert.equal(parent.innerHTML, '<div test="1">content</div>')

			# Update tag name.
			node = node.update(<span test={ 1 }>content</span>)
			assert.equal(parent.innerHTML, '<span test="1">content</span>')

			# Update attrs.
			node = node.update(<span test={ 2 }>content</span>)
			assert.equal(parent.innerHTML, '<span test="2">content</span>')

			# Update children.
			node = node.update(<span test={ 2 }>updated</span>)
			assert.equal(parent.innerHTML, '<span test="2">updated</span>')

		it "should not update ignored nodes", ->
			parent = document.createElement("div")
			node   = <div ignore test={ 1 }>content</div>
			parent.appendChild(node.create())

			assert.equal(parent.innerHTML, '<div test="1">content</div>')

			# Update tag name.
			node = node.update(<span ignore test={ 1 }>content</span>)
			assert.equal(parent.innerHTML, '<div test="1">content</div>')

			# Update attrs.
			node = node.update(<span ignore test={ 2 }>content</span>)
			assert.equal(parent.innerHTML, '<div test="1">content</div>')

			# Update children.
			node = node.update(<span ignore test={ 2 }>updated</span>)
			assert.equal(parent.innerHTML, '<div test="1">content</div>')

		it "should keep track of keyed nodes", ->
			parent = document.createElement("div")
			node   = (
				<div>
					<div key="0"/>
					<span key="1"/>
					<a key="2"/>
				</div>
			)
			parent.appendChild(node.create())
			initialChildren = [].slice.call(parent.childNodes[0].childNodes)

			node.update(
				<div>
					<span key="1"/>
					<a key="2"/>
					<div key="0"/>
				</div>
			)
			updatedChildren = [].slice.call(parent.childNodes[0].childNodes)

			# Test that no nodes were scrapped, only moved.
			assert.equal(initialChildren[0], updatedChildren[2])
			assert.equal(initialChildren[1], updatedChildren[0])
			assert.equal(initialChildren[2], updatedChildren[1])

		it "should be able to bootstrap existing dom", ->
			div  = document.createElement("div")
			html = div.innerHTML = String(<div/>)
			root = div.childNodes[0]
			tusk.render(div.firstChild, <div/>)

			assert.equal(div.innerHTML, "<div></div>")
			assert(div.childNodes[0] is root)

		it "should listen for events", (done)->
			elem = document.createElement("div")
			document.body.appendChild(elem)
			<div onClick={ -> done() }/>.mount(elem)
			elem.click()

		it "should have a mount event", (done)->
			elem = document.createElement("div")
			document.body.appendChild(elem)
			<div onMount={ -> done() }/>.mount(elem)

		it "should have a dismount event", (done)->
			elem = document.createElement("div")
			document.body.appendChild(elem)
			node = <div onDismount={ -> done() }/>
			node.mount(elem)
			node.update(<span/>)
