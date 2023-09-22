import { defineComponent, computed, h } from '@vue/composition-api';
import { isAbsoluteUrl, trailingSlash } from '@ace-util/core';
import { createResource } from '@vue-async/resource-manager';
import { useTemplateApi, getFrameworkSchema, OptionPresetKeys, PostMetaPresetKeys } from '@pomelo/shared-web';
import { useDeviceMixin } from '@/mixins';
import { useI18n, useOptions, useEffect, expose } from '@/hooks';

const MobilePost = () => import(/* webpackChunkName: "mobile" */ './mobile');
const DesktopPost = () => import(/* webpackChunkName: "desktop" */ './desktop');

export default defineComponent({
  name: 'PostView',
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
    id: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const i18n = useI18n();
    const deviceMixin = useDeviceMixin();
    const siteUrl = useOptions(OptionPresetKeys.SiteUrl);
    const templateApi = useTemplateApi();

    // post /p/:id
    const postRes = createResource(async (id: number) => {
      const { data: post } = await templateApi.getPost({
        params: {
          id,
        },
      });
      if (post) {
        const { schema, framework } = getFrameworkSchema(post.content);
        return {
          ...post,
          schema,
          framework,
        };
      }
      return;
    });

    useEffect(
      () => {
        postRes.read(props.id);
      },
      () => props.id,
    );

    const metas = computed(() => {
      if (postRes.$result?.metas?.length) {
        return postRes.$result.metas.reduce((acc, cur) => {
          acc[cur.metaKey] = cur.metaValue;
          return acc;
        }, {} as Record<string, string>);
      }
      return {};
    });

    // page title
    const pageTitle = computed(() => {
      const { $error, $loading, $result } = postRes;
      return $loading
        ? ''
        : $error
        ? i18n.tv('post.page_load_error_title', '内容加载错误')
        : $result?.title ?? i18n.tv('post.page_not_found_title', '未找到内容');
    });

    // stylesheets
    const links = computed<string[]>(() => {
      return !postRes.$result
        ? []
        : JSON.parse(
            postRes.$result.metas?.find(({ metaKey }) => metaKey === PostMetaPresetKeys.StyleLink)?.metaValue || '[]',
          );
    });

    // css text
    const cssText = computed(() => {
      return postRes.$result?.metas?.find(({ metaKey }) => metaKey === PostMetaPresetKeys.CssText)?.metaValue || '';
    });

    // page metas
    const pageMetas = computed(() => {
      const featureImage = metas.value[PostMetaPresetKeys.FeatureImage];

      return {
        'og:title': pageTitle.value,
        'og:description': postRes.$result?.excerpt || '',
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
      const { $error, $loading, $result: postData } = postRes;

      return deviceMixin.isDesktop
        ? h(DesktopPost, {
            props: {
              title: postData?.title,
              excerpt: postData?.excerpt,
              content: postData?.schema,
              createdAt: postData?.createdAt,
              metas: metas.value,
              framework: postData?.framework,
              loading: $loading,
              error: $error,
            },
          })
        : h(MobilePost, {
            props: {
              title: postData?.title,
              content: postData?.schema,
              createdAt: postData?.createdAt,
              metas: metas.value,
              framework: postData?.framework,
              loading: $loading,
              error: $error,
            },
          });
    };
  },
});
