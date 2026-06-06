import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'Comments');
}

export async function down() {
  throw new Error('Migration 012-create-comments is not reversible.');
}
