/* eslint-disable no-console */
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { DatabaseManager, version } from '@ace-pomelo/infrastructure-datasource';
import { LockFile } from './common/utils/lock-file.util';

export const dbLockFileName = path.join(process.cwd(), 'db.lock');
export const envFilePaths =
  process.env.ENV_FILE ??
  (process.env.NODE_ENV === 'production'
    ? ['.env.production.local', '.env.production', '.env']
    : ['.env.development.local', '.env.development']);

// 初始化数据库
export async function syncDatabase() {
  const dbLockFile = new LockFile(dbLockFileName);

  let config: Record<string, any> = {};
  for (const envFilePath of envFilePaths) {
    if (fs.existsSync(envFilePath)) {
      config = Object.assign(dotenv.parse(fs.readFileSync(envFilePath)), config);
    }
  }

  const connection = config.INFRASTRUCTURE_DATABASE_CONNECTION
    ? config.INFRASTRUCTURE_DATABASE_CONNECTION
    : {
        database: config.INFRASTRUCTURE_DATABASE_NAME,
        username: config.INFRASTRUCTURE_DATABASE_USERNAME,
        password: config.INFRASTRUCTURE_DATABASE_PASSWORD,
        dialect: config.INFRASTRUCTURE_DATABASE_DIALECT || 'mysql',
        host: config.INFRASTRUCTURE_DATABASE_HOST || 'localhost',
        port: config.INFRASTRUCTURE_DATABASE_PORT || 3306,
        define: {
          charset: config.INFRASTRUCTURE_DATABASE_CHARSET || 'utf8',
          collate: config.INFRASTRUCTURE_DATABASE_COLLATE || '',
        },
      };
  const tablePrefix = config.INFRASTRUCTURE_TABLE_PREFIX;

  // 初始化数据库
  const dbManager =
    typeof connection === 'string'
      ? new DatabaseManager(connection, { tablePrefix })
      : new DatabaseManager({ ...connection, tablePrefix });
  await dbManager
    .sync({
      alter: true,
      // match: /_dev$/,
      when: () => dbLockFile.hasFile().then((initialized) => !initialized),
    })
    .then((flag) => {
      if (flag) {
        dbLockFile.setEnvValue('INFRASTRUCTURE_MODULE', version);
        console.log('Initialize database successful!');
      }
    });
}
