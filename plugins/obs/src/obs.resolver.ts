import { Resolver, Args, Query } from '@nestjs/graphql';
import { Authorized } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { BaseResolver } from '@ace-pomelo/shared-server';
import { ObsUploadSignedUrlModel, ObsPostUploadSignatureModel } from './models/hw-cloud.modal';
import { Action } from './action';

// Types
import type { ObsService } from './obs.service';
import type {
  ObsCreateUploadSignedUrlOptionsArgs,
  ObsCreatePostUploadSignatureOptionsArgs,
} from './dto/hw-cloud.input';

@Authorized()
@Resolver()
export class ObsResolver extends BaseResolver {
  constructor(private readonly obsService: ObsService) {
    super();
  }

  /**
   * Get huawei cloud obs "PUT" methos upload signed url
   */
  @RamAuthorized(Action.UploadSignedUrl)
  @Query((returns) => ObsUploadSignedUrlModel, {
    nullable: true,
    description: 'Signed url.',
  })
  hwCloudObsUploadSignedUrl(@Args() args: ObsCreateUploadSignedUrlOptionsArgs): ObsUploadSignedUrlModel {
    return this.obsService.createUploadSignedUrl(args);
  }

  /**
   * Get huawei cloud obs "POST" method upload signed url
   */
  @RamAuthorized(Action.UploadSignedUrl)
  @Query((returns) => ObsPostUploadSignatureModel, {
    nullable: true,
    description: 'Signed url.',
  })
  hwCloudObsPostUploadSignature(@Args() args: ObsCreatePostUploadSignatureOptionsArgs): ObsPostUploadSignatureModel {
    return this.obsService.createPostUploadSignature(args);
  }
}
