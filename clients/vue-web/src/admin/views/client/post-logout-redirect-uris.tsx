import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Button, Form, Input, Alert, Table, Result } from 'ant-design-vue';
import { useRouter } from 'vue2-helpers/vue-router';
import { Modal, message } from '@/components';
import { useI18n, useDeviceType } from '@/composables';
import { PageBreadcrumb } from '@/admin/components';
import { useClientApi } from '@/admin/fetch';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'ant-design-vue/types/table/column';
import type { ClientPostLogoutRedirectUrisModel } from '@/admin/fetch/client';

type ClientLogoutRedirectUriProps = {
  form: WrappedFormUtils;
  clientId: string;
};

export default Form.create({})(
  defineComponent({
    name: 'ClientLogoutRedirectUri',
    head() {
      return {
        title: this.$tv('page_client_post_logout_redirect_uris.page_title', '登出跳转Uri') as string,
      };
    },
    props: {
      clientId: {
        type: String,
        required: true,
      },
    },
    setup(props: ClientLogoutRedirectUriProps) {
      const router = useRouter();
      const i18n = useI18n();
      const deviceType = useDeviceType();
      const clientApi = useClientApi();

      const columns = computed(
        () =>
          [
            {
              key: 'postLogoutRedirectUri',
              title: i18n.tv('page_client_post_logout_redirect_uris.table_header.redirect_uri_label', 'URI'),
              dataIndex: 'postLogoutRedirectUri',
              width: 300,
            },
            {
              key: 'action',
              title: i18n.tv('page_client_post_logout_redirect_uris.table_header.action_label', '操作'),
              customRender: (_: any, record: ClientPostLogoutRedirectUrisModel['postLogoutRedirectUris'][0]) => [
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

      const $redirectUrisRes = createResource((clientId: string) => {
        return clientApi
          .getPostLogoutRedirectUris({
            variables: { clientId },
            loading: true,
            catchError: true,
          })
          .then(({ clientPostLogoutRedirectUris }) => {
            if (!clientPostLogoutRedirectUris) return;

            clientName.value = clientPostLogoutRedirectUris.clientName;
            return clientPostLogoutRedirectUris.postLogoutRedirectUris;
          });
      });

      $redirectUrisRes.read(props.clientId);

      const adding = ref(false);
      const handleAdd = () => {
        props.form.validateFields((err, values) => {
          if (err) return;
          clientApi
            .createPostLogoutRedirectUri({
              variables: {
                clientId: props.clientId,
                model: values,
              },
              loading: () => {
                adding.value = true;
                return () => (adding.value = false);
              },
            })
            .then(({ postLogoutRedirectUri }) => {
              props.form.resetFields();
              $redirectUrisRes.$result!.push(postLogoutRedirectUri);
            })
            .catch((err) => {
              message.error(err.message);
            });
        });
      };

      const deleting = ref(false);
      const handleDelete = (id: string) => {
        Modal.confirm({
          title: i18n.tv('page_client_post_logout_redirect_uris.delete_confirm.title', '提示'),
          content: i18n.tv(
            'page_client_post_logout_redirect_uris.delete_confirm.content',
            '此操作将永久删除该记录, 是否继续?',
          ),
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
              .deletePostLogoutRedirectUri({
                variables: { id },
                loading: () => {
                  deleting.value = true;
                  return () => (deleting.value = false);
                },
              })
              .then(({ result }) => {
                result &&
                  $redirectUrisRes.$result!.splice(
                    $redirectUrisRes.$result!.findIndex((item) => item.id === id),
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
        const { $result: redirectUris, $loading } = $redirectUrisRes;

        if ($loading) return;

        return redirectUris ? (
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
                <Form.Item
                  label={i18n.tv('page_client_post_logout_redirect_uris.form.redirect_uri_label', '登出跳转URI')}
                  class="mb-2"
                >
                  <Input
                    style="width:350px"
                    v-decorator={[
                      'postLogoutRedirectUri',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv(
                              'page_client_post_logout_redirect_uris.form.redirect_uri_required',
                              '请输入允许登出跳转调URI',
                            ),
                          },
                          {
                            type: 'url',
                            message: i18n.tv(
                              'page_client_post_logout_redirect_uris.form.redirect_uri_pattern_invalid',
                              'URI格式错误',
                            ),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv(
                      'page_client_post_logout_redirect_uris.form.redirect_uri_placeholder',
                      '请输入登出跳转URI',
                    )}
                  />
                </Form.Item>
                <Form.Item class="mb-2">
                  <Button type="primary" icon="plus" loading={adding.value} onClick={() => handleAdd()}>
                    {i18n.tv('page_client_post_logout_redirect_uris.form.add_btn_text', '添加')}
                  </Button>
                </Form.Item>
              </Form>
              <Alert
                type="warning"
                banner
                showIcon={false}
                scopedSlots={{
                  message: () => (
                    <span
                      domPropsInnerHTML={i18n.tv(
                        'page_client_post_logout_redirect_uris.alert_message',
                        '设置指定注销后允许重定向到的uri，查看<a target="_blank" href="https://openid.net/specs/openid-connect-session-1_0.html" class="mx-1">OIDC会话管理规范</a>了解更多详细信息。',
                      )}
                    ></span>
                  ),
                }}
              />
              <Table
                class="mt-3"
                size="small"
                bordered={true}
                pagination={false}
                columns={columns.value}
                dataSource={redirectUris}
                locale={{
                  emptyText: i18n.tv('page_client_post_logout_redirect_uris.empty_text', '暂无登出跳转URI配置'),
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
