import { defineComponent, computed, h } from '@vue/composition-api';
import { isAbsoluteUrl, trailingSlash } from '@ace-util/core';
import { useRoute } from 'vue2-helpers/vue-router';
import { createResource } from '@vue-async/resource-manager';
import {
  useTemplateApi,
  useBasicApi,
  getFrameworkSchema,
  OptionPresetKeys,
  PageMetaPresetKeys,
} from '@pomelo/shared-web';
import { useI18n, useOptions, useEffect, expose } from '@/hooks';
import { useDeviceMixin } from '@/mixins';

// Types
import type { PageTemplateWithMetasModel } from '@pomelo/shared-web';

const MobilePage = () => import(/* webpackChunkName: "mobile" */ './mobile');
const DesktopPage = () => import(/* webpackChunkName: "desktop" */ './desktop');

export default defineComponent({
  name: 'PageView',
  head() {
    return {
      title: this.title as string,
      link: [
        {
          vmid: 'ckeditor5-style',
          href: '/static/ckeditor5/content-style.css',
          rel: 'stylesheet',
        },
        ...(this.links as string[]).map((href) => ({ href, rel: 'stylesheet' })),
      ],
      style: this.cssText
        ? [
            {
              cssText: this.cssText as string,
            },
          ]
        : [],
      meta: Object.entries(this.metas as Record<string, string>).map(([key, value]) => ({
        property: key,
        content: value,
      })),
    };
  },
  props: {
    id: Number,
  },
  setup(props) {
    const i18n = useI18n();
    const route = useRoute();
    const deviceMixin = useDeviceMixin();
    const basicApi = useBasicApi();
    const siteUrl = useOptions(OptionPresetKeys.SiteUrl);
    const templateApi = useTemplateApi();

    const pageRes = createResource(async ({ id, name }: { id?: number; name: string }) => {
      let promise: Promise<PageTemplateWithMetasModel | undefined> = Promise.resolve(undefined);
      if (id) {
        // from /p/:id
        promise = templateApi
          .getPage({
            params: {
              id,
            },
          })
          .then(({ data }) => data);
      } else if (name) {
        // from fallback
        promise = templateApi
          .getPageByName({
            params: {
              name,
            },
          })
          .then(({ data }) => data);
      } else {
        // get page on front
        promise = basicApi
          .getOptionValue({
            params: {
              name: OptionPresetKeys.PageOnFront,
            },
          })
          .then(({ data }) => {
            if (data) {
              return templateApi
                .get({
                  params: {
                    id: data,
                  },
                })
                .then(({ data }) => data);
            }
            return;
          });
      }

      const page = await promise;

      if (page) {
        const { schema, framework } = getFrameworkSchema(page.content);
        return {
          ...page,
          schema,
          framework,
        };
      }
      return;
    });

    useEffect(() => {
      pageRes.read({
        id: props.id,
        name: encodeURIComponent(route.path.substring(1)), // path 去掉开始 "/" 作为 name
      });
    }, [() => props.id, () => route.path]);

    const metas = computed(() => {
      if (pageRes.$result?.metas?.length) {
        return pageRes.$result.metas.reduce((acc, cur) => {
          acc[cur.metaKey] = cur.metaValue;
          return acc;
        }, {} as Record<string, string>);
      }
      return {};
    });

    // page title
    const pageTitle = computed(() => {
      const { $error, $loading, $result } = pageRes;
      return $loading
        ? ''
        : $error
        ? i18n.tv('page.page_load_error_title', '页面加载错误')
        : $result?.title ?? i18n.tv('page.page_not_found_title', '未找到页面');
    });

    // stylesheets
    const links = computed<string[]>(() => {
      const { $error, $loading, $result } = pageRes;
      return $error || $loading
        ? []
        : JSON.parse(
            $result?.metas?.find(({ metaKey }) => metaKey === PageMetaPresetKeys.StyleLink)?.metaValue || '[]',
          );
    });

    // css text
    const cssText = computed(() => {
      const { $error, $loading, $result } = pageRes;
      return $error || $loading
        ? ''
        : $result?.metas?.find(({ metaKey }) => metaKey === PageMetaPresetKeys.CssText)?.metaValue || '';
    });

    // page metas
    const pageMetas = computed(() => {
      const featureImage = metas.value[PageMetaPresetKeys.FeatureImage];

      return {
        'og:title': pageTitle.value,
        'og:description': '',
        'og:image':
          (!featureImage || isAbsoluteUrl(featureImage)
            ? featureImage
            : `${trailingSlash(siteUrl.value)}${
                featureImage.startsWith('/') ? featureImage.slice(1) : featureImage
              }}`) || '',
      };
    });

    expose({
      title: pageTitle,
      metas: pageMetas,
      links,
      cssText,
    });

    return () => {
      const { $error, $loading, $result: pageData } = pageRes;

      return deviceMixin.isDesktop
        ? h(DesktopPage, {
            props: {
              title: pageData?.title,
              content: pageData?.schema,
              metas: metas.value,
              framework: pageData?.framework,
              loading: $loading,
              error: $error,
            },
          })
        : h(MobilePage, {
            props: {
              title: pageData?.title,
              content: pageData?.schema,
              metas: metas.value,
              framework: pageData?.framework,
              loading: $loading,
              error: $error,
            },
          });
    };
  },
});
