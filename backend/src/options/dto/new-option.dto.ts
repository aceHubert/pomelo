import { OptionAutoload } from '@/orm-entities/interfaces/options.interface';
import { NewOptionValidator } from './new-option.validator';

export class NewOptionDto extends NewOptionValidator {
  /**
   * Option name
   */
  optionName!: string;

  /**
   * Option value
   */
  optionValue!: string;

  /**
   * Is option load automatically in application start (default: no)
   */
  autoload?: OptionAutoload;
}
