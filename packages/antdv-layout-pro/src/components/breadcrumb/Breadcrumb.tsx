import { snakeCase } from 'lodash-es';
import { defineComponent, getCurrentInstance, ref, watch } from 'vue-demi';
import { Breadcrumb } from 'ant-design-vue';
import { useConfigProvider } from '../../shared';
import { isVueComponent, getPathRegex } from '../../utils';

// Types
import type VueRouter from 'vue-router';
import type { DefineComponent } from '../../types';

export interface BreadcrumbItem {
  label: string | ((i18nRender: (key: string, fallback: string, args?: any) => string) => string);
  path: string;
  isLink?: boolean;
}

export interface BreadcrumbProps {
  /**
   * 设置 null, 将会根据$route 变化生成
   * 如需传自定义参数，初始值必须设置成数组
   * @default null
   * @type Array<BreadcrumbItem | DefineComponent<any>>
   * @example
   * <Breadcrumb :items="[{label: '首页', to: '/'}]" />
   * <Breadcrumb :items="[Component]" />
   * <Breadcrumb :items="[Component, {label: '用户管理', to: '/user'}]" />
   * <Breadcrumb :items="[Component, {label: '用户管理', to: '/user', isLink: true}]" />
   */
  items: Array<BreadcrumbItem | DefineComponent<any>>;
  /**
   * 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text
   * @default 'components.breadcrumb'
   * @type string
   */
  i18nKeyPrefix: string;
}

export default defineComponent({
  name: 'Breadcrumb',
  props: {
    /**
     * 设置 null, 将会根据$route 变化生成
     * 如需传自定义参数，初始值必须设置成数组
     */
    items: Array,
    /**
     * 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text
     */
    i18nKeyPrefix: { type: String, default: 'components.breadcrumb' },
  },
  setup(props: BreadcrumbProps) {
    const currentInstance = getCurrentInstance();
    const configProvider = useConfigProvider();

    const currentBreadItems = ref<Array<BreadcrumbItem | DefineComponent<any>>>();

    const genBreadcrumb = (router: VueRouter) => {
      const items: BreadcrumbItem[] = [];
      // this.breadList.push({name: 'index', path: '/dashboard/', meta: {title: '首页'}})

      const matched = router.currentRoute.matched;
      matched.forEach(({ name, path, meta: { title } }, index) => {
        // item.name !== 'index' && this.breadList.push(item)
        const label = (i18nRender: (key: string, fallback: string, args?: any) => string) =>
          title
            ? typeof title === 'function'
              ? title(i18nRender)
              : i18nRender(`${props.i18nKeyPrefix}.${snakeCase(title)}`, title)
            : name
            ? i18nRender(`${props.i18nKeyPrefix}.${snakeCase(name)}`, name)
            : 'Please set "title" in route meta';
        if (index > 0) {
          const prevRoute = matched[index - 1];
          const { resolved } = router.resolve(prevRoute.path);
          if (resolved.name === name) {
            // 嵌套路由与parent 路由相同，直接修改上一个的 label
            items[index - 1].label = label;
            return;
          }
          items[index - 1].isLink = true; // 最后一个不可点击
        }
        items.push({
          label,
          path: path,
        });
      });
      return items;
    };

    if (props.items) {
      // 通过 props 传入
      watch(
        () => props.items,
        (val) => {
          currentBreadItems.value = val;
        },
        { deep: true, immediate: true },
      );
    } else if (currentInstance?.proxy.$router) {
      const { $router: router, $route: route } = currentInstance.proxy;
      // 通过路由生成
      watch(
        () => route.path,
        () => {
          currentBreadItems.value = genBreadcrumb(router);
        },
        { immediate: true },
      );
    }

    const renderLabel = (label: BreadcrumbItem['label']) =>
      typeof label === 'function' ? label(configProvider.i18nRender) : label;

    return () => (
      <Breadcrumb>
        {currentBreadItems.value?.map((item, index) => (
          <Breadcrumb.Item style="white-space: nowrap;">
            {isVueComponent(item) ? (
              <item key={index} />
            ) : item.isLink ? (
              <router-link
                to={{ path: item.path }}
                custom
                scopedSlots={{
                  default: ({ href, navigate }) =>
                    getPathRegex(href).keys.length ? (
                      <a href="javascript:;"> {renderLabel(item.label)}</a>
                    ) : (
                      <a href={href} onClick={navigate}>
                        {renderLabel(item.label)}
                      </a>
                    ),
                }}
              ></router-link>
            ) : (
              renderLabel(item.label)
            )}
          </Breadcrumb.Item>
        ))}
      </Breadcrumb>
    );
  },
});
