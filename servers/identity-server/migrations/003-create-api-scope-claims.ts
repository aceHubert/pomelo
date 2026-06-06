import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ApiScopeClaims');
}

export async function down() {
  throw new Error('Migration 003-create-api-scope-claims is not reversible.');
}
