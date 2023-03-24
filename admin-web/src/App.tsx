import { defineComponent, ref, computed, h } from '@vue/composition-api';
import { useRoute } from 'vue2-helpers/vue-router';
import { useI18n } from '@/hooks';
import { useEffect } from '@/components';
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
    const { layout } = useAppStore();
    const route = useRoute();
    const i18n = useI18n();
    const layoutRef = ref<any>();

    const siteTitle = computed(() => {
      let title = layout.title;
      if (typeof title === 'function') {
        title = title((...args: Parameters<typeof i18n.tv>) => i18n.tv(...args) as string);
      }
      return title;
    });

    useEffect(() => {
      let name = route.meta?.layout;
      if (!name || !layouts[`_${name}` as keyof typeof layouts]) {
        name = 'default';
      }
      layoutRef.value = layouts[`_${name}` as keyof typeof layouts];
    }, [() => route.path, () => route.name]);

    return {
      siteTitle,
      layout: layoutRef,
    };
  },
  render() {
    // @ts-ignore
    return h(this.layout || 'router-view');
  },
});
