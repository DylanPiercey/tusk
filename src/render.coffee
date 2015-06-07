renderToString = require("./renderToString")

# Store dom and root nodes.
cache  = node: [], entity: []
frames = {}

###
# Returns a chunk surrounding the difference between two strings, useful for debugging.
#
# @param {String} a
# @param {String} b
# @returns {Array<String>}
###
getDifference = (a, b)->
	break for char, i in a when char isnt b[i]
	start = Math.max(0, i - 20)
	end   = start + 80

	[
		a[start...Math.min(end, a.length)]
		b[start...Math.min(end, b.length)]
	]

###
# Returns the root node for an element (this is different for root entity).
#
# @params {HTMLEntity} entity
# @returns {HTMLEntity}
###
getRoot = (entity)->
	if entity.tagName is "HTML" then entity
	else entity.childNodes[0]


###
# Render a virtual node onto a real document node.
#
# @param {HTMLEntity} htmlEntity
# @param {Node} node
###
module.exports = (node, htmlEntity)->
	raf   = require("component-raf")
	index = cache.entity.indexOf(htmlEntity)

	# Chech if this node has been rendered before, if not then attempt to bootstrap.
	if -1 is index
		cache.node.push(node)
		cache.entity.push(htmlEntity)
		html = renderToString(node)
		root = getRoot(htmlEntity)

		# Attempt to see if we can bootstrap off of existing dom.
		unless html is root?.outerHTML
			if root?
				[server, client] = getDifference(root.outerHTML, html)
				console.warn("""
					Tusk: Could not bootstrap document, existing html and virtual html do not match.

					Server:
					#{server}

					Client:
					#{client}
				""")
			htmlEntity.innerHTML = html
		node.bootstrap(getRoot(htmlEntity))
		return

	# Ensure that only the most recent frame is ever ran.
	raf.cancel(frames[index]) if frames[index]?
	frames[index] = raf(->
		delete frames[index]
		cache.node[index].update(node)
	)
	return
