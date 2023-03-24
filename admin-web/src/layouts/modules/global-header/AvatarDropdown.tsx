import { defineComponent, PropType, inject } from '@vue/composition-api';
import { Avatar, Icon, Popover, Menu } from 'ant-design-vue';
import { Modal } from '@/components';
import { ConfigConsumerProps } from '@/components/config-provider/configConsumerProps';
import './styles/avatar-dropdown.less';

// Types
import { Popover as PopoverProps } from 'ant-design-vue/types/popover';
import type { ConfigProviderProps } from '@/components/config-provider/ConfigProvider';

export enum AvatarDropdownAction {
  Profile = 'profile',
  Settings = 'settings',
  SignOut = 'signout',
}

export default defineComponent({
  name: 'AvatarDropdown',
  emits: ['action'],
  props: {
    /** 用户名 */
    username: { type: String as PropType<string> },
    /** 头像图片路径 */
    imgSrc: { type: String as PropType<string> },
    /** 显示下拉菜位置 */
    placement: { type: String as PropType<PopoverProps['placement']>, default: 'bottomRight' },
    /** 当没有头像图片但有用户名（显示用户名第一个字母），显示的背景色 */
    backgroundColor: { type: String as PropType<string>, default: '#f67280' },
    /** 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text */
    i18nKeyPrefix: { type: String as PropType<string>, default: 'components.avatar_dropdown' },
  },
  setup(props, { slots, emit }) {
    const configProvider = inject<ConfigProviderProps>('configProvider', ConfigConsumerProps);

    const prefixCls = 'global-header-avatar';

    const handleAction = (key: AvatarDropdownAction) => {
      emit('action', key);
    };

    const handleLogout = () => {
      Modal.confirm({
        title: configProvider.i18nRender(`${props.i18nKeyPrefix}.dialog.signout.title`, 'Message'),
        content: configProvider.i18nRender(`${props.i18nKeyPrefix}.dialog.signout.content`, 'Do you really log-out?'),
        okText: configProvider.i18nRender(`${props.i18nKeyPrefix}.dialog.signout.ok_text`, 'Yes') as string,
        cancelText: configProvider.i18nRender(`${props.i18nKeyPrefix}.dialog.signout.cancel_text`, 'No') as string,
        onOk: () => {
          handleAction(AvatarDropdownAction.SignOut);
        },
        // onCancel() {},
      });
    };

    const defaultMenus: any[] = [
      <Menu.Item key="profile" onClick={() => handleAction(AvatarDropdownAction.Profile)}>
        <Icon type="user" />
        {configProvider.i18nRender(`${props.i18nKeyPrefix}.user.profile`, 'Profile')}
      </Menu.Item>,
      <Menu.Item key="settings" onClick={() => handleAction(AvatarDropdownAction.Settings)}>
        <Icon type="setting" />
        {configProvider.i18nRender(`${props.i18nKeyPrefix}.user.settings`, 'Settings')}
      </Menu.Item>,
      <Menu.Divider />,
    ];

    return () => (
      <Popover class={`${prefixCls}-popover`} overlayClassName={`${prefixCls}-overlay`} placement={props.placement}>
        <span>
          {props.imgSrc ? (
            <Avatar size="small" class={`${prefixCls}__avatar`} src={props.imgSrc} />
          ) : props.username ? (
            <Avatar
              size="small"
              class={`${prefixCls}__avatar`}
              style={{ color: '#fff', backgroundColor: props.backgroundColor }}
            >
              {props.username.substr(0, 1).toUpperCase()}
            </Avatar>
          ) : (
            <Avatar size="small" icon="user" class={`${prefixCls}__avatar`} />
          )}
          <span class={`${prefixCls}__name`}>{props.username || ''}</span>
        </span>
        <template slot="content">
          <Menu class={`${prefixCls}-overlay__menu`} selected-keys={[]}>
            {slots.menuItems ? slots.menuItems(defaultMenus) : defaultMenus}
            <Menu.Item key="signout" onClick={handleLogout.bind(this)}>
              <Icon type="logout" />
              {configProvider.i18nRender(`${props.i18nKeyPrefix}.user.signout`, 'Sign out')}
            </Menu.Item>
          </Menu>
        </template>
      </Popover>
    );
  },
});
