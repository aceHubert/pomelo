import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'ClientGrantTypes');
}

export async function down() {
  throw new Error('Migration 014-create-client-grant-types is not reversible.');
}
