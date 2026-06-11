import { QueryTypes } from 'sequelize';
import type { QueryInterface } from 'sequelize';

type ExistingOptionRow = {
  optionName: string;
};

const OptionPresetKeys = {
  AuthRegisterEnable: 'auth-register-enable',
  AuthRegisterEmailSuffixes: 'auth-register-email-suffixes',
  AuthRegisterEmailTemplate: 'auth-register-email-template',
  AuthGoogleEnable: 'auth-google-enable',
  AuthGoogle: 'auth-google',
  AuthGithubEnable: 'auth-github-enable',
  AuthGithub: 'auth-github',
  AuthLinuxDoEnable: 'auth-linuxdo-enable',
  AuthLinuxDo: 'auth-linuxdo',
} as const;

type OptionPresetKey = (typeof OptionPresetKeys)[keyof typeof OptionPresetKeys];

const AUTH_REGISTER_EMAIL_TEMPLATE = {
  subject: 'Pomelo 注册验证码',
  text: '你正在注册 Pomelo 账号。验证码：{{code}}，有效期 {{expiresInMinutes}} 分钟。注册邮箱：{{email}}，站点：{{siteName}}。',
  html: '<p>你正在注册 Pomelo 账号。</p><p>验证码：<strong>{{code}}</strong></p><p>有效期 {{expiresInMinutes}} 分钟。</p><p>注册邮箱：{{email}}</p><p>站点：{{siteName}}</p>',
};

const AUTH_OPTION_DEFAULTS: ReadonlyArray<{
  optionName: OptionPresetKey;
  optionValue: string;
  autoload: 'yes' | 'no';
}> = [
  { optionName: OptionPresetKeys.AuthRegisterEnable, optionValue: '0', autoload: 'yes' },
  { optionName: OptionPresetKeys.AuthRegisterEmailSuffixes, optionValue: '', autoload: 'yes' },
  {
    optionName: OptionPresetKeys.AuthRegisterEmailTemplate,
    optionValue: JSON.stringify(AUTH_REGISTER_EMAIL_TEMPLATE),
    autoload: 'no',
  },
  { optionName: OptionPresetKeys.AuthGoogleEnable, optionValue: '0', autoload: 'yes' },
  { optionName: OptionPresetKeys.AuthGoogle, optionValue: '{}', autoload: 'no' },
  { optionName: OptionPresetKeys.AuthGithubEnable, optionValue: '0', autoload: 'yes' },
  { optionName: OptionPresetKeys.AuthGithub, optionValue: '{}', autoload: 'no' },
  { optionName: OptionPresetKeys.AuthLinuxDoEnable, optionValue: '0', autoload: 'yes' },
  { optionName: OptionPresetKeys.AuthLinuxDo, optionValue: '{}', autoload: 'no' },
];

function getOptionsTableName(queryInterface: QueryInterface) {
  const model = (queryInterface as any).sequelize?.models?.Options;
  const table = model?.getTableName?.();

  if (typeof table === 'string') {
    return table;
  }

  return table?.tableName ?? 'options';
}

function quoteTable(queryInterface: QueryInterface, tableName: string) {
  const directQuoteTable = (queryInterface as any).quoteTable;
  if (typeof directQuoteTable === 'function') {
    return directQuoteTable.call(queryInterface, tableName);
  }

  const queryGenerator = (queryInterface as any).queryGenerator;
  const generatorQuoteTable = queryGenerator?.quoteTable;
  if (typeof generatorQuoteTable === 'function') {
    return generatorQuoteTable.call(queryGenerator, tableName);
  }

  return `\`${tableName.replace(/`/g, '``')}\``;
}

export async function up(queryInterface: QueryInterface) {
  const tableName = getOptionsTableName(queryInterface);
  const quotedTable = quoteTable(queryInterface, tableName);
  const optionNames: OptionPresetKey[] = AUTH_OPTION_DEFAULTS.map(({ optionName }) => optionName);
  const existingRows = (await (queryInterface as any).sequelize.query(
    `select option_name as optionName from ${quotedTable} where option_name in (:optionNames)`,
    {
      replacements: { optionNames },
      type: QueryTypes.SELECT,
    },
  )) as ExistingOptionRow[];
  const existingNames = new Set(existingRows.map(({ optionName }) => optionName));
  const missingOptions = AUTH_OPTION_DEFAULTS.filter(({ optionName }) => !existingNames.has(optionName)).map(
    ({ optionName, optionValue, autoload }) => ({
      option_name: optionName,
      option_value: optionValue,
      autoload: autoload ?? 'yes',
    }),
  );

  if (missingOptions.length) {
    await queryInterface.bulkInsert(tableName, missingOptions);
  }
}

export async function down() {
  throw new Error('Migration 014-add-auth-options is not reversible.');
}
