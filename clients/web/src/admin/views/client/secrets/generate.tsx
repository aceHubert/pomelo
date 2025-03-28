import moment from 'moment';
import { computed, defineComponent, ref } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { useRouter } from 'vue2-helpers/vue-router';
import { Alert, Button, Form, Card, DatePicker, Input, Select, Icon, Result } from 'ant-design-vue';
import { copyTextToClipboard } from '@ace-pomelo/shared/client';
import { message } from '@/components';
import { useI18n, useDeviceType } from '@/composables';
import { PageBreadcrumb } from '@/admin/components';
import { useClientApi } from '@/admin/fetch';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { ClientSecretModel } from '@/admin/fetch/client';

type ClientSecretGenerateProps = {
  form: WrappedFormUtils;
  clientId: string;
};

const getPresetTypeOptions = (
  i18nRender: (key: string, fallback: string, args?: Record<string, any>) => string = (key, fallback) => fallback,
) => [
  {
    value: 'SharedSecret',
    label: i18nRender('page_client_secrets.secret_type.shared_secret', 'SharedSecret'),
  },
  {
    value: 'X509Thumbprint',
    label: i18nRender('page_client_secrets.secret_type.x509_thumbprint', 'X509Thumbprint'),
  },
  {
    value: 'X509Name',
    label: i18nRender('page_client_secrets.secret_type.x509_name', 'X509Name'),
  },
  {
    value: 'X509CertificateBase64',
    label: i18nRender('page_client_secrets.secret_type.x509_certificate_base64', 'X509CertificateBase64'),
  },
];

const getPresetExpiresAtOptions = (
  i18nRender: (key: string, fallback: string, args?: Record<string, any>) => string = (key, fallback) => fallback,
) => [
  {
    value: 604800,
    label: i18nRender('page_client_secrets.secret_expires_days', '7天', { days: 7 }),
  },
  {
    value: 1296000,
    label: i18nRender('page_client_secrets.secret_expires_days', '15天', { days: 15 }),
  },
  {
    value: 2592000,
    label: i18nRender('page_client_secrets.secret_expires_days', '30天', { days: 30 }),
  },
  {
    value: 'custom',
    label: i18nRender('page_client_secrets.secret_expires_custom', '自定义'),
  },
  {
    value: null,
    label: i18nRender('page_client_secrets.secret_expires_never', '永不过期'),
  },
];

