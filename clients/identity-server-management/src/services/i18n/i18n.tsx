import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale as AntdLocale } from 'antd/es/locale';
import type { PropsWithChildren } from 'react';

export type AppLocale = 'zh-CN' | 'en-US';

const LOCALE_STORAGE_KEY = 'pomelo.identity.management.locale';
const DEFAULT_LOCALE: AppLocale = 'zh-CN';

const resources: Record<AppLocale, Record<string, string>> = {
  'zh-CN': {
    'app.identity': 'Identity',
    'app.management': '管理后台',
    'app.console': 'Identity Server 控制台',
    'app.logout': '退出',

    'language.switchToEnglish': '切换到英文',
    'language.switchToChinese': '切换到中文',
    'language.current': '当前语言',
    'language.englishName': 'English',
    'language.chineseName': '简体中文',
    'language.englishShort': 'EN',
    'language.chineseShort': '中',

    'theme.systemToDark': '当前跟随系统，切换到暗色主题',
    'theme.darkToLight': '当前暗色主题，切换到亮色主题',
    'theme.lightToSystem': '当前亮色主题，切换到跟随系统',

    'layout.collapseSidebar': '隐藏侧边栏',
    'layout.expandSidebar': '展开侧边栏',

    'nav.clients': '客户端',
    'nav.apiResources': 'API资源',
    'nav.identityResources': 'Identity资源',

    'login.brand': 'Pomelo Identity',
    'login.title': '身份管理',
    'login.username': '账号',
    'login.password': '密码',
    'login.usernamePlaceholder': '请输入账号',
    'login.passwordPlaceholder': '请输入密码',
    'login.submit': '登录',
    'login.error': '登录失败，请检查账号或密码',

    'resource.loading': '加载中',
    'resource.count': '{count} 项',
    'resource.search': '搜索',
    'resource.refresh': '刷新',
    'resource.create': '创建',
    'resource.add': '新增',
    'resource.detail': '详情',
    'resource.detailInfo': '详情信息',
    'resource.editInfo': '编辑信息',
    'resource.edit': '编辑',
    'resource.reset': '重置',
    'resource.update': '更新',
    'resource.generate': '生成',
    'resource.noOwner': '请选择关联资源',
    'resource.operationFailed': '操作失败',

    'table.actions': '操作',
    'table.select': '选择',
    'table.delete': '删除',
    'table.deleteConfirm': '确认删除这条记录？',
    'table.confirm': '确认',
    'table.cancel': '取消',

    'status.yes': '是',
    'status.no': '否',

    'validation.required': '请输入{field}',
    'validation.url': '请输入有效 URL',
    'validation.resourceName': '只允许英文字母或“_”',
    'validation.maxLength': '长度不能超过{max}个字符',
    'validation.futureTime': '{field}必须大于当前时间',

    'page.clients': '客户端',
    'page.apiResources': 'API资源',
    'page.identityResources': 'Identity资源',

    'detail.basic': '基本信息',
    'detail.authentication': '认证',
    'detail.token': '令牌',
    'detail.basicEdit': '基本信息修改',

    'panel.claims': '声明',
    'panel.corsOrigins': 'CORS 源',
    'panel.grantTypes': '授权模式',
    'panel.scopes': '授权范围',
    'panel.redirectUris': '重定向 URI',
    'panel.postLogoutRedirectUris': '登出后重定向 URI',
    'panel.secrets': '密钥',
    'panel.properties': '属性',
    'panel.scopeClaims': 'Scope Claims',
    'panel.apiScopeClaims': 'API Scope Claims',

    'fields.id': 'ID',
    'fields.name': '名称',
    'fields.displayName': '显示名称',
    'fields.description': '描述',
    'fields.enabled': '启用',
    'fields.required': '是否必须',
    'fields.showInDiscoveryDocument': '是否显示在发现文档',
    'fields.type': '类型',
    'fields.value': '值',
    'fields.key': '键',
    'fields.origin': '源',
    'fields.scope': '授权范围',
    'fields.grantType': '授权模式',
    'fields.redirectUri': '重定向 URI',
    'fields.postLogoutRedirectUri': '登出后重定向 URI',
    'fields.expiresAt': '过期时间',
    'fields.clientId': '客户端 ID',
    'fields.clientName': '客户端名称',
    'fields.applicationType': '应用类型',
    'fields.clientUri': '客户端 URI',
    'fields.initiateLoginUri': '初始化登录 URI',
    'fields.logoUri': 'Logo URI',
    'fields.policyUri': '用户协议 URI',
    'fields.defaultMaxAge': 'Default max age',
    'fields.subjectType': 'Subject type',
    'fields.sectorIdentifierUri': 'Sector identifier URI',
    'fields.jwksUri': 'JWKs URI',
    'fields.requireConsent': 'Require consent',
    'fields.requirePkce': 'Require PKCE',
    'fields.idTokenSignedResponseAlg': 'ID Token 签名算法',
    'fields.tokenEndpointAuthMethod': 'Token endpoint auth method',
    'fields.idTokenLifetime': 'ID Token lifetime',
    'fields.requireAuthTime': 'Require auth time',
    'fields.accessTokenFormat': 'Access Token format',
    'fields.accessTokenLifetime': 'Access Token lifetime',
    'fields.refreshTokenExpiration': 'Refresh Token expiration',
    'fields.refreshTokenAbsoluteLifetime': 'Refresh Token absolute lifetime',
    'fields.refreshTokenSlidingLifetime': 'Refresh Token sliding lifetime',
    'fields.authorizationCodeLifetime': 'Authorization code lifetime',
    'fields.deviceCodeLifetime': 'Device code lifetime',
    'fields.backchannelAuthenticationRequestLifetime': 'Backchannel authentication request lifetime',
    'fields.nonEditable': '不可编辑',

    'grantType.authorizationCode': '授权码模式',
    'grantType.clientCredentials': '客户端凭证模式',
    'grantType.deviceCode': '设备码模式',
    'grantType.jwtBearer': 'JWT Bearer 模式',
    'grantType.refreshToken': '刷新令牌模式',
    'grantType.saml2Bearer': 'SAML2 Bearer 模式',
    'grantType.tokenExchange': '令牌交换模式',

    'help.resourceName': '长度为1-50个字符，允许英文字母或“_”；名称需要唯一',
    'help.secretDescription': '密钥作何使用？',
    'help.clientClaims': '设置客户端声明（会被添加到 access token 中）。',
    'help.clientCorsOrigins': '设置 JavaScript 客户端的跨域策略。',
    'help.clientGrantTypes': '设置客户端与授权服务器之间的授权模式，以便客户端能够获得访问令牌。',
    'help.clientScopes': '设置客户端可以访问的资源范围，默认情况下客户端没有任何访问资源的权限。',
    'help.clientRedirectUris': '设置指定允许返回令牌或授权码的 URI。',
    'help.clientPostLogoutRedirectUris': '设置指定注销后允许重定向到的 URI。',
    'help.clientProperties': '设置客户端自定义属性。',
    'help.apiResourceClaims': '设置API资源允许的声明。',
    'help.apiScopes': '设置API资源的授权范围。',
    'help.apiScopeClaims': '设置API授权范围允许的声明。',
    'help.apiScopeClaimsFor': '将为授权范围“{scope}”添加声明。',
    'help.apiProperties': '设置API资源自定义属性。',
    'help.identityClaims': '设置资源允许的声明。',
    'help.identityProperties': '设置资源的自定义属性。',

    'property.keyPlaceholder': '请输入/选择属性名',
    'property.keyLabel': '属性名',
    'property.valueLabel': '值',
    'property.valueInputPlaceholder': '请输入{title}',
    'property.valueSelectPlaceholder': '请选择{title}',
    'property.basicGroup': '基础设置',
    'property.authorizationGroup': '授权设置',
    'property.primaryColor': '主题色',
    'property.loginPageTemplate': '登录页自定义模版',
    'property.loginPageTemplateDescription': 'ejs模版，使用"<%- form %>"占位符渲染表单内容, 表单id为"login-form"',
    'property.loginPageFormLabelDisplay': '登录表单 Label 显示方式',
    'property.loginPageFormLabelDisplayDescription': '显示表单 Label, 默认: true',
    'property.loginPageFormValidateTooltip': '登录表单验证消息提示方式',
    'property.loginPageFormValidateTooltipDescription': '使用 Tooltip 显示，默认: false',
    'property.consentPageTemplate': '登录确认页自定义模版',
    'property.consentPageTemplateDescription':
      'ejs模版，使用"<%- form %>"占位符渲染表单内容, 确认表单id为"consent-confirm-form", 取消表单id为"consent-abort-form"',
    'property.signoutDisabled': '禁用退出登录',

    'placeholder.apiScopeId': 'API Scope ID',
  },
  'en-US': {
    'app.identity': 'Identity',
    'app.management': 'Management',
    'app.console': 'Identity Server Console',
    'app.logout': 'Logout',

    'language.switchToEnglish': 'Switch to English',
    'language.switchToChinese': 'Switch to Chinese',
    'language.current': 'Current language',
    'language.englishName': 'English',
    'language.chineseName': 'Simplified Chinese',
    'language.englishShort': 'EN',
    'language.chineseShort': '中',

    'theme.systemToDark': 'Using system theme, switch to dark theme',
    'theme.darkToLight': 'Using dark theme, switch to light theme',
    'theme.lightToSystem': 'Using light theme, switch to system theme',

    'layout.collapseSidebar': 'Hide sidebar',
    'layout.expandSidebar': 'Show sidebar',

    'nav.clients': 'Clients',
    'nav.apiResources': 'API Resources',
    'nav.identityResources': 'Identity Resources',

    'login.brand': 'Pomelo Identity',
    'login.title': 'Identity Management',
    'login.username': 'Account',
    'login.password': 'Password',
    'login.usernamePlaceholder': 'Enter account',
    'login.passwordPlaceholder': 'Enter password',
    'login.submit': 'Login',
    'login.error': 'Login failed. Check your account or password.',

    'resource.loading': 'Loading',
    'resource.count': '{count} items',
    'resource.search': 'Search',
    'resource.refresh': 'Refresh',
    'resource.create': 'Create',
    'resource.add': 'Add',
    'resource.detail': 'Details',
    'resource.detailInfo': 'Detail information',
    'resource.editInfo': 'Edit information',
    'resource.edit': 'Edit',
    'resource.reset': 'Reset',
    'resource.update': 'Update',
    'resource.generate': 'Generate',
    'resource.noOwner': 'Select a related resource',
    'resource.operationFailed': 'Operation failed',

    'table.actions': 'Actions',
    'table.select': 'Select',
    'table.delete': 'Delete',
    'table.deleteConfirm': 'Delete this record?',
    'table.confirm': 'Confirm',
    'table.cancel': 'Cancel',

    'status.yes': 'Yes',
    'status.no': 'No',

    'validation.required': 'Enter {field}',
    'validation.url': 'Enter a valid URL',
    'validation.resourceName': 'Only letters and "_" are allowed',
    'validation.maxLength': 'Must be no more than {max} characters',
    'validation.futureTime': '{field} must be later than the current time',

    'page.clients': 'Clients',
    'page.apiResources': 'API Resources',
    'page.identityResources': 'Identity Resources',

    'detail.basic': 'Basic information',
    'detail.authentication': 'Authentication',
    'detail.token': 'Token',
    'detail.basicEdit': 'Edit basic information',

    'panel.claims': 'Claims',
    'panel.corsOrigins': 'CORS Origins',
    'panel.grantTypes': 'Grant Types',
    'panel.scopes': 'Scopes',
    'panel.redirectUris': 'Redirect URIs',
    'panel.postLogoutRedirectUris': 'Post Logout Redirect URIs',
    'panel.secrets': 'Secrets',
    'panel.properties': 'Properties',
    'panel.scopeClaims': 'Scope Claims',
    'panel.apiScopeClaims': 'API Scope Claims',

    'fields.id': 'ID',
    'fields.name': 'Name',
    'fields.displayName': 'Display Name',
    'fields.description': 'Description',
    'fields.enabled': 'Enabled',
    'fields.required': 'Required',
    'fields.showInDiscoveryDocument': 'Show in discovery document',
    'fields.type': 'Type',
    'fields.value': 'Value',
    'fields.key': 'Key',
    'fields.origin': 'Origin',
    'fields.scope': 'Scope',
    'fields.grantType': 'Grant Type',
    'fields.redirectUri': 'Redirect URI',
    'fields.postLogoutRedirectUri': 'Post Logout Redirect URI',
    'fields.expiresAt': 'Expires At',
    'fields.clientId': 'Client ID',
    'fields.clientName': 'Client Name',
    'fields.applicationType': 'Application Type',
    'fields.clientUri': 'Client URI',
    'fields.initiateLoginUri': 'Initiate Login URI',
    'fields.logoUri': 'Logo URI',
    'fields.policyUri': 'Policy URI',
    'fields.defaultMaxAge': 'Default max age',
    'fields.subjectType': 'Subject type',
    'fields.sectorIdentifierUri': 'Sector identifier URI',
    'fields.jwksUri': 'JWKs URI',
    'fields.requireConsent': 'Require consent',
    'fields.requirePkce': 'Require PKCE',
    'fields.idTokenSignedResponseAlg': 'ID Token signing algorithm',
    'fields.tokenEndpointAuthMethod': 'Token endpoint auth method',
    'fields.idTokenLifetime': 'ID Token lifetime',
    'fields.requireAuthTime': 'Require auth time',
    'fields.accessTokenFormat': 'Access Token format',
    'fields.accessTokenLifetime': 'Access Token lifetime',
    'fields.refreshTokenExpiration': 'Refresh Token expiration',
    'fields.refreshTokenAbsoluteLifetime': 'Refresh Token absolute lifetime',
    'fields.refreshTokenSlidingLifetime': 'Refresh Token sliding lifetime',
    'fields.authorizationCodeLifetime': 'Authorization code lifetime',
    'fields.deviceCodeLifetime': 'Device code lifetime',
    'fields.backchannelAuthenticationRequestLifetime': 'Backchannel authentication request lifetime',
    'fields.nonEditable': 'Non editable',

    'grantType.authorizationCode': 'Authorization Code',
    'grantType.clientCredentials': 'Client Credentials',
    'grantType.deviceCode': 'Device Code',
    'grantType.jwtBearer': 'JWT Bearer',
    'grantType.refreshToken': 'Refresh Token',
    'grantType.saml2Bearer': 'SAML2 Bearer',
    'grantType.tokenExchange': 'Token Exchange',

    'help.resourceName': '1-50 characters. Only letters and "_" are allowed. The name must be unique.',
    'help.secretDescription': 'What is this secret used for?',
    'help.clientClaims': 'Configure client claims. They will be added to the access token.',
    'help.clientCorsOrigins': 'Configure the CORS policy for JavaScript clients.',
    'help.clientGrantTypes': 'Configure the grant modes between the client and authorization server.',
    'help.clientScopes':
      'Configure resource scopes the client can access. By default, the client has no resource access.',
    'help.clientRedirectUris': 'Configure URIs allowed to receive tokens or authorization codes.',
    'help.clientPostLogoutRedirectUris': 'Configure URIs allowed after logout redirection.',
    'help.clientProperties': 'Configure custom client properties.',
    'help.apiResourceClaims': 'Configure claims allowed by the API resource.',
    'help.apiScopes': 'Configure scopes for the API resource.',
    'help.apiScopeClaims': 'Configure claims allowed by the API scope.',
    'help.apiScopeClaimsFor': 'Add claims for scope "{scope}".',
    'help.apiProperties': 'Configure custom API resource properties.',
    'help.identityClaims': 'Configure claims allowed by the resource.',
    'help.identityProperties': 'Configure custom resource properties.',

    'property.keyPlaceholder': 'Enter/select property name',
    'property.keyLabel': 'Property name',
    'property.valueLabel': 'Value',
    'property.valueInputPlaceholder': 'Enter {title}',
    'property.valueSelectPlaceholder': 'Select {title}',
    'property.basicGroup': 'Basic settings',
    'property.authorizationGroup': 'Authorization settings',
    'property.primaryColor': 'Primary color',
    'property.loginPageTemplate': 'Login page custom template',
    'property.loginPageTemplateDescription':
      'EJS template. Use "<%- form %>" as the form placeholder. The form id is "login-form".',
    'property.loginPageFormLabelDisplay': 'Login form label display',
    'property.loginPageFormLabelDisplayDescription': 'Display form labels. Default: true.',
    'property.loginPageFormValidateTooltip': 'Login form validation message display',
    'property.loginPageFormValidateTooltipDescription': 'Display validation messages with Tooltip. Default: false.',
    'property.consentPageTemplate': 'Consent page custom template',
    'property.consentPageTemplateDescription':
      'EJS template. Use "<%- form %>" as the form placeholder. Confirm form id is "consent-confirm-form"; cancel form id is "consent-abort-form".',
    'property.signoutDisabled': 'Disable sign out',

    'placeholder.apiScopeId': 'API Scope ID',
  },
};

