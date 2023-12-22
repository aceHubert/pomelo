import { defineComponent, ref, computed } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { Card, Button, Form, Alert, Table } from 'ant-design-vue';
import { useDeviceType } from '@ace-pomelo/shared-client';
import { Modal, message } from '@/components';
import { PageBreadcrumb } from '@/layouts/components';
import { useI18n } from '@/hooks';
import { useApiResourceApi } from '@/fetch/apis';
import { PropertyForm } from '../client/components/PropertyForm';

// Types
import type { WrappedFormUtils } from 'ant-design-vue/types/form/form';
import type { Column } from 'antdv-layout-pro/components/async-table/AsyncTable';
import type { ApiPropertiesModel } from '@/fetch/apis/api-resource';

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
          catchError: true,
        })
        .then(({ apiProperties }) => {
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
            $propertiesRes.$result.unshift(property);
            form.resetFields();
          })
          .catch((err) => {
            message.error(err.message);
          });
      });
    };

    const deleting = ref(false);
    const handleDelete = (id: number) => {
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
                $propertiesRes.$result.splice(
                  $propertiesRes.$result.findIndex((x) => x.id === id),
                  1,
                );
            })
            .catch((err) => {
              message.error(err.message);
            });
        },
      });
    };

    return () => (
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
          {$propertiesRes.$loaded && (
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
          )}
          <Alert
            class="mt-2"
            type="warning"
            banner
            showIcon={false}
            message="Dictionary to hold any custom api-resource-specific values as needed."
          />
          <Table
            class="mt-3"
            size="small"
            bordered={true}
            pagination={false}
            columns={columns.value}
            dataSource={$propertiesRes.$result}
            loading={$propertiesRes.$loading}
            locale={{
              emptyText: i18n.tv('page_api_properties.empty_text', '暂无自定义属性'),
            }}
          />
        </Card>
      </PageBreadcrumb>
    );
  },
});
