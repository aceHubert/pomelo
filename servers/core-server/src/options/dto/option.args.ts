import { Field, ArgsType } from '@nestjs/graphql';
import { OptionAutoload } from '@ace-pomelo/datasource';
import { OptionArgsValidator } from './option-args.validator';

/**
 * 配置查询参数
 */
@ArgsType()
export class OptionArgs extends OptionArgsValidator {
  @Field((type) => OptionAutoload, { nullable: true, description: 'Is option load automatically in application start' })
  autoload?: OptionAutoload;
}
