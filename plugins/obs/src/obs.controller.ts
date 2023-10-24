import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Controller, Query, Get, HttpStatus } from '@nestjs/common';
import { ApiAuth, BaseController, ParseQueryPipe, createResponseSuccessType } from '@pomelo/shared-server';
import { Authorized } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { ObsUploadSignedUrlResp, ObsPostUploadSignatureResp } from './resp/hw-cloud.resp';
import { Action } from './action';

// Types
import type { ObsService } from './obs.service';
import type { ObsCreateUploadSignedUrlOptionsDto, ObsCreatePostUploadSignatureOptionsDto } from './dto/hw-cloud.dto';

@ApiTags('resources')
@Authorized()
@Controller('api/res/obs')
export class ObsController extends BaseController {
  constructor(private readonly obsService: ObsService) {
    super();
  }

  /**
   * Get huawei cloud obs "PUT" method upload signed url
   */
  @Get('upload-signed-url')
  @RamAuthorized(Action.UploadSignedUrl)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Signed url',
    type: () => createResponseSuccessType({ data: ObsUploadSignedUrlResp }, 'ObsUploadSignedUrlModelSuccessResp'),
  })
  getHWCloudObsUploadSignedUrl(@Query(ParseQueryPipe) options: ObsCreateUploadSignedUrlOptionsDto) {
    const result = this.obsService.createUploadSignedUrl(options);
    return this.success({
      data: result,
    });
  }

  /**
   * Get huawei cloud obs "POST" method upload signed url
   */
  @Get('post-upload-signature')
  @RamAuthorized(Action.PostUpladSignature)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Signature',
    type: () =>
      createResponseSuccessType({ data: ObsPostUploadSignatureResp }, 'ObsPostUploadSignatureModelSuccessResp'),
  })
  getHWCloudObsPostUploadSignature(@Query(ParseQueryPipe) options: ObsCreatePostUploadSignatureOptionsDto) {
    const result = this.obsService.createPostUploadSignature(options);
    return this.success({
      data: result,
    });
  }
}
