import { Injectable, Logger } from '@nestjs/common';
import { QueryInterface } from 'sequelize';
import { Umzug } from 'umzug';
import { PendingSafeSequelizeStorage } from '@ace-pomelo/shared/server';
import { IdentityDatasourceService } from './datasource';
import { createIdentityInitialSchemaMigration } from './migrations/0001-initial-schema';

@Injectable()
export class IdentityMigrationService {
  private readonly logger = new Logger(IdentityMigrationService.name, { timestamp: true });
  private readonly umzug: Umzug<QueryInterface>;

  constructor(private readonly datasourceService: IdentityDatasourceService) {
    this.umzug = new Umzug({
      migrations: [createIdentityInitialSchemaMigration(datasourceService)],
      context: datasourceService.sequelize.getQueryInterface(),
      storage: new PendingSafeSequelizeStorage({
        sequelize: datasourceService.sequelize as any,
        tableName: 'identity_sequelize_meta',
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
      await this.warnMissingTables();
      return;
    }

    const pendingNames = pending.map((migration) => migration.name).join(', ');
    if (!shouldRun) {
      this.logger.warn(
        `Pending database migrations detected: ${pendingNames}. Start identity-server with --sync to apply them.`,
      );
      await this.warnMissingTables();
      return;
    }

    this.logger.log(`Applying database migrations: ${pendingNames}`);
    await this.umzug.up();
    this.logger.log('Database migrations applied.');
    await this.warnMissingTables();
  }

  private async warnMissingTables() {
    const queryInterface = this.datasourceService.sequelize.getQueryInterface();
    const existingTables = (await queryInterface.showAllTables()) as Array<string | { tableName?: string }>;
    const existingNames = new Set(
      existingTables.map((table) => (typeof table === 'string' ? table : table.tableName || String(table))),
    );
    const requiredNames = Object.values(this.datasourceService.sequelize.models).map((model) => {
      const table = model.getTableName();
      return typeof table === 'string' ? table : table.tableName;
    });
    const serviceTableNames = requiredNames.filter((table) => table !== 'identity_sequelize_meta');
    const missingNames = serviceTableNames.filter((table) => !existingNames.has(table));

    if (missingNames.length) {
      this.logger.warn(
        `OIDC database tables are missing: ${missingNames.join(
          ', ',
        )}. Start identity-server with --sync before using OIDC provider.`,
      );
    }
  }
}
