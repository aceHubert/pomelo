import * as fs from 'fs';
import { createRequire } from 'module';
import * as path from 'path';
import { Injectable, Logger } from '@nestjs/common';
import { QueryInterface } from 'sequelize';
import { MigrationParams, Umzug } from 'umzug';
import { PendingSafeSequelizeStorage } from '@ace-pomelo/shared/server';
import { InfrastructureDatasourceService } from './datasource.service';

const META_TABLE_NAME = 'sequelize_meta';

type MigrationModule = {
  up: (queryInterface: QueryInterface) => Promise<unknown>;
  down?: (queryInterface: QueryInterface) => Promise<unknown>;
};

@Injectable()
export class InfrastructureMigrationService {
  private readonly logger = new Logger(InfrastructureMigrationService.name, { timestamp: true });
  private readonly umzug: Umzug<QueryInterface>;
  private readonly loadMigration = createRequire(__filename);

  constructor(private readonly datasourceService: InfrastructureDatasourceService) {
    this.umzug = new Umzug({
      migrations: {
        glob: this.resolveMigrationGlob(),
        resolve: ({ name, path: filepath, context }: MigrationParams<QueryInterface>) => {
          if (!filepath) {
            throw new Error(`Migration file path is missing for ${name}.`);
          }

          return {
            name,
            up: async () => {
              const migration = this.loadMigration(filepath) as MigrationModule;
              await migration.up(context);
            },
            down: async () => {
              const migration = this.loadMigration(filepath) as MigrationModule;
              if (!migration.down) {
                throw new Error(`Migration ${name} is not reversible.`);
              }
              await migration.down(context);
            },
          };
        },
      },
      context: datasourceService.sequelize.getQueryInterface(),
      storage: new PendingSafeSequelizeStorage({
        sequelize: datasourceService.sequelize as any,
        tableName: META_TABLE_NAME,
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
    await this.verifyConnection();

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

  private async verifyConnection() {
    try {
      await this.datasourceService.sequelize.authenticate();
    } catch (error) {
      this.logger.error('Infrastructure database connection failed.');
      throw error;
    }
  }

  private resolveMigrationGlob() {
    const extensionGlob = this.isRunningFromDist() ? '[0-9]*.js' : '[0-9]*.{js,ts}';
    return path.join(this.resolveMigrationDir(), extensionGlob);
  }

  private resolveMigrationDir() {
    const candidates = [
      path.resolve(__dirname, '../../migrations'),
      path.resolve(__dirname, '../migrations'),
      path.resolve(process.cwd(), 'migrations'),
      path.resolve(process.cwd(), 'servers/infrastructure-service/migrations'),
    ];
    return candidates.find((candidate) => fs.existsSync(candidate)) || candidates[0];
  }

  private isRunningFromDist() {
    return /[/\\]dist([/\\]|$)/.test(__dirname);
  }
}
