import Vue from 'vue';

// Types
import type { DefineComponent } from '@/types';

export const isVueComponent = (obj: any): obj is DefineComponent<any> => {
  return obj instanceof Vue || obj?.setup || obj?.render;
};
