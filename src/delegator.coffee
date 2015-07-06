{ NODE, COMPONENT, EVENTS } = require("./constants")

###
# Handle and delegate global events.
###
handleEvent = (e)->
	{ target, type } = e
	# stopPropagation() fails to set cancelBubble to true in Webkit
	# @see http://code.google.com/p/chromium/issues/detail?id=162270
	e.stopPropagation = -> e.cancelBubble = true
	eventPath         = []
	handlers          = []

	# Get the full path to scan through for the event.
	loop
		eventPath.push(target)
		break unless document.body is target = target.parentNode

	# Find the components for each handler.
	for elem in eventPath
		component = elem[COMPONENT] if elem[COMPONENT]
		handler   = elem[NODE]?.events[type]
		handlers.push([handler, elem, component]) if handler

	# Dispatch events to registered handlers.
	for [handler, elem, { ctx, setState }] in handlers by -1
		e.currentTarget = elem
		e.preventDefault() if handler(e, ctx, setState) is false
		break if e.cancelBubble

	return

###
# Attach all event listeners to the dom for delegation.
###
document.body.addEventListener(eventType, handleEvent, true) for eventType in EVENTS
