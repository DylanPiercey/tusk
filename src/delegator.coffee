{ NODE, EVENTS } = require("./constants")

###
# @description
# Handle and delegate global events.
#
# @param {Event} e - The DOM event being handled.
# @private
###
handleEvent = (e)->
	{ target, type } = e
	# Events are case insensitive in tusk.
	type = type.toLowerCase()

	# stopPropagation() fails to set cancelBubble to true in Webkit
	# @see http://code.google.com/p/chromium/issues/detail?id=162270
	e.stopPropagation = -> e.cancelBubble = true

	# This allows us to ignore the default browser handling of current target.
	# The browser has no idea which virtual elements are being delegated too.
	Object.defineProperty(e, "currentTarget",
		value:    if e.bubbles then target else undefined
		writable: true
	)

	# Dispatch events to registered handlers.
	while target
		e.currentTarget = target
		node            = target[NODE]
		target          = target.parentNode
		node?.events[type]?(e)
		break if e.cancelBubble or not e.bubbles
	return

module.exports =
	###
	# Utility to create, cache and dispatch an event on a given element.
	#
	# @param {String} name
	# @param {HTMLEntity} elem
	# @param {Boolean} bubble
	###
	dispatch: (name, elem, bubbles = false)->
		e = document.createEvent("Event")
		e.initEvent(name, bubbles, false)
		Object.defineProperties(e,
			target: value: elem
			srcElement: value: elem
		)
		handleEvent(e)
		return

	###
	# @description
	# Attach all event listeners to the dom for delegation.
	#
	# @private
	###
	init: ->
		return if document.__tusk
		# Attach all events at the root level for delegation.
		document.addEventListener(type, handleEvent, true) for type in EVENTS
		document.__tusk = true
		return
