import { IRAMActionDefine } from 'nestjs-ram-authorization';

export class Action implements IRAMActionDefine {
  static UploadSignedUrl = 'resource.obs.upload.signedurl';

  static PostUpladSignature = 'resource.obs.upload.post-signature';
}
