import { InfrastructureDatasourceService } from '../datasource';

export const InfrastructureInitialSchemaMigrationName = '0001-initial-schema';

export function createInfrastructureInitialSchemaMigration(datasourceService: InfrastructureDatasourceService) {
  return {
    name: InfrastructureInitialSchemaMigrationName,
    up: async () => {
      await datasourceService.syncDB({ alter: false });
    },
    down: async () => {
      throw new Error('Initial infrastructure schema migration is not reversible.');
    },
  };
}
