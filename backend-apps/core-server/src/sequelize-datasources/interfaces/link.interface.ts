import { LinkAttributes, LinkCreationAttributes, LinkTarget, LinkVisible } from '@/orm-entities/interfaces';
import { PagedArgs, Paged } from './paged.interface';

export interface LinkModel extends LinkAttributes {}

export interface PagedLinkArgs extends PagedArgs {
  /**
   * 根据 name 模糊查询
   */
  keyword?: string;
}

export interface PagedLinkModel extends Paged<LinkModel> {}

export interface NewLinkInput
  extends Pick<
    LinkCreationAttributes,
    'url' | 'name' | 'image' | 'target' | 'description' | 'visible' | 'rel' | 'rss'
  > {}

export class UpdateLinkInput {
  url?: string;
  name?: string;
  image?: string;
  target?: LinkTarget;
  description?: string;
  visible?: LinkVisible;
  userId?: string;
  rel?: string;
  rss?: string;
}
