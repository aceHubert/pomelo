import { LinkVisible, LinkTarget } from '@ace-pomelo/shared/server';
import { Optional } from './types';

export interface LinkAttributes {
  id: number;
  url: string;
  name: string;
  image: string;
  target: LinkTarget;
  description: string;
  visible: LinkVisible;
  userId: number;
  rel?: string;
  rss?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface LinkCreationAttributes extends Optional<LinkAttributes, 'id'> {}
