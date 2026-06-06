import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ClientPostLogoutRedirectUris');
}

export async function down() {
  throw new Error('Migration 015-create-client-post-logout-redirect-uris is not reversible.');
}
