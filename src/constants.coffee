module.exports =
	###
	# @private
	# @description
	# The key used to attach data to the dom.
	###
	NODE: "__node__"
	###
	# @private
	# @description
	# List of supported html namespaces.
	###
	NAMESPACES:
		HTML:    "http://www.w3.org/1999/xhtml"
		MATH_ML: "http://www.w3.org/1998/Math/MathML"
		SVG:     "http://www.w3.org/2000/svg"
	###
	# @private
	# @description
	# List of html tags that are self closing.
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
	# @private
	# @description
	# List of events that are supported by tusk.
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
