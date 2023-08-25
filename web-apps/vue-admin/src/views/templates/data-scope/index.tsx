import { lowerCase } from 'lodash-es';
import moment from 'moment';
import { defineComponent, ref, reactive, computed, watch } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { TreeSelect, Button, Card, Tag, Popconfirm } from 'ant-design-vue';
import { SearchForm, AsyncTable } from 'antdv-layout-pro';
import { useTemplateApi, TemplateStatus } from '@/fetch/graphql';
import { useI18n, useUserManager } from '@/hooks';
import { useDeviceMixin, useLocationMixin } from '@/mixins';
import { useTemplateMixin } from '../mixins/index.mixin';
import { TemplateType } from './constants';

// Types
import type { DataSourceFn, Column } from 'antdv-layout-pro/components/async-table/AsyncTable';
import type { PagedTemplateQuery, PagedTemplateItem } from '@/fetch/graphql';
import type { User } from '@/auth/user-manager';
import type { BulkActions } from '../mixins/index.mixin';

enum RouteQueryKey {
  CategoryId = 'cid',
  IsSelf = 'self',
}

export default defineComponent({
  name: 'DataScopeIndex',
  head() {
    return {
      title: this.$tv('page_templates.data_scopes.page_title', '表单列表') as string,
    };
  },
  props: [],
  setup(_props, { refs }) {
    const router = useRouter();
    const route = useRoute();
    const i18n = useI18n();
    const deviceMixin = useDeviceMixin();
    const locationMixin = useLocationMixin();
    const userManager = useUserManager();
    const templateApi = useTemplateApi();
    const templateMixin = useTemplateMixin();

    const currentUser = ref<User>();

    // 从 URI 获取搜索参数
    const searchQuery = computed<
      Omit<PagedTemplateQuery, 'offset' | 'limit' | 'queryStatusCounts' | 'querySelfCounts'>
    >(() => {
      return {
        ...templateMixin.searchQuery,
        type: TemplateType,
        author: (route.query[RouteQueryKey.IsSelf] as string) === 'true' ? currentUser.value?.profile.sub : void 0,
        categoryId: Number((route.query[RouteQueryKey.CategoryId] as string) || '') || void 0,
      };
    });

    const dataScopeTemplates = reactive({
      loading: false,
      rowCount: 0,
      selectedRowKeys: [] as Array<string | number>,
      queryStatusCounts: true, // query 时是否查询状态数量
      querySelfCounts: true, // query 时是否查询我的数量
    });

    // 加载数据
    const loadData = async ({ page, size }: Parameters<DataSourceFn>[0]) => {
      // 加载数据前确保用户 id 已存在
      if (!currentUser.value) {
        const user = await userManager.getUser();
        currentUser.value = user || void 0;
      }

      return templateApi
        .getPaged({
          variables: {
            ...searchQuery.value,
            offset: size * (page - 1),
            limit: size,
            queryStatusCounts: dataScopeTemplates.queryStatusCounts,
            querySelfCounts: dataScopeTemplates.querySelfCounts,
          },
          catchError: true,
        })
        .then(({ templates, statusCounts, selfCounts }) => {
          dataScopeTemplates.rowCount = templates.total;
          if (dataScopeTemplates.queryStatusCounts) {
            templateMixin.statusCount.value = statusCounts!;
            dataScopeTemplates.queryStatusCounts = false;
          }
          if (dataScopeTemplates.querySelfCounts) {
            templateMixin.selfCount.value = selfCounts!;
            dataScopeTemplates.querySelfCounts = false;
          }
          return templates;
        });
    };

    // 刷新表格数据
    const refreshTable = () => {
      (refs['table'] as any)?.refresh();
    };

    // 行选择
    const handleSelectChange = (selectedRowKeys: Array<string | number>) => {
      dataScopeTemplates.selectedRowKeys = selectedRowKeys;
    };

    // 参数变更刷新table
    watch(searchQuery, refreshTable);

    // 加载分类树
    templateMixin.category.selectKey = Number((route.query[RouteQueryKey.CategoryId] as string) || '') || '';
    templateMixin.getCategories({}).then((treeData) => {
      templateMixin.category.treeData = treeData;
    });

    const columns = computed(() => {
      const renderRowInline = (record: PagedTemplateItem) => {
        return (
          <div>
            <p class="mb-2">{record.title} </p>
            {!searchQuery.value.status && (
              <p class="mb-1">
                <span class="text--secondary">{i18n.tv('page_templates.status_label', '状态')}：</span>
                <Tag color={templateMixin.statusTagColors[record.status]}>
                  {i18n.tv(`page_templates.status_options.${lowerCase(record.status)}`, record.status)}
                </Tag>
              </p>
            )}
            <p class="mb-1">
              <span class="text--secondary">{i18n.tv('page_templates.category_label', '分类')}：</span>
              {record.categories.map((category) => (
                <router-link to={{ name: 'taxonomy', params: { id: category.id } }} class="mr-2">
                  {category.name}
                </router-link>
              ))}
            </p>
            <p class="mb-0">
              <span class="text--secondary">{i18n.tv('page_templates.create_at_label', '创建时间')}：</span>
              {moment(record.createdAt).locale(i18n.locale).format('L')}
            </p>
          </div>
        );
      };

      const renderActions = (record: PagedTemplateItem & { deleting?: boolean; restoring?: boolean }) => {
        return record.status !== TemplateStatus.Trash
          ? [
              <Button
                type="link"
                size="small"
                onClick={() => router.push({ name: 'data-scope-edit', params: { id: record.id } })}
              >
                {i18n.tv('common.btn_text.edit', '编辑')}
              </Button>,
              <Button
                type="link"
                size="small"
                class="danger--text"
                loading={record.deleting}
                onClick={() =>
                  templateMixin.handleDelete(record).then((result) => {
                    if (result) {
                      dataScopeTemplates.queryStatusCounts = true; // 更新状态数量
                      dataScopeTemplates.querySelfCounts = true; // 更新我的数量
                      refreshTable();
                    }
                  })
                }
              >
                {record.deleting
                  ? i18n.tv('common.btn_text.in_operation', '操作中')
                  : i18n.tv('page_templates.btn_text.move_to_trush', '放入回收站')}
              </Button>,
            ]
          : [
              <Button
                type="link"
                size="small"
                loading={record.deleting}
                onClick={() =>
                  templateMixin.handleRestore(record).then((result) => {
                    if (result) {
                      dataScopeTemplates.queryStatusCounts = true; // 更新状态数量
                      dataScopeTemplates.querySelfCounts = true; // 更新我的数量
                      refreshTable();
                    }
                  })
                }
              >
                {record.restoring
                  ? i18n.tv('common.btn_text.in_operation', '操作中')
                  : i18n.tv('page_templates.btn_text.restore', '重置')}
              </Button>,
              <Popconfirm
                title={i18n.tv('page_templates.data_scopes.tips.delete_confirm', '确认删除这条数据范围？')}
                okText={i18n.tv('common.btn_text.ok', '是')}
                cancelText={i18n.tv('common.btn_text.no', '否')}
                onConfirm={() =>
                  templateMixin.handleDelete(record).then((result) => {
                    if (result) {
                      dataScopeTemplates.queryStatusCounts = true; // 更新状态数量
                      dataScopeTemplates.querySelfCounts = true; // 更新我的数量
                      refreshTable();
                    }
                  })
                }
              >
                <Button type="link" size="small" class="error--text" loading={record.deleting}>
                  {record.deleting
                    ? i18n.tv('common.btn_text.in_operation', '操作中')
                    : i18n.tv('common.btn_text.delete', '删除')}
                </Button>
              </Popconfirm>,
            ];
      };
      return [
        // { title: 'id', dataIndex: 'id' },
        {
          title: i18n.tv('page_templates.title_label', '标题'),
          dataIndex: 'title',
          customRender: (_: any, record: PagedTemplateItem) =>
            deviceMixin.isDesktop ? (
              record.title
            ) : deviceMixin.isTablet ? (
              renderRowInline(record)
            ) : (
              <div>
                {renderRowInline(record)}
                <div class="mt-2 mx-n2">{renderActions(record)}</div>
              </div>
            ),
        },
        deviceMixin.isDesktop && {
          title: i18n.tv('page_templates.category_label', '分类'),
          dataIndex: 'categories',
          width: 220,
          customRender: (_: any, record: PagedTemplateItem) =>
            record.categories.map((category) => (
              <router-link to={{ name: 'taxonomy', params: { id: category.id } }} class="mr-2">
                {category.name}
              </router-link>
            )),
        },
        deviceMixin.isDesktop &&
          !searchQuery.value.status && {
            title: i18n.tv('page_templates.status_label', '状态'),
            dataIndex: 'status',
            align: 'center',
            width: 100,
            customRender: (_: any, record: PagedTemplateItem) => (
              <Tag color={templateMixin.statusTagColors[record.status]}>
                {i18n.tv(`page_templates.status_options.${lowerCase(record.status)}`, record.status)}
              </Tag>
            ),
          },
        deviceMixin.isDesktop && {
          title: i18n.tv('page_templates.create_at_label', '创建时间'),
          dataIndex: 'createdAt',
          align: 'center',
          width: 160,
          customRender: (_: any, record: PagedTemplateItem) => moment(record.createdAt).locale(i18n.locale).format('L'),
        },
        (deviceMixin.isDesktop || deviceMixin.isTablet) && {
          title: '',
          width: 220,
          customRender: (_: any, record: PagedTemplateItem & { deleting?: boolean; restoring?: boolean }) =>
            renderActions(record),
        },
      ].filter(Boolean) as Column[];
    });

    return () => (
      <Card bordered={false} size={deviceMixin.isMobile ? 'small' : 'default'}>
        <SearchForm
          keywordPlaceholder={
            i18n.tv('common.placeholder.search', '"标题"模糊搜索', {
              field: i18n.tv('page_templates.title_label', '标题'),
            }) as string
          }
          rowCount={dataScopeTemplates.rowCount}
          statusOptions={templateMixin.statusOptions.value}
          bulkAcitonOptions={templateMixin.bulkActionOptions.value}
          bulkApplying={templateMixin.bulkApplying.value}
          onBulkApply={(action: BulkActions) =>
            templateMixin.handleBulkApply(action, dataScopeTemplates.selectedRowKeys).then((result) => {
              if (result) {
                dataScopeTemplates.selectedRowKeys = []; // 选中的key清除
                dataScopeTemplates.queryStatusCounts = true; // 更新状态数量
                dataScopeTemplates.querySelfCounts = true; // 更新我的数量
                refreshTable();
              }
            })
          }
        >
          <template slot="filter">
            <TreeSelect
              value={templateMixin.category.selectKey}
              treeData={templateMixin.categoryTreeData.value}
              showSearch
              treeDataSimpleMode
              treeNodeFilterProp="label"
              dropdownStyle={{ maxHeight: '400px', overflow: 'auto' }}
              style="width:120px"
              placeholder={i18n.tv('page_templates.category_placeholder', '请选择分类')}
              searchPlaceholder={i18n.tv('page_templates.category_search_placeholder', '请输入查询分类')}
              onChange={(value: string) =>
                locationMixin.updateRouteQuery({ [RouteQueryKey.CategoryId]: value }).then(() => {
                  templateMixin.category.selectKey = value;
                })
              }
            ></TreeSelect>
          </template>
        </SearchForm>
        <AsyncTable
          ref="table"
          attrs={{
            rowKey: 'id',
            size: 'small',
            scroll: { x: true, y: 0 },
            rowSelection: {
              selectedRowKeys: dataScopeTemplates.selectedRowKeys,
              onChange: handleSelectChange,
            },
          }}
          alert
          pageURI
          columns={columns.value}
          dataSource={loadData}
          showPagination="auto"
        ></AsyncTable>
      </Card>
    );
  },
});
