import { ref, reactive, computed, watch } from '@vue/composition-api';
import { User } from 'oidc-client-ts';
import { warn } from '@ace-util/core';
import { UserMetaPresetKeys } from '@ace-pomelo/shared-client';
import { useUserApi } from '@/fetch/apis';
import { useI18n, useOptions, useUserManager, useEffect } from '@/hooks';
import { useAppStore } from '@/store';

// Types
import type { Locale } from 'ant-design-vue/types/locale-provider';

// Ant locales, 减少打包内容
const AntLocales: Record<string, () => Promise<Locale>> = {
  'zh-CN': () => import('ant-design-vue/lib/locale/zh_CN').then((data) => data.default || data),
  'en-US': () => import('ant-design-vue/lib/locale/en_US').then((data) => data.default || data),
};

/**
 * 加载 antd 语言文件
 * 全部语言被打包进来了
 */
// const loadAntLocaleAsync = (locale: string): Promise<Locale> => {
//   return import(`ant-design-vue/lib/locale/${locale.replace(/-/g, '_')}.js`).then((data) => data.default || data);
// };

/**
 * App 基础配置
 */
export const useAppMixin = () => {
  const i18n = useI18n();
  const appStore = useAppStore();
  const sietLocale = useOptions('locale');
  const userManager = useUserManager();
  const userApi = useUserApi();

  // antd locale
  const antLocales = ref<Locale>({ locale: i18n.locale });

  /**
   * Admin logo
   */
  const siteLogo = computed(() => appStore.siteLogo);

  /**
   * Admin site title
   */
  const siteTitle = computed(() =>
    typeof appStore.siteTitle === 'function'
      ? appStore.siteTitle((...args: Parameters<typeof i18n.tv>) => i18n.tv(...args) as string)
      : appStore.siteTitle,
  );

  const theme = computed(() => appStore.theme);
  const isDark = computed(() => theme.value === 'dark');
  const isLight = computed(() => !isDark.value);
  const primaryColor = computed(() => appStore.primaryColor);

  /**
   * 持久化保存用户语言
   */
  watch(
    () => i18n.locale,
    (locale) => {
      appStore.setLocale(locale);
      userManager
        .getUser()
        .then((user) => {
          if (user?.profile.sub)
            userApi
              .updateMetaByKey({
                variables: {
                  userId: user.profile.sub,
                  key: UserMetaPresetKeys.Locale,
                  value: locale,
                },
              })
              .then(({ result }) => {
                // update user store locale
                result && userManager.storeUser(new User({ ...user, profile: { ...user.profile, locale } }));
              });
        })
        .catch((err) => {
          warn(process.env.NODE_ENV === 'production', err.message);
        });
    },
  );

  /**
   * 修改 antd 语言
   */
  useEffect(
    () => {
      AntLocales[appStore.locale as keyof typeof AntLocales]?.()
        .then((locales) => {
          antLocales.value = locales;
        })
        .catch((err) => {
          warn(process.env.NODE_ENV === 'production', err.message);
        });
    },
    () => appStore.locale,
  );

  // 设置用户语言
  useEffect(() => {
    userManager
      .getUser()
      .then((user) => {
        user?.profile.sub &&
          userApi
            .getMetas({
              variables: {
                userId: user?.profile.sub,
                keys: [UserMetaPresetKeys.Locale, UserMetaPresetKeys.AdminColor],
              },
            })
            .then(({ metas }) => {
              // 设置用户语言
              const userLocale =
                metas.find((meta) => meta.key === UserMetaPresetKeys.Locale)?.value || sietLocale.value;
              if (userLocale) {
                i18n.locale = userLocale;
              }
            })
            .catch((err) => {
              warn(process.env.NODE_ENV === 'production', err.message);
            });
      })
      .catch((err) => {
        warn(process.env.NODE_ENV === 'production', err.message);
      });
  }, []);

  return reactive({
    antLocales,
    siteLogo,
    siteTitle,
    theme,
    isDark,
    isLight,
    primaryColor,
  });
};
