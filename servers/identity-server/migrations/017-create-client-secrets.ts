import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ClientSecrets');
}

export async function down() {
  throw new Error('Migration 017-create-client-secrets is not reversible.');
}
