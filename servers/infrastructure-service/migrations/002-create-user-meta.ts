import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'UserMeta');
}

export async function down() {
  throw new Error('Migration 002-create-user-meta is not reversible.');
}
