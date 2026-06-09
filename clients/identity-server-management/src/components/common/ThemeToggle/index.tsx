import { Button } from 'antd';
import { DesktopOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { applyThemePreference, getStoredThemePreference } from '../../../services/theme/theme';
import { useI18n } from '../../../services/i18n/i18n';
import type { ButtonProps } from 'antd';
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

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function ThemeToggle({
  className,
  buttonClassName,
  shape = 'round',
  type = 'default',
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
    <Button
      aria-label={meta.label}
      className={joinClasses(buttonClassName, className)}
      htmlType="button"
      icon={meta.icon}
      shape={shape}
      title={meta.label}
      type={type}
      onClick={toggleTheme}
    />
  );
}
