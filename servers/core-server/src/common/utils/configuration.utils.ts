import * as path from 'path';
import * as fs from 'fs';
import { merge } from 'lodash';
import { default as bytes } from 'bytes';
import { Logger } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigFactory } from '@nestjs/config';

const logger = new Logger('Utils', { timestamp: true });

export enum AuthType {
  Jwt = 'JWT',
}

export interface ConfigObject {
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
   * authorization
   */
  auth?: {
    /**
     * debug mode in runtime (show auth logging)
     */
    debug?: boolean;
    /**
     * type, default: JWT
     */
    type?: AuthType;
    /**
     * endpoint
     */
    endpoint?: string;
    /**
     * jwksRas options
     */
    jwksRsa?: {
      requestsPerMinute: number;
      cache: boolean;
      rateLimit: boolean;
    };
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
  /**
   * sub-module store
   */
  submodule?: {
    // read submodule configs from unpkg, https://github.com/velut/node-query-registry
    /**
     * unpkg keywords
     */
    keywords?: string[];
    /**
     * unpkg registry
     */
    registry?: string;
    /**
     * unpkg mirrors
     */
    mirrors?: string[];
    /**
     * unpkg cache
     */
    cache?: boolean;
  };
  [key: string]: any;
}

/**
 * @nextjs/config load
 */
export const configuration: (basePath: string) => ConfigFactory<ConfigObject> = (basePath) => () => {
  logger.log(`"@nextjs/config" read from NODE_ENV(${process.env.NODE_ENV ?? 'development'}}`);
  let contentPath;
  if (process.env.CONTENT_PATH) {
    if ((contentPath = process.env.CONTENT_PATH) && fs.existsSync(contentPath)) {
      // 配置为绝对路径
    } else if ((contentPath = path.join(process.cwd(), process.env.CONTENT_PATH)) && fs.existsSync(contentPath)) {
      // 配置为相对路径
    } else {
      contentPath = undefined;
    }
  }
  let config: ConfigObject = {
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
      debug:
        process.env.SWAGGER_DEBUG !== void 0
          ? process.env.SWAGGER_DEBUG === 'true'
          : process.env.NODE_ENV !== 'production',
      path: process.env.SWAGGER_PATH,
    },
    graphql: {
      debug:
        process.env.GRAPHQL_DEBUG !== void 0
          ? process.env.GRAPHQL_DEBUG === 'true'
          : process.env.NODE_ENV !== 'production',
      path: process.env.GRAPHQL_PATH,
      subscription_path: process.env.GRAPHQL_SUBSCRIPTION_PATH,
    },
    database: {
      connection: process.env.DATABASE_CONNECTION
        ? process.env.DATABASE_CONNECTION
        : {
            database: process.env.DATABASE_NAME,
            username: process.env.DATABASE_USERNAME,
            password: process.env.DATABASE_PASSWORD,
            dialect: process.env.DATABASE_DIALECT || 'mysql',
            host: process.env.DATABASE_HOST || 'localhost',
            port: process.env.DATABASE_PORT || 3306,
            charset: process.env.DATABASE_CHARSET || 'utf8',
            collate: process.env.DATABASE_COLLATE || '',
          },
      tablePrefix: process.env.TABLE_PREFIX,
    },
    auth: {
      debug:
        process.env.AUTH_DEBUG !== void 0 ? process.env.AUTH_DEBUG === 'true' : process.env.NODE_ENV !== 'production',
      type: process.env.AUTH_TYPE as AuthType,
      endpoint: process.env.AUTH_ENDPOINT,
      jwksRsa: {
        requestsPerMinute: parseInt(process.env.AUTH_JWKSRAS_REQUESTS_PER_MINUTE as string, 10) || 5,
        cache: process.env.AUTH_JWKSRAS_CACHE === 'true',
        rateLimit: process.env.AUTH_JWKSRAS_RATE_LIMIT === 'true',
      },
    },
    upload: {
      dest: process.env.UPLOAD_PATH,
      maxFileSize:
        process.env.UPLOAD_LIMIT !== void 0 ? bytes.parse(process.env.UPLOAD_LIMIT) / 1024 : 1024 * 1024 * 10,
      maxFiles: process.env.UPLOAD_MAX_FILES !== void 0 ? parseInt(process.env.UPLOAD_MAX_FILES, 10) : 10,
    },
    submodule: {
      keywords:
        process.env.SUBMODULE_KEYWORDS !== void 0
          ? process.env.SUBMODULE_KEYWORDS.split('|').map((keyword) => keyword.trim())
          : [],
      registry: process.env.SUBMODULE_REGISTRY,
      mirrors:
        process.env.SUBMODULE_MIRRORS !== void 0
          ? process.env.SUBMODULE_MIRRORS.split('|').map((mirror) => mirror.trim())
          : [],
      cache: process.env.SUBMODULE_CACHE === 'true',
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
      throw new Error(`File "${pathStr}" is not exists`);
    }
    throw err;
  }
}
