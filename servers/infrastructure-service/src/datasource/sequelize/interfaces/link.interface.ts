import { Attributes, CreationAttributes } from 'sequelize';
import { Links } from '../entities';
import { PagedArgs, Paged } from './paged.interface';

export interface LinkModel extends Attributes<Links> {
  readonly updatedAt: Date;
  readonly createdAt: Date;
}

export interface PagedLinkArgs extends PagedArgs {
  /**
   * 根据 name 模糊查询
   */
  keyword?: string;
}

export interface PagedLinkModel extends Paged<LinkModel> {}

export interface NewLinkInput extends Omit<CreationAttributes<Links>, 'userId'> {}

export interface UpdateLinkInput extends Partial<NewLinkInput> {}
