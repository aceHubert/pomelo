import { OptionAutoload } from '@ace-pomelo/shared/server';
import { Optional } from './types';

export interface OptionAttributes {
  id: number;
  optionName: string;
  optionValue: string;
  autoload: OptionAutoload;
}

export interface OptionCreationAttributes extends Optional<OptionAttributes, 'id'> {}
