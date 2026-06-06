import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'CommentMeta');
}

export async function down() {
  throw new Error('Migration 013-create-comment-meta is not reversible.');
}
