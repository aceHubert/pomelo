import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { JSONObjectResolver, VoidResolver } from 'graphql-scalars';
import { Authorized, Anonymous } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { OptionDataSource } from '@ace-pomelo/infrastructure-datasource';
import { User, Fields, RequestUser } from '@ace-pomelo/shared-server';
import { OptionAction } from '@/common/actions';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { NewOptionInput } from './dto/new-option.input';
import { OptionArgs } from './dto/option.args';
import { UpdateOptionInput } from './dto/update-option.input';
import { Option } from './models/option.model';

@Authorized()
@Resolver(() => Option)
export class OptionResolver extends BaseResolver {
  constructor(private readonly optionDataSource: OptionDataSource) {
    super();
  }

  @Anonymous()
  @Query((returns) => Option, { nullable: true, description: 'Get option.' })
  option(@Args('id', { type: () => ID }) id: number, @Fields() fields: ResolveTree): Promise<Option | undefined> {
    return this.optionDataSource.get(id, this.getFieldNames(fields.fieldsByTypeName.Option));
  }

  @Anonymous()
  @Query((returns) => String, { nullable: true, description: 'Get option value by name.' })
  optionValue(@Args('name') name: string): Promise<string | undefined> {
    return this.optionDataSource.getOptionValue(name);
  }

  @Anonymous()
  @Query((returns) => JSONObjectResolver, { description: 'Get autoload options(key/value), cache by memory.' })
  autoloadOptions(): Promise<Dictionary<string>> {
    return this.optionDataSource.getAutoloadOptions();
  }

  @RamAuthorized(OptionAction.List)
  @Query((returns) => [Option], { description: 'Get options.' })
  options(@Args() args: OptionArgs, @Fields() fields: ResolveTree): Promise<Option[]> {
    return this.optionDataSource.getList(args, this.getFieldNames(fields.fieldsByTypeName.Option));
  }

  @RamAuthorized(OptionAction.Create)
  @Mutation((returns) => Option, { description: 'Create a new option.' })
  createOption(
    @Args('model', { type: () => NewOptionInput }) model: NewOptionInput,
    @User() requestUser: RequestUser,
  ): Promise<Option> {
    return this.optionDataSource.create(model, Number(requestUser.sub));
  }

  @RamAuthorized(OptionAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update option.' })
  async updateOption(
    @Args('id', { type: () => ID, description: 'Option id' }) id: number,
    @Args('model') model: UpdateOptionInput,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.optionDataSource.update(id, model, Number(requestUser.sub));
  }

  @RamAuthorized(OptionAction.Delete)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete option permanently.' })
  async deleteOption(
    @Args('id', { type: () => ID, description: 'Option id' }) id: number,
    @User() requestUser: RequestUser,
  ): Promise<void> {
    await this.optionDataSource.delete(id, Number(requestUser.sub));
  }
}
