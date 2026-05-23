import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { RUNTIME_EXTENSION_DEFAULT_SERVER_ENTRY, RUNTIME_EXTENSION_MANIFEST_FILE } from './constants';
import {
  RuntimeExtensionFailure,
  RuntimeExtensionManifest,
  RuntimeExtensionOptionsSnapshot,
  RuntimeExtensionRecord,
  RuntimeExtensionState,
  RuntimeExtensionStateItem,
  RuntimeExtensionType,
} from './interfaces/runtime-extension.interface';

export function parseOptionList(rawValue: string | undefined): string[] {
  if (!rawValue) return [];

  const trimmed = rawValue.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return normalizePluginIds(
        parsed
          .map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') return item.id ?? item.name ?? item.plugin;
            return undefined;
          })
          .filter(Boolean),
      );
    }
  } catch {
    // 兼容早期逗号分隔配置。
  }

  return normalizePluginIds(trimmed.split(/[,\n;]/g));
}

export function normalizePluginIds(ids: Array<string | undefined>): string[] {
  return Array.from(new Set(ids.map((id) => id?.trim()).filter((id): id is string => !!id)));
}

export function createActivePluginsHash(activePlugins: string[]): string {
  const normalized = normalizePluginIds(activePlugins).sort();
  return crypto.createHash('sha1').update(JSON.stringify(normalized)).digest('hex');
}

export function getServerEntry(manifest: RuntimeExtensionManifest): string | undefined {
  if (!manifest.server) return undefined;
  if (manifest.server === true) return RUNTIME_EXTENSION_DEFAULT_SERVER_ENTRY;
  return manifest.server.entry || RUNTIME_EXTENSION_DEFAULT_SERVER_ENTRY;
}

export function getServerOptions(manifest: RuntimeExtensionManifest): Record<string, any> {
  return manifest.server && typeof manifest.server === 'object' ? manifest.server.options || {} : {};
}

export function readManifest(manifestPath: string): RuntimeExtensionManifest {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as RuntimeExtensionManifest;
}

export function validateManifest(
  manifest: RuntimeExtensionManifest,
  expectedType: RuntimeExtensionType,
): string | undefined {
  if (!manifest || typeof manifest !== 'object') return 'manifest 必须是 JSON 对象';
  if (!manifest.id || typeof manifest.id !== 'string') return 'manifest.id 必须是非空字符串';
  if (manifest.type !== expectedType) return `manifest.type 必须是 ${expectedType}`;
  if (manifest.version !== undefined && typeof manifest.version !== 'string') return 'manifest.version 必须是字符串';
  if (manifest.server !== undefined && typeof manifest.server !== 'boolean' && typeof manifest.server !== 'object') {
    return 'manifest.server 必须是布尔值或对象';
  }
  return undefined;
}

export function scanRuntimeExtensionDir(contentPath: string, type: RuntimeExtensionType): RuntimeExtensionRecord[] {
  const baseDir = path.join(contentPath, type === 'plugin' ? 'plugins' : 'themes');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
    return [];
  }

  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => {
      const directoryPath = path.join(baseDir, dirent.name);
      const manifestPath = path.join(directoryPath, RUNTIME_EXTENSION_MANIFEST_FILE);
      const fallbackRecord: RuntimeExtensionRecord = {
        id: dirent.name,
        type,
        name: dirent.name,
        directoryName: dirent.name,
        directoryPath,
        manifestPath,
        hasServerModule: false,
      };

      if (!fs.existsSync(manifestPath)) {
        return {
          ...fallbackRecord,
          validationError: `缺少 ${RUNTIME_EXTENSION_MANIFEST_FILE}`,
        };
      }

      try {
        const manifest = readManifest(manifestPath);
        const validationError = validateManifest(manifest, type);
        return {
          ...fallbackRecord,
          id: manifest.id || fallbackRecord.id,
          name: manifest.name || manifest.id || fallbackRecord.name,
          version: manifest.version,
          description: manifest.description,
          manifest,
          hasServerModule: !!getServerEntry(manifest),
          validationError,
        };
      } catch (error: any) {
        return {
          ...fallbackRecord,
          validationError: `manifest 读取失败：${error.message}`,
        };
      }
    });
}

export function scanRuntimeExtensions(contentPath: string): RuntimeExtensionRecord[] {
  return [...scanRuntimeExtensionDir(contentPath, 'plugin'), ...scanRuntimeExtensionDir(contentPath, 'theme')];
}

export function createDefaultOptionsSnapshot(): RuntimeExtensionOptionsSnapshot {
  return {
    activePlugins: [],
    uninstallPlugins: [],
  };
}

export function buildRuntimeExtensionState(params: {
  bootId: string;
  startedAt: string;
  contentPath: string;
  options: RuntimeExtensionOptionsSnapshot;
  discoveredExtensions: RuntimeExtensionRecord[];
  loadedPlugins: string[];
  failedPlugins: RuntimeExtensionFailure[];
}): RuntimeExtensionState {
  const { bootId, startedAt, contentPath, options, discoveredExtensions, loadedPlugins, failedPlugins } = params;
  const failedReasonMap = new Map(failedPlugins.map((failure) => [failure.id, failure.reason]));
  const loadedSet = new Set(loadedPlugins);
  const activeSet = new Set(options.activePlugins);
  const uninstallSet = new Set(options.uninstallPlugins);

  const toStateItem = (record: RuntimeExtensionRecord): RuntimeExtensionStateItem => ({
    id: record.id,
    type: record.type,
    name: record.name,
    version: record.version,
    description: record.description,
    installed: !record.validationError,
    configured:
      record.type === 'plugin'
        ? activeSet.has(record.id)
        : record.id === options.template || record.id === options.stylesheet,
    loaded: loadedSet.has(record.id),
    uninstallPending: uninstallSet.has(record.id),
    activeTheme: record.type === 'theme' && (record.id === options.template || record.id === options.stylesheet),
    hasServerModule: record.hasServerModule,
    directoryPath: record.directoryPath,
    failedReason: record.validationError || failedReasonMap.get(record.id),
  });

  const plugins = discoveredExtensions.filter((extension) => extension.type === 'plugin').map(toStateItem);
  const themes = discoveredExtensions.filter((extension) => extension.type === 'theme').map(toStateItem);
  const installedPluginIds = new Set(plugins.map((plugin) => plugin.id));

  for (const id of options.activePlugins) {
    if (!installedPluginIds.has(id)) {
      plugins.push({
        id,
        type: 'plugin',
        name: id,
        installed: false,
        configured: true,
        loaded: false,
        uninstallPending: uninstallSet.has(id),
        activeTheme: false,
        hasServerModule: false,
        failedReason: failedReasonMap.get(id) || '插件目录不存在',
      });
    }
  }

  return {
    bootId,
    startedAt,
    contentPath,
    ready: true,
    activePluginsHash: createActivePluginsHash(options.activePlugins),
    activePlugins: options.activePlugins,
    uninstallPlugins: options.uninstallPlugins,
    template: options.template,
    stylesheet: options.stylesheet,
    loadedPlugins,
    failedPlugins,
    plugins,
    themes,
    optionsReadError: options.readError,
  };
}
