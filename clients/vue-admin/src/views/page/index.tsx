import moment from 'moment';
import { lowerCase, has } from 'lodash-es';
import { defineComponent, ref, reactive, computed, watch } from '@vue/composition-api';
import { useRoute } from 'vue2-helpers/vue-router';
import { trailingSlash } from '@ace-util/core';
import { Select, Card, Descriptions, Popconfirm, Space, Spin } from 'ant-design-vue';
import { SearchForm, AsyncTable } from 'antdv-layout-pro';
import { OptionPresetKeys, UserCapability, TemplateStatus } from '@ace-pomelo/shared-client';
import { message } from '@/components';
import { usePageApi, PresetTemplateType } from '@/fetch/apis';
import { useI18n, useOptions, useUserManager, useDeviceType } from '@/hooks';
import { useUserMixin, useTemplateMixin, useLocationMixin } from '@/mixins';
import classes from './index.module.less';

// typed
import type { DataSourceFn, Column } from 'antdv-layout-pro/components/async-table/AsyncTable';
import type { PagedPageTemplateArgs, PagedPageTemplateItem } from '@/fetch/apis';
import type { BulkActions } from '@/mixins/template';
import type { ActionCapability } from '../post/components/design-layout/DesignLayout';

enum RouteQueryKey {
  Date = 'd',
  Self = 'self',
}

