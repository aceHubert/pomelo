import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'TemplateMeta');
}

export async function down() {
  throw new Error('Migration 008-create-template-meta is not reversible.');
}
