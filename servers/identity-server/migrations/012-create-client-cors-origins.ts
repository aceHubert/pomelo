import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ClientCorsOrigins');
}

export async function down() {
  throw new Error('Migration 012-create-client-cors-origins is not reversible.');
}
