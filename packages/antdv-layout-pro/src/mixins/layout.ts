import { ref, reactive, computed } from 'vue-demi';
import { default as pathToRegexp } from 'path-to-regexp';
import { warn, pick } from '@ace-util/core';
import { useEffect, useConfigProvider } from '../shared';
import {
  serializeMenu,
  createMenuKeyMap,
  createMenuPathMap,
  createFlatMenus,
  createBreadcrumbList,
  matchNoRegistPageParentPath,
} from '../utils';

// Types
import type { MenuConfigWithRedirect } from '../utils/menu';
import type { MenuConfig, BreadcrumbConfig, MultiTabConfig } from '../types';

/**
 * 菜单/面包屑配置
 */
export const useLayoutMixin = () => {
  const configProvider = useConfigProvider();

  // menu
  const menus = ref<MenuConfigWithRedirect[]>([]);
  const currTopMenuKey = ref<string>(); // current top menu key, selected
  const currSiderMenuKey = ref<string>(''); // current sider menu key, selected
  const nextSiderMenuKey = ref<string>(''); // next sider menu key, to be selected
  const siderMenuOpenKeys = ref<string[]>([]); // sider menu open keys
  const menuKeyMap = computed(() => createMenuKeyMap(menus.value));
  const menuPathMap = computed(() => createMenuPathMap(menus.value));
  const flatMenus = computed(() => createFlatMenus(menus.value));

  // multiTab
  const multiTabRoutes = reactive<{
    current: string;
    items: MultiTabConfig[];
  }>({
    current: '',
    items: [],
  });

  /**
   * 项部导航
   */
  const topMenus = computed(() => {
    return (function filter(menus: MenuConfigWithRedirect[] = []): MenuConfigWithRedirect[] {
      return menus
        .filter((menu) => menu.position === 'top')
        .filter((item) => item.display !== false)
        .map(({ children, ...rest }) => ({
          ...rest,
          children: children?.length ? filter(children) : [],
        }));
    })(menus.value);
  });

  /**
   * 侧边导航
   */
  const siderMenus = computed(() => {
    const currentSideMenu = menuKeyMap.value.get(nextSiderMenuKey.value || currSiderMenuKey.value);
    if (currentSideMenu?.parent?.key && currentSideMenu?.position === 'sub') {
      return (menuKeyMap.value.get(currentSideMenu.parent.key)?.children ?? [])
        .filter((item) => item.display !== false)
        .map(({ children: _, ...restItem }) => restItem);
    } else {
      return (function filter(menus: MenuConfigWithRedirect[] = []): MenuConfigWithRedirect[] {
        return menus
          .filter((menu) => menu.position === 'side')
          .filter((item) => item.display !== false)
          .map(({ children, ...rest }) => ({
            ...rest,
            children: children?.length ? filter(children) : [],
          }));
      })((!currTopMenuKey.value ? menus.value : menuKeyMap.value.get(currTopMenuKey.value)?.children) ?? []);
    }
  });

  /**
   * 设置返回路径（当前路由为 sub 时）
   */
  const goBackPath = computed(() => {
    const menu = menuKeyMap.value.get(currSiderMenuKey.value);
    if (menu?.position === 'sub') {
      return menu.parent?.redirect || menu.parent?.path;
    }

    return null;
  });

  const setTopCurrMenuKey = (key?: string) => {
    if (currTopMenuKey.value === key) return;
    currTopMenuKey.value = key;
  };

  const setSiderCurrMenuKey = (key: string, next = false) => {
    if (next) {
      nextSiderMenuKey.value = key;
      return;
    }
    if (currSiderMenuKey.value === key) return;
    currSiderMenuKey.value = key;
    nextSiderMenuKey.value = '';
  };

  const setSiderMenuOpenKeys = (openKeys: string[]) => {
    siderMenuOpenKeys.value = openKeys;
  };

  // breadcrumb
  const menuBreadcrumbs = ref<Array<BreadcrumbConfig>>([]);
  const setMenuBreadcrumb = (list: Array<BreadcrumbConfig>) => {
    menuBreadcrumbs.value = list;
  };

  // 更新菜单/面包屑状态
  let cachedPath: string | undefined;
  const currentMatchPath = ref('');

  const getMatchedPath = (path: string) => {
    const pathWithoutQuery = path.split('?')[0];
    return menuPathMap.value.has(path) // full path is equal to menu path
      ? path
      : menuPathMap.value.get(pathWithoutQuery) // path without query is equal to menu path
      ? pathWithoutQuery
      : [...menuPathMap.value.entries()].find(
          ([_, { regex, alias, aliasRegexs }]) =>
            regex.test(pathWithoutQuery) || // path without query is matched by regex
            alias?.includes(path) || // full path is equal to alias
            alias?.includes(pathWithoutQuery) || // path without query is equal to alias
            aliasRegexs?.some(
              (regex) => regex.test(path.split('?')[0]), // path without query is matched by alias regex
            ),
        )?.[0] || matchNoRegistPageParentPath(path, [...menuPathMap.value.keys()]);
  };

  const getTopMenuKey = (matched: MenuConfigWithRedirect) => {
    const parent = menuKeyMap.value.get(matched.key)?.parent;

    if (parent?.position === 'top') {
      return parent.key;
    } else if (parent) {
      return getTopMenuKey(parent);
    }
    return matched.key;
  };

  /**
   * 设置路由路径，通过路径计算面包屑及菜单形式等
   * 默认监听当前路由 path 变化
   */
  const setPath = (path: string, immediately = true) => {
    const matchedPath = getMatchedPath(path);
    if (immediately) {
      cachedPath = path;
      if (currentMatchPath.value === matchedPath) {
        // 恢复 topMenu 选中状态
        const currentMatched = menuPathMap.value.get(matchedPath);
        if (!currentMatched) return;

        setTopCurrMenuKey(getTopMenuKey(currentMatched));
      } else {
        currentMatchPath.value = getMatchedPath(path);
      }
    } else {
      // 选中 topMenu，待选择 siderMenu
      const nextMatched = menuPathMap.value.get(matchedPath);
      if (!nextMatched) return;

      setTopCurrMenuKey(getTopMenuKey(nextMatched));
      setSiderCurrMenuKey(nextMatched.key, true);
    }
  };

  /**
   * 设置菜单
   */
  const setMenus = (menuConfig: MenuConfig[]) => {
    menus.value = serializeMenu(menuConfig);
    // 当手动设置后，需要使用 setPath 重新计算菜单状态
    cachedPath && setPath(cachedPath);
  };

  /**
   * 设置多标签页路由
   */
  const setMultiTabRoutes = (fullPath: string, closable = true) => {
    let title = fullPath;
    const path = fullPath.split('?')[0];
    const pathFromMenu =
      menuPathMap.value.get(path) ??
      [...menuPathMap.value.values()].find(
        ({ regex, aliasRegexs }) => regex.test(path) || aliasRegexs?.some((regex) => regex.test(path)),
      );
    // get title from menu
    if (pathFromMenu) {
      title =
        typeof pathFromMenu.title === 'function' ? pathFromMenu.title(configProvider.i18nRender) : pathFromMenu.title;
    }
    const tabItem = multiTabRoutes.items.find(
      (item) =>
        item.path === path ||
        (pathFromMenu &&
          (pathFromMenu.regex.test(item.path) || pathFromMenu.aliasRegexs?.some((regex) => regex.test(item.path)))),
    );
    if (tabItem) {
      tabItem.path = path;
      tabItem.fullPath = fullPath;
    } else {
      multiTabRoutes.items.push({
        title,
        path: path,
        fullPath: fullPath,
        closable,
      });
    }
    multiTabRoutes.current = fullPath;
  };

  /**
   * 置换路径中的参数
   * @param pathDefine 路径定义
   * @param previous.path 上一个路径
   * @param previous.define 上一个路径定义
   */
  const reslovePath = (
    pathDefine: string,
    previous: { path?: string; define?: string } = {},
  ): { path: string; resolved: boolean } => {
    const config = menuPathMap.value.get(pathDefine);
    const { path: previousPath = cachedPath, define: previousPathDefine = currentMatchPath.value } = previous;
    if (previousPath && config?.regex.keys.length) {
      const requiredParamKeys = config.regex.keys.map((key) => String(key.name));
      const matched = pathToRegexp.match<Record<string, any>>(previousPathDefine)(previousPath, {
        decode: decodeURIComponent,
      });
      if (matched) {
        const previousParamKeys = Object.keys(matched.params);
        process.env.NODE_ENV === 'production' &&
          warn(
            requiredParamKeys.every((requiredKey) => previousParamKeys.includes(requiredKey)),
            `Path params "${requiredParamKeys.join(', ')}" is required but miss some keys "${requiredParamKeys
              .filter((requiredKey) => !previousParamKeys.includes(requiredKey))
              .join(', ')}" from path "${previousPath}".`,
          );
        return {
          path: pathToRegexp.compile(pathDefine)(pick(matched.params, requiredParamKeys), {
            encode: encodeURIComponent,
          }),
          resolved: true,
        };
      } else {
        warn(
          process.env.NODE_ENV === 'production',
          `Params "${requiredParamKeys.join(
            ', ',
          )}" in path "${pathDefine}" are required but can't get it from path ${previousPath}`,
        );
        return { path: pathDefine, resolved: false };
      }
    }
    return { path: pathDefine, resolved: false };
  };

  useEffect(() => {
    const currentPath = currentMatchPath.value;
    if (currentPath) {
      const breadcrumb = createBreadcrumbList(currentPath, menuPathMap.value) || [];
      setMenuBreadcrumb(breadcrumb);

      const currentMatched = menuPathMap.value.get(currentPath);
      if (!currentMatched) return;

      // topMenu
      setTopCurrMenuKey(getTopMenuKey(currentMatched));

      // siderMenu
      const siderMenuOpenKeys = (function getSiderMenuOpenKeys(key: string, result: string[] = []): string[] {
        const parent = menuKeyMap.value.get(key)?.parent;
        if (!parent || parent.position === 'top') {
          return result;
        } else {
          if (parent.position === 'side') {
            result.push(parent.key);
          }
          return getSiderMenuOpenKeys(parent.key, result);
        }
      })(currentMatched.key);

      setSiderCurrMenuKey(currentMatched.key);
      setSiderMenuOpenKeys(siderMenuOpenKeys);
    }
  }, currentMatchPath);

  return reactive({
    menus,
    menuKeyMap,
    menuPathMap,
    flatMenus,
    topMenus,
    siderMenus,
    currTopMenuKey,
    currSiderMenuKey,
    siderMenuOpenKeys,
    goBackPath,
    menuBreadcrumbs,
    multiTabRoutes,
    reslovePath,
    setPath,
    setMultiTabRoutes,
    setMenus,
    setSiderMenuOpenKeys,
  });
};
