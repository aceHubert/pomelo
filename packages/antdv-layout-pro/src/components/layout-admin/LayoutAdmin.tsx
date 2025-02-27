import cloneDeep from 'lodash.clonedeep';
import {
  defineComponent,
  getCurrentInstance,
  ref,
  computed,
  watch,
  nextTick,
  onMounted,
  onBeforeUnmount,
} from 'vue-demi';
import { Drawer, Tabs, Icon, Layout, Menu } from 'ant-design-vue';
import debounce from 'lodash.debounce';
import SVGInject from '@iconfu/svg-inject';
import { isAbsoluteUrl, warn } from '@ace-util/core';
import { useLayoutMixin } from '../../mixins';
import { useEffect, useConfigProvider } from '../../shared';
import { Theme, DeviceType, LayoutType, ContentWidth } from '../../types';

// Types
import type { Menu as MenuType } from 'ant-design-vue/types/menu/menu';
import type { MenuConfigWithRedirect } from '../../utils/menu';
import type { MenuConfig, MultiTabConfig, Optional, OmitVue } from '../../types';

const StopSiderContextProvide = defineComponent({
  name: 'StopSiderContextProvide',
  provide() {
    return {
      layoutSiderContext: {},
    };
  },
  setup(_, { slots }) {
    return () => slots.default?.();
  },
});

export type LayoutAdminProps = {
  /** 站点 logo, 80*80px */
  logo?: any;
  /** 站点标题 */
  title?: string;
  /** 菜单 */
  menus: MenuConfig[];
  /** 布局类型 */
  layoutType: LayoutType;
  /** Content 显示宽度 */
  contentWidth: ContentWidth;
  /** 固定 Header */
  fixedHeader: boolean;
  /** 固定 Siderbar */
  fixSiderbar: boolean;
  /** 向下滚动时隐藏 Header */
  autoHideHeader: boolean;
  /** 是否开启色弱模式 */
  colorWeak: boolean;
  /** 使用 tab 模式 */
  multiTab: boolean | Optional<MultiTabConfig, 'fullPath' | 'title'>[];
  /**
   * Siderbar 折叠方式
   *  boolean 时，初始化折叠状态
   * auto 时，根据页面宽度展开/折叠
   * disabled: 不折叠
   */
  sideCollapsed: boolean | 'auto' | 'disabled';
  /** customized class prefix */
  prefixCls?: string;
  /** 作为 i18n key 前缀(末尾不用加.),  [i18nKeyPrefix].term_form.btn_text */
  i18nKeyPrefix: string;
  /** 初始化路由变更监听 */
  initRouteChange?: (callback: (path: string) => void) => void | (() => void);
};

