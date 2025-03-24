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
export const ensureDirPath = (setter: string | undefined, dirname: string, alias?: string[]) => {
  const CWD = process.cwd(),
    parentCWD = path.resolve(CWD, '../');
  if (setter) {
    if (fs.existsSync(setter)) {
      // 配置为绝对路径
    } else if ((setter = path.join(CWD, setter)) && fs.existsSync(setter)) {
      // 配置为相对路径
    } else {
      // 重置为 undefined
      setter = void 0;
    }
  }
  if (!setter) {
    // 从调用方法的文件向上查找目录到 cwd 父目录为止
    const dirnames = alias ? [dirname, ...alias] : [dirname];
    let parentDir = path.dirname(require.main?.filename || __filename);
    while (
      dirnames.every((dir) => {
        const fullDir = path.join(parentDir, dir),
          exists = fs.existsSync(fullDir);
        exists && (setter = fullDir);
        return !exists;
      })
    ) {
      if (parentDir === parentCWD) {
        break;
      }
      parentDir = path.resolve(parentDir, '../');
    }

    // 未找到目录则在 cwd 下创建目录
    if (!setter) {
      setter = path.join(CWD, dirname);
      fs.mkdirSync(setter, { recursive: true });
      logger.debug(`Create directory "${setter}"`);
    }
  }
  logger.debug(`path: ${setter}`);
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
    configPath: ensureDirPath(process.env.CONFIG_PATH, 'conf', ['config']),
    contentPath: ensureDirPath(process.env.CONTENT_PATH, 'content'),
    server: {
      host: process.env.HOST,
      port: process.env.PORT ? Number(process.env.PORT) : void 0,
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
