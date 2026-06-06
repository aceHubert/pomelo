import { createModelTable } from './model-table-migration';
import type { QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface) {
  await createModelTable(queryInterface, 'IdentityClaims');
}

export async function down() {
  throw new Error('Migration 008-create-identity-claims is not reversible.');
}
