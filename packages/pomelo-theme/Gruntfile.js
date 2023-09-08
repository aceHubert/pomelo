const packageJson = require('./package.json');

module.exports = function (grunt) {
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
    banner: `/*! ${packageJson.name} v${packageJson.version} | ${packageJson.license} License */\n`,
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
  });

  grunt.registerTask('default', [
    'copy:lib',
    'less:development@light',
    'less:development@dark',
    'less:production@light',
    'less:production@dark',
  ]);
};
