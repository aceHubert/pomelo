import { defineComponent, ref, computed, h, onErrorCaptured } from '@vue/composition-api';
import { warn, isAbsoluteUrl, trailingSlash } from '@ace-util/core';
import { getActiveFetch } from '@ace-fetch/vue';
import { createResource } from '@vue-async/resource-manager';
import { useTemplateApi, getFrameworkSchema, OptionPresetKeys, FormMetaPresetKeys } from '@pomelo/shared-web';
import { Modal } from 'ant-design-vue';
import { Dialog } from 'vant';
import { SkeletonLoader, Result } from '@/components';
import { useI18n, useOptions, useEffect, expose } from '@/hooks';
import { useLocationMixin, useDeviceMixin } from '@/mixins';

const MobileForm = () => import(/* webpackChunkName: "mobile" */ './mobile');
const DesktopForm = () => import(/* webpackChunkName: "desktop" */ './desktop');

export default defineComponent({
  name: 'FormView',
  head() {
    return {
      title: this.title as string,
      link: (this.links as string[]).map((href) => ({ href, rel: 'stylesheet' })),
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
    const localtionMixin = useLocationMixin();
    const fetch = getActiveFetch();
    const siteUrl = useOptions(OptionPresetKeys.SiteUrl);
    const templateApi = useTemplateApi();

    // from /f/:id
    const formRes = createResource(async (id: number) => {
      const { data: form } = await templateApi.getForm({
        params: {
          id,
          metaKeys: Object.values(FormMetaPresetKeys),
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
          acc[cur.metaKey] = cur.metaValue;
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
        ? i18n.tv('form.page_load_error_title', '表单加载错误')
        : $result?.title ?? i18n.tv('form.page_not_found_title', '未找到表单');
    });

    // stylesheets
    const links = computed<string[]>(() => {
      const { $error, $loading, $result } = formRes;
      return $error || $loading
        ? []
        : JSON.parse(
            $result?.metas?.find(({ metaKey }) => metaKey === FormMetaPresetKeys.StyleLink)?.metaValue || '[]',
          );
    });

    // css text
    const cssText = computed(() => {
      const { $error, $loading, $result } = formRes;
      return $error || $loading
        ? ''
        : $result?.metas?.find(({ metaKey }) => metaKey === FormMetaPresetKeys.CssText)?.metaValue || '';
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

    const submitingRef = ref(false);
    const onSubmit = (value: any) => {
      const { $result } = formRes;
      const submitAction =
        $result?.metas?.find(({ metaKey }) => metaKey === FormMetaPresetKeys.SubmitAction)?.metaValue || '';
      const submitSuccessRedirect =
        $result?.metas?.find(({ metaKey }) => metaKey === FormMetaPresetKeys.SubmitSuccessRedirect)?.metaValue || '';
      const submitSuccessTips =
        $result?.metas?.find(({ metaKey }) => metaKey === FormMetaPresetKeys.SubmitSuccessTips)?.metaValue ||
        (i18n.tv('form_template.index.submit_success_text', '提交成功') as string);

      submitingRef.value = true;
      return fetch?.client
        .post(submitAction, value)
        .then(() => {
          // redirect
          let alert: Promise<any>;
          if (deviceMixin.isMobile) {
            alert = Dialog.alert({
              title: i18n.tv('form_template.index.submit_success_title', '提示') as string,
              message: submitSuccessTips,
            });
          } else {
            alert = new Promise((resolve, reject) => {
              Modal.success({
                title: i18n.tv('form_template.index.submit_success_title', '提示') as string,
                content: submitSuccessTips,
                onOk: () => resolve(null),
                onCancel: reject,
              });
            });
          }

          alert.then(() => {
            if (submitSuccessRedirect) {
              localtionMixin.goTo(submitSuccessRedirect, true);
            }
          });
        })
        .catch((err) => {
          if (deviceMixin.isMobile) {
            Dialog.alert({
              title: i18n.tv('form_template.index.submit_failed_title', '提交失败') as string,
              message: err.message,
            });
          } else {
            Modal.error({
              title: i18n.tv('form_template.index.submit_failed_title', '提交失败'),
              content: err.message,
            });
          }
        });
    };

    const renderError = ref<false | string>(false);
    onErrorCaptured((err, vm, info) => {
      warn(process.env.NODE_ENV === 'production', info || err.message, vm);
      renderError.value = info || err.message;
      return false;
    });

    return () => {
      const { $error, $loading, $result: formData } = formRes;

      return $loading ? (
        <div>
          <SkeletonLoader style={{ width: '100%', height: deviceMixin.isDesktop ? '300px' : '200px' }} />
          <div class={['mx-auto pt-2', { 'px-4': !deviceMixin.isDesktop }]} style="width: 1180px; max-width: 100%;">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} class="d-flex mt-2">
                <SkeletonLoader
                  class="flex-none"
                  style={{
                    width: deviceMixin.isDesktop ? '120px' : '70px',
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
                marginLeft: deviceMixin.isDesktop ? '128px' : '0',
                width: deviceMixin.isDesktop ? '100px' : '100%',
                height: '40px',
                lineHeight: '40px',
                borderRadius: deviceMixin.isDesktop ? '8px' : '99px',
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
      ) : deviceMixin.isDesktop ? (
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
