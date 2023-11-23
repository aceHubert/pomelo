import { Optional } from '../types';

/**
 * 链接打开方式
 */
export enum LinkTarget {
  Blank = '_blank',
  Self = '_self',
}

/**
 * 链接是否显示
 */
export enum LinkVisible {
  Yes = 'yes',
  No = 'no',
}

export interface LinkAttributes {
  id: number;
  url: string;
  name: string;
  image: string;
  target: LinkTarget;
  description: string;
  visible: LinkVisible;
  userId: number;
  rel: string;
  rss: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface LinkCreationAttributes extends Optional<LinkAttributes, 'id' | 'visible' | 'userId' | 'rel' | 'rss'> {}
