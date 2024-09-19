import * as path from 'path';
import * as fs from 'fs';
import { merge } from 'lodash';
import { Logger } from '@nestjs/common';
import { ConfigFactory } from '@nestjs/config';

const logger = new Logger('Utils', { timestamp: true });

export interface ConfigObject {
  /**
   * Debug mode
   * @default process.env.NODE_ENV !== 'production'
   */
  debug?: boolean;
  /**
   * web server configs
   */
  webServer?: {
    /**
     * server host
     */
    host?: string;
    /**
     * server port
     * @default 3000
     */
    port?: number | string;
  };
  /**
   * swagger options
   */
  swagger?: {
    /**
     * debug mode in runtime (show swagger doc)
     */
    debug?: boolean;
    /**
     * path
     */
    path?: string;
  };
  /**
  /**
   * database configs
   */
  database?: {
    /**
     * database connection,
     * checkout on https://sequelize.org/docs/v6/getting-started/
     */
    connection: string | Record<string, any>;
    /**
     * table prefix
     * @example t_
     */
    tablePrefix?: string;
  };
  [key: string]: any;
}

/**
 * ensure content path
 * @param contentPath customized content path, absolute or relative to basePath
 * @param basePath base path to resolve relative path，or create fallback content directory relative to this path
 */
export const ensureContentPath = (contentPath?: string, basePath = process.cwd()) => {
  if (contentPath) {
    if (fs.existsSync(contentPath)) {
      // 配置为绝对路径
    } else if ((contentPath = path.join(process.cwd(), contentPath)) && fs.existsSync(contentPath)) {
      // 配置为相对路径
    } else {
      contentPath = undefined;
    }
  }
  if (!contentPath) {
    // 默认路径
    contentPath = path.join(basePath, '../content');
    if (!fs.existsSync(contentPath)) {
      // 默认路径，不存在则创建
      fs.mkdirSync(contentPath, { recursive: true });
    }
  }
  logger.debug(`Content path: ${contentPath}`);
  return contentPath;
};

/**
 * @nestjs/config load
 */
export const configuration =
  (basePath = process.cwd()): ConfigFactory<ConfigObject> =>
  () => {
    logger.debug(`"@nestjs/config" read from NODE_ENV(${process.env.NODE_ENV ?? 'development'})`);

    const debugMode =
      process.env.DEBUG !== void 0 ? process.env.DEBUG === 'true' : process.env.NODE_ENV !== 'production';
    let config: ConfigObject = {
      debug: debugMode,
      contentPath: ensureContentPath(process.env.CONTENT_PATH, basePath),
      webServer: {
        host: process.env.HOST,
        port: process.env.PORT,
      },
      swagger: {
        debug: process.env.SWAGGER_DEBUG !== void 0 ? process.env.SWAGGER_DEBUG === 'true' : debugMode,
        path: process.env.SWAGGER_PATH,
      },
      database: {
        connection: process.env.INFRASTRUCTURE_DATABASE_CONNECTION
          ? process.env.INFRASTRUCTURE_DATABASE_CONNECTION
          : {
              database: process.env.INFRASTRUCTURE_DATABASE_NAME,
              username: process.env.INFRASTRUCTURE_DATABASE_USERNAME,
              password: process.env.INFRASTRUCTURE_DATABASE_PASSWORD,
              dialect: process.env.INFRASTRUCTURE_DATABASE_DIALECT || 'mysql',
              host: process.env.INFRASTRUCTURE_DATABASE_HOST || 'localhost',
              port: process.env.INFRASTRUCTURE_DATABASE_PORT || 3306,
              define: {
                charset: process.env.INFRASTRUCTURE_DATABASE_CHARSET || 'utf8',
                collate: process.env.INFRASTRUCTURE_DATABASE_COLLATE || '',
              },
            },
        tablePrefix: process.env.TABLE_PREFIX,
      },
    };

    // merge config from file
    if (process.env.CONFIG_FILE) {
      logger.log(`Merge config file from "${process.env.CONFIG_FILE}"`);
      const fileConfig = getFromFile(path.join(basePath, process.env.CONFIG_FILE));
      // TODO: Class validator
      config = merge(config, fileConfig);
    }
    return config;
  };

/**
 * file config
 */
export const defineConfig = (config: ConfigObject) => config;

function interopDefault(module: any) {
  return module?.default || module;
}

function getFromFile(pathStr: string): ConfigObject {
  try {
    return interopDefault(require(pathStr));
  } catch (err: any) {
    if (err.code === 'ENOENT' || err.code === 'MODULE_NOT_FOUND') {
      throw new Error(`File "${pathStr}"  not exists`);
    }
    throw err;
  }
}
