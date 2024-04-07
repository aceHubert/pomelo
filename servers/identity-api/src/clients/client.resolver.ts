import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ResolveTree } from 'graphql-parse-resolve-info';
import { VoidResolver } from 'graphql-scalars';
import { Authorized } from '@ace-pomelo/nestjs-oidc';
import { RamAuthorized } from '@ace-pomelo/ram-authorization';
import { Fields, random, sha256 } from '@ace-pomelo/shared-server';
import { ClientDataSource } from '@ace-pomelo/identity-datasource';
import { ClientAction } from '@/common/actions';
import { BaseResolver } from '@/common/resolvers/base.resolver';
import { PagedClientArgs } from './dto/paged-client.args';
import { NewClientInput } from './dto/new-client.input';
import { NewClientClaimInput } from './dto/new-client-claim.input';
import { NewClientCorsOriginInput } from './dto/new-client-cors-origin.input';
import { NewClientGrantTypeInput } from './dto/new-client-grant-type.input';
import { NewClientScopeInput } from './dto/new-client-scope.input';
import { NewClientRedirectUriInput } from './dto/new-client-redirect-uri.input';
import { NewClientPostLogoutRedirectUriInput } from './dto/new-client-post-logout-redirect-uri.input';
import { NewClientSecretInput } from './dto/new-client-secret.input';
import { NewClientPropertyInput } from './dto/new-client-property.input';
import { UpdateClientInput } from './dto/update-client.input';
import { Client, PagedClient } from './models/cleint.model';
import { ClientClaim, ClientClaims } from './models/client-claim.model';
import { ClientCorsOrigin, ClientCorsOrigins } from './models/client-cors-origin.model';
import { ClientGrantType, ClientGrantTypes } from './models/client-grant-type.model';
import { ClientScope, ClientScopes } from './models/client-scope.model';
import { ClientRedirectUri, ClientRedirectUris } from './models/client-redirect-uri.model';
import {
  ClientPostLogoutRedirectUri,
  ClientPostLogoutRedirectUris,
} from './models/client-post-logout-redirect-uri.model';
import { ClientSecret, ClientSecrets } from './models/client-secret.model';
import { ClientProperty, ClientProperties } from './models/client-property.model';

@Authorized()
@Resolver(() => Client)
export class ClientResolver extends BaseResolver {
  constructor(private readonly clientDataSource: ClientDataSource) {
    super();
  }

  @RamAuthorized(ClientAction.Detail)
  @Query(() => Client, { nullable: true, description: 'Get client.' })
  client(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Fields() fields: ResolveTree,
  ): Promise<Client | undefined> {
    return this.clientDataSource.get(clientId, this.getFieldNames(fields.fieldsByTypeName.Client)).then((client) => {
      if (!client) return;

      return client as Client;
    });
  }

  @RamAuthorized(ClientAction.PagedList)
  @Query(() => PagedClient, { description: 'Get paged client.' })
  clients(@Args() args: PagedClientArgs, @Fields() fields: ResolveTree): Promise<PagedClient> {
    return this.clientDataSource
      .getPaged(args, this.getFieldNames(fields.fieldsByTypeName.PagedClient.rows.fieldsByTypeName.PickObjectType))
      .then(({ rows, total }) => ({
        rows: rows as Client[],
        total,
      }));
  }

  @RamAuthorized(ClientAction.Create)
  @Mutation((returns) => Client, { description: 'Create a new client.' })
  createClient(@Args('model', { type: () => NewClientInput }) input: NewClientInput): Promise<Client> {
    return this.clientDataSource.create(input).then((client) => client as Client);
  }

