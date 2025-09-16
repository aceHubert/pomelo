import sha256 from 'crypto-js/sha256';
import { defineComponent, onMounted, ref } from '@vue/composition-api';
import { absoluteGo } from '@ace-util/core';
import { useRoute, useRouter } from 'vue2-helpers/vue-router';
import { Form, Input, Button, Row, Col, Checkbox } from 'ant-design-vue';
import { Authoriztion, AuthType } from '@/auth';
import { setToken, removeToken } from '@/auth/local';
import { message } from '@/components/antdv-helper';
import { useI18n } from '@/composables';
import { useLoginApi } from '@/login/fetch';
import classes from './index.module.less';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';

type SiteInitProps = {
  form: WrappedFormUtils;
};

export default Form.create({})(
  defineComponent({
    name: 'SignIn',
    head() {
      return {
        title: this.$tv('page_login.title', '登录') as string,
      };
    },
    setup(props: SiteInitProps) {
      const i18n = useI18n();
      const router = useRouter();
      const route = useRoute();
      const loginApi = useLoginApi();

      const remember = ref(false);

      const redirect = () => {
        const redirect = (route.query.returnUrl as string) || '/';
        absoluteGo(redirect, true);
      };

      if (Authoriztion.authType !== AuthType.Local) {
        redirect();
        return;
      }

      const loading = ref(false);
      const handleSubmit = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        props.form.validateFields((err, { password, username }) => {
          if (err) return;

          loginApi
            .signIn({
              variables: {
                model: {
                  username,
                  password: sha256(password).toString(),
                },
              },
              loading: () => {
                loading.value = true;
                return () => (loading.value = false);
              },
            })
            .then(({ result }) => {
              if (result.success) {
                setToken(result.accessToken, result.tokenType, remember.value);
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

      onMounted(() => {
        removeToken();
      });

      return () => (
        <div class={classes.container}>
          <p class={classes.title}>{i18n.tv('page_login.form.description', '登录 Pomelo 平台')}</p>
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
                        message: i18n.tv('page_login.form.username_required', '请输入用户名'),
                      },
                    ],
                  },
                ]}
                name="username"
                size="large"
                prefix={i18n.tv('page_login.form.username_label', '用户名：')}
                placeholder={i18n.tv('page_login.form.username_placeholder', '请输入用户名')}
              ></Input>
            </Form.Item>
            <Form.Item>
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
                name="password"
                size="large"
                prefix={i18n.tv('page_login.form.password_label', '密码：')}
                placeholder={i18n.tv('page_login.form.password_placeholder', '请输入密码')}
              ></Input.Password>
            </Form.Item>
            <Row type="flex" class="mb-4 px-3">
              <Col xs={24} sm={{ span: 18, offset: 3 }} class="d-flex justify-content-space-between">
                <Checkbox v-model={remember.value}>{i18n.tv('page_login.form.remember_me_label', '记住我?')}</Checkbox>
                <router-link
                  to={{
                    name: 'password-forgot',
                    query: { returnUrl: `${router.options.base}${route.fullPath.substring(1)}` },
                  }}
                  class="ml-auto"
                >
                  {i18n.tv('page_login.form.forgot_password_label', '忘记密码?')}
                </router-link>
              </Col>
            </Row>
            <Form.Item wrapperCol={{ xs: 24, sm: { span: 18, offset: 3 } }}>
              <Button type="primary" shape="round" size="large" htmlType="submit" block loading={loading.value}>
                {i18n.tv('page_login.form.submit_btn_text', '登录')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      );
    },
  }),
);
