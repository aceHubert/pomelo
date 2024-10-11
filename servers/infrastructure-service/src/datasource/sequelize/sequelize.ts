import { Sequelize as OriginalSequelize, Options as OriginalOptions } from 'sequelize';
import { Model, ModelCtor } from './model/model';
import { Repository } from './repository/repository';

export interface SequelizeOptions extends OriginalOptions {
  models?: ModelCtor[];
  tablePrefix?: string;
  repositoryMode?: boolean;
}

export class Sequelize extends OriginalSequelize {
  repositoryMode: boolean;
  tablePrefix: string;

  constructor(database: string, username: string, password?: string, options?: SequelizeOptions);
  constructor(database: string, username: string, options?: SequelizeOptions);
  constructor(options?: SequelizeOptions);
  constructor(uri: string, options?: SequelizeOptions);
  constructor(...args: any[]) {
    const lastArg = args[args.length - 1];
    const options = lastArg && typeof lastArg === 'object' ? (lastArg as SequelizeOptions) : undefined;
    if (options) {
      args[args.length - 1] = options;
    }
    super(...args);

    if (options) {
      this.repositoryMode = !!options.repositoryMode;
      this.tablePrefix = options.tablePrefix || '';

      options.models && this.addModels(options.models);
    } else {
      this.repositoryMode = false;
      this.tablePrefix = '';
    }
  }

  model<M extends Model>(model: string | ModelCtor<M>) {
    if (typeof model !== 'string') {
      return super.model(model.name);
    }
    return super.model(model);
  }

  addModels(models: ModelCtor[], tablePrefix?: string): void {
    const definedModels = this.defineModels(models, tablePrefix);
    this.associateModels(definedModels);
  }

  getRepository<M extends Model>(modelClass: new () => M): Repository<M> {
    return this.model(modelClass as any) as Repository<M>;
  }

  private defineModels(models: ModelCtor[], tablePrefix?: string): ModelCtor[] {
    return models.map((model) => {
      const definedModel = this.repositoryMode ? this.createRepositoryModel(model) : model;
      definedModel.initialize(this, { prefix: tablePrefix || this.tablePrefix });

      return definedModel;
    });
  }

  private associateModels(models: ModelCtor[]): void {
    models.map((model) => model.associate && model.associate());
  }

  private createRepositoryModel(modelClass: ModelCtor): ModelCtor {
    return class extends modelClass {};
  }
}
