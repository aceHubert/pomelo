import { defineComponent, h, ref, computed, nextTick, onMounted } from '@vue/composition-api';
import { default as WuJieVue } from 'wujie-vue2';
import { Button, Card } from 'ant-design-vue';
import { useRoute } from 'vue2-helpers/vue-router';
import { trailingSlash } from '@pomelo/shared-web';
import { expose, useEffect } from '@/components';
import { useI18n, useMicroApp } from '@/hooks';
import { useAppMixin } from '@/mixins';

// Types
import type { Ref } from '@vue/composition-api';
import type { startOptions } from 'wujie';
import type { Theme } from '@/types';

export interface SubAppComponentOptions {
  /**
   * 默认页面标题
   * 为空里以 name 作为标题
   * 或通过 event "sub-title-change" 通过子应用修改
   */
  title?: string;
  /**
   * 子应用主题色
   */
  primaryColor?: string;
  /**
   * 子应用主题
   */
  theme?: Theme;
  /**
   * 子应用禁止修改主题
   */
  themeChangeDisabled?: boolean;
  /**
   * 子应用路由模式
   */
  hash?: boolean;
}

export const withSubComponent = (props: Omit<startOptions, 'el'> & SubAppComponentOptions) => {
  // 缓存通过 eventBus 修改的值
  let primaryColorCache = props.primaryColor;
  let themeCache = props.theme;
  let themeChangeDisabledCache = props.themeChangeDisabled;
  return defineComponent({
    name: 'SubAppComponent',
    head() {
      const title = (this.titleRef as Ref<string>).value;
      return {
        title,
      };
    },
    setup() {
      const route = useRoute();
      const i18n = useI18n();
      const appMixin = useAppMixin();
      const microApp = useMicroApp();

      const { name, url, hash = false, ...attrs } = props;

      const urlRef = computed(() => `${trailingSlash(url)}${hash ? `#/${route.params.path}` : route.params.path}`);
      const titleRef = ref(props.title ?? props.name);
      const errorRef = ref();

      expose({
        titleRef,
      });

      useEffect(() => {
        const changeTitle = (title: string) => {
          titleRef.value = title;
        };
        const changeTheme = (
          primary: string,
          { theme, themeChangeDisabled }: { theme?: Theme; themeChangeDisabled?: boolean } = {},
        ) => {
          primaryColorCache = primary;
          appMixin.setPrimaryColor(primary);
          if (theme) {
            themeCache = theme;
            appMixin.setTheme(theme);
          }
          if (themeChangeDisabled) {
            themeChangeDisabledCache = themeChangeDisabled;
            appMixin.setThemeChangedDisabled(themeChangeDisabled);
          }
        };
        microApp.bus.$on('sub-title-change', changeTitle);
        microApp.bus.$on('theme-change', changeTheme);

        // 如果主程序默认有设置 或 通过 eventBus 修改的值
        nextTick(() => {
          primaryColorCache && appMixin.setPrimaryColor(primaryColorCache);
          themeCache && appMixin.setTheme(themeCache);
          themeChangeDisabledCache && appMixin.setThemeChangedDisabled(themeChangeDisabledCache);
        });

        return () => {
          microApp.bus.$off('sub-title-change', changeTitle);
          microApp.bus.$off('theme-change', changeTheme);
          appMixin.resetPrimaryColor();
          appMixin.resetTheme();
          appMixin.resetThemeChangeDisabled();
        };
      }, []);

      // 主路由 path 变化通知子应用
      useEffect(
        () => {
          microApp.bus.$emit('main-route-change', name, `/${route.params.path}`);
        },
        () => route.params.path,
      );

      onMounted(() => {
        document.documentElement.addEventListener(
          'mousedown',
          (_e) => {
            // console.log(e);
            return false;
          },
          true,
        );
      });

      return () => {
        if (errorRef.value) {
          return h(
            Card,
            {
              class: ' text-center py-10',
              props: {
                bordered: false,
              },
            },
            [
              h(
                'p',
                { class: 'font-lg font-weight-bold mb-2' },
                i18n.tv('subapp.tips.load_error_title', '应用加载失败') as string,
              ),
              h('p', { class: 'text--secondary mb-5' }, errorRef.value),
              h(
                Button,
                {
                  props: { type: 'primary' },
                  on: {
                    click: () => {
                      errorRef.value = '';
                    },
                  },
                },
                i18n.tv('common.btn_text.retry', '重试') as string,
              ),
            ],
          );
        }

        return h(WuJieVue as any, {
          style: { position: 'relative', width: '100%', height: '100%', minHeight: '300px' },
          props: {
            ...attrs,
            name,
            url: urlRef.value,
            loadError: (url, err) => {
              errorRef.value = err.message;
              attrs.loadError?.(url, err);
            },
          },
        });
      };
    },
  });
};
