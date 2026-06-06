import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ClientScopes');
}

export async function down() {
  throw new Error('Migration 013-create-client-scopes is not reversible.');
}
