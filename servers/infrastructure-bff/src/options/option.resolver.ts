import { ParseIntPipe } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { JSONObjectResolver, VoidResolver } from 'graphql-scalars';
import { Authorized, Anonymous } from '@ace-nestjs/authorization';
import { RamAuthorized } from '@ace-nestjs/ram-authorization';
import { User, Fields, RequestUser, UserRole } from '@ace-pomelo/shared/server';
import { OptionAction } from '@/common/actions';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { OptionArgs } from './dto/option.args';
import { UpdateOptionInput } from './dto/update-option.input';
import { Option, OptionValue } from './models/option.model';
import { OptionService } from './option.service';

@Authorized()
@Resolver(() => Option)
export class OptionResolver extends BaseResolver {
  constructor(private readonly optionService: OptionService) {
    super();
  }

  @Anonymous()
  @Query((returns) => OptionValue, { nullable: true, description: 'Get option.' })
  option(
    @Args('id', { type: () => ID }, ParseIntPipe) id: number,
    @Fields() _fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<OptionValue | undefined> {
    return this.optionService.getById(id, ['optionName', 'optionValue'], this.getRequestUserRole(requestUser));
  }

  @Anonymous()
  @Query((returns) => OptionValue, { description: 'Get option by name.' })
  optionByName(
    @Args('name') name: string,
    @Fields() _fields: ResolveTree,
    @User() requestUser?: RequestUser,
  ): Promise<OptionValue> {
    return this.optionService.getOption(name, ['optionName', 'optionValue'], this.getRequestUserRole(requestUser));
  }

  @Anonymous()
  @Query((returns) => String, { nullable: true, description: 'Get option value by name.' })
  optionValue(@Args('name') name: string, @User() requestUser?: RequestUser): Promise<string | undefined> {
    return this.optionService.getValue(name, this.getRequestUserRole(requestUser));
  }

  @Anonymous()
  @Query((returns) => JSONObjectResolver, { description: 'Get autoload options(key/value), cache by memory.' })
  autoloadOptions(@User() requestUser?: RequestUser): Promise<Record<string, string>> {
    return this.optionService.getAutoloadValues(this.getRequestUserRole(requestUser));
  }

  @Anonymous()
  @Query((returns) => JSONObjectResolver, { description: 'Get basic option values by names.' })
  basicOptions(
    @Args('names', { type: () => [String], description: 'Option names' }) names: string[],
    @User() requestUser?: RequestUser,
  ): Promise<Record<string, string>> {
    return this.optionService.getBasicValues(names, this.getRequestUserRole(requestUser));
  }

  @RamAuthorized(OptionAction.List)
  @Query((returns) => [Option], { description: 'Get options.' })
  options(
    @Args() args: OptionArgs,
    @Fields() fields: ResolveTree,
    @User() requestUser: RequestUser,
  ): Promise<Option[]> {
    return this.optionService.getList<Option>(
      args,
      this.getFieldNames(fields.fieldsByTypeName.Option),
      this.getRequestUserRole(requestUser),
    );
  }

  @RamAuthorized(OptionAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Clear option cache from momery.' })
  clearOptionCache(): Promise<void> {
    return this.optionService.resetCache();
  }

  @RamAuthorized(OptionAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update preset option.' })
  updateOption(
    @Args('name', { description: 'Option name' }) name: string,
    @Args('model') model: UpdateOptionInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    return this.optionService.updateOption(
      name,
      model.optionValue,
      this.getRequestUserRole(requestUser),
      Number(requestUser.sub),
    );
  }

  private getRequestUserRole(requestUser?: RequestUser): UserRole {
    const role = requestUser?.role ?? requestUser?.capabilities;

    return Object.values(UserRole).includes(role) ? role : UserRole.None;
  }
}
