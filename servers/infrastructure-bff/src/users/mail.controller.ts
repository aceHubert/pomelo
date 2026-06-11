import { Body, Controller, Post } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Anonymous, Authorized } from '@ace-nestjs/authorization';
import { createResponseSuccessType } from '@ace-pomelo/shared/server';
import { BaseController } from '@/common/controllers/base.controller';
import { RegisterEmailCodeInput } from './dto/register.input';
import { RegisterEmailCodeResultResp } from './resp/register.resp';
import { UserService } from './user.service';

@ApiTags('mail')
@Authorized()
@Controller('api/mail')
export class MailController extends BaseController {
  constructor(private readonly userService: UserService) {
    super();
  }

  @Post('register/email-code')
  @Anonymous()
  @ApiOkResponse({
    description: 'Register email code result',
    type: () => createResponseSuccessType({ data: RegisterEmailCodeResultResp }, 'RegisterEmailCodeSuccessResp'),
  })
  async sendRegisterEmailCode(@Body() input: RegisterEmailCodeInput) {
    return this.success({
      data: await this.userService.sendRegisterEmailCode(input),
    });
  }
}
