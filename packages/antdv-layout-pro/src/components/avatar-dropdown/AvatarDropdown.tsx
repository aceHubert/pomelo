import { defineComponent, getCurrentInstance, ref, watch } from 'vue-demi';
import { Avatar, Icon, Popover, Menu, Modal } from 'ant-design-vue';
import abstractTooltipProps from 'ant-design-vue/lib/tooltip/abstractTooltipProps';
import { omit } from '@ace-util/core';
import { useConfigProvider } from '../../shared';

// Types
import type { Avatar as AvatarProps } from 'ant-design-vue/types/avatar';
import type { Tooltip as TooltipProps } from 'ant-design-vue/types/tootip/tooltip';
import type { OmitVue } from '../../types';

export enum AvatarDropdownAction {
  Profile = 'profile',
  Settings = 'settings',
  SignOut = 'signout',
}

export type AvatarDropdownProps = {
  /** 显示名 */
  name?: string;
  /** 头像图片路径 */
  src?: string;
  /** 头像大小 */
  avatarProps?: Omit<OmitVue<AvatarProps>, 'src'>;
  /** 当没有头像图片但有用户名（显示用户名第一个字母），显示的文字颜色 */
  avatarColor?: string;
  /** 当没有头像图片但有用户名（显示用户名第一个字母），显示的背景色 */
  avatarBackgroundColor?: string;
  /** 禁用 Popover 显示 */
  popoverDisabled?: boolean;
  /** customized class prefix */
  prefixCls?: string;
  /** 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text */
  i18nKeyPrefix?: string;
} & OmitVue<TooltipProps>;

const props = abstractTooltipProps();
export default defineComponent({
  name: 'AvatarDropdown',
  props: {
    ...props,
    name: String,
    src: String,
    avatarProps: Object,
    avatarColor: { type: String, default: '#fff' },
    avatarBackgroundColor: { type: String, default: '#f67280' },
    popoverDisabled: { type: Boolean, default: false },
    prefixCls: String,
    i18nKeyPrefix: { type: String, default: 'components.avatar_dropdown' },
  },
  emits: ['action', 'visibleChange'],
  setup(props: AvatarDropdownProps, { slots, emit }) {
    const currentInstance = getCurrentInstance();
    const configProvider = useConfigProvider();

    const customizePrefixCls = props.prefixCls;
    const getPrefixCls = configProvider.getPrefixCls;
    const prefixCls = getPrefixCls('avatar-dropdown', customizePrefixCls);
    const popoverProps = omit(props, [
      'name',
      'src',
      'avatarProps',
      'avatarColor',
      'avatarBackgroundColor',
      'popoverDisabled',
      'prefixCls',
      'i18nKeyPrefix',
      'visible',
    ]);

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

    const handleMenuClick = (key: AvatarDropdownAction | string) => {
      visibleRef.value = false;
      if (key === AvatarDropdownAction.SignOut) {
        Modal.confirm({
          title: configProvider.i18nRender(`${props.i18nKeyPrefix}.dialog.signout.title`, 'Confirm'),
          content: configProvider.i18nRender(`${props.i18nKeyPrefix}.dialog.signout.content`, 'Do you really log-out?'),
          okText: configProvider.i18nRender(`${props.i18nKeyPrefix}.dialog.signout.ok_text`, 'Yes') as string,
          cancelText: configProvider.i18nRender(`${props.i18nKeyPrefix}.dialog.signout.cancel_text`, 'No') as string,
          parentContext: currentInstance?.proxy, // 使弹窗应用 ConfigProvider
          onOk: () => {
            emit('action', key);
          },
          // onCancel() {},
        });
      } else {
        emit('action', key);
      }
    };

    const defaultMenus = () => [
      <Menu.Item key={AvatarDropdownAction.Profile}>
        <Icon type="user" />
        {configProvider.i18nRender(`${props.i18nKeyPrefix}.user.profile`, 'Profile')}
      </Menu.Item>,
      <Menu.Item key={AvatarDropdownAction.Settings}>
        <Icon type="setting" />
        {configProvider.i18nRender(`${props.i18nKeyPrefix}.user.settings`, 'Settings')}
      </Menu.Item>,
      <Menu.Divider />,
    ];

    return () => {
      const content = (
        <div class={`${prefixCls}__wrapper`}>
          <div class={`${prefixCls}-avatar__wrapper`}>
            {slots.avatar?.() ??
              (props.src ? (
                <Avatar
                  class={`${prefixCls}__avatar`}
                  props={{
                    ...props.avatarProps,
                    src: props.src,
                    alt: props.avatarProps?.alt ?? props.name ?? props.src,
                    size: props.avatarProps?.size ?? 'small',
                  }}
                />
              ) : props.name ? (
                <Avatar
                  class={`${prefixCls}__avatar`}
                  style={{ color: props.avatarColor, backgroundColor: props.avatarBackgroundColor }}
                  props={{
                    ...props.avatarProps,
                    alt: props.avatarProps?.alt ?? props.name ?? props.src,
                    size: props.avatarProps?.size ?? 'small',
                  }}
                >
                  {props.name.substr(0, 1).toUpperCase()}
                </Avatar>
              ) : (
                <Avatar
                  class={`${prefixCls}__avatar`}
                  props={{
                    ...props.avatarProps,
                    size: props.avatarProps?.size ?? 'small',
                    icon: 'user',
                  }}
                />
              ))}
          </div>
          <div class={[`${prefixCls}-name__wrapper`, { 'pl-2': slots.name || props.name || slots.description }]}>
            {(slots.name || props.name) && (
              <p class={`${prefixCls}__name`} title={slots.name?.() ?? props.name}>
                {slots.name?.() ?? props.name}
              </p>
            )}
            {slots.description && <div class={`${prefixCls}__description`}>{slots.description()}</div>}
          </div>
        </div>
      );

      return props.popoverDisabled ? (
        content
      ) : (
        <Popover
          vModel={visibleRef.value}
          class={`${prefixCls}-popover`}
          props={{
            ...popoverProps,
            overlayClassName: `${prefixCls}-overlay ${popoverProps?.overlayClassName ?? ''}`,
          }}
        >
          {content}
          <template slot="content">
            <Menu class={`${prefixCls}-overlay__menu`} selected-keys={[]} onClick={({ key }) => handleMenuClick(key)}>
              {slots.menuItems ? slots.menuItems(defaultMenus) : defaultMenus}
              <Menu.Item key={AvatarDropdownAction.SignOut}>
                <Icon type="logout" />
                {configProvider.i18nRender(`${props.i18nKeyPrefix}.user.signout`, 'Sign out')}
              </Menu.Item>
            </Menu>
          </template>
        </Popover>
      );
    };
  },
});
