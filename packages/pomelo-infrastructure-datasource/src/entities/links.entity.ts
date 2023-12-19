import { Optional } from '../types';

export interface LinkAttributes {
  id: number;
  url: string;
  name: string;
  image: string;
  /**
   * _blank/_self
   */
  target: string;
  description: string;
  /**
   * yes/no
   */
  visible: string;
  userId: number;
  rel?: string;
  rss?: string;
  updatedAt: Date;
  createdAt: Date;
}

export interface LinkCreationAttributes extends Optional<LinkAttributes, 'id'> {}
