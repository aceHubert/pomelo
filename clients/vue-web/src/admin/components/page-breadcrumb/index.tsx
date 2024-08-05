import { defineComponent, ref } from '@vue/composition-api';
import { equals } from '@ace-util/core';
import { LayoutAdmin } from 'antdv-layout-pro';
import { useEffect } from 'antdv-layout-pro/shared';

// Types
import type { PropType } from '@vue/composition-api';
import type { BreadcrumbConfig } from 'antdv-layout-pro/types';
import type { PresetBreadcrumbItem, BreadcrumbProp } from 'antdv-layout-pro/components/layout-admin/NestedBreadcrumb';

/**
 * 页面面包屑
 */
export const PageBreadcrumb = defineComponent({
  name: 'PageBreadcrumb',
  props: {
    /**
     * 传入的面包屑数据
     * ，当为 true 时，为通过路由计算的数组
     * ，当为 false 时，不显示面包屑
     * ，当为 Function 时，参数为路由计算的数组
     * ，默认值：true
     */
    breadcrumb: {
      type: [Boolean, Array, Function] as PropType<
        | boolean
        | Array<PresetBreadcrumbItem>
        | ((routeBreadcrumbs: BreadcrumbConfig[]) => Exclude<PresetBreadcrumbItem, string>[])
      >,
      default: true,
    },
  },
  // emits: ['clientChange', 'enterpriseChange'],
  setup(props, { slots }) {
    const currentBreadcrumbs = ref<BreadcrumbProp>([]);

    let cachedPropBreadcrumb: Array<PresetBreadcrumbItem | '_client' | '_enterprise'>;
    useEffect(
      () => {
        if (typeof props.breadcrumb !== typeof currentBreadcrumbs.value) {
          // 如果类型不一致，就重新赋值
          currentBreadcrumbs.value = format(props.breadcrumb);
        } else if (
          Array.isArray(props.breadcrumb) &&
          (!cachedPropBreadcrumb || !equals(props.breadcrumb, cachedPropBreadcrumb)) // props 赋值 Array/Object 时重复响应问题
        ) {
          // 如果是数组，就比较数组是否相等，不相等就重新赋值
          cachedPropBreadcrumb = [...props.breadcrumb];
          currentBreadcrumbs.value = format(props.breadcrumb);
        }
        return () => {
          currentBreadcrumbs.value = [];
        };

        // 格式化面包屑数据
        function format(
          breadcrumb:
            | boolean
            | Array<PresetBreadcrumbItem>
            | ((routeBreadcrumbs: BreadcrumbConfig[]) => Exclude<PresetBreadcrumbItem, String>[]),
        ) {
          if (Array.isArray(breadcrumb)) {
            return breadcrumb.map((item) => {
              // if (item === '_client') {
              //   return defineComponent({
              //     computed: {
              //       currectClient: {
              //         get() {
              //           return storage.get<SelectorItem>('selector.client');
              //         },
              //         set(item: SelectorItem) {
              //           // save to localstorage
              //           storage.set('selector.client', item);
              //         },
              //       },
              //     },
              //     mounted() {
              //       // 如果有默认值，就触发一次 change 事件
              //       this.currectClient && emit('clientChange', this.currectClient.value);
              //     },
              //     render() {
              //       return (
              //         <ClientSelector
              //           defaultItem={this.currectClient}
              //           onChange={({ item }) => {
              //             this.currectClient = item;
              //             emit('clientChange', item.value);
              //           }}
              //         />
              //       );
              //     },
              //   });
              // } else if (item === '_enterprise') {
              //   return defineComponent({
              //     computed: {
              //       currectEnterprise: {
              //         get() {
              //           return storage.get<SelectorItem>('selector.enterprise');
              //         },
              //         set(item: SelectorItem) {
              //           // save to localstorage
              //           storage.set('selector.enterprise', item);
              //         },
              //       },
              //     },
              //     mounted() {
              //       // 如果有默认值，就触发一次 change 事件
              //       this.currectEnterprise && emit('enterpriseChange', this.currectEnterprise.value);
              //     },
              //     render() {
              //       return (
              //         <EnterpriseSelector
              //           defaultItem={this.currectEnterprise}
              //           onChange={({ item }) => {
              //             this.currectEnterprise = item;
              //             emit('enterpriseChange', item.value);
              //           }}
              //         />
              //       );
              //     },
              //   });
              // }

              return item;
            });
          }
          return breadcrumb;
        }
      },
      () => props.breadcrumb,
    );

    return () => (
      <LayoutAdmin.NestedBreadcrumb breadcrumb={currentBreadcrumbs.value}>
        {slots.default?.()}
      </LayoutAdmin.NestedBreadcrumb>
    );
  },
});
