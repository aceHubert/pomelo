import { Body, Controller, Delete, Get, HttpStatus, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Authorized } from '@ace-nestjs/authorization';
import { RamAuthorized } from '@ace-nestjs/ram-authorization';
import { ApiAuthCreate, ValidatePayloadExistsPipe, random, sha256 } from '@ace-pomelo/shared/server';
import { ApiResourceAction } from '@/common/actions';
import { ApiResourceDataSource } from '@/datasource';
import {
  API_RESOURCE_FIELDS,
  API_SCOPE_FIELDS,
  PROPERTY_FIELDS,
  SECRET_FIELDS,
  TYPE_ONLY_CLAIM_FIELDS,
} from '@/openapi/common/management-fields';
import { normalizePagedQuery } from '@/openapi/common/management-query';
import { PagedApiResourceArgs } from './dto/paged-api-resource.args';
import { PagedApiScopeArgs } from './dto/paged-api-scope.args';
import { NewApiResourceInput } from './dto/new-api-resource.input';
import { UpdateApiResourceInput } from './dto/update-api-resource.input';
import { NewApiClaimInput } from './dto/new-api-claim.input';
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

@ApiTags('management-api-resources')
@Authorized()
@Controller('v0/management')
@ApiUnauthorizedResponse({ description: 'Unauthorized.' })
@ApiForbiddenResponse({ description: 'Forbidden.' })
export class ManagementApiResourceController {
  constructor(private readonly apiResourceDataSource: ApiResourceDataSource) {}

  @Get('api-resources')
  @RamAuthorized(ApiResourceAction.PagedList)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Paged API resources.', type: PagedApiResource })
  list(@Query() query: PagedApiResourceArgs): Promise<PagedApiResource> {
    return this.apiResourceDataSource.getPaged(normalizePagedQuery(query), API_RESOURCE_FIELDS);
  }

  @Get('api-resources/:id')
  @RamAuthorized(ApiResourceAction.Detail)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API resource detail.', type: ApiResource })
  @ApiNoContentResponse({ description: 'API resource not found.' })
  get(@Param('id', ParseIntPipe) id: number): Promise<ApiResource | undefined> {
    return this.apiResourceDataSource.get(id, API_RESOURCE_FIELDS);
  }

