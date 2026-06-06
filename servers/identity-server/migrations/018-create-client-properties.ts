import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ClientProperties');
}

export async function down() {
  throw new Error('Migration 018-create-client-properties is not reversible.');
}
