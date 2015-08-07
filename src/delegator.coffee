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
	# stopPropagation() fails to set cancelBubble to true in Webkit
	# @see http://code.google.com/p/chromium/issues/detail?id=162270
	e.stopPropagation = -> e.cancelBubble = true
	# Dispatch events to registered handlers.
	while target
		e.currentTarget = target
		node            = target[NODE]
		target          = target.parentNode
		e.preventDefault() if node?.events[type]?(e) is false
		break if e.cancelBubble or not e.bubbles
	return

###
# @description
# Attach all event listeners to the dom for delegation.
#
# @private
###
module.exports = ->
	# Skip this if we are not in the browser.
	return if typeof document is "undefined"
	# Attach all events at the root level for delegation.
	document.addEventListener(type, handleEvent, true) for type in EVENTS
	return
