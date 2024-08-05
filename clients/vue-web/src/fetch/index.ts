import Vue from 'vue';
import { hasIn } from 'lodash-es';
import axios from 'axios';
import { absoluteGo } from '@ace-util/core';
import { FetchVuePlugin, createFetch } from '@ace-fetch/vue';
import { createRetryPlugin, createLoadingPlugin, createCatchErrorPlugin } from '@ace-fetch/axios';
import { loadingRef, errorRef, SharedError } from '@/shared';
import { auth } from '@/auth';
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
  const locale = i18n.locale;
  const token = await auth.userManager
    .getUser()
    .then((user) => user?.access_token)
    .catch(() => '');

  if (SUPPORTS_CORS) {
    return {
      params,
      headers: {
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(locale ? { 'x-custom-locale': locale } : {}),
      },
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
    return auth.userManager
      .signinSilent()
      .then((user) => {
        if (user) {
          const headers = {
            ...error.config.headers,
            Authorization: `Bearer ${user.access_token}`,
          };
          return axiosInstance({ ...error.config, headers });
        } else {
          throw new Error('No user found!');
        }
      })
      .catch(() => {
        auth.userManager.signin();
        return new Promise(() => {});
      });
  }

  const { data = {} } = error.response as { data: any };

  if (data.siteInitRequired) {
    absoluteGo(process.env.BASE_URL + 'initialize');
  }

  const message = data.message ?? error.message;
  return Promise.reject(new Error(message?.length > 100 ? message.substring(0, 100) + '...' : message));
});

export const afetch = createFetch(axiosInstance);

afetch.use(
  createRetryPlugin({
    maxCount: 3,
    delay: true,
  }),
);

afetch.use(
  createLoadingPlugin({
    handler: () => {
      loadingRef.value = true;
      return () => {
        loadingRef.value = false;
      };
    },
  }),
);

afetch.use(
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
      return new Promise(() => {
        // stop next
      });
    },
  }),
);