  @RamAuthorized(ClientAction.Update)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Update client.' })
  async updateClient(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => UpdateClientInput }) input: UpdateClientInput,
  ): Promise<void> {
    await this.clientDataSource.update(clientId, input);
  }

  @RamAuthorized(ClientAction.Claims)
  @Query(() => ClientClaims, { nullable: true, description: 'Get client claims.' })
  clientClaims(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Fields() fields: ResolveTree,
  ): Promise<ClientClaims | undefined> {
    return this.clientDataSource.getClaims(
      clientId,
      this.getFieldNames(fields.fieldsByTypeName.ClientClaims.claims.fieldsByTypeName.ClientClaim),
    );
  }

  @RamAuthorized(ClientAction.CreateClaim)
  @Mutation((returns) => ClientClaim, { nullable: true, description: 'Create a new client claim.' })
  createClientClaim(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => NewClientClaimInput }) input: NewClientClaimInput,
  ): Promise<ClientClaim | undefined> {
    return this.clientDataSource.createClaim(clientId, input);
  }

  @RamAuthorized(ClientAction.CreateClaim)
  @Mutation((returns) => [ClientClaim], { nullable: true, description: 'Create new client claims.' })
  createClientClaims(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => [NewClientClaimInput!] }) input: NewClientClaimInput[],
  ): Promise<ClientClaim[]> {
    return this.clientDataSource.createClaims(clientId, input);
  }

  @RamAuthorized(ClientAction.DeleteClaim)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete client claim permanently.' })
  async deleteClientClaim(@Args('id', { type: () => ID, description: 'Client claim id' }) id: number): Promise<void> {
    await this.clientDataSource.deleteClaim(id);
  }

  @RamAuthorized(ClientAction.CorsOrigins)
  @Query(() => ClientCorsOrigins, { nullable: true, description: 'Get client cors origins.' })
  clientCorsOrigins(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Fields() fields: ResolveTree,
  ): Promise<ClientCorsOrigins | undefined> {
    return this.clientDataSource.getCorsOrigins(
      clientId,
      this.getFieldNames(fields.fieldsByTypeName.ClientCorsOrigins.corsOrigins.fieldsByTypeName.ClientCorsOrigin),
    );
  }

  @RamAuthorized(ClientAction.CreateCorsOrigin)
  @Mutation((returns) => ClientCorsOrigin, { nullable: true, description: 'Create a new client cors origin.' })
  createClientCorsOrigin(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => NewClientCorsOriginInput }) input: NewClientCorsOriginInput,
  ): Promise<ClientCorsOrigin | undefined> {
    return this.clientDataSource.createCorsOrigin(clientId, input);
  }

  @RamAuthorized(ClientAction.CreateCorsOrigin)
  @Mutation((returns) => [ClientCorsOrigin], { nullable: true, description: 'Create new client cors origins.' })
  createClientCorsOrigins(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => [NewClientCorsOriginInput!] }) input: NewClientCorsOriginInput[],
  ): Promise<ClientCorsOrigin[]> {
    return this.clientDataSource.createCorsOrigins(clientId, input);
  }

  @RamAuthorized(ClientAction.DeleteCorsOrigin)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete client cors origin permanently.' })
  async deleteClientCorsOrigin(
    @Args('id', { type: () => ID, description: 'Client cors origin id' }) id: number,
  ): Promise<void> {
    await this.clientDataSource.deleteCorsOrigin(id);
  }

  @RamAuthorized(ClientAction.GrantTypes)
  @Query(() => ClientGrantTypes, { nullable: true, description: 'Get client grant types.' })
  clientGrantTypes(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Fields() fields: ResolveTree,
  ): Promise<ClientGrantTypes | undefined> {
    return this.clientDataSource.getGrantTypes(
      clientId,
      this.getFieldNames(fields.fieldsByTypeName.ClientGrantTypes.grantTypes.fieldsByTypeName.ClientGrantType),
    );
  }

  @RamAuthorized(ClientAction.CreateGrantType)
  @Mutation((returns) => ClientGrantType, { nullable: true, description: 'Create a new client grant type.' })
  createClientGrantType(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => NewClientGrantTypeInput }) input: NewClientGrantTypeInput,
  ): Promise<ClientGrantType | undefined> {
    return this.clientDataSource.createGrantType(clientId, input);
  }

  @RamAuthorized(ClientAction.CreateGrantType)
  @Mutation((returns) => [ClientGrantType], { nullable: true, description: 'Create new client grant types.' })
  createClientGrantTypes(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => [NewClientGrantTypeInput!] }) input: NewClientGrantTypeInput[],
  ): Promise<ClientGrantType[]> {
    return this.clientDataSource.createGrantTypes(clientId, input);
  }

  @RamAuthorized(ClientAction.DeleteGrantType)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete client grant type permanently.' })
  async deleteClientGrantType(
    @Args('id', { type: () => ID, description: 'Client grant type id' }) id: number,
  ): Promise<void> {
    await this.clientDataSource.deleteGrantType(id);
  }

  @RamAuthorized(ClientAction.Scopes)
  @Query(() => ClientScopes, { nullable: true, description: 'Get client scopes.' })
  clientScopes(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Fields() fields: ResolveTree,
  ): Promise<ClientScopes | undefined> {
    return this.clientDataSource.getScopes(
      clientId,
      this.getFieldNames(fields.fieldsByTypeName.ClientScopes.scopes.fieldsByTypeName.ClientScope),
    );
  }

  @RamAuthorized(ClientAction.CreateScope)
  @Mutation((returns) => ClientScope, { nullable: true, description: 'Create a new client scope.' })
  createClientScope(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => NewClientScopeInput }) input: NewClientScopeInput,
  ): Promise<ClientScope | undefined> {
    return this.clientDataSource.createScope(clientId, input);
  }

  @RamAuthorized(ClientAction.CreateScope)
  @Mutation((returns) => [ClientScope], { nullable: true, description: 'Create new client scopes.' })
  createClientScopes(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => [NewClientScopeInput!] }) input: NewClientScopeInput[],
  ): Promise<ClientScope[]> {
    return this.clientDataSource.createScopes(clientId, input);
  }

  @RamAuthorized(ClientAction.DeleteScope)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete client scope permanently.' })
  async deleteClientScope(@Args('id', { type: () => ID, description: 'Client scope id' }) id: number): Promise<void> {
    await this.clientDataSource.deleteScope(id);
  }

  @RamAuthorized(ClientAction.RedirectUris)
  @Query(() => ClientRedirectUris, { nullable: true, description: 'Get client redirect uris.' })
  clientRedirectUris(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Fields() fields: ResolveTree,
  ): Promise<ClientRedirectUris | undefined> {
    return this.clientDataSource.getRedirectUris(
      clientId,
      this.getFieldNames(fields.fieldsByTypeName.ClientRedirectUris.redirectUris.fieldsByTypeName.ClientRedirectUri),
    );
  }

  @RamAuthorized(ClientAction.CreateRedirectUri)
  @Mutation((returns) => ClientRedirectUri, { nullable: true, description: 'Create a new client redirect uri.' })
  createClientRedirectUri(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => NewClientRedirectUriInput }) input: NewClientRedirectUriInput,
  ): Promise<ClientRedirectUri | undefined> {
    return this.clientDataSource.createRedirectUri(clientId, input);
  }

  @RamAuthorized(ClientAction.CreateRedirectUri)
  @Mutation((returns) => [ClientRedirectUri], { nullable: true, description: 'Create new client redirect uris.' })
  createClientRedirectUris(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => [NewClientRedirectUriInput!] }) input: NewClientRedirectUriInput[],
  ): Promise<ClientRedirectUri[]> {
    return this.clientDataSource.createRedirectUris(clientId, input);
  }

  @RamAuthorized(ClientAction.DeleteRedirectUri)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete client redirect uri permanently.' })
  async deleteClientRedirectUri(
    @Args('id', { type: () => ID, description: 'Client redirect uri id' }) id: number,
  ): Promise<void> {
    await this.clientDataSource.deleteRedirectUri(id);
  }

  @RamAuthorized(ClientAction.PostLogoutRedirectUris)
  @Query(() => ClientPostLogoutRedirectUris, { nullable: true, description: 'Get client post logout redirect uris.' })
  clientPostLogoutRedirectUris(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Fields() fields: ResolveTree,
  ): Promise<ClientPostLogoutRedirectUris | undefined> {
    return this.clientDataSource.getPostLogoutRedirectUris(
      clientId,
      this.getFieldNames(
        fields.fieldsByTypeName.ClientPostLogoutRedirectUris.postLogoutRedirectUris.fieldsByTypeName
          .ClientPostLogoutRedirectUri,
      ),
    );
  }

  @RamAuthorized(ClientAction.CreatePostLogoutRedirectUri)
  @Mutation((returns) => ClientPostLogoutRedirectUri, {
    nullable: true,
    description: 'Create a new client post logout redirect uri.',
  })
  createClientPostLogoutRedirectUri(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => NewClientPostLogoutRedirectUriInput }) input: NewClientPostLogoutRedirectUriInput,
  ): Promise<ClientPostLogoutRedirectUri | undefined> {
    return this.clientDataSource.createPostLogoutRedirectUri(clientId, input);
  }

  @RamAuthorized(ClientAction.CreatePostLogoutRedirectUri)
  @Mutation((returns) => [ClientPostLogoutRedirectUri], {
    nullable: true,
    description: 'Create new client post logout redirect uris.',
  })
  createClientPostLogoutRedirectUris(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => [NewClientPostLogoutRedirectUriInput!] }) input: NewClientPostLogoutRedirectUriInput[],
  ): Promise<ClientPostLogoutRedirectUri[]> {
    return this.clientDataSource.createPostLogoutRedirectUris(clientId, input);
  }

  @RamAuthorized(ClientAction.DeletePostLogoutRedirectUri)
  @Mutation((returns) => VoidResolver, {
    nullable: true,
    description: 'Delete client post logout redirect uri permanently.',
  })
  async deleteClientPostLogoutRedirectUri(
    @Args('id', { type: () => ID, description: 'Client post logout redirect uri id' }) id: number,
  ): Promise<void> {
    await this.clientDataSource.deletePostLogoutRedirectUri(id);
  }

  @RamAuthorized(ClientAction.Secrets)
  @Query(() => ClientSecrets, { nullable: true, description: 'Get client secrets.' })
  clientSecrets(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Fields() fields: ResolveTree,
  ): Promise<ClientSecrets | undefined> {
    return this.clientDataSource
      .getSecrets(
        clientId,
        this.getFieldNames(fields.fieldsByTypeName.ClientSecrets.secrets.fieldsByTypeName.ClientSecretWithoutValue),
      )
      .then((secrets) => secrets as ClientSecrets);
  }

  @RamAuthorized(ClientAction.CreateSecret)
  @Mutation((returns) => ClientSecret, { nullable: true, description: 'Create a new client secret.' })
  createClientSecret(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => NewClientSecretInput }) input: NewClientSecretInput,
  ): Promise<ClientSecret | undefined> {
    const randomSecret = random(32).toBase64Url();

    return this.clientDataSource
      .createSecret(clientId, {
        ...input,
        // SHA256 加密
        value: sha256(randomSecret, { enabledHmac: true }).toString(),
      })
      .then((secret) => ({ ...secret, value: randomSecret } as ClientSecret)); // value 返回原始值
  }

  @RamAuthorized(ClientAction.DeleteSecret)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete client secret permanently.' })
  async deleteClientSecret(@Args('id', { type: () => ID, description: 'Client secret id' }) id: number): Promise<void> {
    await this.clientDataSource.deleteSecret(id);
  }

  @RamAuthorized(ClientAction.Properties)
  @Query(() => ClientProperties, { nullable: true, description: 'Get client properties.' })
  clientProperties(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Fields() fields: ResolveTree,
  ): Promise<ClientProperties | undefined> {
    return this.clientDataSource.getProperties(
      clientId,
      this.getFieldNames(fields.fieldsByTypeName.ClientProperties.properties.fieldsByTypeName.ClientProperty),
    );
  }

  @RamAuthorized(ClientAction.CreateProperty)
  @Mutation((returns) => ClientProperty, { nullable: true, description: 'Create a new client property.' })
  createClientProperty(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => NewClientPropertyInput }) input: NewClientPropertyInput,
  ): Promise<ClientProperty | undefined> {
    return this.clientDataSource.createProperty(clientId, input);
  }

  @RamAuthorized(ClientAction.CreateProperty)
  @Mutation((returns) => [ClientProperty], { nullable: true, description: 'Create new client properties.' })
  createClientProperties(
    @Args('clientId', { description: 'Client id' }) clientId: string,
    @Args('model', { type: () => [NewClientPropertyInput!] }) input: NewClientPropertyInput[],
  ): Promise<ClientProperty[]> {
    return this.clientDataSource.createProperties(clientId, input);
  }

  @RamAuthorized(ClientAction.DeleteProperty)
  @Mutation((returns) => VoidResolver, { nullable: true, description: 'Delete client property permanently.' })
  async deleteClientProperty(
    @Args('id', { type: () => ID, description: 'Client property id' }) id: number,
  ): Promise<void> {
    await this.clientDataSource.deleteProperty(id);
  }
}
