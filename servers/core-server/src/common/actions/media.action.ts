import { IRAMActionDefine } from '@ace-pomelo/ram-authorization';

export class MediaAction implements IRAMActionDefine {
  static readonly Upload = 'media.upload';
  static readonly Detail = 'media.detail';
  static readonly PagedList = 'media.list';
  static readonly Create = 'media.create';
  static readonly Update = 'media.update';

  // metas
  static readonly MetaDetail = 'media.meta.detail';
  static readonly MetaList = 'media.meta.list';
  static readonly MetaCreate = 'media.meta.create';
  static readonly MetaUpdate = 'media.meta.update';
  static readonly MetaDelete = 'media.meta.delete';
}
