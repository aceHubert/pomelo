import moment from 'moment';
import { defineComponent, ref } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { useRouter } from 'vue2-helpers/vue-router';
import { Button, Card, List, Result } from 'ant-design-vue';
import { Modal, message } from '@/components';
import { PageBreadcrumb } from '@/layouts/components';
import { useI18n } from '@/hooks';
import { useClientApi } from '@/fetch/apis';

// Types
import type { ClientSecretsModel } from '@/fetch/apis/client';

type ClientSecretProps = {
  clientId: string;
};

export default defineComponent({
  name: 'ClientSecret',
  head() {
    return {
      title: this.$tv('page_client_secrets.page_title', '密匙管理') as string,
    };
  },
  props: {
    clientId: {
      type: String,
      required: true,
    },
  },
  setup(props: ClientSecretProps) {
    const i18n = useI18n();
    const router = useRouter();
    const clientApi = useClientApi();

    const clientName = ref('');

    const $secretsRes = createResource(() => {
      return clientApi
        .getSecrets({
          variables: {
            clientId: props.clientId,
          },
        })
        .then(({ clientSecrets }) => {
          if (!clientSecrets) return;

          clientName.value = clientSecrets.clientName;
          return clientSecrets.secrets;
        });
    });

    // 加载客户端密匙
    $secretsRes.read();

    const deleting = ref(false);
    const handleDelete = (id: number) => {
      Modal.confirm({
        title: i18n.tv('page_client_secrets.delete_confirm.title', '确认'),
        content: i18n.tv('page_client_secrets.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
            .deleteSecret({
              variables: {
                id,
              },
              loading: () => {
                deleting.value = true;
                return () => (deleting.value = false);
              },
            })
            .then(() => {
              // 刷新客户端密匙
              $secretsRes.read();
            })
            .catch((err) => {
              message.error(err.message);
            });
        },
      });
    };

    return () => {
      const { $result: secrets, $loading } = $secretsRes;

      if ($loading) return;

      return secrets ? (
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
            <div class="py-2 text-right" slot="title">
              <Button
                type="primary"
                onClick={() =>
                  router.push({
                    name: 'client-secrets-generate',
                    params: {
                      clientId: props.clientId,
                    },
                  })
                }
              >
                {i18n.tv('page_client_secrets.generate_btn_text', '生成密匙')}
              </Button>
            </div>
            <List
              layout="horizontal"
              dataSource={secrets}
              scopedSlots={{
                renderItem: (item: ClientSecretsModel['secrets'][0]) => (
                  <List.Item>
                    <Button
                      slot="actions"
                      type="link"
                      class="danger--text as-link"
                      onClick={() => handleDelete(item.id)}
                    >
                      {i18n.tv('common.btn_text.delete', '删除')}
                    </Button>
                    <List.Item.Meta
                      title={`${item.description || '-'} (${item.type})`}
                      description={`${i18n.tv('page_client_secrets.expiration', '过期时间')}: ${
                        item.expiresAt
                          ? moment(item.createdAt).add(item.expiresAt, 'seconds').locale(i18n.locale).format('L HH:mm')
                          : i18n.tv('page_client_secrets.never_expired', '永不')
                      }`}
                    ></List.Item.Meta>
                  </List.Item>
                ),
              }}
            ></List>
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
});
