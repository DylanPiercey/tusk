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
	while target
		e.currentTarget = target
		node            = target[NODE]
		target          = target.parentNode
		e.preventDefault() if node?.events[type]?(e) is false
		break if e.cancelBubble
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
