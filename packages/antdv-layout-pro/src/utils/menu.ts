import { omit, groupBy } from 'lodash-es';
import pathToRegexp from 'path-to-regexp';
import { warn } from '@ace-util/core';

// Types
import type { Key, RegExpOptions, ParseOptions } from 'path-to-regexp';
import type { MenuConfig, BreadcrumbConfig } from '../types';

export interface PathRegExp extends RegExp {
  // An array to be populated with the keys found in the path.
  keys: Key[];
}

export interface MenuConfigWithRedirect extends Omit<MenuConfig, 'path' | 'children'> {
  path?: string;
  redirect?: string;
  children?: MenuConfigWithRedirect[];
}

export type MenuKeyMap = Map<string, MenuConfigWithRedirect & { parent?: Omit<MenuConfigWithRedirect, 'children'> }>;

export type MenuPathMap = Map<
  string,
  MenuConfigWithRedirect & {
    regex: PathRegExp;
    aliasRegexs?: PathRegExp[];
    parent?: Omit<MenuConfigWithRedirect, 'children'>;
  }
>;

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

/**
 * 将不可点击的菜单转换成 redirect
 */
export function serializeMenu(menus: MenuConfig[], parent?: MenuConfigWithRedirect): MenuConfigWithRedirect[] {
  return menus.map((menu) => {
    const { key, path, position, display, breadcrumb, children, ...rest } = menu;

    // 检查同级菜单的 position 是否一致
    if (Object.keys(groupBy(children, 'position')).length > 1) {
      throw new Error('Menu position must be the same in the same level!');
    }

    const menuConfig: MenuConfigWithRedirect = {
      ...rest,
      key,
      position,
      display: display === false ? false : void 0,
      breadcrumb: breadcrumb === false ? false : void 0,
    };

    // 如果父节点和当前节点 position 一致，那么父节点的 path 变成 redirect (排除 sub 菜单)
    if (parent?.path && menu.position !== 'sub' && parent.position === menu.position) {
      parent.redirect = parent.path;
      delete parent.path;
    }

    // 如果 top 菜单下有 side 子菜单，那么 top 菜单的 action 变成 redirect
    if (menu.position === 'top' && children?.some((item) => item.position === 'side')) {
      // 如果 path 不在子菜单中，取第一个子菜单的 action
      const childPaths = getExecutableChildPaths(children);
      menuConfig.redirect = childPaths.has(path) ? path : [...childPaths][0];
    } else {
      menuConfig.path = path;
    }

    menuConfig.children = children ? serializeMenu(children, menuConfig) : undefined;
    return menuConfig;

    // 获取所有子菜单可执行的 path
    function getExecutableChildPaths(children: MenuConfig[]): Set<string> {
      const paths = new Set<string>();
      children.map((item) => {
        // 只取每个 position group 的最后一级 action
        if (!item.children || item.children.some((child) => item.position !== child.position)) {
          paths.add(item.path);
          item.alias?.forEach((alias) => paths.add(alias));
        }

        if (item.children) {
          getExecutableChildPaths(item.children).forEach((path) => paths.add(path));
        }
      });

      return paths;
    }
  });
}

/**
 * Key map menus
 */
export function createMenuKeyMap(
  menus: MenuConfigWithRedirect[],
  parent: MenuConfigWithRedirect | null = null,
  keyMap: MenuKeyMap = new Map(),
  key: keyof MenuConfigWithRedirect = 'key',
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

/**
 * Path map menus
 */
export function createMenuPathMap(
  menus: MenuConfigWithRedirect[],
  parent: MenuConfigWithRedirect | null = null,
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

/**
 * Flat menus
 */
export function createFlatMenus(menus: MenuConfigWithRedirect[], flatMenus: MenuConfigWithRedirect[] = []) {
  menus.forEach((v) => {
    flatMenus.push(v);
    v.children && createFlatMenus(flatMenus, v.children);
  });
  return flatMenus;
}

/**
 * Match closest path
 */
export function matchNoRegistPageParentPath(path: string, paths: string[]) {
  // 找出可能的父路径集合
  const pathArr = paths
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

/**
 * generate breadcrumb
 */
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
