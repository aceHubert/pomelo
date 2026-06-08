import { Body, Controller, Delete, Get, HttpStatus, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { Authorized } from '@ace-nestjs/authorization';
import { RamAuthorized } from '@ace-nestjs/ram-authorization';
import { ApiAuthCreate, ValidatePayloadExistsPipe, random, sha256 } from '@ace-pomelo/shared/server';
import { ClientAction } from '@/common/actions';
import { ClientDataSource } from '@/datasource';
import {
  CLAIM_FIELDS,
  CLIENT_CORS_ORIGIN_FIELDS,
  CLIENT_DETAIL_FIELDS,
  CLIENT_GRANT_TYPE_FIELDS,
  CLIENT_LIST_FIELDS,
  CLIENT_POST_LOGOUT_REDIRECT_URI_FIELDS,
  CLIENT_REDIRECT_URI_FIELDS,
  CLIENT_SCOPE_FIELDS,
  PROPERTY_FIELDS,
  SECRET_FIELDS,
} from '@/openapi/common/management-fields';
import { normalizePagedQuery } from '@/openapi/common/management-query';
import { PagedClientArgs } from './dto/paged-client.args';
import { NewClientInput } from './dto/new-client.input';
import { UpdateClientInput } from './dto/update-client.input';
import { NewClientClaimInput } from './dto/new-client-claim.input';
import { NewClientCorsOriginInput } from './dto/new-client-cors-origin.input';
import { NewClientGrantTypeInput } from './dto/new-client-grant-type.input';
import { NewClientScopeInput } from './dto/new-client-scope.input';
import { NewClientRedirectUriInput } from './dto/new-client-redirect-uri.input';
import { NewClientPostLogoutRedirectUriInput } from './dto/new-client-post-logout-redirect-uri.input';
import { NewClientSecretInput } from './dto/new-client-secret.input';
import { NewClientPropertyInput } from './dto/new-client-property.input';
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

@ApiTags('management-clients')
@Authorized()
@Controller('v0/management/clients')
@ApiUnauthorizedResponse({ description: 'Unauthorized.' })
@ApiForbiddenResponse({ description: 'Forbidden.' })
export class ManagementClientController {
  constructor(private readonly clientDataSource: ClientDataSource) {}

  @Get()
  @RamAuthorized(ClientAction.PagedList)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Paged clients.', type: PagedClient })
  list(@Query() query: PagedClientArgs): Promise<PagedClient> {
    return this.clientDataSource.getPaged(normalizePagedQuery(query), CLIENT_LIST_FIELDS) as Promise<PagedClient>;
  }

  @Get(':clientId')
  @RamAuthorized(ClientAction.Detail)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client detail.', type: Client })
  @ApiNoContentResponse({ description: 'Client not found.' })
  get(@Param('clientId') clientId: string): Promise<Client | undefined> {
    return this.clientDataSource.get(clientId, CLIENT_DETAIL_FIELDS) as Promise<Client | undefined>;
  }

  @Post()
  @RamAuthorized(ClientAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewClientInput })
  @ApiCreatedResponse({ description: 'Created client.', type: Client })
  create(@Body(ValidatePayloadExistsPipe) input: NewClientInput): Promise<Client> {
    return this.clientDataSource.create(input) as Promise<Client>;
  }

  @Put(':clientId')
  @RamAuthorized(ClientAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: UpdateClientInput })
  @ApiOkResponse({ description: 'Client updated.' })
  async update(@Param('clientId') clientId: string, @Body(ValidatePayloadExistsPipe) input: UpdateClientInput) {
    await this.clientDataSource.update(clientId, input);
  }

  @Get(':clientId/claims')
  @RamAuthorized(ClientAction.Claims)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client claims.', type: ClientClaims })
  claims(@Param('clientId') clientId: string): Promise<ClientClaims | undefined> {
    return this.clientDataSource.getClaims(clientId, CLAIM_FIELDS) as Promise<ClientClaims | undefined>;
  }

  @Post(':clientId/claims')
  @RamAuthorized(ClientAction.CreateClaim)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewClientClaimInput })
  @ApiCreatedResponse({ description: 'Created client claim.', type: ClientClaim })
  createClaim(
    @Param('clientId') clientId: string,
    @Body(ValidatePayloadExistsPipe) input: NewClientClaimInput,
  ): Promise<ClientClaim | undefined> {
    return this.clientDataSource.createClaim(clientId, input);
  }

  @Delete('claims/:id')
  @RamAuthorized(ClientAction.DeleteClaim)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client claim deleted.' })
  async deleteClaim(@Param('id', ParseIntPipe) id: number) {
    await this.clientDataSource.deleteClaim(id);
  }

  @Get(':clientId/cors-origins')
  @RamAuthorized(ClientAction.CorsOrigins)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client CORS origins.', type: ClientCorsOrigins })
  corsOrigins(@Param('clientId') clientId: string): Promise<ClientCorsOrigins | undefined> {
    return this.clientDataSource.getCorsOrigins(clientId, CLIENT_CORS_ORIGIN_FIELDS);
  }

  @Post(':clientId/cors-origins')
  @RamAuthorized(ClientAction.CreateCorsOrigin)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewClientCorsOriginInput })
  @ApiCreatedResponse({ description: 'Created client CORS origin.', type: ClientCorsOrigin })
  createCorsOrigin(
    @Param('clientId') clientId: string,
    @Body(ValidatePayloadExistsPipe) input: NewClientCorsOriginInput,
  ): Promise<ClientCorsOrigin | undefined> {
    return this.clientDataSource.createCorsOrigin(clientId, input);
  }

  @Delete('cors-origins/:id')
  @RamAuthorized(ClientAction.DeleteCorsOrigin)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client CORS origin deleted.' })
  async deleteCorsOrigin(@Param('id', ParseIntPipe) id: number) {
    await this.clientDataSource.deleteCorsOrigin(id);
  }

  @Get(':clientId/grant-types')
  @RamAuthorized(ClientAction.GrantTypes)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client grant types.', type: ClientGrantTypes })
  grantTypes(@Param('clientId') clientId: string): Promise<ClientGrantTypes | undefined> {
    return this.clientDataSource.getGrantTypes(clientId, CLIENT_GRANT_TYPE_FIELDS);
  }

  @Post(':clientId/grant-types')
  @RamAuthorized(ClientAction.CreateGrantType)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewClientGrantTypeInput })
  @ApiCreatedResponse({ description: 'Created client grant type.', type: ClientGrantType })
  createGrantType(
    @Param('clientId') clientId: string,
    @Body(ValidatePayloadExistsPipe) input: NewClientGrantTypeInput,
  ): Promise<ClientGrantType | undefined> {
    return this.clientDataSource.createGrantType(clientId, input);
  }

  @Delete('grant-types/:id')
  @RamAuthorized(ClientAction.DeleteGrantType)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client grant type deleted.' })
  async deleteGrantType(@Param('id', ParseIntPipe) id: number) {
    await this.clientDataSource.deleteGrantType(id);
  }

  @Get(':clientId/scopes')
  @RamAuthorized(ClientAction.Scopes)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client scopes.', type: ClientScopes })
  scopes(@Param('clientId') clientId: string): Promise<ClientScopes | undefined> {
    return this.clientDataSource.getScopes(clientId, CLIENT_SCOPE_FIELDS);
  }

  @Post(':clientId/scopes')
  @RamAuthorized(ClientAction.CreateScope)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewClientScopeInput })
  @ApiCreatedResponse({ description: 'Created client scope.', type: ClientScope })
  createScope(
    @Param('clientId') clientId: string,
    @Body(ValidatePayloadExistsPipe) input: NewClientScopeInput,
  ): Promise<ClientScope | undefined> {
    return this.clientDataSource.createScope(clientId, input);
  }

  @Delete('scopes/:id')
  @RamAuthorized(ClientAction.DeleteScope)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client scope deleted.' })
  async deleteScope(@Param('id', ParseIntPipe) id: number) {
    await this.clientDataSource.deleteScope(id);
  }

  @Get(':clientId/redirect-uris')
  @RamAuthorized(ClientAction.RedirectUris)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client redirect URIs.', type: ClientRedirectUris })
  redirectUris(@Param('clientId') clientId: string): Promise<ClientRedirectUris | undefined> {
    return this.clientDataSource.getRedirectUris(clientId, CLIENT_REDIRECT_URI_FIELDS);
  }

  @Post(':clientId/redirect-uris')
  @RamAuthorized(ClientAction.CreateRedirectUri)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewClientRedirectUriInput })
  @ApiCreatedResponse({ description: 'Created client redirect URI.', type: ClientRedirectUri })
  createRedirectUri(
    @Param('clientId') clientId: string,
    @Body(ValidatePayloadExistsPipe) input: NewClientRedirectUriInput,
  ): Promise<ClientRedirectUri | undefined> {
    return this.clientDataSource.createRedirectUri(clientId, input);
  }

  @Delete('redirect-uris/:id')
  @RamAuthorized(ClientAction.DeleteRedirectUri)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client redirect URI deleted.' })
  async deleteRedirectUri(@Param('id', ParseIntPipe) id: number) {
    await this.clientDataSource.deleteRedirectUri(id);
  }

  @Get(':clientId/post-logout-redirect-uris')
  @RamAuthorized(ClientAction.PostLogoutRedirectUris)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client post logout redirect URIs.', type: ClientPostLogoutRedirectUris })
  postLogoutRedirectUris(@Param('clientId') clientId: string): Promise<ClientPostLogoutRedirectUris | undefined> {
    return this.clientDataSource.getPostLogoutRedirectUris(clientId, CLIENT_POST_LOGOUT_REDIRECT_URI_FIELDS);
  }

  @Post(':clientId/post-logout-redirect-uris')
  @RamAuthorized(ClientAction.CreatePostLogoutRedirectUri)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewClientPostLogoutRedirectUriInput })
  @ApiCreatedResponse({ description: 'Created client post logout redirect URI.', type: ClientPostLogoutRedirectUri })
  createPostLogoutRedirectUri(
    @Param('clientId') clientId: string,
    @Body(ValidatePayloadExistsPipe) input: NewClientPostLogoutRedirectUriInput,
  ): Promise<ClientPostLogoutRedirectUri | undefined> {
    return this.clientDataSource.createPostLogoutRedirectUri(clientId, input);
  }

  @Delete('post-logout-redirect-uris/:id')
  @RamAuthorized(ClientAction.DeletePostLogoutRedirectUri)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client post logout redirect URI deleted.' })
  async deletePostLogoutRedirectUri(@Param('id', ParseIntPipe) id: number) {
    await this.clientDataSource.deletePostLogoutRedirectUri(id);
  }

  @Get(':clientId/secrets')
  @RamAuthorized(ClientAction.Secrets)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client secrets without secret values.', type: ClientSecrets })
  secrets(@Param('clientId') clientId: string): Promise<ClientSecrets | undefined> {
    return this.clientDataSource
      .getSecrets(clientId, SECRET_FIELDS)
      .then((secrets) => secrets as ClientSecrets | undefined);
  }

  @Post(':clientId/secrets')
  @RamAuthorized(ClientAction.CreateSecret)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewClientSecretInput })
  @ApiCreatedResponse({
    description: 'Created client secret. The value is returned only in this response.',
    type: ClientSecret,
  })
  createSecret(
    @Param('clientId') clientId: string,
    @Body(ValidatePayloadExistsPipe) input: NewClientSecretInput,
  ): Promise<ClientSecret | undefined> {
    const randomSecret = random(32).toBase64Url();
    return this.clientDataSource
      .createSecret(clientId, {
        ...input,
        value: sha256(randomSecret, { enabledHmac: true }).toString(),
      })
      .then((secret) => ({ ...secret, value: randomSecret } as ClientSecret));
  }

  @Delete('secrets/:id')
  @RamAuthorized(ClientAction.DeleteSecret)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client secret deleted.' })
  async deleteSecret(@Param('id', ParseIntPipe) id: number) {
    await this.clientDataSource.deleteSecret(id);
  }

  @Get(':clientId/properties')
  @RamAuthorized(ClientAction.Properties)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client properties.', type: ClientProperties })
  properties(@Param('clientId') clientId: string): Promise<ClientProperties | undefined> {
    return this.clientDataSource.getProperties(clientId, PROPERTY_FIELDS);
  }

  @Post(':clientId/properties')
  @RamAuthorized(ClientAction.CreateProperty)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewClientPropertyInput })
  @ApiCreatedResponse({ description: 'Created client property.', type: ClientProperty })
  createProperty(
    @Param('clientId') clientId: string,
    @Body(ValidatePayloadExistsPipe) input: NewClientPropertyInput,
  ): Promise<ClientProperty | undefined> {
    return this.clientDataSource.createProperty(clientId, input);
  }

  @Delete('properties/:id')
  @RamAuthorized(ClientAction.DeleteProperty)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Client property deleted.' })
  async deleteProperty(@Param('id', ParseIntPipe) id: number) {
    await this.clientDataSource.deleteProperty(id);
  }
}
