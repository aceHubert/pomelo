module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-contrib-less');

  const lessOptions = {
    javascriptEnabled: true,
    paths: [],
    plugins: [
      new (require('less-plugin-npm-import'))({ prefix: '~' }),
      new (require('less-plugin-autoprefix'))({ browsers: ['> 1%', 'last 2 versions', 'not ie <= 8'] }),
      // new (require('less-plugin-clean-css'))({ compatibility: 'ie9,-properties.merging' }),
    ],
    modifyVars: {},
    sourceMap: {},
  };

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    less: {
      dark: {
        options: lessOptions,
        files: {
          './dist/dark.css': './src/style/dark.less',
        },
      },
    },
  });

  grunt.registerTask('default', ['less:dark']);
};
