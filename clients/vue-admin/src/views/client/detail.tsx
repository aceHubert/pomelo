import { upperFirst } from 'lodash-es';
import { defineComponent, ref, nextTick } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Form, Descriptions, Input, Button, Switch, Select, Space, Spin, Tag } from 'ant-design-vue';
import { Modal, message } from '@/components';
import { useI18n } from '@/hooks';
import { useClientApi } from '@/fetch/apis';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
type ClientDetailProps = {
  form: WrappedFormUtils;
  clientId: string;
};

export default Form.create({})(
  defineComponent({
    name: 'ClientDetail',
    head() {
      return {
        title: this.$tv('page_client_detail.page_title', '客户端详情') as string,
      };
    },
    props: {
      clientId: {
        type: String,
        required: true,
      },
    },
    setup(props: ClientDetailProps) {
      const i18n = useI18n();
      const clientApi = useClientApi();

      const isEditModalVisable = ref(false);

      const $detailRes = createResource(() => {
        return clientApi
          .get({
            variables: {
              clientId: props.clientId,
            },
          })
          .then(({ client }) => client);
      });

      // 加载客户端详情
      $detailRes.read();

      // 展示编辑弹窗
      const handleShowEdit = () => {
        isEditModalVisable.value = true;

        nextTick(() => {
          props.form.setFieldsValue($detailRes.$result);
        });
      };

      const updateClientSubmiting = ref(false);
      const handleUpdate = () => {
        props.form.validateFields((err, values) => {
          if (err) return;

          delete values.clientId;

          clientApi
            .update({
              variables: {
                clientId: props.clientId,
                model: values,
              },
              loading: () => {
                updateClientSubmiting.value = true;
                return () => (updateClientSubmiting.value = false);
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

      const updateStatusSubmiting = ref(false);
      const handleStatusChanged = (checked: boolean) => {
        clientApi
          .update({
            variables: {
              clientId: props.clientId,
              model: {
                enabled: checked,
              },
            },
            loading: () => {
              updateStatusSubmiting.value = true;
              return () => (updateStatusSubmiting.value = false);
            },
          })
          .then(({ result }) => {
            result && ($detailRes.$result.enabled = checked);
          })
          .catch((err) => {
            message.error(err.message);
          });
      };
      return () => {
        const { $result: client, $loading, $error } = $detailRes;

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
                      <span>{i18n.tv('page_client_detail.basic_title', '基本信息')}</span>
                      <Space>
                        {client.enabled && (
                          <Button type="link" size="small" onClick={() => handleShowEdit()}>
                            {i18n.tv('page_client_detail.edit_btn', '编辑')}
                          </Button>
                        )}
                      </Space>
                    </div>
                  ),
                }}
              >
                <Descriptions.Item label={i18n.tv('page_client_detail.form.client_name_label', '客户端名称')}>
                  {client.clientName}
                </Descriptions.Item>
                <Descriptions.Item label={i18n.tv('page_client_detail.form.client_id_label', '客户端ID')}>
                  {client.clientId}
                </Descriptions.Item>
                <Descriptions.Item label={i18n.tv('page_client_detail.form.application_type_label', '客户端类型')}>
                  <Tag color={client.applicationType === 'native' ? 'cyan' : 'green'}>
                    {upperFirst(client.applicationType || 'web')}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label={i18n.tv('page_client_detail.form.disabled_label', '启用状态')}>
                  {/* TODO: 修改服务端状态 */}
                  <Switch
                    disabled={updateStatusSubmiting.value}
                    checked={client.enabled}
                    onChange={(checked: boolean) => handleStatusChanged(checked)}
                  />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Modal
              vModel={isEditModalVisable.value}
              title={i18n.tv('clients_detail.basic_edit_modal_title', '基本信息修改')}
              closable={false}
              scopedSlots={{
                footer: () => (
                  <div>
                    <Button disabled={updateClientSubmiting.value} onClick={() => (isEditModalVisable.value = false)}>
                      {i18n.tv('page_client_detail.form.cancel_btn', '关闭')}
                    </Button>
                    <Button
                      type="primary"
                      class="ml-2"
                      loading={updateClientSubmiting.value}
                      onClick={() => handleUpdate()}
                    >
                      {i18n.tv('page_client_detail.form.ok_btn', '保存')}
                    </Button>
                  </div>
                ),
              }}
            >
              <Form form={props.form} labelCol={{ span: 5 }} wrapperCol={{ span: 15 }}>
                <Form.Item label={i18n.tv('page_client_detail.form.name_label', '客户端ID')}>
                  <Input v-decorator={['clientId']} disabled />
                </Form.Item>
                <Form.Item label={i18n.tv('page_client_detail.form.name_label', '客户端名称')}>
                  <Input
                    v-decorator={[
                      'clientName',
                      {
                        rules: [
                          {
                            required: true,
                            message: i18n.tv('client.form.client_name_required', '请输入客户端名称'),
                          },
                        ],
                      },
                    ]}
                    placeholder={i18n.tv('page_client_detail.form.name_placeholder', '请输入')}
                  />
                </Form.Item>
                <Form.Item label={i18n.tv('page_client_detail.form.application_type_label', '客户端类型')}>
                  <Select
                    v-decorator={['applicationType']}
                    placeholder={i18n.tv('page_client_detail.form.application_type_placeholder', '请输入客户端类型')}
                    options={[
                      { label: 'Web', value: 'web' },
                      { label: 'Native', value: 'native' },
                    ]}
                  ></Select>
                </Form.Item>
              </Form>
            </Modal>
          </div>
        );
      };
    },
  }),
);
