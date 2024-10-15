import { reactive } from '@vue/composition-api';
import { isAbsoluteUrl, absoluteGo, trailingSlash } from '@ace-util/core';
import { useRouter } from 'vue2-helpers/vue-router';
import { OptionPresetKeys } from '@ace-pomelo/shared/client';
import { useOptions } from '@/hooks';

// types
import type { Route, RawLocation } from 'vue-router';

export const useLocationMixin = () => {
  const router = useRouter();
  const siteUrl = useOptions(OptionPresetKeys.SiteUrl);

  /**
   * 修改 router query
   * @param query
   * @param replace 使用 replace 方式
   */
  function updateRouteQuery(query: Record<string, string | undefined>, replace?: boolean): Promise<Route>;
  function updateRouteQuery(
    query: Record<string, string | undefined>,
    options: {
      replace?: boolean;
      onComplete?: (route: Route) => void;
      onAbort?: (e: Error) => void;
    },
  ): void;
  function updateRouteQuery(
    query: Record<string, string | undefined>,
    options:
      | boolean
      | {
          replace?: boolean;
          onComplete?: (route: Route) => void;
          onAbort?: (e: Error) => void;
        } = false,
  ): Promise<Route> | void {
    const replace = typeof options === 'boolean' ? options : options.replace;
    const { onComplete, onAbort } =
      typeof options === 'boolean' ? ({} as { onComplete: undefined; onAbort: undefined }) : options;

    const oldQuery = router.currentRoute.query;
    const path = router.currentRoute.path;
    // 对象的拷贝
    const newQuery = Object.assign(JSON.parse(JSON.stringify(oldQuery)), query);

    // 移附 undefined 值
    for (const key in newQuery) {
      if (typeof newQuery[key] === 'undefined') {
        delete newQuery[key];
      }
    }

    return router[replace ? 'replace' : 'push']({ path, query: newQuery }, onComplete, onAbort);
  }

  /**
   * URL跳转
   * @param {Rawlocation} url 目标URL
   * @param {boolean} replace 是否使用replace方式跳转
   */
  function goTo(url: RawLocation, replace?: boolean): void;
  function goTo(
    url: RawLocation,
    options: {
      replace?: boolean;
      onComplete?: (route: Route) => void;
      onAbort?: (e: Error) => void;
    },
  ): void;
  function goTo(
    url: RawLocation,
    options:
      | boolean
      | {
          replace?: boolean;
          onComplete?: (route: Route) => void;
          onAbort?: (e: Error) => void;
        } = false,
  ): Promise<Route> | void {
    if (!url) {
      throw new Error('invalid url');
    }

    const replace = typeof options === 'boolean' ? options : options.replace;
    const { onComplete, onAbort } =
      typeof options === 'boolean' ? ({} as { onComplete: undefined; onAbort: undefined }) : options;

    if (typeof url === 'string') {
      // prevent goTo('javascript?')
      if (/^javas/.test(url)) {
        return;
      }
      if (url === 'BACK') {
        router.go(-1);
        return;
      }
      if (isAbsoluteUrl(url)) {
        return absoluteGo(url, replace);
      }
    }

    return router[replace ? 'replace' : 'push'](url, onComplete, onAbort);
  }

  const getMediaPath = (path: string) => {
    return isAbsoluteUrl(path) || /^data:image\//.test(path)
      ? path
      : `${trailingSlash(siteUrl.value ?? '/')}${/^\//.test(path) ? path.substring(1) : path}`;
  };

  return reactive({
    updateRouteQuery,
    goTo,
    getMediaPath,
  });
};
