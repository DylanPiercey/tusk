# @cjsx tusk
should  = require("should")
details = require("../package.json")
tusk    = require("../src/index")

describe "#{details.name}@#{details.version} - Node", ->
	require("co-mocha")
	require("mocha-jsdom")()

	describe "Virtual node", ->
		it "should be able to create", ->
			node = yield <div/>
			node.should.have.properties(
				type: "div"
			)

		it "should be able to set attributes", ->
			node = yield <div test={ true }/>
			node.should.have.properties(
				type: "div"
				attrs: test: "true"
			)

		it "should add children", ->
			node = yield <div>{ [1, 2, 3] }</div>

			node.should.have.properties(
				type:  "div"
			)
			node.children.should.have.a.lengthOf(3)

		it "should set innerHTML", ->
			node = yield <div innerHTML="<span></span>"/>

			node.should.have.properties(
				type: "div"
				innerHTML: "<span></span>"
			)
			node.toString().should.equal("<div><span></span></div>")


	describe "Document node", ->
		it "should be able to create", ->
			node = yield <div/>
			node.create().should.have.properties(
				nodeName:  "DIV"
				outerHTML: '<div></div>'
			)

		it "should be able to set attributes", ->
			node = yield <div test={ true }/>
			node.create().should.have.properties(
				nodeName:  "DIV"
				outerHTML: '<div test="true"></div>'
			)

		it "should add children", ->
			node = yield <div>{ [1, 2, 3] }</div>
			node.create().should.have.properties(
				nodeName:  "DIV"
				outerHTML: '<div>123</div>'
			)

		it "should set innerHTML", ->
			node = yield <div innerHTML="<span></span>"/>
			node.create().should.have.properties(
				nodeName:  "DIV"
				outerHTML: '<div><span></span></div>'
			)

		it "should be able to update", ->
			parent = document.createElement("div")
			node = yield <div test={ 1 }>content</div>
			parent.appendChild(node.create())
			parent.should.have.properties(
				innerHTML: '<div test="1">content</div>'
			)

			# Update tag name.
			node = node.update(yield <span test={ 1 }>content</span>)
			parent.should.have.properties(
				innerHTML: '<span test="1">content</span>'
			)

			# Update attrs.
			node = node.update(yield <span test={ 2 }>content</span>)
			parent.should.have.properties(
				innerHTML: '<span test="2">content</span>'
			)

			# Update children.
			node = node.update(yield <span test={ 2 }>updated</span>)
			parent.should.have.properties(
				innerHTML: '<span test="2">updated</span>'
			)
