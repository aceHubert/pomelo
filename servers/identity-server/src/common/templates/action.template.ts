import * as url from 'url';

export type LocaleAction = {
  lang: string;
  display: string;
};

const DEFAULT_LOCALES: LocaleAction[] = [
  {
    lang: 'en-US',
    display: 'EN',
  },
  {
    lang: 'zh-CN',
    display: '中',
  },
];

export function getLocaleBtns(requestUrl: string, currentLang: string, locales: LocaleAction[] = DEFAULT_LOCALES) {
  const resolvedLocales = locales.length > 0 ? locales : DEFAULT_LOCALES;
  const parsedUrl = url.parse(requestUrl, true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { lang, locale, ...restQuery } = parsedUrl.query;
  const localeRemovedUrl = url.format({
    ...parsedUrl,
    search: void 0,
    query: restQuery,
  });
  return `<div class="locale-btns liquid-glass liquid-glass-button">
    ${resolvedLocales
      .map((locale) => {
        const disabled = currentLang === locale.lang;
        return `<a class="btn btn-sm btn-link locale-item${disabled ? ' btn-disabled' : ''}" href="${
          disabled ? 'javascript:;' : getHref(locale.lang)
        }" aria-label="切换语言：${locale.display}"${disabled ? ' aria-current="true"' : ''}>${locale.display}</a>`;
      })
      .join('<div class="divider"></div>')}
  </div>`;

  function getHref(lang: string) {
    return `${localeRemovedUrl}${localeRemovedUrl.indexOf('?') >= 0 ? '&' : '?'}locale=${lang}`;
  }
}

export function getThemeToggle() {
  return `<button type="button" class="btn btn-sm btn-link action-icon-btn liquid-glass liquid-glass-button theme-toggle" data-theme-toggle aria-label="系统主题，切换到暗色主题" title="系统主题">
    <span class="action-icon action-icon--theme-system" aria-hidden="true"></span>
  </button>`;
}

export function getActionBtns(requestUrl: string, currentLang: string, locales: LocaleAction[] = DEFAULT_LOCALES) {
  return `<div class="action-btns">
    ${getLocaleBtns(requestUrl, currentLang, locales)}
    ${getThemeToggle()}
  </div>`;
}
