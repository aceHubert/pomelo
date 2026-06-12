import { AUTH_OPTION_DEFAULTS, OptionPresetKeys } from '@ace-pomelo/shared/server';
import { up } from '../../migrations/014-add-auth-options';

// 014 只负责注册/社交登录相关 options，忘记密码邮件模板由 015 迁移插入。
const MIGRATION_014_OPTION_DEFAULTS = AUTH_OPTION_DEFAULTS.filter(
  ({ optionName }) => optionName !== OptionPresetKeys.AuthForgotPasswordEmailTemplate,
);

describe('014-add-auth-options migration', () => {
  const createQueryInterface = (existingOptionNames: string[] = []) => {
    const queryInterface = {
      sequelize: {
        models: {
          Options: {
            getTableName: () => 'wp_options',
          },
        },
        query: jest.fn(async () => existingOptionNames.map((optionName) => ({ optionName }))),
      },
      quoteTable: jest.fn((tableName: string) => `\`${tableName}\``),
      bulkInsert: jest.fn(async () => undefined),
    };

    return queryInterface;
  };

  it('inserts shared auth defaults without overwriting existing values', async () => {
    const existingOptionName = OptionPresetKeys.AuthGithubEnable;
    const queryInterface = createQueryInterface([existingOptionName]);

    await up(queryInterface as any);

    const expectedRows = MIGRATION_014_OPTION_DEFAULTS.filter(
      ({ optionName }) => optionName !== existingOptionName,
    ).map(({ optionName, optionValue, autoload }) => ({
      option_name: optionName,
      option_value: optionValue,
      autoload: autoload ?? 'yes',
    }));

    expect(queryInterface.sequelize.query).toHaveBeenCalledWith(
      'select option_name as optionName from `wp_options` where option_name in (:optionNames)',
      expect.objectContaining({
        replacements: {
          optionNames: MIGRATION_014_OPTION_DEFAULTS.map(({ optionName }) => optionName),
        },
      }),
    );
    expect(queryInterface.bulkInsert).toHaveBeenCalledWith('wp_options', expectedRows);
  });

  it('does not insert rows when all auth defaults already exist', async () => {
    const queryInterface = createQueryInterface(MIGRATION_014_OPTION_DEFAULTS.map(({ optionName }) => optionName));

    await up(queryInterface as any);

    expect(queryInterface.bulkInsert).not.toHaveBeenCalled();
  });

  it('quotes table names through query generator when query interface has no direct quoteTable', async () => {
    const queryInterface = createQueryInterface();
    const directQuoteTable = queryInterface.quoteTable;
    delete (queryInterface as any).quoteTable;
    (queryInterface as any).queryGenerator = {
      quoteTable: jest.fn((tableName: string) => `\`${tableName}\``),
    };

    await up(queryInterface as any);

    expect(directQuoteTable).not.toHaveBeenCalled();
    expect((queryInterface as any).queryGenerator.quoteTable).toHaveBeenCalledWith('wp_options');
    expect(queryInterface.sequelize.query).toHaveBeenCalledWith(
      'select option_name as optionName from `wp_options` where option_name in (:optionNames)',
      expect.any(Object),
    );
  });
});
