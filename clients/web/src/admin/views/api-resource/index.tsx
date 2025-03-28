import moment from 'moment';
import { defineComponent, ref, reactive, computed, set } from '@vue/composition-api';
import { Button, Card, Descriptions, Icon, Space, Tag } from 'ant-design-vue';
import { SearchForm, AsyncTable } from 'antdv-layout-pro';
import { Modal, message } from '@/components';
import { useI18n, useDeviceType } from '@/composables';
import { useApiResourceApi } from '@/admin/fetch';
import { default as ResourceForm } from './components/ApiResourceForm';
import classes from './index.module.less';

// Types
import type { Column, DataSourceFn } from 'antdv-layout-pro/components/async-table/AsyncTable';
import type { PagedApiResourceArgs, PagedApiResourceModel } from '@/admin/fetch/api-resource';

export default defineComponent({
  name: 'ApiResources',
  head() {
    return {
      title: this.$tv('page_api_resources.page_title', 'API资源') as string,
    };
  },
  setup(_, { refs }) {
    const i18n = useI18n();
    const deviceType = useDeviceType();
    const apiResourceApi = useApiResourceApi();

    const searchQuery = reactive<PagedApiResourceArgs>({});
    const isAddModalVisable = ref(false);

    const rowCount = ref(0);
    const columns = computed(() => {
      const renderRowInline = (record: PagedApiResourceModel['rows'][0]) => {
        return (
          <Descriptions size="small" column={1} class="mt-2">
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_api_resources.table_header.display_name_label', '显示名称')}
              </span>
              {record.displayName || '-'}
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_api_resources.table_header.status_label', '状态')}
              </span>
              <Tag color={record.enabled ? 'green' : 'red'}>
                {i18n.tv(
                  `page_api_resources.status.${record.enabled ? 'enabled' : 'disabled'}`,
                  record.enabled ? '启用' : '禁用',
                )}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_api_resources.table_header.last_accessed_label', '最后访问于')}
              </span>
              {record.lastAccessed ? moment(record.lastAccessed).locale(i18n.locale).format('L HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {record.enabled
                  ? i18n.tv('page_api_resources.updated_at', '最后修改于')
                  : i18n.tv('page_api_resources.disabled_at', '禁用于')}
              </span>
              {moment(record.updatedAt).locale(i18n.locale).format('L HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_api_resources.table_header.description_label', '描述')}
              </span>
              {record.description || '-'}
            </Descriptions.Item>
          </Descriptions>
        );
      };

      const renderActions = (record: PagedApiResourceModel['rows'][0]) => [
        <router-link
          to={{
            name: 'api-resource-detail',
            params: {
              id: `${record.id}`,
            },
          }}
        >
          {i18n.tv('page_api_resources.action_btn_text.detail', '详情')}
        </router-link>,
        <router-link
          to={{
            name: 'api-scopes',
            params: {
              id: `${record.id}`,
            },
          }}
          class="primary-7--text hover:primary-6--text active:primary-8--text"
        >
          {i18n.tv('page_api_resources.action_btn_text.scopes', '授权范围')}
        </router-link>,
        <router-link
          to={{
            name: 'api-claims',
            params: {
              id: `${record.id}`,
            },
          }}
          class="primary-8--text hover:primary-7--text active:primary-9--text"
        >
          {i18n.tv('page_api_resources.action_btn_text.claims', '声明')}
        </router-link>,
      ];

      return [
        {
          key: 'name',
          title: i18n.tv('page_api_resources.table_header.name_label', '名称'),
          width: deviceType.isDesktop ? 180 : 320,
          customRender: (_: any, record: PagedApiResourceModel['rows'][0]) => {
            return (
              <div class={classes.name}>
                <p class="mb-0">{record.name}</p>
                <Space class={['mt-1', classes.actions]}>{renderActions(record)}</Space>
                {!deviceType.isDesktop && renderRowInline(record)}
              </div>
            );
          },
        },
        deviceType.isDesktop && {
          key: 'displayName',
          title: i18n.tv('page_api_resources.table_header.display_name_label', '显示名称'),
          width: 120,
          dataIndex: 'displayName',
          customRender: (_: any, record: PagedApiResourceModel['rows'][0]) => (
            <div class="text-ellipsis-l2" title={record.displayName}>
              {record.displayName || '-'}
            </div>
          ),
        },
        deviceType.isDesktop && {
          key: 'lastAccessed',
          title: i18n.tv('page_api_resources.table_header.last_accessed_label', '最后访问'),
          width: 120,
          dataIndex: 'lastAccessed',
          customRender: (_: any, record: PagedApiResourceModel['rows'][0]) =>
            record.lastAccessed ? moment(record.lastAccessed).locale(i18n.locale).format('L HH:mm') : '-',
        },
        deviceType.isDesktop && {
          key: 'description',
          title: i18n.tv('page_api_resources.table_header.description_label', '描述'),
          width: 300,
          dataIndex: 'description',
          customRender: (_: any, record: PagedApiResourceModel['rows'][0]) => (
            <div class="text-ellipsis-l2" title={record.description}>
              {record.description || '-'}
            </div>
          ),
        },
        deviceType.isDesktop && {
          key: 'updatedAt',
          dataIndex: 'updatedAt',
          customRender: (_: any, record: PagedApiResourceModel['rows'][0]) => (
            <div>
              <p class="mb-1">
                {record.enabled ? (
                  i18n.tv('page_api_resources.updated_at', '最后修改于')
                ) : (
                  <span class="error--text">
                    <Icon type="minus-circle" class="mr-1" />
                    {i18n.tv('page_api_resources.disabled_at', '禁用于')}
                  </span>
                )}
              </p>
              {moment(record.updatedAt).locale(i18n.locale).format('L HH:mm')}
            </div>
          ),
        },
      ].filter(Boolean) as Column[];
    });

    const loadData: DataSourceFn = ({ page, size }) => {
      return apiResourceApi
        .getPaged({
          variables: {
            ...searchQuery,
            offset: (page - 1) * size,
            limit: size,
          },
        })
        .then(({ apiResources }) => {
          rowCount.value = apiResources.total;

          return apiResources;
        });
    };

    // 新增API资源
    const adding = ref(false);
    const handleAdd = () => {
      (refs['apiResourceForm'] as any)?.validateFields((err, values) => {
        if (err) return;
        apiResourceApi
          .create({
            variables: {
              model: values,
            },
            loading: (value) => (adding.value = value),
          })
          .then(() => {
            isAddModalVisable.value = false;
            (refs['apiResourceForm'] as any)?.resetFields();
            refreshTable(false);
          })
          .catch((err) => {
            message.error(err.message);
          });
      });
    };

    // 刷新table
    function refreshTable(force = true) {
      (refs['table'] as any)?.refresh(force);
    }

    return () => {
      return (
        <Card bordered={false} size="small">
          <SearchForm
            // keywordPlaceholder={
            //   i18n.tv('page_api_resources.search_name_placeholder', '“API资源名称”模糊搜索') as string
            // }
            keywordTypeOptions={[
              {
                label: i18n.tv('page_api_resources.search_options.by_name', '名称') as string,
                value: 'name',
                selected: true,
              },
              {
                label: i18n.tv('page_api_resources.search_options.by_display_name', '显示名称') as string,
                value: 'displyName',
              },
            ]}
            keywordTypeName="keyworkField"
            rowCount={rowCount.value}
            scopedSlots={{
              filter: () => (
                <Button
                  type="primary"
                  icon="plus"
                  onClick={() => {
                    isAddModalVisable.value = true;
                    (refs['apiResourceForm'] as any)?.resetFields();
                  }}
                >
                  {i18n.tv('page_api_resources.action_btn_text.add', '新增资源')}
                </Button>
              ),
            }}
            onSearch={(values) => {
              Object.keys(values).forEach((key) => {
                set(searchQuery, key, values[key]);
              });
              refreshTable();
            }}
          />

          <AsyncTable
            ref="table"
            attrs={{
              rowKey: 'id',
              size: 'small',
              bordered: true,
              scroll: { x: true, y: 0 },
              rowClassName: (record: PagedApiResourceModel['rows'][0]) =>
                `${classes.row} ${classes.rowAlign}` + (record.enabled ? '' : ` ${classes.rowDisabled}`),
            }}
            pageURI
            columns={columns.value}
            dataSource={loadData}
          />

          <Modal
            vModel={isAddModalVisable.value}
            title={i18n.tv('page_api_resources.add_modal_title', '添加API资源')}
            scopedSlots={{
              footer: () => (
                <div>
                  <Button disabled={adding.value} onClick={() => (isAddModalVisable.value = false)}>
                    {i18n.tv('page_api_resources.action_btn_text.add_modal_cancel', '关闭')}
                  </Button>
                  <Button type="primary" class="ml-2" loading={adding.value} onClick={() => handleAdd()}>
                    {i18n.tv('page_api_resources.action_btn_text.add_modal_ok', '保存')}
                  </Button>
                </div>
              ),
            }}
            closable={false}
            maskClosable={false}
          >
            <ResourceForm ref="apiResourceForm"></ResourceForm>
          </Modal>
        </Card>
      );
    };
  },
});
