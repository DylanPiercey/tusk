{ NODE, EVENTS } = require("./constants")

###
# Handle and delegate global events.
###
onEvent = (e)->
	{ target, type } = e
	# stopPropagation() fails to set cancelBubble to true in Webkit
	# @see http://code.google.com/p/chromium/issues/detail?id=162270
	e.stopPropagation = -> e.cancelBubble = true
	# Dispatch events to registered handlers.
	loop
		e.currentTarget = target
		e.preventDefault() if target[NODE]?.events[type](e) is false
		target = target.parentNode
		break if e.cancelBubble or document.body is target
	return

###
# Attach all event listeners to the dom for delegation.
###
module.exports = ->
	# Skip this if we are not in the browser.
	return if typeof document is "undefined"
	# Attach all events at the root level for delegation.
	for type in EVENTS
		document.documentElement.addEventListener(type, onEvent, true)
	return