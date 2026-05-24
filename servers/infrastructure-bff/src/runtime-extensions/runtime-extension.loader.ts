import * as path from 'path';
import { pathToFileURL } from 'url';
import { createRequire } from 'module';
import { DynamicModule, Logger, Type } from '@nestjs/common';
import { ClientProxy, ClientProxyFactory, Transport } from '@nestjs/microservices';
import { configuration, OptionPattern, OptionPresetKeys } from '@ace-pomelo/shared/server';
import { catchError, firstValueFrom, of, timeout as rxTimeout } from 'rxjs';
import {
  RuntimeExtensionContext,
  RuntimeExtensionFailure,
  RuntimeExtensionManifest,
  RuntimeExtensionOptionsSnapshot,
  RuntimeExtensionRecord,
} from './interfaces/runtime-extension.interface';
import {
  createActivePluginsHash,
  createDefaultOptionsSnapshot,
  getServerEntry,
  getServerOptions,
  normalizePluginIds,
  parseOptionList,
  scanRuntimeExtensions,
} from './runtime-extension.utils';

const logger = new Logger('RuntimeExtensionLoader', { timestamp: true });
const requireFromRuntime = createRequire(__filename);
const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<any>;

export interface CreateRuntimeExtensionContextOptions {
  contentPath?: string;
  optionValues?: Partial<Record<OptionPresetKeys, string | undefined>>;
  readOptionsFromService?: boolean;
  optionReadTimeoutMs?: number;
}

function createBootId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getEnvOptionValue(key: OptionPresetKeys): string | undefined {
  const envName = `POMELO_${key.toUpperCase()}`;
  return process.env[envName] ?? process.env[key.toUpperCase()];
}

function parseOptionsSnapshot(
  values: Partial<Record<OptionPresetKeys, string | undefined>>,
): RuntimeExtensionOptionsSnapshot {
  return {
    activePlugins: parseOptionList(
      values[OptionPresetKeys.ActivePlugins] ?? getEnvOptionValue(OptionPresetKeys.ActivePlugins),
    ),
    uninstallPlugins: parseOptionList(
      values[OptionPresetKeys.UninstallPlugins] ?? getEnvOptionValue(OptionPresetKeys.UninstallPlugins),
    ),
    template: values[OptionPresetKeys.Template] ?? getEnvOptionValue(OptionPresetKeys.Template),
    stylesheet: values[OptionPresetKeys.Stylesheet] ?? getEnvOptionValue(OptionPresetKeys.Stylesheet),
  };
}

async function readOptionValuesFromInfrastructureService(
  timeoutMs: number,
): Promise<Partial<Record<OptionPresetKeys, string | undefined>>> {
  const client = ClientProxyFactory.create({
    transport: Transport.TCP,
    options: {
      host: process.env.INFRASTRUCTURE_SERVICE_HOST || '',
      port: Number(process.env.INFRASTRUCTURE_SERVICE_PORT || 3000),
    },
  }) as ClientProxy;

  const keys = [
    OptionPresetKeys.ActivePlugins,
    OptionPresetKeys.UninstallPlugins,
    OptionPresetKeys.Template,
    OptionPresetKeys.Stylesheet,
  ];

  try {
    await Promise.race([
      client.connect(),
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error('读取 options 服务连接超时')), timeoutMs)),
    ]);

    const entries = await Promise.all(
      keys.map(async (optionName) => {
        const value = await firstValueFrom(
          client.send<string | undefined>(OptionPattern.GetValue, { optionName }).pipe(
            rxTimeout(timeoutMs),
            catchError(() => of(undefined)),
          ),
        );
        return [optionName, value] as const;
      }),
    );

    return Object.fromEntries(entries);
  } finally {
    client.close();
  }
}

async function resolveOptionsSnapshot(
  options: CreateRuntimeExtensionContextOptions,
): Promise<RuntimeExtensionOptionsSnapshot> {
  const shouldReadOptions =
    options.readOptionsFromService !== false && process.env.POMELO_RUNTIME_EXTENSIONS_SKIP_OPTIONS !== 'true';
  const optionReadTimeoutMs = options.optionReadTimeoutMs ?? Number(process.env.POMELO_OPTIONS_READ_TIMEOUT_MS || 1500);

  if (!shouldReadOptions) {
    return parseOptionsSnapshot(options.optionValues || {});
  }

  try {
    const serviceValues = await readOptionValuesFromInfrastructureService(optionReadTimeoutMs);
    return parseOptionsSnapshot({ ...serviceValues, ...options.optionValues });
  } catch (error: any) {
    logger.warn(`读取扩展 options 失败，使用默认空插件配置启动：${error.message}`);
    return {
      ...parseOptionsSnapshot(options.optionValues || {}),
      readError: error.message,
    };
  }
}

