import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Authorized } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { Fields, random, sha256 } from '@ace-pomelo/shared-server';
import { ApiResourceDataSource } from '@ace-pomelo/identity-datasource';
import { ApiResourceAction } from '@/common/actions';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { PagedApiResourceArgs } from './dto/paged-api-resource.args';
import { NewApiResourceInput } from './dto/new-api-resource.input';
import { UpdateApiResourceInput } from './dto/update-api-resource.input';
import { NewApiClaimInput } from './dto/new-api-claim.input';
import { PagedApiScopeArgs } from './dto/paged-api-scope.args';
import { NewApiScopeInput } from './dto/new-api-scope.input';
import { UpdateApiScopeInput } from './dto/update-api-scope.input';
import { NewApiScopeClaimInput } from './dto/new-api-scope-claim.input';
import { NewApiSecretInput } from './dto/new-api-secret.input';
import { NewApiPropertyInput } from './dto/new-api-property.input';
import { ApiResource, PagedApiResource } from './models/api-resource.model';
import { ApiClaim, ApiClaims } from './models/api-claim.model';
import { ApiScope, PagedApiScope } from './models/api-scope.model';
import { ApiScopeClaim, ApiScopeClaims } from './models/api-scope-claim.model';
import { ApiSecret, ApiSecrets } from './models/api-secret.model';
import { ApiProperty, ApiProperties } from './models/api-property.model';

@Authorized()
@Resolver(() => ApiResource)
export class ApiResourceResolver extends BaseResolver {
  constructor(private readonly apiResourceDataSource: ApiResourceDataSource) {
    super();
  }

  @RamAuthorized(ApiResourceAction.Detail)
  @Query((returns) => ApiResource, { nullable: true, description: 'Get api scope.' })
  apiResource(
    @Args('id', { type: () => ID, description: 'Api resource id' }) id: number,
    @Fields() fields: ResolveTree,
  ): Promise<ApiResource | undefined> {
    return this.apiResourceDataSource.get(id, this.getFieldNames(fields.fieldsByTypeName.ApiResource));
  }

  @RamAuthorized(ApiResourceAction.PagedList)
  @Query((returns) => PagedApiResource, { description: 'Get paged api scopes.' })
  apiResources(@Args() args: PagedApiResourceArgs, @Fields() fields: ResolveTree): Promise<PagedApiResource> {
    return this.apiResourceDataSource.getPaged(
      args,
      this.getFieldNames(fields.fieldsByTypeName.PagedApiResource.rows.fieldsByTypeName.ApiResource),
    );
  }

  @RamAuthorized(ApiResourceAction.Create)
  @Mutation((returns) => ApiResource, { description: 'Create api scope.' })
  createApiResource(@Args('model') input: NewApiResourceInput): Promise<ApiResource> {
    return this.apiResourceDataSource.create({
      ...input,
      nonEditable: input.nonEditable ?? false,
      enabled: input.enabled ?? true,
    });
  }

