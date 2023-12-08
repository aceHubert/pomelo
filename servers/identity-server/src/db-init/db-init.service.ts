import path from 'path';
import fs from 'fs';
import os from 'os';
import { Injectable, Logger } from '@nestjs/common';
import {
  DbInitDataSource as IdentityDbInitDataSource,
  version as IdentityVersion,
} from '@ace-pomelo/identity-datasource';

const lockDbFile = path.join(process.cwd(), 'db.lock');

@Injectable()
export class DbInitService {
  private readonly logger = new Logger(DbInitService.name, { timestamp: true });

  constructor(private readonly identityDbInitDataSource: IdentityDbInitDataSource) {}

  /**
   * check if the lock file exists
   */
  hasDbLockFile(): Promise<boolean> {
    return new Promise((resolve) => {
      fs.access(lockDbFile, fs.constants.F_OK, (err) => {
        if (err) resolve(false);

        resolve(true);
      });
    });
  }

  /**
   * read lock file & convert to array
   */
  readDbLockFile() {
    try {
      return fs.readFileSync(lockDbFile, 'utf-8').split(os.EOL);
    } catch {
      return [];
    }
  }

  /**
   * Finds the key in lock files and returns the corresponding value
   * @param {string} key Key to find
   * @returns {string|null} Value of the key
   */
  getEnvValue(key: string) {
    // find the line that contains the key (exact match)
    const matchedLine = this.readDbLockFile().find((line) => line.split('=')[0] === key);
    // split the line (delimiter is '=') and return the item at index 2
    return matchedLine !== undefined ? matchedLine.split('=')[1] : null;
  }

  /**
   * Updates value for existing key or creates a new key=value line
   * This function is a modified version of https://stackoverflow.com/a/65001580/3153583
   * @param {string} key Key to update/insert
   * @param {string} value Value to update/insert
   */
  setEnvValue = (key: string, value: string) => {
    const envVars = this.readDbLockFile();
    const targetLine = envVars.find((line) => line.split('=')[0] === key);
    if (targetLine !== undefined) {
      // update existing line
      const targetLineIndex = envVars.indexOf(targetLine);
      // replace the key/value with the new value
      envVars.splice(targetLineIndex, 1, `${key}="${value}"`);
    } else {
      // create new key value
      envVars.push(`${key}="${value}"`);
    }
    // write everything back to the file system
    fs.writeFileSync(lockDbFile, envVars.join(os.EOL));
  };

  /**
   * Initialize the database and datas
   */
  initDB(): Promise<void> {
    return this.identityDbInitDataSource
      .initDB({
        alter: true,
        // match: /_dev$/,
        when: () => this.hasDbLockFile().then((initialized) => !initialized),
      })
      .then((flag) => {
        if (flag) {
          this.setEnvValue('IDENTITY_MODULE', IdentityVersion);
          this.logger.log('Database initialize successful!');

          // 初始化数据
          return this.initDatas();
        } else {
          this.logger.warn('Dababase has been already initialized!');
          return;
        }
      });
  }

  /**
   * Initialize the datas
   */
  private async initDatas() {
    this.logger.log('Start to initialize datas!');
    await this.identityDbInitDataSource.initDatas({
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
    this.logger.log('Initialize datas successful!');
  }
}
