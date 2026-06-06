import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ApiScopes');
}

export async function down() {
  throw new Error('Migration 004-create-api-scopes is not reversible.');
}
