import { defineComponent, ref, provide, inject, toRef } from 'vue-demi';
import { Space } from 'ant-design-vue';
import { useEffect } from '../../shared';
import { isVueComponent } from '../../utils';
import { Breadcrumb } from '../breadcrumb';

// Types
import type { Ref, PropType, InjectionKey } from 'vue-demi';
import type { DefineComponent, BreadcrumbConfig } from '../../types';
import type { BreadcrumbItem } from '../breadcrumb';

/**
 * 面包屑项（['_route',  BreadcrumbConfig, DefineComponent<any>]）
 * 预设置面包屑：
 * _route：当前路由面包屑
 */
export type PresetBreadcrumbItem = BreadcrumbConfig | DefineComponent<any> | '_route';

export type BreadcrumbProp =
  | boolean
  | PresetBreadcrumbItem[]
  | ((routeBreadcrumbs: BreadcrumbConfig[]) => Exclude<PresetBreadcrumbItem, string>[]);

const BreadcrumbProviderInjectKey: InjectionKey<Ref<BreadcrumbConfig[]>> = Symbol('BreadcrumbProvider');

const NestedBreadcrumbInjectKey: InjectionKey<{
  setBreadcrumb: (breadcrumb: Array<BreadcrumbItem | DefineComponent<any>>) => void;
}> = Symbol('NestedNestedBreadcrumb');

/**
 * 提供路由面包屑数据给 NestedBreadcrumb 使用
 */
export const BreadcrumbProvider = defineComponent({
  name: 'BreadcrumbProvider',
  props: {
    breadcrumb: {
      type: Array as PropType<BreadcrumbConfig[]>,
      required: true,
    },
  },
  setup(props, { slots }) {
    provide(BreadcrumbProviderInjectKey, toRef(props, 'breadcrumb'));

    return () => slots.default?.();
  },
});

/**
 * 面包屑容器
 * 如果嵌套使用时，只显示最外层的面包屑
 */
export const NestedBreadcrumb = defineComponent({
  name: 'NestedBreadcrumb',
  props: {
    /**
     * 传入的面包屑数据, 默认值：true
     * 当为 true 时，使用路由的面包屑数据
     * 当为 false 时，不显示面包屑
     */
    breadcrumb: {
      type: [Boolean, Array, Function] as PropType<BreadcrumbProp>,
      default: true,
    },
  },
  setup(props, { slots }) {
    const injectBreadcrumb = inject(BreadcrumbProviderInjectKey, ref([]));
    const nestedContainer = inject(NestedBreadcrumbInjectKey, void 0);

    const currentBreadcrumbs = ref<Array<BreadcrumbItem | DefineComponent<any>>>([]);

    useEffect(() => {
      if (nestedContainer) {
        nestedContainer.setBreadcrumb(getBreadcrumbs(props.breadcrumb));
      } else {
        currentBreadcrumbs.value = getBreadcrumbs(props.breadcrumb);
      }
    }, [() => props.breadcrumb, injectBreadcrumb]);

    provide(
      NestedBreadcrumbInjectKey,
      nestedContainer ?? {
        setBreadcrumb: (breadcrumb) => {
          currentBreadcrumbs.value = breadcrumb;
        },
      },
    );

    function getBreadcrumbs(config: BreadcrumbProp) {
      let breadcrumbs: Array<Exclude<PresetBreadcrumbItem, string>> = [];
      if (typeof config === 'boolean') {
        breadcrumbs = config ? injectBreadcrumb.value : [];
      } else if (Array.isArray(config)) {
        breadcrumbs = config.reduce((prev, curr) => {
          switch (curr) {
            case '_route':
              prev.push(...injectBreadcrumb.value);
              break;
            default:
              prev.push(curr);
              break;
          }
          return prev;
        }, [] as Array<Exclude<PresetBreadcrumbItem, string>>);
      } else if (typeof config === 'function') {
        breadcrumbs = config([...injectBreadcrumb.value]);
      }

      return breadcrumbs.map((item) => {
        if (isVueComponent(item)) return item;

        const { label, path } = item;
        return {
          label,
          path,
          isLink: !!path && (typeof path === 'function' || path.substring(0, path.indexOf('?')) !== location.pathname), // exclude query string
        };
      });
    }

    return () =>
      nestedContainer ? (
        slots.default?.()
      ) : (
        <div class="breadcrumb-container">
          <Space class="py-3">
            {slots.prefix?.()}
            <Breadcrumb items={currentBreadcrumbs.value}></Breadcrumb>
            {slots.suffix?.()}
          </Space>
          {slots.default?.()}
        </div>
      );
  },
});
