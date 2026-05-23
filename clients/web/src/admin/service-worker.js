/* eslint-disable no-console */
/* eslint-disable no-undef */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');
if (workbox) {
  console.log(`Yay! Workbox is loaded 🎉`);
} else {
  console.log(`Boo! Workbox didn't load 😬`);
}

workbox.core.setCacheNameDetails({
  prefix: 'ochase-search',
  suffix: 'v1.0.0',
});
workbox.core.skipWaiting(); // 强制等待中的 Service Worker 被激活
workbox.core.clientsClaim(); // Service Worker 被激活后使其立即获得页面控制权
workbox.precaching.precacheAndRoute(self.__precacheManifest || []); // 设置预加载
workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []); // cant find __precacheManifest

// 缓存web的css资源
workbox.routing.registerRoute(
  // Cache CSS files
  /.*\.css/,
  // 使用缓存，但尽快在后台更新
  new workbox.strategies.StaleWhileRevalidate({
    // 使用自定义缓存名称
    cacheName: 'css-cache',
  }),
);

// 缓存web的js资源
workbox.routing.registerRoute(
  // 缓存JS文件
  /.*\.js/,
  // 使用缓存，但尽快在后台更新
  new workbox.strategies.StaleWhileRevalidate({
    // 使用自定义缓存名称
    cacheName: 'js-cache',
  }),
);

// 缓存web的图片资源
workbox.routing.registerRoute(
  /\.(?:png|gif|jpg|jpeg|svg)$/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 设置缓存有效期为30天
      }),
    ],
  }),
);
// 缓存所有 GET 请求。
workbox.routing.registerRoute(({ request }) => request.method === 'GET', new workbox.strategies.NetworkFirst());
// 如果有资源在其他域名上，比如cdn、oss等，这里做单独处理，需要支持跨域
workbox.routing.registerRoute(
  /^https:\/\/cdn\.acehubert\.top\/.*\.(jpe?g|png|gif|svg)/,
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'cdn-images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 5 * 24 * 60 * 60, // 设置缓存有效期为5天
      }),
    ],
    fetchOptions: {
      credentials: 'include', // 支持跨域
    },
  }),
);
