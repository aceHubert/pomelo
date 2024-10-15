import * as fs from 'fs';

/**
 * 开头前置'/'
 * @param  path 路径
 */
export function foregoingSlash(path: string) {
  return path.startsWith('/') ? path : '/' + path;
}

/**
 * 末尾添加'/'
 * @param  path 路径
 */
export function trailingSlash(path: string) {
  return path.endsWith('/') ? path : path + '/';
}

/**
 * 删除前置'/'
 * @param  path 路径
 */
export function stripForegoingSlash(path: string) {
  return path.startsWith('/') ? path.substring(1) : path;
}

/**
 * 删除末尾'/'
 * @param  path 路径
 */
export function stripTrailingSlash(path: string) {
  return path.endsWith('/') ? path.substring(0, path.length - 1) : path;
}

/**
 * 添加前置'/'，移除末尾'/'
 */
export function normalizeRoutePath(path: string) {
  path = foregoingSlash(path);
  return stripTrailingSlash(path);
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
      throw new Error(`file does not exist!`);
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

/**
 * check if the path is an external link
 * @param {string} url url
 * @returns {boolean} true/false
 */
export function isAbsoluteUrl(url: string) {
  return /^(https?:\/\/|\/\/)[\w.]+\/?/gi.test(url);
}
