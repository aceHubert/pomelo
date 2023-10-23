import { defineComponent, ref, computed } from '@vue/composition-api';
import { promisify, isAbsoluteUrl, trailingSlash } from '@ace-util/core';
import { createForm } from '@formily/core';
import { createSchemaField } from '@formily/vue';
import { Card, Rate } from 'ant-design-vue';
import { Form, FormButtonGroup, Submit } from '@formily/antdv';
import * as Antdv from '@formily/antdv';
import { OptionPresetKeys, FormMetaPresetKeys } from '@pomelo/shared-web';
import { useI18n, useOptions } from '@/hooks';
import { Spin, Result } from '@/components';
import { checkSchemaValid, type IFormilySchema } from './utils';
import Text from './components/Text';
import classes from './desktop.module.less';

// Types
import type { SchemaComponents } from '@formily/vue';
import type { SchemaFramework } from '@pomelo/shared-web';

const form = createForm();
const { SchemaField } = createSchemaField({
  components: {
    Card,
    Rate,
    Text,
    ...(Antdv as SchemaComponents),
  },
});

export interface DesktopFormProps {
  title: string;
  content: any;
  metas: Record<string, string>;
  framework: SchemaFramework;
  loading?: boolean;
  error?: Error;
  onSubmit: (value: any) => Promise<any>;
  onSubmitFailed?: (errors: any) => void;
}

export default defineComponent({
  name: 'DesktopForm',
  props: {
    title: String,
    content: [],
    metas: {
      type: Object,
      default: () => ({}),
    },
    framework: {
      type: String,
      default: 'FORMILYJS',
    },
    loading: Boolean,
    error: Object,
    onSubmit: Function,
    onSubmitFailed: Function,
  },
  setup(props: DesktopFormProps, { listeners }) {
    const i18n = useI18n();
    const siteUrl = useOptions(OptionPresetKeys.SiteUrl);

    const schema = computed(() => {
      if (props.framework === 'FORMILYJS') {
        const schema = (props.content ?? {}) as {
          responsive?: IFormilySchema;
          mobile?: IFormilySchema;
          desktop?: IFormilySchema;
        };
        // fallback to responsive
        return schema.desktop && checkSchemaValid(schema.desktop) ? schema.desktop : schema.responsive;
      }
      return props.content;
    });

    const isSchemaValid = computed(() => {
      if (props.framework === 'FORMILYJS') {
        return schema.value && checkSchemaValid(schema.value);
      }
      // TODO: other framework
      return true;
    });

    const featureImage = computed(() => {
      const value = props.metas[FormMetaPresetKeys.FeatureImage];
      if (!value) return undefined;
      if (isAbsoluteUrl(value)) return value;

      return trailingSlash(siteUrl.value) + (value.startsWith('/') ? value.slice(1) : value);
    });

    const submitingRef = ref(false);
    const handleSubmit = (value: any) => {
      const submit = props.onSubmit || listeners.submit;
      if (!submit) return;

      submitingRef.value = true;
      return promisify(submit(value))
        .then(() => {
          form.reset('*');
        })
        .finally(() => {
          submitingRef.value = false;
        });
    };

    const handleSubmitFaild = (errors: any) => {
      const submitFailed = props.onSubmitFailed || listeners.submitFailed;
      if (!submitFailed) return;

      submitFailed(errors);
    };

    return () => (
      <div class={classes.container}>
        {!isSchemaValid.value ? (
          <Result
            status="error"
            title={i18n.tv('form_template.index.schema_error_text', '表单配置错误！') as string}
            subTitle={i18n.tv('form_template.index.contact_administrator_tips', '请联系管理员。') as string}
          ></Result>
        ) : (
          <div class={classes.wrapper}>
            {featureImage.value && (
              <div
                class={classes.featureImage}
                style={{
                  backgroundImage: `url(${featureImage.value})`,
                }}
              ></div>
            )}
            <div class={classes.contentWrapper}>
              <suspense>
                {props.framework === 'FORMILYJS' ? (
                  <Form attrs={schema.value.form} style={schema.value.form?.style} form={form}>
                    <SchemaField schema={schema.value.schema}></SchemaField>
                    <FormButtonGroup align-form-item>
                      <Submit
                        shape="round"
                        loading={submitingRef.value}
                        onSubmit={handleSubmit}
                        onSubmitFailed={handleSubmitFaild}
                      >
                        {i18n.tv('common.btn_text.submit', '提交')}
                      </Submit>
                      {/* <Reset validate forceClear>
                {i18n.tv('common.btn_text.reset', '重置')}
              </Reset> */}
                    </FormButtonGroup>
                  </Form>
                ) : (
                  <div>{`内容格式"${props.framework}"不支持渲染`}</div>
                )}
                <div class="text-center py-10" slot="fallback">
                  <Spin />
                </div>
                <Result
                  slot="error"
                  status="error"
                  title={i18n.tv('page_template.index.render_error_text', '表单渲染错误！') as string}
                ></Result>
              </suspense>
            </div>
          </div>
        )}
      </div>
    );
  },
});
