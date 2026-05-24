import { IdentityDatasourceService } from '../datasource';

export const IdentityInitialSchemaMigrationName = '0001-initial-schema';

export function createIdentityInitialSchemaMigration(datasourceService: IdentityDatasourceService) {
  return {
    name: IdentityInitialSchemaMigrationName,
    up: async () => {
      await datasourceService.syncDB({ alter: false });
    },
    down: async () => {
      throw new Error('Initial identity schema migration is not reversible.');
    },
  };
}
