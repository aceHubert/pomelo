/* eslint-disable no-console */
import * as path from 'path';
import * as fs from 'fs';
import dotenv from 'dotenv';
import { DatabaseManager, version } from '@ace-pomelo/identity-datasource';
import { LockFile } from './common/utils/lock-file.util';

export const dbLockFileName = path.join(process.cwd(), 'db.lock');
export const envFilePaths =
  process.env.ENV_FILE ??
  (process.env.NODE_ENV === 'production'
    ? ['.env.production.local', '.env.production', '.env']
    : ['.env.development.local', '.env.development']);

// 初始化数据库
export async function syncDatabase() {
  const dbLockFile = new LockFile(dbLockFileName);

  let config: Record<string, any> = {};
  for (const envFilePath of envFilePaths) {
    if (fs.existsSync(envFilePath)) {
      config = Object.assign(dotenv.parse(fs.readFileSync(envFilePath)), config);
    }
  }

  const connection = config.IDENTITY_DATABASE_CONNECTION
    ? config.IDENTITY_DATABASE_CONNECTION
    : {
        database: config.IDENTITY_DATABASE_NAME,
        username: config.IDENTITY_DATABASE_USERNAME,
        password: config.IDENTITY_DATABASE_PASSWORD,
        dialect: config.IDENTITY_DATABASE_DIALECT || 'mysql',
        host: config.IDENTITY_DATABASE_HOST || 'localhost',
        port: config.IDENTITY_DATABASE_PORT || 3306,
        define: {
          charset: config.IDENTITY_DATABASE_CHARSET || 'utf8',
          collate: config.IDENTITY_DATABASE_COLLATE || '',
        },
      };
  const tablePrefix = config.IDENTITY_TABLE_PREFIX;

  // 初始化数据库
  const dbManager =
    typeof connection === 'string'
      ? new DatabaseManager(connection, { tablePrefix })
      : new DatabaseManager({ ...connection, tablePrefix });
  await dbManager
    .sync({
      alter: false,
      // match: /_dev$/,
      when: () => dbLockFile.hasFile().then((initialized) => !initialized),
    })
    .then((flag) => {
      if (flag) {
        dbLockFile.setEnvValue('INFRASTRUCTURE_DATASOURCE', version);
        console.log('Initialize database successful!');
      }
    });

  // 初始化数据
  const needInitDates = dbLockFile.getEnvValue('INIT_DATAS_REQUIRED') !== 'false';
  if (needInitDates) {
    console.log('Start to initialize datas!');
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
          claims: ['sub', 'role'],
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
          clientId: '041567b1-3d71-4ea8-9ac2-8f3d28dab170',
          clientName: 'Pomelo Identity Server',
          accessTokenTormat: 'jwt',
          requireAuthTime: true,
          requirePkce: true,
          tokenEndpointAuthMethod: 'client_secret_basic',
          scopes: ['openid', 'profile', 'offline_access'],
          grantTypes: ['client_credentials'],
          secrets: [
            {
              type: 'SharedSecret',
              // VcjMW2QIAt
              value: '55c02a1df42f8baa4c26f83aabee9d04a2369051df8b4cd1d8da589640723207',
            },
          ],
        },
        {
          clientId: 'f6b2c633-4f9e-4b7a-8f2a-9a4b4e9b0b9b',
          clientName: 'Pomelo Identity Api Server',
          accessTokenTormat: 'jwt',
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
          clientId: '75a9c633-cfde-4954-b35c-9344ed9b781a',
          clientName: 'Pomelo Infratructure Api Server',
          accessTokenTormat: 'jwt',
          requireAuthTime: true,
          requirePkce: true,
          tokenEndpointAuthMethod: 'client_secret_basic',
          scopes: ['openid', 'profile', 'offline_access'],
          grantTypes: ['authorization_code', 'client_credentials'],
          redirectUris: ['http://localhost:5002/login/callback'],
          postLogoutRedirectUris: ['http://localhost:5002'],
          secrets: [
            {
              type: 'SharedSecret',
              // XCy6KS_qTG
              value: '4c2a29bf6b66c4174a121de5e62fb33a25cf123bdb01b9c96c8bbfa53a68b9b2',
            },
          ],
        },
        {
          clientId: '35613c26-6a86-ba04-8ee0-6ced9688c75a',
          clientName: 'Pomelo Admin Managment Web App',
          accessTokenTormat: 'jwt',
          requireAuthTime: true,
          requirePkce: true,
          tokenEndpointAuthMethod: 'none',
          scopes: ['openid', 'profile', 'phone', 'email', 'offline_access'],
          grantTypes: ['authorization_code', 'implicit', 'refresh_token'],
          redirectUris: ['https://localhost:5011/signin.html', 'https://localhost:5011/signin-silent.html'],
          postLogoutRedirectUris: ['https://localhost:5011'],
          secrets: [
            {
              type: 'SharedSecret',
              // GgXh3G-HEM
              value: 'd57a107e52f6a0eef6105e7b1aecb42e28e54001295007dd8abfe2744d22ca38',
            },
          ],
        },
        {
          clientId: '3d136433-977f-40c7-8702-a0444a6b2a9f',
          clientName: 'Pomelo Client Web App',
          accessTokenTormat: 'jwt',
          requireAuthTime: true,
          requirePkce: true,
          tokenEndpointAuthMethod: 'none',
          scopes: ['openid', 'profile', 'phone', 'email', 'offline_access'],
          grantTypes: ['authorization_code', 'implicit', 'refresh_token'],
          redirectUris: ['https://localhost:5013/signin.html', 'https://localhost:5013/signin-silent.html'],
          postLogoutRedirectUris: ['https://localhost:5013'],
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
    dbLockFile.setEnvValue('INIT_DATAS_REQUIRED', 'false');
    console.log('Initialize datas successful!');
  }
}
