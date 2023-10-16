import { transformToSchema, transformToTreeNode } from '@designable/formily-transformer';

// Types
import type { ITreeNode } from '@designable/core';
import type { IFormilySchema, ITransformerOptions } from '@designable/formily-transformer';

export type IFormilyPageSchema = Omit<IFormilySchema, 'form'> & {
  page?: Record<string, any>;
};

/**
 * 将 transformToSchema 置换成 page 设置
 */
export function transformToPageSchema(node: ITreeNode, options: ITransformerOptions = {}): IFormilyPageSchema {
  const { form, ...rest } = transformToSchema(node, { designableFormName: 'Page', ...options });
  return {
    page: form,
    ...rest,
  };
}

/**
 * 将 transformToTreeNode 置换成 page 设置
 */
export function transformToPageTreeNode(formily: IFormilyPageSchema, options: ITransformerOptions = {}): ITreeNode {
  const { page, ...rest } = formily;
  return transformToTreeNode({ ...rest, form: page }, { designableFormName: 'Page', ...options });
}
