import path from 'path';
import { ConfigService } from '@nestjs/config';
import { FileEnv } from '@ace-pomelo/shared/server';

export function getDbLockFileEnv(config: ConfigService) {
  return FileEnv.getInstance(config.get<string>('DB_LOCK_FILE', path.join(process.cwd(), 'db.lock')));
}
