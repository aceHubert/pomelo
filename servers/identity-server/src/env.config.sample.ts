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
    // infrastructure database settings
    infrastructure: {
      connection: 'mysql://user:password@host:port/database',
      tablePrefix: 'po_',
    },
    // identity database settings
    identity: {
      connection: 'mysql://user:password@host:port/database',
      tablePrefix: 'po_',
    },
  },
});
