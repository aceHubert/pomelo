import { Attributes, CreationAttributes } from 'sequelize';
import Options from '../entities/options.entity';

/**
 * 配置自动加载
 */
export enum OptionAutoload {
  Yes = 'yes',
  No = 'no',
}

export interface OptionModel extends Attributes<Options> {
  readonly autoload: OptionAutoload;
}

export interface OptionArgs {
  /**
   * 是否自动加载
   */
  autoload?: OptionAutoload;
}

export interface NewOptionInput extends CreationAttributes<Options> {}

export interface UpdateOptionInput extends Pick<NewOptionInput, 'optionValue'> {}
