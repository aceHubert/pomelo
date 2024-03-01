module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-copy');

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
    less: {
      'development@light': {
        options: Object.assign({}, lessOptions, {
          plugins: [new (require('less-plugin-autoprefix'))({ browsers: ['last 2 versions'] })],
        }),
        files: {
          './dist/index.css': './src/default.less',
        },
      },
      'development@dark': {
        options: Object.assign({}, lessOptions, {
          plugins: [new (require('less-plugin-autoprefix'))({ browsers: ['last 2 versions'] })],
        }),
        files: {
          './dist/dark.css': './src/dark.less',
        },
      },
      'production@light': {
        options: lessOptions,
        files: {
          './dist/index.min.css': './src/default.less',
        },
      },
      'production@dark': {
        options: lessOptions,
        files: {
          './dist/dark.min.css': './src/dark.less',
        },
      },
    },
    copy: {
      lib: {
        files: [{ expand: true, cwd: './src/', src: ['**'], dest: 'lib/' }],
      },
    },
    watch: {
      dist: {
        files: ['./src/**/*.less'],
        tasks: ['less'],
      },
      lib: {
        files: ['./src/**'],
        tasks: ['copy'],
      },
    },
  });

  grunt.registerTask('default', ['less', 'copy']);

  grunt.registerTask('dev', ['default', 'watch']);
};
