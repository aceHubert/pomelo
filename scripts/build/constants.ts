import path from 'path';
import fs from 'fs-extra';
import { getConfigs } from './shared';
import { IBuilderConfig } from './types';

export const cwd = process.cwd();

export const entry = path.resolve(cwd, 'src/index.ts');

const configs = getConfigs('builder.config');

export const builderConfigs: IBuilderConfig = configs?.BuilderConfig ?? configs ?? {};

let pkg: any = {};

try {
  pkg = fs.readJSONSync(path.resolve(cwd, 'package.json'));
} catch {
  pkg = {};
}

export { pkg };
