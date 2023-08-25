import path from 'path';
import fs from 'fs-extra';
import glob from 'glob';
import rimraf from 'rimraf';
import execa from 'execa';
import { copyStyleFiles } from './copy-style-files';
import { buildRootStyle } from './build-root-style';
import { buildLibrary } from './build-library';
import { buildUmd } from './build-umd';
import { fixDepsPaths } from './fix-deps-paths';
import { cwd } from './constants';

const getRootPackage = async () => {
  try {
    return await fs.readJSON(path.resolve(cwd, 'package.json'));
  } catch {
    return {};
  }
};

const isMonorepoRoot = async () => {
  try {
    const lerna = await fs.readJSON(path.resolve(cwd, 'lerna.json'));
    return !!lerna;
  } catch {
    return false;
  }
};

const searchPackages = async () => {
  const root = await getRootPackage();
  const workspaces = root.workspaces || [];
  const packages: string[] = [];
  workspaces.forEach((pattern) => {
    const results = glob.sync(pattern, { cwd });
    results.forEach((filename) => {
      try {
        const package_path = path.resolve(cwd, filename);
        const stat = fs.statSync(package_path);
        if (stat.isDirectory()) {
          packages.push(package_path);
        }
      } catch {}
    });
  });
  return packages;
};

const cleanupPackage = (pattern) => {
  return new Promise((resolve, reject) => {
    rimraf(path.resolve(`${pattern}/{esm,lib,dist}`), (err) => {
      if (err) return reject(err);
      resolve(0);
    });
  });
};

const cleanupPackages = async () => {
  const isMonorepo = await isMonorepoRoot();
  if (isMonorepo) {
    const packages = await searchPackages();
    for (let pattern of packages) {
      await cleanupPackage(pattern);
    }
  }
};

const buildPackage = async () => {
  await buildRootStyle();
  await copyStyleFiles();
  await buildLibrary();
  await buildUmd();
  await fixDepsPaths();
};

const buildPackages = async () => {
  const isMonorepo = await isMonorepoRoot();
  if (isMonorepo) {
    execa('lerna', ['run', 'build']).stdout?.pipe(process.stdout);
  } else {
    await buildPackage();
  }
};

const build = async () => {
  await cleanupPackages();
  await buildPackages();
};

build();
