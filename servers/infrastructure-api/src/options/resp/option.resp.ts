import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { OptionAutoload } from '@ace-pomelo/shared/server';

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
  @ApiProperty({
    enum: OptionAutoload,
    readOnly: true,
    description: 'Is option load automatically in application start',
  })
  // @ApiResponseProperty()
  autoload!: OptionAutoload;
}