async function loadRuntimeEntry(entryPath: string): Promise<any> {
  try {
    return requireFromRuntime(entryPath);
  } catch (error: any) {
    if (error?.code !== 'ERR_REQUIRE_ESM') throw error;
    return dynamicImport(pathToFileURL(entryPath).href);
  }
}

function getExportedValue(entryExports: any, manifest: RuntimeExtensionManifest): any {
  if (manifest.server && typeof manifest.server === 'object' && manifest.server.export) {
    return entryExports[manifest.server.export];
  }

  return entryExports.default ?? entryExports.module ?? entryExports.PluginModule ?? entryExports;
}

async function resolvePluginModule(record: RuntimeExtensionRecord): Promise<Type<any> | DynamicModule> {
  if (!record.manifest) {
    throw new Error(record.validationError || '插件 manifest 无效');
  }

  const serverEntry = getServerEntry(record.manifest);
  if (!serverEntry) {
    throw new Error('插件未声明服务端入口');
  }

  const entryPath = path.resolve(record.directoryPath, serverEntry);
  const entryExports = await loadRuntimeEntry(entryPath);
  let moduleOrFactory = getExportedValue(entryExports, record.manifest);
  const factoryName =
    record.manifest.server && typeof record.manifest.server === 'object' && record.manifest.server.factory;

  if (factoryName) {
    const factoryHost = moduleOrFactory?.[factoryName] ? moduleOrFactory : entryExports;
    const factory = factoryHost?.[factoryName];
    if (typeof factory !== 'function') {
      throw new Error(`插件入口未导出工厂方法 ${factoryName}`);
    }
    moduleOrFactory = factory.call(factoryHost, getServerOptions(record.manifest));
  }

  moduleOrFactory = await Promise.resolve(moduleOrFactory);

  if (moduleOrFactory && typeof moduleOrFactory === 'object' && moduleOrFactory.module) {
    return moduleOrFactory;
  }

  if (typeof moduleOrFactory === 'function') {
    return moduleOrFactory;
  }

  throw new Error('插件入口未返回 Nest 模块或 DynamicModule');
}

export async function createRuntimeExtensionContext(
  options: CreateRuntimeExtensionContextOptions = {},
): Promise<RuntimeExtensionContext> {
  let contentPath = options.contentPath;
  if (!contentPath) {
    const config = configuration()() as { contentPath: string };
    contentPath = config.contentPath;
  }
  const startedAt = new Date().toISOString();
  const bootId = createBootId();
  const extensionOptions = await resolveOptionsSnapshot(options);
  const discoveredExtensions = scanRuntimeExtensions(contentPath);
  const activePlugins = normalizePluginIds(extensionOptions.activePlugins);
  const pluginModules: RuntimeExtensionContext['pluginModules'] = [];
  const loadedPlugins: string[] = [];
  const failedPlugins: RuntimeExtensionFailure[] = [];
  const discoveredPluginMap = new Map(
    discoveredExtensions
      .filter((extension) => extension.type === 'plugin')
      .map((extension) => [extension.id, extension]),
  );

  for (const pluginId of activePlugins) {
    const record = discoveredPluginMap.get(pluginId);
    if (!record) {
      failedPlugins.push({
        id: pluginId,
        type: 'plugin',
        phase: 'manifest',
        reason: '插件目录不存在',
      });
      continue;
    }

    if (record.validationError) {
      failedPlugins.push({
        id: record.id,
        type: record.type,
        phase: 'manifest',
        reason: record.validationError,
        directoryPath: record.directoryPath,
      });
      continue;
    }

    if (!record.hasServerModule) continue;

    try {
      pluginModules.push(await resolvePluginModule(record));
      loadedPlugins.push(record.id);
    } catch (error: any) {
      failedPlugins.push({
        id: record.id,
        type: record.type,
        phase: 'load',
        reason: error.message,
        directoryPath: record.directoryPath,
        entryPath: record.manifest
          ? path.resolve(record.directoryPath, getServerEntry(record.manifest) || '')
          : undefined,
      });
    }
  }

  return {
    bootId,
    startedAt,
    contentPath,
    options: {
      ...createDefaultOptionsSnapshot(),
      ...extensionOptions,
      activePlugins,
    },
    activePluginsHash: createActivePluginsHash(activePlugins),
    discoveredExtensions,
    loadedPlugins,
    failedPlugins,
    pluginModules,
  };
}
