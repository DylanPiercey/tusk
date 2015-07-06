Text                          = require("./virtual/text")
Node                          = require("./virtual/node")
Component                     = require("./virtual/component")
{ getRoot, getDiff, flatten } = require("./util")
{ SELF_CLOSING, BROWSER }     = require("./constants")

if BROWSER
	raf   = require("component-raf")
	isDOM = require("is-dom")
	# Bootstrap event listeners.
	require("./delegator")
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
	# @param {String|Function} type
	# @param {Object} props
	# @param {Array} children
	# @returns {Promise}->{Node}
	# @api public
	###
	createElement: (type, props = {}, children...)->
		# Separate attrs from events.
		attrs  = {}
		events = {}
		for key, val of props
			unless key[0...2] is "on" then attrs[key] = val
			else events[key[2..].toLowerCase()] = val

		# Flatten children if needed.
		children = (
			if type in SELF_CLOSING then []
			else flatten(children)
		)

		# Create node based on type.
		switch typeof type
			when "object" then new Component(type, attrs, events, children)
			when "string" then new Node(type, attrs, events, children)
			else new Error("Tusk: Invalid virtual node type.")

	###
	# Render a virtual node into the document.
	#
	# @param {Node} node
	# @param {HTMLEntity} entity
	# @api public
	###
	render: (node, entity)->
		throw new Error("Tusk: Cannot render on the server (use toString).") unless BROWSER
		throw new Error("Tusk: Container must be a DOM element.") unless isDOM(entity)
		throw new Error("Tusk: A virtual node is required.") unless node?.isTusk
		index = cache.entity.indexOf(entity)

		# Check if this entity has been rendered into before.
		if index is -1
			root     = getRoot(entity)
			curHTML  = String(node)
			prevHTML = root?.outerHTML
			cache.entity.push(entity)
			cache.node.push(node)

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
			node.mount(root)

		# Update the cached node and discard it.
		else
			raf.cancel(frames[index]) if frames[index]?
			frames[index] = raf(->
				delete frames[index]
				cache.node[index] = cache.node[index].update(node)
			)

		return this
