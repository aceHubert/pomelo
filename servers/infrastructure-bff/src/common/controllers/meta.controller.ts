import { lowerCase, upperFirst } from 'lodash-es';
import { Response } from 'express';
import {
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
  applyDecorators,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { ClientProxy } from '@nestjs/microservices';
import { createResponseSuccessType, createMetaPattern } from '@ace-pomelo/shared/server';
import { NewMetaDto } from './dto/new-meta.dto';
import { UpdateMetaDto } from './dto/update-meta.dto';
import { BaseController } from './base.controller';

export type Method =
  | 'getMeta'
  | 'getMetas'
  | 'createMeta'
  | 'createMetas'
  | 'updateMeta'
  | 'updateMetaByKey'
  | 'deleteMeta'
  | 'deleteMetaByKey';

export type Options = {
  /**
   * description model name for methods (lower case).
   * @default lowerCase(modelName)
   */
  descriptionName?: string;
  /**
   * authorize decorator(s)
   */
  authDecorator?: (method: Method) => MethodDecorator | MethodDecorator[];
};

/**
 * Create Meta Controller
 * @param modelName model name, action/param prefix and pattern prefix(camelCase, e.g. 'template' -> '/:templateId/metas')
 * @param metaModelRespType meta model response data type (swagger ApiOkResponse)
 * @param newMetaDtoType new meta dto type (swagger ApiBody)
 * @param options options
 */
export function createMetaController<MetaModelRespType, NewMetaDtoType>(
  modelName: string,
  metaModelRespType: Type<MetaModelRespType>,
  newMetaDtoType: Type<NewMetaDtoType>,
  { descriptionName, authDecorator }: Options = {},
) {
  const _upperFirstModelName = upperFirst(modelName);
  const _descriptionName = descriptionName || lowerCase(modelName);

  const pattern = createMetaPattern(modelName);

  const AuthDecorate = (method: Method): MethodDecorator => {
    if (authDecorator) {
      const decorators = authDecorator(method);
      return Array.isArray(decorators) ? applyDecorators(...decorators) : decorators;
    } else {
      return (() => {}) as MethodDecorator;
    }
  };

  abstract class MetaController extends BaseController {
    constructor(protected readonly basicService: ClientProxy) {
      super();
    }

    /**
     * 获取元数据
     */
    @Get(`/metas/:id`)
    @AuthDecorate('getMeta')
    @ApiOperation({ summary: `Get ${_descriptionName} meta.` })
    @ApiOkResponse({
      description: `${_descriptionName} meta model`,
      type: () => createResponseSuccessType({ data: metaModelRespType }, `${_upperFirstModelName}MetaModelSuccessResp`),
    })
    @ApiNoContentResponse({ description: `${_descriptionName} meta not found` })
    async getMeta(@Param('id', ParseIntPipe) id: number, @Res({ passthrough: true }) res: Response) {
      const result = await this.basicService
        .send<MetaModelRespType | undefined>(pattern.GetMeta, {
          id,
          fields: ['id', 'metaKey', 'metaValue'],
        })
        .lastValue();

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
    @Get(`/:${modelName}Id/metas`)
    @AuthDecorate('getMetas')
    @ApiOperation({ summary: `Get ${_descriptionName} metas.` })
    @ApiQuery({
      name: 'metaKeys',
      type: [String],
      required: false,
      description: `return specific keys' metas if setted, otherwish return all metas`,
    })
    @ApiOkResponse({
      description: `${_descriptionName} meta models`,
      type: () =>
        createResponseSuccessType({ data: [metaModelRespType] }, `${_upperFirstModelName}MetaModelsSuccessResp`),
    })
    async getMetas(
      @Param(`${modelName}Id`, ParseIntPipe) modelId: number,
      @Query('metaKeys', new ParseArrayPipe({ optional: true })) metaKeys: string[] | undefined,
    ) {
      const result = await this.basicService
        .send<MetaModelRespType[]>(pattern.CreateMetas, {
          [`${modelName}Id`]: modelId,
          metaKeys,
          fields: ['id', 'metaKey', 'metaValue'],
        })
        .lastValue();

      return this.success({
        data: result,
      });
    }

    /**
     * 新建元数据
     */
    @Post('/metas')
    @AuthDecorate('createMeta')
    @ApiOperation({ summary: `Create a new ${_descriptionName} meta.` })
    @ApiBody({ type: () => newMetaDtoType })
    @ApiCreatedResponse({
      description: `${_descriptionName} meta model`,
      type: () => createResponseSuccessType({ data: metaModelRespType }, `${_upperFirstModelName}MetaModelSuccessResp`),
    })
    async createMeta(@Body() input: NewMetaDtoType) {
      const result = await this.basicService.send<MetaModelRespType>(pattern.CreateMeta, input).lastValue();

      return this.success({
        data: result,
      });
    }

    /**
     * 批量新建元数据
     */
    @Post(`/:${modelName}Id/metas/bulk`)
    @AuthDecorate('createMetas')
    @ApiOperation({ summary: `Create bulk of ${_descriptionName} metas.` })
    @ApiBody({ type: () => [NewMetaDto] })
    @ApiCreatedResponse({
      description: `${_descriptionName} meta models`,
      type: () =>
        createResponseSuccessType({ data: [metaModelRespType] }, `${_upperFirstModelName}MetaModelsSuccessResp`),
    })
    async createMetas(@Param(`${modelName}Id`, ParseIntPipe) modelId: number, @Body() models: NewMetaDto[]) {
      const result = await this.basicService
        .send<MetaModelRespType[]>(pattern.CreateMetas, {
          [`${modelName}Id`]: modelId,
          models,
        })
        .lastValue();
      return this.success({
        data: result,
      });
    }

    /**
     * 修改元数据
     */
    @Patch('/metas/:id')
    @AuthDecorate('updateMeta')
    @ApiOperation({ summary: `Update ${_descriptionName} meta value.` })
    @ApiBody({ type: () => UpdateMetaDto })
    @ApiOkResponse({
      description: 'no data content',
      type: () => createResponseSuccessType({}, `Update${_upperFirstModelName}MetaModelSuccessResp`),
    })
    async updateMeta(@Param('id', ParseIntPipe) id: number, @Body('metaValue') metaValue: string) {
      try {
        await this.basicService
          .send<void>(pattern.UpdateMeta, {
            id,
            metaValue,
          })
          .lastValue();
        return this.success();
      } catch (e: any) {
        this.logger.error(e);
        return this.faild(e.message);
      }
    }

    /**
     * 根据 metaKey 修改元数据
     */
    @Patch(`/:${modelName}Id/metas/:metaKey`)
    @AuthDecorate('deleteMetaByKey')
    @ApiOperation({ summary: `Update ${_descriptionName} meta value by meta key.` })
    @ApiBody({ type: () => UpdateMetaDto })
    @ApiOkResponse({
      description: 'no data content',
      type: () => createResponseSuccessType({}, `Update${_upperFirstModelName}MetaModelSuccessResp`),
    })
    async updateMetaByKey(
      @Param(`${modelName}Id`, ParseIntPipe) modelId: number,
      @Param('metaKey') metaKey: string,
      @Body('metaValue') metaValue: string,
      @Body('createIfNotExists') createIfNotExists?: boolean,
    ) {
      try {
        await this.basicService
          .send<void>(pattern.UpdateMetaByKey, {
            [`${modelName}Id`]: modelId,
            metaKey,
            metaValue,
            createIfNotExists,
          })
          .lastValue();
        return this.success();
      } catch (e: any) {
        this.logger.error(e);
        return this.faild(e.message);
      }
    }

    /**
     * 删除元数据
     */
    @Delete('/metas/:id')
    @AuthDecorate('deleteMeta')
    @ApiOperation({ summary: `Delete ${_descriptionName} meta.` })
    @ApiOkResponse({
      description: 'no data content',
      type: () => createResponseSuccessType({}, `Delete${_upperFirstModelName}MetaModelSuccessResp`),
    })
    async deleteMeta(@Param('id', ParseIntPipe) id: number) {
      try {
        await this.basicService.send<void>(pattern.DeleteMeta, { id }).lastValue();
        return this.success();
      } catch (e: any) {
        this.logger.error(e);
        return this.faild(e.message);
      }
    }

    /**
     * 根据 metaKey 添加元数据
     */
    @Delete(`/:${modelName}Id/metas/:metaKey`)
    @AuthDecorate('deleteMetaByKey')
    @ApiOperation({ summary: `Delete ${_descriptionName} meta by meta key.` })
    @ApiOkResponse({
      description: 'no data content',
      type: () => createResponseSuccessType({}, `Delete${_upperFirstModelName}MetaModelSuccessResp`),
    })
    async deleteMetaByKey(@Param(`${modelName}Id`, ParseIntPipe) modelId: number, @Param('metaKey') metaKey: string) {
      try {
        await this.basicService
          .send(pattern.DeleteMetaByKey, {
            [`${modelName}Id`]: modelId,
            metaKey,
          })
          .lastValue();
        return this.success();
      } catch (e: any) {
        this.logger.error(e);
        return this.faild(e.message);
      }
    }
  }

  return MetaController;
}
