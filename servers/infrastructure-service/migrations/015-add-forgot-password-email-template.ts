import { QueryTypes } from 'sequelize';
import type { QueryInterface } from 'sequelize';

type ExistingOptionRow = {
  optionName: string;
};

const AUTH_FORGOT_PASSWORD_EMAIL_TEMPLATE_OPTION_NAME = 'auth-forgot-password-email-template';

const AUTH_FORGOT_PASSWORD_EMAIL_TEMPLATE = {
  subject: 'Pomelo 重置密码验证码',
  text: '你正在重置 Pomelo 账号密码。验证码：{{code}}，有效期 {{expiresInMinutes}} 分钟。账号邮箱：{{email}}，站点：{{siteName}}。如非本人操作请忽略本邮件。',
  html: '<p>你正在重置 Pomelo 账号密码。</p><p>验证码：<strong>{{code}}</strong></p><p>有效期 {{expiresInMinutes}} 分钟。</p><p>账号邮箱：{{email}}</p><p>站点：{{siteName}}</p><p>如非本人操作请忽略本邮件。</p>',
};

const FORGOT_PASSWORD_OPTION_DEFAULTS: ReadonlyArray<{
  optionName: string;
  optionValue: string;
  autoload: 'yes' | 'no';
}> = [
  {
    optionName: AUTH_FORGOT_PASSWORD_EMAIL_TEMPLATE_OPTION_NAME,
    optionValue: JSON.stringify(AUTH_FORGOT_PASSWORD_EMAIL_TEMPLATE),
    autoload: 'no',
  },
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
  const optionNames = FORGOT_PASSWORD_OPTION_DEFAULTS.map(({ optionName }) => optionName);
  const existingRows = (await (queryInterface as any).sequelize.query(
    `select option_name as optionName from ${quotedTable} where option_name in (:optionNames)`,
    {
      replacements: { optionNames },
      type: QueryTypes.SELECT,
    },
  )) as ExistingOptionRow[];
  const existingNames = new Set(existingRows.map(({ optionName }) => optionName));
  const missingOptions = FORGOT_PASSWORD_OPTION_DEFAULTS.filter(({ optionName }) => !existingNames.has(optionName)).map(
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
  throw new Error('Migration 015-add-forgot-password-email-template is not reversible.');
}
