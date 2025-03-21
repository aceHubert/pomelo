import { defineComponent, ref, computed, watch, h } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { useI18n } from '@/composables';
import { sanitizeComponent } from '@/components';
import { useAppStore } from '@/store';

const layouts = {
  _default: () => import('./layouts/default'),
  _blank: () => import('@/layouts/blank'),
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

    const currentLayout = ref<ValueOf<typeof layouts>>();
    // 防止初始化闪烁
    const routerReady = ref(false);
    router.isReady().then(() => {
      routerReady.value = true;
    });

    const siteTitle = computed(() => {
      if (typeof title === 'function') {
        return title((...args: Parameters<typeof i18n.tv>) => i18n.tv(...args) as string);
      }
      return title;
    });

    watch(
      () => route.fullPath,
      () => {
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
        currentLayout.value = layouts[`_${layoutName}` as keyof typeof layouts];
      },
      { immediate: true },
    );

    return {
      siteTitle,
      currentLayout,
      routerReady,
    };
  },
  render() {
    if (!this.routerReady) return h('div');

    return h(this.currentLayout || 'router-view');
  },
});
