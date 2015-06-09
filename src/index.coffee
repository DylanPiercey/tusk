isDOM = require("is-dom")
Node  = require("./node")
{ getRoot, getDiff, flatten } = require("./util")

# Store dom and root nodes.
cache  = node: [], entity: []
# Store current frames.
frames = {}

module.exports =
	###
	# Utility to create virtual elements.
	# If the given node is a string then the resulting virtual node will be an html element with a tagname of that string.
	# 	IE: "div" -> <div></div>
	#
	# @param {String|Function} node
	# @param {Object} props
	# @param {Array} children
	# @returns {Node|NodeList}
	###
	createElement: (node, props = {}, children...)->
		switch typeof node
			when "function"
				attrs    = {}
				events   = {}
				children = flatten(children)
				# Separate attrs from events and sanatize them.
				for key, val of props
					if key[0...2] is "on" then events[getEvent(key)] = val
					else attrs[key] = val
				node({ attrs, events, children })
			when "string" then new Node(node, props, children)
			else throw new Error("Tusk: Invalid virtual node type.")

	###
	# Render a virtual node into the document.
	#
	# @param {Node} node
	# @param {HTMLEntity} entity
	###
	render: (node, entity)->
		throw new Error("Tusk: A virtual node is required.") unless node instanceof Node
		throw new Error("Tusk: Container must be a DOM element.") unless isDOM(entity)
		raf      = require("component-raf")
		index    = cache.entity.indexOf(entity)

		# Check if this entity has been rendered into before.
		if -1 is index
			root     = getRoot(entity)
			curHTML  = String(node)
			prevHTML = root?.outerHTML

			# Attempt to see if we can bootstrap off of existing dom.
			unless curHTML is prevHTML
				if prevHTML?
					[server, client] = getDiff(prevHTML, curHTML)
					console.warn("""
						Tusk: Could not bootstrap document, existing html and virtual html do not match.

						Server:
						#{server}

						Client:
						#{client}
					""")
				entity.innerHTML = curHTML
				root             = getRoot(entity)
			node.bootstrap(root)
			return this

		# Ensure that only the most recent frame is ever ran.
		raf.cancel(frames[index]) if frames[index]?
		frames[index] = raf(->
			delete frames[index]
			cache.node[index].update(node)
		)
		return this
