import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'TermTaxonomy');
}

export async function down() {
  throw new Error('Migration 009-create-term-taxonomy is not reversible.');
}
