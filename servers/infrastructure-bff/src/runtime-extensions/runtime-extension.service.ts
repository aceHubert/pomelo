import { Inject, Injectable, Logger } from '@nestjs/common';
import { OptionPresetKeys, RequestUser, UserRole } from '@ace-pomelo/shared/server';
import { OptionService } from '@/options/option.service';
import { RUNTIME_EXTENSION_CONTEXT } from './constants';
import { RestartRuntimeInput, UpdateRuntimePluginsInput } from './dto/update-runtime-plugins.input';
import {
  RuntimeExtensionContext,
  RuntimeExtensionOptionsSnapshot,
  RuntimeExtensionState,
  SystemHeartbeat,
} from './interfaces/runtime-extension.interface';
import {
  buildRuntimeExtensionState,
  createActivePluginsHash,
  normalizePluginIds,
  parseOptionList,
} from './runtime-extension.utils';

@Injectable()
export class RuntimeExtensionService {
  private readonly logger = new Logger(RuntimeExtensionService.name, { timestamp: true });
  private restartScheduled = false;

  constructor(
    @Inject(RUNTIME_EXTENSION_CONTEXT) private readonly context: RuntimeExtensionContext,
    private readonly optionService: OptionService,
  ) {}

  getHeartbeat(): SystemHeartbeat {
    return {
      bootId: this.context.bootId,
      startedAt: this.context.startedAt,
      ready: true,
      activePluginsHash: this.context.activePluginsHash,
      loadedPlugins: this.context.loadedPlugins,
      failedPlugins: this.context.failedPlugins,
    };
  }

  async getState(): Promise<RuntimeExtensionState> {
    const options = await this.readLiveOptions();
    return buildRuntimeExtensionState({
      bootId: this.context.bootId,
      startedAt: this.context.startedAt,
      contentPath: this.context.contentPath,
      options,
      discoveredExtensions: this.context.discoveredExtensions,
      loadedPlugins: this.context.loadedPlugins,
      failedPlugins: this.context.failedPlugins,
    });
  }

  async updatePlugins(input: UpdateRuntimePluginsInput, requestUser: RequestUser) {
    const role = this.getRequestUserRole(requestUser);
    const requestUserId = Number(requestUser.sub);
    const currentOptions = await this.readLiveOptions();
    const nextOptions: RuntimeExtensionOptionsSnapshot = {
      ...currentOptions,
      activePlugins:
        input.activePlugins !== undefined ? normalizePluginIds(input.activePlugins) : currentOptions.activePlugins,
      uninstallPlugins:
        input.uninstallPlugins !== undefined
          ? normalizePluginIds(input.uninstallPlugins)
          : currentOptions.uninstallPlugins,
    };

    if (input.activePlugins !== undefined) {
      await this.optionService.updateOption(
        OptionPresetKeys.ActivePlugins,
        JSON.stringify(nextOptions.activePlugins),
        role,
        requestUserId,
      );
    }

    if (input.uninstallPlugins !== undefined) {
      await this.optionService.updateOption(
        OptionPresetKeys.UninstallPlugins,
        JSON.stringify(nextOptions.uninstallPlugins),
        role,
        requestUserId,
      );
    }

    const state = buildRuntimeExtensionState({
      bootId: this.context.bootId,
      startedAt: this.context.startedAt,
      contentPath: this.context.contentPath,
      options: nextOptions,
      discoveredExtensions: this.context.discoveredExtensions,
      loadedPlugins: this.context.loadedPlugins,
      failedPlugins: this.context.failedPlugins,
    });

    return {
      restartRequired:
        createActivePluginsHash(nextOptions.activePlugins) !== this.context.activePluginsHash ||
        nextOptions.uninstallPlugins.some((pluginId) => this.context.loadedPlugins.includes(pluginId)),
      state,
    };
  }

  restart(input: RestartRuntimeInput = {}) {
    const delayMs = Math.max(input.delayMs ?? 500, 50);
    const scheduledAt = new Date().toISOString();

    if (!this.restartScheduled) {
      this.restartScheduled = true;
      const timer = setTimeout(() => {
        if (process.env.NODE_ENV === 'test' || process.env.POMELO_DISABLE_SYSTEM_RESTART === 'true') {
          this.logger.warn('已跳过真实进程退出，仅记录重启请求');
          return;
        }

        process.kill(process.pid, 'SIGTERM');
      }, delayMs);
      timer.unref?.();
    }

    return {
      accepted: true,
      bootId: this.context.bootId,
      scheduledAt,
      delayMs,
    };
  }

  private async readLiveOptions(): Promise<RuntimeExtensionOptionsSnapshot> {
    try {
      const [activePlugins, uninstallPlugins, template, stylesheet] = await Promise.all([
        this.optionService.getValue(OptionPresetKeys.ActivePlugins, UserRole.Administrator),
        this.optionService.getValue(OptionPresetKeys.UninstallPlugins, UserRole.Administrator),
        this.optionService.getValue(OptionPresetKeys.Template, UserRole.Administrator),
        this.optionService.getValue(OptionPresetKeys.Stylesheet, UserRole.Administrator),
      ]);

      return {
        activePlugins: parseOptionList(activePlugins),
        uninstallPlugins: parseOptionList(uninstallPlugins),
        template,
        stylesheet,
        readError: this.context.options.readError,
      };
    } catch (error: any) {
      return {
        ...this.context.options,
        readError: error.message,
      };
    }
  }

  private getRequestUserRole(requestUser?: RequestUser): UserRole {
    const role = requestUser?.role ?? requestUser?.capabilities;
    return Object.values(UserRole).includes(role) ? role : UserRole.None;
  }
}
