import path from 'path';
import glob from 'glob';
import fs from 'fs-extra';
import { cwd } from './constants';

export const copyStyleFiles = () => {
  return new Promise((resolve, reject) => {
    glob('src/**/*.{less,scss,sass,css}', { cwd }, async (err, files) => {
      if (err) return reject(err);
      files.forEach((filename) => {
        const filepath = path.resolve(cwd, filename);
        const distPathEs = filepath.replace(/src\//, 'esm/').replace(/src\\/, 'esm\\');
        const distPathLib = filepath.replace(/src\//, 'lib/').replace(/src\\/, 'lib\\');
        fs.copySync(filepath, distPathEs);
        fs.copySync(filepath, distPathLib);
      });
      resolve(0);
    });
  });
};