  @Post('api-resources')
  @RamAuthorized(ApiResourceAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewApiResourceInput })
  @ApiCreatedResponse({ description: 'Created API resource.', type: ApiResource })
  create(@Body(ValidatePayloadExistsPipe) input: NewApiResourceInput): Promise<ApiResource> {
    return this.apiResourceDataSource.create({
      ...input,
      nonEditable: input.nonEditable ?? false,
      enabled: input.enabled ?? true,
    });
  }

  @Put('api-resources/:id')
  @RamAuthorized(ApiResourceAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: UpdateApiResourceInput })
  @ApiOkResponse({ description: 'API resource updated.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body(ValidatePayloadExistsPipe) input: UpdateApiResourceInput) {
    await this.apiResourceDataSource.update(id, input);
  }

  @Delete('api-resources/:id')
  @RamAuthorized(ApiResourceAction.Delete)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API resource deleted.' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.apiResourceDataSource.delete(id);
  }

  @Get('api-resources/:apiResourceId/claims')
  @RamAuthorized(ApiResourceAction.Claims)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API resource claims.', type: ApiClaims })
  claims(@Param('apiResourceId', ParseIntPipe) apiResourceId: number): Promise<ApiClaims | undefined> {
    return this.apiResourceDataSource.getClaims(apiResourceId, TYPE_ONLY_CLAIM_FIELDS);
  }

  @Post('api-resources/:apiResourceId/claims')
  @RamAuthorized(ApiResourceAction.CreateClaim)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewApiClaimInput })
  @ApiCreatedResponse({ description: 'Created API resource claim.', type: ApiClaim })
  createClaim(
    @Param('apiResourceId', ParseIntPipe) apiResourceId: number,
    @Body(ValidatePayloadExistsPipe) input: NewApiClaimInput,
  ): Promise<ApiClaim | undefined> {
    return this.apiResourceDataSource.createClaim(apiResourceId, input);
  }

  @Delete('api-resources/claims/:id')
  @RamAuthorized(ApiResourceAction.DeleteClaim)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API resource claim deleted.' })
  async deleteClaim(@Param('id', ParseIntPipe) id: number) {
    await this.apiResourceDataSource.deleteClaim(id);
  }

  @Get('api-resources/:apiResourceId/scopes')
  @RamAuthorized(ApiResourceAction.ScopePagedList)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Paged API scopes.', type: PagedApiScope })
  scopes(
    @Param('apiResourceId', ParseIntPipe) apiResourceId: number,
    @Query() query: Omit<PagedApiScopeArgs, 'apiResourceId'>,
  ): Promise<PagedApiScope> {
    return this.apiResourceDataSource.getPagedScope(normalizePagedQuery({ ...query, apiResourceId }), API_SCOPE_FIELDS);
  }

  @Get('api-scopes/:id')
  @RamAuthorized(ApiResourceAction.ScopeDetail)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API scope detail.', type: ApiScope })
  @ApiNoContentResponse({ description: 'API scope not found.' })
  scope(@Param('id', ParseIntPipe) id: number): Promise<ApiScope | undefined> {
    return this.apiResourceDataSource.getScope(id, API_SCOPE_FIELDS);
  }

  @Post('api-resources/:apiResourceId/scopes')
  @RamAuthorized(ApiResourceAction.CreateScope)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewApiScopeInput })
  @ApiCreatedResponse({ description: 'Created API scope.', type: ApiScope })
  createScope(
    @Param('apiResourceId', ParseIntPipe) apiResourceId: number,
    @Body(ValidatePayloadExistsPipe) input: NewApiScopeInput,
  ): Promise<ApiScope | undefined> {
    return this.apiResourceDataSource.createScope(apiResourceId, {
      ...input,
      emphasize: input.emphasize ?? true,
      required: input.required ?? false,
      showInDiscoveryDocument: input.showInDiscoveryDocument ?? true,
    });
  }

  @Put('api-scopes/:id')
  @RamAuthorized(ApiResourceAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: UpdateApiScopeInput })
  @ApiOkResponse({ description: 'API scope updated.' })
  async updateScope(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) input: UpdateApiScopeInput,
  ) {
    await this.apiResourceDataSource.updateScope(id, input);
  }

  @Delete('api-scopes/:id')
  @RamAuthorized(ApiResourceAction.DeleteScope)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API scope deleted.' })
  async deleteScope(@Param('id', ParseIntPipe) id: number) {
    await this.apiResourceDataSource.deleteScope(id);
  }

  @Get('api-scopes/:apiScopeId/claims')
  @RamAuthorized(ApiResourceAction.ScopeClaims)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API scope claims.', type: ApiScopeClaims })
  scopeClaims(@Param('apiScopeId', ParseIntPipe) apiScopeId: number): Promise<ApiScopeClaims | undefined> {
    return this.apiResourceDataSource.getScopeClaims(apiScopeId, TYPE_ONLY_CLAIM_FIELDS);
  }

  @Post('api-scopes/:apiScopeId/claims')
  @RamAuthorized(ApiResourceAction.CreateScopeClaim)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewApiScopeClaimInput })
  @ApiCreatedResponse({ description: 'Created API scope claim.', type: ApiScopeClaim })
  createScopeClaim(
    @Param('apiScopeId', ParseIntPipe) apiScopeId: number,
    @Body(ValidatePayloadExistsPipe) input: NewApiScopeClaimInput,
  ): Promise<ApiScopeClaim | undefined> {
    return this.apiResourceDataSource.createScopeClaim(apiScopeId, input);
  }

  @Delete('api-scopes/claims/:id')
  @RamAuthorized(ApiResourceAction.DeleteScopeClaim)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API scope claim deleted.' })
  async deleteScopeClaim(@Param('id', ParseIntPipe) id: number) {
    await this.apiResourceDataSource.deleteScopeClaim(id);
  }

  @Get('api-resources/:apiResourceId/secrets')
  @RamAuthorized(ApiResourceAction.Secrets)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API resource secrets without secret values.', type: ApiSecrets })
  secrets(@Param('apiResourceId', ParseIntPipe) apiResourceId: number): Promise<ApiSecrets | undefined> {
    return this.apiResourceDataSource
      .getSecrets(apiResourceId, SECRET_FIELDS)
      .then((secrets) => secrets as ApiSecrets | undefined);
  }

  @Post('api-resources/:apiResourceId/secrets')
  @RamAuthorized(ApiResourceAction.CreateSecret)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewApiSecretInput })
  @ApiCreatedResponse({
    description: 'Created API resource secret. The value is returned only in this response.',
    type: ApiSecret,
  })
  createSecret(
    @Param('apiResourceId', ParseIntPipe) apiResourceId: number,
    @Body(ValidatePayloadExistsPipe) input: NewApiSecretInput,
  ): Promise<ApiSecret | undefined> {
    const randomSecret = random(32).toBase64();
    return this.apiResourceDataSource
      .createSecret(apiResourceId, {
        ...input,
        value: sha256(randomSecret, { enabledHmac: true }).toString(),
      })
      .then((secret) => (secret ? ({ ...secret, value: randomSecret } as ApiSecret) : undefined));
  }

  @Delete('api-resources/secrets/:id')
  @RamAuthorized(ApiResourceAction.DeleteSecret)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API resource secret deleted.' })
  async deleteSecret(@Param('id', ParseIntPipe) id: number) {
    await this.apiResourceDataSource.deleteSecret(id);
  }

  @Get('api-resources/:apiResourceId/properties')
  @RamAuthorized(ApiResourceAction.Properties)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API resource properties.', type: ApiProperties })
  properties(@Param('apiResourceId', ParseIntPipe) apiResourceId: number): Promise<ApiProperties | undefined> {
    return this.apiResourceDataSource.getProperties(apiResourceId, PROPERTY_FIELDS);
  }

  @Post('api-resources/:apiResourceId/properties')
  @RamAuthorized(ApiResourceAction.CreateProperty)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewApiPropertyInput })
  @ApiCreatedResponse({ description: 'Created API resource property.', type: ApiProperty })
  createProperty(
    @Param('apiResourceId', ParseIntPipe) apiResourceId: number,
    @Body(ValidatePayloadExistsPipe) input: NewApiPropertyInput,
  ): Promise<ApiProperty | undefined> {
    return this.apiResourceDataSource.createProperty(apiResourceId, input);
  }

  @Delete('api-resources/properties/:id')
  @RamAuthorized(ApiResourceAction.DeleteProperty)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'API resource property deleted.' })
  async deleteProperty(@Param('id', ParseIntPipe) id: number) {
    await this.apiResourceDataSource.deleteProperty(id);
  }
}
