import sha256 from 'crypto-js/sha256';
import { defineComponent, ref } from '@vue/composition-api';
import { isAbsoluteUrl, absoluteGo } from '@ace-util/core';
import { useRoute, useRouter } from 'vue2-helpers/vue-router';
import { Form, Input, Select, Button } from 'ant-design-vue';
import { message } from '@/components';
import { useI18n } from '@/hooks';
import { useDeviceMixin } from '@/mixins';
import { siteInitRequiredRef } from '@/shared';
import { useSiteInitApi } from '@/fetch/apis';
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
        title: this.$tv('page_site_init.title', '站点初始化') as string,
      };
    },
    setup(props: SiteInitProps) {
      const i18n = useI18n();
      const deviceMixin = useDeviceMixin();
      const router = useRouter();
      const route = useRoute();
      const siteInitApi = useSiteInitApi();

      siteInitApi
        .check({
          loading: true,
          catchError: true,
        })
        .then(({ result }) => {
          if (!result) {
            redirect();
          }
        });

      const redirect = () => {
        const redirect = (route.query.redirect as string) || '/';
        if (isAbsoluteUrl(redirect)) {
          absoluteGo(redirect, true);
          return;
        }

        siteInitRequiredRef.value = false;
        router.replace(redirect);
      };

      const loading = ref(false);
      const handleSubmit = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        props.form.validateFields((err, values) => {
          if (err) return;

          loading.value = true;

          siteInitApi
            .start({
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
            .then(() => {
              message.success({
                content: i18n.tv('page_site_init.form.submit_success', '初始化成功') as string,
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
          <p class={classes.title}>{i18n.tv('page_site_init.form.description', '站点初始化')}</p>
          <Form
            form={props.form}
            labelCol={{ xs: 24, sm: 8 }}
            wrapperCol={{ xs: 24, sm: 16 }}
            onSubmit={handleSubmit.bind(this)}
          >
            <Form.Item label={i18n.tv('page_site_init.form.title_label', '标题')}>
              <Input
                v-decorator={[
                  'title',
                  {
                    initialValue: 'Pomelo',
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_site_init.form.title_required', '请输入站点标题'),
                      },
                    ],
                  },
                ]}
                placeholder={i18n.tv('page_site_init.form.title_placeholder', '请输入站点标题')}
              />
            </Form.Item>
            <Form.Item label={i18n.tv('page_site_init.form.password_label', '管理员密码')}>
              <Input
                v-decorator={[
                  'password',
                  {
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_site_init.form.password_required', '请输入管理员密码'),
                      },
                      {
                        pattern: /^(?![0-9]+$)(?![a-zA-Z]+$)[0-9A-Za-z\\!@#$%&*]{6,}$/,
                        message: i18n.tv(
                          'page_site_init.form.password_invalid',
                          '请输入6位以上密码并且至少包含数字、大小写字母',
                        ),
                      },
                    ],
                  },
                ]}
                placeholder={i18n.tv('page_site_init.form.password_placeholder', '请输入管理员密码')}
              />
            </Form.Item>
            <Form.Item label={i18n.tv('page_site_init.form.email_label', '管理员邮箱')}>
              <Input
                v-decorator={[
                  'email',
                  {
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_site_init.form.email_required', '请输入管理员邮箱'),
                      },
                      {
                        type: 'email',
                        message: i18n.tv('page_site_init.form.email_invalid', '请输入正确的邮箱'),
                      },
                    ],
                  },
                ]}
                placeholder={i18n.tv('page_site_init.form.email_placeholder', '请输入管理员邮箱')}
              />
            </Form.Item>
            <Form.Item label={i18n.tv('page_site_init.form.home_url_label', '主页地址')}>
              <Input
                v-decorator={[
                  'homeUrl',
                  {
                    initialValue: location.origin,
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_site_init.form.home_url_required', '请输入主页地址'),
                      },
                      {
                        type: 'url',
                        message: i18n.tv('page_site_init.form.home_url_invalid', '请输入正确的主页地址'),
                      },
                    ],
                  },
                ]}
                placeholder={i18n.tv('page_site_init.form.home_url_placeholder', '请输入主页地址')}
              />
            </Form.Item>
            <Form.Item label={i18n.tv('page_site_init.form.locale_label', '默认语言')}>
              <Select
                v-decorator={[
                  'locale',
                  {
                    initialValue: 'en-US',
                    rules: [
                      {
                        required: true,
                        message: i18n.tv('page_site_init.form.locale_required', '请输入默认语言'),
                      },
                    ],
                  },
                ]}
                placeholder={i18n.tv('page_site_init.form.locale_placeholder', '请输入默认语言')}
              >
                <Select.Option value="en-US">English</Select.Option>
                <Select.Option value="zh-CN">简体中文</Select.Option>
              </Select>
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
                {i18n.tv('page_site_init.form.submit_btn_text', '提交')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      );
    },
  }),
);
