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
import type { ApiScopeClaimsModel } from '@/fetch/apis/api-resource';

type ApiScopeClaimProps = {
  form: WrappedFormUtils;
  apiScopeId: number;
};

export default Form.create({})(
  defineComponent({
    name: 'ApiScopeClaim',
    head() {
      return {
        title: this.$tv('page_api_scope_claims.page_title', '声明') as string,
      };
    },
    props: {
      apiScopeId: {
        type: Number,
        required: true,
      },
    },
    setup(props: ApiScopeClaimProps) {
      const i18n = useI18n();
      const deviceType = useDeviceType();
      const apiResourceApi = useApiResourceApi();

      const columns = computed(
        () =>
          [
            {
              key: 'type',
              title: i18n.tv('page_api_scope_claims.table_header.type_label', '声明类型'),
              dataIndex: 'type',
              width: 200,
            },
            {
              key: 'action',
              title: i18n.tv('page_api_scope_claims.table_header.action_label', '操作'),
              customRender: (_: any, record: ApiScopeClaimsModel['scopeClaims'][0]) => [
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
          ].filter(Boolean) as Column[],
      );

      const apiScopeName = ref('');
      const $scopeClaimsRes = createResource(() => {
        return apiResourceApi
          .getScopeClaims({
            variables: {
              apiScopeId: props.apiScopeId,
            },
            catchError: true,
          })
          .then(({ apiScopeClaims }) => {
            apiScopeName.value = apiScopeClaims.name;

            return apiScopeClaims.scopeClaims;
          });
      });

      $scopeClaimsRes.read();

      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;
          apiResourceApi
            .createScopeClaim({
              variables: {
                apiScopeId: props.apiScopeId,
                model: values,
              },
              loading: () => {
                adding.value = true;
                return () => (adding.value = false);
              },
            })
            .then(({ scopeClaim }) => {
              props.form.resetFields();
              $scopeClaimsRes.$result.push(scopeClaim);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      const deleting = ref(false);
      const handleDelete = (id: number) => {
        Modal.confirm({
          title: i18n.tv('page_api_scope_claims.delete_confirm.title', '确认'),
          content: i18n.tv('page_api_scope_claims.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
              .deleteScopeClaim({
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
                  $scopeClaimsRes.$result.splice(
                    $scopeClaimsRes.$result.findIndex((item) => item.id === id),
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
            apiScopeName.value
              ? (routeBreadcrumb) => {
                  routeBreadcrumb.splice(routeBreadcrumb.length - 1, 0, {
                    key: 'apiScopeName',
                    label: apiScopeName.value,
                    path: '',
                  });
                  return routeBreadcrumb;
                }
              : true
          }
        >
          <Card bordered={false} size="small">
            {$scopeClaimsRes.$loaded && (
              <Form form={props.form} layout={deviceType.isMobile ? '' : 'inline'}>
                <Form.Item label={i18n.tv('page_api_scope_claims.form.type_label', '声明类型')} class="mb-2">
                  <Input
                    v-decorator={[
                      'type',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('page_api_scope_claims.form.type_required', '请输入声明类型'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_api_scope_claims.form.type_placeholder', '请输入声明类型')}
                    style="width:220px"
                  />
                </Form.Item>
                <Form.Item class="mb-2">
                  <Button type="primary" loading={adding.value} onClick={() => handleAdd()}>
                    {i18n.tv('page_api_scope_claims.form.add_btn_text', '添加')}
                  </Button>
                </Form.Item>
              </Form>
            )}
            <Alert
              type="warning"
              banner
              showIcon={false}
              message="Allows settings claims for the api (will be included in the access token)."
            />
            <Table
              class="mt-3"
              size="small"
              bordered={true}
              pagination={false}
              columns={columns.value}
              dataSource={$scopeClaimsRes.$result}
              loading={$scopeClaimsRes.$loading}
              locale={{
                emptyText: i18n.tv('page_api_scope_claims.empty_text', '暂无授权范围声明'),
              }}
            />
          </Card>
        </PageBreadcrumb>
      );
    },
  }),
);
