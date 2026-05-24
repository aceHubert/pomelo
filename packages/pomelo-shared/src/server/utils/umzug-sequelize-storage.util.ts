import { SequelizeStorage, SequelizeStorageConstructorOptions } from 'umzug';

function normalizeTableName(table: string | { tableName?: string }) {
  return typeof table === 'string' ? table : table.tableName || String(table);
}

export class PendingSafeSequelizeStorage extends SequelizeStorage {
  constructor(options: SequelizeStorageConstructorOptions) {
    super({
      modelName: options.modelName ?? options.tableName,
      ...options,
    });
  }

  async executed(): Promise<string[]> {
    const queryInterface = this.sequelize.getQueryInterface();
    const table = this.model.getTableName() as string | { tableName?: string };
    const tableName = normalizeTableName(table);
    const existingTables = (await queryInterface.showAllTables()) as Array<string | { tableName?: string }>;

    if (!existingTables.map(normalizeTableName).includes(tableName)) {
      return [];
    }

    return super.executed();
  }
}
