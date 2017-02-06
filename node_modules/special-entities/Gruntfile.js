module.exports = function(grunt) {

	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		clean: [ "dist/*.js" ],
		browserify: {
			dist: {
				src: "lib/index.js",
				dest: "dist/special-entities.js",
				options: {
					browserifyOptions: { standalone: "Entities" }
				}
			}
		},
		wrap2000: {
			dist: {
				src: 'dist/special-entities.js',
				dest: 'dist/special-entities.js',
				options: {
					header: "/*\n * Special Entities\n * (c) 2014 Beneath the Ink, Inc.\n * MIT License\n * Version <%= pkg.version %>\n */\n"
				}
			}
		},
		uglify: {
			dist: {
				src: "dist/special-entities.js",
				dest: "dist/special-entities.min.js"
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-wrap2000');

	grunt.registerTask('default', [ 'clean', 'browserify', 'wrap2000', 'uglify' ]);

}
