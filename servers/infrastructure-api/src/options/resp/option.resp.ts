import { ApiHideProperty, ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { OptionAutoload } from '@ace-pomelo/infrastructure-datasource';

export class OptionResp {
  /**
   * Option id
   */
  @ApiResponseProperty()
  id!: number;

  /**
   * Option name
   */
  @ApiResponseProperty()
  optionName!: string;

  /**
   * Option value
   */
  @ApiResponseProperty()
  optionValue!: string;

  /**
   * Is option load automatically in application start
   */
  @ApiHideProperty() // FIX: Hide from nest-cli plugin, enum compile to relative path from packages
  @ApiProperty({
    enum: OptionAutoload,
    readOnly: true,
    description: 'Is option load automatically in application start',
  })
  // @ApiResponseProperty()
  autoload!: OptionAutoload;
}
