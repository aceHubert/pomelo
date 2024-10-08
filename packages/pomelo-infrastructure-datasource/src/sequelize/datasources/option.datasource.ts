import { ModuleRef } from '@nestjs/core';
import { Injectable } from '@nestjs/common';
import { ValidationError } from '@ace-pomelo/shared-server';
import { UserCapability } from '../helpers/user-capability';
import { OptionModel, OptionArgs, NewOptionInput, UpdateOptionInput } from '../interfaces/option.interface';
import { BaseDataSource } from './base.datasource';

@Injectable()
export class OptionDataSource extends BaseDataSource {
  constructor(protected readonly moduleRef: ModuleRef) {
    super();
  }

  /**
   * 获取 Options
   * 返回的 optionName 如果含有 table 前缀， 会去掉前缀
   * @param id Option id
   * @param fields 返回的字段
   */
  get(id: number, fields: string[]): Promise<OptionModel | undefined> {
    return this.models.Options.findByPk(id, {
      attributes: this.filterFields(fields, this.models.Options),
    }).then((option) => {
      if (option) {
        const { optionName, ...rest } = option.toJSON();
        return {
          ...rest,
          optionName:
            optionName && optionName.startsWith(this.tablePrefix)
              ? optionName.substr(this.tablePrefix.length)
              : optionName,
        } as OptionModel;
      }
      return;
    });
  }

  /**
   * 获取 Options 列表
   * 返回的 optionName 如果含有 table 前缀， 会去掉前缀
   * @param query 搜索条件
   * @param fields 返回的字段
   */
  getList(query: OptionArgs, fields: string[]): Promise<OptionModel[]> {
    return this.models.Options.findAll({
      attributes: this.filterFields(fields, this.models.Options),
      where: {
        ...query,
      },
    }).then((options) =>
      options.map((option) => {
        const { optionName, ...rest } = option.toJSON();
        return {
          ...rest,
          optionName:
            optionName && optionName.startsWith(this.tablePrefix)
              ? optionName.substr(this.tablePrefix.length)
              : optionName,
        } as OptionModel;
      }),
    );
  }

  /**
   * 获取应用程序启动里需要加载的配置项（内存缓存，修改时重新加载）
   */
  getAutoloads(): Promise<Record<string, string>> {
    return this.autoloadOptions;
  }

  /**
   * 通过 optionName 获取 optionValue
   * 反回第一个匹配name(优先查找带有tablePrefix)的值
   * @param optionName optionName
   */
  getValue<V extends string>(optionName: string): Promise<V | undefined> {
    return this.getOption<V>(optionName);
  }

  /**
   * 是否在在 optionName 的项
   * @param optionName optionName
   */
  async isExists(optionName: string) {
    return (
      (await this.models.Options.count({
        where: {
          optionName: [optionName, `${this.tablePrefix}${optionName}`],
        },
      })) > 0
    );
  }

  /**
   * 新建 Options
   * @param model 新建模型
   * @param requestUserId 请求用户 Id
   */
  async create(model: NewOptionInput, requestUserId: number): Promise<OptionModel> {
    await this.hasCapability(UserCapability.ManageOptions, requestUserId);

    if (await this.isExists(model.optionName)) {
      throw new ValidationError(
        this.translate('datasource.option.name_exists', `Option name "${model.optionName}" has existed!`, {
          name: model.optionName,
        }),
      );
    }

    const option = await this.models.Options.create(model);
    super.resetOptions();
    return option.toJSON<OptionModel>();
  }

  /**
   * 修改 Options
   * @param id Options id
   * @param model 修改实体模型
   * @param requestUserId 请求用户 Id
   */
  async update(id: number, model: UpdateOptionInput, requestUserId: number): Promise<void> {
    await this.hasCapability(UserCapability.ManageOptions, requestUserId);

    await this.models.Options.update(model, {
      where: { id },
    });
    super.resetOptions();
  }

  /**
   * 清除 Options 缓存
   */
  reset(): void {
    super.resetOptions();
  }

  /**
   * 删除 Options
   * @param id Option Id
   * @param requestUserId 请求用户 Id
   */
  async delete(id: number, requestUserId: number): Promise<void> {
    await this.hasCapability(UserCapability.ManageOptions, requestUserId);

    await this.models.Options.destroy({
      where: { id },
    });
    super.resetOptions();
  }
}
