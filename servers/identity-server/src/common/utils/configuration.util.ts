import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '@nestjs/common';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { ConfigFactory } from '@nestjs/config';

const logger = new Logger('IdentityConfig', { timestamp: true });

export interface IdentityConfigObject {
  debug: boolean;
  contentPath: string;
  server: {
    host?: string;
    port?: number;
    globalPrefixUri?: string;
    cors?: boolean | CorsOptions;
  };
  swagger: {
    debug?: boolean;
    path?: string;
  };
  graphql: {
    debug?: boolean;
    path?: string;
  };
  [key: string]: any;
}

function ensureDirPath(setter: string | undefined, dirname: string, alias?: string) {
  if (setter) {
    if (fs.existsSync(setter)) {
      return setter;
    }

    const relativePath = path.join(process.cwd(), setter);
    if (fs.existsSync(relativePath)) {
      return relativePath;
    }
  }

  const cwd = process.cwd();
  const parentCWD = path.resolve(cwd, '../');
  let parentDir = path.dirname(require.main?.filename || __filename);
  while (!fs.existsSync(path.join(parentDir, dirname))) {
    logger.debug(`Directory "${dirname}" is not exists in "${parentDir}"`);
    if (parentDir === parentCWD) {
      break;
    }
    parentDir = path.resolve(parentDir, '../');
  }

  const resolved = path.join(parentDir, dirname);
  if (!fs.existsSync(resolved)) {
    fs.mkdirSync(resolved, { recursive: true });
    logger.debug(`Create directory "${dirname}" in "${parentDir}"`);
  }
  logger.debug(`${alias ?? dirname} path: ${resolved}`);
  return resolved;
}

function resolveCors(): boolean | CorsOptions {
  if (process.env.CORS !== 'true' && !process.env.CORS_ORIGIN) {
    return false;
  }

  return process.env.CORS_ORIGIN
    ? {
        origin: process.env.CORS_ORIGIN.split('|').map((origin) => origin.trim()),
        credentials: true,
      }
    : true;
}

export const configuration = (): ConfigFactory<IdentityConfigObject> => () => {
  logger.debug(`"@nestjs/config" read from NODE_ENV(${process.env.NODE_ENV ?? 'development'})`);

  const debugMode = process.env.DEBUG !== void 0 ? process.env.DEBUG === 'true' : process.env.NODE_ENV !== 'production';

  return {
    debug: debugMode,
    contentPath: ensureDirPath(process.env.CONTENT_PATH, 'content'),
    server: {
      host: process.env.HOST,
      port: Number(process.env.PORT || 3000),
      globalPrefixUri: process.env.GLOBAL_PREFIX_URI,
      cors: resolveCors(),
    },
    swagger: {
      debug: process.env.SWAGGER_DEBUG !== void 0 ? process.env.SWAGGER_DEBUG === 'true' : debugMode,
      path: process.env.SWAGGER_PATH,
    },
    graphql: {
      debug: process.env.GRAPHQL_DEBUG !== void 0 ? process.env.GRAPHQL_DEBUG === 'true' : debugMode,
      path: process.env.GRAPHQL_PATH,
    },
  };
};
