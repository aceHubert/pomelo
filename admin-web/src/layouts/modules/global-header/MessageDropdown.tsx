import { defineComponent, PropType, inject } from '@vue/composition-api';
import { Badge, Button, Empty, Popover, Icon, List } from 'ant-design-vue';
import { ConfigConsumerProps } from '@/components/config-provider/configConsumerProps';
import './styles/message-dropdown.less';

// Types
import { Popover as PopoverProps } from 'ant-design-vue/types/popover';
import type { ConfigProviderProps } from '@/components/config-provider/ConfigProvider';
import { MessageConfig } from '@/types';

export default defineComponent({
  name: 'MessageDropdown',
  emits: ['showMore'],
  props: {
    /** 消息数量 */
    count: { type: Number as PropType<number> },
    /** 消息内容 */
    messages: { type: Array as PropType<MessageConfig[]>, default: () => [] },
    /** 下拉选项显示位置 */
    placement: { type: String as PropType<PopoverProps['placement']>, default: 'bottomRight' },
    /** 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text */
    i18nKeyPrefix: { type: String as PropType<string>, default: 'components.message_dropdown' },
  },
  setup(props, { emit, slots }) {
    const configProvider = inject<ConfigProviderProps>('configProvider', ConfigConsumerProps);

    const prefixCls = 'global-header-message';

    return () => (
      <Popover class={`${prefixCls}-popover`} overlayClassName={`${prefixCls}-overlay`} placement={props.placement}>
        <span>
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
            {props.messages.length ? (
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
                          {item.to ? (
                            <Button type="link" onClick={() => emit('itemView', item)}>
                              {configProvider.i18nRender(`${props.i18nKeyPrefix}.item.view_link_text`, 'View')}
                            </Button>
                          ) : (
                            <Button type="link" onClick={() => emit('makeAsRead', item)}>
                              {configProvider.i18nRender(
                                `${props.i18nKeyPrefix}.item.make_as_read_link_text`,
                                'Make as read',
                              )}
                            </Button>
                          )}
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
  },
});
