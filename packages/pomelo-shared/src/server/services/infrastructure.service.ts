export const SERVICE_NAME = 'INFRASTRUCTURE_SERVICE';

export function createMetaPattern(prefix: string) {
  class MetaPattern {
    static readonly GetMeta = { cmd: `${prefix}.meta.get` };
    static readonly GetMetas = { cmd: `${prefix}.metas.get` };
    static readonly CreateMeta = { cmd: `${prefix}.meta.create` };
    static readonly CreateMetas = { cmd: `${prefix}.metas.create` };
    static readonly UpdateMeta = { cmd: `${prefix}.meta.update` };
    static readonly UpdateMetaByKey = { cmd: `${prefix}.meta.update.byKey` };
    static readonly DeleteMeta = { cmd: `${prefix}.meta.delete` };
    static readonly DeleteMetaByKey = { cmd: `${prefix}.meta.delete.byKey` };
  }

  return MetaPattern;
}

export class SiteInitPattern {
  static readonly IsRequired = { cmd: 'site.init.required' };
  static readonly Start = { cmd: 'site.init.start' };
}

export class CommentPattern {
  static readonly Get = { cmd: 'comment.get' };
  static readonly GetPaged = { cmd: 'comment.getPaged' };
  static readonly Create = { cmd: 'comment.create' };
  static readonly Update = { cmd: 'comment.update' };
  static readonly Delete = { cmd: 'comment.delete' };
}

export class LinkPattern {
  static readonly Get = { cmd: 'link.get' };
  static readonly GetPaged = { cmd: 'link.getPaged' };
  static readonly Create = { cmd: 'link.create' };
  static readonly Update = { cmd: 'link.update' };
  static readonly Delete = { cmd: 'link.delete' };
}

export class OptionPattern {
  static readonly Get = { cmd: 'option.get' };
  static readonly GetAutoloads = { cmd: 'option.get.autoloads' };
  static readonly GetValue = { cmd: 'option.get.value' };
  static readonly GetList = { cmd: 'option.getList' };
  static readonly NameExists = { cmd: 'option.name.exists' };
  static readonly Create = { cmd: 'option.create' };
  static readonly Update = { cmd: 'option.update' };
  static readonly Reset = { cmd: 'option.reset' };
  static readonly Delete = { cmd: 'option.delete' };
}

export class MediaPattern extends createMetaPattern('media') {
  static readonly Get = { cmd: 'media.get' };
  static readonly GetByName = { cmd: 'media.get.byName' };
  static readonly GetPaged = { cmd: 'media.getPaged' };
  static readonly FilenameExists = { cmd: 'media.filename.exists' };
  static readonly Create = { cmd: 'media.create' };
  static readonly Update = { cmd: 'media.update' };
  static readonly UpdateMetaData = { cmd: 'media.update.metaData' };
}

export class TemplatePattern extends createMetaPattern('template') {
  static readonly Get = { cmd: 'template.get' };
  static readonly GetByName = { cmd: 'template.get.byName' };
  static readonly GetOptions = { cmd: 'template.get.options' };
  static readonly GetNames = { cmd: 'template.getNames' };
  static readonly CountBySelf = { cmd: 'template.count.bySelf' };
  static readonly CountByDay = { cmd: 'template.count.byDay' };
  static readonly CountByMonth = { cmd: 'template.count.byMonth' };
  static readonly CountByYear = { cmd: 'template.count.byYear' };
  static readonly CountByStatus = { cmd: 'template.count.byStatus' };
  static readonly GetPaged = { cmd: 'template.getPaged' };
  static readonly GetRevisionCount = { cmd: 'template.getRevisionCount' };
  static readonly GetRevisionList = { cmd: 'template.getRevisionList' };
  static readonly Create = { cmd: 'template.create' };
  static readonly CreatePost = { cmd: 'template.create.post' };
  static readonly CreatePage = { cmd: 'template.create.page' };
  static readonly CreateForm = { cmd: 'template.create.form' };
  static readonly Update = { cmd: 'template.update' };
  static readonly UpdatePost = { cmd: 'template.update.post' };
  static readonly UpdatePage = { cmd: 'template.update.page' };
  static readonly UpdateForm = { cmd: 'template.update.form' };
  static readonly UpdateName = { cmd: 'template.update.name' };
  static readonly UpdateStatus = { cmd: 'template.update.status' };
  static readonly BulkUpdateStatus = { cmd: 'template.bulkUpdate.status' };
  static readonly UpdateCommentCount = { cmd: 'template.update.commentCount' };
  static readonly Restore = { cmd: 'template.restore' };
  static readonly BulkRestore = { cmd: 'template.bulkRestore' };
  static readonly Delete = { cmd: 'template.delete' };
  static readonly BulkDelete = { cmd: 'template.bulkDelete' };
}

export class TermTaxonomyPattern extends createMetaPattern('termTaxonomy') {
  static readonly Get = { cmd: 'termTaxonomy.get' };
  static readonly GetList = { cmd: 'termTaxonomy.getList' };
  static readonly GetListByObjectId = { cmd: 'termTaxonomy.getList.byObjectId' };
  static readonly GetListByObjectIds = { cmd: 'termTaxonomy.getList.byObjectIds' };
  static readonly Create = { cmd: 'termTaxonomy.create' };
  static readonly CreateRelationship = { cmd: 'termTaxonomy.create.relationship' };
  static readonly Update = { cmd: 'termTaxonomy.update' };
  static readonly DeleteRelationship = { cmd: 'termTaxonomy.delete.relationship' };
  static readonly Delete = { cmd: 'termTaxonomy.delete' };
  static readonly BulkDelete = { cmd: 'termTaxonomy.bulkDelete' };
}

export class UserPattern extends createMetaPattern('user') {
  static readonly Get = { cmd: 'user.get' };
  static readonly GetEmail = { cmd: 'user.get.email' };
  static readonly GetMobile = { cmd: 'user.get.mobile' };
  static readonly GetCapabilities = { cmd: 'user.get.capabilities' };
  static readonly HasCapability = { cmd: 'user.has.capability' };
  static readonly GetList = { cmd: 'user.getList' };
  static readonly GetPaged = { cmd: 'user.getPaged' };
  static readonly CountByStatus = { cmd: 'user.count.byStatus' };
  static readonly CountByRole = { cmd: 'user.count.byRole' };
  static readonly LoginNameExists = { cmd: 'user.loginName.exists' };
  static readonly MobileExists = { cmd: 'user.mobile.exists' };
  static readonly EmailExists = { cmd: 'user.email.exists' };
  static readonly Create = { cmd: 'user.create' };
  static readonly Update = { cmd: 'user.update' };
  static readonly UpdateEmail = { cmd: 'user.update.email' };
  static readonly UpdateMobile = { cmd: 'user.update.mobile' };
  static readonly UpdateStatus = { cmd: 'user.update.status' };
  static readonly UpdatePassword = { cmd: 'user.update.password' };
  static readonly ResetPassword = { cmd: 'user.reset.password' };
  static readonly Verify = { cmd: 'user.verify' };
  static readonly Delete = { cmd: 'user.delete' };
  static readonly BulkDelete = { cmd: 'user.bulkDelete' };
}
