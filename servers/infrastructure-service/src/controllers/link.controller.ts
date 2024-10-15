import { Controller, ParseIntPipe, ParseArrayPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LinkPattern } from '@ace-pomelo/shared/server';
import { LinkDataSource, LinkModel, PagedLinkModel } from '../datasource/index';
import { NewLinkPayload, UpdateLinkPayload, PagedLinkQueryPayload } from './payload/link.payload';

@Controller()
export class LinkController {
  constructor(private readonly linkDataSource: LinkDataSource) {}

  @MessagePattern(LinkPattern.Get)
  get(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<LinkModel | undefined> {
    return this.linkDataSource.get(id, fields);
  }

  @MessagePattern(LinkPattern.GetPaged)
  getPaged(
    @Payload('query') query: PagedLinkQueryPayload,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<PagedLinkModel> {
    return this.linkDataSource.getPaged(query, fields);
  }

  @MessagePattern(LinkPattern.Create)
  create(@Payload() payload: NewLinkPayload): Promise<LinkModel> {
    const { requestUserId, ...model } = payload;
    return this.linkDataSource.create(model, requestUserId);
  }

  @MessagePattern(LinkPattern.Update)
  update(@Payload() payload: UpdateLinkPayload): Promise<void> {
    const { id, requestUserId, ...model } = payload;
    return this.linkDataSource.update(id, model, requestUserId);
  }

  @MessagePattern(LinkPattern.Delete)
  async delete(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.linkDataSource.delete(id, requestUserId);
  }
}
