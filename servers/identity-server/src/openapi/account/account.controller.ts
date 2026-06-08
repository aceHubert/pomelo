import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Anonymous } from '@ace-nestjs/authorization';
import { ValidatePayloadExistsPipe } from '@ace-pomelo/shared/server';
import { ManagementLoginInput } from './dto/login.input';
import { ManagementTokenResponse } from './models/token.model';
import { ManagementAccountService } from './account.service';

@ApiTags('management-account')
@Controller('v0/management/auth')
export class ManagementAccountController {
  constructor(private readonly accountService: ManagementAccountService) {}

  @Post('login')
  @Anonymous()
  @ApiBody({ type: ManagementLoginInput })
  @ApiOkResponse({ description: 'Management bearer token.', type: ManagementTokenResponse })
  @ApiUnauthorizedResponse({ description: 'Authentication failed.' })
  login(@Body(ValidatePayloadExistsPipe) input: ManagementLoginInput) {
    return this.accountService.login(input);
  }
}
