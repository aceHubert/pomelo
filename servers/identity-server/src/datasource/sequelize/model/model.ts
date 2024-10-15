import { Sequelize, Model as OriginModel } from 'sequelize';
import { Repository } from '../repository/repository';

export type ModelType<TCreationAttributes extends {}, TModelAttributes extends {}> = new (
  values?: TCreationAttributes,
  options?: any,
) => Model<TModelAttributes, TCreationAttributes>;
export type ModelCtor<M extends Model = Model> = Repository<M>;
export type ModelStatic<M extends Model = Model> = { new (): M };

export type InitOptions = {
  prefix: string;
};

export abstract class Model<
  TModelAttributes extends {} = any,
  TCreationAttributes extends {} = TModelAttributes,
> extends OriginModel<TModelAttributes, TCreationAttributes> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  static initialize(sequelize: Sequelize, options: InitOptions): void {
    throw new Error('Method initialize not implemented.');
  }
  static associate?(): void;
}
