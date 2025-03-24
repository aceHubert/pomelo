import { Field, ArgsType } from '@nestjs/graphql';
import { OptionAutoload } from '@ace-pomelo/shared/server';
import { OptionArgsValidator } from './option-args.validator';

/**
 * 配置查询参数
 */
@ArgsType()
export class OptionArgs extends OptionArgsValidator {
  /**
   * Is option load automatically in application start
   */
  @Field((type) => OptionAutoload)
  autoload?: OptionAutoload;

  /**
   * Option names to query
   */
  optionNames?: string[];
}
