import Vue from 'vue';

// Types
import type { VNode } from 'vue';
import type { DefineComponent } from '../types';

/**
 * is Vue component
 */
export function isVueComponent(obj: any): obj is DefineComponent<any> {
  return obj instanceof Vue || obj?.setup || obj?.render;
}

/**
 * is VNode
 */
export function isVNode(obj: any): obj is VNode {
  return obj !== null && typeof obj === 'object' && Object.hasOwn(obj, 'componentOptions');
}

export function composeExport<T0 extends {}, T1 extends {}>(s0: T0, s1: T1): T0 & T1 {
  return Object.assign(s0, s1);
}
