import { Vue2, isVue2, getCurrentInstance, ref, isRef, isReactive, isRaw, toRefs, warn } from 'vue-demi';
import { hasOwn, proxy, isObject, isPlainObject, isArray, isFunction } from '@ace-util/core';

// Types
import type { ComponentInstance, Data, Ref } from 'vue-demi';

function asVmProperty(vm: ComponentInstance, propName: string, propValue: Ref<unknown>) {
  const props = vm.$options.props;
  if (!(propName in vm) && !(props && hasOwn(props, propName))) {
    if (isRef(propValue)) {
      proxy(vm, propName, {
        get: () => propValue.value,
        set: (val: unknown) => {
          propValue.value = val;
        },
      });
    } else {
      proxy(vm, propName, {
        get: () => {
          if (isReactive(propValue)) {
            (propValue as any).__ob__.dep.depend();
          }
          return propValue;
        },
        set: (val: any) => {
          propValue = val;
        },
      });
    }
  }
}

function customReactive(target: object, seen = new Set()) {
  if (seen.has(target)) return;
  if (!isPlainObject(target) || isRef(target) || isReactive(target) || isRaw(target)) return;
  // @ts-expect-error https://github.com/vuejs/vue/pull/12132
  const defineReactive = Vue2.util.defineReactive;

  Object.keys(target).forEach((k) => {
    const val = target[k];
    defineReactive(target, k, val);
    if (val) {
      seen.add(val);
      customReactive(val, seen);
    }
    return;
  });
}

function hasReactiveArrayChild(target: object, visited = new Map()): boolean {
  if (visited.has(target)) {
    return visited.get(target);
  }
  visited.set(target, false);
  if (isArray(target) && isReactive(target)) {
    visited.set(target, true);
    return true;
  }

  if (!isPlainObject(target) || isRaw(target) || isRef(target)) {
    return false;
  }
  return Object.keys(target).some((x) => hasReactiveArrayChild(target[x], visited));
}

/**
 * export 临时兼容 Vue 2.6.x
 */
export const expose = (exposed?: Record<string, any>) => {
  const instance = getCurrentInstance();
  if (!instance) {
    throw new Error('expose should be called in setup().');
  } else if (!isVue2) {
    throw new Error('expose should be called in Vue2.');
  }

  if (instance.exposed) {
    warn(`expose() should be called only once per setup().`);
  } else {
    if (exposed != null) {
      let exposedType: string = typeof exposed;
      if (exposedType === 'object') {
        if (Array.isArray(exposed)) {
          exposedType = 'array';
        } else if (isRef(exposed)) {
          exposedType = 'ref';
        }
      }
      if (exposedType !== 'object') {
        warn(`expose() should be passed a plain object, received ${exposedType}.`);
      }

      if (isReactive(exposed)) {
        exposed = toRefs(exposed) as Data;
      }
      const bindingObj = exposed;

      Object.keys(bindingObj).forEach((name) => {
        let bindingValue: any = bindingObj[name];

        if (!isRef(bindingValue)) {
          if (!isReactive(bindingValue)) {
            if (isFunction(bindingValue)) {
              const copy = bindingValue;
              bindingValue = bindingValue.bind(instance.proxy);
              Object.keys(copy).forEach(function (ele) {
                bindingValue[ele] = copy[ele];
              });
            } else if (!isObject(bindingValue)) {
              bindingValue = ref(bindingValue);
            } else if (hasReactiveArrayChild(bindingValue)) {
              // creates a custom reactive properties without make the object explicitly reactive
              // NOTE we should try to avoid this, better implementation needed
              customReactive(bindingValue);
            }
          } else if (isArray(bindingValue)) {
            bindingValue = ref(bindingValue);
          }
        }
        asVmProperty(instance.proxy, name, bindingValue);
      });
    }
  }
  instance.exposed = exposed || {};
};

declare module '@vue/composition-api' {
  interface ComponentInternalInstance {
    exposed?: Record<string, any>;
  }
}
