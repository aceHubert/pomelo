import { defineConfig } from './common/utils/configuration.util';

/**
 * 通过文件配置环境（设置环境变量 CONFIG_FILE：env config file path）
 */
export default defineConfig({
  // 资源目录
  contentPath: '../content',
  // Web服务器
  webServer: {
    host: process.env.HOST || '0.0.0.0',
    port: process.env.PORT || 3000,
    globalPrefixUri: '/',
    cors: false,
  },
  // 数据库
  database: {
    connection: {
      // database name
      database: 't_templates',
      // database name
      username: 'username',
      // database password
      password: 'password',
      // database host
      host: 'host',
      // database port, default: 3306
      port: 3306,
      // database charset, default: utf8
      charset: 'utf8',
      // database dialect, default: mysql
      dialect: 'mysql',
      // database collate
      collate: '',
    },
    tablePrefix: 'po_',
  },
});
