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
		attrs[key] ?= val for key, val of @type.defaultAttrs
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
			@_node = @_node.update(@type.render(@ctx))
		)

	###
	# Utility to get a virtual node for this component.
	# @api private
	###
	render: ->
		# A component only gets state when it's rendered for the first time.
		@ctx.state ?= @type.initialState?(@ctx)
		# Create virtual node.
		@_node = @type.render(@ctx)

	###
	# Render component and defer bootstrap to virtual node.
	#
	# @param {HTMLElement} elem
	# @api private
	###
	mount: (elem)->
		@render() unless @_node
		@type.beforeMount?(@ctx)
		@_node.mount(elem)
		elem[COMPONENT] = @
		@type.afterMount?(@ctx, @setState, elem)
		elem

	###
	# Render component and defer create to virtual node.
	#
	# @return HTMLElement
	# @api private
	###
	create: ->
		@render() unless @_node
		@type.beforeMount?(@ctx)
		elem = @_node.create()
		elem[COMPONENT] = @
		@type.afterMount?(@ctx, @setState, _elem)
		elem

	###
	# Given a different virtual node it will compare the nodes an update the real node accordingly.
	#
	# @param {Virtual} updated
	# @return {Virtual}
	# @api private
	###
	update: (updated)->
		# Update components of the same type by simply passing along state.
		if updated.type is @type
			# Allow for the user to decide if a component should actually update.
			return @ if "shouldUpdate" of @type and not @type.shouldUpdate(@ctx, updated.ctx)
			# Allow before update actions.
			@type.beforeUpdate?(@ctx, updated.ctx)
			updated._node = @_node
			updated.setState(@ctx.state)
			@_node._elem[COMPONENT] = updated
			# Allow post update actions.
			@type.afterUpdate?(updated.ctx, @ctx, updated.setState)
		# If updated is not a component then defer to virtual node.
		else
			delete @_node._elem[COMPONENT]
			@_node.update(updated)

		delete @_node
		updated

	###
	# Defer removal to virtual node.
	#
	# @api private
	###
	remove: ->
		@type.beforeUnmount?(@ctx, @_node._elem)
		@_node.remove()
		delete @_node._elem[COMPONENT]
		delete @_node

	###
	# Render component and get it's string value.
	#
	# @return {String}
	# @api public
	###
	toString: ->
		@type.beforeMount?(@ctx)
		@render() unless @_node
		@_node.toString()

module.exports  = Component
