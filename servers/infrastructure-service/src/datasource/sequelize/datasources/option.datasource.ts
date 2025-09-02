import { WhereOptions, Attributes } from 'sequelize';
import { Injectable } from '@nestjs/common';
import { ValidationError, UserCapability, OptionAutoload } from '@ace-pomelo/shared/server';
import { Options } from '../entities';
import { OptionModel, OptionArgs, NewOptionInput, UpdateOptionInput } from '../interfaces/option.interface';
import { BaseDataSource } from './base.datasource';

@Injectable()
export class OptionDataSource extends BaseDataSource {
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
   * 根据 name 获取 Options
   * 返回的 optionName 如果含有 table 前缀， 会去掉前缀
   * @param optionName Option name
   * @param fields 返回的字段
   */
  getByName(optionName: string, fields: string[]): Promise<OptionModel | undefined> {
    return Options.findOne({
      attributes: this.filterFields(fields, Options),
      where: { optionName: [optionName, `${this.tablePrefix}${optionName}`] },
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
    const { optionNames, ...rest } = query;
    const where: WhereOptions<Attributes<Options>> = rest;
    if (optionNames?.length) {
      where.optionName = optionNames;
    }
    return Options.findAll({
      attributes: this.filterFields(fields, Options),
      where,
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
   * 获取应用程序启动里需要加载的配置项
   */
  getAutoloads(): Promise<Record<string, string>> {
    return Options.findAll({
      attributes: ['optionName', 'optionValue'],
      where: {
        autoload: OptionAutoload.Yes,
      },
    }).then((options) =>
      options.reduce((prev, curr, index, arr) => {
        let key = curr.optionName,
          value;

        // 优先取带有 tablePrefix 的值
        if (curr.optionName.startsWith(this.tablePrefix)) {
          key = curr.optionName.substring(this.tablePrefix.length);
          value = curr.optionValue;
        } else if (
          !(value = arr.find(({ optionName }) => optionName === `${this.tablePrefix}${curr.optionName}`)?.optionValue)
        ) {
          value = curr.optionValue;
        }
        prev[key] = value;
        return prev;
      }, {} as Record<string, string>),
    );
  }

  /**
   * 通过 optionName 获取 optionValue
   * 反回第一个匹配name(优先查找带有tablePrefix)的值
   * @param optionName optionName
   */
  getValue(optionName: string): Promise<string | undefined> {
    return this.getOption(optionName);
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
    }).then(([count]) => {
      if (count > 0) {
        // 删除缓存
        Options.findByPk(id, { attributes: ['optionName'] }).then((option) => {
          this.datasourceService.optionsCache.del(option!.optionName);
        });
      }
    });
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
    }).then((count) => {
      if (count > 0) {
        // 删除缓存
        Options.findByPk(id, { attributes: ['optionName'] }).then((option) => {
          this.datasourceService.optionsCache.del(option!.optionName);
        });
      }
    });
  }
}
