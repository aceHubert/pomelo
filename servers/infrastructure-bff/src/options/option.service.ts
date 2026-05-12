import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  UserInputError,
  ForbiddenError,
  RuntimeError,
  OptionAutoload,
  OptionPresetKeys,
  INFRASTRUCTURE_SERVICE,
  OptionPattern,
  UserRole,
} from '@ace-pomelo/shared/server';
import { AppCacheService } from '@/cache/cache.service';
import { MAIL_REQUIRED_OPTION_KEYS, OPTION_DEFINITION_MAP, OptionDefinition } from './option.constants';

const OPTION_CACHE_TTL = 30_000;

export interface OptionValueResult {
  key: OptionPresetKeys;
  value?: string;
  isSet: boolean;
  useDefault: boolean;
  message?: string;
}

@Injectable()
export class OptionService {
  private cacheVersion = 0;

  constructor(
    @Inject(INFRASTRUCTURE_SERVICE) private readonly basicService: ClientProxy,
    private readonly cacheService: AppCacheService,
  ) {}

  private invalidateCache() {
    this.cacheVersion += 1;
  }

  private getCacheKey(...args: any[]): string {
    return `options:${this.cacheVersion}:${JSON.stringify(args)}`;
  }

  private getDefinition(optionName: string): OptionDefinition {
    const definition = OPTION_DEFINITION_MAP[optionName];

    if (!definition) {
      throw new UserInputError(`Unsupported option "${optionName}"`);
    }

    return definition;
  }

  private canRead(optionName: string, role: UserRole = UserRole.None): boolean {
    const { access } = this.getDefinition(optionName);

    switch (access) {
      case 'public-read':
        return true;
      case 'authenticated-read':
        return role !== UserRole.None;
      case 'admin-read-write':
      case 'secret-write-only':
        return role === UserRole.Administrator;
    }
  }

  private assertWritable(optionName: string, role: UserRole): void {
    const { access } = this.getDefinition(optionName);

    switch (access) {
      case 'public-read':
      case 'authenticated-read':
        throw new ForbiddenError(`Option "${optionName}" is readonly`);
      case 'admin-read-write':
      case 'secret-write-only':
        if (role !== UserRole.Administrator) {
          throw new ForbiddenError(`Not writable for option "${optionName}"`);
        }
    }
  }

  private assertReadable(optionName: string, role: UserRole = UserRole.None): void {
    if (!this.canRead(optionName, role)) {
      throw new ForbiddenError(`Not accessible for option "${optionName}"`);
    }
  }

  private isSecretWriteOnly(optionName: string): boolean {
    return this.getDefinition(optionName).access === 'secret-write-only';
  }

  private sanitizeReadableModel<T extends { optionName: string; optionValue?: string }>(option: T): T {
    if (!this.isSecretWriteOnly(option.optionName)) {
      return option;
    }

    return {
      ...option,
      optionValue: undefined,
    };
  }

  private filterReadableModels<T extends { optionName: string; optionValue?: string }>(
    options: T[],
    role: UserRole = UserRole.None,
  ): T[] {
    return options
      .filter(({ optionName }) => this.canRead(optionName, role))
      .map((option) => this.sanitizeReadableModel(option));
  }

  private filterReadableValues<T extends Record<string, string>>(options: T, role: UserRole = UserRole.None): T {
    return Object.entries(options).reduce((prev, [optionName, optionValue]) => {
      if (!this.canRead(optionName, role)) {
        return prev;
      }

      const { value } = this.readValue(optionName, optionValue, role);

      if (value !== undefined) {
        prev[optionName as keyof T] = value as T[keyof T];
      }

      return prev;
    }, {} as T);
  }

  /**
   * 读取配置值并应用默认值。
   * - 非敏感配置返回真实值或默认值
   * - 敏感配置永远不返回真实值，只返回 isSet 状态
   */
  private readValue(key: string, rawValue: string | undefined, role: UserRole = UserRole.None): OptionValueResult {
    const def = this.getDefinition(key);

    this.assertReadable(key, role);

    const isSet = rawValue !== undefined;

    if (def.access === 'secret-write-only') {
      return {
        key: def.key,
        isSet,
        useDefault: false,
        value: undefined,
        message: isSet ? '已设置' : '未设置',
      };
    }

    if (isSet) {
      return { key: def.key, value: rawValue, isSet: true, useDefault: false };
    }

    if (def.requiredForMail) {
      return {
        key: def.key,
        isSet: false,
        useDefault: false,
        value: undefined,
        message: `配置 ${key} 未设置，请前往管理端设置页面补全邮箱发送配置`,
      };
    }

    if (def.defaultValue !== undefined) {
      return {
        key: def.key,
        value: def.defaultValue,
        isSet: false,
        useDefault: true,
      };
    }

    return {
      key: def.key,
      isSet: false,
      useDefault: false,
      message: `配置 ${def.key} 未设置`,
    };
  }

