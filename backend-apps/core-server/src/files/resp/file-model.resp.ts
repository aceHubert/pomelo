import { ApiResponseProperty } from '@nestjs/swagger';

export class FileModelResp {
  /**
   * File name
   */
  @ApiResponseProperty()
  filename!: string;

  /**
   * File href
   */
  @ApiResponseProperty()
  url!: string;
}