export default defineComponent({
  name: 'PageIndex',
  head() {
    return {
      title: this.$tv('page_templates.pages.page_title', '页面列表') as string,
    };
  },
  props: [],
  setup(_props, { refs }) {
    const route = useRoute();
    const i18n = useI18n();
    const userManager = useUserManager();
    const deviceType = useDeviceType();
    const homeUrl = useOptions(OptionPresetKeys.Home);
    const userMixin = useUserMixin();
    const locationMixin = useLocationMixin();
    const templateMixin = useTemplateMixin();
    const pageApi = usePageApi();

    const currentUserId = ref<string>();

    const pageTemplates = reactive({
      loading: false,
      rowCount: 0,
      selectedRowKeys: [] as Array<string | number>,
      queryStatusCounts: true, // query 时是否查询状态数量
      querySelfCounts: true, // query 时是否查询我的数量
    });

    // 从 URI 获取搜索参数
    const searchQuery = computed<Omit<PagedPageTemplateArgs, 'offset' | 'limit' | 'queryStatusCounts'>>(() => {
      return {
        ...templateMixin.searchQuery,
        author: has(route.query, RouteQueryKey.Self) ? currentUserId.value : void 0,
        date: (route.query[RouteQueryKey.Date] as string) || void 0,
      };
    });

    // 加载数据
    let hasPermission = (_: UserCapability) => false;
    const loadData: DataSourceFn = async ({ page, size }) => {
      // 加载数据前确保用户 id 已存在
      if (!currentUserId.value) {
        const user = await userManager.getUser();
        currentUserId.value = user?.profile.sub;
        if (user?.profile.role) {
          const role = userMixin.getRole(user.profile.role);
          hasPermission = role.hasPermission.bind(undefined);
        }
      }

      return pageApi
        .getPaged({
          variables: {
            ...searchQuery.value,
            offset: size * (page - 1),
            limit: size,
            queryStatusCounts: pageTemplates.queryStatusCounts,
            querySelfCounts: pageTemplates.querySelfCounts,
          },
        })
        .then(({ pages, statusCounts, selfCounts }) => {
          pageTemplates.rowCount = pages.total;
          if (pageTemplates.queryStatusCounts) {
            templateMixin.statusCount.value = statusCounts!;
            pageTemplates.queryStatusCounts = false;
          }
          if (pageTemplates.querySelfCounts) {
            templateMixin.selfCount.value = selfCounts!;
            pageTemplates.querySelfCounts = false;
          }

          return {
            rows: pages.rows.map((item) => {
              // 设置操作权限
              const actionCapability: Required<ActionCapability> = {
                canEdit: hasPermission(UserCapability.EditTemplates),
                canEditPublished: hasPermission(UserCapability.EditPublishedTemplates),
                canDelete: hasPermission(UserCapability.DeleteTemplates),
                canDeletePublished: hasPermission(UserCapability.DeletePublishedTemplates),
                canPublish: hasPermission(UserCapability.PublishTemplates),
              };

              if (currentUserId.value !== item.author?.id) {
                actionCapability.canEdit =
                  actionCapability.canEdit && hasPermission(UserCapability.EditOthersTemplates);

                if (item.status === TemplateStatus.Private) {
                  actionCapability.canDelete =
                    actionCapability.canEdit && hasPermission(UserCapability.EditPrivateTemplates);
                }

                actionCapability.canDelete =
                  actionCapability.canDelete && hasPermission(UserCapability.DeleteOthersTemplates);

                if (item.status === TemplateStatus.Private) {
                  actionCapability.canDelete =
                    actionCapability.canDelete && hasPermission(UserCapability.DeletePrivateTemplates);
                }
              }

              return {
                ...item,
                actionCapability,
                isSelfContent: currentUserId.value === String(item.author?.id),
              };
            }),
            total: pages.total,
          };
        })
        .catch((err) => {
          message.error(err.message);
          return {
            rows: [],
            total: 0,
          };
        });
    };

    // 刷新表格数据
    const refreshTable = () => {
      (refs['table'] as any)?.refresh();
    };

    // 行选择
    const handleSelectChange = (selectedRowKeys: Array<string | number>) => {
      pageTemplates.selectedRowKeys = selectedRowKeys;
    };

    // 参数变更刷新table
    watch(searchQuery, refreshTable);

    // 加载月分组
    templateMixin.monthCount.selectKey = (route.query[RouteQueryKey.Date] as string) || '';
    templateMixin
      .getMonthCounts(PresetTemplateType.Page)
      .then((selectData) => {
        templateMixin.monthCount.selectData = selectData;
      })
      .catch((err) => {
        message.error(err.message);
      });

    const columns = computed(() => {
      const getViewUrl = (record: PagedPageTemplateItem) => {
        const baseUrl = trailingSlash(homeUrl.value || '/');
        // TODO: config format url

        return baseUrl + `${record.id}`;
      };

      const renderRowInline = (record: PagedPageTemplateItem) => {
        return (
          <Descriptions size="small" column={1} class="mt-2">
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_templates.author_label', '作者')}
              </span>
              {record.author?.displayName ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_templates.comment_label', '评论')}
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

      const renderActions = (
        record: PagedPageTemplateItem & {
          actionCapability: Required<ActionCapability>;
          isSelfContent: boolean;
          deleting?: boolean;
          restoring?: boolean;
        },
      ) => {
        return record.status !== TemplateStatus.Trash
          ? [
              record.status === TemplateStatus.Pending &&
              !record.isSelfContent &&
              record.actionCapability.canPublish ? (
                <router-link to={{ name: 'page-edit', params: { id: record.id } }} class="warning--text">
                  {i18n.tv('page_templates.btn_text.review', '审核')}
                </router-link>
              ) : record.actionCapability.canEdit ? (
                record.status === TemplateStatus.Pending ? (
                  <router-link to={{ name: 'page-edit', params: { id: record.id } }}>
                    {i18n.tv('common.btn_text.edit', '编辑')}
                  </router-link>
                ) : record.status === TemplateStatus.Publish || record.status === TemplateStatus.Future ? (
                  record.actionCapability.canEditPublished ? (
                    <router-link to={{ name: 'page-edit', params: { id: record.id } }}>
                      {i18n.tv('common.btn_text.edit', '编辑')}
                    </router-link>
                  ) : null
                ) : (
                  <router-link to={{ name: 'page-edit', params: { id: record.id } }}>
                    {i18n.tv('common.btn_text.edit', '编辑')}
                  </router-link>
                )
              ) : null,
              ((record.status === TemplateStatus.Publish || record.status === TemplateStatus.Future) &&
                record.actionCapability.canDeletePublished) ||
              (!(record.status === TemplateStatus.Publish || record.status === TemplateStatus.Future) &&
                record.actionCapability.canDelete) ? (
                <a
                  href="javascript:;"
                  class="danger--text"
                  onClick={() =>
                    templateMixin.handleDelete(record).then((result) => {
                      if (result !== false) {
                        pageTemplates.queryStatusCounts = true; // 更新状态数量
                        pageTemplates.querySelfCounts = true; // 更新我的数量
                        refreshTable();
                      }
                    })
                  }
                >
                  {record.deleting && <Spin />}
                  {record.deleting
                    ? i18n.tv('common.btn_text.in_operation', '操作中')
                    : i18n.tv('page_templates.btn_text.move_to_trush', '放入回收站')}
                </a>
              ) : null,
              <a href={getViewUrl(record)} class="info--text" target="preview">
                {record.status === TemplateStatus.Publish
                  ? i18n.tv('common.btn_text.view', '查看')
                  : i18n.tv('common.btn_text.preview', '预览')}
              </a>,
            ]
          : [
              <a
                href="javascript:;"
                onClick={() =>
                  templateMixin.handleRestore(record).then((result) => {
                    if (result !== false) {
                      pageTemplates.queryStatusCounts = true; // 更新状态数量
                      pageTemplates.querySelfCounts = true; // 更新我的数量
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
                title={i18n.tv('page_templates.pages.tips.delete_confirm', '确认删除这条内容配置？')}
                okText="Ok"
                cancelText="No"
                onConfirm={() =>
                  templateMixin.handleDelete(record).then((result) => {
                    if (result !== false) {
                      pageTemplates.queryStatusCounts = true; // 更新状态数量
                      pageTemplates.querySelfCounts = true; // 更新我的数量
                      refreshTable();
                    }
                  })
                }
              >
                <a href="javascript:;" class="error--text">
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
          customRender: (
            _: any,
            record: PagedPageTemplateItem & {
              actionCapability: Required<ActionCapability>;
              isSelfContent: boolean;
              deleting?: boolean;
              restoring?: boolean;
            },
          ) => {
            const titleSuffixs: string[] = [];
            if (record.status !== TemplateStatus.Publish) {
              titleSuffixs.push(
                i18n.tv(`page_templates.status_options.${lowerCase(record.status)}`, record.status) as string,
              );
            }
            return (
              <div class={classes.title}>
                <p class="mb-0 d-flex">
                  <a
                    href={getViewUrl(record)}
                    class={[classes.titleLink, 'text-ellipsis']}
                    title={record.title}
                    style="flex: 0 1 auto;"
                    target="preview"
                  >
                    {record.title}
                  </a>
                  {titleSuffixs.length > 0 && (
                    <span class="warning--text font-weight-bold pl-1 flex-none">{`- ${titleSuffixs.join(', ')}`}</span>
                  )}
                </p>
                <Space class={['mt-1', classes.actions]}>{renderActions(record)}</Space>
                {!deviceType.isDesktop && renderRowInline(record)}
              </div>
            );
          },
        },
        deviceType.isDesktop && {
          title: i18n.tv('page_templates.author_label', '作者'),
          dataIndex: 'author',
          width: 120,
          customRender: (_: any, record: PagedPageTemplateItem) => record.author?.displayName ?? '-',
        },
        deviceType.isDesktop && {
          title: i18n.tv('page_templates.comment_label', '评论'),
          dataIndex: 'commentCount',
          width: 100,
          customRender: () => `-`,
        },
        deviceType.isDesktop && {
          title: i18n.tv('page_templates.date_label', '日期'),
          dataIndex: 'updatedAt',
          align: 'left',
          width: 200,
          customRender: (_: any, record: PagedPageTemplateItem) => (
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
      <Card bordered={false} size={deviceType.isMobile ? 'small' : 'default'}>
        <SearchForm
          keywordPlaceholder={
            i18n.tv('common.placeholder.search', '"标题"模糊搜索', {
              field: i18n.tv('page_templates.title_label', '标题'),
            }) as string
          }
          rowCount={pageTemplates.rowCount}
          statusOptions={templateMixin.statusOptions.value}
          bulkAcitonOptions={templateMixin.bulkActionOptions.value}
          bulkApplying={templateMixin.bulkApplying.value}
          onBulkApply={(action: BulkActions) =>
            templateMixin.handleBulkApply(action, pageTemplates.selectedRowKeys).then((result) => {
              if (result !== false) {
                pageTemplates.selectedRowKeys = []; // 选中的key清除
                pageTemplates.queryStatusCounts = true; // 更新状态数量
                pageTemplates.querySelfCounts = true; // 更新我的数量
                refreshTable();
              }
            })
          }
        >
          <template slot="filter">
            <Select
              value={templateMixin.monthCount.selectKey}
              options={templateMixin.monthOptions.value}
              style="width:120px"
              onChange={(value: string) => {
                locationMixin.updateRouteQuery({ [RouteQueryKey.Date]: value }).then(() => {
                  templateMixin.monthCount.selectKey = value;
                });
              }}
            ></Select>
          </template>
        </SearchForm>
        <AsyncTable
          ref="table"
          attrs={{
            rowKey: 'id',
            size: 'small',
            scroll: { x: true, y: 0 },
            rowSelection: {
              selectedRowKeys: pageTemplates.selectedRowKeys,
              getCheckboxProps: (record) => ({ props: { disabled: !record.isSelfContent } }),
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
