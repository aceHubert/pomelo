import { lowerCase } from 'lodash-es';
import { ref, reactive, computed, watch, set } from '@vue/composition-api';
import { useRoute } from 'vue2-helpers/vue-router';
import { TemplateStatus } from '@ace-pomelo/shared-client';
import { message } from '@/components';
import { useI18n, useOptions } from '@/hooks';
import { useTemplateApi, useTermTaxonomyApi } from '@/fetch/apis';

// Types
import type { PagedTemplateItem, TemplateStatusCountItem, TemplateMonthCountItem } from '@/fetch/apis';
import type { StatusOption, BulkAcitonOption } from 'antdv-layout-pro/components/search-form/SearchForm';

export type AsyncTreeData = {
  id: string | number;
  title: any;
  value: string | number;
  pId?: string | number;
  isLeaf?: boolean;
  checkable?: boolean;
  selectable?: boolean;
};

export enum BulkActions {
  MoveToTrash = 'moveToTrash',
  Restore = 'restore',
  Delete = 'delete',
}

export const useTemplateMixin = () => {
  const route = useRoute();
  const i18n = useI18n();
  const siteLocale = useOptions('locale');
  const templateApi = useTemplateApi();
  const termTaxonomyApi = useTermTaxonomyApi();

  // 从 URI 获取搜索内容，并判断值的正确性
  const searchQuery = reactive<{
    status: TemplateStatus | undefined;
    keyword: string | undefined;
  }>({
    status: void 0,
    keyword: void 0,
  });
  watch(
    () => route.query,
    (query) => {
      const status = query['status'] as TemplateStatus | undefined;
      const keyword = query['keyword'] as string | undefined;
      status !== searchQuery.status &&
        (!status || Object.values(TemplateStatus).includes(status)) &&
        (searchQuery.status = status);
      keyword !== searchQuery.keyword && (searchQuery.keyword = keyword);
    },
    { immediate: true },
  );

  // 状态 Tag 背景色
  const statusTagColors: Record<TemplateStatus, string> = {
    [TemplateStatus.Draft]: '#808080',
    [TemplateStatus.Pending]: '#fa541c',
    [TemplateStatus.Publish]: '#87d068',
    [TemplateStatus.Private]: '#87d068',
    [TemplateStatus.Future]: '#108ee9',
    [TemplateStatus.Trash]: '#f5222d',
  };

  // 状态
  const statusCount = ref<TemplateStatusCountItem[]>([]);
  const selfCount = ref(0);
  // 状态 options
  const statusOptions = computed(() => {
    // 总数不记录 trash 状态
    const allCount = statusCount.value.reduce((prev, curr) => {
      return prev + (curr.status === TemplateStatus.Trash ? 0 : curr.count);
    }, 0);

    const trushCount = statusCount.value.find((item) => item.status === TemplateStatus.Trash)?.count || 0;

    const options: StatusOption[] = [
      {
        label: i18n.tv('page_templates.status_options.all', '所有') as string,
        value: void 0, // 总数不记录 trash 状态
        count: allCount,
        tooltip: i18n.tv(
          'page_templates.status_options.all_not_include_trash_data_tooltip',
          '不包含在草稿箱中的数据',
        ) as string,
        keepStatusShown: true,
      },
      ...statusCount.value.map(({ status, count }) => ({
        label: i18n.tv(`page_templates.status_options.${lowerCase(status)}`, status) as string,
        value: status,
        count,
      })),
    ];

    // 我的数量大于0并且不等于所有的数量里显示
    if (selfCount.value > 0 && selfCount.value - trushCount !== allCount) {
      options.splice(1, 0, {
        value: { self: '' },
        label: i18n.tv('page_templates.status_options.self', '我的') as string,
        count: selfCount.value,
      });
    }
    return options;
  });

  // #region 月分组
  const monthCount = reactive({
    /**
     * select options
     */
    selectData: [] as TemplateMonthCountItem[],
    /**
     * select selected value
     */
    selectKey: void 0 as string | number | undefined,
  });
  // 按月分组 options
  const monthOptions = computed(() => [
    {
      label: i18n.tv('page_templates.filter.all_month_count_text', '所有日期') as string,
      value: '', // 总数不记录 trash 状态
    },
    ...monthCount.selectData.map(({ month, count }) => ({
      label: `${month.substring(0, 4)}-${month.substring(4)}(${count})`,
      value: month,
    })),
  ]);
  const getMonthCounts = (type: string, { months, year }: { months?: number; year?: string } = {}) => {
    return templateApi
      .getCountByMonth({
        variables: {
          type,
          months,
          year,
        },
      })
      .then(({ monthCounts }) => monthCounts);
  };
  // #endregion

  // #region 分类
  // 可以通过 getCategories 方法添加初始值
  const category = reactive({
    /**
     * tree-select default value
     */
    treeData: [] as (AsyncTreeData & { slug: string })[],
    /**
     * tree-select selected value
     */
    selectKey: void 0 as string | number | undefined,
  });
  // 分类 options
  const categoryTreeData = computed<AsyncTreeData[]>(() => {
    return [
      {
        id: '',
        value: '',
        title: i18n.tv('page_templates.filter.all_categories_text', '所有分类') as string,
        isLeaf: true,
      },
      ...category.treeData.map(({ title, slug, ...restData }) => ({
        ...restData,
        title: i18n.locale === siteLocale.value ? title : slug || title,
      })),
    ];
  });

  /**
   * 如果query是字符串则使用搜索，返回非嵌套模式
   * 不传参数返回顶级数据, 传{}返回全部数据
   * parentId为0是顶级数据
   */
  const getCategories = async (
    query:
      | string
      | {
          parentId?: string | number;
          isLeaf?: boolean;
          includeDefault?: boolean;
        } = { parentId: 0, isLeaf: false, includeDefault: false },
  ): Promise<(AsyncTreeData & { slug: string })[]> => {
    const inSearchMode = typeof query === 'string';
    const {
      isLeaf,
      ...variables
    }: {
      keyword?: string;
      parentId?: string | number;
      isLeaf?: boolean;
      includeDefault?: boolean;
    } = inSearchMode ? { keyword: query, isLeaf: true } : query;

    return termTaxonomyApi
      .getCategories({
        variables,
      })
      .then(({ categories }) =>
        categories.map((item) => ({
          id: item.id,
          pId: inSearchMode ? void 0 : item.parentId,
          title: item.name,
          slug: item.slug,
          value: item.id,
          isLeaf,
        })),
      );
  };

  /**
   * tree-select loadData
   */
  const loadCategoryData = (treeNode: { dataRef: AsyncTreeData }) => {
    return getCategories({ parentId: treeNode.dataRef.id }).then((treeData) => {
      if (treeData.length) {
        category.treeData = category.treeData.concat(...treeData);
      } else {
        treeNode.dataRef.isLeaf = true;
      }
    });
  };

  /**
   * tree-select search event
   */
  let inSearching = false,
    treeDataCache: (AsyncTreeData & { slug: string })[];
  const handleCategorySearch = (keyword: string) => {
    // 组织nested数据
    if (!inSearching && keyword.length) {
      treeDataCache = category.treeData;
    }
    if (keyword.length) {
      inSearching = true;
      // 当有搜索字段不显示层级，否则查询顶级数据
      getCategories(keyword).then((treeData) => {
        category.treeData = treeData;
      });
    } else {
      inSearching = false;
      category.treeData = treeDataCache;
    }
  };
  // #endregion

  /**
   * 处理删除数据（如果 trash 状态为永久删除，否则放入回收站）
   * record 上增加 deleting 字段表示执行中
   */
  const handleDelete = (record: Pick<PagedTemplateItem, 'id' | 'status'>) => {
    if (record.status !== TemplateStatus.Trash) {
      return templateApi
        .updateStatus({
          variables: {
            id: record.id,
            status: TemplateStatus.Trash,
          },
          loading: () => {
            set(record, 'deleting', true);
            return () => {
              set(record, 'deleting', false);
            };
          },
        })
        .then(({ result }) => {
          if (!result) {
            message.error(i18n.tv('page_templates.error.move_to_trash_faild.default', '放入回收站失败！') as string);
          }
          return result;
        })
        .catch((err) => {
          message.error(
            i18n.tv('page_templates.error.move_to_trash_faild.with_message', `放入回收站失败, ${err.message}！`, {
              message: err.message,
            }) as string,
          );
          return false;
        });
    } else {
      return templateApi
        .delete({
          variables: {
            id: record.id,
          },
          loading: () => {
            set(record!, 'deleting', true);
            return () => {
              set(record!, 'deleting', false);
            };
          },
        })
        .then(({ result }) => {
          if (!result) {
            message.error(i18n.tv('common.error.delete_faild.default', '删除失败！') as string);
          }
          return result;
        })
        .catch((err) => {
          message.error(
            i18n.tv('common.error.delete_faild.with_message', `删除失败, ${err.message}!`, {
              message: err.message,
            }) as string,
          );
          return false;
        });
    }
  };

  /**
   * 处理重置
   * record 上增加 restoring 字段表示执行中
   */
  const handleRestore = (record: Pick<PagedTemplateItem, 'id'>) => {
    return templateApi
      .restore({
        variables: {
          id: record.id,
        },
        loading: () => {
          set(record!, 'restoring', true);
          return () => {
            set(record!, 'restoring', false);
          };
        },
      })
      .then(({ result }) => {
        if (!result) {
          message.error(i18n.tv('page_templates.error.restore_faild.default', '重置失败！') as string);
        }
        return result;
      })
      .catch((err) => {
        message.error(
          i18n.tv('page_templates.error.restore_faild.with_message', `重置失败，错误：${err.message}！`, {
            message: err.message,
          }) as string,
        );
        return false;
      });
  };

  // 批量操作
  const bulkApplying = ref(false);
  const bulkActionOptions = computed<BulkAcitonOption[]>(() => {
    return searchQuery.status === TemplateStatus.Trash
      ? [
          {
            value: BulkActions.Restore,
            label: i18n.tv('page_templates.btn_text.restore', '重置') as string,
          },
          {
            value: BulkActions.Delete,
            label: i18n.tv('common.btn_text.delete', '删除') as string,
          },
        ]
      : [
          {
            value: BulkActions.MoveToTrash,
            label: i18n.tv('page_templates.btn_text.move_to_trush', '放入回收站') as string,
          },
        ];
  });
  /**
   * 处理指操作
   */
  const handleBulkApply = (action: BulkActions, ids: Array<string | number>) => {
    if (!ids.length) {
      message.warn(i18n.tv('common.error.bulk_row_select_reqrired', '请至少选择1行！') as string);
      return Promise.resolve(false);
    }

    bulkApplying.value = true;
    return (
      action === BulkActions.MoveToTrash
        ? templateApi.bulkUpdateStatus({
            variables: { ids, status: TemplateStatus.Trash },
          })
        : action === BulkActions.Restore
        ? templateApi.bulkRestore({ variables: { ids } })
        : action === BulkActions.Delete
        ? templateApi.bulkDelete({ variables: { ids } })
        : Promise.resolve({ result: false })
    )
      .then(({ result }) => {
        if (!result) {
          message.error(i18n.tv('common.error.bluk_apply_faild.default', '批量操作失败') as string);
        }
        return result;
      })
      .catch((err) => {
        message.error(
          i18n.tv('common.error.bluk_apply_faild.with_message', `批量操作失败，错误：${err.message}!`, {
            message: err.message,
          }) as string,
        );
        message.error(err.message);
        return false;
      })
      .finally(() => {
        bulkApplying.value = false;
      });
  };

  return {
    searchQuery,
    statusTagColors,
    statusCount,
    selfCount,
    statusOptions,
    bulkApplying,
    bulkActionOptions,
    monthCount,
    monthOptions,
    getMonthCounts,
    category,
    categoryTreeData,
    getCategories,
    loadCategoryData,
    handleCategorySearch,
    handleDelete,
    handleRestore,
    handleBulkApply,
  };
};
