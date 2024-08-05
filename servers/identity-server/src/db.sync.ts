import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { UniqueConstraintError } from 'sequelize';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseManager, version, name } from '@ace-pomelo/identity-datasource';
import { FileEnv } from '@ace-pomelo/shared-server';

const logger = new Logger('DbSync', { timestamp: true });

// env file
const envFilePaths = process.env.ENV_FILE
  ? [process.env.ENV_FILE]
  : process.env.NODE_ENV === 'production'
  ? ['.env.production', '.env']
  : ['.env.development.local', '.env.development'];
let config: Record<string, any> = {};
for (const envFilePath of envFilePaths) {
  if (fs.existsSync(envFilePath)) {
    config = Object.assign(dotenv.parse(fs.readFileSync(envFilePath)), config);
  }
}
const configService = new ConfigService(config);

// sync database
async function syncDatabase() {
  const connection = configService.get('IDENTITY_DATABASE_CONNECTION')
    ? configService.get('IDENTITY_DATABASE_CONNECTION')
    : {
        database: configService.get('IDENTITY_DATABASE_NAME'),
        username: configService.get('IDENTITY_DATABASE_USERNAME'),
        password: configService.get('IDENTITY_DATABASE_PASSWORD'),
        dialect: configService.get('IDENTITY_DATABASE_DIALECT', 'mysql'),
        host: configService.get('IDENTITY_DATABASE_HOST', 'localhost'),
        port: configService.get('IDENTITY_DATABASE_PORT', 3306),
        define: {
          charset: configService.get('IDENTITY_DATABASE_CHARSET', 'utf8'),
          collate: configService.get('IDENTITY_DATABASE_COLLATE', ''),
        },
      };
  const tablePrefix = configService.get('TABLE_PREFIX');

  // db lock file
  const fileEnv = FileEnv.getInstance(path.join(process.cwd(), '..', 'db.lock'));

  // 初始化数据库
  const dbManager =
    typeof connection === 'string'
      ? new DatabaseManager(connection, { tablePrefix })
      : new DatabaseManager({ ...connection, tablePrefix });
  await dbManager
    .sync({
      alter: false,
      // match: /_dev$/,
      // TODO: version compare
      when: !fileEnv.getEnv(name),
    })
    .then((flag) => {
      if (flag) {
        fileEnv.setEnv(name, 'PENDING');
        logger.debug('Initialize database successful!');
      }
    });

  // 初始化数据
  const needInitDates = fileEnv.getEnv(name) === 'PENDING';
  if (needInitDates) {
    logger.debug('Start to initialize datas!');
    try {
      const origin = configService.get(
        'ORIGIN',
        'http://localhost:' + configService.get<number>('webServer.port', 3000),
      );
      const webURL = configService.get('WEB_URL', origin);

      await dbManager.initDatas({
        apiResources: [],
        identityResources: [
          {
            name: 'openid',
            displayName: 'Your account identifier',
            emphasize: false,
            required: true,
            showInDiscoveryDocument: true,
            nonEditable: true,
            claims: ['sub'],
          },
          {
            name: 'profile',
            displayName: 'User profile',
            description: 'Your user profile information (first name, last name, etc.)',
            emphasize: true,
            required: false,
            showInDiscoveryDocument: true,
            nonEditable: true,
            claims: [
              'role',
              'login_name',
              'display_name',
              'nice_name',
              'nick_name',
              'avatar',
              'gender',
              'locale',
              'timezone',
              'url',
              'updated_at',
            ],
          },
          {
            name: 'phone',
            displayName: 'Your phone number',
            emphasize: true,
            required: false,
            showInDiscoveryDocument: true,
            nonEditable: false,
            claims: ['phone_number', 'phone_number_verified'],
          },
          {
            name: 'email',
            displayName: 'Your email address',
            emphasize: true,
            required: false,
            showInDiscoveryDocument: true,
            nonEditable: false,
            claims: ['email', 'email_verified'],
          },
        ],
        clients: [
          {
            applicationType: 'native',
            clientId: '041567b1-3d71-4ea8-9ac2-8f3d28dab170',
            clientName: 'Pomelo Identity Server',
            accessTokenFormat: 'jwt',
            requireAuthTime: true,
            requirePkce: true,
            tokenEndpointAuthMethod: 'client_secret_basic',
            scopes: ['openid', 'profile', 'offline_access'],
            redirectUris: [],
            postLogoutRedirectUris: [],
            secrets: [
              {
                type: 'SharedSecret',
                // VcjMW2QIAt
                value: '55c02a1df42f8baa4c26f83aabee9d04a2369051df8b4cd1d8da589640723207',
              },
            ],
          },
          {
            applicationType: 'native',
            clientId: 'f6b2c633-4f9e-4b7a-8f2a-9a4b4e9b0b9b',
            clientName: 'Pomelo Identity Api Server',
            accessTokenFormat: 'jwt',
            requireAuthTime: true,
            requirePkce: true,
            tokenEndpointAuthMethod: 'client_secret_basic',
            scopes: ['openid', 'profile', 'offline_access'],
            grantTypes: ['client_credentials'],
            redirectUris: [],
            postLogoutRedirectUris: [],
            secrets: [
              {
                type: 'SharedSecret',
                // X6agw8RoEC
                value: '95cd8ad27f6bd19b508801620faddd11c1d19841386cd105864a60543b5b2431',
              },
            ],
          },
          {
            applicationType: 'native',
            clientId: '75a9c633-cfde-4954-b35c-9344ed9b781a',
            clientName: 'Pomelo Infratructure Api Server',
            accessTokenFormat: 'jwt',
            requireAuthTime: true,
            requirePkce: true,
            tokenEndpointAuthMethod: 'client_secret_basic',
            scopes: ['openid', 'profile', 'offline_access'],
            grantTypes: ['client_credentials'],
            redirectUris: [],
            postLogoutRedirectUris: [],
            secrets: [
              {
                type: 'SharedSecret',
                // XCy6KS_qTG
                value: '4c2a29bf6b66c4174a121de5e62fb33a25cf123bdb01b9c96c8bbfa53a68b9b2',
              },
            ],
          },
          {
            applicationType: 'web',
            clientId: '3d136433-977f-40c7-8702-a0444a6b2a9f',
            clientName: 'Pomelo Client Web App',
            accessTokenFormat: 'jwt',
            requireAuthTime: true,
            requirePkce: true,
            tokenEndpointAuthMethod: 'none',
            scopes: ['openid', 'profile', 'phone', 'email', 'offline_access'],
            grantTypes: ['authorization_code', 'refresh_token'],
            corsOrigins: webURL ? [new URL(webURL).origin] : [],
            redirectUris: webURL
              ? [`${webURL}/signin`, `${webURL}/signin.html`, `${webURL}/signin-silent`, `${webURL}/signin-silent.html`]
              : [],
            postLogoutRedirectUris: webURL ? [webURL] : [],
            secrets: [
              {
                type: 'SharedSecret',
                // 1BLXK7e8qD
                value: 'ea7441ccb965e5b91752bd78adee6e7d32dfb8d93dfe65e15c5c4f02824d5e0b',
              },
            ],
          },
        ],
      });
      fileEnv.setEnv(name, version);
      logger.debug('Initialize datas successful!');
    } catch (err) {
      if (err instanceof UniqueConstraintError) {
        fileEnv.setEnv(name, version);
        logger.debug('Datas already initialized!');
      } else {
        throw err;
      }
    }
  } else {
    logger.debug('Datas already initialized!');
  }
}

export { envFilePaths, syncDatabase };
