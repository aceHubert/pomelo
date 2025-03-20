import * as path from 'path';
import * as fs from 'fs';
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
  debug: boolean;
  /**
   * directory to config path that
   * save configurations
   */
  configPath: string;
  /**
   * directory to content path that
   * save translations, uploads etc...
   */
  contentPath: string;
  /**
   * web server configs
   */
  server: {
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
     * tcp host
     */
    tcpHost?: string;
    /**
     * tcp port
     */
    tcpPort?: number | string;
    /**
     * server origin
     */
    origin?: string;
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
  swagger: {
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
  graphql: {
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
   * upload configs
   */
  upload: {
    /**
     * upload directory, default is contentPath
     */
    dest?: string;
    /**
     * static prefix, default is 'uploads'
     */
    staticPrefix?: string;
    /**
     * max file size(bytes)
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
 * ensure directory path from user setter or create fallback directory
 * @param setter customized path, absolute or relative to basePath
 */
export const ensureDirPath = (setter: string | undefined, dirname: string, alias?: string) => {
  if (setter) {
    if (fs.existsSync(setter)) {
      // 配置为绝对路径
    } else if ((setter = path.join(process.cwd(), setter)) && fs.existsSync(setter)) {
      // 配置为相对路径
    } else {
      setter = undefined;
    }
  }
  if (!setter) {
    // 从调用方法的文件向上查找 content 目录到 cwd() 父目录为止
    const cwd = process.cwd(),
      parentCWD = path.resolve(cwd, '../');
    let parentDir = path.dirname(require.main?.filename || __filename);
    while (!fs.existsSync(path.join(parentDir, dirname))) {
      logger.debug(`Directory "${dirname}" is not exists in "${parentDir}"`);
      if (parentDir === parentCWD) {
        break;
      }
      parentDir = path.resolve(parentDir, '../');
    }
    // 查找到 content 目录或者 cwd() 同级目录创建 content 目录
    setter = path.join(parentDir, dirname);
    if (!fs.existsSync(setter)) {
      fs.mkdirSync(setter, { recursive: true });
      logger.debug(`Create directory "${dirname}" in "${parentDir}"`);
    }
  }
  logger.debug(`${alias ?? dirname} path: ${setter}`);
  return setter;
};

/**
 * @nestjs/config load,
 * read yaml config file from {configPath}/{process.env.CONFIG_FILE or config.yaml} to merge with default config
 */
export const configuration = (): ConfigFactory<ConfigObject> => () => {
  logger.debug(`"@nestjs/config" read from NODE_ENV(${process.env.NODE_ENV ?? 'development'})`);

  const debugMode = process.env.DEBUG !== void 0 ? process.env.DEBUG === 'true' : process.env.NODE_ENV !== 'production';
  const config: ConfigObject = {
    debug: debugMode,
    configPath: ensureDirPath(process.env.CONFIG_PATH, 'conf', 'config'),
    contentPath: ensureDirPath(process.env.CONTENT_PATH, 'content'),
    server: {
      host: process.env.HOST,
      port: Number(process.env.PORT || 3000),
      tcpHost: process.env.TCP_HOST,
      tcpPort: process.env.TCP_PORT,
      origin: process.env.ORIGIN,
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
    upload: {
      dest: process.env.UPLOAD_DEST,
      staticPrefix: process.env.UPLOAD_STATIC_PREFIX || '/uploads',
      maxFileSize:
        process.env.UPLOAD_LIMIT !== void 0
          ? !Number.isNaN(parseInt(process.env.UPLOAD_LIMIT))
            ? parseInt(process.env.UPLOAD_LIMIT, 10)
            : bytes.parse(process.env.UPLOAD_LIMIT)
          : void 0,
      maxFiles:
        process.env.UPLOAD_MAX_FILES !== void 0 && !Number.isNaN(parseInt(process.env.UPLOAD_MAX_FILES))
          ? parseInt(process.env.UPLOAD_MAX_FILES, 10)
          : void 0,
    },
  };

  return config;
};
