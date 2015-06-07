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
# Render a virtual node onto a real document node.
#
# @param {HTMLEntity} htmlEntity
# @param {Node} node
###
module.exports = (node, htmlEntity)->
	raf   = require("component-raf")
	index = cache.entity.indexOf(htmlEntity)
	id    = (
		if index is -1 then cache.entity.length
		else index
	)

	# Ensure that only the most recent frame is ever ran.
	raf.cancel(frames[id]) if frames[id]?
	frames[id] = raf(->
		delete frames[id]
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
				if root.outerHTML.length
					[server, client] = getDifference(root.outerHTML, html)
					console.warn("""
						Tusk: Could not bootstrap document, existing html and virtual html do not match.

						Server:
						#{server}

						Client:
						#{client}
					""")
				htmlEntity.innerHTML = html
			node.bootstrap(root)
			return

		cache.node[index].update(node)
	)
