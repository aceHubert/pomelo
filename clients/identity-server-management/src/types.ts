import type { DocumentNode } from '@apollo/client';

export type RouteKey = 'clients' | 'api-resources' | 'identity-resources';

export type FieldConfig = {
  name: string;
  label: string;
  type?: 'text' | 'number' | 'checkbox';
  placeholder?: string;
  defaultValue?: string | number | boolean;
};

export type ChildPanelConfig = {
  title: string;
  ownerVariable: string;
  query: DocumentNode;
  create: DocumentNode;
  remove: DocumentNode;
  itemsPath: string;
  fields: FieldConfig[];
};