export default Form.create({})(
  defineComponent({
    name: 'ClientSecretGenerate',
    head() {
      return {
        title: this.$tv('page_client_secrets.generate.page_title', '生成密匙') as string,
      };
    },
    props: {
      clientId: {
        type: String,
        required: true,
      },
    },
    setup(props: ClientSecretGenerateProps) {
      const i18n = useI18n();
      const router = useRouter();
      const deviceType = useDeviceType();
      const clientApi = useClientApi();

      const clientSecret = ref<ClientSecretModel>();

      const presetTypeOptions = computed(() =>
        getPresetTypeOptions(
          (...args: [string, string, Record<string, any> | undefined]) => i18n.tv(...args) as string,
        ),
      );
      const presetExpiresAtOptions = computed(() =>
        getPresetExpiresAtOptions(
          (...args: [string, string, Record<string, any> | undefined]) => i18n.tv(...args) as string,
        ),
      );

      const formLayout = computed(() => (deviceType.isMobile ? 'vertical' : 'horizontal'));
      const formItemLayout = computed(() => {
        return formLayout.value === 'horizontal'
          ? {
              labelCol: { span: 4 },
              wrapperCol: { span: 14 },
            }
          : {};
      });
      const buttonItemLayout = computed(() => {
        return formLayout.value === 'horizontal'
          ? {
              wrapperCol: { span: 14, offset: 4 },
            }
          : {};
      });

      const $clientRes = createResource((clientId: string) =>
        clientApi
          .getBasicInfo({
            variables: {
              clientId,
            },
            catchError: true,
            loading: true,
          })
          .then(({ client }) => client),
      );

      $clientRes.read(props.clientId);

      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;

          // custom calculate expiresAt
          values.expiresAt === 'custom' &&
            (values.expiresAt = moment(values.expiresAtDate).endOf('day').diff(moment(), 'seconds'));
          delete values.expiresAtDate;

          clientApi
            .createSecret({
              variables: {
                clientId: props.clientId,
                model: values,
              },
              loading: (value) => (adding.value = value),
            })
            .then(({ clientSecret: secret }) => {
              clientSecret.value = secret;
              props.form.resetFields();
              const secretListPageHref = router.resolve({
                name: 'client-secrets',
                params: {
                  clientId: props.clientId,
                },
              }).href;

              // 修改路由但不刷新页面，使浏览器刷新到列表页
              window.history.replaceState(null, '', secretListPageHref);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      return () => {
        const { $result: client, $loading } = $clientRes;

        if ($loading) return;

        return client ? (
          <PageBreadcrumb
            breadcrumb={
              client.clientName
                ? (routeBreadcrumb) => {
                    routeBreadcrumb.splice(routeBreadcrumb.length - 1, 0, {
                      key: 'clientName',
                      label: client.clientName,
                      path: '',
                    });
                    return routeBreadcrumb;
                  }
                : true
            }
          >
            <Card bordered={false} size="small">
              {clientSecret.value ? (
                <div>
                  <Alert
                    type="warning"
                    banner
                    message={i18n.tv('page_client_secrets.generate.secret_generated_tip_title', '重要提醒')}
                    description={i18n.tv(
                      'page_client_secrets.generate.secret_generated_tip_content',
                      '密匙已生成，请妥善保管，一旦离开此页面，密匙将不可查看。',
                    )}
                  ></Alert>
                  <p class="mt-2 px-4 py-2 gray lighten-4">
                    {clientSecret.value.value}
                    <a
                      href="javascript:;"
                      class="ml-2"
                      onClick={() => {
                        if (copyTextToClipboard(clientSecret.value!.value)) {
                          message.success(i18n.tv('page_client_secrets.generate.copy_success', '复制成功') as string);
                        } else {
                          message.error(i18n.tv('page_client_secrets.generate.copy_faild', '复制失败') as string);
                        }
                      }}
                    >
                      <Icon type="copy" />
                    </a>
                  </p>

                  <Button class="mt-2" type="primary" onClick={() => router.back()}>
                    {i18n.tv('page_client_secrets.generate.back_btn_text', '返回')}
                  </Button>
                </div>
              ) : (
                <Form
                  form={props.form}
                  layout={formLayout.value}
                  labelCol={formItemLayout.value.labelCol}
                  wrapperCol={formItemLayout.value.wrapperCol}
                >
                  <Form.Item
                    label={i18n.tv('page_client_secrets.generate.form.description_label', '说明')}
                    help={i18n.tv('page_client_secrets.generate.form.description_help', '密匙作何使用？')}
                  >
                    <Input
                      v-decorator={[
                        'description',
                        {
                          rules: [
                            {
                              required: true,
                              message: i18n.tv(
                                'page_client_secrets.generate.form.description_required',
                                '请输入说明！',
                              ),
                            },
                          ],
                        },
                      ]}
                      placeholder={i18n.tv('page_client_secrets.generate.form.description_placeholder', '请输入说明')}
                      style="width:268px"
                    ></Input>
                  </Form.Item>
                  <Form.Item label={i18n.tv('page_client_secrets.generate.form.type_label', '类型')}>
                    <Select
                      v-decorator={[
                        'type',
                        {
                          initialValue: 'SharedSecret',
                          rules: [
                            {
                              required: true,
                              message: i18n.tv('page_client_secrets.generate.form.type_required', '请选择密匙类型！'),
                            },
                          ],
                        },
                      ]}
                      placeholder={i18n.tv('page_client_secrets.generate.form.type_placeholder', '请选择密匙类型')}
                      style="width:268px"
                      options={presetTypeOptions.value}
                    ></Select>
                  </Form.Item>
                  <Form.Item label={i18n.tv('page_client_secrets.generate.form.expires_at_label', '过期时间')} required>
                    <Select
                      v-decorator={[
                        'expiresAt',
                        {
                          initialValue: 2592000,
                          rules: [
                            {
                              validator: (rule, value, callback) => {
                                if (value === void 0) {
                                  callback(
                                    i18n.tv('page_client_secrets.generate.form.expires_at_required', '请选择过期时间'),
                                  );
                                } else if (value === 'custom' && !props.form.getFieldValue('expiresAtDate')) {
                                  callback(
                                    i18n.tv(
                                      'page_client_secrets.generate.form.expires_at_date_required',
                                      '请选择过期时间',
                                    ),
                                  );
                                } else {
                                  callback();
                                }
                              },
                            },
                          ],
                        },
                      ]}
                      placeholder={i18n.tv(
                        'page_client_secrets.generate.form.expires_at_placeholder',
                        '请选择过期时间',
                      )}
                      class="mr-2"
                      style="width:120px"
                      options={presetExpiresAtOptions.value}
                    ></Select>
                    {props.form.getFieldValue('expiresAt') === 'custom' && (
                      <DatePicker
                        v-decorator={[
                          'expiresAtDate',
                          {
                            rules: [
                              {
                                validator: (rule, value, callback) => {
                                  props.form.validateFields(['expiresAt'], { force: true });
                                  callback();
                                },
                              },
                            ],
                          },
                        ]}
                        disabledDate={(current) => current && current < moment().endOf('day')}
                        showToday={false}
                        placeholder={i18n.tv(
                          'page_client_secrets.generate.form.expires_at_date_placeholder',
                          '请选择过期时间',
                        )}
                        style="width:140px"
                      ></DatePicker>
                    )}
                  </Form.Item>
                  <Form.Item wrapperCol={buttonItemLayout.value.wrapperCol}>
                    <Button type="primary" loading={adding.value} onClick={() => handleAdd()}>
                      {i18n.tv('page_client_secrets.generate.form.submit_btn_text', '生成')}
                    </Button>
                    <Button class="ml-2" loading={adding.value} onClick={() => router.back()}>
                      {i18n.tv('page_client_secrets.generate.form.cancle_btn_text', '取消')}
                    </Button>
                  </Form.Item>
                </Form>
              )}
            </Card>
          </PageBreadcrumb>
        ) : (
          <Card bordered={false} size="small">
            <Result status="error" subTitle={i18n.tv('page_client_detail.not_found', '客户端不存在！')}>
              <template slot="extra">
                <Button key="console" type="primary" onClick={() => router.go(-1)}>
                  {i18n.tv('common.btn_text.go_back', '返回')}
                </Button>
              </template>
            </Result>
          </Card>
        );
      };
    },
  }),
);
