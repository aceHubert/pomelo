import type { DocumentNode } from '@apollo/client';
import type { Rule } from 'antd/es/form';

export type RouteKey = 'clients' | 'api-resources' | 'identity-resources';

export type PropertyPreset = {
  key: string;
  type: 'string' | 'boolean' | 'hex';
  title?: string;
  description?: string;
  defaultValue?: string | boolean;
};

export type PropertyPresetGroup = {
  group: string;
  children: PropertyPreset[];
};

export type FieldConfig = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'tags' | 'datetime';
  placeholder?: string;
  help?: string;
  defaultValue?: string | number | boolean | string[];
  options?: Array<{ label: string; value: string | number | boolean }>;
  generateValue?: () => string | number;
  generateText?: string;
  required?: boolean;
  rules?: Rule[];
};

export type ChildPanelConfig = {
  title: string;
  description?: string;
  ownerVariable: string;
  query: DocumentNode;
  create: DocumentNode;
  createMany?: DocumentNode;
  remove: DocumentNode;
  itemsPath: string;
  fields: FieldConfig[];
  propertyPresets?: PropertyPresetGroup[];
};
