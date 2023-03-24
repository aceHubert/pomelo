import { snakeCase } from 'lodash-es';
import { defineComponent, PropType, ref, watch, inject } from '@vue/composition-api';
import { Breadcrumb } from 'ant-design-vue';
import { ConfigConsumerProps } from '@/components/config-provider/configConsumerProps';

// Types
import VueRouter, { Route } from 'vue-router';
import type { ConfigProviderProps } from '@/components/config-provider/ConfigProvider';

export type BreadItem = {
  label: string;
  to: string;
  isLink?: boolean;
};

export default defineComponent({
  name: 'Breadcrumb',
  props: {
    /**
     * 设置 null, 将会根据$route 变化生成
     * 如需传自定义参数，初始值必须设置成数组
     */
    items: {
      type: Array as PropType<BreadItem[]>,
    },
    /**
     * vue-router instance
     */
    router: {
      type: Object as PropType<VueRouter>,
      required: true,
    },
    /**
     * current route
     * 如果 items 没有传则根据当前的路由计算
     */
    route: {
      type: Object as PropType<Route>,
      required: true,
    },
    /** 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text */
    i18nKeyPrefix: { type: String as PropType<string>, default: 'components.breadcrumb' },
  },
  setup(props) {
    const configProvider = inject<ConfigProviderProps>('configProvider', ConfigConsumerProps);

    const currentBreadItems = ref<BreadItem[]>([]);
    const genBreadcrumb = () => {
      const items: BreadItem[] = [];
      // this.breadList.push({name: 'index', path: '/dashboard/', meta: {title: '首页'}})

      const matched = props.route.matched;
      matched.forEach(({ name, path, meta: { title } }, index) => {
        // item.name !== 'index' && this.breadList.push(item)
        if (index > 0) {
          const prevRoute = matched[index - 1];
          const { resolved } = props.router.resolve(prevRoute.path);
          if (resolved.name === name) {
            // 嵌套路由与parent 路由相同，直接修改上一个的 label
            items[index - 1].label =
              (title &&
                (configProvider.i18nRender(
                  `${props.i18nKeyPrefix}.breadcrumb.${snakeCase(title)}`,
                  title,
                ) as string)) ||
              (name &&
                (configProvider.i18nRender(`${props.i18nKeyPrefix}.breadcrumb.${snakeCase(name)}`, name) as string)) ||
              '';
            return;
          }
          items[index - 1].isLink = true; // 最后一个不可点击
        }
        items.push({
          label:
            (title &&
              (configProvider.i18nRender(`${props.i18nKeyPrefix}.breadcrumb.${snakeCase(title)}`, title) as string)) ||
            (name &&
              (configProvider.i18nRender(`${props.i18nKeyPrefix}.breadcrumb.${snakeCase(name)}`, name) as string)) ||
            '',
          to: path,
        });
      });
      return items;
    };

    if (props.items) {
      watch(
        () => props.items,
        (val) => {
          currentBreadItems.value = val || [];
        },
        { deep: true, immediate: true },
      );
    } else {
      watch(
        () => props.route,
        () => {
          currentBreadItems.value = genBreadcrumb();
        },
        { immediate: true },
      );
    }

    return () => (
      <Breadcrumb class="breadcrumb">
        {currentBreadItems.value.map((item) => (
          <Breadcrumb.Item>
            {item.isLink ? (
              <router-link to={{ path: item.to || '/' }}>{item.label}</router-link>
            ) : (
              <span>{item.label}</span>
            )}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
    );
  },
});
