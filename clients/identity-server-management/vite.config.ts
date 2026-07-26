import path from 'node:path';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function managementSingleFile(): Plugin {
  return {
    name: 'management-single-file',
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
        const escaped = escapeRegExp(fileName);

        if (item.type === 'chunk') {
          html = html.replace(
            new RegExp(`<script type="module" crossorigin src=["'](?:\\./|/)?${escaped}["']></script>`),
            () => `<script type="module">${item.code}</script>`,
          );
          delete bundle[fileName];
          continue;
        }

        if (item.type === 'asset' && fileName.endsWith('.css')) {
          html = html.replace(
            new RegExp(`<link rel="stylesheet" href=["'](?:\\./|/)?${escaped}["']>`),
            () => `<style>${String(item.source)}</style>`,
          );
          delete bundle[fileName];
        }
      }

      htmlAsset.fileName = 'management.html';
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
    plugins: [react(), mkcert(), managementSingleFile()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      host: env.DEV_HOST,
      port: parsePort(env.DEV_PORT),
      https: env.HTTPS === 'true',
    },
    build: {
      outDir: 'dist',
      emptyOutDir: false,
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
