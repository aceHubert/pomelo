import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildRuntimeExtensionState, parseOptionList, scanRuntimeExtensions } from './runtime-extension.utils';

describe('runtime-extension utils', () => {
  let contentPath: string;

  beforeEach(() => {
    contentPath = fs.mkdtempSync(path.join(os.tmpdir(), 'pomelo-runtime-extensions-'));
    fs.mkdirSync(path.join(contentPath, 'plugins', 'valid-plugin'), { recursive: true });
    fs.mkdirSync(path.join(contentPath, 'plugins', 'invalid-plugin'), { recursive: true });
    fs.mkdirSync(path.join(contentPath, 'themes', 'beauty'), { recursive: true });
    fs.writeFileSync(
      path.join(contentPath, 'plugins', 'valid-plugin', 'manifest.json'),
      JSON.stringify({
        id: 'valid-plugin',
        type: 'plugin',
        name: 'Valid Plugin',
        version: '1.0.0',
        server: {
          entry: 'server/index.js',
        },
      }),
    );
    fs.writeFileSync(
      path.join(contentPath, 'themes', 'beauty', 'manifest.json'),
      JSON.stringify({
        id: 'beauty',
        type: 'theme',
        name: 'Beauty',
        version: '1.0.0',
      }),
    );
  });

  afterEach(() => {
    fs.rmSync(contentPath, { recursive: true, force: true });
  });

  it('parses JSON and legacy list option values', () => {
    expect(parseOptionList('["a","b",{"id":"c"}]')).toEqual(['a', 'b', 'c']);
    expect(parseOptionList('a,b;b')).toEqual(['a', 'b']);
  });

  it('scans plugin and theme manifests and keeps invalid directories visible', () => {
    const extensions = scanRuntimeExtensions(contentPath);

    expect(extensions.map((extension) => extension.id).sort()).toEqual(['beauty', 'invalid-plugin', 'valid-plugin']);
    expect(extensions.find((extension) => extension.id === 'valid-plugin')?.hasServerModule).toBe(true);
    expect(extensions.find((extension) => extension.id === 'invalid-plugin')?.validationError).toContain('缺少');
  });

  it('merges discovered extensions with option and load state', () => {
    const extensions = scanRuntimeExtensions(contentPath);
    const state = buildRuntimeExtensionState({
      bootId: 'boot-1',
      startedAt: '2026-05-23T00:00:00.000Z',
      contentPath,
      options: {
        activePlugins: ['valid-plugin', 'missing-plugin'],
        uninstallPlugins: ['old-plugin'],
        template: 'beauty',
        stylesheet: 'beauty',
      },
      discoveredExtensions: extensions,
      loadedPlugins: ['valid-plugin'],
      failedPlugins: [
        {
          id: 'missing-plugin',
          type: 'plugin',
          phase: 'manifest',
          reason: '插件目录不存在',
        },
      ],
    });

    expect(state.plugins.find((plugin) => plugin.id === 'valid-plugin')).toMatchObject({
      configured: true,
      loaded: true,
      installed: true,
    });
    expect(state.plugins.find((plugin) => plugin.id === 'missing-plugin')).toMatchObject({
      configured: true,
      installed: false,
      failedReason: '插件目录不存在',
    });
    expect(state.themes.find((theme) => theme.id === 'beauty')?.activeTheme).toBe(true);
  });
});
