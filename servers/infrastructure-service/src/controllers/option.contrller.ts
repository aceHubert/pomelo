import { Controller, ParseIntPipe, ParseArrayPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OptionPattern } from '@ace-pomelo/shared/server';
import { OptionDataSource, OptionModel } from '../datasource/index';
import { ListOptionQueryPayload, NewOptionPayload, UpdateOptionPayload } from './payload/option.payload';

@Controller()
export class OptionController {
  constructor(private readonly optionDataSource: OptionDataSource) {}

  @MessagePattern(OptionPattern.Get)
  get(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<OptionModel | undefined> {
    return this.optionDataSource.get(id, fields);
  }

  @MessagePattern(OptionPattern.GetByName)
  getByName(
    @Payload('optionName') optionName: string,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<OptionModel | undefined> {
    return this.optionDataSource.getByName(optionName, fields);
  }

  @MessagePattern(OptionPattern.GetAutoloads)
  getAutoloads(): Promise<Record<string, string>> {
    return this.optionDataSource.getAutoloads();
  }

  @MessagePattern(OptionPattern.GetValue)
  getValue(@Payload('optionName') optionName: string): Promise<string | undefined> {
    return this.optionDataSource.getValue(optionName);
  }

  @MessagePattern(OptionPattern.GetList)
  getList(
    @Payload('query') query: ListOptionQueryPayload,
    @Payload('fields', new ParseArrayPipe({ items: String })) fields: string[],
  ): Promise<OptionModel[]> {
    return this.optionDataSource.getList(query, fields);
  }

  @MessagePattern(OptionPattern.NameExists)
  async isExists(@Payload('optionName') optionName: string): Promise<boolean> {
    if (!optionName) return true;

    return this.optionDataSource.isExists(optionName);
  }

  @MessagePattern(OptionPattern.Create)
  create(@Payload() payload: NewOptionPayload): Promise<OptionModel> {
    const { requestUserId, ...model } = payload;
    return this.optionDataSource.create(model, requestUserId);
  }

  @MessagePattern(OptionPattern.Update)
  update(@Payload() payload: UpdateOptionPayload): Promise<void> {
    const { id, requestUserId, ...model } = payload;
    return this.optionDataSource.update(id, model, requestUserId);
  }

  @MessagePattern(OptionPattern.Reset)
  reset(): void {
    return this.optionDataSource.reset();
  }

  @MessagePattern(OptionPattern.Delete)
  delete(
    @Payload('id', ParseIntPipe) id: number,
    @Payload('requestUserId', ParseIntPipe) requestUserId: number,
  ): Promise<void> {
    return this.optionDataSource.delete(id, requestUserId);
  }
}
