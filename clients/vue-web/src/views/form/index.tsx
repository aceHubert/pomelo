import { isString, isPlainObject } from 'lodash-es';
import { defineComponent, ref, computed, h, onErrorCaptured } from '@vue/composition-api';
import { warn, isAbsoluteUrl, trailingSlash } from '@ace-util/core';
import { getActiveFetch } from '@ace-fetch/vue';
import { createResource } from '@vue-async/resource-manager';
import { getFrameworkSchema, OptionPresetKeys } from '@ace-pomelo/shared/client';
import { SkeletonLoader, Result } from '@/components';
import { useI18n, useOptions, useEffect, useDeviceType, expose } from '@/hooks';
import { useFormApi, FormMetaPresetKeys } from '@/fetch/apis';

const MobileForm = () => import(/* webpackChunkName: "mobile" */ './mobile');
const DesktopForm = () => import(/* webpackChunkName: "desktop" */ './desktop');

export default defineComponent({
  name: 'FormView',
  head() {
    return {
      title: this.title as string,
      link: ((this.links as string[]) ?? []).map((href) => ({ href, rel: 'stylesheet' })),
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
      type: String,
      required: true,
    },
  },
  setup(props) {
    const i18n = useI18n();
    const fetch = getActiveFetch();
    const siteUrl = useOptions(OptionPresetKeys.SiteUrl);
    const deviceType = useDeviceType();
    const formApi = useFormApi();

    // from /f/:id
    const formRes = createResource(async (id: string) => {
      const { form } = await formApi.get({
        variables: {
          id,
          keys: Object.values(FormMetaPresetKeys),
        },
      });

      if (form) {
        const { schema, framework } = getFrameworkSchema(form.content);
        return {
          ...form,
          schema,
          framework,
        };
      }
      return;
    });

    useEffect(
      () => {
        formRes.read(props.id);
      },
      () => props.id,
    );

    const metas = computed(() => {
      if (formRes.$result?.metas?.length) {
        return formRes.$result.metas.reduce((acc, cur) => {
          acc[cur.key] = cur.value;
          return acc;
        }, {} as Record<string, string>);
      }
      return {};
    });

    // page title
    const pageTitle = computed(() => {
      const { $error, $loading, $result } = formRes;
      return $loading
        ? ''
        : $error
        ? i18n.tv('form_template.page_load_error_title', '表单加载错误')
        : $result?.title ?? i18n.tv('form_template.page_not_found_title', '未找到表单');
    });

    // stylesheets
    const links = computed<string[]>(() => {
      const { $error, $loading, $result } = formRes;
      return $error || $loading
        ? []
        : JSON.parse($result?.metas?.find(({ key }) => key === FormMetaPresetKeys.StyleLink)?.value || '[]');
    });

    // css text
    const cssText = computed(() => {
      const { $error, $loading, $result } = formRes;
      return $error || $loading
        ? ''
        : $result?.metas?.find(({ key }) => key === FormMetaPresetKeys.CssText)?.value || '';
    });

    // page metas
    const pageMetas = computed(() => {
      const featureImage = metas.value[FormMetaPresetKeys.FeatureImage];

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

    const onSubmit = (value: any) => {
      const { $result } = formRes;
      const submitAction = $result?.metas?.find(({ key }) => key === FormMetaPresetKeys.SubmitAction)?.value;
      const submitSuccessRedirect = $result?.metas?.find(
        ({ key }) => key === FormMetaPresetKeys.SubmitSuccessRedirect,
      )?.value;
      const submitSuccessTips = $result?.metas?.find(({ key }) => key === FormMetaPresetKeys.SubmitSuccessTips)?.value;

      if (!submitAction)
        return Promise.reject(
          new Error(i18n.tv('form_template.index.submit_action_not_found', '未找到提交地址！') as string),
        );

      return fetch?.client.post(submitAction, value).then((result) => {
        // return from server
        const _result = isPlainObject(result)
          ? (result as { message?: string; redirect?: string })
          : isString(result)
          ? { redirect: result }
          : {};
        return {
          tips: _result.message ?? submitSuccessTips,
          redirect: _result.redirect ?? submitSuccessRedirect,
        };
      });
    };

    const renderError = ref<false | string>(false);
    onErrorCaptured((err, vm, info) => {
      warn(process.env.NODE_ENV === 'production', err, vm, info);
      renderError.value = err.message || info;
      return false;
    });

    return () => {
      const { $error, $loading, $result: formData } = formRes;

      return $loading ? (
        <div>
          <SkeletonLoader style={{ width: '100%', height: deviceType.isDesktop ? '300px' : '200px' }} />
          <div class={['mx-auto pt-2', { 'px-4': !deviceType.isDesktop }]} style="width: 1180px; max-width: 100%;">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} class="d-flex mt-2">
                <SkeletonLoader
                  class="flex-none"
                  style={{
                    width: deviceType.isDesktop ? '120px' : '70px',
                    height: '32px',
                  }}
                />
                <SkeletonLoader
                  class="flex-auto ml-2"
                  style={{
                    height: '32px',
                  }}
                />
              </div>
            ))}
            <SkeletonLoader
              class="flex-none mt-5"
              style={{
                marginLeft: deviceType.isDesktop ? '128px' : '0',
                width: deviceType.isDesktop ? '100px' : '100%',
                height: '40px',
                lineHeight: '40px',
                borderRadius: deviceType.isDesktop ? '8px' : '99px',
                textAlign: 'center',
                color: 'gray',
              }}
            >
              Submit
            </SkeletonLoader>
          </div>
        </div>
      ) : $error ? (
        <Result
          status="error"
          title={i18n.tv('form_template.index.load_error_text', '表单加载错误！') as string}
          subTitle={$error.message}
        ></Result>
      ) : !formData ? (
        <Result
          status="error"
          title="404"
          subTitle={i18n.tv('form_template.index.not_found_text', '未找到表单！') as string}
        ></Result>
      ) : renderError.value ? (
        <Result
          status="error"
          title={i18n.tv('form_template.index.render_error_text', '表单渲染错误！') as string}
          subTitle={renderError.value}
        ></Result>
      ) : deviceType.isDesktop ? (
        h(DesktopForm, {
          props: {
            title: formData.title,
            content: formData.schema,
            metas: metas.value,
            framework: formData.framework,
            loading: $loading,
            error: $error,
            onSubmit,
          },
        })
      ) : (
        h(MobileForm, {
          props: {
            title: formData.title,
            content: formData.schema,
            metas: metas.value,
            framework: formData.framework,
            loading: $loading,
            error: $error,
            onSubmit,
          },
        })
      );
    };
  },
});
