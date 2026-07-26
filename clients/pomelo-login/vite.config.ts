import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import mkcert from 'vite-plugin-mkcert';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function loginSingleFile(): Plugin {
  return {
    name: 'pomelo-login-single-file',
    enforce: 'post',
    generateBundle(_, bundle) {
      const htmlAsset = Object.values(bundle).find(
        (item): item is Extract<typeof item, { type: 'asset' }> =>
          item.type === 'asset' && item.fileName.endsWith('.html'),
      );
      if (!htmlAsset) return;

      let html = String(htmlAsset.source);
      for (const [fileName, item] of Object.entries(bundle)) {
        if (item === htmlAsset) continue;
        const escapedFileName = escapeRegExp(fileName);

        if (item.type === 'chunk') {
          html = html.replace(
            new RegExp(`<script[^>]*src=["'][^"']*${escapedFileName}["'][^>]*></script>`),
            () => `<script type="module">${item.code}</script>`,
          );
          delete bundle[fileName];
          continue;
        }

        if (item.type === 'asset' && fileName.endsWith('.css')) {
          html = html.replace(
            new RegExp(`<link[^>]*href=["'][^"']*${escapedFileName}["'][^>]*>`),
            () => `<style>${String(item.source)}</style>`,
          );
          delete bundle[fileName];
        }
      }

      htmlAsset.fileName = 'index.html';
      htmlAsset.source = html;
    },
  };
}

function parsePort(value: string | undefined) {
  if (!value) return undefined;
  const port = Number(value);
  return Number.isInteger(port) && port > 0 ? port : undefined;
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.BASE_URL,
    plugins: [react(), mkcert(), loginSingleFile()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: env.DEV_HOST || '0.0.0.0',
      port: parsePort(env.DEV_PORT),
      https: env.HTTPS === 'true',
    },
    build: {
      outDir: 'dist',
      cssCodeSplit: false,
      assetsInlineLimit: 100000000,
      rollupOptions: {
        input: 'index.html',
      },
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          modifyVars: {
            hack: 'true;@import "./src/styles/variables.less";',
          },
        },
      },
    },
  };
});
