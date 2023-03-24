import { ApiResponseProperty } from '@nestjs/swagger';
import { OptionAutoload } from '@/orm-entities/interfaces/options.interface';

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
  @ApiResponseProperty()
  autoload!: OptionAutoload;
}
