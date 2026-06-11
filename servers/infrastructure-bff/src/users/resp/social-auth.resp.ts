import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { AuthProvider } from '@ace-pomelo/shared/server';

export class SocialAuthStartResultResp {
  @ApiProperty({ enum: AuthProvider })
  provider!: AuthProvider;

  @ApiResponseProperty()
  authorizationUrl!: string;

  @ApiResponseProperty()
  state!: string;
}
