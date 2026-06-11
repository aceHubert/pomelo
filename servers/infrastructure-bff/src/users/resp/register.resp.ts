import { ApiResponseProperty } from '@nestjs/swagger';

export class RegisterEmailCodeResultResp {
  @ApiResponseProperty()
  success!: boolean;

  @ApiResponseProperty()
  expiresInSeconds!: number;

  @ApiResponseProperty()
  cooldownSeconds!: number;

  @ApiResponseProperty()
  message?: string;
}
