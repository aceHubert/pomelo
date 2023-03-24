import { upperFirst, kebabCase } from 'lodash-es';
import { defineComponent, ref, computed, watch, nextTick, toRef, onMounted } from '@vue/composition-api';
import { useRouter, useRoute } from 'vue2-helpers/vue-router';
import { Drawer, Icon, Layout, Menu } from 'ant-design-vue';
import { ConfigProvider, Spin, expose, useEffect, ANT_PREFIX_CLS } from '@/components';
import { useUserManager, usePubSubMessages } from '@/hooks';
import { useAppMixin, useLayoutMixin, useDeviceMixin, useLocationMixin } from '@/mixins';
import { useI18n } from '@/hooks';
// import { Theme } from '@/configs/settings.config';
import { loadingRef } from '@/shared';
import { RouterView, AvatarDropdown, LocaleDropdown, MessageDropdown, Breadcrumb, GlobalFooter } from './modules';
import classes from './styles/default.module.less';

// Types
import { Ref } from '@vue/composition-api';
import { Menu as MenuType } from 'ant-design-vue/types/menu/menu';
import { MenuConfig, MessageConfig, Theme, DeviceType } from '@/types';
import { AvatarDropdownAction } from './modules/global-header/AvatarDropdown';
import { BreadItem } from './modules/global-header/Breadcrumb';

