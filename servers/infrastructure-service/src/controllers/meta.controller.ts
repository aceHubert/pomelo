import { ParseIntPipe, ParseArrayPipe, DefaultValuePipe } from '@nestjs/common';
import { Payload, MessagePattern } from '@nestjs/microservices';
import { createMetaPattern } from '@ace-pomelo/shared/server';
import { MetaDataSource } from '../datasource/index';
import { NewMetaPayload } from './payload/meta.payload';

/**
 * 创建 Meta Controller
 * DataSources 必须有 getMetas/createMeta/updateMeta/updateMetaByKey/deleteMeta 方法
 */
export function createMetaController<MetaModelType, NewMetaPayloadType>(modelName: string) {
  const pattern = createMetaPattern(modelName);

  abstract class MetaController {
    constructor(private readonly metaDataSource: MetaDataSource<MetaModelType, NewMetaPayloadType>) {}
    /**
     * 获取元数据
     */
    @MessagePattern(pattern.GetMeta)
    getMeta(
      @Payload('id', ParseIntPipe) id: number,
      @Payload('fields', new ParseArrayPipe({ items: String, optional: true }))
      fields: string[] = ['id', 'metaKey', 'metaValue'],
    ): Promise<MetaModelType | undefined> {
      return this.metaDataSource.getMeta(id, fields);
    }

    /**
     * 获取元数据集合
     */
    @MessagePattern(pattern.GetMetas)
    async getMetas(
      @Payload(`${modelName}Id`, new ParseIntPipe({ optional: true })) modelId: number,
      @Payload(`${modelName}Ids`, new ParseArrayPipe({ items: Number, optional: true })) modelIds: number[],
      @Payload('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
      @Payload('fields', new ParseArrayPipe({ items: String, optional: true }))
      fields: string[] = ['id', 'metaKey', 'metaValue'],
    ): Promise<MetaModelType[] | Record<number, MetaModelType[]>> {
      if (!modelId && !modelIds) return [];

      return this.metaDataSource.getMetas(modelId ?? modelIds, metaKeys, fields);
    }

    /**
     * 新建元数据
     */
    @MessagePattern(pattern.CreateMeta)
    createMeta(@Payload() payload: NewMetaPayloadType) {
      return this.metaDataSource.createMeta(payload);
    }

    /**
     * 批量新建元数据
     */
    @MessagePattern(pattern.CreateMetas)
    createMetas(@Payload(`${modelName}Id`, ParseIntPipe) modelId: number, @Payload('models') models: NewMetaPayload[]) {
      return this.metaDataSource.bulkCreateMeta(modelId, models);
    }

    /**
     * 修改元数据
     */
    @MessagePattern(pattern.UpdateMeta)
    updateMeta(@Payload('id', ParseIntPipe) id: number, @Payload('metaValue') metaValue: string) {
      return this.metaDataSource.updateMeta(id, metaValue);
    }

    /**
     * 根据 metaKey 修改元数据
     */
    @MessagePattern(pattern.UpdateMetaByKey)
    updateMetaByKey(
      @Payload(`${modelName}Id`, ParseIntPipe) modelId: number,
      @Payload('metaKey') metaKey: string,
      @Payload('metaValue') metaValue: string,
      @Payload('createIfNotExists', new DefaultValuePipe(false)) createIfNotExists?: boolean,
    ) {
      return this.metaDataSource.updateMetaByKey(modelId, metaKey, metaValue, createIfNotExists);
    }

    /**
     * 删除元数据
     */
    @MessagePattern(pattern.DeleteMeta)
    deleteMeta(@Payload('id', ParseIntPipe) id: number) {
      return this.metaDataSource.deleteMeta(id);
    }

    /**
     * 根据 metaKey 添加元数据
     */
    @MessagePattern(pattern.DeleteMetaByKey)
    deleteMetaByKey(@Payload(`${modelName}Id`, ParseIntPipe) modelId: number, @Payload('metaKey') metaKey: string) {
      return this.metaDataSource.deleteMetaByKey(modelId, metaKey);
    }
  }

  return MetaController;
}
