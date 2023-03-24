import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Controller, Query, Get, HttpStatus } from '@nestjs/common';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { BaseController } from '@/common/controllers/base.controller';
import { Authorized } from '@/common/decorators/authorized.decorator';
import { RamAuthorized, Actions } from '@/common/decorators/ram-authorized.decorator';
import { ParseQueryPipe } from '@/common/pipes/parse-query.pipe';
import { createResponseSuccessType } from '@/common/utils/swagger-type.util';
import { HWCloudObsService } from './obs.service';

// Types

import { ObsCreateUploadSignedUrlOptionsDto, ObsCreatePostUploadSignatureOptionsDto } from './dto/hw-cloud.dto';
import { ObsUploadSignedUrlResp, ObsPostUploadSignatureResp } from './resp/hw-cloud.resp';

@ApiTags('resources')
@Authorized()
@Controller('api/res')
export class ObsFileController extends BaseController {
  constructor(private readonly hwCloudObsService: HWCloudObsService) {
    super();
  }

  /**
   * Get huawei cloud obs "PUT" method upload signed url
   */
  @Get('hw-cloud/obs/upload-signed-url')
  @RamAuthorized(Actions.Resources.Obs.UploadSignedUrl)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Signed url',
    type: () => createResponseSuccessType({ data: ObsUploadSignedUrlResp }, 'ObsUploadSignedUrlModelSuccessResp'),
  })
  getHWCloudObsUploadSignedUrl(@Query(ParseQueryPipe) options: ObsCreateUploadSignedUrlOptionsDto) {
    const result = this.hwCloudObsService.createUploadSignedUrl(options);
    return this.success({
      data: result,
    });
  }

  /**
   * Get huawei cloud obs "POST" method upload signed url
   */
  @Get('hw-cloud/obs/post-upload-signature')
  @RamAuthorized(Actions.Resources.Obs.PostUpladSignature)
  @ApiAuth('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({
    description: 'Signature',
    type: () =>
      createResponseSuccessType({ data: ObsPostUploadSignatureResp }, 'ObsPostUploadSignatureModelSuccessResp'),
  })
  getHWCloudObsPostUploadSignature(@Query(ParseQueryPipe) options: ObsCreatePostUploadSignatureOptionsDto) {
    const result = this.hwCloudObsService.createPostUploadSignature(options);
    return this.success({
      data: result,
    });
  }
}
