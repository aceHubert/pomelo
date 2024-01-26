import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseManager, version } from '@ace-pomelo/infrastructure-datasource';
import { DbCheck } from './common/utils/db-check.util';
import { ensureContentPath } from './common/utils/configuration.utils';

const logger = new Logger('DbSync', { timestamp: true });

// env file
const envFilePaths = process.env.ENV_FILE
  ? [process.env.ENV_FILE]
  : process.env.NODE_ENV === 'production'
  ? ['.env.production.local', '.env.production', '.env.local', '.env']
  : ['.env.development.local', '.env.development'];
let config: Record<string, any> = {};
for (const envFilePath of envFilePaths) {
  if (fs.existsSync(envFilePath)) {
    config = Object.assign(dotenv.parse(fs.readFileSync(envFilePath)), config);
  }
}
const configService = new ConfigService(config);

// sync database
async function syncDatabase() {
  const connection = configService.get('INFRASTRUCTURE_DATABASE_CONNECTION')
    ? configService.get('INFRASTRUCTURE_DATABASE_CONNECTION')
    : {
        database: configService.get('INFRASTRUCTURE_DATABASE_NAME'),
        username: configService.get('INFRASTRUCTURE_DATABASE_USERNAME'),
        password: configService.get('INFRASTRUCTURE_DATABASE_PASSWORD'),
        dialect: configService.get('INFRASTRUCTURE_DATABASE_DIALECT', 'mysql'),
        host: configService.get('INFRASTRUCTURE_DATABASE_HOST', 'localhost'),
        port: configService.get('INFRASTRUCTURE_DATABASE_PORT', 3306),
        define: {
          charset: configService.get('INFRASTRUCTURE_DATABASE_CHARSET', 'utf8'),
          collate: configService.get('INFRASTRUCTURE_DATABASE_COLLATE', ''),
        },
      };
  const tablePrefix = configService.get('INFRASTRUCTURE_TABLE_PREFIX');

  // db lock
  const dbCheck = new DbCheck(path.join(ensureContentPath(configService.get<string>('CONTENT_PATH')), 'db.lock'));

  // 初始化数据库
  const dbManager =
    typeof connection === 'string'
      ? new DatabaseManager(connection, { tablePrefix })
      : new DatabaseManager({ ...connection, tablePrefix });
  await dbManager
    .sync({
      alter: false,
      // match: /_dev$/,
      when: () =>
        dbCheck.hasDBInitialed().then((initialized) => !initialized || !dbCheck.getEnv('INFRASTRUCTURE_DATASOURCE')),
    })
    .then((flag) => {
      if (flag) {
        dbCheck.setEnv('INFRASTRUCTURE_DATASOURCE', version);
        logger.debug('Initialize database successful!');
      }
      3;
    });
}

export { envFilePaths, syncDatabase };
