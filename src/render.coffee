renderToString = require("./renderToString")

# Store dom and root nodes.
cache = node: [], entity: []
frame = null

###
# Returns a chunk surrounding the difference between two strings, useful for debugging.
#
# @param {String} a
# @param {String} b
# @returns {Array<String>}
###
getDifference = (a, b)->
	break for char, i in a when char isnt b[i]
	start = Math.min(0, i - 30)
	end   = start + 30

	[
		a[start...Math.max(end, a.length)]
		b[start...Math.max(end, b.length)]
	]

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
		root = (
			if htmlEntity.tagName is "HTML" then htmlEntity
			else htmlEntity.childNodes[0]
		)

		# Attempt to see if we can bootstrap off of existing dom.
		unless html is root.outerHTML
			if htmlEntity.outerHTML.length
				[server, client] = getDifference(root.innerHTML, html)
				console.warn("""
					Tusk: Could not bootstrap document, existing html and virtual html do not match.
					Server: #{server}
					Client: #{client}
				""")
			htmlEntity.innerHTML = html
		node.bootstrap(root)
		return

	# Ensure that only the most recent frame is ever ran.
	raf.cancel(frame) if frame?
	frame = raf(-> cache.node[index].update(node); frame = null)
	return
