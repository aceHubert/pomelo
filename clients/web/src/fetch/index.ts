import Vue from 'vue';
import { hasIn } from 'lodash-es';
import axios from 'axios';
import { absoluteGo } from '@ace-util/core';
import { createRetryPlugin, createLoadingPlugin, createCatchErrorPlugin } from '@ace-fetch/core';
import { FetchVuePlugin, createFetch } from '@ace-fetch/vue';
import { loadingRef, errorRef, SharedError } from '@/shared';
import { Authoriztion } from '@/auth';
import { i18n } from '@/i18n';

// Types
import type { AxiosError } from 'axios';

Vue.use(FetchVuePlugin);

const SUPPORTS_CORS = 'withCredentials' in new XMLHttpRequest();
const axiosInstance = axios.create({
  withCredentials: SUPPORTS_CORS,
  timeout: 100000,
});

axiosInstance.interceptors.request.use(async ({ params, headers, ...context }) => {
  const locale = i18n.locale,
    userManager = Authoriztion.getInstance().userManager,
    token = await userManager
      .getUser()
      .then((user) => {
        if (!user || user.expired) return '';

        return [user.token_type, user.access_token].filter(Boolean).join(' ');
      })
      .catch(() => '');

  if (SUPPORTS_CORS) {
    token && headers.set('Authorization', token);
    locale && headers.set('x-custom-locale', locale);
    return {
      params,
      headers,
      ...context,
    };
  } else {
    return {
      params: {
        ...params,
        ...(token ? { token } : {}),
        ...(locale ? { locale } : {}),
      },
      headers,
      ...context,
    };
  }
});

axiosInstance.interceptors.response.use(void 0, (error: AxiosError) => {
  if (!error.response) return Promise.reject(error);

  if (error.isAxiosError && error.response.status === 401) {
    // 重试登录，refresh token 重新获取 access token，如果再不成功则退出重新登录
    const userManager = Authoriztion.getInstance().userManager;
    if (userManager.signinSilent) {
      return userManager
        .signinSilent()
        .then((user) => {
          if (user) {
            return [user.token_type, user.access_token].filter(Boolean).join(' ');
          } else {
            throw new Error('No user found!');
          }
        })
        .then((token) => {
          const config = { ...error.config };
          if (SUPPORTS_CORS && config.headers) {
            config.headers.set('Authorization', token);
          } else {
            config.params = {
              ...config.params,
              token,
            };
          }
          return axiosInstance(config);
        })
        .catch(() => {
          userManager.signin();
          return new Promise(() => {});
        });
    }
  }

  const { data = {} } = error.response as { data: any };

  if (data.siteInitRequired) {
    absoluteGo(process.env.BASE_URL + 'initialize');
  }

  const message = data.message ?? error.message;
  return Promise.reject(new Error(message?.length > 100 ? message.substring(0, 100) + '...' : message));
});

export const apiFetch = createFetch(axiosInstance);

apiFetch.use(
  createRetryPlugin({
    maxCount: 3,
    delay: true,
  }),
);

apiFetch.use(
  createLoadingPlugin({
    handler: () => {
      loadingRef.value = true;
      return () => {
        loadingRef.value = false;
      };
    },
  }),
);

apiFetch.use(
  createCatchErrorPlugin({
    serializerData: (data: any) => {
      if (hasIn(data, 'success')) {
        /**
         * 如果是如下结构：
         * {
         *    success: boolean,
         *    message: 'Error message',
         *    data: Data
         * }
         */
        if (!data.success) {
          return Promise.reject(new Error(data?.message || 'System error!'));
        }
        return data.data;
      }
      return data;
    },
    handler: (error) => {
      errorRef.value =
        error instanceof SharedError
          ? error
          : new SharedError(
              error.message || 'System error!',
              (axios.isAxiosError(error) ? error.response?.status : (error as any).code) || 500,
            );
      // stop next
      return new Promise(() => {});
    },
  }),
);
