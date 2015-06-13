# @cjsx tusk
should  = require("should")
details = require("../package.json")
tusk    = require("../src/index")

defer = (val, ms)->
	new Promise((resolve)-> setTimeout((-> resolve(val)), ms))


describe "#{details.name}@#{details.version} - API", ->
	require("mocha-jsdom")()

	describe "Virtual component", ->
		it "should be able to create", ->
			ChildComponent = ({ attrs, children })->
				<h1>{for child, i in children
					child.attrs.class = "child-#{i}"
					child
				}</h1>

			MyComponent = ({ attrs: { value }, children })->
				<div>
					<ChildComponent value={ value * 2}>{for i in [0..value]
						<span>{ i }</span>
					}</ChildComponent>
				</div>


			(yield <MyComponent value={ 5 }/>).toString().should.equal(
				"""
				<div>
					<h1>
						<span class="child-0">0</span>
						<span class="child-1">1</span>
						<span class="child-2">2</span>
						<span class="child-3">3</span>
						<span class="child-4">4</span>
						<span class="child-5">5</span>
					</h1>
				</div>
				""".replace(/\t|\n/g, "")
			)

	describe "Document Component", ->
		it "should be able to bootstrap existing dom", ->
			div  = document.createElement("div")
			html = div.innerHTML = String(yield <div/>)
			root = div.childNodes[0]

			tusk.render(yield <div/>, div)

			div.should.have.properties(
				innerHTML: "<div></div>"
			)

			div.should.have.property("childNodes")
				.with.property("0")
				.equal(root)
