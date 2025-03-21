import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { useRouter } from 'vue2-helpers/vue-router';
import { Card, Button, Form, Alert, Table, Result } from 'ant-design-vue';
import { Modal, message } from '@/components';
import { useI18n, useDeviceType } from '@/composables';
import { PageBreadcrumb } from '@/admin/components';
import { useApiResourceApi } from '@/admin/fetch';
import { PropertyForm } from '../client/components/PropertyForm';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'antdv-layout-pro/components/async-table/AsyncTable';
import type { ApiPropertiesModel } from '@/admin/fetch/api-resource';

type ApiPropertyProps = {
  apiResourceId: string;
};

export default defineComponent({
  name: 'ApiProperty',
  head() {
    return {
      title: this.$tv('page_api_properties.page_title', '自定义属性') as string,
    };
  },
  props: {
    apiResourceId: {
      type: Number,
      required: true,
    },
  },
  setup(props: ApiPropertyProps) {
    const router = useRouter();
    const i18n = useI18n();
    const deviceType = useDeviceType();
    const apiResourceApi = useApiResourceApi();

    const columns = computed(
      () =>
        [
          {
            key: 'key',
            title: i18n.tv('page_api_properties.table_header.key_label', '属性名'),
            dataIndex: 'key',
            width: 200,
          },
          {
            key: 'value',
            title: i18n.tv('page_api_properties.table_header.value_label', '值'),
            dataIndex: 'value',
            width: 300,
          },
          {
            key: 'action',
            title: i18n.tv('page_api_properties.table_header.action_label', '操作'),
            customRender: (_: any, record: ApiPropertiesModel['properties'][0]) => [
              <Button
                type="link"
                size="small"
                class="px-0 danger--text as-link"
                onClick={() => handleDelete(record.id!)}
              >
                {i18n.tv('common.btn_text.delete', '删除')}
              </Button>,
            ],
            fixed: deviceType.isMobile ? 'right' : void 0,
            width: deviceType.isMobile ? 120 : void 0,
          },
        ] as Column[],
    );

    const apiResourceName = ref('');

    const $propertiesRes = createResource(() => {
      return apiResourceApi
        .getProperties({
          variables: {
            apiResourceId: props.apiResourceId,
          },
          loading: true,
          catchError: true,
        })
        .then(({ apiProperties }) => {
          if (!apiProperties) return;

          apiResourceName.value = apiProperties.name;
          return apiProperties.properties;
        });
    });

    $propertiesRes.read();

    const adding = ref(false);
    const handleAdd = (form: WrappedFormUtils) => {
      form.validateFields({ first: true }, (err, values) => {
        if (err) return;

        apiResourceApi
          .createProperty({
            variables: {
              apiResourceId: props.apiResourceId,
              model: values,
            },
            loading: () => {
              adding.value = true;
              return () => (adding.value = false);
            },
          })
          .then(({ property }) => {
            $propertiesRes.$result!.unshift(property);
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
        title: i18n.tv('page_api_properties.delete_confirm.title', '提示'),
        content: i18n.tv('page_api_properties.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
          apiResourceApi
            .deleteProperty({
              variables: { id },
              loading: () => {
                deleting.value = true;
                return () => (deleting.value = false);
              },
            })
            .then(({ result }) => {
              result &&
                $propertiesRes.$result!.splice(
                  $propertiesRes.$result!.findIndex((x) => x.id === id),
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
      const { $result: properties, $loading } = $propertiesRes;

      if ($loading) return;

      return properties ? (
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
            <PropertyForm
              layout={deviceType.isMobile ? '' : 'inline'}
              scopedSlots={{
                default: (form: WrappedFormUtils) => (
                  <Form.Item class="mb-2">
                    <Button type="primary" loading={adding.value} onClick={() => handleAdd(form)}>
                      {i18n.tv('page_api_properties.form.add_btn_text', '添加')}
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
              message={i18n.tv('page_api_resource_properties.alert_message', '设置API资源自定义属性。')}
            />
            <Table
              class="mt-3"
              size="small"
              bordered={true}
              pagination={false}
              columns={columns.value}
              dataSource={properties}
              locale={{
                emptyText: i18n.tv('page_api_properties.empty_text', '暂无自定义属性'),
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
});
