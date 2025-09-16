import { defineComponent, ref } from '@vue/composition-api';
import { absoluteGo } from '@ace-util/core';
import { useRoute } from 'vue2-helpers/vue-router';
import { Form, Input, Button, Space } from 'ant-design-vue';
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

      const loading = ref(false);
      const handleSubmit = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        props.form.validateFields((err, values) => {
          if (err) return;

          // TODO: 发送验证码
          console.log(values);
          message.warn('TODO: 发送验证码');
          return;

          // loginApi
          //   .modifyPassword({
          //     variables: {
          //       model: {
          //         ...values,
          //         oldPwd: sha256(values.oldPwd).toString(),
          //         newPwd: sha256(values.newPwd).toString(),
          //       },
          //     },
          //     loading: () => {
          //       loading.value = true;
          //       return () => (loading.value = false);
          //     },
          //   })
          //   .then(() => {
          //     message.success({
          //       content: i18n.tv('page_password_forgot.form.submit_success', '登录成功!') as string,
          //       onClose: redirect,
          //     });
          //   })
          //   .catch((err) => {
          //     message.error(err.message);
          //   });
        });
      };

      return () => (
        <div class={classes.container}>
          <p class={classes.title}>{i18n.tv('page_password_forgot.form.description', '忘记密码')}</p>
          <Form
            form={props.form}
            wrapperCol={{ xs: 24, sm: { span: 18, offset: 3 } }}
            hideRequiredMark
            onSubmit={handleSubmit.bind(this)}
          >
            <Form.Item>
              <Input
                v-decorator={[
                  'username',
                  {
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_password_forgot.form.username_required', '请输入用户名/邮箱/手机号'),
                      },
                    ],
                  },
                ]}
                name="username"
                size="large"
                prefix={i18n.tv('page_password_forgot.form.username_label', '用户名：')}
                placeholder={i18n.tv('page_password_forgot.form.username_placeholder', '请输入用户名/邮箱/手机号')}
              />
            </Form.Item>
            <Form.Item wrapperCol={{ xs: 24, sm: { span: 18, offset: 3 } }}>
              <Space direction="vertical" class="d-block">
                <Button type="primary" shape="round" size="large" htmlType="submit" block loading={loading.value}>
                  {i18n.tv('page_password_forgot.form.submit_btn_text', '下一步')}
                </Button>
                <Button
                  type="link"
                  shape="round"
                  size="large"
                  block
                  class="text--secondary hover:primary--text"
                  onClick={redirect}
                >
                  {i18n.tv('page_password_forgot.form.cancel_btn_text', '取消')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </div>
      );
    },
  }),
);