  @RamAuthorized(ApiResourceAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update api scope.' })
  async updateApiResource(
    @Args('id', { type: () => ID, description: 'Api resource id' }) id: number,
    @Args('model') input: UpdateApiResourceInput,
  ): Promise<void> {
    await this.apiResourceDataSource.update(id, input);
  }

  @RamAuthorized(ApiResourceAction.Delete)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete api scope.' })
  async deleteApiResource(@Args('id', { type: () => ID, description: 'Api resource id' }) id: number): Promise<void> {
    await this.apiResourceDataSource.delete(id);
  }

  @RamAuthorized(ApiResourceAction.Claims)
  @Query(() => ApiClaims, { nullable: true, description: 'Get apiScope claims.' })
  apiClaims(
    @Args('apiResourceId', { type: () => ID, description: 'Api resource id' }) apiResourceId: number,
    @Fields() fields: ResolveTree,
  ): Promise<ApiClaims | undefined> {
    return this.apiResourceDataSource.getClaims(
      apiResourceId,
      this.getFieldNames(fields.fieldsByTypeName.ApiClaims.claims.fieldsByTypeName.ApiClaim),
    );
  }

  @RamAuthorized(ApiResourceAction.CreateClaim)
  @Mutation((returns) => ApiClaim, { nullable: true, description: 'Create a new api claim.' })
  createApiClaim(
    @Args('apiResourceId', { type: () => ID, description: 'Api resource id' }) apiResourceId: number,
    @Args('model', { type: () => NewApiClaimInput }) input: NewApiClaimInput,
  ): Promise<ApiClaim | undefined> {
    return this.apiResourceDataSource.createClaim(apiResourceId, input);
  }

  @RamAuthorized(ApiResourceAction.DeleteClaim)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete api claim permanently.' })
  async deleteApiClaim(@Args('id', { type: () => ID, description: 'Api claim id' }) id: number): Promise<void> {
    await this.apiResourceDataSource.deleteClaim(id);
  }

  @RamAuthorized(ApiResourceAction.ScopeDetail)
  @Query((returns) => ApiScope, { nullable: true, description: 'Get api scope.' })
  apiScope(
    @Args('id', { type: () => ID, description: 'Api scope id' }) id: number,
    @Fields() fields: ResolveTree,
  ): Promise<ApiScope | undefined> {
    return this.apiResourceDataSource.getScope(id, this.getFieldNames(fields.fieldsByTypeName.ApiScope));
  }

  @RamAuthorized(ApiResourceAction.ScopePagedList)
  @Query((returns) => PagedApiScope, { description: 'Get paged api scopes.' })
  apiScopes(@Args() args: PagedApiScopeArgs, @Fields() fields: ResolveTree): Promise<PagedApiScope> {
    return this.apiResourceDataSource.getPagedScope(
      args,
      this.getFieldNames(fields.fieldsByTypeName.PagedApiScope.rows.fieldsByTypeName.ApiScope),
    );
  }

  @RamAuthorized(ApiResourceAction.Create)
  @Mutation((returns) => ApiScope, { nullable: true, description: 'Create api scope.' })
  createApiScope(
    @Args('apiResourceId', { type: () => ID, description: 'Api resource id' }) apiResourceId: number,
    @Args('model') input: NewApiScopeInput,
  ): Promise<ApiScope | undefined> {
    return this.apiResourceDataSource.createScope(apiResourceId, {
      ...input,
      emphasize: input.emphasize ?? true,
      required: input.required ?? false,
      showInDiscoveryDocument: input.showInDiscoveryDocument ?? true,
    });
  }

  @RamAuthorized(ApiResourceAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update api scope.' })
  async updateApiScope(
    @Args('id', { type: () => ID, description: 'Api scope id' }) id: number,
    @Args('model') input: UpdateApiScopeInput,
  ): Promise<void> {
    await this.apiResourceDataSource.updateScope(id, input);
  }

  @RamAuthorized(ApiResourceAction.Delete)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete api scope.' })
  async deleteApiScope(@Args('id', { type: () => ID, description: 'Api scope id' }) id: number): Promise<void> {
    await this.apiResourceDataSource.deleteScope(id);
  }

  @RamAuthorized(ApiResourceAction.ScopeClaims)
  @Query(() => ApiScopeClaims, { nullable: true, description: 'Get api scope claims.' })
  apiScopeClaims(
    @Args('apiScopeId', { type: () => ID, description: 'Api scope id' }) apiScopeId: number,
    @Fields() fields: ResolveTree,
  ): Promise<ApiScopeClaims | undefined> {
    return this.apiResourceDataSource.getScopeClaims(
      apiScopeId,
      this.getFieldNames(fields.fieldsByTypeName.ApiScopeClaims.scopeClaims.fieldsByTypeName.ApiScopeClaim),
    );
  }

  @RamAuthorized(ApiResourceAction.CreateScopeClaim)
  @Mutation((returns) => ApiScopeClaim, { nullable: true, description: 'Create a new api scope claim.' })
  createApiScopeClaim(
    @Args('apiScopeId', { type: () => ID, description: 'Api scope id' }) apiScopeId: number,
    @Args('model', { type: () => NewApiScopeClaimInput }) input: NewApiScopeClaimInput,
  ): Promise<ApiScopeClaim | undefined> {
    return this.apiResourceDataSource.createScopeClaim(apiScopeId, input);
  }

  @RamAuthorized(ApiResourceAction.DeleteScopeClaim)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete api scope claim permanently.' })
  async deleteApiScopeClaim(
    @Args('id', { type: () => ID, description: 'Api scope claim id' }) id: number,
  ): Promise<void> {
    await this.apiResourceDataSource.deleteScopeClaim(id);
  }

  @RamAuthorized(ApiResourceAction.Secrets)
  @Query(() => ApiSecrets, { nullable: true, description: 'Get api resource secrets.' })
  apiSecrets(
    @Args('apiResourceId', { type: () => ID, description: 'Api resource id' }) apiResourceId: number,
    @Fields() fields: ResolveTree,
  ): Promise<ApiSecrets | undefined> {
    return this.apiResourceDataSource
      .getSecrets(
        apiResourceId,
        this.getFieldNames(fields.fieldsByTypeName.ApiSecrets.secrets.fieldsByTypeName.ApiSecretWithoutValue),
      )
      .then((secrets) => secrets as ApiSecrets);
  }

  @RamAuthorized(ApiResourceAction.CreateSecret)
  @Mutation((returns) => ApiSecret, { nullable: true, description: 'Create a new api resource secret.' })
  createApiSecret(
    @Args('apiResourceId', { type: () => ID, description: 'Api resource id' }) apiResourceId: number,
    @Args('model', { type: () => NewApiSecretInput }) input: NewApiSecretInput,
  ): Promise<ApiSecret | undefined> {
    const randomSecret = random(32).toBase64();

    return this.apiResourceDataSource
      .createSecret(apiResourceId, {
        ...input,
        // SHA256 加密
        value: sha256(randomSecret, {
          enabledHmac: true,
        }).toString(),
      })
      .then((secret) => ({ ...secret, value: randomSecret } as ApiSecret)); // value 返回原始值
  }

  @RamAuthorized(ApiResourceAction.DeleteSecret)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete api secret permanently.' })
  async deleteApiSecret(@Args('id', { type: () => ID, description: 'Api secret id' }) id: number): Promise<void> {
    await this.apiResourceDataSource.deleteSecret(id);
  }

  @RamAuthorized(ApiResourceAction.Properties)
  @Query(() => ApiProperties, { nullable: true, description: 'Get api scope properties.' })
  apiProperties(
    @Args('apiResourceId', { type: () => ID, description: 'Api resource id' }) apiResourceId: number,
    @Fields() fields: ResolveTree,
  ): Promise<ApiProperties | undefined> {
    return this.apiResourceDataSource.getProperties(
      apiResourceId,
      this.getFieldNames(fields.fieldsByTypeName.ApiProperties.properties.fieldsByTypeName.ApiProperty),
    );
  }

  @RamAuthorized(ApiResourceAction.CreateProperty)
  @Mutation((returns) => ApiProperty, { nullable: true, description: 'Create a new api scope property.' })
  createApiProperty(
    @Args('apiResourceId', { type: () => ID, description: 'Api resource id' }) apiResourceId: number,
    @Args('model', { type: () => NewApiPropertyInput }) input: NewApiPropertyInput,
  ): Promise<ApiProperty | undefined> {
    return this.apiResourceDataSource.createProperty(apiResourceId, input);
  }

  @RamAuthorized(ApiResourceAction.DeleteProperty)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete api scope property permanently.' })
  async deleteApiProperty(
    @Args('id', { type: () => ID, description: 'Api resopurce property id' }) id: number,
  ): Promise<void> {
    await this.apiResourceDataSource.deleteProperty(id);
  }
}
