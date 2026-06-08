import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Anonymous } from '@ace-nestjs/authorization';
import { ValidatePayloadExistsPipe } from '@ace-pomelo/shared/server';
import { ManagementLoginInput } from './dto/management-login.input';
import { ManagementTokenResponse } from './models/management-token.model';
import { ManagementAuthService } from './management-auth.service';

@ApiTags('management-auth')
@Controller('v0/management/auth')
export class ManagementAuthController {
  constructor(private readonly managementAuthService: ManagementAuthService) {}

  @Post('login')
  @Anonymous()
  @ApiBody({ type: ManagementLoginInput })
  @ApiOkResponse({ description: 'Management bearer token.', type: ManagementTokenResponse })
  @ApiUnauthorizedResponse({ description: 'Authentication failed.' })
  login(@Body(ValidatePayloadExistsPipe) input: ManagementLoginInput) {
    return this.managementAuthService.login(input);
  }
}
