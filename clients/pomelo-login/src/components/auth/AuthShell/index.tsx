import { Button } from 'antd';
import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { BRAND_NAME } from '../../../services/app/env';
import { applyThemePreference, getStoredThemePreference } from '../../../services/theme/theme';
import { useI18n } from '../../../services/i18n/i18n';
import { LanguageToggle } from '../../common/LanguageToggle';
import LiquidGlass from '../../common/LiquidGlass';
import styles from './index.module.less';
import type { PropsWithChildren } from 'react';
import type { ThemePreference } from '../../../services/theme/theme';

function getNextThemePreference(theme: ThemePreference): ThemePreference {
  if (theme === 'system') return 'dark';
  if (theme === 'dark') return 'light';
  return 'system';
}

function getThemeToggleMeta(theme: ThemePreference, t: ReturnType<typeof useI18n>['t']) {
  if (theme === 'system') return { icon: <DesktopOutlined />, label: t('theme.systemToDark') };
  if (theme === 'dark') return { icon: <MoonOutlined />, label: t('theme.darkToLight') };
  return { icon: <SunOutlined />, label: t('theme.lightToSystem') };
}

export function AuthShell({
  title,
  subtitle,
  children,
}: PropsWithChildren<{
  title: string;
  subtitle: string;
}>) {
  const { t } = useI18n();
  const [themePreference, setThemePreference] = useState(() => getStoredThemePreference());
  const themeToggleMeta = useMemo(() => getThemeToggleMeta(themePreference, t), [themePreference, t]);

  function toggleTheme() {
    const nextThemePreference = getNextThemePreference(themePreference);
    applyThemePreference(nextThemePreference);
    setThemePreference(nextThemePreference);
  }

  return (
    <main className={styles.shell}>
      <div className={styles.gradientField} aria-hidden="true" />
      <div className={styles.topActions}>
        <div className={styles.actionSlot}>
          <LiquidGlass className={styles.actionGlass} padding="0" overLight={false} cornerRadius={999} layout="inline">
            <LanguageToggle buttonClassName={styles.actionButton} />
          </LiquidGlass>
        </div>
        <div className={styles.actionSlot}>
          <LiquidGlass className={styles.actionGlass} padding="0" overLight={false} cornerRadius={999} layout="inline">
            <Button
              aria-label={themeToggleMeta.label}
              className={styles.actionButton}
              htmlType="button"
              icon={themeToggleMeta.icon}
              shape="circle"
              title={themeToggleMeta.label}
              type="text"
              onClick={toggleTheme}
            />
          </LiquidGlass>
        </div>
      </div>
      <LiquidGlass
        className={styles.panel}
        padding="0"
        overLight={false}
        cornerRadius={20}
        glassSize={{ width: 'min(520px, calc(100vw - 48px))' }}
      >
        <div className={styles.panelContent}>
          <div className={styles.brand}>
            <span className={styles.brandMark}>PA</span>
            <span>{BRAND_NAME}</span>
          </div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {children}
        </div>
      </LiquidGlass>
    </main>
  );
}
