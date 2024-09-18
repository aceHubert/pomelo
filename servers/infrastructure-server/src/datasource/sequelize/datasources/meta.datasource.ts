import { lowerFirst, flattenDeep, groupBy } from 'lodash';
import { ModelStatic, Model, Op } from 'sequelize';
import { ModuleRef } from '@nestjs/core';
import { UserInputError, ValidationError, RuntimeError } from '@ace-pomelo/shared/server';
import { MetaModel, NewMetaInput } from '../interfaces/meta.interface';
import { MetaDataSource as IMetaDataSource } from '../interfaces/meta-data-source.interface';
import { BaseDataSource } from './base.datasource';

/**
 * 默认根据子类名查找实体及字段 Id
 * 如子类名为 PostDataSource, 则会查找 TemplateMeta 模型 及 templateId 字段
 * 如需要指定模型及字段名，可在子类构造函数中进行修改
 * metaKey 不可以同时存在带有前缀的参数，如：po_locale 和 locale, 根据metaKey 修改的时候会被同时修改
 * metaKey 前缀为 $ 为关键字，无法操作，内部调用直接用原模型操作
 */
export abstract class MetaDataSource<MetaReturnType extends MetaModel, NewMetaInputType extends NewMetaInput>
  extends BaseDataSource
  implements IMetaDataSource<MetaReturnType, NewMetaInputType>
{
  protected metaModelIdFieldName: string; // 如 templateId
  protected metaModelName: string; // 如 TemplateMeta

  constructor(moduleRef: ModuleRef) {
    super(moduleRef);
    const rootModelName = this.constructor.name.replace(/DataSource$/, '');
    this.metaModelIdFieldName = `${lowerFirst(rootModelName)}Id`;
    this.metaModelName = `${rootModelName}Meta`;
  }

  private get metaModel() {
    const model = this.sequelize.modelManager.getModel(this.metaModelName);
    if (model === null) {
      throw new RuntimeError(`Could not found sequelize model from name "${this.metaModelName}"`);
    }
    return model as ModelStatic<Model>;
  }

  /**
   * 移除 metaKey 私有($)和数据表(多应用数据表共享)前缀
   * @param key metaKey
   */
  protected fixMetaKey(key: string) {
    // remove private prefix
    if (key.startsWith('$')) {
      return key.substr(1);
    }
    // remove table prefix
    if (key.startsWith(this.tablePrefix)) {
      return key.substr(this.tablePrefix.length);
    }
    return key;
  }

  /**
   * 获取元数据
   * @param id meta Id
   */
  getMeta(id: number, fields: string[]): Promise<MetaReturnType | undefined> {
    return this.metaModel
      .findOne({
        attributes: this.filterFields(fields, this.metaModel),
        where: {
          id,
          metaKey: {
            [Op.notLike]: '$%',
          },
        },
      })
      .then((meta) => {
        if (meta) {
          const { metaKey, ...rest } = meta.toJSON();
          return {
            ...rest,
            metaKey:
              metaKey && metaKey.startsWith(this.tablePrefix) ? metaKey.substr(this.tablePrefix.length) : metaKey,
          } as unknown as MetaReturnType;
        }
        return;
      });
  }

  /**
   * 获取元数据(根据metaKey)
   * @param modelId 实体 id
   * @param metaKey metaKey (不需要添加 table 前缀会自动匹配到带有前缀的数据)
   * @param fields 返回字段
   */
  getMetaByKey(modelId: number, metaKey: string, fields: string[]): Promise<MetaReturnType | undefined> {
    const fixedKey = this.fixMetaKey(metaKey);
    return this.metaModel
      .findOne({
        attributes: this.filterFields(fields, this.metaModel),
        where: {
          [this.metaModelIdFieldName]: modelId,
          metaKey: [fixedKey, `${this.tablePrefix}${fixedKey}`],
        },
      })
      .then((meta) => {
        if (meta) {
          const { metaKey, ...rest } = meta.toJSON();
          return {
            ...rest,
            metaKey: this.fixMetaKey(metaKey),
          } as unknown as MetaReturnType;
        }
        return;
      });
  }

  /**
   * 根据实体 ID 获取元数据
   * 如果 metaKeys 为空或长度为0，则会返回所有非私有（$前缀）的的数据
   * @param modelId 实体 Id
   * @param metaKeys meta keys(不需要添加 table 前缀会自动匹配到带有前缀的数据, ALL 为所有)
   * @param fields 返回字段
   */
  getMetas(modelId: number, metaKeys: string[] | undefined, fields: string[]): Promise<MetaReturnType[]>;
  /**
   * 根据实体 id 数组获取元数据，返回对象
   * @param modelId 实体 Id 数组
   * @param metaKeys 过滤的字段(不需要添加 table 前缀会自动匹配到带有前缀的数据, ALL 为所有)
   * @param fields 返回字段
   */
  getMetas(
    modelId: number[],
    metaKeys: string[] | undefined,
    fields: string[],
  ): Promise<Record<number, MetaReturnType[]>>;
  getMetas(
    modelIdOrIds: number | number[],
    metaKeys: string[] | undefined,
    fields: string[],
  ): Promise<MetaReturnType[] | Record<string, MetaReturnType[]>> {
    // 用于在查询多个Id的情况下后面的分组
    if (!fields.includes(this.metaModelIdFieldName)) {
      fields.push(this.metaModelIdFieldName);
    }
    return this.metaModel
      .findAll({
        attributes: this.filterFields(fields, this.metaModel),
        where: {
          [this.metaModelIdFieldName]: modelIdOrIds,
          ...(metaKeys === void 0 || metaKeys.length === 0
            ? {
                metaKey: {
                  [Op.notLike]: '$%',
                },
              }
            : {
                metaKey: flattenDeep(
                  metaKeys.map((metaKey) => {
                    const fixedKey = this.fixMetaKey(metaKey);
                    return [fixedKey, `${this.tablePrefix}${fixedKey}`];
                  }),
                ),
              }),
        },
      })
      .then((metas) => {
        const format = (meta: Model<MetaModel>) => {
          const { metaKey, ...rest } = meta.toJSON();
          return {
            ...rest,
            metaKey: this.fixMetaKey(metaKey),
          } as unknown as MetaReturnType;
        };
        if (Array.isArray(modelIdOrIds)) {
          return metas.reduce((prev, curr) => {
            const key = (curr as any)[this.metaModelIdFieldName] as number;
            if (!prev[key]) {
              prev[key] = [];
            }
            prev[key].push(format(curr));
            return prev;
          }, {} as Record<number, MetaReturnType[]>);
        } else {
          return metas.map(format);
        }
      });
  }

  /**
   * 判断元数据key是否在在
   * @param modelId  model Id
   * @param metaKeys  meta keys
   * @returns 是否存在
   */
  async isMetaExists(modelId: number, metaKey: string): Promise<boolean>;
  /**
   * 判断多个元数据key是否在在
   * @param modelId model Id
   * @param metaKeys meta keys
   * @returns 不存在或者已存在的 metaKey 数组
   */
  async isMetaExists(modelId: number, metaKeys: string[]): Promise<false | string[]>;
  async isMetaExists(modelId: number, metaKeys: string | string[]): Promise<boolean | string[]> {
    if (typeof metaKeys === 'string') {
      const fixedKey = this.fixMetaKey(metaKeys);
      return (
        (await this.metaModel.count({
          where: {
            [this.metaModelIdFieldName]: modelId,
            metaKey: [fixedKey, `${this.tablePrefix}${fixedKey}`],
          },
        })) > 0
      );
    } else {
      const metas = await this.metaModel.findAll({
        attributes: ['metaKey'],
        where: {
          [this.metaModelIdFieldName]: modelId,
          metaKey: flattenDeep(
            metaKeys.map((metaKey) => {
              const fixedKey = this.fixMetaKey(metaKey);
              return [fixedKey, `${this.tablePrefix}${fixedKey}`];
            }),
          ),
        },
      });

      if (metas.length) {
        return metas.map((meta) => meta.getDataValue('metaKey') as string);
      }
      return false;
    }
  }

  /**
   * 创建元数据
   * @param model 元数据实体
   */
  async createMeta(model: NewMetaInputType): Promise<MetaReturnType> {
    const isExists = await this.isMetaExists((model as any)[this.metaModelIdFieldName], model.metaKey);

    if (isExists) {
      throw new ValidationError(`The meta key "${model.metaKey}" has existed!`);
    }

    const meta = await this.metaModel.create({
      ...model,
      metaKey: this.fixMetaKey(model.metaKey),
    } as any);
    return meta.toJSON() as MetaReturnType;
  }

  /**
   * 批量创建元数据
   * @param modelId  实体 id
   * @param models 元数据实体集合
   * @param options 选项
   * @param options.updateOnDuplicate 重复key是否更新，否则抛出异常
   */
  async bulkCreateMeta(
    modelId: number,
    models: NewMetaInput[],
    options: { updateOnDuplicate?: boolean } = {},
  ): Promise<MetaReturnType[]> {
    models.forEach((model) => {
      model.metaKey = this.fixMetaKey(model.metaKey);
    });
    if (Object.values(groupBy(models, (meta) => meta.metaKey)).some((arr) => arr.length > 1)) {
      throw new UserInputError(
        this.translate(
          'infrastructure-server.datasource.bulk_create_meta_key_unique_error',
          `The "metaKey" must be unique!`,
        ),
      );
    }

    const falseOrMetaKeys = await this.isMetaExists(
      modelId,
      models.map((model) => model.metaKey),
    );

    const t = await this.sequelize.transaction();
    try {
      if (falseOrMetaKeys) {
        // 支持重复key update
        if (options.updateOnDuplicate) {
          await Promise.all(
            falseOrMetaKeys.map((metaKey) => {
              const duplicateMeta = models.find((meta) => meta.metaKey === metaKey)!;
              models.splice(
                models.findIndex((meta) => meta.metaKey === metaKey),
                1,
              );
              return this.metaModel.update(
                {
                  metaValue: duplicateMeta.metaValue,
                },
                {
                  where: {
                    [this.metaModelIdFieldName]: modelId,
                    metaKey,
                  },
                  transaction: t,
                },
              );
            }),
          );
        } else {
          throw new ValidationError(`The meta keys (${falseOrMetaKeys.join(',')}) have existed!`);
        }
      }

      const metas = await this.metaModel.bulkCreate(
        models.map((model) => ({
          [this.metaModelIdFieldName]: modelId,
          ...model,
        })),
      );

      await t.commit();
      return metas.map((meta) => meta.toJSON() as MetaReturnType);
    } catch {
      await t.rollback();
      return [];
    }
  }

  /**
   * 修改元数据
   * @param id meta Id
   */
  async updateMeta(id: number, metaValue: string): Promise<void> {
    await this.metaModel.update(
      {
        metaValue,
      },
      {
        where: {
          id,
          metaKey: {
            [Op.notLike]: '$%', // private key 不能修改
          },
        },
      },
    );
  }

  /**
   * 根据实体 id 与 metaKey 修改元数据
   * @param modelId 实体 Id
   * @param metaKey meta key
   * @param metaValue meta value
   * @param createIfNotExists 如果不存在是否创建
   */
  async updateMetaByKey(modelId: number, metaKey: string, metaValue: string, createIfNotExists = false): Promise<void> {
    const fixedKey = this.fixMetaKey(metaKey);
    if (!createIfNotExists) {
      await this.metaModel.update(
        {
          metaValue,
        },
        {
          where: {
            [this.metaModelIdFieldName]: modelId,
            metaKey: [fixedKey, `${this.tablePrefix}${fixedKey}`],
          },
        },
      );
      return;
    }

    const isExists = await this.isMetaExists(modelId, metaKey);

    if (!isExists) {
      // 如果不存在则创建
      await this.metaModel.create({
        [this.metaModelIdFieldName]: modelId,
        metaKey: fixedKey,
        metaValue,
      });
    } else {
      await this.metaModel.update(
        { metaValue },
        {
          where: {
            [this.metaModelIdFieldName]: modelId,
            metaKey: [fixedKey, `${this.tablePrefix}${fixedKey}`],
          },
        },
      );
    }
  }

  /**
   * 根据 Id 删除元数据
   * @param id Template id
   */
  async deleteMeta(id: number): Promise<void> {
    await this.metaModel.destroy({
      where: {
        id,
        metaKey: {
          [Op.notLike]: '$%', // private key 不能删除
        },
      },
    });
  }

  /**
   * 根据实体 id 与 metaKey 删除元数据
   * @param modelId 实体 Id
   * @param metaKey meta key
   */
  async deleteMetaByKey(modelId: number, metaKey: string): Promise<void> {
    const fixedKey = this.fixMetaKey(metaKey);
    await this.metaModel.destroy({
      where: {
        [this.metaModelIdFieldName]: modelId,
        metaKey: [fixedKey, `${this.tablePrefix}${fixedKey}`],
      },
    });
  }
}
