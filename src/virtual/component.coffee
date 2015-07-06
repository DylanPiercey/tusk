{ flatten }            = require("../util")
{ COMPONENT, BROWSER } = require("../constants")
raf                    = require("component-raf") if BROWSER

class Component
	isTusk: true

	###
	# Creates a virtual component that will maintain a virtual node and some state.
	# @param {Function|Object} type
	# @param {Object} attrs
	# @param {Object} events
	# @param {Array} children
	# @constructor
	###
	constructor: (@type, attrs, events, children)->
		throw new Error("Tusk: Component must have a render function.") unless typeof @type.render is "function"
		@key = attrs.key or null; delete attrs.key
		@ctx = { @type, attrs, events, children }

	###
	# Utility to update the component's state and it's virtual node.
	#
	# @param {Object} state
	# @api public
	###
	setState: (state)=>
		# Replace state if this component was never rendered.
		unless @ctx.state then @ctx.state = state
		# Merge on a new state.
		else @ctx.state[key] = val for key, val of state

		# Ensure only the latest state update is rendered (All state changes are applied virtually).
		raf.cancel(@frame) if @frame?
		@frame = raf(=>
			delete @frame
			# Render with new state.
			@_node = @_node.update(@type.render(@ctx, @setState))
		)
		return

	###
	# Utility to get a virtual node for this component and optionally update it's state.
	# @api private
	###
	render: ->
		# If we don't have state then we will find it.
		@ctx.state ?= @type.initialState?(@ctx) or {}
		# Create virtual node.
		@_node = @type.render(@ctx, @setState)
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
		@_element = @_node._element
		@_element[COMPONENT] = @
		return

	###
	# Render component and defer create to virtual node.
	#
	# @return HTMLElement
	# @api private
	###
	create: ->
		@render() unless @_node
		@_node.create()
		@_element = @_node._element
		@_element[COMPONENT] = @
		return

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
			updated.setState(@ctx.state)
			@_element[COMPONENT] = updated
		# If updated is not a component then defer to virtual node.
		else
			@_node.update(updated)
			@_element[COMPONENT] = null

		@_element            = null
		@_node               = null
		return updated

	###
	# Defer removal to virtual node.
	#
	# @api private
	###
	remove: ->
		@_node?.remove()
		@_element[COMPONENT] = null
		@_element            = null
		@_node               = null
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
