import * as path from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { OptionPresetKeys } from '@ace-pomelo/shared/server';
import { createRuntimeExtensionContext } from './runtime-extension.loader';

describe('runtime-extension loader', () => {
  let app: INestApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('loads enabled plugin module and registers its controller route', async () => {
    const contentPath = path.resolve(__dirname, '../../../content');
    const context = await createRuntimeExtensionContext({
      contentPath,
      readOptionsFromService: false,
      optionValues: {
        [OptionPresetKeys.ActivePlugins]: JSON.stringify(['controller-test']),
      },
    });

    expect(context.loadedPlugins).toEqual(['controller-test']);
    expect(context.failedPlugins).toEqual([]);

    const moduleRef = await Test.createTestingModule({
      imports: context.pluginModules,
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    const expressApp = app.getHttpAdapter().getInstance();
    const routes = expressApp._router.stack
      .filter((layer: any) => layer.route)
      .map((layer: any) => `${Object.keys(layer.route.methods).join(',').toUpperCase()} ${layer.route.path}`);

    expect(routes).toContain('GET /api/plugins/controller-test/ping');
  });

  it('skips installed plugins that are not enabled', async () => {
    const contentPath = path.resolve(__dirname, '../../../content');
    const context = await createRuntimeExtensionContext({
      contentPath,
      readOptionsFromService: false,
      optionValues: {
        [OptionPresetKeys.ActivePlugins]: JSON.stringify([]),
      },
    });

    expect(context.loadedPlugins).toEqual([]);
    expect(context.pluginModules).toEqual([]);
  });

  it('records load failures without blocking core startup', async () => {
    const contentPath = path.resolve(__dirname, '../../../content');
    const context = await createRuntimeExtensionContext({
      contentPath,
      readOptionsFromService: false,
      optionValues: {
        [OptionPresetKeys.ActivePlugins]: JSON.stringify(['missing-plugin']),
      },
    });

    expect(context.loadedPlugins).toEqual([]);
    expect(context.failedPlugins).toEqual([
      expect.objectContaining({
        id: 'missing-plugin',
        phase: 'manifest',
      }),
    ]);
  });
});
