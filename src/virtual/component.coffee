{ flatten } = require("../util")

class Component
	isTusk: true

	###
	# Creates a virtual component that will maintain a virtual node and some state.
	# @param {Function|Object} type
	# @param {Object} props
	# @param {Array} children
	# @constructor
	###
	constructor: (@type, props, children)->
		throw new Error("Tusk: Component must have a render function.") unless typeof @type.render is "function"
		@attrs    = {}
		@events   = {}
		@children = flatten(children)

		# Separate attrs from events.
		for key, val of props
			unless key[0...2] is "on" then @attrs[key] = val
			else @events[key[2..].toLowerCase()] = val

	###
	# Utility to lazily bundle the context of the component.
	#
	# @return {Object}
	# @api private
	###
	getCtx: ->
		{ @attrs, @events, @children, @state }

	###
	# Utility to update the component's state and it's virtual node.
	#
	# @param {Object} state
	# @api public
	###
	setState: (state)=>
		# Replace state if this component was never rendered.
		unless @state then @state = state
		# Merge on a new state.
		else @state[key] = val for key, val of state
		# Render with new state.
		@_node = @_node.update(@type.render(@getCtx(), @setState))
		return

	###
	# Utility to get a virtual node for this component and optionally update it's state.
	# @api private
	###
	render: ->
		# If we don't have state then will will find it.
		@state ?= @type.initialState?() or {}
		# Create virtual node.
		@_node = @type.render(@getCtx(), @setState)
		return

	###
	# Render component and defer bootstrap to virtual node.
	#
	# @param {HTMLElement} element
	# @api private
	###
	mount: (element)->
		@render() unless @_node
		@_node.mount(element)

	###
	# Render component and defer create to virtual node.
	#
	# @return HTMLElement
	# @api private
	###
	create: ->
		@render() unless @_node
		@_node.create()

	###
	# Given a different virtual node it will compare the nodes an update the real node accordingly.
	#
	# @param {Virtual} updated
	# @return {Virtual}
	# @api private
	###
	update: (updated)->
		# Update to another components render passinf along state if the components share type.
		if updated instanceof Component
			updated._node = @_node
			updated.setState(@state)
		# If updated is not a component then defer to virtual node.
		else @_node.update(updated)

		@_node = null
		return updated

	###
	# Defer removal to virtual node.
	#
	# @api private
	###
	remove: ->
		@_node?.remove()
		@_node = null
		return

	###
	# Render component and get it's string value.
	#
	# @return {String}
	# @api public
	###
	toString: ->
		@render() unless @_node
		@_node.toString()

module.exports  = Component
