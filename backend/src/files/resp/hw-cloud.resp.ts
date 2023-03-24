import { ApiResponseProperty } from '@nestjs/swagger';

export class ObsUploadSignedUrlResp {
  /**
   * Signed url
   */
  @ApiResponseProperty()
  url!: string;

  /**
   * Request headers
   */
  @ApiResponseProperty()
  headers!: Record<string, any>;
}

export class ObsPostUploadSignatureResp {
  /**
   * Upload url
   */
  @ApiResponseProperty()
  url!: string;

  /**
   * OriginPolicy
   */
  @ApiResponseProperty()
  originPolicy!: string;

  /**
   * Policy
   */
  @ApiResponseProperty()
  policy!: string;

  /**
   * Signature
   */
  @ApiResponseProperty()
  signature!: string;
}
