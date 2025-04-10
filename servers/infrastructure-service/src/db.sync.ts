import { Logger, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InfrastructureDatasourceService, name } from '@/datasource';
import { getDbLockFileEnv } from '@/common/utils/lock-file.util';

const logger = new Logger('DbSync', { timestamp: true });

// sync database
export async function syncDatabase(app: INestApplication<any>) {
  const configService = app.get(ConfigService);
  const datasourceService = app.get(InfrastructureDatasourceService);

  const fileEnv = getDbLockFileEnv(configService);

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
