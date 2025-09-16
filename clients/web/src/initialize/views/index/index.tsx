import sha256 from 'crypto-js/sha256';
import { defineComponent, ref } from '@vue/composition-api';
import { absoluteGo } from '@ace-util/core';
import { useRoute } from 'vue2-helpers/vue-router';
import { Form, Input, Select, Button } from 'ant-design-vue';
import { message } from '@/components/antdv-helper';
import { useI18n } from '@/composables';
import { useSiteInitApi } from '@/initialize/fetch';
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
      const route = useRoute();
      const siteInitApi = useSiteInitApi();

      const localeSelectionFocused = ref(false);

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
        const redirect = (route.query.redirect as string) || '/admin';
        absoluteGo(redirect, true);
      };

      const loading = ref(false);
      const handleSubmit = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();

        props.form.validateFields((err, values) => {
          if (err) return;

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
                content: i18n.tv('page_site_init.form.submit_success', '初始化成功!') as string,
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
            wrapperCol={{ xs: 24, sm: { span: 18, offset: 3 } }}
            hideRequiredMark
            onSubmit={handleSubmit.bind(this)}
          >
            <Form.Item>
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
                size="large"
                prefix={i18n.tv('page_site_init.form.title_label', '站点标题：')}
                placeholder={i18n.tv('page_site_init.form.title_placeholder', '请输入站点标题')}
              />
            </Form.Item>
            <Form.Item>
              <Input.Password
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
                size="large"
                prefix={i18n.tv('page_site_init.form.password_label', '管理员密码：')}
                placeholder={i18n.tv('page_site_init.form.password_placeholder', '请输入管理员密码')}
              />
            </Form.Item>
            <Form.Item>
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
                size="large"
                prefix={i18n.tv('page_site_init.form.email_label', '管理员邮箱：')}
                placeholder={i18n.tv('page_site_init.form.email_placeholder', '请输入管理员邮箱')}
              />
            </Form.Item>
            <Form.Item>
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
                size="large"
                prefix={i18n.tv('page_site_init.form.home_url_label', '主页地址：')}
                placeholder={i18n.tv('page_site_init.form.home_url_placeholder', '请输入主页地址')}
              />
            </Form.Item>
            <Form.Item>
              <div class={['select-with-prefix', { 'select-with-prefix--focused': localeSelectionFocused.value }]}>
                <span class="select-prefix">{i18n.tv('page_site_init.form.locale_label', '默认语言：')}</span>
                <Select
                  v-decorator={[
                    'locale',
                    {
                      initialValue: 'en-US',
                      rules: [
                        {
                          required: true,
                          message: i18n.tv('page_site_init.form.locale_required', '请选择默认语言'),
                        },
                      ],
                    },
                  ]}
                  size="large"
                  placeholder={i18n.tv('page_site_init.form.locale_placeholder', '请输入默认语言')}
                  onFocus={() => {
                    localeSelectionFocused.value = true;
                  }}
                  onBlur={() => {
                    localeSelectionFocused.value = false;
                  }}
                >
                  <Select.Option value="en-US">English</Select.Option>
                  <Select.Option value="zh-CN">简体中文</Select.Option>
                </Select>
              </div>
            </Form.Item>
            <Form.Item wrapperCol={{ xs: 24, sm: { span: 18, offset: 3 } }}>
              <Button type="primary" shape="round" size="large" htmlType="submit" block loading={loading.value}>
                {i18n.tv('page_site_init.form.submit_btn_text', '提交')}
              </Button>
            </Form.Item>
          </Form>
        </div>
      );
    },
  }),
);
