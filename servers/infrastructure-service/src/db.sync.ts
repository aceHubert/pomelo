import path from 'path';
import { Logger, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileEnv } from '@ace-pomelo/shared/server';
import { InfrastructureDatasourceService, name } from '@/datasource';

const logger = new Logger('DbSync', { timestamp: true });

// sync database
export async function syncDatabase(app: INestApplication<any>) {
  const configService = app.get(ConfigService);
  const datasourceService = app.get(InfrastructureDatasourceService);

  // db lock
  const lockfile = path.join(
    configService.get<string>('configPath')!,
    configService.get<string>('DBLOCK_FILE', 'db.lock'),
  );
  const fileEnv = FileEnv.getInstance(lockfile);

  // 初始化数据库
  await datasourceService
    .syncDB({
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
    });
}
