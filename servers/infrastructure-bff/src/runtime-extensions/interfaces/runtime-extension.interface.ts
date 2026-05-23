import { DynamicModule, Type } from '@nestjs/common';

export type RuntimeExtensionType = 'plugin' | 'theme';

export interface RuntimeExtensionServerManifest {
  entry?: string;
  export?: string;
  factory?: string;
  options?: Record<string, any>;
}

export interface RuntimeExtensionManifest {
  id: string;
  type: RuntimeExtensionType;
  name?: string;
  version?: string;
  description?: string;
  server?: boolean | RuntimeExtensionServerManifest;
  config?: Record<string, any>;
}

export interface RuntimeExtensionRecord {
  id: string;
  type: RuntimeExtensionType;
  name: string;
  version?: string;
  description?: string;
  directoryName: string;
  directoryPath: string;
  manifestPath: string;
  manifest?: RuntimeExtensionManifest;
  hasServerModule: boolean;
  validationError?: string;
}

export interface RuntimeExtensionOptionsSnapshot {
  activePlugins: string[];
  uninstallPlugins: string[];
  template?: string;
  stylesheet?: string;
  readError?: string;
}

export interface RuntimeExtensionFailure {
  id: string;
  type?: RuntimeExtensionType;
  phase: 'manifest' | 'options' | 'load';
  reason: string;
  directoryPath?: string;
  entryPath?: string;
}

export interface RuntimeExtensionContext {
  bootId: string;
  startedAt: string;
  contentPath: string;
  options: RuntimeExtensionOptionsSnapshot;
  activePluginsHash: string;
  discoveredExtensions: RuntimeExtensionRecord[];
  loadedPlugins: string[];
  failedPlugins: RuntimeExtensionFailure[];
  pluginModules: Array<Type<any> | DynamicModule>;
}

export interface RuntimeExtensionStateItem {
  id: string;
  type: RuntimeExtensionType;
  name: string;
  version?: string;
  description?: string;
  installed: boolean;
  configured: boolean;
  loaded: boolean;
  uninstallPending: boolean;
  activeTheme: boolean;
  hasServerModule: boolean;
  directoryPath?: string;
  failedReason?: string;
}

export interface RuntimeExtensionState {
  bootId: string;
  startedAt: string;
  contentPath: string;
  ready: boolean;
  activePluginsHash: string;
  activePlugins: string[];
  uninstallPlugins: string[];
  template?: string;
  stylesheet?: string;
  loadedPlugins: string[];
  failedPlugins: RuntimeExtensionFailure[];
  plugins: RuntimeExtensionStateItem[];
  themes: RuntimeExtensionStateItem[];
  optionsReadError?: string;
}

export interface SystemHeartbeat {
  bootId: string;
  startedAt: string;
  ready: boolean;
  activePluginsHash: string;
  loadedPlugins: string[];
  failedPlugins: RuntimeExtensionFailure[];
}
