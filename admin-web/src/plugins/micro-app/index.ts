import { bus, setupApp, startApp, destroyApp } from 'wujie';
import { notification } from 'ant-design-vue';
import * as Sentry from '@sentry/browser';
import { getEnv } from '@pomelo/shared-web';
import { userManager } from '@/auth';
import { i18n } from '@/i18n';
import { withSubComponent } from './SubComponent';

// Types
import type { startOptions, plugin } from 'wujie';
import type { Plugin } from '@/types';
import type { SubAppComponentOptions } from './SubComponent';

export type MicroApp = {
  bus: typeof bus;
  startApp: typeof startApp;
  destroyApp: typeof destroyApp;
};

const microAppPlugin: Plugin = async (app, inject) => {
  const micorApps = getEnv<Array<startOptions & SubAppComponentOptions>>('microApps', [], (window as any)._ENV);

  // 注册子应用
  micorApps.map((subApp) => {
    setupApp({
      ...subApp,
      props: {
        ...subApp.props,
        jump: (name) => {
          app.router?.push({ name });
        },
        getToken: () => {
          return userManager.getUser().then((user) => user?.access_token);
        },
        signout: () => {
          return userManager.signOut();
        },
        getUserInfo: () => {
          return userManager.getUser();
        },
      },
      plugins: [
        ...((subApp.plugins || []) as Array<plugin>),
        {
          htmlLoader: (code) =>
            code.replace(
              /<div id="app"><\/div>/,
              `<div id="app" style="text-align:center; padding: 10px 0;">${i18n.tv(
                'subapp.tips.loading_text',
                '应用加载中...',
              )}</div>`,
            ),
        },
      ],
      beforeLoad: (appWindow) => {
        Sentry.captureException(new Error('加载子应用'), {
          level: Sentry.Severity.Info,
          tags: {
            appName: subApp.name,
            status: 'load',
          },
        });
        subApp.beforeLoad?.(appWindow);
      },
      beforeMount: (appWindow) => {
        Sentry.captureException(new Error('加载子应用'), {
          level: Sentry.Severity.Info,
          tags: {
            appName: subApp.name,
            status: 'mount',
          },
        });
        subApp.beforeMount?.(appWindow);
      },
      beforeUnmount: (appWindow) => {
        Sentry.captureException(new Error('卸载子应用'), {
          level: Sentry.Severity.Info,
          tags: {
            appName: subApp.name,
            status: 'unmount',
          },
        });
        subApp.beforeUnmount?.(appWindow);
      },
      loadError: (url, err) => {
        Sentry.captureException(err, {
          level: Sentry.Severity.Error,
          tags: {
            appName: subApp.name,
            appUrl: url,
            status: 'error',
          },
        });
        notification.error({
          message: i18n.tv(
            'subapp.tips.load_error_notification',
            `An error occurred while handle mciro app "${subApp.name}"!`,
            {
              appName: app.name,
            },
          ) as string,
          description: err.message,
        });
        subApp.loadError?.(url, err);
      },
    });

    app.router?.addRoute({
      path: `/${subApp.name}/:path(.*)`,
      name: subApp.name,
      component: withSubComponent(subApp),
    });
  });

  // 在 xxx-sub 路由下子应用将激活路由同步给主应用，主应用跳转对应路由高亮菜单栏
  bus.$on('sub-route-change', (name, path) => {
    const mainName = name;
    const mainPath = `/${name}${path}`;
    const currentName = app.router!.currentRoute.name;
    const currentPath = app.router!.currentRoute.path;
    if (mainName === currentName && mainPath !== currentPath) {
      app.router!.push({ path: mainPath });
    }
  });

  inject('micorApp', {
    bus,
    startApp,
    destroyApp,
  });
};

export default microAppPlugin;

declare module 'vue/types/vue' {
  interface Vue {
    $micorApp: MicroApp;
  }
}
