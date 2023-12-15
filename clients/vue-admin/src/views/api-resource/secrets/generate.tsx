import moment from 'moment';
import { computed, defineComponent, ref } from '@vue/composition-api';
import { useRouter } from 'vue2-helpers/vue-router';
import { Alert, Button, Form, Card, DatePicker, Input, Select, Icon } from 'ant-design-vue';
import { useDeviceType, copyTextToClipboard } from '@ace-pomelo/shared-client';
import { message } from '@/components';
import { PageBreadcrumb } from '@/layouts/components';
import { useI18n } from '@/hooks';
import { useApiResourceApi } from '@/fetch/apis';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { ApiSecretModel } from '@/fetch/apis/api-resource';

type ApiSecretGenerateProps = {
  form: WrappedFormUtils;
  apiResourceId: number;
};

const getPresetTypeOptions = (
  i18nRender: (key: string, fallback: string, args?: Record<string, any>) => string = (key, fallback) => fallback,
) => [
  {
    value: 'SharedSecret',
    label: i18nRender('page_api_secrets.secret_type.shared_secret', 'SharedSecret'),
  },
  {
    value: 'X509Thumbprint',
    label: i18nRender('page_api_secrets.secret_type.x509_thumbprint', 'X509Thumbprint'),
  },
  {
    value: 'X509Name',
    label: i18nRender('page_api_secrets.secret_type.x509_name', 'X509Name'),
  },
  {
    value: 'X509CertificateBase64',
    label: i18nRender('page_api_secrets.secret_type.x509_certificate_base64', 'X509CertificateBase64'),
  },
];

const getPresetExpiresAtOptions = (
  i18nRender: (key: string, fallback: string, args?: Record<string, any>) => string = (key, fallback) => fallback,
) => [
  {
    value: 604800,
    label: i18nRender('page_api_secrets.secret_expires_days', '7天', { days: 7 }),
  },
  {
    value: 1296000,
    label: i18nRender('page_api_secrets.secret_expires_days', '15天', { days: 15 }),
  },
  {
    value: 2592000,
    label: i18nRender('page_api_secrets.secret_expires_days', '30天', { days: 30 }),
  },
  {
    value: 'custom',
    label: i18nRender('page_api_secrets.secret_expires_custom', '自定义'),
  },
  {
    value: undefined,
    label: i18nRender('page_api_secrets.secret_expires_never', '永不过期'),
  },
];

