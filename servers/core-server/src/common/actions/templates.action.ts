import { IRAMActionDefine } from '@pomelo/ram-authorization';

export class TemplateAction implements IRAMActionDefine {
  static readonly PagedList = 'template.paged.list';
  static readonly Counts = 'template.counts';
  static readonly Create = 'template.create';
  static readonly UpdateName = 'template.update.name';
  static readonly UpdateStatus = 'template.update.status';
  static readonly Update = 'template.update';
  static readonly BulkUpdateStatus = 'template.bulk.update.status';
  static readonly Restore = 'template.restore';
  static readonly BulkRestore = 'template.bulk.restore';
  static readonly Delete = 'template.delete';
  static readonly BulkDelete = 'template.bulk.delete';
}

export class FormTemplateAction implements IRAMActionDefine {
  static readonly PagedList = 'template.form.paged.list';
  static readonly Create = 'template.form.create';
  static readonly Update = 'template.form.update';
  static readonly Delete = 'template.form.delete';
}

export class PostTemplateAction implements IRAMActionDefine {
  static readonly PagedList = 'template.post.paged.list';
  static readonly Create = 'template.post.create';
  static readonly Update = 'template.post.update';
  static readonly Delete = 'template.post.delete';
}

export class PageTemplateAction implements IRAMActionDefine {
  static readonly PagedList = 'template.page.paged.list';
  static readonly Create = 'template.page.create';
  static readonly Update = 'template.page.update';
  static readonly Delete = 'template.page.delete';
}
