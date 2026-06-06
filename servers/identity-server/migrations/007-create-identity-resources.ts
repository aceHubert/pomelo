import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'IdentityResources');
}

export async function down() {
  throw new Error('Migration 007-create-identity-resources is not reversible.');
}
