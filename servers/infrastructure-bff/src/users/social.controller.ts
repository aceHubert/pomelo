import { Request } from 'express';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Anonymous, Authorized } from '@ace-nestjs/authorization';
import { createResponseSuccessType } from '@ace-pomelo/shared/server';
import { BaseController } from '@/common/controllers/base.controller';
import { SocialAuthCompleteInput, SocialAuthStartInput } from './dto/social-auth.input';
import { SocialAuthStartResultResp } from './resp/social-auth.resp';
import { SignInResultResp } from './resp/user-model.resp';
import { SocialService } from './social.service';

@ApiTags('social')
@Authorized()
@Controller('api/social')
export class SocialController extends BaseController {
  constructor(private readonly socialService: SocialService) {
    super();
  }

  @Post('oauth/start')
  @Anonymous()
  @ApiOkResponse({
    description: 'Social auth start result',
    type: () => createResponseSuccessType({ data: SocialAuthStartResultResp }, 'SocialAuthStartSuccessResp'),
  })
  async startSocialAuth(@Body() input: SocialAuthStartInput, @Req() req: Request) {
    return this.success({
      data: await this.socialService.startSocialAuth(input, this.getOrigin(req)),
    });
  }

  @Post('oauth/complete')
  @Anonymous()
  @ApiOkResponse({
    description: 'Social auth complete result',
    type: () => createResponseSuccessType({ data: SignInResultResp }, 'SocialAuthCompleteSuccessResp'),
  })
  async completeSocialAuth(@Body() input: SocialAuthCompleteInput, @Req() req: Request) {
    return this.success({
      data: await this.socialService.completeSocialAuth(input, this.getOrigin(req)),
    });
  }

  private getOrigin(req: Request) {
    return req.get('origin') || `${req.protocol}://${req.get('host')}`;
  }
}
