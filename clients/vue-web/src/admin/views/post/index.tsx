import moment from 'moment';
import { lowerCase, has } from 'lodash-es';
import { defineComponent, ref, reactive, computed, watch } from '@vue/composition-api';
import { trailingSlash } from '@ace-util/core';
import { useRoute } from 'vue2-helpers/vue-router';
import { TreeSelect, Select, Card, Descriptions, Popconfirm, Spin, Space } from 'ant-design-vue';
import { SearchForm, AsyncTable } from 'antdv-layout-pro';
import { OptionPresetKeys, UserCapability } from '@ace-pomelo/shared/client';
import { message } from '@/components';
import { usePostApi, PresetTemplateType, TemplateStatus, TemplateCommentStatus } from '@/fetch/apis';
import { useI18n, useOptions, useUserManager } from '@/composables';
import { useLocationMixin, useDeviceMixin } from '@/mixins';
import { useUserMixin, useTemplateMixin } from '@/admin/mixins';
import classes from './index.module.less';

// typed
import type { DataSourceFn, Column } from 'antdv-layout-pro/components/async-table/AsyncTable';
import type { PagedPostTemplateArgs, PagedPostTemplateItem } from '@/fetch/apis';
import type { BulkActions } from '@/admin/mixins/template';
import type { ActionCapability } from './components/design-layout/DesignLayout';

enum RouteQueryKey {
  CategoryId = 'cid',
  TagId = 'tid',
  Self = 'self',
  Date = 'd',
}

