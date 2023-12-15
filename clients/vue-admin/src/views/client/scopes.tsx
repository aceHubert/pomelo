import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Button, Form, Alert, Select, Table } from 'ant-design-vue';
import { useDeviceType } from '@ace-pomelo/shared-client';
import { Modal, message } from '@/components';
import { PageBreadcrumb } from '@/layouts/components';
import { useI18n } from '@/hooks';
import { useClientApi } from '@/fetch/apis';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'ant-design-vue/types/table/column';
import type { ClientScopesModel } from '@/fetch/apis/client';

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
                  {i18n.tv('page_client_scopes.action_delete_btn', '删除')}
                </Button>,
              ],
              fixed: deviceType.isMobile ? 'right' : void 0,
              width: deviceType.isMobile ? 120 : void 0,
            },
          ] as Column[],
      );

      const clientName = ref('');
      const presetOptions = getPresetOptions();

      const $scopesRes = createResource(() => {
        return clientApi
          .getScopes({
            variables: {
              clientId: props.clientId,
            },
            catchError: true,
          })
          .then(({ clientScopes }) => {
            clientName.value = clientScopes.clientName;

            return clientScopes.scopes;
          });
      });

      $scopesRes.read();

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
              loading: () => {
                adding.value = true;
                return () => (adding.value = false);
              },
            })
            .then(({ scopes }) => {
              props.form.resetFields();
              $scopesRes.$result.push(...scopes);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      const deleting = ref(false);
      const handleDelete = (id: number) => {
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
                variables: {
                  id,
                },
                loading: () => {
                  deleting.value = true;
                  return () => (deleting.value = false);
                },
              })
              .then(({ result }) => {
                result &&
                  $scopesRes.$result.splice(
                    $scopesRes.$result.findIndex((item) => item.id === id),
                    1,
                  );
              })
              .catch((err) => {
                message.error(err.message);
              });
          },
        });
      };

      return () => (
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
            {$scopesRes.$loaded && (
              <Form form={props.form} layout={deviceType.isMobile ? '' : 'inline'}>
                <Form.Item label={i18n.tv('page_client_scopes.form.scope_label', '授权范围')} class="mb-2">
                  <Select
                    v-decorator={[
                      'scopes',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_client_scopes.form.scope_required', '请选择/输入授权范围'),
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
                    {i18n.tv('page_client_scopes.form.submit_btn', '添加')}
                  </Button>
                </Form.Item>
              </Form>
            )}
            <Alert
              type="warning"
              banner
              showIcon={false}
              message="By default a client has no access to any resources - specify the allowed resources by adding the corresponding scopes names"
            />
            <Table
              class="mt-3"
              size="small"
              bordered={true}
              pagination={false}
              columns={columns.value}
              dataSource={$scopesRes.$result}
              loading={$scopesRes.$loading}
              locale={{
                emptyText: i18n.tv('page_client_scopes.empty_text', '暂无授权范围配置'),
              }}
            />
          </Card>
        </PageBreadcrumb>
      );
    },
  }),
);
