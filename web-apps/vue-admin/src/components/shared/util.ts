import Vue from 'vue';
import { trailingSlash } from '@ace-util/core';

/**
 *  sanitize component object
 */
export function sanitizeComponent(Component) {
  // If Component already sanitized
  if (Component.options && Component._Ctor === Component) {
    return Component;
  }
  if (!Component.options) {
    Component = Vue.extend(Component); // fix issue #6
    Component._Ctor = Component;
  } else {
    Component._Ctor = Component;
    Component.extendOptions = Component.options;
  }
  // For debugging purpose
  if (!Component.options.name && Component.options.__file) {
    Component.options.name = Component.options.__file;
  }
  return Component;
}

/**
 * get Vue component name
 */
export function getComponentName(Component): string {
  if (process.env.NODE_ENV !== 'production' && Component === undefined) {
    throw new Error(
      [
        'You are calling getComponentName(Component) with an undefined component.',
        'You may have forgotten to import it.',
      ].join('\n'),
    );
  }

  const component = sanitizeComponent(Component);
  return component.options.name;
}

export const obsPrefix = '//cdn.acehubert.com/';

/**
 * get obs display url
 */
export function getObsDisplayUrl(objectKey: string, prefix = obsPrefix) {
  return trailingSlash(prefix) + objectKey;
}
