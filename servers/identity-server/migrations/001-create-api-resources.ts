import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ApiResources');
}

export async function down() {
  throw new Error('Migration 001-create-api-resources is not reversible.');
}
