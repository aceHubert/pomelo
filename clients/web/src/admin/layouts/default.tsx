import { defineComponent, ref, computed, onMounted, nextTick } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { isAbsoluteUrl } from '@ace-util/core';
import { Icon, Space, Tooltip, Menu, Spin } from 'ant-design-vue';
import {
  ConfigProvider,
  LayoutAdmin,
  AvatarDropdown,
  LocaleDropdown,
  MessageDropdown,
  SettingDrawer,
  type AvatarDropdownAction,
} from 'antdv-layout-pro';
import {
  Theme,
  type MenuConfig,
  type MessageConfig,
  type BreadcrumbConfig,
  type LayoutType,
  type ContentWidth,
} from 'antdv-layout-pro/types';
import { OptionPresetKeys } from '@ace-pomelo/shared/client';
import { Modal, sanitizeComponent, ANT_PREFIX_CLS } from '@/components';
import { useUserManager, usePubSubMessage, useI18n, useOptions } from '@/composables';
import { useAppMixin, useDeviceMixin, useLocationMixin } from '@/mixins';
import { RouterView } from '@/layouts/components';
import { loadingRef } from '@/shared';
import { AuthTypeOptionName } from '@/constants';
import IconDarkTheme from '@admin/assets/icons/dark-theme.svg?inline';
import IconLightTheme from '@admin/assets/icons/light-theme.svg?inline';
import { getDefaultMenus } from '../configs/menu.config';
import classes from './default.module.less';

// Types
import type { AuthType } from '@/types';

