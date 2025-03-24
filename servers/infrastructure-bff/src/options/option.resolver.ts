import { Inject, ParseIntPipe, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { JSONObjectResolver, VoidResolver } from 'graphql-scalars';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-authorization';
import { RamAuthorized } from '@ace-pomelo/nestjs-ram-authorization';
import { User, Fields, RequestUser, OptionAutoload, POMELO_SERVICE_PACKAGE_NAME } from '@ace-pomelo/shared/server';
import { OptionServiceClient, OPTION_SERVICE_NAME, OptionModel } from '@ace-pomelo/shared/server/proto-ts/option';
import { OptionAction } from '@/common/actions';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { WrapperOptionAutoload } from '@/common/utils/wrapper-enum.util';
import { NewOptionInput } from './dto/new-option.input';
import { OptionArgs } from './dto/option.args';
import { UpdateOptionInput } from './dto/update-option.input';
import { Option } from './models/option.model';

@Authorized()
@Resolver(() => Option)
export class OptionResolver extends BaseResolver implements OnModuleInit {
  private optionServiceClient!: OptionServiceClient;

  constructor(@Inject(POMELO_SERVICE_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super();
  }

  onModuleInit() {
    this.optionServiceClient = this.client.getService<OptionServiceClient>(OPTION_SERVICE_NAME);
  }

  private mapToOption(model: OptionModel): Option {
    return {
      ...model,
      autoload: WrapperOptionAutoload.asValueOrDefault(model.autoload, OptionAutoload.Yes),
    };
  }

  @Anonymous()
  @Query((returns) => Option, { nullable: true, description: 'Get option.' })
  async option(
    @Args('id', { type: () => ID }, ParseIntPipe) id: number,
    @Fields() fields: ResolveTree,
  ): Promise<Option | undefined> {
    const { option } = await this.optionServiceClient
      .get({
        id,
        fields: this.getFieldNames(fields.fieldsByTypeName.Option),
      })
      .lastValue();
    return option ? this.mapToOption(option) : undefined;
  }

  @Anonymous()
  @Query((returns) => Option, { nullable: true, description: 'Get option by name.' })
  async optionByName(@Args('name') name: string, @Fields() fields: ResolveTree): Promise<Option | undefined> {
    const { option } = await this.optionServiceClient
      .getByName({
        optionName: name,
        fields: this.getFieldNames(fields.fieldsByTypeName.Option),
      })
      .lastValue();
    return option ? this.mapToOption(option) : undefined;
  }

  @Anonymous()
  @Query((returns) => String, { nullable: true, description: 'Get option value by name.' })
  async optionValue(@Args('name') name: string): Promise<string | undefined> {
    const { optionValue } = await this.optionServiceClient
      .getValue({
        optionName: name,
      })
      .lastValue();
    return optionValue;
  }

  @Anonymous()
  @Query((returns) => JSONObjectResolver, { description: 'Get autoload options(key/value), cache by memory.' })
  async autoloadOptions(): Promise<Record<string, string>> {
    const { options } = await this.optionServiceClient.getAutoloads({}).lastValue();
    return options;
  }

  @RamAuthorized(OptionAction.List)
  @Query((returns) => [Option], { description: 'Get options.' })
  async options(@Args() args: OptionArgs, @Fields() fields: ResolveTree): Promise<Option[]> {
    const { options } = await this.optionServiceClient
      .getList({
        optionNames: args.optionNames ? { value: args.optionNames } : undefined,
        fields: this.getFieldNames(fields.fieldsByTypeName.Option),
      })
      .lastValue();
    return (options || []).map((opt) => this.mapToOption(opt));
  }

  @RamAuthorized(OptionAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Clear option cache from momery.' })
  async clearOptionCache(): Promise<void> {
    await this.optionServiceClient.reset({}).lastValue();
  }

  @RamAuthorized(OptionAction.Create)
  @Mutation((returns) => Option, { description: 'Create a new option.' })
  async createOption(
    @Args('model', { type: () => NewOptionInput }) model: NewOptionInput,
    @User() requestUser: RequestUser,
  ): Promise<Option> {
    const { option } = await this.optionServiceClient
      .create({
        ...model,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
    return this.mapToOption(option);
  }

  @RamAuthorized(OptionAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update option.' })
  async updateOption(
    @Args('id', { type: () => ID, description: 'Option id' }, ParseIntPipe) id: number,
    @Args('model') model: UpdateOptionInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.optionServiceClient
      .update({
        ...model,
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(OptionAction.Delete)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete option permanently.' })
  async deleteOption(
    @Args('id', { type: () => ID, description: 'Option id' }, ParseIntPipe) id: number,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.optionServiceClient
      .delete({
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }
}
