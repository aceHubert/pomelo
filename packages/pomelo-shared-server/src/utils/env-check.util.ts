import path from 'path';
import fs from 'fs';
import os from 'os';

class LockFile {
  constructor(private readonly fileName: string) {}

  /**
   * check if the lock file exists
   */
  hasFile(): Promise<boolean> {
    return new Promise((resolve) => {
      fs.access(this.fileName, fs.constants.F_OK, (err) => {
        if (err) resolve(false);

        resolve(true);
      });
    });
  }

  /**
   * read lock file & convert to array
   */
  readFile(): string[] {
    try {
      return fs.readFileSync(this.fileName, 'utf-8').split(os.EOL);
    } catch {
      return [];
    }
  }

  /**
   * Finds the key in lock files and returns the corresponding value
   * @param {string} key Key to find
   * @returns {string|null} Value of the key
   */
  getEnvValue(key: string, defaultValue?: string) {
    // find the line that contains the key (exact match)
    const matchedLine = this.readFile().find((line) => line.split('=')[0] === key);
    // split the line (delimiter is '=') and return the item at index 2
    return matchedLine !== undefined ? matchedLine.split('=')[1]?.replace(/^"/, '').replace(/"$/, '') : defaultValue;
  }

  /**
   * Updates value for existing key or creates a new key=value line
   * This function is a modified version of https://stackoverflow.com/a/65001580/3153583
   * @param {string} key Key to update/insert
   * @param {string} value Value to update/insert
   */
  setEnvValue(key: string, value: string) {
    const envVars = this.readFile();
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
    fs.writeFileSync(this.fileName, envVars.join(os.EOL));
  }
}

export class FileEnv {
  private static instance: FileEnv;
  private readonly lockFile: LockFile;

  private constructor(fileName?: string) {
    this.lockFile = new LockFile(fileName || path.join(process.cwd(), 'env.lock'));
  }

  static getInstance(fileName?: string) {
    if (!FileEnv.instance) {
      FileEnv.instance = new FileEnv(fileName);
    }
    return FileEnv.instance;
  }

  hasFile() {
    return this.lockFile.hasFile();
  }

  hasEnv(key: string) {
    return this.lockFile.getEnvValue(key) !== undefined;
  }

  getEnv(key: string, defaultValue?: string) {
    return this.lockFile.getEnvValue(key, defaultValue);
  }

  setEnv(key: string, value: string) {
    this.lockFile.setEnvValue(key, value);
  }
}
