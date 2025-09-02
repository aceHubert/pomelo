import { defineComponent } from '@vue/composition-api';
import { Form, Input } from 'ant-design-vue';
import { useI18n } from '@/composables';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { UpdateApiResourceInput } from '@/admin/fetch/api-resource';

type ApiResourceFormProps = {
  form: WrappedFormUtils;
  defaultValue: Partial<UpdateApiResourceInput>;
};

export default Form.create({
  mapPropsToFields: (props: ApiResourceFormProps) => {
    const defaultValue = { ...props.defaultValue };
    return Object.keys(defaultValue).reduce((prev, key) => {
      // @ts-expect-error createFormField undefined type on Form, but it's exist
      prev[key] = Form.createFormField({
        value: props.defaultValue[key],
      });
      return prev;
    }, {} as Record<keyof UpdateApiResourceInput, any>);
  },
})(
  defineComponent({
    name: 'ApiResourceForm',
    props: {
      defaultValue: { type: Object },
    },
    setup(props: ApiResourceFormProps) {
      const i18n = useI18n();

      return () => (
        <Form form={props.form} labelCol={{ span: 7 }} wrapperCol={{ span: 15 }}>
          <Form.Item
            label={i18n.tv('api_resource_form.name_label', '资源名称')}
            extra={i18n.tv('api_resource_form.name_help', '长度为1-50个字符，允许英文字母或“.”；名称需要唯一')}
          >
            <Input
              v-decorator={[
                'name',
                {
                  rules: [
                    {
                      required: true,
                      message: i18n.tv('api_resource_form.name_required', '请输入资源名称'),
                    },
                    {
                      pattern: /^[a-zA-Z_]+$/,
                      message: i18n.tv('api_resource_form.name_pattern_invalid', '只允许英文字母或“_”'),
                    },
                    {
                      max: 50,
                      message: i18n.tv('api_resource_form.name_max_length_invalid', '长度不能超过50个字符', {
                        length: 50,
                      }),
                    },
                  ],
                },
              ]}
              placeholder={i18n.tv('api_resource_form.name_placeholder', '请输入资源名称')}
            />
          </Form.Item>
          <Form.Item label={i18n.tv('api_resource_form.display_name_label', '显示名称')}>
            <Input
              v-decorator={['displayName']}
              placeholder={i18n.tv('api_resource_form.display_name_placeholder', '请输入显示名称')}
            />
          </Form.Item>
          <Form.Item label={i18n.tv('api_resource_form.description_label', '描述')}>
            <Input.TextArea
              v-decorator={['description']}
              placeholder={i18n.tv('api_resource_form.description_placeholder', '请输入描述')}
            />
          </Form.Item>
        </Form>
      );
    },
  }),
);
