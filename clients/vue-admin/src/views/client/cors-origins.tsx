import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Button, Form, Input, Alert, Table } from 'ant-design-vue';
import { useDeviceType } from '@ace-pomelo/shared-client';
import { Modal, message } from '@/components';
import { PageBreadcrumb } from '@/layouts/components';
import { useI18n } from '@/hooks';
import { useClientApi } from '@/fetch/apis';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'ant-design-vue/types/table/column';
import type { ClientCorsOriginsModel } from '@/fetch/apis/client';

type ClientCorsProps = {
  form: WrappedFormUtils;
  clientId: string;
};

export default Form.create({})(
  defineComponent({
    name: 'ClientCorsOrigin',
    head() {
      return {
        title: this.$tv('page_client_cors_origins.page_title', '客户端跨域设置') as string,
      };
    },
    props: {
      clientId: {
        type: String,
        required: true,
      },
    },
    setup(props: ClientCorsProps) {
      const i18n = useI18n();
      const deviceType = useDeviceType();
      const clientApi = useClientApi();

      const columns = computed(
        () =>
          [
            {
              key: 'origin',
              title: i18n.tv('page_client_cors_origins.table_header.cors_origin_label', 'URI'),
              dataIndex: 'origin',
              width: 300,
            },
            {
              key: 'action',
              title: i18n.tv('page_client_cors_origins.table_header.action_label', '操作'),
              customRender: (_: any, record: ClientCorsOriginsModel['corsOrigins'][0]) => [
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

      const $corsOriginsRes = createResource(() => {
        return clientApi
          .getCorsOrigins({
            variables: {
              clientId: props.clientId,
            },
            catchError: true,
          })
          .then(({ clientCorsOrigins }) => {
            clientName.value = clientCorsOrigins.clientName;

            return clientCorsOrigins.corsOrigins;
          });
      });

      $corsOriginsRes.read();

      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;
          clientApi
            .createCorsOrigin({
              variables: {
                clientId: props.clientId,
                model: values,
              },
              loading: () => {
                adding.value = true;
                return () => (adding.value = false);
              },
            })
            .then(({ corsOrigin }) => {
              props.form.resetFields();
              $corsOriginsRes.$result.push(corsOrigin);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      const deleting = ref(false);
      const handleDelete = (id: number) => {
        Modal.confirm({
          title: i18n.tv('page_client_cors_origins.delete_confirm.title', '提示'),
          content: i18n.tv('page_client_cors_origins.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
              .deleteCorsOrigin({
                variables: { id },
                loading: () => {
                  deleting.value = true;
                  return () => (deleting.value = false);
                },
              })
              .then(({ result }) => {
                result &&
                  $corsOriginsRes.$result.splice(
                    $corsOriginsRes.$result.findIndex((item) => item.id === id),
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
            {$corsOriginsRes.$loaded && (
              <Form form={props.form} layout={deviceType.isMobile ? '' : 'inline'}>
                <Form.Item label={i18n.tv('page_client_cors_origins.form.origin_label', '跨域URI')} class="mb-2">
                  <Input
                    style="width: 350px; max-width: 100%;"
                    v-decorator={[
                      'origin',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_client_cors_origins.form.origin_required', '请输入允许跨域的URI'),
                          },
                          {
                            type: 'url',
                            message: i18n.tv('page_client_cors_origins.form.origin_pattern_invalid', 'URI格式错误'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_client_cors_origins.form.origin_placeholder', '请输入允许跨域的URI')}
                  />
                </Form.Item>
                <Form.Item class="mb-2">
                  <Button type="primary" loading={adding.value} onClick={() => handleAdd()}>
                    {i18n.tv('page_client_cors_origins.form.add_btn_text', '添加')}
                  </Button>
                </Form.Item>
              </Form>
            )}
            <Alert
              type="warning"
              banner
              showIcon={false}
              message="If specified, will be used by the default CORS policy service implementations to build a CORS policy for JavaScript clients."
            />
            <Table
              class="mt-3"
              size="small"
              bordered={true}
              pagination={false}
              columns={columns.value}
              dataSource={$corsOriginsRes.$result}
              loading={$corsOriginsRes.$loading}
              locale={{
                emptyText: i18n.tv('page_client_cors_origins.empty_text', '暂无跨域配置！'),
              }}
            />
          </Card>
        </PageBreadcrumb>
      );
    },
  }),
);
