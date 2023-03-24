import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { createForm } from '@formily/core';
import { createSchemaField } from '@formily/vue';
import { Card, Rate } from 'ant-design-vue';
import * as Antdv from '@formily/antdv';
import { Form, FormButtonGroup, Submit } from '@formily/antdv';
import { Text } from '@formily/antdv-prototypes/esm/components/Text';
import { useRoute } from 'vue2-helpers/vue-router';
import { Spin, Modal } from '@/components';
import { getActiveFetch } from '@vue-async/fetch';
import { createResource } from '@vue-async/resource-manager';
import { useTemplateApi, FormTemplateWithMetasModel, jsonDeserializeReviver, warn } from '@pomelo/shared-web';
import { useI18n } from '@/hooks';
import { useLocationMixin } from '@/mixins';
import {
  TemplateSchemaPcMetaKey,
  TemplateStyleLinkMetaKey,
  TemplateStyleCssTextMetaKey,
  TemplateSubmitActionMetaKey,
  TemplateSubmitSuccessRedirectMetaKey,
  TemplateSubmitSuccessTipsMetaKey,
} from '../constants';
import classes from './index.module.less';

import type { SchemaVueComponents } from '@formily/vue';

const form = createForm();
const { SchemaField } = createSchemaField({
  components: {
    Card,
    Rate,
    Text,
    ...(Antdv as SchemaVueComponents),
  },
});

export default defineComponent({
  name: 'FormView',
  head() {
    return {
      title: this.pageTitle as string,
      link: (this.links as string[]).map((href) => ({ href, rel: 'stylesheet' })),
      style: this.cssText
        ? [
            {
              cssText: this.cssText as string,
            },
          ]
        : [],
    };
  },
  setup() {
    const i18n = useI18n();
    const route = useRoute();
    const localtion = useLocationMixin();
    const templateApi = useTemplateApi();
    const fetch = getActiveFetch();

    // from /f/:id
    const formRes = createResource(async (id: string) => {
      const { data: form } = await templateApi.getForm({
        params: {
          id,
          metaKeys: [
            TemplateSchemaPcMetaKey,
            TemplateStyleLinkMetaKey,
            TemplateStyleCssTextMetaKey,
            TemplateSubmitActionMetaKey,
            TemplateSubmitSuccessRedirectMetaKey,
            TemplateSubmitSuccessTipsMetaKey,
          ],
        },
      });

      return (form && {
        ...form,
        schema: JSON.parse(
          form.metas?.find((meta) => meta.metaKey === TemplateSchemaPcMetaKey)?.metaValue ||
            form.schema ||
            (null as any), // JSON.parse works with null but not undefined
          jsonDeserializeReviver(),
        ),
      }) as (Omit<FormTemplateWithMetasModel, 'schema'> & { schema: Record<string, any> }) | undefined;
    });

    watch(
      () => route.params.id,
      (id) => {
        formRes.read(id);
      },
      { immediate: true },
    );

    const renderError = ref<false | string>(false);

    // page title
    const pageTitle = computed(() => {
      const { $error, $loading, $result } = formRes;
      return $error || $loading ? '' : $result!.title;
    });

    // stylesheets
    const links = computed<string[]>(() => {
      const { $error, $loading, $result } = formRes;
      return $error || $loading
        ? []
        : JSON.parse($result?.metas?.find(({ metaKey }) => metaKey === TemplateStyleLinkMetaKey)?.metaValue || '[]');
    });

    // css text
    const cssText = computed(() => {
      const { $error, $loading, $result } = formRes;
      return $error || $loading
        ? ''
        : $result?.metas?.find(({ metaKey }) => metaKey === TemplateStyleCssTextMetaKey)?.metaValue || '';
    });

    const submitingRef = ref(false);
    const onSubmit = (value: any) => {
      const { $result } = formRes;
      const submitAction =
        $result?.metas?.find(({ metaKey }) => metaKey === TemplateSubmitActionMetaKey)?.metaValue || '';
      const submitSuccessRedirect =
        $result?.metas?.find(({ metaKey }) => metaKey === TemplateSubmitSuccessRedirectMetaKey)?.metaValue || '';
      const submitSuccessTips =
        $result?.metas?.find(({ metaKey }) => metaKey === TemplateSubmitSuccessTipsMetaKey)?.metaValue ||
        i18n.tv('form_template.index.submit_success_text', '提交成功');

      submitingRef.value = true;
      fetch?.client
        .post(submitAction, value)
        .then(() => {
          // redirect
          Modal.success({
            title: i18n.tv('form_template.index.submit_success_title', '提示'),
            content: submitSuccessTips,
            onOk: () => {
              if (submitSuccessRedirect) {
                localtion.goTo(submitSuccessRedirect, true);
              } else {
                form.reset('*');
              }
            },
          });
        })
        .catch((err) => {
          Modal.error({
            title: i18n.tv('form_template.index.submit_failed_title', '提交失败'),
            content: err.message,
          });
        })
        .finally(() => {
          submitingRef.value = false;
        });
    };

    return {
      formRes,
      pageTitle,
      links,
      cssText,
      renderError,
      submiting: submitingRef,
      onSubmit,
    };
  },
  errorCaptured(err, vm, info) {
    warn(process.env.NODE_ENV === 'production', info || err.message, vm);
    this.renderError = info || err.message;
    return false;
  },
  render() {
    const { $error, $loading, $result: formData } = this.formRes;

    const isEmptyObj = (obj: any) => JSON.stringify(obj) === '{}';
    const isConfigInvalid = () => {
      return (
        !formData ||
        isEmptyObj(formData.schema) ||
        isEmptyObj(formData.schema.schema) ||
        !formData.metas?.find(({ metaKey }) => metaKey === TemplateSubmitActionMetaKey)?.metaValue
      );
    };

    return (
      <div class={classes.container}>
        {$loading ? (
          <div class="loading text-center py-10">{this.$tv('common.tips.loading', '加载中')}</div>
        ) : $error ? (
          <div class="error--text text-center py-10">{$error.message}</div>
        ) : !formData ? (
          <div class="error--text text-center py-10">
            {this.$tv('form_template.index.not_found_text', '未找到表单！')}
          </div>
        ) : isConfigInvalid() ? (
          <div class="error--text text-center py-10">
            {this.$tv('form_template.index.schema_error_text', '表单配置错误！')}
          </div>
        ) : this.renderError ? (
          <div class="error--text text-center py-10">
            {this.$tv('page_template.index.render_error_text', '表单渲染错误！')}
            <p>{this.renderError}</p>
          </div>
        ) : (
          <suspense>
            <Form attrs={formData.schema.form} style={formData.schema.form?.style} form={form}>
              <SchemaField schema={formData.schema.schema}></SchemaField>
              <FormButtonGroup align-form-item>
                <Submit shape="round" loading={this.submiting} onSubmit={this.onSubmit}>
                  {this.$tv('common.btn_text.submit', '提交')}
                </Submit>
                {/* <Reset validate forceClear>
                  {this.$tv('common.btn_text.reset', '重置')}
                </Reset> */}
              </FormButtonGroup>
            </Form>
            <div class="text-center py-10" slot="fallback">
              <Spin />
            </div>
            <div class="error--text text-center py-10" slot="error">
              {this.$tv('page_template.index.render_error_text', '表单渲染错误！')}
            </div>
          </suspense>
        )}{' '}
      </div>
    );
  },
});
