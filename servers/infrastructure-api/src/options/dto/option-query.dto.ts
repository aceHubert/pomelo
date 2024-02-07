import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { OptionAutoload } from '@ace-pomelo/infrastructure-datasource';
import { OptionArgsValidator } from './option-args.validator';

/**
 * 配置查询参数
 */
export class OptionQueryDto extends OptionArgsValidator {
  /**
   * Is option load automatically in application start
   */
  @ApiHideProperty() // FIX: Hide from nest-cli plugin, enum compile to relative path from packages
  @ApiProperty({
    enum: OptionAutoload,
    required: false,
    description: 'Is option load automatically in application start',
  })
  autoload?: OptionAutoload;
}
