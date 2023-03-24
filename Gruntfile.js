module.exports = function (grunt) {
  grunt.loadNpmTasks('grunt-run');
  grunt.loadNpmTasks('grunt-submodule');
  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    run: {
      install: {
        exec: 'yarn install --frozen-lockfile', // --ignore-scripts
      },
      build: {
        exec: 'yarn build',
      },
    },
    clean: {
      options: {
        force: true,
      },
      src: ['**/node_modules', '**/.yarn'],
    },
    submodule: {
      options: {
        gruntfile: __filename,
        base: __dirname,
        tasks: ['run:install', 'run:build', 'clean'],
      },
    },
  });

  // grunt.registerMultiTask('run', 'exec "yarn install" in submoudles', function () {
  //   if (arguments.length === 0) {
  //     grunt.log.writeln(this.name + ', no args');
  //   } else {
  //     grunt.log.writeln(this.name + ', ' + arg1 + ' ' + arg2);
  //   }
  // });

  // build 所有 submoules
  grunt.registerTask('default', ['submodule']);
  grunt.registerTask('build:formily-antdv', ['submodule:.submodules/formily-antdv']);
  grunt.registerTask('build:formily-vant', ['submodule:.submodules/formily-vant']);
  grunt.registerTask('build:formily-portal-antdv', ['submodule:.submodules/formily-portal-antdv']);
  grunt.registerTask('build:formily-portal-vant', ['submodule:.submodules/formily-portal-vant']);

  // 按项目分组
  grunt.registerTask('build:formily', ['submodule:.submodules/formily-*']);
  grunt.registerTask('build:formily-portal', ['submodule:.submodules/formily-portal-*']);

  // 按组件分组
  grunt.registerTask('build:antdv', ['submodule:.submodules/*-antdv']);
  grunt.registerTask('build:vant', ['submodule:.submodules/*-vant']);

  // 清除
  grunt.registerTask('clean:all', 'Clean all submodules', function () {
    grunt.config.set('submodule.options.tasks', ['clean']);
    grunt.task.run('submodule');
  });
};
