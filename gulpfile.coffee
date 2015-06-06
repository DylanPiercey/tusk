fs         = require("fs")
gulp       = require("gulp")
header     = require("gulp-header")
coffee     = require("gulp-cjsx")
mocha      = require("gulp-mocha")
details    = require("./package.json")
src        = "./src"
lib        = "./lib"

try fs.mkdirSync(__dirname + lib)

###
Build all local cs.
###
gulp.task("build", ->
	gulp.src("#{src}/**/*.coffee")
		.pipe(coffee(bare: true, join: true).on("error", handleError = (err)->
			console.log(err.toString())
			console.log(err.stack)
			this.emit("end")
		))
		.pipe(header("/** #{details.name} v#{details.version} https://www.npmjs.com/package/#{details.name}*/\n"))
		.pipe(gulp.dest(lib))
)

###
Run tests.
###
gulp.task("test", ->
	gulp.src("./test/**/*Test.coffee", read: false)
		.pipe(mocha())
)
