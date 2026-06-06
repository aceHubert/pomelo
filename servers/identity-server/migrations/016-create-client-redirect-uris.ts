import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ClientRedirectUris');
}

export async function down() {
  throw new Error('Migration 016-create-client-redirect-uris is not reversible.');
}
