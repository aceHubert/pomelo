import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'MediaMeta');
}

export async function down() {
  throw new Error('Migration 006-create-media-meta is not reversible.');
}
