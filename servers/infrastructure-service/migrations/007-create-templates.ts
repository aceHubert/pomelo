import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'Templates');
}

export async function down() {
  throw new Error('Migration 007-create-templates is not reversible.');
}
