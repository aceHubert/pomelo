import { defineComponent, ref, reactive, watch, nextTick } from 'vue-demi';
import { isNavigationFailure, NavigationFailureType } from 'vue-router';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { Button, Col, Row, Divider, Form, Input, Select, Popover, Tooltip, Space } from 'ant-design-vue';
import { useConfigProvider } from '../../shared';

/**
 * 状态配置
 * 当 value 为 object 时，key 为 URI query key
 * 每一项是平等关系
 * 例如：
 * [
 * {value:1} // ?[statusName]=1
 * {value:{author:2,type:post}} // ?author=2&type=post
 * ]
 */
export type StatusOption = {
  value: string | number | undefined | Record<string, string | number>;
  label: string;
  count: number;
  tooltip?: string;
  /** 一直显示当前状态(option.keepStatusShown, prop.keepStatusShown, count > 0 任一条件满足即显示)，默认：false */
  keepStatusShown?: boolean;
};

/**
 * 批量操作配置
 */
export type BulkAcitonOption = {
  value: string | number;
  label: string;
};

export type SearchFromProps = {
  prefixCls?: string;
  /**  keyword input placeholder */
  keywordPlaceholder?: string;
  /** 关键字名字，显示到 URI query 中的 key, 默认：keyword */
  keywordName: string;
  /** 关键字类型下拉框选项 */
  keywordTypeOptions?: Array<{ label: string; value: string | number; default?: true }>;
  /** 关键字类型名字，显示 URI query 中的 key, 默认为：keywordType */
  keywordTypeName: string;
  /** 状态名字，显示到 URI query 中的 key, 默认：status */
  statusName: string;
  /** 左上角状态搜索链接配置 */
  statusOptions?: StatusOption[];
  /** 一直显示所有状态（statusOptions 中的配置会抵消），默认：count > 0 的时候才显示 */
  keepStatusShown: boolean;
  /** 批量操作，如果没有选项则不显示 */
  bulkAcitonOptions?: BulkAcitonOption[];
  /** apply 按纽 loading 状态 */
  bulkApplying?: boolean;
  /** dataSource 行数（显示在表格的右上角）, 当 >0 时显示批量操作, 当scopedSlots.filterRight 有设置时，右上角行数不显示 */
  rowCount?: number;
  /** 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text */
  i18nKeyPrefix: string;
};

/**
 * SearchForm
 * 路由初始化参数
 * query:{
 *  [keyword]: keywrod,
 *  [status]: status
 *  ...
 * }
 */
