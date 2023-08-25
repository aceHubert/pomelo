import { OptionAutoload } from '@pomelo/datasource';
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
  autoload: OptionAutoload = OptionAutoload.No;
}
