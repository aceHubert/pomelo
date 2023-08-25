import { defineComponent, ref, reactive, computed, watch } from 'vue-demi';
import { get, hasIn } from 'lodash-es';
import { isNavigationFailure, NavigationFailureType } from 'vue-router';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { Alert, Table, message } from 'ant-design-vue';
import { promisify } from '@ace-util/core';
import { expose, useConfigProvider } from '../../shared';

// Types
import type { PropType } from 'vue-demi';
import type { Table as AntTableProps, PaginationConfig, TableRowSelection } from 'ant-design-vue/types/table/table';
import type { Column as AntColumnProps } from 'ant-design-vue/types/table/column';
import type { OmitVue } from '../../types';

export type DataSourceFn = (filter: {
  page: number;
  size: number;
  sortField?: string;
  sortOrder?: 'ASC' | 'DESC';
}) => PagedDataSource | Promise<PagedDataSource>;

export interface PagedDataSource<T = Record<string, any>> {
  rows?: T[];
  total?: number;
  [x: string]: any;
}

export interface AlertProps {
  show: boolean;
  clear: (() => void) | true;
}

export interface Column extends OmitVue<AntColumnProps> {
  /**
   * 是否需要汇总
   */
  needTotal?: boolean;
}

export type AsyncTableProps = {
  /** 列， 参考 https://antdv.com/components/table/#API */
  columns: Column[];
  /** 数据源异步方法 */
  dataSource: DataSourceFn;
  /** dataSource 返回数据字段 Promise<{[rowsFieldName]:Array,[totalFieldName]:Number}>  */
  rowsFieldName: string;
  /** dataSource 返回行数字段 Promise<{[rowsFieldName]:Array,[totalFieldName]:Number}>  */
  totolFieldName: string;
  /** 页数 */
  pageNum: number;
  /** 页大小 */
  pageSize: number;
  /** 页大小是否可改变，参考 https://antdv.com/components/pagination/#API */
  showSizeChanger: boolean;
  /** 显示分页，auto: hideOnSinglePage=true, ture: shown always, false: hide pagination */
  showPagination: 'auto' | boolean;
  /**
   * 启用分页 URI 模式
   * 例如:
   * /users/1
   * /users/2
   * /users/3?queryParam=test
   * /users?[pageNoKey]=1
   * ...
   */
  pageURI: boolean;
  /** URI 模式下显示分页current的 key */
  pageNoKey: string;
  /** URI 模式下显示分页size的 key */
  pageSizeKey: string;
  /**
   * 显示汇总(column 配置 needTotal)
   * 例如:
   * {
   *   show: true,
   *   clear: Function | true // 显示清空选项，或清空选项前执行的方法
   * } | true
   */
  alert: AlertProps | boolean;
  /** 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text */
  i18nKeyPrefix: string;
} & OmitVue<AntTableProps>;

/**
 * 异步表格组件
 * 路由初始化参数
 * query:{
 *  [pageNoKey]: Number,
 *  [pageSizeKey]: Number,
 *  ...
 * }
 */
