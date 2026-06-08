import { Button, Layout, Menu, Space, Typography } from 'antd';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LanguageToggle } from '../../common/LanguageToggle';
import { clearManagementToken } from '../../../services/auth/token';
import { useI18n } from '../../../services/i18n/i18n';
import { MainRoutes } from '../../../router/MainRoutes';
import styles from './index.module.less';

function getSelectedKey(pathname: string, navItems: Array<{ key: string }>) {
  return navItems.find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))?.key || '/clients';
}

export function MainLayout({ onLogout }: { onLogout: () => void }) {
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const navItems = [
    { key: '/clients', label: t('nav.clients') },
    { key: '/api-resources', label: t('nav.apiResources') },
    { key: '/identity-resources', label: t('nav.identityResources') },
  ];

  function logout() {
    clearManagementToken();
    onLogout();
    navigate('/login', { replace: true });
  }

  return (
    <Layout className={styles.appShell}>
      <Layout.Sider className={styles.sidebar} width={248} breakpoint="lg" collapsedWidth={0}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>ID</span>
          <span>{t('app.identity')}</span>
        </div>
        <Menu
          className={styles.sidebarMenu}
          mode="inline"
          selectedKeys={[getSelectedKey(location.pathname, navItems)]}
          items={navItems.map((item) => ({
            key: item.key,
            label: <NavLink to={item.key}>{item.label}</NavLink>,
          }))}
        />
      </Layout.Sider>
      <Layout className={styles.workspaceShell}>
        <Layout.Header className={styles.topbar}>
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{t('app.management')}</Typography.Text>
            <Typography.Text type="secondary">{t('app.console')}</Typography.Text>
          </Space>
          <Space className={styles.topbarActions}>
            <LanguageToggle type="default" />
            <Button shape="round" onClick={logout}>
              {t('app.logout')}
            </Button>
          </Space>
        </Layout.Header>
        <Layout.Content className={styles.workspace}>
          <MainRoutes />
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
