import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { JSONObjectResolver, VoidResolver } from 'graphql-scalars';
import { Authorized, Anonymous } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { User, Fields, RequestUser, INFRASTRUCTURE_SERVICE, OptionPattern } from '@ace-pomelo/shared/server';
import { OptionAction } from '@/common/actions';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { NewOptionInput } from './dto/new-option.input';
import { OptionArgs } from './dto/option.args';
import { UpdateOptionInput } from './dto/update-option.input';
import { Option } from './models/option.model';

@Authorized()
@Resolver(() => Option)
export class OptionResolver extends BaseResolver {
  constructor(@Inject(INFRASTRUCTURE_SERVICE) private readonly basicService: ClientProxy) {
    super();
  }

  @Anonymous()
  @Query((returns) => Option, { nullable: true, description: 'Get option.' })
  option(@Args('id', { type: () => ID }) id: number, @Fields() fields: ResolveTree): Promise<Option | undefined> {
    return this.basicService
      .send<Option | undefined>(OptionPattern.Get, {
        id,
        fields: this.getFieldNames(fields.fieldsByTypeName.Option),
      })
      .lastValue();
  }

  @Anonymous()
  @Query((returns) => String, { nullable: true, description: 'Get option value by name.' })
  optionValue(@Args('name') name: string): Promise<string | undefined> {
    return this.basicService
      .send<string | undefined>(OptionPattern.GetValue, {
        optionName: name,
      })
      .lastValue();
  }

  @Anonymous()
  @Query((returns) => JSONObjectResolver, { description: 'Get autoload options(key/value), cache by memory.' })
  autoloadOptions(): Promise<Record<string, string>> {
    return this.basicService.send<Record<string, string>>(OptionPattern.GetAutoloads, {}).lastValue();
  }

  @RamAuthorized(OptionAction.List)
  @Query((returns) => [Option], { description: 'Get options.' })
  options(@Args() args: OptionArgs, @Fields() fields: ResolveTree): Promise<Option[]> {
    return this.basicService
      .send<Option[]>(OptionPattern.GetList, {
        query: args,
        fields: this.getFieldNames(fields.fieldsByTypeName.Option),
      })
      .lastValue();
  }

  @RamAuthorized(OptionAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Clear option cache from momery.' })
  clearOptionCache(): Promise<void> {
    return this.basicService.send<void>(OptionPattern.Reset, {}).lastValue();
  }

  @RamAuthorized(OptionAction.Create)
  @Mutation((returns) => Option, { description: 'Create a new option.' })
  createOption(
    @Args('model', { type: () => NewOptionInput }) model: NewOptionInput,
    @User() requestUser: RequestUser,
  ): Promise<Option> {
    return this.basicService
      .send<Option>(OptionPattern.Create, {
        ...model,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(OptionAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update option.' })
  updateOption(
    @Args('id', { type: () => ID, description: 'Option id' }) id: number,
    @Args('model') model: UpdateOptionInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    return this.basicService
      .send<void>(OptionPattern.Update, {
        ...model,
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }

  @RamAuthorized(OptionAction.Delete)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete option permanently.' })
  deleteOption(
    @Args('id', { type: () => ID, description: 'Option id' }) id: number,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    return this.basicService
      .send<void>(OptionPattern.Delete, {
        id,
        requestUserId: Number(requestUser.sub),
      })
      .lastValue();
  }
}
