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
import { ApiAuthCreate, ValidatePayloadExistsPipe } from '@ace-pomelo/shared/server';
import { IdentityResourceAction } from '@/common/actions';
import { IdentityResourceDataSource } from '@/datasource';
import { IDENTITY_RESOURCE_FIELDS, PROPERTY_FIELDS, TYPE_ONLY_CLAIM_FIELDS } from '@/apis/common/management-fields';
import { normalizePagedQuery } from '@/apis/common/management-query';
import { PagedIdentityResourceArgs } from './dto/paged-identity-resource.args';
import { NewIdentityResourceInput } from './dto/new-identity-resource.input';
import { UpdateIdentityResourceInput } from './dto/update-identity-resource.input';
import { NewIdentityClaimInput } from './dto/new-identity-claim.input';
import { NewIdentityPropertyInput } from './dto/new-identity-property.input';
import { IdentityResource, PagedIdentityResource } from './models/identity-resource.model';
import { IdentityClaim, IdentityClaims } from './models/identity-claim.model';
import { IdentityProperty, IdentityProperties } from './models/identity-property.model';

@ApiTags('management-identity-resources')
@Authorized()
@Controller('v0/management/identity-resources')
@ApiUnauthorizedResponse({ description: 'Unauthorized.' })
@ApiForbiddenResponse({ description: 'Forbidden.' })
export class IdentityResourceController {
  constructor(private readonly identityResourceDataSource: IdentityResourceDataSource) {}

  @Get()
  @RamAuthorized(IdentityResourceAction.PagedList)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Paged identity resources.', type: PagedIdentityResource })
  list(@Query() query: PagedIdentityResourceArgs): Promise<PagedIdentityResource> {
    return this.identityResourceDataSource.getPaged(normalizePagedQuery(query), IDENTITY_RESOURCE_FIELDS);
  }

  @Get(':id')
  @RamAuthorized(IdentityResourceAction.Detail)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Identity resource detail.', type: IdentityResource })
  @ApiNoContentResponse({ description: 'Identity resource not found.' })
  get(@Param('id', ParseIntPipe) id: number): Promise<IdentityResource | undefined> {
    return this.identityResourceDataSource.get(id, IDENTITY_RESOURCE_FIELDS);
  }

  @Post()
  @RamAuthorized(IdentityResourceAction.Create)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewIdentityResourceInput })
  @ApiCreatedResponse({ description: 'Created identity resource.', type: IdentityResource })
  create(@Body(ValidatePayloadExistsPipe) input: NewIdentityResourceInput): Promise<IdentityResource> {
    return this.identityResourceDataSource.create({
      ...input,
      emphasize: input.emphasize ?? true,
      required: input.required ?? false,
      showInDiscoveryDocument: input.showInDiscoveryDocument ?? true,
      nonEditable: input.nonEditable ?? false,
      enabled: input.enabled ?? true,
    });
  }

  @Put(':id')
  @RamAuthorized(IdentityResourceAction.Update)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: UpdateIdentityResourceInput })
  @ApiOkResponse({ description: 'Identity resource updated.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidatePayloadExistsPipe) input: UpdateIdentityResourceInput,
  ) {
    await this.identityResourceDataSource.update(id, input);
  }

  @Delete(':id')
  @RamAuthorized(IdentityResourceAction.Delete)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Identity resource deleted.' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.identityResourceDataSource.delete(id);
  }

  @Get(':identityResourceId/claims')
  @RamAuthorized(IdentityResourceAction.Claims)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Identity resource claims.', type: IdentityClaims })
  claims(@Param('identityResourceId', ParseIntPipe) identityResourceId: number): Promise<IdentityClaims | undefined> {
    return this.identityResourceDataSource.getClaims(identityResourceId, TYPE_ONLY_CLAIM_FIELDS);
  }

  @Post(':identityResourceId/claims')
  @RamAuthorized(IdentityResourceAction.CreateClaim)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewIdentityClaimInput })
  @ApiCreatedResponse({ description: 'Created identity resource claim.', type: IdentityClaim })
  createClaim(
    @Param('identityResourceId', ParseIntPipe) identityResourceId: number,
    @Body(ValidatePayloadExistsPipe) input: NewIdentityClaimInput,
  ): Promise<IdentityClaim | undefined> {
    return this.identityResourceDataSource.createClaim(identityResourceId, input);
  }

  @Delete('claims/:id')
  @RamAuthorized(IdentityResourceAction.DeleteClaim)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Identity resource claim deleted.' })
  async deleteClaim(@Param('id', ParseIntPipe) id: number) {
    await this.identityResourceDataSource.deleteClaim(id);
  }

  @Get(':identityResourceId/properties')
  @RamAuthorized(IdentityResourceAction.Properties)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Identity resource properties.', type: IdentityProperties })
  properties(
    @Param('identityResourceId', ParseIntPipe) identityResourceId: number,
  ): Promise<IdentityProperties | undefined> {
    return this.identityResourceDataSource.getProperties(identityResourceId, PROPERTY_FIELDS);
  }

  @Post(':identityResourceId/properties')
  @RamAuthorized(IdentityResourceAction.CreateProperty)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiBody({ type: NewIdentityPropertyInput })
  @ApiCreatedResponse({ description: 'Created identity resource property.', type: IdentityProperty })
  createProperty(
    @Param('identityResourceId', ParseIntPipe) identityResourceId: number,
    @Body(ValidatePayloadExistsPipe) input: NewIdentityPropertyInput,
  ): Promise<IdentityProperty | undefined> {
    return this.identityResourceDataSource.createProperty(identityResourceId, input);
  }

  @Delete('properties/:id')
  @RamAuthorized(IdentityResourceAction.DeleteProperty)
  @ApiAuthCreate('bearer', [HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])
  @ApiOkResponse({ description: 'Identity resource property deleted.' })
  async deleteProperty(@Param('id', ParseIntPipe) id: number) {
    await this.identityResourceDataSource.deleteProperty(id);
  }
}
