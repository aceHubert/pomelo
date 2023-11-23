import { IRAMActionDefine } from '@ace-pomelo/ram-authorization';

export class Action implements IRAMActionDefine {
  static UploadSignedUrl = 'resource.obs.upload.signedurl';

  static PostUpladSignature = 'resource.obs.upload.post-signature';
}
