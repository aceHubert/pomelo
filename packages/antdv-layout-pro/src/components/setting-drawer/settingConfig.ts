export const defaultPrimaryColor = '#1890FF';
export const getDefaultPresetColors = (
  i18nRender: (key: string, fallback: string) => string = (key, fallback) => fallback,
  i18nKeyPrefix = 'preset_colors',
) => [
  {
    key: i18nRender(`${i18nKeyPrefix}.daybreak_blue`, 'Daybreak Blue'),
    color: '#1890FF',
  },
  {
    key: i18nRender(`${i18nKeyPrefix}.dust_red`, 'Dust Red'),
    color: '#F5222D',
  },
  {
    key: i18nRender(`${i18nKeyPrefix}.volcano`, 'Volcano'),
    color: '#FA541C',
  },
  {
    key: i18nRender(`${i18nKeyPrefix}.sunset_orange`, 'Sunset Orange'),
    color: '#FAAD14',
  },
  {
    key: i18nRender(`${i18nKeyPrefix}.cyan`, 'Cyan'),
    color: '#13C2C2',
  },
  {
    key: i18nRender(`${i18nKeyPrefix}.polar_green`, 'Polar Green'),
    color: '#52C41A',
  },
  {
    key: i18nRender(`${i18nKeyPrefix}.geek_blue`, 'Geek Blue'),
    color: '#2F54EB',
  },
  {
    key: i18nRender(`${i18nKeyPrefix}.golden_purple`, 'Golden Purple'),
    color: '#722ED1',
  },
];
