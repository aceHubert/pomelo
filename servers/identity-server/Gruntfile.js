module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-babel');

  const lessOptions = {
    javascriptEnabled: true,
    paths: [],
    plugins: [
      new (require('less-plugin-autoprefix'))({ browsers: ['> 1%', 'last 2 versions', 'not ie <= 8'] }),
      new (require('less-plugin-clean-css'))({ compatibility: 'ie9,-properties.merging' }),
    ],
    modifyVars: {},
    banner: `/*!<%= pkg.name %> V<%= pkg.version %> | <%= pkg.license %> License */\n`,
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    babel: {
      production: {
        options: {
          minified: true,
          sourceMap: true,
          comments: false,
          presets: ['@babel/preset-env'],
        },
        files: {
          './public/js/globals.min.js': './public/js/globals.js',
          './public/js/login.min.js': './public/js/login.js',
          './public/js/password.min.js': './public/js/password.js',
        },
      },
    },
    less: {
      development: {
        options: Object.assign({}, lessOptions, {
          plugins: [new (require('less-plugin-autoprefix'))({ browsers: ['last 2 versions'] })],
        }),
        files: {
          './public/style/bootstrap-theme.css': './public/style/bootstrap-theme.less',
          './public/style/container.css': './public/style/container.less',
          './public/style/index.css': './public/style/index.less',
          './public/style/login.css': './public/style/login.less',
          './public/style/password.css': './public/style/password.less',
        },
      },
      production: {
        options: lessOptions,
        files: {
          './public/style/bootstrap-theme.min.css': './public/style/bootstrap-theme.less',
          './public/style/container.min.css': './public/style/container.less',
          './public/style/index.min.css': './public/style/index.less',
          './public/style/login.min.css': './public/style/login.less',
          './public/style/password.min.css': './public/style/password.less',
        },
      },
    },
    watch: {
      scripts: {
        files: ['./public/**/*.js', '!./public/**/*.min.js'],
        tasks: ['babel'],
      },
      styles: {
        files: ['./public/**/*.less'],
        tasks: ['less'],
      },
    },
  });

  grunt.registerTask('default', ['babel', 'less']);

  grunt.registerTask('dev', ['default', 'watch']);
};
