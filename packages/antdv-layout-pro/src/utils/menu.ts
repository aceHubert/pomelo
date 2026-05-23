import { omit, groupBy } from 'lodash-es';
import { getPathRegex } from './path';

// Types
import type { PathRegExp } from './path';
import type { MenuConfig, BreadcrumbConfig } from '../types';

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
        regex: getPathRegex(v.path),
        aliasRegexs: v.alias?.map((item) => getPathRegex(item)),
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
function matchNoRegistPageParentPath(path: string, paths: string[]) {
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
 * 解析 query 字符串为键值对
 */
function parseQuery(queryString: string): Record<string, string> {
  if (!queryString) return {};
  const params: Record<string, string> = {};
  queryString.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    }
  });
  return params;
}

/**
 * 计算两个 query 对象的匹配个数
 */
function countQueryMatches(sourceQuery: Record<string, string>, targetQuery: Record<string, string>): number {
  let count = 0;
  for (const key in targetQuery) {
    if (key in sourceQuery && sourceQuery[key] === targetQuery[key]) {
      count++;
    }
  }
  return count;
}

/**
 * 匹配已注册的路径
 * 查找所有匹配的路径，根据 query 参数匹配个数排序，返回匹配最多的一个
 */
export function matchRegistPath(path: string, pathMap: MenuPathMap): string {
  const [pathname, queryString] = path.split('?');
  const sourceQuery = parseQuery(queryString);

  // 查找所有匹配的路径（通过正则或别名）
  const matches: Array<{ path: string; queryMatchCount: number }> = [];

  for (const [registPath, config] of pathMap.entries()) {
    const { regex, alias, aliasRegexs } = config;
    const [, registQueryString] = registPath.split('?');
    const registQuery = parseQuery(registQueryString);

    // 检查是否匹配
    const isMatched =
      regex.test(pathname) || // path without query is matched by regex
      alias?.includes(path) || // full path is equal to alias
      alias?.includes(pathname) || // path without query is equal to alias
      aliasRegexs?.some((aliasRegex) => aliasRegex.test(pathname)); // path without query is matched by alias regex

    if (isMatched) {
      const queryMatchCount = countQueryMatches(sourceQuery, registQuery);
      matches.push({ path: registPath, queryMatchCount });
    }
  }

  // 如果有匹配项，按 query 匹配个数降序排序，返回匹配最多的
  if (matches.length > 0) {
    matches.sort((a, b) => b.queryMatchCount - a.queryMatchCount);
    return matches[0].path;
  }

  // 没有匹配项，返回未注册路径的父路径
  return matchNoRegistPageParentPath(path, [...pathMap.keys()]);
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
