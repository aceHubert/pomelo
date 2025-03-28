import { Controller } from '@nestjs/common';
import { Empty } from '@ace-pomelo/shared/server/proto-ts/google/protobuf/empty';
import {
  TermTaxonomyServiceControllerMethods,
  TermTaxonomyServiceController,
  GetTermTaxonomyRequest,
  GetTermTaxonomyResponse,
  GetTermTaxonomiesRequest,
  GetTermTaxonomiesResponse,
  GetTermTaxonomiesByParentIdsRequest,
  GetTermTaxonomiesByParentIdsResponse,
  GetTermTaxonomiesByObjectIdRequest,
  GetTermTaxonomiesByObjectIdResponse,
  GetTermTaxonomiesByObjectIdsRequest,
  GetTermTaxonomiesByObjectIdsResponse,
  CreateTermTaxonomyRequest,
  CreateTermTaxonomyResponse,
  CreateRelationshipRequest,
  CreateRelationshipResponse,
  UpdateTermTaxonomyRequest,
  DeleteRelationshipRequest,
  DeleteTermTaxonomyRequest,
  BulkDeleteTermTaxonomyRequest,
} from '@ace-pomelo/shared/server/proto-ts/term-taxonomy';
import { TermTaxonomyDataSource } from '../datasource';
import { createMetaController } from './meta.controller';

@Controller()
@TermTaxonomyServiceControllerMethods()
export class TermTaxonomyController
  extends createMetaController('termTaxonomy')
  implements TermTaxonomyServiceController
{
  constructor(private readonly termTaxonomyDataSource: TermTaxonomyDataSource) {
    super(termTaxonomyDataSource);
  }

  get({ id, fields }: GetTermTaxonomyRequest): Promise<GetTermTaxonomyResponse> {
    return this.termTaxonomyDataSource.get(id, fields).then((result) => {
      return { termTaxonomy: result };
    });
  }

  async getList({ fields, ...query }: GetTermTaxonomiesRequest): Promise<GetTermTaxonomiesResponse> {
    return this.termTaxonomyDataSource.getList(query, fields).then((result) => {
      return { termTaxonomies: result };
    });
  }

  getListByParentIds({
    fields,
    parentIds,
  }: GetTermTaxonomiesByParentIdsRequest): Promise<GetTermTaxonomiesByParentIdsResponse> {
    return this.termTaxonomyDataSource.getList(parentIds, fields).then((result) => {
      return {
        termTaxonomies: Object.entries(result).map(([parentId, value]) => ({
          parentId: +parentId,
          value,
        })),
      };
    });
  }

  getListByObjectIds({
    fields,
    objectIds,
    taxonomy,
  }: GetTermTaxonomiesByObjectIdsRequest): Promise<GetTermTaxonomiesByObjectIdsResponse> {
    return this.termTaxonomyDataSource.getListByObjectId(objectIds, taxonomy, fields).then((result) => {
      return {
        termTaxonomies: Object.entries(result).map(([objectId, value]) => ({
          objectId: +objectId,
          value,
        })),
      };
    });
  }

  getListByObjectId({
    fields,
    ...query
  }: GetTermTaxonomiesByObjectIdRequest): Promise<GetTermTaxonomiesByObjectIdResponse> {
    return this.termTaxonomyDataSource.getListByObjectId(query, fields).then((result) => {
      return { termTaxonomies: result };
    });
  }

  create(request: CreateTermTaxonomyRequest): Promise<CreateTermTaxonomyResponse> {
    return this.termTaxonomyDataSource.create(request).then((result) => {
      return { termTaxonomy: result };
    });
  }

  createRelationship(request: CreateRelationshipRequest): Promise<CreateRelationshipResponse> {
    return this.termTaxonomyDataSource.createRelationship(request).then((result) => {
      return { relationship: result };
    });
  }

  update({ id, ...model }: UpdateTermTaxonomyRequest): Promise<Empty> {
    return this.termTaxonomyDataSource.update(id, model).then(() => {
      return {};
    });
  }

  deleteRelationship({ objectId, termTaxonomyId }: DeleteRelationshipRequest): Promise<Empty> {
    return this.termTaxonomyDataSource.deleteRelationship(objectId, termTaxonomyId).then(() => {
      return {};
    });
  }

  delete({ id }: DeleteTermTaxonomyRequest): Promise<Empty> {
    return this.termTaxonomyDataSource.delete(id).then(() => {
      return {};
    });
  }

  bulkDelete({ ids }: BulkDeleteTermTaxonomyRequest): Promise<Empty> {
    return this.termTaxonomyDataSource.bulkDelete(ids).then(() => {
      return {};
    });
  }
}
