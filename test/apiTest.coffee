# @cjsx tusk
assert  = require("assert")
details = require("../package.json")
tusk    = require("../src/index")

describe "#{details.name}@#{details.version} - API", ->
	require("mocha-jsdom")() if typeof window is "undefined"

	describe "Virtual component", ->
		it "should be able to create", ->
			ChildComponent =
				render: ({ attrs, children })->
					<h1>{for child, i in children
						child.attrs.class = "child-#{i}"
						child
					}</h1>

			MyComponent =
				render: ({ attrs: { value }, children })->
					<div>
						<ChildComponent value={ value * 2}>{for i in [0..value]
							<span>{ i }</span>
						}</ChildComponent>
					</div>


			assert.equal(<MyComponent value={ 5 }/>, """
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
			""".replace(/\t|\n/g, ""))

		it "should be able to set initial state", ->
			MyComponent =
				render: ({ state }, setState)->
					state.i ?= 0
					<div>{ state.i }</div>

			assert.equal(<MyComponent/>, "<div>0</div>")

	describe "Document Component", ->
		it "should be able to bootstrap existing dom", ->
			div  = document.createElement("div")
			html = div.innerHTML = String(<div/>)
			root = div.childNodes[0]
			tusk.render(<div/>, div)

			assert.equal(div.innerHTML, "<div></div>")
			assert(div.childNodes[0] is root)

		it "should be able to setState", (done)->
			state = setState = null
			MyComponent =
				handleClick: (setState, state)->->

				render: ->
					[{ state }, setState] = arguments
					state.i ?= 0
					<div onClick={ MyComponent.handleClick(setState, state) }>
						{ state.i }
					</div>

			div  = document.createElement("div")
			html = div.innerHTML = String(<MyComponent/>)
			root = div.childNodes[0]
			tusk.render(<MyComponent/>, div)
			for i in [0...5]
				setState(i: state.i + 1)

			setTimeout(->
				assert.equal(div.innerHTML, "<div>5</div>")
				done()
			, 60)
