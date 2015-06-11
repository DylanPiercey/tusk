# @cjsx tusk
should  = require("should")
details = require("../package.json")
tusk    = require("../src/index")
Node    = require("../src/node.coffee")

describe "#{details.name}@#{details.version} - Node", ->
	require("mocha-jsdom")()

	describe "Virtual node", ->
		it "should be able to create", ->
			node = <div/>
			node.should.have.properties(
				type: "div"
			)

		it "should be able to set attributes", ->
			node = <div test={ true }/>
			node.should.have.properties(
				type: "div"
				attrs: test: "true"
			)

		it "should add children", ->
			node = <div>{ [1, 2, 3] }</div>
			node.should.have.properties(
				type:  "div"
				children: ["1", "2", "3"]
			)

	describe "Document node", ->
		it "should be able to create", ->
			node = <div/>
			node.create().should.have.properties(
				nodeName:  "DIV"
				outerHTML: '<div></div>'
			)

		it "should be able to set attributes", ->
			node = <div test={ true }/>
			node.create().should.have.properties(
				nodeName:  "DIV"
				outerHTML: '<div test="true"></div>'
			)

		it "should add children", ->
			node = <div>{ [1, 2, 3] }</div>
			node.create().should.have.properties(
				nodeName:  "DIV"
				outerHTML: '<div>123</div>'
			)

		it "should be able to update", ->
			parent = document.createElement("div")
			node = <div test={ 1 }>content</div>
			parent.appendChild(node.create())
			parent.should.have.properties(
				innerHTML: '<div test="1">content</div>'
			)

			# Update tag name.
			node.update(<span test={ 4 }>updated</span>)
			parent.should.have.properties(
				innerHTML: '<span test="4">updated</span>'
			)

			# Update attrs.
			node.update(<div test={ 2 }>content</div>)
			parent.should.have.properties(
				innerHTML: '<div test="2">content</div>'
			)

			# Update children.
			node.update(<div test={ 3 }>updated</div>)
			parent.should.have.properties(
				innerHTML: '<div test="3">updated</div>'
			)
