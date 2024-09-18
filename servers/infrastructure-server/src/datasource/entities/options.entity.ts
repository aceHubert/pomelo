import { Optional } from './types';

export interface OptionAttributes {
  id: number;
  optionName: string;
  optionValue: string;
  /**
   * yes/no
   */
  autoload: string;
}

export interface OptionCreationAttributes extends Optional<OptionAttributes, 'id'> {}
