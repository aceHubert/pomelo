import { defineComponent, ref, computed, watch } from '@vue/composition-api';
import { createForm } from '@formily/core';
import { createSchemaField, FragmentComponent } from '@formily/vue';
import * as Vant from '@formily/vant';
import { Form, Submit } from '@formily/vant';
import { Text } from '@formily/vant-prototypes/esm/components/Text';
import { useRoute } from 'vue2-helpers/vue-router';
import { Loading, Dialog } from 'vant';
import { getActiveFetch } from '@vue-async/fetch';
import { createResource } from '@vue-async/resource-manager';
import { useTemplateApi, jsonDeserializeReviver, warn } from '@pomelo/shared-web';
import { useI18n } from '@/hooks';
import { useLocationMixin } from '@/mixins';
import {
  TemplateSchemaMobileMetaKey,
  TemplateStyleLinkMetaKey,
  TemplateStyleCssTextMetaKey,
  TemplateSubmitActionMetaKey,
  TemplateSubmitSuccessRedirectMetaKey,
  TemplateSubmitSuccessTipsMetaKey,
} from '../constants';

// Types
import type { FormTemplateWithMetasModel } from '@pomelo/shared-web';
import type { SchemaVueComponents } from '@formily/vue';

const form = createForm();
const { SchemaField } = createSchemaField({
  components: {
    Text,
    ...(Vant as SchemaVueComponents),
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
            TemplateSchemaMobileMetaKey,
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
          form.metas?.find((meta) => meta.metaKey === TemplateSchemaMobileMetaKey)?.metaValue ||
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
        (i18n.tv('form_template.index.submit_success_text', '提交成功') as string);

      submitingRef.value = true;
      fetch?.client
        .post(submitAction, value)
        .then(() => {
          // redirect
          Dialog.alert({
            title: i18n.tv('form_template.index.submit_success_title', '提示') as string,
            message: submitSuccessTips,
          }).then(() => {
            if (submitSuccessRedirect) {
              localtion.goTo(submitSuccessRedirect, true);
            } else {
              form.reset('*');
            }
          });
        })
        .catch((err) => {
          Dialog.alert({
            title: i18n.tv('form_template.index.submit_failed_title', '提交失败') as string,
            message: err.message,
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

    // TODO: 外面不包一层，上面的解构类型错误
    return (
      <FragmentComponent>
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
            {this.$tv('form_template.index.render_error_text', '表单渲染错误！')}
            <p>{this.renderError}</p>
          </div>
        ) : (
          <suspense>
            <Form attrs={formData.schema.form} style={formData.schema.form?.style} form={form}>
              <SchemaField schema={formData.schema.schema}></SchemaField>
              <div style="padding: 20px 16px;">
                <Submit
                  round
                  block
                  loading={this.submiting}
                  loadingText={this.$tv('common.btn_text.submit', '提交')}
                  onSubmit={this.onSubmit}
                >
                  {this.$tv('common.btn_text.submit', '提交')}
                </Submit>
              </div>
            </Form>
            <div style="text-align:center" slot="fallback">
              <Loading />
            </div>
            <div class="error--text text-center py-10" slot="error">
              {this.$tv('page_template.index.render_error_text', '表单渲染错误！')}
            </div>
          </suspense>
        )}
      </FragmentComponent>
    );
  },
});
