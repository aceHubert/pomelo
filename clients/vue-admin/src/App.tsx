import { defineComponent, ref, computed, h } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { expose } from 'antdv-layout-pro/shared';
import { useI18n } from '@/hooks';
import { sanitizeComponent } from '@/components';
import { useAppStore } from '@/store';

const layouts = {
  _default: () => import(/* webpackChunkName: "layouts" */ './layouts/default'),
  _blank: () => import(/* webpackChunkName: "layouts" */ './layouts/blank'),
};

export default defineComponent({
  name: 'App',
  head() {
    const siteTitle = this.siteTitle as string;
    return {
      title: '',
      titleTemplate: (title: string) => (title ? `${title} | ${siteTitle}` : siteTitle),
    };
  },
  setup() {
    const { siteTitle: title } = useAppStore();
    const router = useRouter();
    const route = useRoute();
    const i18n = useI18n();

    // 防止初始化闪烁
    const routerReadyRef = ref(false);
    router.isReady().then(() => {
      routerReadyRef.value = true;
    });

    const siteTitle = computed(() => {
      if (typeof title === 'function') {
        return title((...args: Parameters<typeof i18n.tv>) => i18n.tv(...args) as string);
      }
      return title;
    });

    expose({
      siteTitle,
    });

    const getLayout = () => {
      let layoutName = route.meta?.layout;
      if (!layoutName && route.matched.length) {
        const component = sanitizeComponent(route.matched.slice(-1)[0].components.default);
        layoutName = component.options.layout;
        // antd Form.create({})(WrappedComponent)
        if (!layoutName && component.options.WrappedComponent) {
          layoutName = sanitizeComponent(component.options.WrappedComponent).options.layout;
        }
      }
      if (typeof layoutName === 'function') {
        layoutName = layoutName();
      }
      if (!layoutName || !layouts[`_${layoutName}` as keyof typeof layouts]) {
        layoutName = 'default';
      }
      return layouts[`_${layoutName}` as keyof typeof layouts];
    };

    return () => {
      if (!routerReadyRef.value) return h('div');

      return h(getLayout() || 'router-view');
    };
  },
});
