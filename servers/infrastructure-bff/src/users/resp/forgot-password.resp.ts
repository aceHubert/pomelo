import { ApiResponseProperty } from '@nestjs/swagger';

export class ForgotPasswordEmailCodeResultResp {
  @ApiResponseProperty()
  success!: boolean;

  @ApiResponseProperty()
  expiresInSeconds!: number;

  @ApiResponseProperty()
  cooldownSeconds!: number;

  @ApiResponseProperty()
  maskedEmail!: string;

  @ApiResponseProperty()
  message?: string;
}
