import moment from 'moment';
import { defineComponent, ref } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { useRouter } from 'vue2-helpers/vue-router';
import { Button, Card, List, Result } from 'ant-design-vue';
import { Modal, message } from '@/components';
import { PageBreadcrumb } from '@/layouts/components';
import { useI18n } from '@/hooks';
import { useApiResourceApi } from '@/fetch/apis';

// Types
import type { ApiSecretsModel } from '@/fetch/apis/api-resource';

type ApiSecretProps = {
  apiResourceId: string;
};

export default defineComponent({
  name: 'ApiSecret',
  head() {
    return {
      title: this.$tv('page_api_secrets.page_title', '密匙管理') as string,
    };
  },
  props: {
    apiResourceId: {
      type: String,
      required: true,
    },
  },
  setup(props: ApiSecretProps) {
    const i18n = useI18n();
    const router = useRouter();
    const apiResourceApi = useApiResourceApi();

    const apiResourceName = ref('');

    const $secretsRes = createResource((apiResourceId: string) => {
      return apiResourceApi
        .getSecrets({
          variables: {
            apiResourceId,
          },
        })
        .then(({ apiSecrets }) => {
          if (!apiSecrets) return;

          apiResourceName.value = apiSecrets.name;
          return apiSecrets.secrets;
        });
    });

    // 加载客户端密匙
    $secretsRes.read(props.apiResourceId);

    const deleting = ref(false);
    const handleDelete = (id: string) => {
      Modal.confirm({
        title: i18n.tv('page_api_secrets.delete_confirm.title', '确认'),
        content: i18n.tv('page_api_secrets.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
            .deleteSecret({
              variables: { id },
              loading: () => {
                deleting.value = true;
                return () => (deleting.value = false);
              },
            })
            .then(() => {
              // 刷新客户端密匙
              $secretsRes.read(props.apiResourceId);
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
            <div class="py-2 text-right" slot="title">
              <Button
                type="primary"
                onClick={() =>
                  router.push({
                    name: 'api-secrets-generate',
                    params: {
                      apiResourceId: String(props.apiResourceId),
                    },
                  })
                }
              >
                {i18n.tv('page_api_secrets.generate_btn_text', '生成密匙')}
              </Button>
            </div>
            <List
              layout="horizontal"
              dataSource={secrets}
              locale={{
                emptyText: i18n.tv('page_api_secrets.empty_text', '暂无资源密匙！'),
              }}
              scopedSlots={{
                renderItem: (item: ApiSecretsModel['secrets'][0]) => (
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
                      description={`${i18n.tv('page_api_secrets.expiration', '过期时间')}: ${
                        item.expiresAt
                          ? moment(item.createdAt).add(item.expiresAt, 'seconds').locale(i18n.locale).format('L HH:mm')
                          : i18n.tv('page_api_secrets.never_expired', '永不')
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
});
