import { IRAMActionDefine } from '@ace-pomelo/ram-authorization';

export class UserAction implements IRAMActionDefine {
  static readonly Detail = 'user.detail';
  static readonly PagedList = 'user.paged-list';
  static readonly Create = 'user.create';
  static readonly Update = 'user.update';
  static readonly UpdateStatus = 'user.update.status';
  static readonly Delete = 'user.delete';

  // metas
  static readonly MetaDetail = 'user.meta.detail';
  static readonly MetaList = 'user.meta.list';
  static readonly MetaCreate = 'user.meta.create';
  static readonly MetaUpdate = 'user.meta.update';
  static readonly MetaDelete = 'user.meta.delete';
}
