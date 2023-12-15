import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Button, Form, Alert, Input, Table } from 'ant-design-vue';
import { useDeviceType } from '@ace-pomelo/shared-client';
import { Modal, message } from '@/components';
import { PageBreadcrumb } from '@/layouts/components';
import { useI18n } from '@/hooks';
import { useApiResourceApi } from '@/fetch/apis';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'ant-design-vue/types/table/column';
import type { ApiClaimsModel } from '@/fetch/apis/api-resource';

type ApiClaimProps = {
  form: WrappedFormUtils;
  apiResourceId: number;
};

export default Form.create({})(
  defineComponent({
    name: 'ApiClaim',
    head() {
      return {
        title: this.$tv('page_api_resource_claims.page_title', '声明') as string,
      };
    },
    props: {
      apiResourceId: {
        type: Number,
        required: true,
      },
    },
    setup(props: ApiClaimProps) {
      const i18n = useI18n();
      const deviceType = useDeviceType();
      const apiResourceApi = useApiResourceApi();

      const columns = computed(
        () =>
          [
            {
              key: 'type',
              title: i18n.tv('page_api_resource_claims.table_header.type_label', '声明类型'),
              dataIndex: 'type',
              width: 200,
            },
            !apiResourceNonEditable.value && {
              key: 'action',
              title: i18n.tv('page_api_resource_claims.table_header.action_label', '操作'),
              customRender: (_: any, record: ApiClaimsModel['claims'][0]) => [
                <Button
                  type="link"
                  size="small"
                  class="px-0 danger--text as-link"
                  onClick={() => handleDelete(record.id)}
                >
                  {i18n.tv('page_api_resource_claims.action_delete_btn', '删除')}
                </Button>,
              ],
              fixed: deviceType.isMobile ? 'right' : void 0,
              width: deviceType.isMobile ? 120 : void 0,
            },
          ].filter(Boolean) as Column[],
      );

      const apiResourceName = ref('');
      const apiResourceNonEditable = ref(true);
      const $claimsRes = createResource(() => {
        return apiResourceApi
          .getClaims({
            variables: {
              apiResourceId: props.apiResourceId,
            },
            catchError: true,
          })
          .then(({ apiClaims }) => {
            apiResourceName.value = apiClaims.name;
            apiResourceNonEditable.value = apiClaims.nonEditable;

            return apiClaims.claims;
          });
      });

      $claimsRes.read();

      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;
          apiResourceApi
            .createClaim({
              variables: {
                apiResourceId: props.apiResourceId,
                model: values,
              },
              loading: () => {
                adding.value = true;
                return () => (adding.value = false);
              },
            })
            .then(({ claim }) => {
              props.form.resetFields();
              $claimsRes.$result.push(claim);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      const deleting = ref(false);
      const handleDelete = (id: number) => {
        Modal.confirm({
          title: i18n.tv('page_api_resource_claims.delete_confirm.title', '确认'),
          content: i18n.tv('page_api_resource_claims.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
            return apiResourceApi
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
                  $claimsRes.$result.splice(
                    $claimsRes.$result.findIndex((item) => item.id === id),
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
            {!apiResourceNonEditable.value && $claimsRes.$loaded && (
              <Form form={props.form} layout={deviceType.isMobile ? '' : 'inline'}>
                <Form.Item label={i18n.tv('page_api_resource_claims.form.type_label', '声明类型')} class="mb-2">
                  <Input
                    v-decorator={[
                      'type',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_api_resource_claims.form.type_required', '请输入声明类型'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_api_resource_claims.form.type_placeholder', '请输入声明类型')}
                    style="width:220px"
                  />
                </Form.Item>
                <Form.Item class="mb-2">
                  <Button type="primary" loading={adding.value} onClick={() => handleAdd()}>
                    {i18n.tv('page_api_resource_claims.form.add_btn_text', '添加')}
                  </Button>
                </Form.Item>
              </Form>
            )}
            <Alert
              type="warning"
              banner
              showIcon={false}
              message="Allows settings claims for the client (will be included in the access token)."
            />
            <Table
              class="mt-3"
              size="small"
              bordered={true}
              pagination={false}
              columns={columns.value}
              dataSource={$claimsRes.$result}
              loading={$claimsRes.$loading}
              locale={{
                emptyText: i18n.tv('page_api_resource_claims.empty_text', '暂无资源声明'),
              }}
            />
          </Card>
        </PageBreadcrumb>
      );
    },
  }),
);
