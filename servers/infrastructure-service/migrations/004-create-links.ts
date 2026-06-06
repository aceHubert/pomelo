import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'Links');
}

export async function down() {
  throw new Error('Migration 004-create-links is not reversible.');
}
