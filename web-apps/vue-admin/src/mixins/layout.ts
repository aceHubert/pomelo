import { ref, reactive, computed, nextTick } from '@vue/composition-api';
import { useRoute } from 'vue2-helpers/vue-router';
import { useEffect } from '@/hooks';
import { getDefaultMenus } from '@/configs/menu.config';
import {
  createMenuMap,
  createMenuPathMap,
  createFlatMenus,
  createBreadcrumbList,
  matchNoRegistPageParentPath,
} from './utils/menu';

// Types
import type { MenuConfig, BreadcrumbCofnig } from '@/types';

/**
 * 菜单/面包屑配置
 */
export const useLayoutMixin = () => {
  const route = useRoute();

  // menu
  const menus = ref(getDefaultMenus());
  const currTopMenu = ref('');
  const currSiderMenu = ref('');
  const siderMenuOpenKeys = ref<string[]>([]);
  const menuKeyMap = computed(() => createMenuMap({}, null, menus.value));
  const menuPathMap = computed(() => createMenuPathMap({}, null, menus.value));
  const flatMenus = computed(() => createFlatMenus([], menus.value));

  /**
   * 项部导航
   */
  const topMenus = computed(() => {
    return (function filter(menus: MenuConfig[] = []): MenuConfig[] {
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
    const menu = menuKeyMap.value[currSiderMenu.value];
    if (menu?.position === 'side') {
      return (function filter(menus: MenuConfig[] = []): MenuConfig[] {
        return menus
          .filter((menu) => menu.position === 'side')
          .filter((item) => item.display !== false)
          .map(({ children, ...rest }) => ({
            ...rest,
            children: children?.length ? filter(children) : [],
          }));
      })(menuKeyMap.value[currTopMenu.value].children || []);
    } else if (menu?.parent?.key && menu?.position === 'sub') {
      return (
        (menuKeyMap.value[menu.parent.key].children || [])
          .filter((item) => item.display !== false)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          .map(({ children, ...restItem }) => restItem)
      );
    }
    return [];
  });

  /**
   * 设置菜单
   */
  const setMenus = (menuConfig: MenuConfig[]) => {
    menus.value = menuConfig;
    // 当手动设置后，重新计算菜单状态
    nextTick(() => {
      setPath(route.path);
    });
  };

  const setTopCurrMenu = (path: string) => {
    if (currTopMenu.value === path) return;
    currTopMenu.value = path;
  };

  const setSiderCurrMenu = (path: string) => {
    if (currSiderMenu.value === path) return;
    currSiderMenu.value = path;
  };

  const setSiderMenuOpenKeys = (openKeys: string[]) => {
    siderMenuOpenKeys.value = openKeys;
  };

  // breadcrumb
  const breadcrumbs = ref<Array<BreadcrumbCofnig>>([]);

  const setBreadcrumb = (list: Array<BreadcrumbCofnig>) => {
    breadcrumbs.value = list;
  };

  // 更新菜单/面包屑状态
  const currentMatchPath = ref('');

  /**
   * 设置路由路径，通过路径计算面包屑及菜单形式等
   */
  const setPath = (path: string) => {
    currentMatchPath.value =
      Object.entries(menuPathMap.value).find(
        ([_path, { regex, aliasRegexs }]) => !!path.match(regex) || aliasRegexs?.some((regex) => !!path.match(regex)),
      )?.[0] || matchNoRegistPageParentPath(path, menuPathMap);
  };

  useEffect(() => {
    const currentPath = currentMatchPath.value;
    if (currentPath) {
      const breadcrumb = createBreadcrumbList([], currentPath, menuPathMap.value) || [];
      setBreadcrumb(breadcrumb);

      const currentMatchKey = menuPathMap.value[currentPath]?.key;
      if (!currentMatchKey) return;

      // topMenu
      const topMenu = (function getTopMenu(key: string): string {
        const parent = menuKeyMap.value[key]?.parent;

        if (parent?.position === 'top') {
          return parent.key;
        } else if (parent) {
          return getTopMenu(parent.key);
        } else {
          return key;
        }
      })(currentMatchKey);
      topMenu && setTopCurrMenu(topMenu);

      // siderMenu
      const siderMenuOpenKeys = (function getSiderMenuOpenKeys(key: string, result: string[] = []): string[] {
        const parent = menuKeyMap.value[key]?.parent;
        if (!parent || parent.position === 'top') {
          return result;
        } else {
          if (parent.position === 'side') {
            result.push(parent.key);
          }
          return getSiderMenuOpenKeys(parent.key, result);
        }
      })(currentMatchKey);
      setSiderCurrMenu(currentMatchKey);
      setSiderMenuOpenKeys(siderMenuOpenKeys);
    }
  }, currentMatchPath);

  useEffect(
    () => {
      setPath(route.path);
    },
    () => route.path,
  );

  return reactive({
    menus,
    menuKeyMap,
    menuPathMap,
    flatMenus,
    topMenus,
    siderMenus,
    currTopMenu,
    currSiderMenu,
    siderMenuOpenKeys,
    breadcrumbs,
    setMenus,
    setSiderMenuOpenKeys,
  });
};
