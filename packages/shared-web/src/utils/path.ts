/**
 * 末尾添加'/'
 * @param  path 路径
 */
export function trailingSlash(path: string) {
  return path.endsWith('/') ? path : `${path}/`;
}

/**
 * 判断是否为绝对URL地址
 * @param {string} url URL字符串
 * @returns {boolean} true/false
 */
export function isAbsoluteUrl(url: string) {
  return /^(https?:\/\/|\/\/)[\w.]+\/?/gi.test(url);
}

/**
 * 绝对URL跳转
 * @param {string} url 目标URL
 * @param {boolean} replace 是否使用replace方式跳转
 */
export function absoluteGo(url: string, replace = false) {
  try {
    window.location[replace ? 'replace' : 'assign'](url);
  } catch (e) {
    window.location.href = url;
  }
}