export default defineComponent({
  name: 'DefaultLayout',
  head() {
    const device = (this.device as Ref<DeviceType>).value ?? DeviceType.Desktop;
    const theme = (this.theme as Ref<Theme>).value ?? Theme.Light;
    const themeVars = (this.themeVars as Ref<Record<string, string>>).value ?? {};
    let cssText = '';
    for (const key in themeVars) {
      cssText += `--theme-${kebabCase(key)}: ${themeVars[key]};`;
    }
    return {
      bodyAttrs: {
        class: `theme-${theme} is-${device}`,
        style: cssText,
      },
    };
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const i18n = useI18n();
    const appMixin = useAppMixin();
    const deviceMixin = useDeviceMixin();
    const layoutMixin = useLayoutMixin();
    const locationMixin = useLocationMixin(router);
    const pubSubMessages = usePubSubMessages();
    const userManager = useUserManager();

    expose({
      device: toRef(deviceMixin, 'device'),
      theme: toRef(appMixin, 'theme'),
      themeVars: toRef(appMixin, 'themeVars'),
    });

    const currentUser = ref<{ name: string; photo: string } | undefined>(undefined);
    const headerHeight = computed(() => (appMixin.hasHeader ? 48 : 0));
    const sideCollapsed = ref(typeof appMixin.sideCollapsed === 'boolean' ? appMixin.sideCollapsed : false);
    const sideCollapsedWidth = ref(48);
    const sideWidth = ref(200);
    const topMenuInSideWidth = ref(48);

    // using drawer in mobile
    const sideDrawerVisable = ref(false);
    const sideChildDrawerVisable = ref(false);

    const sideFullWidth = computed(() => {
      let paddingLeft = 0;
      // don't need padding in phone mode
      if (!deviceMixin.isMobile) {
        // If it is a fix menu, calculate padding
        if (appMixin.fixSiderbar && appMixin.hasSiderMenu && layoutMixin.siderMenus?.length) {
          paddingLeft = sideCollapsed.value ? sideCollapsedWidth.value : sideWidth.value;
        }
        // if TopMenu show in sider
        if (!appMixin.hasTopMenu) {
          paddingLeft += topMenuInSideWidth.value;
        }
      }
      return paddingLeft;
    });

    const currentBreadcrumbs = computed<BreadItem[]>(() => {
      return layoutMixin.breadcrumbs.map(({ label, path }) => ({
        label: typeof label === 'function' ? label((...args) => i18n.tv(...args) as string) : label,
        to: path,
        isLink: !!path && path !== route.path,
      }));
    });

    useEffect(
      () => {
        if (appMixin.sideCollapsed === 'auto') {
          sideCollapsed.value = !deviceMixin.isDesktop;
          if (!deviceMixin.isDesktop) {
            // this.setContentWidth(ContentWidth.Fluid);
          }
          if (!deviceMixin.isMobile) {
            sideDrawerVisable.value = false;
            sideChildDrawerVisable.value = false;
          }
        }
      },
      () => deviceMixin.device,
    );

    const handleAction = (key: AvatarDropdownAction) => {
      if (key === AvatarDropdownAction.Profile) {
        router.push({ name: 'profile' });
      } else if (key === AvatarDropdownAction.Settings) {
        router.push({ name: 'settings' });
      } else if (key === AvatarDropdownAction.SignOut) {
        // 以免多次调用跳转循环
        if (!router.currentRoute.path.startsWith('/signout')) {
          router.replace('/signout');
        }
      }
    };

    const handleLocaleChange = (locale: string) => {
      appMixin.setLocale(locale);
      // do something else
    };

    const setMessageRead = (message: MessageConfig) => {
      pubSubMessages.value = pubSubMessages.value.filter((item) => item !== message);
      pubSubMessages.count -= 1;
      // TODO: 远程设置已读
      return Promise.resolve();
    };

    const handleMessageMakeAsRead = (message: MessageConfig) => {
      setMessageRead(message);
    };

    const handleMessageView = (message: MessageConfig) => {
      setMessageRead(message);
      locationMixin.goTo(message.to!);
    };

    // const handleThemeChange = (value?: Theme) => {
    //   setColor({ theme: value ?? appMixin.theme === Theme.Dark ? Theme.Light : Theme.Dark });
    // };

    const handleMenuClick = (key: string) => {
      const menu = layoutMixin.menuKeyMap[key];
      const next = menu?.redirect || menu?.path;
      if (next && route.path === next) return;
      locationMixin.goTo(next!);
    };

    onMounted(() => {
      if (appMixin.sideCollapsed === 'auto') {
        sideCollapsed.value = !deviceMixin.isDesktop;
        const userAgent = navigator.userAgent;
        if (userAgent.indexOf('Edge') > -1) {
          nextTick(() => {
            sideCollapsed.value = !sideCollapsed.value;
            setTimeout(() => {
              sideCollapsed.value = !sideCollapsed.value;
            }, 16);
          });
        }
      }

      userManager.getUser().then(async (user) => {
        if (user) {
          currentUser.value = {
            name: user.profile.nickname ?? user.profile.loginName ?? 'User',
            photo: `${process.env.BASE_URL}static/images/head_default.jpg`,
          };
          // appStore.setPath(route.path);
        }
      });

      // first update color
      // TIPS: THEME COLOR HANDLER!! PLEASE CHECK THAT!!
      if (process.env.NODE_ENV !== 'production' || process.env.VUE_APP_PREVIEW === 'true') {
        // updateTheme(this.settings.primaryColor);
      }

      //setting-drawer theme options
      // if (!window.umi_plugin_ant_themeVar) {
      //   window.umi_plugin_ant_themeVar = config.themeVar;
      // }
    });

    const renderIcon = (icon: any) => {
      if (icon === undefined || icon === 'none' || icon === null) {
        return null;
      }

      return typeof icon === 'object' ? <Icon component={icon}></Icon> : <Icon type={icon}></Icon>;
    };

    const renderLogo = () => {
      const logo = appMixin.siteLogo;

      return typeof logo === 'string' ? <img class="logo" height="48" src={logo} alt="logo" /> : renderIcon(logo);
    };

    const renderMenu = (
      menus: MenuConfig[],
      {
        mode = 'inline',
        theme = 'light',
        classname = '',
        props = {},
        onMenuClick = () => {},
        onOpenChange = () => {},
      }: {
        mode?: 'horizontal' | 'inline';
        theme?: 'light' | 'dark';
        classname?: string | string[];
        props?: Partial<MenuType>;
        onMenuClick?: Function;
        onOpenChange?: Function;
      } = {},
    ) => {
      const renderMenuItem = function renderMenuItem(menu: MenuConfig) {
        return (
          <Menu.Item key={menu.key}>
            {renderIcon(menu.icon)}
            <span>
              {typeof menu.title === 'function' ? menu.title((...args) => i18n.tv(...args) as string) : menu.title}
            </span>
          </Menu.Item>
        );
      };

      const menuProps: Partial<MenuType> = {
        ...props,
        mode,
        theme,
      };
      if (mode === 'inline') {
        menuProps.inlineCollapsed = props.inlineCollapsed ?? (deviceMixin.isMobile ? false : sideCollapsed.value);
        menuProps.inlineIndent = props.inlineIndent ?? 16;
      }

      return (
        <Menu class={classname} props={menuProps} onClick={onMenuClick} onOpenChange={onOpenChange}>
          {menus.map((menu) =>
            menu.children?.length ? (
              <Menu.SubMenu key={menu.key}>
                <span slot="title">
                  {renderIcon(menu.icon)}
                  <span>
                    {typeof menu.title === 'function'
                      ? menu.title((...args) => i18n.tv(...args) as string)
                      : menu.title}
                  </span>
                </span>
                {menu.children.map((child) => renderMenuItem(child))}
              </Menu.SubMenu>
            ) : (
              renderMenuItem(menu)
            ),
          )}
        </Menu>
      );
    };

    const renderSider = () => {
      const handleClick = ({ key }: { key: string }) => {
        handleMenuClick(key);
        sideDrawerVisable.value = false;
        deviceMixin.isMobile && (sideCollapsed.value = true);
      };

      const handleOpenChange = (openKeys: string[]) => {
        layoutMixin.setSiderMenuOpenKeys(openKeys);
      };

      if (deviceMixin.isMobile) {
        // TODO: 不显示 header 时 Drawer Trigger 没有
        return (
          <Drawer
            visible={sideDrawerVisable.value}
            width="180"
            placement="left"
            wrapClassName={classes.layoutSiderDrawer}
            bodyStyle={{
              padding: 0,
            }}
            maskClosable
            title={<Icon type="arrow-left" onClick={() => (sideChildDrawerVisable.value = true)} />}
            onClose={() => (sideDrawerVisable.value = false)}
          >
            {renderMenu(layoutMixin.siderMenus, {
              mode: 'inline',
              theme: appMixin.theme === Theme.Dark ? 'dark' : 'light',
              classname: classes.siderMenu,
              props: {
                selectedKeys: [layoutMixin.currSiderMenu],
                // openKeys: siderMenuOpenKeys.value,
              },
              onMenuClick: handleClick,
              onOpenChange: handleOpenChange,
            })}
            <Drawer
              visible={sideChildDrawerVisable.value}
              width="180"
              placement="left"
              wrapClassName={classes.layoutSiderDrawer}
              bodyStyle={{
                padding: 0,
              }}
              maskClosable
              closeable={false}
              title={i18n.tv('layout_default.sider_drawer.title', '菜单')}
              onClose={() => (sideChildDrawerVisable.value = false)}
            >
              {renderMenu(layoutMixin.topMenus, {
                mode: 'inline',
                theme: appMixin.theme === Theme.Dark ? 'dark' : 'light',
                classname: classes.siderMenu,
                props: { selectedKeys: [layoutMixin.currTopMenu] },
                onMenuClick: ({ key }: { key: string }) => {
                  handleMenuClick(key);
                  sideChildDrawerVisable.value = false;

                  const unWatch = watch(
                    () => layoutMixin.siderMenus,
                    (value) => {
                      !value?.length && (sideDrawerVisable.value = false);
                      unWatch();
                    },
                  );
                },
              })}
            </Drawer>
          </Drawer>
        );
      } else if (appMixin.hasSiderMenu) {
        const renderSiderContent = () => [
          <section
            class={[
              'd-flex flex-column',
              classes.layoutSider,
              {
                [classes.layoutSiderFixed]: appMixin.fixSiderbar,
                [classes.layoutSiderCollapsed]: sideCollapsed.value || !layoutMixin.siderMenus.length,
              },
            ]}
            style={{
              top: appMixin.fixSiderbar ? `${headerHeight.value}px` : 'initial',
              height: appMixin.fixSiderbar ? 'initial' : `calc(100vh - ${headerHeight.value}px)`,
            }}
          >
            {!appMixin.hasHeader && (
              <div class={[classes.siderLogo, 'flex-none']}>
                <router-link to="/">
                  {renderLogo()}
                  <h1>{appMixin.siteTitle}</h1>
                </router-link>
              </div>
            )}
            <div class="d-flex flex-auto">
              {!appMixin.hasTopMenu && (
                <div
                  class={[classes.topInSider, 'd-flex flex-column']}
                  style={{
                    flex: `0 0 ${topMenuInSideWidth.value}px`,
                    minWidth: `${topMenuInSideWidth.value}px`,
                    maxWidth: `${topMenuInSideWidth.value}px`,
                    width: `${topMenuInSideWidth.value}px`,
                  }}
                >
                  {renderMenu(layoutMixin.topMenus, {
                    mode: 'inline',
                    theme: 'dark',
                    classname: [classes.siderMenu, 'flex-auto'],
                    props: {
                      inlineCollapsed: true,
                      selectedKeys: [layoutMixin.currTopMenu],
                    },
                    onMenuClick: ({ key }: { key: string }) => {
                      handleMenuClick(key);
                    },
                  })}
                  {!appMixin.hasHeader && (
                    <div class="pb-5">
                      <LocaleDropdown
                        class="d-block text-center pt-4"
                        locale={i18n.locale}
                        supportLanguages={appMixin.supportLanguages}
                        placement="rightBottom"
                        onChange={handleLocaleChange}
                      />
                      <AvatarDropdown
                        class="d-block text-center pt-4"
                        imgSrc={currentUser.value?.photo}
                        placement="rightBottom"
                        onAction={handleAction}
                        {...{
                          scopedSlots: {
                            menuItems: () => [],
                          },
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
              <Layout.Sider
                vShow={layoutMixin.siderMenus.length}
                theme={appMixin.theme === Theme.Dark ? 'dark' : 'light'}
                width={sideWidth.value}
                trigger={null}
                breakpoint="lg"
                collapsible
                collapsed={sideCollapsed.value}
                collapsedWidth={sideCollapsedWidth.value}
              >
                <div class="d-flex flex-column" style={{ height: '100%' }}>
                  {renderMenu(layoutMixin.siderMenus, {
                    mode: 'inline',
                    theme: appMixin.theme === Theme.Dark ? 'dark' : 'light',
                    classname: [classes.siderMenu, 'flex-auto'],
                    props: {
                      selectedKeys: [layoutMixin.currSiderMenu],
                      // openKeys: siderMenuOpenKeys.value,
                    },
                    onMenuClick: handleClick,
                    onOpenChange: handleOpenChange,
                  })}
                  {appMixin.sideCollapsed !== 'disabled' && (
                    <Menu
                      class="toggle-collapse-menu"
                      mode="vertical"
                      theme={appMixin.theme === Theme.Dark ? 'dark' : 'light'}
                      selectable={false}
                      onClick={() => (sideCollapsed.value = !sideCollapsed.value)}
                    >
                      <Menu.Item key="collapse">
                        <Icon class="trigger" type={sideCollapsed.value ? 'menu-unfold' : 'menu-fold'} />
                        <span>
                          {sideCollapsed.value
                            ? i18n.tv('layout_default.sider_drawer.expand_sidebar', '展开')
                            : i18n.tv('layout_default.sider_drawer.collapse_sidebar', '折叠')}
                        </span>
                      </Menu.Item>
                    </Menu>
                  )}
                </div>
              </Layout.Sider>
            </div>
          </section>,
        ];

        if (appMixin.fixSiderbar) {
          return (
            <div
              class="sider-placehoder"
              style={{
                flex: '0 0 auto',
                width: `${sideFullWidth.value}px`,
                transition: 'width 0.2s',
              }}
            >
              {renderSiderContent()}
            </div>
          );
        }
        return renderSiderContent();
      }
      return;
    };

    const renderHeader = () => {
      const rightContent = (
        <div class={classes.contentRight}>
          <MessageDropdown
            class={classes.contentRightAction}
            count={pubSubMessages.count}
            messages={pubSubMessages.value}
            placement="bottom"
            onItemView={handleMessageView}
            onMakeAsRead={handleMessageMakeAsRead}
          />
          <LocaleDropdown
            class={classes.contentRightAction}
            locale={i18n.locale}
            supportLanguages={appMixin.supportLanguages}
            placement="bottom"
            onChange={handleLocaleChange}
          />
          {/* <Tooltip position="bottom" title={i18n.tv('common.tips.theme', '主题')} class={classes.contentRightAction}>
            <span>
              <Icon
                type="bulb"
                theme={appMixin.theme === Theme.Dark ? 'filled' : 'outlined'}
                onClick={() => handleThemeChange()}
              />
            </span>
          </Tooltip> */}
          <AvatarDropdown
            class={classes.contentRightAction}
            username={currentUser.value?.name}
            imgSrc={currentUser.value?.photo}
            onAction={handleAction}
            {...{
              scopedSlots: {
                menuItems: () => [],
              },
            }}
          />
        </div>
      );

      const header = (
        <Layout.Header
          class={[
            classes.layoutHeader,
            {
              [classes.layoutHeaderFixed]: appMixin.fixedHeader,
              [classes.hasTopMenu]: !deviceMixin.isMobile,
            },
          ]}
          style={{
            padding: 0,
            height: `${headerHeight.value}px`,
            lineHeight: `${headerHeight.value}px`,
            width: '100%',
            right: appMixin.fixedHeader ? 0 : undefined,
            zIndex: 2,
          }}
        >
          <div class={[classes.layoutHeaderWrapper]}>
            {deviceMixin.isMobile ? (
              <div class={classes.headerLogo}>
                <router-link to="/">{renderLogo()}</router-link>
              </div>
            ) : (
              <div class={classes.headerLogo} style="min-width: 186px">
                <router-link to="/">
                  {renderLogo()}
                  <h1>{appMixin.siteTitle}</h1>
                </router-link>
              </div>
            )}

            {deviceMixin.isMobile ? (
              <span class={classes.trigger}>
                <Icon
                  type={sideDrawerVisable.value ? 'menu-unfold' : 'menu-fold'}
                  style={{ fontSize: '16px' }}
                  onClick={() => {
                    sideDrawerVisable.value = true;
                    !layoutMixin.siderMenus?.length &&
                      setTimeout(() => {
                        sideChildDrawerVisable.value = true;
                      }, 100);
                  }}
                />
              </span>
            ) : null}

            {!deviceMixin.isMobile ? (
              <div style="flex: 1 1 0%; min-width:0;">
                {appMixin.hasTopMenu && (
                  <div class="root-menu">
                    {renderMenu(layoutMixin.topMenus, {
                      mode: 'horizontal',
                      theme: appMixin.theme === Theme.RealLight ? 'light' : 'dark',
                      props: { selectedKeys: [layoutMixin.currTopMenu] },
                      onMenuClick: ({ key }: { key: string }) => handleMenuClick(key),
                    })}
                  </div>
                )}
                {/* TODO: !hasSiderMenu */}
              </div>
            ) : null}
            {deviceMixin.isMobile ? rightContent : <div style="min-width: 168px;">{rightContent}</div>}
          </div>
        </Layout.Header>
      );

      return appMixin.fixedHeader ? (
        <div
          class="header-placeholder"
          style={{
            flex: `0 0 ${headerHeight.value}px`,
            height: `${headerHeight.value}px`,
            minHeight: `${headerHeight.value}px`,
            maxHeight: `${headerHeight.value}px`,
          }}
        >
          {header}
        </div>
      ) : (
        header
      );
    };

    const renderBreadcrumb = () => {
      return route.meta?.breadcrumb !== false ? (
        <div class={[classes.layoutBreadcrumb]}>
          <Breadcrumb items={currentBreadcrumbs.value} router={router} route={route}></Breadcrumb>
        </div>
      ) : null;
    };

    const renderContent = () => {
      return (
        <Layout.Content
          class={[
            classes.layoutContent,
            {
              [classes.layoutContentHasBreadcrumb]: route.meta?.breadcrumb !== false && currentBreadcrumbs.value.length,
              [classes.layoutContentHasFooter]: true,
            },
          ]}
        >
          <div class={[classes.layoutContentWrapper, classes[`contentWidth${upperFirst(appMixin.contentWidth)}`]]}>
            <Spin
              class={classes.layoutContentLoading}
              spinning={loadingRef.value}
              tip={i18n.tv('common.tips.loading_text', 'Loading...')}
            ></Spin>
            <RouterView />
          </div>
        </Layout.Content>
      );
    };

    const renderFooter = () => {
      return (
        <Layout.Footer class={classes.layoutFooter} style="padding: 0;">
          <GlobalFooter></GlobalFooter>
        </Layout.Footer>
      );
    };

    return () => (
      <ConfigProvider
        attrs={{
          locale: appMixin.antLocales,
          prefixCls: ANT_PREFIX_CLS,
        }}
        theme={appMixin.theme}
        device={deviceMixin.device}
        i18nRender={(...args) => i18n.tv(...args) as string}
      >
        {appMixin.hasHeader ? (
          <Layout id="layout-default" class={[classes.layoutWrapper]}>
            {renderHeader()}
            <Layout style={{ zIndex: 1 }}>
              {renderSider()}
              <Layout>
                {renderBreadcrumb()}
                {renderContent()}
                {renderFooter()}
              </Layout>
            </Layout>
          </Layout>
        ) : (
          <Layout id="layout-default" class={[classes.layoutWrapper]}>
            {renderSider()}
            <Layout>
              {renderBreadcrumb()}
              {renderContent()}
              {renderFooter()}
            </Layout>
          </Layout>
        )}
      </ConfigProvider>
    );
  },
});
