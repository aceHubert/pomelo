import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'Medias');
}

export async function down() {
  throw new Error('Migration 005-create-medias is not reversible.');
}