export default defineComponent({
  name: 'SearchFrom',
  emits: ['search', 'bulkApply'],
  props: {
    prefixCls: String,
    keywordPlaceholder: String,
    keywordName: { type: String, default: 'keyword' },
    keywordTypeOptions: Array,
    keywordTypeName: { type: String, default: 'keywordType' },
    statusName: { type: String, default: 'status' },
    statusOptions: Array,
    keepStatusShown: { type: Boolean, default: false },
    bulkAcitonOptions: Array,
    bulkApplying: Boolean,
    rowCount: Number,
    i18nKeyPrefix: { type: String, default: 'components.search_form' },
  },
  setup(props: SearchFromProps, { emit, slots }) {
    const router = useRouter();
    const route = useRoute();
    const configProvider = useConfigProvider();

    const localKeyword = reactive<{
      value: string;
      type: string | number | undefined;
    }>({
      value: '',
      type: undefined,
    });
    const localStatus = ref<StatusOption['value']>();
    const bulkAciton = ref<BulkAcitonOption['value']>();

    const defaultKeywordType = props.keywordTypeOptions?.find((option) => option.default)?.value;
    if (defaultKeywordType) {
      updateRouteQuery({
        [props.keywordTypeName]: defaultKeywordType,
      });
    }

    watch(
      () => route.query,
      (query, oldQuery) => {
        localKeyword.value = (query[props.keywordName] as string) || '';
        localKeyword.type = query[props.keywordTypeName] as string;
        localStatus.value = query[props.statusName] as string;

        const keys = [props.keywordName, props.keywordTypeName, props.statusName];
        if (
          (!oldQuery && keys.some((key) => key in query)) || // 如果 URI query 中有 keywordTypeName, keywordName, statusName 任一项，则触发搜索
          (oldQuery && keys.some((key) => query[key] !== oldQuery[key])) // 如果 URI query 中 keywordTypeName, keywordName, statusName 任一项发生变化，则触发搜索
        ) {
          emit('search', {
            [props.keywordName]: localKeyword.value,
            ...(props.keywordTypeOptions?.length ? { [props.keywordTypeName]: localKeyword.type } : {}),
            ...(props.statusOptions?.length ? { [props.statusName]: localStatus.value } : {}),
          });
        }
      },
      {
        immediate: true,
      },
    );

    function getStatusUrl(option: StatusOption) {
      const query: Record<string, string | undefined> = {
        [props.statusName]: void 0, // 清空状态参数
      };

      // 清空匿名参数
      props.statusOptions
        ?.filter((option) => typeof option.value === 'object')
        .forEach((option) => {
          Object.entries(option.value as Record<string, any>).forEach(([key]) => {
            query[key] = void 0; // 清空状态参数
          });
        });

      if (typeof option.value === 'object') {
        Object.entries(option.value).forEach(([key, value]) => {
          query[key] = String(value);
        });
      } else if (option.value !== void 0) {
        query[props.statusName] = String(option.value);
      }

      const newQuery = { ...route.query, ...query };
      // 移除 undefined 值后的值才能与 href 比较 exact mode
      for (const key in newQuery) {
        if (typeof newQuery[key] === 'undefined') {
          delete newQuery[key];
        }
      }

      return { query: newQuery };
    }

    function updateRouteQuery(query: Record<string, string | number | undefined>) {
      const oldQuery = route.query;
      const path = route.path;
      // 对象的拷贝
      const newQuery = Object.assign(JSON.parse(JSON.stringify(oldQuery)), query);
      // 移除 undefined 值
      for (const key in newQuery) {
        if (typeof newQuery[key] === 'undefined') {
          delete newQuery[key];
        }
      }

      // nuxtjs 重写了push 方法，无法调用Promise
      router.replace(
        { path, query: newQuery },
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

    const handleSearch = () => {
      const query = {
        [props.keywordTypeName]: localKeyword.type || void 0,
        [props.keywordName]: localKeyword.value || void 0,
      };

      updateRouteQuery(query);
    };

    const handleBulkAction = () => {
      if (bulkAciton.value) {
        emit('bulkApply', bulkAciton.value);
        nextTick(() => {
          bulkAciton.value = void 0;
        });
      }
    };

    return () => {
      const customizePrefixCls = props.prefixCls;
      const getPrefixCls = configProvider.getPrefixCls;
      const prefixCls = getPrefixCls('search-form', customizePrefixCls);

      return (
        <div class={`${prefixCls}-wrapper`}>
          {props.statusOptions?.length ? (
            <ul class={`${prefixCls}-sub`}>
              {props.statusOptions.map((option, index) =>
                option.keepStatusShown || props.keepStatusShown || option.count > 0 ? (
                  <li class={`${prefixCls}-sub__item`}>
                    {index !== 0 ? <Divider type="vertical" /> : null}
                    <Tooltip title={option.tooltip || option.label}>
                      <router-link
                        to={getStatusUrl(option)}
                        class={`${prefixCls}-sub__item-link`}
                        activeClass=""
                        exactActiveClass="active"
                        exact
                        replace
                      >
                        {option.label}
                        {option.count > 0 ? <span>({option.count})</span> : null}
                      </router-link>
                    </Tooltip>
                  </li>
                ) : null,
              )}
            </ul>
          ) : slots.sub ? (
            <div class={`${prefixCls}-sub__slot`}>{slots.sub()}</div>
          ) : null}
          <Form layout="inline" size="small" class={`${prefixCls}-content`}>
            <Row>
              <Col md={{ span: 16, offset: 8 }} sm={24}>
                <Form.Item class={`${prefixCls}-content__input-item`}>
                  <Space>
                    <Input.Search
                      vModel={localKeyword.value}
                      placeholder={
                        props.keywordPlaceholder ||
                        configProvider.i18nRender(`${props.i18nKeyPrefix}.keyword_placeholder`, 'Search')
                      }
                      onSearch={() => handleSearch()}
                      scopedSlots={{
                        addonBefore: () =>
                          props.keywordTypeOptions?.length ? (
                            <Select
                              vModel={localKeyword.type}
                              options={props.keywordTypeOptions}
                              style="width:90px;"
                            ></Select>
                          ) : null,
                      }}
                    />
                    {slots.search ? (
                      <Popover
                        placement="bottomRight"
                        scopedSlots={{
                          content: () => (
                            <Form layout="inline" size="small" class={`${prefixCls}-popover-search-form`}>
                              {slots.search!()}
                            </Form>
                          ),
                        }}
                      >
                        <Button icon="filter" />
                      </Popover>
                    ) : null}
                  </Space>
                </Form.Item>
              </Col>
            </Row>
            {props.bulkAcitonOptions?.length || props.rowCount || slots.filter || slots.filterRight ? (
              <Row class={`${prefixCls}-content__filter-row`} type="flex" justify="space-between" align="bottom">
                <Col md={16} xs={24}>
                  <Space size="middle" style="flex-wrap: wrap;">
                    {props.rowCount && props.rowCount > 0 && props.bulkAcitonOptions?.length ? (
                      <Form.Item>
                        <Space>
                          <Select
                            vModel={bulkAciton.value}
                            placeholder={configProvider.i18nRender(
                              `${props.i18nKeyPrefix}.bulk_action_placeholder`,
                              'Bulk actions',
                            )}
                            style="min-width:120px;"
                          >
                            {props.bulkAcitonOptions.map((option) => (
                              <Select.Option value={option.value}>{option.label}</Select.Option>
                            ))}
                          </Select>
                          <Button
                            ghost
                            type="primary"
                            loading={props.bulkApplying}
                            title={configProvider.i18nRender(`${props.i18nKeyPrefix}.bulk_apply_btn_tips`, 'Apply')}
                            onClick={() => handleBulkAction()}
                          >
                            {configProvider.i18nRender(`${props.i18nKeyPrefix}.bulk_apply_btn_text`, 'Apply')}
                          </Button>
                        </Space>
                      </Form.Item>
                    ) : null}
                    <Form.Item>
                      <Space>{slots.filter ? slots.filter() : null}</Space>
                    </Form.Item>
                  </Space>
                </Col>
                <Col md={8} xs={24}>
                  {slots.filterRight ? (
                    <Form.Item class={`${prefixCls}-content__filter-right`}>
                      <Space size="middle" style="flex-wrap: wrap;">
                        {slots.filterRight()}
                      </Space>
                    </Form.Item>
                  ) : props.rowCount ? (
                    <Form.Item class={`${prefixCls}-content__count-item`}>
                      <span>
                        {configProvider.i18nRender(`${props.i18nKeyPrefix}.row_count`, `${props.rowCount} Rows(s)`, {
                          count: props.rowCount,
                        })}
                      </span>
                    </Form.Item>
                  ) : null}
                </Col>
              </Row>
            ) : null}
          </Form>
        </div>
      );
    };
  },
});
