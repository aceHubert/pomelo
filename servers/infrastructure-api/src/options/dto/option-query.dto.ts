import { OptionAutoload } from '@ace-pomelo/infrastructure-datasource';
import { OptionArgsValidator } from './option-args.validator';

/**
 * 配置查询参数
 */
export class OptionQueryDto extends OptionArgsValidator {
  /**
   * Is option load automatically in application start
   */
  autoload?: OptionAutoload;
}