export default defineComponent({
  name: 'DefaultLayout',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const i18n = useI18n();
    const homeUrl = useOptions(OptionPresetKeys.Home);
    const authType = useOptions<AuthType>(AuthTypeOptionName);
    const appMixin = useAppMixin();
    const deviceMixin = useDeviceMixin();
    const locationMixin = useLocationMixin();
    const userManager = useUserManager();
    const pubSubMessage = usePubSubMessage();

    const currentUser = ref<{ name: string; photo?: string }>();
    const menus = ref<MenuConfig[]>([]);
    const settingDrawerVisible = ref(false);

    // const serializeMenu = (menus: MenuModel[], parent?: MenuConfig): MenuConfig[] => {
    //   return menus.map((menu) => {
    //     const { id, action, position, display, breadcrumb, children, ...rest } = menu;
    //     const menuConfig: MenuConfig = {
    //       ...rest,
    //       key: String(id),
    //       position,
    //       display: display === false ? false : void 0,
    //       breadcrumb: breadcrumb === false ? false : void 0,
    //     };

    //     // 如果父节点和当前节点 position 一致，那么父节点的 path 变成 redirect
    //     if (parent?.path && parent.position === menu.position) {
    //       parent.redirect = parent.path;
    //       delete parent.path;
    //     }

    //     // 如果 top 菜单下有非 top 子菜单，那么 top 菜单的 action 变成 redirect
    //     if (menu.position === 'top' && children?.some((item) => item.position !== menu.position)) {
    //       // 如果 action 不在子菜单中，取第一个子菜单的 action
    //       const childActions = getChildActions(children);
    //       menuConfig.redirect = childActions.has(action) ? action : [...childActions][0];
    //     } else {
    //       menuConfig.path = action;
    //     }

    //     menuConfig.children = children ? serializeMenu(children, menuConfig) : undefined;
    //     return menuConfig;

    //     // 获取所有子菜单可执行的 action
    //     function getChildActions(children: MenuModel[]): Set<string> {
    //       const actions = new Set<string>();
    //       children.map((item) => {
    //         // 只取每个 position group 的最后一级 action
    //         if (!item.children || item.children.some((child) => item.position !== child.position)) {
    //           actions.add(item.action);
    //         }

    //         if (item.children) {
    //           getChildActions(item.children).forEach((action) => actions.add(action));
    //         }
    //       });

    //       return actions;
    //     }
    //   });
    // };

    // load menus from server
    // if (process.env.NODE_ENV === 'production' || process.env.VUE_APP_USE_REMOTE_MENU === 'true') {
    //   const clientId = getEnv<string>('oidc.client_id', '', window._ENV);
    //   userApi
    //     .getMenus({
    //       data: {
    //         clientId,
    //       },
    //     })
    //     .then(({ data }) => {
    //       menus.value = serializeMenu(data);

    //       // 如果没有菜单，显示 dashboard
    //       !menus.value.length &&
    //         (menus.value = [
    //           {
    //             key: 'dashboard',
    //             title: (i18nRender) => i18nRender('menu.dashboard', '仪表盘'),
    //             path: '/dashboard',
    //             alias: ['/'],
    //             icon: 'dashboard',
    //             position: 'top',
    //           },
    //         ]);
    //     });
    // } else {
    menus.value = getDefaultMenus(authType.value);
    // }

    const menuBreadcrumbs = ref<BreadcrumbConfig[]>([]);

    const disablePageBreadcrumb = computed(
      () =>
        (route.meta?.breadcrumb ??
          (route.matched.length
            ? sanitizeComponent(route.matched.slice(-1)[0].components.default).options.breadcrumb
            : void 0) ??
          true) === false,
    );

    const handleActionClick = (key: AvatarDropdownAction | 'password-modify' | 'select-account') => {
      switch (key) {
        case 'password-modify':
          userManager.modifyPassword();
          break;
        case 'setting-drawer':
          settingDrawerVisible.value = !settingDrawerVisible.value;
          break;
        case 'select-account':
          userManager.signin({
            noInteractive: true,
            popup: true,
            prompt: 'select_account',
          });
          break;
        case 'signout':
          // 以免多次调用跳转循环
          if (!router.currentRoute.path.startsWith('/signout')) {
            router.replace('/signout');
          }
          break;
        default:
          router.push({ name: key });
          break;
      }
    };

    const handleMessageView = (message: MessageConfig<string | { href: string; target?: '_self' | '_blank' }>) => {
      if (typeof message.to === 'string') {
        window.open(message.to, '_blank');
      } else if (message.to) {
        window.open(message.to.href, message.to.target);
      }
    };

    const handleMessageRead = (message: MessageConfig) => {
      pubSubMessage.value = pubSubMessage.value.filter((item) => item !== message);
      pubSubMessage.count -= 1;
      // TODO: make as read in server
    };

    const handleLocaleChange = (locale: string) => {
      i18n.locale = locale;
      // do something else
    };

    // const handleThemeChange = (value?: Theme) => {
    //   setColor({ theme: value ?? appMixin.theme === Theme.Dark ? Theme.Light : Theme.Dark });
    // };

    const handleMenuClick = (path: string, complete: () => void) => {
      if (!path) return;
      if (isAbsoluteUrl(path) && location.href === path) return;
      if (route.fullPath === path) return;

      locationMixin.goTo(path, {
        onComplete: complete,
      });
    };

    const handleBreadcrumbChange = (breadcrumb: BreadcrumbConfig[]) => {
      menuBreadcrumbs.value = breadcrumb.map(({ path, ...rest }) => ({
        ...rest,
        // replaceState 导制vue-router 与当前实际路由不一致，push/replace 时重复路由 UI 不刷新；
        // 增加临时方案 query 增加随机数解决 isSameRotue 问题
        path: path && `${path}${path.indexOf('?') >= 0 ? '&' : '?'}_t=${parseInt(String(Math.random() * 1000000))}`,
      }));
    };

    onMounted(() => {
      userManager.getUser().then(async (user) => {
        if (user) {
          currentUser.value = {
            name: user.profile.name ?? user.profile.display_name ?? '',
            photo:
              user.profile.picture ?? user.profile.avatar
                ? `${homeUrl}${user.profile.picture ?? user.profile.avatar}`
                : void 0, //`${process.env.BASE_URL}static/img/head_default.jpg`,
          };
        }
      });
    });

    return () => {
      const avatarMenuItems = [
        <Menu.Item key="setting-drawer">
          <Icon component={appMixin.theme === Theme.Dark ? IconDarkTheme : IconLightTheme} />
          {i18n.tv('layout_default.page_style_setting_title', '显示设置')}
        </Menu.Item>,
        <Menu.Item key="password-modify">
          <Icon type="key" />
          {i18n.tv('layout_default.avatar_menu_item.modify_password', '修改密码')}
        </Menu.Item>,
        // <Menu.Item key="select-account">
        //   <Icon type="swap" />
        //   {i18n.tv('layout_default.avatar_menu_item.select_account', '切换账号')}
        // </Menu.Item>,
      ];

      return (
        <ConfigProvider
          locale={appMixin.antLocales}
          prefixCls={ANT_PREFIX_CLS}
          theme={appMixin.theme}
          primaryColor={appMixin.primaryColor}
          device={deviceMixin.device}
          i18nRender={(...args: [string, string, Record<string, string>]) => i18n.tv(...args) as string}
        >
          <div>
            <LayoutAdmin
              class={classes.layoutWrapper}
              logo={appMixin.siteLogo}
              title={appMixin.siteTitle}
              menus={menus.value}
              layoutType={appMixin.layout.type}
              contentWidth={appMixin.layout.contentWidth}
              fixedHeader={appMixin.layout.fixedHeader}
              fixSiderbar={appMixin.layout.fixSiderbar}
              autoHideHeader={appMixin.layout.autoHideHeader}
              colorWeak={appMixin.layout.colorWeak}
              multiTab={
                appMixin.layout.multiTab && [
                  {
                    path: '/dashboard',
                    fullPath: '/dashboard',
                    title: '仪表盘',
                    closable: false,
                  },
                ]
              }
              sideCollapsed={appMixin.layout.sideCollapsed}
              initRouteChange={(callback) => {
                // 子应用路由变更使用 replaceState 时触发菜单更新
                const listener = () => {
                  nextTick(() => {
                    callback(router.resolve(location.pathname + location.search).href);
                  });
                };
                window.addEventListener('replaceState', listener, false);

                return () => {
                  window.removeEventListener('replaceState', listener, false);
                };
              }}
              scopedSlots={{
                headerActions: () => (
                  <Space size="middle">
                    <MessageDropdown
                      count={pubSubMessage.count}
                      messages={pubSubMessage.value}
                      onView={handleMessageView}
                      onRead={handleMessageRead}
                    ></MessageDropdown>
                    <LocaleDropdown
                      locale={i18n.locale}
                      supportLanguages={appMixin.supportLanguages}
                      placement="bottom"
                      scopedSlots={{
                        default: (locale) => locale.shortName ?? locale.name,
                      }}
                      onChange={handleLocaleChange}
                    />
                    <AvatarDropdown
                      style="max-width: 120px;"
                      name={currentUser.value?.name}
                      src={currentUser.value?.photo}
                      placement="bottomRight"
                      scopedSlots={{
                        menuItems: () => avatarMenuItems,
                      }}
                      onAction={handleActionClick}
                    />
                  </Space>
                ),
                siderActions: (collapsed) => (
                  <div class="pt-3 pb-5 px-3 bdr-t">
                    {/* Popover container 在 body 中会导致上面的 onMouseleaver 事件触发 */}
                    <div id="_popoverContainer"></div>
                    <Space direction="vertical" align="center" size="middle">
                      {collapsed && (
                        <MessageDropdown
                          count={pubSubMessage.count}
                          messages={pubSubMessage.value}
                          placement="rightBottom"
                          onView={handleMessageView}
                          onRead={handleMessageRead}
                        ></MessageDropdown>
                      )}
                      {collapsed && (
                        <LocaleDropdown
                          // class={['d-block pt-4', { 'text-center': collaspsed }]}
                          locale={i18n.locale}
                          supportLanguages={appMixin.supportLanguages}
                          placement="rightBottom"
                          arrowPointAtCenter
                          scopedSlots={{
                            default: (locale) => locale.shortName ?? locale.name,
                          }}
                          onChange={handleLocaleChange}
                        />
                      )}

                      <AvatarDropdown
                        src={currentUser.value?.photo}
                        name={currentUser.value?.name}
                        nameVisible={!collapsed}
                        avatarProps={{
                          size: collapsed ? 'small' : 'default',
                        }}
                        popoverDisabled={!collapsed}
                        placement="rightBottom"
                        scopedSlots={{
                          name: collapsed ? undefined : () => <span vShow={!collapsed}>{currentUser.value?.name}</span>,
                          description: collapsed
                            ? undefined
                            : () => (
                                <Space vShow={!collapsed}>
                                  <MessageDropdown
                                    count={pubSubMessage.count}
                                    messages={pubSubMessage.value}
                                    placement="topRight"
                                    onView={handleMessageView}
                                    onRead={handleMessageRead}
                                  ></MessageDropdown>
                                  <LocaleDropdown
                                    // class={['d-block pt-4', { 'text-center': collapsed }]}
                                    locale={i18n.locale}
                                    supportLanguages={appMixin.supportLanguages}
                                    placement="topRight"
                                    arrowPointAtCenter
                                    getPopupContainer={() =>
                                      // TIPS: refs 获取不到
                                      document.getElementById('_popoverContainer') ?? document.body
                                    }
                                    onChange={handleLocaleChange}
                                  />
                                  <Tooltip
                                    placement="topRight"
                                    title={i18n.tv('layout_default.signout.tooltip', '退出登录')}
                                  >
                                    <span
                                      onClick={() =>
                                        Modal.confirm({
                                          title: i18n.tv(`layout_default.signout.dialog.title`, '确认'),
                                          content: i18n.tv(`layout_default.signout.dialog.content`, '确认退出吗?'),
                                          okText: i18n.tv(`layout_default.signout.dialog.ok_text`, '是') as string,
                                          cancelText: i18n.tv(
                                            `layout_default.signout.dialog.cancel_text`,
                                            '否',
                                          ) as string,
                                          onOk: () => handleActionClick('signout'),
                                          // onCancel() {},
                                        })
                                      }
                                    >
                                      <Icon type="logout" />
                                    </span>
                                  </Tooltip>
                                </Space>
                              ),
                          menuItems: () => avatarMenuItems,
                        }}
                        onAction={handleActionClick}
                      />
                    </Space>
                  </div>
                ),
                footer: () => (
                  <div class={classes.footerWrapper}>
                    <div class="copyright">
                      <span>&#169;</span>2019-{new Date().getFullYear()} <span> Pomelo </span>
                    </div>
                  </div>
                ),
              }}
              onMenuClick={handleMenuClick}
              onBreadcrumbChange={handleBreadcrumbChange}
            >
              <LayoutAdmin.BreadcrumbProvider breadcrumb={menuBreadcrumbs.value}>
                <LayoutAdmin.NestedBreadcrumb breadcrumb={!disablePageBreadcrumb.value}>
                  <Spin
                    class={classes.loading}
                    spinning={loadingRef.value}
                    tip={i18n.tv('common.tips.loading_text', 'Loading...') as string}
                  ></Spin>
                  <RouterView></RouterView>
                </LayoutAdmin.NestedBreadcrumb>
              </LayoutAdmin.BreadcrumbProvider>
            </LayoutAdmin>
            <SettingDrawer
              vModel={settingDrawerVisible.value}
              invisibleHandle
              theme={appMixin.theme}
              primaryColor={appMixin.primaryColor}
              layout={appMixin.layout.type}
              contentWidth={appMixin.layout.contentWidth}
              fixedHeader={appMixin.layout.fixedHeader}
              fixSiderbar={appMixin.layout.fixSiderbar}
              autoHideHeader={appMixin.layout.autoHideHeader}
              colorWeak={appMixin.layout.colorWeak}
              multiTab={appMixin.layout.multiTab}
              {...{
                on: {
                  'update:theme': (value: Theme) => appMixin.setTheme(value),
                  'update:primaryColor': (value: string) => appMixin.setPrimaryColor(value),
                  'update:layout': (value: LayoutType) => appMixin.setLayout({ type: value }),
                  'update:contentWidth': (value: ContentWidth) => appMixin.setLayout({ contentWidth: value }),
                  'update:fixedHeader': (value: boolean) => appMixin.setLayout({ fixedHeader: value }),
                  'update:fixSiderbar': (value: boolean) => appMixin.setLayout({ fixSiderbar: value }),
                  'update:autoHideHeader': (value: boolean) => appMixin.setLayout({ autoHideHeader: value }),
                  'update:colorWeak': (value: boolean) => appMixin.setLayout({ colorWeak: value }),
                  'update:multiTab': (value: boolean) => appMixin.setLayout({ multiTab: value }),
                },
              }}
            />
          </div>
        </ConfigProvider>
      );
    };
  },
});
