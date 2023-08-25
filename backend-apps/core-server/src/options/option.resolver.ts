import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { Authorized } from 'nestjs-authorization';
import { RamAuthorized } from 'nestjs-ram-authorization';
import { BaseResolver, User, Fields, RequestUser } from '@pomelo/shared';
import { OptionDataSource } from '@pomelo/datasource';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { OptionAction } from '@/common/actions';
import { NewOptionInput } from './dto/new-option.input';
import { OptionArgs } from './dto/option.args';
import { UpdateOptionInput } from './dto/update-option.input';
import { Option } from './models/option.model';

@Resolver(() => Option)
export class OptionResolver extends BaseResolver {
  constructor(private readonly optionDataSource: OptionDataSource) {
    super();
  }

  @Query((returns) => Option, { nullable: true, description: 'Get option.' })
  option(@Args('id', { type: () => ID }) id: number, @Fields() fields: ResolveTree): Promise<Option | undefined> {
    return this.optionDataSource.get(id, this.getFieldNames(fields.fieldsByTypeName.Option));
  }

  @Query((returns) => String, { nullable: true, description: 'Get option value by name.' })
  optionValue(@Args('name') name: string): Promise<string | undefined> {
    return this.optionDataSource.getOptionValue(name);
  }

  @Authorized()
  @RamAuthorized(OptionAction.List)
  @Query((returns) => [Option], { description: 'Get options.' })
  options(@Args() args: OptionArgs, @Fields() fields: ResolveTree): Promise<Option[]> {
    return this.optionDataSource.getList(args, this.getFieldNames(fields.fieldsByTypeName.Option));
  }

  @Query((returns) => GraphQLJSONObject, { description: 'Get autoload options(key/value), cache by memory.' })
  autoloadOptions(): Promise<Dictionary<string>> {
    return this.optionDataSource.getAutoloadOptions();
  }

  @Authorized()
  @RamAuthorized(OptionAction.Create)
  @Mutation((returns) => Option, { description: 'Create a new option.' })
  createOption(
    @Args('model', { type: () => NewOptionInput }) model: NewOptionInput,
    @User() requestUser: RequestUser,
  ): Promise<Option> {
    return this.optionDataSource.create(model, requestUser);
  }

  @Authorized()
  @RamAuthorized(OptionAction.Update)
  @Mutation((returns) => Boolean, { description: 'Update option.' })
  updateOption(
    @Args('id', { type: () => ID, description: 'Option id' }) id: number,
    @Args('model') model: UpdateOptionInput,
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    return this.optionDataSource.update(id, model, requestUser);
  }

  @Authorized()
  @RamAuthorized(OptionAction.Delete)
  @Mutation((returns) => Boolean, { description: 'Delete option permanently.' })
  deleteOption(
    @Args('id', { type: () => ID, description: 'Option id' }) id: number,
    @User() requestUser: RequestUser,
  ): Promise<boolean> {
    return this.optionDataSource.delete(id, requestUser);
  }
}
