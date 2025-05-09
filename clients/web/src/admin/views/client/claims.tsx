import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Button, Form, Alert, Input, Table, Result } from 'ant-design-vue';
import { useRouter } from 'vue2-helpers/vue-router';
import { Modal, message } from '@/components';
import { useI18n, useDeviceType } from '@/composables';
import { PageBreadcrumb } from '@/admin/components';
import { useClientApi } from '@/admin/fetch';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'ant-design-vue/types/table/column';
import type { ClientClaimsModel } from '@/admin/fetch/client';

type ClientClaimProps = {
  form: WrappedFormUtils;
  clientId: string;
};

export default Form.create({})(
  defineComponent({
    name: 'ClientClaim',
    head() {
      return {
        title: this.$tv('page_client_claims.page_title', '声明') as string,
      };
    },
    props: {
      clientId: {
        type: String,
        required: true,
      },
    },
    setup(props: ClientClaimProps) {
      const router = useRouter();
      const i18n = useI18n();
      const deviceType = useDeviceType();
      const clientApi = useClientApi();

      const columns = computed(
        () =>
          [
            {
              key: 'type',
              title: i18n.tv('page_client_claims.table_header.type_label', '声明类型'),
              dataIndex: 'type',
              width: 120,
            },
            {
              key: 'value',
              title: i18n.tv('page_client_claims.table_header.value_label', '值'),
              dataIndex: 'value',
              width: 220,
            },
            {
              key: 'action',
              title: i18n.tv('page_client_claims.table_header.action_label', '操作'),
              customRender: (_: any, record: ClientClaimsModel['claims'][0]) => [
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

      const $claimsRes = createResource((clientId: string) => {
        return clientApi
          .getClaims({
            variables: { clientId },
            catchError: true,
          })
          .then(({ clientClaims }) => {
            if (!clientClaims) return;

            clientName.value = clientClaims.clientName;
            return clientClaims.claims;
          });
      });

      $claimsRes.read(props.clientId);

      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;
          clientApi
            .createClaim({
              variables: {
                clientId: props.clientId,
                model: values,
              },
              loading: () => {
                adding.value = true;
                return () => (adding.value = false);
              },
            })
            .then(({ claim }) => {
              props.form.resetFields();
              $claimsRes.$result!.push(claim);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      const deleting = ref(false);
      const handleDelete = (id: string) => {
        Modal.confirm({
          title: i18n.tv('page_client_claims.delete_confirm.title', '确认'),
          content: i18n.tv('page_client_claims.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
              .deleteClaim({
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
                  $claimsRes.$result!.splice(
                    $claimsRes.$result!.findIndex((item) => item.id === id),
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
        const { $result: claims, $loading } = $claimsRes;

        if ($loading) return;

        return claims ? (
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
                <Form.Item label={i18n.tv('page_client_claims.form.type_label', '声明类型')} class="mb-2">
                  <Input
                    v-decorator={[
                      'type',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_client_claims.form.type_required', '请输入声明类型！'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_client_claims.form.type_placeholder', '请输入声明类型')}
                    style="width:220px"
                  />
                </Form.Item>
                <Form.Item label={i18n.tv('page_client_claims.form.value_label', '值')} class="mb-2">
                  <Input
                    style="width:220px"
                    v-decorator={[
                      'value',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_client_claims.form.value_required', '请输入声明值！'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_client_claims.form.value_placeholder', '请输入声明值')}
                  />
                </Form.Item>
                <Form.Item class="mb-2">
                  <Button type="primary" loading={adding.value} onClick={() => handleAdd()}>
                    {i18n.tv('page_client_claims.form.add_btn_text', '添加')}
                  </Button>
                </Form.Item>
              </Form>
              <Alert
                type="warning"
                banner
                showIcon={false}
                message={i18n.tv('page_client_claims.alert_message', '设置客户端声明（会被添加到 access token 中）。')}
              />
              <Table
                class="mt-3"
                size="small"
                bordered={true}
                pagination={false}
                columns={columns.value}
                dataSource={claims}
                locale={{
                  emptyText: i18n.tv('page_client_claims.empty_text', '暂无资源声明！'),
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
