export enum PropertyType {
  String = 'string',
  Number = 'number',
  Integer = 'integer',
  Float = 'float',
  Boolean = 'boolean',
  Date = 'date',
  DateTime = 'datetime',
  Month = 'month',
  Time = 'time',
  Url = 'url',
  Image = 'image',
  File = 'file',
  Email = 'email',
  Enum = 'enum',
  Hex = 'hex',
}

export interface Property {
  key: string;
  type: PropertyType;
  title?: string;
  description?: string;
  defaultValue?: any;
  validator?: (value: any) => boolean | string;
  // enum options
  enum?: Array<string | { label: string; value: any }>;
  // number min
  min?: number;
  // number max
  max?: number;
  // number step
  step?: number;
  // string min length
  minLen?: number;
  // string max length
  maxLen?: number;
  // date/month/datetime/time format
  format?: string;
  // date/month/datetime/time defaultPickerValue/defaultOpenValue
  defaultPickerValue?: any;
  // upload accept
  accept?: string;
}

export const getPresetProperties = (
  i18nRender: (key: string, fallback) => string = (key: string, fallback: string) => fallback,
): Array<{ group: string; children: Property[] }> => [
  {
    group: i18nRender('page_client_properties.form.basic_group_title', '基础设置'),
    children: [
      {
        key: 'primaryColor',
        type: PropertyType.Hex,
        title: i18nRender('page_client_properties.form.preset_keys.primary_color_title', '主题色'),
        defaultValue: '#1890ff',
      },
    ],
  },
  {
    group: i18nRender('page_client_properties.form.authorization_group_title', '授权设置'),
    children: [
      {
        key: 'loginPage.template',
        type: PropertyType.String,
        title: i18nRender('page_client_properties.form.preset_keys.login_page_template_title', '登录页自定义模版'),
        description: i18nRender(
          'page_client_properties.form.preset_keys.login_page_template_description',
          'ejs模版，使用"<%- form %>"占位符渲染表单内容, 表单id为"login-form"',
        ),
      },
      {
        key: 'loginPage.formLableDisplay',
        type: PropertyType.Boolean,
        title: i18nRender(
          'page_client_properties.form.preset_keys.login_page_form_label_display_title',
          '登录表单Lable显示方式',
        ),
        defaultValue: true,
        description: i18nRender(
          'page_client_properties.form.preset_keys.login_page_form_label_display_description',
          '显示表单Label, 默认: true',
        ),
      },
      {
        key: 'loginPage.formValidateTooltip',
        type: PropertyType.Boolean,
        title: i18nRender(
          'page_client_properties.form.preset_keys.login_page_form_validate_tooltip_title',
          '登录表单验证消息提示方式',
        ),
        defaultValue: false,
        description: i18nRender(
          'page_client_properties.form.preset_keys.login_page_form_validate_tooltip_description',
          '使用Tooltip显示，默认: false',
        ),
      },
      {
        key: 'consentPage.template',
        type: PropertyType.String,
        title: i18nRender(
          'page_client_properties.form.preset_keys.consent_page_tmeplate_title',
          '登录确认页自定义模版',
        ),
        description: i18nRender(
          'page_client_properties.form.preset_keys.consent_page_tmeplate_description',
          'ejs模版，使用"<%- form %>"占位符渲染表单内容, 确认表单id为"consent-confirm-form", 取消表单id为"consent-abort-form"',
        ),
      },
      {
        key: 'auth.signoutDisabled',
        type: PropertyType.Boolean,
        title: i18nRender('page_client_properties.form.preset_keys.signout_disabled_title', '禁用退出登录'),
        defaultValue: false,
      },
    ],
  },
];
