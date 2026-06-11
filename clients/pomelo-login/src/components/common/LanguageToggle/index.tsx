import { Button, Menu, Popover } from 'antd';
import { CheckOutlined, TranslationOutlined } from '@ant-design/icons';
import { useMemo, useState } from 'react';
import { useI18n } from '@/services/i18n/i18n';
import styles from './index.module.less';
import type { ButtonProps } from 'antd';
import type { AppLocale } from '@/services/i18n/i18n';

function joinClasses(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(' ');
}

export function LanguageToggle({
  className,
  buttonClassName,
  type = 'text',
}: {
  className?: string;
  buttonClassName?: string;
  type?: ButtonProps['type'];
}) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const languages = useMemo(
    () => [
      {
        key: 'zh-CN' as AppLocale,
        icon: '🇨🇳',
        name: '简体中文',
        shortName: '中',
      },
      {
        key: 'en-US' as AppLocale,
        icon: '🇺🇸',
        name: 'English',
        shortName: 'EN',
      },
    ],
    [t],
  );
  const currentLanguage = languages.find((item) => item.key === locale) || languages[0];
  const label = `${t('language.current')}: ${currentLanguage.name}`;
  const languageMenu = (
    <Menu
      className={styles.menu}
      selectedKeys={[locale]}
      items={languages.map((item) => ({
        key: item.key,
        label: (
          <span className={styles.menuItem}>
            <span className={styles.languageIcon}>{item.icon}</span>
            <span className={styles.languageName}>{item.name}</span>
            {item.key === locale ? <CheckOutlined className={styles.checkIcon} /> : null}
          </span>
        ),
      }))}
      onClick={({ key }) => {
        setLocale(key as AppLocale);
        setOpen(false);
      }}
    />
  );

  return (
    <Popover
      content={languageMenu}
      open={open}
      overlayClassName={styles.popover}
      placement="bottomRight"
      trigger="click"
      onOpenChange={setOpen}
    >
      <Button
        aria-label={label}
        className={joinClasses(styles.trigger, buttonClassName, className)}
        htmlType="button"
        icon={<TranslationOutlined aria-hidden="true" />}
        shape="round"
        title={label}
        type={type}
      >
        <span className={styles.shortName}>{currentLanguage.shortName}</span>
      </Button>
    </Popover>
  );
}
