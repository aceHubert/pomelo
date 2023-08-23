module.exports = {
  typescript: {
    configOverwrite: {
      compilerOptions: {
        // tsconfig.json 中设置 paths 会对 .submodules 下的项目做类型检测
        // 运行时需要忽略掉这部分的类型检测
        // paths: {
        //   '@/*': ['src/*'],
        // },
      },
    },
  },
  issue: {
    include: [{ file: './src/**/*' }],
  },
};
