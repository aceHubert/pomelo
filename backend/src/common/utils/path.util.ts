import * as fs from 'fs';

/**
 * 末尾添加'/'
 * @param  path 路径
 */
export function trailingSlash(path: string) {
  return path.endsWith('/') ? path : path + '/';
}

/**
 * 确保文件是否存在
 * @param path 文件路径
 */
export function ensureFileExists(path: string) {
  try {
    const stat = fs.statSync(path);
    if (!stat.isFile()) {
      throw new Error(`path "${path}" is not a file!`);
    }
  } catch (err: any) {
    if (err?.code === 'ENOENT') {
      throw new Error(`file is not exists!`);
    }
    throw err;
  }
}

/**
 * 确保目录是否存在，如果不存在尝试新建
 * @param path 目录路径
 * @param autoCreate 自动创建目录
 */
export function ensureDirExists(path: string, autoCreate = true) {
  try {
    const stat = fs.statSync(path);
    if (!stat.isDirectory()) {
      throw new Error(`path "${path}" is not a directory!`);
    }
  } catch (err: any) {
    if (err?.code === 'ENOENT' && autoCreate) {
      try {
        autoCreate && fs.mkdirSync(path, { recursive: true });
      } catch {}
    } else {
      throw err;
    }
  }
}
