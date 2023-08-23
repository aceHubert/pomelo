import { omit } from 'lodash-es';
import pathToRegexp from 'path-to-regexp';
import { warn } from '@pomelo/shared-web';

// types
import type { Key, RegExpOptions, ParseOptions } from 'path-to-regexp';
import type { MenuConfig, BreadcrumbCofnig } from '@/types';

interface PathRegExp extends RegExp {
  // An array to be populated with the keys found in the path.
  keys: Key[];
}

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

export function createMenuMap(
  keyMap: Dictionary<MenuConfig & { parent?: Omit<MenuConfig, 'children'> }> = {},
  parent: MenuConfig | null = null,
  menus: MenuConfig[],
  mapKey: keyof MenuConfig = 'key',
) {
  menus.forEach((v) => {
    keyMap[v[mapKey]] = {
      ...v,
      parent: parent ? omit(parent, 'children') : undefined,
    };
    if (Array.isArray(v.children)) {
      createMenuMap(keyMap, v, v.children, mapKey);
    }
  });
  return keyMap;
}

export function createMenuPathMap(
  pathMap: Dictionary<
    MenuConfig & { regex: PathRegExp; aliasRegexs?: PathRegExp[]; parent?: Omit<MenuConfig, 'children'> }
  > = {},
  parent: MenuConfig | null = null,
  menus: MenuConfig[],
) {
  menus.forEach((v) => {
    if (v.path) {
      pathMap[v.path] = {
        ...v,
        regex: compilePathRegex(v.path),
        aliasRegexs: v.alias?.map((item) => compilePathRegex(item)),
        parent: parent ? omit(parent, 'children') : undefined,
      };
    }
    if (Array.isArray(v.children)) {
      createMenuPathMap(pathMap, v, v.children);
    }
  });
  return pathMap;
}

export function createFlatMenus(flatMenus: MenuConfig[] = [], menus: MenuConfig[]) {
  menus.forEach((v) => {
    flatMenus.push(v);
    v.children && createFlatMenus(flatMenus, v.children);
  });
  return flatMenus;
}

// 找到未注册或菜单配置之外的路径的父路径
export function matchNoRegistPageParentPath(path: string, pathMap: Dictionary<any>) {
  // 找出可能的父路径集合
  const pathArr = Object.keys(pathMap)
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
  list: Array<BreadcrumbCofnig> = [],
  path: string,
  pathMap: Dictionary<MenuConfig & { parent?: Omit<MenuConfig, 'children'> }>,
): Array<BreadcrumbCofnig> {
  const menu = pathMap[path];
  menu.breadcrumb !== false && list.unshift({ key: menu.key, path, label: menu.title });

  // 一级菜单
  if (!menu.parent?.path) {
    menu.parent && list.unshift({ key: menu.parent?.key, path: '', label: menu.parent?.title || '' });
    // 去掉最后一级path
    list.length && (list[list.length - 1].path = '');
    return list;
  } else {
    return createBreadcrumbList(list, menu.parent?.path, pathMap);
  }
}
