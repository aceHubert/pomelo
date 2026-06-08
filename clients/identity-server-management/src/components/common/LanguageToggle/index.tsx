import { Button } from 'antd';
import { TranslationOutlined } from '@ant-design/icons';
import { getNextLocale, useI18n } from '../../../services/i18n/i18n';
import type { ButtonProps } from 'antd';

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(' ');
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
  const { locale, toggleLocale, t } = useI18n();
  const nextLocale = getNextLocale(locale);
  const labelKey = nextLocale === 'en-US' ? 'language.switchToEnglish' : 'language.switchToChinese';
  const textKey = locale === 'en-US' ? 'language.englishShort' : 'language.chineseShort';

  return (
    <Button
      aria-label={t(labelKey)}
      className={joinClasses(buttonClassName, className)}
      htmlType="button"
      icon={<TranslationOutlined aria-hidden="true" />}
      shape="round"
      title={t(labelKey)}
      type={type}
      onClick={toggleLocale}
    >
      <span>{t(textKey)}</span>
    </Button>
  );
}