type I18nContextValue = {
  locale: AppLocale;
  antdLocale: AntdLocale;
  setLocale: (locale: AppLocale) => void;
  toggleLocale: () => void;
  t: (key: string, values?: Record<string, string | number>, fallback?: string) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isAppLocale(value: string | null): value is AppLocale {
  return value === 'zh-CN' || value === 'en-US';
}

export function getStoredLocale(): AppLocale {
  const locale = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isAppLocale(locale) ? locale : DEFAULT_LOCALE;
}

export function getNextLocale(locale: AppLocale): AppLocale {
  return locale === 'zh-CN' ? 'en-US' : 'zh-CN';
}

export function getAntdLocale(locale: AppLocale): AntdLocale {
  return locale === 'zh-CN' ? zhCN : enUS;
}

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template;

  return Object.entries(values).reduce(
    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
    template,
  );
}

export function I18nProvider({ children }: PropsWithChildren) {
  const [locale, setLocaleState] = useState<AppLocale>(() => getStoredLocale());

  const setLocale = useCallback((nextLocale: AppLocale) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    setLocaleState(nextLocale);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((currentLocale) => {
      const nextLocale = getNextLocale(currentLocale);
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
      return nextLocale;
    });
  }, []);

  const t = useCallback(
    (key: string, values?: Record<string, string | number>, fallback?: string) =>
      interpolate(resources[locale][key] ?? fallback ?? key, values),
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const syncStoredLocale = (event: StorageEvent) => {
      if (event.key === LOCALE_STORAGE_KEY && isAppLocale(event.newValue)) {
        setLocaleState(event.newValue);
      }
    };

    window.addEventListener('storage', syncStoredLocale);
    return () => window.removeEventListener('storage', syncStoredLocale);
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      antdLocale: getAntdLocale(locale),
      setLocale,
      toggleLocale,
      t,
    }),
    [locale, setLocale, t, toggleLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
