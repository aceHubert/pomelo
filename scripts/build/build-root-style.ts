import path from 'path';
import glob from 'glob';
import fs from 'fs-extra';
import { cwd } from './constants';

const createStyleFile = (files) => {
  return `// auto generated code
${files
  .map((filepath) => {
    return `import '${filepath.substring(0, filepath.length - path.extname(filepath).length)}';\n`;
  })
  .join('')}`;
};

export const buildRootStyle = (pattern = './**/*/style.{ts,js}', dist = 'style.ts', root = './src') => {
  return new Promise((resolve, reject) => {
    glob(pattern, { cwd: path.resolve(cwd, root) }, async (err, files) => {
      if (err) return reject(err);
      if (files.length === 0) return resolve(0);
      await fs.writeFile(path.resolve(cwd, path.join(root, dist)), createStyleFile(files), 'utf8');
      resolve(0);
    });
  });
};
