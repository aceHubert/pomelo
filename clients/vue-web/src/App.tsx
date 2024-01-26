import { defineComponent, ref, computed, watch, h } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { useI18n } from '@/hooks';
import { sanitizeComponent } from '@/components';
import { useAppStore } from '@/store';

const layouts = {
  _default: () => import(/* webpackChunkName: "layouts" */ './layouts/default'),
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
    const layoutRef = ref<any>();

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

    watch(
      () => route.path,
      () => {
        let layoutName = route.meta?.layout;
        if (!layoutName && route.matched.length) {
          layoutName = sanitizeComponent(route.matched.slice(-1)[0].components.default).options.layout;
        }
        if (typeof layoutName === 'function') {
          layoutName = layoutName();
        }
        if (!layoutName || !layouts[`_${layoutName}` as keyof typeof layouts]) {
          layoutName = 'default';
        }
        layoutRef.value = layouts[`_${layoutName}` as keyof typeof layouts];
      },
      { immediate: true },
    );

    return {
      siteTitle,
      layout: layoutRef,
      routerReady: routerReadyRef,
    };
  },
  render() {
    if (!this.routerReady) return h('div');
    // @ts-ignore
    return h(this.layout || 'router-view');
  },
});