  async getMailConfig(): Promise<{
    host: string;
    port: number;
    user: string;
    pass: string;
  }> {
    const optionNames = [
      OptionPresetKeys.MailServerUrl,
      OptionPresetKeys.MailServerPort,
      OptionPresetKeys.MailServerLogin,
      OptionPresetKeys.MailServerPass,
    ];
    const options = await this.basicService
      .send<Array<{ optionName: string; optionValue: string }>>(OptionPattern.GetList, {
        query: {
          optionNames,
        },
        fields: ['optionName', 'optionValue'],
      })
      .lastValue();
    const optionMap = new Map(options.map(({ optionName, optionValue }) => [optionName, optionValue]));

    const missingKeys = MAIL_REQUIRED_OPTION_KEYS.filter((key) => !optionMap.get(key));
    if (missingKeys.length) {
      throw new RuntimeError(`邮箱发送配置不完整，请管理员前往设置页面补全：${missingKeys.join(', ')}`);
    }

    const portDefinition = this.getDefinition(OptionPresetKeys.MailServerPort);

    return {
      host: optionMap.get(OptionPresetKeys.MailServerUrl)!,
      port: Number(optionMap.get(OptionPresetKeys.MailServerPort) ?? portDefinition.defaultValue ?? 110),
      user: optionMap.get(OptionPresetKeys.MailServerLogin)!,
      pass: optionMap.get(OptionPresetKeys.MailServerPass)!,
    };
  }

  async getValue(optionName: string, role: UserRole = UserRole.None): Promise<string | undefined> {
    this.assertReadable(optionName, role);

    const definition = this.getDefinition(optionName);
    if (definition.access === 'secret-write-only') {
      return undefined;
    }

    const cacheKey = this.getCacheKey('value', optionName, role);
    const cached = await this.cacheService.get<string>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const raw = await this.basicService
      .send<string | undefined>(OptionPattern.GetValue, {
        optionName,
      })
      .lastValue();

    const { value: resolvedValue } = this.readValue(optionName, raw, role);

    await this.cacheService.set(cacheKey, resolvedValue, OPTION_CACHE_TTL);
    return resolvedValue;
  }

  async getById(id: number, fields: string[], role: UserRole = UserRole.None): Promise<OptionValueResult | undefined> {
    const cacheKey = this.getCacheKey('id', id, fields, role);
    const cached = await this.cacheService.get<OptionValueResult>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const option = await this.basicService
      .send<{ optionName: string; optionValue?: string } | undefined>(OptionPattern.Get, {
        id,
        fields,
      })
      .lastValue();

    if (option) {
      const value = this.readValue(option.optionName, option.optionValue, role);
      await this.cacheService.set(cacheKey, value, OPTION_CACHE_TTL);
      return value;
    }

    await this.cacheService.set(cacheKey, option, OPTION_CACHE_TTL);
    return option;
  }

  async getOption(optionName: string, fields: string[], role: UserRole = UserRole.None): Promise<OptionValueResult> {
    this.assertReadable(optionName, role);

    const cacheKey = this.getCacheKey('option', optionName, fields, role);
    const cached = await this.cacheService.get<OptionValueResult>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const option = await this.basicService
      .send<{ optionName: string; optionValue?: string } | undefined>(OptionPattern.GetByName, {
        optionName,
        fields,
      })
      .lastValue();

    const value = this.readValue(optionName, option?.optionValue, role);
    await this.cacheService.set(cacheKey, value, OPTION_CACHE_TTL);
    return value;
  }

  async getBasicValues(names: string[], role: UserRole = UserRole.None): Promise<Record<string, string>> {
    const readableNames = names.filter((name) => this.canRead(name, role) && !this.isSecretWriteOnly(name));

    if (!readableNames.length) {
      return {};
    }

    const cacheKey = this.getCacheKey('basic-values', readableNames, role);
    const cached = await this.cacheService.get<Record<string, string>>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const options = await this.basicService
      .send<Array<{ optionName: string; optionValue: string }>>(OptionPattern.GetList, {
        query: {
          optionNames: readableNames,
        },
        fields: ['optionName', 'optionValue'],
      })
      .lastValue();

    const values = options.reduce((prev, { optionName, optionValue }) => {
      prev[optionName] = optionValue;
      return prev;
    }, {} as Record<string, string>);

    await this.cacheService.set(cacheKey, values, OPTION_CACHE_TTL);
    return values;
  }

  async getAutoloadValues(role: UserRole = UserRole.None): Promise<Record<string, string>> {
    const cacheKey = this.getCacheKey('autoload', role);
    const cached = await this.cacheService.get<Record<string, string>>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const options = await this.basicService.send<Record<string, string>>(OptionPattern.GetAutoloads, {}).lastValue();
    const values = this.filterReadableValues(options, role);

    await this.cacheService.set(cacheKey, values, OPTION_CACHE_TTL);
    return values;
  }

  async getList<T extends { optionName: string; optionValue?: string }>(
    query: Record<string, any>,
    fields: string[],
    role: UserRole,
  ): Promise<T[]> {
    const cacheKey = this.getCacheKey('list', query, fields, role);
    const cached = await this.cacheService.get<T[]>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const options = await this.basicService
      .send<T[]>(OptionPattern.GetList, {
        query,
        fields,
      })
      .lastValue();

    const filteredOptions = this.filterReadableModels(options, role);
    await this.cacheService.set(cacheKey, filteredOptions, OPTION_CACHE_TTL);
    return filteredOptions;
  }

  async resetCache(): Promise<void> {
    this.invalidateCache();
  }

  async updateOption(optionName: string, optionValue: string, role: UserRole, requestUserId: number): Promise<void> {
    this.assertWritable(optionName, role);

    const option = await this.basicService
      .send<{ id: number } | undefined>(OptionPattern.GetByName, {
        optionName,
        fields: ['id'],
      })
      .lastValue();

    if (option) {
      await this.basicService
        .send<void>(OptionPattern.Update, {
          id: option.id,
          optionValue,
          requestUserId,
        })
        .lastValue();
      this.invalidateCache();
      return;
    }

    await this.basicService
      .send<void>(OptionPattern.Create, {
        optionName,
        optionValue,
        autoload: OptionAutoload.Yes,
        requestUserId,
      })
      .lastValue();
    this.invalidateCache();
  }
}
