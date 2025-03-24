import { IRAMActionDefine } from '@ace-pomelo/nestjs-ram-authorization';

export class CommentAction implements IRAMActionDefine {
  static readonly List = 'comment.list';
  static readonly Get = 'comment.get';
  static readonly Create = 'comment.create';
  static readonly Update = 'comment.update';
  static readonly Delete = 'comment.delete';

  // metas
  static readonly MetaDetail = 'comment.meta.detail';
  static readonly MetaList = 'comment.meta.list';
  static readonly MetaCreate = 'comment.meta.create';
  static readonly MetaUpdate = 'comment.meta.update';
  static readonly MetaDelete = 'comment.meta.delete';
}
