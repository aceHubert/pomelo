import { GlobalOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useI18n } from '@/services/i18n/i18n';

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, toggleLocale, t } = useI18n();
  const isChinese = locale === 'zh-CN';

  return (
    <Button
      className={className}
      htmlType="button"
      icon={<GlobalOutlined />}
      size="large"
      type="text"
      onClick={toggleLocale}
      title={isChinese ? t('language.switchToEnglish') : t('language.switchToChinese')}
    >
      {isChinese ? t('language.englishShort') : t('language.chineseShort')}
    </Button>
  );
}
