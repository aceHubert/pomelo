import type { QueryInterface } from 'sequelize';

type TableName = string | { tableName?: string };

type MigrationModel = {
  name: string;
  getTableName(): TableName;
  tableAttributes?: Record<string, unknown>;
  getAttributes?: () => Record<string, unknown>;
  rawAttributes?: Record<string, unknown>;
  options?: Record<string, unknown> & { indexes?: Array<Record<string, unknown>> };
  _indexes?: Array<Record<string, unknown>>;
};

export async function createModelTable(queryInterface: QueryInterface, modelName: string) {
  const model = getRegisteredModel(queryInterface, modelName);
  const table = model.getTableName();
  const options = getModelOptions(model);
  await (queryInterface as any).createTable(table, getModelAttributes(model), options, model);
  await createModelIndexes(queryInterface, table, model);
}

function getRegisteredModel(queryInterface: QueryInterface, modelName: string): MigrationModel {
  const sequelize = (queryInterface as any).sequelize;
  const model = sequelize?.models?.[modelName];
  if (!model) {
    throw new Error(`Unable to read Sequelize model "${modelName}" from QueryInterface.`);
  }

  return model as MigrationModel;
}

function getModelAttributes(model: MigrationModel) {
  return model.tableAttributes || model.getAttributes?.() || model.rawAttributes || {};
}

function getModelOptions(model: MigrationModel) {
  const options = { ...(model.options || {}) };
  delete options.indexes;
  return options;
}

async function createModelIndexes(queryInterface: QueryInterface, table: TableName, model: MigrationModel) {
  const indexes = model._indexes || model.options?.indexes || [];
  for (const index of indexes) {
    await (queryInterface as any).addIndex(table, index);
  }
}
