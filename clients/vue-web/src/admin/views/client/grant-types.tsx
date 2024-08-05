import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Button, Form, Alert, Select, Table, Result } from 'ant-design-vue';
import { useRouter } from 'vue2-helpers/vue-router';
import { Modal, message } from '@/components';
import { useI18n, useDeviceType } from '@/hooks';
import { PageBreadcrumb } from '@/admin/components';
import { useClientApi } from '@/admin/fetch';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'ant-design-vue/types/table/column';
import type { ClientGrantTypesModel } from '@/admin/fetch/client';

type ClientGrantTypeProps = {
  form: WrappedFormUtils;
  clientId: string;
};

const getPresetOptions = () => [
  {
    value: 'authorization_code',
    label: 'AuthorizationCode',
  },
  {
    value: 'client_credentials',
    label: 'ClientCredentials',
  },
  {
    value: 'device_code',
    label: 'DeviceCode',
  },
  // 已过时
  // {
  //   value: 'implicit',
  //   label: 'Implicit',
  // },
  {
    value: 'jwt-bearer',
    label: 'JwtBearer',
  },
  //   // 已过时
  // {
  //   value: 'password',
  //   label: 'Password',
  // },
  {
    value: 'refresh_token',
    label: 'RefreshToken',
  },
  {
    value: 'saml2-bearer',
    label: 'Saml2Bearer',
  },
  {
    value: 'token-exchange',
    label: 'TokenExchange',
  },
];

export default Form.create({})(
  defineComponent({
    name: 'ClientGrantType',
    head() {
      return {
        title: this.$tv('page_client_grant_types.page_title', '授权模式') as string,
      };
    },
    props: {
      clientId: {
        type: String,
        required: true,
      },
    },
    setup(props: ClientGrantTypeProps) {
      const router = useRouter();
      const i18n = useI18n();
      const deviceType = useDeviceType();
      const clientApi = useClientApi();

      const columns = computed(
        () =>
          [
            {
              key: 'grantType',
              title: i18n.tv('page_client_grant_types.table_header.grant_type_label', '授权模式'),
              dataIndex: 'grantType',
              width: 200,
            },
            {
              key: 'action',
              title: i18n.tv('page_client_grant_types.table_header.action_label', '操作'),
              customRender: (_: any, record: ClientGrantTypesModel['grantTypes'][0]) => [
                <Button
                  type="link"
                  size="small"
                  class="px-0 danger--text as-link"
                  onClick={() => handleDelete(record.id)}
                >
                  {i18n.tv('common.btn_text.delete', '删除')}
                </Button>,
              ],
              fixed: deviceType.isMobile ? 'right' : void 0,
              width: deviceType.isMobile ? 120 : void 0,
            },
          ] as Column[],
      );

      const clientName = ref('');
      const presetOptions = getPresetOptions();

      const $grantTypesRes = createResource((clientId: string) => {
        return clientApi
          .getGrantTypes({
            variables: { clientId },
            loading: true,
            catchError: true,
          })
          .then(({ clientGrantTypes }) => {
            if (!clientGrantTypes) return;

            clientName.value = clientGrantTypes.clientName;
            return clientGrantTypes.grantTypes;
          });
      });

      $grantTypesRes.read(props.clientId);

      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;
          clientApi
            .createGrantTypes({
              variables: {
                clientId: props.clientId,
                model: values.grantTypes.map((item: string) => ({ grantType: item })),
              },
              loading: () => {
                adding.value = true;
                return () => (adding.value = false);
              },
            })
            .then(({ grantTypes }) => {
              props.form.resetFields();
              $grantTypesRes.$result!.push(...grantTypes);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      const deleting = ref(false);
      const handleDelete = (id: string) => {
        Modal.confirm({
          title: i18n.tv('page_client_grant_types.delete_confirm.title', '确认'),
          content: i18n.tv('page_client_grant_types.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
          okButtonProps: {
            props: {
              loading: deleting.value,
            },
          },
          cancelButtonProps: {
            props: {
              disabled: deleting.value,
            },
          },
          onOk() {
            return clientApi
              .deleteGrantType({
                variables: { id },
                loading: () => {
                  deleting.value = true;
                  return () => (deleting.value = false);
                },
              })
              .then(({ result }) => {
                result &&
                  $grantTypesRes.$result!.splice(
                    $grantTypesRes.$result!.findIndex((item) => item.id === id),
                    1,
                  );
              })
              .catch((err) => {
                message.error(err.message);
              });
          },
        });
      };

      return () => {
        const { $result: grantTypes, $loading } = $grantTypesRes;

        if ($loading) return;

        return grantTypes ? (
          <PageBreadcrumb
            breadcrumb={
              clientName.value
                ? (routeBreadcrumb) => {
                    routeBreadcrumb.splice(routeBreadcrumb.length - 1, 0, {
                      key: 'clientName',
                      label: clientName.value,
                      path: '',
                    });
                    return routeBreadcrumb;
                  }
                : true
            }
          >
            <Card bordered={false} size="small">
              <Form form={props.form} layout={deviceType.isMobile ? '' : 'inline'}>
                <Form.Item label={i18n.tv('page_client_grant_types.form.grant_type_label', '授权模式')} class="mb-2">
                  <Select
                    v-decorator={[
                      'grantTypes',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv(
                              'page_client_grant_types.form.grant_type_required',
                              '请选择/输入授权模式！',
                            ),
                          },
                        ],
                      },
                    ]}
                    mode="tags"
                    style="min-width: 250px"
                    placeholder={i18n.tv('page_client_grant_types.form.grant_type_placeholder', '请选择/输入授权模式')}
                    options={presetOptions}
                  ></Select>
                </Form.Item>
                <Form.Item class="mb-2">
                  <Button type="primary" loading={adding.value} onClick={() => handleAdd()}>
                    {i18n.tv('page_client_grant_types.form.add_btn_text', '添加')}
                  </Button>
                </Form.Item>
              </Form>
              <Alert
                type="warning"
                banner
                showIcon={false}
                message={i18n.tv(
                  'page_client_grant_types.alert_message',
                  '设置客户端与授权服务器之间的授权模式，以便客户端能够获得访问令牌。',
                )}
              />
              <Table
                class="mt-3"
                size="small"
                bordered={true}
                pagination={false}
                columns={columns.value}
                dataSource={grantTypes}
                locale={{
                  emptyText: i18n.tv('page_client_grant_types.empty_text', '暂无授权模式配置！'),
                }}
              />
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
