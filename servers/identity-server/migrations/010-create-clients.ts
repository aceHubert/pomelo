import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'Clients');
}

export async function down() {
  throw new Error('Migration 010-create-clients is not reversible.');
}
