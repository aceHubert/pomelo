import path from 'path';
import fs from 'fs';
import os from 'os';
import { Injectable, Logger } from '@nestjs/common';
import {
  DbInitDataSource as InfrastructureDbInitDataSource,
  version as InfrastructureVersion,
  InitArgs as InfrastructureInitArgs,
} from '@ace-pomelo/infrastructure-datasource';

const lockDbFile = path.join(process.cwd(), 'db.lock');

@Injectable()
export class DbInitService {
  private readonly logger = new Logger(DbInitService.name, { timestamp: true });

  constructor(private readonly infrastructureDbInitDataSource: InfrastructureDbInitDataSource) {}

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
  initDB(initArgs: InfrastructureInitArgs): Promise<void> {
    return this.infrastructureDbInitDataSource
      .initDB({
        alter: true,
        // match: /_dev$/,
        when: () => this.hasDbLockFile().then((initialized) => !initialized),
      })
      .then((flag) => {
        if (flag) {
          this.setEnvValue('INFRASTRUCTURE_MODULE', InfrastructureVersion);
          this.logger.log('Initialize database successful!');

          // 初始化数据
          return this.initDatas(initArgs);
        } else {
          this.logger.warn('Database has been already initialized!');
          return;
        }
      });
  }

  /**
   * Initialize the datas
   */
  private async initDatas(initArgs: InfrastructureInitArgs) {
    this.logger.log('Start to initialize datas!');
    await this.infrastructureDbInitDataSource.initDatas(initArgs);
    this.logger.log('Initialize datas successful!');
  }
}
