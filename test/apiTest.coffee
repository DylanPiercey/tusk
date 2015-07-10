# @cjsx tusk
assert  = require("assert")
details = require("../package.json")

describe "#{details.name}@#{details.version} - API", ->
	require("mocha-jsdom")() if typeof document is "undefined"

	tusk           = null
	before -> tusk = require("../src/index")

	describe "Virtual component", ->
		it "should be able to create", ->
			ChildComponent =
				render: ({ attrs, children })->
					<h1>{for key, child of children
						child.attrs.class = "child-#{key}"
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
				initialState: ->
					i: 0
				render: ({ state }, setState)->
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
			MyComponent =
				initialState: ->
					i: 0

				handleClick: (e, { state }, update)->
					update(i: ++state.i)

				render: ({ state })->
					<div onClick={ MyComponent.handleClick }>
						{ state.i }
					</div>

			root = document.createElement("div")
			root.innerHTML = String(<MyComponent/>)
			elem = root.childNodes[0]
			tusk.render(<MyComponent/>, root)
			document.body.appendChild(root)

			elem.click() for i in [0...5]

			setTimeout(->
				assert.equal(root.innerHTML, "<div>5</div>")
				done()
			, 10)

		it "should listen for events", (done)->
			eventType = eventComp = null

			MyComponent =
				handleClick: ->
					[{ type: eventType }, { type: eventComp }] = arguments
					return

				render: ->
					<div onClick={ MyComponent.handleClick }/>

			root = document.createElement("div")
			root.innerHTML = String(<MyComponent/>)
			elem = root.childNodes[0]
			tusk.render(<MyComponent/>, root)
			document.body.appendChild(root)
			elem.click()

			setTimeout(->
				assert.equal(eventType, "click")
				assert.equal(MyComponent, eventComp)
				done()
			, 10)
