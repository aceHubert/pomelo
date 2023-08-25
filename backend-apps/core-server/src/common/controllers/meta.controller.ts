import { camelCase, lowerCase, upperFirst, words } from 'lodash';
import { Response } from 'express';
import { ModuleRef } from '@nestjs/core';
import {
  applyDecorators,
  Query,
  Param,
  Body,
  Get,
  Post,
  Patch,
  Delete,
  ParseIntPipe,
  ParseArrayPipe,
  Type,
  Res,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { Anonymous } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { BaseController, createResponseSuccessType } from '@pomelo/shared';
import { MetaDataSource } from '@pomelo/datasource';
import { NewMetaDto } from './dto/new-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';

export type Options = {
  /**
   * 对 model 描述（lower case）， 默认值为: modelName
   */
  descriptionName?: string;
  /**
   * auth decorator(s)
   */
  authDecorator?: MethodDecorator | MethodDecorator[];
};

/**
 * 创建 Meta Controller
 * DataSources 必须有 getMetas/createMeta/updateMeta/updateMetaByKey/deleteMeta 方法
 */
export function createMetaController<
  MetaModelRespType,
  NewMetaDtoType,
  MetaDataSourceType extends MetaDataSource<MetaModelRespType, NewMetaDtoType>,
>(
  modelName: string,
  metaModelRespType: Type<MetaModelRespType>,
  newMetaDtoType: Type<NewMetaDtoType>,
  metaDataSourceTypeOrToken: Type<MetaDataSourceType> | string | symbol,
  { descriptionName, authDecorator }: Options = {},
) {
  const _camelCaseModelName = camelCase(modelName);
  const _upperFirstModelName = upperFirst(modelName);
  const _descriptionName = descriptionName || lowerCase(modelName);
  const _ramActionPrefix = words(_camelCaseModelName).map(lowerCase).join('.');

  // auth decorators
  const ApiAuth = (): MethodDecorator => {
    if (authDecorator) {
      return Array.isArray(authDecorator) ? applyDecorators(...authDecorator) : authDecorator;
    } else {
      return (() => {}) as MethodDecorator;
    }
  };

  abstract class MetaController extends BaseController {
    private metaDataSource!: MetaDataSource<MetaModelRespType, NewMetaDtoType>;

    constructor(protected readonly moduleRef: ModuleRef) {
      super();
      this.metaDataSource = this.moduleRef.get(metaDataSourceTypeOrToken, { strict: false });
    }

    /**
     * 获取元数据
     */
    @Get(`/metas/:id`)
    @RamAuthorized(`${_ramActionPrefix}.meta`)
    @ApiOperation({ summary: `Get ${_descriptionName} meta.` })
    @Anonymous()
    @ApiOkResponse({
      description: `${_descriptionName} meta model`,
      type: () => createResponseSuccessType({ data: metaModelRespType }, `${_upperFirstModelName}MetaModelSuccessResp`),
    })
    @ApiNoContentResponse({ description: `${_descriptionName} meta not found` })
    async getMeta(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
      const result = await this.metaDataSource.getMeta(id, ['id', 'metaKey', 'metaValue']);

      if (result === undefined) {
        res.status(HttpStatus.NO_CONTENT);
      }

      return this.success({
        data: result,
      });
    }

    /**
     * 获取元数据集合
     */
    @Get(`/:${_camelCaseModelName}Id/metas`)
    @RamAuthorized(`${_ramActionPrefix}.meta.list`)
    @ApiOperation({ summary: `Get ${_descriptionName} metas.` })
    @ApiQuery({
      name: 'metaKeys',
      type: [String],
      required: false,
      description: `return specific keys' metas if setted, otherwish return all metas`,
    })
    @Anonymous()
    @ApiOkResponse({
      description: `${_descriptionName} meta models`,
      type: () =>
        createResponseSuccessType({ data: [metaModelRespType] }, `${_upperFirstModelName}MetaModelsSuccessResp`),
    })
    async getMetas(
      @Param(`${_camelCaseModelName}Id`, ParseIntPipe) modelId: number,
      @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    ) {
      const result = await this.metaDataSource.getMetas(modelId, metaKeys, ['id', 'metaKey', 'metaValue']);

      return this.success({
        data: result,
      });
    }

    /**
     * 新建元数据
     */
    @Post('/metas')
    @RamAuthorized(`${_ramActionPrefix}.meta.create`)
    @ApiOperation({ summary: `Create a new ${_descriptionName} meta.` })
    @ApiAuth()
    @ApiBody({ type: () => newMetaDtoType })
    @ApiCreatedResponse({
      description: `${_descriptionName} meta model`,
      type: () => createResponseSuccessType({ data: metaModelRespType }, `${_upperFirstModelName}MetaModelSuccessResp`),
    })
    async createMeta(@Body() input: NewMetaDtoType) {
      const result = await this.metaDataSource.createMeta(input);
      return this.success({
        data: result,
      });
    }

    /**
     * 批量新建元数据
     */
    @Post(`/:${_camelCaseModelName}Id/metas/bulk`)
    @RamAuthorized(`${_ramActionPrefix}.meta.bulk.create`)
    @ApiOperation({ summary: `Create bulk of ${_descriptionName} metas.` })
    @ApiAuth()
    @ApiBody({ type: () => [NewMetaDto] })
    @ApiCreatedResponse({
      description: `${_descriptionName} meta models`,
      type: () =>
        createResponseSuccessType({ data: [metaModelRespType] }, `${_upperFirstModelName}MetaModelsSuccessResp`),
    })
    async createMetas(@Param(`${_camelCaseModelName}Id`, ParseIntPipe) modelId: number, @Body() models: NewMetaDto[]) {
      const result = await this.metaDataSource.bulkCreateMeta(modelId, models);
      return this.success({
        data: result,
      });
    }

    /**
     * 修改元数据
     */
    @Patch('/metas/:id')
    @RamAuthorized(`${_ramActionPrefix}.meta.update`)
    @ApiOperation({ summary: `Update ${_descriptionName} meta value.` })
    @ApiAuth()
    @ApiBody({ type: () => UpdateMetaDto })
    @ApiOkResponse({
      description: 'no data content',
      type: () => createResponseSuccessType({}, `Update${_upperFirstModelName}MetaModelSuccessResp`),
    })
    async updateMeta(@Param('id', ParseIntPipe) id: number, @Body('metaValue') metaValue: string) {
      await this.metaDataSource.updateMeta(id, metaValue);
      return this.success();
    }

    /**
     * 根据 metaKey 修改元数据
     */
    @Patch(`/:${_camelCaseModelName}Id/metas/:metaKey`)
    @RamAuthorized(`${_ramActionPrefix}.meta.update.bykey`)
    @ApiOperation({ summary: `Update ${_descriptionName} meta value by meta key.` })
    @ApiAuth()
    @ApiBody({ type: () => UpdateMetaDto })
    @ApiOkResponse({
      description: 'no data content',
      type: () => createResponseSuccessType({}, `Update${_upperFirstModelName}MetaModelSuccessResp`),
    })
    async updateMetaByKey(
      @Param(`${_camelCaseModelName}Id`, ParseIntPipe) modelId: number,
      @Param('metaKey') metaKey: string,
      @Body('metaValue') metaValue: string,
    ) {
      await this.metaDataSource.updateMetaByKey(modelId, metaKey, metaValue);
      return this.success();
    }

    /**
     * 删除元数据
     */
    @Delete('/metas/:id')
    @RamAuthorized(`${_ramActionPrefix}.meta.delete`)
    @ApiOperation({ summary: `Delete ${_descriptionName} meta.` })
    @ApiAuth()
    @ApiOkResponse({
      description: 'no data content',
      type: () => createResponseSuccessType({}, `Delete${_upperFirstModelName}MetaModelSuccessResp`),
    })
    async deleteMeta(@Param('id', ParseIntPipe) id: number) {
      await this.metaDataSource.deleteMeta(id);
      return this.success();
    }

    /**
     * 根据 metaKey 添加元数据
     */
    @Delete(`/:${_camelCaseModelName}Id/metas/:metaKey`)
    @RamAuthorized(`${_ramActionPrefix}.meta.delete.bykey`)
    @ApiOperation({ summary: `Delete ${_descriptionName} meta by meta key.` })
    @ApiAuth()
    @ApiOkResponse({
      description: 'no data content',
      type: () => createResponseSuccessType({}, `Delete${_upperFirstModelName}MetaModelSuccessResp`),
    })
    async deleteMetaByKey(
      @Param(`${_camelCaseModelName}Id`, ParseIntPipe) modelId: number,
      @Param('metaKey') metaKey: string,
    ) {
      await this.metaDataSource.deleteMetaByKey(modelId, metaKey);
      return this.success();
    }
  }

  return MetaController;
}
