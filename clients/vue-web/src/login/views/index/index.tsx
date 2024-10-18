import sha256 from 'crypto-js/sha256';
import { defineComponent, ref } from '@vue/composition-api';
import { absoluteGo } from '@ace-util/core';
import { useRoute } from 'vue2-helpers/vue-router';
import { Form, Input, Button } from 'ant-design-vue';
import { setToken } from '@/auth/local';
import { message } from '@/components/antdv-helper';
import { useI18n } from '@/hooks/i18n';
import { useDeviceMixin } from '@/mixins/device';
import { useLoginApi } from '@/login/fetch';
import classes from './index.module.less';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';

type SiteInitProps = {
  form: WrappedFormUtils;
};

export default Form.create({})(
  defineComponent({
    name: 'SiteInit',
    layout: 'blank',
    head() {
      return {
        title: this.$tv('page_login.title', '登录') as string,
      };
    },
    setup(props: SiteInitProps) {
      const i18n = useI18n();
      const deviceMixin = useDeviceMixin();
      const route = useRoute();
      const loginApi = useLoginApi();

      const redirect = () => {
        const redirect = (route.query.redirect as string) || '/';
        absoluteGo(redirect, true);
      };

      const loading = ref(false);
      const handleSubmit = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        props.form.validateFields((err, values) => {
          if (err) return;

          loginApi
            .signIn({
              variables: {
                model: {
                  ...values,
                  password: sha256(values.password).toString(),
                },
              },
              loading: () => {
                loading.value = true;
                return () => (loading.value = false);
              },
            })
            .then(({ result }) => {
              if (result.success) {
                setToken(result.token);
                message.success({
                  content: i18n.tv('page_login.form.submit_success', '登录成功!') as string,
                  onClose: redirect,
                });
              } else {
                message.error(result.message);
              }
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      return () => (
        <div class={classes.container}>
          <p class={classes.title}>{i18n.tv('page_login.form.description', '登录')}</p>
          <Form
            form={props.form}
            labelCol={{ xs: 24, sm: 8 }}
            wrapperCol={{ xs: 24, sm: 16 }}
            onSubmit={handleSubmit.bind(this)}
          >
            <Form.Item label={i18n.tv('page_login.form.username_label', '用户名')}>
              <Input
                v-decorator={[
                  'username',
                  {
                    initialValue: 'Pomelo',
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_login.form.username_required', '请输入用户名'),
                      },
                    ],
                  },
                ]}
                placeholder={i18n.tv('page_login.form.username_placeholder', '请输入用户名')}
              />
            </Form.Item>
            <Form.Item label={i18n.tv('page_login.form.password_label', '密码')}>
              <Input.Password
                v-decorator={[
                  'password',
                  {
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_login.form.password_required', '请输入密码'),
                      },
                      {
                        min: 6,
                        message: i18n.tv('page_login.form.password_min_length', '请输入6位以上密码', { min: 6 }),
                      },
                    ],
                  },
                ]}
                placeholder={i18n.tv('page_login.form.password_placeholder', '请输入密码')}
              />
            </Form.Item>
            <Form.Item wrapperCol={{ xs: 24, sm: { span: 16, offset: 8 } }}>
              <Button
                type="primary"
                shape="round"
                size="large"
                htmlType="submit"
                block={deviceMixin.isMobile}
                loading={loading.value}
              >
                {i18n.tv('page_login.form.submit_btn_text', '登录')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      );
    },
  }),
);
