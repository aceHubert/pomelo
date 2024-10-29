import sha256 from 'crypto-js/sha256';
import { defineComponent, ref } from '@vue/composition-api';
import { absoluteGo } from '@ace-util/core';
import { useRoute, useRouter } from 'vue2-helpers/vue-router';
import { Form, Input, Button, Spin, Space } from 'ant-design-vue';
import { message } from '@/components/antdv-helper';
import { useI18n, useUserManager } from '@/composables';
import { useDeviceMixin } from '@/mixins/device';
import { formatError } from '@/fetch/graphql/utils/helpers';
import { useLoginApi } from '@/login/fetch';
import classes from './modify.module.less';

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
        title: this.$tv('page_password_modify.title', '修改密码') as string,
      };
    },
    setup(props: SiteInitProps) {
      const i18n = useI18n();
      const deviceMixin = useDeviceMixin();
      const router = useRouter();
      const route = useRoute();
      const userManager = useUserManager();
      const loginApi = useLoginApi();

      const loading = ref(true);
      const submiting = ref(false);
      const username = ref('');
      userManager
        .getUser()
        .then((user) => {
          if (user) {
            username.value = user.profile.login_name;
          }
        })
        .finally(() => {
          loading.value = false;
        });

      const redirect = () => {
        const redirect = (route.query.returnUrl as string) || '/';
        absoluteGo(redirect, true);
      };

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
              loading: () => {
                loading.value = true;
                return () => (loading.value = false);
              },
            })
            .then(() => {
              message.success({
                content: i18n.tv('page_password_modify.form.submit_success', '修改成功!') as string,
                onClose: () => {
                  router.replace({
                    name: 'login',
                    query: route.query,
                  });
                },
              });
            })
            .catch((err) => {
              message.error(formatError(err).message);
            });
        });
      };

      return () => (
        <Spin spinning={loading.value} class={classes.container}>
          <p class={classes.title}>{i18n.tv('page_password_modify.form.description', '修改密码')}</p>
          <Form
            form={props.form}
            labelCol={{ xs: 24, sm: 6 }}
            wrapperCol={{ xs: 24, sm: 16 }}
            onSubmit={handleSubmit.bind(this)}
          >
            <Form.Item label={i18n.tv('page_password_modify.form.username_label', '用户名')}>
              <Input
                v-decorator={[
                  'username',
                  {
                    initialValue: username.value,
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_password_modify.form.username_required', '请输入用户名'),
                      },
                    ],
                  },
                ]}
                name="username"
                size="large"
                readOnly={!!username.value}
                placeholder={i18n.tv('page_password_modify.form.username_placeholder', '请输入用户名')}
              />
            </Form.Item>
            <Form.Item label={i18n.tv('page_password_modify.form.old_password_label', '旧密码')}>
              <Input.Password
                v-decorator={[
                  'oldPwd',
                  {
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_password_modify.form.old_password_required', '请输入旧密码'),
                      },
                    ],
                  },
                ]}
                name="password"
                size="large"
                placeholder={i18n.tv('page_password_modify.form.old_password_placeholder', '请输入旧密码')}
              />
            </Form.Item>
            <Form.Item label={i18n.tv('page_password_modify.form.new_password_label', '新密码')}>
              <Input.Password
                v-decorator={[
                  'newPwd',
                  {
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_password_modify.form.new_password_required', '请输入新密码'),
                      },
                      {
                        min: 6,
                        message: i18n.tv('page_password_modify.form.new_password_min_length', '请输入6位以上新密码', {
                          min: 6,
                        }),
                      },
                    ],
                  },
                ]}
                name="password"
                size="large"
                placeholder={i18n.tv('page_password_modify.form.new_password_placeholder', '请输入新密码')}
              />
            </Form.Item>
            <Form.Item wrapperCol={{ xs: 24, sm: { span: 16, offset: 6 } }}>
              <Space
                direction={deviceMixin.isMobile ? 'vertical' : 'horizontal'}
                class={deviceMixin.isMobile ? 'd-block' : ''}
              >
                <Button
                  type="primary"
                  shape="round"
                  size="large"
                  htmlType="submit"
                  block={deviceMixin.isMobile}
                  loading={submiting.value}
                >
                  {i18n.tv('page_password_modify.form.submit_btn_text', '修改')}
                </Button>
                <Button type="default" shape="round" size="large" block={deviceMixin.isMobile} onClick={redirect}>
                  {i18n.tv('page_password_modify.form.cancel_btn_text', '取消')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Spin>
      );
    },
  }),
);
