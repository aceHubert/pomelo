import { ApiResponseProperty } from '@nestjs/swagger';

export abstract class MetaModelResp {
  /**
   * Meta id
   */
  @ApiResponseProperty()
  id!: number;

  /**
   * Meta key
   */
  @ApiResponseProperty()
  metaKey!: string;

  /**
   * Meta value
   */
  @ApiResponseProperty()
  metaValue?: string;
}