export default Form.create({})(
  defineComponent({
    name: 'ApiSecretGenerate',
    head() {
      return {
        title: this.$tv('page_api_secrets.generate.page_title', '生成密匙') as string,
      };
    },
    props: {
      apiResourceId: {
        type: Number,
        required: true,
      },
    },
    setup(props: ApiSecretGenerateProps) {
      const i18n = useI18n();
      const router = useRouter();
      const deviceType = useDeviceType();
      const apiResourceApi = useApiResourceApi();

      const apiResourceName = ref('');
      const apiSecret = ref<ApiSecretModel>();

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

      apiResourceApi
        .getBasicInfo({
          variables: {
            id: props.apiResourceId,
          },
          catchError: true,
          loading: true,
        })
        .then(({ apiResource }) => {
          apiResourceName.value = apiResource.name;
        });

      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;

          // custom calculate expiresAt
          values.expiresAt === 'custom' &&
            (values.expiresAt = moment(values.expiresAtDate).endOf('day').diff(moment(), 'seconds'));
          delete values.expiresAtDate;

          apiResourceApi
            .createSecret({
              variables: {
                apiResourceId: props.apiResourceId,
                model: values,
              },
              loading: () => {
                adding.value = true;
                return () => (adding.value = false);
              },
            })
            .then(({ apiSecret: secret }) => {
              apiSecret.value = secret;
              props.form.resetFields();
              const secretListPageHref = router.resolve({
                name: 'api-secrets',
                params: {
                  id: String(props.apiResourceId),
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

      return () => (
        <PageBreadcrumb
          breadcrumb={
            apiResourceName.value
              ? (routeBreadcrumb) => {
                  routeBreadcrumb.splice(routeBreadcrumb.length - 1, 0, {
                    key: 'apiResourceName',
                    label: apiResourceName.value,
                    path: '',
                  });
                  return routeBreadcrumb;
                }
              : true
          }
        >
          <Card bordered={false} size="small">
            {apiSecret.value ? (
              <div>
                <Alert
                  type="warning"
                  banner
                  message={i18n.tv('page_api_secrets.generate.form.secret_generated_tip_title', '重要提醒')}
                  description={i18n.tv(
                    'page_api_secrets.generate.form.secret_generated_tip',
                    '密匙已生成，请妥善保管，一旦离开此页面，密匙将不可查看。',
                  )}
                ></Alert>
                <p class="mt-2 px-4 py-2 gray lighten-4">
                  {apiSecret.value.value}
                  <a
                    href="javascript:;"
                    class="ml-2"
                    onClick={() => {
                      if (copyTextToClipboard(apiSecret.value!.value)) {
                        message.success(i18n.tv('page_api_secrets.generate.copy_success', '复制成功') as string);
                      } else {
                        message.error(i18n.tv('page_api_secrets.generate.copy_faild', '复制失败') as string);
                      }
                    }}
                  >
                    <Icon type="copy" />
                  </a>
                </p>
              </div>
            ) : (
              <Form
                form={props.form}
                layout={formLayout.value}
                labelCol={formItemLayout.value.labelCol}
                wrapperCol={formItemLayout.value.wrapperCol}
              >
                <Form.Item
                  label={i18n.tv('page_api_secrets.generate.form.description_label', '说明')}
                  help={i18n.tv('page_api_secrets.generate.form.description_help', '密匙作何使用？')}
                >
                  <Input
                    v-decorator={[
                      'description',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_api_secrets.generate.form.type_required', '请输入说明'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_api_secrets.generate.form.type_placeholder', '请输入说明')}
                    style="width:268px"
                  ></Input>
                </Form.Item>
                <Form.Item
                  label={i18n.tv('page_api_secrets.generate.form.type_label', '类型')}
                  help={i18n.tv('page_api_secrets.generate.form.type_label_help', '密匙的类型')}
                >
                  <Select
                    v-decorator={[
                      'type',
                      {
                        initialValue: 'SharedSecret',
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_api_secrets.generate.form.type_required', '请选择密匙类型'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_api_secrets.generate.form.type_placeholder', '请选择密匙类型')}
                    style="width:268px"
                    options={presetTypeOptions.value}
                  ></Select>
                </Form.Item>
                <Form.Item
                  label={i18n.tv('page_api_secrets.generate.form.expires_at_label', '过期时间')}
                  help={i18n.tv('page_api_secrets.generate.form.expires_at_help', '密匙的过期时间')}
                >
                  <Select
                    v-decorator={[
                      'expiresAt',
                      {
                        initialValue: 2592000,
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_api_secrets.generate.form.expires_at_required', '请选择过期时间'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_api_secrets.generate.form.expires_at_placeholder', '请选择过期时间')}
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
                              required: true,
                              message: i18n.tv(
                                'page_api_secrets.generate.form.expires_at_date_required',
                                '请选择过期时间',
                              ),
                            },
                          ],
                        },
                      ]}
                      disabledDate={(current) => current && current < moment().endOf('day')}
                      showToday={false}
                      placeholder={i18n.tv(
                        'page_api_secrets.generate.form.expires_at_date_placeholder',
                        '请选择过期时间',
                      )}
                      style="width:140px"
                    ></DatePicker>
                  )}
                </Form.Item>
                <Form.Item wrapperCol={buttonItemLayout.value.wrapperCol}>
                  <Button type="primary" loading={adding.value} onClick={() => handleAdd()}>
                    {i18n.tv('page_api_secrets.generate.form.submit_btn_text', '生成密匙')}
                  </Button>
                  <Button class="ml-2" loading={adding.value} onClick={() => router.back()}>
                    {i18n.tv('page_api_secrets.generate.form.cancle_btn_text', '取消')}
                  </Button>
                </Form.Item>
              </Form>
            )}
          </Card>
        </PageBreadcrumb>
      );
    },
  }),
);
