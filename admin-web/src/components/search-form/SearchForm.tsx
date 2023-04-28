import { defineComponent, reactive, watch, inject, nextTick } from '@vue/composition-api';
import { Button, Col, Row, Divider, Form, Input, Select, Tooltip, Space } from 'ant-design-vue';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { ConfigConsumerProps } from '../config-provider';

// Types
import { ConfigProviderProps } from '../config-provider/ConfigProvider';

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
  value: string | number | undefined | Dictionary<string | number>;
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
  /** 状态名字，显示到 URI query 中的 key, 默认：status */
  statusName: string;
  /** 左上角状态搜索链接配置 */
  statusOptions: StatusOption[];
  /** 一直显示所有状态（statusOptions 中的配置会抵消），默认：count > 0 的时候才显示 */
  keepStatusShown: boolean;
  /** 批量操作，如果没有选项则不显示 */
  bulkAcitonOptions: BulkAcitonOption[];
  /** apply 按纽 loading 状态 */
  bulkApplying?: boolean;
  /** dataSource 行数（显示在表格的右上角）, 当 >0 时显示批量操作, 当scopedSlots.filterRight 有设置时，右上角行数不显示 */
  rowCount?: number;
  /** 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text */
  i18nKeyPrefix: string;
};

/**
 * 路由初始化参数
 * query:{
 *  [keyword]: keywrod,
 *  [status]: status
 * }
 */
export default defineComponent({
  name: 'SearchFrom',
  emits: ['search', 'bulkApply'],
  props: {
    prefixCls: String,
    keywordPlaceholder: String,
    keywordName: { type: String, default: 'keyword' },
    statusName: { type: String, default: 'status' },
    statusOptions: { type: Array, default: () => [] },
    keepStatusShown: { type: Boolean, default: false },
    bulkAcitonOptions: { type: Array, default: () => [] },
    bulkApplying: Boolean,
    rowCount: Number,
    i18nKeyPrefix: { type: String, default: 'components.search_form' },
  },
  setup(props: SearchFromProps, { emit, slots }) {
    const router = useRouter();
    const route = useRoute();
    const configProvider = inject<ConfigProviderProps>('configProvider', ConfigConsumerProps);

    const data = reactive({
      localeKeyword: '',
      localeStatus: void 0 as StatusOption['value'],
      bulkAciton: '',
    });

    watch(
      () => route.query,
      (query) => {
        data.localeKeyword = (query[props.keywordName] as string) || '';
        data.localeStatus = query[props.statusName] as string;
      },
      {
        immediate: true,
      },
    );

    watch([() => data.localeStatus, () => data.localeKeyword], ([status, keywork]) => {
      nextTick(() => {
        emit('search', {
          [props.keywordName]: keywork,
          [props.statusName]: status,
        });
      });
    });

    const getStatusUrl = (option: StatusOption) => {
      const query: Dictionary<string | undefined> = {
        [props.statusName]: void 0, // 清空状态参数
      };

      // 清空匿名参数
      props.statusOptions
        .filter((option) => typeof option.value === 'object')
        .forEach((option) => {
          Object.entries(option.value as Dictionary<any>).forEach(([key]) => {
            query[key] = void 0;
          });
        });

      if (typeof option.value === 'object') {
        Object.entries(option.value).forEach(([key, value]) => {
          query[key] = String(value);
        });
      } else if (option.value) {
        query[props.statusName] = String(option.value);
      }
      return { query: { ...route.query, ...query } };
    };

    const handleSearch = () => {
      const query: Dictionary<any> = {
        [props.keywordName]: data.localeKeyword || void 0,
      };

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
      router.replace({ path, query: newQuery });
    };

    const handleBulkAction = () => {
      if (data.bulkAciton) {
        emit('bulkApply', data.bulkAciton);
        nextTick(() => {
          data.bulkAciton = '';
        });
      }
    };

    return () => {
      const customizePrefixCls = props.prefixCls;
      const getPrefixCls = configProvider.getPrefixCls;
      const prefixCls = getPrefixCls('search-form', customizePrefixCls);

      return (
        <div class={`${prefixCls}-wrapper`}>
          {props.statusOptions.length ? (
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
                  <Input.Search
                    value={data.localeKeyword}
                    placeholder={
                      props.keywordPlaceholder ||
                      configProvider.i18nRender(`${props.i18nKeyPrefix}.keyword_placeholder`, 'Search')
                    }
                    onInput={(e: InputEvent) => (data.localeKeyword = (e.target as any).value)}
                    onSearch={() => handleSearch()}
                  />
                </Form.Item>
              </Col>
            </Row>
            {props.bulkAcitonOptions.length || props.rowCount || slots.filter || slots.filterRight ? (
              <Row class={`${prefixCls}-content__filter-row`} type="flex" justify="space-between" align="bottom">
                <Col md={16} xs={24}>
                  <Space size="middle" style="flex-wrap: wrap;">
                    {props.rowCount && props.rowCount > 0 ? (
                      <Form.Item>
                        <Space>
                          <Select
                            value={data.bulkAciton}
                            style="min-width:120px;"
                            onChange={(value: string) => (data.bulkAciton = value)}
                          >
                            <Select.Option value="">
                              {configProvider.i18nRender(
                                `${props.i18nKeyPrefix}.bulk_action_placeholder`,
                                'Bulk actions',
                              )}
                            </Select.Option>
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
                    <Space size="middle" style="flex-wrap: wrap;">
                      {slots.filterRight()}
                    </Space>
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
