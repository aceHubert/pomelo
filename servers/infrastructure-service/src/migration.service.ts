import { Injectable, Logger } from '@nestjs/common';
import { QueryInterface } from 'sequelize';
import { Umzug } from 'umzug';
import { PendingSafeSequelizeStorage } from '@ace-pomelo/shared/server';
import { InfrastructureDatasourceService } from './datasource';
import { createInfrastructureInitialSchemaMigration } from './migrations/0001-initial-schema';

@Injectable()
export class InfrastructureMigrationService {
  private readonly logger = new Logger(InfrastructureMigrationService.name, { timestamp: true });
  private readonly umzug: Umzug<QueryInterface>;

  constructor(datasourceService: InfrastructureDatasourceService) {
    this.umzug = new Umzug({
      migrations: [createInfrastructureInitialSchemaMigration(datasourceService)],
      context: datasourceService.sequelize.getQueryInterface(),
      storage: new PendingSafeSequelizeStorage({
        sequelize: datasourceService.sequelize as any,
        tableName: 'infrastructure_sequelize_meta',
      }),
      logger: {
        info: (message) => this.logger.log(message),
        warn: (message) => this.logger.warn(message),
        error: (message) => this.logger.error(message),
        debug: (message) => this.logger.debug(message),
      },
    });
  }

  async sync(shouldRun: boolean) {
    const pending = await this.umzug.pending();
    if (!pending.length) {
      this.logger.debug('No pending database migrations.');
      return;
    }

    const pendingNames = pending.map((migration) => migration.name).join(', ');
    if (!shouldRun) {
      this.logger.warn(
        `Pending database migrations detected: ${pendingNames}. Start infrastructure-service with --sync to apply them.`,
      );
      return;
    }

    this.logger.log(`Applying database migrations: ${pendingNames}`);
    await this.umzug.up();
    this.logger.log('Database migrations applied.');
  }
}
