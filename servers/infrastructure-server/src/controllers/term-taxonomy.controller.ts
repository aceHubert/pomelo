import { Controller, ParseIntPipe, ParseArrayPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { I18n, I18nContext } from 'nestjs-i18n';
import { UserInputError, TermTaxonomyPattern } from '@ace-pomelo/shared/server';
import { TermTaxonomyDataSource, TermTaxonomyModel, TermRelationshipModel } from '../datasource/index';
import { createMetaController } from './meta.controller';
import {
  ListTermTaxonomyByObjectIdPayload,
  ListTermTaxonomyQueryPayload,
  NewTermRelationshipPayload,
  NewTermTaxonomyPayload,
  UpdateTermTaxonomyPayload,
} from './payload/term-taxonomy.payload';

@Controller()
export class TermTaxonomyController extends createMetaController('termTaxonomy') {
  constructor(private readonly termTaxonomyDataSource: TermTaxonomyDataSource) {
    super(termTaxonomyDataSource);
  }

  @MessagePattern(TermTaxonomyPattern.Get)
  get(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<TermTaxonomyModel | undefined> {
    return this.termTaxonomyDataSource.get(id, fields);
  }

  @MessagePattern(TermTaxonomyPattern.GetList)
  getList(
    @Payload('parentIds', new ParseArrayPipe({ items: Number, optional: true })) parentIds: number[],
    @Payload('query') query: ListTermTaxonomyQueryPayload,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
    @I18n() i18n: I18nContext,
  ): Promise<Record<number, TermTaxonomyModel[]>> {
    if (!parentIds && !query)
      throw new UserInputError(
        i18n.tv(
          'infrastructure-server.term_taxonomy_controller.get_list_input_error',
          'parentIds or query is required',
        ),
      );
    return this.termTaxonomyDataSource.getList(parentIds || query, fields);
  }

  @MessagePattern(TermTaxonomyPattern.GetListByObjectIds)
  getListByObjectIds(
    @Payload('objectIds', new ParseArrayPipe({ items: Number })) objectIds: number[],
    @Payload('taxonomy') taxonomy: string,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<Record<number, TermTaxonomyModel[]>> {
    return this.termTaxonomyDataSource.getListByObjectId(objectIds, taxonomy, fields);
  }

  @MessagePattern(TermTaxonomyPattern.GetListByObjectId)
  getListByObjectId(
    @Payload('query') query: ListTermTaxonomyByObjectIdPayload,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<TermTaxonomyModel[]> {
    return this.termTaxonomyDataSource.getListByObjectId(query, fields);
  }

  @MessagePattern(TermTaxonomyPattern.Create)
  create(@Payload() payload: NewTermTaxonomyPayload): Promise<TermTaxonomyModel> {
    return this.termTaxonomyDataSource.create(payload);
  }

  @MessagePattern(TermTaxonomyPattern.CreateRelationship)
  createRelationship(payload: NewTermRelationshipPayload): Promise<TermRelationshipModel> {
    return this.termTaxonomyDataSource.createRelationship(payload);
  }

  @MessagePattern(TermTaxonomyPattern.Update)
  update(@Payload() payload: UpdateTermTaxonomyPayload): Promise<void> {
    const { id, ...model } = payload;
    return this.termTaxonomyDataSource.update(id, model);
  }

  @MessagePattern(TermTaxonomyPattern.DeleteRelationship)
  deleteRelationship(
    @Payload('objectId', ParseIntPipe) objectId: number,
    @Payload('termTaxonomyId', ParseIntPipe) termTaxonomyId: number,
  ): Promise<void> {
    return this.termTaxonomyDataSource.deleteRelationship(objectId, termTaxonomyId);
  }

  @MessagePattern(TermTaxonomyPattern.Delete)
  delete(@Payload('id', ParseIntPipe) id: number): Promise<void> {
    return this.termTaxonomyDataSource.delete(id);
  }

  @MessagePattern(TermTaxonomyPattern.BulkDelete)
  bulkDelete(@Payload('ids', new ParseArrayPipe({ items: Number })) ids: number[]): Promise<void> {
    return this.termTaxonomyDataSource.bulkDelete(ids);
  }
}
