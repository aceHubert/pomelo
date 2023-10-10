import { IRAMActionDefine } from 'nestjs-ram-authorization';

export class MediaAction implements IRAMActionDefine {
  static readonly Upload = 'media.upload';
  static readonly Detail = 'media.detail';
  static readonly PagedList = 'media.list';
  static readonly Create = 'media.create';
  static readonly Update = 'media.update';
}
