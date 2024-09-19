import { Controller, ParseIntPipe, ParseArrayPipe, ParseBoolPipe, ParseEnumPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { TemplateStatus, TemplatePresetType, TemplatePattern } from '@ace-pomelo/shared/server';
import {
  TemplateDataSource,
  TemplateModel,
  PagedTemplateModel,
  TemplateOptionModel,
  TemplateMetaModel,
  NewTemplateMetaInput,
} from '../datasource/index';
import { createMetaController } from './meta.controller';
import {
  NewFormTemplatePayload,
  NewPageTemplatePayload,
  NewPostTemplatePayload,
  NewTemplatePayload,
  PagedTemplateQueryPayload,
  TemplateOptionQueryPayload,
  UpdateFormTemplatePayload,
  UpdatePageTemplatePayload,
  UpdatePostTemplatePayload,
  UpdateTemplatePayload,
} from './payload/template.payload';

@Controller()
export class TemplateController extends createMetaController<TemplateMetaModel, NewTemplateMetaInput>('template') {
  constructor(private readonly templateDataSource: TemplateDataSource) {
    super(templateDataSource);
  }

  @MessagePattern(TemplatePattern.Get)
  get(
    @Payload('id', ParseIntPipe) @Payload('id', ParseIntPipe) id: number,
    @Payload('type') type: string | undefined,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
    @Payload('requestUserId', new ParseIntPipe({ optional: true })) requestUserId?: number,
  ): Promise<TemplateModel | undefined> {
    return this.templateDataSource.get(id, type, fields, requestUserId);
  }

  @MessagePattern(TemplatePattern.GetByName)
  getByName(
    @Payload('name') name: string,
    @Payload('type') type: string | undefined,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
    @Payload('requestUserId', new ParseIntPipe({ optional: true })) requestUserId?: number,
  ): Promise<TemplateModel | undefined> {
    return this.templateDataSource.getByName(name, type, fields, requestUserId);
  }

  @MessagePattern(TemplatePattern.GetOptions)
  getOptions(
    @Payload('query') query: TemplateOptionQueryPayload,
    @Payload('type') type: string,
    @Payload('fields', new ParseArrayPipe({ items: String, optional: true })) fields = ['id', 'title'],
  ): Promise<TemplateOptionModel[]> {
    return this.templateDataSource.getOptions(query, type, fields);
  }

  @MessagePattern(TemplatePattern.GetNames)
  getNames(@Payload('type') type: string): Promise<string[]> {
    return this.templateDataSource.getNames(type);
  }

  @MessagePattern(TemplatePattern.CountBySelf)
  getCountBySelf(
    @Payload('type') type: string,
    @Payload('includeTrashStatus', ParseBoolPipe) includeTrashStatus: boolean,
    @Payload('requestUserId', ParseIntPipe) @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ) {
    return this.templateDataSource.getCountBySelf(type, includeTrashStatus, requestUserId);
  }

  @MessagePattern(TemplatePattern.CountByDay)
  getCountByDay(@Payload('month') month: string, @Payload('type') type: string) {
    return this.templateDataSource.getCountByDay(month, type);
  }

  @MessagePattern(TemplatePattern.CountByMonth)
  getCountByMonth(
    @Payload('yarn') year: string | undefined,
    @Payload('months', new ParseIntPipe({ optional: true })) months: number | undefined,
    @Payload('type') type: string,
  ) {
    return this.templateDataSource.getCountByMonth({ year, months }, type);
  }

  @MessagePattern(TemplatePattern.CountByYear)
  getCountByYear(@Payload('type') type: string) {
    return this.templateDataSource.getCountByYear(type);
  }

  @MessagePattern(TemplatePattern.CountByStatus)
  getCountByStatus(
    @Payload('type') type: string,
    @Payload('requestUserId', ParseIntPipe) @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ) {
    return this.templateDataSource.getCountByStatus(type, requestUserId);
  }

  @MessagePattern(TemplatePattern.GetPaged)
  getPaged(
    @Payload('query') query: PagedTemplateQueryPayload,
    @Payload('type') type: string,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
    @Payload('requestUserId', new ParseIntPipe({ optional: true })) requestUserId?: number,
  ): Promise<PagedTemplateModel> {
    return this.templateDataSource.getPaged(query, type, fields, requestUserId);
  }

  @MessagePattern(TemplatePattern.GetRevisionCount)
  getRevisionCount(@Payload('id', ParseIntPipe) @Payload('id', ParseIntPipe) id: number) {
    return this.templateDataSource.getRevisionCount(id);
  }

  @MessagePattern(TemplatePattern.GetRevisionList)
  getRevisions(
    @Payload('id', ParseIntPipe) @Payload('id', ParseIntPipe) id: number,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
    @Payload('requestUserId', ParseIntPipe) @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ) {
    return this.templateDataSource.getRevisions(id, fields, requestUserId);
  }

  @MessagePattern(TemplatePattern.CreateForm)
  createForm(@Payload() payload: NewFormTemplatePayload): Promise<TemplateModel> {
    const { requestUserId, ...model } = payload;
    return this.templateDataSource.create(model, TemplatePresetType.Form, requestUserId);
  }

  @MessagePattern(TemplatePattern.CreatePage)
  createPage(@Payload() payload: NewPageTemplatePayload): Promise<TemplateModel> {
    const { requestUserId, ...model } = payload;
    return this.templateDataSource.create(model, TemplatePresetType.Page, requestUserId);
  }

  @MessagePattern(TemplatePattern.CreatePost)
  createPost(@Payload() payload: NewPostTemplatePayload): Promise<TemplateModel> {
    const { requestUserId, ...model } = payload;
    return this.templateDataSource.create(model, TemplatePresetType.Post, requestUserId);
  }

  @MessagePattern(TemplatePattern.Create)
  create(@Payload() payload: NewTemplatePayload): Promise<TemplateModel> {
    const { type, requestUserId, ...model } = payload;
    return this.templateDataSource.create(model, type, requestUserId);
  }

  @MessagePattern(TemplatePattern.UpdateForm)
  updateForm(@Payload() payload: UpdateFormTemplatePayload): Promise<void> {
    const { id, requestUserId, ...model } = payload;
    return this.templateDataSource.update(id, model, requestUserId);
  }

  @MessagePattern(TemplatePattern.UpdatePage)
  updatePage(@Payload() payload: UpdatePageTemplatePayload): Promise<void> {
    const { id, requestUserId, ...model } = payload;
    return this.templateDataSource.update(id, model, requestUserId);
  }

  @MessagePattern(TemplatePattern.UpdatePost)
  updatePost(@Payload() payload: UpdatePostTemplatePayload): Promise<void> {
    const { id, requestUserId, ...model } = payload;
    return this.templateDataSource.update(id, model, requestUserId);
  }

  @MessagePattern(TemplatePattern.Update)
  update(@Payload() payload: UpdateTemplatePayload): Promise<void> {
    const { id, requestUserId, ...model } = payload;
    return this.templateDataSource.update(id, model, requestUserId);
  }

  @MessagePattern(TemplatePattern.UpdateName)
  updateName(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('name') name: string,
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.templateDataSource.updateName(id, name, requestUserId);
  }

  @MessagePattern(TemplatePattern.UpdateStatus)
  updateStatus(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('status', new ParseEnumPipe(TemplateStatus)) status: TemplateStatus,
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.templateDataSource.updateStatus(id, status, requestUserId);
  }

  @MessagePattern(TemplatePattern.BulkUpdateStatus)
  bulkUpdateStatus(
    @Payload('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @Payload('status', new ParseEnumPipe(TemplateStatus)) status: TemplateStatus,
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.templateDataSource.bulkUpdateStatus(ids, status, requestUserId);
  }

  @MessagePattern(TemplatePattern.UpdateCommentCount)
  updateCommentCount(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('count', ParseIntPipe) count: number,
  ): Promise<void> {
    return this.templateDataSource.updateCommentCount(id, count);
  }

  @MessagePattern(TemplatePattern.Restore)
  restore(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.templateDataSource.restore(id, requestUserId);
  }

  @MessagePattern(TemplatePattern.BulkRestore)
  bulkRestore(
    @Payload('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.templateDataSource.bulkRestore(ids, requestUserId);
  }

  @MessagePattern(TemplatePattern.Delete)
  delete(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.templateDataSource.delete(id, requestUserId);
  }

  @MessagePattern(TemplatePattern.BulkDelete)
  bulkDelete(
    @Payload('ids', new ParseArrayPipe({ items: Number })) ids: number[],
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.templateDataSource.bulkDelete(ids, requestUserId);
  }
}
