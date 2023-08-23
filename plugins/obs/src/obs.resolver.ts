import { Resolver, Args, Query } from '@nestjs/graphql';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { Authorized } from 'nestjs-identity';
import { RamAuthorized, Actions } from '@/common/ram-actions';
import { ObsUploadSignedUrlModel, ObsPostUploadSignatureModel } from './models/hw-cloud.modal';

// Types
import type { HWCloudObsService } from './obs.service';
import type {
  ObsCreateUploadSignedUrlOptionsArgs,
  ObsCreatePostUploadSignatureOptionsArgs,
} from './dto/hw-cloud.input';

@Authorized()
@Resolver()
export class ObsFileResolver extends BaseResolver {
  constructor(private readonly hwCloudObsService: HWCloudObsService) {
    super();
  }

  /**
   * Get huawei cloud obs "PUT" methos upload signed url
   */
  @RamAuthorized(Actions.Resources.Obs.UploadSignedUrl)
  @Query((returns) => ObsUploadSignedUrlModel, {
    nullable: true,
    description: 'Signed url.',
  })
  hwCloudObsUploadSignedUrl(@Args() args: ObsCreateUploadSignedUrlOptionsArgs): ObsUploadSignedUrlModel {
    return this.hwCloudObsService.createUploadSignedUrl(args);
  }

  /**
   * Get huawei cloud obs "POST" method upload signed url
   */
  @RamAuthorized(Actions.Resources.Obs.UploadSignedUrl)
  @Query((returns) => ObsPostUploadSignatureModel, {
    nullable: true,
    description: 'Signed url.',
  })
  hwCloudObsPostUploadSignature(@Args() args: ObsCreatePostUploadSignatureOptionsArgs): ObsPostUploadSignatureModel {
    return this.hwCloudObsService.createPostUploadSignature(args);
  }
}