export default defineComponent({
  name: 'PostIndex',
  head() {
    return {
      title: this.$tv('page_templates.posts.page_title', '所有文章') as string,
    };
  },
  props: [],
  setup(_props, { refs }) {
    const route = useRoute();
    const i18n = useI18n();
    const userManager = useUserManager();
    const homeUrl = useOptions(OptionPresetKeys.Home);
    const userMixin = useUserMixin();
    const deviceMixin = useDeviceMixin();
    const locationMixin = useLocationMixin();
    const templateMixin = useTemplateMixin();
    const postApi = usePostApi();

    const currentUserId = ref<string>();

    const postTemplates = reactive({
      loading: false,
      rowCount: 0,
      selectedRowKeys: [] as Array<string | number>,
      queryStatusCounts: true, // query 时是否查询状态数量
      querySelfCounts: true, // query 时是否查询我的数量
    });

    // 从 URI 获取搜索参数
    const searchQuery = computed<
      Omit<PagedPostTemplateArgs, 'offset' | 'limit' | 'queryStatusCounts' | 'querySelfCounts'>
    >(() => {
      return {
        ...templateMixin.searchQuery,
        author: has(route.query, RouteQueryKey.Self) ? currentUserId.value : void 0,
        date: (route.query[RouteQueryKey.Date] as string) || void 0,
        categoryId: (route.query[RouteQueryKey.CategoryId] as string) || void 0,
        tagId: (route.query[RouteQueryKey.TagId] as string) || void 0,
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

      return postApi
        .getPaged({
          variables: {
            ...searchQuery.value,
            offset: size * (page - 1),
            limit: size,
            queryStatusCounts: postTemplates.queryStatusCounts,
            querySelfCounts: postTemplates.querySelfCounts,
          },
        })
        .then(({ posts, statusCounts, selfCounts }) => {
          postTemplates.rowCount = posts.total;
          if (postTemplates.queryStatusCounts) {
            templateMixin.statusCount.value = statusCounts!;
            postTemplates.queryStatusCounts = false;
          }
          if (postTemplates.querySelfCounts) {
            templateMixin.selfCount.value = selfCounts!;
            postTemplates.querySelfCounts = false;
          }

          return {
            rows: posts.rows.map((item) => {
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
            total: posts.total,
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
      postTemplates.selectedRowKeys = selectedRowKeys;
    };

    // 参数变更刷新table
    watch(searchQuery, refreshTable);

    // 加载分类树
    templateMixin.category.selectKey = Number((route.query[RouteQueryKey.CategoryId] as string) || '') || '';
    templateMixin
      .getCategories({
        includeDefault: true,
      })
      .then((treeData) => {
        templateMixin.category.treeData = treeData;
      })
      .catch((err) => {
        message.error(err.message);
      });

    // 加载月分组
    templateMixin.monthCount.selectKey = (route.query[RouteQueryKey.Date] as string) || '';
    templateMixin
      .getMonthCounts(PresetTemplateType.Post)
      .then((selectData) => {
        templateMixin.monthCount.selectData = selectData;
      })
      .catch((err) => {
        message.error(err.message);
      });

    const columns = computed(() => {
      const getViewUrl = (record: PagedPostTemplateItem) => {
        const baseUrl = trailingSlash(homeUrl.value || '/');
        // TODO: config format url

        return baseUrl + `p/${record.id}`;
      };

      const renderRowInline = (record: PagedPostTemplateItem) => {
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
                {i18n.tv('page_templates.category_label', '分类')}
              </span>
              {record.categories.length
                ? record.categories.map((category) => (
                    <router-link to={{ name: 'category', query: { id: category.id } }} class="mr-2">
                      {category.name}
                    </router-link>
                  ))
                : `-`}
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_templates.tag_label', '标签')}
              </span>
              {record.tags.length
                ? record.tags.map((tag) => (
                    <router-link to={{ name: 'tag', query: { id: tag.id } }} class="mr-2">
                      {tag.name}
                    </router-link>
                  ))
                : `-`}
            </Descriptions.Item>
            <Descriptions.Item>
              <span slot="label" class="text--secondary">
                {i18n.tv('page_templates.comment_label', '评论')}
              </span>
              {record.commentStatus === TemplateCommentStatus.Closed ? '-' : record.commentCount}
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
        record: PagedPostTemplateItem & {
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
                <router-link to={{ name: 'post-edit', params: { id: record.id } }} class="warning--text">
                  {i18n.tv('page_templates.btn_text.review', '审核')}
                </router-link>
              ) : record.actionCapability.canEdit ? (
                record.status === TemplateStatus.Pending ? (
                  <router-link to={{ name: 'post-edit', params: { id: record.id } }}>
                    {i18n.tv('common.btn_text.edit', '编辑')}
                  </router-link>
                ) : record.status === TemplateStatus.Publish || record.status === TemplateStatus.Future ? (
                  record.actionCapability.canEditPublished ? (
                    <router-link to={{ name: 'post-edit', params: { id: record.id } }}>
                      {i18n.tv('common.btn_text.edit', '编辑')}
                    </router-link>
                  ) : null
                ) : (
                  <router-link to={{ name: 'post-edit', params: { id: record.id } }}>
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
                        postTemplates.queryStatusCounts = true; // 更新状态数量
                        postTemplates.querySelfCounts = true; // 更新我的数量
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
                      postTemplates.queryStatusCounts = true; // 更新状态数量
                      postTemplates.querySelfCounts = true; // 更新我的数量
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
                title={i18n.tv('page_templates.posts.tips.delete_confirm', '确认删除这条内容配置？')}
                okText="Ok"
                cancelText="No"
                onConfirm={() =>
                  templateMixin.handleDelete(record).then((result) => {
                    if (result !== false) {
                      postTemplates.queryStatusCounts = true; // 更新状态数量
                      postTemplates.querySelfCounts = true; // 更新我的数量
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
            record: PagedPostTemplateItem & {
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
                {!deviceMixin.isDesktop && renderRowInline(record)}
              </div>
            );
          },
        },
        deviceMixin.isDesktop && {
          title: i18n.tv('page_templates.author_label', '作者'),
          dataIndex: 'author',
          width: 120,
          customRender: (_: any, record: PagedPostTemplateItem) => record.author?.displayName ?? '-',
        },
        deviceMixin.isDesktop && {
          title: i18n.tv('page_templates.category_label', '分类'),
          dataIndex: 'categories',
          width: 220,
          customRender: (_: any, record: PagedPostTemplateItem) =>
            record.categories.length
              ? record.categories.map((category) => (
                  <router-link to={{ name: 'category', query: { id: category.id } }} class="mr-2">
                    {category.name}
                  </router-link>
                ))
              : `-`,
        },
        deviceMixin.isDesktop && {
          title: i18n.tv('page_templates.tag_label', '标签'),
          dataIndex: 'tags',
          width: 220,
          customRender: (_: any, record: PagedPostTemplateItem) =>
            record.tags.length
              ? record.tags.map((tag) => (
                  <router-link to={{ name: 'tag', query: { id: tag.id } }} class="mr-2">
                    {tag.name}
                  </router-link>
                ))
              : `-`,
        },
        deviceMixin.isDesktop && {
          title: i18n.tv('page_templates.comment_label', '评论'),
          dataIndex: 'commentCount',
          width: 100,
          customRender: (_: any, record: PagedPostTemplateItem) =>
            record.commentStatus === TemplateCommentStatus.Closed ? '-' : record.commentCount,
        },
        deviceMixin.isDesktop && {
          title: i18n.tv('page_templates.date_label', '日期'),
          dataIndex: 'updatedAt',
          align: 'left',
          width: 200,
          customRender: (_: any, record: PagedPostTemplateItem) => (
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
          rowCount={postTemplates.rowCount}
          statusOptions={templateMixin.statusOptions.value}
          bulkAcitonOptions={templateMixin.bulkActionOptions.value}
          bulkApplying={templateMixin.bulkApplying.value}
          onBulkApply={(action: BulkActions) =>
            templateMixin.handleBulkApply(action, postTemplates.selectedRowKeys).then((result) => {
              if (result !== false) {
                postTemplates.selectedRowKeys = []; // 选中的key清除
                postTemplates.queryStatusCounts = true; // 更新状态数量
                postTemplates.querySelfCounts = true; // 更新我的数量
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
              selectedRowKeys: postTemplates.selectedRowKeys,
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
