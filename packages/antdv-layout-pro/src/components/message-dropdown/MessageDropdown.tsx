import { defineComponent, ref, watch } from 'vue-demi';
import { Badge, Button, Empty, Popover, Icon, List } from 'ant-design-vue';
import abstractTooltipProps from 'ant-design-vue/lib/tooltip/abstractTooltipProps';
import { omit } from '@ace-util/core';
import { useConfigProvider } from '../../shared';

// Types
import type { Tooltip as TooltipProps } from 'ant-design-vue/types/tootip/tooltip';
import type { MessageConfig, OmitVue } from '../../types';

export type MessageDropdownProps = {
  /** 消息数量 */
  count?: number;
  /** 消息内容 */
  messages?: MessageConfig[];
  /** customized class prefix */
  prefixCls?: string;
  /** 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text */
  i18nKeyPrefix?: string;
} & OmitVue<TooltipProps>;

const props = abstractTooltipProps();
export default defineComponent({
  name: 'MessageDropdown',
  props: {
    ...props,
    count: Number,
    messages: Array,
    prefixCls: String,
    i18nKeyPrefix: { type: String, default: 'components.message_dropdown' },
  },
  emits: ['showMore', 'view', 'read', 'visibleChange'],
  setup(props: MessageDropdownProps, { emit, listeners, slots }) {
    const configProvider = useConfigProvider();

    const customizePrefixCls = props.prefixCls;
    const getPrefixCls = configProvider.getPrefixCls;
    const prefixCls = getPrefixCls('message-dropdown', customizePrefixCls);
    const popoverProps = omit(props, ['count', 'messages', 'prefixCls', 'i18nKeyPrefix', 'visible']);

    const visibleRef = ref(props.visible ?? false);

    watch(visibleRef, (value) => {
      emit('visibleChange', value);
    });

    watch(
      () => props.visible,
      (value) => {
        visibleRef.value = value ?? false;
      },
    );

    return () => {
      return (
        <Popover
          vModel={visibleRef.value}
          class={`${prefixCls}-popover`}
          props={{
            ...popoverProps,
            overlayClassName: `${prefixCls}-overlay ${popoverProps?.overlayClassName ?? ''}`,
          }}
        >
          <span class={`${prefixCls}__wrapper`}>
            {slots.default ? (
              slots.default(props.count)
            ) : (
              <Badge dot={!!props.count}>
                <Icon type="mail" />
              </Badge>
            )}
          </span>
          <template slot="content">
            <div class={`${prefixCls}-overlay__container`}>
              {props.messages?.length ? (
                <List
                  class={`${prefixCls}-list`}
                  size="small"
                  item-layout="vertical"
                  data-source={props.messages}
                  {...{
                    scopedSlots: {
                      renderItem: (item: MessageConfig) => (
                        <List.Item>
                          <List.Item.Meta title={item.title} description={item.content}></List.Item.Meta>
                          <div class={`${prefixCls}-list__content`}>
                            {listeners.read && (
                              <Button type="link" size="small" onClick={() => emit('read', item)}>
                                {configProvider.i18nRender(
                                  `${props.i18nKeyPrefix}.item.make_as_read_link_text`,
                                  'Make as read',
                                )}
                              </Button>
                            )}
                            {item.to && listeners.view ? (
                              <Button type="link" size="small" onClick={() => emit('view', item)}>
                                {configProvider.i18nRender(`${props.i18nKeyPrefix}.item.view_link_text`, 'View')}
                              </Button>
                            ) : null}
                          </div>
                        </List.Item>
                      ),
                    },
                  }}
                >
                  {(props.count || 0) > props.messages.length ? (
                    <div
                      slot="loadMore"
                      style={{ textAlign: 'center', marginTop: '12px', height: '32px', lineHeight: '32px' }}
                    >
                      <Button onClick={() => emit('showMore')}>
                        {configProvider.i18nRender(`${props.i18nKeyPrefix}.show_more_btn_text`, 'Show more')}
                      </Button>
                    </div>
                  ) : null}
                </List>
              ) : (
                <Empty
                  class={`${prefixCls}-empty`}
                  description={configProvider.i18nRender(`${props.i18nKeyPrefix}.no_messasge_text`, 'No new messages!')}
                />
              )}
            </div>
          </template>
        </Popover>
      );
    };
  },
});
