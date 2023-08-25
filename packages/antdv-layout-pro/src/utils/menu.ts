import { omit } from 'lodash-es';
import pathToRegexp from 'path-to-regexp';
import { warn } from '@ace-util/core';

// Types
import type { Key, RegExpOptions, ParseOptions } from 'path-to-regexp';
import type { MenuConfig, MenuKeyMap, MenuPathMap, BreadcrumbConfig, PathRegExp } from '../types';

function attachKeys(regex: RegExp, keys: Key[]): PathRegExp {
  const pathRegex = regex as PathRegExp;
  pathRegex.keys = keys;
  return pathRegex;
}

function compilePathRegex(path: string, pathToRegexpOptions?: RegExpOptions & ParseOptions): PathRegExp {
  const keys: Key[] = [];
  const regex = pathToRegexp(path, keys, pathToRegexpOptions);
  if (process.env.NODE_ENV !== 'production') {
    const _keys: any = Object.create(null);
    keys.forEach((key: Key) => {
      warn(!_keys[key.name], `Duplicate param keys in route with path: "${path}"`);
      _keys[key.name] = true;
    });
  }
  return attachKeys(regex, keys);
}

export function createMenuKeyMap(
  menus: MenuConfig[],
  parent: MenuConfig | null = null,
  keyMap: MenuKeyMap = new Map(),
  key: keyof MenuConfig = 'key',
) {
  menus.forEach((v) => {
    keyMap.set(v[key], {
      ...v,
      parent: parent ? omit(parent, 'children') : undefined,
    });
    if (Array.isArray(v.children)) {
      createMenuKeyMap(v.children, v, keyMap, key);
    }
  });
  return keyMap;
}

export function createMenuPathMap(
  menus: MenuConfig[],
  parent: MenuConfig | null = null,
  pathMap: MenuPathMap = new Map(),
) {
  menus.forEach((v) => {
    if (v.path) {
      pathMap.set(v.path, {
        ...v,
        regex: compilePathRegex(v.path),
        aliasRegexs: v.alias?.map((item) => compilePathRegex(item)),
        parent: parent ? omit(parent, 'children') : undefined,
      });
    }
    if (Array.isArray(v.children)) {
      createMenuPathMap(v.children, v, pathMap);
    }
  });
  return pathMap;
}

export function createFlatMenus(menus: MenuConfig[], flatMenus: MenuConfig[] = []) {
  menus.forEach((v) => {
    flatMenus.push(v);
    v.children && createFlatMenus(flatMenus, v.children);
  });
  return flatMenus;
}

// 找到未注册或菜单配置之外的路径的父路径
export function matchNoRegistPageParentPath(path: string, pathMap: MenuPathMap) {
  // 找出可能的父路径集合
  const pathArr = [...pathMap.keys()]
    .filter((v) => path.startsWith(v))
    .map((v) => {
      return {
        len: path.substring(v.length).length,
        path: v,
      };
    })
    .sort((a, b) => a.len - b.len);
  if (!pathArr[0]) return '';

  return pathArr[0].path;
}

// 根据已注册的path，生成breadcrumblist
export function createBreadcrumbList(
  path: string,
  pathMap: MenuPathMap,
  list: Array<BreadcrumbConfig> = [],
): Array<BreadcrumbConfig> {
  const menu = pathMap.get(path);
  if (!menu) return list;

  menu.breadcrumb !== false && list.unshift({ key: menu.key, path, label: menu.title });

  // 一级菜单
  if (!menu.parent?.path) {
    menu.parent &&
      list.unshift({ key: menu.parent.key, path: menu.parent.redirect || '', label: menu.parent.title || '' });
    // 去掉最后一级path
    list.length && (list[list.length - 1].path = '');
    return list;
  } else {
    return createBreadcrumbList(menu.parent.path, pathMap, list);
  }
}
