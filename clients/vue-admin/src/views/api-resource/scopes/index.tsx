import { defineComponent, ref, reactive, computed, set, nextTick } from '@vue/composition-api';
import { createResource } from '@vue-async/resource-manager';
import { useRouter } from 'vue2-helpers/vue-router';
import { Card, Button, Descriptions, Tag, Space, Result } from 'ant-design-vue';
import { SearchForm, AsyncTable } from 'antdv-layout-pro';
import { Modal, message } from '@/components';
import { PageBreadcrumb } from '@/layouts/components';
import { useI18n, useDeviceType } from '@/hooks';
import { useApiResourceApi } from '@/fetch/apis';
import { default as ScopeForm } from '../components/ApiScopeForm';
import classes from '../index.module.less';

// Types
import type { Column, DataSourceFn } from 'antdv-layout-pro/components/async-table/AsyncTable';
import type { PagedApiScopeArgs, PagedApiScopeModel } from '@/fetch/apis/api-resource';

type ApiScopeProps = {
  apiResourceId: string;
};

export default defineComponent({
  name: 'ApiScope',
  head() {
    return {
      title: this.$tv('page_api_scopes.page_title', '授权范围') as string,
    };
  },
  props: {
    apiResourceId: {
      type: String,
      required: true,
    },
  },
  setup(props: ApiScopeProps, { refs }) {
    const router = useRouter();
    const i18n = useI18n();
    const deviceType = useDeviceType();
    const apiResourceApi = useApiResourceApi();

    const searchQuery = reactive<PagedApiScopeArgs>({
      apiResourceId: props.apiResourceId,
    });

    const isFormModalVisable = ref(false);
    const editFormObj = ref<PagedApiScopeModel['rows'][0]>();

    const rowCount = ref(0);
    const columns = computed(() => {
      const renderRowInline = (record: PagedApiScopeModel['rows'][0]) => {
        return (
          <Descriptions size="small" column={1} class="mt-2">
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_api_scopes.table_header.display_name_label', '显示名称')}
              </span>
              {record.displayName || '-'}
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_api_scopes.table_header.required_label', '是否必须')}
              </span>
              <Tag color={record.required ? 'green' : 'red'}>
                {record.required ? i18n.tv('common.btn_text.yes', '是') : i18n.tv('common.btn_text.no', '否')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_api_scopes.table_header.show_in_discovery_document_label', '是否显示在发现文档')}
              </span>
              <Tag color={record.showInDiscoveryDocument ? 'green' : 'red'}>
                {record.showInDiscoveryDocument
                  ? i18n.tv('common.btn_text.yes', '是')
                  : i18n.tv('common.btn_text.no', '否')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_api_scopes.table_header.description_label', '描述')}
              </span>
              {record.description || '-'}
            </Descriptions.Item>
          </Descriptions>
        );
      };

      const renderActions = (record: PagedApiScopeModel['rows'][0]) => [
        <router-link
          to={{
            name: 'api-scope-claims',
            params: {
              id: `${record.id}`,
            },
          }}
        >
          {i18n.tv('page_api_scopes.action_btn_text.claims', '声明')}
        </router-link>,
        <a
          href="javascript:;"
          class="info--text"
          onClick={() => {
            editFormObj.value = record;
            nextTick(() => {
              isFormModalVisable.value = true;
            });
          }}
        >
          {i18n.tv('common.btn_text.edit', '编辑')}
        </a>,
        <a href="javascript:;" class="danger--text" onClick={() => handleDelete(record.id)}>
          {i18n.tv('common.btn_text.delete', '删除')}
        </a>,
      ];

      return [
        {
          key: 'name',
          title: i18n.tv('page_api_scopes.table_header.name_label', '名称'),
          width: deviceType.isDesktop ? 120 : 320,
          customRender: (_: any, record: PagedApiScopeModel['rows'][0]) => {
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
          title: i18n.tv('page_api_scopes.table_header.display_name_label', '显示名称'),
          width: 120,
          dataIndex: 'displayName',
          customRender: (_: any, record: PagedApiScopeModel['rows'][0]) => (
            <div class="text-ellipsis-l2" title={record.displayName}>
              {record.displayName || '-'}
            </div>
          ),
        },
        deviceType.isDesktop && {
          key: 'required',
          title: i18n.tv('page_api_scopes.table_header.required_label', '是否必须'),
          width: 100,
          align: 'center',
          customRender: (_: any, record: PagedApiScopeModel['rows'][0]) => (
            <Tag color={record.required ? 'green' : 'red'}>
              {record.required ? i18n.tv('common.btn_text.yes', '是') : i18n.tv('common.btn_text.no', '否')}
            </Tag>
          ),
        },
        deviceType.isDesktop && {
          key: 'showInDiscoveryDocument',
          title: i18n.tv('page_api_scopes.table_header.show_in_discovery_document_label', '是否显示在发现文档'),
          width: 100,
          align: 'center',
          customRender: (_: any, record: PagedApiScopeModel['rows'][0]) => (
            <Tag color={record.showInDiscoveryDocument ? 'green' : 'red'}>
              {record.showInDiscoveryDocument
                ? i18n.tv('common.btn_text.yes', '是')
                : i18n.tv('common.btn_text.no', '否')}
            </Tag>
          ),
        },
        deviceType.isDesktop && {
          key: 'description',
          title: i18n.tv('page_api_scopes.table_header.description_label', '描述'),
          width: 300,
          dataIndex: 'description',
          customRender: (_: any, record: PagedApiScopeModel['rows'][0]) => (
            <div class="text-ellipsis-l2" title={record.description}>
              {record.description || '-'}
            </div>
          ),
        },
      ].filter(Boolean) as Column[];
    });

    const $apiResourceRes = createResource((apiResourceId: string) =>
      apiResourceApi
        .getBasicInfo({
          variables: { id: apiResourceId },
          loading: true,
          catchError: true,
        })
        .then(({ apiResource }) => apiResource),
    );

    $apiResourceRes.read(props.apiResourceId);

    const loadData: DataSourceFn = ({ page, size }) => {
      return apiResourceApi
        .getPagedScope({
          variables: {
            ...searchQuery,
            offset: (page - 1) * size,
            limit: size,
          },
        })
        .then(({ apiScopes }) => {
          rowCount.value = apiScopes.total;

          return apiScopes;
        });
    };

    const saving = ref(false);
    const handleSave = () => {
      (refs['apiScopeForm'] as any)?.validateFields((err, values) => {
        if (err) return;

        if (editFormObj.value) {
          apiResourceApi
            .updateScope({
              variables: {
                id: editFormObj.value.id,
                model: values,
              },
              loading: () => {
                saving.value = true;
                return () => (saving.value = false);
              },
            })
            .then(() => {
              isFormModalVisable.value = false;
              editFormObj.value = void 0;
              (refs['apiScopeForm'] as any)?.resetFields();
              refreshTable(false);
            })
            .catch((err) => {
              message.error(err.message);
            });
        } else {
          apiResourceApi
            .createScope({
              variables: {
                apiResourceId: props.apiResourceId,
                model: values,
              },
              loading: () => {
                saving.value = true;
                return () => (saving.value = false);
              },
            })
            .then(() => {
              isFormModalVisable.value = false;
              (refs['apiScopeForm'] as any)?.resetFields();
              refreshTable(false);
            })
            .catch((err) => {
              message.error(err.message);
            });
        }
      });
    };

    const deleting = ref(false);
    const handleDelete = (id: string) => {
      Modal.confirm({
        title: i18n.tv('page_api_scopes.delete_confirm.title', '确认'),
        content: i18n.tv('page_api_scopes.delete_confirm.content', '此操作将永久删除该记录, 是否继续?'),
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
            .deleteScope({
              variables: { id },
              loading: () => {
                deleting.value = true;
                return () => (deleting.value = false);
              },
            })
            .then(() => {
              isFormModalVisable.value = false;
              (refs['apiScopeForm'] as any)?.resetFields();
              refreshTable(false);
            })
            .catch((err) => {
              message.error(err.message);
            });
        },
      });
    };

    // 刷新table
    function refreshTable(force = true) {
      (refs['table'] as any)?.refresh(force);
    }

    return () => {
      const { $result: apiResource, $loading } = $apiResourceRes;

      if ($loading) return;

      return apiResource ? (
        <PageBreadcrumb
          breadcrumb={
            apiResource.displayName || apiResource.name
              ? (routeBreadcrumb) => {
                  routeBreadcrumb.splice(routeBreadcrumb.length - 1, 0, {
                    key: 'apiResourceName',
                    label: apiResource.displayName || apiResource.name,
                    path: '',
                  });
                  return routeBreadcrumb;
                }
              : true
          }
        >
          <Card bordered={false} size="small">
            <SearchForm
              // keywordPlaceholder={
              //   i18n.tv('page_api_scopes.search_name_placeholder', '“API资源名称”模糊搜索') as string
              // }
              keywordTypeOptions={[
                {
                  label: i18n.tv('page_api_scopes.search_options.by_name', '名称') as string,
                  value: 'name',
                  selected: true,
                },
                {
                  label: i18n.tv('page_api_scopes.search_options.by_display_name', '显示名称') as string,
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
                      isFormModalVisable.value = true;
                      (refs['apiScopeForm'] as any)?.resetFields();
                    }}
                  >
                    {i18n.tv('page_api_scopes.action_btn_text.add', '新增资源')}
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
                rowClassName: () => `${classes.row} ${classes.rowAlign}`,
              }}
              pageURI
              columns={columns.value}
              dataSource={loadData}
            />

            <Modal
              vModel={isFormModalVisable.value}
              title={
                editFormObj.value
                  ? i18n.tv('page_api_scopes.edit_modal_title', '编辑API授权范围')
                  : i18n.tv('page_api_scopes.add_modal_title', '添加API授权范围')
              }
              afterClose={() => {
                editFormObj.value = void 0;
              }}
              scopedSlots={{
                footer: () => (
                  <div>
                    <Button disabled={saving.value} onClick={() => (isFormModalVisable.value = false)}>
                      {i18n.tv('page_api_scopes.action_btn_text.modal_cancel', '关闭')}
                    </Button>
                    <Button type="primary" class="ml-2" loading={saving.value} onClick={() => handleSave()}>
                      {i18n.tv('page_api_scopes.action_btn_text.modal_ok', '保存')}
                    </Button>
                  </div>
                ),
              }}
              closable={false}
              maskClosable={false}
              destroyOnClose
            >
              <ScopeForm ref="apiScopeForm" defaultValue={editFormObj.value}></ScopeForm>
            </Modal>
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
