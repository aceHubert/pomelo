import { defineComponent, ref, computed, h, onErrorCaptured } from '@vue/composition-api';
import { warn, isAbsoluteUrl, trailingSlash } from '@ace-util/core';
import { createResource } from '@vue-async/resource-manager';
import { getFrameworkSchema, OptionPresetKeys } from '@ace-pomelo/shared-client';
import { SkeletonLoader, Result } from '@/components';
import { useI18n, useOptions, useEffect, useDeviceType, expose } from '@/hooks';
import { useTemplateApi, PostMetaPresetKeys } from '@/fetch/apis';

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
        ...((this.links as string[]) ?? []).map((href) => ({ href, rel: 'stylesheet' })),
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
    const deviceType = useDeviceType();
    const siteUrl = useOptions(OptionPresetKeys.SiteUrl);
    const templateApi = useTemplateApi();

    // post /p/:id
    const postRes = createResource(async (id: number) => {
      const { post } = await templateApi.getPost({
        variables: {
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
          acc[cur.key] = cur.value;
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
        ? i18n.tv('post_template.page_load_error_title', '内容加载错误')
        : $result?.title ?? i18n.tv('post_template.page_not_found_title', '未找到内容');
    });

    // stylesheets
    const links = computed<string[]>(() => {
      return !postRes.$result
        ? []
        : JSON.parse(postRes.$result.metas?.find(({ key }) => key === PostMetaPresetKeys.StyleLink)?.value || '[]');
    });

    // css text
    const cssText = computed(() => {
      return postRes.$result?.metas?.find(({ key }) => key === PostMetaPresetKeys.CssText)?.value || '';
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
            : `${trailingSlash(siteUrl.value ?? '/')}${
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

    const renderError = ref<false | string>(false);
    onErrorCaptured((err, vm, info) => {
      warn(process.env.NODE_ENV === 'production', info || err.message, vm);
      renderError.value = info || err.message;
      return false;
    });

    return () => {
      const { $error, $loading, $result: postData } = postRes;

      return $loading ? (
        <div>
          <SkeletonLoader style={{ width: '100%', height: deviceType.isDesktop ? '300px' : '200px' }} />
          <div class={['mx-auto', { 'px-4': !deviceType.isDesktop }]} style="width: 1180px; max-width: 100%;">
            <SkeletonLoader
              class="mx-auto"
              style={{
                width: '260px',
                height: deviceType.isDesktop ? '40px' : '32px',
                marginTop: deviceType.isDesktop ? '40px' : '32px',
              }}
            />
            <SkeletonLoader
              class="mx-auto"
              style={{ width: '120px', height: '14px', marginTop: deviceType.isDesktop ? '28px' : '14px' }}
            />
            <SkeletonLoader
              style={{ height: '14px', marginLeft: '32px', marginTop: deviceType.isDesktop ? '30px' : '20px' }}
            />
            <SkeletonLoader style={{ height: '14px', marginTop: '10px' }} />
            <SkeletonLoader style={{ height: '14px', marginTop: '10px' }} />
          </div>
        </div>
      ) : $error ? (
        <Result
          status="error"
          title={i18n.tv('post_template.index.load_error_text', '内容加载错误！') as string}
          subTitle={$error.message}
        ></Result>
      ) : !postData ? (
        <Result
          status="error"
          title="404"
          subTitle={i18n.tv('post_template.index.not_found_text', '内容不存在！') as string}
        ></Result>
      ) : renderError.value ? (
        <Result
          status="error"
          title={i18n.tv('post_template.index.render_error_text', '内容渲染错误！') as string}
          subTitle={renderError.value}
        ></Result>
      ) : deviceType.isDesktop ? (
        h(DesktopPost, {
          props: {
            title: postData?.title,
            excerpt: postData?.excerpt,
            content: postData?.schema,
            createdAt: postData?.createdAt,
            metas: metas.value,
            framework: postData?.framework,
          },
        })
      ) : (
        h(MobilePost, {
          props: {
            title: postData?.title,
            content: postData?.schema,
            createdAt: postData?.createdAt,
            metas: metas.value,
            framework: postData?.framework,
          },
        })
      );
    };
  },
});
