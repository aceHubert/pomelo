import { defineComponent, ref, computed } from '@vue/composition-api';
import { promisify } from '@ace-util/core';
import { createForm } from '@formily/core';
import { createSchemaField, FragmentComponent } from '@formily/vue';
import { Loading, Dialog } from 'vant';
import * as Vant from '@formily/vant';
import { Form, Submit } from '@formily/vant';
import { Result } from '@/components';
import { useLocationMixin } from '@/mixins';
import { useI18n } from '@/hooks';
import { FormMetaPresetKeys } from '@/fetch/apis';
import { safeJSONParse } from '@/utils';
import { checkSchemaValid, type IFormilySchema } from './utils';
import { Text } from './components';
import classes from './mobile.module.less';

// Types
import type { SchemaComponents } from '@formily/vue';
import type { SchemaFramework } from '@ace-pomelo/shared-client';

const form = createForm();
const { SchemaField } = createSchemaField({
  components: {
    Text,
    ...(Vant as SchemaComponents),
  },
});

export interface MobileFormProps {
  title: string;
  content: any;
  metas: Record<string, string>;
  framework: SchemaFramework;
  onSubmit: (value: any) => Promise<{ tips?: string; redirect?: string } | undefined>;
  onSubmitFailed?: (errors: any) => void;
}

export default defineComponent({
  name: 'MobileForm',
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
    onSubmit: Function,
    onSubmitFailed: Function,
  },
  setup(props: MobileFormProps, { listeners }) {
    const i18n = useI18n();
    const locationMixin = useLocationMixin();

    const schema = computed(() => {
      if (props.framework === 'FORMILYJS') {
        const schema = (props.content ?? {}) as {
          responsive?: IFormilySchema;
          mobile?: IFormilySchema;
          desktop?: IFormilySchema;
        };
        // fallback to responsive
        return schema.mobile && checkSchemaValid(schema.mobile) ? schema.mobile : schema.responsive;
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

      return locationMixin.getMediaPath(safeJSONParse(value)?.path ?? value);
    });

    const submitingRef = ref(false);
    const handleSubmit = (value: any) => {
      const submit = props.onSubmit || listeners.submit;
      if (!submit) return;

      submitingRef.value = true;
      return promisify(submit(value))
        .then((result) => {
          // 没有 redirect 时需要默认提示
          const tips =
            result?.tips ??
            (!result?.redirect ? (i18n.tv('form_template.index.submit_success_text', '提交成功') as string) : void 0);
          (tips
            ? Dialog.alert({
                title: i18n.tv('form_template.index.submit_success_title', '提示') as string,
                message: tips,
              })
            : Promise.resolve(null)
          ).then(() => {
            form.reset('*');

            result?.redirect && localtionMixin.goTo(result?.redirect, true);
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

    const handleSubmitFaild = (errors: any) => {
      const submitFailed = props.onSubmitFailed || listeners.submitFailed;
      if (!submitFailed) return;

      submitFailed(errors);
    };

    // TODO: 外面不包一层，上面的解构类型错误
    return () => (
      <FragmentComponent>
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
                    <div style="padding: 20px 16px;">
                      <Submit
                        round
                        block
                        type="primary"
                        loading={submitingRef.value}
                        loadingText={i18n.tv('common.btn_text.submit', '提交')}
                        onSubmit={handleSubmit}
                        onSubmitFailed={handleSubmitFaild}
                      >
                        {i18n.tv('common.btn_text.submit', '提交')}
                      </Submit>
                    </div>
                  </Form>
                ) : (
                  <div>{`内容格式"${props.framework}"不支持渲染`}</div>
                )}
                <div style="text-align:center" slot="fallback">
                  <Loading />
                </div>
                <Result
                  slot="error"
                  status="error"
                  title={i18n.tv('form_template.index.render_error_text', '表单渲染错误！') as string}
                ></Result>
              </suspense>
            </div>
          </div>
        )}
      </FragmentComponent>
    );
  },
});
