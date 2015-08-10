# @cjsx tusk
assert    = require("assert")
immstruct = require("immstruct")
details   = require("../package.json")
tusk      = require("../src/index")
delegate  = require("../src/delegator")

describe "#{details.name}@#{details.version} - Function", ->
	require("mocha-jsdom")() if typeof document is "undefined"

	# Re Initialize events before each test (mocha-jsdom resets them).
	beforeEach -> delegate.init()

	describe "Virtual component", ->
		it "should be able to create", ->
			ChildComponent = (props, children)->
				<h1>{ for child, i in children
					child.attrs.class = "child-#{i}"
					child
				}</h1>

			MyComponent = ({ value }, children)->
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

		it "should be able to set a context", ->
			MyComponent = (props, children, context)->
				<div>{ context }</div>

			assert.equal(tusk.with(1, -> <MyComponent/>), "<div>1</div>")

	describe "Document Component", ->
		it "should render with immutable state", ->
			struct = immstruct({ i: 0 })

			MyCounter = ({ message, cursor }, children)->
				handleClick = ->
					cursor.update((state)->
						state.set("i", state.get("i") + 1)
					)

				<button onClick={ handleClick }>
					{ message } : { cursor.get('i') }
				</button>

			MyCounter.onMount = (e)->


			document.body.innerHTML = <MyCounter message="Times clicked" cursor={ struct.cursor() }/>

			render = ->
				tusk.render(document.body.firstChild,
					<MyCounter message="Times clicked" cursor={ struct.cursor() }/>
				)

			render()
			struct.on("swap", render)
			document.body.firstChild.click() for i in [0...5]

			assert.equal(document.body.innerHTML, "<button>Times clicked : 5</button>")

		it "should trigger mount and dismount with owner change", (done)->
			ComponentA = ->
				<div onDismount={ -> done() }/>

			ComponentB = ->
				<div/>

			elem = document.createElement("div")
			document.body.appendChild(elem)

			tusk.render(elem, <ComponentA/>)
			tusk.render(elem, <ComponentB/>)
