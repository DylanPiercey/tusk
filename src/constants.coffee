module.exports =
	NODE:      "__node__"
	COMPONENT: "__component__"
	BROWSER: typeof document isnt "undefined"
	SELF_CLOSING: [
		"area", "base", "br", "col", "command", "embed", "hr", "img", "input",
		"keygen", "link", "meta", "param", "source", "track", "wbr"
	]
	EVENTS: [
		"blur", "change", "click", "contextmenu", "copy", "cut", "dblclick", "drag",
		"dragend", "dragenter", "dragexit", "dragleave", "dragover", "dragstart", "drop",
		"focus", "input", "keydown", "keypress", "keyup", "mousedown", "mouseenter",
		"mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "paste", "scroll",
		"submit", "touchcancel", "touchend", "touchmove", "touchstart", "wheel"
	]
