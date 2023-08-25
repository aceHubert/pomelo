import { IRAMActionDefine } from 'nestjs-ram-authorization';

export class TermTaxonomyAction implements IRAMActionDefine {
  static readonly CategoryList = 'taxonomy.category.list';
  static readonly TagList = 'taxonomy.tag.list';
  static readonly List = 'taxonomy.list';
  static readonly ListByObjectId = 'taxonomy.list.byobjectid';
  static readonly Create = 'taxonomy.create';
  static readonly CreateRelationship = 'taxonomy.create.relationship';
  static readonly Update = 'taxonomy.update';
  static readonly Delete = 'taxonomy.delete';
  static readonly BulkDelete = 'taxonomy.bulk.delete';
  static readonly DeleteRelationship = 'taxonomy.delete.relationship';
}
