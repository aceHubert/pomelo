import sha256 from 'crypto-js/sha256';
import { defineComponent, ref } from '@vue/composition-api';
import { absoluteGo } from '@ace-util/core';
import { useRoute } from 'vue2-helpers/vue-router';
import { Form, Input, Button } from 'ant-design-vue';
import { message } from '@/components/antdv-helper';
import { useI18n } from '@/composables';
import { useDeviceMixin } from '@/mixins/device';
import { useLoginApi } from '@/login/fetch';
import classes from './forgot.module.less';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';

type SiteInitProps = {
  form: WrappedFormUtils;
};

export default Form.create({})(
  defineComponent({
    name: 'PasswordModify',
    head() {
      return {
        title: this.$tv('page_password_forgot.title', '忘记密码') as string,
      };
    },
    setup(props: SiteInitProps) {
      const i18n = useI18n();
      const deviceMixin = useDeviceMixin();
      const route = useRoute();
      const loginApi = useLoginApi();

      const redirect = () => {
        const redirect = (route.query.returnUrl as string) || '/';
        absoluteGo(redirect, true);
      };

      const submiting = ref(false);
      const handleSubmit = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        props.form.validateFields((err, values) => {
          if (err) return;

          loginApi
            .modifyPassword({
              variables: {
                model: {
                  ...values,
                  oldPwd: sha256(values.oldPwd).toString(),
                  newPwd: sha256(values.newPwd).toString(),
                },
              },
              loading: (value) => (submiting.value = value),
            })
            .then(() => {
              message.success({
                content: i18n.tv('page_password_forgot.form.submit_success', '登录成功!') as string,
                onClose: redirect,
              });
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      return () => (
        <div class={classes.container}>
          <p class={classes.title}>{i18n.tv('page_password_forgot.form.description', '忘记密码')}</p>
          <Form
            form={props.form}
            labelCol={{ xs: 24, sm: 6 }}
            wrapperCol={{ xs: 24, sm: 16 }}
            onSubmit={handleSubmit.bind(this)}
          >
            <Form.Item label={i18n.tv('page_password_forgot.form.username_label', '用户名')}>
              <Input
                v-decorator={[
                  'username',
                  {
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_password_forgot.form.username_required', '请输入用户名'),
                      },
                    ],
                  },
                ]}
                name="username"
                size="large"
                placeholder={i18n.tv('page_password_forgot.form.username_placeholder', '请输入用户名')}
              />
            </Form.Item>
            <Form.Item wrapperCol={{ xs: 24, sm: { span: 16, offset: 6 } }}>
              <Button
                type="primary"
                shape="round"
                size="large"
                htmlType="submit"
                block={deviceMixin.isMobile}
                loading={submiting.value}
              >
                {i18n.tv('page_password_forgot.form.submit_btn_text', '修改')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      );
    },
  }),
);
