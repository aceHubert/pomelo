import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { useRouter } from 'vue2-helpers/vue-router';
import { Card, Button, Form, Alert, Input, Table, Result } from 'ant-design-vue';
import { Modal, message } from '@/components';
import { PageBreadcrumb } from '@/layouts/components';
import { useI18n, useDeviceType } from '@/hooks';
import { useIdentityResourceApi } from '@/fetch/apis';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'ant-design-vue/types/table/column';
import type { IdentityClaimsModel } from '@/fetch/apis/identity-resource';

type IdentityClaimProps = {
  form: WrappedFormUtils;
  identityResourceId: string;
};

export default Form.create({})(
  defineComponent({
    name: 'IdentityClaim',
    head() {
      return {
        title: this.$tv('page_identity_resource_claims.page_title', '声明') as string,
      };
    },
    props: {
      identityResourceId: {
        type: Number,
        required: true,
      },
    },
    setup(props: IdentityClaimProps) {
      const router = useRouter();
      const i18n = useI18n();
      const deviceType = useDeviceType();
      const identityResourceApi = useIdentityResourceApi();

      const columns = computed(
        () =>
          [
            {
              key: 'type',
              title: i18n.tv('page_identity_resource_claims.table_header.type_label', '声明类型'),
              dataIndex: 'type',
              width: 200,
            },
            !identityResourceNonEditable.value && {
              key: 'action',
              title: i18n.tv('page_identity_resource_claims.table_header.action_label', '操作'),
              customRender: (_: any, record: IdentityClaimsModel['claims'][0]) => [
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

      const identityResourceName = ref('');
      const identityResourceNonEditable = ref(true);
      const $claimsRes = createResource((identityResourceId: string) => {
        return identityResourceApi
          .getClaims({
            variables: { identityResourceId },
            loading: true,
            catchError: true,
          })
          .then(({ identityClaims }) => {
            if (!identityClaims) return;

            identityResourceName.value = identityClaims.name;
            identityResourceNonEditable.value = identityClaims.nonEditable;

            return identityClaims.claims;
          });
      });

      $claimsRes.read(props.identityResourceId);

      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;
          identityResourceApi
            .createClaim({
              variables: {
                identityResourceId: props.identityResourceId,
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
          title: i18n.tv('page_identity_resource_claims.delete_confirm.title', '确认'),
          content: i18n.tv('page_identity_resource_claims.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
            return identityResourceApi
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
              identityResourceName.value
                ? (routeBreadcrumb) => {
                    routeBreadcrumb.splice(routeBreadcrumb.length - 1, 0, {
                      key: 'identityResourceName',
                      label: identityResourceName.value,
                      path: '',
                    });
                    return routeBreadcrumb;
                  }
                : true
            }
          >
            <Card bordered={false} size="small">
              {!identityResourceNonEditable.value && (
                <Form form={props.form} layout={deviceType.isMobile ? '' : 'inline'}>
                  <Form.Item label={i18n.tv('page_identity_resource_claims.form.type_label', '声明类型')} class="mb-2">
                    <Input
                      v-decorator={[
                        'type',
                        {
                          rules: [
                            {
                              required: true,
                              message: i18n.tv('page_identity_resource_claims.form.type_required', '请输入声明类型'),
                            },
                          ],
                        },
                      ]}
                      placeholder={i18n.tv('page_identity_resource_claims.form.type_placeholder', '请输入声明类型')}
                      style="width:220px"
                    />
                  </Form.Item>
                  <Form.Item class="mb-2">
                    <Button type="primary" loading={adding.value} onClick={() => handleAdd()}>
                      {i18n.tv('page_identity_resource_claims.form.add_btn_text', '添加')}
                    </Button>
                  </Form.Item>
                </Form>
              )}
              <Alert
                type="warning"
                banner
                showIcon={false}
                message={i18n.tv('page_identity_resource_claims.alert_message', '设置资源允许的声明。')}
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
                  emptyText: i18n.tv('page_identity_resource_claims.empty_text', '暂无资源声明！'),
                }}
              />
            </Card>
          </PageBreadcrumb>
        ) : (
          <Card bordered={false} size="small">
            <Result
              status="error"
              subTitle={i18n.tv('page_identity_resource_detail.not_found', 'Identity资源不存在！')}
            >
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
