import { h } from '@vue/composition-api';
import { Divider } from 'ant-design-vue';
import { getArrayFromOverloadedRest } from '@pomelo/shared-web';

/**
 * add divider between actions
 */
export function renderActions(components: any[]): any[];
export function renderActions(...components: any[]): any[];
export function renderActions(...componentsOrComponentArray: any[]) {
  const components = getArrayFromOverloadedRest(componentsOrComponentArray);
  return components.reduce((acc, component, index) => {
    if (index === 0) {
      return [component];
    }
    return [...acc, h(Divider, { props: { type: 'vertical' } }), component];
  }, []);
}
