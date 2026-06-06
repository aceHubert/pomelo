import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'TermRelationships');
}

export async function down() {
  throw new Error('Migration 011-create-term-relationships is not reversible.');
}
