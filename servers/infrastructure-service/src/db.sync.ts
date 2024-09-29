import path from 'path';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileEnv } from '@ace-pomelo/shared/server';
import { DatabaseManager, name } from '@/datasource';

const logger = new Logger('DbSync', { timestamp: true });

// sync database
export async function syncDatabase(config: ConfigService) {
  const connection = config.get('INFRASTRUCTURE_DATABASE_CONNECTION')
    ? config.get('INFRASTRUCTURE_DATABASE_CONNECTION')
    : {
        database: config.getOrThrow('INFRASTRUCTURE_DATABASE_NAME'),
        username: config.getOrThrow('INFRASTRUCTURE_DATABASE_USERNAME'),
        password: config.getOrThrow('INFRASTRUCTURE_DATABASE_PASSWORD'),
        dialect: config.get('INFRASTRUCTURE_DATABASE_DIALECT', 'mysql'),
        host: config.get('INFRASTRUCTURE_DATABASE_HOST', 'localhost'),
        port: config.get('INFRASTRUCTURE_DATABASE_PORT', 3306),
        define: {
          charset: config.get('INFRASTRUCTURE_DATABASE_CHARSET', 'utf8'),
          collate: config.get('INFRASTRUCTURE_DATABASE_COLLATE', ''),
        },
      };
  const tablePrefix = config.get('TABLE_PREFIX');

  // db lock
  const lockfile = path.join(config.get<string>('configPath')!, config.get<string>('DBLOCK_FILE', 'db.lock'));
  const fileEnv = FileEnv.getInstance(lockfile);

  // 初始化数据库
  const dbManager =
    typeof connection === 'string'
      ? new DatabaseManager(connection, { tablePrefix })
      : new DatabaseManager({ ...connection, tablePrefix });
  await dbManager
    .sync({
      alter: false,
      // match: /_dev$/,
      // TODO: version compare
      when: !fileEnv.getEnv(name),
    })
    .then((flag) => {
      if (flag) {
        fileEnv.setEnv(name, 'PENDING');
        logger.debug('Initialize database successful!');
      }
      3;
    });
}