export default defineComponent({
  name: 'AsyncTable',
  inheritAttrs: false,
  props: {
    columns: { type: Array as PropType<AsyncTableProps['columns']>, required: true },
    dataSource: { type: Function as PropType<AsyncTableProps['dataSource']>, required: true },
    rowsFieldName: { type: String, default: 'rows' },
    totolFieldName: { type: String, default: 'total' },
    pageNum: { type: Number, default: 1 },
    pageSize: { type: Number, default: 10 },
    showSizeChanger: { type: Boolean, default: true },
    showPagination: { type: [String, Boolean], default: 'auto' },
    pageURI: { type: Boolean, default: false },
    pageNoKey: { type: String, default: 'page' },
    pageSizeKey: { type: String, default: 'size' },
    alert: { type: [Object, Boolean], default: false },
    i18nKeyPrefix: { type: String, default: 'components.async_table' },
  },
  setup(props: AsyncTableProps, { attrs, slots, listeners, refs }) {
    const router = useRouter();
    const route = useRoute();
    const configProvider = useConfigProvider();

    const loading = ref(false);
    const localDataSource = ref<Record<string, any>[]>([]);
    const localPagination = ref<OmitVue<PaginationConfig> | false>(false); // create 里重新计算
    const needTotalList = ref<
      Array<{
        title: string | ((i18nRender: Function) => string);
        total: number;
        customRender?: Function;
        dataIndex: number;
      }>
    >([]);
    const selectedRow = reactive<{
      items: Record<string, any>[];
      keys: Array<string | number>;
    }>({
      items: [],
      keys: [],
    });

    const showAlert = computed(() => {
      const rowSelection = attrs.rowSelection as any as TableRowSelection;
      return (
        props.alert === true ||
        (typeof props.alert === 'object' &&
          props.alert.show &&
          rowSelection &&
          typeof rowSelection.selectedRowKeys !== 'undefined')
      );
    });

    const hasPagination = computed(() => {
      return ['auto', true].includes(props.showPagination);
    });

    watch(
      () => props.pageNum,
      (val: number) => {
        Object.assign(localPagination.value, {
          current: val,
        });
      },
    );

    watch(
      () => props.pageSize,
      (val: number) => {
        Object.assign(localPagination.value, {
          pageSize: val,
        });
      },
    );

    watch(
      () => props.showSizeChanger,
      (val: boolean) => {
        Object.assign(localPagination.value, {
          showSizeChanger: val,
        });
      },
    );

    // 初始化选择项
    const getRowKey = (record: object, i: number): string | number => {
      return typeof attrs.rowKey === 'function' ? attrs.rowKey(record, i) : attrs.rowKey || 'key';
    };

    /**
     * 加载数据方法
     * @param {Object} pagination 分页选项器
     * @param {Object} filters 过滤条件
     * @param {Object} sorter 排序条件
     */
    const loadData = (
      pagination?: PaginationConfig,
      filters?: Record<string, any>,
      sorter?: { field?: string; order?: 'ASC' | 'DESC' },
    ) => {
      pagination &&
        typeof localPagination.value === 'object' &&
        (localPagination.value = Object.assign({}, localPagination.value, pagination));
      const params = Object.assign(
        {
          page:
            pagination?.current ||
            (props.showPagination && typeof localPagination.value === 'object' && localPagination.value.current) ||
            props.pageNum,
          size:
            pagination?.pageSize ||
            (props.showPagination && typeof localPagination.value === 'object' && localPagination.value.pageSize) ||
            props.pageSize,
        },
        (sorter && sorter.field && { sortField: sorter.field }) || {},
        (sorter && sorter.order && { sortOrder: sorter.order }) || {},
        { ...filters },
      );
      const result = props.dataSource(params);

      loading.value = true;
      return promisify(result)
        .then((r) => {
          const rows = (r[props.rowsFieldName] || []) as Exclude<PagedDataSource['rows'], undefined>;
          const total = (r[props.totolFieldName] || 0) as Exclude<PagedDataSource['total'], undefined>;
          localPagination.value =
            localPagination.value &&
            Object.assign({}, localPagination.value, {
              // current: r.pager.page, // 返回结果中的当前分页数
              total, // 返回结果中的总记录数
            });
          // 为防止删除数据后导致页面当前页面数据长度为 0 ,自动翻页到上一页
          if (
            rows.length === 0 &&
            props.showPagination &&
            typeof localPagination.value === 'object' &&
            localPagination.value.current! > 1
          ) {
            localPagination.value.current!--;
            loadData();
            return;
          }

          localDataSource.value = rows; // 返回结果中的数组数据

          // 更新选中记录
          // 1，初始化设置了selectedRowKeys, 要更新 selectedRows
          // 2, 表格数据删减后，选中项要删除
          if (selectedRow.keys.length) {
            selectedRow.items = rows.filter((record: Record<string, any>, i: number) =>
              rows.includes(record[getRowKey(record, i)]),
            );
            selectedRow.keys = selectedRow.items.map(
              (record: Record<string, any>, i: number) => record[getRowKey(record, i)],
            );
          }
        })
        .catch((err: Error) => {
          message.error({ content: err.message });
        })
        .finally(() => {
          loading.value = false;
        });
    };

    /**
     * 初始化需要统计汇总的列
     * @param columns
     */
    const initTotalList = (columns: Column[]) => {
      const totalList: any = [];
      Array.isArray(columns) &&
        columns.length &&
        columns.forEach((column) => {
          if (column.needTotal) {
            totalList.push({ ...column, total: 0 });
          }
        });
      return totalList;
    };

    /**
     * 表格重新加载方法
     * 如果参数为 true, 则强制刷新到第一页
     * @param Boolean bool
     */
    const refresh = (force = false) => {
      force && (localPagination.value = Object.assign({}, localPagination.value, { current: 1 }));
      loadData();
    };

    /**
     * 用于更新已选中的列表数据 total 统计
     * @param selectedRowKeys
     * @param selectedRows
     */
    const updateSelect = (selectedRowKeys: Array<string | number>, selectedRows: object[]) => {
      selectedRow.items = selectedRows;
      selectedRow.keys = selectedRowKeys;
      needTotalList.value = needTotalList.value.map((item) => {
        return {
          ...item,
          total: selectedRows.reduce((sum, val) => {
            const total = sum + parseInt(get(val, item.dataIndex));
            return isNaN(total) ? 0 : total;
          }, 0),
        };
      });
    };

    const localRowSelection = computed(() => {
      const rowSelection = attrs.rowSelection as any as TableRowSelection;
      if (showAlert.value) {
        // 如果需要使用alert，则重新绑定 rowSelection 事件
        return {
          ...rowSelection,
          selectedRowKeys: selectedRow.keys,
          onChange: (selectedRowKeys: Array<string | number>, selectedRows: object[]) => {
            updateSelect(selectedRowKeys, selectedRows);
            rowSelection?.onChange?.(selectedRowKeys, selectedRows);
          },
        } as TableRowSelection;
      } else {
        return rowSelection;
      }
    });

    /**
     * 清空 table 已选中项
     */
    const handleClearSelected = () => {
      if (localRowSelection.value) {
        localRowSelection.value.onChange?.([], []);
        updateSelect([], []);
      }
    };

    // 处理分页显示
    let localPageNum = props.pageNum;
    let localPageSize = props.pageSize;
    // page num from URI
    if (router && props.pageURI) {
      try {
        if (route.params[props.pageNoKey]) {
          localPageNum = parseInt(route.params[props.pageNoKey]);
        } else if (route.query[props.pageNoKey]) {
          localPageNum = parseInt(route.query[props.pageNoKey] as string);
        }
        if (route.params[props.pageSizeKey]) {
          localPageSize = parseInt(route.params[props.pageSizeKey]);
        } else if (route.query[props.pageSizeKey]) {
          localPageSize = parseInt(route.query[props.pageSizeKey] as string);
        }
      } catch (err) {
        // ate by dog
      }
    }
    localPagination.value =
      hasPagination.value &&
      Object.assign({}, attrs.pagination as any, {
        current: localPageNum,
        pageSize: localPageSize,
        hideOnSinglePage: props.showPagination === 'auto',
        showSizeChanger: !!props.showSizeChanger,
      });

    watch([() => route.params, () => route.query], ([params, query]) => {
      if (router && localPagination.value && props.pageURI) {
        let page: number, size: number;
        // 如果 params 中存在 key, 则从 params 取值
        if (hasIn(params, props.pageNoKey)) {
          page = Number(params[props.pageNoKey]);
        } else {
          page = Number(query[props.pageNoKey]);
        }
        // 如果 params 中存在 key, 则 params 取值
        if (hasIn(params, props.pageSizeKey)) {
          size = Number(params[props.pageSizeKey]);
        } else {
          size = Number(query[props.pageSizeKey]);
        }

        let changed = false;
        if (!Number.isNaN(page) && page !== localPagination.value.current) {
          localPagination.value.current = page;
          changed = true;
        }

        if (!Number.isNaN(size) && size !== localPagination.value.pageSize) {
          localPagination.value.pageSize = size;
          changed = true;
        }

        changed && loadData();
      }
    });

    watch(localPagination, (pagination, old) => {
      if (router && props.pageURI && pagination) {
        // 如果是初始化，或者分页器没有变化，则不处理
        if (old === false || (pagination.current === old.current && pagination.pageSize === old.pageSize)) return;

        // query 直接修改原始值会报重复路由
        const query = JSON.parse(JSON.stringify(route.query));
        const params = route.params;
        // 如果 params 中存在 key, 则修改 params
        if (hasIn(params, props.pageNoKey)) {
          params[props.pageNoKey] = String(pagination.current || props.pageNum);
        } else {
          query[props.pageNoKey] = String(pagination.current || props.pageNum);
        }
        // 如果 params 中存在 key, 则修改 params
        if (hasIn(params, props.pageSizeKey)) {
          params[props.pageSizeKey] = String(pagination.pageSize || props.pageSize);
        } else {
          query[props.pageSizeKey] = String(pagination.pageSize || props.pageSize);
        }
        const { resolved } = router.resolve({ ...route, name: route.name!, params, query });
        resolved.fullPath !== route.fullPath &&
          router.replace(
            resolved.fullPath,
            () => {},
            (err) => {
              if (isNavigationFailure(err, NavigationFailureType.duplicated)) {
                // ignoer duplicated error
                return;
              }
              throw err;
            },
          );
      }
    });

    needTotalList.value = initTotalList(props.columns);
    selectedRow.keys = (attrs.rowSelection as any)?.selectedRowKeys || [];
    // 初始化加载数据
    loadData();

    expose({
      refresh,
      aTable: refs['aTable'] as AntTableProps,
    });

    return () => {
      const renderAlert = () => {
        // 绘制统计列数据
        const needTotalItems = needTotalList.value.map((item) => {
          return (
            <span style="margin-right: 12px">
              {typeof item.title === 'function' ? item.title(configProvider.i18nRender) : item.title}
              {configProvider.i18nRender(`${props.i18nKeyPrefix}.sum`, ' Sum')}:&nbsp;
              <a style="font-weight: 600">{!item.customRender ? item.total : item.customRender(item.total)}</a>
            </span>
          );
        });

        // 绘制 清空 按钮
        let clearItem;
        if (typeof props.alert === 'object' && props.alert.clear) {
          const callback = typeof props.alert.clear === 'function' ? props.alert.clear : () => {};
          clearItem = renderClear(callback);
        }

        // 绘制 alert 组件
        return (
          <Alert showIcon={true} style="margin-bottom: 4px;">
            <template slot="message">
              <span style="margin-right: 12px">
                {configProvider.i18nRender(`${props.i18nKeyPrefix}.selected`, 'Selected')}:&nbsp;
                <a style="font-weight: 600">
                  {configProvider.i18nRender(
                    `${props.i18nKeyPrefix}.selected_row_count`,
                    `${selectedRow.items.length} Row(s)`,
                    {
                      count: selectedRow.items.length,
                    },
                  )}
                </a>
              </span>
              {needTotalItems}
              {clearItem}
            </template>
          </Alert>
        );

        // 处理交给 table 使用者去处理 clear 事件时，内部选中统计同时调用
        function renderClear(callback: () => void) {
          if (selectedRow.keys.length <= 0) return null;
          return (
            <a
              style="margin-left: 24px"
              onClick={() => {
                callback();
                handleClearSelected();
              }}
            >
              {configProvider.i18nRender(`${props.i18nKeyPrefix}.clear`, 'Clear')}
            </a>
          );
        }
      };

      const tableProps = {
        ...attrs,
        columns: props.columns,
        dataSource: localDataSource.value,
        pagination: localPagination.value,
        loading: loading.value,
        bodyStyle: {
          overflowX: 'auto',
          overflowY: 'auto',
        },
        rowSelection: localRowSelection.value,
      };

      const tableListeners = {
        ...listeners,
        change: loadData,
      };

      return (
        <div class="table-wrapper">
          {showAlert.value ? renderAlert() : null}
          <Table
            {...{
              props: tableProps,
              ref: 'aTable',
              on: tableListeners,
              scopedSlots: slots,
            }}
          ></Table>
        </div>
      );
    };
  },
});
