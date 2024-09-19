import { ApiProperty } from '@nestjs/swagger';
import { OptionAutoload } from '@ace-pomelo/shared/server';
import { OptionArgsValidator } from './option-args.validator';

/**
 * 配置查询参数
 */
export class OptionQueryDto extends OptionArgsValidator {
  /**
   * Is option load automatically in application start
   */
  @ApiProperty({
    enum: OptionAutoload,
    required: false,
    description: 'Is option load automatically in application start',
  })
  autoload?: OptionAutoload;
}
