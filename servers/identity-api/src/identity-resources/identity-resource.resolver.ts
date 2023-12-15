import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Authorized } from '@ace-pomelo/authorization';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { Fields } from '@ace-pomelo/shared-server';
import { IdentityResourceDataSource } from '@ace-pomelo/identity-datasource';
import { IdentityResourceAction } from '@/common/actions';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { PagedIdentityResourceArgs } from './dto/paged-identity-resource.args';
import { NewIdentityResourceInput } from './dto/new-identity-resource.input';
import { UpdateIdentityResourceInput } from './dto/update-identity-resource.input';
import { NewIdentityClaimInput } from './dto/new-identity-claim.input';
import { NewIdentityPropertyInput } from './dto/new-identity-property.input';
import { IdentityResource, PagedIdentityResource } from './models/identity-resource.model';
import { IdentityClaim, IdentityClaims } from './models/identity-claim.model';
import { IdentityProperty, IdentityProperties } from './models/identity-property.model';

@Authorized()
@Resolver(() => IdentityResource)
export class IdentityResourceResolver extends BaseResolver {
  constructor(private readonly identityResourceDataSource: IdentityResourceDataSource) {
    super();
  }

  @RamAuthorized(IdentityResourceAction.Detail)
  @Query((returns) => IdentityResource, { nullable: true, description: 'Get identity resource.' })
  identityResource(
    @Args('id', { type: () => ID, description: 'Identity resource id' }) id: number,
    @Fields() fields: ResolveTree,
  ): Promise<IdentityResource | undefined> {
    return this.identityResourceDataSource.get(id, this.getFieldNames(fields.fieldsByTypeName.IdentityResource));
  }

  @RamAuthorized(IdentityResourceAction.PagedList)
  @Query((returns) => PagedIdentityResource, { description: 'Get paged identity resources.' })
  identityResources(
    @Args() args: PagedIdentityResourceArgs,
    @Fields() fields: ResolveTree,
  ): Promise<PagedIdentityResource> {
    return this.identityResourceDataSource.getPaged(
      args,
      this.getFieldNames(fields.fieldsByTypeName.PagedIdentityResource.rows.fieldsByTypeName.IdentityResource),
    );
  }

  @RamAuthorized(IdentityResourceAction.Create)
  @Mutation((returns) => IdentityResource, { description: 'Create identity resource.' })
  createIdentityResource(@Args('model') input: NewIdentityResourceInput): Promise<IdentityResource> {
    return this.identityResourceDataSource.create({
      ...input,
      emphasize: input.emphasize ?? true,
      required: input.required ?? false,
      showInDiscoveryDocument: input.showInDiscoveryDocument ?? true,
      nonEditable: input.nonEditable ?? false,
      enabled: input.enabled ?? true,
    });
  }

  @RamAuthorized(IdentityResourceAction.Update)
  @Mutation((returns) => Boolean, { description: 'Update identity resource.' })
  updateIdentityResource(
    @Args('id', { type: () => ID, description: 'Identity resource id' }) id: number,
    @Args('model') input: UpdateIdentityResourceInput,
  ): Promise<boolean> {
    return this.identityResourceDataSource.update(id, input);
  }

  @RamAuthorized(IdentityResourceAction.Delete)
  @Mutation((returns) => Boolean, { description: 'Delete identity resource.' })
  deleteIdentityResource(
    @Args('id', { type: () => ID, description: 'Identity resource id' }) id: number,
  ): Promise<boolean> {
    return this.identityResourceDataSource.delete(id);
  }

  @RamAuthorized(IdentityResourceAction.Claims)
  @Query(() => IdentityClaims, { nullable: true, description: 'Get identity resource claims.' })
  identityClaims(
    @Args('identityResourceId', { type: () => ID, description: 'Identity resource id' }) identityResourceId: number,
    @Fields() fields: ResolveTree,
  ): Promise<IdentityClaims | undefined> {
    return this.identityResourceDataSource.getClaims(
      identityResourceId,
      this.getFieldNames(fields.fieldsByTypeName.IdentityClaims.claims.fieldsByTypeName.IdentityClaim),
    );
  }

  @RamAuthorized(IdentityResourceAction.CreateClaim)
  @Mutation((returns) => IdentityClaim, { nullable: true, description: 'Create a new identity claim.' })
  createIdentityClaim(
    @Args('identityResourceId', { type: () => ID, description: 'Identity resource id' }) identityResourceId: number,
    @Args('model', { type: () => NewIdentityClaimInput }) input: NewIdentityClaimInput,
  ): Promise<IdentityClaim | undefined> {
    return this.identityResourceDataSource.createClaim(identityResourceId, input);
  }

  @RamAuthorized(IdentityResourceAction.DeleteClaim)
  @Mutation((returns) => Boolean, { description: 'Delete identity claim permanently.' })
  deleteIdentityClaim(@Args('id', { type: () => ID, description: 'Identity claim id' }) id: number): Promise<boolean> {
    return this.identityResourceDataSource.deleteClaim(id);
  }

  @RamAuthorized(IdentityResourceAction.Properties)
  @Query(() => IdentityProperties, { nullable: true, description: 'Get identity resource properties.' })
  identityProperties(
    @Args('identityResourceId', { type: () => ID, description: 'Identity resource id' }) identityResourceId: number,
    @Fields() fields: ResolveTree,
  ): Promise<IdentityProperties | undefined> {
    return this.identityResourceDataSource.getProperties(
      identityResourceId,
      this.getFieldNames(fields.fieldsByTypeName.IdentityProperties.properties.fieldsByTypeName.IdentityProperty),
    );
  }

  @RamAuthorized(IdentityResourceAction.CreateProperty)
  @Mutation((returns) => IdentityProperty, { nullable: true, description: 'Create a new identity resource property.' })
  createIdentityProperty(
    @Args('identityResourceId', { type: () => ID, description: 'Identity resource id' }) identityResourceId: number,
    @Args('model', { type: () => NewIdentityPropertyInput }) input: NewIdentityPropertyInput,
  ): Promise<IdentityProperty | undefined> {
    return this.identityResourceDataSource.createProperty(identityResourceId, input);
  }

  @RamAuthorized(IdentityResourceAction.DeleteProperty)
  @Mutation((returns) => Boolean, { description: 'Delete identity resource property permanently.' })
  deleteIdentityProperty(
    @Args('id', { type: () => ID, description: 'Identity resopurce property id' }) id: number,
  ): Promise<boolean> {
    return this.identityResourceDataSource.deleteProperty(id);
  }
}
