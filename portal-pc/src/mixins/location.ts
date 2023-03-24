import { useRouter } from 'vue2-helpers/vue-router';
import { isAbsoluteUrl, absoluteGo } from '@pomelo/shared-web';

// types
import { Route, RawLocation } from 'vue-router';

export const useLocationMixin = () => {
  const router = useRouter();

  /**
   * 修改 router query
   * @param query
   * @param option
   */
  function updateRouteQuery(query: Dictionary<string | undefined>, replace?: boolean): Promise<Route>;
  function updateRouteQuery(
    query: Dictionary<string | undefined>,
    options: {
      replace?: boolean;
      onComplete?: (route: Route) => void;
      onAbort?: (e: Error) => void;
    },
  ): void;
  function updateRouteQuery(
    query: Dictionary<string | undefined>,
    options:
      | boolean
      | {
          replace?: boolean;
          onComplete?: (route: Route) => void;
          onAbort?: (e: Error) => void;
        } = false,
  ): Promise<Route> | void {
    let replace: boolean;
    let onComplete: ((route: Route) => void) | undefined;
    let onAbort: ((e: Error) => void) | undefined;
    if (typeof options === 'boolean') {
      replace = options;
    } else {
      replace = options.replace || false;
      onComplete = options.onComplete;
      onAbort = options.onAbort;
    }

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
    if (replace) {
      return router.replace({ path, query: newQuery }, onComplete, onAbort);
    } else {
      return router.push({ path, query: newQuery }, onComplete, onAbort);
    }
  }

  /**
   * URL跳转
   * @param {Rawlocation} url 目标URL
   * @param {boolean} replace 是否使用replace方式跳转
   */
  const goTo = (url: RawLocation, replace = false) => {
    if (!url) {
      throw new Error('invalid url');
    }

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

    router[replace ? 'replace' : 'push'](url);
  };

  return {
    updateRouteQuery,
    goTo,
  };
};
