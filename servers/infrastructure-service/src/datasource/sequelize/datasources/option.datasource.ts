import { Injectable } from '@nestjs/common';
import { ValidationError, UserCapability } from '@ace-pomelo/shared/server';
import { InfrastructureDatasourceService } from '../../datasource.service';
import { Options } from '../entities';
import { OptionModel, OptionArgs, NewOptionInput, UpdateOptionInput } from '../interfaces/option.interface';
import { BaseDataSource } from './base.datasource';

@Injectable()
export class OptionDataSource extends BaseDataSource {
  constructor(datasourceService: InfrastructureDatasourceService) {
    super(datasourceService);
  }

  /**
   * 获取 Options
   * 返回的 optionName 如果含有 table 前缀， 会去掉前缀
   * @param id Option id
   * @param fields 返回的字段
   */
  get(id: number, fields: string[]): Promise<OptionModel | undefined> {
    return Options.findByPk(id, {
      attributes: this.filterFields(fields, Options),
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
    return Options.findAll({
      attributes: this.filterFields(fields, Options),
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
      (await Options.count({
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
        this.translate(
          'infrastructure-service.datasource.option.name_exists',
          `Option name "${model.optionName}" has existed!`,
          {
            name: model.optionName,
          },
        ),
      );
    }

    const option = await Options.create(model);
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

    await Options.update(model, {
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

    await Options.destroy({
      where: { id },
    });
    super.resetOptions();
  }
}
