import { Attributes, CreationAttributes } from 'sequelize';
import { OptionAutoload } from '@ace-pomelo/shared/server';
import { Options } from '../entities';

export interface OptionModel extends Attributes<Options> {}

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
