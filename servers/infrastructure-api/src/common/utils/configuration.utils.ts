import * as path from 'path';
import * as fs from 'fs';
import { merge } from 'lodash';
import { default as bytes } from 'bytes';
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
  /**
   * upload configs
   */
  upload?: {
    /**
     * upload directory
     */
    dest?: string;
    /**
     * max file size(KB)
     */
    maxFileSize?: number;
    /**
     * max file count
     */
    maxFiles?: number;
  };
  [key: string]: any;
}

/**
 * @nextjs/config load
 */
export const configuration =
  (basePath: string): ConfigFactory<ConfigObject> =>
  () => {
    logger.log(`"@nextjs/config" read from NODE_ENV(${process.env.NODE_ENV ?? 'development'})`);
    let contentPath: string | undefined;
    if (process.env.CONTENT_PATH) {
      if ((contentPath = process.env.CONTENT_PATH) && fs.existsSync(contentPath)) {
        // 配置为绝对路径
      } else if ((contentPath = path.join(process.cwd(), process.env.CONTENT_PATH)) && fs.existsSync(contentPath)) {
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
    logger.log(`Content path is: ${contentPath}`);
    const debugMode =
      process.env.DEBUG !== void 0 ? process.env.DEBUG === 'true' : process.env.NODE_ENV !== 'production';
    let config: ConfigObject = {
      debug: debugMode,
      contentPath: contentPath,
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
        tablePrefix: process.env.INFRASTRUCTURE_TABLE_PREFIX,
      },
      upload: {
        dest: process.env.UPLOAD_PATH,
        maxFileSize:
          process.env.UPLOAD_LIMIT !== void 0 ? bytes.parse(process.env.UPLOAD_LIMIT) / 1024 : 1024 * 1024 * 10,
        maxFiles: process.env.UPLOAD_MAX_FILES !== void 0 ? parseInt(process.env.UPLOAD_MAX_FILES, 10) : 10,
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
