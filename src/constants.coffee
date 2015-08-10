module.exports =
	###
	# @description
	# The key used to attach data to the dom.
	#
	# @private
	###
	NODE: "__node__"
	###
	# @description
	# List of supported html namespaces.
	#
	# @private
	###
	NAMESPACES:
		HTML:    "http://www.w3.org/1999/xhtml"
		MATH_ML: "http://www.w3.org/1998/Math/MathML"
		SVG:     "http://www.w3.org/2000/svg"
	###
	# @description
	# List of html tags that are self closing.
	#
	# @private
	###
	SELF_CLOSING: [
		"area",
		"base",
		"br",
		"col",
		"command",
		"embed",
		"hr",
		"img",
		"input",
		"keygen",
		"link",
		"meta",
		"param",
		"source",
		"track",
		"wbr"
	]
	###
	# @description
	# List of events that are supported by tusk.
	#
	# @private
	###
	EVENTS: [
		"animationend",
		"animationiteration",
		"animationstart",
		"beforeunload",
		"blur",
		"canplay",
		"canplaythrough",
		"change",
		"click",
		"contextmenu",
		"copy",
		"cut",
		"dblclick",
		"dismount",
		"drag",
		"dragend",
		"dragenter",
		"dragexit",
		"dragleave",
		"dragover",
		"dragstart",
		"drop",
		"durationchange",
		"emptied",
		"ended",
		"focus",
		"fullscreenchange",
		"input",
		"keydown",
		"keypress",
		"keyup",
		"mount",
		"mousedown",
		"mouseenter",
		"mouseleave",
		"mousemove",
		"mouseout",
		"mouseover",
		"mouseup",
		"paste",
		"pause",
		"play",
		"playing",
		"progress",
		"ratechange",
		"reset",
		"scroll",
		"seeked",
		"seeking",
		"select",
		"stalled",
		"submit",
		"suspend",
		"timeupdate",
		"touchcancel",
		"touchend",
		"touchmove",
		"touchstart",
		"transitionend",
		"visibilitychange",
		"volumechange",
		"waiting",
		"wheel"
	]
