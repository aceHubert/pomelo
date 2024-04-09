import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { useRouter } from 'vue2-helpers/vue-router';
import { Card, Button, Form, Alert, Input, Table, Result } from 'ant-design-vue';
import { Modal, message } from '@/components';
import { PageBreadcrumb } from '@/layouts/components';
import { useI18n, useDeviceType } from '@/hooks';
import { useApiResourceApi } from '@/fetch/apis';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'ant-design-vue/types/table/column';
import type { ApiScopeClaimsModel } from '@/fetch/apis/api-resource';

type ApiScopeClaimProps = {
  form: WrappedFormUtils;
  apiScopeId: string;
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
        type: String,
        required: true,
      },
    },
    setup(props: ApiScopeClaimProps) {
      const router = useRouter();
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

      const apiResourceId = ref<string>();
      const apiScopeName = ref<string>();
      const $scopeClaimsRes = createResource((apiScopeId: string) => {
        return apiResourceApi
          .getScopeClaims({
            variables: { apiScopeId },
            loading: true,
            catchError: true,
          })
          .then(({ apiScopeClaims }) => {
            if (!apiScopeClaims) return;

            apiResourceId.value = apiScopeClaims.apiResourceId;
            apiScopeName.value = apiScopeClaims.displayName || apiScopeClaims.name;
            return apiScopeClaims.scopeClaims;
          });
      });

      $scopeClaimsRes.read(props.apiScopeId);

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
              $scopeClaimsRes.$result!.push(scopeClaim);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      const deleting = ref(false);
      const handleDelete = (id: string) => {
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
                variables: { id },
                loading: () => {
                  deleting.value = true;
                  return () => (deleting.value = false);
                },
              })
              .then(({ result }) => {
                result &&
                  $scopeClaimsRes.$result!.splice(
                    $scopeClaimsRes.$result!.findIndex((item) => item.id === id),
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
        const { $result: scopeClaims, $loading } = $scopeClaimsRes;

        if ($loading) return;

        return scopeClaims ? (
          <PageBreadcrumb
            breadcrumb={
              apiScopeName.value
                ? (routeBreadcrumb) => {
                    routeBreadcrumb = routeBreadcrumb.map((item) => {
                      if (item.key === 'api-scopes' && apiResourceId.value) {
                        const route = router.match({ path: item.path });
                        return route
                          ? {
                              ...item,
                              path: router.resolve({ params: { id: apiResourceId.value } }, route).href,
                            }
                          : item;
                      }
                      return item;
                    });
                    routeBreadcrumb.splice(routeBreadcrumb.length - 1, 0, {
                      key: 'apiScopeName',
                      label: apiScopeName.value ?? '',
                      path: '',
                    });
                    return routeBreadcrumb;
                  }
                : true
            }
          >
            <Card bordered={false} size="small">
              <Form form={props.form} layout={deviceType.isMobile ? 'horizontal' : 'inline'}>
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
              <Alert
                type="warning"
                banner
                showIcon={false}
                message={i18n.tv('page_api_scope_claims.alert_message', `设置API授权范围允许的声明。`)}
              />
              <Table
                class="mt-3"
                size="small"
                bordered={true}
                pagination={false}
                columns={columns.value}
                dataSource={scopeClaims}
                locale={{
                  emptyText: i18n.tv('page_api_scope_claims.empty_text', '暂无授权范围声明'),
                }}
              />
            </Card>
          </PageBreadcrumb>
        ) : (
          <Card bordered={false} size="small">
            <Result status="error" subTitle={i18n.tv('page_api_resource_detail.not_found', 'API资源不存在！')}>
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
