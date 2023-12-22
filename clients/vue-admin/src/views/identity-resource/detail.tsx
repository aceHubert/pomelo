import { defineComponent, ref, nextTick } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Descriptions, Button, Switch, Space, Spin, Tag } from 'ant-design-vue';
import { Modal, message } from '@/components';
import { useI18n } from '@/hooks';
import { useIdentityResourceApi } from '@/fetch/apis';
import { default as ResourceForm } from './components/IdentityResourceForm';

export default defineComponent({
  name: 'IdentityResourceDetail',
  head() {
    return {
      title: this.$tv('page_identity_resource_detail.page_title', 'Identity资源详情') as string,
    };
  },
  props: {
    id: {
      type: Number,
      required: true,
    },
  },
  setup(props, { refs }) {
    const i18n = useI18n();
    const identityResourceApi = useIdentityResourceApi();

    const isEditModalVisable = ref(false);

    const $detailRes = createResource((id: number) => {
      return identityResourceApi
        .get({
          variables: {
            id,
          },
        })
        .then(({ identityResource }) => identityResource);
    });

    // 加载Identity资源详情
    $detailRes.read(props.id);

    const editFormObj = ref({});
    // 展示编辑弹窗
    const handleShowEdit = () => {
      isEditModalVisable.value = true;

      nextTick(() => {
        editFormObj.value = $detailRes.$result;
      });
    };

    const updating = ref(false);
    const handleUpdate = () => {
      (refs['identityResourceForm'] as any)?.validateFields((err, values) => {
        if (err) return;
        identityResourceApi
          .update({
            variables: {
              id: props.id,
              model: values,
            },
            loading: () => {
              updating.value = true;
              return () => (updating.value = false);
            },
          })
          .then(() => {
            Object.assign($detailRes.$result, values);
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
      identityResourceApi
        .update({
          variables: {
            id: props.id,
            model: {
              [field]: checked,
            },
          },
          loading: () => {
            updateStatusSubmiting.value = true;
            return () => (updateStatusSubmiting.value = false);
          },
        })
        .then(({ result }) => {
          result && ($detailRes.$result[field] = checked);
        })
        .catch((err) => {
          message.error(err.message);
        });
    };

    return () => {
      const { $result: resource, $loading, $error } = $detailRes;

      if ($loading)
        return (
          <Card bordered={false} class="loading text-center">
            <Spin spinning={true} tip={i18n.tv('common.tips.loading_text', '加载中')}></Spin>
          </Card>
        );
      if ($error)
        return (
          <Card bordered={false} class="error--text text-center">
            {$error.message}
          </Card>
        );

      return (
        <div>
          <Card bordered={false} size="small">
            <Descriptions
              bordered
              size="small"
              column={{ sm: 2, xs: 1 }}
              scopedSlots={{
                title: () => (
                  <div class="d-flex justify-content-space-between">
                    <span>{i18n.tv('page_identity_resource_detail.basic_title', '基本信息')}</span>
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
              <Descriptions.Item label={i18n.tv('page_identity_resource_detail.name_label', '名称')}>
                {resource.name}
              </Descriptions.Item>
              <Descriptions.Item label={i18n.tv('page_identity_resource_detail.display_name_label', '显示名称')}>
                {resource.displayName}
              </Descriptions.Item>
              <Descriptions.Item label={i18n.tv('page_identity_resource_detail.required_label', '是否必须')}>
                <Tag color={resource.required ? 'green' : 'red'}>
                  {resource.required ? i18n.tv('common.btn_text.yes', '是') : i18n.tv('common.btn_text.no', '否')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item
                label={i18n.tv('page_identity_resource_detail.show_in_discovery_document_label', '是否显示在发现文档')}
              >
                <Tag color={resource.showInDiscoveryDocument ? 'green' : 'red'}>
                  {resource.showInDiscoveryDocument
                    ? i18n.tv('common.btn_text.yes', '是')
                    : i18n.tv('common.btn_text.no', '否')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={i18n.tv('page_identity_resource_detail.status_label', '启用状态')} span={2}>
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
              <Descriptions.Item label={i18n.tv('page_identity_resource_detail.description_label', '描述')} span={2}>
                {resource.description || ''}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Modal
            vModel={isEditModalVisable.value}
            title={i18n.tv('page_identity_resource_detail.basic_edit_modal_title', '基本信息修改')}
            scopedSlots={{
              footer: () => (
                <div>
                  <Button disabled={updating.value} onClick={() => (isEditModalVisable.value = false)}>
                    {i18n.tv('page_identity_resource_detail.action_btn_text.edit_modal_cancel', '关闭')}
                  </Button>
                  <Button type="primary" class="ml-2" loading={updating.value} onClick={() => handleUpdate()}>
                    {i18n.tv('page_identity_resource_detail.action_btn_text.edit_modal_ok', '保存')}
                  </Button>
                </div>
              ),
            }}
            closable={false}
            maskClosable={false}
          >
            <ResourceForm defaultValue={editFormObj.value} ref="identityResourceForm"></ResourceForm>
          </Modal>
        </div>
      );
    };
  },
});
