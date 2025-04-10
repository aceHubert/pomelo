import { UniqueConstraintError } from 'sequelize';
import { Logger, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PresetConfigObject } from '@ace-pomelo/shared/server';
import { IdentityDatasourceService, name } from '@/datasource';
import { getDbLockFileEnv } from '@/common/utils/lock-file.util';
import { version } from './version';

const logger = new Logger('DbSync', { timestamp: true });

// sync database
export async function syncDatabase(app: INestApplication<any>) {
  const configService = app.get(ConfigService<PresetConfigObject>);
  const datasourceService = app.get(IdentityDatasourceService);

  const fileEnv = getDbLockFileEnv(configService);

  // 初始化数据库
  await datasourceService
    .syncDB({
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
      const origin = `${configService.get<boolean>('server.https', false) ? 'http' : 'https'}://${configService.get(
        'server.name',
        'localhost',
      )}`;
      const webURL = configService.get('WEB_URL', origin);

      await datasourceService.initDatas({
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
            clientId: '75a9c633-cfde-4954-b35c-9344ed9b781a',
            clientName: 'Pomelo ApiSix Gateway',
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
            postLogoutRedirectUris: webURL
              ? [webURL, `${webURL}/signout`, `${webURL}/signout.html`, `${webURL}/admin`]
              : [],
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
    } catch (err: any) {
      if (err instanceof UniqueConstraintError) {
        fileEnv.setEnv(name, version);
        logger.debug('Datas already initialized!');
      } else {
        logger.error(err.message);
        process.exit(1);
      }
    }
  } else {
    logger.debug('Datas already initialized!');
  }
}
