import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'Options');
}

export async function down() {
  throw new Error('Migration 003-create-options is not reversible.');
}
