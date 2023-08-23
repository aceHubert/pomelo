/* eslint-disable @typescript-eslint/no-empty-interface */
import type { VNode, ScopedSlot } from 'vue/types/vnode';
import type { ComponentRenderProxy } from '@vue/composition-api';

type ReservedProps = {
  key?: string | number | symbol;
  ref?: string;
  refInFor?: boolean;
  vModel?: any;
  props?: { [key: string]: any };
  attrs?: { [key: string]: any };
  scopedSlots?: {
    [name: string]: ((...args: any[]) => ReturnType<ScopedSlot>) | undefined;
  };
  /**
   * @deprecated Old named slot syntax has been deprecated, use the new syntax
   * instead: `<template v-slot:name>`
   * https://v2.vuejs.org/v2/guide/components-slots.html#Named-Slots
   */
  slot?: string;
};

/**
 * Default allowed non-declared props on component in TSX
 */
interface AllowedComponentProps {
  class?: unknown;
  style?: unknown;
}

/**
 * For extending allowed non-declared props on components in TSX
 */
interface ComponentCustomProps {}

declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface ElementClass extends ComponentRenderProxy {}
    interface ElementAttributesProperty {
      $props: any; // specify the property name to use
    }
    interface IntrinsicElements {
      [elem: string]: any;
    }
    interface IntrinsicAttributes extends ReservedProps, AllowedComponentProps, ComponentCustomProps {}
  }
}
