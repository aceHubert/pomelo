import moment from 'moment';
import { lowerCase } from 'lodash-es';
import { defineComponent, ref, reactive, computed, watch } from '@vue/composition-api';
import { Button, Card, Icon, Tag, Popconfirm, TreeSelect } from 'ant-design-vue';
import { SearchForm, AsyncTable } from 'antdv-layout-pro';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { trailingSlash } from '@ace-util/core';
import { useFormApi, TemplateStatus } from '@/fetch/graphql';
import { useI18n, useOptions, useUserManager } from '@/hooks';
import { useDeviceMixin, useLocationMixin } from '@/mixins';
import { useTemplateMixin } from '../mixins/index.mixin';
import classes from './styles/index.module.less';

// typed
import type { DataSourceFn, Column } from 'antdv-layout-pro/components/async-table/AsyncTable';
import type { PagedFormTemplateQuery, PagedFormTemplateItem } from '@/fetch/graphql';
import type { User } from '@/auth/user-manager';
import type { BulkActions } from '../mixins/index.mixin';
import type { ActionCapability } from '../components/design-layout/DesignLayout';

enum RouteQueryKey {
  CategoryId = 'cid',
  IsSelf = 'self',
}

export default defineComponent({
  name: 'FormIndex',
  head() {
    return {
      title: this.$tv('page_templates.forms.page_title', '表单列表') as string,
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
    const siteUrl = useOptions('home');
    const formApi = useFormApi();
    const templateMixin = useTemplateMixin();

    const currentUser = ref<User>();

    const formTemplates = reactive({
      loading: false,
      rowCount: 0,
      selectedRowKeys: [] as Array<string | number>,
      queryStatusCounts: true, // query 时是否查询状态数量
      querySelfCounts: true, // query 时是否查询我的数量
    });

    // 从 URI 获取搜索参数
    const searchQuery = computed<Omit<PagedFormTemplateQuery, 'offset' | 'limit' | 'queryStatusCounts'>>(() => {
      return {
        ...templateMixin.searchQuery,
        author: (route.query[RouteQueryKey.IsSelf] as string) === 'true' ? currentUser.value?.profile.sub : void 0,
        categoryId: Number((route.query[RouteQueryKey.CategoryId] as string) || '') || void 0,
      };
    });

    // 加载数据
    const loadData: DataSourceFn = async ({ page, size }) => {
      // 加载数据前确保用户 id 已存在
      if (!currentUser.value) {
        const user = await userManager.getUser();
        currentUser.value = user || void 0;
      }

      return formApi
        .getPaged({
          variables: {
            ...searchQuery.value,
            offset: size * (page - 1),
            limit: size,
            queryStatusCounts: formTemplates.queryStatusCounts,
            querySelfCounts: formTemplates.querySelfCounts,
          },
          catchError: true,
        })
        .then(({ forms, statusCounts, selfCounts }) => {
          formTemplates.rowCount = forms.total;
          if (formTemplates.queryStatusCounts) {
            templateMixin.statusCount.value = statusCounts!;
            formTemplates.queryStatusCounts = false;
          }
          if (formTemplates.querySelfCounts) {
            templateMixin.selfCount.value = selfCounts!;
            formTemplates.querySelfCounts = false;
          }

          return {
            rows: forms.rows.map((item) => {
              // 设置操作权限
              const actionCapability: Required<ActionCapability> = {
                operate: false,
                publish: false,
              };

              // TODO: 设置条件管理员权限
              if (currentUser.value?.profile.role?.includes('isp.admin')) {
                actionCapability.operate = true;
                actionCapability.publish = true;
              } else {
                // 只能操作自己的
                if (currentUser.value?.profile.sub === item.author) {
                  actionCapability.operate = true;
                }
              }

              return {
                ...item,
                actionCapability,
                isSelfContent: currentUser.value?.profile.sub === item.author,
              };
            }),
            total: forms.total,
          };
        });
    };

    // 刷新表格数据
    const refreshTable = () => {
      (refs['table'] as any)?.refresh();
    };

    // 行选择
    const handleSelectChange = (selectedRowKeys: Array<string | number>) => {
      formTemplates.selectedRowKeys = selectedRowKeys;
    };

    // 参数变更刷新table
    watch(searchQuery, refreshTable);

    // 加载分类树
    templateMixin.category.selectKey = Number((route.query[RouteQueryKey.CategoryId] as string) || '') || '';
    templateMixin.getCategories({ includeDefault: true }).then((treeData) => {
      templateMixin.category.treeData = treeData;
    });

    const columns = computed(() => {
      const baseSiteUrl = trailingSlash(siteUrl.value || '/');
      const renderRowInline = (record: PagedFormTemplateItem) => {
        return (
          <div>
            <p class="mb-2">
              <a href={`${baseSiteUrl}f/${record.id}`} class={classes.routerLink} target="preview-route">
                {record.title}
                <Icon type="link" class={classes.routerLinkIcon} />
              </a>
            </p>
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

      const renderActions = (
        record: PagedFormTemplateItem & {
          actionCapability: Required<ActionCapability>;
          isSelfContent: boolean;
          deleting?: boolean;
          restoring?: boolean;
        },
      ) => {
        return record.actionCapability.operate
          ? record.status !== TemplateStatus.Trash
            ? [
                (record.isSelfContent ||
                  (record.status === TemplateStatus.Pending &&
                    record.actionCapability.publish &&
                    !record.isSelfContent)) && (
                  <Button
                    type="link"
                    size="small"
                    class={
                      record.status === TemplateStatus.Pending &&
                      record.actionCapability.publish &&
                      !record.isSelfContent
                        ? 'warning--text'
                        : ''
                    }
                    onClick={() => router.push({ name: 'form-edit', params: { id: record.id } })}
                  >
                    {record.status === TemplateStatus.Pending &&
                    record.actionCapability.publish &&
                    !record.isSelfContent
                      ? i18n.tv('page_templates.btn_text.review', '审核')
                      : i18n.tv('common.btn_text.edit', '编辑')}
                  </Button>
                ),
                record.isSelfContent && (
                  <Button
                    type="link"
                    size="small"
                    class="danger--text"
                    loading={record.deleting}
                    onClick={() =>
                      templateMixin.handleDelete(record).then((result) => {
                        if (result) {
                          formTemplates.queryStatusCounts = true; // 更新状态数量
                          formTemplates.querySelfCounts = true; // 更新我的数量
                          refreshTable();
                        }
                      })
                    }
                  >
                    {record.deleting
                      ? i18n.tv('common.btn_text.in_operation', '操作中')
                      : i18n.tv('page_templates.btn_text.move_to_trush', '放入回收站')}
                  </Button>
                ),
              ]
            : record.isSelfContent && [
                <Button
                  type="link"
                  size="small"
                  loading={record.deleting}
                  onClick={() =>
                    templateMixin.handleRestore(record).then((result) => {
                      if (result) {
                        formTemplates.queryStatusCounts = true; // 更新状态数量
                        formTemplates.querySelfCounts = true; // 更新我的数量
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
                  title={i18n.tv('page_templates.forms.tips.delete_confirm', '确认删除这条表单配置？')}
                  okText="Ok"
                  cancelText="No"
                  onConfirm={() =>
                    templateMixin.handleDelete(record).then((result) => {
                      if (result) {
                        formTemplates.queryStatusCounts = true; // 更新状态数量
                        formTemplates.querySelfCounts = true; // 更新我的数量
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
              ]
          : [];
      };
      return [
        // { title: 'id', dataIndex: 'id' },
        {
          title: i18n.tv('page_templates.title_label', '标题'),
          dataIndex: 'title',
          customRender: (
            _: any,
            record: PagedFormTemplateItem & {
              actionCapability: Required<ActionCapability>;
              isSelfContent: boolean;
              deleting?: boolean;
              restoring?: boolean;
            },
          ) =>
            deviceMixin.isDesktop ? (
              <a href={`${baseSiteUrl}f/${record.id}`} class={classes.routerLink} target="preview-route">
                {record.title}
                <Icon type="link" class={classes.routerLinkIcon} />
              </a>
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
          customRender: (_: any, record: PagedFormTemplateItem) =>
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
            customRender: (_: any, record: PagedFormTemplateItem) => (
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
          customRender: (_: any, record: PagedFormTemplateItem) =>
            moment(record.createdAt).locale(i18n.locale).format('L'),
        },
        (deviceMixin.isDesktop || deviceMixin.isTablet) && {
          title: '',
          width: 220,
          customRender: (
            _: any,
            record: PagedFormTemplateItem & {
              actionCapability: Required<ActionCapability>;
              isSelfContent: boolean;
              deleting?: boolean;
              restoring?: boolean;
            },
          ) => renderActions(record),
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
          rowCount={formTemplates.rowCount}
          statusOptions={templateMixin.statusOptions.value}
          bulkAcitonOptions={templateMixin.bulkActionOptions.value}
          bulkApplying={templateMixin.bulkApplying.value}
          onBulkApply={(action: BulkActions) =>
            templateMixin.handleBulkApply(action, formTemplates.selectedRowKeys).then((result) => {
              if (result) {
                formTemplates.selectedRowKeys = []; // 选中的key清除
                formTemplates.queryStatusCounts = true; // 更新状态数量
                formTemplates.querySelfCounts = true; // 更新我的数量
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
              treeNodeFilterProp="title"
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
              selectedRowKeys: formTemplates.selectedRowKeys,
              getCheckboxProps: (record) => ({ props: { disabled: !record.isSelfContent } }),
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
