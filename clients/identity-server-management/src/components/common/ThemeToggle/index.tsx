import { Button } from 'antd';
import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { applyThemePreference, getStoredThemePreference } from '@/services/theme/theme';
import { useI18n } from '@/services/i18n/i18n';
import LiquidGlass from '../LiquidGlass';
import styles from './index.module.less';
import type { ButtonProps } from 'antd';
import type { ThemePreference } from '@/services/theme/theme';

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

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function ThemeToggle({
  className,
  buttonClassName,
}: {
  className?: string;
  buttonClassName?: string;
  shape?: ButtonProps['shape'];
  type?: ButtonProps['type'];
}) {
  const { t } = useI18n();
  const [themePreference, setThemePreference] = useState(() => getStoredThemePreference());
  const meta = getThemeToggleMeta(themePreference, t);

  function toggleTheme() {
    const nextThemePreference = getNextThemePreference(themePreference);
    applyThemePreference(nextThemePreference);
    setThemePreference(nextThemePreference);
  }

  return (
    <LiquidGlass
      className={className}
      padding="0"
      cornerRadius={100}
      displacementScale={62}
      blurAmount={0.12}
      saturation={130}
      aberrationIntensity={2}
      elasticity={0.35}
      inline
      onClick={toggleTheme}
    >
      <Button
        aria-label={meta.label}
        className={joinClasses(buttonClassName, styles.themeToggle)}
        htmlType="button"
        icon={meta.icon}
        title={meta.label}
        shape="circle"
        type="text"
      />
    </LiquidGlass>
  );
}
