import { OptionPresetKeys, UserRole } from '@ace-pomelo/shared/server';
import { RuntimeExtensionContext } from './interfaces/runtime-extension.interface';
import { RuntimeExtensionService } from './runtime-extension.service';

describe('RuntimeExtensionService', () => {
  const context: RuntimeExtensionContext = {
    bootId: 'boot-1',
    startedAt: '2026-05-23T00:00:00.000Z',
    contentPath: '/tmp/content',
    options: {
      activePlugins: ['controller-test'],
      uninstallPlugins: [],
    },
    activePluginsHash: 'hash-1',
    discoveredExtensions: [
      {
        id: 'controller-test',
        type: 'plugin',
        name: 'Controller Test',
        directoryName: 'controller-test',
        directoryPath: '/tmp/content/plugins/controller-test',
        manifestPath: '/tmp/content/plugins/controller-test/manifest.json',
        hasServerModule: true,
      },
    ],
    loadedPlugins: ['controller-test'],
    failedPlugins: [],
    pluginModules: [],
  };

  const createOptionService = () => ({
    getValue: jest.fn((key: OptionPresetKeys) => {
      const values: Record<string, string> = {
        [OptionPresetKeys.ActivePlugins]: JSON.stringify(['controller-test']),
        [OptionPresetKeys.UninstallPlugins]: JSON.stringify([]),
        [OptionPresetKeys.Template]: 'beauty',
        [OptionPresetKeys.Stylesheet]: 'beauty',
      };
      return Promise.resolve(values[key]);
    }),
    updateOption: jest.fn(() => Promise.resolve()),
  });

  it('returns lightweight heartbeat from boot context', () => {
    const service = new RuntimeExtensionService(context, createOptionService() as any);

    expect(service.getHeartbeat()).toEqual({
      bootId: 'boot-1',
      startedAt: '2026-05-23T00:00:00.000Z',
      ready: true,
      activePluginsHash: 'hash-1',
      loadedPlugins: ['controller-test'],
      failedPlugins: [],
    });
  });

  it('updates active_plugins and reports restart requirement', async () => {
    const optionService = createOptionService();
    const service = new RuntimeExtensionService(context, optionService as any);

    const result = await service.updatePlugins(
      {
        activePlugins: [],
      },
      {
        sub: '1',
        role: UserRole.Administrator,
      } as any,
    );

    expect(optionService.updateOption).toHaveBeenCalledWith(
      OptionPresetKeys.ActivePlugins,
      JSON.stringify([]),
      UserRole.Administrator,
      1,
    );
    expect(result.restartRequired).toBe(true);
  });

  it('acknowledges restart before deferred process exit', () => {
    const service = new RuntimeExtensionService(context, createOptionService() as any);
    const payload = service.restart({ delayMs: 50 });

    expect(payload).toMatchObject({
      accepted: true,
      bootId: 'boot-1',
      delayMs: 50,
    });
  });
});
