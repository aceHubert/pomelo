import { Attributes, CreationAttributes } from 'sequelize';
import { OptionAutoload } from '@ace-pomelo/shared/server';
import Options from '../entities/options.entity';

export interface OptionModel extends Attributes<Options> {
  readonly autoload: OptionAutoload;
}

export interface OptionArgs {
  /**
   * Option Names
   */
  optionNames?: string[];
  /**
   * 是否自动加载
   */
  autoload?: OptionAutoload;
}

export interface NewOptionInput extends CreationAttributes<Options> {}

export interface UpdateOptionInput extends Pick<NewOptionInput, 'optionValue'> {}
