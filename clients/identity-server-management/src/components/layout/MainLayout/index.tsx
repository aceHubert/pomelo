import { Avatar, Button, Layout, Menu, Popover, Space } from 'antd';
import { LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons';
import { useQuery } from '@apollo/client';
import { useCallback, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LanguageToggle } from '@/components/common/LanguageToggle';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { clearManagementToken } from '@/services/auth/token';
import { useI18n } from '@/services/i18n/i18n';
import { MainRoutes } from '@/router/MainRoutes';
import { CURRENT_USER } from '@/apis/operations';
import styles from './index.module.less';

type ManagementCurrentUser = {
  id: number;
  loginName: string;
  niceName: string;
  displayName: string;
  avatar?: string;
};

function getSelectedKey(pathname: string, navItems: Array<{ key: string }>) {
  return navItems.find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))?.key || '/clients';
}

export function MainLayout({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const { data } = useQuery<{ currentUser: ManagementCurrentUser }>(CURRENT_USER);
  const currentUser = data?.currentUser;
  const currentDisplayName = currentUser?.displayName || currentUser?.niceName || currentUser?.loginName || 'Admin';
  const navItems = [
    { key: '/clients', label: t('nav.clients') },
    { key: '/api-resources', label: t('nav.apiResources') },
    { key: '/identity-resources', label: t('nav.identityResources') },
  ];

  const logout = useCallback(() => {
    clearManagementToken();
    onLogout();
    navigate('/login', { replace: true });
  }, [navigate, onLogout]);

  return (
    <Layout className={styles.appShell}>
      <Layout.Sider
        className={styles.sidebar}
        width={248}
        breakpoint="lg"
        collapsed={sidebarCollapsed}
        collapsedWidth={0}
        trigger={null}
        onBreakpoint={setSidebarCollapsed}
      >
        <div className={styles.brand}>
          <span className={styles.brandIdentity}>
            <span className={styles.brandMark}>ID</span>
            <span>{t('app.identity')}</span>
          </span>
          <Button
            aria-label={t('layout.collapseSidebar')}
            className={styles.sidebarClose}
            icon={<MenuFoldOutlined />}
            shape="circle"
            title={t('layout.collapseSidebar')}
            type="text"
            onClick={() => setSidebarCollapsed(true)}
          />
        </div>
        <Menu
          className={styles.sidebarMenu}
          mode="inline"
          selectedKeys={[getSelectedKey(location.pathname, navItems)]}
          onClick={() => {
            if (window.innerWidth <= 992) setSidebarCollapsed(true);
          }}
          items={navItems.map((item) => ({
            key: item.key,
            label: <NavLink to={item.key}>{item.label}</NavLink>,
          }))}
        />
      </Layout.Sider>
      {!sidebarCollapsed ? (
        <button
          className={styles.sidebarMask}
          aria-label={t('layout.collapseSidebar')}
          onClick={() => setSidebarCollapsed(true)}
        />
      ) : null}
      <Layout className={styles.workspaceShell}>
        <Layout.Header className={styles.topbar}>
          <div className={styles.topbarTitle}>
            <Button
              aria-label={sidebarCollapsed ? t('layout.expandSidebar') : t('layout.collapseSidebar')}
              className={`${styles.sidebarToggle} ${sidebarCollapsed ? '' : styles.sidebarToggleHiddenOnMobile}`}
              icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              shape="circle"
              title={sidebarCollapsed ? t('layout.expandSidebar') : t('layout.collapseSidebar')}
              type="text"
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            />
          </div>
          <Space className={styles.topbarActions}>
            <ThemeToggle />
            <LanguageToggle type="default" />
            <Popover
              content={
                <Menu
                  className={styles.userMenu}
                  selectable={false}
                  items={[
                    {
                      key: 'logout',
                      icon: <LogoutOutlined />,
                      label: t('app.logout'),
                    },
                  ]}
                  onClick={({ key }) => {
                    if (key === 'logout') {
                      setUserPopoverOpen(false);
                      logout();
                    }
                  }}
                />
              }
              open={userPopoverOpen}
              overlayClassName={styles.userPopover}
              placement="bottomRight"
              trigger="click"
              onOpenChange={setUserPopoverOpen}
            >
              <button
                className={styles.userTrigger}
                type="button"
                aria-label={currentDisplayName}
                title={currentDisplayName}
              >
                <Avatar className={styles.userAvatar} size={28} src={currentUser?.avatar} icon={<UserOutlined />}>
                  {currentDisplayName.slice(0, 1).toUpperCase()}
                </Avatar>
                <span className={styles.userName}>{currentDisplayName}</span>
              </button>
            </Popover>
          </Space>
        </Layout.Header>
        <Layout.Content className={styles.workspace}>
          <MainRoutes />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
