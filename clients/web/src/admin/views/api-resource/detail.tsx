import { defineComponent, ref, nextTick } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { useRouter } from 'vue2-helpers/vue-router';
import { Card, Descriptions, Button, Switch, Space, Tag, Result } from 'ant-design-vue';
import { Modal, message } from '@/components';
import { useI18n } from '@/composables';
import { useApiResourceApi } from '@/admin/fetch';
import { default as ResourceForm } from './components/ApiResourceForm';

export default defineComponent({
  name: 'ApiResourceDetail',
  head() {
    return {
      title: this.$tv('page_api_resource_detail.page_title', 'API资源详情') as string,
    };
  },
  props: {
    id: {
      type: String,
      required: true,
    },
  },
  setup(props, { refs }) {
    const router = useRouter();
    const i18n = useI18n();
    const apiResourceApi = useApiResourceApi();

    const isEditModalVisable = ref(false);

    const $detailRes = createResource((id: string) => {
      return apiResourceApi
        .get({
          variables: { id },
        })
        .then(({ apiResource }) => apiResource);
    });

    // 加载Api资源详情
    $detailRes.read(props.id);

    const editFormObj = ref({});
    // 展示编辑弹窗
    const handleShowEdit = () => {
      isEditModalVisable.value = true;

      nextTick(() => {
        editFormObj.value = $detailRes.$result!;
      });
    };

    const updating = ref(false);
    const handleUpdate = () => {
      (refs['apiResourceForm'] as any)?.validateFields((err, values) => {
        if (err) return;
        apiResourceApi
          .update({
            variables: {
              id: props.id,
              model: values,
            },
            loading: (value) => (updating.value = value),
          })
          .then(() => {
            Object.assign($detailRes.$result!, values);
            isEditModalVisable.value = false;
          })
          .catch((err) => {
            message.error(err.message);
          });
      });
    };

    // 启用状态
    const updateStatusSubmiting = ref(false);
    const handleStatusChanged = (checked: boolean, field: 'enabled' | 'required' | 'showInDiscoveryDocument') => {
      apiResourceApi
        .update({
          variables: {
            id: props.id,
            model: {
              [field]: checked,
            },
          },
          loading: (value) => (updateStatusSubmiting.value = value),
        })
        .then(({ result }) => {
          result && ($detailRes.$result![field] = checked);
        })
        .catch((err) => {
          message.error(err.message);
        });
    };

    return () => {
      const { $result: resource, $loading } = $detailRes;

      if ($loading) return;

      return resource ? (
        <div>
          <Card bordered={false} size="small">
            <Descriptions
              bordered
              size="small"
              column={{ sm: 2, xs: 1 }}
              scopedSlots={{
                title: () => (
                  <div class="d-flex justify-content-space-between">
                    <span>{i18n.tv('page_api_resource_detail.basic_title', '基本信息')}</span>
                    <Space>
                      {!resource.nonEditable && resource.enabled && (
                        <Button type="link" size="small" onClick={() => handleShowEdit()}>
                          {i18n.tv('common.btn_text.edit', '编辑')}
                        </Button>
                      )}
                    </Space>
                  </div>
                ),
              }}
            >
              <Descriptions.Item label={i18n.tv('page_api_resource_detail.name_label', '名称')}>
                {resource.name}
              </Descriptions.Item>
              <Descriptions.Item label={i18n.tv('page_api_resource_detail.display_name_label', '显示名称')}>
                {resource.displayName}
              </Descriptions.Item>
              <Descriptions.Item label={i18n.tv('page_api_resource_detail.status_label', '启用状态')} span={2}>
                {resource.nonEditable ? (
                  <Tag color={resource.enabled ? 'green' : 'red'}>
                    {resource.enabled ? i18n.tv('common.btn_text.yes', '是') : i18n.tv('common.btn_text.no', '否')}
                  </Tag>
                ) : (
                  <Switch
                    key="enabled"
                    disabled={updateStatusSubmiting.value}
                    checked={resource.enabled}
                    onChange={(checked: boolean) => handleStatusChanged(checked, 'enabled')}
                  />
                )}
              </Descriptions.Item>
              <Descriptions.Item label={i18n.tv('page_api_resource_detail.description_label', '描述')} span={2}>
                {resource.description || ''}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Modal
            vModel={isEditModalVisable.value}
            title={i18n.tv('page_api_resource_detail.basic_edit_modal_title', '基本信息修改')}
            scopedSlots={{
              footer: () => (
                <div>
                  <Button disabled={updating.value} onClick={() => (isEditModalVisable.value = false)}>
                    {i18n.tv('page_api_resource_detail.action_btn_text.edit_modal_cancel', '关闭')}
                  </Button>
                  <Button type="primary" class="ml-2" loading={updating.value} onClick={() => handleUpdate()}>
                    {i18n.tv('page_api_resource_detail.action_btn_text.edit_modal_ok', '保存')}
                  </Button>
                </div>
              ),
            }}
            closable={false}
            maskClosable={false}
          >
            <ResourceForm defaultValue={editFormObj.value} ref="apiResourceForm"></ResourceForm>
          </Modal>
        </div>
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
