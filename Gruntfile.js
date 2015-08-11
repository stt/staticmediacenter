module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    cssmin: {
      dist: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'build/style.css': [ 'src/*.css' ]
        }
      }
    },
    uglify: {
      dist: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        files: {
          'build/index.js': ['src/index.js']
        }
      }
    },
    htmlmin: {
      dist: {
         options: {
           removeComments: true,
           collapseWhitespace: true
         },
         files: {
           'build/index.min.html': 'src/index.html'
         }
       }
    },
    comboall: {
      dist: {
        files: {
          'index.html': ['build/index.min.html'],
        },
      }
    },
    clean: ['build']
  });

  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-combo-html-css-js');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.registerTask('default', ['cssmin','uglify','htmlmin', 'comboall', 'clean']);
  grunt.registerTask('build', ['cssmin','uglify','htmlmin', 'comboall']);
};
