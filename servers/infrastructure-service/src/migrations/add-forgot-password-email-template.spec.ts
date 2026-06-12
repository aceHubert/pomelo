import { AUTH_FORGOT_PASSWORD_EMAIL_TEMPLATE, OptionPresetKeys } from '@ace-pomelo/shared/server';
import { up } from '../../migrations/015-add-forgot-password-email-template';

describe('015-add-forgot-password-email-template migration', () => {
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

  it('inserts the forgot password email template when missing', async () => {
    const queryInterface = createQueryInterface();

    await up(queryInterface as any);

    expect(queryInterface.sequelize.query).toHaveBeenCalledWith(
      'select option_name as optionName from `wp_options` where option_name in (:optionNames)',
      expect.objectContaining({
        replacements: {
          optionNames: [OptionPresetKeys.AuthForgotPasswordEmailTemplate],
        },
      }),
    );
    expect(queryInterface.bulkInsert).toHaveBeenCalledWith('wp_options', [
      {
        option_name: OptionPresetKeys.AuthForgotPasswordEmailTemplate,
        option_value: JSON.stringify(AUTH_FORGOT_PASSWORD_EMAIL_TEMPLATE),
        autoload: 'no',
      },
    ]);
  });

  it('does not insert rows when the template already exists', async () => {
    const queryInterface = createQueryInterface([OptionPresetKeys.AuthForgotPasswordEmailTemplate]);

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
