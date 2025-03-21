import { ScreenType } from '@designable/core';
import { transformToTreeNode, transformToSchema } from '@designable/formily-transformer';

// Types

import type { Engine, ITreeNode } from '@designable/core';
import type { IFormilySchema, ITransformerOptions } from '@designable/formily-transformer';

export type IFormilyPageSchema = Omit<IFormilySchema, 'form'> & {
  page?: Record<string, any>;
};

/**
 * 将 transformToSchema 置换成 page 设置
 */
export function transformToPageSchema(node: ITreeNode, options?: ITransformerOptions): IFormilyPageSchema {
  const { form, schema } = transformToSchema(node, { designableFormName: 'Page', ...options });
  return {
    page: form,
    schema,
  };
}

/**
 * 将 transformToTreeNode 置换成 page 设置
 */
export function transformToPageTreeNode(formily?: IFormilyPageSchema, options?: ITransformerOptions): ITreeNode {
  const { page, schema } = formily || {};
  return transformToTreeNode({ schema, form: page }, { designableFormName: 'Page', ...options });
}

export const useFormilyMixin = (engine: Engine, type: 'form' | 'page' = 'form') => {
  const currentSchemas: {
    responsive?: IFormilySchema | IFormilyPageSchema;
    mobile?: IFormilySchema | IFormilyPageSchema;
    desktop?: IFormilySchema | IFormilyPageSchema;
  } = {};

  const currentTreeNodes: {
    responsive?: ITreeNode;
    mobile?: ITreeNode;
    desktop?: ITreeNode;
  } = {};

  const toSchema = type === 'form' ? transformToSchema : transformToPageSchema;
  const toTreeNode = type === 'form' ? transformToTreeNode : transformToPageTreeNode;

  // 缓存当前 treeNode
  const saveTreeNode = (type: ScreenType) => {
    const oldTreeNode = engine.getCurrentTree().serialize();
    switch (type) {
      case ScreenType.Mobile:
        currentTreeNodes.mobile = oldTreeNode;
        break;
      case ScreenType.PC:
        currentTreeNodes.desktop = oldTreeNode;
        break;
      default:
        currentTreeNodes.responsive = oldTreeNode;
        break;
    }
  };

  // 切换 treeNode
  const switchTreeNode = (type: ScreenType) => {
    let newTreeNode: ITreeNode;
    switch (type) {
      case ScreenType.Mobile:
        newTreeNode = currentTreeNodes.mobile ?? toTreeNode(currentSchemas?.mobile);
        break;
      case ScreenType.PC:
        newTreeNode = currentTreeNodes.desktop ?? toTreeNode(currentSchemas?.desktop);
        break;
      default:
        newTreeNode = currentTreeNodes.responsive ?? toTreeNode(currentSchemas?.responsive);
        break;
    }

    engine.setCurrentTree(newTreeNode);
    engine.workbench.currentWorkspace.history.clear();
    engine.workbench.currentWorkspace.operation.hover.clear();
    engine.workbench.currentWorkspace.operation.selection.select(engine.getCurrentTree());
  };

  // 获取 schema
  const getSchmeas = () => {
    let responsiveSchema: IFormilySchema | IFormilyPageSchema,
      mobileSchema: IFormilySchema | IFormilyPageSchema,
      desktopSchema: IFormilySchema | IFormilyPageSchema;
    switch (engine.screen.type) {
      case ScreenType.Mobile:
        mobileSchema = toSchema(engine.getCurrentTree());
        desktopSchema = toSchema(currentTreeNodes.desktop || {});
        responsiveSchema = toSchema(currentTreeNodes.responsive || {});
        break;
      case ScreenType.PC:
        mobileSchema = toSchema(currentTreeNodes.mobile || {});
        desktopSchema = toSchema(engine.getCurrentTree());
        responsiveSchema = toSchema(currentTreeNodes.responsive || {});
        break;
      default:
        mobileSchema = toSchema(currentTreeNodes.mobile || {});
        desktopSchema = toSchema(currentTreeNodes.desktop || {});
        responsiveSchema = toSchema(engine.getCurrentTree());
        break;
    }
    return {
      responsive: responsiveSchema,
      mobile: mobileSchema,
      desktop: desktopSchema,
    };
  };

  // 初始化 schema 并设置当前设计器的 treeNode
  const setSchemas = (schemas: typeof currentSchemas) => {
    // 设置当前设计器的 treeNode
    currentTreeNodes.mobile = toTreeNode(schemas?.mobile);
    currentTreeNodes.desktop = toTreeNode(schemas?.desktop);
    currentTreeNodes.responsive = toTreeNode(schemas?.responsive);
    switchTreeNode(engine.screen.type);
  };

  // treeNode 内容变化
  const addTreeNodeChangedEffect = (effect: (payload: any) => void) => {
    // treenode changed
    engine.subscribeWith(
      [
        'append:node',
        'insert:after',
        'insert:before',
        'insert:children',
        'drop:node',
        'prepend:node',
        'remove:node',
        'update:children',
        'wrap:node',
        'update:node:props',
        'history:goto',
        'history:undo',
        'history:redo',
      ],
      effect,
    );
  };

  return {
    getSchmeas,
    setSchemas,
    screenChange: (type: ScreenType, oldType: ScreenType) => {
      saveTreeNode(oldType);
      switchTreeNode(type);
    },
    addTreeNodeChangedEffect,
  };
};
