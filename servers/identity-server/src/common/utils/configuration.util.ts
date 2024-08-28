import * as path from 'path';
import * as fs from 'fs';
import { merge } from 'lodash';
import { Logger } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigFactory } from '@nestjs/config';

const logger = new Logger('Utils', { timestamp: true });

export interface ConfigObject {
  /**
   * Debug mode
   * @default process.env.NODE_ENV !== 'production'
   */
  debug?: boolean;
  /**
   * directory to content path that
   * save translations, uploads etc...
   */
  contentPath?: string;
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
    /**
     * global prefix uri
     */
    globalPrefixUri?: string;
    /**
     * Cors
     * @default false
     */
    cors?: boolean | CorsOptions;
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
   * graphql options
   */
  graphql?: {
    /**
     * debug mode in runtime (show graphql background, enable introspection and debug)
     */
    debug?: boolean;
    /**
     * path
     */
    path?: string;
    /**
     * subscription path
     */
    subscription_path?: string;
  };
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
  logger.log(`Content path: ${contentPath}`);
  return contentPath;
};

/**
 * @nextjs/config load
 */
export const configuration =
  (basePath = process.cwd()): ConfigFactory<ConfigObject> =>
  () => {
    logger.log(`"@nextjs/config" read from NODE_ENV(${process.env.NODE_ENV ?? 'development'})`);

    const debugMode =
      process.env.DEBUG !== void 0 ? process.env.DEBUG === 'true' : process.env.NODE_ENV !== 'production';
    let config: ConfigObject = {
      debug: debugMode,
      contentPath: ensureContentPath(process.env.CONTENT_PATH, basePath),
      webServer: {
        host: process.env.HOST,
        port: process.env.PORT,
        globalPrefixUri: process.env.GLOBAL_PREFIX_URI,
        cors:
          process.env.CORS === 'true' || process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN
              ? {
                  origin: process.env.CORS_ORIGIN.split('|').map((origin) => origin.trim()),
                  credentials: true, // support withCredentials
                }
              : true
            : false,
      },
      swagger: {
        debug: process.env.SWAGGER_DEBUG !== void 0 ? process.env.SWAGGER_DEBUG === 'true' : debugMode,
        path: process.env.SWAGGER_PATH,
      },
      graphql: {
        debug: process.env.GRAPHQL_DEBUG !== void 0 ? process.env.GRAPHQL_DEBUG === 'true' : debugMode,
        path: process.env.GRAPHQL_PATH,
        subscription_path: process.env.GRAPHQL_SUBSCRIPTION_PATH,
      },
      database: {
        connection: process.env.IDENTITY_DATABASE_CONNECTION
          ? process.env.IDENTITY_DATABASE_CONNECTION
          : {
              database: process.env.IDENTITY_DATABASE_NAME,
              username: process.env.IDENTITY_DATABASE_USERNAME,
              password: process.env.IDENTITY_DATABASE_PASSWORD,
              dialect: process.env.IDENTITY_DATABASE_DIALECT || 'mysql',
              host: process.env.IDENTITY_DATABASE_HOST || 'localhost',
              port: process.env.IDENTITY_DATABASE_PORT || 3306,
              define: {
                charset: process.env.IDENTITY_DATABASE_CHARSET || 'utf8',
                collate: process.env.IDENTITY_DATABASE_COLLATE || '',
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
      throw new Error(`File "${pathStr}" does not exist`);
    }
    throw err;
  }
}
