import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Button, Form, Alert, Select, Table, Result } from 'ant-design-vue';
import { useRouter } from 'vue2-helpers/vue-router';
import { Modal, message } from '@/components';
import { useI18n, useDeviceType } from '@/composables';
import { PageBreadcrumb } from '@/admin/components';
import { useClientApi } from '@/admin/fetch';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'ant-design-vue/types/table/column';
import type { ClientScopesModel } from '@/admin/fetch/client';

type ClientScopeProps = {
  form: WrappedFormUtils;
  clientId: string;
};

const getPresetOptions = () => [
  {
    value: 'openid',
    label: 'openid',
  },
  {
    value: 'profile',
    label: 'profile',
  },
  {
    value: 'offline_access',
    label: 'offline access',
  },
];

export default Form.create({})(
  defineComponent({
    name: 'ClientScope',
    head() {
      return {
        title: this.$tv('page_client_scopes.page_title', '授权范围') as string,
      };
    },
    props: {
      clientId: {
        type: String,
        required: true,
      },
    },
    setup(props: ClientScopeProps) {
      const router = useRouter();
      const i18n = useI18n();
      const deviceType = useDeviceType();
      const clientApi = useClientApi();

      const columns = computed(
        () =>
          [
            {
              key: 'scope',
              title: i18n.tv('page_client_scopes.table_header.scope_label', '授权范围'),
              dataIndex: 'scope',
              width: 200,
            },
            {
              key: 'action',
              title: i18n.tv('page_client_scopes.table_header.action_label', '操作'),
              customRender: (_: any, record: ClientScopesModel['scopes'][0]) => [
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

      const $scopesRes = createResource((clientId: string) => {
        return clientApi
          .getScopes({
            variables: { clientId },
            loading: true,
            catchError: true,
          })
          .then(({ clientScopes }) => {
            if (!clientScopes) return;

            clientName.value = clientScopes.clientName;
            return clientScopes.scopes;
          });
      });

      $scopesRes.read(props.clientId);

      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;
          clientApi
            .createScopes({
              variables: {
                clientId: props.clientId,
                model: values.scopes.map((item: string) => ({ scope: item })),
              },
              loading: (value) => (adding.value = value),
            })
            .then(({ scopes }) => {
              props.form.resetFields();
              $scopesRes.$result!.push(...scopes);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      const deleting = ref(false);
      const handleDelete = (id: string) => {
        Modal.confirm({
          title: i18n.tv('page_client_scopes.delete_confirm.title', '确认'),
          content: i18n.tv('page_client_scopes.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
              .deleteScope({
                variables: { id },
                loading: (value) => (deleting.value = value),
              })
              .then(({ result }) => {
                result &&
                  $scopesRes.$result!.splice(
                    $scopesRes.$result!.findIndex((item) => item.id === id),
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
        const { $result: scopes, $loading } = $scopesRes;

        if ($loading) return;
        return scopes ? (
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
                <Form.Item label={i18n.tv('page_client_scopes.form.scope_label', '授权范围')} class="mb-2">
                  <Select
                    v-decorator={[
                      'scopes',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_client_scopes.form.scope_required', '请选择/输入授权范围！'),
                          },
                        ],
                      },
                    ]}
                    mode="tags"
                    style="width: 250px"
                    placeholder={i18n.tv('page_client_scopes.form.scope_placeholder', '请选择/输入授权范围')}
                    options={presetOptions}
                  ></Select>
                </Form.Item>
                <Form.Item class="mb-2">
                  <Button type="primary" loading={adding.value} onClick={() => handleAdd()}>
                    {i18n.tv('page_client_scopes.form.add_btn_text', '添加')}
                  </Button>
                </Form.Item>
              </Form>
              <Alert
                type="warning"
                banner
                showIcon={false}
                message={i18n.tv(
                  'page_client_scopes.alert_message',
                  '设置客户端可以访问的资源范围，默认情况下客户端没有任何访问资源的权限。',
                )}
              />
              <Table
                class="mt-3"
                size="small"
                bordered={true}
                pagination={false}
                columns={columns.value}
                dataSource={scopes}
                locale={{
                  emptyText: i18n.tv('page_client_scopes.empty_text', '暂无授权范围配置'),
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
