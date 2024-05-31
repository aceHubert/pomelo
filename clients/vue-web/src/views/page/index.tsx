import { defineComponent, ref, computed, h, onErrorCaptured } from '@vue/composition-api';
import { warn, isAbsoluteUrl, trailingSlash } from '@ace-util/core';
import { useRoute } from 'vue2-helpers/vue-router';
import { createResource } from '@vue-async/resource-manager';
import { getFrameworkSchema, OptionPresetKeys } from '@ace-pomelo/shared-client';
import { SkeletonLoader, Result } from '@/components';
import { useI18n, useOptions, useEffect, useDeviceType, expose } from '@/hooks';
import { useTemplateApi, PageMetaPresetKeys } from '@/fetch/apis';
import { HomeDefault } from './components/home-default';

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
    id: String,
  },
  setup(props) {
    const i18n = useI18n();
    const route = useRoute();
    const siteUrl = useOptions(OptionPresetKeys.SiteUrl);
    const deviceType = useDeviceType();
    const templateApi = useTemplateApi();

    const pageRes = createResource(async ({ id, name }: { id?: string; name?: string }) => {
      const page = id
        ? await templateApi // from /p/:id
            .getPage({
              variables: {
                id,
              },
            })
            .then(({ page }) => page)
        : await templateApi // from name alias: /page-name
            .getPageByName({
              variables: {
                name,
              },
            })
            .then(({ page }) => page);

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

    const pageName = computed(() => encodeURIComponent(route.path.substring(1))); // path 去掉开始 "/" 作为 name

    useEffect(() => {
      pageRes.read({
        id: props.id,
        name: pageName.value,
      });
    }, [() => props.id, () => route.path]);

    const metas = computed(() => {
      if (pageRes.$result?.metas?.length) {
        return pageRes.$result.metas.reduce((acc, cur) => {
          acc[cur.key] = cur.value;
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
        ? i18n.tv('page_template.page_load_error_title', '页面加载错误')
        : $result?.title ?? i18n.tv('page_template.page_not_found_title', '未找到页面');
    });

    // stylesheets
    const links = computed<string[]>(() => {
      const { $error, $loading, $result } = pageRes;
      return $error || $loading
        ? []
        : JSON.parse($result?.metas?.find(({ key }) => key === PageMetaPresetKeys.StyleLink)?.value || '[]');
    });

    // css text
    const cssText = computed(() => {
      const { $error, $loading, $result } = pageRes;
      return $error || $loading
        ? ''
        : $result?.metas?.find(({ key }) => key === PageMetaPresetKeys.CssText)?.value || '';
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
      const { $error, $loading, $result: pageData } = pageRes;

      return $loading ? (
        <div>
          <SkeletonLoader style={{ width: '100%', height: deviceType.isDesktop ? '300px' : '200px' }} />
          {deviceType.isDesktop ? (
            <div class="mx-auto" style="width: 1180px; max-width: 100%;">
              <div class="d-flex flex-wrap justify-content-start mx-n3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div style="flex: 0 0 20%; padding: 20px 12px">
                    <SkeletonLoader key={index} style="height: 100px; width: 100%; " />
                  </div>
                ))}
              </div>
              <div class="mt-2">
                <SkeletonLoader style=" height: 40px; width: 200px;" />
                {Array.from({ length: 2 }).map((_, index) => (
                  <div key={index} class="d-flex mt-6">
                    <div class="flex-auto pr-4">
                      <SkeletonLoader style="height: 18px; width: 260px; margin-top: 10px;" />
                      <SkeletonLoader style="height: 18px; margin-top: 10px;" />
                      <SkeletonLoader style="height: 18px; margin-top: 10px;" />
                    </div>
                    <SkeletonLoader class="flex-none" style="height: 90px; width: 160px;" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div class="px-4">
              <div class="d-flex flex-wrap justify-content-start mx-n3">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div style="flex: 0 0 25%; padding: 10px 12px">
                    <SkeletonLoader key={index} type="circle" style="margin: auto; width: 100%; padding-top: 100%;" />
                  </div>
                ))}
              </div>
              <div class="mt-2">
                <SkeletonLoader style=" height: 32px; width: 100px;" />
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} class="d-flex mt-4">
                    <div class="flex-auto pr-4">
                      <SkeletonLoader style="height: 14px; width: 50%; margin-top: 5px;" />
                      <SkeletonLoader style="height: 14px; margin-top: 5px;" />
                      <SkeletonLoader style="height: 14px; margin-top: 5px;" />
                    </div>
                    <SkeletonLoader class="flex-none" style="height: 60px; width: 100px;" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : $error ? (
        <Result
          status="error"
          title={i18n.tv('page_template.index.load_error_text', '页面加载错误！') as string}
          subTitle={$error.message}
        ></Result>
      ) : renderError.value ? (
        <Result
          status="error"
          title={i18n.tv('page_template.index.render_error_text', '页面渲染错误！') as string}
          subTitle={renderError.value}
        ></Result>
      ) : !pageData ? (
        pageName.value ? (
          <Result
            status="error"
            title="404"
            subTitle={i18n.tv('page_template.index.not_found_text', '未找到页面！') as string}
          ></Result>
        ) : (
          <div class="px-4 py-5">
            <HomeDefault />
          </div>
        )
      ) : deviceType.isDesktop ? (
        h(DesktopPage, {
          props: {
            title: pageData.title,
            content: pageData.schema,
            metas: metas.value,
            framework: pageData.framework,
          },
        })
      ) : (
        h(MobilePage, {
          props: {
            title: pageData.title,
            content: pageData.schema,
            metas: metas.value,
            framework: pageData.framework,
          },
        })
      );
    };
  },
});
