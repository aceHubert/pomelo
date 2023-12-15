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

export enum PropertyGroup {
  Basic = 'basic',
  Authorization = 'authorization',
  Other = 'other',
}

export const PropertyGroupDesc = {
  [PropertyGroup.Basic]: '基础设置',
  [PropertyGroup.Authorization]: '授权设置',
  [PropertyGroup.Other]: '其他设置',
};

export const getPresetProperties = (): Array<{ group: PropertyGroup; children: Property[] }> => [
  {
    group: PropertyGroup.Basic,
    children: [
      {
        key: 'primaryColor',
        type: PropertyType.Hex,
        title: '主题色',
        defaultValue: '#1890ff',
      },
    ],
  },
  {
    group: PropertyGroup.Authorization,
    children: [
      {
        key: 'loginPage.template',
        type: PropertyType.String,
        title: '登录页自定义模版',
        description: 'ejs模版，可使用<%= form %>占位符，表示登录表单, 表单id为login-form',
      },
      {
        key: 'loginPage.formLableDisplay',
        type: PropertyType.Boolean,
        title: '登录表单Lable是否显示',
        defaultValue: true,
        description: '默认: true',
      },
      {
        key: 'loginPage.formValidateTooltip',
        type: PropertyType.Boolean,
        title: '登录表单验证提示是否使用Tooltip',
        defaultValue: false,
        description: '默认: false',
      },
      {
        key: 'auth.signoutDisabled',
        type: PropertyType.Boolean,
        title: '禁用退出登录',
        defaultValue: false,
      },
      {
        key: 'consentPage.template',
        type: PropertyType.String,
        title: '登录确认页自定义模版',
        description: 'ejs模版，可使用<%= form %>占位符，表示登录表单, 表单id为consent-form',
      },
    ],
  },
];
