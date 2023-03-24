import {
  TermTaxonomyAttributes,
  TermTaxonomyCreationAttributes,
  TermRelationshipAttributes,
  TermRelationshipCreationAttributes,
} from '@/orm-entities/interfaces';
import { MetaModel, NewMetaInput } from './meta.interface';

/**
 * 协议（类别）实体
 */
export interface TermTaxonomyModel extends TermTaxonomyAttributes {}

export interface TermTaxonomyMetaModel extends MetaModel {
  termTaxonomyId: number;
}

export interface NewTermTaxonomyMetaInput extends NewMetaInput {
  termTaxonomyId: number;
}

/**
 * 协议关系
 */
export interface TermRelationshipModel extends TermRelationshipAttributes {}

/**
 * 协议（类别）搜索条件
 */
export interface TermTaxonomyArgs {
  taxonomy: string;
  parentId?: number;
  keyword?: string;
  group?: number;
}

/**
 * 协议关系搜索条件
 */
export interface TermTaxonomyByObjectIdArgs {
  objectId: number;
  taxonomy: string;
  parentId?: number;
  group?: number;
  desc?: boolean;
}

/**
 * 新建协议（类别）实体
 */
export interface NewTermTaxonomyInput
  extends Pick<TermTaxonomyCreationAttributes, 'name' | 'taxonomy' | 'description' | 'parentId' | 'group'> {
  /**
   * 可为空，不填将以name填充
   */
  slug?: string;
  /**
   * 如果有值，则自动绑定关系
   */
  objectId?: number;
}

/**
 * 修改协议模型
 */
export interface UpdateTermTaxonomyInput
  extends Partial<Pick<NewTermTaxonomyInput, 'name' | 'slug' | 'description' | 'parentId' | 'group'>> {}

/**
 * 新建协议关系实体
 */
export interface NewTermRelationshipInput extends TermRelationshipCreationAttributes {}
