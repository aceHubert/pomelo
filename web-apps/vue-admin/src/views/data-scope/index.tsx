import { lowerCase } from 'lodash-es';
import moment from 'moment';
import { defineComponent, ref, reactive, computed, watch } from '@vue/composition-api';
import { useRoute } from 'vue2-helpers/vue-router';
import { Card, Descriptions, Popconfirm, Space, Spin } from 'ant-design-vue';
import { SearchForm, AsyncTable } from 'antdv-layout-pro';
import { TemplateStatus } from '@pomelo/shared-web';
import { useTemplateApi } from '@/fetch/graphql';
import { useI18n, useUserManager } from '@/hooks';
import { useDeviceMixin, useTemplateMixin } from '@/mixins';
import { TemplateType } from './constants';
import classes from './index.module.less';

// Types
import type { DataSourceFn, Column } from 'antdv-layout-pro/components/async-table/AsyncTable';
import type { PagedTemplateArgs, PagedTemplateItem } from '@/fetch/graphql';
import type { User } from '@/auth/user-manager';
import type { BulkActions } from '../../mixins/template';

enum RouteQueryKey {
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
    const route = useRoute();
    const i18n = useI18n();
    const deviceMixin = useDeviceMixin();
    const userManager = useUserManager();
    const templateApi = useTemplateApi();
    const templateMixin = useTemplateMixin();

    const currentUser = ref<User>();

    // 从 URI 获取搜索参数
    const searchQuery = computed<Omit<PagedTemplateArgs, 'offset' | 'limit' | 'queryStatusCounts' | 'querySelfCounts'>>(
      () => {
        return {
          ...templateMixin.searchQuery,
          type: TemplateType,
          author: (route.query[RouteQueryKey.IsSelf] as string) === 'true' ? currentUser.value?.profile.sub : void 0,
        };
      },
    );

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

    const columns = computed(() => {
      const renderRowInline = (record: PagedTemplateItem) => {
        return (
          <Descriptions size="small" column={1} class="mt-2">
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_templates.author_label', '作者')}
              </span>
              {`-`}
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_templates.date_label', '日期')}
              </span>
              <p class="mb-1">
                {record.status !== TemplateStatus.Publish ? (
                  i18n.tv('page_templates.updated_at', '最后修改')
                ) : (
                  <span>{i18n.tv(`page_templates.status_options.${lowerCase(record.status)}`, record.status)}</span>
                )}
              </p>
              {moment(record.updatedAt).locale(i18n.locale).format('L HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        );
      };

      const renderActions = (record: PagedTemplateItem & { deleting?: boolean; restoring?: boolean }) => {
        return record.status !== TemplateStatus.Trash
          ? [
              <router-link to={{ name: 'data-scope-edit', params: { id: record.id } }}>
                {i18n.tv('common.btn_text.edit', '编辑')}
              </router-link>,
              <a
                href="javascript:;"
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
                {record.deleting && <Spin />}
                {record.deleting
                  ? i18n.tv('common.btn_text.in_operation', '操作中')
                  : i18n.tv('page_templates.btn_text.move_to_trush', '放入回收站')}
              </a>,
            ]
          : [
              <a
                href="javascript:;"
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
                {record.restoring && <Spin />}
                {record.restoring
                  ? i18n.tv('common.btn_text.in_operation', '操作中')
                  : i18n.tv('page_templates.btn_text.restore', '重置')}
              </a>,
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
                <a href="javascript:;" class="error--text" loading={record.deleting}>
                  {' '}
                  {record.deleting && <Spin />}
                  {record.deleting
                    ? i18n.tv('common.btn_text.in_operation', '操作中')
                    : i18n.tv('common.btn_text.delete', '删除')}
                </a>
              </Popconfirm>,
            ];
      };
      return [
        // { title: 'id', dataIndex: 'id' },
        {
          title: i18n.tv('page_templates.title_label', '标题'),
          dataIndex: 'title',
          customRender: (_: any, record: PagedTemplateItem) => (
            <div class={classes.title}>
              <router-link
                to={{ name: 'data-scope-edit', params: { id: record.id } }}
                class={classes.routerLink}
                target="preview-route"
              >
                {record.title}
              </router-link>
              <Space class={['mt-1', classes.actions]}>{renderActions(record)}</Space>
              {!deviceMixin.isDesktop && renderRowInline(record)}
            </div>
          ),
        },
        deviceMixin.isDesktop && {
          title: i18n.tv('page_templates.author_label', '作者'),
          dataIndex: 'author',
          width: 200,
          customRender: () => `-`,
        },
        deviceMixin.isDesktop && {
          title: i18n.tv('page_templates.date_label', '日期'),
          dataIndex: 'updatedAt',
          align: 'left',
          width: 200,
          customRender: (_: any, record: PagedTemplateItem) => (
            <div>
              <p class="mb-1">
                {record.status !== TemplateStatus.Publish ? (
                  i18n.tv('page_templates.updated_at', '最后修改')
                ) : (
                  <span>{i18n.tv(`page_templates.status_options.${lowerCase(record.status)}`, record.status)}</span>
                )}
              </p>
              {moment(record.updatedAt).locale(i18n.locale).format('L HH:mm')}
            </div>
          ),
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
        ></SearchForm>
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
            rowClassName: () => `${classes.row} ${classes.rowAlign}`,
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
