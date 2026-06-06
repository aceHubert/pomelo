import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ApiSecrets');
}

export async function down() {
  throw new Error('Migration 005-create-api-secrets is not reversible.');
}
