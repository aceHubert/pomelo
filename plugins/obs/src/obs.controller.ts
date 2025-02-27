import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Controller, Query, Get, HttpStatus } from '@nestjs/common';
import { Authorized } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import { ApiAuthCreate, ParseQueryPipe, createResponseSuccessType } from '@ace-pomelo/shared/server';
import { ObsUploadSignedUrlResp, ObsPostUploadSignatureResp } from './resp/hw-cloud.resp';
import { Action } from './action';

// Types
import type { ObsService } from './obs.service';
import type { ObsCreateUploadSignedUrlOptionsDto, ObsCreatePostUploadSignatureOptionsDto } from './dto/hw-cloud.dto';

@ApiTags('resources')
@Authorized()
@Controller('api/res/obs')
export class ObsController {
  constructor(private readonly obsService: ObsService) {}

  /**
   * Get huawei cloud obs "PUT" method upload signed url
   */
  @Get('upload-signed-url')
  @RamAuthorized(Action.UploadSignedUrl)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Signed url',
    type: () => createResponseSuccessType({ data: ObsUploadSignedUrlResp }, 'ObsUploadSignedUrlModelSuccessResp'),
  })
  getHWCloudObsUploadSignedUrl(@Query(ParseQueryPipe) options: ObsCreateUploadSignedUrlOptionsDto) {
    const result = this.obsService.createUploadSignedUrl(options);
    return {
      success: true,
      data: result,
    };
  }

  /**
   * Get huawei cloud obs "POST" method upload signed url
   */
  @Get('post-upload-signature')
  @RamAuthorized(Action.PostUpladSignature)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Signature',
    type: () =>
      createResponseSuccessType({ data: ObsPostUploadSignatureResp }, 'ObsPostUploadSignatureModelSuccessResp'),
  })
  getHWCloudObsPostUploadSignature(@Query(ParseQueryPipe) options: ObsCreatePostUploadSignatureOptionsDto) {
    const result = this.obsService.createPostUploadSignature(options);
    return {
      success: true,
      data: result,
    };
  }
}
