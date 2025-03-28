import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Button, Form, Alert, Table, Result } from 'ant-design-vue';
import { useRouter } from 'vue2-helpers/vue-router';
import { Modal, message } from '@/components';
import { useI18n, useDeviceType } from '@/composables';
import { PageBreadcrumb } from '@/admin/components';
import { useClientApi } from '@/admin/fetch';
import { PropertyForm } from './components/PropertyForm';
import { getPresetProperties } from './utils/constants';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'ant-design-vue/types/table/column';
import type { ClientPropertiesModel } from '@/admin/fetch/client';

type ClientPropertyProps = {
  clientId: string;
};

export default defineComponent({
  name: 'ClientProperty',
  head() {
    return {
      title: this.$tv('page_client_properties.page_title', '自定义属性') as string,
    };
  },
  props: {
    clientId: {
      type: String,
      required: true,
    },
  },
  setup(props: ClientPropertyProps) {
    const router = useRouter();
    const i18n = useI18n();
    const deviceType = useDeviceType();
    const clientApi = useClientApi();

    const columns = computed(
      () =>
        [
          {
            key: 'key',
            title: i18n.tv('page_client_properties.table_header.key_label', '属性名'),
            dataIndex: 'key',
            width: 200,
          },
          {
            key: 'value',
            title: i18n.tv('page_client_properties.table_header.value_label', '值'),
            dataIndex: 'value',
            width: 300,
          },
          {
            key: 'action',
            title: i18n.tv('page_client_properties.table_header.action_label', '操作'),
            customRender: (_: any, record: ClientPropertiesModel['properties'][0]) => [
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
    const presetPrperties = computed(() =>
      getPresetProperties((...args: [string, string]) => i18n.tv(...args) as string),
    );

    const $propertiesRes = createResource((clientId: string) => {
      return clientApi
        .getProperties({
          variables: { clientId },
          loading: true,
          catchError: true,
        })
        .then(({ clientProperties }) => {
          if (!clientProperties) return;

          clientName.value = clientProperties.clientName;
          return clientProperties.properties;
        });
    });

    $propertiesRes.read(props.clientId);

    const adding = ref(false);
    const handleAdd = (form: WrappedFormUtils) => {
      form.validateFields((err, values) => {
        if (err) return;

        clientApi
          .createProperty({
            variables: {
              clientId: props.clientId,
              model: values,
            },
            loading: (value) => (adding.value = value),
          })
          .then(() => {
            $propertiesRes.read(props.clientId);
            form.resetFields();
          })
          .catch((err) => {
            message.error(err.message);
          });
      });
    };

    const deleting = ref(false);
    const handleDelete = (id: string) => {
      Modal.confirm({
        title: i18n.tv('page_client_properties.delete_confirm.title', '提示'),
        content: i18n.tv('page_client_properties.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
          clientApi
            .deleteProperty({
              variables: { id },
              loading: (value) => (deleting.value = value),
            })
            .then(() => {
              $propertiesRes.read(props.clientId);
            })
            .catch((err) => {
              message.error(err.message);
            });
        },
      });
    };

    return () => {
      const { $result: properties, $loading } = $propertiesRes;

      if ($loading) return;

      return properties ? (
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
            <PropertyForm
              layout={deviceType.isMobile ? '' : 'inline'}
              presetPrperties={presetPrperties.value}
              scopedSlots={{
                default: (form: WrappedFormUtils) => (
                  <Form.Item class="mb-2">
                    <Button type="primary" loading={adding.value} onClick={() => handleAdd(form)}>
                      {i18n.tv('page_client_properties.form.add_btn_text', '添加')}
                    </Button>
                  </Form.Item>
                ),
              }}
            ></PropertyForm>
            <Alert
              class="mt-2"
              type="warning"
              banner
              showIcon={false}
              message={i18n.tv('page_client_properties.alert_message', '设置客户端自定义属性。')}
            />
            <Table
              class="mt-3"
              size="small"
              bordered={true}
              pagination={false}
              columns={columns.value}
              dataSource={properties}
              locale={{
                emptyText: i18n.tv('page_client_properties.empty_text', '暂无自定义属性'),
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
});
