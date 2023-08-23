import { snakeCase } from 'lodash-es';
import { defineComponent, h, ref, watch } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { Breadcrumb } from 'ant-design-vue';
import { useConfigProvider } from '@/components/shared';
import { isVueComponent } from '../../utils';

// Types
import type { PropType } from '@vue/composition-api';
import type { DefineComponent } from '@/types';

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
      type: Array as PropType<Array<BreadItem | DefineComponent<any>>>,
    },
    /** 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text */
    i18nKeyPrefix: { type: String as PropType<string>, default: 'components.breadcrumb' },
  },
  setup(props) {
    const router = useRouter();
    const route = useRoute();
    const configProvider = useConfigProvider();

    const currentBreadItems = ref<Array<BreadItem | DefineComponent<any>>>([]);
    const genBreadcrumb = () => {
      const items: BreadItem[] = [];
      // this.breadList.push({name: 'index', path: '/dashboard/', meta: {title: '首页'}})

      const matched = route.matched;
      matched.forEach(({ name, path, meta: { title } }, index) => {
        // item.name !== 'index' && this.breadList.push(item)
        if (index > 0) {
          const prevRoute = matched[index - 1];
          const { resolved } = router.resolve(prevRoute.path);
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
        () => route.path,
        () => {
          currentBreadItems.value = genBreadcrumb();
        },
        { immediate: true },
      );
    }

    return () => (
      <Breadcrumb class="breadcrumb">
        {currentBreadItems.value.map((item, index) => (
          <Breadcrumb.Item>
            {isVueComponent(item) ? (
              h(item, { key: index })
            ) : item.isLink ? (
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
