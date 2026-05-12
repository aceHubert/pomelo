import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { OptionPresetKeys } from '@ace-pomelo/shared/server';

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
}

export class OptionValueResp {
  /**
   * Option preset key
   */
  @ApiProperty({ enum: OptionPresetKeys })
  key!: OptionPresetKeys;

  /**
   * Option value
   */
  @ApiResponseProperty()
  value?: string;

  /**
   * Is option value set
   */
  @ApiResponseProperty()
  isSet!: boolean;

  /**
   * Is default value used
   */
  @ApiResponseProperty()
  useDefault!: boolean;

  /**
   * Option value message
   */
  @ApiResponseProperty()
  message?: string;
}