export default defineComponent({
  name: 'LayoutAdmin',
  props: {
    logo: {
      type: [],
    },
    title: {
      type: String,
    },
    menus: {
      type: Array,
      default: () => [],
    },
    layoutType: {
      type: String,
      default: LayoutType.MixedMenu,
    },
    contentWidth: {
      type: String,
      default: ContentWidth.Fluid,
    },
    fixedHeader: {
      type: Boolean,
      default: true,
    },
    fixSiderbar: {
      type: Boolean,
      default: true,
    },
    autoHideHeader: {
      type: Boolean,
      default: false,
    },
    colorWeak: {
      type: Boolean,
      default: false,
    },
    multiTab: {
      type: [Boolean, Array],
      default: false,
    },
    sideCollapsed: {
      type: [Boolean, String],
      default: 'auto',
    },
    prefixCls: String,
    i18nKeyPrefix: {
      type: String,
      default: 'components.layout_admin',
    },
    initRouteChange: Function,
  },
  emits: ['menuClick', 'themeChange', 'breadcrumbChange'],
  setup(props: LayoutAdminProps, { emit, slots }) {
    const currentInstance = getCurrentInstance();
    const configProvider = useConfigProvider();
    const layoutMixin = useLayoutMixin();

    const customizePrefixCls = props.prefixCls;
    const getPrefixCls = configProvider.getPrefixCls;
    const prefixCls = getPrefixCls('layout-admin', customizePrefixCls);

    const isMobile = computed(() => configProvider.device === DeviceType.Mobile);
    const isDesktop = computed(() => configProvider.device === DeviceType.Desktop);
    // 当 isMobile 时，header 必须显示，否则会导致 sideDrawerVisable 无法触发
    const hasHeader = computed(() => props.layoutType !== LayoutType.SiderMenu || isMobile.value);
    // topMenu 可以显示在 sider 中, hasHeader 和 hasTopMenu 分开计算
    const hasTopMenu = computed(() => !!layoutMixin.topMenus?.length);
    const headerHeight = computed(() => (hasHeader.value ? 48 : 0));
    const isHeaderHidden = ref(false);
    const hasSiderMenu = computed(() => !!layoutMixin.siderMenus?.length);
    const sideCollapsed = ref(false);
    const sideCollapsedWidth = ref(48);
    const sideExpandedWidth = ref(200);
    const topMenuInSideCollaspsed = ref(true);
    const topMenuInSideWidth = computed(() =>
      topMenuInSideCollaspsed.value ? sideCollapsedWidth.value : sideExpandedWidth.value,
    );

    // using drawer in mobile
    const sideDrawerVisable = ref(false);
    const sideChildDrawerVisable = ref(false);

    const sideFullWidth = computed(() => {
      let paddingLeft = 0;
      // don't need padding in phone mode
      if (!isMobile.value) {
        if (hasSiderMenu.value && layoutMixin.siderMenus?.length) {
          paddingLeft = sideCollapsed.value ? sideCollapsedWidth.value : sideExpandedWidth.value;
        }
        // if TopMenu show in sider
        if (!hasHeader.value && hasTopMenu.value) {
          paddingLeft += topMenuInSideWidth.value;
        }
      }
      return paddingLeft;
    });

    // 设置 multiTabRoutes 默认值
    Array.isArray(props.multiTab) &&
      layoutMixin.multiTabRoutes.items.push(
        ...props.multiTab.map((item) => ({
          ...item,
          fullPath: item.fullPath ?? item.path,
          title: item.title ?? item.path,
        })),
      );

    useEffect(() => {
      // 路由变化设置菜单及 mulitTabRoutes
      const routeChange = (path: string) => {
        if (!path) return;

        layoutMixin.setPath(path);
        props.multiTab && layoutMixin.setMultiTabRoutes(path);
      };

      const removeListeners: Array<() => void> = [];
      // 如果 currentInstance.proxy.$router 存在，监听路由变化
      if (currentInstance?.proxy.$router) {
        currentInstance.proxy.$router.onReady(() => {
          routeChange(currentInstance.proxy.$route.fullPath);
        });
        removeListeners.push(
          currentInstance.proxy.$router.afterEach((to) => {
            routeChange(to.fullPath);
          }),
        );
      }
      // 自定义路由变化监听
      if (props.initRouteChange) {
        const removeRouteChange = props.initRouteChange(routeChange);
        removeRouteChange && removeListeners.push(removeRouteChange);
      }

      return () => {
        removeListeners.forEach((remove) => {
          remove();
        });
      };
    }, []);

    useEffect(() => {
      if (props.sideCollapsed === 'auto') {
        sideCollapsed.value = !isDesktop.value;
        if (!isDesktop.value) {
          // this.setContentWidth(ContentWidth.Fluid);
        }
        if (!isMobile.value) {
          sideDrawerVisable.value = false;
          sideChildDrawerVisable.value = false;
        }
      } else if (typeof props.sideCollapsed === 'boolean') {
        sideCollapsed.value = props.sideCollapsed;
      }
    }, [() => configProvider.device, () => props.sideCollapsed]);

    useEffect(() => {
      let fixedMenus = cloneDeep(props.menus);
      if (!isMobile.value && props.layoutType === LayoutType.TopMenu) {
        // trade side as top in topMenu mode
        fixedMenus = (function format(menus) {
          return menus.map((menu) => {
            if (menu.children?.length) {
              menu.children = format(menu.children);
            }
            return {
              ...menu,
              position: menu.position === 'side' ? 'top' : menu.position,
            };
          });
        })(fixedMenus);
      }
      layoutMixin.setMenus(fixedMenus);
    }, [() => configProvider.device, () => props.menus, () => props.layoutType]);

    useEffect(
      () => {
        emit('breadcrumbChange', layoutMixin.menuBreadcrumbs);
      },
      () => layoutMixin.menuBreadcrumbs,
    );

    const handleMenuClick = (key: string) => {
      const menu = layoutMixin.menuKeyMap.get(key);
      const next = menu?.redirect || menu?.path;
      if (!next) return;

      const { resolved, path } = layoutMixin.reslovePath(next);

      if (!resolved) {
        warn(process.env.NODE_ENV === 'production', `Can't resolve path: ${path}`);
        return;
      }

      // 如果是顶部菜单，且有侧边菜单，点击顶部菜单时，不切换路由，只切换菜单
      // 等待侧边菜单选择后，再切换路由
      if (menu.position === 'top' && menu.children?.some((item) => item.position === 'side')) {
        return layoutMixin.setPath(path, false);
      }

      emit('menuClick', path, () => {
        layoutMixin.setPath(path);
      });
    };

    let handleContentScroll: () => void;
    onMounted(() => {
      if (props.sideCollapsed === 'auto') {
        sideCollapsed.value = !isDesktop.value;
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

      let lastKnownScrollPosition = 0;
      let ticking = false;
      const setHeaderDisplay = debounce((hidden: boolean) => {
        isHeaderHidden.value = hidden;
      }, 100);
      handleContentScroll = () => {
        if (props.autoHideHeader && hasHeader.value) {
          const isDown = window.scrollY > lastKnownScrollPosition;
          lastKnownScrollPosition = window.scrollY;

          if (!ticking) {
            window.requestAnimationFrame(() => {
              setHeaderDisplay(isDown ? lastKnownScrollPosition > headerHeight.value : false);
              ticking = false;
            });

            ticking = true;
          }
        }
      };

      document.addEventListener('scroll', handleContentScroll, false);
    });

    onBeforeUnmount(() => {
      handleContentScroll && document.removeEventListener('scroll', handleContentScroll, false);
    });

    return () => {
      const renderIcon = (icon: any) => {
        if (!icon || icon === 'none') {
          return null;
        }

        return isAbsoluteUrl(icon) ? (
          <Icon
            component={{
              render: () => <img src={icon} onLoad={(e) => /.svg$/i.test(icon) && SVGInject(e.target)} />,
            }}
          ></Icon>
        ) : typeof icon === 'object' ? (
          <Icon component={icon}></Icon>
        ) : (
          <Icon type={icon}></Icon>
        );
      };

      const renderMenu = (
        menus: MenuConfigWithRedirect[],
        {
          classname,
          subMenuPopupClassName,
          mode = 'inline',
          theme = 'light',
          onMenuClick = () => {},
          onOpenChange = () => {},
          ...props
        }: {
          classname?: string;
          subMenuPopupClassName?: string;
          onMenuClick?: Function;
          onOpenChange?: Function;
        } & Partial<OmitVue<MenuType>> = {},
      ) => {
        const menuProps: Partial<MenuType> = {
          ...props,
          mode,
          theme,
        };
        if (mode === 'inline') {
          menuProps.inlineCollapsed = props.inlineCollapsed ?? (isMobile.value ? false : sideCollapsed.value);
          menuProps.inlineIndent = props.inlineIndent ?? 20;
        }

        return (
          <Menu class={classname} props={menuProps} onClick={onMenuClick} onOpenChange={onOpenChange}>
            {renderNestedMenu(menus)}
          </Menu>
        );

        function renderNestedMenu(menus: MenuConfigWithRedirect[]) {
          return menus.map((menu) =>
            menu.children?.length ? (
              <Menu.SubMenu
                key={menu.key}
                popupClassName={subMenuPopupClassName}
                scopedSlots={{
                  title: () => renderMenuContent(menu),
                }}
              >
                {menu.children?.length && renderNestedMenu(menu.children)}
              </Menu.SubMenu>
            ) : (
              <Menu.Item key={menu.key}>{renderMenuContent(menu)}</Menu.Item>
            ),
          );
        }

        function renderMenuContent(menu: MenuConfigWithRedirect) {
          const icon = renderIcon(menu.icon);
          const title =
            typeof menu.title === 'function' ? menu.title((...args) => configProvider.i18nRender(...args)) : menu.title;
          return icon ? [icon, <span>{title}</span>] : title;
        }
      };

      const renderLogo = (titleDisplay = true) => {
        return (
          <router-link to="/" class="logo-content">
            <div class="site-logo">
              {slots.logo?.() ??
                (typeof props.logo === 'string' ? (
                  <img height="48" src={props.logo} alt="logo" />
                ) : (
                  renderIcon(props.logo)
                ))}
            </div>
            {titleDisplay && (
              <h1 class="site-name" ref="siteName">
                {slots.title?.() ?? props.title ?? ''}
              </h1>
            )}
          </router-link>
        );
      };

      const renderSider = () => {
        const handleClick = ({ key }: { key: string }) => {
          handleMenuClick(key);
          sideDrawerVisable.value = false;
          // isMobile.value && (sideCollapsed.value = true);
        };

        const handleOpenChange = (openKeys: string[]) => {
          layoutMixin.setSiderMenuOpenKeys(openKeys);
        };

        if (isMobile.value) {
          // TODO: 不显示 header 时 Drawer Trigger 没有
          return (
            <Drawer
              visible={sideDrawerVisable.value}
              width="180"
              placement="left"
              wrapClassName={`${prefixCls}-sider-drawer`}
              bodyStyle={{
                padding: 0,
              }}
              maskClosable
              title={
                hasTopMenu.value ? (
                  <Icon
                    type="arrow-left"
                    onClick={() => {
                      if (layoutMixin.goBackPath) {
                        // 只切换菜单，路由不变
                        layoutMixin.setPath(layoutMixin.goBackPath, false);
                      } else {
                        sideChildDrawerVisable.value = true;
                      }
                    }}
                  />
                ) : (
                  configProvider.i18nRender(`${props.i18nKeyPrefix}.sider_drawer.title`, 'Menu')
                )
              }
              onClose={() => (sideDrawerVisable.value = false)}
            >
              {renderMenu(layoutMixin.siderMenus, {
                mode: 'inline',
                theme: configProvider.theme === Theme.Dark ? 'dark' : 'light',
                selectedKeys: [layoutMixin.currSiderMenuKey],
                onMenuClick: handleClick,
                onOpenChange: handleOpenChange,
              })}
              {hasTopMenu.value && (
                <Drawer
                  visible={sideChildDrawerVisable.value}
                  width="180"
                  placement="left"
                  wrapClassName={`${prefixCls}-sider-drawer`}
                  bodyStyle={{
                    padding: 0,
                  }}
                  maskClosable
                  closeable={false}
                  title={configProvider.i18nRender(`${props.i18nKeyPrefix}.sider_drawer.title`, 'Menu')}
                  onClose={() => (sideChildDrawerVisable.value = false)}
                >
                  {renderMenu(layoutMixin.topMenus, {
                    mode: 'inline',
                    theme: configProvider.theme === Theme.Dark ? 'dark' : 'light',
                    selectedKeys: layoutMixin.currTopMenuKey ? [layoutMixin.currTopMenuKey] : [],
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
              )}
            </Drawer>
          );
        } else if ((!hasHeader.value && hasTopMenu.value) || hasSiderMenu.value) {
          const fixSiderbar = props.fixSiderbar || props.layoutType === LayoutType.TopMenu;
          const renderSiderContent = () => [
            <section
              class={[
                `${prefixCls}-sider d-flex flex-column`,
                {
                  [`${prefixCls}-sider--fixed`]: fixSiderbar,
                  [`${prefixCls}-sider--collapsed`]:
                    (topMenuInSideCollaspsed.value && sideCollapsed.value) || !layoutMixin.siderMenus.length,
                },
              ]}
              style={
                fixSiderbar
                  ? { top: isHeaderHidden.value ? 0 : `${headerHeight.value}px`, transition: 'top 0.2s' }
                  : { height: `calc(100vh - ${headerHeight.value}px)` }
              }
            >
              {!hasHeader.value && (
                <div
                  class="sider-logo flex-none"
                  style={{
                    minWidth: `${sideFullWidth.value}px`,
                    maxWidth: `${sideFullWidth.value}px`,
                    width: `${sideFullWidth.value}px`,
                  }}
                >
                  {renderLogo()}
                </div>
              )}
              <div class="d-flex flex-auto" style="height: 0;">
                {!hasHeader.value && hasTopMenu.value && (
                  <div
                    class="top-in-sider d-flex flex-column flex-none"
                    style={{
                      flex: `0 0 ${topMenuInSideWidth.value}px`,
                      minWidth: `${topMenuInSideWidth.value}px`,
                      maxWidth: `${topMenuInSideWidth.value}px`,
                      width: `${topMenuInSideWidth.value}px`,
                    }}
                  >
                    {renderMenu(layoutMixin.topMenus, {
                      classname: 'flex-auto',
                      subMenuOpenDelay: 0.3,
                      mode: 'inline',
                      theme: configProvider.theme === Theme.RealLight ? 'light' : 'dark',
                      inlineCollapsed: topMenuInSideCollaspsed.value,
                      selectedKeys: layoutMixin.currTopMenuKey ? [layoutMixin.currTopMenuKey] : [],
                      onMenuClick: ({ key }: { key: string }) => {
                        handleMenuClick(key);
                      },
                    })}
                    {slots.siderActions?.(topMenuInSideCollaspsed.value)}
                  </div>
                )}
                <Layout.Sider
                  vShow={layoutMixin.siderMenus.length}
                  theme={configProvider.theme === Theme.Dark ? 'dark' : 'light'}
                  width={sideExpandedWidth.value}
                  trigger={null}
                  breakpoint="lg"
                  collapsible
                  collapsed={sideCollapsed.value}
                  collapsedWidth={sideCollapsedWidth.value}
                >
                  <div class="d-flex flex-column" style={{ height: '100%' }}>
                    {renderMenu(layoutMixin.siderMenus, {
                      classname: 'flex-auto',
                      subMenuOpenDelay: 0.3,
                      mode: 'inline',
                      theme: configProvider.theme === Theme.Dark ? 'dark' : 'light',
                      selectedKeys: [layoutMixin.currSiderMenuKey],
                      onMenuClick: handleClick,
                      onOpenChange: handleOpenChange,
                    })}
                    {layoutMixin.goBackPath ? (
                      <Menu
                        class="toggle-go-back-menu"
                        mode="vertical"
                        theme={configProvider.theme === Theme.Dark ? 'dark' : 'light'}
                        selectable={false}
                        onClick={() => {
                          // 切换菜单，并且切换路由
                          emit('menuClick', layoutMixin.goBackPath!, () => {
                            layoutMixin.setPath(layoutMixin.goBackPath!);
                          });
                        }}
                      >
                        <Menu.Item key="go-back">
                          <Icon type="arrow-left" />
                          <span>{configProvider.i18nRender(`${props.i18nKeyPrefix}.sider.go_back`, 'Go Back')}</span>
                        </Menu.Item>
                      </Menu>
                    ) : !hasHeader.value && !hasTopMenu.value && slots.siderActions ? (
                      // menu in component effect by sider inline collapsed
                      <StopSiderContextProvide>{slots.siderActions(sideCollapsed.value)}</StopSiderContextProvide>
                    ) : props.sideCollapsed !== 'disabled' ? (
                      <Menu
                        class="toggle-collapse-menu"
                        mode="vertical"
                        theme={configProvider.theme === Theme.Dark ? 'dark' : 'light'}
                        selectable={false}
                        onClick={() => (sideCollapsed.value = !sideCollapsed.value)}
                      >
                        <Menu.Item key="collapse">
                          <Icon class="trigger" type={sideCollapsed.value ? 'menu-unfold' : 'menu-fold'} />
                          <span>
                            {sideCollapsed.value
                              ? configProvider.i18nRender(`${props.i18nKeyPrefix}.sider.expand`, 'Expand')
                              : configProvider.i18nRender(`${props.i18nKeyPrefix}.sider.collapse`, 'Collapse')}
                          </span>
                        </Menu.Item>
                      </Menu>
                    ) : null}
                  </div>
                </Layout.Sider>
              </div>
            </section>,
          ];

          if (fixSiderbar) {
            return (
              <div
                class={`${prefixCls}-sider-placeholder`}
                style={{
                  flex: `0 0 ${sideFullWidth.value}px`,
                  minWidth: `${sideFullWidth.value}px`,
                  maxWidth: `${sideFullWidth.value}px`,
                  width: `${sideFullWidth.value}px`,
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
        const header = (
          <Layout.Header
            class={[
              `${prefixCls}-header`,
              {
                [`${prefixCls}-header--fixed`]: props.fixedHeader,
              },
            ]}
            style={{
              padding: 0,
              width: '100%',
              height: `${headerHeight.value}px`,
              lineHeight: `${headerHeight.value}px`,
              right: props.fixedHeader ? 0 : undefined,
              ...(props.fixedHeader && isHeaderHidden.value ? { transform: 'translateY(-120%)' } : {}),
              transition: 'transform 0.2s',
              zIndex: 2,
            }}
          >
            <div class={`${prefixCls}-header__wrapper`}>
              <div class="header-logo">{renderLogo(!isMobile.value)}</div>
              {/* mobile 模式下，显示 trigger */}
              {isMobile.value ? (
                <span class="trigger">
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
              {/* 非 mobile 模式下，显示菜单 */}
              {!isMobile.value ? (
                <div style="flex: 1 1 0%; min-width:0;">
                  {hasTopMenu.value && (
                    <div class="root-menu">
                      {renderMenu(layoutMixin.topMenus, {
                        mode: 'horizontal',
                        theme: configProvider.theme === Theme.RealLight ? 'light' : 'dark',
                        selectedKeys: layoutMixin.currTopMenuKey ? [layoutMixin.currTopMenuKey] : [],
                        onMenuClick: ({ key }: { key: string }) => handleMenuClick(key),
                      })}
                    </div>
                  )}
                  {/* TODO: !hasSiderMenu */}
                </div>
              ) : null}
              {/* header actions */}
              {slots.headerActions && <div class="header-right">{slots.headerActions?.()}</div>}
            </div>
          </Layout.Header>
        );

        return props.fixedHeader ? (
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

      const renderContent = () => {
        const defaultProps = {
          sideCollapsed: sideCollapsed.value,
          setSideCollapsed: (collapsed: boolean) => (sideCollapsed.value = collapsed),
        };
        return (
          <Layout.Content
            class={[
              `${prefixCls}-content`,
              {
                [`${prefixCls}-content--has-footer`]: !!slots.footer,
              },
            ]}
          >
            <div class={[`${prefixCls}-content__wrapper`, `content-width-${props.contentWidth}`]}>
              {props.multiTab ? (
                <Tabs
                  vModel={layoutMixin.multiTabRoutes.current}
                  class={`${prefixCls}-content__tabs`}
                  type="editable-card"
                  size="small"
                  hideAdd
                  destroyInactiveTabPane
                  onChange={(activeKey) => {
                    layoutMixin.multiTabRoutes.current = activeKey;
                    emit('tabChange', activeKey);
                  }}
                  onEdit={(activeKey, action) => {
                    if (action === 'remove') {
                      layoutMixin.multiTabRoutes.items.splice(
                        layoutMixin.multiTabRoutes.items.findIndex(({ fullPath }) => fullPath === activeKey),
                        1,
                      );
                      if (activeKey === layoutMixin.multiTabRoutes.current) {
                        history.go(-1);
                      }
                    }
                  }}
                >
                  {layoutMixin.multiTabRoutes.items.map(({ fullPath, title, closable }) => (
                    <Tabs.TabPane key={fullPath} tab={title} closable={closable}>
                      {slots.default?.(defaultProps) ?? <router-view />}
                    </Tabs.TabPane>
                  ))}
                </Tabs>
              ) : (
                slots.default?.(defaultProps) ?? <router-view />
              )}
            </div>
          </Layout.Content>
        );
      };

      const renderFooter = () => {
        return !!slots.footer && <Layout.Footer class={`${prefixCls}-footer`}>{slots.footer?.()}</Layout.Footer>;
      };

      return hasHeader.value ? (
        <Layout
          class={[
            `${prefixCls}__wrapper`,
            {
              'color-weak': props.colorWeak,
              'flex-column': isMobile.value,
            },
          ]}
          key="has-header"
        >
          {renderHeader()}
          <Layout style={{ zIndex: 1 }}>
            {renderSider()}
            <Layout>
              {renderContent()}
              {renderFooter()}
            </Layout>
          </Layout>
        </Layout>
      ) : (
        <Layout
          class={[
            `${prefixCls}__wrapper`,
            {
              'color-weak': props.colorWeak,
            },
          ]}
          key="without-header"
        >
          {renderSider()}
          <Layout>
            {renderContent()}
            {renderFooter()}
          </Layout>
        </Layout>
      );
    };
  },
});
